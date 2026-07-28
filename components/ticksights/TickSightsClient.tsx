"use client";
import { useState } from "react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";

export default function TickSightsClient() {
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [data, setData] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleSearch() {
    if (!query.trim()) return;
    setLoading(true);
    setError(null);
    setData(null);
    setSearchResults([]);
    try {
      // Check if it's a numeric ID
      const isId = /^\d+$/.test(query.trim());
      if (isId) {
        await loadEvent(query.trim());
      } else {
        const res = await fetch("/api/ticksights", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ search: query.trim() })
        });
        const json = await res.json();
        if (!res.ok) { setError(json.error); return; }
        setSearchResults(json.events ?? []);
      }
    } catch { setError("Chyba připojení"); }
    finally { setLoading(false); }
  }

  async function loadEvent(id: string) {
    setLoading(true);
    setError(null);
    setSearchResults([]);
    try {
      const res = await fetch("/api/ticksights", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ eventId: id })
      });
      const json = await res.json();
      if (!res.ok) { setError(json.error); return; }
      setData(json);
    } catch { setError("Chyba připojení"); }
    finally { setLoading(false); }
  }

  const event = data?.event;
  const sales: any[] = data?.sales ?? [];
  const avgPrice: any[] = data?.avgPrice ?? [];

  function fmt(v: any, dec = 0) {
    if (v == null) return "—";
    return Number(v).toLocaleString("cs-CZ", { minimumFractionDigits: dec, maximumFractionDigits: dec });
  }

  // Calculate derived stats from avgPrice
  const allPrices = avgPrice.map((b: any) => b.avg_sale_price).filter(Boolean);
  const allSoldTickets = avgPrice.map((b: any) => b.sold_tickets).filter(Boolean);
  const highestPrice = allPrices.length ? Math.max(...allPrices) : null;
  const lowestPrice = allPrices.length ? Math.min(...allPrices) : null;
  const totalVolume = avgPrice.reduce((acc: number, b: any) => acc + (b.avg_sale_price * b.sold_tickets || 0), 0);
  const currency = event?.sales?.average_ticket_price?.currency ?? "EUR";

  const stats = event ? [
    { label: "CELKOVÝ POČET PRODEJŮ", value: fmt(data?.total_count || sales.length) },
    { label: "PRODANÝCH LÍSTKŮ", value: fmt(event.sales?.sold_tickets_total) },
    { label: "PRODÁNO ZA 24H (KS)", value: fmt(event.sales?.sold_tickets_24h), color: "#4ade80" },
    { label: "DOSTUPNÝCH LÍSTKŮ", value: fmt(event.stock?.tickets) },
    { label: "PRŮMĚRNÁ CENA PRODEJE", value: event.sales?.average_ticket_price ? `${fmt(event.sales.average_ticket_price.price, 2)} ${currency}` : "—" },
    { label: "NEJNIŽŠÍ CENA (GET-IN)", value: lowestPrice ? `${fmt(lowestPrice, 2)} ${currency}` : "—" },
    { label: "NEJVYŠŠÍ PRODEJNÍ CENA", value: highestPrice ? `${fmt(highestPrice, 2)} ${currency}` : "—" },
    { label: "CELKOVÝ OBJEM PRODEJE", value: totalVolume > 0 ? `${fmt(totalVolume, 2)} ${currency}` : "—" },
  ] : [];

  // Chart tabs
  const [activeChart, setActiveChart] = useState<"sold" | "avg_price" | "sales_timeline">("sold");

  // Group sales by date
  const salesByDate = sales.reduce((acc: any, sale: any) => {
    const date = sale.date ? sale.date.substring(0, 10) : "unknown";
    if (!acc[date]) acc[date] = { date, tickets: 0, revenue: 0, count: 0 };
    acc[date].tickets += sale.quantity ?? 0;
    acc[date].revenue += (sale.price ?? 0) * (sale.quantity ?? 0);
    acc[date].count += 1;
    return acc;
  }, {});

  const salesTimelineData = Object.values(salesByDate)
    .sort((a: any, b: any) => a.date.localeCompare(b.date))
    .map((d: any) => ({
      date: new Date(d.date).toLocaleDateString("cs-CZ", { day: "numeric", month: "numeric" }),
      tickets: d.tickets,
      avg_price: d.count > 0 ? Math.round(d.revenue / d.tickets * 100) / 100 : 0,
    }));

  const chartData = avgPrice
    .map((b: any) => ({
      block: b.block?.length > 15 ? b.block.substring(0, 15) + "…" : b.block,
      sold_tickets: b.sold_tickets,
      avg_price: b.avg_sale_price,
    }))
    .sort((a, b) => b.sold_tickets - a.sold_tickets)
    .slice(0, 15);

  return (
    <div style={{ maxWidth: 900, margin: "0 auto", padding: "2rem 1rem" }}>
      <h1 style={{ fontSize: "1.75rem", fontWeight: 800, color: "#fff", marginBottom: "0.5rem" }}>TickSights Sales Tracker</h1>
      <p style={{ color: "#ededed", fontSize: 14, marginBottom: "1.5rem" }}>Zadejte název akce, jméno performera nebo numerické ID eventu.</p>

      {/* Input */}
      <div style={{ display: "flex", gap: "0.75rem", marginBottom: "1.5rem" }}>
        <input
          value={query}
          onChange={e => setQuery(e.target.value)}
          onKeyDown={e => e.key === "Enter" && handleSearch()}
          placeholder="Coldplay, 157476339, ..."
          style={{ flex: 1, padding: "0.75rem 1rem", background: "#1a1a1a", border: "1px solid #2a2a2a", borderRadius: 10, color: "#fff", fontSize: 14, outline: "none" }}
        />
        <button
          onClick={handleSearch}
          disabled={loading}
          style={{ padding: "0.75rem 1.5rem", background: loading ? "#2a2a2a" : "linear-gradient(135deg, #ffffff, #a0a0a0)", border: "none", borderRadius: 10, color: "#000", fontWeight: 700, fontSize: 14, cursor: loading ? "default" : "pointer" }}
        >
          {loading ? "Načítávám..." : "Vyhledat"}
        </button>
      </div>

      {error && (
        <div style={{ background: "rgba(248,113,113,0.1)", border: "1px solid rgba(248,113,113,0.3)", borderRadius: 12, padding: "1rem", color: "#f87171", marginBottom: "1.5rem" }}>
          {error}
        </div>
      )}

      {/* Search results */}
      {searchResults.length > 0 && (
        <div style={{ background: "#111", border: "1px solid #1a1a1a", borderRadius: 16, padding: "1rem", marginBottom: "1.5rem" }}>
          <div style={{ fontSize: 12, color: "#525252", marginBottom: "0.75rem" }}>VÝSLEDKY VYHLEDÁVÁNÍ ({searchResults.length})</div>
          <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
            {searchResults.map((e: any) => (
              <div
                key={e.EventID}
                onClick={() => loadEvent(e.EventID.toString())}
                style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "0.75rem 1rem", background: "#0a0a0a", border: "1px solid #1a1a1a", borderRadius: 10, cursor: "pointer" }}
                onMouseEnter={el => (el.currentTarget.style.borderColor = "#ffffff30")}
                onMouseLeave={el => (el.currentTarget.style.borderColor = "#1a1a1a")}
              >
                <div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: "#fff" }}>{e.title}</div>
                  <div style={{ fontSize: 11, color: "#525252" }}>{e.Ort} · {new Date(e.date).toLocaleDateString("cs-CZ")} · {e.marketplace?.name}</div>
                </div>
                <div style={{ fontSize: 11, color: "#525252" }}>ID: {e.EventID}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {data && event && (
        <>
          {/* Event header */}
          <div style={{ background: "#111", border: "1px solid #1a1a1a", borderRadius: 16, padding: "1.5rem", marginBottom: "1.5rem", display: "flex", gap: "1rem", alignItems: "center" }}>
            {event.image && <img src={event.image} alt="" style={{ width: 80, height: 80, borderRadius: 10, objectFit: "cover" }} />}
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: "1.25rem", fontWeight: 800, color: "#fff", marginBottom: 4 }}>{event.title}</div>
              <div style={{ fontSize: 13, color: "#ededed" }}>{event.Location} · {event.Ort}{event.CountryCode ? `, ${event.CountryCode}` : ""}</div>
              {event.date && <div style={{ fontSize: 13, color: "#ededed", marginTop: 2 }}>{new Date(event.date).toLocaleDateString("cs-CZ", { day: "numeric", month: "long", year: "numeric" })}</div>}
              {event.Performer && <div style={{ fontSize: 12, color: "#4ade80", marginTop: 4 }}>{event.Performer}</div>}
              <div style={{ fontSize: 11, color: "#525252", marginTop: 2 }}>Marketplace: {event.marketplace?.name} · ID: {event.EventID}</div>
            </div>
            {event.map && <img src={event.map} alt="Seating map" style={{ width: 120, height: 80, borderRadius: 8, objectFit: "cover", opacity: 0.8 }} />}
          </div>

          {/* Stats grid */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: "0.75rem", marginBottom: "1.5rem" }}>
            {stats.map((stat, i) => (
              <div key={i} style={{ background: "#111", border: "1px solid #1a1a1a", borderRadius: 12, padding: "1rem 1.25rem" }}>
                <div style={{ fontSize: 10, color: "#ededed", letterSpacing: "0.08em", marginBottom: 6 }}>{stat.label}</div>
                <div style={{ fontSize: "1.25rem", fontWeight: 800, color: (stat as any).color ?? "#fff" }}>{stat.value}</div>
              </div>
            ))}
          </div>

          {/* Chart */}
          {(avgPrice.length > 0 || sales.length > 0) && (
            <div style={{ background: "#111", border: "1px solid #1a1a1a", borderRadius: 16, padding: "1.5rem", marginBottom: "1.5rem" }}>
              <div style={{ display: "flex", gap: "0.5rem", marginBottom: "1.25rem", flexWrap: "wrap" as const }}>
                {([
                  { key: "sold", label: "Prodáno celkem" },
                  { key: "avg_price", label: "Prům. cena prodeje" },
                  { key: "sales_timeline", label: "Časový vývoj" },
                ] as const).map(tab => (
                  <button
                    key={tab.key}
                    onClick={() => setActiveChart(tab.key)}
                    style={{ padding: "5px 12px", borderRadius: 8, fontSize: 11, fontWeight: 700, border: "1px solid", cursor: "pointer", background: activeChart === tab.key ? "#ffffff" : "transparent", borderColor: activeChart === tab.key ? "#ffffff" : "#2a2a2a", color: activeChart === tab.key ? "#000000" : "#ededed" }}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>

              <ResponsiveContainer width="100%" height={240}>
                {activeChart === "sales_timeline" ? (
                  <BarChart data={salesTimelineData} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
                    <XAxis dataKey="date" tick={{ fill: "#525252", fontSize: 10 }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fill: "#525252", fontSize: 10 }} axisLine={false} tickLine={false} width={45} />
                    <Tooltip contentStyle={{ background: "#111", border: "1px solid #2a2a2a", borderRadius: 8, fontSize: 12 }} labelStyle={{ color: "#fff" }} formatter={(v: any) => [fmt(v), ""]} />
                    <Bar dataKey="tickets" fill="#4ade80" radius={[3, 3, 0, 0]} />
                  </BarChart>
                ) : (
                  <BarChart data={chartData} margin={{ top: 5, right: 10, left: 0, bottom: 60 }}>
                    <XAxis dataKey="block" tick={{ fill: "#525252", fontSize: 10 }} axisLine={false} tickLine={false} angle={-45} textAnchor="end" />
                    <YAxis tick={{ fill: "#525252", fontSize: 10 }} axisLine={false} tickLine={false} width={55}
                      tickFormatter={v => activeChart === "avg_price" ? `${v} ${currency}` : fmt(v)} />
                    <Tooltip
                      contentStyle={{ background: "#111", border: "1px solid #2a2a2a", borderRadius: 8, fontSize: 12 }}
                      labelStyle={{ color: "#fff" }}
                      formatter={(v: any) => activeChart === "avg_price" ? [`${fmt(v, 2)} ${currency}`, ""] : [fmt(v), ""]}
                    />
                    <Bar dataKey={activeChart === "avg_price" ? "avg_price" : "sold_tickets"} fill="#4ade80" radius={[3, 3, 0, 0]} />
                  </BarChart>
                )}
              </ResponsiveContainer>
            </div>
          )}

          {/* Sales history */}
          {sales.length > 0 && (
            <div style={{ background: "#111", border: "1px solid #1a1a1a", borderRadius: 16, padding: "1.5rem" }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: "#fff", marginBottom: "1rem" }}>HISTORIE PRODEJŮ</div>
              <div style={{ overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
                  <thead>
                    <tr>
                      {["Blok", "Řada", "Počet", "Cena / ks", "Datum"].map(h => (
                        <th key={h} style={{ padding: "8px 12px", textAlign: "left", color: "#ededed", borderBottom: "1px solid #1a1a1a", fontWeight: 600, whiteSpace: "nowrap" }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {sales.map((sale: any, i: number) => (
                      <tr key={i} style={{ borderBottom: "1px solid #0d0d0d" }}>
                        <td style={{ padding: "8px 12px", color: "#ededed" }}>{sale.block ?? "—"}</td>
                        <td style={{ padding: "8px 12px", color: "#ededed" }}>{sale.row || "—"}</td>
                        <td style={{ padding: "8px 12px", color: "#fff" }}>{sale.quantity}</td>
                        <td style={{ padding: "8px 12px", color: "#4ade80", fontWeight: 700 }}>{sale.price != null ? `${fmt(sale.price, 2)} ${sale.currency}` : "—"}</td>
                        <td style={{ padding: "8px 12px", color: "#525252" }}>{sale.date ? new Date(sale.date).toLocaleDateString("cs-CZ", { day: "numeric", month: "numeric", hour: "2-digit", minute: "2-digit" }) : "—"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
