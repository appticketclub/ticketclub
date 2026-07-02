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

const inputStyle = {
  width: "100%", padding: "0.75rem 1rem",
  background: "#0a0a0a", border: "1px solid #2a2a2a",
  borderRadius: 10, color: "#fff", fontSize: 14,
  outline: "none", boxSizing: "border-box" as const,
};

const labelStyle = {
  fontSize: 11, fontWeight: 600 as const,
  letterSpacing: "0.08em", color: "#ededed" ,
  display: "block" as const, marginBottom: "0.4rem",
};

function AddAccountModal({ onClose, onSave }: { onClose: () => void; onSave: () => void }) {
  const [name, setName] = useState("");
  const [url, setUrl] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [notes, setNotes] = useState("");
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

    const { error: saveError } = await supabase.from("accounts").insert({
      user_id: user.id,
      name: name.trim(),
      url: url.trim() || null,
      email: email.trim() || null,
      password_encrypted: password || null,
      notes: notes.trim() || null,
      type: "purchase",
    });

    if (saveError) setError(saveError.message);
    else { onSave(); onClose(); }
    setSaving(false);
  }

  return (
    <>
      <div
        onClick={onClose}
        style={{
          position: "fixed", inset: 0, background: "rgba(0,0,0,0.7)",
          zIndex: 100, backdropFilter: "blur(4px)",
        }}
      />
      <div style={{
        position: "fixed", top: "50%", left: "50%",
        transform: "translate(-50%, -50%)",
        width: "100%", maxWidth: 480,
        background: "#111111", border: "1px solid #2a2a2a",
        borderRadius: 20, padding: "2rem", zIndex: 101,
        overflow: "hidden",
      }}>
        <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 1, background: "linear-gradient(90deg, transparent, #ffffff, transparent)" }} />
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.75rem" }}>
          <h2 style={{ fontSize: "1.1rem", fontWeight: 700, color: "#fff", margin: 0 }}>Přidat účet</h2>
          <button onClick={onClose} style={{ background: "none", border: "none", color: "#ededed" , cursor: "pointer", fontSize: 20, lineHeight: 1 }}>×</button>
        </div>

        {error && (
          <div style={{ marginBottom: "1rem", padding: "10px 14px", borderRadius: 8, background: "#2a0a0a", border: "1px solid #7f1d1d", color: "#fca5a5", fontSize: 13 }}>
            {error}
          </div>
        )}

        <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
          <div>
            <label style={labelStyle}>NÁZEV ÚČTU *</label>
            <input type="text" placeholder="např. Email1/TM1" value={name} onChange={e => setName(e.target.value)} style={inputStyle} />
          </div>
          <div>
            <label style={labelStyle}>URL PLATFORMY</label>
            <input type="text" placeholder="https://ticketmaster.cz/" value={url} onChange={e => setUrl(e.target.value)} style={inputStyle} />
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
                style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", color: "#ededed" , cursor: "pointer", fontSize: 13 }}
              >
                {showPassword ? "skrýt" : "zobrazit"}
              </button>
            </div>
          </div>
          <div>
            <label style={labelStyle}>POZNÁMKA</label>
            <textarea
              placeholder="Volitelná poznámka..."
              value={notes}
              onChange={e => setNotes(e.target.value)}
              rows={3}
              style={{ ...inputStyle, resize: "vertical" as const }}
            />
          </div>
        </div>

        <div style={{ display: "flex", gap: "0.75rem", marginTop: "1.75rem" }}>
          <button onClick={onClose} style={{ flex: 1, padding: "0.8rem", background: "transparent", border: "1px solid #2a2a2a", borderRadius: 10, color: "#ededed" , cursor: "pointer", fontSize: 14 }}>
            Zrušit
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            style={{ flex: 2, padding: "0.8rem", background: saving ? "#2a2a2a" : "linear-gradient(135deg, #ffffff, #a0a0a0)", border: "none", borderRadius: 10, color: "#000", fontWeight: 700, fontSize: 14, letterSpacing: "0.05em", cursor: saving ? "default" : "pointer" }}
          >
            {saving ? "UKLÁDÁM..." : "PŘIDAT ÚČET"}
          </button>
        </div>
      </div>
    </>
  );
}

