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

  const planLabelStyle = (featured: boolean) => ({
    fontSize: 11, fontWeight: 700,
    letterSpacing: "0.08em", textTransform: "uppercase" as const,
    color: featured ? "rgba(168,157,247,0.7)" : "rgba(240,238,255,0.4)",
    marginBottom: "0.6rem",
  });

  const planCardStyle = (featured: boolean) => ({
    borderRadius: 16, padding: "1.5rem",
    position: "relative" as const, overflow: "hidden" as const,
    display: "flex", flexDirection: "column" as const,
    ...(featured
      ? {
          background: "linear-gradient(145deg, rgba(123,108,246,0.12), rgba(80,60,200,0.08))",
          border: "1px solid rgba(123,108,246,0.35)",
          boxShadow: "0 0 0 1px rgba(123,108,246,0.1), inset 0 1px 0 rgba(255,255,255,0.05)",
        }
      : {
          background: "rgba(255,255,255,0.04)",
          border: "1px solid rgba(255,255,255,0.08)",
        }),
  });

  const featureIconStyle = (featured: boolean) => ({
    width: 18, height: 18, borderRadius: 5, flexShrink: 0,
    display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10,
    ...(featured
      ? {
          background: "rgba(123,108,246,0.15)",
          color: "#a89df7",
          border: "1px solid rgba(123,108,246,0.25)",
        }
      : {
          background: "rgba(93,232,160,0.12)",
          color: "#5de8a0",
          border: "1px solid rgba(93,232,160,0.2)",
        }),
  });

  const planButtonStyle = (featured: boolean, isLoading: boolean) => ({
    width: "100%", padding: "0.75rem",
    ...(featured
      ? {
          background: "linear-gradient(135deg, #7b6cf6, #9d8ff5)",
          border: "none",
          color: "#fff",
          boxShadow: "0 4px 20px rgba(123,108,246,0.4)",
        }
      : {
          background: "rgba(255,255,255,0.08)",
          border: "1px solid rgba(255,255,255,0.12)",
          color: "rgba(240,238,255,0.8)",
        }),
    borderRadius: 10,
    fontSize: 14, fontWeight: 700,
    fontFamily: "inherit",
    cursor: isLoading ? "default" : "pointer",
    opacity: isLoading ? 0.7 : 1,
  });

  return createPortal(
    <>
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@700;800&display=swap" />

      <div onClick={onClose} style={{
        position: "fixed", inset: 0, zIndex: 999,
        background: "rgba(4,3,10,0.75)",
        backdropFilter: "blur(8px)", WebkitBackdropFilter: "blur(8px)",
      }} />
      <div style={{
        position: "fixed", top: "50%", left: "50%",
        transform: "translate(-50%, -50%)",
        width: "calc(100vw - 2rem)",
        maxWidth: 680,
        maxHeight: "90vh",
        overflowY: "auto" as const,
        overflowX: "hidden" as const,
        background: "linear-gradient(145deg, rgba(24,22,38,0.97), rgba(16,14,26,0.98))",
        border: "1px solid rgba(123,108,246,0.2)",
        borderRadius: 24,
        boxShadow: "0 32px 80px rgba(0,0,0,0.6)",
        position: "relative",
        zIndex: 1001,
      }}>
        <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 1, background: "linear-gradient(90deg, transparent, rgba(123,108,246,0.5), rgba(168,157,247,0.3), transparent)" }} />

        {/* Header */}
        <div style={{ padding: "1.75rem 1.75rem 0", display: "flex", alignItems: "flex-start", justifyContent: "space-between" }}>
          <div>
            <h2 style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 22, fontWeight: 800, color: "#fff", margin: 0, marginBottom: "0.3rem" }}>
              Upgrade plán
            </h2>
            <p style={{ fontSize: 13, color: "rgba(240,238,255,0.4)", margin: 0 }}>
              Vyberte si plán, který vám nejvíce vyhovuje
            </p>
          </div>
          <button onClick={onClose} style={{
            width: 32, height: 32, borderRadius: 8,
            background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.08)",
            color: "rgba(255,255,255,0.4)", fontSize: 16,
            display: "flex", alignItems: "center", justifyContent: "center",
            cursor: "pointer", flexShrink: 0, marginLeft: "1rem",
          }}>×</button>
        </div>

        {/* Promo Code Input */}
        <div style={{ padding: "1.25rem 1.75rem 0" }}>
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
              style={{
                flex: 1,
                background: "rgba(255,255,255,0.04)",
                border: `1px solid ${promoValid ? "rgba(93,232,160,0.5)" : "rgba(255,255,255,0.08)"}`,
                borderRadius: 10,
                padding: "0.65rem 1rem",
                color: "rgba(240,238,255,0.6)",
                fontSize: 13, fontFamily: "inherit", outline: "none",
              }}
            />
          </div>
          {promoValid && <div style={{ fontSize: 12, color: "#5de8a0", marginTop: 4 }}>✓ Kód platný — 12 dní zdarma!</div>}
        </div>

        {/* Plans grid */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem", padding: "1.25rem 1.75rem" }}>
          {/* Monthly */}
          <div style={planCardStyle(false)}>
            <div style={planLabelStyle(false)}>PRO</div>
            <div style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 36, fontWeight: 800, color: "#fff", lineHeight: 1, marginBottom: "0.3rem" }}>€39.95</div>
            <div style={{ fontSize: 12, color: "rgba(240,238,255,0.35)", marginBottom: "0.4rem" }}>fakturováno měsíčně</div>
            <div style={{ minHeight: "1.2em", marginBottom: "1.1rem" }} />
            <div style={{ height: 1, background: "rgba(255,255,255,0.06)", marginBottom: "1rem" }} />
            <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: "0.55rem", marginBottom: "1.4rem", flex: 1 }}>
              {["Refresh Bot Neomezený", "Sales Tracker Neomezený", "Chrome Launcher", "Email Import"].map(f => (
                <li key={f} style={{ display: "flex", alignItems: "center", gap: "0.55rem", fontSize: 13, color: "rgba(240,238,255,0.65)" }}>
                  <span style={featureIconStyle(false)}>✓</span>
                  <span>{f}</span>
                </li>
              ))}
            </ul>
            <button onClick={() => handleUpgrade("pro_monthly")}
              disabled={loading === "pro_monthly"}
              style={planButtonStyle(false, loading === "pro_monthly")}>
              {loading === "pro_monthly" ? "Načítám..." : "Upgradovat →"}
            </button>
          </div>

          {/* Yearly */}
          <div style={planCardStyle(true)}>
            <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 1, background: "linear-gradient(90deg, transparent, rgba(123,108,246,0.5), transparent)" }} />
            <div style={{
              position: "absolute", top: -1, left: "50%", transform: "translateX(-50%)",
              background: "linear-gradient(135deg, #5de8a0, #3dd68c)",
              color: "#07260f", fontSize: 10, fontWeight: 800,
              letterSpacing: "0.08em", textTransform: "uppercase" as const,
              padding: "4px 14px", borderRadius: "0 0 10px 10px",
              whiteSpace: "nowrap" as const,
            }}>
              NEJOBLÍBENĚJŠÍ
            </div>
            <div style={{ ...planLabelStyle(true), marginTop: "1rem" }}>PRO</div>
            <div style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 36, fontWeight: 800, color: "#fff", lineHeight: 1, marginBottom: "0.3rem" }}>€359.95</div>
            <div style={{ fontSize: 12, color: "rgba(240,238,255,0.35)", marginBottom: "0.4rem" }}>fakturováno ročně</div>
            <div style={{ fontSize: 12, fontWeight: 600, color: "#5de8a0", marginBottom: "1.1rem", minHeight: "1.2em" }}>3 měsíce zdarma</div>
            <div style={{ height: 1, background: "rgba(123,108,246,0.2)", marginBottom: "1rem" }} />
            <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: "0.55rem", marginBottom: "1.4rem", flex: 1 }}>
              {["Refresh Bot Neomezený", "Sales Tracker Neomezený", "Chrome Launcher", "Email Import"].map(f => (
                <li key={f} style={{ display: "flex", alignItems: "center", gap: "0.55rem", fontSize: 13, color: "rgba(240,238,255,0.8)" }}>
                  <span style={featureIconStyle(true)}>✓</span>
                  <span>{f}</span>
                </li>
              ))}
            </ul>
            <button onClick={() => handleUpgrade("pro_yearly")}
              disabled={loading === "pro_yearly"}
              style={planButtonStyle(true, loading === "pro_yearly")}>
              {loading === "pro_yearly" ? "Načítám..." : "Upgradovat →"}
            </button>
          </div>
        </div>

        {/* Footer */}
        <p style={{
          padding: "0 1.75rem 1.5rem",
          textAlign: "center" as const, fontSize: 12, color: "rgba(240,238,255,0.25)",
          display: "flex", alignItems: "center", justifyContent: "center", gap: "0.5rem",
          margin: 0,
        }}>
          Zrušit lze kdykoliv · Bezpečná platba přes Stripe
        </p>
      </div>
    </>,
    document.body
  );
}
