"use client";
import { useRouter } from "next/navigation";

export default function ServicesGrid() {
  const router = useRouter();

  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: "1.25rem" }}>
      <div
        onClick={() => router.push("/nakupy")}
        style={{
          background: "linear-gradient(135deg, #161616 0%, #111111 100%)",
          border: "1px solid #3a3a3a",
          borderRadius: 20,
          padding: "2rem",
          cursor: "pointer",
          position: "relative",
          overflow: "hidden",
          transition: "transform 0.2s, border-color 0.2s",
        }}
        onMouseEnter={e => {
          (e.currentTarget as HTMLDivElement).style.transform = "translateY(-3px)";
          (e.currentTarget as HTMLDivElement).style.borderColor = "#c0c0c0";
        }}
        onMouseLeave={e => {
          (e.currentTarget as HTMLDivElement).style.transform = "translateY(0)";
          (e.currentTarget as HTMLDivElement).style.borderColor = "#3a3a3a";
        }}
      >
        {/* Chrome glow top */}
        <div style={{
          position: "absolute", top: 0, left: 0, right: 0, height: 1,
          background: "linear-gradient(90deg, transparent, #c0c0c0, transparent)",
        }} />

        {/* Icon */}
        <div style={{
          width: 52, height: 52, borderRadius: 14,
          background: "linear-gradient(135deg, #2a2a2a, #1a1a1a)",
          border: "1px solid #3a3a3a",
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: "1.5rem", marginBottom: "1.25rem",
        }}>
          🎟️
        </div>

        {/* Badge */}
        <span style={{
          position: "absolute", top: 20, right: 20,
          fontSize: 11, fontWeight: 600, letterSpacing: "0.05em",
          background: "linear-gradient(135deg, #2a2a2a, #1f1f1f)",
          color: "#c0c0c0", border: "1px solid #3a3a3a",
          borderRadius: 6, padding: "3px 10px",
        }}>
          AKTIVNÍ
        </span>

        <h3 style={{ fontSize: "1.2rem", fontWeight: 700, color: "#fff", marginBottom: "0.5rem" }}>
          Seznam nákupů
        </h3>
        <p style={{ fontSize: "0.875rem", color: "#525252", lineHeight: 1.6, marginBottom: "1.5rem" }}>
          Sledujte nákupy, prodeje a zisky z ticket resellingu. P&L přehledy, statistiky a AI analýza.
        </p>

        {/* Stats row */}
        <div style={{ display: "flex", gap: "1.5rem", marginBottom: "1.5rem" }}>
          {[
            { label: "Nákupy", value: "—" },
            { label: "Zisky", value: "—" },
            { label: "ROI", value: "—" },
          ].map((stat) => (
            <div key={stat.label}>
              <div style={{ fontSize: 18, fontWeight: 700, color: "#fff" }}>{stat.value}</div>
              <div style={{ fontSize: 11, color: "#525252", marginTop: 2 }}>{stat.label}</div>
            </div>
          ))}
        </div>

        <div style={{
          display: "flex", alignItems: "center", gap: 6,
          fontSize: 13, fontWeight: 600,
          color: "#c0c0c0",
        }}>
          Otevřít aplikaci
          <span style={{ fontSize: 16 }}>→</span>
        </div>
      </div>
    </div>
  );
}
