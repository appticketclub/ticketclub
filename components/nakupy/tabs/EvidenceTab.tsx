"use client";
import { useState, useEffect, useRef } from "react";
import { createClient } from "@/lib/supabase/client";
import { EXCHANGES } from "@/lib/constants/exchanges";
import { useCurrency } from "@/lib/context/CurrencyContext";
import { AddPurchaseModal } from "./NakupyTab";
import { generateTicketSVG } from "./BanneryTab";

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
  quantity_sold: number;
};

const COLS = [
  { key: "event_date", label: "Datum\nnákupu", width: 100 },
  { key: "event_name", label: "Kapela", width: 200 },
  { key: "city", label: "Místo akce", width: 140 },
  { key: "event_actual_date", label: "Datum\nkoncertu", width: 100 },
  { key: "quantity", label: "Počet\nlístků", width: 80 },
  { key: "buy_total", label: "Nákupní cena\ncelkem", width: 130 },
  { key: "quantity_sold", label: "Prod.\nlístků", width: 80 },
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
  { key: "banner", label: "", width: 50 },
  { key: "delete", label: "", width: 40 },
];

export default function EvidenceTab() {
  const { format, currency, convert } = useCurrency();
  const [rows, setRows] = useState<EvidenceRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [accounts, setAccounts] = useState<any[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showImport, setShowImport] = useState(false);
  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] = useState<{ success?: number; error?: string; errors?: string[] } | null>(null);
  const [editingCell, setEditingCell] = useState<{ rowId: string; field: string } | null>(null);
  const [editValue, setEditValue] = useState("");
  const [bannerRow, setBannerRow] = useState<EvidenceRow | null>(null);
  const [downloadingBanner, setDownloadingBanner] = useState(false);
  const bannerRef = useRef<HTMLDivElement>(null);

  const [deleteConfirmRow, setDeleteConfirmRow] = useState<EvidenceRow | null>(null);
  const [deleting, setDeleting] = useState(false);

  const [saleUpdateModal, setSaleUpdateModal] = useState<{
    row: EvidenceRow;
    newQty: number;
  } | null>(null);
  const [saleUpdatePrice, setSaleUpdatePrice] = useState("");
  const [saleUpdateMode, setSaleUpdateMode] = useState<"add" | "subtract">("add");

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

    console.log("purchases:", purchases?.length);
    console.log("sales:", sales?.length);
    console.log("first sale:", sales?.[0]);

    const evidenceRows: EvidenceRow[] = (purchases ?? []).map(p => {
      const relatedSales = (sales ?? []).filter(s => s.purchase_id === p.id);
      const sellTotal = relatedSales.reduce((sum, s) => sum + (s.sell_price * s.quantity_sold), 0);
      const feesTotal = relatedSales.reduce((sum, s) => sum + (s.fees ?? 0), 0);
      const buyTotal = p.buy_price * p.quantity;
      const profit = sellTotal - feesTotal - buyTotal;
      const roi = buyTotal > 0 ? (profit / buyTotal) * 100 : 0;
      const lastSale = relatedSales.sort((a, b) => new Date(b.sold_at ?? "").getTime() - new Date(a.sold_at ?? "").getTime())[0];
      const quantitySold = relatedSales.reduce((sum, s) => sum + (s.quantity_sold ?? 0), 0);

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
        quantity_sold: quantitySold,
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

  async function handleDeletePurchase(row: EvidenceRow) {
    setDeleting(true);
    const supabase = createClient();
    await supabase.from("sales").delete().eq("purchase_id", row.id);
    await supabase.from("purchases").delete().eq("id", row.id);
    setDeleteConfirmRow(null);
    setDeleting(false);
    loadData();
  }

  // Totals
  const totalBuy = filtered.reduce((s, r) => s + convert(r.buy_price * r.quantity, r.currency as "EUR" | "CZK"), 0);
  const totalSell = filtered.reduce((s, r) => s + convert(r.sell_price_total, r.currency as "EUR" | "CZK"), 0);
  const totalProfit = filtered.reduce((s, r) => s + convert(r.profit, r.currency as "EUR" | "CZK"), 0);
  const avgRoi = filtered.length > 0 ? filtered.reduce((s, r) => s + r.roi, 0) / filtered.length : 0;
  const ticketsActive = filtered.filter(r => r.status === "active" || r.status === "partial").reduce((s, r) => s + (r.quantity_remaining ?? r.quantity), 0);
  const moneyOnWay = filtered.filter(r => r.status === "sold" && !r.paid_out).reduce((s, r) => s + convert(r.sell_price_total, r.currency as "EUR" | "CZK"), 0);

  const cellStyle = (width: number, isNum = false): React.CSSProperties => ({
    minWidth: width, maxWidth: width, width,
    padding: "0.6rem 0.75rem",
    fontSize: 12, color: "#ffffff",
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
        if (field === "sell_price_total") {
          const newSellTotal = Math.round(parseFloat(val.replace(",", ".")) * 100) / 100 || 0;
          const row = rows.find(r => r.id === rowId);
          if (!row) {
            setEditing(false);
            return;
          }

          // Check if sale exists
          const { data: existingSales } = await supabase
            .from("sales")
            .select("id, quantity_sold")
            .eq("purchase_id", rowId);

          if (existingSales && existingSales.length > 0) {
            const sale = existingSales[0];
            // Save sell_price as per ticket = total / quantity_sold, rounded
            const newSellPerTicket = Math.round((newSellTotal / (sale.quantity_sold || row.quantity)) * 100) / 100;
            await supabase.from("sales").update({
              sell_price: newSellPerTicket,
              updated_at: new Date().toISOString(),
            }).eq("id", sale.id);
          }

          // Update row in state immediately
          const buyTotal = row.buy_price * row.quantity;
          const newProfit = newSellTotal - buyTotal;
          const newRoi = buyTotal > 0 ? (newProfit / buyTotal) * 100 : 0;

          setRows(prev => prev.map(r => r.id === rowId ? {
            ...r,
            sell_price_total: newSellTotal, // exact value user typed
            profit: newProfit,
            roi: newRoi,
          } : r));
        } else {
          const row = rows.find(r => r.id === rowId);
          if (row) {
            const { data: sales } = await supabase.from("sales").select("id").eq("purchase_id", rowId).limit(1);
            if (sales?.[0]) {
              const updateData: any = {};
              if (field === "sold_at") updateData.sold_at = val ? new Date(val).toISOString() : null;
              if (field === "platform") updateData.platform = val || null;
              await supabase.from("sales").update(updateData).eq("id", sales[0].id);
            }
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
          color: color ?? "#ffffff",
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
        style={{ ...cellStyle(width), cursor: "text", color: color ?? "#ffffff" }} title="Klikněte pro úpravu"
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

  if (loading) return <div style={{ color: "#525252", fontSize: 14 }}>Načítání...</div>;

  return (
    <div>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1.5rem" }}>
        <div>
          <h1 style={{ fontSize: "1.5rem", fontWeight: 700, color: "#fff", marginBottom: "0.25rem" }}>Evidence</h1>
        </div>
      </div>

      {/* Search + actions bar */}
      <div style={{
        display: "flex",
        gap: "0.5rem",
        marginBottom: "1rem",
        alignItems: "center",
        flexWrap: "wrap" as const,
      }}>
        <input
          type="text"
          placeholder="Hledat..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          style={{
            padding: "0.6rem 1rem",
            width: 180,
            minWidth: 120,
            background: "#111111", border: "1px solid #1f1f1f",
            borderRadius: 10, color: "#fff", fontSize: 13,
            outline: "none",
          }}
        />
        <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}
          style={{ padding: "0.6rem 0.75rem", background: "#111111", border: "1px solid #1f1f1f", borderRadius: 10, color: "#fff", fontSize: 13, outline: "none", cursor: "pointer" }}>
          <option value="all">Všechny statusy</option>
          <option value="active">Aktivní</option>
          <option value="partial">Částečně prodáno</option>
          <option value="sold">Prodáno</option>
          <option value="cancelled">Zrušeno</option>
        </select>
        <select value={sortBy} onChange={e => setSortBy(e.target.value as any)}
          style={{ padding: "0.6rem 0.75rem", background: "#111111", border: "1px solid #1f1f1f", borderRadius: 10, color: "#fff", fontSize: 13, outline: "none", cursor: "pointer" }}>
          <option value="created_at">Datum nákupu</option>
          <option value="event_date">Datum akce</option>
          <option value="sold_at">Datum prodeje</option>
        </select>
        <button onClick={() => setSortDir(d => d === "asc" ? "desc" : "asc")}
          style={{ padding: "0.6rem 0.875rem", fontSize: 13, background: "#111111", border: "1px solid #1f1f1f", borderRadius: 10, color: "#ffffff", cursor: "pointer", whiteSpace: "nowrap" as const }}>
          {sortDir === "asc" ? "↑" : "↓"}
        </button>
        <button onClick={() => setShowFilters(!showFilters)}
          style={{ padding: "0.6rem 0.875rem", fontSize: 13, background: showFilters ? "#2a2a2a" : "#111111", border: "1px solid #1f1f1f", borderRadius: 10, color: "#ffffff", cursor: "pointer" }}>
          Filtry
        </button>
        <div style={{ marginLeft: "auto", display: "flex", gap: "0.5rem", flexWrap: "wrap" as const }}>
          <button onClick={() => setShowImport(true)}
            style={{ padding: "0.6rem 1rem", fontSize: 13, fontWeight: 600, background: "transparent", border: "1px solid #2a2a2a", borderRadius: 10, color: "#ffffff", cursor: "pointer", whiteSpace: "nowrap" as const }}>
            Import
          </button>
          <button onClick={() => setShowAddModal(true)}
            style={{ padding: "0.6rem 1rem", fontSize: 13, fontWeight: 700, background: "linear-gradient(135deg, #ffffff, #a0a0a0)", border: "none", borderRadius: 10, color: "#000", cursor: "pointer", whiteSpace: "nowrap" as const }}>
            + Přidat
          </button>
        </div>
      </div>

      {/* Advanced filters */}
      {showFilters && (
        <div style={{
          background: "#111111", border: "1px solid #1a1a1a",
          borderRadius: 12, padding: "1rem 1.25rem",
          marginBottom: "1rem",
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))",
          gap: "0.75rem",
        }}>
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

      {/* Summary bar */}
      <div style={{
        background: "#0a0a0a",
        border: "1px solid #1a1a1a",
        borderRadius: 12,
        padding: "0.75rem 1.25rem",
        marginBottom: "0.75rem",
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(120px, 1fr))",
        gap: "0.75rem",
      }}>
        {[
          { label: "NÁKUPŮ", value: `${filtered.length}`, color: "#fff" },
          { label: "LÍSTKŮ CELKEM", value: `${filtered.reduce((s, r) => s + r.quantity, 0)}×`, color: "#fff" },
          { label: "NÁKUP CELKEM", value: format(totalBuy, currency), color: "#ffffff" },
          { label: "PRODEJ CELKEM", value: format(totalSell, currency), color: "#34d399" },
          { label: "ZISK CELKEM", value: `${totalProfit >= 0 ? "+" : ""}${format(totalProfit, currency)}`, color: totalProfit >= 0 ? "#34d399" : "#f87171" },
          { label: "PRŮMĚRNÁ ZISKOVOST", value: `${avgRoi >= 0 ? "+" : ""}${avgRoi.toFixed(1)}%`, color: avgRoi >= 0 ? "#34d399" : "#f87171" },
          { label: "LÍSTKY V PRODEJI", value: `${ticketsActive}×`, color: "#fbbf24" },
          { label: "PENÍZE NA CESTĚ", value: format(moneyOnWay, currency), color: "#a78bfa" },
        ].map(s => (
          <div key={s.label} style={{ textAlign: "center" as const }}>
            <div style={{ fontSize: 9, color: "#ffffff", letterSpacing: "0.08em", marginBottom: 3 }}>{s.label}</div>
            <div style={{ fontSize: 13, fontWeight: 700, color: s.color }}>{s.value}</div>
          </div>
        ))}
      </div>

      {/* Table with own scrollbar */}
      <div style={{
        overflowX: "auto",
        overflowY: "auto",
        maxHeight: "calc(100vh - 340px)",
        borderRadius: 16,
        border: "1px solid #1a1a1a",
        scrollbarWidth: "thin" as const,
        scrollbarColor: "#2a2a2a #0a0a0a",
        WebkitOverflowScrolling: "touch",
      }}>
        <table style={{
          borderCollapse: "collapse",
          width: "max-content",
          minWidth: "100%",
          tableLayout: "auto",
        }}>
          {/* Header */}
          <thead style={{ position: "sticky", top: 0, zIndex: 10, background: "#0a0a0a" }}>
            <tr style={{ background: "#0a0a0a", borderBottom: "1px solid #1f1f1f" }}>
              {COLS.map(col => (
                <th key={col.key} style={{
                  ...cellStyle(col.width),
                  color: "#ffffff", fontWeight: 700,
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
                    <NumberCell
                      rowId={row.id}
                      field="quantity"
                      value={row.quantity}
                      width={80}
                      suffix="×"
                      onSave={async (rowId, _, val) => {
                        const supabase = createClient();
                        await supabase.from("purchases").update({
                          quantity: val,
                          quantity_remaining: Math.max(0, val - row.quantity_sold),
                          updated_at: new Date().toISOString(),
                        }).eq("id", rowId);
                        loadData();
                      }}
                    />

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

                    {/* Prod. — EDITABLE with dropdown */}
                    {editingCell?.rowId === row.id && editingCell?.field === "quantity_sold" ? (
                      <td style={{ ...cellStyle(80), padding: 0, background: "#1a1a2e" }}>
                        <select
                          autoFocus
                          value={editValue}
                          onChange={async e => {
                            const newQty = parseInt(e.target.value);
                            setEditValue(String(newQty));

                            // If decreasing — show modal with minus preselected
                            if (row.quantity_sold > 0 && newQty < row.quantity_sold) {
                              setEditingCell(null);
                              setSaleUpdatePrice("");
                              setSaleUpdateMode("subtract");
                              setSaleUpdateModal({ row, newQty });
                              return;
                            }

                            // If increasing — show modal with plus preselected
                            if (row.quantity_sold > 0 && newQty > row.quantity_sold) {
                              setEditingCell(null);
                              setSaleUpdatePrice("");
                              setSaleUpdateMode("add");
                              setSaleUpdateModal({ row, newQty });
                              return;
                            }

                            // If no previous sales — proceed normally
                            const supabase = createClient();
                            const { data: { user } } = await supabase.auth.getUser();
                            if (!user) return;

                            const { data: existingSales } = await supabase
                              .from("sales")
                              .select("id")
                              .eq("purchase_id", row.id)
                              .limit(1);

                            if (existingSales?.[0]) {
                              await supabase.from("sales").update({
                                quantity_sold: newQty,
                                updated_at: new Date().toISOString(),
                              }).eq("id", existingSales[0].id);
                            } else if (newQty > 0) {
                              await supabase.from("sales").insert({
                                user_id: user.id,
                                purchase_id: row.id,
                                quantity_sold: newQty,
                                sell_price: 0,
                                currency: row.currency,
                                sold_at: new Date().toISOString(),
                                fees: 0,
                              });
                            }

                            const newRemaining = Math.max(0, row.quantity - newQty);
                            const newStatus = newRemaining === 0 ? "sold" : newQty > 0 ? "partial" : "active";
                            await supabase.from("purchases").update({
                              status: newStatus,
                              quantity_remaining: newRemaining,
                              updated_at: new Date().toISOString(),
                            }).eq("id", row.id);

                            setEditingCell(null);
                            loadData();
                          }}
                          onBlur={() => setEditingCell(null)}
                          style={{ width: "100%", padding: "0.5rem", background: "#0d0d2a", border: "2px solid #7c3aed", color: "#fff", fontSize: 12, outline: "none" }}
                        >
                          {Array.from({ length: row.quantity + 1 }, (_, i) => (
                            <option key={i} value={i}>{i}/{row.quantity}</option>
                          ))}
                        </select>
                      </td>
                    ) : (
                      <td
                        onClick={() => {
                          setEditingCell({ rowId: row.id, field: "quantity_sold" });
                          setEditValue(String(row.quantity_sold));
                        }}
                        style={{ ...cellStyle(80), textAlign: "center", cursor: "pointer" }}
                        title="Klikněte pro úpravu"
                      >
                        <span style={{ fontSize: 12, color: row.quantity_sold > 0 ? "#34d399" : "#525252" }}>
                          {row.quantity_sold}/{row.quantity}
                        </span>
                      </td>
                    )}

                    {/* Prodejní cena celkem — EDITABLE */}
                    <EditableCell rowId={row.id} field="sell_price_total" value={row.sell_price_total > 0 ? row.sell_price_total.toFixed(2) : null} width={130} align="right" color={row.sell_price_total > 0 ? "#34d399" : "#3a3a3a"} />

                    {/* Celkový zisk — READ ONLY */}
                    <td style={{ ...cellStyle(120), textAlign: "right", color: row.profit >= 0 ? "#34d399" : "#f87171", fontWeight: 700, cursor: "default" }} title="Pouze pro čtení">
                      {row.sell_price_total > 0 ? `${row.profit >= 0 ? "+" : ""}${format(row.profit, row.currency as "EUR" | "CZK")}` : "—"}
                    </td>

                    {/* Ziskovost — READ ONLY */}
                    <td style={{ ...cellStyle(90), textAlign: "right", color: row.roi >= 0 ? "#34d399" : "#f87171", fontWeight: 600, cursor: "default" }} title="Pouze pro čtení">
                      {row.sell_price_total > 0 ? `${row.roi >= 0 ? "+" : ""}${row.roi.toFixed(1)}%` : "—"}
                    </td>

                    {/* Burza — DROPDOWN */}
                    <DropdownCell rowId={row.id} field="exchange" value={row.exchange} width={120} options={EXCHANGES} />

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

                    {/* Banner button */}
                    <td style={{ ...cellStyle(50), textAlign: "center" }}>
                      <button
                        onClick={() => setBannerRow(row)}
                        title="Vygenerovat banner"
                        style={{ background: "none", border: "none", cursor: "pointer", fontSize: 16, color: row.sell_price_total > 0 ? "#D4AF37" : "#3a3a3a", padding: 4 }}
                        disabled={row.sell_price_total <= 0}
                      >
                        🎟
                      </button>
                    </td>

                    {/* Delete button */}
                    <td style={{ ...cellStyle(40), textAlign: "center" }}>
                      <button
                        onClick={() => setDeleteConfirmRow(row)}
                        title="Smazat nákup"
                        style={{ background: "none", border: "none", cursor: "pointer", fontSize: 16, color: "#3a3a3a", padding: 4, transition: "color 0.2s" }}
                        onMouseEnter={e => (e.currentTarget.style.color = "#f87171")}
                        onMouseLeave={e => (e.currentTarget.style.color = "#3a3a3a")}
                      >
                        🗑
                      </button>
                    </td>
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
            <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 1, background: "linear-gradient(90deg, transparent, #ffffff, transparent)" }} />
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
                    borderRadius: 8, color: "#ffffff", textDecoration: "none",
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
                    <p style={{ color: "#34d399", fontWeight: 600, fontSize: 14 }}>Importováno {importResult.success} záznamů!</p>
                    {importResult.errors && importResult.errors.length > 0 && (
                      <div style={{ marginTop: "12px", padding: "10px", background: "#2a0a0a", border: "1px solid rgba(248,113,113,0.3)", borderRadius: 8 }}>
                        <p style={{ color: "#f87171", fontWeight: 600, fontSize: 13, marginBottom: "8px" }}>Chyby:</p>
                        <p style={{ color: "#fca5a5", fontSize: 12, whiteSpace: "pre-line" }}>{importResult.errors.join("\n")}</p>
                      </div>
                    )}
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
                            setImportResult({ success: data.imported, errors: data.errors });
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
                  background: "linear-gradient(135deg, #ffffff, #ffffff)",
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
      {showAddModal && (
        <AddPurchaseModal
          accounts={accounts}
          onClose={() => setShowAddModal(false)}
          onSave={() => { setShowAddModal(false); loadData(); }}
        />
      )}

      {/* Banner Modal */}
      {bannerRow && (
        <>
          <div onClick={() => setBannerRow(null)} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.85)", zIndex: 100, backdropFilter: "blur(8px)" }} />
          <div style={{
            position: "fixed", top: "50%", left: "50%",
            transform: "translate(-50%, -50%)",
            width: "100%", maxWidth: 720,
            background: "#111111", border: "1px solid #2a2a2a",
            borderRadius: 20, zIndex: 101,
            overflow: "hidden",
          }}>
            <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 1, background: "linear-gradient(90deg, transparent, #D4AF37, transparent)" }} />

            {/* Header */}
            <div style={{ padding: "1.25rem 1.5rem", borderBottom: "1px solid #1a1a1a", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div>
                <h2 style={{ fontSize: "1.1rem", fontWeight: 700, color: "#fff", margin: 0 }}>P&L Banner</h2>
                <p style={{ fontSize: 13, color: "#525252", marginTop: 2 }}>{bannerRow.event_name}</p>
              </div>
              <button onClick={() => setBannerRow(null)} style={{ background: "none", border: "none", color: "#525252", cursor: "pointer", fontSize: 22 }}>×</button>
            </div>

            {/* Banner preview */}
            <div ref={bannerRef} style={{ padding: "1rem" }}>
              <div style={{ width: "100%", aspectRatio: "8/3", overflow: "hidden", borderRadius: 8 }}>
                <div dangerouslySetInnerHTML={{ __html: generateTicketSVG({
                  eventName: bannerRow.event_name,
                  quantity: bannerRow.quantity,
                  buyPrice: bannerRow.buy_price * bannerRow.quantity,
                  sellPrice: bannerRow.sell_price_total,
                  profit: bannerRow.profit,
                  roi: bannerRow.roi,
                  currency: bannerRow.currency,
                }) }} style={{ width: "100%", height: "100%", lineHeight: 0 }} />
              </div>
            </div>

            {/* Actions */}
            <div style={{ padding: "1rem 1.5rem", borderTop: "1px solid #1a1a1a", display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem" }}>
              <button
                onClick={async () => {
                  setDownloadingBanner(true);
                  try {
                    const svgElement = bannerRef.current?.querySelector("svg");
                    if (!svgElement) return;

                    const svgData = new XMLSerializer().serializeToString(svgElement);
                    const svgBlob = new Blob([svgData], { type: "image/svg+xml;charset=utf-8" });

                    const url = URL.createObjectURL(svgBlob);
                    const img = new Image();
                    img.onload = () => {
                      const canvas = document.createElement("canvas");
                      canvas.width = 1280;
                      canvas.height = 480;
                      const ctx = canvas.getContext("2d")!;
                      ctx.fillStyle = "#111111";
                      ctx.fillRect(0, 0, 1280, 480);
                      ctx.drawImage(img, 0, 0, 1280, 480);
                      URL.revokeObjectURL(url);
                      canvas.toBlob((blob) => {
                        if (!blob) return;
                        const a = document.createElement("a");
                        a.href = URL.createObjectURL(blob);
                        const safeName = bannerRow.event_name.replace(/\s+/g, "-").toLowerCase();
                        a.download = `${safeName}-banner.png`;
                        a.click();
                        URL.revokeObjectURL(a.href);
                      });
                    };
                    img.src = url;
                  } catch (e) { console.error(e); }
                  setDownloadingBanner(false);
                }}
                disabled={downloadingBanner}
                style={{ padding: "0.8rem", background: "transparent", border: "1px solid #2a2a2a", borderRadius: 10, color: "#ffffff", cursor: "pointer", fontSize: 13, fontWeight: 600 }}
              >
                {downloadingBanner ? "⏳ Sťahujem..." : "⬇ Stáhnout"}
              </button>
              <button
                onClick={async () => {
                  try {
                    const svgElement = bannerRef.current?.querySelector("svg");
                    if (!svgElement) return;

                    const svgData = new XMLSerializer().serializeToString(svgElement);
                    const svgBlob = new Blob([svgData], { type: "image/svg+xml;charset=utf-8" });

                    const url = URL.createObjectURL(svgBlob);
                    const img = new Image();
                    img.onload = async () => {
                      const canvas = document.createElement("canvas");
                      canvas.width = 1280;
                      canvas.height = 480;
                      const ctx = canvas.getContext("2d")!;
                      ctx.fillStyle = "#111111";
                      ctx.fillRect(0, 0, 1280, 480);
                      ctx.drawImage(img, 0, 0, 1280, 480);
                      URL.revokeObjectURL(url);
                      canvas.toBlob(async (blob) => {
                        if (!blob) return;
                        const safeName = bannerRow.event_name.replace(/\s+/g, "-").toLowerCase();
                        const file = new File([blob], `${safeName}-banner.png`, { type: "image/png" });
                        if (navigator.share && navigator.canShare({ files: [file] })) {
                          await navigator.share({ files: [file], title: bannerRow.event_name });
                        } else {
                          const url = URL.createObjectURL(blob);
                          window.open(url, "_blank");
                        }
                      });
                    };
                    img.src = url;
                  } catch (e) { console.error(e); }
                }}
                style={{ padding: "0.8rem", background: "linear-gradient(135deg, #D4AF37, #b8960f)", border: "none", borderRadius: 10, color: "#000", cursor: "pointer", fontSize: 13, fontWeight: 700 }}
              >
                ↗ Zdieľať
              </button>
            </div>
          </div>
        </>
      )}

      {/* Sale Update Modal */}
      {saleUpdateModal && (() => {
        const { row, newQty } = saleUpdateModal;
        const currentProfit = row.profit;
        const additionalQty = newQty - row.quantity_sold;
        const additionalPrice = parseFloat(saleUpdatePrice.replace(",", ".")) || 0;
        const newSellTotal = row.sell_price_total + (saleUpdateMode === "add" ? additionalPrice : -additionalPrice);
        const newProfit = newSellTotal - (row.buy_price * row.quantity);
        const profitDiff = newProfit - currentProfit;

        return (
          <>
            <div
              onClick={() => setSaleUpdateModal(null)}
              style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.8)", zIndex: 200, backdropFilter: "blur(4px)" }}
            />
            <div style={{
              position: "fixed", top: "50%", left: "50%",
              transform: "translate(-50%, -50%)",
              width: "100%", maxWidth: 420,
              background: "#111111", border: "1px solid #2a2a2a",
              borderRadius: 20, zIndex: 201, overflow: "hidden",
            }}>
              <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 1, background: "linear-gradient(90deg, transparent, #ffffff, transparent)" }} />

              {/* Header */}
              <div style={{ padding: "1.25rem 1.5rem", borderBottom: "1px solid #1a1a1a", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div>
                  <h2 style={{ fontSize: "1rem", fontWeight: 700, color: "#fff", margin: 0 }}>Aktualizovat prodej</h2>
                  <p style={{ fontSize: 13, color: "#525252", marginTop: 2 }}>{row.event_name}</p>
                </div>
                <button onClick={() => setSaleUpdateModal(null)} style={{ background: "none", border: "none", color: "#525252", cursor: "pointer", fontSize: 22 }}>×</button>
              </div>

              <div style={{ padding: "1.5rem" }}>
                {/* Sale history */}
                <div style={{ background: "#0a0a0a", border: "1px solid #1a1a1a", borderRadius: 12, padding: "1rem", marginBottom: "1.25rem" }}>
                  <div style={{ fontSize: 10, color: "#525252", letterSpacing: "0.08em", marginBottom: 8 }}>HISTORIE PRODEJŮ</div>
                  {row.quantity_sold > 0 ? (
                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                      <span style={{ fontSize: 13, color: "#888" }}>Předchozí:</span>
                      <span style={{ fontSize: 14, fontWeight: 700, color: "#fff" }}>{row.quantity_sold}× lístků</span>
                      <span style={{ fontSize: 13, color: "#525252" }}>za</span>
                      <span style={{ fontSize: 14, fontWeight: 700, color: "#34d399" }}>{row.sell_price_total.toFixed(2)} {row.currency}</span>
                    </div>
                  ) : (
                    <div style={{ fontSize: 13, color: "#525252" }}>Žádné předchozí prodeje</div>
                  )}
                  <div style={{ borderTop: "1px solid #1a1a1a", marginTop: 8, paddingTop: 8, display: "flex", alignItems: "center", gap: 8 }}>
                    <span style={{ fontSize: 13, color: "#888" }}>Přidáváte:</span>
                    <span style={{ fontSize: 14, fontWeight: 700, color: "#c9a227" }}>+{additionalQty}× lístků</span>
                    <span style={{ fontSize: 13, color: "#525252" }}>· Celkem prodáno:</span>
                    <span style={{ fontSize: 14, fontWeight: 700, color: "#fff" }}>{newQty}/{row.quantity}</span>
                  </div>
                </div>

                {/* Price input */}
                <div style={{ marginBottom: "1rem" }}>
                  <div style={{ fontSize: 11, color: "#525252", letterSpacing: "0.08em", marginBottom: 8 }}>CENA ZA NOVÉ LÍSTKY</div>
                  <div style={{ display: "flex", gap: "0.5rem" }}>
                    <button
                      onClick={() => setSaleUpdateMode("add")}
                      style={{
                        padding: "0.6rem 1rem", fontSize: 16, fontWeight: 700,
                        background: saleUpdateMode === "add" ? "#34d399" : "#1a1a1a",
                        border: "1px solid #2a2a2a", borderRadius: 8,
                        color: saleUpdateMode === "add" ? "#000" : "#525252",
                        cursor: "pointer", minWidth: 44,
                      }}
                    >+</button>
                    <button
                      onClick={() => setSaleUpdateMode("subtract")}
                      style={{
                        padding: "0.6rem 1rem", fontSize: 16, fontWeight: 700,
                        background: saleUpdateMode === "subtract" ? "#f87171" : "#1a1a1a",
                        border: "1px solid #2a2a2a", borderRadius: 8,
                        color: saleUpdateMode === "subtract" ? "#000" : "#525252",
                        cursor: "pointer", minWidth: 44,
                      }}
                    >−</button>
                    <input
                      autoFocus
                      type="number"
                      placeholder="0.00"
                      value={saleUpdatePrice}
                      onChange={e => setSaleUpdatePrice(e.target.value)}
                      style={{
                        flex: 1, padding: "0.6rem 1rem",
                        background: "#0a0a0a", border: "1px solid #2a2a2a",
                        borderRadius: 8, color: "#fff", fontSize: 16,
                        fontWeight: 600, outline: "none",
                        textAlign: "right",
                      }}
                    />
                    <div style={{ padding: "0.6rem 0.75rem", background: "#0a0a0a", border: "1px solid #2a2a2a", borderRadius: 8, color: "#525252", fontSize: 13, display: "flex", alignItems: "center" }}>
                      {row.currency}
                    </div>
                  </div>
                </div>

                {/* Preview */}
                {additionalPrice > 0 && (
                  <div style={{ background: "#0a0a0a", border: "1px solid #1a1a1a", borderRadius: 12, padding: "1rem", marginBottom: "1.25rem" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                      <span style={{ fontSize: 12, color: "#525252" }}>Nový zisk celkem</span>
                      <span style={{ fontSize: 13, fontWeight: 700, color: newProfit >= 0 ? "#34d399" : "#f87171" }}>
                        {newProfit >= 0 ? "+" : ""}{newProfit.toFixed(2)} {row.currency}
                      </span>
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between" }}>
                      <span style={{ fontSize: 12, color: "#525252" }}>Změna</span>
                      <span style={{ fontSize: 13, fontWeight: 700, color: profitDiff >= 0 ? "#34d399" : "#f87171" }}>
                        {profitDiff >= 0 ? "+" : ""}{profitDiff.toFixed(2)} {row.currency}
                      </span>
                    </div>
                  </div>
                )}

                {/* Buttons */}
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem" }}>
                  <button
                    onClick={() => setSaleUpdateModal(null)}
                    style={{ padding: "0.8rem", background: "transparent", border: "1px solid #2a2a2a", borderRadius: 10, color: "#525252", cursor: "pointer", fontSize: 13 }}
                  >
                    Zrušit
                  </button>
                  <button
                    onClick={async () => {
                      const supabase = createClient();
                      const { data: { user } } = await supabase.auth.getUser();
                      if (!user) return;

                      const newSellTotalFinal = row.sell_price_total + (saleUpdateMode === "add" ? additionalPrice : -additionalPrice);
                      const { data: existingSales } = await supabase
                        .from("sales")
                        .select("id, quantity_sold")
                        .eq("purchase_id", row.id)
                        .limit(1);

                      if (existingSales?.[0]) {
                        const newSellPerTicket = newSellTotalFinal / newQty;
                        await supabase.from("sales").update({
                          quantity_sold: newQty,
                          sell_price: Math.round(newSellPerTicket * 100) / 100,
                          updated_at: new Date().toISOString(),
                        }).eq("id", existingSales[0].id);
                      }

                      const newRemaining = Math.max(0, row.quantity - newQty);
                      const newStatus = newRemaining === 0 ? "sold" : newQty > 0 ? "partial" : "active";
                      await supabase.from("purchases").update({
                        status: newStatus,
                        quantity_remaining: newRemaining,
                        updated_at: new Date().toISOString(),
                      }).eq("id", row.id);

                      setSaleUpdateModal(null);
                      loadData();
                    }}
                    style={{
                      padding: "0.8rem",
                      background: "linear-gradient(135deg, #ffffff, #ffffff)",
                      border: "none", borderRadius: 10,
                      color: "#000", cursor: "pointer",
                      fontSize: 13, fontWeight: 700,
                    }}
                  >
                    Uložit
                  </button>
                </div>
              </div>
            </div>
          </>
        );
      })()}

      {/* Delete confirm modal */}
      {deleteConfirmRow && (
        <>
          <div
            onClick={() => setDeleteConfirmRow(null)}
            style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.8)", zIndex: 300, backdropFilter: "blur(4px)" }}
          />
          <div style={{
            position: "fixed", top: "50%", left: "50%",
            transform: "translate(-50%, -50%)",
            width: "100%", maxWidth: 400,
            background: "#111111", border: "1px solid #2a2a2a",
            borderRadius: 20, zIndex: 301, overflow: "hidden",
          }}>
            <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 1, background: "linear-gradient(90deg, transparent, #f87171, transparent)" }} />

            <div style={{ padding: "1.5rem" }}>
              <div style={{ fontSize: 32, marginBottom: "0.75rem", textAlign: "center" }}>🗑</div>
              <h2 style={{ fontSize: "1rem", fontWeight: 700, color: "#fff", margin: 0, marginBottom: "0.5rem", textAlign: "center" }}>
                Smazat nákup?
              </h2>
              <p style={{ fontSize: 13, color: "#525252", textAlign: "center", marginBottom: "1.5rem" }}>
                <strong style={{ color: "#fff" }}>{deleteConfirmRow.event_name}</strong>
                <br />
                Tato akce je nevratná. Smažou se i všechny prodeje spojené s tímto nákupem.
              </p>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem" }}>
                <button
                  onClick={() => setDeleteConfirmRow(null)}
                  style={{ padding: "0.8rem", background: "transparent", border: "1px solid #2a2a2a", borderRadius: 10, color: "#525252", cursor: "pointer", fontSize: 13 }}
                >
                  Zrušit
                </button>
                <button
                  onClick={() => handleDeletePurchase(deleteConfirmRow)}
                  disabled={deleting}
                  style={{ padding: "0.8rem", background: "linear-gradient(135deg, #f87171, #dc2626)", border: "none", borderRadius: 10, color: "#fff", cursor: "pointer", fontSize: 13, fontWeight: 700 }}
                >
                  {deleting ? "Mažu..." : "Smazat"}
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
