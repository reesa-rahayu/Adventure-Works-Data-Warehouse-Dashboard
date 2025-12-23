<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\SalesController;
use App\Http\Controllers\FilterController;
use App\Http\Controllers\DashboardController;
use App\Http\Controllers\ProductionController;
use App\Http\Controllers\PurchasingController;

Route::middleware(['auth:sanctum'])->get('/user', function (Request $request) {
    return $request->user(); 
});

Route::get('/sales-data', [SalesController::class, 'getSalesSummary']);
Route::get('/production-data', [ProductionController::class, 'getAnalytics']);
Route::get('/purchasing-data', [PurchasingController::class, 'getAnalytics']);
Route::get('/dashboard', [DashboardController::class, 'getSummary']);


Route::get('/years', [FilterController::class, 'getYears']);
Route::get('/locations', [FilterController::class, 'getLocations']);
Route::get('/categories', [FilterController::class, 'getCategories']);
Route::get('/vendors', [FilterController::class, 'getVendors']);