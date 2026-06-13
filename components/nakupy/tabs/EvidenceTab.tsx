"use client";
import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { EXCHANGES } from "@/lib/constants/exchanges";

function isThisMonth(dateStr: string | null): boolean {
  if (!dateStr) return false;
  const date = new Date(dateStr);
  const now = new Date();
  return date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear();
}

type EvidenceRow = {
  id: string;
  event_date: string | null;
  event_name: string;
  city: string | null;
  event_actual_date: string | null;
  quantity: number;
  buy_price: number;
  currency: string;
  status: string;
  exchange: string | null;
  account_ref: string | null;
  ticket_type_custom: string | null;
  paid_out: boolean;
  delivered: boolean;
  notes: string | null;
  quantity_remaining: number | null;
  // From sales
  sell_price_total: number;
  profit: number;
  roi: number;
  sold_at: string | null;
  platform: string | null;
};

const COLS = [
  { key: "event_date", label: "Datum\nnákupu", width: 100 },
  { key: "event_name", label: "Kapela", width: 200 },
  { key: "city", label: "Místo akce", width: 140 },
  { key: "event_actual_date", label: "Datum\nkoncertu", width: 100 },
  { key: "quantity", label: "Počet\nlístků", width: 80 },
  { key: "buy_total", label: "Nákupní cena\ncelkem", width: 130 },
  { key: "sell_total", label: "Prodejní cena\ncelkem", width: 130 },
  { key: "profit", label: "Celkový\nzisk", width: 120 },
  { key: "roi", label: "Ziskovost", width: 90 },
  { key: "exchange", label: "Burza", width: 120 },
  { key: "account_ref", label: "Účet", width: 120 },
  { key: "ticket_type_custom", label: "Druh\nlístků", width: 120 },
  { key: "sold_at", label: "Datum\nprodeje", width: 100 },
  { key: "paid_out", label: "Vyplaceno", width: 90 },
  { key: "delivered", label: "Doručeno", width: 90 },
  { key: "notes", label: "Poznámky", width: 160 },
];

