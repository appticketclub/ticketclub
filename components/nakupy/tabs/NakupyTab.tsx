"use client";
import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import SellModal from "@/components/nakupy/SellModal";
import { useCurrency } from "@/lib/context/CurrencyContext";

type Purchase = {
  id: string;
  event_name: string;
  event_date: string | null;
  venue: string | null;
  city: string | null;
  quantity: number;
  quantity_remaining: number;
  buy_price: number;
  total_cost: number;
  currency: string;
  status: string;
  account_ref: string | null;
  created_at: string;
  platforms?: { name: string } | null;
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
  const [artistName, setArtistName] = useState("");
  const today = new Date().toISOString().split("T")[0];
  const [eventDate, setEventDate] = useState(today);
  const [accountRef, setAccountRef] = useState("");
  const [buyPrice, setBuyPrice] = useState("");
  const [quantity, setQuantity] = useState("1");
  const { currency } = useCurrency();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const priceNum = parseFloat(buyPrice.replace(",", ".")) || 0;
  const qtyNum = parseInt(quantity) || 1;
  const totalCost = priceNum * qtyNum;

  async function handleSave() {
    if (!eventName.trim()) return setError("Název akce je povinný.");
    if (priceNum <= 0) return setError("Zadejte platnou cenu lístku.");
    setSaving(true);
    setError("");
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { error: err } = await supabase.from("purchases").insert({
      user_id: user.id,
      event_name: eventName.trim(),
      venue: artistName.trim() || null,
      event_date: eventDate,
      buy_price: priceNum,
      quantity: qtyNum,
      quantity_remaining: qtyNum,
      currency,
      account_ref: accountRef || null,
      status: "active",
    });

    if (err) { setError(err.message); setSaving(false); return; }

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
      <div style={{
        position: "fixed", top: "50%", left: "50%",
        transform: "translate(-50%, -50%)",
        width: "100%", maxWidth: 520,
        background: "#111111", border: "1px solid #2a2a2a",
        borderRadius: 20, padding: "2rem", zIndex: 101, overflow: "hidden",
      }}>
        <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 1, background: "linear-gradient(90deg, transparent, #c0c0c0, transparent)" }} />

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.75rem" }}>
          <h2 style={{ fontSize: "1.1rem", fontWeight: 700, color: "#fff", margin: 0 }}>Přidat nákup</h2>
          <button onClick={onClose} style={{ background: "none", border: "none", color: "#525252", cursor: "pointer", fontSize: 22 }}>×</button>
        </div>

        {error && (
          <div style={{ marginBottom: "1rem", padding: "10px 14px", borderRadius: 8, background: "#2a0a0a", border: "1px solid #7f1d1d", color: "#fca5a5", fontSize: 13 }}>
            {error}
          </div>
        )}

        <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
          <div>
            <label style={labelStyle}>NÁZEV AKCE *</label>
            <input type="text" placeholder="např. Coldplay Prague 2025" value={eventName} onChange={e => setEventName(e.target.value)} style={inputStyle} />
          </div>

          <div>
            <label style={labelStyle}>JMÉNO INTERPRETA</label>
            <input type="text" placeholder="např. Coldplay" value={artistName} onChange={e => setArtistName(e.target.value)} style={inputStyle} />
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

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem" }}>
            <div>
              <label style={labelStyle}>CENA LÍSTKU *</label>
              <input type="text" placeholder="0" value={buyPrice} onChange={e => setBuyPrice(e.target.value)} style={inputStyle} />
            </div>
            <div>
              <label style={labelStyle}>POČET LÍSTKŮ *</label>
              <input type="number" min="1" max="100" value={quantity} onChange={e => setQuantity(e.target.value)} style={inputStyle} />
            </div>
          </div>

          {/* Total cost preview */}
          {priceNum > 0 && (
            <div style={{
              display: "flex", justifyContent: "space-between", alignItems: "center",
              padding: "0.875rem 1rem", borderRadius: 10,
              background: "#0a0a0a", border: "1px solid #2a2a2a",
            }}>
              <span style={{ fontSize: 13, color: "#525252" }}>Celková cena</span>
              <span style={{ fontSize: "1.1rem", fontWeight: 700, color: "#fff" }}>
                {totalCost.toLocaleString("cs-CZ")} {currency}
              </span>
            </div>
          )}
        </div>

        <div style={{ display: "flex", gap: "0.75rem", marginTop: "1.75rem" }}>
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

