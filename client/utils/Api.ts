export const API =  process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001';

export type Car = {
  brand: string; model: string; year: number; km_driven: number; fuel: string;
  transmission: string; owner: string; location: string; engine_cc: number; mileage_kmpl: number;
};
export type Prediction = {
  success: boolean; car: Car;
  prediction: { price_lakh: number; price_rupees: number };
  model_metrics: { mae_lakh: number; rmse_lakh: number; r2: number };
};

export const inr = (n: number) => '₹' + Math.round(n).toLocaleString('en-IN');

async function post<T>(path: string, body: unknown): Promise<T> {
  const res = await fetch(API + path, {
    method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error('Request failed (' + res.status + ')');
  return res.json();
}
export const predict = (car: Car) => post<Prediction>('/agent/predict', car);
export const chat = (message: string, threadId: string) =>
  post<{ reply: string; toolResults: any[] }>('/agent/chat', { message, threadId });