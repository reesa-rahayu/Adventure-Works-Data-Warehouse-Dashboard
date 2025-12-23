<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class FilterController extends Controller
{
    public function getYears()
    {
        return response()->json(
            DB::table('dimdate')
                ->select('YearNumber')
                ->distinct()
                ->orderBy('YearNumber', 'asc')
                ->pluck('YearNumber')
        );
    }

    public function getLocations()
    {
        return response()->json(
            DB::table('dimlocation')
                ->select('LocationID', 'LocationName')
                ->orderBy('LocationName', 'asc')
                ->get()
        );
    }

    public function getCategories()
    {
        return response()->json(
            DB::table('dimproduct')
                ->select('CategoryName')
                ->distinct()
                ->whereNotNull('CategoryName')
                ->orderBy('CategoryName', 'asc')
                ->pluck('CategoryName')
        );
    }
}
