import React, { useState, useEffect } from 'react';
import axios from 'axios';

function SalesDataComponent() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Panggil endpoint Laravel Anda
        const response = await axios.get('/api/analytics/sales-data'); 
        
        // Asumsi data yang dikembalikan Laravel adalah array yang siap ditampilkan
        setData(response.data);
        setError(null);

      } catch (err) {
        console.error("Error fetching OLAP data:", err);
        setError("Failed to load OLAP data. Check Laravel and Mondrian logs.");
        // Anda bisa mengambil pesan error dari response.data jika ada
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []); // Run only once on component mount

  if (loading) return <div>Loading Sales Data...</div>;
  if (error) return <div style={{ color: 'red' }}>Error: {error}</div>;

  return (
    <div>
      <h2>SalesCube Analysis (from Laravel/Mondrian)</h2>
      
      {/* PERINGATAN: Karena fungsi parseXmlaResponse di Laravel 
        mengembalikan data sel mentah (array of objects with 'value'), 
        kita hanya menampilkan daftar nilai.
      */}
      
      <table>
        <thead>
          <tr>
            <th>Value</th>
          </tr>
        </thead>
        <tbody>
          {data.map((item, index) => (
            <tr key={index}>
              <td>{item.value}</td>
            </tr>
          ))}
        </tbody>
      </table>
      
      {/* Untuk visualisasi yang layak (tabel pivot, chart), 
        Anda harus menggunakan library charting React dan 
        memperbaiki logic parsing di Laravel untuk menghasilkan 
        struktur data yang lebih rapi (misalnya, array of rows: 
        [{ date: '2024', product: 'Bike', sales: 1000 }, ...] 
      */}
      
    </div>
  );
}

export default SalesDataComponent;
