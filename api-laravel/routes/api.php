<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\SalesController;

Route::middleware(['auth:sanctum'])->get('/user', function (Request $request) {
    return $request->user();
});

// XMLA/MDX Query Routes
Route::post('/sales', [SalesController::class, 'getSalesData']);
Route::post('/production', [SalesController::class, 'getProductionData']);
Route::post('/purchase', [SalesController::class, 'getPurchaseData']);

Route::post('/mdx', [SalesController::class, 'runMdx']);
