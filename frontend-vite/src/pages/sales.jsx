import React, { useState, useEffect } from 'react';
import axios from 'axios';

function SalesDataComponent() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchSalesData = async () => {
      try {
        setLoading(true);

        // FIX: Use the relative path. This relies on your Vite/CRA proxy 
        // to forward the request to http://localhost:8000.
        // Also, ensuring the correct route: /api/sales (as per your routes/api.php)
        const response = await axios.post('/api/sales'); 

        // Check if the received data is an array before setting state
        if (Array.isArray(response.data)) {
            setData(response.data);
            setError(null);
        } else {
            // This handles the unexpected output from the backend (like the debug string)
            console.error("Received unexpected non-array data:", response.data);
            throw new Error("Invalid data format received from API.");
        }

      } catch (err) {
        console.error("Error fetching OLAP data:", err);
        
        // Attempt to extract the error message from the response object
        const errorMessage = err.response && err.response.data && err.response.data.error
                           ? err.response.data.error
                           : "Failed to load SalesCube data. Check Laravel server logs.";
        
        setError(errorMessage);
        
      } finally {
        setLoading(false);
      }
    };

    fetchSalesData();
  }, []);

  if (loading) return <div className="loading-message">Loading Sales Data...</div>;

  if (error) return (
    <div style={{ color: 'red', border: '1px solid red', padding: '10px' }}>
      <h3>❌ Data Fetch Error</h3>
      <p>{error}</p>
      <p>Action: Check Laravel console for full traceback.</p>
    </div>
  );

  // Use the measure key from the parsed data for the header
  const measureKey = data.length > 0 ? data[0].measure : 'Measure Value';
  const cleanKey = measureKey.replace(/^_x005b_Measures_x005d_._x005b_Sales_x0020_Amount_x005d_/, 'Sales Amount').replace(/_x005b_/g, '[').replace(/_x005d_/g, ']');

  return (
    <div style={{ padding: '20px' }}>
      <h2>📊 SalesCube Analysis</h2>
      <p>Data successfully retrieved via XMLA.</p>

      <table border="1" cellPadding="8" style={{ borderCollapse: 'collapse' }}>
        <thead>
          <tr style={{ background: '#f0f0f0' }}>
            <th>#</th>
            <th>{cleanKey}</th>
          </tr>
        </thead>

        <tbody>
          {data.length === 0 ? (
            <tr>
              <td colSpan="2">No Data Returned (Valid but Empty Result Set)</td>
            </tr>
          ) : (
            data.map((item, index) => (
              <tr key={index}>
                <td>{index + 1}</td>
                <td>
                  {isNaN(item.value) 
                    ? item.value 
                    : Number(item.value).toLocaleString('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0 })
                  }
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}

export default SalesDataComponent;
