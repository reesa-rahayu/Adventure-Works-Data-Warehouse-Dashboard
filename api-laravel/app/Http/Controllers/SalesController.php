<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class SalesController extends Controller
{

    public function getSales(Request $req)
    {
        $measure = $req->measures[0] ?? '[Measures].[Sales Amount]';
        $timeLevel = $req->time_level ?? '[Date].[Year]';
        $year = $req->year ?? null;

        $measureSQL = match ($measure) {
            '[Measures].[Sales Amount]' => 'SUM(f.LineTotal)',
            '[Measures].[Total Due]' => 'SUM(f.TotalDue)',
            '[Measures].[Order Quantity]' => 'SUM(f.OrderQty)',
            default => null,
        };

        if (!$measureSQL) {
            return response()->json(['error' => 'Invalid measure'], 400);
        }

        $timeSQL = match ($timeLevel) {
            '[Date].[Year]' => 'd.YearNumber',
            '[Date].[Quarter]' => 'd.QuarterNumber',
            '[Date].[Month]' => 'd.MonthName',
            default => null,
        };

        if (!$timeSQL) {
            return response()->json(['error' => 'Invalid time level'], 400);
        }

        $data = DB::table('factsales as f')
            ->join('dimdate as d', 'f.FK_DateID', '=', 'd.DateID')
            ->when($year !== null, function ($query) use ($year) {
                $query->where('d.YearNumber', $year);
            })
            ->select(
                DB::raw("$timeSQL AS measure"),
                DB::raw("$measureSQL AS value")
            )
            ->groupBy('measure')
            ->orderBy('measure')
            ->get();

        return response()->json($data);
    }

    public function getTopProducts(Request $req)
    {
        $year = $req->year ?? null;

        $data = DB::table('factsales as f')
            ->join('dimproduct as p', 'f.FK_ProductID', '=', 'p.ProductID')
            ->join('dimdate as d', 'f.FK_DateID', '=', 'd.DateID')
            ->when($year !== null, function ($query) use ($year) {
                $query->where('d.YearNumber', $year);
            })
            ->select(
                'p.ProductName as product',
                'p.CategoryName as category',
                DB::raw('SUM(f.TotalDue) as total_sales_amount'),
                DB::raw('SUM(f.OrderQty) as units_sold'),
                DB::raw('SUM(f.LineTotal) as total_amount'),
                DB::raw('ROUND((SUM(f.LineTotal)) / SUM(f.TotalDue) * 100, 2) as profit_margin')
            )
            ->groupBy('p.ProductName', 'p.CategoryName')
            ->orderByDesc('total_sales_amount')
            ->limit(10)
            ->get();

        return response()->json($data);
    }

    public function getTopCustomers(Request $req)
    {
        $year = $req->year ?? null;

        $data = DB::table('factsales as f')
            ->join('dimcustomer as c', 'f.FK_CustomerID', '=', 'c.CustomerID')
            ->join('dimdate as d', 'f.FK_DateID', '=', 'd.DateID')
            ->when($year !== null, function ($query) use ($year) {
                $query->where('d.YearNumber', $year);
            })
            ->select(
                DB::raw("c.FullName as customer"),
                DB::raw("SUM(f.LineTotal) as value")
            )
            ->groupBy('customer')
            ->orderByDesc('value')
            ->limit(5)
            ->get();

        return response()->json($data);
    }

    public function getTopSalespeople(Request $req)
    {
        $year = $req->year ?? null;

        $data = DB::table('factsales as f')
            ->join('dimsalesperson as s', 'f.FK_SalesPersonID', '=', 's.SalesPersonID')
            ->join('dimdate as d', 'f.FK_DateID', '=', 'd.DateID')
            ->when($year !== null, function ($query) use ($year) {
                $query->where('d.YearNumber', $year);
            })
            ->select(
                DB::raw("s.EmployeeName as salesperson"),
                DB::raw("SUM(f.LineTotal) as value")
            )
            ->groupBy('salesperson')
            ->orderByDesc('value')
            ->limit(4)
            ->get();

        return response()->json($data);
    }

    public function salesCategoryWithTrend(Request $request)
    {
        $measureMap = [
            '[Measures].[Sales Amount]' => 'LineTotal',
            '[Measures].[Total Due]' => 'TotalDue',
            '[Measures].[Order Quantity]' => 'OrderQty',
        ];
        $timeLevelMap = [
            '[Date].[Year]' => 'd.YearNumber',
            '[Date].[Quarter]' => 'd.QuarterNumber',
            '[Date].[Month]' => 'd.MonthName',
        ];

        $measure = $measureMap[$request->measure] ?? 'LineTotal';
        $timeField = $timeLevelMap[$request->time_level] ?? 'd.MonthName';
        $year = $request->year ?? 'All';

        $pieQuery = DB::table('factsales as f')
            ->join('dimproduct as p', 'f.FK_ProductID', '=', 'p.ProductID')
            ->join('dimdate as d', 'f.FK_DateID', '=', 'd.DateID');

        $lineQuery = clone $pieQuery;

        if ($year !== 'All') {
            $pieQuery->where('d.YearNumber', $year);
            $lineQuery->where('d.YearNumber', $year);
        }

        $pieData = $pieQuery
            ->select('p.CategoryName as category', DB::raw("SUM(f.$measure) as value"))
            ->groupBy('p.CategoryName')
            ->orderByDesc('value')
            ->get();

        $lineData = $lineQuery
            ->select(
                'p.CategoryName as category',
                DB::raw("$timeField as time"),
                // Main selected measure (for flexibility if needed)
                DB::raw("SUM(f.$measure) as value"),
                // Fixed metrics for multi-bar chart
                DB::raw("SUM(f.LineTotal) as sales_amount"),
                DB::raw("SUM(f.TotalDue) as total_due"),
                DB::raw("SUM(f.OrderQty) as order_qty")
            )
            ->groupBy('p.CategoryName', 'time')
            ->orderBy('time')
            ->get();

        return response()->json([
            'pieData' => $pieData,
            'lineData' => $lineData,
        ]);
    }

    public function salesByTerritory(Request $request)
    {
        $measureMap = [
            '[Measures].[Sales Amount]' => 'LineTotal',
            '[Measures].[Total Due]' => 'TotalDue',
            '[Measures].[Order Quantity]' => 'OrderQty',
            '[Measures].[Tax Amount]' => 'TaxAmt',
            '[Measures].[Freight]' => 'Freight',
        ];

        $measure = $measureMap[$request->measure] ?? 'LineTotal';
        $year = $request->year ?? 'All';

        // Territory is linked via shipping/billing address → dimaddress → dimterritory
        $query = DB::table('factsales as f')
            ->join('dimaddress as a', 'f.FK_ShipToAddressID', '=', 'a.AddressID')
            ->join('dimterritory as t', 'a.FK_TerritoryID', '=', 't.TerritoryID')
            ->join('dimdate as d', 'f.FK_DateID', '=', 'd.DateID');

        if ($year !== 'All') {
            $query->where('d.YearNumber', $year);
        }

        $data = $query
            ->select(
                DB::raw('t.TerritoryName as territory'),
                DB::raw("SUM(f.$measure) as value")
            )
            ->groupBy('territory')
            ->orderByDesc('value')
            ->get();

        return response()->json($data);
    }
}
