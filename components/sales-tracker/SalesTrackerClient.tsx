"use client";
import { useState } from "react";
import { AreaChart, Area, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";

export default function SalesTrackerClient() {
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [eventoryData, setEventoryData] = useState<any>(null);
  const [ticksightsData, setTicksightsData] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [activeTracker, setActiveTracker] = useState<"eventory" | "ticksights">("ticksights");

  async function handleSearch() {
    if (!url.trim()) return;
    setLoading(true);
    setError(null);
    setEventoryData(null);
    setTicksightsData(null);

    try {
      // Only load TickSights automatically
      const match = url.match(/E-(\d+)/i) || url.match(/\/(\d{7,})/);
      if (match) {
        const tsRes = await fetch("/api/ticksights", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ eventId: match[1] })
        });
        const tsJson = await tsRes.json();
        if (tsRes.ok) setTicksightsData(tsJson);
        else setError(tsJson.error);
      }
    } catch { setError("Chyba připojení"); }
    finally { setLoading(false); }
  }

  return (
    <div style={{ maxWidth: 900, margin: "0 auto", padding: "2rem 1rem" }}>
      <h1 style={{ fontSize: "1.75rem", fontWeight: 800, color: "#fff", marginBottom: "0.5rem" }}>Sales Tracker</h1>
      <p style={{ color: "#ededed", fontSize: 14, marginBottom: "1.5rem" }}>Zadejte Viagogo URL akce pro zobrazení statistik prodeje.</p>

      {/* Input */}
      <div style={{ display: "flex", gap: "0.75rem", marginBottom: "2rem" }}>
        <input
          value={url}
          onChange={e => setUrl(e.target.value)}
          onKeyDown={e => e.key === "Enter" && handleSearch()}
          placeholder="https://www.viagogo.com/..."
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

      {/* Error */}
      {error && !error.includes("server") && !error.includes("Server") && (
        <div style={{ background: "rgba(248,113,113,0.1)", border: "1px solid rgba(248,113,113,0.3)", borderRadius: 12, padding: "1rem", color: "#f87171", marginBottom: "1.5rem" }}>
          {error}
        </div>
      )}

      {/* Results */}
      {(eventoryData || ticksightsData) && (
        <>
          {/* Tracker switcher */}
          <div style={{ display: "flex", gap: "0.5rem", marginBottom: "1.5rem" }}>
            {[
              { key: "ticksights", label: "TickSights Sales Tracker" },
              { key: "eventory", label: "Sales Tracker (Eventory)" },
            ].map(tab => (
              <button
                key={tab.key}
                onClick={() => setActiveTracker(tab.key as any)}
                style={{
                  padding: "8px 18px", borderRadius: 10, fontSize: 13, fontWeight: 700,
                  border: "1px solid",
                  cursor: "pointer",
                  background: activeTracker === tab.key ? "#ffffff" : "transparent",
                  borderColor: activeTracker === tab.key ? "#ffffff" : "#2a2a2a",
                  color: activeTracker === tab.key ? "#000000" : "#ededed",
                }}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {activeTracker === "eventory" && !eventoryData && (
            <div style={{ textAlign: "center", padding: "2rem" }}>
              <button
                onClick={async () => {
                  setLoading(true);
                  try {
                    const res = await fetch("/api/sales-tracker", {
                      method: "POST",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({ url: url.trim() })
                    });
                    const json = await res.json();
                    if (res.ok) setEventoryData(json);
                    else setError(json.error);
                  } catch { setError("Chyba připojení"); }
                  finally { setLoading(false); }
                }}
                style={{ padding: "0.75rem 1.5rem", background: "linear-gradient(135deg, #ffffff, #a0a0a0)", border: "none", borderRadius: 10, color: "#000", fontWeight: 700, fontSize: 14, cursor: "pointer" }}
              >
                Vyhledat v Eventory
              </button>
            </div>
          )}

          {activeTracker === "eventory" && <EventorySection data={eventoryData} />}
          {activeTracker === "ticksights" && <TickSightsSection data={ticksightsData} />}
        </>
      )}
    </div>
  );
}

/* ─── Eventory Section ─────────────────────────────────────────────── */
function EventorySection({ data }: { data: any }) {
  const [activeChart, setActiveChart] = useState<"tickets_sold" | "tickets_sold_24h" | "available_tickets" | "avg_price_sold" | "avg_price_available" | "highest_price">("tickets_sold");

  const s = data?.marketData?.summary;
  const e = data?.marketData?.event;
  const sales = data?.sales ?? [];
  const lastDayStat = data?.marketData?.daily_statistics?.[data.marketData.daily_statistics.length - 1];

  function fmt(v: any, dec = 0) {
    if (v == null) return "—";
    return Number(v).toLocaleString("cs-CZ", { minimumFractionDigits: dec, maximumFractionDigits: dec });
  }

  function trendColor(v: any) {
    if (v == null) return "#525252";
    return Number(v) >= 0 ? "#4ade80" : "#f87171";
  }

  function trendArrow(v: any) {
    if (v == null) return "";
    return Number(v) >= 0 ? "▲" : "▼";
  }

  const stats = [
    { label: "Celkový počet prodejů", value: fmt(s?.listings_sold), sub: s?.listings_sold_24h != null ? `${trendArrow(s.listings_sold_24h)} ${fmt(s.listings_sold_24h)} za 24h` : null, subColor: trendColor(s?.listings_sold_24h) },
    { label: "Prodaných lístků", value: fmt(s?.tickets_sold), sub: s?.tickets_sold_24h != null ? `${trendArrow(s.tickets_sold_24h)} ${fmt(s.tickets_sold_24h)} za 24h` : null, subColor: trendColor(s?.tickets_sold_24h) },
    { label: "Prodáno za 24h (ks)", value: fmt(lastDayStat?.tickets_sold_24h ?? s?.tickets_sold_24h), sub: null, subColor: "#525252" },
    { label: "Dostupných lístků", value: fmt(s?.available_tickets), sub: s?.available_tickets_24h != null ? `${trendArrow(s.available_tickets_24h)} ${fmt(s.available_tickets_24h)} za 24h` : null, subColor: trendColor(s?.available_tickets_24h) },
    { label: "Průměrná cena prodeje", value: s?.average_ticket_price_sold != null ? `${fmt(s.average_ticket_price_sold, 2)} ${s?.currency ?? ""}` : "—", sub: s?.average_ticket_price_sold_24h != null ? `${trendArrow(s.average_ticket_price_sold_24h)} ${fmt(s.average_ticket_price_sold_24h, 2)} za 24h` : null, subColor: trendColor(s?.average_ticket_price_sold_24h) },
    { label: "Nejnižší cena (get-in)", value: s?.get_in_price != null ? `${fmt(s.get_in_price, 2)} ${s?.currency ?? ""}` : "—", sub: s?.get_in_price_24h != null ? `${trendArrow(s.get_in_price_24h)} ${fmt(s.get_in_price_24h, 2)} za 24h` : null, subColor: trendColor(s?.get_in_price_24h) },
    { label: "Nejvyšší prodejní cena", value: s?.highest_sale_price != null ? `${fmt(s.highest_sale_price, 2)} ${s?.currency ?? ""}` : "—", sub: null, subColor: "#525252" },
    { label: "Celkový objem prodeje", value: s?.total_volume != null ? `${fmt(s.total_volume, 2)} ${s?.currency ?? ""}` : "—", sub: null, subColor: "#525252" },
  ];

  if (!data || !e) return null;

  return (
    <>
      {/* Event header */}
      <div style={{ background: "#111", border: "1px solid #1a1a1a", borderRadius: 16, padding: "1.5rem", marginBottom: "1.5rem", display: "flex", gap: "1rem", alignItems: "center" }}>
        {e.event_image && <img src={e.event_image} alt="" style={{ width: 80, height: 80, borderRadius: 10, objectFit: "cover" }} />}
        <div>
          <div style={{ fontSize: "1.25rem", fontWeight: 800, color: "#fff", marginBottom: 4 }}>{e.event_name}</div>
          <div style={{ fontSize: 13, color: "#ededed" }}>{e.venue?.name} · {e.venue?.city}, {e.venue?.country}</div>
          {e.event_date && <div style={{ fontSize: 13, color: "#ededed", marginTop: 2 }}>{new Date(e.event_date).toLocaleDateString("cs-CZ", { day: "numeric", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit" })}</div>}
          {e.viagogo_event_url && <a href={e.viagogo_event_url} target="_blank" rel="noopener noreferrer" style={{ fontSize: 12, color: "#4ade80", marginTop: 4, display: "block" }}>Zobrazit na Viagogo →</a>}
        </div>
      </div>

      {/* Stats grid */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: "0.75rem", marginBottom: "1.5rem" }}>
        {stats.map((stat, i) => (
          <div key={i} style={{ background: "#111", border: "1px solid #1a1a1a", borderRadius: 12, padding: "1rem 1.25rem" }}>
            <div style={{ fontSize: 10, color: "#ededed", letterSpacing: "0.08em", marginBottom: 6 }}>{stat.label.toUpperCase()}</div>
            <div style={{ fontSize: "1.25rem", fontWeight: 800, color: "#fff" }}>{stat.value}</div>
            {stat.sub && <div style={{ fontSize: 11, color: stat.subColor, marginTop: 4 }}>{stat.sub}</div>}
          </div>
        ))}
      </div>

      {/* Chart section */}
      {data.marketData?.daily_statistics?.length > 0 && (
        <div style={{ background: "#111", border: "1px solid #1a1a1a", borderRadius: 16, padding: "1.5rem", marginBottom: "1.5rem" }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: "#fff", marginBottom: "1rem" }}>VÝVOJ V ČASE</div>

          {/* Tab switcher */}
          <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap", marginBottom: "1.25rem" }}>
            {([
              { key: "tickets_sold", label: "Prodáno celkem" },
              { key: "tickets_sold_24h", label: "Denní prodeje" },
              { key: "available_tickets", label: "Dostupné" },
              { key: "avg_price_sold", label: "Prům. cena prodeje" },
              { key: "avg_price_available", label: "Prům. cena nabídky" },
              { key: "highest_price", label: "Nejvyšší cena" },
            ] as const).map(tab => (
              <button
                key={tab.key}
                onClick={() => setActiveChart(tab.key)}
                style={{
                  padding: "5px 12px",
                  borderRadius: 8,
                  fontSize: 11,
                  fontWeight: 700,
                  letterSpacing: "0.05em",
                  border: "1px solid",
                  cursor: "pointer",
                  background: activeChart === tab.key ? "#ffffff" : "transparent",
                  borderColor: activeChart === tab.key ? "#ffffff" : "#2a2a2a",
                  color: activeChart === tab.key ? "#000000" : "#ededed",
                  transition: "all 0.15s",
                }}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Chart */}
          {(() => {
            const chartData = [...data.marketData.daily_statistics].map((d: any) => ({
              date: new Date(d.stat_date).toLocaleDateString("cs-CZ", { day: "numeric", month: "numeric" }),
              tickets_sold: d.tickets_sold ?? 0,
              tickets_sold_24h: d.tickets_sold_24h ?? 0,
              available_tickets: d.available_tickets ?? 0,
              avg_price_sold: d.average_ticket_price_sold ? Number(d.average_ticket_price_sold) : 0,
              avg_price_available: d.average_ticket_price_available ? Number(d.average_ticket_price_available) : 0,
              highest_price: d.highest_sale_price ? Number(d.highest_sale_price) : 0,
            }));

            const isBar = activeChart === "tickets_sold_24h";
            const currency = s?.currency ?? "";

            const tooltipFormatter = (value: any) => {
              if (["avg_price_sold", "avg_price_available", "highest_price"].includes(activeChart)) {
                return [`${Number(value).toFixed(2)} ${currency}`, ""];
              }
              return [fmt(value), ""];
            };

            return (
              <ResponsiveContainer width="100%" height={240}>
                {isBar ? (
                  <BarChart data={chartData} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
                    <XAxis dataKey="date" tick={{ fill: "#525252", fontSize: 10 }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fill: "#525252", fontSize: 10 }} axisLine={false} tickLine={false} width={45} />
                    <Tooltip
                      contentStyle={{ background: "#111", border: "1px solid #2a2a2a", borderRadius: 8, fontSize: 12 }}
                      labelStyle={{ color: "#fff" }}
                      formatter={tooltipFormatter}
                    />
                    <Bar dataKey={activeChart} fill="#4ade80" radius={[3, 3, 0, 0]} />
                  </BarChart>
                ) : (
                  <AreaChart data={chartData} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
                    <defs>
                      <linearGradient id="chartGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#4ade80" stopOpacity={0.15} />
                        <stop offset="95%" stopColor="#4ade80" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <XAxis dataKey="date" tick={{ fill: "#525252", fontSize: 10 }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fill: "#525252", fontSize: 10 }} axisLine={false} tickLine={false} width={55}
                      tickFormatter={v => ["avg_price_sold", "avg_price_available", "highest_price"].includes(activeChart) ? `${v} ${currency}` : fmt(v)} />
                    <Tooltip
                      contentStyle={{ background: "#111", border: "1px solid #2a2a2a", borderRadius: 8, fontSize: 12 }}
                      labelStyle={{ color: "#fff" }}
                      formatter={tooltipFormatter}
                    />
                    <Area
                      type="monotone"
                      dataKey={activeChart}
                      stroke="#4ade80"
                      strokeWidth={2}
                      fill="url(#chartGrad)"
                      dot={false}
                      activeDot={{ r: 4, fill: "#4ade80", stroke: "#111", strokeWidth: 2 }}
                    />
                  </AreaChart>
                )}
              </ResponsiveContainer>
            );
          })()}
        </div>
      )}

      {/* Sales history */}
      {sales.length > 0 && (
        <div style={{ background: "#111", border: "1px solid #1a1a1a", borderRadius: 16, padding: "1.5rem", marginBottom: "1.5rem" }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: "#fff", marginBottom: "1rem" }}>
            HISTORIE PRODEJŮ
          </div>
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
              <thead>
                <tr>
                  {["Cena / ks", "Počet vstupenek", "Sekce", "Řada", "Místo", "Datum"].map(h => (
                    <th key={h} style={{ padding: "8px 12px", textAlign: "left", color: "#ededed", borderBottom: "1px solid #1a1a1a", fontWeight: 600, whiteSpace: "nowrap" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {sales.map((sale: any, i: number) => (
                  <tr key={i} style={{ borderBottom: "1px solid #0d0d0d" }}>
                    <td style={{ padding: "8px 12px", color: "#4ade80", fontWeight: 700 }}>
                      {sale.raw_price != null ? `${Number(sale.raw_price).toFixed(2)} ${s?.currency ?? ""}` : "—"}
                    </td>
                    <td style={{ padding: "8px 12px", color: "#fff" }}>{sale.sold_tickets ?? "—"}</td>
                    <td style={{ padding: "8px 12px", color: "#ededed" }}>{sale.section ?? "—"}</td>
                    <td style={{ padding: "8px 12px", color: "#ededed" }}>{sale.row ?? "—"}</td>
                    <td style={{ padding: "8px 12px", color: "#ededed" }}>{sale.seat ?? "—"}</td>
                    <td style={{ padding: "8px 12px", color: "#525252" }}>
                      {sale.created_datetime ? new Date(sale.created_datetime).toLocaleDateString("cs-CZ", { day: "numeric", month: "numeric", hour: "2-digit", minute: "2-digit" }) : "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Price histogram */}
      {data.marketData?.price_histogram?.data?.length > 0 && (
        <div style={{ background: "#111", border: "1px solid #1a1a1a", borderRadius: 16, padding: "1.5rem" }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: "#fff", marginBottom: "1rem" }}>CENOVÉ ROZLOŽENÍ PRODEJŮ</div>
          <div style={{ display: "flex", alignItems: "flex-end", gap: 4, height: 100 }}>
            {(() => {
              const maxVal = Math.max(...data.marketData.price_histogram.data.map((b: any) => b.tickets_sold));
              return data.marketData.price_histogram.data.map((bin: any, i: number) => (
                <div key={i} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
                  <div style={{ width: "100%", background: "#4ade80", borderRadius: "3px 3px 0 0", height: maxVal > 0 ? `${(bin.tickets_sold / maxVal) * 80}px` : "2px", opacity: 0.8 }} />
                  <div style={{ fontSize: 9, color: "#525252", transform: "rotate(-45deg)", whiteSpace: "nowrap" }}>{Number(bin.start).toFixed(0)}</div>
                </div>
              ));
            })()}
          </div>
        </div>
      )}
    </>
  );
}

/* ─── TickSights Section ───────────────────────────────────────────── */
function TickSightsSection({ data }: { data: any }) {
  const [activeChart, setActiveChart] = useState<"sold" | "avg_price" | "sales_timeline">("sold");

  const event = data?.event;
  const tsSales: any[] = data?.sales ?? [];
  const avgPrice: any[] = data?.avgPrice ?? [];
  const tsDevelopment: any[] = data?.development ?? [];

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
    { label: "CELKOVÝ POČET PRODEJŮ", value: fmt(data?.total_count || tsSales.length) },
    { label: "PRODANÝCH LÍSTKŮ", value: fmt(event.sales?.sold_tickets_total) },
    { label: "PRODÁNO ZA 24H (KS)", value: fmt(event.sales?.sold_tickets_24h), color: "#4ade80" },
    { label: "DOSTUPNÝCH LÍSTKŮ", value: fmt(event.stock?.tickets) },
    { label: "PRŮMĚRNÁ CENA PRODEJE", value: event.sales?.average_ticket_price ? `${fmt(event.sales.average_ticket_price.price, 2)} ${currency}` : "—" },
    { label: "NEJNIŽŠÍ CENA (GET-IN)", value: lowestPrice ? `${fmt(lowestPrice, 2)} ${currency}` : "—" },
    { label: "NEJVYŠŠÍ PRODEJNÍ CENA", value: highestPrice ? `${fmt(highestPrice, 2)} ${currency}` : "—" },
    { label: "CELKOVÝ OBJEM PRODEJE", value: totalVolume > 0 ? `${fmt(totalVolume, 2)} ${currency}` : "—" },
  ] : [];

  // Generate continuous date range with zeros for missing days
  const salesByDate = tsSales.reduce((acc: any, sale: any) => {
    const date = sale.date ? sale.date.substring(0, 10) : "unknown";
    if (!acc[date]) acc[date] = { date, tickets: 0, revenue: 0, count: 0 };
    acc[date].tickets += sale.quantity ?? 0;
    acc[date].revenue += (sale.price ?? 0) * (sale.quantity ?? 0);
    acc[date].count += 1;
    return acc;
  }, {});

  // Find min and max dates
  const saleDates = Object.keys(salesByDate).filter(d => d !== "unknown").sort();
  const salesTimelineData = saleDates.length > 0 ? (() => {
    const start = new Date(saleDates[0]);
    const end = new Date(saleDates[saleDates.length - 1]);
    const result = [];
    for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
      const dateStr = d.toISOString().substring(0, 10);
      result.push({
        date: new Date(dateStr).toLocaleDateString("cs-CZ", { day: "numeric", month: "numeric" }),
        tickets: salesByDate[dateStr]?.tickets ?? 0,
      });
    }
    return result;
  })() : [];

  const chartData = avgPrice
    .map((b: any) => ({
      block: b.block?.length > 15 ? b.block.substring(0, 15) + "…" : b.block,
      sold_tickets: b.sold_tickets,
      avg_price: b.avg_sale_price,
    }))
    .sort((a, b) => b.sold_tickets - a.sold_tickets)
    .slice(0, 15);

  const tsDevChartData = tsDevelopment.map((d: any) => ({
    date: new Date(d.date).toLocaleDateString("cs-CZ", { day: "numeric", month: "numeric" }),
    tickets: d.tickets ?? 0,
    revenue: d.revenue ?? 0,
    avg_price: d.avg_price ?? 0,
  }));

  if (!data) {
    return (
      <div style={{ background: "rgba(234,179,8,0.1)", border: "1px solid rgba(234,179,8,0.3)", borderRadius: 12, padding: "1rem", color: "#eab308" }}>
        TickSights nenašiel event pre toto ID.
      </div>
    );
  }

  if (!event) return null;

  return (
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
          {event.last_update && (
            <div style={{ fontSize: 11, color: "#525252", marginTop: 2 }}>
              Posledná aktualizácia: {new Date(event.last_update).toLocaleDateString("cs-CZ", { day: "numeric", month: "numeric", year: "numeric", hour: "2-digit", minute: "2-digit" })}
            </div>
          )}
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
      {(avgPrice.length > 0 || tsSales.length > 0 || tsDevelopment.length > 0) && (
        <div style={{ background: "#111", border: "1px solid #1a1a1a", borderRadius: 16, padding: "1.5rem", marginBottom: "1.5rem" }}>
          <div style={{ display: "flex", gap: "0.5rem", marginBottom: "1.25rem", flexWrap: "wrap" as const }}>
            {([
              { key: "sold", label: "Prodeje v sektorech" },
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
            <BarChart
              data={activeChart === "sales_timeline" ? salesTimelineData : chartData}
              margin={{ top: 5, right: 10, left: 0, bottom: activeChart === "sold" || activeChart === "avg_price" ? 60 : 0 }}
            >
              <XAxis
                dataKey={activeChart === "sold" || activeChart === "avg_price" ? "block" : "date"}
                tick={{ fill: "#525252", fontSize: 10 }}
                axisLine={false}
                tickLine={false}
                {...(activeChart === "sold" || activeChart === "avg_price" ? { angle: -45, textAnchor: "end" as const } : {})}
              />
              <YAxis
                tick={{ fill: "#525252", fontSize: 10 }}
                axisLine={false}
                tickLine={false}
                width={activeChart === "sold" || activeChart === "avg_price" ? 55 : 45}
                tickFormatter={v => activeChart === "avg_price" ? `${v} ${currency}` : fmt(v)}
              />
              <Tooltip
                contentStyle={{ background: "#111", border: "1px solid #2a2a2a", borderRadius: 8, fontSize: 12 }}
                labelStyle={{ color: "#fff" }}
                formatter={(v: any) => activeChart === "avg_price" ? [`${fmt(v, 2)} ${currency}`, ""] : [fmt(v), ""]}
              />
              <Bar
                dataKey={activeChart === "avg_price" ? "avg_price" : activeChart === "sales_timeline" ? "tickets" : "sold_tickets"}
                fill="#4ade80"
                radius={[3, 3, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Sales history */}
      {tsSales.length > 0 && (
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
                {[...tsSales].sort((a: any, b: any) =>
                  new Date(b.date ?? 0).getTime() - new Date(a.date ?? 0).getTime()
                ).map((sale: any, i: number) => (
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
  );
}
