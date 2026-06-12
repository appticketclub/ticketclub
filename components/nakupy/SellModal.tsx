"use client";
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useCurrency } from "@/lib/context/CurrencyContext";
import { EXCHANGES } from "@/lib/constants/exchanges";
import { clearCache } from "@/lib/hooks/useDataCache";

const PLATFORMS = EXCHANGES;

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
  const { format } = useCurrency();
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
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.25rem" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <img src="/logo.png" alt="TicketClub" style={{ height: 22, width: "auto", objectFit: "contain" }} />
          <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.12em", color: "#3a3a3a" }}>UZAVŘENÝ FLIP</span>
        </div>
        <span style={{ fontSize: 12, color: "#3a3a3a" }}>{new Date().toLocaleDateString("cs-CZ")}</span>
      </div>

      {/* Event */}
      <div style={{ marginBottom: "1.25rem" }}>
        <div style={{ fontSize: 20, fontWeight: 700, color: "#fff", marginBottom: 4, letterSpacing: "-0.01em" }}>{data.event_name}</div>
        <div style={{ fontSize: 13, color: "#525252", marginBottom: "0.5rem" }}>
          {data.quantity}× lístků{data.platform && ` · ${data.platform}`}
        </div>
      </div>

      {/* Divider */}
      <div style={{ height: 1, background: "linear-gradient(90deg, rgba(192,192,192,0.2), rgba(192,192,192,0.05), transparent)", marginBottom: "1.5rem" }} />

      {/* Stats */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10, marginBottom: "1.5rem" }}>
        {[
          { label: "KOUPENO", value: `${data.quantity}×` },
          { label: "NÁKUP / KS", value: format(data.buy_price, currency as "EUR" | "CZK") },
          { label: "PRODEJ / KS", value: format(data.sell_price, currency as "EUR" | "CZK") },
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
            {isProfit ? "+" : ""}{format(data.profit, currency as "EUR" | "CZK")}
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
      <div style={{ display: "flex", justifyContent: "flex-end", alignItems: "center" }}>
      </div>
    </div>
  );
}

