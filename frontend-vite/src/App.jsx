import { useState } from "react";
import { useAuth } from "./components/hooks/useAuth.js";
import Dashboard from "./pages/dashboard.jsx";
import SalesPage from "./pages/sales.jsx";
import PurchasingPage from "./pages/purchasing.jsx";
import ProductionPage from "./pages/production.jsx";
import SalesOlapPage from "./pages/sales-olap.jsx";
import PurchasingOlapPage from "./pages/purchasing-olap.jsx";
import ProductionOlapPage from "./pages/production-olap.jsx";
import LoginPage from "./pages/auth/login.jsx";

export default function App() {
  const [open, setOpen] = useState(true);
  const [menu, setMenu] = useState("dashboard");
  const { user, login, logout, loading } = useAuth();

  if (loading) return <div className="flex h-screen items-center justify-center">Loading...</div>;
  
  if (!user) {
    return <LoginPage onLogin={login} />;
  }

  return (
    <div className="min-h-screen bg-gray-100 flex" style={{ fontFamily: "'Inter', sans-serif" }}>
      {/* SIDEBAR */}
      <div className={`${open ? "w-64" : "w-20"} bg-white shadow-lg transition-all duration-300 flex flex-col h-screen sticky top-0`}>
        
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
            {/* Dashboard: Everyone can see this */}
            <SidebarItem 
              title="Dashboard" icon="🏠" 
              active={menu === "dashboard"} 
              onClick={() => setMenu("dashboard")} 
              open={open}
            />

            {/* Purchasing: GM or Purchasing role only */}
            {(user.role === 'gm' || user.role === 'purchasing') && (
              <SidebarItem 
                title="Purchasing Report" icon="📦" 
                active={menu === "purchasing"} 
                onClick={() => setMenu("purchasing")} 
                open={open}
              />
            )}

            {/* Sales: GM or Sales role only */}
            {(user.role === 'gm' || user.role === 'sales') && (
              <SidebarItem 
                title="Sales Report" icon="💰" 
                active={menu === "sales"} 
                onClick={() => setMenu("sales")} 
                open={open}
              />
            )}

            {/* Production: GM or Production role only */}
            {(user.role === 'gm' || user.role === 'production') && (
              <SidebarItem 
                title="Production Report" icon="🏭" 
                active={menu === "production"} 
                onClick={() => setMenu("production")} 
                open={open}
              />
            )}
          </div>

          {/* OLAP */}
          <div className="mt-6">
            <p className={`text-xs font-bold text-gray-400 mb-2 px-3 uppercase ${!open && "hidden"}`}>OLAP Cubes</p>
            
            {(user.role === 'gm' || user.role === 'sales') && (
              <SidebarItem title="Sales OLAP" icon="📊" active={menu === "sales-olap"} onClick={() => setMenu("sales-olap")} open={open} />
            )}

            {(user.role === 'gm' || user.role === 'purchasing') && (
              <SidebarItem title="Purchasing OLAP" icon="📉" active={menu === "purchasing-olap"} onClick={() => setMenu("purchasing-olap")} open={open} />
            )}

            {(user.role === 'gm' || user.role === 'production') && (
              <SidebarItem title="Production OLAP" icon="🏗️" active={menu === "production-olap"} onClick={() => setMenu("production-olap")} open={open} />
            )}
          </div>
        
          {/* BOTTOM SECTION - User Info & Logout */}
          <div className="mt-auto border-t p-3 bg-gray-50">
            <div className={`flex items-center gap-3 p-2 mb-2 ${!open && "justify-center"}`}>
              <div className="w-8 h-8 rounded-full bg-pink-500 flex items-center justify-center text-white text-xs">
                  {user.name.charAt(0)}
              </div>
              {open && (
                <div className="overflow-hidden">
                  <p className="text-sm font-bold truncate">{user.name}</p>
                  <p className="text-xs text-gray-500 uppercase">{user.role}</p>
                </div>
              )}
            </div>
            
            <button 
              onClick={logout}
              className="w-full flex items-center gap-3 p-3 rounded text-red-600 hover:bg-red-50 transition-colors"
            >
              <span className="text-xl">🚪</span>
              {open && <span className="font-medium">Logout</span>}
            </button>
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
          
          {menu === "sales" && (user.role === 'gm' || user.role === 'sales') && <SalesPage />}
          {menu === "sales-olap" && (user.role === 'gm' || user.role === 'sales') && <SalesOlapPage />}
          
          {menu === "purchasing" && (user.role === 'gm' || user.role === 'purchasing') && <PurchasingPage />}
          {menu === "purchasing-olap" && (user.role === 'gm' || user.role === 'purchasing') && <PurchasingOlapPage />}
          
          {menu === "production" && (user.role === 'gm' || user.role === 'production') && <ProductionPage />}
          {menu === "production-olap" && (user.role === 'gm' || user.role === 'production') && <ProductionOlapPage />}
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