"use client";
import { useState, useEffect, useRef } from "react";
import { createClient } from "@/lib/supabase/client";
import SellModal from "@/components/nakupy/SellModal";
import { useCurrency } from "@/lib/context/CurrencyContext";
import { EXCHANGES } from "@/lib/constants/exchanges";
import { getCached, setCached, clearCache } from "@/lib/hooks/useDataCache";

function isThisMonth(dateStr: string | null): boolean {
  if (!dateStr) return false;
  const date = new Date(dateStr);
  const now = new Date();
  return date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear();
}

type Purchase = {
  id: string;
  event_name: string;
  event_date: string | null;
  venue: string | null;
  city: string | null;
  event_actual_date: string | null;
  sector: string | null;
  exchange: string | null;
  delivered: boolean;
  paid_out: boolean;
  notes: string | null;
  tags: string[];
  quantity: number;
  quantity_remaining: number;
  buy_price: number;
  total_cost: number;
  currency: string;
  status: string;
  account_ref: string | null;
  created_at: string;
  platforms?: { name: string } | null;
  ticket_type_custom?: string | null;
};

type Account = { id: string; name: string };

const statusColors: Record<string, { bg: string; color: string; label: string }> = {
  active:   { bg: "#0a2a1a", color: "#34d399", label: "Aktivní" },
  partial:  { bg: "#2a1a0a", color: "#fbbf24", label: "Částečně" },
  sold:     { bg: "#0a0a2a", color: "#818cf8", label: "Prodáno" },
  cancelled:{ bg: "#2a0a0a", color: "#f87171", label: "Zrušeno" },
};

