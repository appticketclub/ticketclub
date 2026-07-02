"use client";
import { useState, useEffect, useRef } from "react";
import { getCapital, setCapital } from "@/lib/actions/capital";
import { createClient } from "@/lib/supabase/client";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer
} from "recharts";
import { useCurrency } from "@/lib/context/CurrencyContext";
import { getCached, setCached } from "@/lib/hooks/useDataCache";

const timeRangeOptions = [
  { id: "all", label: "Za celou dobu" },
  { id: "year", label: "Rok" },
  { id: "half_year", label: "Půl roku" },
  { id: "month", label: "Měsíc" },
  { id: "week", label: "Týden" },
  { id: "custom", label: "Vlastní" },
] as const;

type TimeRange = (typeof timeRangeOptions)[number]["id"];

export default function UvodTab() {
  const { format } = useCurrency();
  const [loading, setLoading] = useState(true);
  const [chartData, setChartData] = useState<any[]>([]);
  const [stats, setStats] = useState({ invested: 0, profit: 0, balance: 0 });
  const [soldProfit, setSoldProfit] = useState(0);
  const [totalBuy, setTotalBuy] = useState(0);
  const [avgRoi, setAvgRoi] = useState(0);
  const [timeRange, setTimeRange] = useState<TimeRange>("all");
  const [customFrom, setCustomFrom] = useState("");
  const [customTo, setCustomTo] = useState("");

  const [baseCurrency, setBaseCurrency] = useState<"EUR" | "CZK">("EUR");
  const lastLoadRef = useRef<number>(0);

  function getDateRange() {
    const now = new Date();
    const from = new Date();

    if (timeRange === "all") return { from: "", to: "" };
    else if (timeRange === "week") from.setDate(now.getDate() - 7);
    else if (timeRange === "month") from.setMonth(now.getMonth() - 1);
    else if (timeRange === "half_year") from.setMonth(now.getMonth() - 6);
    else if (timeRange === "year") from.setFullYear(now.getFullYear() - 1);
    else if (timeRange === "custom") return { from: customFrom, to: customTo };

    return {
      from: from.toISOString().split("T")[0],
      to: now.toISOString().split("T")[0],
    };
  }

  async function loadData(force = false) {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      setLoading(false);
      return;
    }

    const cacheKey = `uvod_${user.id}`;
    if (!force) {
      const cached = getCached(cacheKey, 60000);
      if (cached) {
        setBaseCurrency(cached.baseCurrency);
        setStats(cached.stats);
        setSoldProfit(cached.soldProfit);
        setTotalBuy(cached.totalBuy);
        setAvgRoi(cached.avgRoi);
        setChartData(cached.chartData);
        setLoading(false);
        return;
      }
    }

    getCapital().then(async (data) => {
      const currentBal = data?.capital ?? data?.capital_initial ?? 0;
      setBaseCurrency((data?.capital_currency ?? "EUR") as "EUR" | "CZK");
      const { from, to } = getDateRange();

      // Load capital history for chart
      let historyQuery = supabase 
        .from("capital_history") 
        .select("balance_after, created_at") 
        .eq("user_id", user.id)
        .order("created_at", { ascending: true }) 
        .limit(50);

      if (from) historyQuery = historyQuery.gte("created_at", from);
      if (to) historyQuery = historyQuery.lte("created_at", to);

      const { data: history } = await historyQuery;

      // Load purchases and sales for stats (if tables exist)
      let invested = 0;
      let profit = 0;
      let purchases: any[] = [];
      let sales: any[] = [];
      let calcSoldProfit = 0;
      let calcTotalBuy = 0;
      let calcAvgRoi = 0;
      
      try {
        const purchasesQuery = supabase
          .from("purchases")
          .select("id, event_name, buy_price, quantity, quantity_remaining, status, currency, created_at")
          .eq("user_id", user.id);

        let salesQuery = supabase
          .from("sales")
          .select("sell_price, quantity_sold, fees, purchases(buy_price), sold_at, purchase_id")
          .eq("user_id", user.id);

        if (from) salesQuery = salesQuery.gte("sold_at", from);
        if (to) salesQuery = salesQuery.lte("sold_at", to);

        const [{ data: p }, { data: s }] = await Promise.all([
          purchasesQuery,
          salesQuery,
        ]);

        purchases = p ?? [];
        sales = s ?? [];

        console.log("Sales loaded:", sales?.length, sales);

        // Only closed (sold) purchases
        const soldPurchases = purchases.filter(p => p.status === "sold");
        const soldSales = sales.filter(s => soldPurchases.some(p => p.id === s.purchase_id));

        const soldRevenue = soldSales.reduce((acc, s) => acc + (s.sell_price ?? 0) * (s.quantity_sold ?? 0), 0);
        const soldCost = soldSales.reduce((acc, s) => {
          const purchase = soldPurchases.find(p => p.id === s.purchase_id);
          return acc + (purchase?.buy_price ?? 0) * (s.quantity_sold ?? 0);
        }, 0);
        calcSoldProfit = soldRevenue - soldCost;
        calcTotalBuy = soldCost;
        calcAvgRoi = soldCost > 0 ? (calcSoldProfit / soldCost) * 100 : 0;

        // Calculate total invested
        const totalInvested = purchases 
          .filter(p => p.status === "active" || p.status === "partial") 
          .reduce((sum, p) => { 
            const remaining = p.quantity_remaining ?? p.quantity; 
            return sum + (p.buy_price * Math.max(0, remaining)); 
          }, 0);
        invested = totalInvested;
        profit = sales.reduce((sum, sale: any) => {
          const purchase = Array.isArray(sale.purchases) ? sale.purchases[0] : sale.purchases;
          const buyCost = (purchase?.buy_price ?? 0) * (sale.quantity_sold ?? 0);
          const revenue = (sale.sell_price ?? 0) * (sale.quantity_sold ?? 0);
          const fees = sale.fees ?? 0;
          return sum + (revenue - buyCost - fees);
        }, 0) ?? 0;
        
        console.log("Profit calculated:", profit);
      } catch {
        // Tables might not exist yet
      }

      const stats = { invested, profit, balance: currentBal };
      setStats(stats);
      setSoldProfit(calcSoldProfit);
      setTotalBuy(calcTotalBuy);
      setAvgRoi(calcAvgRoi);

      // Build chart data
      const initialCap = data?.capital_initial ?? data?.capital ?? 0; 
      const chartCurrentBal = data?.capital ?? initialCap; 
      let chartData: any[] = [];

      if (history && history.length > 0) { 
        // Always start with initial capital as first point 
        chartData = [ 
          { date: "Start", hodnota: Math.round(initialCap) }, 
          ...history.map((h: any) => ({ 
            date: new Date(h.created_at).toLocaleDateString("cs-CZ", { day: "numeric", month: "numeric" }), 
            hodnota: Math.round(h.balance_after), 
          })), 
        ]; 
      } else { 
        // No history yet — flat line at initial capital 
        chartData = [ 
          { date: "Start", hodnota: Math.round(initialCap) }, 
          { date: "Nyní", hodnota: Math.round(chartCurrentBal) }, 
        ]; 
      }

      setChartData(chartData);

      // Cache the data
      setCached(cacheKey, {
        baseCurrency: (data?.capital_currency ?? "EUR") as "EUR" | "CZK",
        stats,
        soldProfit: calcSoldProfit,
        totalBuy: calcTotalBuy,
        avgRoi: calcAvgRoi,
        chartData,
      });
      setLoading(false);
    });
  }

  useEffect(() => { loadData(); }, []);
  useEffect(() => { loadData(true); }, [timeRange, customFrom, customTo]);

  if (loading) {
    return (
      <div style={{ display: "flex", alignItems: "center", gap: 12, color: "#525252" }}>
        <div style={{ width: 16, height: 16, border: "2px solid #2a2a2a", borderTopColor: "#ffffff", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
        Načítání...
        <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
      </div>
    );
  }

  // MAIN DASHBOARD
  const isProfit = stats.profit >= 0;
  const isSoldProfit = soldProfit >= 0;

  return (
    <div>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: "1.75rem" }}>
        <div>
          <h1 style={{ fontSize: "1.5rem", fontWeight: 700, color: "#fff", marginBottom: "0.25rem" }}>Přehled portfolia</h1>
          <p style={{ fontSize: 13, color: "#3a3a3a" }}>Aktualizováno právě teď</p>
        </div>
      </div>

      <div style={{ display: "flex", gap: "0.5rem", marginBottom: "1.25rem", flexWrap: "wrap" as const }}>
        {timeRangeOptions.map((r) => (
          <button
            key={r.id}
            onClick={() => setTimeRange(r.id)}
            style={{
              padding: "5px 14px", fontSize: 12, fontWeight: 600,
              background: timeRange === r.id ? "linear-gradient(135deg, #ffffff, #a0a0a0)" : "transparent",
              border: timeRange === r.id ? "none" : "1px solid #2a2a2a",
              borderRadius: 8,
              color: timeRange === r.id ? "#000" : "#525252",
              cursor: "pointer",
            }}
          >
            {r.label}
          </button>
        ))}
      </div>

      {timeRange === "custom" && (
        <div style={{ display: "flex", gap: "0.75rem", marginBottom: "1.25rem", alignItems: "center" }}>
          <input
            type="date"
            value={customFrom}
            onChange={e => setCustomFrom(e.target.value)}
            style={{ padding: "6px 10px", background: "#111", border: "1px solid #2a2a2a", borderRadius: 8, color: "#fff", fontSize: 12, outline: "none", colorScheme: "dark" }}
          />
          <span style={{ color: "#525252", fontSize: 12 }}>—</span>
          <input
            type="date"
            value={customTo}
            onChange={e => setCustomTo(e.target.value)}
            style={{ padding: "6px 10px", background: "#111", border: "1px solid #2a2a2a", borderRadius: 8, color: "#fff", fontSize: 12, outline: "none", colorScheme: "dark" }}
          />
        </div>
      )}

      {/* Stat cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: "1rem", marginBottom: "1.75rem" }}>
        {[
          { label: "Nákup celkem", value: format(totalBuy, baseCurrency), color: "#ffffff", icon: "🛒" },
          { label: "Zisk celkem", value: `${isSoldProfit ? "+" : ""}${format(Math.abs(soldProfit), baseCurrency)}`, color: isSoldProfit ? "#34d399" : "#f87171", icon: isSoldProfit ? "📈" : "📉" },
          { label: "Investováno", value: format(stats.invested, baseCurrency), color: "#fbbf24", icon: "🎟️" },
          { label: "Průměrná ziskovost", value: `${avgRoi >= 0 ? "+" : ""}${avgRoi.toFixed(1)}%`, color: avgRoi >= 0 ? "#34d399" : "#f87171", icon: "%" },
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
            <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: "0.08em", color: "#ffffff", marginBottom: "0.75rem" }}>
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
            <div style={{ fontSize: 13, fontWeight: 600, color: "#ffffff", marginBottom: 4 }}>EQUITY KŘIVKA</div>
            <div style={{ fontSize: "1.5rem", fontWeight: 700, color: isProfit ? "#34d399" : "#f87171" }}>
              {isProfit ? "+" : ""}{format(Math.abs(stats.profit), baseCurrency)}
            </div>
          </div>
          <div style={{
            padding: "6px 14px", borderRadius: 8, fontSize: 12, fontWeight: 600,
            background: isProfit ? "#0a2a1a" : "#2a0a0a",
            border: `1px solid ${isProfit ? "#34d39944" : "#f8717144"}`,
            color: isProfit ? "#34d399" : "#f87171",
          }}>
            {isProfit ? "▲" : "▼"} {stats.invested > 0 ? Math.abs(Math.round((stats.profit / stats.invested) * 100)) : 0}% ROI
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
            <YAxis 
              tick={{ fill: "#3a3a3a", fontSize: 11 }} 
              axisLine={false} 
              tickLine={false} 
              width={70} 
              domain={['auto', 'auto']} 
              tickFormatter={(v) => `${v.toLocaleString("cs-CZ")}`} 
            />
            <Tooltip
              contentStyle={{ background: "#111111", border: "1px solid #2a2a2a", borderRadius: 10, color: "#fff", fontSize: 13 }}
              labelStyle={{ color: "#525252" }}
              formatter={(value: any) => [format(Number(value), baseCurrency), "Hodnota"]}
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
