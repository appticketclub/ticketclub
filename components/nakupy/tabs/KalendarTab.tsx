"use client";
import { useState, useEffect, useRef } from "react";
import { createClient } from "@/lib/supabase/client";
import { useCurrency } from "@/lib/context/CurrencyContext";
import { getCached, setCached } from "@/lib/hooks/useDataCache";

type CalendarEvent = {
  id: string;
  date: string;
  type: "purchase" | "sale";
  title: string;
  amount: number;
  quantity: number;
  currency: string;
  platform?: string | null;
  profit?: number;
};

const DAYS = ["Po", "Út", "St", "Čt", "Pá", "So", "Ne"];
const MONTHS = ["Leden","Únor","Březen","Duben","Květen","Červen","Červenec","Srpen","Září","Říjen","Listopad","Prosinec"];

export default function KalendarTab() {
  const { format } = useCurrency();
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [purchases, setPurchases] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [hoveredDay, setHoveredDay] = useState<number | null>(null);
  const [hoverPos, setHoverPos] = useState({ x: 0, y: 0 });
  const hideTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastLoadRef = useRef<number>(0);

  function showPopup(day: number, e: React.MouseEvent) {
    if (hideTimeoutRef.current) clearTimeout(hideTimeoutRef.current);
    setHoveredDay(day);
    const rect = e.currentTarget.getBoundingClientRect();
    const calendarEl = document.getElementById("calendar-grid");
    const calRect = calendarEl?.getBoundingClientRect();
    const estimatedPopupHeight = Math.min(getEventsForDay(day).length * 120 + 60, 400);
    const spaceBelow = window.innerHeight - rect.bottom;
    const showAbove = spaceBelow < estimatedPopupHeight + 20;
    setHoverPos({
      x: Math.min(rect.left - (calRect?.left ?? 0), (calRect?.width ?? 800) - 290),
      y: showAbove
        ? rect.top - (calRect?.top ?? 0) - estimatedPopupHeight - 8
        : rect.bottom - (calRect?.top ?? 0) + 8,
    });
  }

  function startHideTimer() {
    if (hideTimeoutRef.current) clearTimeout(hideTimeoutRef.current);
    hideTimeoutRef.current = setTimeout(() => {
      setHoveredDay(null);
    }, 2000);
  }

  function cancelHideTimer() {
    if (hideTimeoutRef.current) clearTimeout(hideTimeoutRef.current);
  }

  async function loadEvents(force = false) {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const cacheKey = `kalendar_${user.id}`;
    if (!force) {
      const cached = getCached(cacheKey, 60000);
      if (cached) {
        setEvents(cached);
        setLoading(false);
        return;
      }
    }

    const [{ data: purchasesData }, { data: sales }] = await Promise.all([
      supabase.from("purchases").select("id, event_name, event_date, buy_price, quantity, currency, event_actual_date, status, quantity_remaining").eq("user_id", user.id).not("event_actual_date", "is", null).limit(500),
      supabase.from("sales").select("id, sell_price, quantity_sold, currency, platform, sold_at, fees, purchases(event_name, buy_price)").eq("user_id", user.id),
    ]);

    setPurchases(purchasesData ?? []);

    const allEvents: CalendarEvent[] = [];

    purchasesData?.forEach(p => {
      if (p.event_date) allEvents.push({
        id: p.id,
        date: p.event_date,
        type: "purchase",
        title: p.event_name,
        amount: p.buy_price * p.quantity,
        quantity: p.quantity,
        currency: p.currency,
      });
    });

    sales?.forEach((s: any) => {
      if (s.sold_at) {
        const revenue = s.sell_price * s.quantity_sold;
        const cost = (s.purchases?.buy_price ?? 0) * s.quantity_sold;
        const profit = revenue - (s.fees ?? 0) - cost;
        allEvents.push({
          id: s.id,
          date: s.sold_at.split("T")[0],
          type: "sale",
          title: s.purchases?.event_name ?? "Prodej",
          amount: revenue,
          quantity: s.quantity_sold,
          currency: s.currency,
          platform: s.platform,
          profit: Math.round(profit * 100) / 100,
        });
      }
    });

    setCached(cacheKey, allEvents);
    setEvents(allEvents);
    setLoading(false);
  }

  useEffect(() => { loadEvents(); }, []);

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const unsoldDates = new Set(
    (purchases ?? [])
      .filter(p => p.status === "active" || p.status === "partial")
      .filter(p => p.event_actual_date)
      .map(p => p.event_actual_date.split("T")[0])
  );

  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  // Monday first
  const startOffset = firstDay === 0 ? 6 : firstDay - 1;

  const today = new Date();
  const isToday = (day: number) =>
    day === today.getDate() && month === today.getMonth() && year === today.getFullYear();

  const getEventsForDay = (day: number) => {
    const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    return events.filter(e => e.date === dateStr);
  };

  function prevMonth() {
    setCurrentDate(new Date(year, month - 1, 1));
  }

  function nextMonth() {
    setCurrentDate(new Date(year, month + 1, 1));
  }

  const cells = Array(startOffset).fill(null).concat(Array.from({ length: daysInMonth }, (_, i) => i + 1));
  while (cells.length % 7 !== 0) cells.push(null);

  return (
    <div>
      <style>{`
        #calendar-popup::-webkit-scrollbar { width: 4px; }
        #calendar-popup::-webkit-scrollbar-track { background: #1a1a1a; }
        #calendar-popup::-webkit-scrollbar-thumb { background: #3a3a3a; border-radius: 2px; }
      `}</style>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1.75rem" }}>
        <div>
          <h1 style={{ fontSize: "1.5rem", fontWeight: 700, color: "#fff", marginBottom: "0.25rem" }}>Kalendář</h1>
          <p style={{ fontSize: 13, color: "#3a3a3a" }}>{events.length} událostí celkem</p>
        </div>
        {/* Legend */}
        <div style={{ display: "flex", gap: "1rem", alignItems: "center" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#f87171" }} />
            <span style={{ fontSize: 12, color: "#525252" }}>Nákup</span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#34d399" }} />
            <span style={{ fontSize: 12, color: "#525252" }}>Prodej</span>
          </div>
        </div>
      </div>

      {/* Calendar card */}
      <div id="calendar-grid" style={{ background: "#111111", border: "1px solid #1a1a1a", borderRadius: 20, overflow: "visible", position: "relative" }}>
        {/* Month navigation */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "1.25rem 1.5rem", borderBottom: "1px solid #1a1a1a" }}>
          <button onClick={prevMonth} style={{ background: "none", border: "1px solid #2a2a2a", borderRadius: 8, color: "#c0c0c0", cursor: "pointer", padding: "6px 14px", fontSize: 16 }}>‹</button>
          <div style={{ fontSize: "1.1rem", fontWeight: 700, color: "#fff" }}>
            {MONTHS[month]} {year}
          </div>
          <button onClick={nextMonth} style={{ background: "none", border: "1px solid #2a2a2a", borderRadius: 8, color: "#c0c0c0", cursor: "pointer", padding: "6px 14px", fontSize: 16 }}>›</button>
        </div>

        {/* Day headers */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", borderBottom: "1px solid #1a1a1a" }}>
          {DAYS.map(d => (
            <div key={d} style={{ padding: "0.75rem", textAlign: "center", fontSize: 11, fontWeight: 600, letterSpacing: "0.08em", color: "#3a3a3a" }}>
              {d}
            </div>
          ))}
        </div>

        {/* Days grid */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)" }}>
          {cells.map((day, i) => {
            const dayEvents = day ? getEventsForDay(day) : [];
            const purchases = dayEvents.filter(e => e.type === "purchase");
            const sales = dayEvents.filter(e => e.type === "sale");
            const isCurrentDay = day ? isToday(day) : false;

            return (
              <div
                key={i}
                onMouseEnter={(e) => {
                  if (day && getEventsForDay(day).length > 0) {
                    showPopup(day, e);
                  }
                }}
                onMouseLeave={() => startHideTimer()}
                style={{
                  minHeight: 80,
                  padding: "0.5rem",
                  borderRight: (i + 1) % 7 !== 0 ? "1px solid #141414" : "none",
                  borderBottom: i < cells.length - 7 ? "1px solid #141414" : "none",
                  background: isCurrentDay ? "rgba(192,192,192,0.04)" : "transparent",
                  cursor: dayEvents.length > 0 ? "pointer" : "default",
                  transition: "background 0.15s",
                  position: "relative",
                }}
              >
                {day && (
                  <>
                    <div style={{ position: "relative", display: "inline-block" }}>
                      <div style={{
                        fontSize: 13, fontWeight: isCurrentDay ? 700 : 400,
                        color: isCurrentDay ? "#fff" : day ? "#525252" : "#2a2a2a",
                        width: 26, height: 26,
                        display: "flex", alignItems: "center", justifyContent: "center",
                        borderRadius: "50%",
                        background: isCurrentDay ? "linear-gradient(135deg, #ffffff, #a0a0a0)" : "transparent",
                        marginBottom: 6,
                      }}>
                        {day}
                      </div>
                      {(() => {
                        const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
                        const hasUnsold = unsoldDates.has(dateStr);
                        
                        if (!hasUnsold) return null;

                        const dateEvents = (purchases ?? []) 
                          .filter(p => p.status === "active" || p.status === "partial") 
                          .filter(p => p.event_actual_date.split("T")[0] === dateStr);
                        
                        return (
                          <div style={{ position: "relative", display: "inline-block" }} 
                            onMouseEnter={e => { 
                              const tooltip = (e.currentTarget as HTMLDivElement).querySelector(".tooltip") as HTMLElement; 
                              if (tooltip) tooltip.style.display = "block"; 
                            }} 
                            onMouseLeave={e => { 
                              const tooltip = (e.currentTarget as HTMLDivElement).querySelector(".tooltip") as HTMLElement; 
                              if (tooltip) tooltip.style.display = "none"; 
                            }} 
                          > 
                            <span style={{ 
                              position: "absolute", 
                              top: -8, right: -8, 
                              fontSize: 14, 
                              fontWeight: 900, 
                              color: "#f87171", 
                              lineHeight: 1, 
                              cursor: "pointer", 
                              zIndex: 2, 
                            }}>!</span> 
                        
                            {/* Tooltip */} 
                            <div className="tooltip" style={{ 
                              display: "none", 
                              position: "absolute", 
                              top: -8, left: "100%", 
                              marginLeft: 8, 
                              background: "#111111", 
                              border: "1px solid #2a2a2a", 
                              borderRadius: 10, 
                              padding: "0.5rem 0.75rem", 
                              zIndex: 50, 
                              minWidth: 180, 
                              whiteSpace: "nowrap" as const, 
                              boxShadow: "0 4px 20px rgba(0,0,0,0.5)", 
                            }}> 
                              <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 1, background: "linear-gradient(90deg, transparent, #f87171, transparent)", borderRadius: "10px 10px 0 0" }} /> 
                              {dateEvents.map(p => ( 
                                <div key={p.id} style={{ fontSize: 12, color: "#c0c0c0", padding: "2px 0" }}> 
                                  🎟️ {p.event_name} 
                                  <span style={{ fontSize: 10, color: "#f87171", marginLeft: 6 }}> 
                                    {p.quantity_remaining ?? p.quantity}× neprodáno 
                                  </span> 
                                </div> 
                              ))} 
                            </div> 
                          </div> 
                        ); 
                      })()}
                    </div>

                    {/* Event dots */}
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 3 }}>
                      {dayEvents.filter(e => e.type === "purchase").slice(0, 3).map((_, idx) => (
                        <div key={"p" + idx} style={{ width: 6, height: 6, borderRadius: "50%", background: "#f87171" }} />
                      ))}
                      {dayEvents.filter(e => e.type === "sale").slice(0, 3).map((_, idx) => (
                        <div key={"s" + idx} style={{ width: 6, height: 6, borderRadius: "50%", background: "#34d399" }} />
                      ))}
                    </div>
                  </>
                )}
              </div>
            );
          })}
        </div>

        {/* Hover popup */}
        {hoveredDay !== null && (() => {
          const dayEvts = getEventsForDay(hoveredDay);
          if (dayEvts.length === 0) return null;
          return (
            <div
              id="calendar-popup"
              onMouseEnter={() => {
                cancelHideTimer();
              }}
              onMouseLeave={() => {
                startHideTimer();
              }}
              style={{
                position: "absolute",
                left: Math.min(hoverPos.x, 900),
                top: hoverPos.y,
                background: "#1a1a1a",
                border: "1px solid #2a2a2a",
                borderRadius: 12,
                padding: "0.875rem 1rem",
                minWidth: 260,
                maxWidth: 300,
                maxHeight: 400,
                overflowY: "auto" as const,
                zIndex: 999,
                pointerEvents: "auto",
                boxShadow: "0 8px 32px rgba(0,0,0,0.8)",
                scrollbarWidth: "thin" as const,
              }}
            >
              <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: "0.08em", color: "#3a3a3a", marginBottom: 10 }}>
                {hoveredDay}. {MONTHS[month]} {year}
              </div>
              {dayEvts.map((evt, i) => {
                const isPurchase = evt.type === "purchase";
                return (
                  <div key={i} style={{
                    marginBottom: i < dayEvts.length - 1 ? 12 : 0,
                    paddingBottom: i < dayEvts.length - 1 ? 12 : 0,
                    borderBottom: i < dayEvts.length - 1 ? "1px solid #2a2a2a" : "none",
                  }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 6 }}>
                      <div style={{ width: 7, height: 7, borderRadius: "50%", background: isPurchase ? "#f87171" : "#34d399", flexShrink: 0 }} />
                      <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.08em", color: isPurchase ? "#f87171" : "#34d399" }}>
                        {isPurchase ? "NÁKUP" : "PRODEJ"}
                      </span>
                    </div>
                    <div style={{ fontSize: 14, fontWeight: 700, color: "#fff", marginBottom: 6 }}>{evt.title}</div>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "4px 12px" }}>
                      <div style={{ fontSize: 11, color: "#525252" }}>Počet</div>
                      <div style={{ fontSize: 11, color: "#c0c0c0", fontWeight: 600 }}>{evt.quantity}×</div>
                      <div style={{ fontSize: 11, color: "#525252" }}>{isPurchase ? "Nákup celkem" : "Prodej celkem"}</div>
                      <div style={{ fontSize: 11, color: "#c0c0c0", fontWeight: 600 }}>
                        {isPurchase ? "-" : "+"}{format(evt.amount, evt.currency as "EUR" | "CZK")}
                      </div>
                      {!isPurchase && evt.profit !== undefined && (
                        <>
                          <div style={{ fontSize: 11, color: "#525252" }}>Zisk</div>
                          <div style={{ fontSize: 12, fontWeight: 700, color: (evt.profit ?? 0) >= 0 ? "#34d399" : "#f87171" }}>
                            {(evt.profit ?? 0) >= 0 ? "+" : ""}{format(evt.profit, evt.currency as "EUR" | "CZK")}
                          </div>
                        </>
                      )}
                      {evt.platform && (
                        <>
                          <div style={{ fontSize: 11, color: "#525252" }}>Platforma</div>
                          <div style={{ fontSize: 11, color: "#c0c0c0" }}>{evt.platform}</div>
                        </>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          );
        })()}
      </div>
      
      <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: "1rem", fontSize: 12, color: "#525252" }}> 
        <span style={{ color: "#f87171", fontWeight: 900, fontSize: 14 }}>!</span> 
        <span>Datum koncertu s neprodanými lístky</span> 
      </div>
    </div>
  );
}
