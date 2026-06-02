"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";

const navItems = [
  { href: "/nakupy", label: "Úvod", icon: "⬜" },
  { href: "/nakupy/kalendar", label: "Kalendář", icon: "📅" },
  { href: "/nakupy/ai-statistiky", label: "AI statistiky", icon: "🤖" },
  { href: "/nakupy/kalkulacka", label: "Kalkulačka profitů", icon: "🧮" },
  { href: "/nakupy/bannery", label: "P&L bannery", icon: "🖼️" },
];

export default function Sidebar() {
  const pathname = usePathname();

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
      {/* Section label */}
      <p style={{ fontSize: 11, fontWeight: 600, letterSpacing: "0.1em", color: "#3a3a3a", padding: "0 0.75rem", marginBottom: "0.5rem" }}>
        SEZNAM NÁKUPŮ
      </p>

      {navItems.map((item) => {
        const isActive = pathname === item.href || (item.href !== "/nakupy" && pathname.startsWith(item.href));
        return (
          <Link
            key={item.href}
            href={item.href}
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
              textDecoration: "none",
              transition: "all 0.15s",
            }}
            onMouseEnter={e => {
              if (!isActive) (e.currentTarget as HTMLAnchorElement).style.color = "#c0c0c0";
            }}
            onMouseLeave={e => {
              if (!isActive) (e.currentTarget as HTMLAnchorElement).style.color = "#525252";
            }}
          >
            <span style={{ fontSize: 16 }}>{item.icon}</span>
            {item.label}
            {isActive && <span style={{ marginLeft: "auto", width: 4, height: 4, borderRadius: "50%", background: "#c0c0c0" }} />}
          </Link>
        );
      })}

      {/* Bottom — back link */}
      <div style={{ marginTop: "auto", paddingTop: "1rem", borderTop: "1px solid #1a1a1a" }}>
        <Link
          href="/dostupne-sluzby"
          style={{
            display: "flex", alignItems: "center", gap: "0.75rem",
            padding: "0.6rem 0.75rem", borderRadius: 10,
            fontSize: 13, color: "#3a3a3a", textDecoration: "none",
            transition: "color 0.15s",
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