export default function NakupyTab() {
  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [sellPurchase, setSellPurchase] = useState<Purchase | null>(null);

  async function loadData() {
    const supabase = createClient();
    const [{ data: p }, { data: a }] = await Promise.all([
      supabase.from("purchases").select("*").order("created_at", { ascending: false }),
      supabase.from("accounts").select("id, name").eq("type", "purchase").order("name"),
    ]);
    setPurchases(p ?? []);
    setAccounts(a ?? []);
    setLoading(false);
  }

  useEffect(() => { loadData(); }, []);

  async function deletePurchase(id: string) {
    if (!confirm("Opravdu chcete smazat tento nákup?")) return;
    const supabase = createClient();
    await supabase.from("purchases").delete().eq("id", id);
    loadData();
  }

  return (
    <div>
      {showModal && <AddPurchaseModal accounts={accounts} onClose={() => setShowModal(false)} onSave={loadData} />}
      {sellPurchase && <SellModal purchase={sellPurchase as any} onClose={() => setSellPurchase(null)} onSave={loadData} />}

      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1.75rem" }}>
        <div>
          <h1 style={{ fontSize: "1.5rem", fontWeight: 700, color: "#fff", marginBottom: "0.25rem" }}>Nákupy</h1>
          <p style={{ fontSize: 13, color: "#3a3a3a" }}>{purchases.length} {purchases.length === 1 ? "nákup" : purchases.length < 5 ? "nákupy" : "nákupů"}</p>
        </div>
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

      {/* Table */}
      {!loading && purchases.length > 0 && (
        <div style={{ background: "#111111", border: "1px solid #1a1a1a", borderRadius: 16, overflow: "hidden" }}>
          {/* Table header */}
          <div style={{
            display: "grid",
            gridTemplateColumns: "2fr 120px 1fr 1fr 1fr 1fr 80px",
            padding: "0.875rem 1.5rem",
            borderBottom: "1px solid #1a1a1a",
            background: "#0d0d0d",
          }}>
            {["NÁZEV AKCE", "DATUM", "ÚČET", "CENA/KS", "POČET", "CELKEM", ""].map((h) => (
              <div key={h} style={{ fontSize: 11, fontWeight: 600, letterSpacing: "0.08em", color: "#3a3a3a" }}>{h}</div>
            ))}
          </div>

          {/* Table rows */}
          {purchases.map((purchase, i) => {
            const status = statusColors[purchase.status] ?? statusColors.active;
            return (
              <div
                key={purchase.id}
                style={{
                  display: "grid",
                  gridTemplateColumns: "2fr 120px 1fr 1fr 1fr 1fr 80px",
                  padding: "1rem 1.5rem",
                  borderBottom: i < purchases.length - 1 ? "1px solid #141414" : "none",
                  alignItems: "center",
                  transition: "background 0.15s",
                }}
                onMouseEnter={e => (e.currentTarget as HTMLDivElement).style.background = "#141414"}
                onMouseLeave={e => (e.currentTarget as HTMLDivElement).style.background = "transparent"}
              >
                {/* Event name */}
                <div>
                  <div style={{ fontWeight: 600, color: "#fff", fontSize: 14, marginBottom: 4 }}>{purchase.event_name}</div>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <span style={{
                      fontSize: 11, fontWeight: 600,
                      padding: "2px 8px", borderRadius: 5,
                      background: status.bg, color: status.color,
                    }}>
                      {status.label}
                    </span>
                    {purchase.venue && <span style={{ fontSize: 11, color: "#3a3a3a" }}>{purchase.venue}</span>}
                  </div>
                </div>

                {/* Date */}
                <div style={{ fontSize: 13, color: "#525252" }}>
                  {purchase.event_date
                    ? new Date(purchase.event_date).toLocaleDateString("cs-CZ")
                    : "—"}
                </div>

                {/* Account */}
                <div style={{ fontSize: 13, color: "#525252" }}>{purchase.account_ref ?? "—"}</div>

                {/* Price per ticket */}
                <div style={{ fontSize: 14, color: "#c0c0c0", fontWeight: 500 }}>
                  {purchase.buy_price.toLocaleString("cs-CZ")} {purchase.currency}
                </div>

                {/* Quantity */}
                <div style={{ fontSize: 14, color: "#c0c0c0" }}>{purchase.quantity}×</div>

                {/* Total */}
                <div style={{ fontSize: 14, fontWeight: 700, color: "#fff" }}>
                  {(purchase.buy_price * purchase.quantity).toLocaleString("cs-CZ")} {purchase.currency}
                </div>

                {/* Actions */}
                <div style={{ display: "flex", justifyContent: "flex-end", gap: 6 }}>
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
                    onClick={() => deletePurchase(purchase.id)}
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
      )}
    </div>
  );
}
