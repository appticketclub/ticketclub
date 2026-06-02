"use client";
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

const PLATFORMS = ["Viagogo", "StubHub", "TickPick", "Ticketmaster", "SeatGeek"];

type Purchase = {
  id: string;
  event_name: string;
  venue: string | null;
  city: string | null;
  quantity: number;
  quantity_remaining: number;
  buy_price: number;
  total_cost: number;
  currency: string;
  status: string;
  created_at: string;
};

type BannerData = {
  event_name: string;
  buy_price: number;
  sell_price: number;
  quantity: number;
  fees: number;
  profit: number;
  roi: number;
  platform: string | null;
  currency: string;
};

function PnlBanner({ data, currency }: { data: any; currency: string }) {
  const isProfit = data.profit >= 0;
  return (
    <div id="pnl-banner" style={{
      width: "100%", maxWidth: 480,
      background: "linear-gradient(145deg, #0f0f0f 0%, #080808 100%)",
      borderRadius: 20,
      padding: "2rem",
      position: "relative",
      overflow: "hidden",
      margin: "0 auto",
      boxShadow: `0 0 0 1px rgba(192,192,192,0.15), 0 0 40px rgba(192,192,192,0.06), 0 0 80px rgba(192,192,192,0.03)`,
    }}>
      {/* Animated corner glows */}
      <div style={{ position: "absolute", top: -40, left: -40, width: 120, height: 120, borderRadius: "50%", background: "radial-gradient(circle, rgba(192,192,192,0.08) 0%, transparent 70%)" }} />
      <div style={{ position: "absolute", bottom: -40, right: -40, width: 120, height: 120, borderRadius: "50%", background: `radial-gradient(circle, ${isProfit ? "rgba(52,211,153,0.1)" : "rgba(248,113,113,0.1)"} 0%, transparent 70%)` }} />

      {/* Chrome border top */}
      <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 1, background: "linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.4) 30%, rgba(192,192,192,0.8) 50%, rgba(255,255,255,0.4) 70%, transparent 100%)" }} />
      {/* Chrome border bottom */}
      <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: 1, background: "linear-gradient(90deg, transparent, rgba(192,192,192,0.2), transparent)" }} />
      {/* Chrome border left */}
      <div style={{ position: "absolute", top: 0, left: 0, bottom: 0, width: 1, background: "linear-gradient(180deg, rgba(192,192,192,0.4), rgba(192,192,192,0.1), transparent)" }} />
      {/* Chrome border right */}
      <div style={{ position: "absolute", top: 0, right: 0, bottom: 0, width: 1, background: "linear-gradient(180deg, rgba(192,192,192,0.4), rgba(192,192,192,0.1), transparent)" }} />

      {/* Brand */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1.5rem" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <div style={{
            width: 28, height: 28, borderRadius: 7,
            background: "linear-gradient(135deg, #ffffff, #808080)",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 10, fontWeight: 800, color: "#000",
          }}>TC</div>
          <span style={{ fontSize: 12, fontWeight: 700, letterSpacing: "0.15em", color: "#c0c0c0" }}>TICKETCLUB</span>
        </div>
        <span style={{ fontSize: 11, color: "#3a3a3a", letterSpacing: "0.05em" }}>UZAVŘENÝ FLIP</span>
      </div>

      {/* Event */}
      <div style={{ marginBottom: "1.5rem" }}>
        <div style={{ fontSize: 20, fontWeight: 700, color: "#fff", marginBottom: 4, letterSpacing: "-0.01em" }}>{data.event_name}</div>
        {data.platform && (
          <div style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "3px 10px", borderRadius: 6, background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)" }}>
            <span style={{ fontSize: 11, color: "#525252" }}>{data.platform}</span>
          </div>
        )}
      </div>

      {/* Divider */}
      <div style={{ height: 1, background: "linear-gradient(90deg, rgba(192,192,192,0.2), rgba(192,192,192,0.05), transparent)", marginBottom: "1.5rem" }} />

      {/* Stats */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10, marginBottom: "1.5rem" }}>
        {[
          { label: "KOUPENO", value: `${data.quantity}×` },
          { label: "NÁKUP / KS", value: `${data.buy_price.toLocaleString("cs-CZ")} ${currency}` },
          { label: "PRODEJ / KS", value: `${data.sell_price.toLocaleString("cs-CZ")} ${currency}` },
        ].map(stat => (
          <div key={stat.label} style={{
            background: "rgba(255,255,255,0.03)",
            border: "1px solid rgba(255,255,255,0.07)",
            borderRadius: 10, padding: "10px 12px", textAlign: "center",
          }}>
            <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: "0.1em", color: "#3a3a3a", marginBottom: 6 }}>{stat.label}</div>
            <div style={{ fontSize: 13, fontWeight: 600, color: "#c0c0c0" }}>{stat.value}</div>
          </div>
        ))}
      </div>

      {/* Profit box */}
      <div style={{
        background: isProfit ? "linear-gradient(135deg, rgba(52,211,153,0.08), rgba(52,211,153,0.04))" : "linear-gradient(135deg, rgba(248,113,113,0.08), rgba(248,113,113,0.04))",
        border: `1px solid ${isProfit ? "rgba(52,211,153,0.2)" : "rgba(248,113,113,0.2)"}`,
        borderRadius: 14, padding: "1.25rem 1.5rem",
        display: "flex", justifyContent: "space-between", alignItems: "center",
        marginBottom: "1.25rem",
        position: "relative", overflow: "hidden",
      }}>
        <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 1, background: `linear-gradient(90deg, transparent, ${isProfit ? "rgba(52,211,153,0.4)" : "rgba(248,113,113,0.4)"}, transparent)` }} />
        <div>
          <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: "0.08em", color: isProfit ? "rgba(52,211,153,0.6)" : "rgba(248,113,113,0.6)", marginBottom: 6 }}>ČISTÝ ZISK</div>
          <div style={{ fontSize: 30, fontWeight: 800, color: isProfit ? "#34d399" : "#f87171", letterSpacing: "-0.02em" }}>
            {isProfit ? "+" : ""}{data.profit.toLocaleString("cs-CZ")} {currency}
          </div>
        </div>
        <div style={{
          padding: "8px 16px", borderRadius: 10,
          background: isProfit ? "rgba(52,211,153,0.12)" : "rgba(248,113,113,0.12)",
          border: `1px solid ${isProfit ? "rgba(52,211,153,0.25)" : "rgba(248,113,113,0.25)"}`,
        }}>
          <div style={{ fontSize: 10, fontWeight: 600, letterSpacing: "0.08em", color: isProfit ? "rgba(52,211,153,0.6)" : "rgba(248,113,113,0.6)", marginBottom: 3 }}>ROI</div>
          <div style={{ fontSize: 20, fontWeight: 800, color: isProfit ? "#34d399" : "#f87171" }}>
            {isProfit ? "+" : ""}{data.roi.toFixed(1)}%
          </div>
        </div>
      </div>

      {/* Footer */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <span style={{ fontSize: 11, color: "#2a2a2a", letterSpacing: "0.05em" }}>ticketclub.cz</span>
        <span style={{ fontSize: 11, color: "#2a2a2a" }}>{new Date().toLocaleDateString("cs-CZ")}</span>
      </div>
    </div>
  );
}

