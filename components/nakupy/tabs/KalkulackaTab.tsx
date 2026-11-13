"use client";
import { useState } from "react";
import { useCurrency } from "@/lib/context/CurrencyContext";

const PLATFORMS = [
  { name: "Viagogo", fee: 15 },
  { name: "StubHub", fee: 15 },
  { name: "Ticketmaster", fee: 15 },
  { name: "SeatGeek", fee: 10 },
  { name: "Poplatek 0%", fee: 0 },
  { name: "Vlastní", fee: 0 },
];



export default function KalkulackaTab() {
  const { currency, format } = useCurrency();
  const [buyPrice, setBuyPrice] = useState("");
  const [sellPrice, setSellPrice] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [platformIdx, setPlatformIdx] = useState(0);
  const [customFee, setCustomFee] = useState(0);

  const platform = PLATFORMS[platformIdx];
  const feePercent = platform.name === "Vlastní" ? customFee : platform.fee;

  const buyPriceNum = Number(buyPrice) || 0;
  const sellPriceNum = Number(sellPrice) || 0;
  const totalCost = buyPriceNum * quantity;
  const totalRevenue = sellPriceNum * quantity;
  const fees = totalRevenue * (feePercent / 100);
  const netProfit = totalRevenue - fees - totalCost;
  const roi = totalCost > 0 ? (netProfit / totalCost) * 100 : 0;
  const breakEven = totalCost / (quantity * (1 - feePercent / 100));

  const cardStyle: React.CSSProperties = {
    background: "linear-gradient(145deg, rgba(30,28,44,0.85), rgba(20,18,32,0.9))",
    border: "1px solid rgba(123,108,246,0.15)",
    borderRadius: 20,
    padding: "1.5rem",
    backdropFilter: "blur(20px)",
    WebkitBackdropFilter: "blur(20px)",
    position: "relative",
    overflow: "hidden",
  };

  const glowLine = (opacity = "0.4") => (
    <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 1, background: `linear-gradient(90deg, transparent, rgba(123,108,246,${opacity}), transparent)` }} />
  );

  const labelStyle: React.CSSProperties = {
    fontSize: 11, fontWeight: 600, letterSpacing: "0.06em",
    textTransform: "uppercase",
    color: "rgba(255,255,255,0.25)", marginBottom: "0.5rem",
  };

  const cardTitleStyle: React.CSSProperties = {
    fontSize: 11, fontWeight: 700, letterSpacing: "0.1em",
    textTransform: "uppercase",
    color: "rgba(255,255,255,0.25)", marginBottom: "1.25rem",
  };

  const numberInputStyle: React.CSSProperties = {
    width: "100%",
    background: "rgba(255,255,255,0.05)",
    border: "1px solid rgba(255,255,255,0.1)",
    borderRadius: 10,
    padding: "0.65rem 2.8rem 0.65rem 1rem",
    color: "#fff", fontSize: 15, fontWeight: 700,
    fontFamily: "'Space Grotesk', sans-serif",
    outline: "none",
  };

  const rangeStyle = (value: number, max: number): React.CSSProperties => ({
    width: "100%", marginTop: "0.6rem", height: 4,
    borderRadius: 4, outline: "none", cursor: "pointer",
    WebkitAppearance: "none",
    appearance: "none",
    background: `linear-gradient(90deg, #7b6cf6 ${((value / max) * 100).toFixed(1)}%, rgba(255,255,255,0.1) ${((value / max) * 100).toFixed(1)}%)`,
  });

  const stepButtonStyle: React.CSSProperties = {
    width: 36, height: 36, borderRadius: 10,
    background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)",
    color: "#fff", fontSize: 20, cursor: "pointer", display: "flex",
    alignItems: "center", justifyContent: "center", fontWeight: 300,
    transition: "all 0.12s",
  };

  return (
    <div>
      <style>{`
        .kc-slider::-webkit-slider-thumb {
          -webkit-appearance: none;
          appearance: none;
          width: 16px; height: 16px;
          border-radius: 50%;
          background: #7b6cf6;
          border: 2px solid #16121f;
          box-shadow: 0 0 12px rgba(123,108,246,0.6);
          cursor: pointer;
        }
        .kc-slider::-moz-range-thumb {
          width: 16px; height: 16px;
          border-radius: 50%;
          background: #7b6cf6;
          border: 2px solid #16121f;
          box-shadow: 0 0 12px rgba(123,108,246,0.6);
          cursor: pointer;
        }
      `}</style>

      <div style={{ marginBottom: "1.75rem" }}>
        <h1 style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: "1.5rem", fontWeight: 800, color: "#fff", marginBottom: "0.25rem" }}>Kalkulačka</h1>
        <p style={{ fontSize: 13, color: "rgba(255,255,255,0.4)" }}>Orientační kalkulačka zisků</p>
      </div>

      <div style={{
        display: "grid",
        gridTemplateColumns: "1fr 1fr",
        gap: "1.25rem",
        maxWidth: 1100,
      }}>

        {/* LEFT — Inputs */}
        <div style={cardStyle}>
          {glowLine("0.4")}

          {/* Buy price */}
          <div style={{ marginBottom: "1.5rem" }}>
            <div style={labelStyle}>Nákupní cena</div>
            <div style={{ position: "relative" }}>
              <input
                type="number"
                min={1}
                value={buyPrice}
                onChange={e => setBuyPrice(e.target.value)}
                style={numberInputStyle}
                onFocus={e => { e.target.style.borderColor = "#7b6cf6"; e.target.style.background = "rgba(123,108,246,0.08)"; }}
                onBlur={e => { e.target.style.borderColor = "rgba(255,255,255,0.1)"; e.target.style.background = "rgba(255,255,255,0.05)"; }}
              />
              <span style={{ position: "absolute", right: "0.75rem", top: "50%", transform: "translateY(-50%)", fontSize: 12, fontWeight: 600, color: "rgba(255,255,255,0.25)", pointerEvents: "none" }}>
                {currency}
              </span>
            </div>
            <input
              className="kc-slider"
              type="range"
              min={1} max={2000} step={1}
              value={buyPriceNum}
              onChange={e => setBuyPrice(String(e.target.value))}
              style={rangeStyle(buyPriceNum, 2000)}
            />
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, color: "rgba(255,255,255,0.2)", marginTop: "0.3rem" }}>
              <span>1</span><span>2 000 {currency}</span>
            </div>
          </div>

          {/* Sell price */}
          <div style={{ marginBottom: "1.5rem" }}>
            <div style={labelStyle}>Prodejní cena</div>
            <div style={{ position: "relative" }}>
              <input
                type="number"
                min={1}
                value={sellPrice}
                onChange={e => setSellPrice(e.target.value)}
                style={numberInputStyle}
                onFocus={e => { e.target.style.borderColor = "#7b6cf6"; e.target.style.background = "rgba(123,108,246,0.08)"; }}
                onBlur={e => { e.target.style.borderColor = "rgba(255,255,255,0.1)"; e.target.style.background = "rgba(255,255,255,0.05)"; }}
              />
              <span style={{ position: "absolute", right: "0.75rem", top: "50%", transform: "translateY(-50%)", fontSize: 12, fontWeight: 600, color: "rgba(255,255,255,0.25)", pointerEvents: "none" }}>
                {currency}
              </span>
            </div>
            <input
              className="kc-slider"
              type="range"
              min={1} max={5000} step={1}
              value={sellPriceNum}
              onChange={e => setSellPrice(String(e.target.value))}
              style={rangeStyle(sellPriceNum, 5000)}
            />
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, color: "rgba(255,255,255,0.2)", marginTop: "0.3rem" }}>
              <span>1</span><span>5 000 {currency}</span>
            </div>
          </div>

          {/* Quantity */}
          <div style={{ marginBottom: "1.5rem" }}>
            <div style={labelStyle}>Počet lístků</div>
            <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
              <button
                onClick={() => setQuantity(Math.max(1, quantity - 1))}
                style={stepButtonStyle}
                onMouseEnter={e => { e.currentTarget.style.background = "#7b6cf6"; e.currentTarget.style.borderColor = "#7b6cf6"; }}
                onMouseLeave={e => { e.currentTarget.style.background = "rgba(255,255,255,0.06)"; e.currentTarget.style.borderColor = "rgba(255,255,255,0.1)"; }}
              >−</button>
              <span style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 22, fontWeight: 800, color: "#fff", minWidth: 40, textAlign: "center" as const }}>
                {quantity}×
              </span>
              <button
                onClick={() => setQuantity(Math.min(50, quantity + 1))}
                style={stepButtonStyle}
                onMouseEnter={e => { e.currentTarget.style.background = "#7b6cf6"; e.currentTarget.style.borderColor = "#7b6cf6"; }}
                onMouseLeave={e => { e.currentTarget.style.background = "rgba(255,255,255,0.06)"; e.currentTarget.style.borderColor = "rgba(255,255,255,0.1)"; }}
              >+</button>
            </div>
          </div>

          {/* Platform */}
          <div>
            <div style={labelStyle}>Poplatek platformy</div>
            <div style={{ display: "flex", flexWrap: "wrap" as const, gap: 6 }}>
              {PLATFORMS.map((p, i) => (
                <button
                  key={p.name}
                  onClick={() => setPlatformIdx(i)}
                  style={{
                    padding: "0.4rem 0.9rem", borderRadius: 8,
                    fontSize: 12, fontWeight: 600, cursor: "pointer",
                    border: platformIdx === i
                      ? "1px solid #7b6cf6"
                      : "1px solid rgba(255,255,255,0.1)",
                    background: platformIdx === i
                      ? "rgba(123,108,246,0.2)"
                      : "rgba(255,255,255,0.05)",
                    color: platformIdx === i ? "#a89df7" : "rgba(255,255,255,0.5)",
                    transition: "all 0.15s",
                  }}
                >
                  {p.name} {p.fee > 0 ? `(${p.fee}%)` : ""}
                </button>
              ))}
            </div>
            {platform.name === "Vlastní" && (
              <div style={{ marginTop: "0.75rem", display: "flex", alignItems: "center", gap: 10 }}>
                <input
                  type="number"
                  min={0} max={50}
                  value={customFee}
                  onChange={e => setCustomFee(Number(e.target.value))}
                  style={{ ...numberInputStyle, width: 80, padding: "0.65rem 1rem", textAlign: "center" as const }}
                />
                <span style={{ fontSize: 13, color: "rgba(255,255,255,0.5)" }}>% poplatek</span>
              </div>
            )}
          </div>
        </div>

        {/* RIGHT — Results */}
        <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>

          {/* Main result card */}
          <div style={{
            borderRadius: 16, padding: "1.5rem", marginBottom: "1rem",
            overflow: "hidden", position: "relative",
            background: netProfit > 0
              ? "linear-gradient(135deg, rgba(93,232,160,0.12), rgba(50,180,100,0.06))"
              : netProfit < 0
                ? "linear-gradient(135deg, rgba(248,113,113,0.12), rgba(200,60,60,0.06))"
                : "rgba(255,255,255,0.04)",
            border: `1px solid ${netProfit > 0 ? "rgba(93,232,160,0.2)" : netProfit < 0 ? "rgba(248,113,113,0.2)" : "rgba(255,255,255,0.08)"}`,
          }}>
            {glowLine("0.3")}

            {/* Badge */}
            <div style={{
              fontSize: 10, fontWeight: 800, letterSpacing: "0.1em",
              textTransform: "uppercase" as const, marginBottom: "0.6rem",
              color: netProfit > 0 ? "#5de8a0" : netProfit < 0 ? "#f87171" : "rgba(255,255,255,0.25)",
              display: "flex", alignItems: "center", gap: "0.4rem",
            }}>
              <span>{netProfit > 0 ? "✦" : netProfit < 0 ? "✕" : "◈"}</span>
              <span>{netProfit > 0 ? "Ziskový flip" : netProfit < 0 ? "Ztrátový flip" : "Zadejte hodnoty"}</span>
            </div>

            {/* Main amount */}
            <div style={{
              fontFamily: "'Space Grotesk', sans-serif",
              fontSize: "clamp(32px, 5vw, 48px)", fontWeight: 800, lineHeight: 1, marginBottom: "1rem",
              color: netProfit > 0 ? "#5de8a0" : netProfit < 0 ? "#f87171" : "rgba(255,255,255,0.25)",
              textShadow: netProfit > 0 ? "0 0 30px rgba(93,232,160,0.3)" : netProfit < 0 ? "0 0 30px rgba(248,113,113,0.3)" : "none",
            }}>
              {netProfit >= 0 ? "+" : "−"}{Math.abs(netProfit).toLocaleString("cs-CZ", { minimumFractionDigits: 0, maximumFractionDigits: 2 })} {currency}
            </div>

            {/* Meta */}
            <div style={{ display: "flex", gap: "1.5rem" }}>
              {[
                { label: "ROI", value: (roi >= 0 ? "+" : "") + roi.toFixed(1) + "%" },
                { label: "Lístků", value: quantity + "×" },
                { label: "Poplatek", value: feePercent + "%" },
              ].map(m => (
                <div key={m.label}>
                  <div style={{ fontSize: 10, color: "rgba(255,255,255,0.25)", letterSpacing: "0.06em", textTransform: "uppercase" as const, marginBottom: "0.2rem" }}>{m.label}</div>
                  <div style={{ fontSize: 16, fontWeight: 800, fontFamily: "'Space Grotesk', sans-serif", color: netProfit > 0 ? "#5de8a0" : netProfit < 0 ? "#f87171" : "rgba(255,255,255,0.4)" }}>{m.value}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Breakdown */}
          <div style={cardStyle}>
            {glowLine("0.4")}
            <div style={cardTitleStyle}>Rozpis</div>
            {[
              { label: "Nákupní cena / ks", value: buyPriceNum, color: "#fff", prefix: "" },
              { label: "Prodejní cena / ks", value: sellPriceNum, color: "#fff", prefix: "" },
              { label: "Náklady celkem", value: -totalCost, color: "#f87171", prefix: "−" },
              { label: "Příjem celkem", value: totalRevenue, color: "#5de8a0", prefix: "+" },
              { label: `Poplatky (${feePercent}%)`, value: -fees, color: "#f87171", prefix: "−" },
            ].map((row, i, arr) => (
              <div key={row.label} style={{
                display: "flex", justifyContent: "space-between", alignItems: "center",
                padding: "0.75rem 0",
                borderBottom: i < arr.length - 1 ? "1px solid rgba(255,255,255,0.04)" : "none",
              }}>
                <span style={{ fontSize: 13, color: "rgba(255,255,255,0.5)" }}>{row.label}</span>
                <span style={{ fontSize: 13, fontWeight: 700, color: row.color }}>
                  {row.prefix}{Math.abs(row.value).toLocaleString("cs-CZ", { minimumFractionDigits: 0, maximumFractionDigits: 2 })} {currency}
                </span>
              </div>
            ))}
          </div>

          {/* Break-even */}
          <div style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 12, padding: "1rem 1.25rem" }}>
            <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase" as const, color: "rgba(255,255,255,0.25)", marginBottom: "0.75rem" }}>
              Break-even analýza
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
              <div>
                <div style={{ fontSize: 11, color: "rgba(255,255,255,0.3)", marginBottom: "0.2rem" }}>Min. prodejní cena</div>
                <div style={{ fontSize: 18, fontWeight: 800, fontFamily: "'Space Grotesk', sans-serif", color: "#fbbf24" }}>
                  {Math.ceil(breakEven).toLocaleString("cs-CZ")} {currency}
                </div>
                <div style={{ fontSize: 11, color: "rgba(255,255,255,0.25)", marginTop: "0.1rem" }}>aby jsi byl v nule</div>
              </div>
              <div style={{ textAlign: "right" as const }}>
                <div style={{ fontSize: 11, color: "rgba(255,255,255,0.3)", marginBottom: "0.2rem" }}>Marže nad break-even</div>
                <div style={{ fontSize: 18, fontWeight: 800, fontFamily: "'Space Grotesk', sans-serif", color: sellPriceNum > breakEven ? "#5de8a0" : "#f87171" }}>
                  {sellPriceNum > breakEven ? "+" : ""}{Math.round(((sellPriceNum - breakEven) / breakEven) * 100)}%
                </div>
                <div style={{ fontSize: 11, color: "rgba(255,255,255,0.25)", marginTop: "0.1rem" }}>nad minimem</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
