"use client";
import { useState, useEffect } from "react";

export default function UpgradePopup({ onUpgrade }: { onUpgrade: () => void }) {
  const [visible, setVisible] = useState(false);
  const [closing, setClosing] = useState(false);

  useEffect(() => {
    // Slight delay so page loads first
    const t = setTimeout(() => setVisible(true), 1200);
    return () => clearTimeout(t);
  }, []);

  function close() {
    setClosing(true);
    setTimeout(() => setVisible(false), 300);
  }

  if (!visible) return null;

  return (
    <>
      <style>{`
        @keyframes popupIn {
          0% { opacity: 0; transform: translateY(32px) scale(0.96); }
          100% { opacity: 1; transform: translateY(0) scale(1); }
        }
        @keyframes popupOut {
          0% { opacity: 1; transform: translateY(0) scale(1); }
          100% { opacity: 0; transform: translateY(16px) scale(0.97); }
        }
        @keyframes shimmer {
          0% { background-position: -200% center; }
          100% { background-position: 200% center; }
        }
        @keyframes pulse-glow {
          0%, 100% { box-shadow: 0 0 0 0 rgba(123,108,246,0); }
          50% { box-shadow: 0 0 24px 4px rgba(123,108,246,0.25); }
        }
      `}</style>

      {/* Popup */}
      <div style={{
        position: "fixed",
        bottom: 28,
        right: 28,
        zIndex: 9999,
        width: 340,
        background: "linear-gradient(145deg, rgba(22,20,36,0.98), rgba(16,14,28,0.98))",
        border: "1px solid rgba(123,108,246,0.35)",
        borderRadius: 20,
        overflow: "hidden",
        backdropFilter: "blur(24px)",
        WebkitBackdropFilter: "blur(24px)",
        animation: closing ? "popupOut 0.3s ease forwards" : "popupIn 0.4s cubic-bezier(0.34,1.56,0.64,1) forwards",
        boxShadow: "0 24px 60px rgba(0,0,0,0.6), 0 0 0 1px rgba(123,108,246,0.1)",
      }}>
        {/* Top glow line */}
        <div style={{ height: 2, background: "linear-gradient(90deg, transparent, #7b6cf6, #a89df7, transparent)" }} />

        {/* Purple gradient top section */}
        <div style={{
          background: "linear-gradient(135deg, rgba(123,108,246,0.18) 0%, rgba(80,50,200,0.1) 100%)",
          padding: "1.25rem 1.25rem 1rem",
          position: "relative",
        }}>
          {/* Close button */}
          <button
            onClick={close}
            style={{
              position: "absolute", top: 12, right: 12,
              width: 26, height: 26, borderRadius: 8,
              background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.1)",
              color: "rgba(255,255,255,0.4)", cursor: "pointer",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 14, lineHeight: 1,
            }}
          >
            ✕
          </button>

          {/* Badge */}
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.75rem" }}>
            <span style={{
              background: "linear-gradient(135deg, #7b6cf6, #a89df7)",
              color: "#fff", fontSize: 10, fontWeight: 800,
              padding: "3px 10px", borderRadius: 20, letterSpacing: "0.08em",
            }}>✦ PRO</span>
            <span style={{ fontSize: 11, color: "rgba(255,255,255,0.4)" }}>TicketClub</span>
          </div>

          <div style={{ fontSize: 18, fontWeight: 800, color: "#fff", lineHeight: 1.3, marginBottom: "0.35rem" }}>
            Zarob viac z každého lístka
          </div>
          <div style={{ fontSize: 12, color: "rgba(255,255,255,0.5)", lineHeight: 1.5 }}>
            PRO členovia zarábajú v priemere <span style={{ color: "#a89df7", fontWeight: 700 }}>3× viac</span> vďaka pokročilým nástrojom.
          </div>
        </div>

        {/* Features list */}
        <div style={{ padding: "0.9rem 1.25rem" }}>
          {[
            { icon: "🤖", label: "Refresh bot" },
            { icon: "🚀", label: "Chrome launcher" },

            { icon: "📈", label: "Neomezený Sales Tracker" },

          ].map(f => (
            <div key={f.label} style={{ display: "flex", alignItems: "center", gap: "0.6rem", marginBottom: "0.55rem" }}>
              <span style={{ fontSize: 14 }}>{f.icon}</span>
              <span style={{ fontSize: 12, color: "rgba(255,255,255,0.75)", fontWeight: 500 }}>{f.label}</span>
              <span style={{ marginLeft: "auto", fontSize: 11, color: "#7fe0ab", fontWeight: 700 }}>✓</span>
            </div>
          ))}
        </div>

        {/* CTA */}
        <div style={{ padding: "0 1.25rem 1.25rem" }}>
          <button
            onClick={() => { close(); onUpgrade(); }}
            style={{
              width: "100%",
              padding: "0.85rem",
              borderRadius: 12,
              border: "none",
              cursor: "pointer",
              background: "linear-gradient(135deg, #7b6cf6 0%, #9d8ff5 50%, #7b6cf6 100%)",
              backgroundSize: "200% auto",
              color: "#fff",
              fontSize: 13,
              fontWeight: 800,
              letterSpacing: "0.02em",
              animation: "shimmer 3s linear infinite, pulse-glow 2.5s ease-in-out infinite",
            }}
          >
            🚀 Upgradovať na PRO →
          </button>
          <div style={{ textAlign: "center", marginTop: "0.6rem", fontSize: 11, color: "rgba(255,255,255,0.25)" }}>
            Zruš kedykoľvek · Bez záväzkov
          </div>
        </div>
      </div>
    </>
  );
}