export default function SellModal({ purchase, onClose, onSave }: {
  purchase: any; onClose: () => void; onSave: () => void }) {
  const [step, setStep] = useState<"form" | "success">("form");
  const [qty, setQty] = useState(purchase.quantity_remaining?.toString() || "1");
  const [sellPrice, setSellPrice] = useState("");
  const [priceMode, setPriceMode] = useState<"per_ticket" | "total">("per_ticket");
  const [totalSellPrice, setTotalSellPrice] = useState("");
  const [platform, setPlatform] = useState("");
  const [customPlatform, setCustomPlatform] = useState("");
  const todaySale = new Date().toISOString().split("T")[0];
  const [soldAt, setSoldAt] = useState(todaySale);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [bannerData, setBannerData] = useState<BannerData | null>(null);
  const { format } = useCurrency();

  const qtyNum = parseInt(qty) || 0;
  const sellNum = priceMode === "per_ticket"
    ? parseFloat(sellPrice.replace(",", ".")) || 0
    : (parseFloat(totalSellPrice.replace(",", ".")) || 0) / (parseInt(qty) || 1);
  const feeNum = 0;
  const totalRevenue = sellNum * qtyNum;
  const totalFees = 0;
  const totalBuy = purchase.buy_price * qtyNum;
  const profit = totalRevenue - totalBuy;
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
      platform: platform === "Jiné" ? (customPlatform || "Jiné") : (platform || null),
      fee_percent: 0,
      fees: 0,
      quantity: qtyNum,
      payout_amount: totalRevenue,
      sold_at: new Date(soldAt).toISOString(),
    });

    if (err) {
      setError(err.message);
      setSaving(false);
      return;
    }

    // Update purchase remaining quantity and status
    const newQuantityRemaining = Math.max(0, (purchase.quantity_remaining ?? purchase.quantity) - qtyNum);
    await supabase.from("purchases").update({
      quantity_remaining: newQuantityRemaining,
      status: newQuantityRemaining === 0 ? "sold" : "partial",
    }).eq("id", purchase.id);

    // Clear cache after sale
    clearCache(`nakupy_${user.id}`);
    clearCache(`uvod_${user.id}`);
    clearCache(`kalendar_${user.id}`);

    // Update capital balance
    const payout = totalRevenue;
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

    // Save banner to DB
    const banner = {
      user_id: user.id,
      purchase_id: purchase.id,
      event_name: purchase.event_name,
      buy_price: purchase.buy_price,
      sell_price: sellNum,
      quantity: qtyNum,
      fees: 0,
      profit: Math.round(profit * 100) / 100,
      roi: Math.round(roi * 100) / 100,
      currency: purchase.currency,
      platform: platform === "Jiné" ? (customPlatform || "Jiné") : (platform || null),
    };
    await supabase.from("banners").insert(banner);

    setBannerData({
      event_name: purchase.event_name,
      buy_price: purchase.buy_price,
      sell_price: sellNum,
      quantity: qtyNum,
      fees: 0,
      profit: Math.round(profit * 100) / 100,
      roi: Math.round(roi * 100) / 100,
      platform: platform === "Jiné" ? (customPlatform || "Jiné") : (platform || null),
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
            <div style={{ gridColumn: "1 / -1" }}>
              {/* Price mode toggle */}
              <div style={{ display: "flex", gap: "0.5rem", marginBottom: "0.75rem" }}>
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

              {priceMode === "per_ticket" ? (
                <div>
                  <label style={labelStyle}>PRODEJNÍ CENA / KS *</label>
                  <div style={{ position: "relative" }}>
                    <input
                      type="text"
                      placeholder="0"
                      value={sellPrice}
                      onChange={e => setSellPrice(e.target.value)}
                      style={{ ...inputStyle, paddingRight: "3rem" }}
                    />
                    <span style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", fontSize: 12, color: "#525252", fontWeight: 600 }}>
                      {purchase.currency}
                    </span>
                  </div>
                </div>
              ) : (
                <div>
                  <label style={labelStyle}>PRODEJNÍ CENA CELKEM *</label>
                  <div style={{ position: "relative" }}>
                    <input
                      type="text"
                      placeholder="0"
                      value={totalSellPrice}
                      onChange={e => setTotalSellPrice(e.target.value)}
                      style={{ ...inputStyle, paddingRight: "3rem" }}
                    />
                    <span style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", fontSize: 12, color: "#525252", fontWeight: 600 }}>
                      {purchase.currency}
                    </span>
                  </div>
                </div>
              )}

              {/* Price preview for total mode */}
              {priceMode === "total" && sellNum > 0 && (
                <div style={{ fontSize: 12, color: "#525252", marginTop: 4 }}>
                  = {sellNum.toLocaleString("cs-CZ")} {purchase.currency} / lístek
                </div>
              )}
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem" }}>
            <div>
              <label style={labelStyle}>PLATFORMA</label>
              <select value={platform} onChange={e => setPlatform(e.target.value)} style={{ ...inputStyle, cursor: "pointer" }}>
                <option value="">— Vyberte —</option>
                {PLATFORMS.map(p => <option key={p} value={p}>{p}</option>)}
              </select>
              {platform === "Jiné" && (
                <input type="text" placeholder="Zadejte název platformy..." value={customPlatform} onChange={e => setCustomPlatform(e.target.value)} style={{ ...inputStyle, marginTop: "0.5rem" }} />
              )}
            </div>
            <div>
              <label style={labelStyle}>DATUM PRODEJE</label>
              <input
                type="date"
                value={soldAt}
                onChange={e => setSoldAt(e.target.value)}
                style={{
                  width: "100%", padding: "0.75rem 1rem",
                  background: "#0a0a0a", border: "1px solid #2a2a2a",
                  borderRadius: 10, color: "#fff", fontSize: 14,
                  outline: "none", colorScheme: "dark",
                  boxSizing: "border-box" as const,
                }}
              />
            </div>
          </div>


          {/* Live P&L preview */}
          {sellNum > 0 && (
            <div style={{ background: "#0a0a0a", border: "1px solid #2a2a2a", borderRadius: 12, padding: "1rem 1.25rem" }}>
              <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: "0.08em", color: "#3a3a3a", marginBottom: "0.75rem" }}>NÁHLED P&L</div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8 }}>
                {[
                  { label: "Příjem", value: format(totalRevenue, purchase.currency as "EUR" | "CZK"), color: "#c0c0c0" },
                  { label: "Nákupní náklady", value: `-${format(totalBuy, purchase.currency as "EUR" | "CZK")}`, color: "#f87171" },
                  { label: "Zisk", value: `${profit >= 0 ? "+" : ""}${format(Math.abs(profit), purchase.currency as "EUR" | "CZK")}`, color: profit >= 0 ? "#34d399" : "#f87171" },
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
