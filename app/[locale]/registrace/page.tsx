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
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { background: #07060f; color: #f0eeff; font-family: 'Inter', -apple-system, sans-serif; min-height: 100vh; }

        /* Animated blobs */
        .bg-fixed { position: fixed; inset: 0; z-index: 0; pointer-events: none; overflow: hidden; }
        .blob { position: absolute; border-radius: 50%; filter: blur(80px); }
        .blob1 { top: -15%; left: -5%; width: 50vw; height: 50vw; background: radial-gradient(circle, rgba(110,60,255,0.18) 0%, transparent 70%); animation: b1 18s ease-in-out infinite; }
        .blob2 { bottom: 5%; right: -10%; width: 40vw; height: 40vw; background: radial-gradient(circle, rgba(150,80,255,0.13) 0%, transparent 70%); animation: b2 22s ease-in-out infinite; }
        @keyframes b1 { 0%,100%{transform:translate(0,0) scale(1)} 50%{transform:translate(40px,-60px) scale(1.1)} }
        @keyframes b2 { 0%,100%{transform:translate(0,0) scale(1)} 50%{transform:translate(-30px,40px) scale(0.9)} }

        /* Page wrapper */
        .auth-page { position: relative; z-index: 1; min-height: 100vh; display: flex; flex-direction: column; align-items: center; justify-content: center; padding-top: 16px; padding-bottom: 16px; padding-left: max(16px, env(safe-area-inset-left,0px)); padding-right: max(16px, env(safe-area-inset-right,0px)); }

        /* Card */
        .auth-card { width: 100%; max-width: 400px; background: linear-gradient(145deg, rgba(24,22,38,0.95), rgba(16,14,26,0.97)); border: 1px solid rgba(123,108,246,0.2); border-radius: 24px; padding: 2.5rem; position: relative; overflow: hidden; backdrop-filter: blur(20px); -webkit-backdrop-filter: blur(20px); box-shadow: 0 24px 60px rgba(0,0,0,0.5); }
        .auth-card::before { content: ''; position: absolute; top: 0; left: 0; right: 0; height: 1px; background: linear-gradient(90deg, transparent, rgba(123,108,246,0.5), transparent); }

        /* Logo */
        .auth-logo { display: flex; align-items: center; gap: 0.6rem; margin-bottom: 2rem; }
        .logo-mark { width: 34px; height: 34px; border-radius: 9px; background: linear-gradient(135deg, #7b6cf6, #9d8ff5); display: flex; align-items: center; justify-content: center; font-size: 14px; font-weight: 800; color: #fff; box-shadow: 0 4px 14px rgba(123,108,246,0.4); }
        .logo-text { font-size: 16px; font-weight: 700; color: #fff; }

        /* Heading */
        .auth-title { font-size: 26px; font-weight: 800; color: #fff; margin-bottom: 0.4rem; }
        .auth-sub { font-size: 14px; color: rgba(240,238,255,0.4); margin-bottom: 2rem; }

        /* Field */
        .field { margin-bottom: 1rem; }
        .field-label { display: block; font-size: 11px; font-weight: 600; letter-spacing: 0.06em; text-transform: uppercase; color: rgba(240,238,255,0.3); margin-bottom: 0.4rem; }
        .field-wrap { position: relative; }
        .field-icon { position: absolute; left: 14px; top: 50%; transform: translateY(-50%); color: rgba(240,238,255,0.25); font-size: 14px; pointer-events: none; }
        .field input { width: 100%; background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.09); border-radius: 12px; padding: 0.75rem 1rem 0.75rem 2.75rem; color: #f0eeff; font-size: 14px; font-family: inherit; outline: none; transition: all 0.15s; }
        .field input:focus { border-color: rgba(123,108,246,0.5); background: rgba(123,108,246,0.07); box-shadow: 0 0 0 3px rgba(123,108,246,0.12); }
        .field input::placeholder { color: rgba(240,238,255,0.2); }

        /* Submit button */
        .btn-submit { width: 100%; padding: 0.85rem; background: linear-gradient(135deg, #7b6cf6, #9d8ff5); border: none; color: #fff; border-radius: 12px; font-size: 15px; font-weight: 700; font-family: inherit; cursor: pointer; box-shadow: 0 4px 24px rgba(123,108,246,0.4); margin-bottom: 1.5rem; letter-spacing: 0.02em; transition: all 0.2s; }
        .btn-submit:hover { transform: translateY(-1px); box-shadow: 0 6px 32px rgba(123,108,246,0.5); }
        .btn-submit:disabled { opacity: 0.7; cursor: default; transform: none; }

        /* Footer link */
        .auth-footer { text-align: center; font-size: 13px; color: rgba(240,238,255,0.35); }
        .auth-footer a { color: #a89df7; text-decoration: none; font-weight: 600; }
        .auth-footer a:hover { color: #c4baff; }

        /* Messages */
        .error-msg { background: rgba(248,113,113,0.1); border: 1px solid rgba(248,113,113,0.2); border-radius: 10px; padding: 0.75rem 1rem; font-size: 13px; color: #f87171; margin-bottom: 1rem; }
        .success-msg { background: rgba(93,232,160,0.1); border: 1px solid rgba(93,232,160,0.2); border-radius: 10px; padding: 0.75rem 1rem; font-size: 13px; color: #5de8a0; margin-bottom: 1rem; }

        @media (max-width: 480px) {
          .auth-card { padding: 1.75rem; border-radius: 20px; }
          .auth-title { font-size: 22px; }
        }
      `}</style>

      {/* Animated background */}
      <div className="bg-fixed">
        <div className="blob blob1" />
        <div className="blob blob2" />
      </div>

      <div className="auth-page">
        <div className="auth-card">
          {/* Logo */}
          <div className="auth-logo">
            <div className="logo-mark">TC</div>
            <span className="logo-text">TicketClub</span>
          </div>

          <h1 className="auth-title">Registrace</h1>
          <p className="auth-sub">Vytvořte si nový účet.</p>

          {error && <div className="error-msg">{error}</div>}
          {success && <div className="success-msg">{success}</div>}

          <div className="field">
            <label className="field-label">Jméno</label>
            <div className="field-wrap">
              <span className="field-icon">👤</span>
              <input
                type="text"
                placeholder="Jan Novák"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
              />
            </div>
          </div>

          <div className="field">
            <label className="field-label">E-mail</label>
            <div className="field-wrap">
              <span className="field-icon">✉</span>
              <input
                type="email"
                placeholder="vas@email.cz"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
          </div>

          <div className="field">
            <label className="field-label">Heslo</label>
            <div className="field-wrap">
              <span className="field-icon">🔒</span>
              <input
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
          </div>

          <div className="field">
            <label className="field-label">Potvrdit heslo</label>
            <div className="field-wrap">
              <span className="field-icon">🔒</span>
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
            className="btn-submit"
            onClick={handleRegister}
            disabled={loading}
            style={{ marginTop: "0.5rem" }}
          >
            {loading ? "Registruji…" : "Registrovat se →"}
          </button>

          <div className="auth-footer">
            Již máte účet?{" "}
            <Link href="/prihlaseni">Přihlásit se</Link>
          </div>
        </div>
      </div>
    </>
  );
}
