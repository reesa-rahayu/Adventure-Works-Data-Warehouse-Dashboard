<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class SalesController extends Controller
{
    public function getSalesSummary(Request $request)
    {
        try {
            $year = $request->query('year', 2014);

            // 1. Sales KPIs (The StatCards)
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
}
