"use client";
import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

export default function ResetPasswordClient() {
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const router = useRouter();

  async function handleReset() {
    if (!password) return setError("Zadejte heslo");
    if (password.length < 6) return setError("Heslo musí mít alespoň 6 znaků");
    if (password !== confirm) return setError("Hesla se neshodují");
    setLoading(true);
    setError("");
    const supabase = createClient();
    const { error: err } = await supabase.auth.updateUser({ password });
    if (err) setError(err.message);
    else {
      setSuccess(true);
      setTimeout(() => router.push("/prihlaseni"), 2000);
    }
    setLoading(false);
  }

  const inputStyle = {
    width: "100%", padding: "0.875rem 1rem",
    background: "#111111", border: "1px solid #1f1f1f",
    borderRadius: 12, color: "#fff", fontSize: 14,
    outline: "none", boxSizing: "border-box" as const,
    transition: "border-color 0.2s",
  };

  return (
    <div style={{ minHeight: "100vh", background: "#080808", display: "flex", alignItems: "center", justifyContent: "center", padding: "1rem" }}>
      <div style={{ width: "100%", maxWidth: 420 }}>
        <div style={{ textAlign: "center" as const, marginBottom: "2rem" }}>
          <img src="/logo.png" alt="TicketClub" style={{ height: 40, width: "auto", objectFit: "contain" }} />
        </div>
        <div style={{ background: "#111111", border: "1px solid #1f1f1f", borderRadius: 20, padding: "2rem", position: "relative", overflow: "hidden" }}>
          <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 1, background: "linear-gradient(90deg, transparent, #ffffff, transparent)" }} />

          {success ? (
            <div style={{ textAlign: "center" as const }}>
              <div style={{ fontSize: 48, marginBottom: "1rem" }}>✅</div>
              <h1 style={{ fontSize: "1.25rem", fontWeight: 700, color: "#fff", marginBottom: "0.5rem" }}>Heslo změněno!</h1>
              <p style={{ fontSize: 13, color: "#ededed"  }}>Přesměrování na přihlášení...</p>
            </div>
          ) : (
            <>
              <h1 style={{ fontSize: "1.25rem", fontWeight: 700, color: "#fff", marginBottom: "0.5rem" }}>Nové heslo</h1>
              <p style={{ fontSize: 13, color: "#ededed" , marginBottom: "1.5rem" }}>Zadejte své nové heslo.</p>

              {error && (
                <div style={{ marginBottom: "1rem", padding: "10px 14px", borderRadius: 8, background: "#2a0a0a", border: "1px solid #7f1d1d", color: "#fca5a5", fontSize: 13 }}>
                  {error}
                </div>
              )}

              <div style={{ display: "flex", flexDirection: "column" as const, gap: "1rem", marginBottom: "1.25rem" }}>
                <div>
                  <label style={{ fontSize: 11, fontWeight: 600, letterSpacing: "0.08em", color: "#ededed" , display: "block", marginBottom: "0.5rem" }}>NOVÉ HESLO</label>
                  <input type="password" placeholder="Min. 6 znaků" value={password} onChange={e => setPassword(e.target.value)} style={inputStyle}
                    onFocus={e => (e.target as HTMLInputElement).style.borderColor = "#ffffff"}
                    onBlur={e => (e.target as HTMLInputElement).style.borderColor = "#1f1f1f"} />
                </div>
                <div>
                  <label style={{ fontSize: 11, fontWeight: 600, letterSpacing: "0.08em", color: "#ededed" , display: "block", marginBottom: "0.5rem" }}>POTVRDIT HESLO</label>
                  <input type="password" placeholder="Zopakujte heslo" value={confirm} onChange={e => setConfirm(e.target.value)} onKeyDown={e => e.key === "Enter" && handleReset()} style={inputStyle}
                    onFocus={e => (e.target as HTMLInputElement).style.borderColor = "#ffffff"}
                    onBlur={e => (e.target as HTMLInputElement).style.borderColor = "#1f1f1f"} />
                </div>
              </div>

              <button onClick={handleReset} disabled={loading} style={{ width: "100%", padding: "0.95rem", background: loading ? "#2a2a2a" : "linear-gradient(135deg, #ffffff 0%, #ffffff 50%, #a0a0a0 100%)", border: "none", borderRadius: 12, color: "#000", fontWeight: 800, fontSize: 14, letterSpacing: "0.08em", cursor: loading ? "default" : "pointer" }}>
                {loading ? "UKLÁDÁM..." : "ZMĚNIT HESLO"}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
