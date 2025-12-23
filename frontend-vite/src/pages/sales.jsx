import React, { useState, useEffect } from "react";
import axios from "axios";
import { Line, Bar, Pie } from "react-chartjs-2";
import {
  Chart as ChartJS, CategoryScale, LinearScale, PointElement,
  LineElement, BarElement, Title, Tooltip, Legend, Filler, ArcElement
} from "chart.js";

ChartJS.register(
  CategoryScale, LinearScale, PointElement, LineElement, 
  BarElement, Title, Tooltip, Legend, Filler, ArcElement
);

// Theme Constants
const ACCENT_PINK = "#F8BBD0";
const DEEP_PINK = "#F06292";
const GREY_CHART = "#CBD5E0";
const PURPLE_HINT = "#8460FB";

const cardStyle = {
  background: "#ffffff", padding: "24px", borderRadius: "20px",
  boxShadow: "0 10px 25px -5px rgba(248, 187, 208, 0.15)", border: "1px solid #FDF2F5",
};

export default function SalesDashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [year, setYear] = useState(2014);
  
  const [selectedCategory, setSelectedCategory] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const res = await axios.get(`/api/sales-data?year=${year}`);
        setData(res.data);
      } catch (err) {
        console.error("Dashboard Fetch Error:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [year]);

  if (loading || !data) return <div style={loaderStyle}>Loading AdventureWorks Sales...</div>;

  const commonOptions = { responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'bottom' } } };

  const displayTrends = selectedCategory 
    ? data.lineData.filter(d => d.category === selectedCategory)
    : data.monthlyTrends;

  return (
    <div style={{ minHeight: "100vh" }}>
      {/* HEADER */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "30px" }}>
        <h1 style={{ fontSize: "26px", fontWeight: "800", color: "#2D3748" }}>Sales Analysis</h1>
        <select value={year} onChange={(e) => setYear(e.target.value)} style={selectStyle}>
          {[2011, 2012, 2013, 2014].map(y => <option key={y} value={y}>{y}</option>)}
        </select>
      </div>

      {/* KPI SECTION */}
      <div style={grid4Style}>
        <StatCard title="Total Revenue" value={`$${(data.kpis.totalRevenue / 1000000).toFixed(2)}M`} unit="YTD" />
        <StatCard title="Units Sold" value={data.kpis.totalQty?.toLocaleString()} unit="Items" />
        <StatCard title="Avg Deal Size" value={`$${Math.round(data.kpis.avgOrderValue)}`} unit="USD" />
        <StatCard title="Shipping/Freight" value={`$${(data.kpis.totalFreight / 1000).toFixed(1)}k`} unit="Cost" />
      </div>

      {/* MAIN TREND & CATEGORY PIE */}
      <div style={grid2_1Style}>
        <div style={cardStyle}>
          <h3 style={chartTitleStyle}>
            Monthly Performance Trend {selectedCategory ? `- ${selectedCategory}` : "(All Categories)"}
          </h3>
          <div style={{ height: "350px", position: "relative" }}>
            <Line 
              options={{
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                  y: { stacked: true, title: { display: true, text: 'USD ($)' } },
                  y1: { 
                    type: 'linear', display: true, position: 'right', 
                    grid: { drawOnChartArea: false },
                    title: { display: true, text: 'Quantity (Units)' }
                  }
                },
                plugins: { legend: { position: 'bottom' } }
              }}
              data={{
                labels: displayTrends.map(m => m.MonthName || m.time),
                datasets: [
                  {
                    label: "Sales Amount",
                    data: displayTrends.map(m => m.sales || m.sales_amount),
                    borderColor: DEEP_PINK, backgroundColor: 'rgba(240, 98, 146, 0.4)', fill: true, yAxisID: 'y'
                  },
                  {
                    label: "Total Due",
                    data: displayTrends.map(m => m.revenue || m.total_due),
                    borderColor: PURPLE_HINT, backgroundColor: 'rgba(132, 96, 251, 0.4)', fill: true, yAxisID: 'y'
                  },
                  {
                    label: "Order Qty",
                    data: displayTrends.map(m => m.totalQty || m.order_qty),
                    borderColor: "#4A5568", backgroundColor: 'transparent', fill: false, yAxisID: 'y1', borderDash: [5, 5]
                  }
                ]
              }}
            />
          </div>
        </div>

        <div style={cardStyle}>
          <h3 style={chartTitleStyle}>Category Share (Click to Filter)</h3>
          <div style={{ height: "350px", position: "relative" }}>
            <Pie 
              data={{
                labels: data.categories.map(c => c.CategoryName),
                datasets: [{ 
                  data: data.categories.map(c => c.total), 
                  backgroundColor: [DEEP_PINK, ACCENT_PINK, GREY_CHART, PURPLE_HINT],
                  borderWidth: selectedCategory ? 5 : 1,
                  borderColor: "#fff"
                }]
              }}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                onClick: (evt, element) => {
                  if (element.length > 0) {
                    const index = element[0].index;
                    setSelectedCategory(data.categories[index].CategoryName);
                  } else {
                    setSelectedCategory(null);
                  }
                },
                plugins: { legend: { position: 'bottom' } }
              }}
            />
          </div>
        </div>
      </div>

      {/* TERRITORY & LEADERBOARDS */}
      <div style={{ ...grid2_1Style, marginTop: "24px" }}>
        <div style={cardStyle}>
          <h3 style={chartTitleStyle}>Territory Performance</h3>
          <div style={{ height: "350px", position: "relative" }}>
            <Bar 
              options={{ ...commonOptions, indexAxis: 'y' }}
              data={{
                labels: data.territories.map(t => t.TerritoryName),
                datasets: [{ label: "Total Sales", data: data.territories.map(t => t.value), backgroundColor: ACCENT_PINK }]
              }}
            />
          </div>
        </div>
        
        <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
           <LeaderboardTable title="Top Salespeople" rows={data.leaderboards.salespeople} />
           <LeaderboardTable title="Top Customers" rows={data.leaderboards.customers} />
        </div>
      </div>

      {/* PRODUCT PROFITABILITY TABLE */}
      <h2 style={{ ...sectionHeaderStyle, marginTop: "40px" }}>🏆 Top Product Performance</h2>
      <div style={cardStyle}>
        <table style={tableStyle}>
          <thead>
            <tr style={{ borderBottom: `2px solid ${ACCENT_PINK}` }}>
              <th>Product</th>
              <th>Category</th>
              <th style={{ textAlign: 'right' }}>Units</th>
              <th style={{ textAlign: 'right' }}>Amount</th>
              <th style={{ textAlign: 'right' }}>Margin</th>
            </tr>
          </thead>
          <tbody>
            {data.products.map((p, i) => (
              <tr key={i} style={{ borderBottom: '1px solid #F7FAFC' }}>
                <td style={{ padding: "12px 0", fontWeight: "600" }}>{p.product}</td>
                <td>{p.category}</td>
                <td style={{ textAlign: 'right' }}>{p.units_sold}</td>
                <td style={{ textAlign: 'right', color: DEEP_PINK, fontWeight: "700" }}>${Number(p.total_amount).toLocaleString()}</td>
                <td style={{ textAlign: 'right', color: p.profit_margin > 0 ? "green" : "red" }}>{p.profit_margin}%</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// Sub-components for cleaner code
function StatCard({ title, value, unit }) {
  return (
    <div style={cardStyle}>
      <p style={{ color: "#718096", fontSize: "14px", marginBottom: "8px" }}>{title}</p>
      <div style={{ display: "flex", alignItems: "baseline", gap: "8px" }}>
        <h2 style={{ fontSize: "24px", fontWeight: "700", margin: 0 }}>{value}</h2>
        <span style={{ color: "#A0AEC0", fontSize: "12px" }}>{unit}</span>
      </div>
    </div>
  );
}

function LeaderboardTable({ title, rows }) {
  return (
    <div style={cardStyle}>
      <h4 style={{ margin: "0 0 15px 0", fontSize: "16px" }}>{title}</h4>
      {rows.map((r, i) => (
        <div key={i} style={{ display: "flex", justifyContent: "space-between", padding: "8px 0", borderBottom: "1px solid #FDF2F5" }}>
          <span style={{ fontSize: "14px" }}>{r.name}</span>
          <span style={{ fontWeight: "700", color: DEEP_PINK }}>${Number(r.value).toLocaleString()}</span>
        </div>
      ))}
    </div>
  );
}

// Helper Styles
const loaderStyle = { textAlign: "center", padding: "100px", color: DEEP_PINK, fontSize: "20px", fontWeight: "bold" };
const chartTitleStyle = { marginBottom: "15px", fontSize: "16px", fontWeight: "600", color: "#4A5568" };
const grid4Style = { display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "20px", marginBottom: "24px" };
const grid2Style = { display: "grid", gridTemplateColumns: "1fr 1fr", gap: "24px" };
const grid2_1Style = { display: "grid", gridTemplateColumns: "2fr 1fr", gap: "24px" };
const sectionHeaderStyle = { fontSize: "20px", fontWeight: "800", color: "#2D3748" };
const selectStyle = { padding: "8px 16px", borderRadius: "10px", border: "1px solid #E2E8F0", cursor: "pointer" };
const tableStyle = { width: "100%", borderCollapse: "collapse", fontSize: "14px" };