function AddPurchaseModal({ accounts, onClose, onSave }: { accounts: Account[]; onClose: () => void; onSave: () => void }) {
  const [eventName, setEventName] = useState("");
  const [city, setCity] = useState("");
  const [sector, setSector] = useState("");
  const today = new Date().toISOString().split("T")[0];
  const [eventDate, setEventDate] = useState(today);
  const [eventActualDate, setEventActualDate] = useState("");
  const [accountRef, setAccountRef] = useState("");
  const [buyPrice, setBuyPrice] = useState("");
  const [totalPrice, setTotalPrice] = useState("");
  const [quantity, setQuantity] = useState("1");
  const [priceMode, setPriceMode] = useState<"per_ticket" | "total">("per_ticket");
  const { currency, setCurrency } = useCurrency();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState("");
  const [exchange, setExchange] = useState("");
  const [customExchange, setCustomExchange] = useState("");
  const [ticketType, setTicketType] = useState("");
  const [customTicketType, setCustomTicketType] = useState("");
  const [notes, setNotes] = useState("");
  const [delivered, setDelivered] = useState(false);
  const [paid, setPaid] = useState(false);

  const priceNum = priceMode === "per_ticket"
    ? parseFloat(buyPrice.replace(",", ".")) || 0
    : (parseFloat(totalPrice.replace(",", ".")) || 0) / (parseInt(quantity) || 1);
  const qtyNum = parseInt(quantity) || 1;
  const totalCost = priceNum * qtyNum;

  async function handleAiImport(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setAiLoading(true);
    setAiError("");

    try {
      const base64 = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve((reader.result as string).split(",")[1]);
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });

      const res = await fetch("/api/ai/import-purchase", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ imageBase64: base64, mimeType: file.type }),
      });

      const result = await res.json();
      console.log("AI result:", result);
      if (!result.success) {
        setAiError(`AI chyba: ${result.error}`);
        setAiLoading(false);
        return;
      }

      const d = result.data;
      if (d.event_name) setEventName(d.event_name);
      if (d.city) setCity(d.city);
      if (d.buy_price) setBuyPrice(String(d.buy_price));
      if (d.quantity) setQuantity(String(d.quantity));
      if (d.event_date) setEventDate(d.event_date);
      if (d.currency && ["EUR", "CZK"].includes(d.currency)) setCurrency(d.currency as "EUR" | "CZK");
      if (d.ticket_type) setTicketType(d.ticket_type);
      if (d.sector) setSector(d.sector);
      if (d.exchange) setExchange(d.exchange);
      if (d.venue) setSector(prev => prev || d.venue);

    } catch (err: any) {
      console.error("Frontend AI error:", err);
      setAiError(`Chyba: ${err?.message ?? "AI import selhal"}`);
    }
    setAiLoading(false);
    // Reset file input
    e.target.value = "";
  }

  async function handleSave() {
    if (!eventName.trim()) return setError("Název akce je povinný.");
    if (priceNum <= 0) return setError("Zadejte platnou cenu lístku.");
    setSaving(true);
    setError("");
    const resolvedExchange = exchange === "Jiné" ? (customExchange.trim() || "Jiné") : exchange;
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { error: err } = await supabase.from("purchases").insert({
      user_id: user.id,
      event_name: eventName.trim(),
      city: city.trim() || null,
      venue: sector.trim() || null,
      event_date: eventDate,
      event_actual_date: eventActualDate || null,
      buy_price: priceNum,
      quantity: qtyNum,
      quantity_remaining: qtyNum,
      currency: currency,
      exchange: resolvedExchange || null,
      account_ref: accountRef || null,
      platform_id: null,
      notes: notes.trim() || null,
      tags: resolvedExchange ? [resolvedExchange] : [],
      status: "active",
      delivered: delivered,
      paid_out: paid,
      ticket_type_custom: ticketType === "Jiné" ? (customTicketType || "Jiné") : (ticketType || null),
    });

    if (err) { setError(err.message); setSaving(false); return; }

    // Clear cache
    clearCache(`nakupy_${user.id}`);
    clearCache(`uvod_${user.id}`);
    clearCache(`kalendar_${user.id}`);

    // Update capital balance
    const { data: profile } = await supabase.from("profiles").select("capital, capital_currency").eq("id", user.id).single();
    if (profile) {
      const newBalance = (profile.capital ?? 0) - totalCost;
      await supabase.from("profiles").update({ capital: newBalance }).eq("id", user.id);
      await supabase.from("capital_history").insert({
        user_id: user.id,
        amount: -totalCost,
        type: "purchase",
        description: `Nákup: ${eventName}`,
        balance_after: newBalance,
      });

      // After inserting, check count and delete oldest if over 100
      const { count } = await supabase
        .from("capital_history")
        .select("*", { count: "exact", head: true })
        .eq("user_id", user.id);

      if ((count ?? 0) > 100) {
        const { data: oldest } = await supabase
          .from("capital_history")
          .select("id")
          .eq("user_id", user.id)
          .order("created_at", { ascending: true })
          .limit(10);
        if (oldest?.length) {
          await supabase.from("capital_history").delete().in("id", oldest.map(r => r.id));
        }
      }
    }

    onSave();
    onClose();
    setSaving(false);
  }

  const inputStyle = {
    width: "100%", padding: "0.75rem 1rem",
    background: "#0a0a0a", border: "1px solid #2a2a2a",
    borderRadius: 10, color: "#fff", fontSize: 14,
    outline: "none", boxSizing: "border-box" as const,
  };
  const labelStyle = {
    fontSize: 11, fontWeight: 600 as const,
    letterSpacing: "0.08em", color: "#525252",
    display: "block" as const, marginBottom: "0.4rem",
  };

  return (
    <>
      <div onClick={onClose} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.75)", zIndex: 100, backdropFilter: "blur(4px)" }} />
      {/* Modal wrapper */}
      <div style={{
        position: "fixed", top: "50%", left: "50%",
        transform: "translate(-50%, -50%)",
        width: "100%", maxWidth: 520,
        maxHeight: "90vh",
        background: "#111111", border: "1px solid #2a2a2a",
        borderRadius: 20, zIndex: 101,
        overflow: "hidden",
        display: "flex", flexDirection: "column",
      }}>
        {/* Top chrome line */}
        <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 1, background: "linear-gradient(90deg, transparent, #c0c0c0, transparent)", zIndex: 1 }} />

        {/* FIXED Header */}
        <div style={{
          padding: "1.5rem 2rem 1rem",
          borderBottom: "1px solid #1a1a1a",
          flexShrink: 0,
          background: "#111111",
        }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <h2 style={{ fontSize: "1.1rem", fontWeight: 700, color: "#fff", margin: 0 }}>Přidat nákup</h2>
            <button onClick={onClose} style={{ background: "none", border: "none", color: "#525252", cursor: "pointer", fontSize: 22 }}>×</button>
          </div>
        </div>

        {/* SCROLLABLE Content */}
        <div style={{
          overflowY: "auto",
          flex: 1,
          padding: "1.25rem 2rem",
          scrollbarWidth: "thin" as const,
        }}>
          {error && (
            <div style={{ marginBottom: "1rem", padding: "10px 14px", borderRadius: 8, background: "#2a0a0a", border: "1px solid #7f1d1d", color: "#fca5a5", fontSize: 13 }}>
              {error}
            </div>
          )}

          {/* AI Import Banner */}
          <div style={{
            background: "linear-gradient(135deg, #0f0a1f, #0a1520)",
            border: "1px solid rgba(139,92,246,0.3)",
            borderRadius: 12, padding: "0.875rem 1rem",
            marginBottom: "1.25rem",
            position: "relative", overflow: "hidden",
          }}>
            <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 1, background: "linear-gradient(90deg, transparent, rgba(139,92,246,0.6), transparent)" }} />
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
              <div>
                <div style={{ fontSize: 13, fontWeight: 600, color: "#a78bfa", marginBottom: 2 }}>
                  📸 AI import ze screenshotu
                </div>
                <div style={{ fontSize: 12, color: "#525252" }}>
                  Nahrajte potvrzení z Viagogo, StubHub nebo Ticketmaster
                </div>
              </div>
              <label style={{
                padding: "7px 14px", fontSize: 12, fontWeight: 700,
                background: aiLoading ? "#2a2a2a" : "linear-gradient(135deg, #7c3aed, #5b21b6)",
                border: "none", borderRadius: 8, color: "#fff",
                cursor: aiLoading ? "default" : "pointer",
                whiteSpace: "nowrap" as const,
                opacity: aiLoading ? 0.7 : 1,
              }}>
                {aiLoading ? "⏳ Analyzuji..." : "📤 Nahrát"}
                <input type="file" accept="image/*" onChange={handleAiImport} style={{ display: "none" }} disabled={aiLoading} />
              </label>
            </div>
            {aiError && <div style={{ marginTop: 8, fontSize: 12, color: "#f87171" }}>{aiError}</div>}
            {aiLoading && (
              <div style={{ marginTop: 8, fontSize: 12, color: "#a78bfa" }}>
                🤖 AI analyzuje screenshot...
              </div>
            )}
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
            <div>
              <label style={labelStyle}>NÁZEV AKCE *</label>
              <input type="text" placeholder="např. Coldplay Prague 2025" value={eventName} onChange={e => setEventName(e.target.value)} style={inputStyle} />
            </div>

            <div>
              <label style={labelStyle}>MĚSTO / ZEMĚ</label>
              <input type="text" placeholder="např. Praha, Česká republika" value={city} onChange={e => setCity(e.target.value)} style={inputStyle} />
            </div>

            <div>
              <label style={labelStyle}>DATUM NÁKUPU</label>
              <input
                type="date"
                value={eventDate}
                onChange={e => setEventDate(e.target.value)}
                style={{
                  ...inputStyle,
                  colorScheme: "dark",
                }}
              />
            </div>

            <div>
              <label style={labelStyle}>DATUM AKCE</label>
              <input type="date" value={eventActualDate} onChange={e => setEventActualDate(e.target.value)}
                style={{ ...inputStyle, colorScheme: "dark" }} />
            </div>

            <div>
              <label style={labelStyle}>SEKTOR / SEDADLO</label>
              <input type="text" placeholder="např. Sekce A, Řada 5, Místo 12" value={sector} onChange={e => setSector(e.target.value)} style={inputStyle} />
            </div>

            <div>
              <label style={labelStyle}>INZEROVÁNO NA BURZE</label>
              <select value={exchange} onChange={e => setExchange(e.target.value)} style={{ ...inputStyle, cursor: "pointer" }}>
                <option value="">— Vyberte burzu —</option>
                {EXCHANGES.map(e => <option key={e} value={e}>{e}</option>)}
              </select>
              {exchange === "Jiné" && (
                <input
                  type="text"
                  placeholder="Zadejte název burzy..."
                  value={customExchange}
                  onChange={e => setCustomExchange(e.target.value)}
                  style={{ ...inputStyle, marginTop: "0.5rem" }}
                />
              )}
            </div>

            <div>
              <label style={labelStyle}>TYP LÍSTKU</label>
              <select value={ticketType} onChange={e => setTicketType(e.target.value)} style={{ ...inputStyle, cursor: "pointer" }}>
                <option value="">— Vyberte typ —</option>
                <option value="Mobile Transfer">Mobile Transfer</option>
                <option value="E-Ticket">E-Ticket</option>
                <option value="Jiné">Jiné</option>
              </select>
              {ticketType === "Jiné" && (
                <input
                  type="text"
                  placeholder="Zadejte typ lístku..."
                  value={customTicketType}
                  onChange={e => setCustomTicketType(e.target.value)}
                  style={{ ...inputStyle, marginTop: "0.5rem" }}
                />
              )}
            </div>

            <div>
              <label style={labelStyle}>NÁKUPNÍ ÚČET</label>
              {accounts.length === 0 ? (
                <div style={{ padding: "0.75rem 1rem", background: "#0a0a0a", border: "1px solid #2a2a2a", borderRadius: 10, fontSize: 13, color: "#525252", fontStyle: "italic" }}>
                  Nejprve přidejte účet v záložce "Nákupní účty"
                </div>
              ) : (
                <select value={accountRef} onChange={e => setAccountRef(e.target.value)} style={{ ...inputStyle, cursor: "pointer" }}>
                  <option value="">— Vyberte účet —</option>
                  {accounts.map(a => <option key={a.id} value={a.name}>{a.name}</option>)}
                </select>
              )}
            </div>

            {/* Price mode toggle */}
            <div style={{ display: "flex", gap: "0.5rem", marginBottom: "-0.25rem" }}>
              {[
                { id: "per_ticket", label: "Cena za lístek" },
                { id: "total", label: "Cena celkem" },
              ].map(mode => (
                <button
                  key={mode.id}
                  onClick={() => setPriceMode(mode.id as "per_ticket" | "total")}
                  style={{
                    padding: "5px 14px", fontSize: 12, fontWeight: 600,
                    background: priceMode === mode.id ? "linear-gradient(135deg, #ffffff, #a0a0a0)" : "transparent",
                    border: priceMode === mode.id ? "none" : "1px solid #2a2a2a",
                    borderRadius: 8,
                    color: priceMode === mode.id ? "#000" : "#525252",
                    cursor: "pointer", transition: "all 0.15s",
                  }}
                >
                  {mode.label}
                </button>
              ))}
            </div>

            {/* Price inputs */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem" }}>
              {priceMode === "per_ticket" ? (
                <div>
                  <label style={labelStyle}>CENA ZA LÍSTEK *</label>
                  <div style={{ position: "relative" }}>
                    <input
                      type="text"
                      placeholder="0"
                      value={buyPrice}
                      onChange={e => setBuyPrice(e.target.value)}
                      style={{ ...inputStyle, paddingRight: "3rem" }}
                    />
                    <span style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", fontSize: 12, color: "#525252", fontWeight: 600 }}>
                      {currency}
                    </span>
                  </div>
                </div>
              ) : (
                <div>
                  <label style={labelStyle}>CENA CELKEM *</label>
                  <div style={{ position: "relative" }}>
                    <input
                      type="text"
                      placeholder="0"
                      value={totalPrice}
                      onChange={e => setTotalPrice(e.target.value)}
                      style={{ ...inputStyle, paddingRight: "3rem" }}
                    />
                    <span style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", fontSize: 12, color: "#525252", fontWeight: 600 }}>
                      {currency}
                    </span>
                  </div>
                </div>
              )}
              <div>
                <label style={labelStyle}>POČET LÍSTKŮ *</label>
                <input
                  type="number"
                  min="1"
                  max="100"
                  value={quantity}
                  onChange={e => setQuantity(e.target.value)}
                  style={inputStyle}
                />
              </div>
            </div>

            {/* Total cost preview */}
            {totalCost > 0 ? (
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "0.875rem 1rem", borderRadius: 10, background: "#0a0a0a", border: "1px solid #2a2a2a" }}>
                <span style={{ fontSize: 13, color: "#525252" }}>
                  {priceMode === "per_ticket" ? `${priceNum.toLocaleString("cs-CZ")} ${currency} × ${qtyNum}` : `Cena za lístek: ${priceNum.toLocaleString("cs-CZ")} ${currency}`}
                </span>
                <span style={{ fontSize: "1.1rem", fontWeight: 700, color: "#fff" }}>
                  {totalCost.toLocaleString("cs-CZ")} {currency}
                </span>
              </div>
            ) : null}

            <div>
              <label style={labelStyle}>POZNÁMKY</label>
              <textarea placeholder="Volitelná poznámka..." value={notes} onChange={e => setNotes(e.target.value)} rows={2}
                style={{ ...inputStyle, resize: "vertical" as const }} />
            </div>

            {/* STATUSY */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem" }}>
              <div style={{ background: "#0a0a0a", border: "1px solid #2a2a2a", borderRadius: 10, padding: "0.75rem 1rem", display: "flex", alignItems: "center", justifyContent: "space-between", cursor: "pointer" }}
                onClick={() => setDelivered(!delivered)}>
                <div>
                  <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: "0.08em", color: "#525252", marginBottom: 2 }}>DORUČENÉ</div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: delivered ? "#34d399" : "#f87171" }}>{delivered ? "ANO" : "NIE"}</div>
                </div>
                <div style={{ width: 36, height: 20, borderRadius: 10, background: delivered ? "#34d399" : "#2a2a2a", position: "relative", transition: "background 0.2s" }}>
                  <div style={{ position: "absolute", top: 2, left: delivered ? 18 : 2, width: 16, height: 16, borderRadius: "50%", background: "#fff", transition: "left 0.2s" }} />
                </div>
              </div>
              <div style={{ background: "#0a0a0a", border: "1px solid #2a2a2a", borderRadius: 10, padding: "0.75rem 1rem", display: "flex", alignItems: "center", justifyContent: "space-between", cursor: "pointer" }}
                onClick={() => setPaid(!paid)}>
                <div>
                  <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: "0.08em", color: "#525252", marginBottom: 2 }}>VYPLACENÉ</div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: paid ? "#34d399" : "#f87171" }}>{paid ? "ANO" : "NIE"}</div>
                </div>
                <div style={{ width: 36, height: 20, borderRadius: 10, background: paid ? "#34d399" : "#2a2a2a", position: "relative", transition: "background 0.2s" }}>
                  <div style={{ position: "absolute", top: 2, left: paid ? 18 : 2, width: 16, height: 16, borderRadius: "50%", background: "#fff", transition: "left 0.2s" }} />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* FIXED Footer — buttons */}
        <div style={{
          padding: "1rem 2rem",
          borderTop: "1px solid #1a1a1a",
          flexShrink: 0,
          background: "#111111",
          display: "flex", gap: "0.75rem",
        }}>
          <button onClick={onClose} style={{ flex: 1, padding: "0.8rem", background: "transparent", border: "1px solid #2a2a2a", borderRadius: 10, color: "#525252", cursor: "pointer", fontSize: 14 }}>
            Zrušit
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            style={{
              flex: 2, padding: "0.8rem",
              background: saving ? "#2a2a2a" : "linear-gradient(135deg, #ffffff, #a0a0a0)",
              border: "none", borderRadius: 10,
              color: "#000", fontWeight: 700, fontSize: 14,
              letterSpacing: "0.05em", cursor: saving ? "default" : "pointer",
            }}
          >
            {saving ? "UKLÁDÁM..." : "PŘIDAT NÁKUP"}
          </button>
        </div>
      </div>
    </>
  );
}

