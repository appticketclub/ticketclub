"use client";
import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";

export default function UpozorneniaTab() {
  const [notifications, setNotifications] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);

  async function loadNotifications() {
    const supabase = createClient();
    const { data } = await supabase
      .from("notifications")
      .select("*")
      .order("created_at", { ascending: false });
    setNotifications(data ?? []);
    setLoading(false);
  }

  async function sendNotification() {
    if (!newMessage.trim()) return;
    setSending(true);
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    await supabase.from("notifications").insert({
      content: newMessage.trim(),
      created_by: user?.id,
    });
    setNewMessage("");
    await loadNotifications();
    setSending(false);
  }

  async function deleteNotification(id: string) {
    const supabase = createClient();
    await supabase.from("notifications").delete().eq("id", id);
    setNotifications(prev => prev.filter(n => n.id !== id));
  }

  async function togglePin(id: string, current: boolean) {
    const supabase = createClient();
    await supabase.from("notifications").update({ is_pinned: !current }).eq("id", id);
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_pinned: !current } : n));
  }

  useEffect(() => { loadNotifications(); }, []);

  if (loading) {
    return (
      <div style={{ display: "flex", alignItems: "center", gap: 12, color: "rgba(255,255,255,0.5)", padding: "2rem 0" }}>
        <div style={{ width: 18, height: 18, border: "2px solid rgba(123,108,246,0.2)", borderTopColor: "#7b6cf6", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
        Načítavam...
      </div>
    );
  }

  return (
    <div>
      <style>{`
        .notif-card:hover { border-color: rgba(123,108,246,0.3) !important; }
        .notif-delete:hover { color: #f87171 !important; }
        .notif-pin:hover { color: #7b6cf6 !important; }
        .send-btn:hover { opacity: 0.85; }
      `}</style>

      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: "1.75rem" }}>
        <div>
          <h1 style={{ fontSize: "1.4rem", fontWeight: 700, color: "#fff", marginBottom: "0.3rem", letterSpacing: "-0.02em" }}>
            Upozornenia
          </h1>
          <p style={{ fontSize: 12.5, color: "rgba(255,255,255,0.35)" }}>Správy pre členov tímu</p>
        </div>
      </div>

      {/* Compose box */}
      <div style={{
        background: "linear-gradient(145deg, #1e1e26, #19191f)",
        border: "1px solid rgba(123,108,246,0.2)",
        borderRadius: 16, padding: "1.25rem",
        marginBottom: "1.5rem", position: "relative", overflow: "hidden",
      }}>
        <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 1, background: "linear-gradient(90deg, transparent, rgba(123,108,246,0.5), transparent)" }} />
        <div style={{ fontSize: 11, fontWeight: 600, color: "rgba(255,255,255,0.4)", marginBottom: "0.75rem", letterSpacing: "0.08em", textTransform: "uppercase" as const }}>
          Nové upozornenie
        </div>
        <textarea
          value={newMessage}
          onChange={e => setNewMessage(e.target.value)}
          placeholder="Napíš správu pre členov..."
          rows={3}
          style={{
            width: "100%", resize: "vertical" as const,
            background: "rgba(255,255,255,0.04)",
            border: "1px solid rgba(123,108,246,0.2)",
            borderRadius: 10, padding: "0.75rem 1rem",
            color: "#fff", fontSize: 14, lineHeight: 1.5,
            outline: "none", fontFamily: "inherit",
            boxSizing: "border-box" as const,
            colorScheme: "dark",
          }}
          onFocus={e => (e.currentTarget.style.borderColor = "rgba(123,108,246,0.5)")}
          onBlur={e => (e.currentTarget.style.borderColor = "rgba(123,108,246,0.2)")}
        />
        <div style={{ display: "flex", justifyContent: "flex-end", marginTop: "0.75rem" }}>
          <button
            onClick={sendNotification}
            disabled={sending || !newMessage.trim()}
            className="send-btn"
            style={{
              padding: "8px 20px", borderRadius: 10, border: "none",
              background: sending || !newMessage.trim()
                ? "rgba(123,108,246,0.3)"
                : "linear-gradient(135deg, #7b6cf6, #9d8ff7)",
              color: "#fff", fontWeight: 700, fontSize: 13,
              cursor: sending || !newMessage.trim() ? "not-allowed" : "pointer",
              boxShadow: sending || !newMessage.trim() ? "none" : "0 0 14px rgba(123,108,246,0.3)",
              transition: "opacity 0.15s",
            }}
          >
            {sending ? "Odosiela..." : "Odoslať →"}
          </button>
        </div>
      </div>

      {/* Notification list */}
      {notifications.length === 0 ? (
        <div style={{ textAlign: "center", padding: "3rem 0", color: "rgba(255,255,255,0.2)", fontSize: 13 }}>
          <div style={{ fontSize: 32, marginBottom: 8 }}>🔔</div>
          Zatiaľ žiadne upozornenia
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
          {notifications.map(n => (
            <div key={n.id} className="notif-card" style={{
              background: n.is_pinned
                ? "linear-gradient(145deg, rgba(123,108,246,0.12), rgba(89,52,196,0.06))"
                : "linear-gradient(145deg, #1e1e26, #19191f)",
              border: n.is_pinned
                ? "1px solid rgba(123,108,246,0.3)"
                : "1px solid rgba(123,108,246,0.12)",
              borderRadius: 14, padding: "1rem 1.25rem",
              position: "relative", overflow: "hidden",
              transition: "border-color 0.2s",
            }}>
              {n.is_pinned && (
                <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 1, background: "linear-gradient(90deg, transparent, rgba(123,108,246,0.6), transparent)" }} />
              )}
              <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "1rem" }}>
                <p style={{ color: "#e8e4ff", fontSize: 14, lineHeight: 1.6, margin: 0, flex: 1 }}>
                  {n.is_pinned && <span style={{ fontSize: 11, fontWeight: 700, color: "#7b6cf6", marginRight: 8, letterSpacing: "0.06em" }}>📌 PINNUTÉ</span>}
                  {n.content}
                </p>
                <div style={{ display: "flex", gap: "0.5rem", flexShrink: 0 }}>
                  <button
                    onClick={() => togglePin(n.id, n.is_pinned)}
                    className="notif-pin"
                    title={n.is_pinned ? "Odpinnuť" : "Pinnuť"}
                    style={{ background: "none", border: "none", cursor: "pointer", color: n.is_pinned ? "#7b6cf6" : "rgba(255,255,255,0.25)", fontSize: 14, padding: "2px 4px", transition: "color 0.15s" }}
                  >
                    📌
                  </button>
                  <button
                    onClick={() => deleteNotification(n.id)}
                    className="notif-delete"
                    title="Zmazať"
                    style={{ background: "none", border: "none", cursor: "pointer", color: "rgba(255,255,255,0.25)", fontSize: 14, padding: "2px 4px", transition: "color 0.15s" }}
                  >
                    ✕
                  </button>
                </div>
              </div>
              <div style={{ fontSize: 11, color: "rgba(255,255,255,0.25)", marginTop: "0.5rem" }}>
                {new Date(n.created_at).toLocaleDateString("sk-SK", { day: "numeric", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit" })}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
