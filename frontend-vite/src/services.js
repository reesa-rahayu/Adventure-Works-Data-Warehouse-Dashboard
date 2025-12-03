const API_BASE = "http://localhost:8000/";

export async function getSalesKPI() {
  const res = await fetch(`${API_BASE}/sales/`);
  return res.json();
}

export async function getPurchaseKPI() {
  const res = await fetch(`${API_BASE}/purchase/`);
  return res.json();
}

export async function getProductionKPI() {
  const res = await fetch(`${API_BASE}/production/`);
  return res.json();
}
