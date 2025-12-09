<%@ page session="true" contentType="text/html; charset=UTF-8" %> <%@ taglib
uri="http://www.tonbeller.com/jpivot" prefix="jp" %> <%@ taglib prefix="c"
uri="http://java.sun.com/jstl/core" %>

<jp:mondrianQuery
  id="query01"
  jdbcDriver="com.mysql.jdbc.Driver"
  jdbcUrl="jdbc:mysql://localhost:3306/wh_adventure_works?user=root&password=password"
  catalogUri="/WEB-INF/queries/AdventureWorks.xml"
>
SELECT
    {[Measures].[Sales Amount]} ON COLUMNS,

    TopCount(
        [Customer].[All Customer],
        10,
        [Measures].[Sales Amount]
    ) ON ROWS

FROM [SalesCube]
</jp:mondrianQuery>

<c:set var="title01" scope="session">
  Top Customer by Sales Amount - AdventureWorks DW
</c:set>
