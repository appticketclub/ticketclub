"use client";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

export default function UcetPageClient({ user, profile, subscription }: { user: any; profile: any; subscription: any }) {
  const router = useRouter();
  const supabase = createClient();

  const [fullName, setFullName] = useState(profile?.full_name ?? "");
  const [saving, setSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState("");

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordMsg, setPasswordMsg] = useState("");
  const [changingPassword, setChangingPassword] = useState(false);

  const [resetConfirm, setResetConfirm] = useState("");
  const [resetting, setResetting] = useState(false);
  const [resetMsg, setResetMsg] = useState("");

  const [deleteConfirm, setDeleteConfirm] = useState("");
  const [deleting, setDeleting] = useState(false);
  const [extensionKey, setExtensionKey] = useState<string | null>(null);
  const [loadingKey, setLoadingKey] = useState(false);
  const [showKey, setShowKey] = useState(false);

  const cardStyle = {
    background: "#111111",
    border: "1px solid #1a1a1a",
    borderRadius: 16,
    padding: "1.5rem",
    marginBottom: "1rem",
    position: "relative" as const,
    overflow: "hidden" as const,
  };

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

  async function saveProfile() {
    setSaving(true);
    setSaveMsg("");
    const { error } = await supabase.from("profiles").update({ full_name: fullName }).eq("id", user.id);
    setSaveMsg(error ? `Chyba: ${error.message}` : "✓ Uloženo");
    setSaving(false);
  }

  async function changePassword() {
    if (newPassword !== confirmPassword) return setPasswordMsg("Hesla se neshodují");
    if (newPassword.length < 6) return setPasswordMsg("Heslo musí mít alespoň 6 znaků");
    setChangingPassword(true);
    setPasswordMsg("");
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    setPasswordMsg(error ? `Chyba: ${error.message}` : "✓ Heslo bylo změněno");
    setCurrentPassword(""); setNewPassword(""); setConfirmPassword("");
    setChangingPassword(false);
  }

  async function resetAccount() {
    if (resetConfirm !== "reset") return setResetMsg("Napište přesně: reset");
    setResetting(true);
    setResetMsg("");
    try {
      await Promise.all([
        supabase.from("purchases").delete().eq("user_id", user.id),
        supabase.from("sales").delete().eq("user_id", user.id),
        supabase.from("banners").delete().eq("user_id", user.id),
        supabase.from("capital_history").delete().eq("user_id", user.id),
        supabase.from("expenses").delete().eq("user_id", user.id),
        supabase.from("ai_cache").delete().eq("user_id", user.id),
      ]);
      await supabase.from("profiles").update({ capital: 0, capital_initial: 0 }).eq("id", user.id);
      setResetMsg("✓ Účet byl resetován");
      setResetConfirm("");
    } catch (e: any) {
      setResetMsg(`Chyba: ${e.message}`);
    }
    setResetting(false);
  }

  async function deleteAccount() {
    if (deleteConfirm !== "smazat") return;
    setDeleting(true);
    await supabase.auth.signOut();
    router.push("/prihlaseni");
  }

  async function getExtensionKey() {
    setLoadingKey(true);
    try {
      const res = await fetch("/api/extension/generate-key", { method: "POST" });
      const data = await res.json();
      if (data.key) setExtensionKey(data.key);
    } catch (e) {
      console.error(e);
    }
    setLoadingKey(false);
  }

  useEffect(() => {
    getExtensionKey();
  }, []);

  return (
    <div>
      {/* Header */}
      <div style={{ marginBottom: "2rem" }}>
        <a href="/dostupne-sluzby" style={{ fontSize: 13, color: "#525252", textDecoration: "none", display: "inline-flex", alignItems: "center", gap: 6, marginBottom: "1rem" }}>
          ← Zpět na přehled
        </a>
        <h1 style={{ fontSize: "1.75rem", fontWeight: 700, color: "#fff", marginBottom: "0.25rem" }}>Můj účet</h1>
        <p style={{ fontSize: 13, color: "#3a3a3a" }}>{user.email}</p>
      </div>

      {/* Profile info */}
      <div style={cardStyle}>
        <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 1, background: "linear-gradient(90deg, transparent, #c0c0c0, transparent)" }} />
        <h2 style={{ fontSize: "1rem", fontWeight: 700, color: "#fff", marginBottom: "1.25rem" }}>Osobní údaje</h2>
        <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
          <div>
            <label style={labelStyle}>E-MAIL</label>
            <div style={{ ...inputStyle, color: "#525252", cursor: "default" }}>{user.email}</div>
          </div>
          <div>
            <label style={labelStyle}>CELÉ JMÉNO</label>
            <input type="text" value={fullName} onChange={e => setFullName(e.target.value)} style={inputStyle} placeholder="Vaše jméno" />
          </div>
        </div>
        {saveMsg && <p style={{ fontSize: 13, color: saveMsg.startsWith("✓") ? "#34d399" : "#f87171", marginTop: 12 }}>{saveMsg}</p>}
        <button onClick={saveProfile} disabled={saving} style={{
          marginTop: "1.25rem", padding: "0.75rem 1.5rem",
          background: "linear-gradient(135deg, #ffffff, #a0a0a0)",
          border: "none", borderRadius: 10, color: "#000",
          fontWeight: 700, fontSize: 13, cursor: "pointer", letterSpacing: "0.05em",
        }}>
          {saving ? "Ukládám..." : "Uložit změny"}
        </button>
      </div>

      {/* Change password */}
      <div style={cardStyle}>
        <h2 style={{ fontSize: "1rem", fontWeight: 700, color: "#fff", marginBottom: "1.25rem" }}>Změna hesla</h2>
        <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
          <div>
            <label style={labelStyle}>NOVÉ HESLO</label>
            <input type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)} style={inputStyle} placeholder="••••••••" />
          </div>
          <div>
            <label style={labelStyle}>POTVRDIT HESLO</label>
            <input type="password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} style={inputStyle} placeholder="••••••••" />
          </div>
        </div>
        {passwordMsg && <p style={{ fontSize: 13, color: passwordMsg.startsWith("✓") ? "#34d399" : "#f87171", marginTop: 12 }}>{passwordMsg}</p>}
        <button onClick={changePassword} disabled={changingPassword} style={{
          marginTop: "1.25rem", padding: "0.75rem 1.5rem",
          background: "transparent", border: "1px solid #2a2a2a",
          borderRadius: 10, color: "#c0c0c0",
          fontWeight: 600, fontSize: 13, cursor: "pointer",
        }}>
          {changingPassword ? "Měním..." : "Změnit heslo"}
        </button>
      </div>

      {/* Subscription */}
      <div style={cardStyle}>
        <h2 style={{ fontSize: "1rem", fontWeight: 700, color: "#fff", marginBottom: "1.25rem" }}>Můj plán</h2>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{
            padding: "6px 16px", borderRadius: 8, fontSize: 13, fontWeight: 700,
            background: subscription?.plan === "pro" ? "linear-gradient(135deg, #7c3aed, #5b21b6)" : "#1a1a1a",
            color: subscription?.plan === "pro" ? "#fff" : "#525252",
            border: subscription?.plan === "pro" ? "none" : "1px solid #2a2a2a",
          }}>
            {subscription?.plan === "pro" ? "⭐ PRO" : "FREE"}
          </div>
          <span style={{ fontSize: 13, color: "#525252" }}>
            {subscription?.plan === "pro" ? "Aktivní předplatné" : "Základní plán"}
          </span>
        </div>
        {subscription?.plan === "free" && (
          <p style={{ fontSize: 12, color: "#3a3a3a", marginTop: 12 }}>
            Upgrade na Pro plán bude brzy dostupný.
          </p>
        )}
      </div>

      {/* Extension License */}
      <div style={cardStyle}>
        <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 1, background: "linear-gradient(90deg, transparent, #7c3aed, transparent)" }} />
        <h2 style={{ fontSize: "1rem", fontWeight: 700, color: "#fff", marginBottom: "0.5rem" }}>Extension licence</h2>
        <p style={{ fontSize: 12, color: "#3a3a3a", marginBottom: "1.25rem" }}>
          Použijte tento klíč pro aktivaci TicketClub Extension v Chrome.
        </p>

        {loadingKey ? (
          <div style={{ fontSize: 13, color: "#525252" }}>Načítám klíč...</div>
        ) : extensionKey ? (
          <div>
            <div style={{ display: "flex", gap: "0.75rem", alignItems: "center", marginBottom: "0.75rem" }}>
              <div
                style={{
                  flex: 1,
                  padding: "0.75rem 1rem",
                  background: "#0a0a0a",
                  border: "1px solid #2a2a2a",
                  borderRadius: 10,
                  fontFamily: "monospace",
                  fontSize: 15,
                  fontWeight: 700,
                  color: "#a78bfa",
                  letterSpacing: "0.1em",
                }}
              >
                {showKey ? extensionKey : "TC-••••-••••-••••"}
              </div>
              <button
                onClick={() => setShowKey(!showKey)}
                style={{ padding: "0.75rem 1rem", background: "transparent", border: "1px solid #2a2a2a", borderRadius: 10, color: "#525252", cursor: "pointer", fontSize: 12, whiteSpace: "nowrap" as const }}
              >
                {showKey ? "Skrýt" : "Zobrazit"}
              </button>
              <button
                onClick={() => {
                  navigator.clipboard.writeText(extensionKey);
                }}
                style={{ padding: "0.75rem 1rem", background: "linear-gradient(135deg, #7c3aed, #5b21b6)", border: "none", borderRadius: 10, color: "#fff", cursor: "pointer", fontSize: 12, fontWeight: 700, whiteSpace: "nowrap" as const }}
              >
                Kopírovat
              </button>
            </div>
            <p style={{ fontSize: 11, color: "#3a3a3a" }}>
              Klíč je unikátní pro váš účet. Nesdílejte ho s nikým.
            </p>
          </div>
        ) : (
          <button
            onClick={getExtensionKey}
            style={{ padding: "0.75rem 1.5rem", background: "linear-gradient(135deg, #7c3aed, #5b21b6)", border: "none", borderRadius: 10, color: "#fff", fontWeight: 700, fontSize: 13, cursor: "pointer" }}
          >
            Vygenerovat klíč
          </button>
        )}
      </div>

      {/* Danger zone */}
      <div style={{ ...cardStyle, border: "1px solid rgba(248,113,113,0.2)", background: "#110a0a" }}>
        <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 1, background: "linear-gradient(90deg, transparent, rgba(248,113,113,0.4), transparent)" }} />
        <h2 style={{ fontSize: "1rem", fontWeight: 700, color: "#f87171", marginBottom: "0.5rem" }}>Nebezpečná zóna</h2>
        <p style={{ fontSize: 13, color: "#525252", marginBottom: "1.5rem" }}>Tyto akce jsou nevratné. Postupujte opatrně.</p>

        {/* Reset account */}
        <div style={{ padding: "1.25rem", background: "#0a0a0a", border: "1px solid #2a2a2a", borderRadius: 12, marginBottom: "1rem" }}>
          <div style={{ fontSize: 14, fontWeight: 600, color: "#fbbf24", marginBottom: 4 }}>Resetovat účet</div>
          <p style={{ fontSize: 12, color: "#525252", marginBottom: "1rem" }}>
            Smaže všechny nákupy, prodeje, bannery a vynuluje kapitál. Účet zůstane aktivní.
          </p>
          <div style={{ display: "flex", gap: "0.75rem", alignItems: "center" }}>
            <input
              type="text"
              placeholder='Napište "reset" pro potvrzení'
              value={resetConfirm}
              onChange={e => setResetConfirm(e.target.value)}
              style={{ ...inputStyle, flex: 1 }}
            />
            <button
              onClick={resetAccount}
              disabled={resetting || resetConfirm !== "reset"}
              style={{
                padding: "0.75rem 1.25rem", fontSize: 13, fontWeight: 700,
                background: resetConfirm === "reset" ? "#fbbf24" : "#1a1a1a",
                border: "none", borderRadius: 10,
                color: resetConfirm === "reset" ? "#000" : "#525252",
                cursor: resetConfirm === "reset" ? "pointer" : "default",
                whiteSpace: "nowrap" as const,
              }}
            >
              {resetting ? "Resetuji..." : "Resetovat"}
            </button>
          </div>
          {resetMsg && <p style={{ fontSize: 13, color: resetMsg.startsWith("✓") ? "#34d399" : "#f87171", marginTop: 8 }}>{resetMsg}</p>}
        </div>

        {/* Delete account */}
        <div style={{ padding: "1.25rem", background: "#0a0a0a", border: "1px solid rgba(248,113,113,0.2)", borderRadius: 12 }}>
          <div style={{ fontSize: 14, fontWeight: 600, color: "#f87171", marginBottom: 4 }}>Smazat účet</div>
          <p style={{ fontSize: 12, color: "#525252", marginBottom: "1rem" }}>
            Trvale smaže váš účet a všechna data. Tato akce je nevratná.
          </p>
          <div style={{ display: "flex", gap: "0.75rem", alignItems: "center" }}>
            <input
              type="text"
              placeholder='Napište "smazat" pro potvrzení'
              value={deleteConfirm}
              onChange={e => setDeleteConfirm(e.target.value)}
              style={{ ...inputStyle, flex: 1 }}
            />
            <button
              onClick={deleteAccount}
              disabled={deleting || deleteConfirm !== "smazat"}
              style={{
                padding: "0.75rem 1.25rem", fontSize: 13, fontWeight: 700,
                background: deleteConfirm === "smazat" ? "#f87171" : "#1a1a1a",
                border: "none", borderRadius: 10,
                color: deleteConfirm === "smazat" ? "#000" : "#525252",
                cursor: deleteConfirm === "smazat" ? "pointer" : "default",
                whiteSpace: "nowrap" as const,
              }}
            >
              {deleting ? "Mažu..." : "Smazat účet"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
