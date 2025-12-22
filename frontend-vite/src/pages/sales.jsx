import React, { useState, useEffect } from "react";
import axios from "axios";
import { Pie, Line, Bar } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  ArcElement,
  BarElement,
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
  BarElement,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

export default function SalesDashboard() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [timeLevel, setTimeLevel] = useState("[Date].[Year]");
  const [measure, setMeasure] = useState("[Measures].[Sales Amount]");
  const [year, setYear] = useState("All");

  const [topProducts, setTopProducts] = useState([]);
  const [topCustomers, setTopCustomers] = useState([]);
  const [topSalespeople, setTopSalespeople] = useState([]);
  const [years, setYears] = useState([]);
  const [categoryData, setCategoryData] = useState({ pieData: [], lineData: [] });
  const [categoryYear, setCategoryYear] = useState("");
  const [categoryMeasure, setCategoryMeasure] = useState("[Measures].[Sales Amount]");
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [territoryData, setTerritoryData] = useState([]);
  const [territoryMeasure, setTerritoryMeasure] = useState("[Measures].[Sales Amount]");
  const [territoryYear, setTerritoryYear] = useState("");

  // Fetch available years
  useEffect(() => {
    axios.get("/api/years").then((res) => {
      setYears(res.data);
      // Default the category section year selector to the latest year
      if (res.data.length > 0) {
        const latestYear = String(res.data[res.data.length - 1]);
        setCategoryYear(latestYear);
        setTerritoryYear(latestYear);
      }
    });
  }, []);

  // Fetch main + leaderboard data
  useEffect(() => {
    const effectiveYear = timeLevel === "[Date].[Year]" ? null : year !== "All" ? year : null;

    const fetchSales = async () => {
      try {
        setLoading(true);

        const response = await axios.post("/api/sales", {
          measures: [measure],
          time_level: timeLevel,
          year: effectiveYear,
        });

        if (Array.isArray(response.data)) setData(response.data);
        else throw new Error("Invalid API response");
      } catch (err) {
        setError(err.response?.data?.error || err.message);
      } finally {
        setLoading(false);
      }
    };

    const fetchLeaderboards = async () => {
      const payload = {
        time_level: timeLevel,
        year: effectiveYear,
      };

      setTopProducts((await axios.post("/api/sales/top-products", payload)).data);
      setTopCustomers((await axios.post("/api/sales/top-customers", payload)).data);
      setTopSalespeople((await axios.post("/api/sales/top-salesperson", payload)).data);
    };

    fetchSales();
    fetchLeaderboards();
  }, [measure, timeLevel, year]);

  // Fetch category pie + monthly trend data (for bottom pie + bar charts)
  // and sales by territory summary data
  useEffect(() => {
    if (!categoryYear) return;

    const fetchData = async () => {
      try {
        setLoading(true);

        const [categoryRes, territoryRes] = await Promise.all([
          axios.post("/api/sales/by-category", {
            measure: categoryMeasure,
            // Always use monthly breakdown for the bottom bar chart
            time_level: "[Date].[Month]",
            year: categoryYear,
          }),
          axios.post("/api/sales/by-territory", {
            measure: territoryMeasure,
            year: territoryYear, // Use the new territoryYear state
          }),
        ]);

        setCategoryData(categoryRes.data); // { pieData, lineData }
        setTerritoryData(territoryRes.data); // [{ territory, value }, ...]

      } catch (err) {
        setError(err.response?.data?.error || err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [categoryMeasure, territoryMeasure, categoryYear, territoryYear]); 

  if (loading) return <div>Loading...</div>;
  if (error) return <div style={{ color: "red" }}>{error}</div>;

  const chartData = {
    labels: data.map((d) => d.measure),
    datasets: [
      {
        label: measure.replace("[Measures].", ""),
        data: data.map((d) => d.value),
        borderColor: "rgba(75,192,192,1)",
        backgroundColor: "rgba(75,192,192,0.2)",
        fill: true,
        tension: 0.3,
      },
    ],
  };

  const renderTable = (title, rows, nameKey) => (
    <div
      style={{
        background: "#ffffff",
        padding: "20px",
        borderRadius: "12px",
        boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
      }}
    >
      <h3>{title}</h3>
      <table style={{ width: "100%", borderCollapse: "collapse" }}>
        <thead>
          <tr style={{ background: "#f0f0f0" }}>
            <th>#</th>
            <th>Name</th>
            <th>Amount</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row, idx) => (
            <tr key={idx}>
              <td>{idx + 1}</td>
              <td>{row[nameKey]}</td>
              <td>${Number(row.value).toLocaleString()}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );

  const renderProductTable = (title, rows) => (
    <div
      style={{
        background: "#ffffff",
        padding: "20px",
        borderRadius: "12px",
        boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
        marginTop: "30px", // Separate the product table visually
      }}
    >
      <h3>{title}</h3>
      <table style={{ width: "100%", borderCollapse: "collapse", marginTop: "15px" }}>
        <thead>
          <tr style={{ background: "#f0f0f0" }}>
            <th style={{ padding: "10px", textAlign: 'left' }}>#</th>
            <th style={{ padding: "10px", textAlign: 'left' }}>Product</th>
            <th style={{ padding: "10px", textAlign: 'left' }}>Category</th>
            <th style={{ padding: "10px", textAlign: 'right' }}>Units Sold</th>
            <th style={{ padding: "10px", textAlign: 'right' }}>Total Sales Amount</th>
            <th style={{ padding: "10px", textAlign: 'right' }}>Profit Margin</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row, idx) => (
            <tr key={idx} style={{ borderBottom: '1px solid #eee' }}>
              <td style={{ padding: "10px", textAlign: 'left' }}>{idx + 1}</td>
              <td style={{ padding: "10px", textAlign: 'left', fontWeight: 'bold' }}>{row.product}</td>
              <td style={{ padding: "10px", textAlign: 'left' }}>{row.category}</td>
              <td style={{ padding: "10px", textAlign: 'right' }}>{Number(row.units_sold).toLocaleString()}</td>
              <td style={{ padding: "10px", textAlign: 'right', color: '#007bff' }}>
                ${Number(row.total_amount).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </td>
              <td style={{ padding: "10px", textAlign: 'right', color: row.profit_margin < 0 ? 'red' : 'green' }}>
                {Number(row.profit_margin).toFixed(2)}%
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );

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

  // Match bar color with pie color (for selected category, or default)
  const pieColors = categoryChart.datasets[0].backgroundColor;
  let categoryBarColor = "#36A2EB";
  if (selectedCategory) {
    const idx = categoryChart.labels.indexOf(selectedCategory);
    if (idx !== -1) {
      categoryBarColor = pieColors[idx % pieColors.length];
    }
  } else if (pieColors && pieColors.length > 0) {
    categoryBarColor = pieColors[0];
  }

  // Bar chart: monthly view over the selected year (per category) for selected measure
  const monthlyLabels = [];
  const monthlyTotals = {};

  categoryData.lineData.forEach((d) => {
    // If a category is selected from the pie chart, filter to that category
    if (selectedCategory && d.category !== selectedCategory) return;

    const time = d.time;
    if (!monthlyLabels.includes(time)) {
      monthlyLabels.push(time);
    }

    const value = Number(d.value) || 0;

    monthlyTotals[time] = (monthlyTotals[time] || 0) + value;
  });

  const prettyCategoryMeasure = categoryMeasure.replace("[Measures].[", "").replace("]", "");

  const categoryBarChart = {
    labels: monthlyLabels,
    datasets: [
      {
        label: selectedCategory
          ? `${prettyCategoryMeasure} (${selectedCategory})`
          : prettyCategoryMeasure,
        data: monthlyLabels.map((label) => monthlyTotals[label] || 0),
        backgroundColor: categoryBarColor,
      },
    ],
  };  

  // "Sales by Territory" bar chart using territory data
  const prettyTerritoryMeasure = territoryMeasure
    .replace("[Measures].[", "")
    .replace("]", "");

  const salesByTerritoryChart = {
    labels: territoryData.map((d) => d.territory),
    datasets: [
      {
        label: `${prettyTerritoryMeasure} by Territory`,
        data: territoryData.map((d) => d.value),
        backgroundColor: "#4BC0C0",
      },
    ],
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "30px" }}>
      
      <div style={{ display: "flex", justifyContent: "space-between", gap: "20px" }}>

        {/* LEFT CHART */}
        <div
          style={{
            flex: 1,
            background: "#ffffff",
            padding: "20px",
            borderRadius: "12px",
            boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
            display: "flex",
            flexDirection: "column",
            gap: "20px",
          }}
        >
          <h3>Sales Trend</h3>

          {/* FILTERS */}
          <div style={{ display: "flex", gap: "20px" }}>

            {/* MEASURE */}
            <div style={{ flex: 1 }}>
              <label>Measure:
                <select
                  value={measure}
                  onChange={(e) => setMeasure(e.target.value)}
                  style={{ width: "100%", padding: "8px" }}
                >
                  <option value="[Measures].[Sales Amount]">Sales Amount</option>
                  <option value="[Measures].[Total Due]">Total Due</option>
                  <option value="[Measures].[Order Quantity]">Order Quantity</option>
                </select>
              </label>
            </div>

            {/* TIME LEVEL */}
            <div style={{ flex: 1 }}>
              <label>Time Level:
                <select
                  value={timeLevel}
                  onChange={(e) => {
                    setTimeLevel(e.target.value);
                    if (e.target.value === "[Date].[Year]") {
                      setYear("All");
                    }
                  }}
                  style={{ width: "100%", padding: "8px" }}
                >
                  <option value="[Date].[Year]">Year</option>
                  <option value="[Date].[Quarter]">Quarter</option>
                  <option value="[Date].[Month]">Month</option>
                </select>
              </label>
            </div>

            {/* YEAR FILTER — only for Quarter/Month */}
            {timeLevel !== "[Date].[Year]" && (
              <div style={{ flex: 1 }}>
                <label>Year:
                  <select
                    value={year}
                    onChange={(e) => setYear(e.target.value)}
                    style={{ width: "100%", padding: "8px" }}
                  >
                    <option value="All">All</option>
                    {years.map((yr) => (
                      <option key={yr} value={yr}>{yr}</option>
                    ))}
                  </select>
                </label>
              </div>
            )}

          </div>

          {/* LINE CHART */}
          <Line data={chartData} options={{ responsive: true }} />
        </div>

        {/* RIGHT - LEADERBOARDS */}
        <div style={{ width: "35%", display: "flex", flexDirection: "column", gap: "20px" }}>
          {renderTable(
            timeLevel !== "[Date].[Year]" && year !== "All"
              ? `Top Customers ${year}`
              : "Top Customers (All Time)",
            topCustomers,
            "customer"
          )}
          {renderTable(
            timeLevel !== "[Date].[Year]" && year !== "All"
              ? `Top Sales Person ${year}`
              : "Top Sales Person (All Time)",
            topSalespeople,
            "salesperson"
          )}
        </div>
      </div>
      <div style={{ 
            background: "#ffffff",
            padding: "20px",
            borderRadius: "12px",
            boxShadow: "0 4px 12px rgba(0,0,0,0.08)", }}>
        <div style={{ padding: "20px", display: "flex", flexDirection: "column", gap: "30px" }}>
          {/* Filters for category pie + monthly bar charts */}
          <div style={{ marginBottom: "10px", display: "flex", gap: "16px" }}>
            <div>
              <label>
                Year:&nbsp;
                <select
                  value={categoryYear}
                  onChange={(e) => setCategoryYear(e.target.value)}
                  style={{ padding: "6px" }}
                >
                  {years.map((yr) => (
                    <option key={yr} value={yr}>{yr}</option>
                  ))}
                </select>
              </label>
            </div>
            <div>
              <label>
                Measure:&nbsp;
                <select
                  value={categoryMeasure}
                  onChange={(e) => setCategoryMeasure(e.target.value)}
                  style={{ padding: "6px" }}
                >
                  <option value="[Measures].[Sales Amount]">Sales Amount</option>
                  <option value="[Measures].[Total Due]">Total Due</option>
                  <option value="[Measures].[Order Quantity]">Order Quantity</option>
                </select>
              </label>
            </div>
          </div>
          {/* Charts */}
          <div style={{ display: "flex", gap: "20px" }}>
            <div style={{ flex: 1 }}>
              <h3>Sales by Product Category</h3>
              <Pie
                data={categoryChart}
                options={{
                  responsive: true,
                  plugins: {
                    legend: {
                      position: "top",
                    },
                  },
                  onClick: (event, elements) => {
                    if (!elements || elements.length === 0) {
                      setSelectedCategory(null);
                      return;
                    }
                    const sliceIndex = elements[0].index;
                    const category = categoryChart.labels[sliceIndex];
                    setSelectedCategory(category);
                  },
                }}
              />
            </div>
            <div style={{ flex: 2 }}>
            <h3>
              {selectedCategory
                ? `${selectedCategory} Sales ${categoryYear}`
                : `Category Sales ${categoryYear}`}
            </h3>
              <Bar
                data={categoryBarChart}
                options={{
                  responsive: true,
                  plugins: { legend: { position: "top" } },
                  scales: {
                    y: { beginAtZero: true },
                  },
                }}
              />
            </div>
          </div>
        </div>
      </div>
      {/* Sales by Territory section */}
<div
  style={{
    marginTop: "20px",
    background: "#ffffff",
    padding: "20px",
    borderRadius: "12px",
    boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
  }}
>
  <div
    style={{
      marginBottom: "10px",
      display: "flex",
      gap: "16px",
      alignItems: "center",
      justifyContent: "space-between",
    }}
  >
    <h3 style={{ margin: 0 }}>
      {prettyTerritoryMeasure} by Territory ({territoryYear})
    </h3>
    <div style={{ display: "flex", gap: "10px" }}>
      {/* NEW YEAR FILTER FOR TERRITORY */}
      <div>
        <label>
          Year:&nbsp;
          <select
            value={territoryYear}
            onChange={(e) => setTerritoryYear(e.target.value)}
            style={{ padding: "6px" }}
          >
            {years.map((yr) => (
              <option key={yr} value={yr}>{yr}</option>
            ))}
          </select>
        </label>
      </div>
      <div>
        <label>
          Measure:&nbsp;
          <select
            value={territoryMeasure}
            onChange={(e) => setTerritoryMeasure(e.target.value)}
            style={{ padding: "6px" }}
          >
            <option value="[Measures].[Sales Amount]">Sales Amount</option>
            <option value="[Measures].[Total Due]">Total Due</option>
            <option value="[Measures].[Order Quantity]">Order Quantity</option>
            <option value="[Measures].[Tax Amount]">Tax Amount</option>
            <option value="[Measures].[Freight]">Freight</option>
          </select>
        </label>
      </div>
    </div>
  </div>
  <div style={{ height: "320px" }}>
    <Bar
      data={salesByTerritoryChart}
      options={{
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { position: "top" } },
        scales: {
          y: { beginAtZero: true },
        },
      }}
    />
  </div>
</div>

      {renderProductTable("🏆 Top 10 Products", topProducts)}
    </div>
  );
}