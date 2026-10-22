import { tool } from '@langchain/core/tools';
import { z } from 'zod';

const PREDICT_URL = process.env.PREDICT_API_URL ?? 'http://localhost:8000/predict';

export const carSchema = z.object({
  brand: z.string().describe('Car brand, e.g. BMW, Maruti, Hyundai'),
  model: z.string().describe('Car model, e.g. 3 Series, Swift'),
  year: z.number().int().describe('Manufacturing year, e.g. 2021'),
  km_driven: z.number().describe('Total kilometres driven'),
  fuel: z.string().describe('Petrol, Diesel, CNG, Electric...'),
  transmission: z.string().describe('Manual or Automatic'),
  owner: z.string().describe('First, Second, Third...'),
  location: z.string().describe('City, e.g. Mumbai'),
  engine_cc: z.number().describe('Engine capacity in cc'),
  mileage_kmpl: z.number().describe('Mileage in km per litre'),
});
export type Car = z.infer<typeof carSchema>;

/** Calls your Python model server. */
export async function callPredict(car: Car) {
  const res = await fetch(PREDICT_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(car),
  });
  if (!res.ok) throw new Error(`Prediction API returned ${res.status}`);
  const data = await res.json();
  if (!data.success) throw new Error('Prediction API reported failure');
  return data;
}

export const predictCarPrice = tool(
  async (car) => {
    try {
      const data = await callPredict(car);
      return JSON.stringify({ kind: 'prediction', ...data });
    } catch (e: any) {
      return JSON.stringify({ kind: 'error', error: e.message });
    }
  },
  {
    name: 'predict_car_price',
    description:
      'Predict the used-car resale price. Call only when ALL fields are known.',
    schema: carSchema,
  },
);

export const compareCars = tool(
  async ({ cars }) => {
    try {
      const results = await Promise.all(cars.map((c) => callPredict(c)));
      const ranked = results
        .map((r) => ({ car: r.car, prediction: r.prediction }))
        .sort((a, b) => b.prediction.price_rupees - a.prediction.price_rupees);
      return JSON.stringify({ kind: 'comparison', results: ranked });
    } catch (e: any) {
      return JSON.stringify({ kind: 'error', error: e.message });
    }
  },
  {
    name: 'compare_cars',
    description: 'Predict and compare prices of 2 to 4 cars side by side.',
    schema: z.object({ cars: z.array(carSchema).min(2).max(4) }),
  },
);

export const whatIfAnalysis = tool(
  async ({ base, changes }) => {
    try {
      const baseline = await callPredict(base);
      const scenarios = await Promise.all(
        changes.map(async (ch) => {
          const r = await callPredict({ ...base, [ch.field]: ch.value } as Car);
          return {
            change: `${ch.field} → ${ch.value}`,
            price_rupees: r.prediction.price_rupees,
            delta_rupees: r.prediction.price_rupees - baseline.prediction.price_rupees,
          };
        }),
      );
      return JSON.stringify({
        kind: 'what_if',
        baseline: baseline.prediction,
        car: baseline.car,
        scenarios,
      });
    } catch (e: any) {
      return JSON.stringify({ kind: 'error', error: e.message });
    }
  },
  {
    name: 'what_if_analysis',
    description:
      'Show how the price changes if one attribute changes (km_driven, owner, location, fuel, transmission, year).',
    schema: z.object({
      base: carSchema,
      changes: z
        .array(
          z.object({
            field: z.enum(['km_driven', 'owner', 'location', 'fuel', 'transmission', 'year']),
            value: z.union([z.string(), z.number()]),
          }),
        )
        .min(1)
        .max(5),
    }),
  },
);

export const emiCalculator = tool(
  async ({ price_rupees, down_payment_rupees = 0, annual_rate_percent, tenure_years }) => {
    const principal = Math.max(price_rupees - down_payment_rupees, 0);
    const r = annual_rate_percent / 12 / 100;
    const n = tenure_years * 12;
    const emi = r === 0 ? principal / n : (principal * r * (1 + r) ** n) / ((1 + r) ** n - 1);
    const total = emi * n;
    return JSON.stringify({
      kind: 'emi',
      principal: Math.round(principal),
      emi: Math.round(emi),
      total_payable: Math.round(total),
      total_interest: Math.round(total - principal),
      tenure_months: n,
    });
  },
  {
    name: 'emi_calculator',
    description: 'Monthly EMI for financing a car. Use predicted price as price_rupees if asked.',
    schema: z.object({
      price_rupees: z.number(),
      down_payment_rupees: z.number().optional(),
      annual_rate_percent: z.number().describe('Typical used-car loan: 9-14'),
      tenure_years: z.number(),
    }),
  },
);

export const carTools = [predictCarPrice, compareCars, whatIfAnalysis, emiCalculator];