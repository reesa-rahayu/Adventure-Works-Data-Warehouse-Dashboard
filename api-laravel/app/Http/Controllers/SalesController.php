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
        $data = DB::table('factsales as f')
            ->join('dimproduct as p', 'f.FK_ProductID', '=', 'p.ProductID')
            ->select(
                'p.ProductName as product',
                DB::raw('SUM(f.LineTotal) as value')
            )
            ->groupBy('product')
            ->orderByDesc('value')
            ->limit(5)
            ->get();

        return response()->json($data);
    }

    public function getTopCustomers(Request $req)
    {
        $data = DB::table('factsales as f')
            ->join('dimcustomer as c', 'f.FK_CustomerID', '=', 'c.CustomerID')
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
        $data = DB::table('factsales as f')
            ->join('dimsalesperson as s', 'f.FK_SalesPersonID', '=', 's.SalesPersonID')
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
}