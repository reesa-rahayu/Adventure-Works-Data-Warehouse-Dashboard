import React, { useState, useEffect, useCallback } from "react";
import axios from "axios";
import { Line, Bar, Doughnut } from "react-chartjs-2";
import {
  Chart as ChartJS, CategoryScale, LinearScale, PointElement,
  LineElement, BarElement, Title, Tooltip, Legend, Filler, ArcElement,
} from "chart.js";

ChartJS.register(
  CategoryScale, LinearScale, PointElement, LineElement, 
  BarElement, Title, Tooltip, Legend, Filler, ArcElement
);

const ACCENT_PINK = "#F8BBD0";
const DEEP_PINK = "#F06292";
const GREY_CHART = "#CBD5E0";
const PURPLE_HINT = "#8460FB";

const cardStyle = {
  background: "#ffffff",
  padding: "24px",
  borderRadius: "20px",
  boxShadow: "0 10px 25px -5px rgba(248, 187, 208, 0.15)",
  border: "1px solid #FDF2F5",
};

export default function PurchasingAnalytics() {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState(null);
  const [years, setYears] = useState([]);
  const [vendors, setVendors] = useState([]);
  const [activeVendor, setActiveVendor] = useState(null); 
  const [filters, setFilters] = useState({ year: "2014", category_name: "" });
  const [isSyncing, setIsSyncing] = useState(false);
  
  // Fetch Master Data
  useEffect(() => {
    const fetchMaster = async () => {
      const [yRes, vRes] = await Promise.all([
        axios.get("/api/years"),
        axios.get("/api/vendors")
      ]);
      setYears(yRes.data);
      setVendors(vRes.data);
    };
    fetchMaster();
  }, []);

  const fetchData = useCallback(async () => {
    try {
      setIsSyncing(true);
      const res = await axios.get("/api/purchasing-data", { params: filters });
      setData(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
      setIsSyncing(false);
    }
  }, [filters]);

  useEffect(() => { fetchData(); }, [fetchData]);

  if (loading || !data) return <div style={{ padding: "100px", textAlign: "center", color: DEEP_PINK }}>Loading Procurement Data...</div>;

  return (
    <div style={{ minHeight: "100vh" }}>
      <header style={{ marginBottom: "24px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <h1 style={{ fontSize: "24px", fontWeight: "800", color: "#2D3748", margin: 0 }}>Purchasing Analysis {filters.year}</h1>
        <FilterSelect label="Year" value={filters.year} options={years} onChange={(v) => setFilters({...filters, year: v})} />  
      </header>

      {/* KPI SECTION */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "20px", marginBottom: "24px" }}>
        <StatCard title="Total Procurement" value={`$${(data.kpis.totalSpend / 1000000).toFixed(2)}M`} unit="Total Due" />
        <StatCard title="Rejection Rate" value={`${data.kpis.overallRejectionRate}%`} badge={data.kpis.overallRejectionRate > 2 ? "Review" : "Good"} badgeColor={data.kpis.overallRejectionRate > 2 ? "#FEB2B2" : "#C6F6D5"} />
        <StatCard title="Order Volume" value={data.kpis.totalOrderQty?.toLocaleString()} unit="units" />
        <StatCard title="Freight Cost" value={`$${data.kpis.totalFreight?.toLocaleString()}`} unit="Total Shipping" />
      </div>

      {/* MAIN TRENDS */}
      <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: "24px", marginBottom: "24px" }}>
        <div style={cardStyle}>
          <h3 style={{ marginBottom: "20px", fontSize: "16px", color: PURPLE_HINT }}>Purchasing Volume vs Spend Trend</h3>
          <div style={{ height: "300px" }}>
            <Line 
              data={{
                labels: data.monthlyTrends.labels,
                datasets: [
                  { label: "Spend ($)", data: data.monthlyTrends.spend, borderColor: DEEP_PINK, backgroundColor: "rgba(240, 98, 146, 0.1)", fill: true, yAxisID: 'y' },
                  { label: "Volume (Qty)", data: data.monthlyTrends.volume, borderColor: GREY_CHART, borderDash: [5,5], fill: false, yAxisID: 'y1' }
                ]
              }}
              options={{ scales: { y: { position: 'left' }, y1: { position: 'right', grid: { drawOnChartArea: false } } } }}
            />
          </div>
        </div>

        <div style={cardStyle}>
          <h3 style={{ marginBottom: "20px", fontSize: "16px" }}>Spend Distribution by Product Category</h3>
          <div style={{ height: "300px", display: 'flex', justifyContent: 'center' }}>
            <Doughnut 
               data={{
                 labels: [...new Set(data.topProducts.map(p => p.CategoryName))],
                 datasets: [{
                   data: [40, 30, 20, 10], // You can calculate this in backend
                   backgroundColor: [DEEP_PINK, ACCENT_PINK, GREY_CHART, "#FDE8EF"]
                 }]
               }}
            />
          </div>
        </div>
      </div>

      {/* VENDOR SCORECARD */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "24px", marginBottom: "24px" }}>
        <div style={{ ...cardStyle, marginBottom: "24px" }}>
          <h3 style={{ marginBottom: "20px", fontSize: "16px", color: PURPLE_HINT }}>
            Order Volume vs. Rejection Trends (Stacked)
          </h3>
          <div style={{ height: "350px" }}>
            <Bar 
              data={{
                labels: data.monthlyTrends.labels,
                datasets: [
                  {
                    label: "Rejected Qty",
                    data: data.monthlyTrends.rejected,
                    backgroundColor: GREY_CHART,
                    fill: true,
                    tension: 0.4,
                  },
                  {
                    label: "Success Volume (Stocked)",
                    data: data.monthlyTrends.volume,
                    backgroundColor: DEEP_PINK,
                    fill: true,
                    tension: 0.4,
                  }
                ]
              }}
              options={{
                maintainAspectRatio: false,
                responsive: true,
                plugins: { tooltip: { mode: 'index' } },
                scales: {
                  y: { beginAtZero: true, title: { display: true, text: 'Units' } },
                  x: { grid: { display: false } }
                }
              }}
            />
          </div>
        </div>

        <div style={cardStyle}>
          <h3 style={{ marginBottom: "20px", fontSize: "16px", color: PURPLE_HINT }}>Vendor Financial Analysis</h3>
          <div style={{ height: "300px" }}>
            <Bar 
              data={{
                labels: data.vendorAnalysis.slice(0, 10).map(v => v.VendorName),
                datasets: [
                  {
                    label: "Total Spend ($)",
                    data: data.vendorAnalysis.slice(0, 10).map(v => v.total_spend),
                    backgroundColor: DEEP_PINK,
                    borderRadius: 5
                  },
                  {
                    label: "Freight Cost ($)",
                    data: data.vendorAnalysis.slice(0, 10).map(v => v.total_freight),
                    backgroundColor: "#CBD5E0",
                    borderRadius: 5
                  }
                ]
              }}
              options={{ 
                indexAxis: 'y', 
                responsive: true, 
                maintainAspectRatio: false,
                scales: { x: { stacked: false } }
              }}
            />
          </div>
        </div>

        <div style={cardStyle}>
          <h3 style={{ marginBottom: "20px", fontSize: "16px", color: PURPLE_HINT }}>Vendors Rejection Rate (%)</h3>
          <div style={{ height: "300px" }}>
            <Bar 
              data={{
                labels: data.vendorAnalysis.slice(0, 8).map(v => v.VendorName),
                datasets: [{
                  label: "Rejection %",
                  data: data.vendorAnalysis.slice(0, 8).map(v => v.rejection_rate),
                  backgroundColor: (ctx) => data.vendorAnalysis[ctx.dataIndex]?.rejection_rate > 3 ? DEEP_PINK : ACCENT_PINK,
                  borderRadius: 5
                }]
              }}
              options={{ 
                indexAxis: 'y',
                scales: { 
                    x: { ticks: { callback: v => v + '%' } } 
                  }}}
            />
          </div>
        </div>

        {/* FULFILLMENT */}
        <div style={cardStyle}>
          <h3 style={{ marginBottom: "20px", fontSize: "16px", color: PURPLE_HINT }}>Vendors Fulfillment Rate (%)</h3>
          <div style={{ height: "300px" }}>
            <Bar 
              data={{
                labels: data.vendorAnalysis.slice(0, 8).map(v => v.VendorName),
                datasets: [{
                  label: "Fulfillment Rate (%)",
                  data: data.vendorAnalysis.slice(0, 10).map(v => v.fulfillment_rate),
                  backgroundColor: (ctx) => data.vendorAnalysis[ctx.dataIndex]?.rejection_rate > 3 ? DEEP_PINK : ACCENT_PINK,
                  borderRadius: 5
                }]
              }}
              options={{
                indexAxis: 'y',
                scales: { 
                    x: { max: 100, ticks: { callback: v => v + '%' } } 
                  }}}
            />
          </div>
        </div>
      </div>
      
      {/* VENDOR ANALYSIS SECTION */}
      <div style={{ marginBottom: "12px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <h2 style={{ fontSize: "20px", fontWeight: "800", color: "#2D3748", marginBottom: "16px" }}>Vendor Performance Analysis</h2>
      </div> 

      <div style={{ display: "grid", gridTemplateColumns: activeVendor ? "2fr 1fr" : "1fr", gap: "24px", marginBottom: "24px" }}>
        {/* LEFT PANEL: The Chart */}
        <div style={cardStyle}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
            <h3 style={{ fontSize: "16px", color: PURPLE_HINT }}>
              {activeVendor 
                ? `Effectiveness Trend: ${activeVendor.VendorName}` 
                : "Select a Vendor to Analyze Effectiveness (Received vs Rejected vs Stocked)"}
            </h3>
            {activeVendor && (
              <button 
                onClick={() => setActiveVendor(null)}
                style={{ padding: "4px 12px", borderRadius: "8px", border: `1px solid ${DEEP_PINK}`, color: DEEP_PINK, background: "none", cursor: "pointer", fontSize: "12px" }}
              >
                ← Back to Vendor List
              </button>
            )}
          </div>

          <div style={{ height: "350px" }}>
            {!activeVendor ? (
              /* INITIAL VIEW: Ranking by Total Received to help user choose a vendor */
              <Bar 
                data={{
                  labels: data.vendorAnalysis.slice(0, 15).map(v => v.VendorName),
                  datasets: [{
                    label: "Total Transactions",
                    data: data.vendorAnalysis.slice(0, 15).map(v => v.total_spend), // Using spend as a proxy for size
                    backgroundColor: GREY_CHART,
                    hoverBackgroundColor: DEEP_PINK,
                    borderRadius: 5
                  }]
                }}
                options={{
                  indexAxis: 'y',
                  plugins: { tooltip: { callbacks: { label: () => "Click to see effectiveness drill-down" } } },
                  onClick: (e, elements) => {
                    if (elements.length > 0) {
                      const index = elements[0].index;
                      setActiveVendor(data.vendorAnalysis[index]);
                    }
                  }
                }}
              />
            ) : (
              /* DRILL-DOWN VIEW: Multiline Comparison */
              <Line 
                data={{
                  labels: data.monthlyTrends.labels,
                  datasets: [
                    {
                      label: "Received Qty",
                      data: data.monthlyTrends.volume.map(v => v * (Math.random() * 0.8 + 0.2)), // In real app, filter this by vendor in backend
                      borderColor: "#4A5568", 
                      backgroundColor: "transparent",
                      tension: 0.3
                    },
                    {
                      label: "Stocked Qty",
                      data: data.monthlyTrends.volume.map(v => v * (Math.random() * 0.5 + 0.1)), 
                      borderColor: DEEP_PINK,
                      backgroundColor: "rgba(240, 98, 146, 0.1)",
                      fill: true,
                      tension: 0.3
                    },
                    {
                      label: "Rejected Qty",
                      data: data.monthlyTrends.rejected.map(v => v * (Math.random() * 0.3)), 
                      borderColor: "#E53E3E",
                      borderDash: [5, 5],
                      tension: 0.3
                    }
                  ]
                }}
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  scales: { y: { beginAtZero: true } }
                }}
              />
            )}
          </div>
        </div>

        {/* RIGHT PANEL: Most Purchased Products (Only shows when vendor is selected) */}
        {activeVendor && (
          <div style={cardStyle}>
            <h3 style={{ marginBottom: "20px", fontSize: "16px", color: PURPLE_HINT }}>
              Top Products from {activeVendor.VendorName}
            </h3>
            <div style={{ overflowY: "auto", maxHeight: "350px" }}>
              {data.topProducts
                .slice(0, 5) // In a real scenario, this would be filtered by the activeVendor ID
                .map((prod, i) => (
                  <div key={i} style={{ padding: "12px 0", borderBottom: "1px solid #F7FAFC" }}>
                    <p style={{ margin: 0, fontSize: "14px", fontWeight: "600", color: "#2D3748" }}>{prod.ProductName}</p>
                    <div style={{ display: "flex", justifyContent: "space-between", marginTop: "4px" }}>
                      <span style={{ fontSize: "12px", color: "#718096" }}>{prod.total_qty} units</span>
                      <span style={{ fontSize: "12px", color: DEEP_PINK, fontWeight: "700" }}>${prod.spend_value.toLocaleString()}</span>
                    </div>
                  </div>
                ))}
            </div>
          </div>
        )}
      </div>

      {/* BOTTOM TABLE: PRODUCT VALUE */}
      <div style={cardStyle}>
        <h3 style={{ marginBottom: "15px" }}>Highest Value Purchase Items</h3>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ textAlign: "left", color: "#718096", borderBottom: "1px solid #FDF2F5" }}>
              <th style={{ padding: "12px" }}>Product Name</th>
              <th style={{ padding: "12px" }}>Category</th>
              <th style={{ padding: "12px", textAlign: "right" }}>Total Qty</th>
              <th style={{ padding: "12px", textAlign: "right" }}>Total Value (LineTotal)</th>
            </tr>
          </thead>
          <tbody>
            {data.topProducts.map((p, i) => (
              <tr key={i} style={{ borderBottom: "1px solid #F7FAFC" }}>
                <td style={{ padding: "12px", fontWeight: "600" }}>{p.ProductName}</td>
                <td style={{ padding: "12px" }}>{p.CategoryName}</td>
                <td style={{ padding: "12px", textAlign: "right" }}>{p.total_qty.toLocaleString()}</td>
                <td style={{ padding: "12px", textAlign: "right", color: DEEP_PINK, fontWeight: "700" }}>${p.spend_value.toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// Reusable Components
function FilterSelect({ label, value, options, onChange, isObject }) {
  return (
    <div style={{ display: "flex", flexDirection: "column" }}>
      <label style={{ fontSize: "12px", fontWeight: "700", color: "#718096", marginBottom: "4px" }}>{label}</label>
      <select 
        value={value} 
        onChange={(e) => onChange(e.target.value)}
        style={{ padding: "8px", borderRadius: "10px", border: "1px solid #F8BBD0", outline: "none", minWidth: "150px" }}
      >
        <option value="">All {label}s</option>
        {options.map(opt => (
          <option key={isObject ? opt.value : opt} value={isObject ? opt.value : opt}>
            {isObject ? opt.label : opt}
          </option>
        ))}
      </select>
    </div>
  );
}

function StatCard({ title, value, unit, badge, badgeColor }) {
  return (
    <div style={cardStyle}>
      <p style={{ color: "#718096", fontSize: "14px", marginBottom: "8px" }}>{title}</p>
      <div style={{ display: "flex", alignItems: "baseline", gap: "8px" }}>
        <h2 style={{ fontSize: "24px", fontWeight: "700", margin: 0 }}>{value}</h2>
        {unit && <span style={{ color: "#A0AEC0", fontSize: "12px" }}>{unit}</span>}
        {badge && (
          <span style={{ marginLeft: "auto", padding: "2px 8px", borderRadius: "12px", fontSize: "11px", fontWeight: "700", backgroundColor: badgeColor }}>
            {badge}
          </span>
        )}
      </div>
    </div>
  );
}
