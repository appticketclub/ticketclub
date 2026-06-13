"use client";
import { useState } from "react";

export default function UpgradeModal({ onClose }: { onClose: () => void }) {
  const [loading, setLoading] = useState<"monthly" | "yearly" | null>(null);

  async function handleCheckout(plan: "monthly" | "yearly") {
    setLoading(plan);
    try {
      const res = await fetch("/api/stripe/create-checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan }),
      });
      const data = await res.json();
      if (data.url) window.location.href = data.url;
      else alert("Chyba: " + data.error);
    } catch {
      alert("Chyba pripojenia");
    }
    setLoading(null);
  }

  return (
    <>
      <div onClick={onClose} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.85)", zIndex: 200, backdropFilter: "blur(8px)" }} />
      <div style={{
        position: "fixed", top: "50%", left: "50%",
        transform: "translate(-50%, -50%)",
        width: "100%", maxWidth: 520,
        background: "#111111", border: "1px solid #2a2a2a",
        borderRadius: 24, padding: "2rem", zIndex: 201,
        overflow: "hidden",
      }}>
        <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 1, background: "linear-gradient(90deg, transparent, #7c3aed, transparent)" }} />

        {/* Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.75rem" }}>
          <div>
            <h2 style={{ fontSize: "1.25rem", fontWeight: 800, color: "#fff", margin: 0, letterSpacing: "-0.02em" }}>
              Upgrade na Pro
            </h2>
            <p style={{ fontSize: 13, color: "#525252", marginTop: 4 }}>
              Odemkněte všechny funkce TicketClubu
            </p>
          </div>
          <button onClick={onClose} style={{ background: "none", border: "none", color: "#525252", cursor: "pointer", fontSize: 22 }}>×</button>
        </div>

        {/* Features */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.5rem", marginBottom: "1.75rem" }}>
          {[
            "AI Statistiky", "Chrome Launcher",
            "Extension licence", "Doporučené akce",
            "Neomezené nákupy", "P&L Bannery ∞",
          ].map(f => (
            <div key={f} style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, color: "#c0c0c0" }}>
              <span style={{ color: "#34d399", fontWeight: 700 }}>✓</span> {f}
            </div>
          ))}
        </div>

        {/* Plans */}
        <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>

          {/* Monthly */}
          <div style={{
            background: "#0a0a0a", border: "1px solid #2a2a2a",
            borderRadius: 16, padding: "1.25rem 1.5rem",
            cursor: "pointer", transition: "border-color 0.2s",
          }}
          onMouseEnter={e => (e.currentTarget as HTMLDivElement).style.borderColor = "#7c3aed"}
          onMouseLeave={e => (e.currentTarget as HTMLDivElement).style.borderColor = "#2a2a2a"}
          onClick={() => handleCheckout("monthly")}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
              <span style={{ fontSize: 14, fontWeight: 700, color: "#fff" }}>PRO Měsíční</span>
              <div style={{ textAlign: "right" as const }}>
                <div style={{ fontSize: 20, fontWeight: 800, color: "#fff" }}>€19.95</div>
                <div style={{ fontSize: 10, color: "#525252" }}>≈ 498 CZK / měsíc</div>
              </div>
            </div>
            <button
              disabled={loading === "monthly"}
              style={{
                width: "100%", padding: "0.75rem",
                background: loading === "monthly" ? "#2a2a2a" : "transparent",
                border: "1px solid #2a2a2a", borderRadius: 10,
                color: "#c0c0c0", fontWeight: 600, fontSize: 13,
                cursor: loading === "monthly" ? "default" : "pointer",
                marginTop: 8,
              }}
            >
              {loading === "monthly" ? "Načítám..." : "Vybrat měsíční →"}
            </button>
          </div>

          {/* Yearly */}
          <div style={{
            background: "linear-gradient(145deg, #0f0a1f, #0a0a1a)",
            border: "1px solid rgba(124,58,237,0.4)",
            borderRadius: 16, padding: "1.25rem 1.5rem",
            position: "relative", overflow: "hidden",
            cursor: "pointer", transition: "border-color 0.2s",
          }}
          onMouseEnter={e => (e.currentTarget as HTMLDivElement).style.borderColor = "#7c3aed"}
          onMouseLeave={e => (e.currentTarget as HTMLDivElement).style.borderColor = "rgba(124,58,237,0.4)"}
          onClick={() => handleCheckout("yearly")}
          >
            <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 1, background: "linear-gradient(90deg, transparent, #7c3aed, transparent)" }} />

            {/* Badge */}
            <div style={{
              position: "absolute", top: 12, right: 12,
              padding: "3px 10px", background: "linear-gradient(135deg, #7c3aed, #5b21b6)",
              borderRadius: 100, fontSize: 10, fontWeight: 800, color: "#fff",
              letterSpacing: "0.05em",
            }}>
              3 MĚSÍCE ZDARMA
            </div>

            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
              <span style={{ fontSize: 14, fontWeight: 700, color: "#fff" }}>PRO Roční</span>
              <div style={{ textAlign: "right" as const }}>
                <div style={{ fontSize: 20, fontWeight: 800, color: "#a78bfa" }}>€179.95</div>
                <div style={{ fontSize: 10, color: "#525252" }}>≈ 4 498 CZK / rok</div>
              </div>
            </div>
            <div style={{ fontSize: 11, color: "#a78bfa", marginBottom: 8 }}>
              = €14.99/měsíc · Ušetříte €59.45
            </div>
            <button
              disabled={loading === "yearly"}
              style={{
                width: "100%", padding: "0.75rem",
                background: loading === "yearly" ? "#2a2a2a" : "linear-gradient(135deg, #7c3aed, #5b21b6)",
                border: "none", borderRadius: 10,
                color: "#fff", fontWeight: 700, fontSize: 13,
                cursor: loading === "yearly" ? "default" : "pointer",
              }}
            >
              {loading === "yearly" ? "Načítám..." : "⭐ Vybrat roční →"}
            </button>
          </div>
        </div>

        <p style={{ fontSize: 11, color: "#3a3a3a", textAlign: "center" as const, marginTop: "1rem" }}>
          Zrušit lze kdykoliv · Bezpečná platba přes Stripe
        </p>
      </div>
    </>
  );
}
