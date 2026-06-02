"use client";
import { useState, useEffect } from "react";
import { getCapital, setCapital } from "@/lib/actions/capital";

const currencies = ["CZK", "EUR", "USD", "GBP"];

export default function UvodTab() {
  const [capital, setCapitalState] = useState<number | null>(null);
  const [currency, setCurrency] = useState("CZK");
  const [loading, setLoading] = useState(true);
  const [input, setInput] = useState("");
  const [selectedCurrency, setSelectedCurrency] = useState("CZK");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    getCapital().then((data) => {
      if (data?.capital && data.capital > 0) {
        setCapitalState(data.capital);
        setCurrency(data.capital_currency ?? "CZK");
      }
      setLoading(false);
    });
  }, []);

  async function handleSave() {
    const amount = parseFloat(input.replace(",", "."));
    if (isNaN(amount) || amount <= 0) return setError("Zadejte platnou částku.");
    setSaving(true);
    const result = await setCapital(amount, selectedCurrency);
    if (result?.error) setError(result.error);
    else {
      setCapitalState(amount);
      setCurrency(selectedCurrency);
    }
    setSaving(false);
  }

  if (loading) return <div style={{ color: "#525252" }}>Načítání...</div>;

  // No capital set yet — show setup screen
  if (capital === null || capital === 0) {
    return (
      <div style={{ maxWidth: 480 }}>
        <h1 style={{ fontSize: "1.5rem", fontWeight: 700, color: "#fff", marginBottom: "0.5rem" }}>
          Vítejte v Seznam nákupů
        </h1>
        <p style={{ color: "#525252", marginBottom: "2rem", lineHeight: 1.6 }}>
          Než začnete, zadejte svůj počáteční kapitál. Tento údaj slouží ke sledování vašeho celkového zůstatku.
        </p>

        {error && (
          <div style={{ marginBottom: "1rem", padding: "12px 16px", borderRadius: 10, background: "#2a0a0a", border: "1px solid #7f1d1d", color: "#fca5a5", fontSize: 14 }}>
            {error}
          </div>
        )}

        <div style={{
          background: "#111111",
          border: "1px solid #1f1f1f",
          borderRadius: 16,
          padding: "1.75rem",
        }}>
          <label style={{ fontSize: 13, color: "#525252", display: "block", marginBottom: "0.5rem" }}>
            Počáteční kapitál
          </label>

          <div style={{ display: "flex", gap: "0.75rem", marginBottom: "1.25rem" }}>
            <input
              type="text"
              placeholder="např. 50000"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              style={{
                flex: 1, padding: "0.75rem 1rem",
                background: "#0a0a0a", border: "1px solid #2a2a2a",
                borderRadius: 10, color: "#fff", fontSize: 16,
                outline: "none",
              }}
            />
            <select
              value={selectedCurrency}
              onChange={(e) => setSelectedCurrency(e.target.value)}
              style={{
                padding: "0.75rem 1rem",
                background: "#0a0a0a", border: "1px solid #2a2a2a",
                borderRadius: 10, color: "#fff", fontSize: 14,
                outline: "none", cursor: "pointer",
              }}
            >
              {currencies.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>

          <button
            onClick={handleSave}
            disabled={saving}
            style={{
              width: "100%", padding: "0.85rem",
              background: "linear-gradient(135deg, #ffffff, #a0a0a0)",
              border: "none", borderRadius: 10,
              color: "#000", fontWeight: 700, fontSize: 14,
              letterSpacing: "0.05em", cursor: "pointer",
              opacity: saving ? 0.7 : 1,
            }}
          >
            {saving ? "UKLÁDÁM..." : "NASTAVIT KAPITÁL"}
          </button>
        </div>
      </div>
    );
  }

  // Capital is set — show overview
  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "2rem" }}>
        <h1 style={{ fontSize: "1.5rem", fontWeight: 700, color: "#fff" }}>Úvod</h1>
        <button
          onClick={() => setCapitalState(null)}
          style={{
            padding: "6px 14px", fontSize: 12,
            background: "transparent", border: "1px solid #2a2a2a",
            borderRadius: 8, color: "#525252", cursor: "pointer",
          }}
        >
          Upravit kapitál
        </button>
      </div>

      {/* Capital cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: "1rem", marginBottom: "2rem" }}>
        {[
          { label: "Počáteční kapitál", value: `${capital.toLocaleString("cs-CZ")} ${currency}`, color: "#c0c0c0" },
          { label: "Aktuální zůstatek", value: `${capital.toLocaleString("cs-CZ")} ${currency}`, color: "#c0c0c0" },
          { label: "Investováno", value: `0 ${currency}`, color: "#fbbf24" },
          { label: "Celkový zisk", value: `0 ${currency}`, color: "#34d399" },
        ].map((card) => (
          <div key={card.label} style={{
            background: "#111111",
            border: "1px solid #1f1f1f",
            borderRadius: 14,
            padding: "1.25rem",
          }}>
            <div style={{ fontSize: 12, color: "#525252", marginBottom: "0.5rem" }}>{card.label}</div>
            <div style={{ fontSize: "1.4rem", fontWeight: 700, color: card.color }}>{card.value}</div>
          </div>
        ))}
      </div>

      <p style={{ color: "#3a3a3a", fontSize: 14 }}>Přidejte první nákup a sledujte svůj zůstatek v reálném čase.</p>
    </div>
  );
}
