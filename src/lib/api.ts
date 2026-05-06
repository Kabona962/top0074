/**
 * 백엔드 기본 URL.
 * frontend/.env.local 에 NEXT_PUBLIC_API_URL=http://127.0.0.1:8000 형태로 둘 수 있습니다.
 */
const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://127.0.0.1:8000";

export type PriceAnalyzeResponse = {
  product_name: string;
  current_price: number;
  unit: string;
  data_source_note: string;
  statistics_summary: string;
  recommendation_markdown: string;
  model_used: string;
};

export async function analyzePrice(productName: string): Promise<PriceAnalyzeResponse> {
  const r = await fetch(`${API_BASE}/api/price/analyze`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ product_name: productName }),
  });
  if (!r.ok) {
    const t = await r.text();
    throw new Error(t || r.statusText);
  }
  return r.json();
}

export type FridgeItem = {
  id: number;
  name: string;
  quantity: string | null;
  expiry_note: string | null;
};

export async function listFridge(): Promise<FridgeItem[]> {
  const r = await fetch(`${API_BASE}/api/fridge/items`, { cache: "no-store" });
  if (!r.ok) throw new Error(await r.text());
  return r.json();
}

export async function addFridgeItem(payload: {
  name: string;
  quantity?: string | null;
  expiry_note?: string | null;
}): Promise<FridgeItem> {
  const r = await fetch(`${API_BASE}/api/fridge/items`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!r.ok) throw new Error(await r.text());
  return r.json();
}

export async function deleteFridgeItem(id: number): Promise<void> {
  const r = await fetch(`${API_BASE}/api/fridge/items/${id}`, { method: "DELETE" });
  if (!r.ok) throw new Error(await r.text());
}

export async function suggestRecipes(preferences?: string | null): Promise<{
  recipe_markdown: string;
  model_used: string;
}> {
  const r = await fetch(`${API_BASE}/api/recipes/suggest`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ preferences: preferences ?? null }),
  });
  if (!r.ok) throw new Error(await r.text());
  return r.json();
}

export type FarmCalendarResponse = {
  applied_date: string;
  region: string | null;
  advice_markdown: string;
  model_used: string;
};

export async function fetchFarmCalendarAdvice(payload: {
  target_date?: string | null;
  region?: string | null;
  farm_notes?: string | null;
}): Promise<FarmCalendarResponse> {
  const r = await fetch(`${API_BASE}/api/farm-calendar/advice`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      target_date: payload.target_date ?? null,
      region: payload.region ?? null,
      farm_notes: payload.farm_notes ?? null,
    }),
  });
  if (!r.ok) {
    const t = await r.text();
    throw new Error(t || r.statusText);
  }
  return r.json();
}
