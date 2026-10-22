"use client";
import { useEffect, useRef, useState } from "react";
import { chat, inr, Prediction } from "@/utils/Api";
import ValuationCard from "./Valuationcard";

type Msg = { role: "user" | "ai"; text: string; cards?: any[] };

const suggestions = [
  "What is a 2019 Hyundai Creta worth in Pune?",
  "Compare a 2020 Swift and a 2020 Baleno",
  "EMI for ₹8 lakh at 10% for 4 years",
];

function Card({ r }: { r: any }) {
  if (r.kind === "prediction") return <ValuationCard data={r as Prediction} />;
  if (r.kind === "comparison")
    return (
      <div className="mini">
        {r.results.map((x: any, i: number) => (
          <div key={i} className="row">
            <span>
              {x.car.year} {x.car.brand} {x.car.model}
            </span>
            <b>₹{x.prediction.price_lakh.toFixed(2)} L</b>
          </div>
        ))}
      </div>
    );
  if (r.kind === "what_if")
    return (
      <div className="mini">
        <div className="row">
          <span>Baseline</span>
          <b>{inr(r.baseline.price_rupees)}</b>
        </div>
        {r.scenarios.map((s: any, i: number) => (
          <div key={i} className="row">
            <span>{s.change}</span>
            <b className={s.delta_rupees >= 0 ? "up" : "down"}>
              {s.delta_rupees >= 0 ? "+" : "−"}
              {inr(Math.abs(s.delta_rupees))}
            </b>
          </div>
        ))}
      </div>
    );
  if (r.kind === "emi")
    return (
      <div className="mini">
        <div className="row">
          <span>Monthly EMI</span>
          <b>{inr(r.emi)}</b>
        </div>
        <div className="row">
          <span>Total interest</span>
          <b>{inr(r.total_interest)}</b>
        </div>
        <div className="row">
          <span>Total payable</span>
          <b>{inr(r.total_payable)}</b>
        </div>
      </div>
    );
  if (r.kind === "error") return <p className="error">{r.error}</p>;
  return null;
}

export default function Chat() {
  const [msgs, setMsgs] = useState<Msg[]>([
    {
      role: "ai",
      text: "Tell me about your car — brand, model, year, kms, fuel, city — and I’ll value it. I can also compare cars, test what-if changes and work out EMIs.",
    },
  ]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [thread] = useState(() => "web-" + Math.random().toString(36).slice(2));
  const end = useRef<HTMLDivElement>(null);
  useEffect(() => {
    end.current?.scrollIntoView({ behavior: "smooth" });
  }, [msgs, busy]);

  async function send(text: string) {
    if (!text.trim() || busy) return;
    setMsgs((m) => [...m, { role: "user", text }]);
    setInput("");
    setBusy(true);
    try {
      const r = await chat(text, thread);
      setMsgs((m) => [
        ...m,
        { role: "ai", text: r.reply, cards: r.toolResults },
      ]);
    } catch {
      setMsgs((m) => [
        ...m,
        {
          role: "ai",
          text: "I could not reach the assistant. Make sure Ollama and the backend are running.",
        },
      ]);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="panel chat">
      <h2>Ask the advisor</h2>
      <div className="log">
        {msgs.map((m, i) => (
          <div key={i} className={"msg " + m.role}>
            {m.text && <p>{m.text}</p>}
            {m.cards?.map((c, j) => (
              <Card key={j} r={c} />
            ))}
          </div>
        ))}
        {busy && (
          <div className="msg ai">
            <p className="typing">Working it out…</p>
          </div>
        )}
        <div ref={end} />
      </div>
      {msgs.length === 1 && (
        <div className="chips">
          {suggestions.map((s) => (
            <button key={s} onClick={() => send(s)}>
              {s}
            </button>
          ))}
        </div>
      )}
      <form
        className="composer"
        onSubmit={(e) => {
          e.preventDefault();
          send(input);
        }}
      >
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Describe your car or ask a question"
          aria-label="Message"
        />
        <button className="btn" disabled={busy}>
          Send
        </button>
      </form>
    </div>
  );
}
