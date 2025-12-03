export default function Table() {
    const rows = [
      ["Mountain-200 Black, 42", "Bikes", "1,245", "$2,489,500", "38.5%"],
      ["Road-150 Red, 62", "Bikes", "987", "$1,974,000", "41.2%"],
      ["Mountain-100 Silver, 38", "Bikes", "856", "$1,712,000", "39.8%"],
      ["AWC Logo Cap", "Accessories", "3,421", "$68,420", "65.3%"],
      ["Sport-100 Helmet, Blue", "Accessories", "2,987", "$89,610", "58.7%"],
    ];
  
    return (
      <table className="w-full border-collapse">
        <thead>
          <tr className="bg-indigo-50 text-indigo-600">
            <th className="p-3 text-left">Product Name</th>
            <th className="p-3 text-left">Category</th>
            <th className="p-3 text-left">Units Sold</th>
            <th className="p-3 text-left">Revenue</th>
            <th className="p-3 text-left">Profit Margin</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <tr key={i} className="border-b hover:bg-gray-50">
              {r.map((cell, j) => (
                <td key={j} className="p-3">{cell}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    );
}