"use client";
import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";

type Account = {
  id: string;
  name: string;
  url: string | null;
  email: string | null;
  password_encrypted: string | null;
  notes: string | null;
  created_at: string;
};

function Modal({ onClose, onSave }: { onClose: () => void; onSave: () => void }) {
  const [name, setName] = useState("");
  const [url, setUrl] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function handleSave() {
    if (!name.trim()) return setError("Název účtu je povinný.");
    setSaving(true);
    setError("");
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { error } = await supabase.from("accounts").insert({
      user_id: user.id,
      name: name.trim(),
      url: url.trim() || null,
      email: email.trim() || null,
      password_encrypted: password || null,
      type: "purchase",
    });

    if (error) setError(error.message);
    else { onSave(); onClose(); }
    setSaving(false);
  }

  const inputStyle = {
    width: "100%", padding: "0.75rem 1rem",
    background: "#0a0a0a", border: "1px solid #2a2a2a",
    borderRadius: 10, color: "#fff", fontSize: 14,
    outline: "none", boxSizing: "border-box" as const,
  };

  const labelStyle = {
    fontSize: 11, fontWeight: 600 as const,
    letterSpacing: "0.08em", color: "#525252",
    display: "block" as const, marginBottom: "0.4rem",
  };

  return (
    <>
      {/* Overlay */}
      <div
        onClick={onClose}
        style={{
          position: "fixed", inset: 0, background: "rgba(0,0,0,0.7)",
          zIndex: 100, backdropFilter: "blur(4px)",
        }}
      />

      {/* Modal */}
      <div style={{
        position: "fixed", top: "50%", left: "50%",
        transform: "translate(-50%, -50%)",
        width: "100%", maxWidth: 480,
        background: "#111111", border: "1px solid #2a2a2a",
        borderRadius: 20, padding: "2rem", zIndex: 101,
        overflow: "hidden",
      }}>
        {/* Top chrome line */}
        <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 1, background: "linear-gradient(90deg, transparent, #c0c0c0, transparent)" }} />

        {/* Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.75rem" }}>
          <h2 style={{ fontSize: "1.1rem", fontWeight: 700, color: "#fff", margin: 0 }}>Přidat účet</h2>
          <button
            onClick={onClose}
            style={{ background: "none", border: "none", color: "#525252", cursor: "pointer", fontSize: 20, lineHeight: 1 }}
          >
            ×
          </button>
        </div>

        {error && (
          <div style={{ marginBottom: "1rem", padding: "10px 14px", borderRadius: 8, background: "#2a0a0a", border: "1px solid #7f1d1d", color: "#fca5a5", fontSize: 13 }}>
            {error}
          </div>
        )}

        <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
          <div>
            <label style={labelStyle}>NÁZEV ÚČTU *</label>
            <input type="text" placeholder="např. Viagogo hlavní" value={name} onChange={e => setName(e.target.value)} style={inputStyle} />
          </div>
          <div>
            <label style={labelStyle}>URL PLATFORMY</label>
            <input type="text" placeholder="https://viagogo.com" value={url} onChange={e => setUrl(e.target.value)} style={inputStyle} />
          </div>
          <div>
            <label style={labelStyle}>E-MAIL</label>
            <input type="email" placeholder="email@example.com" value={email} onChange={e => setEmail(e.target.value)} style={inputStyle} />
          </div>
          <div>
            <label style={labelStyle}>HESLO</label>
            <div style={{ position: "relative" }}>
              <input
                type={showPassword ? "text" : "password"}
                placeholder="••••••••"
                value={password}
                onChange={e => setPassword(e.target.value)}
                style={{ ...inputStyle, paddingRight: "3rem" }}
              />
              <button
                onClick={() => setShowPassword(!showPassword)}
                style={{
                  position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)",
                  background: "none", border: "none", color: "#525252", cursor: "pointer", fontSize: 13,
                }}
              >
                {showPassword ? "skrýt" : "zobrazit"}
              </button>
            </div>
          </div>
        </div>

        <div style={{ display: "flex", gap: "0.75rem", marginTop: "1.75rem" }}>
          <button
            onClick={onClose}
            style={{
              flex: 1, padding: "0.8rem",
              background: "transparent", border: "1px solid #2a2a2a",
              borderRadius: 10, color: "#525252", cursor: "pointer", fontSize: 14,
            }}
          >
            Zrušit
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            style={{
              flex: 2, padding: "0.8rem",
              background: saving ? "#2a2a2a" : "linear-gradient(135deg, #ffffff, #a0a0a0)",
              border: "none", borderRadius: 10,
              color: "#000", fontWeight: 700, fontSize: 14,
              letterSpacing: "0.05em", cursor: saving ? "default" : "pointer",
            }}
          >
            {saving ? "UKLÁDÁM..." : "PŘIDAT ÚČET"}
          </button>
        </div>
      </div>
    </>
  );
}

export default function NakupniUctyTab() {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [revealedPasswords, setRevealedPasswords] = useState<Set<string>>(new Set());

  async function loadAccounts() {
    const supabase = createClient();
    const { data } = await supabase.from("accounts").select("*").eq("type", "purchase").order("created_at", { ascending: false });
    setAccounts(data ?? []);
    setLoading(false);
  }

  useEffect(() => { loadAccounts(); }, []);

  async function deleteAccount(id: string) {
    if (!confirm("Opravdu chcete smazat tento účet?")) return;
    const supabase = createClient();
    await supabase.from("accounts").delete().eq("id", id);
    loadAccounts();
  }

  function togglePassword(id: string) {
    setRevealedPasswords(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  return (
    <div>
      {showModal && <Modal onClose={() => setShowModal(false)} onSave={loadAccounts} />}

      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1.75rem" }}>
        <div>
          <h1 style={{ fontSize: "1.5rem", fontWeight: 700, color: "#fff", marginBottom: "0.25rem" }}>Nákupní účty</h1>
          <p style={{ fontSize: 13, color: "#3a3a3a" }}>{accounts.length} {accounts.length === 1 ? "účet" : accounts.length < 5 ? "účty" : "účtů"}</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          style={{
            padding: "0.65rem 1.25rem",
            background: "linear-gradient(135deg, #ffffff, #a0a0a0)",
            border: "none", borderRadius: 10,
            color: "#000", fontWeight: 700, fontSize: 13,
            letterSpacing: "0.05em", cursor: "pointer",
            display: "flex", alignItems: "center", gap: 8,
          }}
        >
          + Přidat účet
        </button>
      </div>

      {/* Loading */}
      {loading && <div style={{ color: "#525252", fontSize: 14 }}>Načítání...</div>}

      {/* Empty state */}
      {!loading && accounts.length === 0 && (
        <div style={{
          background: "#111111", border: "1px dashed #2a2a2a",
          borderRadius: 16, padding: "3rem", textAlign: "center",
        }}>
          <div style={{ fontSize: "2.5rem", marginBottom: "1rem" }}>🔐</div>
          <p style={{ color: "#525252", fontSize: 14, marginBottom: "1.5rem" }}>Zatím žádné účty. Přidejte svůj první reseller účet.</p>
          <button
            onClick={() => setShowModal(true)}
            style={{
              padding: "0.65rem 1.5rem",
              background: "transparent", border: "1px solid #2a2a2a",
              borderRadius: 10, color: "#c0c0c0", cursor: "pointer", fontSize: 14,
            }}
          >
            + Přidat účet
          </button>
        </div>
      )}

      {/* Accounts grid */}
      {!loading && accounts.length > 0 && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: "1rem" }}>
          {accounts.map((account) => (
            <div key={account.id} style={{
              background: "#111111", border: "1px solid #1a1a1a",
              borderRadius: 16, padding: "1.25rem 1.5rem",
              position: "relative", overflow: "hidden",
              transition: "border-color 0.2s",
            }}
            onMouseEnter={e => (e.currentTarget as HTMLDivElement).style.borderColor = "#2a2a2a"}
            onMouseLeave={e => (e.currentTarget as HTMLDivElement).style.borderColor = "#1a1a1a"}
            >
              {/* Header */}
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "1rem" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <div style={{
                    width: 36, height: 36, borderRadius: 10,
                    background: "linear-gradient(135deg, #1f1f1f, #2a2a2a)",
                    border: "1px solid #2a2a2a",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: 16,
                  }}>
                    🔐
                  </div>
                  <div>
                    <div style={{ fontWeight: 700, color: "#fff", fontSize: 15 }}>{account.name}</div>
                    {account.url && (
                      <a href={account.url} target="_blank" rel="noopener noreferrer"
                        style={{ fontSize: 11, color: "#3a3a3a", textDecoration: "none" }}
                        onMouseEnter={e => (e.currentTarget as HTMLAnchorElement).style.color = "#c0c0c0"}
                        onMouseLeave={e => (e.currentTarget as HTMLAnchorElement).style.color = "#3a3a3a"}
                      >
                        {account.url.replace("https://", "").replace("http://", "").split("/")[0]} ↗
                      </a>
                    )}
                  </div>
                </div>
                <button
                  onClick={() => deleteAccount(account.id)}
                  style={{ background: "none", border: "none", color: "#3a3a3a", cursor: "pointer", fontSize: 16, padding: 4 }}
                  onMouseEnter={e => (e.currentTarget as HTMLButtonElement).style.color = "#f87171"}
                  onMouseLeave={e => (e.currentTarget as HTMLButtonElement).style.color = "#3a3a3a"}
                >
                  ×
                </button>
              </div>

              {/* Details */}
              <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                {account.email && (
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13 }}>
                    <span style={{ color: "#3a3a3a" }}>E-mail</span>
                    <span style={{ color: "#c0c0c0" }}>{account.email}</span>
                  </div>
                )}
                {account.password_encrypted && (
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: 13 }}>
                    <span style={{ color: "#3a3a3a" }}>Heslo</span>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <span style={{ color: "#c0c0c0", letterSpacing: revealedPasswords.has(account.id) ? "normal" : "0.1em" }}>
                        {revealedPasswords.has(account.id) ? account.password_encrypted : "••••••••"}
                      </span>
                      <button
                        onClick={() => togglePassword(account.id)}
                        style={{ background: "none", border: "none", color: "#3a3a3a", cursor: "pointer", fontSize: 11 }}
                        onMouseEnter={e => (e.currentTarget as HTMLButtonElement).style.color = "#c0c0c0"}
                        onMouseLeave={e => (e.currentTarget as HTMLButtonElement).style.color = "#3a3a3a"}
                      >
                        {revealedPasswords.has(account.id) ? "skrýt" : "zobrazit"}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
