<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\SalesController;
use App\Http\Controllers\PurchaseController;
use App\Http\Controllers\ProductionController;

Route::middleware(['auth:sanctum'])->get('/user', function (Request $request) {
    return $request->user();
});

Route::get('/sales', [SalesController::class, 'getData']);
Route::get('/purchase', [PurchaseController::class, 'getData']);
Route::get('/production', [ProductionController::class, 'getData']);