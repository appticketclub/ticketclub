"use client";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import UpgradeModal from "@/components/ucet/UpgradeModal";

export default function UcetPageClient({ user, profile, subscription }: { user: any; profile: any; subscription: any }) {
  const router = useRouter();
  const supabase = createClient();

  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
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
  const [loadingCheckout, setLoadingCheckout] = useState(false);
  const [loadingPortal, setLoadingPortal] = useState(false);
  const [sheetUrl, setSheetUrl] = useState("");
  const [sheetConnected, setSheetConnected] = useState(false);
  const [sheetLoading, setSheetLoading] = useState(false);
  const [syncLoading, setSyncLoading] = useState(false);

  async function handleUpgrade() {
    setLoadingCheckout(true);
    try {
      const res = await fetch("/api/stripe/create-checkout", { method: "POST" });
      const data = await res.json();
      if (data.url) window.location.href = data.url;
      else alert("Chyba: " + data.error);
    } catch (e) {
      alert("Chyba pripojenia");
    }
    setLoadingCheckout(false);
  }

  async function handleManageSubscription() {
    setLoadingPortal(true);
    try {
      const res = await fetch("/api/stripe/portal", { method: "POST" });
      const data = await res.json();
      if (data.url) window.location.href = data.url;
    } catch (e) {
      alert("Chyba pripojenia");
    }
    setLoadingPortal(false);
  }

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
    letterSpacing: "0.08em", color: "#ffffff",
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
        supabase.from("accounts").delete().eq("user_id", user.id),
        supabase.from("banners").delete().eq("user_id", user.id),
        supabase.from("capital_history").delete().eq("user_id", user.id),
        supabase.from("expenses").delete().eq("user_id", user.id),
        supabase.from("ai_cache").delete().eq("user_id", user.id),
      ]);

      // Reset capital
      await supabase.from("profiles").update({
        capital: null,
        capital_initial: null,
        capital_currency: "EUR",
      }).eq("id", user.id);

      setResetMsg("✓ Účet byl resetován");
      setResetConfirm("");
      window.location.href = "/nakupy";
    } catch (e: any) {
      setResetMsg(`Chyba: ${e.message}`);
    }
    setResetting(false);
  }

  async function deleteAccount() {
    if (deleteConfirm !== "smazat") return;
    setDeleting(true);
    try {
      // Delete all user data
      await Promise.all([
        supabase.from("purchases").delete().eq("user_id", user.id),
        supabase.from("sales").delete().eq("user_id", user.id),
        supabase.from("accounts").delete().eq("user_id", user.id),
        supabase.from("banners").delete().eq("user_id", user.id),
        supabase.from("capital_history").delete().eq("user_id", user.id),
        supabase.from("expenses").delete().eq("user_id", user.id),
        supabase.from("ai_cache").delete().eq("user_id", user.id),
        supabase.from("extension_licenses").delete().eq("user_id", user.id),
        supabase.from("launcher_tokens").delete().eq("user_id", user.id),
        supabase.from("subscriptions").delete().eq("user_id", user.id),
        supabase.from("profiles").delete().eq("id", user.id),
      ]);

      // Delete auth user via API route
      await fetch("/api/user/delete", { method: "DELETE" });

      await supabase.auth.signOut();
      window.location.href = "/prihlaseni";
    } catch (e: any) {
      console.error(e);
      alert(`Chyba při mazání účtu: ${e.message}`);
    }
    setDeleting(false);
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

  async function handleDownloadBackup() {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    // Fetch all purchases
    const { data: purchases } = await  supabase
      .from("purchases")
      .select("*, sales(*)")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    if (!purchases) return;

    // Generate Excel
    const XLSX = await import("xlsx");
    const wb = XLSX.utils.book_new();

    const rows = purchases.map(p => {
      const sale = p.sales?.[0];
      return {
        "Datum nákupu": p.created_at ? new Date(p.created_at).toLocaleDateString("cs-CZ") : "",
        "Kapela / Název akce": p.event_name ?? "",
        "Místo akce": p.city ?? p.venue ?? "",
        "Datum koncertu": p.event_actual_date ? new Date(p.event_actual_date).toLocaleDateString("cs-CZ") : "",
        "Počet lístků": p.quantity ?? 0,
        "Nákupní cena celkem (EUR)": (p.buy_price ?? 0) * (p.quantity ?? 1),
        "Počet prodaných lístků": sale?.quantity_sold ?? 0,
        "Prodejní cena celkem (EUR)": sale ? (sale.sell_price * sale.quantity_sold) : 0,
        "Burza": p.exchange ?? "",
        "Účet": p.account_ref ?? "",
        "Druh vstupenky": p.ticket_type_custom ?? p.ticket_type ?? "",
        "Datum prodeje": sale?.sold_at ? new Date(sale.sold_at).toLocaleDateString("cs-CZ") : "",
        "Vyplaceno (ANO/NE)": p.paid_out ? "ANO" : "NE",
        "Doručeno (ANO/NE)": p.delivered ? "ANO" : "NE",
        "Poznámky": p.notes ?? "",
      };
    });

    const ws = XLSX.utils.json_to_sheet(rows);
    ws["!cols"] = [
      { wch: 14 }, { wch: 25 }, { wch: 15 }, { wch: 14 },
      { wch: 12 }, { wch: 22 }, { wch: 22 }, { wch: 22 },
      { wch: 15 }, { wch: 22 }, { wch: 18 }, { wch: 14 },
      { wch: 18 }, { wch: 16 }, { wch: 20 },
    ];
    XLSX.utils.book_append_sheet(wb, ws, "Záloha");

    const date = new Date().toISOString().split("T")[0];
    XLSX.writeFile(wb, `ticketclub-zaloha-${date}.xlsx`);
  }

  useEffect(() => {
    getExtensionKey();
  }, []);

  useEffect(() => {
    async function loadSheetStatus() {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data: profile } = await supabase
        .from("profiles")
        .select("google_sheet_id")
        .eq("id", user.id)
        .single();
      if (profile?.google_sheet_id) {
        setSheetUrl(`https://docs.google.com/spreadsheets/d/${profile.google_sheet_id}`);
        setSheetConnected(true);
      }
    }
    loadSheetStatus();
  }, []);

  return (
    <div>
      {/* Header */}
      <div style={{ marginBottom: "2rem" }}>
        <a href="/dostupne-sluzby" style={{ fontSize: 13, color: "#ffffff", textDecoration: "none", display: "inline-flex", alignItems: "center", gap: 6, marginBottom: "1rem" }}>
          ← Zpět na přehled
        </a>
        <h1 style={{ fontSize: "1.75rem", fontWeight: 700, color: "#fff", marginBottom: "0.25rem" }}>Můj účet</h1>
        <p style={{ fontSize: 13, color: "#ffffff" }}>{user.email}</p>
      </div>

      {/* Profile info */}
      <div style={cardStyle}>
        <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 1, background: "linear-gradient(90deg, transparent, #ffffff, transparent)" }} />
        <h2 style={{ fontSize: "1rem", fontWeight: 700, color: "#fff", marginBottom: "1.25rem" }}>Osobní údaje</h2>
        <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
          <div>
            <label style={labelStyle}>E-MAIL</label>
            <div style={{ ...inputStyle, color: "#ffffff", cursor: "default" }}>{user.email}</div>
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
          borderRadius: 10, color: "#ffffff",
          fontWeight: 600, fontSize: 13, cursor: "pointer",
        }}>
          {changingPassword ? "Měním..." : "Změnit heslo"}
        </button>
      </div>

      {/* Subscription */}
      <div style={cardStyle}>
        <h2 style={{ fontSize: "1rem", fontWeight: 700, color: "#fff", marginBottom: "1.25rem" }}>Můj plán</h2>

        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: "1.25rem" }}>
          <div style={{
            padding: "6px 16px", borderRadius: 8, fontSize: 13, fontWeight: 700,
            background: subscription?.plan === "pro" ? "linear-gradient(135deg, #7c3aed, #5b21b6)" : "#1a1a1a",
            color: subscription?.plan === "pro" ? "#fff" : "#ededed",
            border: subscription?.plan === "pro" ? "none" : "1px solid #2a2a2a",
          }}>
            {subscription?.plan === "pro"
              ? subscription?.plan_interval === "yearly" ? "⭐ PRO Roční" : "⭐ PRO Měsíční"
              : "FREE"}
          </div>
          <span style={{ fontSize: 13, color: "#ffffff" }}>
            {subscription?.plan === "pro"
              ? `Aktivní do ${subscription.current_period_end ? new Date(subscription.current_period_end).toLocaleDateString("cs-CZ") : "—"}`
              : "Základní plán"}
          </span>
        </div>

        {subscription?.plan === "pro" ? (
          <button
            onClick={handleManageSubscription}
            disabled={loadingPortal}
            style={{
              padding: "0.75rem 1.5rem",
              background: "transparent",
              border: "1px solid #2a2a2a",
              borderRadius: 10, color: "#ffffff",
              fontWeight: 600, fontSize: 13,
              cursor: loadingPortal ? "default" : "pointer",
            }}
          >
            {loadingPortal ? "Načítám..." : "Spravovat předplatné"}
          </button>
        ) : (
          <div>
            <p style={{ fontSize: 13, color: "#ffffff", marginBottom: "1rem" }}>
              Základní plán — odemkněte všechny funkce
            </p>
            <button
              onClick={() => setShowUpgradeModal(true)}
              style={{
                width: "100%", padding: "0.875rem",
                background: "linear-gradient(135deg, #7c3aed, #5b21b6)",
                border: "none", borderRadius: 12,
                color: "#fff", fontWeight: 800, fontSize: 14,
                letterSpacing: "0.05em", cursor: "pointer",
              }}
            >
              ⭐ Upgradovat na Pro →
            </button>
            {showUpgradeModal && <UpgradeModal onClose={() => setShowUpgradeModal(false)} />}
          </div>
        )}
      </div>

      {/* Extension License */}
      {subscription?.plan === "pro" ? (
        <div style={cardStyle}>
          <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 1, background: "linear-gradient(90deg, transparent, #7c3aed, transparent)" }} />
          <h2 style={{ fontSize: "1rem", fontWeight: 700, color: "#fff", marginBottom: "0.5rem" }}>Extension licence</h2>
          <p style={{ fontSize: 12, color: "#ffffff", marginBottom: "1.25rem" }}>
            Použijte tento klíč pro aktivaci TicketClub Extension v Chrome.
          </p>

          {loadingKey ? (
            <div style={{ fontSize: 13, color: "#ffffff" }}>Načítám klíč...</div>
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
                  style={{ padding: "0.75rem 1rem", background: "transparent", border: "1px solid #2a2a2a", borderRadius: 10, color: "#ffffff", cursor: "pointer", fontSize: 12, whiteSpace: "nowrap" as const }}
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
              <p style={{ fontSize: 11, color: "#ffffff" }}>
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
      ) : (
        <div style={{ ...cardStyle, opacity: 0.6 }}>
          <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 1, background: "linear-gradient(90deg, transparent, #7c3aed, transparent)" }} />
          <h2 style={{ fontSize: "1rem", fontWeight: 700, color: "#fff", marginBottom: "0.5rem" }}>Extension licence</h2>
          <p style={{ fontSize: 13, color: "#ffffff", marginBottom: "1rem" }}>
            Licenční klíč je dostupný pouze pro Pro uživatele.
          </p>
          <a href="/ucet" style={{ fontSize: 13, color: "#7c3aed", fontWeight: 600, textDecoration: "none" }}>
            Upgradovat na Pro →
          </a>
        </div>
      )}

      {/* Záloha */}
      <div style={{ background: "#111111", border: "1px solid #1a1a1a", borderRadius: 16, padding: "1.25rem 1.5rem", marginBottom: "1rem", position: "relative" as const, overflow: "hidden" as const }}>
        <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 1, background: "linear-gradient(90deg, transparent, #eeeeee22, transparent)" }} />
        <div style={{ fontSize: 13, fontWeight: 700, color: "#ffffff", marginBottom: 4 }}>ZÁLOHA DAT</div>
        <div style={{ fontSize: 12, color: "#ffffff", marginBottom: "1rem" }}>
          Stáhněte zálohu všech vašich nákupů a prodejů ve formátu Excel.
        </div>
        <button
          onClick={handleDownloadBackup}
          style={{
            padding: "0.7rem 1.25rem",
            background: "linear-gradient(135deg, #ffffff, #a0a0a0)",
            border: "none",
            borderRadius: 10,
            color: "#000",
            fontWeight: 700,
            fontSize: 13,
            cursor: "pointer",
          }}
        >
          ⬇ Stáhnout zálohu (.xlsx)
        </button>
      </div>

      {/* Google Sheets záloha */}
      <div style={{ background: "#111111", border: "1px solid #1a1a1a", borderRadius: 16, padding: "1.25rem 1.5rem", marginBottom: "1rem", position: "relative", overflow: "hidden" }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: "#ffffff", marginBottom: 4 }}>GOOGLE SHEETS ZÁLOHA</div>
        <div style={{ fontSize: 12, color: "#ffffff", marginBottom: "1rem" }}>
          Automatická synchronizace dat do Google Sheets. Sdílejte sheet s:{" "}
          <span style={{ color: "#4ade80", fontSize: 11 }}>ticketclub-zaloha@ticketclub-sheets.iam.gserviceaccount.com</span>
        </div>

        {sheetConnected && (
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: "0.75rem", padding: "0.5rem 0.75rem", background: "rgba(52,211,153,0.1)", border: "1px solid rgba(52,211,153,0.3)", borderRadius: 8 }}>
            <span style={{ color: "#34d399", fontSize: 12 }}>✓ Sheet prepojený</span>
            <a href={sheetUrl} target="_blank" rel="noopener noreferrer" style={{ color: "#34d399", fontSize: 11, marginLeft: 4 }}>Otvoriť →</a>
          </div>
        )}

        <input
          type="text"
          placeholder="https://docs.google.com/spreadsheets/d/..."
          value={sheetUrl}
          onChange={e => setSheetUrl(e.target.value)}
          style={{ width: "100%", padding: "0.6rem 1rem", background: "#1a1a1a", border: "1px solid #2a2a2a", borderRadius: 8, color: "#fff", fontSize: 13, marginBottom: "0.75rem", boxSizing: "border-box" as const }}
        />

        <div style={{ display: "flex", gap: "0.5rem" }}>
          <button
            onClick={async () => {
              if (sheetConnected) {
                // Disconnect
                const supabase = createClient();
                const { data: { user } } = await supabase.auth.getUser();
                if (user) {
                  await supabase.from("profiles").update({ google_sheet_id: null }).eq("id", user.id);
                  setSheetConnected(false);
                  setSheetUrl("");
                }
                return;
              }
              setSheetLoading(true);
              const res = await fetch("/api/sheets/connect", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ sheetUrl })
              });
              const d = await res.json();
              setSheetLoading(false);
              if (d.ok) {
                setSheetConnected(true);
              } else {
                alert("✗ " + d.error);
              }
            }}
            style={{ padding: "0.6rem 1rem", background: sheetConnected ? "transparent" : "transparent", border: "1px solid #2a2a2a", borderRadius: 8, color: sheetConnected ? "#f87171" : "#fff", fontSize: 13, cursor: "pointer" }}
          >
            {sheetLoading ? "Pripájam..." : sheetConnected ? "Odpojiť sheet" : "Prepojiť sheet"}
          </button>

          {sheetConnected && (
            <button
              onClick={async () => {
                setSyncLoading(true);
                const res = await fetch("/api/sheets/sync", { method: "POST" });
                const d = await res.json();
                setSyncLoading(false);
                if (d.ok) alert(`✓ Synchronizované ${d.synced} nákupov!`);
                else alert("✗ " + d.error);
              }}
              style={{ padding: "0.6rem 1rem", background: "linear-gradient(135deg, #ffffff, #a0a0a0)", border: "none", borderRadius: 8, color: "#000", fontWeight: 700, fontSize: 13, cursor: "pointer" }}
            >
              {syncLoading ? "Synchronizujem..." : "Synchronizovať teraz"}
            </button>
          )}
        </div>
      </div>

      {/* Danger zone */}
      <div style={{ ...cardStyle, border: "1px solid rgba(248,113,113,0.2)", background: "#110a0a" }}>
        <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 1, background: "linear-gradient(90deg, transparent, rgba(248,113,113,0.4), transparent)" }} />
        <h2 style={{ fontSize: "1rem", fontWeight: 700, color: "#f87171", marginBottom: "0.5rem" }}>Nebezpečná zóna</h2>
        <p style={{ fontSize: 13, color: "#ffffff", marginBottom: "1.5rem" }}>Tyto akce jsou nevratné. Postupujte opatrně.</p>

        {/* Reset account */}
        <div style={{ padding: "1.25rem", background: "#0a0a0a", border: "1px solid #2a2a2a", borderRadius: 12, marginBottom: "1rem" }}>
          <div style={{ fontSize: 14, fontWeight: 600, color: "#fbbf24", marginBottom: 4 }}>Resetovat účet</div>
          <p style={{ fontSize: 12, color: "#ffffff", marginBottom: "1rem" }}>
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
                color: resetConfirm === "reset" ? "#000" : "#ededed",
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
          <p style={{ fontSize: 12, color: "#ffffff", marginBottom: "1rem" }}>
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
                color: deleteConfirm === "smazat" ? "#000" : "#ededed",
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
