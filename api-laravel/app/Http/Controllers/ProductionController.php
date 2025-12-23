<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class ProductionController extends Controller
{
    public function getAnalytics(Request $request)
    {
        try {
            // Filters
            $locationId = $request->query('location_id');
            $categoryName = $request->query('category_name');
            $year = $request->query('year', 2014); // Default to last available year

            $baseQuery = DB::table('factproduction')
                ->join('dimdate', 'factproduction.FK_StartDateID', '=', 'dimdate.DateID')
                ->when($year, fn($q) => $q->where('dimdate.YearNumber', $year))
                ->when($locationId, fn($q) => $q->where('factproduction.FK_LocationID', $locationId));

            //  KPI Metrics
            $kpis = (clone $baseQuery)
                ->select(
                    DB::raw('SUM(StockedQty) as totalUnits'),
                    DB::raw('SUM(ScrappedQty) as totalScrapped'),
                    DB::raw('SUM(OrderQty) as totalOrder'),
                    DB::raw('AVG(ProductionDayCount) as avgLeadTime')
                )
                ->first();

            $scrapRate = ($kpis->totalOrder > 0) ? round(($kpis->totalScrapped / $kpis->totalOrder) * 100, 2) : 0;

            // Monthly Trends
            $monthlyData = (clone $baseQuery)
                ->select(
                    'dimdate.MonthName',
                    'dimdate.MonthNumber',
                    DB::raw('SUM(StockedQty) as yield'),
                    DB::raw('SUM(OrderQty) as total_order'),
                    DB::raw('SUM(ScrappedQty) as total_scrapped'),
                    DB::raw('CAST(SUM(PlannedCost) AS UNSIGNED) as planned'),
                    DB::raw('CAST(SUM(ActualCost) AS UNSIGNED) as actual'),
                    DB::raw('IF(SUM(ActualCost) > (SUM(PlannedCost) * 1.1), 1, 0) as exceeds_tolerance')
                )
                ->groupBy('dimdate.MonthName', 'dimdate.MonthNumber')
                ->orderBy('dimdate.MonthNumber')
                ->get();

            // Lead Time Distribution (Histogram)
            $leadTimeDist = (clone $baseQuery)
                ->join('dimproduct', 'factproduction.FK_ProductID', '=', 'dimproduct.ProductID')
                ->select('ProductionDayCount as days', DB::raw('count(*) as count'))
                ->when($categoryName, fn($q) => $q->where('dimproduct.CategoryName', $categoryName))
                ->groupBy('ProductionDayCount')
                ->orderBy('ProductionDayCount')
                ->get();
            
            // production by category
            $categoryDistribution = (clone $baseQuery)
                ->join('dimproduct', 'factproduction.FK_ProductID', '=', 'dimproduct.ProductID')
                ->select('dimproduct.CategoryName as category', DB::raw('SUM(StockedQty) as total_yield'))
                ->groupBy('category')
                ->get();

            // production by location
            $locationDist = (clone $baseQuery)
                ->join('dimlocation', 'factproduction.FK_LocationID', '=', 'dimlocation.LocationID')
                ->select(
                    'dimlocation.LocationID as id', 
                    'dimlocation.LocationName as name', 
                    DB::raw('SUM(OrderQty) as total'),
                    DB::raw('SUM(ScrappedQty) as scrapped'),
                    DB::raw('ROUND((SUM(ScrappedQty) / SUM(OrderQty)) * 100, 2) as scrapRate')
                )
                ->groupBy('dimlocation.LocationID', 'dimlocation.LocationName')
                ->orderBy('total', 'desc')
                ->get();

            $rawLocationTrends = (clone $baseQuery)
                ->join('dimlocation', 'factproduction.FK_LocationID', '=', 'dimlocation.LocationID')
                ->select(
                    'dimlocation.LocationName',
                    'dimdate.MonthName',
                    'dimdate.MonthNumber',
                    DB::raw('SUM(StockedQty) as monthly_yield')
                )
                ->groupBy('dimlocation.LocationName', 'dimdate.MonthName', 'dimdate.MonthNumber')
                ->orderBy('dimdate.MonthNumber')
                ->get();
            
            $locationTrendDatasets = $rawLocationTrends->groupBy('LocationName')->map(function ($data, $locationName) {
                return [
                    'label' => $locationName,
                    'data' => $data->pluck('monthly_yield'),
                    'backgroundColor' => 'transparent',
                    'tension' => 0.4
                ];
            })->values();

            // order vs stocked trends
            $qtyTrends = (clone $baseQuery)
                ->select(
                    'dimdate.MonthName',
                    'dimdate.MonthNumber',
                    DB::raw('SUM(OrderQty) as total_order'),
                    DB::raw('SUM(StockedQty) as total_stocked')
                )
                ->groupBy('dimdate.MonthName', 'dimdate.MonthNumber')
                ->orderBy('dimdate.MonthNumber')
                ->get();

            // Performance Heatmap
            $heatmap = (clone $baseQuery)
                ->join('dimlocation', 'factproduction.FK_LocationID', '=', 'dimlocation.LocationID')
                ->select(
                    'dimdate.MonthName',
                    'dimlocation.LocationName',
                    DB::raw('SUM(StockedQty) as units')
                )
                ->groupBy('dimdate.MonthName', 'dimlocation.LocationName', 'dimdate.MonthNumber')
                ->orderBy('dimdate.MonthNumber')
                ->get();

            //Pareto: Scrap Reasons (Cumulative Analysis)
            $scrapPareto = (clone $baseQuery)
                ->join('dimscrapreason', 'factproduction.FK_ScrapReasonID', '=', 'dimscrapreason.ScrapReasonID')
                ->select('dimscrapreason.ScrapReasonName as reason', DB::raw('SUM(ScrappedQty) as qty'))
                ->groupBy('reason')
                ->orderBy('qty', 'desc')
                ->get();
            
            $totalScrapSum = $scrapPareto->sum('qty');
            $runningSum = 0;
            $scrapPareto->transform(function ($item) use (&$runningSum, $totalScrapSum) {
                $runningSum += $item->qty;
                $item->cumulative_pct = ($totalScrapSum > 0) ? round(($runningSum / $totalScrapSum) * 100, 2) : 0;
                return $item;
            });

            // Top 10 Highest Scrap Records Table
            $tableData = (clone $baseQuery)
                ->join('dimproduct', 'factproduction.FK_ProductID', '=', 'dimproduct.ProductID')
                ->join('dimlocation', 'factproduction.FK_LocationID', '=', 'dimlocation.LocationID')
                ->select(
                    'dimproduct.ProductName as product',
                    'dimlocation.LocationName as location',
                    'factproduction.OrderQty as qty',
                    'factproduction.ScrappedQty as scrapped',
                    DB::raw('ROUND((factproduction.ScrappedQty / factproduction.OrderQty) * 100, 2) as scrapRate')
                )
                ->orderBy('scrapRate', 'desc')
                ->limit(10)
                ->get();

            $hoursDist = (clone $baseQuery)
                ->select(
                    DB::raw('ROUND(ActualResourceHrs) as hour_label'), 
                    DB::raw('COUNT(*) as order_count')
                )
                ->when($categoryName, fn($q) => $q->join('dimproduct', 'factproduction.FK_ProductID', '=', 'dimproduct.ProductID')
                                                ->where('dimproduct.CategoryName', $categoryName))
                ->groupBy('hour_label')
                ->orderBy('hour_label')
                ->get();

            // Return data
            return response()->json([
                'kpis' => [
                    'totalUnits' => (int)$kpis->totalUnits,
                    'scrapRate' => (float)$scrapRate,
                    'avgLeadTime' => round((float)$kpis->avgLeadTime, 1)
                ],
                'monthlyTrends' => [
                    'months' => $monthlyData->pluck('MonthName'),
                    'yield' => $monthlyData->pluck('yield'),
                    'scrapRates' => $monthlyData->map(fn($d) => ($d->total_order > 0) ? round(($d->total_scrapped / $d->total_order) * 100, 2) : 0),
                    'plannedCosts' => $monthlyData->pluck('planned'),
                    'actualCosts' => $monthlyData->pluck('actual'),
                    'exceedsTolerance' => $monthlyData->pluck('exceeds_tolerance'),
                ],
                'leadTimeDistribution' => $leadTimeDist,
                'heatmap' => $heatmap,
                'scrapPareto' => $scrapPareto,
                'tableData' => $tableData,
                'categoryDist' => $categoryDistribution,
                'locationDist' => $locationDist,
                'locationTrends' => $locationTrendDatasets,
                'hoursDistribution' => $hoursDist,
                'qtyComparison' => [
                    'labels' => $qtyTrends->pluck('MonthName'),
                    'orderQty' => $qtyTrends->pluck('total_order'),
                    'stockedQty' => $qtyTrends->pluck('total_stocked'),
                ],
            ]);

        } catch (\Exception $e) {
            return response()->json(['error' => $e->getMessage()], 500);
        }
    }
}