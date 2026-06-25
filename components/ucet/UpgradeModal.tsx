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
        width: "calc(100% - 2rem)",
        maxWidth: 480,
        maxHeight: "90vh",
        background: "#111111", border: "1px solid #2a2a2a",
        borderRadius: 20, zIndex: 201,
        overflow: "hidden",
        display: "flex", flexDirection: "column" as const,
      }}>
        <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 1, background: "linear-gradient(90deg, transparent, #7c3aed, transparent)" }} />

        {/* Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "1.25rem 1.5rem 0.75rem" }}>
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

        {/* Scrollable content area */}
        <div style={{ overflowY: "auto", flex: 1, padding: "1.25rem 1.5rem" }}>
          {/* Info text */}
          <p style={{ fontSize: 12, color: "#c0c0c0", lineHeight: 1.6, margin: 0, marginBottom: "1rem", fontStyle: "italic" }}>
            Předplatné zahrnuje Chrome Extension, Refresh Bot, Pre-Sale Bot a všechny budoucí doplňky.
          </p>

          {/* Plans — side by side on all screens */}
          <div style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: "0.75rem",
          }}>
            {/* Monthly card */}
            <div style={{
              background: "#0a0a0a",
              border: "1px solid #2a2a2a",
              borderRadius: 16, padding: "1rem 1.25rem",
              cursor: "pointer", transition: "border-color 0.2s",
              display: "flex", flexDirection: "column" as const,
            }}
            onMouseEnter={e => (e.currentTarget as HTMLDivElement).style.borderColor = "#7c3aed"}
            onMouseLeave={e => (e.currentTarget as HTMLDivElement).style.borderColor = "#2a2a2a"}
            onClick={() => handleCheckout("monthly")}
            >
              <div style={{ fontSize: 13, fontWeight: 600, color: "#525252", marginBottom: "0.75rem", letterSpacing: "0.08em" }}>MĚSÍČNÍ</div>
              <div style={{ fontSize: 28, fontWeight: 900, color: "#fff", letterSpacing: "-0.03em", marginBottom: 4 }}>€19.95</div>
              <div style={{ fontSize: 12, color: "#525252", marginBottom: "1.5rem" }}>≈ 498 CZK / měsíc</div>
              <button
                disabled={loading === "monthly"}
                onClick={e => { e.stopPropagation(); handleCheckout("monthly"); }}
                style={{
                  width: "100%", padding: "0.65rem",
                  background: loading === "monthly" ? "#2a2a2a" : "transparent",
                  border: "1px solid #2a2a2a", borderRadius: 10,
                  color: "#c0c0c0", fontWeight: 600, fontSize: 13,
                  cursor: loading === "monthly" ? "default" : "pointer",
                  marginTop: "auto",
                }}
              >
                {loading === "monthly" ? "Načítám..." : "Vybrat →"}
              </button>
            </div>

            {/* Yearly card */}
            <div style={{
              background: "linear-gradient(145deg, #0f0a1f, #0a0a1a)",
              border: "1px solid rgba(124,58,237,0.4)",
              borderRadius: 16, padding: "1rem 1.25rem",
              position: "relative", overflow: "hidden",
              cursor: "pointer", transition: "border-color 0.2s",
              display: "flex", flexDirection: "column" as const,
            }}
            onMouseEnter={e => (e.currentTarget as HTMLDivElement).style.borderColor = "#7c3aed"}
            onMouseLeave={e => (e.currentTarget as HTMLDivElement).style.borderColor = "rgba(124,58,237,0.4)"}
            onClick={() => handleCheckout("yearly")}
            >
              <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 1, background: "linear-gradient(90deg, transparent, #7c3aed, transparent)" }} />

              {/* Badge */}
              <div style={{
                display: "inline-flex", alignItems: "center",
                padding: "3px 10px", background: "linear-gradient(135deg, #7c3aed, #5b21b6)",
                borderRadius: 100, fontSize: 10, fontWeight: 800, color: "#fff",
                letterSpacing: "0.05em", marginBottom: "0.75rem", width: "fit-content",
              }}>
                3 MĚSÍCE ZDARMA
              </div>

              <div style={{ fontSize: 13, fontWeight: 600, color: "#a78bfa", marginBottom: "0.75rem", letterSpacing: "0.08em" }}>ROČNÍ</div>
              <div style={{ fontSize: 28, fontWeight: 900, color: "#a78bfa", letterSpacing: "-0.03em", marginBottom: 4 }}>€179.95</div>
              <div style={{ fontSize: 12, color: "#525252", marginBottom: 4 }}>≈ 4 498 CZK / rok</div>
              <div style={{ fontSize: 11, color: "#a78bfa", marginBottom: "1.5rem" }}>= €14.99/měsíc · Ušetříte €59.45</div>

              <button
                disabled={loading === "yearly"}
                onClick={e => { e.stopPropagation(); handleCheckout("yearly"); }}
                style={{
                  width: "100%", padding: "0.65rem",
                  background: loading === "yearly" ? "#2a2a2a" : "linear-gradient(135deg, #7c3aed, #5b21b6)",
                  border: "none", borderRadius: 10,
                  color: "#fff", fontWeight: 700, fontSize: 13,
                  cursor: loading === "yearly" ? "default" : "pointer",
                  marginTop: "auto",
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
      </div>
    </>
  );
}
