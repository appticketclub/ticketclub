"use client";
import { useState, useEffect, useRef } from "react";
import { getCapital, setCapital } from "@/lib/actions/capital";
import { createClient } from "@/lib/supabase/client";
import {
  AreaChart, Area, XAxis, YAxis,
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

function IconCart() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/>
      <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/>
    </svg>
  );
}
function IconTrendUp() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/>
      <polyline points="17 6 23 6 23 12"/>
    </svg>
  );
}
function IconTrendDown() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="23 18 13.5 8.5 8.5 13.5 1 6"/>
      <polyline points="17 18 23 18 23 12"/>
    </svg>
  );
}
function IconTicket() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M2 9a3 3 0 0 1 0 6v2a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-2a3 3 0 0 1 0-6V7a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2Z"/>
      <line x1="12" y1="7" x2="12" y2="17"/>
    </svg>
  );
}
function IconPercent() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <line x1="19" y1="5" x2="5" y2="19"/>
      <circle cx="6.5" cy="6.5" r="2.5"/>
      <circle cx="17.5" cy="17.5" r="2.5"/>
    </svg>
  );
}

export default function UvodTab() {
  const { format } = useCurrency();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ invested: 0, profit: 0, balance: 0 });
  const [soldProfit, setSoldProfit] = useState(0);
  const [totalBuy, setTotalBuy] = useState(0);
  const [avgRoi, setAvgRoi] = useState(0);
  const [chartData, setChartData] = useState<any[]>([]);
  const [activeChart, setActiveChart] = useState<"zisk" | "investovano" | "roi">("zisk");
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
    if (!user) { setLoading(false); return; }

    const cacheKey = `uvod_${user.id}`;
    if (!force) {
      const cached = getCached(cacheKey, 60000);
      if (cached) {
        setBaseCurrency(cached.baseCurrency);
        setStats(cached.stats);
        setSoldProfit(cached.soldProfit);
        setTotalBuy(cached.totalBuy);
        setAvgRoi(cached.avgRoi);
        setChartData(cached.soldChartData);
        setLoading(false);
        return;
      }
    }
    getCapital().then(async (data) => {
      const currentBal = data?.capital ?? data?.capital_initial ?? 0;
      setBaseCurrency((data?.capital_currency ?? "EUR") as "EUR" | "CZK");
      const { from, to } = getDateRange();

      let historyQuery = supabase
        .from("capital_history")
        .select("balance_after, created_at")
        .eq("user_id", user.id)
        .order("created_at", { ascending: true })
        .limit(50);
      if (from) historyQuery = historyQuery.gte("created_at", from);
      if (to) historyQuery = historyQuery.lte("created_at", to);
      const { data: history } = await historyQuery;

      let invested = 0, profit = 0, purchases: any[] = [], sales: any[] = [];
      let calcSoldProfit = 0, calcTotalBuy = 0, calcAvgRoi = 0;
      let computedChartData: any[] = [];

      try {
        const purchasesQuery = supabase
          .from("purchases")
          .select("id, event_name, buy_price, quantity, quantity_remaining, status, currency, created_at")
          .eq("user_id", user.id);

        let salesQuery = supabase
          .from("sales")
          .select("id, purchase_id, sell_price, quantity_sold, fees, sold_at, purchases(id, buy_price, status)")
          .eq("user_id", user.id);
        if (from) salesQuery = salesQuery.gte("sold_at", from);
        if (to) salesQuery = salesQuery.lte("sold_at", to);

        const [{ data: p }, { data: s }] = await Promise.all([purchasesQuery, salesQuery]);
        purchases = p ?? [];
        sales = s ?? [];

        const soldSalesPurchaseIds = new Set(sales.map((s: any) => s.purchase_id));
        const soldPurchases = purchases.filter(p => p.status === "sold" && soldSalesPurchaseIds.has(p.id));
        const soldSales = sales.filter((s: any) => soldPurchases.some(p => p.id === s.purchase_id));

        const soldRevenue = soldSales.reduce((acc, s) => acc + (s.sell_price ?? 0) * (s.quantity_sold ?? 0), 0);
        const soldCost = soldPurchases.reduce((acc, p) => acc + (p.buy_price ?? 0) * (p.quantity ?? 0), 0);
        calcSoldProfit = soldRevenue - soldCost;
        calcTotalBuy = soldCost;
        calcAvgRoi = soldCost > 0 ? (calcSoldProfit / soldCost) * 100 : 0;

        const chartDataByDate: Record<string, { date: string; rawDate: any; revenue: number; cost: number }> = {};
        for (const sale of soldSales as any[]) {
          const dateRaw = sale.sold_at ?? sale.created_at;
          if (!dateRaw) continue;
          const date = new Date(dateRaw).toLocaleDateString("cs-CZ", { day: "numeric", month: "numeric" });
          if (!chartDataByDate[date]) chartDataByDate[date] = { date, rawDate: dateRaw, revenue: 0, cost: 0 };
          const purchase = soldPurchases.find((p: any) => p.id === sale.purchase_id);
          const buyCost = (purchase?.buy_price ?? (sale.purchases as any)?.buy_price ?? 0) * (sale.quantity_sold ?? 0);
          const revenue = (sale.sell_price ?? 0) * (sale.quantity_sold ?? 0);
          chartDataByDate[date].revenue += revenue;
          chartDataByDate[date].cost += buyCost;
        }

        let cumulativeProfit = 0, cumulativeCost = 0;
        computedChartData = Object.entries(chartDataByDate)
          .sort(([, a], [, b]) => new Date((a as any).rawDate).getTime() - new Date((b as any).rawDate).getTime())
          .map(([, d]) => {
            cumulativeProfit += d.revenue - d.cost;
            cumulativeCost += d.cost;
            return {
              date: d.date,
              zisk: Math.round(cumulativeProfit * 100) / 100,
              investovano: Math.round(cumulativeCost * 100) / 100,
              roi: cumulativeCost > 0 ? Math.round((cumulativeProfit / cumulativeCost) * 1000) / 10 : 0,
            };
          });

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
      } catch {}

      const statsVal = { invested, profit, balance: currentBal };
      setStats(statsVal);
      setSoldProfit(calcSoldProfit);
      setTotalBuy(calcTotalBuy);
      setAvgRoi(calcAvgRoi);
      setChartData(computedChartData);

      setCached(cacheKey, {
        baseCurrency: (data?.capital_currency ?? "EUR") as "EUR" | "CZK",
        stats: statsVal,
        soldProfit: calcSoldProfit,
        totalBuy: calcTotalBuy,
        avgRoi: calcAvgRoi,
        soldChartData: computedChartData,
      });
      setLoading(false);
    });
  }

  useEffect(() => { loadData(); }, []);
  useEffect(() => { loadData(true); }, [timeRange, customFrom, customTo]);

  if (loading) {
    return (
      <div style={{ display: "flex", alignItems: "center", gap: 12, color: "rgba(255,255,255,0.5)", padding: "2rem 0" }}>
        <div style={{
          width: 18, height: 18,
          border: "2px solid rgba(123,108,246,0.2)",
          borderTopColor: "#7b6cf6",
          borderRadius: "50%",
          animation: "spin 0.8s linear infinite",
        }} />
        Načítání...
        <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
      </div>
    );
  }

  const isSoldProfit = soldProfit >= 0;

  const statCards = [
    {
      label: "Nákup celkem",
      value: format(totalBuy, baseCurrency),
      valueColor: "#ffffff",
      icon: <IconCart />,
      iconBg: "rgba(123,108,246,0.15)",
      iconColor: "#7b6cf6",
      badge: null,
    },
    {
      label: "Zisk celkem",
      value: `${isSoldProfit ? "+" : ""}${format(Math.abs(soldProfit), baseCurrency)}`,
      valueColor: isSoldProfit ? "#7fe0ab" : "#f87171",
      icon: isSoldProfit ? <IconTrendUp /> : <IconTrendDown />,
      iconBg: isSoldProfit ? "rgba(127,224,171,0.12)" : "rgba(248,113,113,0.12)",
      iconColor: isSoldProfit ? "#7fe0ab" : "#f87171",
      badge: totalBuy > 0
        ? { text: `${isSoldProfit ? "+" : ""}${((soldProfit / totalBuy) * 100).toFixed(1)}%`, color: isSoldProfit ? "#7fe0ab" : "#f87171", bg: isSoldProfit ? "rgba(127,224,171,0.1)" : "rgba(248,113,113,0.1)" }
        : null,
    },
    {
      label: "Investováno",
      value: format(stats.invested, baseCurrency),
      valueColor: "#c4baff",
      icon: <IconTicket />,
      iconBg: "rgba(123,108,246,0.12)",
      iconColor: "#a89df7",
      badge: null,
    },
    {
      label: "Průměrná ziskovost",
      value: `${avgRoi >= 0 ? "+" : ""}${avgRoi.toFixed(1)}%`,
      valueColor: avgRoi >= 0 ? "#7fe0ab" : "#f87171",
      icon: <IconPercent />,
      iconBg: avgRoi >= 0 ? "rgba(127,224,171,0.12)" : "rgba(248,113,113,0.12)",
      iconColor: avgRoi >= 0 ? "#7fe0ab" : "#f87171",
      badge: null,
    },
  ];


  return (
    <div>
      <style>{`
        .time-range-btn:hover { background: rgba(123,108,246,0.1) !important; color: #c4baff !important; }
        .chart-tab-btn:hover { background: rgba(123,108,246,0.08) !important; color: #c4baff !important; }
        .stat-card { transition: border-color 0.2s, box-shadow 0.2s, transform 0.2s; }
        .stat-card:hover {
          border-color: rgba(123,108,246,0.5) !important;
          box-shadow: 0 8px 40px rgba(123,108,246,0.15), 0 0 0 1px rgba(123,108,246,0.1), 0 1px 0 rgba(255,255,255,0.05) inset !important;
          transform: translateY(-2px) translateZ(0) !important;
        }
        input[type="date"].purple-input { color-scheme: dark; }
        input[type="date"].purple-input:focus { outline: none; border-color: rgba(123,108,246,0.5) !important; box-shadow: 0 0 0 3px rgba(123,108,246,0.08); }
      `}</style>

      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: "1.75rem" }}>
        <div>
          <h1 style={{ fontSize: "1.4rem", fontWeight: 700, color: "#fff", marginBottom: "0.3rem", letterSpacing: "-0.02em" }}>
            Přehled portfolia
          </h1>
          <p style={{ fontSize: 12.5, color: "rgba(255,255,255,0.35)" }}>Aktualizováno právě teď</p>
        </div>
        <div style={{
          width: 8, height: 8, borderRadius: "50%", background: "#7b6cf6",
          boxShadow: "0 0 10px rgba(123,108,246,0.6)", marginTop: 8,
        }} />
      </div>

      <div style={{ display: "flex", gap: "0.4rem", marginBottom: "1.5rem", flexWrap: "wrap" }}>
        {timeRangeOptions.map((r) => (
          <button
            key={r.id}
            onClick={() => setTimeRange(r.id)}
            className="time-range-btn"
            style={{
              padding: "5px 14px", fontSize: 12, fontWeight: 600,
              background: timeRange === r.id
                ? "linear-gradient(135deg, #7b6cf6, #9d8ff7)"
                : "rgba(255,255,255,0.04)",
              border: timeRange === r.id ? "none" : "1px solid rgba(255,255,255,0.08)",
              borderRadius: 8,
              color: timeRange === r.id ? "#fff" : "rgba(255,255,255,0.5)",
              cursor: "pointer",
              transition: "all 0.15s",
              boxShadow: timeRange === r.id ? "0 2px 16px rgba(123,108,246,0.4), 0 0 0 1px rgba(255,255,255,0.05) inset" : "none",
            }}
          >
            {r.label}
          </button>
        ))}
      </div>

      {timeRange === "custom" && (
        <div style={{ display: "flex", gap: "0.75rem", marginBottom: "1.25rem", alignItems: "center" }}>
          <input type="date" value={customFrom} onChange={e => setCustomFrom(e.target.value)} className="purple-input"
            style={{ padding: "6px 10px", background: "#1e1e26", border: "1px solid rgba(123,108,246,0.2)", borderRadius: 8, color: "#fff", fontSize: 12 }} />
          <span style={{ color: "rgba(255,255,255,0.3)", fontSize: 12 }}>—</span>
          <input type="date" value={customTo} onChange={e => setCustomTo(e.target.value)} className="purple-input"
            style={{ padding: "6px 10px", background: "#1e1e26", border: "1px solid rgba(123,108,246,0.2)", borderRadius: 8, color: "#fff", fontSize: 12 }} />
        </div>
      )}

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(170px, 1fr))", gap: "1rem", marginBottom: "1.75rem" }}>
        {statCards.map((card) => (
          <div key={card.label} className="stat-card" style={{
            background: "linear-gradient(145deg, rgba(30,30,38,0.9), rgba(22,22,28,0.95))",
            border: "1px solid rgba(123,108,246,0.18)",
            borderRadius: 18,
            padding: "1.25rem 1.25rem 1.1rem",
            position: "relative",
            overflow: "hidden",
            backdropFilter: "blur(8px)",
            boxShadow: "0 4px 24px rgba(0,0,0,0.4), 0 1px 0 rgba(255,255,255,0.03) inset",
            transform: "translateZ(0)",
            transition: "border-color 0.2s, box-shadow 0.2s, transform 0.2s",
          }}>
            <div style={{ position: "absolute", top: 0, left: 0, right: 0, background: "linear-gradient(90deg, transparent, rgba(123,108,246,0.5), rgba(168,109,247,0.3), transparent)", height: 1 }} />
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "0.9rem" }}>
              <div style={{ width: 36, height: 36, borderRadius: 10, background: card.iconBg, display: "flex", alignItems: "center", justifyContent: "center", color: card.iconColor, boxShadow: `0 0 16px ${card.iconBg}, 0 0 4px ${card.iconColor}40` }}>
                {card.icon}
              </div>
              {card.badge && (
                <span style={{ fontSize: 11, fontWeight: 700, color: card.badge.color, background: card.badge.bg, border: `1px solid ${card.badge.color}30`, borderRadius: 6, padding: "2px 7px" }}>
                  {card.badge.text}
                </span>
              )}
            </div>
            <div style={{ fontSize: 11, fontWeight: 500, color: "rgba(255,255,255,0.4)", marginBottom: "0.4rem", letterSpacing: "0.03em" }}>
              {card.label}
            </div>
            <div style={{ fontSize: "1.25rem", fontWeight: 700, color: card.valueColor, letterSpacing: "-0.02em" }}>
              {card.value}
            </div>
          </div>
        ))}
      </div>

      <div style={{
        background: "linear-gradient(145deg, rgba(28,28,36,0.95), rgba(18,18,24,0.98))",
        border: "1px solid rgba(123,108,246,0.18)",
        borderRadius: 22,
        padding: "1.75rem",
        position: "relative",
        overflow: "hidden",
        backdropFilter: "blur(8px)",
        boxShadow: "0 8px 48px rgba(0,0,0,0.5), 0 1px 0 rgba(255,255,255,0.03) inset",
      }}>
        <div style={{ position: "absolute", top: 0, left: 0, right: 0, background: "linear-gradient(90deg, transparent, rgba(123,108,246,0.6), rgba(168,109,247,0.4), transparent)", height: 1 }} />

        <div style={{ display: "flex", gap: "0.4rem", marginBottom: "1.5rem", flexWrap: "wrap" }}>
          {([
            { key: "zisk", label: "Zisk celkem" },
            { key: "investovano", label: "Investováno" },
            { key: "roi", label: "Ziskovost" },
          ] as const).map(tab => (
            <button key={tab.key} onClick={() => setActiveChart(tab.key)} className="chart-tab-btn"
              style={{
                padding: "5px 14px", borderRadius: 8, fontSize: 11.5, fontWeight: 600, letterSpacing: "0.03em",
                border: "1px solid",
                cursor: "pointer",
                background: activeChart === tab.key ? "linear-gradient(135deg, rgba(123,108,246,0.25), rgba(123,108,246,0.1))" : "transparent",
                borderColor: activeChart === tab.key ? "rgba(123,108,246,0.5)" : "rgba(255,255,255,0.08)",
                color: activeChart === tab.key ? "#c4baff" : "rgba(255,255,255,0.4)",
                transition: "all 0.15s",
                boxShadow: activeChart === tab.key ? "0 0 12px rgba(123,108,246,0.25)" : "none",
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div style={{ marginBottom: "1.5rem" }}>
          <div style={{ fontSize: 11, color: "rgba(255,255,255,0.35)", marginBottom: "0.3rem", letterSpacing: "0.08em", textTransform: "uppercase" }}>
            {activeChart === "zisk" && "Celkový zisk"}
            {activeChart === "investovano" && "Investovaná čiastka"}
            {activeChart === "roi" && "Priemerná ziskovosť"}
          </div>
          <div style={{
            fontSize: "1.75rem", fontWeight: 700, letterSpacing: "-0.03em",
            color: activeChart === "roi" ? (avgRoi >= 0 ? "#7fe0ab" : "#f87171") : (soldProfit >= 0 ? "#7fe0ab" : "#f87171"),
            textShadow: soldProfit >= 0 ? "0 0 20px rgba(127,224,171,0.4)" : "0 0 20px rgba(248,113,113,0.4)",
          }}>
            {activeChart === "zisk" && `${soldProfit >= 0 ? "+" : ""}${format(Math.abs(soldProfit), baseCurrency)}`}
            {activeChart === "investovano" && format(totalBuy, baseCurrency)}
            {activeChart === "roi" && `${avgRoi >= 0 ? "+" : ""}${avgRoi.toFixed(1)}%`}
          </div>
        </div>

        {chartData.length > 1 ? (
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="purpleGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#9d8ff7" stopOpacity={0.4} />
                  <stop offset="40%" stopColor="#7b6cf6" stopOpacity={0.15} />
                  <stop offset="100%" stopColor="#5934c4" stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis dataKey="date" tick={{ fill: "rgba(255,255,255,0.3)", fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: "rgba(255,255,255,0.3)", fontSize: 11 }} axisLine={false} tickLine={false} width={60}
                tickFormatter={v => activeChart === "roi" ? `${v}%` : `${v}`} />
              <Tooltip
                contentStyle={{ background: "#1e1e26", border: "1px solid rgba(123,108,246,0.25)", borderRadius: 10, fontSize: 12, boxShadow: "0 8px 24px rgba(0,0,0,0.4)" }}
                labelStyle={{ color: "rgba(255,255,255,0.6)", marginBottom: 4 }}
                itemStyle={{ color: "#c4baff" }}
                formatter={(v: any) => activeChart === "roi" ? [`${v}%`, ""] : [`${v} ${baseCurrency}`, ""]}
              />
              <Area type="monotone" dataKey={activeChart} stroke="#a78bfa" strokeWidth={2} fill="url(#purpleGrad)" dot={false}
                activeDot={{ r: 5, fill: "#a78bfa", stroke: "#1e1e26", strokeWidth: 2 }} />
            </AreaChart>
          </ResponsiveContainer>
        ) : (
          <div style={{ height: 220, display: "flex", alignItems: "center", justifyContent: "center", color: "rgba(255,255,255,0.25)", fontSize: 13, flexDirection: "column", gap: 8 }}>
            <div style={{ fontSize: 32, opacity: 0.3 }}>◎</div>
            Zatím žádná uzavřená data
          </div>
        )}
      </div>
    </div>
  );
}
