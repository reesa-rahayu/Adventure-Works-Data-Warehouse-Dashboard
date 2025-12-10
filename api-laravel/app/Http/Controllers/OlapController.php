<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Services\XmlaService;
use Exception;
use SimpleXMLElement;

class OlapController extends Controller
{
    protected $xmlaService;

    public function __construct(XmlaService $xmlaService)
    {
        $this->xmlaService = $xmlaService;
    }

    public function getSalesData(Request $request)
    {
        $mdx = "
            SELECT 
                {[Measures].[Sales Amount], 
                 [Measures].[Order Quantity], 
                 [Measures].[Total Due]} 
            ON COLUMNS,
                NON EMPTY {([Date].[All Date],
                [Product].[All Product])} 
            ON ROWS
            FROM [SalesCube]
        ";

        try {
            // 1. Eksekusi MDX melalui XMLA Service
            $rawXmlResponse = $this->xmlaService->executeMdx($mdx);

            // 2. Parsing XMLA Response menjadi JSON
            $cleanData = $this->parseXmlaResponse($rawXmlResponse);

            return response()->json($cleanData, 200);
        } catch (Exception $e) {
            // Tangani error koneksi atau error MDX
            return response()->json(['error' => 'OLAP Query Failed: ' . $e->getMessage()], 500);
        }
    }

    private function parseXmlaResponse(string $xmlResponse): array
    {
        // Coba temukan dan parse XMLA Resultset
        try {
            // Hapus SOAP envelope dan namespace untuk parsing yang lebih mudah
            $xmlResponse = preg_replace("/(<\/?)(\w+):([^>]*>)/", "$1$2$3", $xmlResponse);
            $xml = simplexml_load_string($xmlResponse);

            // Cari elemen CellData yang berisi hasil
            $cells = [];
            $cellData = $xml->xpath('//CellData/Cell');

            if (empty($cellData)) {
                // Jika CellData kosong, coba temukan error
                $fault = $xml->xpath('//Fault/detail');
                if (!empty($fault)) {
                    $errorMsg = (string)$fault[0]->error->Description;
                    throw new Exception("MDX Execution Error: " . $errorMsg);
                }
                return []; // Kembalikan array kosong jika tidak ada data
            }

            // Contoh parsing SANGAT sederhana (hanya mengambil nilai sel)
            // Struktur data ini belum tentu ideal untuk React, tapi menunjukkan ekstraksi data.
            foreach ($cellData as $cell) {
                $value = (string)$cell->Value;
                $cells[] = [
                    'value' => $value,
                    // 'format' => (string)$cell->FmtValue // Ambil nilai yang sudah diformat
                ];
            }

            // Dalam aplikasi nyata, Anda perlu me-mapping $cells ini ke Row & Column
            // berdasarkan struktur AxisData.

            return $cells; // Kembalikan data sel mentah

        } catch (Exception $e) {
            // Jika XML invalid atau parsing gagal
            throw new Exception("Error during XMLA parsing: " . $e->getMessage());
        }
    }
}
