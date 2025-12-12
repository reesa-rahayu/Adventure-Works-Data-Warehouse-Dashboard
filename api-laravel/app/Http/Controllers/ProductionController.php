<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Services\XmlaService;
use Exception;

class ProductionController extends Controller
{
    protected $xmlaService;

    public function __construct(XmlaService $xmlaService)
    {
        $this->xmlaService = $xmlaService;
    }

    public function getProductionData(Request $request)
    {
        $measures = $request->measures ?? ['[Measures].[Order Quantity]'];
        $timeLevel = $request->time_level ?? '[Date].[Year]';
        $filters = $request->filters ?? [];

        // Build MDX dynamically
        $mdxMeasures = implode(', ', $measures);
        $mdx = "
        SELECT
            {{$mdxMeasures}} ON COLUMNS,
            NON EMPTY {$timeLevel}.Members ON ROWS
        FROM [ProductionCube]
    ";

        // Apply optional filters (simple implementation)
        if (!empty($filters)) {
            $mdxFilterClauses = [];

            foreach ($filters as $dimensionLevel => $members) {
                // FIX 1: Skip filtering on the Time dimension if we are displaying a time series.
                if (strpos($timeLevel, '[Date]') !== false && strpos($dimensionLevel, '[Date]') !== false) {
                    continue;
                }
                // FIX 2: Correctly format hierarchical members: [Dimension].[Level].&[Value]
                $formattedMembers = array_map(function ($memberValue) use ($dimensionLevel) {
                    return "{$dimensionLevel}.&[{$memberValue}]";
                }, $members);
                // Wrap members in {} for a set if there are multiple, otherwise just use the member reference.
                if (count($formattedMembers) > 1) {
                    $mdxFilterClauses[] = '{' . implode(',', $formattedMembers) . '}';
                } else {
                    $mdxFilterClauses[] = $formattedMembers[0];
                }
            }

            // The WHERE clause combines all filter tuples/sets into a single tuple
            if (!empty($mdxFilterClauses)) {
                $mdx .= " WHERE (" . implode(',', $mdxFilterClauses) . ")";
            }
        }

        try {
            $rawXml = $this->xmlaService->executeMdx($mdx);
            $data = $this->parseXmlaResponse($rawXml);
            return response()->json($data);
        } catch (Exception $e) {
            return response()->json(['error' => 'OLAP Query Failed: ' . $e->getMessage()], 500);
        }
    }

    private function parseXmlaResponse(string $xmlResponse): array
    {
        $dom = new \DOMDocument();
        @$dom->loadXML($xmlResponse);

        $xpath = new \DOMXPath($dom);
        $xpath->registerNamespace('s', 'http://schemas.xmlsoap.org/soap/envelope/');
        $xpath->registerNamespace('mddataset', 'urn:schemas-microsoft-com:xml-analysis:mddataset');
        $xpath->registerNamespace('XA', 'http://mondrian.sourceforge.net');

        // SOAP Fault check
        $fault = $xpath->query('//s:Fault');
        if ($fault->length > 0) {
            $desc = $xpath->query('//XA:error/XA:desc');
            $msg = $desc->length > 0 ? $desc->item(0)->nodeValue : 'Unknown MDX Error';
            throw new \Exception($msg);
        }

        $rows = $xpath->query('//mddataset:row');
        $result = [];

        foreach ($rows as $row) {
            $memberCaption = null; // Stores the Time Period (e.g., 2024, Q1)
            $measureValue = null;  // Stores the Sales Amount

            // Get all cell elements in the row
            $cells = $xpath->query('*[local-name() != "schemaLocation"]', $row);

            // --- FIXED LOGIC TO GROUP CAPTION AND VALUE PER ROW ---
            foreach ($cells as $cell) {
                $cellName = $cell->localName;

                // 1. Identify the Member Caption (The label for the row, e.g., the Year/Quarter)
                if (stripos($cellName, 'MEMBER_CAPTION') !== false) {
                    $memberCaption = $cell->nodeValue;
                }
                // 2. Identify the Measure Value (The data point)
                else {
                    // Assuming any other cell is the measure value
                    $measureValue = is_numeric($cell->nodeValue) ? (float)$cell->nodeValue : $cell->nodeValue;
                }
            }

            // After processing all cells in the row, add the combined object to the result
            // This ensures we get one {measure: period, value: sales} object per MDX row
            if ($memberCaption !== null && $measureValue !== null) {
                $result[] = [
                    'measure' => $memberCaption, // The time period is now the 'measure' label
                    'value' => $measureValue,
                ];
            }
        }

        return $result;
    }
}
