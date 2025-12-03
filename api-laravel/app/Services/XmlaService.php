<?php

namespace App\Services;

use SoapClient;

class XmlaService
{
    protected $client;

    public function __construct()
    {
        $this->client = new SoapClient(
            config('xmla.endpoint'),
            [
                'soap_version' => SOAP_1_1,
                'trace'        => true,
                'exceptions'   => true,
            ]
        );
    }

    public function executeMdx($mdx)
    {
        $xmlaQuery = "
        <Execute xmlns='urn:schemas-microsoft-com:xml-analysis'>
            <Command><Statement>$mdx</Statement></Command>
            <Properties><PropertyList>
                <Catalog>" . config('xmla.catalog') . "</Catalog>
            </PropertyList></Properties>
        </Execute>";

        return $this->client->__doRequest(
            $xmlaQuery,
            config('xmla.endpoint'),
            "urn:schemas-microsoft-com:xml-analysis:Execute",
            1
        );
    }
}
