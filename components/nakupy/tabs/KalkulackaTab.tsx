"use client";
import { useState } from "react";
import { useCurrency } from "@/lib/context/CurrencyContext";

const PLATFORMS = [
  { name: "Viagogo", fee: 25 },
  { name: "StubHub", fee: 15 },
  { name: "Ticketmaster", fee: 15 },
  { name: "SeatGeek", fee: 10 },
  { name: "Poplatek 0%", fee: 0 },
  { name: "Vlastní", fee: 0 },
];

const PRESETS = [
  { label: "Pár lístků", qty: 2 },
  { label: "Malá skupina", qty: 4 },
  { label: "Velká skupina", qty: 8 },
];

export default function KalkulackaTab() {
  const { currency, format } = useCurrency();
  const [buyPrice, setBuyPrice] = useState(100);
  const [sellPrice, setSellPrice] = useState(200);
  const [quantity, setQuantity] = useState(2);
  const [platformIdx, setPlatformIdx] = useState(0);
  const [customFee, setCustomFee] = useState(0);

  const platform = PLATFORMS[platformIdx];
  const feePercent = platform.name === "Vlastní" ? customFee : platform.fee;

  const totalCost = buyPrice * quantity;
  const totalRevenue = sellPrice * quantity;
  const fees = totalRevenue * (feePercent / 100);
  const netProfit = totalRevenue - fees - totalCost;
  const roi = totalCost > 0 ? (netProfit / totalCost) * 100 : 0;
  const breakEven = totalCost / (quantity * (1 - feePercent / 100));
  const isProfit = netProfit >= 0;

  const sliderStyle = {
    width: "100%", height: 4, cursor: "pointer",
    accentColor: "#c0c0c0",
  };

  const inputStyle = {
    background: "#0a0a0a", border: "1px solid #2a2a2a",
    borderRadius: 8, color: "#fff", fontSize: 14,
    padding: "0.5rem 0.75rem", outline: "none",
    width: "80px", textAlign: "center" as const,
  };

  return (
    <div>
      <div style={{ marginBottom: "1.75rem" }}>
        <h1 style={{ fontSize: "1.5rem", fontWeight: 700, color: "#fff", marginBottom: "0.25rem" }}>Kalkulačka</h1>
        <p style={{ fontSize: 13, color: "#3a3a3a" }}>Orientační kalkulačka zisků</p>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: "1.25rem" }}>

        {/* LEFT — Inputs */}
        <div style={{ background: "#111111", border: "1px solid #1a1a1a", borderRadius: 20, padding: "1.75rem", position: "relative", overflow: "hidden" }}>
          <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 1, background: "linear-gradient(90deg, transparent, #c0c0c0, transparent)" }} />

          {/* Buy price */}
          <div style={{ marginBottom: "1.5rem" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.75rem" }}>
              <span style={{ fontSize: 11, fontWeight: 600, letterSpacing: "0.08em", color: "#525252" }}>NÁKUPNÍ CENA · ZA LÍSTEK</span>
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <input type="number" value={buyPrice} onChange={e => setBuyPrice(Number(e.target.value))} style={inputStyle} min={1} />
                <span style={{ fontSize: 13, color: "#c0c0c0", fontWeight: 600 }}>{currency}</span>
              </div>
            </div>
            <input type="range" min={1} max={2000} step={1} value={buyPrice} onChange={e => setBuyPrice(Number(e.target.value))} style={sliderStyle} />
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, color: "#3a3a3a", marginTop: 4 }}>
              <span>1</span><span>2 000 {currency}</span>
            </div>
          </div>

          {/* Sell price */}
          <div style={{ marginBottom: "1.5rem" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.75rem" }}>
              <span style={{ fontSize: 11, fontWeight: 600, letterSpacing: "0.08em", color: "#525252" }}>PRODEJNÍ CENA · ZA LÍSTEK</span>
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <input type="number" value={sellPrice} onChange={e => setSellPrice(Number(e.target.value))} style={inputStyle} min={1} />
                <span style={{ fontSize: 13, color: "#c0c0c0", fontWeight: 600 }}>{currency}</span>
              </div>
            </div>
            <input type="range" min={1} max={5000} step={1} value={sellPrice} onChange={e => setSellPrice(Number(e.target.value))} style={sliderStyle} />
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, color: "#3a3a3a", marginTop: 4 }}>
              <span>1</span><span>5 000 {currency}</span>
            </div>
          </div>

          {/* Quantity */}
          <div style={{ marginBottom: "1.5rem" }}>
            <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: "0.08em", color: "#525252", marginBottom: "0.75rem" }}>POČET LÍSTKŮ</div>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <button onClick={() => setQuantity(Math.max(1, quantity - 1))} style={{ width: 32, height: 32, borderRadius: 8, background: "#1a1a1a", border: "1px solid #2a2a2a", color: "#fff", cursor: "pointer", fontSize: 18 }}>−</button>
              <span style={{ fontSize: 24, fontWeight: 700, color: "#fff", minWidth: 40, textAlign: "center" as const }}>{quantity}</span>
              <button onClick={() => setQuantity(Math.min(50, quantity + 1))} style={{ width: 32, height: 32, borderRadius: 8, background: "#1a1a1a", border: "1px solid #2a2a2a", color: "#fff", cursor: "pointer", fontSize: 18 }}>+</button>
            </div>
            {/* Presets */}
            <div style={{ display: "flex", gap: 6, marginTop: "0.75rem" }}>
              {PRESETS.map(p => (
                <button key={p.label} onClick={() => setQuantity(p.qty)} style={{
                  padding: "4px 10px", fontSize: 11, fontWeight: 500,
                  background: quantity === p.qty ? "#2a2a2a" : "transparent",
                  border: "1px solid #2a2a2a", borderRadius: 6,
                  color: quantity === p.qty ? "#fff" : "#525252", cursor: "pointer",
                }}>
                  {p.label}
                </button>
              ))}
            </div>
          </div>

          {/* Platform */}
          <div>
            <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: "0.08em", color: "#525252", marginBottom: "0.75rem" }}>POPLATEK PLATFORMY</div>
            <div style={{ display: "flex", flexWrap: "wrap" as const, gap: 6 }}>
              {PLATFORMS.map((p, i) => (
                <button key={p.name} onClick={() => setPlatformIdx(i)} style={{
                  padding: "5px 12px", fontSize: 12, fontWeight: 500,
                  background: platformIdx === i ? "linear-gradient(135deg, #ffffff, #a0a0a0)" : "transparent",
                  border: platformIdx === i ? "none" : "1px solid #2a2a2a",
                  borderRadius: 8,
                  color: platformIdx === i ? "#000" : "#525252", cursor: "pointer",
                }}>
                  {p.name} {p.fee > 0 ? `(${p.fee}%)` : ""}
                </button>
              ))}
            </div>
            {platform.name === "Vlastní" && (
              <div style={{ marginTop: "0.75rem", display: "flex", alignItems: "center", gap: 10 }}>
                <input type="number" min={0} max={50} value={customFee} onChange={e => setCustomFee(Number(e.target.value))} style={{ ...inputStyle, width: 60 }} />
                <span style={{ fontSize: 13, color: "#525252" }}>% poplatek</span>
              </div>
            )}
          </div>
        </div>

        {/* RIGHT — Results */}
        <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>

          {/* Main profit card */}
          <div style={{
            background: isProfit ? "linear-gradient(135deg, #0a2a1a, #0d1f15)" : "linear-gradient(135deg, #2a0a0a, #1f0d0d)",
            border: `1px solid ${isProfit ? "rgba(52,211,153,0.25)" : "rgba(248,113,113,0.25)"}`,
            borderRadius: 20, padding: "1.75rem", position: "relative", overflow: "hidden",
          }}>
            <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 1, background: `linear-gradient(90deg, transparent, ${isProfit ? "#34d399" : "#f87171"}, transparent)` }} />
            <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.12em", color: isProfit ? "rgba(52,211,153,0.6)" : "rgba(248,113,113,0.6)", marginBottom: 8 }}>
              {isProfit ? "✓ ZISKOVÝ FLIP" : "✗ ZTRÁTOVÝ FLIP"}
            </div>
            <div style={{ fontSize: 42, fontWeight: 800, color: isProfit ? "#34d399" : "#f87171", letterSpacing: "-0.02em", marginBottom: 8 }}>
              {isProfit ? "+" : ""}{Math.round(netProfit).toLocaleString("cs-CZ")} {currency}
            </div>
            <div style={{ display: "flex", gap: "1.5rem" }}>
              <div>
                <div style={{ fontSize: 11, color: isProfit ? "rgba(52,211,153,0.5)" : "rgba(248,113,113,0.5)" }}>ROI</div>
                <div style={{ fontSize: 18, fontWeight: 700, color: isProfit ? "#34d399" : "#f87171" }}>{roi.toFixed(1)}%</div>
              </div>
              <div>
                <div style={{ fontSize: 11, color: "#525252" }}>Lístků</div>
                <div style={{ fontSize: 18, fontWeight: 700, color: "#c0c0c0" }}>{quantity}×</div>
              </div>
              <div>
                <div style={{ fontSize: 11, color: "#525252" }}>Poplatek</div>
                <div style={{ fontSize: 18, fontWeight: 700, color: "#fbbf24" }}>{feePercent}%</div>
              </div>
            </div>
          </div>

          {/* Detail breakdown */}
          <div style={{ background: "#111111", border: "1px solid #1a1a1a", borderRadius: 16, padding: "1.25rem 1.5rem" }}>
            {[
              { label: "Nákupní cena / ks", value: `${buyPrice.toLocaleString("cs-CZ")} ${currency}`, color: "#c0c0c0" },
              { label: "Prodejní cena / ks", value: `${sellPrice.toLocaleString("cs-CZ")} ${currency}`, color: "#c0c0c0" },
              { label: "Celkové náklady", value: `-${totalCost.toLocaleString("cs-CZ")} ${currency}`, color: "#f87171" },
              { label: "Celkový příjem", value: `+${totalRevenue.toLocaleString("cs-CZ")} ${currency}`, color: "#34d399" },
              { label: `Poplatky (${feePercent}%)`, value: `-${Math.round(fees).toLocaleString("cs-CZ")} ${currency}`, color: "#fbbf24" },
            ].map((row, i, arr) => (
              <div key={row.label} style={{
                display: "flex", justifyContent: "space-between", alignItems: "center",
                padding: "0.6rem 0",
                borderBottom: i < arr.length - 1 ? "1px solid #141414" : "none",
              }}>
                <span style={{ fontSize: 13, color: "#525252" }}>{row.label}</span>
                <span style={{ fontSize: 14, fontWeight: 600, color: row.color }}>{row.value}</span>
              </div>
            ))}
          </div>

          {/* Break-even */}
          <div style={{ background: "#111111", border: "1px solid #1a1a1a", borderRadius: 16, padding: "1.25rem 1.5rem" }}>
            <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: "0.08em", color: "#3a3a3a", marginBottom: "0.75rem" }}>BREAK-EVEN ANALÝZA</div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
              <div>
                <div style={{ fontSize: 11, color: "#525252", marginBottom: 4 }}>Min. prodejní cena</div>
                <div style={{ fontSize: 18, fontWeight: 700, color: "#fbbf24" }}>{Math.ceil(breakEven).toLocaleString("cs-CZ")} {currency}</div>
                <div style={{ fontSize: 11, color: "#3a3a3a", marginTop: 2 }}>aby jsi byl v nule</div>
              </div>
              <div>
                <div style={{ fontSize: 11, color: "#525252", marginBottom: 4 }}>Marže nad break-even</div>
                <div style={{ fontSize: 18, fontWeight: 700, color: sellPrice > breakEven ? "#34d399" : "#f87171" }}>
                  {sellPrice > breakEven ? "+" : ""}{Math.round(((sellPrice - breakEven) / breakEven) * 100)}%
                </div>
                <div style={{ fontSize: 11, color: "#3a3a3a", marginTop: 2 }}>nad minimem</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
