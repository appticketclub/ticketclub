"use client";
import { useState } from "react";
import { signOut } from "@/lib/auth/actions";

export default function TopNav({ user, profile }: { user: any; profile: any }) {
  const [dropdownOpen, setDropdownOpen] = useState(false);

  const initials = profile?.full_name
    ? profile.full_name.split(" ").map((n: string) => n[0]).join("").toUpperCase().slice(0, 2)
    : user?.email?.[0]?.toUpperCase() ?? "U";

  return (
    <nav style={{
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      padding: "1rem clamp(1rem, 4vw, 3rem)",
      borderBottom: "1px solid #1f1f1f",
      background: "#080808",
      position: "sticky",
      top: 0,
      zIndex: 50,
    }}>
      {/* LEFT — Logo */}
      <a href="/dostupne-sluzby" style={{ textDecoration: "none", display: "flex", alignItems: "center", gap: "0.75rem" }}>
        <img src="/logo.png" alt="TicketClub" style={{ height: 36, width: "auto", objectFit: "contain" }} />
      </a>

      {/* RIGHT — User menu */}
      <div style={{ position: "relative" }}>
        <button
          onClick={() => setDropdownOpen(!dropdownOpen)}
          onBlur={() => setTimeout(() => setDropdownOpen(false), 150)}
          style={{
            width: 40, height: 40, borderRadius: "50%",
            background: "linear-gradient(135deg, #ffffff, #a0a0a0)",
            border: "none", cursor: "pointer",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 14, fontWeight: 700, color: "#000",
          }}
        >
          {profile?.avatar_url ? (
            <img src={profile.avatar_url} alt="" style={{ width: 40, height: 40, borderRadius: "50%", objectFit: "cover" }} />
          ) : initials}
        </button>

        {dropdownOpen && (
          <div style={{
            position: "absolute", right: 0, top: "calc(100% + 8px)",
            background: "#111111", border: "1px solid #1f1f1f",
            borderRadius: 12, minWidth: 180, overflow: "hidden",
            boxShadow: "0 8px 32px rgba(0,0,0,0.5)",
          }}>
            {/* User info */}
            <div style={{ padding: "12px 16px", borderBottom: "1px solid #1f1f1f" }}>
              <p style={{ fontSize: 13, fontWeight: 600, color: "#fff", margin: 0 }}>
                {profile?.full_name ?? "Uživatel"}
              </p>
              <p style={{ fontSize: 12, color: "#525252", margin: 0 }}>{user?.email}</p>
            </div>

            {/* Menu items */}
            <a href="/ucet" style={{
              display: "flex", alignItems: "center", gap: 10,
              padding: "11px 16px", color: "#ffffff",
              textDecoration: "none", fontSize: 14,
              transition: "background 0.15s",
            }}
            onMouseEnter={e => (e.currentTarget.style.background = "#1a1a1a")}
            onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
            >
              👤 Můj účet
            </a>

            <button
              onClick={() => signOut()}
              style={{
                width: "100%", display: "flex", alignItems: "center", gap: 10,
                padding: "11px 16px", color: "#f87171",
                background: "none", border: "none", cursor: "pointer",
                fontSize: 14, textAlign: "left",
                borderTop: "1px solid #1f1f1f",
              }}
              onMouseEnter={e => (e.currentTarget.style.background = "#1a1a1a")}
              onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
            >
              → Odhlásit se
            </button>
          </div>
        )}
      </div>
    </nav>
  );
}