export default function EvidenceTab() {
  const [rows, setRows] = useState<EvidenceRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [accounts, setAccounts] = useState<any[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [showImport, setShowImport] = useState(false);
  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] = useState<{ success?: number; error?: string } | null>(null);

  // Filter states
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [deliveredFilter, setDeliveredFilter] = useState("all");
  const [exchangeFilter, setExchangeFilter] = useState("");
  const [cityFilter, setCityFilter] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [sortBy, setSortBy] = useState<"event_date" | "created_at" | "sold_at">("event_date");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");
  const [showFilters, setShowFilters] = useState(false);

  async function loadData() {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const [{ data: purchases }, { data: sales }, { data: accs }] = await Promise.all([
      supabase.from("purchases")
        .select("id, event_name, event_date, event_actual_date, city, quantity, quantity_remaining, buy_price, currency, status, exchange, account_ref, ticket_type_custom, paid_out, delivered, notes")
        .eq("user_id", user.id)
        .order("event_date", { ascending: false }),
      supabase.from("sales")
        .select("purchase_id, sell_price, quantity_sold, fees, sold_at, platform")
        .eq("user_id", user.id),
      supabase.from("accounts").select("id, name").eq("type", "purchase").order("name"),
    ]);

    const evidenceRows: EvidenceRow[] = (purchases ?? []).map(p => {
      const relatedSales = (sales ?? []).filter(s => s.purchase_id === p.id);
      const sellTotal = relatedSales.reduce((sum, s) => sum + (s.sell_price * s.quantity_sold), 0);
      const feesTotal = relatedSales.reduce((sum, s) => sum + (s.fees ?? 0), 0);
      const buyTotal = p.buy_price * p.quantity;
      const profit = sellTotal - feesTotal - buyTotal;
      const roi = buyTotal > 0 ? (profit / buyTotal) * 100 : 0;
      const lastSale = relatedSales.sort((a, b) => new Date(b.sold_at ?? "").getTime() - new Date(a.sold_at ?? "").getTime())[0];

      return {
        id: p.id,
        event_date: p.event_date,
        event_name: p.event_name,
        city: p.city,
        event_actual_date: p.event_actual_date,
        quantity: p.quantity,
        buy_price: p.buy_price,
        currency: p.currency,
        status: p.status,
        exchange: p.exchange,
        account_ref: p.account_ref,
        ticket_type_custom: p.ticket_type_custom,
        paid_out: p.paid_out,
        delivered: p.delivered ?? false,
        notes: p.notes,
        quantity_remaining: p.quantity_remaining,
        sell_price_total: sellTotal,
        profit,
        roi,
        sold_at: lastSale?.sold_at ?? null,
        platform: lastSale?.platform ?? null,
      };
    });

    setRows(evidenceRows);
    setAccounts(accs ?? []);
    setLoading(false);
  }

  useEffect(() => { loadData(); }, []);

  const filtered = rows
    .filter(r => {
      if (search && !r.event_name.toLowerCase().includes(search.toLowerCase()) && !r.city?.toLowerCase().includes(search.toLowerCase())) return false;
      if (statusFilter !== "all" && r.status !== statusFilter) return false;
      if (deliveredFilter === "yes" && !r.delivered) return false;
      if (deliveredFilter === "no" && r.delivered) return false;
      if (exchangeFilter && r.exchange !== exchangeFilter) return false;
      if (cityFilter && !r.city?.toLowerCase().includes(cityFilter.toLowerCase())) return false;
      if (dateFrom && r.event_date && r.event_date < dateFrom) return false;
      if (dateTo && r.event_date && r.event_date > dateTo) return false;
      return true;
    })
    .sort((a, b) => {
      let aVal = "", bVal = "";
      if (sortBy === "event_date") { aVal = a.event_date ?? ""; bVal = b.event_date ?? ""; }
      else if (sortBy === "created_at") { aVal = a.event_date ?? ""; bVal = b.event_date ?? ""; }
      else if (sortBy === "sold_at") { aVal = a.sold_at ?? ""; bVal = b.sold_at ?? ""; }
      return sortDir === "asc" ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal);
    });

  function resetFilters() {
    setSearch("");
    setStatusFilter("all");
    setDeliveredFilter("all");
    setExchangeFilter("");
    setCityFilter("");
    setDateFrom("");
    setDateTo("");
  }

  // Totals
  const totalBuy = filtered.reduce((s, r) => s + (r.buy_price * r.quantity), 0);
  const totalSell = filtered.reduce((s, r) => s + r.sell_price_total, 0);
  const totalProfit = filtered.reduce((s, r) => s + r.profit, 0);
  const avgRoi = filtered.length > 0 ? filtered.reduce((s, r) => s + r.roi, 0) / filtered.length : 0;
  const ticketsActive = filtered.filter(r => r.status === "active" || r.status === "partial").reduce((s, r) => s + (r.quantity_remaining ?? r.quantity), 0);
  const moneyOnWay = filtered.filter(r => r.status === "sold" && !r.paid_out).reduce((s, r) => s + r.sell_price_total, 0);

  const fmt = (n: number, cur = "EUR") => `${n.toLocaleString("cs-CZ", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ${cur}`;

  const cellStyle = (width: number, isNum = false): React.CSSProperties => ({
    minWidth: width, maxWidth: width, width,
    padding: "0.6rem 0.75rem",
    fontSize: 12, color: "#c0c0c0",
    borderRight: "1px solid #1a1a1a",
    textAlign: isNum ? "right" : "left",
    whiteSpace: "nowrap",
    overflow: "hidden",
    textOverflow: "ellipsis",
  });

  function EditableCell({
    rowId, field, value, width, align = "left", color, fontWeight,
  }: {
    rowId: string; field: string; value: string | number | null;
    width: number; align?: "left" | "right" | "center";
    color?: string; fontWeight?: number;
  }) {
    const [editing, setEditing] = useState(false);
    const [val, setVal] = useState(String(value ?? ""));

    async function save() {
      const supabase = createClient();
      const purchaseFields = ["event_name", "city", "event_actual_date", "event_date", "exchange", "account_ref", "ticket_type_custom", "paid_out", "notes"];
      const saleFields = ["sell_price_total", "sold_at", "platform"];

      let newValue: any = val;

      if (field === "paid_out") newValue = val === "ANO" || val === "true";
      if (field === "quantity") newValue = parseInt(val) || 0;
      if (field === "buy_price") newValue = parseFloat(val.replace(",", ".")) || 0;

      if (purchaseFields.includes(field)) {
        await supabase.from("purchases").update({ [field]: newValue || null, updated_at: new Date().toISOString() }).eq("id", rowId);
      } else if (saleFields.includes(field)) {
        const row = rows.find(r => r.id === rowId);
        if (row) {
          const supabase2 = createClient();
          const { data: sales } = await supabase2.from("sales").select("id").eq("purchase_id", rowId).limit(1);
          if (sales?.[0]) {
            const updateData: any = {};
            if (field === "sell_price_total") updateData.sell_price = parseFloat(val.replace(",", ".")) || 0;
            if (field === "sold_at") updateData.sold_at = val ? new Date(val).toISOString() : null;
            if (field === "platform") updateData.platform = val || null;
            await supabase2.from("sales").update(updateData).eq("id", sales[0].id);
          }
        }
      }

      setEditing(false);
      loadData();
    }

    if (editing) {
      return (
        <td style={{ ...cellStyle(width), padding: 0, background: "#1a1a2e" }}>
          <input
            autoFocus
            value={val}
            onChange={e => setVal(e.target.value)}
            onBlur={save}
            onKeyDown={e => {
              if (e.key === "Enter") save();
              if (e.key === "Escape") setEditing(false);
            }}
            style={{
              width: "100%", height: "100%",
              padding: "0.6rem 0.75rem",
              background: "#0d0d2a",
              border: "2px solid #7c3aed",
              borderRadius: 0, color: "#fff",
              fontSize: 12, outline: "none",
              boxSizing: "border-box",
            }}
          />
        </td>
      );
    }

    return (
      <td
        onClick={() => { setEditing(true); setVal(String(value ?? "")); }}
        style={{
          ...cellStyle(width),
          textAlign: align,
          color: color ?? "#c0c0c0",
          fontWeight: fontWeight,
          cursor: "text",
          userSelect: "none",
        }}
        title="Klikněte pro úpravu"
      >
        {value ?? "—"}
      </td>
    );
  }

  // Date cell — opens date picker
  function DateCell({ rowId, field, value, width, table = "purchases", color }: {
    rowId: string; field: string; value: string | null; width: number; table?: "purchases" | "sales"; color?: string;
  }) {
    const [editing, setEditing] = useState(false);
    const [val, setVal] = useState(value ?? "");

    async function save(newVal: string) {
      const supabase = createClient();
      const dbVal = newVal ? newVal : null;
      if (table === "purchases") {
        await supabase.from("purchases").update({ [field]: dbVal, updated_at: new Date().toISOString() }).eq("id", rowId);
      } else {
        const { data: sales } = await supabase.from("sales").select("id").eq("purchase_id", rowId).limit(1);
        if (sales?.[0]) await supabase.from("sales").update({ [field]: newVal ? new Date(newVal).toISOString() : null }).eq("id", sales[0].id);
      }
      setEditing(false);
      loadData();
    }

    if (editing) {
      return (
        <td style={{ ...cellStyle(width), padding: 0, background: "#1a1a2e" }}>
          <input
            autoFocus
            type="date"
            value={val}
            onChange={e => setVal(e.target.value)}
            onBlur={() => save(val)}
            onKeyDown={e => { if (e.key === "Enter") save(val); if (e.key === "Escape") setEditing(false); }}
            style={{ width: "100%", padding: "0.6rem 0.75rem", background: "#0d0d2a", border: "2px solid #7c3aed", borderRadius: 0, color: "#fff", fontSize: 12, outline: "none", colorScheme: "dark", boxSizing: "border-box" }}
          />
        </td>
      );
    }

    return (
      <td onClick={() => { setEditing(true); setVal(value ?? ""); }}
        style={{ ...cellStyle(width), cursor: "text", color: color ?? "#c0c0c0" }} title="Klikněte pro úpravu"
      >
        {value ? new Date(value).toLocaleDateString("cs-CZ") : "—"}
      </td>
    );
  }

  // Dropdown cell
  function DropdownCell({ rowId, field, value, width, options, table = "purchases" }: {
    rowId: string; field: string; value: string | null; width: number;
    options: string[]; table?: "purchases" | "sales";
  }) {
    const [editing, setEditing] = useState(false);
    const [val, setVal] = useState(value ?? "");
    const [customVal, setCustomVal] = useState("");
    const [showCustom, setShowCustom] = useState(false);

    async function save(newVal: string) {
      const supabase = createClient();
      if (table === "purchases") {
        await supabase.from("purchases").update({ [field]: newVal || null, updated_at: new Date().toISOString() }).eq("id", rowId);
      } else {
        const { data: sales } = await supabase.from("sales").select("id").eq("purchase_id", rowId).limit(1);
        if (sales?.[0]) await supabase.from("sales").update({ [field]: newVal || null }).eq("id", sales[0].id);
      }
      setEditing(false);
      setShowCustom(false);
      loadData();
    }

    if (editing) {
      return (
        <td style={{ ...cellStyle(width), padding: 0, background: "#1a1a2e", minWidth: width }}>
          <div style={{ display: "flex", flexDirection: "column" as const }}>
            <select
              autoFocus
              value={showCustom ? "Jiné" : val}
              onChange={e => {
                if (e.target.value === "Jiné") {
                  setShowCustom(true);
                  setVal("Jiné");
                } else {
                  setShowCustom(false);
                  setVal(e.target.value);
                  save(e.target.value);
                }
              }}
              style={{ width: "100%", padding: "0.5rem", background: "#0d0d2a", border: "2px solid #7c3aed", borderBottom: showCustom ? "1px solid #3a3a3a" : "2px solid #7c3aed", color: "#fff", fontSize: 12, outline: "none", boxSizing: "border-box" as const }}
            >
              <option value="">— Vyberte —</option>
              {options.map(o => <option key={o} value={o}>{o}</option>)}
              <option value="Jiné">Jiné</option>
            </select>
            {showCustom && (
              <input
                autoFocus
                type="text"
                placeholder="Napište vlastní..."
                value={customVal}
                onChange={e => setCustomVal(e.target.value)}
                onBlur={() => save(customVal || "Jiné")}
                onKeyDown={e => {
                  if (e.key === "Enter") save(customVal || "Jiné");
                  if (e.key === "Escape") { setEditing(false); setShowCustom(false); }
                }}
                style={{ width: "100%", padding: "0.5rem", background: "#0d0d2a", border: "2px solid #7c3aed", borderTop: "none", color: "#fff", fontSize: 12, outline: "none", boxSizing: "border-box" as const }}
              />
            )}
          </div>
        </td>
      );
    }

    return (
      <td onClick={() => { setEditing(true); setVal(value ?? ""); setShowCustom(false); setCustomVal(""); }}
        style={{ ...cellStyle(width), cursor: "pointer" }} title="Klikněte pro úpravu"
      >
        {value ?? "—"}
      </td>
    );
  }

  // Number cell — editable quantity or price
  function NumberCell({ rowId, field, value, width, suffix = "", onSave }: {
    rowId: string; field: string; value: number; width: number;
    suffix?: string; onSave?: (rowId: string, field: string, val: number) => void;
  }) {
    const [editing, setEditing] = useState(false);
    const [val, setVal] = useState(String(value));

    async function save() {
      const num = parseFloat(val.replace(",", ".")) || 0;
      if (onSave) {
        await onSave(rowId, field, num);
      } else {
        const supabase = createClient();
        await supabase.from("purchases").update({ [field]: num, updated_at: new Date().toISOString() }).eq("id", rowId);
        loadData();
      }
      setEditing(false);
    }

    if (editing) {
      return (
        <td style={{ ...cellStyle(width), padding: 0, background: "#1a1a2e" }}>
          <input
            autoFocus
            type="number"
            value={val}
            onChange={e => setVal(e.target.value)}
            onBlur={save}
            onKeyDown={e => { if (e.key === "Enter") save(); if (e.key === "Escape") setEditing(false); }}
            style={{ width: "100%", padding: "0.6rem 0.75rem", background: "#0d0d2a", border: "2px solid #7c3aed", borderRadius: 0, color: "#fff", fontSize: 12, outline: "none", boxSizing: "border-box" }}
          />
        </td>
      );
    }

    return (
      <td onClick={() => { setEditing(true); setVal(String(value)); }}
        style={{ ...cellStyle(width), textAlign: "right", cursor: "text" }} title="Klikněte pro úpravu"
      >
        {value}{suffix}
      </td>
    );
  }

  function AddPurchaseModal({ accounts, onClose, onSave }: { accounts: any[]; onClose: () => void; onSave: () => void }) {
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
    const [exchange, setExchange] = useState("");
    const [customExchange, setCustomExchange] = useState("");
    const [ticketType, setTicketType] = useState("");
    const [customTicketType, setCustomTicketType] = useState("");
    const [notes, setNotes] = useState("");
    const [delivered, setDelivered] = useState(false);
    const [paidOut, setPaidOut] = useState(false);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState("");
    const [aiLoading, setAiLoading] = useState(false);
    const [aiError, setAiError] = useState("");

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
        if (!result.success) throw new Error(result.error);
        const d = result.data;
        if (d.event_name) setEventName(d.event_name);
        if (d.city) setCity(d.city);
        if (d.buy_price) setBuyPrice(String(d.buy_price));
        if (d.quantity) setQuantity(String(d.quantity));
        if (d.event_date) setEventDate(d.event_date);
        if (d.event_actual_date) setEventActualDate(d.event_actual_date);
        if (d.ticket_type) setTicketType(d.ticket_type);
        if (d.sector) setSector(d.sector);
      } catch (err: any) {
        setAiError(`AI chyba: ${err?.message ?? "Import selhal"}`);
      }
      setAiLoading(false);
      e.target.value = "";
    }

    const priceNum = priceMode === "per_ticket"
      ? parseFloat(buyPrice.replace(",", ".")) || 0
      : (parseFloat(totalPrice.replace(",", ".")) || 0) / (parseInt(quantity) || 1);
    const qtyNum = parseInt(quantity) || 1;
    const totalCost = priceNum * qtyNum;

    async function handleSave() {
      if (!eventName.trim()) return setError("Název akce je povinný");
      if (priceNum <= 0) return setError("Zadejte platnou cenu");
      setSaving(true);
      setError("");
      const resolvedExchange = exchange === "Jiné" ? (customExchange.trim() || "Jiné") : exchange;
      const resolvedTicketType = ticketType === "Jiné" ? (customTicketType.trim() || "Jiné") : ticketType;
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { error: err } = await supabase.from("purchases").insert({
        user_id: user.id,
        event_name: eventName.trim(),
        city: city.trim() || null,
        event_date: eventDate || null,
        event_actual_date: eventActualDate || null,
        venue: sector.trim() || null,
        exchange: resolvedExchange || null,
        account_ref: accountRef || null,
        buy_price: priceNum,
        quantity: qtyNum,
        ticket_type_custom: resolvedTicketType || null,
        notes: notes.trim() || null,
        delivered,
        paid_out: paidOut,
        status: "active",
      });
      if (err) {
        setError(err.message);
        setSaving(false);
        return;
      }
      onSave();
      setSaving(false);
    }

    const inputStyle: React.CSSProperties = {
      width: "100%", padding: "0.75rem 1rem",
      background: "#0a0a0a", border: "1px solid #2a2a2a",
      borderRadius: 10, color: "#fff", fontSize: 14,
      outline: "none", boxSizing: "border-box",
    };
    const labelStyle = {
      fontSize: 11, fontWeight: 600, letterSpacing: "0.08em", color: "#525252",
      display: "block", marginBottom: "0.4rem",
    };

    return (
      <>
        <div onClick={onClose} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.75)", zIndex: 100, backdropFilter: "blur(4px)" }} />
        <div style={{
          position: "fixed", top: "50%", left: "50%", transform: "translate(-50%, -50%)",
          width: "100%", maxWidth: 520, maxHeight: "90vh",
          background: "#111111", border: "1px solid #2a2a2a",
          borderRadius: 20, zIndex: 101, overflow: "hidden", display: "flex", flexDirection: "column",
        }}>
          <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 1, background: "linear-gradient(90deg, transparent, #c0c0c0, transparent)" }} />
          <div style={{
            padding: "1.5rem 2rem 1rem", borderBottom: "1px solid #1a1a1a", flexShrink: 0, background: "#111111",
          }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <h2 style={{ fontSize: "1.1rem", fontWeight: 700, color: "#fff", margin: 0 }}>Přidat nákup</h2>
              <button onClick={onClose} style={{ background: "none", border: "none", color: "#525252", cursor: "pointer", fontSize: 22 }}>×</button>
            </div>
          </div>
          <div style={{ overflowY: "auto", flex: 1, padding: "1.25rem 2rem" }}>
            {error && <div style={{ marginBottom: "1rem", padding: "10px 14px", borderRadius: 8, background: "#2a0a0a", border: "1px solid #7f1d1d", color: "#fca5a5", fontSize: 13 }}>{error}</div>}
            
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
                  <div style={{ fontSize: 13, fontWeight: 600, color: "#a78bfa", marginBottom: 2 }}>📸 AI import ze screenshotu</div>
                  <div style={{ fontSize: 12, color: "#525252" }}>Nahrajte potvrzení z Viagogo, Ticketmaster...</div>
                </div>
                <label style={{
                  padding: "7px 14px", fontSize: 12, fontWeight: 700,
                  background: aiLoading ? "#2a2a2a" : "linear-gradient(135deg, #7c3aed, #5b21b6)",
                  border: "none", borderRadius: 8, color: "#fff",
                  cursor: aiLoading ? "default" : "pointer",
                  whiteSpace: "nowrap" as const,
                }}>
                  {aiLoading ? "⏳ Analyzuji..." : "📤 Nahrát"}
                  <input type="file" accept="image/*" onChange={handleAiImport} style={{ display: "none" }} disabled={aiLoading} />
                </label>
              </div>
              {aiError && <div style={{ marginTop: 8, fontSize: 12, color: "#f87171" }}>{aiError}</div>}
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
              <div>
                <label style={labelStyle}>NÁZEV AKCE *</label>
                <input type="text" value={eventName} onChange={e => setEventName(e.target.value)} style={inputStyle} />
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem" }}>
                <div>
                  <label style={labelStyle}>MĚSTO</label>
                  <input type="text" placeholder="Praha" value={city} onChange={e => setCity(e.target.value)} style={inputStyle} />
                </div>
                <div>
                  <label style={labelStyle}>SEKTOR / SEDADLO</label>
                  <input type="text" placeholder="Sektor A" value={sector} onChange={e => setSector(e.target.value)} style={inputStyle} />
                </div>
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
                <label style={labelStyle}>BURZA</label>
                <select value={exchange} onChange={e => { setExchange(e.target.value); setCustomExchange(""); }} style={{ ...inputStyle, cursor: "pointer" }}>
                  <option value="">— Vyberte —</option>
                  {EXCHANGES.map(e => <option key={e} value={e}>{e}</option>)}
                  <option value="Jiné">Jiné</option>
                </select>
                {exchange === "Jiné" && (
                  <input type="text" placeholder="Zadejte burzu" value={customExchange} onChange={e => setCustomExchange(e.target.value)} style={{ ...inputStyle, marginTop: "0.5rem" }} />
                )}
              </div>
              <div>
                <label style={labelStyle}>NÁKUPNÍ ÚČET</label>
                <select value={accountRef} onChange={e => setAccountRef(e.target.value)} style={{ ...inputStyle, cursor: "pointer" }}>
                  <option value="">— Vyberte účet —</option>
                  {accounts.map(a => <option key={a.id} value={a.name}>{a.name}</option>)}
                </select>
              </div>
              <div>
                <label style={labelStyle}>CENA</label>
                <div style={{ display: "flex", gap: "0.5rem", marginBottom: "0.5rem" }}>
                  <button onClick={() => setPriceMode("per_ticket")} style={{ flex: 1, padding: "8px 16px", fontSize: 12, fontWeight: 600, background: priceMode === "per_ticket" ? "#1a1a1a" : "transparent", border: "1px solid #2a2a2a", borderRadius: 8, color: priceMode === "per_ticket" ? "#fff" : "#525252", cursor: "pointer" }}>
                    Na lístek
                  </button>
                  <button onClick={() => setPriceMode("total")} style={{ flex: 1, padding: "8px 16px", fontSize: 12, fontWeight: 600, background: priceMode === "total" ? "#1a1a1a" : "transparent", border: "1px solid #2a2a2a", borderRadius: 8, color: priceMode === "total" ? "#fff" : "#525252", cursor: "pointer" }}>
                    Celkem
                  </button>
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem" }}>
                  <div>
                    <label style={labelStyle}>{priceMode === "per_ticket" ? "CENA NA LÍSTEK *" : "CENA CELKEM *"}</label>
                    <input type="text" value={priceMode === "per_ticket" ? buyPrice : totalPrice} onChange={e => priceMode === "per_ticket" ? setBuyPrice(e.target.value) : setTotalPrice(e.target.value)} style={inputStyle} />
                  </div>
                  <div>
                    <label style={labelStyle}>POČET LÍSTKŮ *</label>
                    <input type="number" min="1" value={quantity} onChange={e => setQuantity(e.target.value)} style={inputStyle} />
                  </div>
                </div>
              </div>
              <div>
                <label style={labelStyle}>DRUH LÍSTKU</label>
                <select value={ticketType} onChange={e => { setTicketType(e.target.value); setCustomTicketType(""); }} style={{ ...inputStyle, cursor: "pointer" }}>
                  <option value="">— Vyberte —</option>
                  <option value="Mobile Transfer">Mobile Transfer</option>
                  <option value="E-Ticket">E-Ticket</option>
                  <option value="Jiné">Jiné</option>
                </select>
                {ticketType === "Jiné" && (
                  <input type="text" placeholder="Zadejte typ" value={customTicketType} onChange={e => setCustomTicketType(e.target.value)} style={{ ...inputStyle, marginTop: "0.5rem" }} />
                )}
              </div>
              <div>
                <label style={labelStyle}>POZNÁMKY</label>
                <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={2} style={{ ...inputStyle, resize: "vertical" }} />
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem" }}>
                <div style={{ background: "#0a0a0a", border: "1px solid #2a2a2a", borderRadius: 10, padding: "0.75rem 1rem", display: "flex", alignItems: "center", justifyContent: "space-between", cursor: "pointer" }}
                  onClick={() => setDelivered(!delivered)}
                >
                  <div>
                    <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: "0.08em", color: "#525252", marginBottom: 2 }}>DORUČENO</div>
                    <div style={{ fontSize: 13, fontWeight: 600, color: delivered ? "#34d399" : "#3a3a3a" }}>{delivered ? "ANO" : "NIE"}</div>
                  </div>
                  <div style={{ width: 36, height: 20, borderRadius: 10, background: delivered ? "#34d399" : "#2a2a2a", position: "relative", transition: "background 0.2s" }}>
                    <div style={{ position: "absolute", top: 2, left: delivered ? 18 : 2, width: 16, height: 16, borderRadius: "50%", background: "#fff", transition: "left 0.2s" }} />
                  </div>
                </div>
                <div style={{ background: "#0a0a0a", border: "1px solid #2a2a2a", borderRadius: 10, padding: "0.75rem 1rem", display: "flex", alignItems: "center", justifyContent: "space-between", cursor: "pointer" }}
                  onClick={() => setPaidOut(!paidOut)}
                >
                  <div>
                    <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: "0.08em", color: "#525252", marginBottom: 2 }}>VYPLACENO</div>
                    <div style={{ fontSize: 13, fontWeight: 600, color: paidOut ? "#34d399" : "#3a3a3a" }}>{paidOut ? "ANO" : "NIE"}</div>
                  </div>
                  <div style={{ width: 36, height: 20, borderRadius: 10, background: paidOut ? "#34d399" : "#2a2a2a", position: "relative", transition: "background 0.2s" }}>
                    <div style={{ position: "absolute", top: 2, left: paidOut ? 18 : 2, width: 16, height: 16, borderRadius: "50%", background: "#fff", transition: "left 0.2s" }} />
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div style={{ padding: "1rem 2rem", borderTop: "1px solid #1a1a1a", flexShrink: 0, display: "flex", gap: "0.75rem" }}>
            <button onClick={onClose} style={{ flex: 1, padding: "0.8rem", background: "transparent", border: "1px solid #2a2a2a", borderRadius: 10, color: "#525252", cursor: "pointer", fontSize: 14 }}>
              Zrušit
            </button>
            <button onClick={handleSave} disabled={saving} style={{
              flex: 2, padding: "0.8rem",
              background: saving ? "#2a2a2a" : "linear-gradient(135deg, #ffffff, #c0c0c0)",
              border: "none", borderRadius: 10, color: "#000", fontWeight: 700, fontSize: 14,
              cursor: saving ? "default" : "pointer",
            }}>
              {saving ? "UKLÁDÁM..." : "ULOŽIT"}
            </button>
          </div>
        </div>
      </>
    );
  }

  if (loading) return <div style={{ color: "#525252", fontSize: 14 }}>Načítání...</div>;

  return (
    <div>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1.5rem" }}>
        <div>
          <h1 style={{ fontSize: "1.5rem", fontWeight: 700, color: "#fff", marginBottom: "0.25rem" }}>Evidence</h1>
          <p style={{ fontSize: 13, color: "#3a3a3a" }}>Kompletní přehled všech nákupů a prodejů</p>
          <div style={{ fontSize: 10, color: "#3a3a3a", marginTop: "0.5rem" }}>
            ✏️ Klikněte na buňku pro úpravu
          </div>
        </div>
      </div>

      {/* Search + actions bar */}
      <div style={{ display: "flex", gap: "0.75rem", marginBottom: "1rem", alignItems: "center", flexWrap: "wrap" }}>
        <input
          type="text"
          placeholder="Hledat..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          style={{ padding: "0.6rem 1rem", width: 220, background: "#111111", border: "1px solid #1f1f1f", borderRadius: 10, color: "#fff", fontSize: 13, outline: "none" }}
        />
        <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} style={{ padding: "0.6rem 0.75rem", background: "#111111", border: "1px solid #1f1f1f", borderRadius: 10, color: "#fff", fontSize: 13, outline: "none", cursor: "pointer" }}>
          <option value="all">Všechny statusy</option>
          <option value="active">Aktivní</option>
          <option value="partial">Částečně prodáno</option>
          <option value="sold">Prodáno</option>
          <option value="cancelled">Zrušeno</option>
        </select>
        <select value={sortBy} onChange={e => setSortBy(e.target.value as any)} style={{ padding: "0.6rem 0.75rem", background: "#111111", border: "1px solid #1f1f1f", borderRadius: 10, color: "#fff", fontSize: 13, outline: "none", cursor: "pointer" }}>
          <option value="event_date">Datum nákupu</option>
          <option value="sold_at">Datum prodeje</option>
        </select>
        <button onClick={() => setSortDir(d => d === "asc" ? "desc" : "asc")} style={{ padding: "0.6rem 0.875rem", fontSize: 13, background: "#111111", border: "1px solid #1f1f1f", borderRadius: 10, color: "#c0c0c0", cursor: "pointer" }}>
          {sortDir === "asc" ? "↑ Vzestupně" : "↓ Sestupně"}
        </button>
        <button onClick={() => setShowFilters(!showFilters)} style={{ padding: "0.6rem 1rem", fontSize: 13, background: showFilters ? "#1f1f1f" : "transparent", border: "1px solid #1f1f1f", borderRadius: 10, color: showFilters ? "#fff" : "#525252", cursor: "pointer", whiteSpace: "nowrap" }}>
          🔍 Filtry
        </button>
        {(search || statusFilter !== "all" || deliveredFilter !== "all" || exchangeFilter || cityFilter || dateFrom || dateTo) && (
          <button onClick={resetFilters} style={{ padding: "0.6rem 1rem", fontSize: 13, background: "transparent", border: "1px solid #2a2a2a", borderRadius: 10, color: "#f87171", cursor: "pointer" }}>
            × Resetovat
          </button>
        )}
        <div style={{ marginLeft: "auto", display: "flex", gap: "0.75rem" }}>
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
              background: "linear-gradient(135deg, #ffffff, #c0c0c0)",
              border: "none", borderRadius: 10, color: "#000", fontWeight: 700, fontSize: 13,
              letterSpacing: "0.05em", cursor: "pointer",
              display: "flex", alignItems: "center", gap: 6,
            }}
          >
            + Přidat nákup
          </button>
        </div>
      </div>

      {/* Advanced filters */}
      {showFilters && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: "0.75rem", marginBottom: "1rem", padding: "1rem", background: "#0d0d0d", border: "1px solid #1a1a1a", borderRadius: 12 }}>
          <div>
            <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: "0.08em", color: "#525252", marginBottom: 6 }}>DORUČENO</div>
            <select value={deliveredFilter} onChange={e => setDeliveredFilter(e.target.value)} style={{ width: "100%", padding: "0.6rem 0.75rem", background: "#111111", border: "1px solid #1f1f1f", borderRadius: 8, color: "#fff", fontSize: 13, outline: "none", cursor: "pointer", boxSizing: "border-box" }}>
              <option value="all">Vše</option>
              <option value="yes">✓ Doručeno</option>
              <option value="no">✗ Nedoručeno</option>
            </select>
          </div>
          <div>
            <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: "0.08em", color: "#525252", marginBottom: 6 }}>BURZA</div>
            <select value={exchangeFilter} onChange={e => setExchangeFilter(e.target.value)} style={{ width: "100%", padding: "0.6rem 0.75rem", background: "#111111", border: "1px solid #1f1f1f", borderRadius: 8, color: "#fff", fontSize: 13, outline: "none", cursor: "pointer", boxSizing: "border-box" }}>
              <option value="">Všechny burzy</option>
              {EXCHANGES.map(e => <option key={e} value={e}>{e}</option>)}
            </select>
          </div>
          <div>
            <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: "0.08em", color: "#525252", marginBottom: 6 }}>MĚSTO</div>
            <input type="text" placeholder="Praha..." value={cityFilter} onChange={e => setCityFilter(e.target.value)} style={{ width: "100%", padding: "0.6rem 0.75rem", background: "#111111", border: "1px solid #1f1f1f", borderRadius: 8, color: "#fff", fontSize: 13, outline: "none", boxSizing: "border-box" }} />
          </div>
          <div>
            <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: "0.08em", color: "#525252", marginBottom: 6 }}>DATUM OD</div>
            <input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)} style={{ width: "100%", padding: "0.6rem 0.75rem", background: "#111111", border: "1px solid #1f1f1f", borderRadius: 8, color: "#fff", fontSize: 13, outline: "none", colorScheme: "dark", boxSizing: "border-box" }} />
          </div>
          <div>
            <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: "0.08em", color: "#525252", marginBottom: 6 }}>DATUM DO</div>
            <input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)} style={{ width: "100%", padding: "0.6rem 0.75rem", background: "#111111", border: "1px solid #1f1f1f", borderRadius: 8, color: "#fff", fontSize: 13, outline: "none", colorScheme: "dark", boxSizing: "border-box" }} />
          </div>
        </div>
      )}

      {/* Sticky summary bar — always visible above table */}
      <div style={{
        background: "#0a0a0a",
        border: "1px solid #1a1a1a",
        borderRadius: 12,
        padding: "0.75rem 1.25rem",
        marginBottom: "0.75rem",
        display: "flex",
        gap: "2rem",
        alignItems: "center",
        flexWrap: "wrap" as const,
      }}>
        {[
          { label: "Nákupů", value: `${filtered.length}` },
          { label: "Lístků celkem", value: `${filtered.reduce((s, r) => s + r.quantity, 0)}×` },
          { label: "Nákup celkem", value: fmt(totalBuy), color: "#c0c0c0" },
          { label: "Prodej celkem", value: fmt(totalSell), color: "#34d399" },
          { label: "Zisk celkem", value: `${totalProfit >= 0 ? "+" : ""}${fmt(totalProfit)}`, color: totalProfit >= 0 ? "#34d399" : "#f87171" },
          { label: "Průměrná ziskovost", value: `${avgRoi >= 0 ? "+" : ""}${avgRoi.toFixed(1)}%`, color: avgRoi >= 0 ? "#34d399" : "#f87171" },
          { label: "Lístky v prodeji", value: `${ticketsActive}×`, color: "#fbbf24" },
          { label: "Peníze na cestě", value: fmt(moneyOnWay), color: "#a78bfa" },
        ].map(s => (
          <div key={s.label} style={{ textAlign: "center" as const }}>
            <div style={{ fontSize: 11, color: "#525252", letterSpacing: "0.08em", marginBottom: 3 }}>{s.label.toUpperCase()}</div>
            <div style={{ fontSize: 14, fontWeight: 700, color: (s as any).color ?? "#fff" }}>{s.value}</div>
          </div>
        ))}
      </div>

      {/* Table with own scrollbar */}
      <div style={{
        overflowX: "auto",
        overflowY: "auto",
        maxHeight: "calc(100vh - 320px)",
        borderRadius: 16,
        border: "1px solid #1a1a1a",
        scrollbarWidth: "thin" as const,
        scrollbarColor: "#2a2a2a #0a0a0a",
      }}>
        <table style={{ borderCollapse: "collapse", width: "max-content", minWidth: "100%" }}>
          {/* Header */}
          <thead style={{ position: "sticky", top: 0, zIndex: 10 }}>
            <tr style={{ background: "#0a0a0a", borderBottom: "1px solid #1f1f1f" }}>
              {COLS.map(col => (
                <th key={col.key} style={{
                  ...cellStyle(col.width),
                  color: "#707070", fontWeight: 700,
                  fontSize: 10, letterSpacing: "0.08em",
                  whiteSpace: "pre-line",
                  lineHeight: 1.3, padding: "0.75rem",
                  background: "#0a0a0a",
                  position: "sticky", top: 0,
                  borderBottom: "1px solid #1f1f1f",
                }}>
                  {col.label}
                </th>
              ))}
            </tr>
          </thead>

          {/* Body */}
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={COLS.length} style={{ padding: "3rem", textAlign: "center", color: "#525252", fontSize: 14 }}>
                  Žádné záznamy
                </td>
              </tr>
            ) : (
              filtered.map((row, idx) => {
                const isProfit = row.profit >= 0;
                const hasSales = row.sell_price_total > 0;

                return (
                  <tr
                    key={row.id}
                    style={{
                      background: idx % 2 === 0 ? "#111111" : "#0d0d0d",
                      borderBottom: "1px solid #1a1a1a",
                      transition: "background 0.15s",
                    }}
                    onMouseEnter={e => { e.currentTarget.style.background = "#161616"; }}
                    onMouseLeave={e => { e.currentTarget.style.background = idx % 2 === 0 ? "#111111" : "#0d0d0d"; }}
                  >
                    {/* Datum nákupu */}
                    <DateCell rowId={row.id} field="event_date" value={row.event_date} width={100} />

                    {/* Kapela */}
                    <EditableCell rowId={row.id} field="event_name" value={row.event_name} width={200} color="#fff" fontWeight={600} />

                    {/* Místo akce */}
                    <EditableCell rowId={row.id} field="city" value={row.city} width={140} />

                    {/* Datum koncertu */}
                    <DateCell rowId={row.id} field="event_actual_date" value={row.event_actual_date} width={100} color={isThisMonth(row.event_actual_date) ? "#f87171" : undefined} />

                    {/* Počet lístků — EDITABLE */}
                    <NumberCell rowId={row.id} field="quantity" value={row.quantity} width={80} suffix="×" />

                    {/* Nákupní cena celkem — EDITABLE */}
                    <NumberCell
                      rowId={row.id}
                      field="buy_price_total"
                      value={parseFloat((row.buy_price * row.quantity).toFixed(2))}
                      width={130}
                      onSave={async (rowId, _, val) => {
                        const supabase = createClient();
                        const r = rows.find(r => r.id === rowId);
                        if (!r) return;
                        const pricePerTicket = val / r.quantity;
                        await supabase.from("purchases").update({
                          buy_price: pricePerTicket,
                          updated_at: new Date().toISOString(),
                        }).eq("id", rowId);
                        loadData();
                      }}
                    />

                    {/* Prodejní cena celkem — EDITABLE */}
                    <EditableCell rowId={row.id} field="sell_price_total" value={row.sell_price_total > 0 ? row.sell_price_total.toFixed(2) : null} width={130} align="right" color={row.sell_price_total > 0 ? "#34d399" : "#3a3a3a"} />

                    {/* Celkový zisk — READ ONLY */}
                    <td style={{ ...cellStyle(120), textAlign: "right", color: row.profit >= 0 ? "#34d399" : "#f87171", fontWeight: 700, cursor: "default" }} title="Pouze pro čtení">
                      {row.sell_price_total > 0 ? `${row.profit >= 0 ? "+" : ""}${fmt(row.profit, row.currency)}` : "—"}
                    </td>

                    {/* Ziskovost — READ ONLY */}
                    <td style={{ ...cellStyle(90), textAlign: "right", color: row.roi >= 0 ? "#34d399" : "#f87171", fontWeight: 600, cursor: "default" }} title="Pouze pro čtení">
                      {row.sell_price_total > 0 ? `${row.roi >= 0 ? "+" : ""}${row.roi.toFixed(1)}%` : "—"}
                    </td>

                    {/* Burza — DROPDOWN */}
                    <DropdownCell rowId={row.id} field="exchange" value={row.exchange} width={120} options={[...EXCHANGES, "Jiné"]} />

                    {/* Účet — DROPDOWN from nákupní účty */}
                    <DropdownCell
                      rowId={row.id}
                      field="account_ref"
                      value={row.account_ref}
                      width={120}
                      options={accounts.map(a => a.name)}
                    />

                    {/* Druh lístků — DROPDOWN */}
                    <DropdownCell rowId={row.id} field="ticket_type_custom" value={row.ticket_type_custom} width={120} options={["Mobile Transfer", "E-Ticket"]} />

                    {/* Datum prodeje */}
                    <DateCell rowId={row.id} field="sold_at" value={row.sold_at ? row.sold_at.split("T")[0] : null} width={100} table="sales" />

                    {/* Vyplaceno — TOGGLE */}
                    <td onClick={async () => {
                      const supabase = createClient();
                      await supabase.from("purchases").update({ paid_out: !row.paid_out }).eq("id", row.id);
                      loadData();
                    }} style={{ ...cellStyle(90), textAlign: "center", cursor: "pointer" }}>
                      <span style={{ fontSize: 11, padding: "2px 8px", borderRadius: 4, background: row.paid_out ? "#0a2a1a" : "#2a2a1a", color: row.paid_out ? "#34d399" : "#3a3a3a", fontWeight: 600 }}>
                        {row.paid_out ? "ANO" : "NIE"}
                      </span>
                    </td>

                    {/* Doručeno — TOGGLE */}
                    <td onClick={async () => {
                      const supabase = createClient();
                      await supabase.from("purchases").update({ delivered: !row.delivered }).eq("id", row.id);
                      loadData();
                    }} style={{ ...cellStyle(90), textAlign: "center", cursor: "pointer" }}>
                      <span style={{ fontSize: 11, padding: "2px 8px", borderRadius: 4, background: row.delivered ? "#0a2a1a" : "#1a1a1a", color: row.delivered ? "#34d399" : "#3a3a3a", fontWeight: 600 }}>
                        {row.delivered ? "ANO" : "NIE"}
                      </span>
                    </td>

                    {/* Poznámky */}
                    <EditableCell rowId={row.id} field="notes" value={row.notes} width={160} color="#525252" />
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Import Modal */}
      {showImport && (
        <>
          <div onClick={() => { setShowImport(false); setImportResult(null); }} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.75)", zIndex: 100, backdropFilter: "blur(4px)" }} />
          <div style={{
            position: "fixed", top: "50%", left: "50%", transform: "translate(-50%, -50%)", width: "100%", maxWidth: 520, maxHeight: "90vh", background: "#111111", border: "1px solid #2a2a2a", borderRadius: 20, zIndex: 101, overflow: "hidden", display: "flex", flexDirection: "column",
          }}>
            <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 1, background: "linear-gradient(90deg, transparent, #c0c0c0, transparent)" }} />
            <div style={{ padding: "1.5rem 2rem 1rem", borderBottom: "1px solid #1a1a1a", flexShrink: 0 }}>
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
                <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: "0.08em", color: "#525252", marginBottom: 8 }}>KROK 2 — NAHRÁJTE VYPLNĚNOU ŠABLONU</div>

                {importResult?.success ? (
                  <div style={{ padding: "12px", background: "#0a2a1a", border: "1px solid rgba(52,211,153,0.3)", borderRadius: 10, textAlign: "center" }}>
                    <div style={{ fontSize: "1.5rem", marginBottom: 6 }}>✅</div>
                    <p style={{ color: "#34d399", fontWeight: 600, fontSize: 14 }}>Importováno {importResult.success} nákupů!</p>
                  </div>
                ) : importResult?.error ? (
                  <div style={{ padding: "12px", background: "#2a0a0a", border: "1px solid rgba(248,113,113,0.3)", borderRadius: 10, textAlign: "center" }}>
                    <div style={{ fontSize: "1.5rem", marginBottom: 6 }}>❌</div>
                    <p style={{ color: "#f87171", fontWeight: 600, fontSize: 14 }}>{importResult.error}</p>
                  </div>
                ) : (
                  <label style={{
                    display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
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
                  background: "linear-gradient(135deg, #ffffff, #c0c0c0)",
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
          </div>
        </>
      )}

      {/* Add Purchase Modal */}
      {showModal && (
        <AddPurchaseModal
          accounts={accounts}
          onClose={() => setShowModal(false)}
          onSave={() => { setShowModal(false); loadData(); }}
        />
      )}
    </div>
  );
}
