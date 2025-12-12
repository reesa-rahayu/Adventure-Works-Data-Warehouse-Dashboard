import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { Line } from 'react-chartjs-2';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend);

export default function ProductionDashboard() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [timeLevel, setTimeLevel] = useState('[Date].[Year]');
  const [measure, setMeasure] = useState('[Measures].[Order Quantity]');

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const response = await axios.post('/api/production', {
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

    fetchData();
  }, [timeLevel, measure]);

  if (loading) return <div>Loading Production Data...</div>;
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

  return (
    <div style={{ padding: '20px' }}>
      <h2>📊 ProductionCube Dashboard</h2>

      {/* Select Measure */}
      <div style={{ marginBottom: '20px' }}>
        <label>
          Measure:{' '}
          <select value={measure} onChange={(e) => setMeasure(e.target.value)}>
            <option value="[Measures].[Order Quantity]">Order Quantity</option>
            <option value="[Measures].[Stocked Quantity]">Stocked Quantity</option>
            <option value="[Measures].[Scrapped Quantity]">Scrapped Quantity</option>
            <option value="[Measures].[Planned Cost]">Planned Cost</option>
            <option value="[Measures].[Actual Cost]">Actual Cost</option>
            <option value="[Measures].[Resource Hours]">Resource Hours</option>
            <option value="[Measures].[Production Days]">Production Days</option>
          </select>
        </label>
        <label style={{ marginLeft: '20px' }}>
          Time Level:{' '}
          <select value={timeLevel} onChange={(e) => setTimeLevel(e.target.value)}>
            <option value="[Date].[Year]">Year</option>
            <option value="[Date].[Quarter]">Quarter</option>
            <option value="[Date].[Month]">Month</option>
          </select>
        </label>
      </div>

      {/* Chart */}
      <div style={{ maxWidth: '700px', marginBottom: '40px' }}>
        <Line data={chartData} options={{ responsive: true, plugins: { legend: { position: 'top' } } }} />
      </div>

      {/* Table */}
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
              <td>{Number(d.value).toLocaleString()}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
