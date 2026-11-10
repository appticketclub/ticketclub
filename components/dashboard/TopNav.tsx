"use client";
import { useState, useEffect, useRef } from "react";
import { signOut } from "@/lib/auth/actions";
import { createClient } from "@/lib/supabase/client";

function FullscreenButton() {
  const [isFullscreen, setIsFullscreen] = useState(false);

  useEffect(() => {
    function onChange() {
      setIsFullscreen(!!document.fullscreenElement);
    }
    document.addEventListener("fullscreenchange", onChange);
    return () => document.removeEventListener("fullscreenchange", onChange);
  }, []);

  function toggle() {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
    } else {
      document.exitFullscreen().catch(() => {});
    }
  }

  return (
    <button
      onClick={toggle}
      title={isFullscreen ? "Ukončiť celú obrazovku" : "Celá obrazovka"}
      style={{
        width: 38, height: 38, borderRadius: 10,
        background: "rgba(255,255,255,0.05)",
        border: "1px solid rgba(255,255,255,0.08)",
        cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
        transition: "all 0.15s",
        flexShrink: 0,
      }}
      onMouseEnter={e => {
        e.currentTarget.style.background = "rgba(123,108,246,0.15)";
        e.currentTarget.style.borderColor = "rgba(123,108,246,0.35)";
      }}
      onMouseLeave={e => {
        e.currentTarget.style.background = "rgba(255,255,255,0.05)";
        e.currentTarget.style.borderColor = "rgba(255,255,255,0.08)";
      }}
    >
      {isFullscreen ? (
        /* Exit fullscreen icon */
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.6)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M8 3v3a2 2 0 0 1-2 2H3"/><path d="M21 8h-3a2 2 0 0 1-2-2V3"/>
          <path d="M3 16h3a2 2 0 0 1 2 2v3"/><path d="M16 21v-3a2 2 0 0 1 2-2h3"/>
        </svg>
      ) : (
        /* Enter fullscreen icon */
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.6)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M8 3H5a2 2 0 0 0-2 2v3"/><path d="M21 8V5a2 2 0 0 0-2-2h-3"/>
          <path d="M3 16v3a2 2 0 0 0 2 2h3"/><path d="M16 21h3a2 2 0 0 0 2-2v-3"/>
        </svg>
      )}
    </button>
  );
}

