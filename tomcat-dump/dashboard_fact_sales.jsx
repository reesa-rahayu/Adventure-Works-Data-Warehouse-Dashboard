import React, { useEffect, useState } from "react";
import { LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid, BarChart, Bar, PieChart, Pie, Cell, ResponsiveContainer } from "recharts";
import { motion } from "framer-motion";

// FactSales Dashboard — Sales by Region with drill-down
// - Adds regional KPIs and multi-level charts (country -> province -> city)
// - Replace mock fetches with your API endpoints that aggregate factsales by geography

export default function FactSalesDashboard() {
  // filters
  const [dateRange, setDateRange] = useState({ start: "2025-01-01", end: "2025-12-31" });
  const [productFilter, setProductFilter] = useState("");
  const [salespersonFilter, setSalespersonFilter] = useState("");

  // drilldown level: 'country' | 'province' | 'city'
  const [drillLevel, setDrillLevel] = useState("country");
  const [selectedCountry, setSelectedCountry] = useState(null);
  const [selectedProvince, setSelectedProvince] = useState(null);

  // KPI counts for addresses/geo
  const [geoKpis, setGeoKpis] = useState({ totalAddresses: 0, totalCities: 0, totalProvinces: 0, totalCountries: 0 });

  // data states for region charts
  const [pieCountry, setPieCountry] = useState([]); // [{name, value}]
  const [pieProvince, setPieProvince] = useState([]);
  const [pieCity, setPieCity] = useState([]);
  const [lineOrdersByCountry, setLineOrdersByCountry] = useState([]); // [{date, countryA: val, countryB: val...}] - for simplicity we will use simplified structure
  const [lineIncomeByCountry, setLineIncomeByCountry] = useState([]);
  const [top5Cities, setTop5Cities] = useState([]); // [{name, orders}]

  // other states
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadDashboard();
  }, [dateRange, productFilter, salespersonFilter, drillLevel, selectedCountry, selectedProvince]);

  async function loadDashboard() {
    setLoading(true);
    try {
      // Replace these with real API endpoints that aggregate factsales by geography and date range
      // Suggested endpoints:
      // GET /api/factsales/geo-kpis?start=&end=
      // GET /api/factsales/by-country?start=&end=
      // GET /api/factsales/by-province?country=&start=&end=
      // GET /api/factsales/by-city?province=&start=&end=
      // GET /api/factsales/orders-timeseries-by-country?countries=...&start=&end=
      // GET /api/factsales/income-timeseries-by-country?countries=...&start=&end=
      // GET /api/factsales/top-cities?start=&end=&limit=5

      // Using mock data for demo
      const demoGeoKpis = mockGeoKpis();
      const demoPieCountry = mockPieCountry();
      const demoPieProvince = mockPieProvince();
      const demoPieCity = mockPieCity();
      const demoLineOrders = mockLineOrdersByCountry();
      const demoLineIncome = mockLineIncomeByCountry();
      const demoTop5Cities = mockTop5Cities();

      setGeoKpis(demoGeoKpis);
      setPieCountry(demoPieCountry);
      setPieProvince(demoPieProvince);
      setPieCity(demoPieCity);
      setLineOrdersByCountry(demoLineOrders);
      setLineIncomeByCountry(demoLineIncome);
      setTop5Cities(demoTop5Cities);
    } catch (err) {
      console.error("Failed to load dashboard data", err);
    } finally {
      setLoading(false);
    }
  }

  // handle clicks on pie slices to drill down
  function onCountrySliceClick(data) {
    if (!data) return;
    setSelectedCountry(data.name);
    setDrillLevel("province");
  }
  function onProvinceSliceClick(data) {
    if (!data) return;
    setSelectedProvince(data.name);
    setDrillLevel("city");
  }

  const COLORS = ["#4F46E5", "#06B6D4", "#F59E0B", "#EF4444", "#10B981", "#8B5CF6"];

  return (
    <div className="p-6 min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto">
        <header className="mb-6">
          <h1 className="text-3xl font-bold">FactSales — Sales by Region</h1>
          <p className="text-sm text-gray-600 mt-1">Drill-down: Country → Province → City</p>
        </header>

        {/* filters */}
        <motion.div className="bg-white p-4 rounded-2xl shadow-sm flex gap-4 items-end mb-6" layout>
          <div>
            <label className="block text-xs text-gray-500">Start Date</label>
            <input type="date" value={dateRange.start} onChange={(e) => setDateRange({ ...dateRange, start: e.target.value })} className="mt-1 p-2 border rounded-md" />
          </div>
          <div>
            <label className="block text-xs text-gray-500">End Date</label>
            <input type="date" value={dateRange.end} onChange={(e) => setDateRange({ ...dateRange, end: e.target.value })} className="mt-1 p-2 border rounded-md" />
          </div>
          <div className="flex-1">
            <label className="block text-xs text-gray-500">Product (search)</label>
            <input placeholder="Product name or number" value={productFilter} onChange={(e) => setProductFilter(e.target.value)} className="mt-1 p-2 w-full border rounded-md" />
          </div>
          <div>
            <label className="block text-xs text-gray-500">Salesperson</label>
            <input placeholder="Salesperson" value={salespersonFilter} onChange={(e) => setSalespersonFilter(e.target.value)} className="mt-1 p-2 border rounded-md" />
          </div>
          <div className="ml-auto flex items-center gap-2">
            <button onClick={loadDashboard} className="px-4 py-2 rounded-xl bg-indigo-600 text-white">Refresh</button>
            <div className="text-sm text-gray-500">Drill level:</div>
            <select value={drillLevel} onChange={(e) => setDrillLevel(e.target.value)} className="p-2 border rounded-md">
              <option value="country">Country</option>
              <option value="province">Province</option>
              <option value="city">City</option>
            </select>
          </div>
        </motion.div>

        {/* Geo KPIs */}
        <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <Card title="Total Addresses" value={geoKpis.totalAddresses.toLocaleString()} />
          <Card title="Total Cities" value={geoKpis.totalCities.toLocaleString()} />
          <Card title="Total Provinces" value={geoKpis.totalProvinces.toLocaleString()} />
          <Card title="Total Countries" value={geoKpis.totalCountries.toLocaleString()} />
        </section>

        {/* Drilldown charts area */}
        <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left: Pie charts stack (country / province / city) */}
          <div className="col-span-1 bg-white p-4 rounded-2xl shadow-sm">
            <h3 className="text-lg font-semibold mb-2">Pie Charts (drill by click)</h3>

            <div className="space-y-6">
              <div>
                <div className="text-sm text-gray-600 mb-2">By Country</div>
                <div style={{ width: "100%", height: 240 }}>
                  <ResponsiveContainer>
                    <PieChart>
                      <Pie data={pieCountry} dataKey="value" nameKey="name" outerRadius={80} label onClick={(e) => onCountrySliceClick(e)}>
                        {pieCountry.map((entry, index) => (
                          <Cell key={`c-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div>
                <div className="text-sm text-gray-600 mb-2">By Province {selectedCountry ? `(Country: ${selectedCountry})` : ""}</div>
                <div style={{ width: "100%", height: 240 }}>
                  <ResponsiveContainer>
                    <PieChart>
                      <Pie data={pieProvince} dataKey="value" nameKey="name" outerRadius={80} label onClick={(e) => onProvinceSliceClick(e)}>
                        {pieProvince.map((entry, index) => (
                          <Cell key={`p-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div>
                <div className="text-sm text-gray-600 mb-2">By City {selectedProvince ? `(Province: ${selectedProvince})` : ""}</div>
                <div style={{ width: "100%", height: 240 }}>
                  <ResponsiveContainer>
                    <PieChart>
                      <Pie data={pieCity} dataKey="value" nameKey="name" outerRadius={80} label>
                        {pieCity.map((entry, index) => (
                          <Cell key={`ct-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          </div>

          {/* Middle: Line charts — orders and income by country */}
          <div className="col-span-2 bg-white p-4 rounded-2xl shadow-sm">
            <h3 className="text-lg font-semibold mb-2">Orders & Income by Country</h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-2">
                <div className="text-sm text-gray-600 mb-2">Order Quantity (by country) — time series</div>
                <div style={{ width: "100%", height: 260 }}>
                  <ResponsiveContainer>
                    <LineChart data={lineOrdersByCountry}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="date" />
                      <YAxis />
                      <Tooltip />
                      {/* For demo, lineOrdersByCountry has keys: date, CountryA, CountryB... */}
                      {lineOrdersByCountry.length > 0 && Object.keys(lineOrdersByCountry[0]).filter(k => k !== 'date').map((countryKey, idx) => (
                        <Line key={countryKey} type="monotone" dataKey={countryKey} stroke={COLORS[idx % COLORS.length]} dot={false} />
                      ))}
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className="p-2">
                <div className="text-sm text-gray-600 mb-2">Income (by country) — time series</div>
                <div style={{ width: "100%", height: 260 }}>
                  <ResponsiveContainer>
                    <LineChart data={lineIncomeByCountry}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="date" />
                      <YAxis />
                      <Tooltip />
                      {lineIncomeByCountry.length > 0 && Object.keys(lineIncomeByCountry[0]).filter(k => k !== 'date').map((countryKey, idx) => (
                        <Line key={countryKey} type="monotone" dataKey={countryKey} stroke={COLORS[idx % COLORS.length]} dot={false} />
                      ))}
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>

            <div className="mt-4">
              <h4 className="text-sm font-medium mb-2">Top 5 Cities by Orders</h4>
              <div style={{ width: "100%", height: 240 }}>
                <ResponsiveContainer>
                  <BarChart data={top5Cities} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis type="number" />
                    <YAxis dataKey="name" type="category" />
                    <Tooltip />
                    <Bar dataKey="orders" fill={COLORS[1]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </section>

        {loading && <div className="text-sm text-gray-500 mt-4">Loading…</div>}

        <footer className="mt-8 text-xs text-gray-400">Note: connect the mock loaders to your SQL/API. I can provide example SQL queries to power each endpoint.</footer>
      </div>
    </div>
  );
}

// --- Small presentational components and helpers ---
function Card({ title, value }) {
  return (
    <div className="bg-white p-4 rounded-2xl shadow-sm flex flex-col">
      <div className="text-xs text-gray-500">{title}</div>
      <div className="text-2xl font-semibold mt-2">{value}</div>
    </div>
  );
}

// --- Mock data generators for demo purposes ---
function mockGeoKpis() {
  return { totalAddresses: 12845, totalCities: 312, totalProvinces: 38, totalCountries: 6 };
}

function mockPieCountry() {
  return [
    { name: "USA", value: 520000 },
    { name: "Canada", value: 240000 },
    { name: "UK", value: 180000 },
    { name: "Australia", value: 120000 },
    { name: "Indonesia", value: 90000 },
  ];
}

function mockPieProvince() {
  // If a country is selected, this would be provinces for that country
  return [
    { name: "Province A", value: 220000 },
    { name: "Province B", value: 150000 },
    { name: "Province C", value: 90000 },
    { name: "Province D", value: 50000 },
  ];
}

function mockPieCity() {
  return [
    { name: "City X", value: 120000 },
    { name: "City Y", value: 90000 },
    { name: "City Z", value: 70000 },
    { name: "City W", value: 40000 },
  ];
}

function mockLineOrdersByCountry() {
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  return months.map(m => ({ date: m, USA: Math.floor(2000 + Math.random() * 4000), Canada: Math.floor(800 + Math.random() * 2000), UK: Math.floor(600 + Math.random() * 1500) }));
}

function mockLineIncomeByCountry() {
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  return months.map(m => ({ date: m, USA: Math.floor(200000 + Math.random() * 400000), Canada: Math.floor(80000 + Math.random() * 200000), UK: Math.floor(60000 + Math.random() * 150000) }));
}

function mockTop5Cities() {
  return [
    { name: "New York", orders: 4200 },
    { name: "Los Angeles", orders: 3200 },
    { name: "Toronto", orders: 2100 },
    { name: "London", orders: 1900 },
    { name: "Jakarta", orders: 1600 },
  ];
}
