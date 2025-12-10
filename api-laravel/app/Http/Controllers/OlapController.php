<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Services\XmlaService;
use Exception;

class OlapController extends Controller
{
    protected $xmlaService;

    public function __construct(XmlaService $xmlaService)
    {
        $this->xmlaService = $xmlaService;
    }

    public function getSalesData(Request $request)
    {
        $measures = $request->measures ?? ['[Measures].[Sales Amount]'];
        $timeLevel = $request->time_level ?? '[Date].[Year]'; 
        $filters = $request->filters ?? []; 

        // Build MDX dynamically
        $mdxMeasures = implode(', ', $measures);
        $mdx = "
            SELECT
                {{$mdxMeasures}} ON COLUMNS,
                NON EMPTY {$timeLevel}.Members ON ROWS
            FROM [SalesCube]
        ";

        // Apply optional filters (simple implementation)
        if (!empty($filters)) {
            $mdxFilters = [];
            foreach ($filters as $dimension => $members) {
                $joinedMembers = implode(',', $members);
                $mdxFilters[] = "{$dimension}.&[{$joinedMembers}]";
            }
            if (!empty($mdxFilters)) {
                $mdx .= " WHERE (".implode(',', $mdxFilters).")";
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
            $cells = $xpath->query('*[local-name() != "schemaLocation"]', $row);
            foreach ($cells as $cell) {
                $measure = preg_replace('/^\[Measures\]\./', '', str_replace(['_x005b_', '_x005d_', '_x0020_'], ['[', ']', ' '], $cell->localName));
                $result[] = [
                    'measure' => $measure,
                    'value' => is_numeric($cell->nodeValue) ? (float)$cell->nodeValue : $cell->nodeValue,
                ];
            }
        }

        return $result;
    }
}
