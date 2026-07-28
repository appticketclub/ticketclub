"use client";
import { useState } from "react";
import { AreaChart, Area, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";

export default function TickSightsClient() {
  const [eventId, setEventId] = useState("");
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [activeChart, setActiveChart] = useState<"sold_total" | "sold_24h" | "avg_price">("sold_total");
  const [zoomRange, setZoomRange] = useState<[number, number]>([0, 100]);

  async function handleSearch() {
    if (!eventId.trim()) return;
    setLoading(true);
    setError(null);
    setData(null);
    try {
      const res = await fetch("/api/ticksights", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ eventId: eventId.trim() })
      });
      const json = await res.json();
      if (!res.ok) { setError(json.error); return; }
      setData(json);
    } catch { setError("Chyba připojení"); }
    finally { setLoading(false); }
  }

  const event = data?.event;
  const sales = data?.sales ?? [];
  const avgPrice = data?.avgPrice ?? [];

  function fmt(v: any, dec = 0) {
    if (v == null) return "—";
    return Number(v).toLocaleString("cs-CZ", { minimumFractionDigits: dec, maximumFractionDigits: dec });
  }

  function trendColor(v: any) {
    if (v == null) return "#525252";
    return Number(v) >= 0 ? "#4ade80" : "#f87171";
  }

  const stats = event ? [
    { label: "PRODÁNO CELKEM", value: fmt(event.sales?.sold_tickets_total), subColor: "#525252" },
    { label: "PRODÁNO 24H", value: fmt(event.sales?.sold_tickets_24h), subColor: trendColor(event.sales?.sold_tickets_24h) },
    { label: "PRODÁNO 7 DNÍ", value: fmt(event.sales?.sold_tickets_7d), subColor: "#525252" },
    { label: "PRŮMĚRNÁ CENA", value: event.sales?.average_ticket_price ? `${fmt(event.sales.average_ticket_price.price, 2)} ${event.sales.average_ticket_price.currency}` : "—", subColor: "#525252" },
    { label: "DOSTUPNÉ LÍSTKY", value: fmt(event.stock?.tickets), subColor: "#525252" },
    { label: "MARKETPLACE", value: event.marketplace?.name ?? "—", subColor: "#525252" },
  ] : [];

  return (
    <div style={{ maxWidth: 900, margin: "0 auto", padding: "2rem 1rem" }}>
      <h1 style={{ fontSize: "1.75rem", fontWeight: 800, color: "#fff", marginBottom: "0.5rem" }}>TickSights Sales Tracker</h1>
      <p style={{ color: "#ededed", fontSize: 14, marginBottom: "1.5rem" }}>Zadejte ID eventu pro zobrazení statistik prodeje.</p>

      {/* Input */}
      <div style={{ display: "flex", gap: "0.75rem", marginBottom: "2rem" }}>
        <input
          value={eventId}
          onChange={e => setEventId(e.target.value)}
          onKeyDown={e => e.key === "Enter" && handleSearch()}
          placeholder="ID eventu (napr. 157476339)"
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

      {data && event && (
        <>
          {/* Event header */}
          <div style={{ background: "#111", border: "1px solid #1a1a1a", borderRadius: 16, padding: "1.5rem", marginBottom: "1.5rem", display: "flex", gap: "1rem", alignItems: "center" }}>
            {event.image && <img src={event.image} alt="" style={{ width: 80, height: 80, borderRadius: 10, objectFit: "cover" }} />}
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: "1.25rem", fontWeight: 800, color: "#fff", marginBottom: 4 }}>{event.title}</div>
              <div style={{ fontSize: 13, color: "#ededed" }}>{event.Location} · {event.Ort}, {event.CountryCode}</div>
              {event.date && <div style={{ fontSize: 13, color: "#ededed", marginTop: 2 }}>{new Date(event.date).toLocaleDateString("cs-CZ", { day: "numeric", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit" })}</div>}
              {event.Performer && <div style={{ fontSize: 12, color: "#4ade80", marginTop: 4 }}>{event.Performer}</div>}
            </div>
            {event.map && <img src={event.map} alt="Seating map" style={{ width: 120, height: 80, borderRadius: 8, objectFit: "cover", opacity: 0.8 }} />}
          </div>

          {/* Stats grid */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: "0.75rem", marginBottom: "1.5rem" }}>
            {stats.map((stat, i) => (
              <div key={i} style={{ background: "#111", border: "1px solid #1a1a1a", borderRadius: 12, padding: "1rem 1.25rem" }}>
                <div style={{ fontSize: 10, color: "#ededed", letterSpacing: "0.08em", marginBottom: 6 }}>{stat.label}</div>
                <div style={{ fontSize: "1.25rem", fontWeight: 800, color: "#fff" }}>{stat.value}</div>
              </div>
            ))}
          </div>

          {/* Avg price per block */}
          {avgPrice.length > 0 && (
            <div style={{ background: "#111", border: "1px solid #1a1a1a", borderRadius: 16, padding: "1.5rem", marginBottom: "1.5rem" }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: "#fff", marginBottom: "1rem" }}>PRŮMĚRNÁ CENA PER BLOK</div>
              
              {/* Zoom controls */}
              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.75rem", justifyContent: "flex-end" }}>
                <span style={{ fontSize: 11, color: "#525252" }}>Zoom:</span>
                {[["Vše", [0,100]], ["Top 10", [0,33]], ["Top 5", [0,16]]].map(([label, range]) => (
                  <button key={label as string} onClick={() => setZoomRange(range as [number,number])} style={{ padding: "3px 10px", background: JSON.stringify(zoomRange) === JSON.stringify(range) ? "#fff" : "transparent", border: "1px solid #2a2a2a", borderRadius: 6, color: JSON.stringify(zoomRange) === JSON.stringify(range) ? "#000" : "#ededed", fontSize: 11, cursor: "pointer" }}>{label as string}</button>
                ))}
              </div>

              {(() => {
                const sorted = [...avgPrice].sort((a: any, b: any) => b.sold_tickets - a.sold_tickets);
                const start = Math.floor((zoomRange[0] / 100) * sorted.length);
                const end = Math.ceil((zoomRange[1] / 100) * sorted.length);
                const visible = sorted.slice(start, end);
                return (
                  <ResponsiveContainer width="100%" height={220}>
                    <BarChart data={visible} margin={{ top: 5, right: 10, left: 0, bottom: 60 }}>
                      <XAxis dataKey="block" tick={{ fill: "#525252", fontSize: 10 }} axisLine={false} tickLine={false} angle={-45} textAnchor="end" />
                      <YAxis tick={{ fill: "#525252", fontSize: 10 }} axisLine={false} tickLine={false} width={45} />
                      <Tooltip contentStyle={{ background: "#111", border: "1px solid #2a2a2a", borderRadius: 8, fontSize: 12 }} labelStyle={{ color: "#fff" }} formatter={(v: any) => [`${fmt(v, 2)} EUR`, ""]} />
                      <Bar dataKey="avg_sale_price" fill="#4ade80" radius={[3,3,0,0]} />
                    </BarChart>
                  </ResponsiveContainer>
                );
              })()}
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