function EditPurchaseModal({ purchase, accounts, onClose, onSave }: { 
  purchase: Purchase; 
  accounts: Account[]; 
  onClose: () => void; 
  onSave: () => void; 
}) { 
  const [eventName, setEventName] = useState(purchase.event_name); 
  const [city, setCity] = useState(purchase.city ?? ""); 
  const [eventDate, setEventDate] = useState(purchase.event_date ?? ""); 
  const [eventActualDate, setEventActualDate] = useState(purchase.event_actual_date ?? ""); 
  const [sector, setSector] = useState(purchase.sector ?? ""); 
  const [exchange, setExchange] = useState(
    purchase.exchange && ["Viagogo", "StubHub", "Ticketmaster", "SeatGeek", "Facebook", "Priamy predaj", "Jiné"].includes(purchase.exchange)
      ? purchase.exchange
      : purchase.exchange
        ? "Jiné"
        : ""
  ); 
  const [customExchange, setCustomExchange] = useState(
    purchase.exchange && !["Viagogo", "StubHub", "Ticketmaster", "SeatGeek", "Facebook", "Priamy predaj", "Jiné"].includes(purchase.exchange)
      ? purchase.exchange
      : ""
  );
  const [accountRef, setAccountRef] = useState(purchase.account_ref ?? ""); 
  const [buyPrice, setBuyPrice] = useState(String(purchase.buy_price)); 
  const [totalPrice, setTotalPrice] = useState(String(purchase.buy_price * purchase.quantity)); 
  const [quantity, setQuantity] = useState(String(purchase.quantity)); 
  const [ticketType, setTicketType] = useState(
    purchase.ticket_type_custom && ["Mobile Transfer", "E-Ticket", "Jiné"].includes(purchase.ticket_type_custom)
      ? purchase.ticket_type_custom
      : purchase.ticket_type_custom
        ? "Jiné"
        : ""
  );
  const [customTicketType, setCustomTicketType] = useState(
    purchase.ticket_type_custom && !["Mobile Transfer", "E-Ticket", "Jiné"].includes(purchase.ticket_type_custom)
      ? purchase.ticket_type_custom
      : ""
  );
  const [priceMode, setPriceMode] = useState<"per_ticket" | "total">("per_ticket"); 
  const { currency } = useCurrency(); 
  const [notes, setNotes] = useState(purchase.notes ?? ""); 
  const [delivered, setDelivered] = useState(purchase.delivered ?? false); 
  const [paid, setPaid] = useState(purchase.paid_out ?? false); 
  const [saving, setSaving] = useState(false); 
  const [error, setError] = useState(""); 

  const priceNum = priceMode === "per_ticket"
    ? parseFloat(buyPrice.replace(",", ".")) || 0
    : (parseFloat(totalPrice.replace(",", ".")) || 0) / (parseInt(quantity) || 1);
  const qtyNum = parseInt(quantity) || 1;
  const totalCost = priceNum * qtyNum;

  async function handleSave() { 
    if (!eventName.trim()) return setError("Název akce je povinný."); 
    if (priceNum <= 0) return setError("Zadejte platnou cenu."); 
    setSaving(true); 
    setError(""); 
    const resolvedExchange = exchange === "Jiné" ? (customExchange.trim() || "Jiné") : exchange;
    const resolvedTicketType = ticketType === "Jiné" ? (customTicketType || "Jiné") : ticketType;
    const supabase = createClient(); 
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { error: err } = await supabase.from("purchases").update({ 
      event_name: eventName.trim(), 
      city: city.trim() || null, 
      event_date: eventDate || null, 
      event_actual_date: eventActualDate || null, 
      venue: sector.trim() || null, 
      exchange: resolvedExchange || null, 
      tags: resolvedExchange ? [resolvedExchange] : [],
      account_ref: accountRef || null, 
      buy_price: priceNum, 
      quantity: qtyNum, 
      currency: currency, 
      notes: notes.trim() || null, 
      delivered, 
      paid_out: paid, 
      updated_at: new Date().toISOString(),
      ticket_type_custom: resolvedTicketType || null,
    }).eq("id", purchase.id); 

    if (err) { setError(err.message); setSaving(false); return; } 

    // Clear cache
    clearCache(`nakupy_${user.id}`);
    clearCache(`uvod_${user.id}`);
    clearCache(`kalendar_${user.id}`);

    onSave(); 
    onClose(); 
    setSaving(false); 
  } 

  const inputStyle = { 
    width: "100%", padding: "0.75rem 1rem", 
    background: "#0a0a0a", border: "1px solid #2a2a2a", 
    borderRadius: 10, color: "#fff", fontSize: 14, 
    outline: "none", boxSizing: "border-box" as const, 
  }; 
  const labelStyle = { 
    fontSize: 11, fontWeight: 600 as const, 
    letterSpacing: "0.08em", color: "#525252", 
    display: "block" as const, marginBottom: "0.4rem", 
  }; 

  return ( 
    <> 
      <div onClick={onClose} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.75)", zIndex: 100, backdropFilter: "blur(4px)" }} /> 
      <div style={{ 
        position: "fixed", top: "50%", left: "50%", 
        transform: "translate(-50%, -50%)", 
        width: "100%", maxWidth: 520, 
        maxHeight: "90vh", 
        background: "#111111", border: "1px solid #2a2a2a", 
        borderRadius: 20, zIndex: 101, 
        overflow: "hidden", display: "flex", flexDirection: "column", 
      }}> 
        <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 1, background: "linear-gradient(90deg, transparent, #c0c0c0, transparent)", zIndex: 1 }} /> 

        {/* Fixed header */} 
        <div style={{ padding: "1.5rem 2rem 1rem", borderBottom: "1px solid #1a1a1a", flexShrink: 0, background: "#111111" }}> 
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}> 
            <div> 
              <h2 style={{ fontSize: "1.1rem", fontWeight: 700, color: "#fff", margin: 0 }}>Upravit nákup</h2> 
              <p style={{ fontSize: 12, color: "#525252", marginTop: 4 }}>{purchase.event_name}</p> 
            </div> 
            <button onClick={onClose} style={{ background: "none", border: "none", color: "#525252", cursor: "pointer", fontSize: 22 }}>×</button> 
          </div> 
        </div> 

        {/* Scrollable content */} 
        <div style={{ overflowY: "auto", flex: 1, padding: "1.25rem 2rem", scrollbarWidth: "thin" as const }}> 
          {error && ( 
            <div style={{ marginBottom: "1rem", padding: "10px 14px", borderRadius: 8, background: "#2a0a0a", border: "1px solid #7f1d1d", color: "#fca5a5", fontSize: 13 }}> 
              {error} 
            </div> 
          )} 

          <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}> 
            <div> 
              <label style={labelStyle}>NÁZEV AKCE *</label> 
              <input type="text" value={eventName} onChange={e => setEventName(e.target.value)} style={inputStyle} /> 
            </div> 
            <div> 
              <label style={labelStyle}>MĚSTO / ZEMĚ</label> 
              <input type="text" placeholder="např. Praha, Česká republika" value={city} onChange={e => setCity(e.target.value)} style={inputStyle} /> 
            </div> 
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem" }}> 
              <div> 
                <label style={labelStyle}>DATUM NÁKUPU</label> 
                <input type="date" value={eventDate} onChange={e => setEventDate(e.target.value)} style={{ ...inputStyle, colorScheme: "dark" }} /> 
              </div> 
              <div> 
                <label style={labelStyle}>DATUM AKCE</label> 
                <input type="date" value={eventActualDate} onChange={e => setEventActualDate(e.target.value)} style={{ ...inputStyle, colorScheme: "dark" }} /> 
              </div> 
            </div> 
            <div> 
              <label style={labelStyle}>SEKTOR / SEDADLO</label> 
              <input type="text" placeholder="např. Sekce A, Řada 5" value={sector} onChange={e => setSector(e.target.value)} style={inputStyle} /> 
            </div> 
            <div>
              <label style={labelStyle}>INZEROVÁNO NA BURZE</label>
              <select value={exchange} onChange={e => setExchange(e.target.value)} style={{ ...inputStyle, cursor: "pointer" }}>
                <option value="">— Vyberte burzu —</option>
                {EXCHANGES.map(e => <option key={e} value={e}>{e}</option>)}
              </select> 
              {exchange === "Jiné" && (
                <input
                  type="text"
                  placeholder="Zadejte název burzy..."
                  value={customExchange}
                  onChange={e => setCustomExchange(e.target.value)}
                  style={{ ...inputStyle, marginTop: "0.5rem" }}
                />
              )}
            </div> 
            <div>
              <label style={labelStyle}>TYP LÍSTKU</label>
              <select value={ticketType} onChange={e => setTicketType(e.target.value)} style={{ ...inputStyle, cursor: "pointer" }}>
                <option value="">— Vyberte typ —</option>
                <option value="Mobile Transfer">Mobile Transfer</option>
                <option value="E-Ticket">E-Ticket</option>
                <option value="Jiné">Jiné</option>
              </select>
              {ticketType === "Jiné" && (
                <input
                  type="text"
                  placeholder="Zadejte typ lístku..."
                  value={customTicketType}
                  onChange={e => setCustomTicketType(e.target.value)}
                  style={{ ...inputStyle, marginTop: "0.5rem" }}
                />
              )}
            </div>
            <div> 
              <label style={labelStyle}>NÁKUPNÍ ÚČET</label> 
              {accounts.length === 0 ? ( 
                <div style={{ padding: "0.75rem 1rem", background: "#0a0a0a", border: "1px solid #2a2a2a", borderRadius: 10, fontSize: 13, color: "#525252", fontStyle: "italic" }}> 
                  Nejprve přidejte účet 
                </div> 
              ) : ( 
                <select value={accountRef} onChange={e => setAccountRef(e.target.value)} style={{ ...inputStyle, cursor: "pointer" }}> 
                  <option value="">— Vyberte účet —</option> 
                  {accounts.map(a => <option key={a.id} value={a.name}>{a.name}</option>)} 
                </select> 
              )} 
            </div>

            {/* Price mode toggle */}
            <div style={{ display: "flex", gap: "0.5rem", marginBottom: "-0.25rem" }}>
              {[
                { id: "per_ticket", label: "Cena za lístek" },
                { id: "total", label: "Cena celkem" },
              ].map(mode => (
                <button
                  key={mode.id}
                  onClick={() => setPriceMode(mode.id as "per_ticket" | "total")}
                  style={{
                    padding: "5px 14px", fontSize: 12, fontWeight: 600,
                    background: priceMode === mode.id ? "linear-gradient(135deg, #ffffff, #a0a0a0)" : "transparent",
                    border: priceMode === mode.id ? "none" : "1px solid #2a2a2a",
                    borderRadius: 8,
                    color: priceMode === mode.id ? "#000" : "#525252",
                    cursor: "pointer", transition: "all 0.15s",
                  }}
                >
                  {mode.label}
                </button>
              ))}
            </div>

            {/* Price inputs */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem" }}>
              {priceMode === "per_ticket" ? (
                <div>
                  <label style={labelStyle}>CENA ZA LÍSTEK *</label>
                  <div style={{ position: "relative" }}>
                    <input
                      type="text"
                      placeholder="0"
                      value={buyPrice}
                      onChange={e => setBuyPrice(e.target.value)}
                      style={{ ...inputStyle, paddingRight: "3rem" }}
                    />
                    <span style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", fontSize: 12, color: "#525252", fontWeight: 600 }}>
                      {currency}
                    </span>
                  </div>
                </div>
              ) : (
                <div>
                  <label style={labelStyle}>CENA CELKEM *</label>
                  <div style={{ position: "relative" }}>
                    <input
                      type="text"
                      placeholder="0"
                      value={totalPrice}
                      onChange={e => setTotalPrice(e.target.value)}
                      style={{ ...inputStyle, paddingRight: "3rem" }}
                    />
                    <span style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", fontSize: 12, color: "#525252", fontWeight: 600 }}>
                      {currency}
                    </span>
                  </div>
                </div>
              )}
              <div>
                <label style={labelStyle}>POČET LÍSTKŮ *</label>
                <input
                  type="number"
                  min="1"
                  max="100"
                  value={quantity}
                  onChange={e => setQuantity(e.target.value)}
                  style={inputStyle}
                />
              </div>
            </div>

            {/* Total cost preview */}
            {totalCost > 0 ? (
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "0.875rem 1rem", borderRadius: 10, background: "#0a0a0a", border: "1px solid #2a2a2a" }}>
                <span style={{ fontSize: 13, color: "#525252" }}>
                  {priceMode === "per_ticket" ? `${priceNum.toLocaleString("cs-CZ")} ${currency} × ${qtyNum}` : `Cena za lístek: ${priceNum.toLocaleString("cs-CZ")} ${currency}`}
                </span>
                <span style={{ fontSize: "1.1rem", fontWeight: 700, color: "#fff" }}>
                  {totalCost.toLocaleString("cs-CZ")} {currency}
                </span>
              </div>
            ) : null}

            <div> 
              <label style={labelStyle}>POZNÁMKY</label> 
              <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={2} style={{ ...inputStyle, resize: "vertical" as const }} /> 
            </div> 
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem" }}> 
              <div style={{ background: "#0a0a0a", border: "1px solid #2a2a2a", borderRadius: 10, padding: "0.75rem 1rem", display: "flex", alignItems: "center", justifyContent: "space-between", cursor: "pointer" }} 
                onClick={() => setDelivered(!delivered)}> 
                <div> 
                  <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: "0.08em", color: "#525252", marginBottom: 2 }}>DORUČENÉ</div> 
                  <div style={{ fontSize: 13, fontWeight: 600, color: delivered ? "#34d399" : "#f87171" }}>{delivered ? "ANO" : "NIE"}</div> 
                </div> 
                <div style={{ width: 36, height: 20, borderRadius: 10, background: delivered ? "#34d399" : "#2a2a2a", position: "relative", transition: "background 0.2s" }}> 
                  <div style={{ position: "absolute", top: 2, left: delivered ? 18 : 2, width: 16, height: 16, borderRadius: "50%", background: "#fff", transition: "left 0.2s" }} /> 
                </div> 
              </div> 
              <div style={{ background: "#0a0a0a", border: "1px solid #2a2a2a", borderRadius: 10, padding: "0.75rem 1rem", display: "flex", alignItems: "center", justifyContent: "space-between", cursor: "pointer" }} 
                onClick={() => setPaid(!paid)}> 
                <div> 
                  <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: "0.08em", color: "#525252", marginBottom: 2 }}>VYPLACENÉ</div> 
                  <div style={{ fontSize: 13, fontWeight: 600, color: paid ? "#34d399" : "#f87171" }}>{paid ? "ANO" : "NIE"}</div> 
                </div> 
                <div style={{ width: 36, height: 20, borderRadius: 10, background: paid ? "#34d399" : "#2a2a2a", position: "relative", transition: "background 0.2s" }}> 
                  <div style={{ position: "absolute", top: 2, left: paid ? 18 : 2, width: 16, height: 16, borderRadius: "50%", background: "#fff", transition: "left 0.2s" }} /> 
                </div> 
              </div> 
            </div> 
          </div> 
        </div> 

        {/* Fixed footer */} 
        <div style={{ padding: "1rem 2rem", borderTop: "1px solid #1a1a1a", flexShrink: 0, background: "#111111", display: "flex", gap: "0.75rem" }}> 
          <button onClick={onClose} style={{ flex: 1, padding: "0.8rem", background: "transparent", border: "1px solid #2a2a2a", borderRadius: 10, color: "#525252", cursor: "pointer", fontSize: 14 }}> 
            Zrušit 
          </button> 
          <button 
            onClick={handleSave} 
            disabled={saving} 
            style={{ 
              flex: 2, padding: "0.8rem", 
              background: saving ? "#2a2a2a" : "linear-gradient(135deg, #ffffff, #a0a0a0)", 
              border: "none", borderRadius: 10, 
              color: "#000", fontWeight: 700, fontSize: 14, 
              letterSpacing: "0.05em", cursor: saving ? "default" : "pointer", 
            }} 
          > 
            {saving ? "UKLÁDÁM..." : "ULOŽIT ZMĚNY"} 
          </button> 
        </div> 
      </div> 
    </> 
  ); 
} 