export default function SellModal({ purchase, onClose, onSave }: {
  purchase: any; onClose: () => void; onSave: () => void }) {
  const [step, setStep] = useState<"form" | "success">("form");
  const [qty, setQty] = useState(purchase.quantity_remaining?.toString() || "1");
  const [sellPrice, setSellPrice] = useState("");
  const [platform, setPlatform] = useState("");
  const [feePercent, setFeePercent] = useState("10");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [bannerData, setBannerData] = useState<BannerData | null>(null);

  const qtyNum = parseInt(qty) || 0;
  const sellNum = parseFloat(sellPrice.replace(",", ".")) || 0;
  const feeNum = parseFloat(feePercent.replace(",", ".")) || 0;
  const totalRevenue = sellNum * qtyNum;
  const totalFees = totalRevenue * (feeNum / 100);
  const totalBuy = purchase.buy_price * qtyNum;
  const profit = totalRevenue - totalFees - totalBuy;
  const roi = totalBuy > 0 ? (profit / totalBuy) * 100 : 0;

  async function handleSell() {
    if (!sellNum || qtyNum <= 0) return;
    setSaving(true);
    setError("");
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { error: err } = await supabase.from("sales").insert({
      user_id: user.id,
      purchase_id: purchase.id,
      quantity_sold: qtyNum,
      sell_price: sellNum,
      currency: purchase.currency,
      platform: platform || null,
      fee_percent: feeNum,
      fees: Math.round(totalFees * 100) / 100,
      quantity: qtyNum,
      payout_amount: Math.round((totalRevenue - totalFees) * 100) / 100,
      sold_at: new Date().toISOString(),
    });

    if (err) {
      setError(err.message);
      setSaving(false);
      return;
    }

    // Update purchase remaining quantity and status
    const newRemaining = purchase.quantity_remaining - qtyNum;
    await supabase.from("purchases").update({
      quantity_remaining: newRemaining,
      status: newRemaining <= 0 ? "sold" : "partial",
    }).eq("id", purchase.id);

    // Update capital balance
    const payout = totalRevenue - totalFees;
    const { data: profile } = await supabase.from("profiles").select("capital").eq("id", user.id).single();
    if (profile) {
      const newBalance = (profile.capital ?? 0) + payout;
      await supabase.from("profiles").update({ capital: newBalance }).eq("id", user.id);
      await supabase.from("capital_history").insert({
        user_id: user.id,
        amount: payout,
        type: "sale",
        description: `Prodej: ${purchase.event_name}`,
        balance_after: newBalance,
      });
    }

    // Save banner to DB
    const banner = {
      user_id: user.id,
      purchase_id: purchase.id,
      event_name: purchase.event_name,
      buy_price: purchase.buy_price,
      sell_price: sellNum,
      quantity: qtyNum,
      fees: totalFees,
      profit: Math.round(profit * 100) / 100,
      roi: Math.round(roi * 100) / 100,
      currency: purchase.currency,
      platform: platform || null,
    };
    await supabase.from("banners").insert(banner);

    setBannerData({
      event_name: purchase.event_name,
      buy_price: purchase.buy_price,
      sell_price: sellNum,
      quantity: qtyNum,
      fees: totalFees,
      profit: Math.round(profit * 100) / 100,
      roi: Math.round(roi * 100) / 100,
      platform: platform || null,
      currency: purchase.currency,
    });

    setSaving(false);
    setStep("success");
    onSave();
  }

  async function handleShare() {
    const banner = document.getElementById("pnl-banner");
    if (!banner) return;
    try {
      const { default: html2canvas } = await import("html2canvas");
      const canvas = await html2canvas(banner, {
        backgroundColor: "#0d0b1a",
        scale: 2,
      });
      canvas.toBlob(async (blob) => {
        if (!blob) return;
        const file = new File([blob], "ticketclub-flip.png", { type: "image/png" });
        if (navigator.share && navigator.canShare({ files: [file] })) {
          await navigator.share({
            files: [file],
            title: "Můj flip na TicketClub",
          });
        } else {
          // Fallback — download
          const url = URL.createObjectURL(blob);
          const a = document.createElement("a");
          a.href = url;
          const safeName = purchase.event_name.replace(/\s+/g, "-").toLowerCase();
          a.download = "ticketclub-" + safeName + ".png";
          a.click();
          URL.revokeObjectURL(url);
        }
      });
    } catch (e) {
      console.error(e);
    }
  }

  // SUCCESS SCREEN
  if (step === "success" && bannerData) {
    return (
      <>
        <div onClick={onClose} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.85)", zIndex: 100, backdropFilter: "blur(6px)" }} />
        <div style={{
          position: "fixed", top: "50%", left: "50%",
          transform: "translate(-50%, -50%)",
          width: "100%", maxWidth: 560,
          background: "#111111", border: "1px solid #2a2a2a",
          borderRadius: 24, padding: "2rem", zIndex: 101,
          overflow: "hidden", maxHeight: "90vh", overflowY: "auto",
        }}>
          <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 1, background: "linear-gradient(90deg, transparent, #34d399, transparent)" }} />

          {/* Success header */}
          <div style={{ textAlign: "center", marginBottom: "1.75rem" }}>
            <div style={{ fontSize: "3rem", marginBottom: "0.75rem" }}>🎉</div>
            <h2 style={{ fontSize: "1.4rem", fontWeight: 700, color: "#fff", marginBottom: "0.5rem" }}>
              Gratulujeme k úspěšnému prodeji!
            </h2>
            <p style={{ fontSize: 14, color: "#525252" }}>
              Váš flip byl uložen do P&L bannerů.
            </p>
          </div>

          {/* Banner */}
          <PnlBanner data={bannerData} currency={purchase.currency} />

          {/* Share button */}
          <button
            onClick={handleShare}
            style={{
              width: "100%", marginTop: "1.25rem", padding: "0.95rem",
              background: "linear-gradient(135deg, #ffffff, #a0a0a0)",
              border: "none", borderRadius: 12,
              color: "#000", fontWeight: 800, fontSize: 14,
              letterSpacing: "0.08em", cursor: "pointer",
              display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
            }}
          >
            ↗ SDÍLET BANNER
          </button>

          <button
            onClick={onClose}
            style={{
              width: "100%", marginTop: "0.75rem", padding: "0.75rem",
              background: "transparent", border: "1px solid #2a2a2a",
              borderRadius: 12, color: "#525252", cursor: "pointer", fontSize: 14,
            }}
          >
            Zavřít
          </button>
        </div>
      </>
    );
  }

  // SELL FORM
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
        width: "100%", maxWidth: 500,
        background: "#111111", border: "1px solid #2a2a2a",
        borderRadius: 20, padding: "2rem", zIndex: 101, overflow: "hidden",
      }}>
        <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 1, background: "linear-gradient(90deg, transparent, #c0c0c0, transparent)" }} />

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.75rem" }}>
          <div>
            <h2 style={{ fontSize: "1.1rem", fontWeight: 700, color: "#fff", margin: 0 }}>Zaznamenat prodej</h2>
            <p style={{ fontSize: 12, color: "#525252", marginTop: 4 }}>{purchase.event_name}</p>
          </div>
          <button onClick={onClose} style={{ background: "none", border: "none", color: "#525252", cursor: "pointer", fontSize: 22 }}>×</button>
        </div>

        {error && (
          <div style={{ marginBottom: "1rem", padding: "10px 14px", borderRadius: 8, background: "#2a0a0a", border: "1px solid #7f1d1d", color: "#fca5a5", fontSize: 13 }}>
            {error}
          </div>
        )}

        <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem" }}>
            <div>
              <label style={labelStyle}>POČET PRODANÝCH LÍSTKŮ</label>
              <input type="number" min="1" max={purchase.quantity_remaining} value={qty} onChange={e => setQty(e.target.value)} style={inputStyle} />
              <div style={{ fontSize: 11, color: "#3a3a3a", marginTop: 4 }}>Max: {purchase.quantity_remaining}</div>
            </div>
            <div>
              <label style={labelStyle}>PRODEJNÍ CENA / KS</label>
              <input type="text" placeholder="0" value={sellPrice} onChange={e => setSellPrice(e.target.value)} style={inputStyle} />
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem" }}>
            <div>
              <label style={labelStyle}>PLATFORMA</label>
              <select value={platform} onChange={e => setPlatform(e.target.value)} style={{ ...inputStyle, cursor: "pointer" }}>
                <option value="">— Vyberte —</option>
                {PLATFORMS.map(p => <option key={p} value={p}>{p}</option>)}
              </select>
            </div>
            <div>
              <label style={labelStyle}>POPLATEK PLATFORMY (%)</label>
              <input type="text" placeholder="0" value={feePercent} onChange={e => setFeePercent(e.target.value)} style={inputStyle} />
            </div>
          </div>

          {/* Live P&L preview */}
          {sellNum > 0 && (
            <div style={{ background: "#0a0a0a", border: "1px solid #2a2a2a", borderRadius: 12, padding: "1rem 1.25rem" }}>
              <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: "0.08em", color: "#3a3a3a", marginBottom: "0.75rem" }}>NÁHLED P&L</div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8 }}>
                {[
                  { label: "Příjem", value: `${totalRevenue.toLocaleString("cs-CZ")} ${purchase.currency}`, color: "#c0c0c0" },
                  { label: "Poplatky", value: `-${totalFees.toLocaleString("cs-CZ")} ${purchase.currency}`, color: "#f87171" },
                  { label: "Zisk", value: `${profit >= 0 ? "+" : ""}${Math.round(profit).toLocaleString("cs-CZ")} ${purchase.currency}`, color: profit >= 0 ? "#34d399" : "#f87171" },
                ].map(item => (
                  <div key={item.label} style={{ textAlign: "center" }}>
                    <div style={{ fontSize: 11, color: "#3a3a3a", marginBottom: 4 }}>{item.label}</div>
                    <div style={{ fontSize: 14, fontWeight: 700, color: item.color }}>{item.value}</div>
                  </div>
                ))}
              </div>
              <div style={{ textAlign: "center", marginTop: "0.75rem", paddingTop: "0.75rem", borderTop: "1px solid #1a1a1a" }}>
                <span style={{ fontSize: 12, color: "#3a3a3a" }}>ROI: </span>
                <span style={{ fontSize: 14, fontWeight: 700, color: profit >= 0 ? "#34d399" : "#f87171" }}>
                  {profit >= 0 ? "+" : ""}{roi.toFixed(1)}%
                </span>
              </div>
            </div>
          )}
        </div>

        <div style={{ display: "flex", gap: "0.75rem", marginTop: "1.75rem" }}>
          <button onClick={onClose} style={{ flex: 1, padding: "0.8rem", background: "transparent", border: "1px solid #2a2a2a", borderRadius: 10, color: "#525252", cursor: "pointer", fontSize: 14 }}>
            Zrušit
          </button>
          <button
            onClick={handleSell}
            disabled={saving}
            style={{
              flex: 2, padding: "0.8rem",
              background: saving ? "#2a2a2a" : "linear-gradient(135deg, #34d399, #059669)",
              border: "none", borderRadius: 10,
              color: "#000", fontWeight: 700, fontSize: 14,
              letterSpacing: "0.05em", cursor: saving ? "default" : "pointer",
            }}
          >
            {saving ? "UKLÁDÁM..." : "ZAZNAMENAT PRODEJ"}
          </button>
        </div>
      </div>
    </>
  );
}