export default function TopNav({ user, profile }: { user: any; profile: any }) {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [bellOpen, setBellOpen] = useState(false);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const bellRef = useRef<HTMLDivElement>(null);

  const isAdmin = profile?.role === "admin";

  const initials = profile?.full_name
    ? profile.full_name.split(" ").map((n: string) => n[0]).join("").toUpperCase().slice(0, 2)
    : user?.email?.[0]?.toUpperCase() ?? "U";

  async function loadNotifications() {
    const supabase = createClient();
    const [{ data: notifs }, { data: reads }] = await Promise.all([
      supabase.from("notifications").select("*").order("is_pinned", { ascending: false }).order("created_at", { ascending: false }),
      supabase.from("notification_reads").select("notification_id").eq("user_id", user.id),
    ]);
    const readIds = new Set((reads ?? []).map((r: any) => r.notification_id));
    const all = notifs ?? [];
    setNotifications(all);
    setUnreadCount(all.filter(n => !readIds.has(n.id)).length);
  }

  async function markAllRead() {
    const supabase = createClient();
    const { data: reads } = await supabase.from("notification_reads").select("notification_id").eq("user_id", user.id);
    const readIds = new Set((reads ?? []).map((r: any) => r.notification_id));
    const unread = notifications.filter(n => !readIds.has(n.id));
    if (unread.length === 0) return;
    await supabase.from("notification_reads").insert(
      unread.map(n => ({ user_id: user.id, notification_id: n.id }))
    );
    setUnreadCount(0);
  }

  useEffect(() => {
    if (!isAdmin) loadNotifications();
  }, []);

  useEffect(() => {
    if (bellOpen && !isAdmin) markAllRead();
  }, [bellOpen]);

  // Close bell on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (bellRef.current && !bellRef.current.contains(e.target as Node)) {
        setBellOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  return (
    <nav style={{
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      padding: "1rem clamp(1rem, 4vw, 3rem)",
      borderBottom: "1px solid rgba(123,108,246,0.1)",
      background: "rgba(10,10,16,0.95)",
      backdropFilter: "blur(12px)",
      position: "sticky",
      top: 0,
      zIndex: 50,
    }}>
      {/* LEFT — Logo */}
      <a href="/dostupne-sluzby" style={{ textDecoration: "none", display: "flex", alignItems: "center", gap: "0.75rem" }}>
        <img src="/logo.png" alt="TicketClub" style={{ height: 36, width: "auto", objectFit: "contain" }} />
      </a>

      {/* RIGHT */}
      <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>

        {/* Fullscreen toggle */}
        <FullscreenButton />

        {/* Bell — members only */}
        {!isAdmin && (
          <div ref={bellRef} style={{ position: "relative" }}>
            <button
              onClick={() => setBellOpen(o => !o)}
              style={{
                width: 38, height: 38, borderRadius: 10,
                background: bellOpen ? "rgba(123,108,246,0.15)" : "rgba(255,255,255,0.05)",
                border: bellOpen ? "1px solid rgba(123,108,246,0.35)" : "1px solid rgba(255,255,255,0.08)",
                cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
                position: "relative", transition: "all 0.15s",
              }}
            >
              <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke={bellOpen ? "#a89df7" : "rgba(255,255,255,0.6)"} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
                <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
              </svg>
              {unreadCount > 0 && (
                <span style={{
                  position: "absolute", top: -4, right: -4,
                  width: 17, height: 17, borderRadius: "50%",
                  background: "linear-gradient(135deg, #7b6cf6, #9d8ff7)",
                  fontSize: 9, fontWeight: 800, color: "#fff",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  boxShadow: "0 0 8px rgba(123,108,246,0.6)",
                  border: "2px solid #0a0a10",
                }}>
                  {unreadCount > 9 ? "9+" : unreadCount}
                </span>
              )}
            </button>

            {bellOpen && (
              <div style={{
                position: "absolute", right: 0, top: "calc(100% + 10px)",
                width: 320,
                background: "#16161b",
                border: "1px solid rgba(123,108,246,0.2)",
                borderRadius: 16,
                boxShadow: "0 16px 48px rgba(0,0,0,0.6), 0 0 0 1px rgba(123,108,246,0.05)",
                overflow: "hidden",
                zIndex: 200,
              }}>
                <div style={{ padding: "12px 16px", borderBottom: "1px solid rgba(123,108,246,0.1)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <span style={{ fontSize: 13, fontWeight: 700, color: "#fff" }}>Upozornenia</span>
                  <span style={{ fontSize: 11, color: "rgba(255,255,255,0.3)" }}>{notifications.length} správ</span>
                </div>
                <div style={{ maxHeight: 360, overflowY: "auto" as const }}>
                  {notifications.length === 0 ? (
                    <div style={{ padding: "2rem", textAlign: "center", color: "rgba(255,255,255,0.25)", fontSize: 13 }}>
                      Žiadne upozornenia
                    </div>
                  ) : notifications.map(n => (
                    <div key={n.id} style={{
                      padding: "12px 16px",
                      borderBottom: "1px solid rgba(255,255,255,0.04)",
                      background: n.is_pinned ? "rgba(123,108,246,0.07)" : "transparent",
                    }}>
                      {n.is_pinned && (
                        <div style={{ fontSize: 10, fontWeight: 700, color: "#7b6cf6", marginBottom: 4, letterSpacing: "0.06em" }}>
                          📌 PINNUTÉ
                        </div>
                      )}
                      <p style={{ fontSize: 13, color: "#e8e4ff", lineHeight: 1.5, margin: "0 0 4px" }}>{n.content}</p>
                      <span style={{ fontSize: 11, color: "rgba(255,255,255,0.25)" }}>
                        {new Date(n.created_at).toLocaleDateString("sk-SK", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* User avatar */}
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
              background: "#16161b", border: "1px solid rgba(123,108,246,0.15)",
              borderRadius: 12, minWidth: 180, overflow: "hidden",
              boxShadow: "0 8px 32px rgba(0,0,0,0.5)",
            }}>
              <div style={{ padding: "12px 16px", borderBottom: "1px solid rgba(123,108,246,0.1)" }}>
                <p style={{ fontSize: 13, fontWeight: 600, color: "#fff", margin: 0 }}>
                  {profile?.full_name ?? "Uživatel"}
                </p>
                <p style={{ fontSize: 12, color: "rgba(255,255,255,0.4)", margin: 0 }}>{user?.email}</p>
              </div>

              <a href="/ucet" style={{
                display: "flex", alignItems: "center", gap: 10,
                padding: "11px 16px", color: "#ffffff",
                textDecoration: "none", fontSize: 14,
                transition: "background 0.15s",
              }}
              onMouseEnter={e => (e.currentTarget.style.background = "rgba(123,108,246,0.1)")}
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
                  borderTop: "1px solid rgba(123,108,246,0.08)",
                }}
                onMouseEnter={e => (e.currentTarget.style.background = "rgba(248,113,113,0.08)")}
                onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
              >
                → Odhlásit se
              </button>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}
