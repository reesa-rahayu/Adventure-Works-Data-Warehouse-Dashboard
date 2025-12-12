import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Line } from 'react-chartjs-2';
import { Bar } from 'react-chartjs-2';
import { Pie } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, BarElement, ArcElement, Title, Tooltip, Legend } from 'chart.js';

ChartJS.register(
  CategoryScale, LinearScale, PointElement, LineElement, BarElement, ArcElement, Title, Tooltip, Legend
);

export default function SalesDashboard() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [timeLevel, setTimeLevel] = useState('[Date].[Year]');
  const [measure, setMeasure] = useState('[Measures].[Sales Amount]');
  const [topProductsData, setTopProductsData] = useState([]);
  const [topCustomersData, setTopCustomersData] = useState([]);
  const [topSalespeopleData, setTopSalespeopleData] = useState([]);

  // Fetch sales data
  useEffect(() => {
    const fetchSalesData = async () => {
      try {
        setLoading(true);
        const response = await axios.post('/api/sales', {
          measures: [measure],
          time_level: timeLevel,
        });
        if (Array.isArray(response.data)) setData(response.data);
        else throw new Error('Invalid API response');
      } catch (err) {
        setError(err.response?.data?.error || err.message);
      } finally {
        setLoading(false);
      }
    };

    const fetchTopProducts = async () => {
      const response = await axios.post('/api/sales/top-products', {
        measures: ['[Measures].[Sales Amount]'],
        time_level: '[Date].[Year]',
      });
      setTopProductsData(response.data);
    };

    const fetchTopCustomers = async () => {
      const response = await axios.post('/api/sales/top-customers', {
        measures: ['[Measures].[Sales Amount]'],
        time_level: '[Date].[Year]',
      });
      setTopCustomersData(response.data);
    };

    const fetchTopSalespeople = async () => {
      const response = await axios.post('/api/sales/top-salespeople', {
        measures: ['[Measures].[Sales Amount]'],
        time_level: '[Date].[Year]',
      });
      setTopSalespeopleData(response.data);
    };

    fetchSalesData();
    fetchTopProducts();
    fetchTopCustomers();
    fetchTopSalespeople();
  }, [timeLevel, measure]);

  if (loading) return <div>Loading Sales Data...</div>;
  if (error) return <div style={{ color: 'red' }}>{error}</div>;

  const labels = data.map((d) => d.measure);
  const values = data.map((d) => d.value);

  const chartData = {
    labels,
    datasets: [
      {
        label: measure.replace('[Measures].', ''),
        data: values,
        borderColor: 'rgba(75,192,192,1)',
        backgroundColor: 'rgba(75,192,192,0.2)',
        fill: true,
        tension: 0.3,
      },
    ],
  };

  const topProductsChartData = {
    labels: topProductsData.map((d) => d.product),
    datasets: [
      {
        label: 'Sales Amount',
        data: topProductsData.map((d) => d.value),
        backgroundColor: 'rgba(75,192,192,0.6)',
      },
    ],
  };

  const topCustomersChartData = {
    labels: topCustomersData.map((d) => d.customer),
    datasets: [
      {
        label: 'Sales Amount',
        data: topCustomersData.map((d) => d.value),
        backgroundColor: 'rgba(54, 162, 235, 0.6)',
      },
    ],
  };

  const topSalespeopleChartData = {
    labels: topSalespeopleData.map((d) => d.salesperson),
    datasets: [
      {
        data: topSalespeopleData.map((d) => d.value),
        backgroundColor: ['#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0'],
        hoverOffset: 4,
      },
    ],
  };

  return (
    <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '30px' }}>

      {/* Main Dashboard Layout */}
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: '20px' }}>

        {/* LEFT SIDE - MAIN CHART AREA */}
        <div style={{ 
          flex: 1, display: 'flex', flexDirection: 'column', gap: '20px',
          background: '#ffffff',
          padding: '20px',
          borderRadius: '12px',
          boxShadow: '0 4px 12px rgba(0,0,0,0.08)'}}>

          {/* FILTER CARD */}
          
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: '20px' }}>
              
              <div style={{ flex: 1 }}>
                <label>
                  Measure:{' '}
                  <select
                    value={measure}
                    onChange={(e) => setMeasure(e.target.value)}
                    style={{
                      padding: '8px',
                      borderRadius: '6px',
                      width: '100%',
                      border: '1px solid #ccc'
                    }}
                  >
                    <option value="[Measures].[Sales Amount]">Sales Amount</option>
                    <option value="[Measures].[Total Due]">Total Due</option>
                    <option value="[Measures].[Order Quantity]">Order Quantity</option>
                  </select>
                </label>
              </div>

              <div style={{ flex: 1 }}>
                <label>
                  Time Level:{' '}
                  <select
                    value={timeLevel}
                    onChange={(e) => setTimeLevel(e.target.value)}
                    style={{
                      padding: '8px',
                      borderRadius: '6px',
                      width: '100%',
                      border: '1px solid #ccc'
                    }}
                  >
                    <option value="[Date].[Year]">Year</option>
                    <option value="[Date].[Quarter]">Quarter</option>
                    <option value="[Date].[Month]">Month</option>
                  </select>
                </label>
              </div>

            </div>

          {/* MAIN LINE CHART CARD */}
          <div style={{

            width: '100%'
          }}>
            <h3 style={{ marginBottom: '10px' }}>Sales Trend</h3>
            <Line data={chartData} options={{ responsive: true, plugins: { legend: { position: 'top' } } }} />
          </div>

        </div>

        {/* RIGHT SIDE - LEADERBOARD CARDS */}
        <div style={{
          width: '32%',
          display: 'flex',
          flexDirection: 'column',
          gap: '20px'
        }}>
          
          {/* TOP PRODUCTS */}
          <div style={{
            background: '#ffffff',
            padding: '20px',
            borderRadius: '12px',
            boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
          }}>
            <h3>Top Products</h3>
            <Bar data={topProductsChartData} options={{ responsive: true }} />
          </div>

          {/* TOP CUSTOMERS */}
          <div style={{
            background: '#ffffff',
            padding: '20px',
            borderRadius: '12px',
            boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
          }}>
            <h3>Top Customers</h3>
            <Bar data={topCustomersChartData} options={{ responsive: true }} />
          </div>

          {/* TOP SALESPEOPLE */}
          <div style={{
            background: '#ffffff',
            padding: '20px',
            borderRadius: '12px',
            boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
          }}>
            <h3>Top Salespeople</h3>
            <Pie data={topSalespeopleChartData} options={{ responsive: true }} />
          </div>

        </div>
      </div>

      {/* DATA TABLE CARD */}
      <div style={{
        background: '#ffffff',
        padding: '20px',
        borderRadius: '12px',
        boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
      }}>
        <h3>{measure.replace('[Measures].', '')} Data</h3>
        <table border="1" cellPadding="8" style={{ borderCollapse: 'collapse', width: '100%' }}>
          <thead style={{ background: '#f0f0f0' }}>
            <tr>
              <th>#</th>
              <th>{measure.replace('[Measures].', '')}</th>
            </tr>
          </thead>
          <tbody>
            {data.map((d, idx) => (
              <tr key={idx}>
                <td>{idx + 1}</td>
                <td>${Number(d.value).toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
