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
    <div className="min-h-screen flex" style={{ background: "#080808" }}>
      {/* LEFT — Form */}
      <div className="flex flex-col justify-center px-12 w-full max-w-xl">
        <div className="mb-10">
          <span className="text-2xl font-bold tracking-widest" style={{ color: "#fff" }}>TICKETCLUB</span>
        </div>
        <h1 className="text-4xl font-bold text-white mb-2">Registrace</h1>
        <p className="mb-10" style={{ color: "#525252" }}>Vytvořte si nový účet.</p>

        {error && (
          <div className="mb-4 px-4 py-3 rounded-xl text-sm" style={{ background: "#2a0a0a", border: "1px solid #7f1d1d", color: "#fca5a5" }}>
            {error}
          </div>
        )}
        {success && (
          <div className="mb-4 px-4 py-3 rounded-xl text-sm" style={{ background: "#062216", border: "1px solid #14532d", color: "#86efac" }}>
            {success}
          </div>
        )}

        <div className="flex flex-col gap-4">
          <input
            type="text"
            placeholder="Jméno"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            className="w-full px-4 py-3 rounded-xl text-white placeholder-zinc-600 outline-none transition-colors"
            style={{ background: "#111111", border: "1px solid #1f1f1f" }}
          />
          <input
            type="email"
            placeholder="E-mail"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full px-4 py-3 rounded-xl text-white placeholder-zinc-600 outline-none transition-colors"
            style={{ background: "#111111", border: "1px solid #1f1f1f" }}
          />
          <input
            type="password"
            placeholder="Heslo"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full px-4 py-3 rounded-xl text-white placeholder-zinc-600 outline-none transition-colors"
            style={{ background: "#111111", border: "1px solid #1f1f1f" }}
          />
          <input
            type="password"
            placeholder="Potvrdit heslo"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleRegister()}
            className="w-full px-4 py-3 rounded-xl text-white placeholder-zinc-600 outline-none transition-colors"
            style={{ background: "#111111", border: "1px solid #1f1f1f" }}
          />

          <button
            onClick={handleRegister}
            disabled={loading}
            className="w-full py-3 rounded-xl font-semibold tracking-widest text-black transition-opacity hover:opacity-90 mt-2"
            style={{ background: "linear-gradient(135deg, #ffffff 0%, #c0c0c0 50%, #a0a0a0 100%)", opacity: loading ? 0.7 : 1 }}
          >
            {loading ? "REGISTRUJI..." : "REGISTROVAT SE"}
          </button>

          <div className="flex items-center gap-3 my-1">
            <div className="flex-1 h-px" style={{ background: "#1f1f1f" }} />
            <span className="text-xs" style={{ color: "#525252" }}>nebo</span>
            <div className="flex-1 h-px" style={{ background: "#1f1f1f" }} />
          </div>

          <button
            onClick={handleGoogle}
            disabled={loading}
            className="w-full py-3 rounded-xl font-medium text-white flex items-center justify-center gap-3 transition-colors"
            style={{ background: "#111111", border: "1px solid #1f1f1f" }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/></svg>
            Registrovat se přes Google
          </button>
        </div>

        <p className="mt-8 text-sm" style={{ color: "#525252" }}>
          Již máte účet?{" "}
          <Link href="/prihlaseni" className="text-white hover:underline font-medium">
            Přihlásit se
          </Link>
        </p>
      </div>

      {/* RIGHT — Image */}
      <div className="hidden lg:flex flex-1 relative overflow-hidden">
        <div className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: "url('https://images.unsplash.com/photo-1540039155733-5bb30b53aa14?w=1200&q=80')" }} />
        <div className="absolute inset-0" style={{ background: "linear-gradient(to right, #080808 0%, transparent 30%)" }} />
        <div className="absolute bottom-10 left-10 right-10">
          <p className="text-white text-2xl font-bold">Sledujte své zisky.</p>
          <p className="mt-1" style={{ color: "#71717a" }}>Profesionální P&L tracker pro ticket resellery.</p>
        </div>
      </div>
    </div>
  );
}
