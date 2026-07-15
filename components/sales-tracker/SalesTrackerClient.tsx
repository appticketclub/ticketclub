"use client";
import { useState } from "react";

export default function SalesTrackerClient() {
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleSearch() {
    if (!url.trim()) return;
    setLoading(true);
    setError(null);
    setData(null);
    try {
      const res = await fetch("/api/sales-tracker", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: url.trim() })
      });
      const json = await res.json();
      if (!res.ok) { setError(json.error); return; }
      setData(json.marketData);
    } catch { setError("Chyba připojení"); }
    finally { setLoading(false); }
  }

  const s = data?.summary;
  const e = data?.event;

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
    { label: "Prodaných lístků", value: fmt(s?.tickets_sold), sub: s?.tickets_sold_24h != null ? `${trendArrow(s.tickets_sold_24h)} ${fmt(s.tickets_sold_24h)} za 24h` : null, subColor: trendColor(s?.tickets_sold_24h) },
    { label: "Prodáno za 24h (ks)", value: fmt(s?.tickets_sold_24h), sub: s?.tickets_sold_24h_percentage != null ? `${trendArrow(s.tickets_sold_24h_percentage)} ${fmt(s.tickets_sold_24h_percentage, 1)} %` : null, subColor: trendColor(s?.tickets_sold_24h_percentage) },
    { label: "Dostupných lístků", value: fmt(s?.available_tickets), sub: s?.available_tickets_24h != null ? `${trendArrow(s.available_tickets_24h)} ${fmt(s.available_tickets_24h)} za 24h` : null, subColor: trendColor(s?.available_tickets_24h) },
    { label: "Průměrná cena prodeje", value: s?.average_ticket_price_sold != null ? `${fmt(s.average_ticket_price_sold, 2)} ${s?.currency ?? ""}` : "—", sub: s?.average_ticket_price_sold_24h != null ? `${trendArrow(s.average_ticket_price_sold_24h)} ${fmt(s.average_ticket_price_sold_24h, 2)} za 24h` : null, subColor: trendColor(s?.average_ticket_price_sold_24h) },
    { label: "Nejnižší cena (get-in)", value: s?.get_in_price != null ? `${fmt(s.get_in_price, 2)} ${s?.currency ?? ""}` : "—", sub: s?.get_in_price_24h != null ? `${trendArrow(s.get_in_price_24h)} ${fmt(s.get_in_price_24h, 2)} za 24h` : null, subColor: trendColor(s?.get_in_price_24h) },
    { label: "Nejvyšší prodejní cena", value: s?.highest_sale_price != null ? `${fmt(s.highest_sale_price, 2)} ${s?.currency ?? ""}` : "—", sub: null, subColor: "#525252" },
    { label: "Celkový objem prodeje", value: s?.total_volume != null ? `${fmt(s.total_volume, 2)} ${s?.currency ?? ""}` : "—", sub: null, subColor: "#525252" },
    { label: "Celkový počet prodejů", value: fmt(s?.listings_sold), sub: s?.listings_sold_24h != null ? `${trendArrow(s.listings_sold_24h)} ${fmt(s.listings_sold_24h)} za 24h` : null, subColor: trendColor(s?.listings_sold_24h) },
    { label: "Aktivní nabídky", value: fmt(s?.listings_available), sub: s?.listings_available_24h != null ? `${trendArrow(s.listings_available_24h)} ${fmt(s.listings_available_24h)} za 24h` : null, subColor: trendColor(s?.listings_available_24h) },
  ];

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
      {error && (
        <div style={{ background: "rgba(248,113,113,0.1)", border: "1px solid rgba(248,113,113,0.3)", borderRadius: 12, padding: "1rem", color: "#f87171", marginBottom: "1.5rem" }}>
          {error}
        </div>
      )}

      {/* Results */}
      {data && e && (
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

          {/* Price histogram */}
          {data.price_histogram?.data?.length > 0 && (
            <div style={{ background: "#111", border: "1px solid #1a1a1a", borderRadius: 16, padding: "1.5rem", marginBottom: "1.5rem" }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: "#fff", marginBottom: "1rem" }}>CENOVÉ ROZLOŽENÍ PRODEJŮ</div>
              <div style={{ display: "flex", alignItems: "flex-end", gap: 4, height: 100 }}>
                {(() => {
                  const maxVal = Math.max(...data.price_histogram.data.map((b: any) => b.tickets_sold));
                  return data.price_histogram.data.map((bin: any, i: number) => (
                    <div key={i} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
                      <div style={{ width: "100%", background: "#4ade80", borderRadius: "3px 3px 0 0", height: maxVal > 0 ? `${(bin.tickets_sold / maxVal) * 80}px` : "2px", opacity: 0.8 }} />
                      <div style={{ fontSize: 9, color: "#525252", transform: "rotate(-45deg)", whiteSpace: "nowrap" }}>{Number(bin.start).toFixed(0)}</div>
                    </div>
                  ));
                })()}
              </div>
            </div>
          )}

          {/* Daily stats table */}
          {data.daily_statistics?.length > 0 && (
            <div style={{ background: "#111", border: "1px solid #1a1a1a", borderRadius: 16, padding: "1.5rem" }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: "#fff", marginBottom: "1rem" }}>DENNÍ STATISTIKY</div>
              <div style={{ overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
                  <thead>
                    <tr>
                      {["Datum", "Prodáno", "Prodáno 24h", "Dostupné", "Prům. cena prodeje", "Prům. cena nabídky", "Nejvyšší cena"].map(h => (
                        <th key={h} style={{ padding: "8px 12px", textAlign: "left", color: "#ededed", borderBottom: "1px solid #1a1a1a", fontWeight: 600, whiteSpace: "nowrap" }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {[...data.daily_statistics].reverse().map((day: any, i: number) => (
                      <tr key={i} style={{ borderBottom: "1px solid #0d0d0d" }}>
                        <td style={{ padding: "8px 12px", color: "#ededed" }}>{new Date(day.stat_date).toLocaleDateString("cs-CZ")}</td>
                        <td style={{ padding: "8px 12px", color: "#fff" }}>{fmt(day.tickets_sold)}</td>
                        <td style={{ padding: "8px 12px", color: trendColor(day.tickets_sold_24h) }}>{day.tickets_sold_24h != null ? `${trendArrow(day.tickets_sold_24h)} ${fmt(day.tickets_sold_24h)}` : "—"}</td>
                        <td style={{ padding: "8px 12px", color: "#ededed" }}>{fmt(day.available_tickets)}</td>
                        <td style={{ padding: "8px 12px", color: "#ededed" }}>{day.average_ticket_price_sold != null ? `${fmt(day.average_ticket_price_sold, 2)} ${s?.currency ?? ""}` : "—"}</td>
                        <td style={{ padding: "8px 12px", color: "#ededed" }}>{day.average_ticket_price_available != null ? `${fmt(day.average_ticket_price_available, 2)} ${s?.currency ?? ""}` : "—"}</td>
                        <td style={{ padding: "8px 12px", color: "#ededed" }}>{day.highest_sale_price != null ? `${fmt(day.highest_sale_price, 2)} ${s?.currency ?? ""}` : "—"}</td>
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
