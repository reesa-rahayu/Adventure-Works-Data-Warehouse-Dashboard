<%@ page session="true" contentType="text/html; charset=UTF-8" %>
<%@ taglib uri="http://www.tonbeller.com/jpivot" prefix="jp" %>
<%@ taglib prefix="c" uri="http://java.sun.com/jstl/core" %>

<jp:mondrianQuery
  id="query01"
  jdbcDriver="com.mysql.jdbc.Driver"
  jdbcUrl="jdbc:mysql://localhost:3306/wh_adventure_works?user=root&password=password"
  catalogUri="/WEB-INF/queries/AdventureWorks.xml"
>
WITH 
  MEMBER [Measures].[Scrap Rate] AS
    ([Measures].[Scrapped Quantity] / [Measures].[Order Quantity]),
    FORMAT_STRING = "0.00%"

SELECT
    {[Measures].[Scrap Rate], [Measures].[Scrapped Quantity], [Measures].[Order Quantity]} ON COLUMNS,
    [Location].[Location].Members ON ROWS
FROM [ProductionCube]

</jp:mondrianQuery>

<c:set var="title01" scope="session">
  Production Analysis - AdventureWorks DW
</c:set>
