<%@ page session="true" contentType="text/html; charset=ISO-8859-1" %>
<%@ taglib uri="http://www.tonbeller.com/jpivot" prefix="jp" %>
<%@ taglib prefix="c" uri="http://java.sun.com/jstl/core" %>

<jp:mondrianQuery
  id="query01"
  jdbcDriver="com.mysql.jdbc.Driver"
  jdbcUrl="jdbc:mysql://localhost:3306/wh_adventure_works?user=root&password=password"
  catalogUri="/WEB-INF/queries/AdventureWorks.xml"
>
SELECT 
    {[Measures].[Sales Amount], 
     [Measures].[Order Quantity], 
     [Measures].[Total Due]} 
ON COLUMNS,
    {([Date].[All Date],
      [Product].[All Product])} 
ON ROWS
FROM [SalesCube]
</jp:mondrianQuery>

<c:set var="title01" scope="session">
  Sales Analysis - AdventureWorks DW
</c:set>
