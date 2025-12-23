<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class DashboardController extends Controller
{
    public function getSummary(Request $request)
    {
        try {
            $year = $request->query('year', 2014);
            
            // Sales
            $salesKpis = DB::table('factsales')
                ->join('dimdate', 'factsales.FK_DateID', '=', 'dimdate.DateID')
                ->where('dimdate.YearNumber', $year)
                ->select(
                    DB::raw('SUM(TotalDue) as totalRevenue'),
                    DB::raw('SUM(OrderQty) as totalQty'),
                    DB::raw('AVG(TotalDue) as avgOrderValue')
                )->first();

            $salesByCategory = DB::table('factsales')
                ->join('dimproduct', 'factsales.FK_ProductID', '=', 'dimproduct.ProductID')
                ->join('dimdate', 'factsales.FK_DateID', '=', 'dimdate.DateID')
                ->where('dimdate.YearNumber', $year)
                ->select('dimproduct.CategoryName', DB::raw('SUM(LineTotal) as total'))
                ->groupBy('dimproduct.CategoryName')
                ->get();

            // 2. PRODUCTION PILLAR (Efficiency & Scrap)
            $productionStats = DB::table('factproduction')
                ->join('dimdate', 'factproduction.FK_StartDateID', '=', 'dimdate.DateID')
                ->where('dimdate.YearNumber', $year)
                ->select(
                    DB::raw('SUM(StockedQty) as totalStocked'),
                    DB::raw('SUM(ScrappedQty) as totalScrapped'),
                    DB::raw('ROUND((SUM(ScrappedQty) / SUM(OrderQty)) * 100, 2) as scrapRate')
                )->first();

            $scrapByReason = DB::table('factproduction')
                ->join('dimscrapreason', 'factproduction.FK_ScrapReasonID', '=', 'dimscrapreason.ScrapReasonID')
                ->join('dimdate', 'factproduction.FK_StartDateID', '=', 'dimdate.DateID')
                ->where('dimdate.YearNumber', $year)
                ->select('dimscrapreason.ScrapReasonName', DB::raw('SUM(ScrappedQty) as qty'))
                ->groupBy('dimscrapreason.ScrapReasonName')
                ->orderBy('qty', 'desc')
                ->limit(5)
                ->get();

            // 3. PURCHASING PILLAR (Vendor Risk)
            $vendorRisk = DB::table('factpurchase')
                ->join('dimvendor', 'factpurchase.FK_VendorID', '=', 'dimvendor.VendorID')
                ->join('dimdate', 'factpurchase.FK_DateID', '=', 'dimdate.DateID')
                ->where('dimdate.YearNumber', $year)
                ->select(
                    'dimvendor.VendorName',
                    DB::raw('SUM(TotalDue) as totalSpend'),
                    DB::raw('ROUND((SUM(RejectedQty) / SUM(ReceivedQty)) * 100, 2) as rejectionRate'),
                    DB::raw('ROUND((SUM(StockedQty) / SUM(OrderQty)) * 100, 2) as fulfillmentRate')
                )
                ->groupBy('dimvendor.VendorName', 'dimvendor.VendorID')
                ->having('totalSpend', '>', 10000)
                ->get();

            // 4. MONTHLY COMBINED TREND
            $monthlyTrends = DB::table('dimdate')
                ->where('YearNumber', $year)
                ->select('MonthName', 'MonthNumber')
                ->distinct()
                ->orderBy('MonthNumber')
                ->get()
                ->map(function ($month) use ($year) {
                    $sales = DB::table('factsales')
                        ->join('dimdate', 'factsales.FK_DateID', '=', 'dimdate.DateID')
                        ->where('dimdate.YearNumber', $year)
                        ->where('dimdate.MonthNumber', $month->MonthNumber)
                        ->sum('TotalDue');
                        
                    $purchases = DB::table('factpurchase')
                        ->join('dimdate', 'factpurchase.FK_DateID', '=', 'dimdate.DateID')
                        ->where('dimdate.YearNumber', $year)
                        ->where('dimdate.MonthNumber', $month->MonthNumber)
                        ->sum('TotalDue');

                    return [
                        'month' => $month->MonthName,
                        'revenue' => $sales,
                        'expense' => $purchases
                    ];
                });

            return response()->json([
                'salesKpis' => $salesKpis,
                'salesByCategory' => $salesByCategory,
                'productionStats' => $productionStats,
                'scrapByReason' => $scrapByReason,
                'vendorRisk' => $vendorRisk,
                'monthlyTrends' => $monthlyTrends
            ]);

        } catch (\Exception $e) {
            return response()->json(['error' => $e->getMessage()], 500);
        }
    }
}
