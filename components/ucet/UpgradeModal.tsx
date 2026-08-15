"use client";
import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { createClient } from "@/lib/supabase/client";

export default function UpgradeModal({ onClose }: { onClose: () => void }) {
  const [loading, setLoading] = useState<"monthly" | "yearly" | "scale_monthly" | "scale_yearly" | null>(null);
  const [promoCode, setPromoCode] = useState("");
  const [promoValid, setPromoValid] = useState(false);
  const [billing, setBilling] = useState<"monthly" | "yearly">("monthly");
  const [currentPlan, setCurrentPlan] = useState<string>("free");
  const [currentBilling, setCurrentBilling] = useState<"monthly" | "yearly">("monthly");

  useEffect(() => {
    async function loadSub() {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data: sub } = await supabase
        .from("subscriptions")
        .select("plan, plan_interval")
        .eq("user_id", user.id)
        .single();
      if (sub) {
        setCurrentPlan(sub.plan ?? "free");
        setCurrentBilling(sub.plan_interval === "yearly" ? "yearly" : "monthly");
        if (sub.plan === "pro" && sub.plan_interval === "yearly") {
          setBilling("yearly");
        }
      }
    }
    loadSub();
  }, []);

  async function handleCheckout(plan: string) {
    setLoading(plan as any);
    try {
      const res = await fetch("/api/stripe/create-checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan, promoCode }),
      });
      const data = await res.json();
      if (data.url) window.location.href = data.url;
      else alert("Chyba: " + data.error);
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
        maxWidth: 640,
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

          {/* Toggle */}
          <div style={{ display: "flex", justifyContent: "center", marginBottom: "2rem" }}>
            <div style={{ display: "flex", background: "#111", border: "1px solid #1a1a1a", borderRadius: 99, padding: 4, gap: 4 }}>
              <button
                onClick={() => { if (currentPlan === "pro" && currentBilling === "yearly") return; setBilling("monthly"); }}
                disabled={currentPlan === "pro" && currentBilling === "yearly"}
                style={{
                  padding: "6px 20px",
                  borderRadius: 99,
                  fontSize: 13,
                  fontWeight: 500,
                  border: "none",
                  cursor: currentPlan === "pro" && currentBilling === "yearly" ? "not-allowed" : "pointer",
                  background: billing === "monthly" ? "#1a1a1a" : "transparent",
                  color: billing === "monthly" ? "#fff" : "#525252",
                  transition: "all 0.15s",
                  opacity: currentPlan === "pro" && currentBilling === "yearly" ? 0.4 : 1,
                }}
              >Měsíčně</button>
              <button onClick={() => setBilling("yearly")} style={{ padding: "6px 20px", borderRadius: 99, fontSize: 13, fontWeight: 500, border: "none", cursor: "pointer", background: billing === "yearly" ? "#1a1a1a" : "transparent", color: billing === "yearly" ? "#fff" : "#525252", transition: "all 0.15s" }}>
                Ročně <span style={{ fontSize: 11, background: "rgba(34,197,94,0.15)", color: "#4ade80", padding: "2px 6px", borderRadius: 99, marginLeft: 4 }}>3 mesiace zadarmo</span>
              </button>
            </div>
          </div>

          {/* Cards */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: "1rem", marginBottom: "2rem" }}>

            {/* PRO */}
            {currentPlan !== "pro" && currentPlan !== "scale" && (
            <div style={{ background: "#111", border: "1px solid #1a1a1a", borderRadius: 16, padding: "1.5rem" }}>
              <div style={{ fontSize: 11, color: "#525252", letterSpacing: "0.1em", marginBottom: 8 }}>PRO</div>
              <div style={{ fontSize: 28, fontWeight: 800, color: "#fff", marginBottom: 4 }}>
                {billing === "monthly" ? "€19.99" : "€179.99"}<span style={{ fontSize: 13, color: "#525252" }}>/mes</span>
              </div>
              <div style={{ fontSize: 12, color: "#525252", marginBottom: "1.25rem" }}>
                {billing === "monthly" ? "fakturováno měsíčně" : "fakturováno ročně"}
              </div>
              <div style={{ display: "flex", flexDirection: "column" as const, gap: 8, marginBottom: "1.5rem" }}>
                {[
                  ["Sales Tracker", true],
                  ["Chrome Launcher", true],
                  ["Email Import", true],
                  ["Refresh Bot (1 profil)", true],
                  ["Refresh Bot unlimited", false],
                  ["Discord Watcher Bot", false],
                ].map(([label, ok]) => (
                  <div key={label as string} style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, color: ok ? "#fff" : "#525252" }}>
                    <span style={{ color: ok ? "#4ade80" : "#333" }}>{ok ? "✓" : "—"}</span> {label as string}
                  </div>
                ))}
              </div>
              <button
                onClick={() => handleCheckout(billing === "monthly" ? "monthly" : "yearly")}
                disabled={loading === (billing === "monthly" ? "monthly" : "yearly")}
                style={{ width: "100%", padding: "0.65rem", background: "transparent", border: "1px solid #2a2a2a", borderRadius: 10, color: "#fff", fontSize: 14, fontWeight: 700, cursor: loading ? "default" : "pointer", opacity: loading ? 0.7 : 1 }}
              >
                {loading === (billing === "monthly" ? "monthly" : "yearly") ? "Načítám..." : "Upgradovat na PRO"}
              </button>
            </div>
            )}

            {/* SCALE */}
            <div style={{ background: "#111", border: "2px solid #3b82f6", borderRadius: 16, padding: "1.5rem", position: "relative" as const }}>
              <div style={{ position: "absolute" as const, top: -12, left: "50%", transform: "translateX(-50%)", background: "#3b82f6", color: "#fff", fontSize: 11, fontWeight: 700, padding: "4px 14px", borderRadius: 99, whiteSpace: "nowrap" as const }}>Nejoblíbenější</div>
              <div style={{ fontSize: 11, color: "#3b82f6", letterSpacing: "0.1em", marginBottom: 8 }}>SCALE</div>
              <div style={{ fontSize: 28, fontWeight: 800, color: "#fff", marginBottom: 4 }}>
                {billing === "monthly" ? "€44.95" : "€399.95"}<span style={{ fontSize: 13, color: "#525252" }}>/mes</span>
              </div>
              <div style={{ fontSize: 12, color: "#525252", marginBottom: "1.25rem" }}>
                {billing === "monthly" ? "fakturováno měsíčně" : "fakturováno ročně"}
              </div>
              <div style={{ display: "flex", flexDirection: "column" as const, gap: 8, marginBottom: "1.5rem" }}>
                {[
                  ["Sales Tracker", true],
                  ["Chrome Launcher", true],
                  ["Email Import", true],
                  ["Refresh Bot (1 profil)", true],
                  ["Refresh Bot unlimited", true],
                  ["Discord Watcher Bot", true],
                ].map(([label, ok]) => (
                  <div key={label as string} style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, color: "#fff" }}>
                    <span style={{ color: "#4ade80" }}>✓</span> {label as string}
                  </div>
                ))}
              </div>
              <button
                onClick={() => handleCheckout(billing === "monthly" ? "scale_monthly" : "scale_yearly")}
                disabled={loading === (billing === "monthly" ? "scale_monthly" : "scale_yearly")}
                style={{ width: "100%", padding: "0.65rem", background: "#3b82f6", border: "none", borderRadius: 10, color: "#fff", fontSize: 14, fontWeight: 700, cursor: loading ? "default" : "pointer", opacity: loading ? 0.7 : 1 }}
              >
                {loading === (billing === "monthly" ? "scale_monthly" : "scale_yearly") ? "Načítám..." : "Upgradovat na Scale"}
              </button>
            </div>
          </div>

          {/* Feature table */}
          <div style={{ fontSize: "clamp(11px, 3vw, 13px)" }}>
            <div style={{ background: "#0a0a0a", border: "1px solid #1a1a1a", borderRadius: 12, overflow: "hidden" as const }}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 80px 80px", borderBottom: "1px solid #1a1a1a" }}>
                <div style={{ padding: "10px 16px", fontWeight: 600, color: "#525252" }}>Funkce</div>
                <div style={{ padding: "10px 0", fontWeight: 600, color: "#525252", textAlign: "center" as const }}>PRO</div>
                <div style={{ padding: "10px 0", fontWeight: 600, color: "#3b82f6", textAlign: "center" as const }}>SCALE</div>
              </div>
              {[
                ["Email Import", true, true],
                ["Refresh Bot (1 profil)", true, true],
                ["Refresh Bot unlimited", false, true],
                ["Sales Tracker", true, true],
                ["Chrome Launcher", true, true],
                ["Discord Watcher Bot", false, true],
              ].map(([label, pro, scale], i, arr) => (
                <div key={label as string} style={{ display: "grid", gridTemplateColumns: "1fr 80px 80px", borderBottom: i < arr.length - 1 ? "1px solid #0d0d0d" : "none" }}>
                  <div style={{ padding: "10px 16px", color: "#ededed" }}>{label as string}</div>
                  <div style={{ padding: "10px 0", textAlign: "center" as const, fontSize: "clamp(12px, 3.5vw, 14px)" }}>{pro ? <span style={{ color: "#4ade80" }}>✓</span> : <span style={{ color: "#333" }}>—</span>}</div>
                  <div style={{ padding: "10px 0", textAlign: "center" as const, fontSize: "clamp(12px, 3.5vw, 14px)" }}>{scale ? <span style={{ color: "#3b82f6" }}>✓</span> : <span style={{ color: "#333" }}>—</span>}</div>
                </div>
              ))}
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
