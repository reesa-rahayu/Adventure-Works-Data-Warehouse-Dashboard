<?php

namespace App\Http\Controllers;

use Exception;
use Illuminate\Http\Request;
use App\Services\XmlaService;
use Illuminate\Support\Facades\DB;

class SalesController extends Controller
{
    public function getSalesSummary(Request $request)
    {
        try {
            $year = $request->query('year', 2014);

            $salesKpis = DB::table('factsales')
                ->join('dimdate', 'factsales.FK_DateID', '=', 'dimdate.DateID')
                ->where('dimdate.YearNumber', $year)
                ->select(
                    DB::raw('SUM(TotalDue) as totalRevenue'),
                    DB::raw('SUM(OrderQty) as totalQty'),
                    DB::raw('AVG(TotalDue) as avgOrderValue'),
                    DB::raw('SUM(TaxAmt) as totalTax'),
                    DB::raw('SUM(Freight) as totalFreight')
                )->first();

            // 2. Monthly Trend (Line Chart)
            $monthlyTrends = DB::table('factsales as f')
                ->join('dimproduct as p', 'f.FK_ProductID', '=', 'p.ProductID')
                ->join('dimdate as d', 'f.FK_DateID', '=', 'd.DateID')
                ->where('d.YearNumber', $request->year)
                ->select(
                    'p.CategoryName as category',
                    'd.MonthName as time',
                    DB::raw("SUM(f.LineTotal) as sales"),
                    DB::raw("SUM(f.TotalDue) as revenue"),
                    DB::raw("SUM(f.OrderQty) as totalQty")
                )
                ->groupBy('p.CategoryName', 'time')
                ->get();

            $lineData = DB::table('factsales as f')
                ->join('dimproduct as p', 'f.FK_ProductID', '=', 'p.ProductID')
                ->join('dimdate as d', 'f.FK_DateID', '=', 'd.DateID')
                ->where('d.YearNumber', $request->year)
                ->select(
                    'p.CategoryName as category',
                    'd.MonthName as time',
                    DB::raw("SUM(f.LineTotal) as sales_amount"),
                    DB::raw("SUM(f.TotalDue) as total_due"),
                    DB::raw("SUM(f.OrderQty) as order_qty")
                )
                ->groupBy('p.CategoryName', 'time')
                ->get();

            // 3. Category Distribution (Pie/Doughnut)
            $salesByCategory = DB::table('factsales')
                ->join('dimproduct', 'factsales.FK_ProductID', '=', 'dimproduct.ProductID')
                ->join('dimdate', 'factsales.FK_DateID', '=', 'dimdate.DateID')
                ->where('dimdate.YearNumber', $year)
                ->select('dimproduct.CategoryName', DB::raw('SUM(LineTotal) as total'))
                ->groupBy('dimproduct.CategoryName')
                ->get();

            // 4. Territory Performance (Bar Chart)
            $salesByTerritory = DB::table('factsales')
                ->join('dimaddress', 'factsales.FK_ShipToAddressID', '=', 'dimaddress.AddressID')
                ->join('dimterritory', 'dimaddress.FK_TerritoryID', '=', 'dimterritory.TerritoryID')
                ->join('dimdate', 'factsales.FK_DateID', '=', 'dimdate.DateID')
                ->where('dimdate.YearNumber', $year)
                ->select('dimterritory.TerritoryName', DB::raw('SUM(LineTotal) as value'))
                ->groupBy('dimterritory.TerritoryName')
                ->orderByDesc('value')
                ->get();

            // 5. Leaderboards
            $topCustomers = DB::table('factsales')
                ->join('dimcustomer', 'factsales.FK_CustomerID', '=', 'dimcustomer.CustomerID')
                ->join('dimdate', 'factsales.FK_DateID', '=', 'dimdate.DateID')
                ->where('dimdate.YearNumber', $year)
                ->select('dimcustomer.FullName as name', DB::raw('SUM(LineTotal) as value'))
                ->groupBy('name')
                ->orderByDesc('value')
                ->limit(5)
                ->get();

            $topSalespeople = DB::table('factsales')
                ->join('dimsalesperson', 'factsales.FK_SalesPersonID', '=', 'dimsalesperson.SalesPersonID')
                ->join('dimdate', 'factsales.FK_DateID', '=', 'dimdate.DateID')
                ->where('dimdate.YearNumber', $year)
                ->select('dimsalesperson.EmployeeName as name', DB::raw('SUM(LineTotal) as value'))
                ->groupBy('name')
                ->orderByDesc('value')
                ->limit(5)
                ->get();

            // 6. Top Products Detail
            $topProducts = DB::table('factsales')
                ->join('dimproduct', 'factsales.FK_ProductID', '=', 'dimproduct.ProductID')
                ->join('dimdate', 'factsales.FK_DateID', '=', 'dimdate.DateID')
                ->where('dimdate.YearNumber', $year)
                ->select(
                    'dimproduct.ProductName as product',
                    'dimproduct.CategoryName as category',
                    DB::raw('SUM(factsales.OrderQty) as units_sold'),
                    DB::raw('SUM(factsales.LineTotal) as total_amount'),
                    DB::raw('ROUND((SUM(factsales.LineTotal) / SUM(factsales.TotalDue)) * 100, 2) as profit_margin')
                )
                ->groupBy('product', 'category')
                ->orderByDesc('total_amount')
                ->limit(10)
                ->get();

            return response()->json([
                'kpis' => $salesKpis,
                'monthlyTrends' => $monthlyTrends,
                'categories' => $salesByCategory,
                'lineData' => $lineData,
                'territories' => $salesByTerritory,
                'leaderboards' => [
                    'customers' => $topCustomers,
                    'salespeople' => $topSalespeople
                ],
                'products' => $topProducts
            ]);

        } catch (\Exception $e) {
            return response()->json(['error' => $e->getMessage()], 500);
        }
    }

    protected $xmlaService;
    public function __construct(XmlaService $xmlaService)
    {
        $this->xmlaService = $xmlaService;
    }
    public function getSalesOlap(Request $request)
    {
        $mdx = "
            SELECT 
                {[Measures].[Sales Amount], 
                [Measures].[Order Quantity], 
                [Measures].[Total Due]} 
            ON COLUMNS,
                {([Date].[All Date],
                [Product].[All Product])} 
            ON ROWS
            FROM [SalesCube]
        ";

        // Apply optional filters (simple implementation)
        if (!empty($filters)) {
            $mdxFilterClauses = [];

            foreach ($filters as $dimensionLevel => $members) {
                // FIX 1: Skip filtering on the Time dimension if we are displaying a time series.
                if (strpos($dimensionLevel, '[Date]') !== false) {
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