import React, { useState, useEffect } from "react";
import axios from "axios";
import { Line, Bar, Doughnut, Scatter } from "react-chartjs-2";
import {
  Chart as ChartJS, CategoryScale, LinearScale, PointElement,
  LineElement, BarElement, Title, Tooltip, Legend, Filler, ArcElement,
} from "chart.js";

ChartJS.register(
  CategoryScale, LinearScale, PointElement, LineElement, 
  BarElement, Title, Tooltip, Legend, Filler, ArcElement
);

// Colors & Styles (as defined in your prompt)
const ACCENT_PINK = "#F8BBD0";
const DEEP_PINK = "#F06292";
const GREY_CHART = "#CBD5E0";
const PURPLE_HINT = "#8460FB";
const cardStyle = {
  background: "#ffffff", padding: "24px", borderRadius: "20px",
  boxShadow: "0 10px 25px -5px rgba(248, 187, 208, 0.15)", border: "1px solid #FDF2F5",
};

export default function ExecutiveDashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [year, setYear] = useState(2014);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const response = await axios.get(`/api/dashboard?year=${year}`);
        setData(response.data);
      } catch (error) {
        console.error("Error fetching dashboard data:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [year]);

  if (loading || !data) return <div style={{ textAlign: "center", padding: "100px", color: DEEP_PINK }}>Loading AdventureWorks Data...</div>;
    
  const commonOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
        legend: { position: 'bottom' }
    }
  };  

  return (
    <div>
      {/* HEADER WITH YEAR FILTER */}
      <header style={{ display: "flex", justifyContent: "space-between", marginBottom: "30px" }}>
        <h1 style={{ fontSize: "26px", fontWeight: "800", color: "#2D3748" }}>Executive Dashboard</h1>
        <select value={year} onChange={(e) => setYear(e.target.value)} style={selectStyle}>
          <option value="2011">2011</option>
          <option value="2012">2012</option>
          <option value="2013">2013</option>
          <option value="2014">2014</option>
        </select>
      </header>

      {/* SECTION 1: SALES */}
      <h2 style={sectionHeaderStyle}>Sales & Revenue Analysis</h2>
      <div style={grid4Style}>
        <StatCard title="Total Revenue" value={`$${(data.salesKpis.totalRevenue / 1000000).toFixed(2)}M`} unit="YTD" />
        <StatCard title="Avg Order Value" value={`$${Math.round(data.salesKpis.avgOrderValue)}`} unit="per Deal" />
        <StatCard title="Sales Volume" value={data.salesKpis.totalQty?.toLocaleString()} unit="Units" />
        <StatCard title="Scrap Rate" value={`${data.productionStats.scrapRate}%`} badge="Quality" badgeColor={data.productionStats.scrapRate > 2 ? "#FEB2B2" : "#C6F6D5"} />
      </div>

      <div style={grid2_1Style}>
        <div style={cardStyle}>
          <h3>Monthly Financial Trend (Revenue vs Expense)</h3>
          <div style={{ height: "300px" }}>
            <Line 
              data={{
                labels: data.monthlyTrends.map(m => m.month),
                datasets: [
                  { label: "Revenue", data: data.monthlyTrends.map(m => m.revenue), borderColor: DEEP_PINK, backgroundColor: 'rgba(240, 98, 146, 0.1)', fill: true },
                  { label: "Purchasing Expense", data: data.monthlyTrends.map(m => m.expense), borderColor: GREY_CHART, borderDash: [5, 5] }
                ]
              }}
              options={{ maintainAspectRatio: false }}
            />
          </div>
        </div>
        <div style={cardStyle}>
          <h3>Sales by Category</h3>
          <Doughnut data={{
            labels: data.salesByCategory.map(c => c.CategoryName),
            datasets: [{ 
              data: data.salesByCategory.map(c => c.total), 
              backgroundColor: [DEEP_PINK, ACCENT_PINK, GREY_CHART, PURPLE_HINT] 
            }]
          }} />
        </div>
      </div>

      {/* SECTION 2: PRODUCTION & PURCHASING */}
      <div style={{ ...grid2Style, marginTop: "24px" }}>
        <div style={cardStyle}>
          <h3 style={chartTitleStyle}>Top 5 Scrap Reasons</h3>
          <div style={{ height: "300px", position: "relative" }}>
            <Bar 
              options={{ ...commonOptions, indexAxis: 'y' }}
              data={{
                labels: data.scrapByReason.map(r => r.ScrapReasonName),
                datasets: [{ label: "Qty Scrapped", data: data.scrapByReason.map(r => r.qty), backgroundColor: DEEP_PINK }]
              }}
            />
          </div>
        </div>
        <div style={cardStyle}>
            <h3 style={chartTitleStyle}>Vendor Risk (Rejection vs Fulfillment)</h3>
            <div style={{ height: "300px", position: "relative" }}>
                <Scatter 
                options={{
                    ...commonOptions,
                    plugins: {
                    legend: { display: false },
                    tooltip: {
                        callbacks: {
                        // This is the magic part that adds the Vendor Name to the hover
                        label: (context) => {
                            const vendor = data.vendorRisk[context.dataIndex];
                            return [
                            `Vendor: ${vendor.VendorName}`,
                            `Rejection: ${vendor.rejectionRate}%`,
                            `Fulfillment: ${vendor.fulfillmentRate}%`
                            ];
                        }
                        }
                    }
                    },
                    scales: {
                    x: { 
                        title: { display: true, text: 'Rejection Rate (%)', color: '#718096' }, 
                        min: 0,
                        grid: { color: '#F7FAFC' }
                    },
                    y: { 
                        title: { display: true, text: 'Fulfillment Rate (%)', color: '#718096' }, 
                        max: 100,
                        min: 0,
                        grid: { color: '#F7FAFC' }
                    }
                    }
                }}
                data={{
                    datasets: [{
                    label: 'Vendors',
                    // We pass the whole object or just x,y. ChartJS allows extra keys in the object
                    data: data.vendorRisk.map(v => ({ 
                        x: v.rejectionRate, 
                        y: v.fulfillmentRate,
                        name: v.VendorName // Store it here for the callback
                    })),
                    backgroundColor: (ctx) => {
                        const val = data.vendorRisk[ctx.dataIndex];
                        // Visual Cue: Turn dots red if rejection is > 5%
                        return val?.rejectionRate > 5 ? '#E53E3E' : DEEP_PINK;
                    },
                    pointRadius: 6,
                    pointHoverRadius: 8
                    }]
                }}
                />
            </div>
        </div>
      </div>
    </div>
  );
}

