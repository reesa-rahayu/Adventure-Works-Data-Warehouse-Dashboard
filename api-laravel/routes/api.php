<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\SalesController;

Route::middleware(['auth:sanctum'])->get('/user', function (Request $request) {
    return $request->user();
});

Route::post('/sales', [SalesController::class, 'getSales']);
Route::post('/sales/bycategory', [SalesController::class, 'byCategory']);
Route::post('/sales/byterritory', [SalesController::class, 'byTerritory']);
Route::post('/sales/top-products', [SalesController::class, 'getTopProducts']);
Route::post('/sales/top-customers', [SalesController::class, 'getTopCustomers']);
Route::post('/sales/top-salespersons', [SalesController::class, 'getTopSalespeople']);