function PurchaseDetailModal({ purchase, onClose, onEdit, onDelete }: { 
  purchase: Purchase; 
  onClose: () => void; 
  onEdit: () => void; 
  onDelete: () => void; 
}) { 
  const statusColors: Record<string, { bg: string; color: string; label: string }> = { 
    active: { bg: "#0a2a1a", color: "#34d399", label: "Aktivní" }, 
    partial: { bg: "#2a1a0a", color: "#fbbf24", label: "Částečně prodáno" }, 
    sold: { bg: "#0a0a2a", color: "#818cf8", label: "Prodáno" }, 
    cancelled: { bg: "#2a0a0a", color: "#f87171", label: "Zrušeno" }, 
  }; 
  const status = statusColors[purchase.status] ?? statusColors.active; 

  const Row = ({ label, value }: { label: string; value: string | null | undefined }) => { 
    if (!value) return null; 
    return ( 
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", padding: "0.6rem 0", borderBottom: "1px solid #141414" }}> 
        <span style={{ fontSize: 12, color: "#525252", flexShrink: 0, marginRight: 16 }}>{label}</span> 
        <span style={{ fontSize: 13, color: "#c0c0c0", textAlign: "right" as const, fontWeight: 500 }}>{value}</span> 
      </div> 
    ); 
  }; 

  return ( 
    <> 
      <div onClick={onClose} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.75)", zIndex: 100, backdropFilter: "blur(4px)" }} /> 
      <div style={{ 
        position: "fixed", top: "50%", left: "50%", 
        transform: "translate(-50%, -50%)", 
        width: "100%", maxWidth: 520, 
        maxHeight: "90vh", 
        background: "#111111", border: "1px solid #2a2a2a", 
        borderRadius: 20, zIndex: 101, 
        overflow: "hidden", display: "flex", flexDirection: "column", 
      }}> 
        <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 1, background: "linear-gradient(90deg, transparent, #c0c0c0, transparent)", zIndex: 1 }} /> 

        {/* Header */} 
        <div style={{ padding: "1.5rem 2rem 1rem", borderBottom: "1px solid #1a1a1a", flexShrink: 0 }}> 
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}> 
            <div style={{ flex: 1, marginRight: 16 }}> 
              <h2 style={{ fontSize: "1.15rem", fontWeight: 700, color: "#fff", margin: 0, marginBottom: 8 }}> 
                {purchase.event_name} 
              </h2> 
              <div style={{ display: "flex", gap: 6, flexWrap: "wrap" as const }}> 
                <span style={{ fontSize: 11, fontWeight: 600, padding: "2px 8px", borderRadius: 5, background: status.bg, color: status.color }}> 
                  {status.label} 
                </span> 
                {purchase.delivered && ( 
                  <span style={{ fontSize: 11, padding: "2px 8px", borderRadius: 5, background: "#0a2a1a", color: "#34d399", border: "1px solid rgba(52,211,153,0.2)" }}> 
                    ✓ Doručeno 
                  </span> 
                )} 
                {purchase.paid_out && ( 
                  <span style={{ fontSize: 11, padding: "2px 8px", borderRadius: 5, background: "#0a2a1a", color: "#34d399", border: "1px solid rgba(52,211,153,0.2)" }}> 
                    ✓ Vyplaceno 
                  </span> 
                )} 
              </div> 
            </div> 
            <button onClick={onClose} style={{ background: "none", border: "none", color: "#525252", cursor: "pointer", fontSize: 22, flexShrink: 0 }}>×</button> 
          </div> 
        </div> 

        {/* Content */} 
        <div style={{ overflowY: "auto", flex: 1, padding: "1.25rem 2rem" }}> 

          {/* Price highlight */} 
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "0.75rem", marginBottom: "1.25rem" }}> 
            {[ 
              { label: "Cena / ks", value: `${purchase.buy_price} ${purchase.currency}` }, 
              { label: "Počet", value: `${purchase.quantity}×` }, 
              { label: "Celkem", value: `${purchase.buy_price * purchase.quantity} ${purchase.currency}` }, 
            ].map(card => ( 
              <div key={card.label} style={{ background: "#0a0a0a", border: "1px solid #1f1f1f", borderRadius: 10, padding: "0.875rem", textAlign: "center" as const }}> 
                <div style={{ fontSize: 11, color: "#525252", marginBottom: 4 }}>{card.label}</div> 
                <div style={{ fontSize: 15, fontWeight: 700, color: "#fff" }}>{card.value}</div> 
              </div> 
            ))} 
          </div> 

          {/* Details */} 
          <div> 
            <Row label="Město / Země" value={purchase.city} /> 
            <Row label="Datum nákupu" value={purchase.event_date ? new Date(purchase.event_date).toLocaleDateString("cs-CZ") : null} /> 
            <Row label="Datum akce" value={purchase.event_actual_date ? new Date(purchase.event_actual_date).toLocaleDateString("cs-CZ") : null} /> 
            <Row label="Sektor / Sedadlo" value={purchase.venue} /> 
            <Row label="Burza nákupu" value={purchase.exchange} /> 
            <Row label="Nákupní účet" value={purchase.account_ref} /> 
            <Row label="Platforma prodeje" value={(purchase as any).platform} /> 
            <Row label="Zbývá lístků" value={purchase.quantity_remaining !== undefined ? `${purchase.quantity_remaining} z ${purchase.quantity}` : null} /> 
          </div> 

          {/* Notes */} 
          {purchase.notes && ( 
            <div style={{ marginTop: "1rem", background: "#0a0a0a", border: "1px solid #1f1f1f", borderRadius: 10, padding: "0.875rem" }}> 
              <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: "0.08em", color: "#525252", marginBottom: 6 }}>POZNÁMKY</div> 
              <p style={{ fontSize: 13, color: "#c0c0c0", lineHeight: 1.6, margin: 0 }}>{purchase.notes}</p> 
            </div> 
          )} 
        </div> 

        {/* Footer */} 
        <div style={{ padding: "1rem 2rem", borderTop: "1px solid #1a1a1a", flexShrink: 0, display: "flex", gap: "0.75rem" }}> 
          <button 
            onClick={onDelete} 
            style={{ padding: "0.7rem 1rem", background: "transparent", border: "1px solid rgba(248,113,113,0.3)", borderRadius: 10, color: "#f87171", cursor: "pointer", fontSize: 13 }} 
          > 
            Smazat 
          </button> 
          <button 
            onClick={onEdit} 
            style={{ flex: 1, padding: "0.7rem", background: "transparent", border: "1px solid #2a2a2a", borderRadius: 10, color: "#c0c0c0", cursor: "pointer", fontSize: 13, fontWeight: 600 }} 
          > 
            ✎ Upravit 
          </button> 
          <button 
            onClick={onClose} 
            style={{ flex: 1, padding: "0.7rem", background: "linear-gradient(135deg, #ffffff, #a0a0a0)", border: "none", borderRadius: 10, color: "#000", cursor: "pointer", fontSize: 13, fontWeight: 700 }} 
          > 
            Zavřít 
          </button> 
        </div> 
      </div> 
    </> 
  ); 
} 