// Helper Components & Styles
function StatCard({ title, value, unit, badge, badgeColor }) {
  return (
    <div style={cardStyle}>
      <p style={{ color: "#718096", fontSize: "14px", marginBottom: "8px" }}>{title}</p>
      <div style={{ display: "flex", alignItems: "baseline", gap: "8px" }}>
        <h2 style={{ fontSize: "24px", fontWeight: "700", margin: 0 }}>{value}</h2>
        <span style={{ color: "#A0AEC0", fontSize: "12px" }}>{unit}</span>
              {badge && <span style={{ background: badgeColor, padding: "2px 8px", borderRadius: "10px", fontSize: "10px", fontWeight: "bold" }}>{badge}</span>}
      </div>
    </div>
  );
}

const sectionHeaderStyle = { fontSize: "20px", fontWeight: "800", color: "#2D3748", margin: "32px 0 16px 0" };
const grid4Style = { display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "20px", marginBottom: "24px" };
const grid2Style = { display: "grid", gridTemplateColumns: "1fr 1fr", gap: "24px" };
const grid2_1Style = { display: "grid", gridTemplateColumns: "2fr 1fr", gap: "24px" };
const selectStyle = { padding: "8px 16px", borderRadius: "10px", border: "1px solid #E2E8F0", outline: "none", cursor: "pointer" };
const chartTitleStyle = { marginBottom: "15px", fontSize: "16px", fontWeight: "600", color: "#4A5568" };