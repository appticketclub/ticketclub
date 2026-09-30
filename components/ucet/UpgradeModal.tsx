"use client";
import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { createClient } from "@/lib/supabase/client";

export default function UpgradeModal({ onClose }: { onClose: () => void }) {
  const [loading, setLoading] = useState<"pro_monthly" | "pro_yearly" | null>(null);
  const [promoCode, setPromoCode] = useState("");
  const [promoValid, setPromoValid] = useState(false);

  useEffect(() => {
    async function loadSub() {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
    }
    loadSub();
  }, []);

  async function handleUpgrade(planType: string) {
    const priceId = planType === "pro_yearly"
      ? process.env.NEXT_PUBLIC_STRIPE_PRO_YEARLY_PRICE_ID
      : process.env.NEXT_PUBLIC_STRIPE_PRO_PRICE_ID;
    setLoading(planType as "pro_monthly" | "pro_yearly");
    try {
      const res = await fetch("/api/stripe/create-checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan: planType, promoCode, priceId }),
      });
      const d = await res.json();
      if (d.error) {
        alert(d.error);
        setLoading(null);
        return;
      }
      if (d.upgraded) {
        alert("✓ Předplatné bylo aktualizováno!");
        window.location.reload();
        return;
      }
      if (d.url) window.location.href = d.url;
    } catch {
      alert("Chyba pripojenia");
    }
    setLoading(null);
  }

  return createPortal(
    <>
      <div onClick={onClose} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.92)", zIndex: 999 }} />
      <div style={{
        position: "fixed", top: "50%", left: "50%",
        transform: "translate(-50%, -50%)",
        width: "calc(100vw - 2rem)",
        maxWidth: 720,
        maxHeight: "90vh",
        overflowY: "auto" as const,
        background: "#0d0d0d",
        border: "1px solid #1a1a1a",
        borderRadius: 20,
        padding: "1.5rem",
        zIndex: 1001,
      }}>
        {/* Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
          <div>
            <h2 style={{ fontSize: "1.25rem", fontWeight: 800, color: "#fff", margin: 0, letterSpacing: "-0.02em" }}>
              Upgrade plán
            </h2>
            <p style={{ fontSize: 13, color: "#525252", marginTop: 4 }}>
              Vyberte si plán, který vám nejvíce vyhovuje
            </p>
          </div>
          <button onClick={onClose} style={{ background: "none", border: "none", color: "#525252", cursor: "pointer", fontSize: 22 }}>×</button>
        </div>

        {/* Promo Code Input */}
        <div style={{ padding: "0 0 1rem" }}>
          <div style={{ display: "flex", gap: "0.5rem" }}>
            <input
              type="text"
              placeholder="Promo kód (volitelné)"
              value={promoCode}
              onChange={e => {
                const code = e.target.value.toUpperCase();
                setPromoCode(code);
                setPromoValid(code === "SKOUSKA");
              }}
              style={{ flex: 1, padding: "0.6rem 1rem", background: "#111", border: `1px solid ${promoValid ? "#4ade80" : "#1a1a1a"}`, borderRadius: 10, color: "#fff", fontSize: 13, outline: "none" }}
            />
          </div>
          {promoValid && <div style={{ fontSize: 12, color: "#4ade80", marginTop: 4 }}>✓ Kód platný — 12 dní zdarma!</div>}
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
          {/* Monthly */}
          <div style={{ background: "#111", border: "1px solid #2a2a2a", borderRadius: 16, padding: "1.5rem" }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: "#fff", marginBottom: 8 }}>PRO</div>
            <div style={{ fontSize: 28, fontWeight: 800, color: "#fff" }}>€39.95</div>
            <div style={{ fontSize: 12, color: "#525252", marginBottom: 16 }}>fakturováno měsíčně</div>
            <ul style={{ listStyle: "none", padding: 0, marginBottom: 20 }}>
              {["Refresh Bot Neomezený", "Sales Tracker Neomezený", "Chrome Launcher", "Email Import"].map(f => (
                <li key={f} style={{ fontSize: 13, color: "#ededed", marginBottom: 6 }}>✓ {f}</li>
              ))}
            </ul>
            <button onClick={() => handleUpgrade("pro_monthly")}
              disabled={loading === "pro_monthly"}
              style={{ width: "100%", padding: "10px", background: "linear-gradient(135deg,#fff,#a0a0a0)", border: "none", borderRadius: 10, color: "#000", fontWeight: 700, fontSize: 13, cursor: loading === "pro_monthly" ? "default" : "pointer", opacity: loading === "pro_monthly" ? 0.7 : 1 }}>
              {loading === "pro_monthly" ? "Načítám..." : "Upgradovat →"}
            </button>
          </div>

          {/* Yearly */}
          <div style={{ background: "#111", border: "1px solid #34d399", borderRadius: 16, padding: "1.5rem", position: "relative" }}>
            <div style={{ position: "absolute", top: -12, left: "50%", transform: "translateX(-50%)", background: "#34d399", color: "#000", fontSize: 11, fontWeight: 700, padding: "3px 12px", borderRadius: 99 }}>
              NEJOBLÍBENĚJŠÍ
            </div>
            <div style={{ fontSize: 13, fontWeight: 700, color: "#fff", marginBottom: 8 }}>PRO</div>
            <div style={{ fontSize: 28, fontWeight: 800, color: "#fff" }}>€359.95</div>
            <div style={{ fontSize: 12, color: "#525252", marginBottom: 4 }}>fakturováno ročně</div>
            <div style={{ fontSize: 11, color: "#34d399", marginBottom: 16 }}>3 měsíce zdarma</div>
            <ul style={{ listStyle: "none", padding: 0, marginBottom: 20 }}>
              {["Refresh Bot Neomezený", "Sales Tracker Neomezený", "Chrome Launcher", "Email Import"].map(f => (
                <li key={f} style={{ fontSize: 13, color: "#ededed", marginBottom: 6 }}>✓ {f}</li>
              ))}
            </ul>
            <button onClick={() => handleUpgrade("pro_yearly")}
              disabled={loading === "pro_yearly"}
              style={{ width: "100%", padding: "10px", background: "linear-gradient(135deg,#34d399,#059669)", border: "none", borderRadius: 10, color: "#000", fontWeight: 700, fontSize: 13, cursor: loading === "pro_yearly" ? "default" : "pointer", opacity: loading === "pro_yearly" ? 0.7 : 1 }}>
              {loading === "pro_yearly" ? "Načítám..." : "Upgradovat →"}
            </button>
          </div>
        </div>

        <p style={{ fontSize: 11, color: "#525252", textAlign: "center" as const, marginTop: "1rem" }}>
          Zrušit lze kdykoliv · Bezpečná platba přes Stripe
        </p>
      </div>
    </>,
    document.body
  );
}
