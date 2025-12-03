// import { useState } from "react";

import {
    Line, Doughnut, Bar
} from "react-chartjs-2";
  
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    Title,
    Tooltip,
    Legend,
    ArcElement,
    BarElement
} from "chart.js"; 

ChartJS.register(
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    ArcElement,
    BarElement,
    Title,
    Tooltip,
    Legend
);

// Sales Trend Data
const salesTrendData = { /* same as before */ 
    labels: ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'],
    datasets: [
      {
        label: 'Sales 2024',
        data: [850000,920000,1050000,980000,1120000,1200000,1150000,1280000,1100000,1350000,1250000,1400000],
        borderColor: '#667eea',
        backgroundColor: 'rgba(102,126,234,0.1)',
        tension: 0.4,
        fill: true
      },
      {
        label: 'Sales 2023',
        data: [750000,800000,880000,850000,950000,1000000,980000,1050000,950000,1100000,1050000,1150000],
        borderColor: '#e0e0e0',
        backgroundColor: 'rgba(224,224,224,0.1)',
        tension: 0.4,
        fill: true
      }
    ]
  };

  const categoryData = { 
    labels: ['Bikes', 'Components', 'Clothing', 'Accessories'],
    datasets: [{
      data: [6500000, 3200000, 1800000, 958392],
      backgroundColor: ['#667eea', '#764ba2', '#f093fb', '#4facfe']
    }]
  };

  const territoryData = { 
    labels: ['North America','Europe','Pacific','Central','Southeast'],
    datasets: [{
      label: 'Sales by Territory',
      data: [4500000,3200000,2800000,1200000,758392],
      backgroundColor: '#667eea'
    }]
  };

  const salesPersonData = { 
    labels: ['Linda Mitchell','Jae Pak','Michael Blythe','Jillian Carson','Ranjit Varkey'],
    datasets: [{
      label: 'Sales Performance',
      data: [2400000,2100000,1900000,1750000,1650000],
      backgroundColor: ['#667eea','#764ba2','#f093fb','#4facfe','#43e97b']
    }]
  };


export default function SalesPage() {
  const data = {
    totalSales: 12458392,
    totalOrders: 8742,
    totalQty: 10000,
    aov: 1425
  };

  return (
    <>
      {/* KPI CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <KPICard title="Total Sales" value={`$${data.totalSales}`} change="↑ 12.5%" />
        <KPICard title="Total Orders" value={data.totalOrders} change="↑ 5.1%" />
        <KPICard title="Quantity Sold" value={data.totalQty} change="↑ 8.3%" />
        <KPICard title="Avg Order Value" value={`$${data.aov}`} />
      </div>

      {/* CHARTS 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <ChartCard title="📈 Sales Trend (Monthly)">
          <Line data={salesTrendData} />
        </ChartCard>

        <ChartCard title="🥧 Sales by Category">
          <Doughnut data={categoryData} />
        </ChartCard>
      </div>

      {/* CHARTS 2 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <ChartCard title="🌍 Sales by Territory">
          <Bar data={territoryData} />
        </ChartCard>

        <ChartCard title="👥 Top Sales Persons">
          <Bar data={salesPersonData} options={{ indexAxis: "y" }} />
        </ChartCard>
      </div>

      <div className="bg-white rounded shadow p-4">
        <h3 className="text-lg font-semibold mb-4">📊 Top Products Performance</h3>
        <ProductTable />
      </div>
    </>
  );
}