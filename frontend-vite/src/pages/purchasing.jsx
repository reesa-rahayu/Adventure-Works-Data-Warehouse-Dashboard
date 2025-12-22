import React, { useState, useEffect } from "react";
import axios from "axios";
import { Pie, Line } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  ArcElement,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";

ChartJS.register(
  CategoryScale,
  LinearScale,
  ArcElement,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

export default function SalesDashboard() {
  const [categoryData, setCategoryData] = useState({ pieData: [], lineData: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [timeLevel, setTimeLevel] = useState("Month"); // align with backend
  const [measure, setMeasure] = useState("LineTotal"); // align with backend
  const [year, setYear] = useState("2014");
  const [years, setYears] = useState([]);

  // Fetch years for filter
  useEffect(() => {
    axios.get("/api/years").then((res) => setYears(res.data));
  }, []);

  // Fetch chart data
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);

        const res = await axios.post("/api/sales/by-category", {
          measure,
          time_level: timeLevel,
          year,
        });

        setCategoryData(res.data); // { pieData, lineData }

      } catch (err) {
        setError(err.response?.data?.error || err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [measure, timeLevel, year]);

  if (loading) return <div>Loading...</div>;
  if (error) return <div style={{ color: "red" }}>{error}</div>;

  // Pie chart
  const categoryChart = {
    labels: categoryData.pieData.map((d) => d.category),
    datasets: [
      {
        label: "Sales by Category",
        data: categoryData.pieData.map((d) => d.value),
        backgroundColor: [
          "#FF6384",
          "#36A2EB",
          "#FFCE56",
          "#4BC0C0",
          "#9966FF",
          "#FF9F40",
        ],
      },
    ],
  };

  // Line chart: one dataset per category
  const categories = [...new Set(categoryData.lineData.map((d) => d.category))];
  const times = [...new Set(categoryData.lineData.map((d) => d.time))].sort();

  const lineChart = {
    labels: times,
    datasets: categories.map((cat, index) => {
      const colorPalette = [
        "#FF6384",
        "#36A2EB",
        "#FFCE56",
        "#4BC0C0",
        "#9966FF",
        "#FF9F40",
      ];
      const data = times.map((t) => {
        const point = categoryData.lineData.find(
          (d) => d.category === cat && d.time === t
        );
        return point ? point.value : 0;
      });
      return {
        label: cat,
        data,
        borderColor: colorPalette[index % colorPalette.length],
        backgroundColor: colorPalette[index % colorPalette.length] + "33", // transparent fill
        fill: true,
        tension: 0.3,
      };
    }),
  };

  return (
    <div style={{ padding: "20px", display: "flex", flexDirection: "column", gap: "30px" }}>
      {/* Filters */}
      <div style={{ display: "flex", gap: "20px", marginBottom: "20px" }}>
        <div>
          <label>
            Measure:
            <select
              value={measure}
              onChange={(e) => setMeasure(e.target.value)}
              style={{ padding: "6px", marginLeft: "6px" }}
            >
              <option value="LineTotal">Sales Amount</option>
              <option value="TotalDue">Total Due</option>
              <option value="OrderQuantity">Order Quantity</option>
            </select>
          </label>
        </div>
        <div>
          <label>
            Time Level:
            <select
              value={timeLevel}
              onChange={(e) => setTimeLevel(e.target.value)}
              style={{ padding: "6px", marginLeft: "6px" }}
            >
              <option value="Year">Year</option>
              <option value="Quarter">Quarter</option>
              <option value="Month">Month</option>
            </select>
          </label>
        </div>
        {timeLevel !== "Year" && (
          <div>
            <label>
              Year:
              <select
                value={year}
                onChange={(e) => setYear(e.target.value)}
                style={{ padding: "6px", marginLeft: "6px" }}
              >
                {years.map((yr) => (
                  <option key={yr} value={yr}>{yr}</option>
                ))}
              </select>
            </label>
          </div>
        )}
      </div>

      {/* Charts */}
      <div style={{ display: "flex", gap: "20px" }}>
        <div style={{ flex: 1 }}>
          <h3>Sales by Product Category</h3>
          <Pie data={categoryChart} options={{ responsive: true }} />
        </div>
        <div style={{ flex: 2 }}>
          <h3>Sales Trend by Category</h3>
          <Line
            data={lineChart}
            options={{
              responsive: true,
              plugins: { legend: { position: "top" } },
              scales: { y: { stacked: true }, x: { stacked: true } },
            }}
          />
        </div>
      </div>
    </div>
  );
}
