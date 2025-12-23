import React, { useState, useEffect, useCallback } from "react";
import axios from "axios";
import { Pie, Line, Bar } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  Filler,
  ArcElement,
  
} from "chart.js";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  Filler,
  ArcElement,
);

const ACCENT_PINK = "#F8BBD0";
const DEEP_PINK = "#F06292";
const HOVER_PINK = "#FFF5F7";
const PURPLE_HINT = "#8460FB";

const cardStyle = {
  background: "#ffffff",
  padding: "24px",
  borderRadius: "20px",
  boxShadow: "0 10px 25px -5px rgba(248, 187, 208, 0.15)",
  border: "1px solid #FDF2F5",
};

export default function ProductionAnalytics() {
  const [loading, setLoading] = useState(true);
  const [years, setYears] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [filters, setFilters] = useState({ year: "", location_id: "", category_name: selectedCategory });
  const [data, setData] = useState(null);
  const [isDrillingDown, setIsDrillingDown] = useState(false);

  useEffect(() => {
    axios.get("/api/years").then((res) => {
      setYears(res.data);
      if (res.data.length > 0) {
        // Default to the latest year found in the database
        const latestYear = String(res.data[res.data.length - 1]);
        setFilters(prev => ({ ...prev, year: latestYear, category_name: selectedCategory }));
      }
    });
  }, []);

  const fetchProductionData = useCallback(async () => {
    try {
      if (!data) setLoading(true); 
      else setIsDrillingDown(true);
      const response = await axios.get("/api/production/get-data", { 
        params: { ...filters, category_name: selectedCategory } 
      });
      setData(response.data);
    } catch (err) {
      console.error("Error fetching production data:", err);
    } finally {
      setLoading(false);
      setIsDrillingDown(false);
    }
  }, [filters, selectedCategory]);

  useEffect(() => {
    fetchProductionData();
  }, [fetchProductionData]);

  if (loading && !data) {
    return (
      <div style={{ padding: "100px", textAlign: "center", color: DEEP_PINK, fontWeight: "600" }}>
        Loading Data...
      </div>
    );
  }
  // Helper to ensure we don't map over undefined
  const scrapReasons = data?.scrapPareto || [];

  // Heatmap
  const getHeatmapColor = (value, max) => {
    if (!value) return "#F7FAFC"; // Empty state color
    const intensity = Math.min((value / max) * 1, 1);
    return `rgba(240, 98, 146, ${intensity})`; // Pink intensity based on production
  };
  const renderHeatmap = () => {
    const heatmapData = data?.heatmap || [];
    const locations = [...new Set(heatmapData.map(d => d.LocationName))];
    const months = ["January", "February", "March", "April", "May", "June", 
                    "July", "August", "September", "October", "November", "December"];
    const maxUnits = Math.max(...heatmapData.map(d => d.units), 1);

    const dataMap = {};
    heatmapData.forEach(d => {
      dataMap[`${d.LocationName}-${d.MonthName}`] = d.units;
    });

    return (
      <div style={{ ...cardStyle, marginTop: "24px", overflowX: "auto" }}>
        <h3 style={{ marginBottom: "20px", fontSize: "18px", color: PURPLE_HINT }}>
          Production Output Heatmap (Units by Location)
        </h3>
        
        <table style={{ width: "100%", borderCollapse: "separate", borderSpacing: "4px" }}>
          <thead>
            <tr>
              <th style={{ padding: "10px", textAlign: "left", fontSize: "12px", color: "#718096" }}>Location</th>
              {months.map(m => (
                <th key={m} style={{ padding: "10px", fontSize: "12px", color: "#718096", minWidth: "60px" }}>
                  {m.substring(0, 3)}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {locations.map(loc => (
              <tr key={loc}>
                <td style={{ padding: "10px", fontSize: "13px", fontWeight: "600", color: "#4A5568" }}>{loc}</td>
                {months.map(m => {
                  const val = dataMap[`${loc}-${m}`] || 0;
                  return (
                    <td 
                      key={`${loc}-${m}`}
                      title={`${loc} in ${m}: ${val} units`}
                      style={{
                        height: "40px",
                        backgroundColor: getHeatmapColor(val, maxUnits),
                        borderRadius: "4px",
                        textAlign: "center",
                        fontSize: "11px",
                        color: val / maxUnits > 0.5 ? "#fff" : "#4A5568",
                        transition: "transform 0.2s",
                        cursor: "pointer"
                      }}
                      onMouseEnter={(e) => e.target.style.transform = "scale(1.1)"}
                      onMouseLeave={(e) => e.target.style.transform = "scale(1)"}
                    >
                      {val > 0 ? val.toLocaleString() : "-"}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
        
        {/* Legend */}
        <div style={{ display: "flex", alignItems: "center", gap: "10px", marginTop: "15px", fontSize: "12px", color: "#718096" }}>
          <span>Low Output</span>
          <div style={{ width: "100px", height: "8px", background: "linear-gradient(to right, rgba(240, 98, 146, 0.1), rgba(240, 98, 146, 1))", borderRadius: "4px" }}></div>
          <span>High Output</span>
        </div>
      </div>
    );
  };

  return (
    <div style={{ minHeight: "100vh"}}>
      <header style={{ marginBottom: "32px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <h1 style={{ fontSize: "24px", fontWeight: "800", color: "#2D3748", margin: 0 }}>Production Performance for Year {filters.year}</h1>
        </div>
        <div>
          <label style={{ marginRight: "16px", fontWeight: "600", color: "#4A5568" }}>Select Year:</label>
          <select 
            value={filters.year}
            onChange={(e) => setFilters(prev => ({...prev, year: e.target.value}))}
            style={{ padding: "10px", borderRadius: "10px", border: "1px solid #F8BBD0", cursor: "pointer" }}
          >
            {years.map(year => (
              <option key={year} value={year}>{year}</option>
            ))}
          </select>
        </div>
      </header>

      {/* KPI CARDS */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "24px", marginBottom: "24px" }}>
        <StatCard
          title="Total Units Produced"
          value={data.kpis?.totalUnits?.toLocaleString()} 
          unit="pcs"
        />
        <StatCard 
          title="Scrap Rate" 
          value={`${data.kpis?.scrapRate}%`} 
          badge={data.kpis?.scrapRate > 5 ? "High" : "Optimal"} 
          badgeColor={data.kpis?.scrapRate > 5 ? "#FEB2B2" : "#C6F6D5"}
        />
        <StatCard
          title="Average Lead Time"
          value={(data.kpis?.avgLeadTime ?? 0).toLocaleString()}
          unit="days"
        />
      </div>

      <div style={{gap: "24px", marginBottom: "24px"}}>
        {/* PLANNED VS ACTUAL COST AREA CHART */}
        <div style={cardStyle}>
          <h3 style={{ marginBottom: "20px", fontSize: "18px" }}>Planned vs Actual Cost Trend</h3>
          <div style={{ height: "300px" }}>
          <Line 
              data={{
                labels: data.monthlyTrends.months,
                datasets: [
                  {
                    label: "Actual Cost",
                    data: data.monthlyTrends.actualCosts,
                    borderColor: DEEP_PINK,
                    backgroundColor: (ctx) => data.monthlyTrends.exceedsTolerance[ctx.dataIndex] ? "rgba(229, 62, 62, 0.2)" : "rgba(248, 187, 208, 0.2)",
                    fill: true,
                    tension: 0.4,
                    pointBackgroundColor: (ctx) => data.monthlyTrends.exceedsTolerance[ctx.dataIndex] ? "#E53E3E" : DEEP_PINK,
                  },
                  {
                    label: "Planned Cost",
                    data: data.monthlyTrends.plannedCosts,
                    borderColor: "#CBD5E0",
                    borderDash: [5, 5],
                    fill: false,
                  }
                ]
              }}
              options={{ 
                responsive: true, 
                maintainAspectRatio: false, 
                plugins: { legend: { position: 'top' } },
                scales: {
                  y:{
                    beginAtZero: true,
                    max: 200000,
                    ticks: {
                      precision: 0
                    }
                  }
                }}}
            />
          </div>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "3fr 2fr", gap: "24px", marginBottom: "24px"}}>
        {/* YIELD VS SCRAP RATE (COMBO CHART) */}
        <div style={cardStyle}>
          <h3 style={{ marginBottom: "20px", fontSize: "16px", color: PURPLE_HINT }}>Yield vs. Scrap Rate Trend</h3>
          <div style={{ height: "300px" }}>
            <Bar 
              data={{
                labels: data.monthlyTrends.months,
                datasets: [
                  {
                    type: 'line',
                    label: 'Scrap Rate %',
                    data: data.monthlyTrends.scrapRates,
                    borderColor: DEEP_PINK,
                    borderWidth: 2,
                    yAxisID: 'y1',
                    tension: 0.4
                  },
                  {
                    type: 'bar',
                    label: 'Yield (Units)',
                    data: data.monthlyTrends.yield,
                    backgroundColor: ACCENT_PINK,
                    borderRadius: 5,
                    yAxisID: 'y',
                  }
                ]
              }}
              options={{ 
                responsive: true, 
                maintainAspectRatio: false,
                scales: { 
                    y: { type: 'linear', max: 100000, position: 'left', title: { display: true, text: 'Units' } },
                    y1: { type: 'linear', max:0.5, position: 'right', grid: { drawOnChartArea: false }, title: { display: true, text: '%' } }
                }
              }}
            />
          </div>
        </div>

        {/* TOP SCRAP REASONS BAR */}
        <div style={cardStyle}>
          <h3 style={{ marginBottom: "20px", fontSize: "18px" }}>Top Scrap Reasons</h3>
          <div style={{ height: "300px" }}>
            <Bar 
              data={{
                labels: scrapReasons.map(d => d.reason),
                datasets: [{
                  label: "Qty Scrapped",
                  data: scrapReasons.map(d => d.qty),
                  backgroundColor: ACCENT_PINK,
                  borderRadius: 8,
                  hoverBackgroundColor: DEEP_PINK
                }]
              }}
              options={{ 
                indexAxis: 'y', 
                responsive: true, 
                maintainAspectRatio: false,
                plugins: { legend: { display: false } }
              }}
            />
          </div>
        </div>
      </div>
      
      {/* HEATMAP */}
      {renderHeatmap()}
      
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "24px", marginTop: "24px" }}>  
        
        {/* ORDER VS STOCKED */}
        <div style={cardStyle}>
          <h3 style={{ marginBottom: "20px", fontSize: "16px", color: PURPLE_HINT }}>Fulfillment: Order Qty vs. Stocked Qty</h3>
          <div style={{ height: "300px" }}>
            <Line 
              data={{
                labels: data.qtyComparison?.labels || [],
                datasets: [
                  {
                    label: "Goal (Order Qty)",
                    data: data.qtyComparison?.orderQty || [],
                    borderColor: "#4A5568",
                    backgroundColor: "transparent",
                    borderDash: [5, 5], // Dashed line for "Target"
                    pointRadius: 0,
                    tension: 0.3
                  },
                  {
                    label: "Actual (Stocked Qty)",
                    data: data.qtyComparison?.stockedQty || [],
                    borderColor: DEEP_PINK,
                    backgroundColor: "rgba(240, 98, 146, 0.1)",
                    fill: true,
                    tension: 0.3
                  }
                ]
              }}
              options={{ 
                responsive: true, 
                maintainAspectRatio: false,
                plugins: {
                  tooltip: { mode: 'index', intersect: false }
                },
                scales: {
                  y:{
                    beginAtZero: true,
                    max: 90000,
                    ticks: {
                      precision: 0
                    }
                  }
                }
              }}
            />
          </div>
        </div>

        {/* PARETO CHART FOR SCRAP REASONS */}
        <div style={cardStyle}>
          <h3 style={{ marginBottom: "20px", fontSize: "16px", color: PURPLE_HINT }}>Scrap Reasons Pareto Analysis</h3>
          <div style={{ height: "300px" }}>
            <Bar 
              data={{
                labels: data.scrapPareto.map(d => d.reason),
                datasets: [
                  {
                    label: "Cumulative %",
                    type: "line",
                    data: data.scrapPareto.map(d => d.cumulative_pct),
                    borderColor: "#4A5568",
                    yAxisID: "y-pct",
                    tension: 0.2
                  },
                  {
                    label: "Scrap Qty",
                    data: data.scrapPareto.map(d => d.qty),
                    backgroundColor: DEEP_PINK,
                    borderRadius: 4,
                    yAxisID: "y-qty"
                  }
                ]
              }}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                  "y-qty": { position: "left", min: 0, max: 180, title: { display: true, text: "Qty" } },
                  "y-pct": { position: "right", min: 0, max: 100, title: { display: true, text: "Cumulative %" } }
                }
              }}
            />
          </div>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 2fr 1fr", gap: "24px", margin: "24px 0", position: "relative" }}>
        {/* PRODUCTION QUANTITY by CATEGORY */}
        <div style={cardStyle}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
            <h3 style={{ fontSize: "16px", margin: 0 }}>Output by Category</h3>
            {selectedCategory && (
              <button 
                onClick={() => setSelectedCategory(null)}
                style={{ fontSize: "11px", color: DEEP_PINK, border: `1px solid ${DEEP_PINK}`, borderRadius: "4px", padding: "2px 6px", cursor: "pointer", background: "white" }}
              >
                Clear Filter
              </button>
            )}
          </div>
          <div style={{ height: "300px" }}>
            <Pie 
              data={{
                labels: data?.categoryDist?.map(d => d.category) || [],
                datasets: [{
                  data: data?.categoryDist?.map(d => d.total_yield) || [],
                  backgroundColor: ["#FDE8EF", "#F8BBD0", "#EF6B9A", "#4A5568", "#CBD5E0"],
                }]
              }}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                onClick: (event, elements) => {
                  if (elements.length > 0) {
                    const idx = elements[0].index;
                    const category = data.categoryDist[idx].category;
                    setSelectedCategory(category);
                  }
                },
              }}
            />
          </div>
        </div>

        {/* dynamic chart here */}
        <div style={{ display: "contents" }}>
          {isDrillingDown && (
            <div style={{
              position: "absolute",
              top: 0, left: 0, right: 0, bottom: 0,
              backgroundColor: "rgba(255, 255, 255, 0.6)",
              zIndex: 10,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              borderRadius: "20px",
              backdropFilter: "blur(2px)"
            }}>
              <div style={{ 
                  padding: "12px 24px", 
                  background: "#fff", 
                  borderRadius: "50px", 
                  boxShadow: "0 4px 15px rgba(0,0,0,0.1)",
                  color: DEEP_PINK,
                  fontWeight: "bold",
                  display: "flex",
                  gap: "10px",
                  alignItems: "center"
              }}>
                <span className="animate-spin">🌀</span> Filtering for {selectedCategory}...
              </div>
            </div>
          )}

          {/* LEAD TIME DISTRIBUTION: DRILL-DOWN VIEW */}
          <div style={cardStyle}>
            <h3 style={{ marginBottom: "20px", fontSize: "16px" }}>
              Lead Time Distribution {selectedCategory ? `- ${selectedCategory}` : "(All Categories)"}
            </h3>
            <div style={{ height: "300px" }}>
              <Bar 
                data={{
                  labels: data?.leadTimeDistribution?.map(d => `${d.days} Days`) || [],
                  datasets: [{
                    label: "Work Orders",
                    data: data?.leadTimeDistribution?.map(d => d.count) || [],
                    backgroundColor: selectedCategory ? DEEP_PINK : "#CBD5E0",
                    borderRadius: 4,
                  }]
                }}
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  plugins: { legend: { display: false } },
                  scales: {
                    y: { beginAtZero: true, title: { display: true, text: 'Number of Orders' } },
                    x: { title: { display: true, text: 'Days to Complete' } }
                  }
                }}
              />
            </div>
          </div>
          
          {/* RESOURCE EFFORT DISTRIBUTION: DRILL-DOWN VIEW */}
          <div style={cardStyle}>
            <h3 style={{ marginBottom: "20px", fontSize: "16px", color: PURPLE_HINT }}>
              Resource Effort (Hours) {selectedCategory ? ` - ${selectedCategory}` : ""}
            </h3>
            <div style={{ height: "250px" }}>
              <Bar 
                data={{
                  labels: data.hoursDistribution?.map(d => `${d.hour_label}h`),
                  datasets: [{
                    label: "Work Orders",
                    data: data.hoursDistribution?.map(d => d.order_count),
                    backgroundColor: DEEP_PINK,
                    borderRadius: 4
                  }]
                }}
                options={{ 
                  responsive: true, 
                  maintainAspectRatio: false,
                  plugins: { legend: { display: false } },
                  scales: {
                    y: { title: { display: true, text: 'Frequency' } },
                    x: { title: { display: true, text: 'Actual Hours Spent' } }
                  }
                }}
              />
            </div>
          </div>

        </div>
      </div>

      {/* Top scrapped product */}
      <div style={{ ...cardStyle, marginTop: "24px" }}>
        <h3 style={{ marginBottom: "12px", fontSize: "16px", color: PURPLE_HINT, fontWeight: "600", lineHeight: "24px" }}>Top 10 Scrapped Products</h3>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ textAlign: "left", color: "#718096", fontSize: "14px", borderBottom: "2px solid #FDF2F5" }}>
              <th style={{ padding: "12px" }}>Product</th>
              <th style={{ padding: "12px" }}>Location</th>
              <th style={{ padding: "12px", textAlign: "right" }}>Total Qty</th>
              <th style={{ padding: "12px", textAlign: "right" }}>Scrapped</th>
            </tr>
          </thead>
          <tbody>
            {data.tableData.map((item, i) => (
              <tr key={i} style={{ borderBottom: "1px solid #F7FAFC" }}>
                <td style={{ padding: "16px", fontWeight: "600" }}>{item.product}</td>
                <td style={{ padding: "16px" }}>{item.location}</td>
                <td style={{ padding: "16px", textAlign: "right" }}>{item.qty}</td>
                <td style={{ padding: "16px", textAlign: "right", color: "#E53E3E", fontWeight: "bold" }}>{item.scrapped}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function StatCard({ title, value, unit, badge, badgeColor }) {
  return (
    <div style={cardStyle}>
      <p style={{ color: "#718096", fontSize: "14px", marginBottom: "8px" }}>{title}</p>
      <div style={{ display: "flex", alignItems: "baseline", gap: "8px" }}>
        <h2 style={{ fontSize: "28px", fontWeight: "700", margin: 0 }}>{value}</h2>
        {unit && <span style={{ color: "#A0AEC0", fontSize: "14px" }}>{unit}</span>}
        {badge && (
          <span style={{ 
            marginLeft: "auto", padding: "4px 10px", borderRadius: "20px", 
            fontSize: "12px", fontWeight: "700", backgroundColor: badgeColor 
          }}>
            {badge}
          </span>
        )}
      </div>
    </div>
  );
}
