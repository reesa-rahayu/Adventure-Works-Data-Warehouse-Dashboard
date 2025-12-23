<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\SalesController;
use App\Http\Controllers\ProductionController;

Route::middleware(['auth:sanctum'])->get('/user', function (Request $request) {
    return $request->user();
});

Route::post('/sales', [SalesController::class, 'getSales']);
Route::post('/sales/trend', [SalesController::class, 'salesTrend']);
Route::post('/sales/by-category', [SalesController::class, 'salesCategoryWithTrend']);
Route::post('/sales/by-territory', [SalesController::class, 'salesByTerritory']);
Route::post('/sales/top-products', [SalesController::class, 'getTopProducts']);
Route::post('/sales/top-customers', [SalesController::class, 'getTopCustomers']);
Route::post('/sales/top-salesperson', [SalesController::class, 'getTopSalespeople']);

Route::get('/production/get-data', [ProductionController::class, 'getAnalytics']);

Route::get('/years', function () {
    return DB::table('dimdate')
        ->select('YearNumber')
        ->distinct()
        ->orderBy('YearNumber')
        ->pluck('YearNumber');
});