export default function NakupyTab() {
  const { format, convert } = useCurrency();
  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [sales, setSales] = useState<{ purchase_id: string; sold_at: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [sellPurchase, setSellPurchase] = useState<Purchase | null>(null);
  const [editPurchase, setEditPurchase] = useState<Purchase | null>(null);
  const [detailPurchase, setDetailPurchase] = useState<Purchase | null>(null);
  const [showImport, setShowImport] = useState(false);
  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] = useState<{ success?: number; error?: string } | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<Purchase | null>(null);
  
  // Filter states
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [deliveredFilter, setDeliveredFilter] = useState("all"); 
  const [exchangeFilter, setExchangeFilter] = useState(""); 
  const [cityFilter, setCityFilter] = useState(""); 
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [sortBy, setSortBy] = useState<"event_date" | "created_at" | "sold_at">("created_at");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");
  
  // Filtered purchases
  const filtered = purchases 
    .filter(p => { 
      if (search && !p.event_name.toLowerCase().includes(search.toLowerCase())) return false; 
      if (statusFilter !== "all" && p.status !== statusFilter) return false; 
      if (deliveredFilter === "yes" && !p.delivered) return false; 
      if (deliveredFilter === "no" && p.delivered) return false; 
      if (exchangeFilter && p.exchange !== exchangeFilter) return false; 
      if (cityFilter && !p.city?.toLowerCase().includes(cityFilter.toLowerCase())) return false; 
      if (dateFrom && p.event_date && p.event_date < dateFrom) return false; 
      if (dateTo && p.event_date && p.event_date > dateTo) return false; 
      return true; 
    }) 
    .sort((a, b) => { 
      let aVal = ""; 
      let bVal = ""; 
      if (sortBy === "event_date") { aVal = a.event_date ?? ""; bVal = b.event_date ?? ""; } 
      else if (sortBy === "created_at") { aVal = a.created_at ?? ""; bVal = b.created_at ?? ""; } 
      else if (sortBy === "sold_at") { 
        aVal = getSaleDate(a.id) ?? ""; 
        bVal = getSaleDate(b.id) ?? ""; 
      } 
      if (sortDir === "asc") return aVal.localeCompare(bVal); 
      return bVal.localeCompare(aVal); 
    });

  const lastLoadRef = useRef<number>(0);

  async function loadData(force = false) {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const cacheKey = `nakupy_${user.id}`;
    if (!force) {
      const cached = getCached(cacheKey, 30000);
      if (cached) {
        setPurchases(cached);
        // Load accounts and sales separately if needed, or cache them too
        const [{ data: a }, { data: s }] = await Promise.all([
          supabase.from("accounts").select("id, name").eq("type", "purchase").order("name"),
          supabase.from("sales").select("purchase_id, sold_at").order("sold_at", { ascending: false }),
        ]);
        setAccounts(a ?? []);
        setSales(s ?? []);
        setLoading(false);
        return;
      }
    }

    const [{ data: p }, { data: a }, { data: s }] = await Promise.all([
      supabase.from("purchases").select("id, event_name, city, event_date, event_actual_date, buy_price, quantity, quantity_remaining, currency, status, account_ref, venue, exchange, delivered, paid_out, notes, created_at, sector, tags, total_cost").eq("user_id", user.id).order("created_at", { ascending: false }).limit(200),
      supabase.from("accounts").select("id, name").eq("type", "purchase").order("name"),
      supabase.from("sales").select("purchase_id, sold_at").order("sold_at", { ascending: false }),
    ]);
    setCached(cacheKey, p ?? []);
    setPurchases(p ?? []);
    setAccounts(a ?? []);
    setSales(s ?? []);
    setLoading(false);
  }

  useEffect(() => { loadData(); }, []);

  function getSaleDate(purchaseId: string): string | null {
    const sale = sales.find(s => s.purchase_id === purchaseId);
    return sale ? sale.sold_at.split("T")[0] : null;
  }

  async function confirmDeletePurchase(purchase: Purchase) {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    // Calculate amount to restore
    const restoreAmount = purchase.buy_price * (purchase.quantity_remaining ?? purchase.quantity);

    // Delete purchase
    await supabase.from("purchases").delete().eq("id", purchase.id);

    // Clear cache
    clearCache(`nakupy_${user.id}`);
    clearCache(`uvod_${user.id}`);
    clearCache(`kalendar_${user.id}`);

    // Restore capital
    const { data: profile } = await supabase
      .from("profiles")
      .select("capital")
      .eq("id", user.id)
      .single();

    if (profile) {
      const newCapital = (profile.capital ?? 0) + restoreAmount;
      await supabase.from("profiles").update({ capital: newCapital }).eq("id", user.id);

      // Add to capital history
      await supabase.from("capital_history").insert({
        user_id: user.id,
        amount: restoreAmount,
        type: "refund",
        description: `Smazán nákup: ${purchase.event_name}`,
        balance_after: newCapital,
      });
    }

    loadData();
  }

  function resetFilters() { 
    setSearch(""); 
    setStatusFilter("all"); 
    setDeliveredFilter("all"); 
    setExchangeFilter(""); 
    setCityFilter(""); 
    setDateFrom(""); 
    setDateTo(""); 
    setSortBy("created_at"); 
    setSortDir("desc"); 
  }

  return (
    <div>
      {showModal && <AddPurchaseModal accounts={accounts} onClose={() => setShowModal(false)} onSave={loadData} />}
      {sellPurchase && <SellModal purchase={sellPurchase as any} onClose={() => setSellPurchase(null)} onSave={loadData} />}
      {editPurchase && ( 
        <EditPurchaseModal 
          purchase={editPurchase} 
          accounts={accounts} 
          onClose={() => setEditPurchase(null)} 
          onSave={loadData} 
        /> 
      )}
      {detailPurchase && ( 
        <PurchaseDetailModal 
          purchase={detailPurchase} 
          onClose={() => setDetailPurchase(null)} 
          onEdit={() => { setEditPurchase(detailPurchase); setDetailPurchase(null); }} 
          onDelete={() => { setDetailPurchase(null); setDeleteConfirm(detailPurchase); }} 
        /> 
      )}
      {deleteConfirm && (
        <>
          <div onClick={() => setDeleteConfirm(null)} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.75)", zIndex: 200, backdropFilter: "blur(4px)" }} />
          <div style={{
            position: "fixed", top: "50%", left: "50%",
            transform: "translate(-50%, -50%)",
            width: "100%", maxWidth: 400,
            background: "#111111", border: "1px solid #2a2a2a",
            borderRadius: 20, padding: "2rem", zIndex: 201,
            overflow: "hidden",
          }}>
            <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 1, background: "linear-gradient(90deg, transparent, #f87171, transparent)" }} />
            <h2 style={{ fontSize: "1.1rem", fontWeight: 700, color: "#fff", marginBottom: "0.75rem" }}>Smazat nákup?</h2>
            <p style={{ fontSize: 13, color: "#525252", marginBottom: "0.5rem" }}>
              <strong style={{ color: "#c0c0c0" }}>{deleteConfirm.event_name}</strong>
            </p>
            <p style={{ fontSize: 13, color: "#525252", marginBottom: "1.5rem" }}>
              Kapitál bude navýšen o{" "}
              <strong style={{ color: "#34d399" }}>
                {(deleteConfirm.buy_price * (deleteConfirm.quantity_remaining ?? deleteConfirm.quantity)).toLocaleString("cs-CZ")} {deleteConfirm.currency}
              </strong>
            </p>
            <div style={{ display: "flex", gap: "0.75rem" }}>
              <button
                onClick={() => setDeleteConfirm(null)}
                style={{ flex: 1, padding: "0.75rem", background: "transparent", border: "1px solid #2a2a2a", borderRadius: 10, color: "#525252", cursor: "pointer", fontSize: 13 }}
              >
                Zrušit
              </button>
              <button
                onClick={async () => {
                  await confirmDeletePurchase(deleteConfirm);
                  setDeleteConfirm(null);
                }}
                style={{ flex: 1, padding: "0.75rem", background: "linear-gradient(135deg, #f87171, #dc2626)", border: "none", borderRadius: 10, color: "#fff", cursor: "pointer", fontSize: 13, fontWeight: 700 }}
              >
                Smazat
              </button>
            </div>
          </div>
        </>
      )}
      {showImport && (
        <>
          <div onClick={() => { setShowImport(false); setImportResult(null); }} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.75)", zIndex: 100, backdropFilter: "blur(4px)" }} />
          <div style={{
            position: "fixed", top: "50%", left: "50%",
            transform: "translate(-50%, -50%)",
            width: "100%", maxWidth: 480,
            background: "#111111", border: "1px solid #2a2a2a",
            borderRadius: 20, padding: "2rem", zIndex: 101, overflow: "hidden",
          }}>
            <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 1, background: "linear-gradient(90deg, transparent, #c0c0c0, transparent)" }} />

            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem" }}>
              <h2 style={{ fontSize: "1.1rem", fontWeight: 700, color: "#fff", margin: 0 }}>Import z Excelu</h2>
              <button onClick={() => { setShowImport(false); setImportResult(null); }} style={{ background: "none", border: "none", color: "#525252", cursor: "pointer", fontSize: 22 }}>×</button>
            </div>

            {/* Step 1 — Download template */}
            <div style={{ background: "#0a0a0a", border: "1px solid #1f1f1f", borderRadius: 12, padding: "1rem 1.25rem", marginBottom: "1rem" }}>
              <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: "0.08em", color: "#525252", marginBottom: 8 }}>KROK 1 — STÁHNĚTE ŠABLONU</div>
              <p style={{ fontSize: 13, color: "#525252", marginBottom: 12, lineHeight: 1.5 }}>
                Stáhněte Excel šablonu, vyplňte vaše nákupy a nahrajte zpět.
              </p>
              <a
                href="/api/purchases/template"
                download="ticketclub-sablona.xlsx"
                style={{
                  display: "inline-flex", alignItems: "center", gap: 8,
                  padding: "8px 16px", fontSize: 12, fontWeight: 700,
                  background: "transparent", border: "1px solid #2a2a2a",
                  borderRadius: 8, color: "#c0c0c0", textDecoration: "none",
                  letterSpacing: "0.05em",
                }}
              >
                ⬇ Stáhnout šablonu (.xlsx)
              </a>
            </div>

            {/* Step 2 — Upload */}
            <div style={{ background: "#0a0a0a", border: "1px solid #1f1f1f", borderRadius: 12, padding: "1rem 1.25rem", marginBottom: "1.5rem" }}>
              <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: "0.08em", color: "#525252", marginBottom: 8 }}>KROK 2 — NAHRAJTE VYPLNĚNOU ŠABLONU</div>

              {importResult?.success ? (
                <div style={{ padding: "12px", background: "#0a2a1a", border: "1px solid rgba(52,211,153,0.3)", borderRadius: 10, textAlign: "center" }}>
                  <div style={{ fontSize: "1.5rem", marginBottom: 6 }}>✅</div>
                  <p style={{ color: "#34d399", fontWeight: 600, fontSize: 14 }}>Importováno {importResult.success} nákupů!</p>
                </div>
              ) : importResult?.error ? (
                <div style={{ padding: "12px", background: "#2a0a0a", border: "1px solid #7f1d1d", borderRadius: 10, color: "#fca5a5", fontSize: 13, marginBottom: 12 }}>
                  Chyba: {importResult.error}
                </div>
              ) : null}

              {!importResult?.success && (
                <label style={{
                  display: "flex", flexDirection: "column" as const, alignItems: "center", justifyContent: "center",
                  padding: "2rem", border: "1px dashed #2a2a2a", borderRadius: 10,
                  cursor: importing ? "default" : "pointer", color: "#525252",
                  fontSize: 13, gap: 8,
                }}>
                  <span style={{ fontSize: "2rem" }}>📂</span>
                  <span>{importing ? "Importuji..." : "Klikněte nebo přetáhněte .xlsx soubor"}</span>
                  <input
                    type="file"
                    accept=".xlsx,.xls"
                    style={{ display: "none" }}
                    disabled={importing}
                    onChange={async (e) => {
                      const file = e.target.files?.[0];
                      if (!file) return;
                      setImporting(true);
                      setImportResult(null);
                      const formData = new FormData();
                      formData.append("file", file);
                      try {
                        const res = await fetch("/api/purchases/import", { method: "POST", body: formData });
                        const data = await res.json();
                        if (data.success) {
                          setImportResult({ success: data.imported });
                          loadData();
                        } else {
                          setImportResult({ error: data.error });
                        }
                      } catch (err: any) {
                        setImportResult({ error: err.message });
                      }
                      setImporting(false);
                      e.target.value = "";
                    }}
                  />
                </label>
              )}
            </div>

            {importResult?.success ? (
              <button onClick={() => { setShowImport(false); setImportResult(null); }} style={{
                width: "100%", padding: "0.8rem",
                background: "linear-gradient(135deg, #ffffff, #a0a0a0)",
                border: "none", borderRadius: 10, color: "#000",
                fontWeight: 700, fontSize: 14, cursor: "pointer",
              }}>
                Zavřít
              </button>
            ) : (
              <button onClick={() => { setShowImport(false); setImportResult(null); }} style={{
                width: "100%", padding: "0.8rem",
                background: "transparent", border: "1px solid #2a2a2a",
                borderRadius: 10, color: "#525252", cursor: "pointer", fontSize: 14,
              }}>
                Zrušit
              </button>
            )}
          </div>
        </>
      )}

      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1.75rem" }}>
        <div>
          <h1 style={{ fontSize: "1.5rem", fontWeight: 700, color: "#fff", marginBottom: "0.25rem" }}>Nákupy</h1>
          <p style={{ fontSize: 13, color: "#3a3a3a" }}>{filtered.length} z {purchases.length} nákupů</p>
        </div>
        <div style={{ display: "flex", gap: "0.75rem" }}>
          <button
            onClick={() => setShowImport(true)}
            style={{
              padding: "0.65rem 1.25rem", fontSize: 13, fontWeight: 600,
              background: "transparent", border: "1px solid #2a2a2a",
              borderRadius: 10, color: "#c0c0c0", cursor: "pointer",
              display: "flex", alignItems: "center", gap: 6,
            }}
          >
            ⬆ Import Excel
          </button>
          <button
            onClick={() => setShowModal(true)}
            style={{
              padding: "0.65rem 1.25rem",
              background: "linear-gradient(135deg, #ffffff, #a0a0a0)",
              border: "none", borderRadius: 10,
              color: "#000", fontWeight: 700, fontSize: 13,
              letterSpacing: "0.05em", cursor: "pointer",
              display: "flex", alignItems: "center", gap: 6,
            }}
          >
            + Přidat nákup
          </button>
        </div>
      </div>

      {/* Search + filter bar */}
      <div style={{ marginBottom: "1rem", display: "flex", gap: "0.75rem", alignItems: "center", flexWrap: "wrap" }}>
        {/* Search */}
        <input
          type="text"
          placeholder="Hledat podle názvu akce..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          style={{
            flex: 1, minWidth: 200, padding: "0.6rem 1rem",
            background: "#111111", border: "1px solid #1f1f1f",
            borderRadius: 10, color: "#fff", fontSize: 14, outline: "none",
          }}
        />

        {/* Status filter */}
        <select
          value={statusFilter}
          onChange={e => setStatusFilter(e.target.value)}
          style={{
            padding: "0.6rem 1rem", background: "#111111",
            border: "1px solid #1f1f1f", borderRadius: 10,
            color: statusFilter === "all" ? "#525252" : "#fff",
            fontSize: 14, outline: "none", cursor: "pointer",
          }}
        >
          <option value="all">Všechny stavy</option>
          <option value="active">Aktivní</option>
          <option value="partial">Částečně prodáno</option>
          <option value="sold">Prodáno</option>
          <option value="cancelled">Zrušeno</option>
        </select>

        {/* Sort by */}
        <select
          value={sortBy}
          onChange={e => setSortBy(e.target.value as any)}
          style={{
            padding: "0.6rem 1rem", background: "#111111",
            border: "1px solid #1f1f1f", borderRadius: 10,
            color: "#fff", fontSize: 14, outline: "none", cursor: "pointer",
          }}
        >
          <option value="created_at">Datum nákupu</option>
          <option value="event_date">Datum akce</option>
          <option value="sold_at">Datum prodeje</option>
        </select>

        {/* Sort direction */}
        <button
          onClick={() => setSortDir(d => d === "asc" ? "desc" : "asc")}
          style={{
            padding: "0.6rem 0.875rem", fontSize: 13,
            background: "#111111", border: "1px solid #1f1f1f",
            borderRadius: 10, color: "#c0c0c0", cursor: "pointer",
          }}
          title={sortDir === "asc" ? "Vzestupně" : "Sestupně"}
        >
          {sortDir === "asc" ? "↑ Vzestupně" : "↓ Sestupně"}
        </button>

        {/* Toggle advanced filters */}
        <button
          onClick={() => setShowFilters(!showFilters)}
          style={{
            padding: "0.6rem 1rem", fontSize: 13,
            background: showFilters ? "#1f1f1f" : "transparent",
            border: "1px solid #1f1f1f", borderRadius: 10,
            color: showFilters ? "#fff" : "#525252", cursor: "pointer",
            whiteSpace: "nowrap" as const,
          }}
        >
          {showFilters ? "▲ Skrýt filtry" : "▼ Více filtrů"}
        </button>

        {/* Reset */}
        {(search || statusFilter !== "all" || deliveredFilter !== "all" || exchangeFilter || cityFilter || dateFrom || dateTo || sortBy !== "created_at" || sortDir !== "desc") && (
          <button
            onClick={resetFilters}
            style={{
              padding: "0.6rem 1rem", fontSize: 13,
              background: "transparent", border: "1px solid #2a2a2a",
              borderRadius: 10, color: "#f87171", cursor: "pointer",
            }}
          >
            × Resetovat
          </button>
        )}
      </div>

      {/* Advanced filters */}
      {showFilters && (
        <div style={{
          display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))",
          gap: "0.75rem", marginBottom: "1rem",
          padding: "1rem", background: "#0d0d0d",
          border: "1px solid #1a1a1a", borderRadius: 12,
        }}>
          {/* Doručeno filter */} 
          <div> 
            <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: "0.08em", color: "#525252", marginBottom: 6 }}>DORUČENO</div> 
            <select value={deliveredFilter} onChange={e => setDeliveredFilter(e.target.value)} style={{ 
              width: "100%", padding: "0.6rem 0.75rem", 
              background: "#111111", border: "1px solid #1f1f1f", 
              borderRadius: 8, color: "#fff", fontSize: 13, outline: "none", cursor: "pointer", 
              boxSizing: "border-box" as const, 
            }}> 
              <option value="all">Vše</option> 
              <option value="yes">✓ Doručeno</option> 
              <option value="no">✗ Nedoručeno</option> 
            </select> 
          </div> 
 
          {/* Burza filter */}
          <div>
            <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: "0.08em", color: "#525252", marginBottom: 6 }}>INZEROVÁNO NA BURZE</div>
            <select value={exchangeFilter} onChange={e => setExchangeFilter(e.target.value)} style={{
              width: "100%", padding: "0.6rem 0.75rem",
              background: "#111111", border: "1px solid #1f1f1f",
              borderRadius: 8, color: "#fff", fontSize: 13, outline: "none", cursor: "pointer",
              boxSizing: "border-box" as const,
            }}>
              <option value="">Všechny burzy</option>
              {EXCHANGES.map(e => <option key={e} value={e}>{e}</option>)}
            </select>
          </div> 
 
          {/* Město / Země filter */} 
          <div> 
            <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: "0.08em", color: "#525252", marginBottom: 6 }}>MĚSTO / ZEMĚ</div> 
            <input 
              type="text" 
              placeholder="Praha, Londýn..." 
              value={cityFilter} 
              onChange={e => setCityFilter(e.target.value)} 
              style={{ 
                width: "100%", padding: "0.6rem 0.75rem", 
                background: "#111111", border: "1px solid #1f1f1f", 
                borderRadius: 8, color: "#fff", fontSize: 13, outline: "none", 
                boxSizing: "border-box" as const, 
              }} 
            /> 
          </div> 
          <div>
            <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: "0.08em", color: "#525252", marginBottom: 6 }}>DATUM OD</div>
            <input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)}
              style={{ width: "100%", padding: "0.6rem 0.75rem", background: "#111111", border: "1px solid #1f1f1f", borderRadius: 8, color: "#fff", fontSize: 13, outline: "none", colorScheme: "dark", boxSizing: "border-box" as const }} />
          </div>
          <div>
            <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: "0.08em", color: "#525252", marginBottom: 6 }}>DATUM DO</div>
            <input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)}
              style={{ width: "100%", padding: "0.6rem 0.75rem", background: "#111111", border: "1px solid #1f1f1f", borderRadius: 8, color: "#fff", fontSize: 13, outline: "none", colorScheme: "dark", boxSizing: "border-box" as const }} />
          </div>
        </div>
      )}

      {/* Loading */}
      {loading && <div style={{ color: "#525252", fontSize: 14 }}>Načítání...</div>}

      {/* Empty state */}
      {!loading && purchases.length === 0 && (
        <div style={{ background: "#111111", border: "1px dashed #2a2a2a", borderRadius: 16, padding: "4rem", textAlign: "center" }}>
          <div style={{ fontSize: "2.5rem", marginBottom: "1rem" }}>🎟️</div>
          <p style={{ color: "#525252", fontSize: 14, marginBottom: "1.5rem" }}>Zatím žádné nákupy. Přidejte svůj první nákup lístků.</p>
          <button onClick={() => setShowModal(true)} style={{ padding: "0.65rem 1.5rem", background: "transparent", border: "1px solid #2a2a2a", borderRadius: 10, color: "#c0c0c0", cursor: "pointer", fontSize: 14 }}>
            + Přidat nákup
          </button>
        </div>
      )}

      {/* No matches state */}
      {!loading && purchases.length > 0 && filtered.length === 0 && (
        <div style={{ background: "#111111", border: "1px dashed #2a2a2a", borderRadius: 16, padding: "4rem", textAlign: "center" }}>
          <div style={{ fontSize: "2.5rem", marginBottom: "1rem" }}>🔍</div>
          <p style={{ color: "#525252", fontSize: 14, marginBottom: "1.5rem" }}>Žádné nákupy neodpovídají vybraným filtrům.</p>
          <button 
            onClick={resetFilters} 
            style={{ padding: "0.65rem 1.5rem", background: "transparent", border: "1px solid #2a2a2a", borderRadius: 10, color: "#c0c0c0", cursor: "pointer", fontSize: 14 }}
          >
            Resetovat filtry
          </button>
        </div>
      )}

      {/* Table */}
      {!loading && filtered.length > 0 && (
        <div style={{ overflowX: "auto" as const }}>
          <div style={{ background: "#111111", border: "1px solid #1a1a1a", borderRadius: 16, overflow: "hidden" }}>
          {/* Table header */}
          <div style={{
            display: "grid",
            gridTemplateColumns: "2fr 1fr 100px 100px 100px 1fr 1fr 1fr 100px",
            padding: "0.875rem 1.5rem",
            borderBottom: "1px solid #1a1a1a",
            background: "#0d0d0d",
          }}>
            {[ 
              { label: "NÁZEV AKCE" }, 
              { label: "MÍSTO" }, 
              { label: "DATUM\nNÁKUPU" }, 
              { label: "DATUM\nAKCE" }, 
              { label: "DATUM\nPRODEJE" }, 
              { label: "ÚČET" }, 
              { label: "POČET" }, 
              { label: "CELKEM" }, 
              { label: "" }, 
            ].map(h => (
              <div key={h.label} style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.08em", color: "#707070", whiteSpace: "pre-line" as const, lineHeight: 1.3 }}>
                {h.label}
              </div>
            ))}
          </div>

          {/* Table rows */}
          {filtered.map((purchase, i) => {
            const status = statusColors[purchase.status] ?? statusColors.active;
            return (
              <div
                key={purchase.id}
                onClick={() => setDetailPurchase(purchase)}
                style={{
                  display: "grid",
                  gridTemplateColumns: "2fr 1fr 100px 100px 100px 1fr 1fr 1fr 100px",
                  padding: "0.875rem 1.5rem",
                  background: "#111111",
                  border: "1px solid #1a1a1a",
                  borderRadius: 12,
                  alignItems: "center",
                  transition: "border-color 0.15s, background 0.15s",
                  cursor: "pointer",
                  marginBottom: i < filtered.length - 1 ? "0.5rem" : 0,
                }}
                onMouseEnter={e => {
                  (e.currentTarget as HTMLDivElement).style.borderColor = "#2a2a2a";
                  (e.currentTarget as HTMLDivElement).style.background = "#141414";
                }}
                onMouseLeave={e => {
                  (e.currentTarget as HTMLDivElement).style.borderColor = "#1a1a1a";
                  (e.currentTarget as HTMLDivElement).style.background = "#111111";
                }}
              >
                {/* Event name */}
                <div>
                  <div style={{ fontWeight: 600, color: "#fff", fontSize: 14, marginBottom: 4 }}>{purchase.event_name}</div>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                    <span style={{
                      fontSize: 11, fontWeight: 600,
                      padding: "2px 8px", borderRadius: 5,
                      background: status.bg, color: status.color,
                    }}>
                      {status.label}
                    </span>
                    {purchase.venue && <span style={{ fontSize: 11, color: "#3a3a3a" }}>{purchase.venue}</span>}
                  </div>
                  <div style={{ display: "flex", gap: 4 }}>
                    <span style={{ fontSize: 10, padding: "1px 6px", borderRadius: 4, background: purchase.delivered ? "#0a2a1a" : "#1a1a1a", color: purchase.delivered ? "#34d399" : "#3a3a3a", border: `1px solid ${purchase.delivered ? "rgba(52,211,153,0.2)" : "#2a2a2a"}` }}>
                      {purchase.delivered ? "✓ Doručeno" : "Nedoručeno"}
                    </span>
                    <span style={{ fontSize: 10, padding: "1px 6px", borderRadius: 4, background: purchase.paid_out ? "#0a2a1a" : "#1a1a1a", color: purchase.paid_out ? "#34d399" : "#3a3a3a", border: `1px solid ${purchase.paid_out ? "rgba(52,211,153,0.2)" : "#2a2a2a"}` }}>
                      {purchase.paid_out ? "✓ Vyplaceno" : "Nevyplaceno"}
                    </span>
                  </div>
                </div>

                {/* Místo akce */}
                <div style={{ fontSize: 13, color: "#525252" }}>
                  {purchase.city ?? "—"}
                </div>

                {/* Purchase date */}
                <div style={{ fontSize: 13, color: "#525252" }}>
                  {purchase.event_date
                    ? new Date(purchase.event_date).toLocaleDateString("cs-CZ")
                    : "—"}
                </div>

                {/* Event actual date */}
                <div style={{ fontSize: 13, color: isThisMonth(purchase.event_actual_date) ? "#f87171" : "#525252" }}>
                  {purchase.event_actual_date
                    ? new Date(purchase.event_actual_date).toLocaleDateString("cs-CZ")
                    : "—"}
                </div>

                {/* Sale date */}
                <div style={{ fontSize: 13, color: purchase.status === "sold" || purchase.status === "partial" ? "#34d399" : "#3a3a3a" }}>
                  {getSaleDate(purchase.id)
                    ? new Date(getSaleDate(purchase.id)!).toLocaleDateString("cs-CZ")
                    : "—"}
                </div>

                {/* Account */}
                <div style={{ fontSize: 13, color: "#525252" }}>{purchase.account_ref ?? "—"}</div>

                {/* Quantity */}
                <div style={{ fontSize: 14, color: "#c0c0c0" }}>{purchase.quantity}×</div>

                {/* Total */}
                <div style={{ fontSize: 14, fontWeight: 700, color: "#fff" }}>
                  {format(purchase.buy_price * purchase.quantity, purchase.currency as "EUR" | "CZK")}
                </div>

                {/* Actions */}
                <div style={{ display: "flex", justifyContent: "flex-end", gap: 4 }} onClick={e => e.stopPropagation()}>
                  <button 
                    onClick={() => setDetailPurchase(purchase)} 
                    title="Detail" 
                    style={{ background: "none", border: "none", color: "#3a3a3a", cursor: "pointer", fontSize: 14, padding: 4 }} 
                    onMouseEnter={e => (e.currentTarget as HTMLButtonElement).style.color = "#a78bfa"} 
                    onMouseLeave={e => (e.currentTarget as HTMLButtonElement).style.color = "#3a3a3a"} 
                  > 
                    ℹ 
                  </button> 
                  <button
                    onClick={() => setSellPurchase(purchase)}
                    title="Zaznamenat prodej"
                    style={{ background: "none", border: "none", color: "#3a3a3a", cursor: "pointer", fontSize: 16, padding: 4 }}
                    onMouseEnter={e => (e.currentTarget as HTMLButtonElement).style.color = "#34d399"}
                    onMouseLeave={e => (e.currentTarget as HTMLButtonElement).style.color = "#3a3a3a"}
                  >
                    💰
                  </button>
                  <button 
                    onClick={() => setEditPurchase(purchase)} 
                    title="Upravit" 
                    style={{ background: "none", border: "none", color: "#3a3a3a", cursor: "pointer", fontSize: 14, padding: 4 }} 
                    onMouseEnter={e => (e.currentTarget as HTMLButtonElement).style.color = "#c0c0c0"} 
                    onMouseLeave={e => (e.currentTarget as HTMLButtonElement).style.color = "#3a3a3a"} 
                  > 
                    ✎ 
                  </button> 
                  <button 
                    onClick={() => setDeleteConfirm(purchase)} 
                    title="Smazat" 
                    style={{ background: "none", border: "none", color: "#3a3a3a", cursor: "pointer", fontSize: 16, padding: 4 }} 
                    onMouseEnter={e => (e.currentTarget as HTMLButtonElement).style.color = "#f87171"} 
                    onMouseLeave={e => (e.currentTarget as HTMLButtonElement).style.color = "#3a3a3a"} 
                  > 
                    × 
                  </button> 
                </div>
              </div>
            );
          })}
          </div>
        </div>
      )}
    </div>
  );
}
