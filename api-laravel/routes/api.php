<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\OlapController;

Route::middleware(['auth:sanctum'])->get('/user', function (Request $request) {
    return $request->user();
});

// XMLA/MDX Query Routes
Route::post('/sales', [OlapController::class, 'getSalesData']);
Route::post('/production', [OlapController::class, 'getProductionData']);  
Route::post('/purchase', [OlapController::class, 'getPurchaseData']);  

Route::post('/mdx', [OlapController::class, 'runMdx']);