function EditAccountModal({ account, onClose, onSave }: { account: Account; onClose: () => void; onSave: () => void }) {
  const [name, setName] = useState(account.name);
  const [url, setUrl] = useState(account.url ?? "");
  const [email, setEmail] = useState(account.email ?? "");
  const [password, setPassword] = useState(account.password_encrypted ?? "");
  const [notes, setNotes] = useState(account.notes ?? "");
  const [showPassword, setShowPassword] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function handleSave() {
    if (!name.trim()) return setError("Název účtu je povinný.");
    setSaving(true);
    setError("");
    const supabase = createClient();
    const { error: saveError } = await supabase
      .from("accounts")
      .update({
        name: name.trim(),
        url: url.trim() || null,
        email: email.trim() || null,
        password_encrypted: password || null,
        notes: notes.trim() || null,
      })
      .eq("id", account.id);

    if (saveError) setError(saveError.message);
    else { onSave(); onClose(); }
    setSaving(false);
  }

  return (
    <>
      <div onClick={onClose} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.7)", zIndex: 100, backdropFilter: "blur(4px)" }} />
      <div style={{ position: "fixed", top: "50%", left: "50%", transform: "translate(-50%, -50%)", width: "100%", maxWidth: 500, background: "#111111", border: "1px solid #2a2a2a", borderRadius: 20, padding: "2rem", zIndex: 101, overflow: "hidden" }}>
        <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 1, background: "linear-gradient(90deg, transparent, #ffffff, transparent)" }} />
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.75rem" }}>
          <h2 style={{ fontSize: "1.1rem", fontWeight: 700, color: "#fff", margin: 0 }}>Upravit účet</h2>
          <button onClick={onClose} style={{ background: "none", border: "none", color: "#ededed" , cursor: "pointer", fontSize: 20, lineHeight: 1 }}>×</button>
        </div>

        {error && (
          <div style={{ marginBottom: "1rem", padding: "10px 14px", borderRadius: 8, background: "#2a0a0a", border: "1px solid #7f1d1d", color: "#fca5a5", fontSize: 13 }}>
            {error}
          </div>
        )}

        <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
          <div>
            <label style={labelStyle}>NÁZEV ÚČTU *</label>
            <input type="text" value={name} onChange={e => setName(e.target.value)} style={inputStyle} />
          </div>
          <div>
            <label style={labelStyle}>URL PLATFORMY</label>
            <input type="text" value={url} onChange={e => setUrl(e.target.value)} style={inputStyle} />
          </div>
          <div>
            <label style={labelStyle}>E-MAIL</label>
            <input type="email" value={email} onChange={e => setEmail(e.target.value)} style={inputStyle} />
          </div>
          <div>
            <label style={labelStyle}>HESLO</label>
            <div style={{ position: "relative" }}>
              <input type={showPassword ? "text" : "password"} value={password} onChange={e => setPassword(e.target.value)} style={{ ...inputStyle, paddingRight: "3rem" }} />
              <button onClick={() => setShowPassword(!showPassword)} style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", color: "#ededed" , cursor: "pointer", fontSize: 13 }}>
                {showPassword ? "skrýt" : "zobrazit"}
              </button>
            </div>
          </div>
          <div>
            <label style={labelStyle}>POZNÁMKA</label>
            <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={3} style={{ ...inputStyle, resize: "vertical" as const }} />
          </div>
        </div>

        <div style={{ display: "flex", gap: "0.75rem", marginTop: "1.75rem" }}>
          <button onClick={onClose} style={{ flex: 1, padding: "0.8rem", background: "transparent", border: "1px solid #2a2a2a", borderRadius: 10, color: "#ededed" , cursor: "pointer", fontSize: 14 }}>
            Zrušit
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            style={{ flex: 2, padding: "0.8rem", background: saving ? "#2a2a2a" : "linear-gradient(135deg, #ffffff, #a0a0a0)", border: "none", borderRadius: 10, color: "#000", fontWeight: 700, fontSize: 14, letterSpacing: "0.05em", cursor: saving ? "default" : "pointer" }}
          >
            {saving ? "UKLÁDÁM..." : "ULOŽIT ZMĚNY"}
          </button>
        </div>
      </div>
    </>
  );
}

