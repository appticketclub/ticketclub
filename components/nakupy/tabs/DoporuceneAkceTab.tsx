"use client";
import { useState } from "react";

type Event = {
  id: string;
  name: string;
  date: string | null;
  time: string | null;
  venue: string | null;
  city: string | null;
  country: string | null;
  image: string | null;
  url: string;
  priceMin: number | null;
  priceMax: number | null;
  currency: string;
  genre: string | null;
  segment: string | null;
  artist: string | null;
  ai_tip: string | null;
};

const COUNTRIES = [
  { code: "CZ", label: "Česká republika" },
  { code: "SK", label: "Slovensko" },
  { code: "DE", label: "Německo" },
  { code: "AT", label: "Rakousko" },
  { code: "GB", label: "Velká Británie" },
  { code: "PL", label: "Polsko" },
  { code: "HU", label: "Maďarsko" },
  { code: "US", label: "USA" },
];

const SEGMENTS = [
  { value: "all", label: "Vše" },
  { value: "Music", label: "Hudba" },
  { value: "Sports", label: "Sport" },
  { value: "Arts & Theatre", label: "Divadlo & Umění" },
  { value: "Family", label: "Rodina" },
  { value: "Film", label: "Film" },
];

export default function DoporuceneAkceTab() {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [total, setTotal] = useState(0);
  const [searched, setSearched] = useState(false);

  // Filters
  const [keyword, setKeyword] = useState("");
  const [city, setCity] = useState("");
  const [countryCode, setCountryCode] = useState("CZ");
  const [segment, setSegment] = useState("all");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  async function search() {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/ticketmaster/events", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ keyword, city, countryCode, classificationName: segment, dateFrom, dateTo, size: 20 }),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error);
      setEvents(data.events);
      setTotal(data.total);
      setSearched(true);
    } catch (e: any) {
      setError(e.message);
    }
    setLoading(false);
  }

  function reset() {
    setKeyword(""); setCity(""); setCountryCode("CZ");
    setSegment("all"); setDateFrom(""); setDateTo("");
    setEvents([]); setSearched(false); setTotal(0);
  }

  const inputStyle = {
    width: "100%", padding: "0.6rem 0.875rem",
    background: "#111111", border: "1px solid #1f1f1f",
    borderRadius: 10, color: "#fff", fontSize: 13,
    outline: "none", boxSizing: "border-box" as const,
  };
  const labelStyle = {
    fontSize: 11, fontWeight: 600 as const,
    letterSpacing: "0.08em", color: "#525252",
    display: "block" as const, marginBottom: "0.4rem",
  };

  return (
    <div>
      {/* Header */}
      <div style={{ marginBottom: "1.5rem" }}>
        <h1 style={{ fontSize: "1.5rem", fontWeight: 700, color: "#fff", marginBottom: "0.25rem" }}>Nadcházející akce</h1>
        <p style={{ fontSize: 13, color: "#3a3a3a" }}>Procházejte nadcházející akce z Ticketmaster</p>
      </div>

      {/* Filters */}
      <div style={{ background: "#111111", border: "1px solid #1a1a1a", borderRadius: 16, padding: "1.25rem 1.5rem", marginBottom: "1.25rem" }}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "1rem", marginBottom: "1rem" }}>
          <div>
            <label style={labelStyle}>HLEDAT</label>
            <input type="text" placeholder="Název akce, artist..." value={keyword} onChange={e => setKeyword(e.target.value)}
              onKeyDown={e => e.key === "Enter" && search()} style={inputStyle} />
          </div>
          <div>
            <label style={labelStyle}>MĚSTO</label>
            <input type="text" placeholder="Praha, Bratislava..." value={city} onChange={e => setCity(e.target.value)} style={inputStyle} />
          </div>
          <div>
            <label style={labelStyle}>ZEMĚ</label>
            <select value={countryCode} onChange={e => setCountryCode(e.target.value)} style={{ ...inputStyle, cursor: "pointer" }}>
              {COUNTRIES.map(c => <option key={c.code} value={c.code}>{c.label}</option>)}
            </select>
          </div>
          <div>
            <label style={labelStyle}>TYP AKCE</label>
            <select value={segment} onChange={e => setSegment(e.target.value)} style={{ ...inputStyle, cursor: "pointer" }}>
              {SEGMENTS.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
            </select>
          </div>
          <div>
            <label style={labelStyle}>DATUM OD</label>
            <input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)} style={{ ...inputStyle, colorScheme: "dark" }} />
          </div>
          <div>
            <label style={labelStyle}>DATUM DO</label>
            <input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)} style={{ ...inputStyle, colorScheme: "dark" }} />
          </div>
        </div>

        <div style={{ display: "flex", gap: "0.75rem", alignItems: "center" }}>
          <button
            onClick={search}
            disabled={loading}
            style={{
              padding: "0.65rem 1.5rem", fontSize: 13, fontWeight: 700,
              background: loading ? "#2a2a2a" : "linear-gradient(135deg, #ffffff, #a0a0a0)",
              border: "none", borderRadius: 10, color: "#000",
              cursor: loading ? "default" : "pointer", letterSpacing: "0.05em",
            }}
          >
            {loading ? "⏳ Hledám..." : "🔍 Hledat akce"}
          </button>
          {searched && (
            <button onClick={reset} style={{ padding: "0.65rem 1rem", fontSize: 13, background: "transparent", border: "1px solid #2a2a2a", borderRadius: 10, color: "#525252", cursor: "pointer" }}>
              × Resetovat
            </button>
          )}
          {searched && total > 0 && (
            <span style={{ fontSize: 13, color: "#3a3a3a" }}>{total} výsledků celkem</span>
          )}
        </div>
      </div>

      {error && (
        <div style={{ padding: "1rem", background: "#2a0a0a", border: "1px solid #7f1d1d", borderRadius: 12, color: "#fca5a5", marginBottom: "1rem", fontSize: 13 }}>
          Chyba: {error}
        </div>
      )}

      {/* Empty state */}
      {!searched && !loading && (
        <div style={{ background: "#111111", border: "1px dashed #2a2a2a", borderRadius: 16, padding: "4rem", textAlign: "center" }}>
          <div style={{ fontSize: "3rem", marginBottom: "1rem" }}>🎫</div>
          <p style={{ color: "#525252", fontSize: 14 }}>Zadejte filtr a klikněte na "Hledat akce"</p>
          <p style={{ color: "#3a3a3a", fontSize: 12, marginTop: 8 }}>Data z Ticketmaster · AI tipy pro každou akci</p>
        </div>
      )}

      {/* Loading */}
      {loading && (
        <div style={{ background: "#111111", border: "1px solid #1a1a1a", borderRadius: 16, padding: "4rem", textAlign: "center" }}>
          <p style={{ color: "#a78bfa", fontSize: 14, marginBottom: "0.5rem" }}>Načítám akce z Ticketmaster...</p>
          <p style={{ color: "#3a3a3a", fontSize: 12 }}>AI připravuje tipy pro každou akci</p>
        </div>
      )}

      {/* No results */}
      {searched && !loading && events.length === 0 && (
        <div style={{ background: "#111111", border: "1px dashed #2a2a2a", borderRadius: 16, padding: "3rem", textAlign: "center" }}>
          <p style={{ color: "#525252", fontSize: 14 }}>Žádné akce nenalezeny. Zkuste změnit filtry.</p>
        </div>
      )}

      {/* Events grid */}
      {!loading && events.length > 0 && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: "1rem" }}>
          {events.map((event) => (
            <div key={event.id} style={{
              background: "#111111", border: "1px solid #1a1a1a",
              borderRadius: 16, overflow: "hidden",
              transition: "border-color 0.2s, transform 0.2s",
            }}
            onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.borderColor = "#2a2a2a"; (e.currentTarget as HTMLDivElement).style.transform = "translateY(-2px)"; }}
            onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.borderColor = "#1a1a1a"; (e.currentTarget as HTMLDivElement).style.transform = "translateY(0)"; }}
            >
              {/* Image */}
              {event.image && (
                <div style={{ height: 150, overflow: "hidden", position: "relative" }}>
                  <img src={event.image} alt={event.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                  <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to top, #111111 0%, transparent 50%)" }} />
                  {event.segment && (
                    <span style={{
                      position: "absolute", top: 10, left: 10,
                      fontSize: 11, fontWeight: 600, padding: "3px 8px",
                      background: "rgba(0,0,0,0.7)", border: "1px solid #2a2a2a",
                      borderRadius: 6, color: "#c0c0c0",
                    }}>{event.segment}</span>
                  )}
                </div>
              )}

              <div style={{ padding: "1rem 1.25rem" }}>
                <h3 style={{ fontSize: 15, fontWeight: 700, color: "#fff", marginBottom: 4, lineHeight: 1.3 }}>{event.name}</h3>
                {event.artist && event.artist !== event.name && (
                  <p style={{ fontSize: 12, color: "#525252", marginBottom: 8 }}>{event.artist}</p>
                )}

                <div style={{ display: "flex", flexDirection: "column", gap: 4, marginBottom: 10 }}>
                  {event.date && (
                    <div style={{ fontSize: 12, color: "#525252", display: "flex", alignItems: "center", gap: 6 }}>
                      <span>📅</span>
                      <span>{new Date(event.date).toLocaleDateString("cs-CZ", { weekday: "short", day: "numeric", month: "long", year: "numeric" })}</span>
                      {event.time && <span style={{ color: "#3a3a3a" }}>· {event.time.substring(0, 5)}</span>}
                    </div>
                  )}
                  {event.venue && (
                    <div style={{ fontSize: 12, color: "#525252", display: "flex", alignItems: "center", gap: 6 }}>
                      <span>🏟️</span>
                      <span>{event.venue}</span>
                    </div>
                  )}
                  {event.city && (
                    <div style={{ fontSize: 12, color: "#525252", display: "flex", alignItems: "center", gap: 6 }}>
                      <span>📍</span>
                      <span>{event.city}{event.country ? `, ${event.country}` : ""}</span>
                    </div>
                  )}
                  {event.priceMin && (
                    <div style={{ fontSize: 12, color: "#525252", display: "flex", alignItems: "center", gap: 6 }}>
                      <span>💰</span>
                      <span>{event.priceMin}–{event.priceMax} {event.currency}</span>
                    </div>
                  )}
                </div>

                {/* AI tip */}
                {event.ai_tip && (
                  <div style={{
                    background: "rgba(139,92,246,0.08)", border: "1px solid rgba(139,92,246,0.2)",
                    borderRadius: 8, padding: "8px 10px", marginBottom: 12,
                  }}>
                    <p style={{ fontSize: 12, color: "#a78bfa", margin: 0 }}>🤖 {event.ai_tip}</p>
                  </div>
                )}

                <a href={event.url} target="_blank" rel="noopener noreferrer" style={{
                  display: "block", textAlign: "center",
                  padding: "8px", fontSize: 12, fontWeight: 700,
                  background: "linear-gradient(135deg, #ffffff, #a0a0a0)",
                  borderRadius: 8, color: "#000", textDecoration: "none",
                  letterSpacing: "0.05em",
                }}>
                  Zobrazit na Ticketmaster ↗
                </a>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
