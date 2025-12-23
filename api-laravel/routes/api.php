<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;
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
Route::get('/sales-olap', [SalesController::class, 'getSalesOlap']);

Route::get('/production-data', [ProductionController::class, 'getAnalytics']);
Route::get('/purchasing-data', [PurchasingController::class, 'getAnalytics']);
Route::get('/dashboard', [DashboardController::class, 'getSummary']);

Route::get('/years', [FilterController::class, 'getYears']);
Route::get('/locations', [FilterController::class, 'getLocations']);
Route::get('/categories', [FilterController::class, 'getCategories']);
Route::get('/vendors', [FilterController::class, 'getVendors']);

Route::post('/olap/execute', function (Request $request) {
    $mondrianUrl = 'http://localhost:8080/mondrian/xmla'; 
    $response = Http::withBody($request->getContent(), 'text/xml') 
        ->withHeaders([
            'Content-Type' => 'text/xml',
            'SOAPAction'   => '"urn:schemas-microsoft-com:xml-analysis:Execute"',
        ])
        ->post($mondrianUrl);
    return response($response->body(), $response->status())
            ->header('Content-Type', 'text/xml');
});
