"use client";
import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import * as XLSX from "xlsx";

type VaultAccount = { 
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

function AddVaultModal({ onClose, onSave }: { onClose: () => void; onSave: () => void }) { 
  const [name, setName] = useState(""); 
  const [url, setUrl] = useState(""); 
  const [email, setEmail] = useState(""); 
  const [password, setPassword] = useState(""); 
  const [notes, setNotes] = useState(""); 
  const [showPassword, setShowPassword] = useState(false); 
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [importError, setImportError] = useState("");
  const [importSuccess, setImportSuccess] = useState(0);

  function handleDownloadTemplate() {
    const ws = XLSX.utils.aoa_to_sheet([
      ["NÁZEV", "URL", "E-MAIL / UŽIVATELSKÉ JMÉNO", "HESLO", "POZNÁMKA"],
      ["Viagogo", "https://viagogo.cz/", "muj@email.cz", "heslo123", "poznámka"],
    ]);
    ws["!cols"] = [{ wch: 20 }, { wch: 30 }, { wch: 30 }, { wch: 20 }, { wch: 30 }];
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Záznamy");
    XLSX.writeFile(wb, "sablona-ostatni-ucty.xlsx");
  }

  async function handleImportFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setImportError("");
    setImportSuccess(0);

    const data = await file.arrayBuffer();
    const wb = XLSX.read(data);
    const ws = wb.Sheets[wb.SheetNames[0]];
    const rows = XLSX.utils.sheet_to_json<Record<string, string>>(ws);

    if (rows.length === 0) {
      setImportError("Soubor je prázdný nebo nemá správný formát.");
      return;
    }

    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const inserts = rows.map(row => ({
      user_id: user.id,
      name: String(row["NÁZEV"] ?? "").trim(),
      url: String(row["URL"] ?? "").trim() || null,
      email: String(row["E-MAIL / UŽIVATELSKÉ JMÉNO"] ?? "").trim() || null,
      password_encrypted: String(row["HESLO"] ?? "").trim() || null,
      notes: String(row["POZNÁMKA"] ?? "").trim() || null,
      type: "vault",
    })).filter(r => r.name);

    if (inserts.length === 0) {
      setImportError("Žádný řádek nemá vyplněný NÁZEV.");
      return;
    }

    const { error: insertError } = await supabase.from("accounts").insert(inserts);
    if (insertError) {
      setImportError(insertError.message);
    } else {
      setImportSuccess(inserts.length);
      onSave();
      setTimeout(() => onClose(), 1200);
    }
    e.target.value = "";
  }

  async function handleSave() {
    if (!name.trim()) return setError("Název je povinný.");
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
      notes: notes.trim() || null, 
      type: "vault", 
    }); 

    if (error) setError(error.message); 
    else { onSave(); onClose(); } 
    setSaving(false); 
  } 

  return ( 
    <> 
      <div onClick={onClose} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.75)", zIndex: 100, backdropFilter: "blur(4px)" }} /> 
      <div style={{ 
        position: "fixed", top: "50%", left: "50%", 
        transform: "translate(-50%, -50%)", 
        width: "100%", maxWidth: 500, 
        background: "#111111", border: "1px solid #2a2a2a", 
        borderRadius: 20, padding: "2rem", zIndex: 101, overflow: "hidden", 
      }}> 
        <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 1, background: "linear-gradient(90deg, transparent, #ffffff, transparent)" }} /> 

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.75rem" }}> 
          <h2 style={{ fontSize: "1.1rem", fontWeight: 700, color: "#fff", margin: 0 }}>Přidat záznam</h2>
          <button onClick={onClose} style={{ background: "none", border: "none", color: "#ededed" , cursor: "pointer", fontSize: 22 }}>×</button>
        </div>

        {/* Import banner */}
        <div style={{
          background: "linear-gradient(135deg, rgba(123,108,246,0.08), rgba(80,60,200,0.06))",
          border: "1px solid rgba(123,108,246,0.2)",
          borderRadius: 14,
          padding: "0.9rem 1rem",
          display: "flex",
          alignItems: "center",
          gap: "0.75rem",
          marginBottom: "1.25rem",
        }}>
          <div style={{ fontSize: 22, flexShrink: 0 }}>📊</div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: "#e0dcff", marginBottom: 2 }}>
              Hromadný import záznamů
            </div>
            <div style={{ fontSize: 12, color: "rgba(240,238,255,0.4)" }}>
              Stáhni šablonu · vyplň · nahraj zpět
            </div>
          </div>
          <div style={{ display: "flex", gap: 8, flexShrink: 0 }}>
            <button
              onClick={handleDownloadTemplate}
              style={{
                display: "flex", alignItems: "center", gap: 4,
                padding: "0.4rem 0.75rem",
                background: "rgba(93,232,160,0.1)", border: "1px solid rgba(93,232,160,0.25)",
                color: "#5de8a0", borderRadius: 8,
                fontSize: 12, fontWeight: 600, cursor: "pointer",
              }}
            >
              ↓ Šablona
            </button>
            <label style={{
              display: "flex", alignItems: "center", gap: 4,
              padding: "0.4rem 0.75rem",
              background: "rgba(123,108,246,0.12)", border: "1px solid rgba(123,108,246,0.3)",
              color: "#a89df7", borderRadius: 8,
              fontSize: 12, fontWeight: 600, cursor: "pointer",
            }}>
              ↑ Nahrát
              <input type="file" accept=".xlsx,.csv" onChange={handleImportFile} style={{ display: "none" }} />
            </label>
          </div>
        </div>

        {importError && (
          <div style={{ marginBottom: "1rem", padding: "10px 14px", borderRadius: 8, background: "#2a0a0a", border: "1px solid #7f1d1d", color: "#fca5a5", fontSize: 13 }}>
            {importError}
          </div>
        )}
        {importSuccess > 0 && (
          <div style={{ marginBottom: "1rem", padding: "10px 14px", borderRadius: 8, background: "rgba(93,232,160,0.08)", border: "1px solid rgba(93,232,160,0.3)", color: "#5de8a0", fontSize: 13 }}>
            ✓ Importováno {importSuccess} záznamů
          </div>
        )}

        {error && (
          <div style={{ marginBottom: "1rem", padding: "10px 14px", borderRadius: 8, background: "#2a0a0a", border: "1px solid #7f1d1d", color: "#fca5a5", fontSize: 13 }}>
            {error}
          </div>
        )}

        <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}> 
          <div> 
            <label style={labelStyle}>NÁZEV *</label> 
            <input type="text" placeholder="např. Viagogo/Discord/Ticketswap" value={name} onChange={e => setName(e.target.value)} style={inputStyle} /> 
          </div> 
          <div> 
            <label style={labelStyle}>URL</label> 
            <input type="text" placeholder="https://viagogo.cz/" value={url} onChange={e => setUrl(e.target.value)} style={inputStyle} /> 
          </div> 
          <div> 
            <label style={labelStyle}>E-MAIL / UŽIVATELSKÉ JMÉNO</label> 
            <input type="text" placeholder="email@example.com" value={email} onChange={e => setEmail(e.target.value)} style={inputStyle} /> 
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
                style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", color: "#ededed" , cursor: "pointer", fontSize: 12 }} 
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
            style={{ 
              flex: 2, padding: "0.8rem", 
              background: saving ? "#2a2a2a" : "linear-gradient(135deg, #ffffff, #a0a0a0)", 
              border: "none", borderRadius: 10, 
              color: "#000", fontWeight: 700, fontSize: 14, 
              letterSpacing: "0.05em", cursor: saving ? "default" : "pointer", 
            }} 
          > 
            {saving ? "UKLÁDÁM..." : "PŘIDAT ZÁZNAM"} 
          </button> 
        </div> 
      </div> 
    </> 
  ); 
} 

