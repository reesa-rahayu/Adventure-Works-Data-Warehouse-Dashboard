<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class SalesController extends Controller
{
    public function getData(Request $request)
    {
        $kpi = DB::table('factsales')
            ->selectRaw('
            SUM(TotalDue) AS totalSales,
            COUNT(FactSalesID) AS totalOrders,
            SUM(OrderQty) AS totalQty,
            SUM(TotalDue) / COUNT(FactSalesID) AS aov,
            SUM(LineTotal) AS grossRevenue,
            SUM(Freight) AS freightCost,
            SUM(TaxAmt) AS taxTotal
        ')
            ->first();

        $data = DB::table('factsales')
            ->selectRaw('
            *
        ')
            ->get();

        return response()->json($data);
    }
}