function DetailAccountModal({
  account,
  onClose,
  onEdit,
  revealedPasswords,
  togglePassword,
  copyToClipboard,
}: {
  account: Account;
  onClose: () => void;
  onEdit: () => void;
  revealedPasswords: Set<string>;
  togglePassword: (id: string) => void;
  copyToClipboard: (text: string) => void;
}) {
  return (
    <>
      <div onClick={onClose} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.75)", zIndex: 100, backdropFilter: "blur(4px)" }} />
      <div style={{
        position: "fixed", top: "50%", left: "50%",
        transform: "translate(-50%, -50%)",
        width: "100%", maxWidth: 440,
        background: "#111111", border: "1px solid #2a2a2a",
        borderRadius: 20, padding: "1.75rem", zIndex: 101,
        overflow: "hidden",
      }}>
        <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 1, background: "linear-gradient(90deg, transparent, #ffffff, transparent)" }} />

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem" }}>
          <h2 style={{ fontSize: "1.1rem", fontWeight: 700, color: "#fff", margin: 0 }}>{account.name}</h2>
          <button onClick={onClose} style={{ background: "none", border: "none", color: "#ededed" , cursor: "pointer", fontSize: 22 }}>×</button>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
          {account.url && (
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "0.6rem 0", borderBottom: "1px solid #141414" }}>
              <span style={{ fontSize: 12, color: "#ededed"  }}>URL</span>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <a href={account.url} target="_blank" rel="noopener noreferrer" style={{ fontSize: 13, color: "#a78bfa", textDecoration: "none" }}>
                  {account.url.replace("https://", "").replace("http://", "").split("/")[0]} ↗
                </a>
              </div>
            </div>
          )}
          {account.email && (
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "0.6rem 0", borderBottom: "1px solid #141414" }}>
              <span style={{ fontSize: 12, color: "#ededed"  }}>E-mail</span>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <span style={{ fontSize: 13, color: "#ffffff" }}>{account.email}</span>
                <button
                  onClick={() => copyToClipboard(account.email!)}
                  style={{ background: "none", border: "none", color: "#ededed" , cursor: "pointer", fontSize: 11 }}
                  onMouseEnter={e => (e.currentTarget as HTMLButtonElement).style.color = "#34d399"}
                  onMouseLeave={e => (e.currentTarget as HTMLButtonElement).style.color = "#ededed"}
                >
                  kopírovat
                </button>
              </div>
            </div>
          )}
          {account.password_encrypted && (
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "0.6rem 0", borderBottom: "1px solid #141414" }}>
              <span style={{ fontSize: 12, color: "#ededed"  }}>Heslo</span>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <span style={{ fontSize: 13, color: "#ffffff" }}>
                  {revealedPasswords.has(account.id) ? account.password_encrypted : "••••••••"}
                </span>
                <button
                  onClick={() => togglePassword(account.id)}
                  style={{ background: "none", border: "none", color: "#ededed" , cursor: "pointer", fontSize: 11 }}
                  onMouseEnter={e => (e.currentTarget as HTMLButtonElement).style.color = "#ffffff"}
                  onMouseLeave={e => (e.currentTarget as HTMLButtonElement).style.color = "#ededed"}
                >
                  {revealedPasswords.has(account.id) ? "skrýt" : "zobrazit"}
                </button>
                <button
                  onClick={() => copyToClipboard(account.password_encrypted!)}
                  style={{ background: "none", border: "none", color: "#ededed" , cursor: "pointer", fontSize: 11 }}
                  onMouseEnter={e => (e.currentTarget as HTMLButtonElement).style.color = "#34d399"}
                  onMouseLeave={e => (e.currentTarget as HTMLButtonElement).style.color = "#ededed"}
                >
                  kopírovat
                </button>
              </div>
            </div>
          )}
          {account.notes && (
            <div style={{ padding: "0.6rem 0" }}>
              <span style={{ fontSize: 12, color: "#ededed" , display: "block", marginBottom: 4 }}>Poznámka</span>
              <p style={{ fontSize: 13, color: "#ffffff", margin: 0 }}>{account.notes}</p>
            </div>
          )}
        </div>

        <div style={{ display: "flex", gap: "0.75rem", marginTop: "1.5rem" }}>
          <button
            onClick={onEdit}
            style={{ flex: 1, padding: "0.75rem", background: "transparent", border: "1px solid #2a2a2a", borderRadius: 10, color: "#ffffff", cursor: "pointer", fontSize: 13, fontWeight: 600 }}
          >
            ✎ Upravit
          </button>
          <button
            onClick={onClose}
            style={{ flex: 1, padding: "0.75rem", background: "linear-gradient(135deg, #ffffff, #a0a0a0)", border: "none", borderRadius: 10, color: "#000", cursor: "pointer", fontSize: 13, fontWeight: 700 }}
          >
            Zavřít
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
  const [editAccount, setEditAccount] = useState<Account | null>(null);
  const [detailAccount, setDetailAccount] = useState<Account | null>(null);
  const [revealedPasswords, setRevealedPasswords] = useState<Set<string>>(new Set());
  const [search, setSearch] = useState("");

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

  function copyToClipboard(text: string) {
    navigator.clipboard.writeText(text);
  }

  const filtered = accounts.filter(a =>
    a.name.toLowerCase().includes(search.toLowerCase()) ||
    (a.email?.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div>
      {showModal && <AddAccountModal onClose={() => setShowModal(false)} onSave={loadAccounts} />}
      {editAccount && <EditAccountModal account={editAccount} onClose={() => setEditAccount(null)} onSave={loadAccounts} />}
      {detailAccount && (
        <DetailAccountModal
          account={detailAccount}
          onClose={() => setDetailAccount(null)}
          onEdit={() => { setEditAccount(detailAccount); setDetailAccount(null); }}
          revealedPasswords={revealedPasswords}
          togglePassword={togglePassword}
          copyToClipboard={copyToClipboard}
        />
      )}

      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1.75rem" }}>
        <div>
          <h1 style={{ fontSize: "1.5rem", fontWeight: 700, color: "#fff", marginBottom: "0.25rem" }}>Nákupní účty</h1>
          <p style={{ fontSize: 13, color: "#ededed"  }}>{accounts.length} {accounts.length === 1 ? "účet" : accounts.length < 5 ? "účty" : "účtů"}</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          style={{ padding: "0.65rem 1.25rem", background: "linear-gradient(135deg, #ffffff, #a0a0a0)", border: "none", borderRadius: 10, color: "#000", fontWeight: 700, fontSize: 13, letterSpacing: "0.05em", cursor: "pointer", display: "flex", alignItems: "center", gap: 8 }}
        >
          + Přidat účet
        </button>
      </div>

      {accounts.length > 0 && (
        <input
          type="text"
          placeholder="Hledat podle názvu..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          style={{ width: "100%", maxWidth: 320, padding: "0.6rem 1rem", background: "#111111", border: "1px solid #1f1f1f", borderRadius: 10, color: "#fff", fontSize: 14, outline: "none", marginBottom: "1rem", boxSizing: "border-box" as const }}
        />
      )}

      {loading && <div style={{ color: "#ededed" , fontSize: 14 }}>Načítání...</div>}

      {!loading && accounts.length === 0 && (
        <div style={{ background: "#111111", border: "1px dashed #2a2a2a", borderRadius: 16, padding: "3rem", textAlign: "center" }}>
          <div style={{ fontSize: "2.5rem", marginBottom: "1rem" }}>🔐</div>
          <button onClick={() => setShowModal(true)} style={{ padding: "0.65rem 1.5rem", background: "transparent", border: "1px solid #2a2a2a", borderRadius: 10, color: "#ffffff", cursor: "pointer", fontSize: 14 }}>
            + Přidat účet
          </button>
        </div>
      )}

      {!loading && filtered.length > 0 && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: "1rem" }}>
          {filtered.map((account) => (
            <div
              key={account.id}
              onClick={() => setDetailAccount(account)}
              style={{ background: "#111111", border: "1px solid #1a1a1a", borderRadius: 16, padding: "1.25rem 1.5rem", position: "relative", overflow: "hidden", transition: "border-color 0.2s", cursor: "pointer" }}
              onMouseEnter={e => (e.currentTarget as HTMLDivElement).style.borderColor = "#ededed"}
              onMouseLeave={e => (e.currentTarget as HTMLDivElement).style.borderColor = "#1a1a1a"}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "1rem" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <div style={{ width: 36, height: 36, borderRadius: 10, background: "linear-gradient(135deg, #1f1f1f, #2a2a2a)", border: "1px solid #2a2a2a", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16 }}>
                    🔐
                  </div>
                  <div>
                    <div style={{ fontWeight: 700, color: "#fff", fontSize: 15 }}>{account.name}</div>
                    {account.url && (
                      <a
                        href={account.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={e => e.stopPropagation()}
                        style={{ fontSize: 11, color: "#ededed" , textDecoration: "none" }}
                        onMouseEnter={e => (e.currentTarget as HTMLAnchorElement).style.color = "#ffffff"}
                        onMouseLeave={e => (e.currentTarget as HTMLAnchorElement).style.color = "#ededed"}
                      >
                        {account.url.replace("https://", "").replace("http://", "").split("/")[0]} ↗
                      </a>
                    )}
                  </div>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 2 }}>
                  <button
                    onClick={e => { e.stopPropagation(); setEditAccount(account); }}
                    style={{ background: "none", border: "none", color: "#ededed" , cursor: "pointer", fontSize: 14, padding: 4 }}
                    onMouseEnter={e => (e.currentTarget as HTMLButtonElement).style.color = "#ffffff"}
                    onMouseLeave={e => (e.currentTarget as HTMLButtonElement).style.color = "#ededed"}
                  >
                    ✎
                  </button>
                  <button
                    onClick={e => { e.stopPropagation(); deleteAccount(account.id); }}
                    style={{ background: "none", border: "none", color: "#ededed" , cursor: "pointer", fontSize: 16, padding: 4 }}
                    onMouseEnter={e => (e.currentTarget as HTMLButtonElement).style.color = "#f87171"}
                    onMouseLeave={e => (e.currentTarget as HTMLButtonElement).style.color = "#ededed"}
                  >
                    ×
                  </button>
                </div>
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                {account.email && (
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: 13 }}>
                    <span style={{ color: "#ededed"  }}>E-mail</span>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <span style={{ color: "#ffffff" }}>{account.email}</span>
                      <button
                        onClick={e => { e.stopPropagation(); copyToClipboard(account.email!); }}
                        style={{ background: "none", border: "none", color: "#ededed" , cursor: "pointer", fontSize: 11 }}
                        onMouseEnter={e => (e.currentTarget as HTMLButtonElement).style.color = "#34d399"}
                        onMouseLeave={e => (e.currentTarget as HTMLButtonElement).style.color = "#ededed"}
                      >
                        kopírovat
                      </button>
                    </div>
                  </div>
                )}
                {account.password_encrypted && (
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: 13 }}>
                    <span style={{ color: "#ededed"  }}>Heslo</span>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <span style={{ color: "#ffffff", letterSpacing: revealedPasswords.has(account.id) ? "normal" : "0.1em" }}>
                        {revealedPasswords.has(account.id) ? account.password_encrypted : "••••••••"}
                      </span>
                      <button
                        onClick={e => { e.stopPropagation(); togglePassword(account.id); }}
                        style={{ background: "none", border: "none", color: "#ededed" , cursor: "pointer", fontSize: 11 }}
                        onMouseEnter={e => (e.currentTarget as HTMLButtonElement).style.color = "#ffffff"}
                        onMouseLeave={e => (e.currentTarget as HTMLButtonElement).style.color = "#ededed"}
                      >
                        {revealedPasswords.has(account.id) ? "skrýt" : "zobrazit"}
                      </button>
                      <button
                        onClick={e => { e.stopPropagation(); copyToClipboard(account.password_encrypted!); }}
                        style={{ background: "none", border: "none", color: "#ededed" , cursor: "pointer", fontSize: 11 }}
                        onMouseEnter={e => (e.currentTarget as HTMLButtonElement).style.color = "#34d399"}
                        onMouseLeave={e => (e.currentTarget as HTMLButtonElement).style.color = "#ededed"}
                      >
                        kopírovat
                      </button>
                    </div>
                  </div>
                )}
                {account.notes && (
                  <div style={{ marginTop: 4, padding: "8px 10px", background: "#0a0a0a", borderRadius: 8, fontSize: 12, color: "#ededed" , fontStyle: "italic" }}>
                    {account.notes}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {!loading && accounts.length > 0 && filtered.length === 0 && (
        <div style={{ textAlign: "center", padding: "2rem", color: "#ededed" , fontSize: 14 }}>
          Žádné výsledky pro "{search}"
        </div>
      )}
    </div>
  );
}
