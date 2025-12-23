import { useEffect, useState } from "react";
import axios from "../components/lib/axios";

export default function SalesOLapPage() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    // ===== BUILD MDX =====
    const mdx = `
        SELECT 
            {[Measures].[Sales Amount], 
            [Measures].[Order Quantity], 
            [Measures].[Total Due]} 
        ON COLUMNS,
            {([Date].[All Date],
            [Product].[All Product])} 
        ON ROWS
        FROM [SalesCube]
    `;

    // ===== SOAP REQUEST =====
    const soapRequest = `
      <Envelope xmlns="http://schemas.xmlsoap.org/soap/envelope/">
        <Body>
          <Execute xmlns="urn:schemas-microsoft-com:xml-analysis">
            <Command>
              <Statement>${mdx}</Statement>
            </Command>
            <Properties>
              <PropertyList>
                <Catalog>AdventureWorks</Catalog>
              </PropertyList>
            </Properties>
          </Execute>
        </Body>
      </Envelope>
    `;

    axios.post("http://localhost:8080/mondrian/xmla", soapRequest, {
        headers: {
          "Content-Type": "text/xml",
          "SOAPAction": "urn:schemas-microsoft-com:xml-analysis:Execute",
        },
      })
      .then((res) => {
        const parser = new DOMParser();
        const xml = parser.parseFromString(res.data, "text/xml");

        // ===== SOAP FAULT CHECK =====
        const fault = xml.getElementsByTagName("Fault");
        if (fault.length) {
          const descNode = xml.getElementsByTagNameNS(
            "http://mondrian.sourceforge.net",
            "desc"
          )[0];
          const message = descNode ? descNode.textContent : "Unknown XMLA error";
          throw new Error(message);
        }

        // ===== PARSE ROWS =====
        const rowNodes = xml.getElementsByTagName("row");
        if (!rowNodes.length) {
          throw new Error("No OLAP rows returned");
        }

        const data = Array.from(rowNodes).map((row) => ({
          salesAmount: parseFloat(
            row.querySelector(
              "_x005b_Measures_x005d_._x005b_Sales_x0020_Amount_x005d_"
            )?.textContent || 0
          ),
          orderQty: parseFloat(
            row.querySelector(
              "_x005b_Measures_x005d_._x005b_Order_x0020_Quantity_x005d_"
            )?.textContent || 0
          ),
          totalDue: parseFloat(
            row.querySelector(
              "_x005b_Measures_x005d_._x005b_Total_x0020_Due_x005d_"
            )?.textContent || 0
          ),
          category: "All Dates × All Products", // static label for now
        }));

        setRows(data);
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setError(err.message || "Failed to fetch OLAP data");
        setLoading(false);
      });
  }, []);

  // ===== UI =====
  if (loading) return <div className="p-6">Loading OLAP data…</div>;
  if (error) return <div className="p-6 text-red-600">{error}</div>;

  return (
    <div className="bg-white rounded-xl shadow-lg p-6 border">
      <h2 className="text-2xl font-bold mb-6">
        💰 Sales Analysis <span className="text-xs text-gray-400">MDX LIVE</span>
      </h2>

      <table className="w-full border-collapse">
        <thead>
          <tr className="border-b">
            <th className="p-3 text-left">Category</th>
            <th className="p-3 text-right">Sales Amount</th>
            <th className="p-3 text-right">Order Qty</th>
            <th className="p-3 text-right">Total Due</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <tr key={i} className="border-b hover:bg-gray-50">
              <td className="p-3">{r.category}</td>
              <td className="p-3 text-right text-pink-600 font-bold">
                ${r.salesAmount.toLocaleString()}
              </td>
              <td className="p-3 text-right">{r.orderQty.toLocaleString()}</td>
              <td className="p-3 text-right">
                ${r.totalDue.toLocaleString()}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}