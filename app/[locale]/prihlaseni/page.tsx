"use client";
import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const router = useRouter();

  async function handleLogin() {
    if (!email || !password) return setError("Vyplňte všechna pole.");
    setLoading(true);
    setError("");

    try {
      const supabase = createClient();
      const { error: err } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (err) {
        setError(err.message);
        setLoading(false);
        return;
      }

      if (rememberMe) {
        localStorage.setItem("rememberMe", "true");
      } else {
        localStorage.removeItem("rememberMe");
        // Session will expire when browser closes naturally
      }

      window.location.href = "/dostupne-sluzby";
    } catch (e: any) {
      setError("Chyba přihlášení. Zkuste to znovu.");
    }

    setLoading(false);
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
        flexShrink: 0, 
      }}>
        {/* Logo */}
        <div style={{ marginBottom: "2.5rem" }}>
          <img src="/logo.png" alt="TicketClub" style={{ height: 40, width: "auto", objectFit: "contain" }} />
        </div>
        <h1 style={{ fontSize: "2.5rem", fontWeight: 700, color: "#fff", marginBottom: "0.5rem" }}>Přihlášení</h1>
        <p style={{ color: "#ededed" , marginBottom: "2.5rem" }}>Vítejte zpět. Zadejte své údaje.</p>

        {error && (
          <div style={{ marginBottom: "1rem", padding: "0.75rem 1rem", borderRadius: "0.75rem", fontSize: "0.875rem", background: "#2a0a0a", border: "1px solid #7f1d1d", color: "#fca5a5" }}>
            {error}
          </div>
        )}

        <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
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
            onKeyDown={(e) => e.key === "Enter" && handleLogin()}
            style={{ width: "100%", padding: "0.75rem 1rem", borderRadius: "0.75rem", color: "#fff", fontSize: "1rem", outline: "none", transition: "border-color 0.2s", background: "#111111", border: "1px solid #1f1f1f" }}
          />

          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: "0.875rem", color: "#ededed"  }}>
            <label style={{ display: "flex", alignItems: "center", gap: "0.5rem", cursor: "pointer" }}>
              <input 
                type="checkbox" 
                checked={rememberMe} 
                onChange={e => setRememberMe(e.target.checked)} 
              />
              Zapamatovat si mě
            </label>
            <Link 
              href="/zapomenute-heslo" 
              style={{ color: "#ededed" , textDecoration: "none", transition: "color 0.2s" }}
              onMouseEnter={(e) => (e.currentTarget as HTMLAnchorElement).style.color = "#fff"}
              onMouseLeave={(e) => (e.currentTarget as HTMLAnchorElement).style.color = "#ededed"}
            >
              Zapomněli jste heslo?
            </Link>
          </div>

          <button
            onClick={handleLogin}
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
              background: "linear-gradient(135deg, #ffffff 0%, #ffffff 50%, #a0a0a0 100%)", 
              opacity: loading ? 0.7 : 1 
            }}
          >
            {loading ? "PŘIHLAŠUJI..." : "PŘIHLÁSIT SE"}
          </button>

          {/* Google login temporarily hidden */}
        </div>

        <p style={{ marginTop: "2rem", fontSize: "0.875rem", color: "#ededed"  }}>
          Nemáte účet?{" "}
          <Link 
            href="/registrace" 
            style={{ color: "#fff", textDecoration: "none", fontWeight: 500 }}
            onMouseEnter={(e) => (e.currentTarget as HTMLAnchorElement).style.textDecoration = "underline"}
            onMouseLeave={(e) => (e.currentTarget as HTMLAnchorElement).style.textDecoration = "none"}
          >
            Registrovat se
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
