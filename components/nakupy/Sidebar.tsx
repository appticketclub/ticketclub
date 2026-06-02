"use client";
import Link from "next/link";

const navItems = [
  { id: "uvod", label: "Úvod", icon: "⬜" },
  { id: "nakupni-ucty", label: "Nákupní účty", icon: "🔐" },
  { id: "nakupy", label: "Nákupy", icon: "🎟️" },
  { id: "kalendar", label: "Kalendář", icon: "📅" },
  { id: "ai-statistiky", label: "AI statistiky", icon: "🤖" },
  { id: "kalkulacka", label: "Kalkulačka profitů", icon: "🧮" },
  { id: "bannery", label: "P&L bannery", icon: "🖼️" },
];

export default function Sidebar({
  activeTab,
  onTabChange,
}: {
  activeTab: string;
  onTabChange: (tab: string) => void;
}) {
  return (
    <aside style={{
      width: 240,
      background: "#0a0a0a",
      borderRight: "1px solid #1a1a1a",
      padding: "1.5rem 1rem",
      display: "flex",
      flexDirection: "column",
      gap: "0.25rem",
      minHeight: "calc(100vh - 65px)",
    }}>
      <p style={{ fontSize: 11, fontWeight: 600, letterSpacing: "0.1em", color: "#3a3a3a", padding: "0 0.75rem", marginBottom: "0.5rem" }}>
        SEZNAM NÁKUPŮ
      </p>

      {navItems.map((item) => {
        const isActive = activeTab === item.id;
        return (
          <button
            key={item.id}
            onClick={() => onTabChange(item.id)}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "0.75rem",
              padding: "0.6rem 0.75rem",
              borderRadius: 10,
              fontSize: 14,
              fontWeight: isActive ? 600 : 400,
              color: isActive ? "#fff" : "#525252",
              background: isActive ? "#1a1a1a" : "transparent",
              border: isActive ? "1px solid #2a2a2a" : "1px solid transparent",
              cursor: "pointer",
              textAlign: "left",
              width: "100%",
              transition: "all 0.15s",
            }}
            onMouseEnter={e => {
              if (!isActive) (e.currentTarget as HTMLButtonElement).style.color = "#c0c0c0";
            }}
            onMouseLeave={e => {
              if (!isActive) (e.currentTarget as HTMLButtonElement).style.color = "#525252";
            }}
          >
            <span style={{ fontSize: 16 }}>{item.icon}</span>
            {item.label}
            {isActive && <span style={{ marginLeft: "auto", width: 4, height: 4, borderRadius: "50%", background: "#c0c0c0" }} />}
          </button>
        );
      })}

      <div style={{ marginTop: "auto", paddingTop: "1rem", borderTop: "1px solid #1a1a1a" }}>
        <Link
          href="/dostupne-sluzby"
          style={{
            display: "flex", alignItems: "center", gap: "0.75rem",
            padding: "0.6rem 0.75rem", borderRadius: 10,
            fontSize: 13, color: "#3a3a3a", textDecoration: "none",
          }}
          onMouseEnter={e => (e.currentTarget as HTMLAnchorElement).style.color = "#c0c0c0"}
          onMouseLeave={e => (e.currentTarget as HTMLAnchorElement).style.color = "#3a3a3a"}
        >
          ← Zpět na přehled
        </Link>
      </div>
    </aside>
  );
}
