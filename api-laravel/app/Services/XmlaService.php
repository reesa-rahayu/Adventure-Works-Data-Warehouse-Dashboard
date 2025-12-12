<?php

namespace App\Services;

use GuzzleHttp\Client;

class XmlaService
{
    protected $client;
    protected $xmlaUrl;
    protected $catalog;

    public function __construct()
    {
        $this->client = new Client([
            'timeout' => 60,
        ]);

        $this->xmlaUrl = "http://localhost:8080/mondrian/xmla";
        $this->catalog = "AdventureWorks";
    }

    public function executeMdx($mdx)
    {
        $body = "
        <Envelope xmlns='http://schemas.xmlsoap.org/soap/envelope/'>
            <Body>
                <Execute xmlns='urn:schemas-microsoft-com:xml-analysis'>
                    <Command>
                        <Statement>$mdx</Statement>
                    </Command>
                    <Properties>
                        <PropertyList>
                            <Catalog>$this->catalog</Catalog>
                        </PropertyList>
                    </Properties>
                </Execute>
            </Body>
        </Envelope>";

        $response = $this->client->post($this->xmlaUrl, [
            'headers' => [
                'Content-Type' => 'text/xml',
                'SOAPAction'   => 'urn:schemas-microsoft-com:xml-analysis:Execute'
            ],
            'body' => $body
        ]);

        return $response->getBody()->getContents();
    }
}
