"use client";
import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { useCurrency } from "@/lib/context/CurrencyContext";

type Sale = {
  id: string;
  purchase_id: string;
  quantity_sold: number;
  sell_price: number;
  fees: number;
  platform: string | null;
  sold_at: string;
  notes: string | null;
  currency: string;
  purchases: {
    event_name: string;
    buy_price: number;
    city: string | null;
    event_actual_date: string | null;
    event_date: string | null;
    created_at: string | null;
    account_ref: string | null;
    venue: string | null;
    exchange: string | null;
    ticket_type_custom: string | null;
    notes: string | null;
    delivered: boolean;
    paid_out: boolean;
  }[] | null;
};

export default function ProdejeTab() {
  const [sales, setSales] = useState<Sale[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [editSale, setEditSale] = useState<Sale | null>(null);
  const [detailSale, setDetailSale] = useState<Sale | null>(null);
  const { format, currency, convert } = useCurrency();

  async function loadSales() {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data } = await  supabase
      .from("sales")
      .select("id, purchase_id, quantity_sold, sell_price, fees, platform, sold_at, notes, currency, purchases(event_name, buy_price, city, event_actual_date, event_date, created_at, account_ref, venue, exchange, ticket_type_custom, notes, delivered, paid_out)")
      .eq("user_id", user.id)
      .order("sold_at", { ascending: false });

    setSales(data ?? []);
    setLoading(false);
  }

  useEffect(() => { loadSales(); }, []);

  const filtered = sales.filter(s => {
    const purchase = Array.isArray(s.purchases) ? s.purchases[0] : s.purchases;
    return !search || purchase?.event_name.toLowerCase().includes(search.toLowerCase());
  });

  const totalProfit = sales.reduce((sum, s) => {
    const purchase = Array.isArray(s.purchases) ? s.purchases[0] : s.purchases;
    const revenue = s.sell_price * s.quantity_sold;
    const cost = (purchase?.buy_price ?? 0) * s.quantity_sold;
    const fees = s.fees ?? 0;
    const profit = revenue - cost - fees;
    const convertedProfit = convert(profit, s.currency as "EUR" | "CZK");
    return sum + convertedProfit;
  }, 0);

  const totalRevenue = sales.reduce((sum, s) => {
    const revenue = s.sell_price * s.quantity_sold;
    const convertedRevenue = convert(revenue, s.currency as "EUR" | "CZK");
    return sum + convertedRevenue;
  }, 0);

  if (loading) return <div style={{ color: "#525252", fontSize: 14 }}>Načítání...</div>;

  return (
    <div>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1.75rem" }}>
        <div>
          <h1 style={{ fontSize: "1.5rem", fontWeight: 700, color: "#fff", marginBottom: "0.25rem" }}>Prodeje</h1>
          <p style={{ fontSize: 13, color: "#3a3a3a" }}>Historie všech uzavřených prodejů</p>
        </div>
        {/* Summary */}
        <div style={{ display: "flex", gap: "1rem" }}>
          {[
            { label: "Celkem prodejů", value: sales.length },
            { label: "Celkový příjem", value: format(totalRevenue, currency), color: "#c0c0c0" },
            { label: "Celkový zisk", value: format(totalProfit, currency), color: totalProfit >= 0 ? "#34d399" : "#f87171" },
          ].map(s => (
            <div key={s.label} style={{ background: "#111111", border: "1px solid #1a1a1a", borderRadius: 12, padding: "0.75rem 1.25rem", textAlign: "center" as const }}>
              <div style={{ fontSize: 11, color: "#3a3a3a", marginBottom: 4 }}>{s.label}</div>
              <div style={{ fontSize: 16, fontWeight: 700, color: (s as any).color ?? "#fff" }}>{s.value}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Search */}
      <div style={{ marginBottom: "1rem" }}>
        <input
          type="text"
          placeholder="Hledat podle názvu akce..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          style={{
            width: "100%", maxWidth: 320, padding: "0.6rem 1rem",
            background: "#111111", border: "1px solid #1f1f1f",
            borderRadius: 10, color: "#fff", fontSize: 14,
            outline: "none", boxSizing: "border-box" as const,
          }}
        />
      </div>

      {/* Table */}
      {filtered.length === 0 ? (
        <div style={{ background: "#111111", border: "1px dashed #2a2a2a", borderRadius: 16, padding: "3rem", textAlign: "center" as const }}>
          <p style={{ color: "#525252", fontSize: 14 }}>Žádné prodeje zatím</p>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
          {/* Header */}
          <div style={{
            display: "grid",
            gridTemplateColumns: "2fr 1fr 1fr 1fr 1fr 1fr 80px 1fr 80px",
            padding: "0.5rem 1.5rem",
            gap: "1rem",
          }}>
            {[ 
              { label: "NÁZEV AKCE" }, 
              { label: "MÍSTO AKCE" }, 
              { label: "DATUM\nNÁKUPU" }, 
              { label: "DATUM\nAKCE" }, 
              { label: "DATUM\nPRODEJE" }, 
              { label: "ÚČET" }, 
              { label: "POČET" }, 
              { label: "PRODEJNÍ CENA" }, 
              { label: "" }, 
            ].map(h => (
              <div key={h.label} style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.08em", color: "#707070", whiteSpace: "pre-line" as const, lineHeight: 1.3 }}>
                {h.label}
              </div>
            ))}
          </div>

          {/* Rows */}
          {filtered.map(sale => {
            const purchase = Array.isArray(sale.purchases) ? sale.purchases[0] : sale.purchases;
            const revenue = sale.sell_price * sale.quantity_sold;
            const cost = (purchase?.buy_price ?? 0) * sale.quantity_sold;
            const profit = revenue - (sale.fees ?? 0) - cost;
            const roi = cost > 0 ? (profit / cost) * 100 : 0;
            const isProfit = profit >= 0;

            return (
              <div
                key={sale.id}
                onClick={() => setDetailSale(sale)}
                style={{
                  display: "grid",
                  gridTemplateColumns: "2fr 1fr 1fr 1fr 1fr 1fr 80px 1fr 80px",
                  padding: "0.875rem 1.5rem",
                  background: "#111111",
                  border: "1px solid #1a1a1a",
                  borderRadius: 12,
                  alignItems: "center",
                  gap: "1rem",
                  transition: "border-color 0.15s",
                  cursor: "pointer",
                }}
                onMouseEnter={e => (e.currentTarget as HTMLDivElement).style.borderColor = "#2a2a2a"}
                onMouseLeave={e => (e.currentTarget as HTMLDivElement).style.borderColor = "#1a1a1a"}
              >
                {/* 1. Event name */}
                <div>
                  <div style={{ fontWeight: 600, color: "#fff", fontSize: 14 }}>{purchase?.event_name ?? "—"}</div>
                </div>

                {/* 2. Místo akce */}
                <div style={{ fontSize: 13, color: "#525252" }}>{purchase?.city ?? "—"}</div>

                {/* 3. Datum nákupu */}
                <div style={{ fontSize: 12, color: "#525252" }}>
                  {purchase?.created_at
                    ? new Date(purchase.created_at).toLocaleDateString("cs-CZ")
                    : "—"}
                </div>

                {/* 4. Datum akce */}
                <div style={{ fontSize: 12, color: "#525252" }}>
                  {purchase?.event_actual_date
                    ? new Date(purchase.event_actual_date).toLocaleDateString("cs-CZ")
                    : "—"}
                </div>

                {/* 5. Datum prodeje */}
                <div style={{ fontSize: 12, color: "#525252" }}>
                  {sale.sold_at ? new Date(sale.sold_at).toLocaleDateString("cs-CZ") : "—"}
                </div>

                {/* 6. Účet */}
                <div style={{ fontSize: 12, color: "#525252" }}>
                  {purchase?.account_ref ?? "—"}
                </div>

                {/* 7. Počet */}
                <div style={{ fontSize: 13, color: "#c0c0c0" }}>{sale.quantity_sold}×</div>

                {/* 8. Prodejní cena + ROI */}
                <div>
                  <div style={{ fontSize: 15, fontWeight: 700, color: "#34d399" }}>
                    {format(revenue, sale.currency as "EUR" | "CZK")}
                  </div>
                  <div style={{ fontSize: 11, color: isProfit ? "#34d399" : "#f87171", marginTop: 2, fontWeight: 600 }}>
                    {isProfit ? "+" : ""}{roi.toFixed(1)}% ROI
                  </div>
                </div>

                {/* 9. Actions */}
                <div style={{ display: "flex", justifyContent: "flex-end", gap: 4 }}>
                  <button
                    onClick={e => { e.stopPropagation(); setEditSale(sale); }}
                    style={{ background: "none", border: "none", color: "#3a3a3a", cursor: "pointer", fontSize: 14, padding: 4 }}
                    onMouseEnter={e => (e.currentTarget as HTMLButtonElement).style.color = "#c0c0c0"}
                    onMouseLeave={e => (e.currentTarget as HTMLButtonElement).style.color = "#3a3a3a"}
                  >✎</button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Edit Sale Modal */}
      {editSale && (
        <EditSaleModal
          sale={editSale}
          onClose={() => setEditSale(null)}
          onSave={() => { setEditSale(null); loadSales(); }}
        />
      )}

      {/* Detail Modal */}
      {detailSale && (
        <>
          <div onClick={() => setDetailSale(null)} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.75)", zIndex: 100, backdropFilter: "blur(4px)" }} />
          <div style={{
            position: "fixed", top: "50%", left: "50%",
            transform: "translate(-50%, -50%)",
            width: "100%", maxWidth: 520,
            maxHeight: "90vh",
            background: "#111111", border: "1px solid #2a2a2a",
            borderRadius: 20, zIndex: 101,
            overflow: "hidden", display: "flex", flexDirection: "column",
          }}>
            <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 1, background: "linear-gradient(90deg, transparent, #34d399, transparent)" }} />

            {/* Header */}
            <div style={{ padding: "1.5rem 2rem 1rem", borderBottom: "1px solid #1a1a1a", flexShrink: 0 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                <div>
                  <h2 style={{ fontSize: "1.15rem", fontWeight: 700, color: "#fff", margin: 0, marginBottom: 6 }}>
                    {(Array.isArray(detailSale.purchases) ? detailSale.purchases[0] : detailSale.purchases)?.event_name}
                  </h2>
                  <div style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "2px 10px", borderRadius: 6, background: "#0a2a1a", color: "#34d399", fontSize: 11, fontWeight: 600 }}>
                    ✓ Prodáno
                  </div>
                </div>
                <button onClick={() => setDetailSale(null)} style={{ background: "none", border: "none", color: "#525252", cursor: "pointer", fontSize: 22 }}>×</button>
              </div>
            </div>

            {/* Content */}
            <div style={{ overflowY: "auto", flex: 1, padding: "1.25rem 2rem" }}>
              {(() => {
                const purchase = Array.isArray(detailSale.purchases) ? detailSale.purchases[0] : detailSale.purchases;
                const revenue = detailSale.sell_price * detailSale.quantity_sold;
                const cost = (purchase?.buy_price ?? 0) * detailSale.quantity_sold;
                const profit = revenue - (detailSale.fees ?? 0) - cost;
                const roi = cost > 0 ? (profit / cost) * 100 : 0;
                const isProfit = profit >= 0;

                return (
                  <>
                    {/* Price highlight */}
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "0.75rem", marginBottom: "1.25rem" }}>
                      {[
                        { label: "Prodejní cena/ks", value: format(detailSale.sell_price, detailSale.currency as "EUR" | "CZK"), color: "#34d399" },
                        { label: "Počet", value: `${detailSale.quantity_sold}×`, color: "#c0c0c0" },
                        { label: "Celkem", value: format(revenue, detailSale.currency as "EUR" | "CZK"), color: "#34d399" },
                      ].map(card => (
                        <div key={card.label} style={{ background: "#0a0a0a", border: "1px solid #1f1f1f", borderRadius: 10, padding: "0.875rem", textAlign: "center" as const }}>
                          <div style={{ fontSize: 10, color: "#525252", marginBottom: 4 }}>{card.label}</div>
                          <div style={{ fontSize: 14, fontWeight: 700, color: card.color }}>{card.value}</div>
                        </div>
                      ))}
                    </div>

                    {/* P&L */}
                    <div style={{ padding: "1rem", background: isProfit ? "rgba(52,211,153,0.06)" : "rgba(248,113,113,0.06)", border: `1px solid ${isProfit ? "rgba(52,211,153,0.2)" : "rgba(248,113,113,0.2)"}`, borderRadius: 12, marginBottom: "1.25rem", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <div>
                        <div style={{ fontSize: 11, color: "#525252", marginBottom: 4 }}>ČISTÝ ZISK</div>
                        <div style={{ fontSize: 22, fontWeight: 800, color: isProfit ? "#34d399" : "#f87171" }}>
                          {isProfit ? "+" : ""}{format(profit, detailSale.currency as "EUR" | "CZK")}
                        </div>
                      </div>
                      <div style={{ textAlign: "right" as const }}>
                        <div style={{ fontSize: 11, color: "#525252", marginBottom: 4 }}>ROI</div>
                        <div style={{ fontSize: 22, fontWeight: 800, color: isProfit ? "#34d399" : "#f87171" }}>
                          {isProfit ? "+" : ""}{roi.toFixed(1)}%
                        </div>
                      </div>
                    </div>

                    {/* Details */}
                    <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
                      {[
                        { label: "Nákupní cena / ks", value: purchase?.buy_price ? format(purchase.buy_price, detailSale.currency as "EUR" | "CZK") : null },
                        { label: "Místo akce", value: purchase?.city },
                        { label: "Datum akce", value: purchase?.event_actual_date ? new Date(purchase.event_actual_date).toLocaleDateString("cs-CZ") : null },
                        { label: "Datum prodeje", value: detailSale.sold_at ? new Date(detailSale.sold_at).toLocaleDateString("cs-CZ") : null },
                        { label: "Platforma", value: detailSale.platform },
                        { label: "Účet", value: purchase?.account_ref },
                        { label: "Poplatky", value: detailSale.fees ? format(detailSale.fees, detailSale.currency as "EUR" | "CZK") : null },
                        { label: "Poznámky", value: detailSale.notes },
                      ].filter(r => r.value).map((row, i, arr) => (
                        <div key={row.label} style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", padding: "0.65rem 0", borderBottom: i < arr.length - 1 ? "1px solid #141414" : "none" }}>
                          <span style={{ fontSize: 12, color: "#525252" }}>{row.label}</span>
                          <span style={{ fontSize: 13, fontWeight: 500, color: "#c0c0c0", textAlign: "right" as const, maxWidth: "60%" }}>{row.value}</span>
                        </div>
                      ))}
                    </div>
                  </>
                );
              })()}
            </div>

            {/* Footer */}
            <div style={{ padding: "1rem 2rem", borderTop: "1px solid #1a1a1a", flexShrink: 0, display: "flex", gap: "0.75rem" }}>
              <button 
                onClick={() => { setEditSale(detailSale); setDetailSale(null); }}
                style={{ flex: 1, padding: "0.75rem", background: "transparent", border: "1px solid #2a2a2a", borderRadius: 10, color: "#c0c0c0", cursor: "pointer", fontSize: 13, fontWeight: 600 }}
              >✎ Upravit</button>
              <button 
                onClick={() => setDetailSale(null)}
                style={{ flex: 1, padding: "0.75rem", background: "linear-gradient(135deg, #34d399, #059669)", border: "none", borderRadius: 10, color: "#000", cursor: "pointer", fontSize: 13, fontWeight: 700 }}
              >Zavřít</button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

function EditSaleModal({ sale, onClose, onSave }: { sale: Sale; onClose: () => void; onSave: () => void }) {
  const supabase = createClient();

  // Sale states
  const [sellPrice, setSellPrice] = useState(String(sale.sell_price));
  const [quantitySold, setQuantitySold] = useState(String(sale.quantity_sold));
  const [platform, setPlatform] = useState(sale.platform ?? "");
  const [customPlatform, setCustomPlatform] = useState("");
  const [notes, setNotes] = useState(sale.notes ?? "");
  const [soldAt, setSoldAt] = useState(sale.sold_at ? sale.sold_at.split("T")[0] : "");
  const [fees, setFees] = useState(String(sale.fees ?? 0));

  // Purchase states (editable)
  const purchase = Array.isArray(sale.purchases) ? sale.purchases[0] : sale.purchases;
  const [eventName, setEventName] = useState(purchase?.event_name ?? "");
  const [city, setCity] = useState(purchase?.city ?? "");
  const [eventDate, setEventDate] = useState(purchase?.event_date ?? "");
  const [eventActualDate, setEventActualDate] = useState(purchase?.event_actual_date ?? "");
  const [sector, setSector] = useState(purchase?.venue ?? "");
  const [exchange, setExchange] = useState(purchase?.exchange ?? "");
  const [customExchange, setCustomExchange] = useState("");
  const [ticketType, setTicketType] = useState(purchase?.ticket_type_custom ?? "");
  const [accountRef, setAccountRef] = useState(purchase?.account_ref ?? "");
  const [buyPrice, setBuyPrice] = useState(String(purchase?.buy_price ?? ""));
  const [purchaseNotes, setPurchaseNotes] = useState(purchase?.notes ?? "");
  const [delivered, setDelivered] = useState(purchase?.delivered ?? false);
  const [paidOut, setPaidOut] = useState(purchase?.paid_out ?? false);

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [activeSection, setActiveSection] = useState<"sale" | "purchase">("sale");

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
  const toggleStyle = (active: boolean) => ({
    flex: 1, padding: "7px", fontSize: 12, fontWeight: 600 as const,
    background: active ? "linear-gradient(135deg, #ffffff, #a0a0a0)" : "transparent",
    border: active ? "none" : "1px solid #2a2a2a",
    borderRadius: 8, color: active ? "#000" : "#525252",
    cursor: "pointer" as const,
  });

  async function handleSave() {
    setSaving(true);
    setError("");

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const newSellPrice = parseFloat(sellPrice.replace(",", ".")) || 0;
    const newQty = parseInt(quantitySold) || 1;
    const newFees = parseFloat(fees.replace(",", ".")) || 0;
    const newBuyPricePerTicket = parseFloat(buyPrice.replace(",", ".")) || 0;

    // Calculate changes
    const oldRevenue = sale.sell_price * sale.quantity_sold;
    const oldCost = (purchase?.buy_price ?? 0) * sale.quantity_sold;
    
    const newRevenue = newSellPrice * newQty;
    const newCost = newBuyPricePerTicket * newQty;

    // Total change in capital = (newRevenue - oldRevenue) - (newCost - oldCost)
    // Because:
    // - We originally subtracted oldCost when we made the purchase
    // - We originally added oldRevenue when we made the sale
    // - Now we want to adjust to subtract newCost and add newRevenue
    const capitalChange = (newRevenue - oldRevenue) - (newCost - oldCost);

    // Update sale
    const { error: saleErr } = await supabase.from("sales").update({
      sell_price: newSellPrice,
      quantity_sold: newQty,
      fees: newFees,
      platform: platform === "Jiné" ? (customPlatform || "Jiné") : (platform || null),
      notes: notes || null,
      sold_at: soldAt ? new Date(soldAt).toISOString() : sale.sold_at,
      updated_at: new Date().toISOString(),
    }).eq("id", sale.id);

    if (saleErr) { setError(saleErr.message); setSaving(false); return; }

    // Update purchase
    if (sale.purchase_id) {
      await supabase.from("purchases").update({
        event_name: eventName.trim(),
        city: city.trim() || null,
        event_date: eventDate || null,
        event_actual_date: eventActualDate || null,
        venue: sector.trim() || null,
        exchange: exchange === "Jiné" ? (customExchange || "Jiné") : (exchange || null),
        ticket_type_custom: ticketType || null,
        account_ref: accountRef || null,
        buy_price: newBuyPricePerTicket,
        notes: purchaseNotes.trim() || null,
        delivered,
        paid_out: paidOut,
        updated_at: new Date().toISOString(),
      }).eq("id", sale.purchase_id);
    }

    // Update capital
    if (capitalChange !== 0) {
      const { data: profile } = await supabase.from("profiles").select("capital").eq("id", user.id).single();
      if (profile) {
        const newCapital = (profile.capital ?? 0) + capitalChange;
        await supabase.from("profiles").update({ capital: newCapital }).eq("id", user.id);
        await supabase.from("capital_history").insert({
          user_id: user.id,
          amount: capitalChange,
          type: "sale_edit",
          description: `Úprava prodeje: ${eventName}`,
          balance_after: newCapital,
        });
      }
    }

    onSave();
    setSaving(false);
  }

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
        <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 1, background: "linear-gradient(90deg, transparent, #34d399, transparent)" }} />

        {/* Header */}
        <div style={{ padding: "1.5rem 2rem 1rem", borderBottom: "1px solid #1a1a1a", flexShrink: 0 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div>
              <h2 style={{ fontSize: "1.1rem", fontWeight: 700, color: "#fff", margin: 0 }}>Upravit záznam</h2>
              <p style={{ fontSize: 12, color: "#525252", marginTop: 4 }}>{purchase?.event_name}</p>
            </div>
            <button onClick={onClose} style={{ background: "none", border: "none", color: "#525252", cursor: "pointer", fontSize: 22 }}>×</button>
          </div>
          {/* Section toggle */}
          <div style={{ display: "flex", gap: "0.5rem", marginTop: "1rem", background: "#0a0a0a", border: "1px solid #1a1a1a", borderRadius: 10, padding: "0.3rem" }}>
            <button onClick={() => setActiveSection("sale")} style={toggleStyle(activeSection === "sale")}>Prodej</button>
            <button onClick={() => setActiveSection("purchase")} style={toggleStyle(activeSection === "purchase")}>Nákup</button>
          </div>
        </div>

        {/* Scrollable content */}
        <div style={{ overflowY: "auto", flex: 1, padding: "1.25rem 2rem" }}>
          {error && <div style={{ marginBottom: "1rem", padding: "10px 14px", borderRadius: 8, background: "#2a0a0a", border: "1px solid #7f1d1d", color: "#fca5a5", fontSize: 13 }}>{error}</div>}

          {activeSection === "sale" && (
            <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
              <div>
                <label style={labelStyle}>PLATFORMA PRODEJE</label>
                <select value={platform} onChange={e => setPlatform(e.target.value)} style={{ ...inputStyle, cursor: "pointer" }}>
                  <option value="">— Vyberte —</option>
                  {["Viagogo", "Ticketswap", "Ticketmaster Resale", "Bazoš", "We-list", "Jiné"].map(p => (
                    <option key={p} value={p}>{p}</option>
                  ))}
                </select>
                {platform === "Jiné" && (
                  <input type="text" placeholder="Zadejte platformu..." value={customPlatform} onChange={e => setCustomPlatform(e.target.value)} style={{ ...inputStyle, marginTop: "0.5rem" }} />
                )}
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem" }}>
                <div>
                  <label style={labelStyle}>PRODEJNÍ CENA / KS *</label>
                  <input type="text" value={sellPrice} onChange={e => setSellPrice(e.target.value)} style={inputStyle} />
                </div>
                <div>
                  <label style={labelStyle}>POČET PRODANÝCH *</label>
                  <input type="number" min="1" value={quantitySold} onChange={e => setQuantitySold(e.target.value)} style={inputStyle} />
                </div>
              </div>
              <div>
                <label style={labelStyle}>POPLATKY</label>
                <input type="text" value={fees} onChange={e => setFees(e.target.value)} placeholder="0" style={inputStyle} />
              </div>
              <div>
                <label style={labelStyle}>DATUM PRODEJE</label>
                <input type="date" value={soldAt} onChange={e => setSoldAt(e.target.value)} style={{ ...inputStyle, colorScheme: "dark" }} />
              </div>
              <div>
                <label style={labelStyle}>POZNÁMKY</label>
                <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={2} style={{ ...inputStyle, resize: "vertical" as const }} />
              </div>
            </div>
          )}

          {activeSection === "purchase" && (
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
                  {["Viagogo", "Ticketswap", "Ticketmaster Resale", "Bazoš", "We-list", "Jiné"].map(e => (
                    <option key={e} value={e}>{e}</option>
                  ))}
                </select>
                {exchange === "Jiné" && (
                  <input type="text" placeholder="Zadejte burzu..." value={customExchange} onChange={e => setCustomExchange(e.target.value)} style={{ ...inputStyle, marginTop: "0.5rem" }} />
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
              </div>
              <div>
                <label style={labelStyle}>NÁKUPNÍ ÚČET</label>
                <input type="text" value={accountRef} onChange={e => setAccountRef(e.target.value)} style={inputStyle} />
              </div>
              <div>
                <label style={labelStyle}>NÁKUPNÍ CENA / KS</label>
                <input type="text" value={buyPrice} onChange={e => setBuyPrice(e.target.value)} style={inputStyle} />
              </div>
              <div>
                <label style={labelStyle}>POZNÁMKY</label>
                <textarea value={purchaseNotes} onChange={e => setPurchaseNotes(e.target.value)} rows={2} style={{ ...inputStyle, resize: "vertical" as const }} />
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
                  onClick={() => setPaidOut(!paidOut)}>
                  <div>
                    <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: "0.08em", color: "#525252", marginBottom: 2 }}>VYPLACENÉ</div>
                    <div style={{ fontSize: 13, fontWeight: 600, color: paidOut ? "#34d399" : "#f87171" }}>{paidOut ? "ANO" : "NIE"}</div>
                  </div>
                  <div style={{ width: 36, height: 20, borderRadius: 10, background: paidOut ? "#34d399" : "#2a2a2a", position: "relative", transition: "background 0.2s" }}>
                    <div style={{ position: "absolute", top: 2, left: paidOut ? 18 : 2, width: 16, height: 16, borderRadius: "50%", background: "#fff", transition: "left 0.2s" }} />
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div style={{ padding: "1rem 2rem", borderTop: "1px solid #1a1a1a", flexShrink: 0, display: "flex", gap: "0.75rem" }}>
          <button onClick={onClose} style={{ flex: 1, padding: "0.8rem", background: "transparent", border: "1px solid #2a2a2a", borderRadius: 10, color: "#525252", cursor: "pointer", fontSize: 14 }}>
            Zrušit
          </button>
          <button onClick={handleSave} disabled={saving} style={{
            flex: 2, padding: "0.8rem",
            background: saving ? "#2a2a2a" : "linear-gradient(135deg, #34d399, #059669)",
            border: "none", borderRadius: 10,
            color: "#000", fontWeight: 700, fontSize: 14,
            cursor: saving ? "default" : "pointer",
          }}>
            {saving ? "UKLÁDÁM..." : "ULOŽIT ZMĚNY"}
          </button>
        </div>
      </div>
    </>
  );
}
