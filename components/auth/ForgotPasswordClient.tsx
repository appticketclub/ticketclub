"use client";
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

export default function ForgotPasswordClient() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit() {
    if (!email) return setError("Zadejte email");
    setLoading(true);
    setError("");
    const supabase = createClient();
    const { error: err } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: "https://app.ticketclub.vip/reset-hesla",
    });
    if (err) setError(err.message);
    else setSent(true);
    setLoading(false);
  }

  return (
    <div style={{ minHeight: "100vh", background: "#080808", display: "flex", alignItems: "center", justifyContent: "center", padding: "1rem" }}>
      <div style={{ width: "100%", maxWidth: 420 }}>

        {/* Logo */}
        <div style={{ textAlign: "center" as const, marginBottom: "2rem" }}>
          <img src="/logo.png" alt="TicketClub" style={{ height: 40, width: "auto", objectFit: "contain" }} />
        </div>

        <div style={{ background: "#111111", border: "1px solid #1f1f1f", borderRadius: 20, padding: "2rem", position: "relative", overflow: "hidden" }}>
          <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 1, background: "linear-gradient(90deg, transparent, #ffffff, transparent)" }} />

          {sent ? (
            <div style={{ textAlign: "center" as const }}>
              <div style={{ fontSize: 48, marginBottom: "1rem" }}>📧</div>
              <h1 style={{ fontSize: "1.25rem", fontWeight: 700, color: "#fff", marginBottom: "0.75rem" }}>Email odeslán!</h1>
              <p style={{ fontSize: 13, color: "#525252", lineHeight: 1.7, marginBottom: "1.5rem" }}>
                Zkontrolujte svou emailovou schránku a klikněte na odkaz pro reset hesla.
              </p>
              <a href="/prihlaseni" style={{ fontSize: 13, color: "#ffffff", textDecoration: "none" }}>
                ← Zpět na přihlášení
              </a>
            </div>
          ) : (
            <>
              <h1 style={{ fontSize: "1.25rem", fontWeight: 700, color: "#fff", marginBottom: "0.5rem" }}>Reset hesla</h1>
              <p style={{ fontSize: 13, color: "#525252", marginBottom: "1.5rem" }}>
                Zadejte svůj email a pošleme vám odkaz pro reset hesla.
              </p>

              {error && (
                <div style={{ marginBottom: "1rem", padding: "10px 14px", borderRadius: 8, background: "#2a0a0a", border: "1px solid #7f1d1d", color: "#fca5a5", fontSize: 13 }}>
                  {error}
                </div>
              )}

              <div style={{ marginBottom: "1.25rem" }}>
                <label style={{ fontSize: 11, fontWeight: 600, letterSpacing: "0.08em", color: "#525252", display: "block", marginBottom: "0.5rem" }}>EMAIL</label>
                <input
                  type="email"
                  placeholder="vas@email.com"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  onKeyDown={e => e.key === "Enter" && handleSubmit()}
                  style={{ width: "100%", padding: "0.875rem 1rem", background: "#111111", border: "1px solid #1f1f1f", borderRadius: 12, color: "#fff", fontSize: 14, outline: "none", boxSizing: "border-box" as const, transition: "border-color 0.2s" }}
                  onFocus={e => (e.target as HTMLInputElement).style.borderColor = "#ffffff"}
                  onBlur={e => (e.target as HTMLInputElement).style.borderColor = "#1f1f1f"}
                />
              </div>

              <button
                onClick={handleSubmit}
                disabled={loading}
                style={{ width: "100%", padding: "0.95rem", background: loading ? "#2a2a2a" : "linear-gradient(135deg, #ffffff 0%, #ffffff 50%, #a0a0a0 100%)", border: "none", borderRadius: 12, color: "#000", fontWeight: 800, fontSize: 14, letterSpacing: "0.08em", cursor: loading ? "default" : "pointer" }}
              >
                {loading ? "ODESÍLÁM..." : "ODESLAT ODKAZ"}
              </button>

              <div style={{ textAlign: "center" as const, marginTop: "1.25rem" }}>
                <a href="/prihlaseni" style={{ fontSize: 13, color: "#525252", textDecoration: "none" }}>
                  ← Zpět na přihlášení
                </a>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
