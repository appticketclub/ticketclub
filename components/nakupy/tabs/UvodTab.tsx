"use client";
import { useState, useEffect } from "react";
import { getCapital, setCapital } from "@/lib/actions/capital";
import { createClient } from "@/lib/supabase/client";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer
} from "recharts";

const currencies = ["CZK", "EUR", "USD", "GBP"];

export default function UvodTab() {
  const [capital, setCapitalState] = useState<number | null>(null);
  const [currency, setCurrency] = useState("CZK");
  const [loading, setLoading] = useState(true);
  const [input, setInput] = useState("");
  const [selectedCurrency, setSelectedCurrency] = useState("CZK");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [chartData, setChartData] = useState<any[]>([]);
  const [stats, setStats] = useState({ invested: 0, profit: 0, balance: 0 });

  useEffect(() => {
    getCapital().then(async (data) => {
      if (data?.capital && data.capital > 0) {
        setCapitalState(data.capital);
        setCurrency(data.capital_currency ?? "CZK");

        // Load capital history for chart
        const supabase = createClient();
        const { data: history } = await supabase
          .from("capital_history")
          .select("*")
          .order("created_at", { ascending: true });

        // Load purchases and sales for stats (if tables exist)
        let invested = 0;
        let revenue = 0;
        let fees = 0;
        
        try {
          const { data: purchases } = await supabase
            .from("purchases")
            .select("total_cost, status");
            
          const { data: sales } = await supabase
            .from("sales")
            .select("total_revenue, fees_total");

          invested = purchases?.reduce((sum, p) => sum + (p.total_cost ?? 0), 0) ?? 0;
          revenue = sales?.reduce((sum, s) => sum + (s.total_revenue ?? 0), 0) ?? 0;
          fees = sales?.reduce((sum, s) => sum + (s.fees_total ?? 0), 0) ?? 0;
        } catch {
          // Tables might not exist yet
        }
        
        const profit = revenue - fees - invested;
        const balance = (data.capital ?? 0) - invested + revenue - fees;

        setStats({ invested, profit, balance });

        // Build chart data
        if (history && history.length > 0) {
          const chartPoints = history.map((h: any) => ({
            date: new Date(h.created_at).toLocaleDateString("cs-CZ", { day: "numeric", month: "short" }),
            hodnota: Math.round(h.balance_after),
          }));
          setChartData(chartPoints);
        } else {
          // Show flat line with just starting capital
          setChartData([
            { date: "Start", hodnota: Math.round(data.capital) },
            { date: "Dnes", hodnota: Math.round(data.capital) },
          ]);
        }
      }
      setLoading(false);
    });
  }, []);

  async function handleSave() {
    const amount = parseFloat(input.replace(",", ".").replace(/\s/g, ""));
    if (isNaN(amount) || amount <= 0) return setError("Zadejte platnou částku.");
    setSaving(true);
    setError("");
    const result = await setCapital(amount, selectedCurrency);
    if (result?.error) setError(result.error);
    else {
      setCapitalState(amount);
      setCurrency(selectedCurrency);
      setStats({ invested: 0, profit: 0, balance: amount });
      setChartData([
        { date: "Start", hodnota: Math.round(amount) },
        { date: "Dnes", hodnota: Math.round(amount) },
      ]);
    }
    setSaving(false);
  }

  if (loading) {
    return (
      <div style={{ display: "flex", alignItems: "center", gap: 12, color: "#525252" }}>
        <div style={{ width: 16, height: 16, border: "2px solid #2a2a2a", borderTopColor: "#c0c0c0", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
        Načítání...
        <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
      </div>
    );
  }

  // SETUP SCREEN
  if (capital === null || capital === 0) {
    return (
      <div style={{ maxWidth: 500 }}>
        <h1 style={{ fontSize: "1.75rem", fontWeight: 700, color: "#fff", marginBottom: "0.5rem" }}>
          Nastavte svůj kapitál
        </h1>
        <p style={{ color: "#525252", marginBottom: "2rem", lineHeight: 1.7 }}>
          Zadejte počáteční kapitál, se kterým chcete obchodovat. Tento údaj slouží ke sledování vašeho zůstatku a výkonnosti.
        </p>

        {error && (
          <div style={{ marginBottom: "1rem", padding: "12px 16px", borderRadius: 10, background: "#2a0a0a", border: "1px solid #7f1d1d", color: "#fca5a5", fontSize: 14 }}>
            {error}
          </div>
        )}

        <div style={{ background: "#111111", border: "1px solid #2a2a2a", borderRadius: 20, padding: "2rem", position: "relative", overflow: "hidden" }}>
          {/* Top chrome line */}
          <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 1, background: "linear-gradient(90deg, transparent, #c0c0c0, transparent)" }} />

          <label style={{ fontSize: 12, fontWeight: 600, letterSpacing: "0.08em", color: "#525252", display: "block", marginBottom: "0.75rem" }}>
            POČÁTEČNÍ KAPITÁL
          </label>

          <div style={{ display: "flex", gap: "0.75rem", marginBottom: "1.5rem" }}>
            <input
              type="text"
              placeholder="50 000"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSave()}
              style={{
                flex: 1, padding: "0.875rem 1.125rem",
                background: "#0a0a0a", border: "1px solid #2a2a2a",
                borderRadius: 12, color: "#fff", fontSize: 18,
                fontWeight: 600, outline: "none", letterSpacing: "0.02em",
              }}
            />
            <select
              value={selectedCurrency}
              onChange={(e) => setSelectedCurrency(e.target.value)}
              style={{
                padding: "0.875rem 1rem",
                background: "#0a0a0a", border: "1px solid #2a2a2a",
                borderRadius: 12, color: "#c0c0c0", fontSize: 14,
                fontWeight: 600, outline: "none", cursor: "pointer",
              }}
            >
              {currencies.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>

          <button
            onClick={handleSave}
            disabled={saving}
            style={{
              width: "100%", padding: "0.95rem",
              background: saving ? "#2a2a2a" : "linear-gradient(135deg, #ffffff 0%, #c0c0c0 50%, #a0a0a0 100%)",
              border: "none", borderRadius: 12,
              color: "#000", fontWeight: 800, fontSize: 14,
              letterSpacing: "0.08em", cursor: saving ? "default" : "pointer",
              transition: "opacity 0.2s",
            }}
          >
            {saving ? "UKLÁDÁM..." : "ZAČÍT SLEDOVAT"}
          </button>
        </div>
      </div>
    );
  }

  // MAIN DASHBOARD
  const isProfit = stats.profit >= 0;

  return (
    <div>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: "1.75rem" }}>
        <div>
          <h1 style={{ fontSize: "1.5rem", fontWeight: 700, color: "#fff", marginBottom: "0.25rem" }}>Přehled portfolia</h1>
          <p style={{ fontSize: 13, color: "#3a3a3a" }}>Aktualizováno právě teď</p>
        </div>
        <button
          onClick={() => setCapitalState(null)}
          style={{
            padding: "7px 16px", fontSize: 12, fontWeight: 500,
            background: "transparent", border: "1px solid #2a2a2a",
            borderRadius: 8, color: "#525252", cursor: "pointer",
            transition: "border-color 0.15s, color 0.15s",
          }}
          onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.borderColor = "#c0c0c0"; (e.currentTarget as HTMLButtonElement).style.color = "#c0c0c0"; }}
          onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.borderColor = "#2a2a2a"; (e.currentTarget as HTMLButtonElement).style.color = "#525252"; }}
        >
          Upravit kapitál
        </button>
      </div>

      {/* Stat cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "1rem", marginBottom: "1.75rem" }}>
        {[
          { label: "Počáteční kapitál", value: `${capital.toLocaleString("cs-CZ")} ${currency}`, color: "#c0c0c0", icon: "💰" },
          { label: "Aktuální zůstatek", value: `${Math.round(stats.balance).toLocaleString("cs-CZ")} ${currency}`, color: "#ffffff", icon: "📊" },
          { label: "Investováno", value: `${Math.round(stats.invested).toLocaleString("cs-CZ")} ${currency}`, color: "#fbbf24", icon: "🎟️" },
          { label: "Celkový zisk", value: `${isProfit ? "+" : ""}${Math.round(stats.profit).toLocaleString("cs-CZ")} ${currency}`, color: isProfit ? "#34d399" : "#f87171", icon: isProfit ? "📈" : "📉" },
        ].map((card) => (
          <div key={card.label} style={{
            background: "#111111",
            border: "1px solid #1a1a1a",
            borderRadius: 16, padding: "1.25rem 1.5rem",
            position: "relative", overflow: "hidden",
            transition: "border-color 0.2s",
          }}
          onMouseEnter={e => (e.currentTarget as HTMLDivElement).style.borderColor = "#2a2a2a"}
          onMouseLeave={e => (e.currentTarget as HTMLDivElement).style.borderColor = "#1a1a1a"}
          >
            <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: "0.08em", color: "#3a3a3a", marginBottom: "0.75rem" }}>
              {card.label.toUpperCase()}
            </div>
            <div style={{ fontSize: "1.35rem", fontWeight: 700, color: card.color, letterSpacing: "-0.01em" }}>
              {card.value}
            </div>
            <div style={{ position: "absolute", top: 16, right: 16, fontSize: 18, opacity: 0.3 }}>
              {card.icon}
            </div>
          </div>
        ))}
      </div>

      {/* Equity curve chart */}
      <div style={{
        background: "#111111",
        border: "1px solid #1a1a1a",
        borderRadius: 20, padding: "1.75rem",
        position: "relative", overflow: "hidden",
      }}>
        {/* Top chrome line */}
        <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 1, background: "linear-gradient(90deg, transparent, #34d39966, transparent)" }} />

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem" }}>
          <div>
            <div style={{ fontSize: 13, fontWeight: 600, color: "#525252", marginBottom: 4 }}>EQUITY KŘIVKA</div>
            <div style={{ fontSize: "1.5rem", fontWeight: 700, color: isProfit ? "#34d399" : "#f87171" }}>
              {isProfit ? "+" : ""}{Math.round(stats.profit).toLocaleString("cs-CZ")} {currency}
            </div>
          </div>
          <div style={{
            padding: "6px 14px", borderRadius: 8, fontSize: 12, fontWeight: 600,
            background: isProfit ? "#0a2a1a" : "#2a0a0a",
            border: `1px solid ${isProfit ? "#34d39944" : "#f8717144"}`,
            color: isProfit ? "#34d399" : "#f87171",
          }}>
            {isProfit ? "▲" : "▼"} {capital > 0 ? Math.abs(Math.round((stats.profit / capital) * 100)) : 0}% ROI
          </div>
        </div>

        <ResponsiveContainer width="100%" height={220}>
          <AreaChart data={chartData} margin={{ top: 5, right: 5, left: 0, bottom: 5 }}>
            <defs>
              <linearGradient id="equityGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#34d399" stopOpacity={0.25} />
                <stop offset="95%" stopColor="#34d399" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#1a1a1a" vertical={false} />
            <XAxis dataKey="date" tick={{ fill: "#3a3a3a", fontSize: 11 }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fill: "#3a3a3a", fontSize: 11 }} axisLine={false} tickLine={false} width={70}
              tickFormatter={(v) => `${v.toLocaleString("cs-CZ")}`} />
            <Tooltip
              contentStyle={{ background: "#111111", border: "1px solid #2a2a2a", borderRadius: 10, color: "#fff", fontSize: 13 }}
              labelStyle={{ color: "#525252" }}
              formatter={(value: any) => [`${Number(value).toLocaleString("cs-CZ")} ${currency}`, "Hodnota"]}
            />
            <Area
              type="monotone" dataKey="hodnota"
              stroke="#34d399" strokeWidth={2}
              fill="url(#equityGradient)"
              dot={false} activeDot={{ r: 4, fill: "#34d399", stroke: "#111111", strokeWidth: 2 }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
