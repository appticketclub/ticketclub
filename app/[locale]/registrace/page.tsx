"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { signUpWithEmail, signInWithGoogle } from "@/lib/auth/actions";

export default function RegisterPage() {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const router = useRouter();

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
        // Redirect to dashboard after successful registration
        setTimeout(() => {
          router.push("/nakupy");
        }, 500);
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
    <>
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=Space+Grotesk:wght@700;800&display=swap" />

      <style>{`
        .auth-label { display: block; font-size: 11px; font-weight: 600; letter-spacing: 0.06em; text-transform: uppercase; color: rgba(240,238,255,0.3); margin-bottom: 0.4rem; }
        .auth-field { position: relative; }
        .auth-field-icon { position: absolute; left: 14px; top: 50%; transform: translateY(-50%); color: rgba(240,238,255,0.25); font-size: 14px; pointer-events: none; }
        .auth-field input[type="email"], .auth-field input[type="password"], .auth-field input[type="text"] { width: 100%; background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.09); border-radius: 12px; padding: 0.75rem 1rem 0.75rem 2.75rem; color: #f0eeff; font-size: 14px; font-family: inherit; outline: none; transition: border-color 0.15s, background 0.15s, box-shadow 0.15s; }
        .auth-field input:focus { border-color: rgba(123,108,246,0.5); background: rgba(123,108,246,0.07); box-shadow: 0 0 0 3px rgba(123,108,246,0.12); }
        .auth-field input::placeholder { color: rgba(240,238,255,0.2); }
        .auth-submit { width: 100%; padding: 0.85rem; background: linear-gradient(135deg, #7b6cf6, #9d8ff5); border: none; color: #fff; border-radius: 12px; font-size: 15px; font-weight: 700; font-family: inherit; cursor: pointer; box-shadow: 0 4px 24px rgba(123,108,246,0.4); letter-spacing: 0.02em; transition: all 0.2s; }
        .auth-submit:hover { transform: translateY(-1px); box-shadow: 0 6px 32px rgba(123,108,246,0.5); }
        .auth-submit:disabled { opacity: 0.7; cursor: default; transform: none; }
        .auth-link { color: #a89df7; font-weight: 600; text-decoration: none; }
        .auth-link:hover { color: #c4baff; }
      `}</style>

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
          <p style={{ color: "#ededed", marginBottom: "2.5rem" }}>Vytvořte si nový účet.</p>

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
            <div>
              <label className="auth-label">Jméno</label>
              <div className="auth-field">
                <span className="auth-field-icon">👤</span>
                <input
                  type="text"
                  placeholder="Jan Novák"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                />
              </div>
            </div>

            <div>
              <label className="auth-label">E-mail</label>
              <div className="auth-field">
                <span className="auth-field-icon">✉</span>
                <input
                  type="email"
                  placeholder="vas@email.cz"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
            </div>

            <div>
              <label className="auth-label">Heslo</label>
              <div className="auth-field">
                <span className="auth-field-icon">🔒</span>
                <input
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
            </div>

            <div>
              <label className="auth-label">Potvrdit heslo</label>
              <div className="auth-field">
                <span className="auth-field-icon">🔒</span>
                <input
                  type="password"
                  placeholder="••••••••"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleRegister()}
                />
              </div>
            </div>

            <button
              className="auth-submit"
              onClick={handleRegister}
              disabled={loading}
            >
              {loading ? "Registruji…" : "Registrovat se →"}
            </button>

            {/* Google login temporarily hidden */}
          </div>

          <p style={{ marginTop: "2rem", fontSize: "0.875rem", color: "#ededed" }}>
            Již máte účet?{" "}
            <Link href="/prihlaseni" className="auth-link">
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
    </>
  );
}