function EditVaultModal({ account, onClose, onSave }: { account: VaultAccount; onClose: () => void; onSave: () => void }) {
  const [name, setName] = useState(account.name);
  const [url, setUrl] = useState(account.url ?? "");
  const [email, setEmail] = useState(account.email ?? "");
  const [password, setPassword] = useState(account.password_encrypted ?? "");
  const [notes, setNotes] = useState(account.notes ?? "");
  const [showPassword, setShowPassword] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function handleSave() {
    if (!name.trim()) return setError("Název je povinný.");
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
      <div onClick={onClose} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.75)", zIndex: 100, backdropFilter: "blur(4px)" }} />
      <div style={{ position: "fixed", top: "50%", left: "50%", transform: "translate(-50%, -50%)", width: "100%", maxWidth: 500, background: "#111111", border: "1px solid #2a2a2a", borderRadius: 20, padding: "2rem", zIndex: 101, overflow: "hidden" }}>
        <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 1, background: "linear-gradient(90deg, transparent, #ffffff, transparent)" }} />

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.75rem" }}>
          <h2 style={{ fontSize: "1.1rem", fontWeight: 700, color: "#fff", margin: 0 }}>Upravit záznam</h2>
          <button onClick={onClose} style={{ background: "none", border: "none", color: "#ededed" , cursor: "pointer", fontSize: 22 }}>×</button>
        </div>

        {error && (
          <div style={{ marginBottom: "1rem", padding: "10px 14px", borderRadius: 8, background: "#2a0a0a", border: "1px solid #7f1d1d", color: "#fca5a5", fontSize: 13 }}>
            {error}
          </div>
        )}

        <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
          <div>
            <label style={labelStyle}>NÁZEV *</label>
            <input type="text" value={name} onChange={e => setName(e.target.value)} style={inputStyle} />
          </div>
          <div>
            <label style={labelStyle}>URL</label>
            <input type="text" value={url} onChange={e => setUrl(e.target.value)} style={inputStyle} />
          </div>
          <div>
            <label style={labelStyle}>E-MAIL / UŽIVATELSKÉ JMÉNO</label>
            <input type="text" value={email} onChange={e => setEmail(e.target.value)} style={inputStyle} />
          </div>
          <div>
            <label style={labelStyle}>HESLO</label>
            <div style={{ position: "relative" }}>
              <input type={showPassword ? "text" : "password"} value={password} onChange={e => setPassword(e.target.value)} style={{ ...inputStyle, paddingRight: "3rem" }} />
              <button onClick={() => setShowPassword(!showPassword)} style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", color: "#ededed" , cursor: "pointer", fontSize: 12 }}>
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

