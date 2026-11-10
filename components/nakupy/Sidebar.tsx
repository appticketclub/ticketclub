"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

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
    : process.env.NEXT_PUBLIC_SITE_URL === "`https://app.ticketclub.vip`";

  const navItems = [
    { id: "uvod", label: "Úvod", icon: "◈" },
    { id: "ucty", label: "Účty hesla", icon: "⊡" },
    { id: "evidence", label: "Evidence", icon: "≡" },
    ...(!isProduction ? [{ id: "detaily", label: "Detaily N&P", icon: "⊞" }] : []),
    { id: "kalendar", label: "Kalendář", icon: "▦" },
    { id: "ai-statistiky", label: "AI statistiky", icon: "◎" },
    { id: "doporucene-akce", label: "Nadcházející akce", icon: "◇" },
    { id: "kalkulacka", label: "Kalkulačka", icon: "⊟" },
    ...(!isProduction ? [{ id: "bannery", label: "P&L bannery", icon: "▣" }] : []),
    ...(isAdmin ? [{ id: "tym-statistiky", label: "Štatistiky týmu", icon: "⊕" }] : []),
  ];

  const [plan, setPlan] = useState<"free" | "scale" | null>(null);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) return;
      supabase
        .from("subscriptions")
        .select("plan")
        .eq("user_id", user.id)
        .single()
        .then(({ data }) => {
          setPlan((data?.plan === "scale" ? "scale" : "free") as "free" | "scale");
        });
    });
  }, []);

  return (
    <>
      <style>{`
        .sidebar-nav-btn:hover {
          background: rgba(123, 108, 246, 0.08) !important;
          color: #a89df7 !important;
        }
        .sidebar-back-link:hover {
          color: #a89df7 !important;
        }
        @media (max-width: 768px) {
          .mobile-hamburger { display: flex !important; }
          .sidebar { position: fixed !important; left: 0 !important; top: 65px !important; z-index: 160 !important; transform: translateX(-100%); transition: transform 0.25s ease !important; }
          .sidebar.sidebar-open { transform: translateX(0) !important; }
        }
      `}</style>

      <button
        onClick={() => setMobileOpen(!mobileOpen)}
        className="mobile-hamburger"
        style={{
          display: "none",
          position: "fixed", top: 16, left: 16, zIndex: 200,
          background: "#16161b", border: "1px solid rgba(123,108,246,0.2)",
          borderRadius: 8, padding: "8px 10px", cursor: "pointer", color: "#fff",
          alignItems: "center",
        }}
      >
        ☰
      </button>

      {mobileOpen && (
        <div
          onClick={() => setMobileOpen(false)}
          style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)", zIndex: 150 }}
        />
      )}

      <aside
        className={`sidebar ${mobileOpen ? "sidebar-open" : ""}`}
        style={{
          width: collapsed ? 0 : 240,
          minWidth: collapsed ? 0 : 240,
          background: "rgba(14, 14, 20, 0.95)",
          borderRight: "1px solid rgba(123,108,246,0.18)",
          backdropFilter: "blur(12px)",
          padding: collapsed ? "1.5rem 0" : "1.5rem 0.875rem",
          display: "flex",
          flexDirection: "column",
          gap: "0.2rem",
          minHeight: "calc(100vh - 65px)",
          overflow: "hidden",
          transition: "width 0.25s ease, min-width 0.25s ease, padding 0.25s ease",
        }}
      >
        <p style={{
          fontSize: 10,
          fontWeight: 700,
          letterSpacing: "0.12em",
          color: "rgba(255,255,255,0.3)",
          padding: collapsed ? "0" : "0 0.75rem",
          marginBottom: "0.75rem",
          opacity: collapsed ? 0 : 1,
          transition: "opacity 0.15s ease",
          textTransform: "uppercase",
        }}>
          Navigácia
        </p>

        {navItems.map((item) => {
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => { onTabChange(item.id); setMobileOpen(false); }}
              className="sidebar-nav-btn"
              style={{
                display: "flex",
                alignItems: "center",
                gap: "0.65rem",
                padding: "0.55rem 0.75rem",
                borderRadius: 10,
                fontSize: 13.5,
                fontWeight: isActive ? 600 : 400,
                color: isActive ? "#c4baff" : "rgba(255,255,255,0.65)",
                background: isActive
                  ? "linear-gradient(135deg, rgba(123,108,246,0.22), rgba(89,52,196,0.12))"
                  : "transparent",
                border: isActive
                  ? "1px solid rgba(123,108,246,0.45)"
                  : "1px solid transparent",
                boxShadow: isActive
                  ? "0 0 12px rgba(123,108,246,0.15), inset 0 1px 0 rgba(255,255,255,0.05)"
                  : "none",
                cursor: "pointer",
                textAlign: "left",
                width: "100%",
                transition: "all 0.15s",
                opacity: collapsed ? 0 : 1,
                pointerEvents: collapsed ? "none" : "auto",
                position: "relative",
              }}
            >
              {isActive && (
                <span style={{
                  position: "absolute",
                  left: 0,
                  top: "50%",
                  transform: "translateY(-50%)",
                  width: 3,
                  height: "60%",
                  background: "linear-gradient(180deg, #a78bfa, #7b6cf6, #5934c4)",
                  boxShadow: "0 0 8px rgba(123,108,246,0.8)",
                  borderRadius: "0 2px 2px 0",
                }} />
              )}
              <span style={{
                fontSize: 14,
                opacity: isActive ? 1 : 0.5,
                color: isActive ? "#7b6cf6" : "inherit",
                flexShrink: 0,
                width: 16,
                textAlign: "center",
              }}>
                {item.icon}
              </span>
              <span style={{ flex: 1 }}>{item.label}</span>
              {isActive && (
                <span style={{
                  width: 7,
                  height: 7,
                  borderRadius: "50%",
                  background: "#7b6cf6",
                  flexShrink: 0,
                  boxShadow: "0 0 10px 2px rgba(123,108,246,0.8)",
                }} />
              )}
            </button>
          );
        })}

        <div style={{
          marginTop: "auto",
          paddingTop: "1rem",
          borderTop: "1px solid rgba(123,108,246,0.1)",
          display: "flex",
          flexDirection: "column",
          gap: "0.5rem",
        }}>
          {!collapsed && plan !== null && (
            <div style={{
              marginBottom: "0.75rem",
              borderRadius: 14,
              overflow: "hidden",
              position: "relative",
              background: plan === "scale"
                ? "linear-gradient(135deg, rgba(123,108,246,0.18), rgba(89,52,196,0.08))"
                : "linear-gradient(135deg, rgba(255,255,255,0.04), rgba(255,255,255,0.02))",
              border: plan === "scale"
                ? "1px solid rgba(123,108,246,0.35)"
                : "1px solid rgba(255,255,255,0.08)",
              padding: "0.85rem 1rem",
              boxShadow: plan === "scale" ? "0 0 20px rgba(123,108,246,0.1)" : "none",
            }}>
              {/* Top glow line */}
              <div style={{
                position: "absolute", top: 0, left: 0, right: 0, height: 1,
                background: plan === "scale"
                  ? "linear-gradient(90deg, transparent, rgba(123,108,246,0.7), transparent)"
                  : "linear-gradient(90deg, transparent, rgba(255,255,255,0.1), transparent)",
              }} />

              {/* Badge + plan name */}
              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.4rem" }}>
                <span style={{
                  fontSize: 9, fontWeight: 800, letterSpacing: "0.1em",
                  padding: "2px 7px", borderRadius: 5,
                  background: plan === "scale"
                    ? "linear-gradient(135deg, #7b6cf6, #9d8ff7)"
                    : "rgba(255,255,255,0.08)",
                  color: plan === "scale" ? "#fff" : "rgba(255,255,255,0.4)",
                  boxShadow: plan === "scale" ? "0 0 8px rgba(123,108,246,0.4)" : "none",
                }}>
                  {plan === "scale" ? "PRO" : "FREE"}
                </span>
                <span style={{
                  fontSize: 12, fontWeight: 600,
                  color: plan === "scale" ? "#c4baff" : "rgba(255,255,255,0.35)",
                }}>
                  TicketClub {plan === "scale" ? "Pro" : "Free"}
                </span>
              </div>

              {/* Description */}
              <div style={{
                fontSize: 10.5,
                color: "rgba(255,255,255,0.3)",
                lineHeight: 1.5,
                marginBottom: plan === "free" ? "0.65rem" : 0,
              }}>
                {plan === "scale"
                  ? "AI štatistiky · Kalkulačka · Bannery"
                  : "Obmedzený prístup · 10 nákupov"}
              </div>

              {/* Upgrade button — FREE only */}
              {plan === "free" && (
                <button
                  onClick={() => window.dispatchEvent(new CustomEvent("openUpgradeModal"))}
                  style={{
                    display: "block", width: "100%", textAlign: "center",
                    fontSize: 11, fontWeight: 700,
                    padding: "6px 0", borderRadius: 8, border: "none",
                    background: "linear-gradient(135deg, #7b6cf6, #9d8ff7)",
                    color: "#fff", cursor: "pointer",
                    boxShadow: "0 0 14px rgba(123,108,246,0.35)",
                    letterSpacing: "0.04em",
                    transition: "opacity 0.15s",
                  }}
                  onMouseEnter={e => (e.currentTarget.style.opacity = "0.85")}
                  onMouseLeave={e => (e.currentTarget.style.opacity = "1")}
                >
                  Upgradovať →
                </button>
              )}
            </div>
          )}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <Link
              href="/dostupne-sluzby"
              className="sidebar-back-link"
              style={{
                display: "flex", alignItems: "center", gap: "0.5rem",
                padding: "0.55rem 0.75rem", borderRadius: 10,
                fontSize: 12.5, color: "rgba(255,255,255,0.4)", textDecoration: "none",
                opacity: collapsed ? 0 : 1,
                transition: "opacity 0.15s ease, color 0.15s",
                pointerEvents: collapsed ? "none" : "auto",
              }}
            >
              ← Zpět na přehled
            </Link>
            <button
              onClick={() => setCollapsed(!collapsed)}
              style={{
                background: "rgba(123,108,246,0.1)",
                border: "1px solid rgba(123,108,246,0.2)",
                borderRadius: 8,
                color: "#7b6cf6",
                cursor: "pointer",
                fontSize: 14,
                padding: "6px 10px",
                display: "flex",
                alignItems: "center",
                transition: "background 0.15s",
                boxShadow: "0 0 12px rgba(123,108,246,0.2)",
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
