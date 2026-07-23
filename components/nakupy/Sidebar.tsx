"use client";
import Link from "next/link";
import { useState } from "react";

export default function Sidebar({
  activeTab,
  onTabChange,
  isAdmin = false,
  collapsed,
  setCollapsed,
}: {
  activeTab: string;
  onTabChange: (tab: string) => void;
  isAdmin?: boolean;
  collapsed: boolean;
  setCollapsed: (c: boolean) => void;
}) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const isProduction = typeof window !== "undefined"
    ? window.location.hostname === "app.ticketclub.vip"
    : process.env.NEXT_PUBLIC_SITE_URL === "https://app.ticketclub.vip";

  const navItems = [
    { id: "uvod", label: "Úvod", icon: null },
    { id: "ucty", label: "Účty hesla", icon: null },
    { id: "evidence", label: "Evidence", icon: null },
    ...(!isProduction ? [{ id: "detaily", label: "Detaily N&P", icon: null }] : []),
    { id: "kalendar", label: "Kalendář", icon: null },
    { id: "ai-statistiky", label: "AI statistiky", icon: null },
    { id: "doporucene-akce", label: "Nadcházející akce", icon: null },
    { id: "kalkulacka", label: "Kalkulačka", icon: null },
    ...(!isProduction ? [{ id: "bannery", label: "P&L bannery", icon: null }] : []),
    ...(isAdmin ? [{ id: "tym-statistiky", label: "Štatistiky týmu", icon: null }] : []),
  ];

  return (
    <>
      {/* Mobile hamburger button */}
      <button
        onClick={() => setMobileOpen(!mobileOpen)}
        style={{
          display: "none",
          position: "fixed", top: 16, left: 16, zIndex: 200,
          background: "#111111", border: "1px solid #2a2a2a",
          borderRadius: 8, padding: "8px 10px", cursor: "pointer", color: "#fff",
        }}
        className="mobile-hamburger"
      >
        ☰
      </button>

      {/* Overlay */}
      {mobileOpen && (
        <div onClick={() => setMobileOpen(false)} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.7)", zIndex: 150 }} />
      )}

      {/* Sidebar */}
      <aside className={`sidebar ${mobileOpen ? "sidebar-open" : ""}`} style={{
        width: collapsed ? 0 : 240,
        minWidth: collapsed ? 0 : 240,
        background: "#0a0a0a",
        borderRight: "1px solid #1a1a1a",
        padding: collapsed ? "1.5rem 0" : "1.5rem 1rem",
        display: "flex",
        flexDirection: "column",
        gap: "0.25rem",
        minHeight: "calc(100vh - 65px)",
        overflow: "hidden",
        transition: "width 0.25s ease, min-width 0.25s ease, padding 0.25s ease",
      }}>
      <p style={{ 
        fontSize: 11, 
        fontWeight: 600, 
        letterSpacing: "0.1em", 
        color: "#ffffff", 
        padding: collapsed ? "0 0" : "0 0.75rem", 
        marginBottom: "0.5rem",
        opacity: collapsed ? 0 : 1,
        transition: "opacity 0.15s ease",
      }}>
        SEZNAM NÁKUPŮ
      </p>

      {navItems.map((item) => {
        const isActive = activeTab === item.id;
        return (
          <button
            key={item.id}
            onClick={() => { onTabChange(item.id); setMobileOpen(false)}}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "0.75rem",
              padding: "0.6rem 0.75rem",
              borderRadius: 10,
              fontSize: 14,
              fontWeight: isActive ? 600 : 400,
              color: isActive ? "#34d399" : "#ffffff",
              background: isActive ? "#1a1a1a" : "transparent",
              border: isActive ? "1px solid #2a2a2a" : "1px solid transparent",
              cursor: "pointer",
              textAlign: "left",
              width: "100%",
              transition: "all 0.15s",
              opacity: collapsed ? 0 : 1,
              pointerEvents: collapsed ? "none" : "auto",
            }}
            onMouseEnter={e => {
              if (!isActive) (e.currentTarget as HTMLButtonElement).style.color = "#34d399";
            }}
            onMouseLeave={e => {
              if (!isActive) (e.currentTarget as HTMLButtonElement).style.color = "#ffffff";
            }}
          >
            {item.label}
            {isActive && <span style={{ marginLeft: "auto", width: 4, height: 4, borderRadius: "50%", background: "#34d399" }} />}
          </button>
        );
      })}

      <div style={{ 
        marginTop: "auto", 
        paddingTop: "1rem", 
        borderTop: "1px solid #1a1a1a",
        display: "flex", 
        flexDirection: "column",
        gap: "0.5rem",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", justifyContent: "space-between" }}>
          <Link
            href="/dostupne-sluzby"
            style={{
              display: "flex", alignItems: "center", gap: "0.75rem",
              padding: "0.6rem 0.75rem", borderRadius: 10,
              fontSize: 13, color: "#ffffff", textDecoration: "none",
              opacity: collapsed ? 0 : 1,
              transition: "opacity 0.15s ease",
              pointerEvents: collapsed ? "none" : "auto",
            }}
            onMouseEnter={e => (e.currentTarget as HTMLAnchorElement).style.color = "#34d399"}
            onMouseLeave={e => (e.currentTarget as HTMLAnchorElement).style.color = "#ffffff"}
          >
            ← Zpět na přehled
          </Link>
          <button 
            onClick={() => setCollapsed(!collapsed)} 
            style={{ 
              background: "none", 
              border: "none", 
              color: "#525252", 
              cursor: "pointer", 
              fontSize: 18, 
              padding: 4, 
              display: "flex", 
              alignItems: "center", 
            }} 
            title={collapsed ? "Otvoriť menu" : "Skryť menu"} 
          > 
            {collapsed ? "→" : "←"} 
          </button>
        </div>
      </div>
    </aside>
    </>
  );
}
