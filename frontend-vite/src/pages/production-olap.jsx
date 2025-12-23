import { useState, useEffect } from "react";
import axios from "../components/lib/axios";

export default function SalesOLapPage() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const soapRequest = `
      <Soap:Envelope xmlns:Soap="http://schemas.xmlsoap.org/soap/envelope/">
        <Soap:Body>
          <Execute xmlns="urn:schemas-microsoft-com:xml-analysis">
            <Command><Statement>
              SELECT {[Measures].[Sales Amount]} ON COLUMNS, 
              {[Product].[Category].Members} ON ROWS 
              FROM [Adventure Works]
            </Statement></Command>
            <Properties><PropertyList>
              <DataSourceInfo>Provider=Mondrian;DataSource=AdventureWorks</DataSourceInfo>
              <Catalog>AdventureWorks</Catalog>
              <Format>Multidimensional</Format>
            </PropertyList></Properties>
          </Execute>
        </Soap:Body>
      </Soap:Envelope>`;

    axios.post('/api/olap/execute', soapRequest, { headers: { 'Content-Type': 'text/xml' } })
      .then(res => {
        const parser = new DOMParser();
        const xml = parser.parseFromString(res.data, "text/xml");
        
        // Quick extraction of values
        const cells = Array.from(xml.getElementsByTagName("Value")).map(v => v.textContent);
        const captions = Array.from(xml.getElementsByTagName("Caption")).slice(1); // Skip measure name
        
        const formattedData = captions.map((cap, i) => ({
          category: cap.textContent,
          value: cells[i] ? parseFloat(cells[i]).toLocaleString() : "0"
        }));

        setRows(formattedData);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  return (
    <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-200">
      <h2 className="text-2xl font-bold mb-6 text-gray-800 flex items-center gap-2">
        💰 Sales Analysis <span className="text-xs font-normal text-gray-400 font-mono">MDX LIVE</span>
      </h2>

      <table className="w-full text-left border-collapse">
        <thead>
          <tr className="border-b-2 border-pink-100">
            <th className="py-3 px-4 text-gray-500 uppercase text-xs">Product Category</th>
            <th className="py-3 px-4 text-gray-500 uppercase text-xs text-right">Total Sales Amount</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={i} className="border-b hover:bg-pink-50 transition-colors">
              <td className="py-4 px-4 font-medium text-gray-700">{row.category}</td>
              <td className="py-4 px-4 text-right font-mono text-pink-600 font-bold">${row.value}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
