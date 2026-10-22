'use client';
import { useState } from 'react';
import { Car, Prediction, predict } from '@/utils/Api';
import ValuationCard from './Valuationcard';

const initial: Car = {
  brand: 'BMW', model: '3 Series', year: 2021, km_driven: 42000, fuel: 'Diesel',
  transmission: 'Automatic', owner: 'First', location: 'Mumbai', engine_cc: 1995, mileage_kmpl: 20,
};

export default function PredictForm() {
  const [car, setCar] = useState<Car>(initial);
  const [res, setRes] = useState<Prediction | null>(null);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState('');

  const set = (k: keyof Car, numeric = false) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setCar({ ...car, [k]: numeric ? Number(e.target.value) : e.target.value });

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true); setErr('');
    try { setRes(await predict(car)); }
    catch (x: any) { setErr('Could not reach the valuation service. Check that the backend and model server are running.'); }
    finally { setLoading(false); }
  }

  const text = (k: keyof Car, label: string) => (
    <label>{label}<input value={car[k] as string} onChange={set(k)} required /></label>
  );
  const num = (k: keyof Car, label: string, step = 1) => (
    <label>{label}<input type="number" step={step} value={car[k] as number} onChange={set(k, true)} required /></label>
  );
  const pick = (k: keyof Car, label: string, opts: string[]) => (
    <label>{label}
      <select value={car[k] as string} onChange={set(k)}>{opts.map((o) => <option key={o}>{o}</option>)}</select>
    </label>
  );

  return (
    <div className="panel">
      <h2>Quick valuation</h2>
      <form onSubmit={submit} className="grid">
        {text('brand', 'Brand')}{text('model', 'Model')}
        {num('year', 'Year')}{num('km_driven', 'Kilometres driven')}
        {pick('fuel', 'Fuel', ['Petrol', 'Diesel', 'CNG', 'Electric'])}
        {pick('transmission', 'Transmission', ['Manual', 'Automatic'])}
        {pick('owner', 'Owner', ['First', 'Second', 'Third', 'Fourth & Above'])}
        {text('location', 'City')}
        {num('engine_cc', 'Engine (cc)')}{num('mileage_kmpl', 'Mileage (km/l)', 0.1)}
        <button className="btn wide" disabled={loading}>{loading ? 'Valuing…' : 'Get valuation'}</button>
      </form>
      {err && <p className="error" role="alert">{err}</p>}
      {res && <ValuationCard data={res} />}
    </div>
  );
}