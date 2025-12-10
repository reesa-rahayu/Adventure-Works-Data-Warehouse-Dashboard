<?php

return [
    'salesfact' => <<<'MDX'
SELECT 
    {[Measures].[Sales Amount], 
     [Measures].[Order Quantity], 
     [Measures].[Total Due]} 
ON COLUMNS,
    {([Date].[All Date],
      [Product].[All Product])} 
ON ROWS
FROM [SalesCube]
MDX,

    'purchasefact' => <<<'MDX'
SELECT 
{[Measures].[Order Quantity], 
  [Measures].[Total Due], 
  [Measures].[Line Total]} 
ON COLUMNS,
{([Date].[All Date], 
  [Vendor].[All Vendor],
  [Product].[All Product])} 
ON ROWS
FROM [PurchaseCube]
MDX,

    'productionfact' => <<<'MDX'
SELECT 
{
  [Measures].[Order Quantity], 
  [Measures].[Actual Cost], 
  [Measures].[Production Days]
} 
ON COLUMNS,
{(
  [start date].[All Date],
  [Product].[All Product]
  )} 
ON ROWS
FROM [ProductionCube]
MDX,

    'salestopcustomer' => <<<'MDX'
SELECT
    {[Measures].[Sales Amount]} ON COLUMNS,

    TopCount(
        [Customer].[All Customer],
        10,
        [Measures].[Sales Amount]
    ) ON ROWS

FROM [SalesCube]
MDX,

    'productionefficiency' => <<<'MDX'
WITH
  MEMBER [Measures].[Cost Efficiency] AS 
    ([Measures].[Actual Cost] / [Measures].[Planned Cost]),
    FORMAT_STRING = "0.00%"

SELECT
    {[Measures].[Actual Cost], 
     [Measures].[Planned Cost],
     [Measures].[Cost Efficiency]} ON COLUMNS,
    [Product].[Category].Members ON ROWS
FROM [ProductionCube]
MDX,

    'productionscraprate' => <<<'MDX'
WITH 
  MEMBER [Measures].[Scrap Rate] AS
    ([Measures].[Scrapped Quantity] / [Measures].[Order Quantity]),
    FORMAT_STRING = "0.00%"

SELECT
    {[Measures].[Scrap Rate], [Measures].[Scrapped Quantity], [Measures].[Order Quantity]} ON COLUMNS,
    [Location].[Location].Members ON ROWS
FROM [ProductionCube]
MDX,
];
