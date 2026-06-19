"use client";
import { useState, useEffect } from "react";
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

  useEffect(() => {
    const script = document.createElement("script");
    script.src = `https://www.google.com/recaptcha/api.js?render=${process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY}`;
    script.async = true;
    document.head.appendChild(script);
    return () => { document.head.removeChild(script); };
  }, []);

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

    try {
      // Execute reCAPTCHA
      const token = await new Promise<string>((resolve, reject) => {
        (window as any).grecaptcha.ready(() => {
          (window as any).grecaptcha
            .execute(process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY, { action: "register" })
            .then(resolve)
            .catch(reject);
        });
      });

      // Verify on server
      const captchaRes = await fetch("/api/recaptcha/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token }),
      });
      const captchaData = await captchaRes.json();

      if (!captchaData.success) {
        setError("Ověření reCAPTCHA selhalo. Zkuste to znovu.");
        setLoading(false);
        return;
      }

      // Continue with normal registration
      const result = await signUpWithEmail(email, password, fullName);
      if (result?.error) {
        setError(result.error);
      } else if (result?.success) {
        setSuccess(result.success);
      }
    } catch (e) {
      setError("Chyba reCAPTCHA. Zkuste to znovu.");
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

          {/* Google login temporarily hidden */}
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
