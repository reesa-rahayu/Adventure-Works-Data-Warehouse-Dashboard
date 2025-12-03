<?php

namespace App\Http\Controllers;
use App\Services\XmlaService;
use Illuminate\Http\Request;

class XmlaController extends Controller
{
    public function query()
    {
        $mdx = request('mdx');
        $xmla = new XmlaService();

        $rawXml = $xmla->executeMdx($mdx);

        // TODO: parse XML into JSON
        $parsed = simplexml_load_string($rawXml);

        return response()->json($parsed);
    }
}
