"use client";
import { useState } from "react";
import Link from "next/link";
import { signUpWithEmail, signInWithGoogle } from "@/lib/auth/actions";

export default function RegisterPage() {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  async function handleRegister() {
    if (!fullName || !email || !password || !confirmPassword) {
      return setError("Vyplňte všechna pole.");
    }
    if (password !== confirmPassword) {
      return setError("Hesla se neshodují.");
    }
    setLoading(true);
    setError("");
    setSuccess("");
    const result = await signUpWithEmail(email, password, fullName);
    if (result?.error) {
      setError(result.error);
    } else if (result?.success) {
      setSuccess(result.success);
    }
    setLoading(false);
  }

  async function handleGoogle() {
    setLoading(true);
    await signInWithGoogle();
  }

  return (
    <div style={{ minHeight: "100vh", display: "flex", background: "#080808" }}>
      
      {/* LEFT — Form — full width on mobile, fixed width on desktop */}
      <div style={{ 
        display: "flex", 
        flexDirection: "column", 
        justifyContent: "center", 
        padding: "2rem clamp(1.5rem, 6vw, 5rem)", 
        width: "100%", 
        maxWidth: "min(480px, 100%)", 
        flexShrink: 0 
      }}>
        {/* Logo */}
        <div style={{ marginBottom: "2.5rem" }}>
          <img src="/logo.png" alt="TicketClub" style={{ height: 40, width: "auto", objectFit: "contain" }} />
        </div>
        <h1 style={{ fontSize: "2.5rem", fontWeight: 700, color: "#fff", marginBottom: "0.5rem" }}>Registrace</h1>
        <p style={{ color: "#525252", marginBottom: "2.5rem" }}>Vytvořte si nový účet.</p>

        {error && (
          <div style={{ marginBottom: "1rem", padding: "0.75rem 1rem", borderRadius: "0.75rem", fontSize: "0.875rem", background: "#2a0a0a", border: "1px solid #7f1d1d", color: "#fca5a5" }}>
            {error}
          </div>
        )}
        {success && (
          <div style={{ marginBottom: "1rem", padding: "0.75rem 1rem", borderRadius: "0.75rem", fontSize: "0.875rem", background: "#062216", border: "1px solid #14532d", color: "#86efac" }}>
            {success}
          </div>
        )}

        <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
          <input
            type="text"
            placeholder="Jméno"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            style={{ width: "100%", padding: "0.75rem 1rem", borderRadius: "0.75rem", color: "#fff", fontSize: "1rem", outline: "none", transition: "border-color 0.2s", background: "#111111", border: "1px solid #1f1f1f" }}
          />
          <input
            type="email"
            placeholder="E-mail"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            style={{ width: "100%", padding: "0.75rem 1rem", borderRadius: "0.75rem", color: "#fff", fontSize: "1rem", outline: "none", transition: "border-color 0.2s", background: "#111111", border: "1px solid #1f1f1f" }}
          />
          <input
            type="password"
            placeholder="Heslo"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            style={{ width: "100%", padding: "0.75rem 1rem", borderRadius: "0.75rem", color: "#fff", fontSize: "1rem", outline: "none", transition: "border-color 0.2s", background: "#111111", border: "1px solid #1f1f1f" }}
          />
          <input
            type="password"
            placeholder="Potvrdit heslo"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleRegister()}
            style={{ width: "100%", padding: "0.75rem 1rem", borderRadius: "0.75rem", color: "#fff", fontSize: "1rem", outline: "none", transition: "border-color 0.2s", background: "#111111", border: "1px solid #1f1f1f" }}
          />

          <button
            onClick={handleRegister}
            disabled={loading}
            style={{
              width: "100%", 
              padding: "0.75rem 1.5rem", 
              borderRadius: "0.75rem", 
              fontWeight: 600, 
              letterSpacing: "0.1em", 
              color: "#000", 
              cursor: "pointer", 
              transition: "opacity 0.2s", 
              background: "linear-gradient(135deg, #ffffff 0%, #c0c0c0 50%, #a0a0a0 100%)", 
              opacity: loading ? 0.7 : 1 
            }}
          >
            {loading ? "REGISTRUJI..." : "REGISTROVAT SE"}
          </button>

          <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", margin: "0.25rem 0" }}>
            <div style={{ flex: 1, height: "1px", background: "#1f1f1f" }} />
            <span style={{ fontSize: "0.75rem", color: "#525252" }}>nebo</span>
            <div style={{ flex: 1, height: "1px", background: "#1f1f1f" }} />
          </div>

          <button
            onClick={handleGoogle}
            disabled={loading}
            style={{
              width: "100%", 
              padding: "0.75rem 1.5rem", 
              borderRadius: "0.75rem", 
              fontWeight: 500, 
              color: "#fff", 
              display: "flex", 
              alignItems: "center", 
              justifyContent: "center", 
              gap: "0.75rem", 
              cursor: "pointer", 
              transition: "background-color 0.2s", 
              background: "#111111", 
              border: "1px solid #1f1f1f" 
            }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/></svg>
            Registrovat se přes Google
          </button>
        </div>

        <p style={{ marginTop: "2rem", fontSize: "0.875rem", color: "#525252" }}>
          Již máte účet?{" "}
          <Link 
            href="/prihlaseni" 
            style={{ color: "#fff", textDecoration: "none", fontWeight: 500 }}
            onMouseEnter={(e) => (e.currentTarget as HTMLAnchorElement).style.textDecoration = "underline"}
            onMouseLeave={(e) => (e.currentTarget as HTMLAnchorElement).style.textDecoration = "none"}
          >
            Přihlásit se
          </Link>
        </p>
      </div>

      {/* RIGHT — Concert image — hidden on mobile, visible on desktop */}
      <div className="login-image-panel" style={{ 
        flex: 1, 
        display: "flex", 
        position: "relative", 
        overflow: "hidden" 
      }}>
        <div style={{ 
          position: "absolute", 
          inset: 0, 
          backgroundImage: "url('https://images.unsplash.com/photo-1540039155733-5bb30b53aa14?w=1200&q=80')", 
          backgroundSize: "cover", 
          backgroundPosition: "center" 
        }} />
        <div style={{ 
          position: "absolute", 
          inset: 0, 
          background: "linear-gradient(to right, #080808 0%, transparent 30%)" 
        }} />
        <div style={{ position: "absolute", bottom: "2.5rem", left: "2.5rem", right: "2.5rem" }}>
          <p style={{ color: "#fff", fontSize: "1.5rem", fontWeight: 700 }}>Sledujte své zisky.</p>
          <p style={{ color: "#71717a", marginTop: "0.5rem" }}>Profesionální P&L tracker pro ticket resellery.</p>
        </div>
      </div>

    </div>
  );
}
