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

    // --- Method to get Sales Data ---
    public function getSalesData(Request $request)
    {
        // Using a simple MDX to get the total Sales Amount (as per previous examples)
        $mdx = "
            SELECT 
                {[Measures].[Sales Amount]} ON COLUMNS,
                {[Date].[All Date]} ON ROWS
            FROM [SalesCube]
        ";

        try {
            $rawXmlResponse = $this->xmlaService->executeMdx($mdx);
            $cleanData = $this->parseXmlaResponse($rawXmlResponse);

            // Return the parsed data as JSON
            return response()->json($cleanData);

        } catch (Exception $e) {
            // Catch parsing errors, MDX errors (SOAP Faults), and Guzzle errors
            return response()->json(['error' => 'OLAP Query Failed: ' . $e->getMessage()], 500);
        }
    }
    
    // --- The Robust XMLA Parsing Method ---
    /**
     * Parses the complex XMLA SOAP response using DOMXPath.
     * @param string $xmlResponse Raw XML string from Mondrian.
     * @return array Clean array of cell values.
     * @throws Exception if a SOAP Fault is detected.
     */
    private function parseXmlaResponse(string $xmlResponse): array
    {
        $dom = new \DOMDocument();
        @$dom->loadXML($xmlResponse);

        $xpath = new \DOMXPath($dom);

        $xpath->registerNamespace('s', 'http://schemas.xmlsoap.org/soap/envelope/');
        $xpath->registerNamespace('cxmla', 'urn:schemas-microsoft-com:xml-analysis');
        $xpath->registerNamespace('mddataset', 'urn:schemas-microsoft-com:xml-analysis:mddataset');
        $xpath->registerNamespace('XA', 'http://mondrian.sourceforge.net');

        // Check for SOAP Fault
        $fault = $xpath->query('//s:Fault');
        if ($fault->length > 0) {
            $descriptionNode = $xpath->query('//XA:error/XA:desc');
            $errorMsg = $descriptionNode->length > 0
                ? $descriptionNode->item(0)->nodeValue
                : 'Unknown MDX Error (SOAP Fault detected)';
            throw new \Exception("MDX Execution Error: " . $errorMsg);
        }

        $rowNodes = $xpath->query('//mddataset:row');

        $cells = [];

        foreach ($rowNodes as $row) {
            $dataNode = $xpath->query('*[local-name() != "schemaLocation"]', $row)->item(0);

            if ($dataNode) {
                // Clean up the measure_key
                $measure = $dataNode->localName;
                $measure = str_replace(['_x005b_', '_x005d_', '_x0020_'], ['[', ']', ' '], $measure);
                // Remove surrounding [Measures]. if exists
                $measure = preg_replace('/^\[Measures\]\./', '', $measure);

                $cells[] = [
                    'measure' => $measure,
                    'value' => is_numeric($dataNode->nodeValue) ? (float)$dataNode->nodeValue : $dataNode->nodeValue
                ];
            }
        }

        return $cells;
    }



    // --- Method to run arbitrary MDX (kept as is) ---
    public function runMdx(Request $request)
    {
        // Assuming $request->mdx contains the MDX string
        $mdx = $request->mdx;

        try {
            $raw = $this->xmlaService->executeMdx($mdx);
            $parsed = $this->parseXmlaResponse($raw);
            return response()->json($parsed);
        } catch (Exception $e) {
            return response()->json(['error' => 'Dynamic MDX Query Failed: ' . $e->getMessage()], 500);
        }
    }
}
