import { inr, Prediction } from '@/utils/Api';

/** Price + honest range band (price ± model MAE). */
export default function ValuationCard({ data }: { data: Prediction }) {
  const { price_lakh, price_rupees } = data.prediction;
  const { mae_lakh, r2 } = data.model_metrics;
  const lo = Math.max(price_lakh - mae_lakh, 0), hi = price_lakh + mae_lakh;
  const c = data.car;
  return (
    <section className="valuation" aria-live="polite">
      <p className="v-car">{c.year} {c.brand} {c.model} · {c.fuel} · {c.transmission}</p>
      <p className="v-price">₹{price_lakh.toFixed(2)} <span>lakh</span></p>
      <p className="v-exact">{inr(price_rupees)}</p>

      <div className="gauge" role="img" aria-label={`Likely range ${lo.toFixed(2)} to ${hi.toFixed(2)} lakh`}>
        <div className="gauge-band" />
        <div className="gauge-pin" />
      </div>
      <div className="gauge-labels">
        <span>₹{lo.toFixed(2)} L</span>
        <span>likely range</span>
        <span>₹{hi.toFixed(2)} L</span>
      </div>
      <p className="v-note">
        Typically within ±₹{mae_lakh.toFixed(2)} lakh of real sale prices. Model accuracy (R²): {(r2 * 100).toFixed(1)}%.
      </p>
    </section>
  );
}