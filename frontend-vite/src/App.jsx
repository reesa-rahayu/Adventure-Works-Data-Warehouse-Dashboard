import { useState } from "react";
import Dashboard from "./pages/dashboard.jsx";
import SalesPage from "./pages/sales.jsx";
import PurchasingPage from "./pages/purchasing.jsx";
import ProductionPage from "./pages/production.jsx";

export default function App() {
  const [open, setOpen] = useState(true);
  const [menu, setMenu] = useState("dashboard");

  return (
    <div className="min-h-screen bg-gray-100 flex" style={{ fontFamily: "'Inter', sans-serif" }}>
      
      {/* SIDEBAR */}
      <div className={`${open ? "w-64" : "w-20"} bg-white shadow-lg transition-all duration-300 bg-fixed`}>
        <div className="p-5 flex items-center justify-between border-b">
          <h2 className={`text-xl font-bold text-black transition-all ${!open && "hidden"}`}>
            Adventure Works Data Warehouse
          </h2>

          <button onClick={() => setOpen(!open)} className="text-gray-900">
            {open ? 
              <svg xmlns="http://www.w3.org/2000/svg" fill="none"
                viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="w-6 h-6">
                <path strokeLinecap="round" strokeLinejoin="round"
                  d="M6.75 15.75 3 12m0 0 3.75-3.75M3 12h18" />
              </svg>
              :
              <svg xmlns="http://www.w3.org/2000/svg" fill="none"
                viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="w-6 h-6">
                <path strokeLinecap="round" strokeLinejoin="round"
                  d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
              </svg>
            }
          </button>
        </div>

        {/* SIDEBAR ITEMS */}
        <div className="mt-5 px-3">
          <SidebarItem 
            title="Dashboard" 
            icon="🏠" 
            active={menu === "dashboard"} 
            onClick={() => setMenu("dashboard")} 
            open={open}
          />

          <SidebarItem 
            title="Purchasing Report" 
            icon="📦" 
            active={menu === "purchasing"} 
            onClick={() => setMenu("purchasing")} 
            open={open}
          />

          <SidebarItem 
            title="Sales Report" 
            icon="💰" 
            active={menu === "sales"} 
            onClick={() => setMenu("sales")} 
            open={open}
          />

          <SidebarItem 
            title="Production Report" 
            icon="🏭" 
            active={menu === "production"} 
            onClick={() => setMenu("production")} 
            open={open}
          />
        </div>
      </div>

      {/* MAIN CONTENT */}
      <div className="flex-1">
        
        {/* PAGE HEADER */}
        <div className="bg-gradient-to-r from-pink-300 to-pink-400 text-white p-6 shadow">
          <h1 className="text-3xl font-semibold flex gap-2">
            {menu === "dashboard" && "🏠 Dashboard"}
            {menu === "sales" && "💰 Sales Report"}
            {menu === "purchasing" && "📦 Purchasing Report"}
            {menu === "production" && "🏭 Production Report"}
          </h1>
        </div>

        {/* PAGE CONTENT */}
        <div className="max-w-7xl mx-auto p-6">
          {menu === "dashboard" && <Dashboard />}
          {menu === "sales" && <SalesPage />}
          {menu === "purchasing" && <PurchasingPage />}
          {menu === "production" && <ProductionPage />}
        </div>

      </div>
    </div>
  );
}

function SidebarItem({ icon, title, active, onClick, open }) {
  return (
    <div
      onClick={onClick}
      className={`flex items-center gap-3 p-3 rounded cursor-pointer mb-2
        ${active ? "bg-pink-100 text-pink-600" : "text-gray-600 hover:bg-gray-100"}`}
    >
      <span className="text-xl">{icon}</span>
      {open && <span className="font-medium">{title}</span>}
    </div>
  );
}