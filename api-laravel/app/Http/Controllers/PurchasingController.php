<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class PurchasingController extends Controller
{
    public function getAnalytics(Request $request)
    {
        try {
            $year = $request->query('year');
            $vendorId = $request->query('vendor_id');
            $category = $request->query('category_name');
            $selectedTerritory = $request->query('territory_name');

            // --- BASE QUERY (Global Filters) ---
            $baseQuery = DB::table('factpurchase')
                ->join('dimdate', 'factpurchase.FK_DateID', '=', 'dimdate.DateID')
                ->when($year, fn($q) => $q->where('dimdate.YearNumber', $year))
                ->when($vendorId, fn($q) => $q->where('factpurchase.FK_VendorID', $vendorId));

            if ($category) {
                $baseQuery->join('dimproduct', 'factpurchase.FK_ProductID', '=', 'dimproduct.ProductID')
                    ->where('dimproduct.CategoryName', $category)->where('dimproduct.CategoryName', $category);
            }

            // TOP-LEVEL KPIs
            $kpis = (clone $baseQuery)
                ->select(
                    DB::raw('SUM(TotalDue) as totalSpend'),
                    DB::raw('SUM(OrderQty) as totalOrderQty'),
                    DB::raw('SUM(Freight) as totalFreight'),
                    DB::raw('SUM(TaxAmt) as totalTax'),
                    DB::raw('ROUND((SUM(RejectedQty) / SUM(ReceivedQty)) * 100, 2) as overallRejectionRate')
                )->first();

            // SPEND & VOLUME TREND (Kapan volume meningkat?)
            $monthlyTrends = (clone $baseQuery)
                ->select(
                    'dimdate.MonthName',
                    'dimdate.MonthNumber',
                    DB::raw('SUM(OrderQty) as volume'),
                    DB::raw('SUM(TotalDue) as spend'),
                    DB::raw('SUM(RejectedQty) as rejected')
                )
                ->groupBy('dimdate.MonthName', 'dimdate.MonthNumber')
                ->orderBy('dimdate.MonthNumber')
                ->get();

            // VENDOR SCORECARD (Vendor dengan transaksi terbesar & Rejected terbanyak)
            $vendorAnalysis = (clone $baseQuery)
                ->join('dimvendor', 'factpurchase.FK_VendorID', '=', 'dimvendor.VendorID')
                ->select(
                    'dimvendor.VendorName',
                    DB::raw('SUM(TotalDue) as total_spend'),
                    DB::raw('SUM(Freight) as total_freight'),
                    DB::raw('SUM(RejectedQty) as total_rejected'),
                    DB::raw('ROUND((SUM(RejectedQty) / SUM(ReceivedQty)) * 100, 2) as rejection_rate'),
                    DB::raw('ROUND((SUM(StockedQty) / SUM(OrderQty)) * 100, 2) as fulfillment_rate')
                )
                ->groupBy('dimvendor.VendorName')
                ->orderBy('total_spend', 'desc')
                ->get();

            // TOP PRODUCTS BY VALUE (Produk dengan LineTotal tertinggi)
            $topProducts = (clone $baseQuery)
                ->join('dimproduct', 'factpurchase.FK_ProductID', '=', 'dimproduct.ProductID')
                ->select(
                    'dimproduct.ProductName',
                    'dimproduct.CategoryName',
                    DB::raw('SUM(LineTotal) as spend_value'),
                    DB::raw('SUM(OrderQty) as total_qty')
                )
                ->groupBy('dimproduct.ProductName', 'dimproduct.CategoryName')
                ->orderBy('spend_value', 'desc')
                ->limit(10)
                ->get();

            // FREIGHT BY TERRITORY (Wilayah mana biaya pengiriman tertinggi?)
            // We join through Vendor -> Address -> Territory
            $freightByTerritory = (clone $baseQuery)
                ->join('dimvendor', 'factpurchase.FK_VendorID', '=', 'dimvendor.VendorID')
                ->join('dimaddress', 'dimvendor.VendorID', '=', 'dimaddress.AddressID') // Assuming VendorID maps to AddressID or join via intermediate table
                ->join('dimterritory', 'dimaddress.FK_TerritoryID', '=', 'dimterritory.TerritoryID')
                ->select('dimterritory.TerritoryName', DB::raw('SUM(factpurchase.Freight) as total_freight'))
                ->groupBy('dimterritory.TerritoryName')
                ->orderBy('total_freight', 'desc')
                ->get();
            return response()->json([
                'kpis' => $kpis,
                'monthlyTrends' => [
                    'labels' => $monthlyTrends->pluck('MonthName'),
                    'volume' => $monthlyTrends->pluck('volume'),
                    'spend' => $monthlyTrends->pluck('spend'),
                    'rejected' => $monthlyTrends->pluck('rejected'),
                ],
                'vendorAnalysis' => $vendorAnalysis,
                'topProducts' => $topProducts,
                'freightByTerritory' => $freightByTerritory,
            ]);

        } catch (\Exception $e) {
            return response()->json(['error' => $e->getMessage()], 500);
        }
    }
}