export default function UctyHeslaTab() { 
  const [accounts, setAccounts] = useState<VaultAccount[]>([]); 
  const [loading, setLoading] = useState(true); 
  const [showModal, setShowModal] = useState(false); 
  const [editAccount, setEditAccount] = useState<VaultAccount | null>(null);
  const [detailAccount, setDetailAccount] = useState<VaultAccount | null>(null);
  const [revealedPasswords, setRevealedPasswords] = useState<Set<string>>(new Set()); 
  const [search, setSearch] = useState("");
  const [selectMode, setSelectMode] = useState(false);
  const [selected, setSelected] = useState<Set<string>>(new Set());

  async function loadAccounts() {
    const supabase = createClient(); 
    const { data } = await supabase 
      .from("accounts") 
      .select("*") 
      .eq("type", "vault") 
      .order("created_at", { ascending: false }); 
    setAccounts(data ?? []); 
    setLoading(false); 
  } 

  useEffect(() => { loadAccounts(); }, []); 

  async function deleteAccount(id: string) { 
    if (!confirm("Opravdu chcete smazat tento záznam?")) return; 
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

  function toggleSelect(id: string) {
    setSelected(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  async function deleteSelected() {
    if (selected.size === 0) return;
    if (!confirm(`Opravdu chcete smazat ${selected.size} záznamů?`)) return;
    const supabase = createClient();
    await supabase.from("accounts").delete().in("id", Array.from(selected));
    setSelected(new Set());
    setSelectMode(false);
    loadAccounts();
  }

  const filtered = accounts.filter(a =>
    a.name.toLowerCase().includes(search.toLowerCase()) || 
    (a.email?.toLowerCase().includes(search.toLowerCase())) 
  ); 

  return ( 
    <div> 
      {showModal && <AddVaultModal onClose={() => setShowModal(false)} onSave={loadAccounts} />} 
      {editAccount && <EditVaultModal account={editAccount} onClose={() => setEditAccount(null)} onSave={loadAccounts} />}

      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1.5rem" }}>
        <div>
          <h1 style={{ fontSize: "1.5rem", fontWeight: 700, color: "#fff", marginBottom: "0.25rem" }}>Účty a hesla</h1>
          <p style={{ fontSize: 13, color: "#ededed"  }}>{accounts.length} {accounts.length === 1 ? "záznam" : accounts.length < 5 ? "záznamy" : "záznamů"}</p>
        </div>
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          {selectMode ? (
            <>
              <span style={{ fontSize: 13, color: "rgba(240,238,255,0.4)" }}>
                {selected.size} vybraných
              </span>
              <button
                onClick={deleteSelected}
                disabled={selected.size === 0}
                style={{
                  padding: "0.65rem 1.1rem",
                  background: selected.size > 0 ? "rgba(239,68,68,0.15)" : "rgba(255,255,255,0.04)",
                  border: `1px solid ${selected.size > 0 ? "rgba(239,68,68,0.4)" : "rgba(255,255,255,0.08)"}`,
                  borderRadius: 10, color: selected.size > 0 ? "#f87171" : "#666",
                  fontWeight: 700, fontSize: 13, cursor: selected.size > 0 ? "pointer" : "default",
                }}
              >
                🗑 Smazat ({selected.size})
              </button>
              <button
                onClick={() => { setSelectMode(false); setSelected(new Set()); }}
                style={{
                  padding: "0.65rem 1.1rem",
                  background: "transparent", border: "1px solid rgba(255,255,255,0.1)",
                  borderRadius: 10, color: "#ededed", fontSize: 13, cursor: "pointer",
                }}
              >
                Zrušit
              </button>
            </>
          ) : (
            <>
              <button
                onClick={() => setSelectMode(true)}
                style={{
                  padding: "0.65rem 1.1rem",
                  background: "transparent", border: "1px solid rgba(255,255,255,0.1)",
                  borderRadius: 10, color: "rgba(240,238,255,0.5)", fontSize: 13, cursor: "pointer",
                }}
              >
                ☑ Označit
              </button>
              <button
                onClick={() => setShowModal(true)}
                style={{
                  padding: "0.65rem 1.25rem",
                  background: "linear-gradient(135deg, #ffffff, #a0a0a0)",
                  border: "none", borderRadius: 10,
                  color: "#000", fontWeight: 700, fontSize: 13,
                  letterSpacing: "0.05em", cursor: "pointer",
                }}
              >
                + Přidat záznam
              </button>
            </>
          )}
        </div>
      </div>

      {/* Search */} 
      {accounts.length > 0 && ( 
        <div style={{ marginBottom: "1.25rem" }}> 
          <input 
            type="text" 
            placeholder="Hledat podle názvu..." 
            value={search} 
            onChange={e => setSearch(e.target.value)} 
            style={{ 
              width: "100%", maxWidth: 320, padding: "0.6rem 1rem", 
              background: "#111111", border: "1px solid #1f1f1f", 
              borderRadius: 10, color: "#fff", fontSize: 14, 
              outline: "none", marginBottom: "1rem", 
              boxSizing: "border-box" as const, 
            }} 
          /> 
        </div> 
      )} 

      {loading && <div style={{ color: "#ededed" , fontSize: 14 }}>Načítání...</div>} 

      {/* Empty state */} 
      {!loading && accounts.length === 0 && ( 
        <div style={{ background: "#111111", border: "1px dashed #2a2a2a", borderRadius: 16, padding: "3rem", textAlign: "center" }}> 
          <div style={{ fontSize: "2.5rem", marginBottom: "1rem" }}>🔑</div> 
          <p style={{ color: "#ededed" , fontSize: 14, marginBottom: "1.5rem" }}>Zatím žádné záznamy. Uložte si přihlašovací údaje bezpečně na jednom místě.</p> 
          <button onClick={() => setShowModal(true)} style={{ padding: "0.65rem 1.5rem", background: "transparent", border: "1px solid #2a2a2a", borderRadius: 10, color: "#ffffff", cursor: "pointer", fontSize: 14 }}> 
            + Přidat záznam 
          </button> 
        </div> 
      )} 

      {detailAccount && (
        <>
          <div onClick={() => setDetailAccount(null)} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.75)", zIndex: 100, backdropFilter: "blur(4px)" }} />
          <div style={{ 
            position: "fixed", top: "50%", left: "50%", 
            transform: "translate(-50%, -50%)", 
            width: "100%", maxWidth: 440, 
            background: "#111111", border: "1px solid #2a2a2a", 
            borderRadius: 20, padding: "1.75rem", zIndex: 101, overflow: "hidden", 
          }}>
            <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 1, background: "linear-gradient(90deg, transparent, #ffffff, transparent)" }} />

            {/* Header */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem" }}>
              <h2 style={{ fontSize: "1.1rem", fontWeight: 700, color: "#fff", margin: 0 }}>{detailAccount.name}</h2>
              <button onClick={() => setDetailAccount(null)} style={{ background: "none", border: "none", color: "#ededed" , cursor: "pointer", fontSize: 22 }}>×</button>
            </div>

            {/* Details */}
            <div style={{ display: "flex", flexDirection: "column", gap: "0" }}>
              {detailAccount.url && (
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "0.75rem 0", borderBottom: "1px solid #141414" }}>
                  <span style={{ fontSize: 12, color: "#ededed"  }}>URL</span>
                  <a href={detailAccount.url.startsWith("http") ? detailAccount.url : "https://" + detailAccount.url}
                    target="_blank" rel="noopener noreferrer"
                    style={{ fontSize: 13, color: "#a78bfa", textDecoration: "none" }}
                    onClick={e => e.stopPropagation()}
                  >
                    {detailAccount.url.replace("https://", "").replace("http://", "").split("/")[0]} ↗
                  </a>
                </div>
              )}
              {detailAccount.email && (
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "0.75rem 0", borderBottom: "1px solid #141414" }}>
                  <span style={{ fontSize: 12, color: "#ededed"  }}>E-mail</span>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <span style={{ fontSize: 13, color: "#ffffff" }}>{detailAccount.email}</span>
                    <button
                      onClick={e => { e.stopPropagation(); navigator.clipboard.writeText(detailAccount.email!); }}
                      style={{ background: "none", border: "none", color: "#ededed" , cursor: "pointer", fontSize: 11 }}
                      onMouseEnter={e => (e.currentTarget as HTMLButtonElement).style.color = "#34d399"}
                      onMouseLeave={e => (e.currentTarget as HTMLButtonElement).style.color = "#ededed"}
                    >kopírovat</button>
                  </div>
                </div>
              )}
              {detailAccount.password_encrypted && (
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "0.75rem 0", borderBottom: "1px solid #141414" }}>
                  <span style={{ fontSize: 12, color: "#ededed"  }}>Heslo</span>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <span style={{ fontSize: 13, color: "#ffffff", letterSpacing: revealedPasswords.has(detailAccount.id) ? "normal" : "0.1em" }}>
                      {revealedPasswords.has(detailAccount.id) ? detailAccount.password_encrypted : "••••••••"}
                    </span>
                    <button
                      onClick={e => { e.stopPropagation(); togglePassword(detailAccount.id); }}
                      style={{ background: "none", border: "none", color: "#ededed" , cursor: "pointer", fontSize: 11 }}
                      onMouseEnter={e => (e.currentTarget as HTMLButtonElement).style.color = "#ffffff"}
                      onMouseLeave={e => (e.currentTarget as HTMLButtonElement).style.color = "#ededed"}
                    >{revealedPasswords.has(detailAccount.id) ? "skrýt" : "zobrazit"}</button>
                    <button
                      onClick={e => { e.stopPropagation(); navigator.clipboard.writeText(detailAccount.password_encrypted!); }}
                      style={{ background: "none", border: "none", color: "#ededed" , cursor: "pointer", fontSize: 11 }}
                      onMouseEnter={e => (e.currentTarget as HTMLButtonElement).style.color = "#34d399"}
                      onMouseLeave={e => (e.currentTarget as HTMLButtonElement).style.color = "#ededed"}
                    >kopírovat</button>
                  </div>
                </div>
              )}
              {detailAccount.notes && (
                <div style={{ padding: "0.75rem 0" }}>
                  <span style={{ fontSize: 12, color: "#ededed" , display: "block", marginBottom: 4 }}>Poznámka</span>
                  <p style={{ fontSize: 13, color: "#ffffff", margin: 0, lineHeight: 1.5 }}>{detailAccount.notes}</p>
                </div>
              )}
            </div>

            {/* Footer buttons */}
            <div style={{ display: "flex", gap: "0.75rem", marginTop: "1.5rem" }}>
              <button
                onClick={e => { e.stopPropagation(); setEditAccount(detailAccount); setDetailAccount(null); }}
                style={{ flex: 1, padding: "0.75rem", background: "transparent", border: "1px solid #2a2a2a", borderRadius: 10, color: "#ffffff", cursor: "pointer", fontSize: 13, fontWeight: 600 }}
              >✎ Upravit</button>
              <button
                onClick={e => { e.stopPropagation(); setDetailAccount(null); }}
                style={{ flex: 1, padding: "0.75rem", background: "linear-gradient(135deg, #ffffff, #a0a0a0)", border: "none", borderRadius: 10, color: "#000", cursor: "pointer", fontSize: 13, fontWeight: 700 }}
              >Zavřít</button>
            </div>
          </div>
        </>
      )}

      {/* Grid */} 
      {!loading && filtered.length > 0 && ( 
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: "1rem" }}> 
          {filtered.map((account) => ( 
            <div
              key={account.id}
              onClick={() => {
                if (selectMode) { toggleSelect(account.id); return; }
                setDetailAccount(account);
              }}
              style={{
                background: selected.has(account.id) ? "rgba(123,108,246,0.1)" : "#111111",
                border: `1px solid ${selected.has(account.id) ? "rgba(123,108,246,0.4)" : "#1a1a1a"}`,
                borderRadius: 16,
                padding: "1.25rem 1.5rem",
                cursor: "pointer",
                transition: "border-color 0.15s, background 0.15s",
                position: "relative",
              }}
              onMouseEnter={e => { if (!selected.has(account.id)) (e.currentTarget as HTMLDivElement).style.borderColor = "#2a2a2a"; }}
              onMouseLeave={e => { if (!selected.has(account.id)) (e.currentTarget as HTMLDivElement).style.borderColor = "#1a1a1a"; }}
            >
              {selectMode && (
                <div style={{
                  position: "absolute", top: 12, right: 12,
                  width: 20, height: 20, borderRadius: 6,
                  border: `2px solid ${selected.has(account.id) ? "#7b6cf6" : "rgba(255,255,255,0.2)"}`,
                  background: selected.has(account.id) ? "#7b6cf6" : "transparent",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 11, color: "#fff", transition: "all 0.15s",
                  zIndex: 1,
                }}>
                  {selected.has(account.id) ? "✓" : ""}
                </div>
              )}
              {/* Header row — name + action buttons only */}
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <div style={{ width: 36, height: 36, borderRadius: 10, background: "linear-gradient(135deg, #1f1f1f, #2a2a2a)", border: "1px solid #2a2a2a", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16 }}>🔑</div>
                  <div>
                    <div style={{ fontWeight: 700, color: "#fff", fontSize: 15 }}>{account.name}</div>
                    {account.url && (
                      <span style={{ fontSize: 11, color: "#ededed"  }}>
                        {account.url.replace("https://", "").replace("http://", "").split("/")[0]}
                      </span>
                    )}
                  </div>
                </div>
                {!selectMode && (
                <div style={{ display: "flex", gap: 4 }} onClick={e => e.stopPropagation()}>
                  <button
                    onClick={() => setEditAccount(account)}
                    style={{ background: "none", border: "none", color: "#ededed" , cursor: "pointer", fontSize: 14, padding: 4 }}
                    onMouseEnter={e => (e.currentTarget as HTMLButtonElement).style.color = "#ffffff"}
                    onMouseLeave={e => (e.currentTarget as HTMLButtonElement).style.color = "#ededed"}
                  >✎</button>
                  <button
                    onClick={() => deleteAccount(account.id)}
                    style={{ background: "none", border: "none", color: "#ededed" , cursor: "pointer", fontSize: 18, padding: 4 }}
                    onMouseEnter={e => (e.currentTarget as HTMLButtonElement).style.color = "#f87171"}
                    onMouseLeave={e => (e.currentTarget as HTMLButtonElement).style.color = "#ededed"}
                  >×</button>
                </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )} 

      {/* No search results */} 
      {!loading && accounts.length > 0 && filtered.length === 0 && ( 
        <div style={{ textAlign: "center", padding: "2rem", color: "#ededed" , fontSize: 14 }}> 
          Žádné výsledky pro "{search}" 
        </div> 
      )} 
    </div> 
  ); 
}
