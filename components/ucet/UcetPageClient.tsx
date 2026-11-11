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

  const isAdmin = profile?.role === "admin";
  const isPro = subscription?.plan === "pro" || subscription?.plan === "scale" || subscription?.status === "trialing";
  const isScale = subscription?.plan === "scale";
  const [sheetsVideoOpen, setSheetsVideoOpen] = useState(false);

  async function handleUpgrade() {
    setLoadingCheckout(true);
    try {
      const res = await fetch("/api/stripe/create-checkout", { method: "POST" });
      const data = await res.json();
      if (data.upgraded) {
        alert("✓ Předplatné bylo aktualizováno!");
        window.location.reload();
        return;
      }
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
    background: "linear-gradient(145deg, rgba(28,26,42,0.9), rgba(18,16,30,0.95))",
    border: "1px solid rgba(123,108,246,0.15)",
    borderRadius: 20,
    overflow: "hidden" as const,
    backdropFilter: "blur(20px)",
    WebkitBackdropFilter: "blur(20px)",
    position: "relative" as const,
    marginBottom: "1.25rem",
  };

  const dangerCardStyle = {
    background: "linear-gradient(145deg, rgba(40,16,16,0.7), rgba(28,10,10,0.8))",
    border: "1px solid rgba(248,113,113,0.15)",
    borderRadius: 20,
    overflow: "hidden" as const,
    position: "relative" as const,
    marginBottom: "1.25rem",
  };

  const glowLine = (color = "rgba(123,108,246,0.35)") => (
    <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 1, background: `linear-gradient(90deg, transparent, ${color}, transparent)` }} />
  );

  const cardHeaderStyle = {
    display: "flex", alignItems: "center", gap: "0.6rem",
    padding: "1.25rem 1.5rem 0",
  };

  const iconBoxStyle = {
    width: 30, height: 30, borderRadius: 8,
    background: "rgba(123,108,246,0.15)",
    border: "1px solid rgba(123,108,246,0.2)",
    display: "flex", alignItems: "center", justifyContent: "center",
    fontSize: 14, flexShrink: 0,
  };

  const cardTitleStyle = { fontSize: 13, fontWeight: 700, color: "#fff" };

  const inputStyle = {
    width: "100%", padding: "0.65rem 1rem",
    background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)",
    borderRadius: 10, color: "#f0eeff", fontSize: 14,
    fontFamily: "inherit", outline: "none", boxSizing: "border-box" as const,
  };

  const readonlyInputStyle = { ...inputStyle, color: "rgba(240,238,255,0.5)", cursor: "default" };

  const labelStyle = {
    fontSize: 11, fontWeight: 600 as const,
    letterSpacing: "0.06em", textTransform: "uppercase" as const,
    color: "rgba(240,238,255,0.25)",
    display: "block" as const, marginBottom: "0.4rem",
  };

  const primaryBtnStyle = {
    background: "linear-gradient(135deg, #7b6cf6, #9d8ff5)",
    color: "#fff", border: "none", borderRadius: 10,
    padding: "0.6rem 1.2rem", fontSize: 13, fontWeight: 700,
    cursor: "pointer", boxShadow: "0 4px 16px rgba(123,108,246,0.3)",
  };

  const secondaryBtnStyle = {
    background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.1)",
    color: "rgba(240,238,255,0.5)", borderRadius: 10,
    padding: "0.6rem 1.2rem", fontSize: 13, fontWeight: 700, cursor: "pointer",
  };

  const dangerInputStyle = {
    ...inputStyle,
    background: "rgba(248,113,113,0.05)",
    border: "1px solid rgba(248,113,113,0.15)",
    color: "#f0eeff",
  };

  const innerPanelStyle = {
    background: "rgba(255,255,255,0.03)",
    border: "1px solid rgba(255,255,255,0.06)",
    borderRadius: 12,
    padding: "1.25rem",
  };

  const msgStyle = (msg: string) => ({
    fontSize: 13,
    color: msg.startsWith("✓") ? "#5de8a0" : "#f87171",
    marginTop: 12,
  });

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

  useEffect(() => {
    async function saveImportEmail() {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const importEmail = `${user.id.substring(0, 8)}@mail.ticketclub.vip`;
      await supabase.from("profiles")
        .update({ import_email: importEmail })
        .eq("id", user.id);
    }
    saveImportEmail();
  }, []);

  return (
    <div style={{ position: "relative", zIndex: 1, maxWidth: 720, margin: "0 auto" }}>
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=Space+Grotesk:wght@600;700;800&display=swap" />

      {/* Animated background */}
      <div style={{ position: "fixed", inset: 0, zIndex: 0, pointerEvents: "none", overflow: "hidden" }}>
        <div style={{
          position: "absolute", top: "-15%", left: "-5%",
          width: "50vw", height: "50vw", borderRadius: "50%",
          background: "radial-gradient(circle, rgba(110,60,255,0.18) 0%, transparent 70%)",
          filter: "blur(80px)",
          animation: "blob1 18s ease-in-out infinite",
        }} />
        <div style={{
          position: "absolute", bottom: "10%", right: "-10%",
          width: "40vw", height: "40vw", borderRadius: "50%",
          background: "radial-gradient(circle, rgba(150,80,255,0.13) 0%, transparent 70%)",
          filter: "blur(80px)",
          animation: "blob2 22s ease-in-out infinite",
        }} />
        <style>{`
          @keyframes blob1 { 0%,100%{transform:translate(0,0) scale(1)} 50%{transform:translate(40px,-60px) scale(1.1)} }
          @keyframes blob2 { 0%,100%{transform:translate(0,0) scale(1)} 50%{transform:translate(-30px,40px) scale(0.9)} }
        `}</style>
      </div>

      {/* Header */}
      <div style={{ marginBottom: "2rem" }}>
        <a href="/dostupne-sluzby" style={{ fontSize: 13, color: "rgba(240,238,255,0.5)", textDecoration: "none", display: "inline-flex", alignItems: "center", gap: 6, marginBottom: "1rem" }}>
          ← Zpět na přehled
        </a>
        <h1 style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: "clamp(26px, 4vw, 34px)", fontWeight: 800, color: "#fff", marginBottom: "0.3rem" }}>Můj účet</h1>
        <div style={{ fontSize: 13, color: "rgba(240,238,255,0.25)" }}>{user.email}</div>
      </div>

      {/* Profile info */}
      <div style={cardStyle}>
        {glowLine()}
        <div style={cardHeaderStyle}>
          <div style={iconBoxStyle}>👤</div>
          <span style={cardTitleStyle}>Osobní údaje</span>
        </div>
        <div style={{ padding: "1.25rem 1.5rem 1.5rem" }}>
          <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
            <div>
              <label style={labelStyle}>E-MAIL</label>
              <div style={readonlyInputStyle}>{user.email}</div>
            </div>
            <div>
              <label style={labelStyle}>CELÉ JMÉNO</label>
              <input type="text" value={fullName} onChange={e => setFullName(e.target.value)} style={inputStyle} placeholder="Vaše jméno" />
            </div>
          </div>
          {saveMsg && <p style={msgStyle(saveMsg)}>{saveMsg}</p>}
          <button onClick={saveProfile} disabled={saving} style={{ ...primaryBtnStyle, marginTop: "1.25rem" }}>
            {saving ? "Ukládám..." : "Uložit změny"}
          </button>
        </div>
      </div>

      {/* Change password */}
      <div style={cardStyle}>
        {glowLine()}
        <div style={cardHeaderStyle}>
          <div style={iconBoxStyle}>🔑</div>
          <span style={cardTitleStyle}>Změna hesla</span>
        </div>
        <div style={{ padding: "1.25rem 1.5rem 1.5rem" }}>
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
          {passwordMsg && <p style={msgStyle(passwordMsg)}>{passwordMsg}</p>}
          <button onClick={changePassword} disabled={changingPassword} style={{ ...secondaryBtnStyle, marginTop: "1.25rem" }}>
            {changingPassword ? "Měním..." : "Změnit heslo"}
          </button>
        </div>
      </div>

      {/* Subscription */}
      <div style={cardStyle}>
        {glowLine()}
        <div style={cardHeaderStyle}>
          <div style={iconBoxStyle}>⚡</div>
          <span style={cardTitleStyle}>Můj plán</span>
        </div>
        <div style={{ padding: "1.25rem 1.5rem 1.5rem" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: "1.25rem" }}>
            <div style={{
              padding: "4px 10px", borderRadius: 8, fontSize: 11, fontWeight: 800,
              background: (subscription?.plan === "pro" || subscription?.plan === "scale")
                ? "linear-gradient(135deg, #7b6cf6, #9d8ff5)"
                : "rgba(255,255,255,0.08)",
              color: (subscription?.plan === "pro" || subscription?.plan === "scale") ? "#fff" : "rgba(240,238,255,0.5)",
              border: (subscription?.plan === "pro" || subscription?.plan === "scale") ? "none" : "1px solid rgba(255,255,255,0.1)",
            }}>
              {subscription?.plan === "scale"
                ? subscription?.plan_interval === "yearly" ? "⭐ SCALE Roční" : "⭐ SCALE Měsíční"
                : subscription?.plan === "pro"
                  ? subscription?.plan_interval === "yearly" ? "⭐ PRO Roční" : "⭐ PRO Měsíční"
                  : "FREE"}
            </div>
            <span style={{ fontSize: 13, color: "rgba(240,238,255,0.5)" }}>
              {(subscription?.plan === "pro" || subscription?.plan === "scale")
                ? "Předplatné aktivní"
                : "Základní plán"}
            </span>
          </div>

          {(subscription?.plan === "pro" || subscription?.plan === "scale") ? (
            <button
              onClick={handleManageSubscription}
              disabled={loadingPortal}
              style={{ ...secondaryBtnStyle, cursor: loadingPortal ? "default" : "pointer" }}
            >
              {loadingPortal ? "Načítám..." : "Spravovat předplatné"}
            </button>
          ) : (
            <div>
              <p style={{ fontSize: 13, color: "rgba(240,238,255,0.5)", marginBottom: "1rem" }}>
                Základní plán — odemkněte všechny funkce
              </p>
              <button
                onClick={() => setShowUpgradeModal(true)}
                style={{
                  width: "100%", padding: "0.75rem",
                  background: "linear-gradient(135deg, #7b6cf6, #9d8ff5)",
                  color: "#fff", border: "none", borderRadius: 10,
                  fontSize: 14, fontWeight: 700, letterSpacing: "0.02em",
                  cursor: "pointer", boxShadow: "0 4px 20px rgba(123,108,246,0.35)",
                }}
              >
                ⭐ Upgradovat na Pro →
              </button>
              {showUpgradeModal && <UpgradeModal onClose={() => setShowUpgradeModal(false)} />}
            </div>
          )}
        </div>
      </div>

      {/* Extension License */}
      {(subscription?.plan === "pro" || subscription?.plan === "scale") ? (
        <div style={cardStyle}>
          {glowLine()}
          <div style={cardHeaderStyle}>
            <div style={iconBoxStyle}>🧩</div>
            <span style={cardTitleStyle}>Extension licence</span>
          </div>
          <div style={{ padding: "1.25rem 1.5rem 1.5rem" }}>
            <p style={{ fontSize: 12, color: "rgba(240,238,255,0.5)", marginBottom: "1.25rem" }}>
              Použijte tento klíč pro aktivaci TicketClub Extension v Chrome.
            </p>

            {loadingKey ? (
              <div style={{ fontSize: 13, color: "rgba(240,238,255,0.5)" }}>Načítám klíč...</div>
            ) : extensionKey ? (
              <div>
                <div style={{ display: "flex", gap: "0.75rem", alignItems: "center", marginBottom: "0.75rem" }}>
                  <div
                    style={{
                      flex: 1,
                      padding: "0.65rem 1rem",
                      background: "rgba(255,255,255,0.05)",
                      border: "1px solid rgba(123,108,246,0.15)",
                      borderRadius: 10,
                      fontFamily: "monospace",
                      fontSize: 15,
                      fontWeight: 700,
                      color: "#a89df7",
                      letterSpacing: "0.1em",
                    }}
                  >
                    {showKey ? extensionKey : "TC-••••-••••-••••"}
                  </div>
                  <button
                    onClick={() => setShowKey(!showKey)}
                    style={{ ...secondaryBtnStyle, padding: "0.65rem 1rem", fontSize: 12, whiteSpace: "nowrap" as const }}
                  >
                    {showKey ? "Skrýt" : "Zobrazit"}
                  </button>
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(extensionKey);
                    }}
                    style={{ ...primaryBtnStyle, padding: "0.65rem 1rem", fontSize: 12, whiteSpace: "nowrap" as const }}
                  >
                    Kopírovat
                  </button>
                </div>
                <p style={{ fontSize: 11, color: "rgba(240,238,255,0.25)" }}>
                  Klíč je unikátní pro váš účet. Nesdílejte ho s nikým.
                </p>
              </div>
            ) : (
              <button onClick={getExtensionKey} style={primaryBtnStyle}>
                Vygenerovat klíč
              </button>
            )}
          </div>
        </div>
      ) : (
        <div style={{ ...cardStyle, opacity: 0.6 }}>
          {glowLine()}
          <div style={cardHeaderStyle}>
            <div style={iconBoxStyle}>🧩</div>
            <span style={cardTitleStyle}>Extension licence</span>
          </div>
          <div style={{ padding: "1.25rem 1.5rem 1.5rem" }}>
            <p style={{ fontSize: 13, color: "rgba(240,238,255,0.5)", marginBottom: "1rem" }}>
              Licenční klíč je dostupný pouze pro Pro uživatele.
            </p>
            <a href="/ucet" style={{ fontSize: 13, color: "#a89df7", fontWeight: 600, textDecoration: "none" }}>
              Upgradovat na Pro →
            </a>
          </div>
        </div>
      )}

      {/* Excel záloha - temporarily hidden 
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
      */}

      {/* Google Sheets záloha */}
      <div style={cardStyle}>
        {glowLine()}
        <div style={cardHeaderStyle}>
          <div style={iconBoxStyle}>📊</div>
          <span style={cardTitleStyle}>Google Sheets záloha</span>
        </div>
        <div style={{ padding: "1.25rem 1.5rem 1.5rem" }}>
          <div style={{ fontSize: 12, color: "rgba(240,238,255,0.5)", marginBottom: "1rem" }}>
            Automatická synchronizace dat do Google Sheets. Sdílejte sheet s:{" "}
            <span style={{ color: "#5de8a0", fontSize: 11 }}>ticketclub-zaloha@ticketclub-sheets.iam.gserviceaccount.com</span>
            <div style={{ fontSize: 11, color: "rgba(240,238,255,0.25)", marginTop: 6 }}>
              Automatická záloha probíhá každý den o půlnoci.
            </div>
          </div>

          {sheetConnected && (
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: "0.75rem", padding: "0.5rem 0.75rem", background: "rgba(93,232,160,0.1)", border: "1px solid rgba(93,232,160,0.3)", borderRadius: 8 }}>
              <span style={{ color: "#5de8a0", fontSize: 12 }}>✓ Sheet propojen</span>
              <a href={sheetUrl} target="_blank" rel="noopener noreferrer" style={{ color: "#5de8a0", fontSize: 11, marginLeft: 4 }}>Otevřít →</a>
            </div>
          )}

          <input
            type="text"
            placeholder="https://docs.google.com/spreadsheets/d/..."
            value={sheetUrl}
            onChange={e => setSheetUrl(e.target.value)}
            style={{ ...inputStyle, fontSize: 13, marginBottom: "0.75rem" }}
          />

          <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" as const, alignItems: "center" }}>
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
              style={{ ...secondaryBtnStyle, color: sheetConnected ? "#f87171" : "rgba(240,238,255,0.5)" }}
            >
              {sheetLoading ? "Připojuji..." : sheetConnected ? "Odpojit sheet" : "Propojit sheet"}
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
                style={primaryBtnStyle}
              >
                {syncLoading ? "Synchronizuji..." : "Synchronizovat nyní"}
              </button>
            )}
            
            <button
              onClick={() => setSheetsVideoOpen(true)}
              style={{ ...secondaryBtnStyle, display: "flex", alignItems: "center", gap: 6 }}
            >
              ℹ️ Ukázka a video návod
            </button>
          </div>
        </div>
      </div>

      {/* Email Import */}
      {(isPro || isAdmin) ? (
        <div style={cardStyle}>
          {glowLine()}
          <div style={cardHeaderStyle}>
            <div style={iconBoxStyle}>📧</div>
            <span style={cardTitleStyle}>Email Import</span>
          </div>
          <div style={{ padding: "1.25rem 1.5rem 1.5rem" }}>
            <div style={{ fontSize: 12, color: "rgba(240,238,255,0.5)", marginBottom: "0.75rem" }}>
              Přeposílejte potvrzovací emaily z Ticketmaster a nákupy se automaticky přidají do Evidence.
            </div>
            <div
              onClick={() => navigator.clipboard.writeText(`${user?.id?.substring(0, 8)}@mail.ticketclub.vip`)}
              style={{ padding: "0.65rem 1rem", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(123,108,246,0.15)", borderRadius: 10, color: "#5de8a0", fontSize: 13, fontFamily: "monospace", cursor: "pointer", userSelect: "all" as const, marginBottom: "0.5rem" }}
            >
              {user?.id?.substring(0, 8)}@mail.ticketclub.vip
            </div>
            <div style={{ fontSize: 11, color: "rgba(240,238,255,0.25)" }}>Klikněte pro zkopírování.</div>
          </div>
        </div>
      ) : (
        <div style={cardStyle}>
          {glowLine()}
          <div style={cardHeaderStyle}>
            <div style={iconBoxStyle}>📧</div>
            <span style={cardTitleStyle}>Email Import</span>
          </div>
          <div style={{ padding: "1.25rem 1.5rem 1.5rem" }}>
            <div style={{ fontSize: 12, color: "rgba(240,238,255,0.5)", marginBottom: "1rem" }}>
              Přeposílejte potvrzovací emaily z Ticketmaster a nákupy se automaticky přidají do Evidence.
            </div>
            <div style={{ position: "relative" }}>
              <div style={{ padding: "0.65rem 1rem", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(123,108,246,0.15)", borderRadius: 10, color: "#5de8a0", fontSize: 13, fontFamily: "monospace", filter: "blur(6px)", userSelect: "none" as const, marginBottom: "0.5rem" }}>
                xxxxxxxx@mail.ticketclub.vip
              </div>
              <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
                <button
                  onClick={() => window.dispatchEvent(new CustomEvent("openUpgradeModal"))}
                  style={primaryBtnStyle}
                >
                  Upgradovat na PRO →
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Danger zone */}
      <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase" as const, color: "rgba(248,113,113,0.5)", marginBottom: "0.75rem" }}>
        Nebezpečná zóna
      </div>
      <div style={dangerCardStyle}>
        {glowLine("rgba(248,113,113,0.3)")}
        <div style={{ padding: "1.5rem" }}>

        {/* Reset account */}
        <div style={{ ...innerPanelStyle, marginBottom: "1rem" }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: "#fbbf24", marginBottom: 4 }}>Resetovat účet</div>
          <p style={{ fontSize: 12, color: "rgba(240,238,255,0.5)", marginBottom: "1rem" }}>
            Smaže všechny nákupy, prodeje, bannery a vynuluje kapitál. Účet zůstane aktivní.
          </p>
          <div style={{ display: "flex", gap: "0.75rem", alignItems: "center" }}>
            <input
              type="text"
              placeholder='Napište "reset" pro potvrzení'
              value={resetConfirm}
              onChange={e => setResetConfirm(e.target.value)}
              style={{ ...dangerInputStyle, flex: 1 }}
            />
            <button
              onClick={resetAccount}
              disabled={resetting || resetConfirm !== "reset"}
              style={{
                padding: "0.65rem 1.25rem", fontSize: 13, fontWeight: 700,
                background: resetConfirm === "reset" ? "#fbbf24" : "rgba(255,255,255,0.05)",
                border: "none", borderRadius: 10,
                color: resetConfirm === "reset" ? "#000" : "rgba(240,238,255,0.3)",
                cursor: resetConfirm === "reset" ? "pointer" : "default",
                whiteSpace: "nowrap" as const,
              }}
            >
              {resetting ? "Resetuji..." : "Resetovat"}
            </button>
          </div>
          {resetMsg && <p style={{ ...msgStyle(resetMsg), marginTop: 8 }}>{resetMsg}</p>}
        </div>

        {/* Delete account */}
        <div style={{ ...innerPanelStyle, border: "1px solid rgba(248,113,113,0.15)", background: "rgba(248,113,113,0.03)" }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: "#f87171", marginBottom: 4 }}>Smazat účet</div>
          <p style={{ fontSize: 12, color: "rgba(240,238,255,0.5)", marginBottom: "1rem" }}>
            Trvale smaže váš účet a všechna data. Tato akce je nevratná.
          </p>
          <div style={{ display: "flex", gap: "0.75rem", alignItems: "center" }}>
            <input
              type="text"
              placeholder='Napište "smazat" pro potvrzení'
              value={deleteConfirm}
              onChange={e => setDeleteConfirm(e.target.value)}
              style={{ ...dangerInputStyle, flex: 1 }}
            />
            <button
              onClick={deleteAccount}
              disabled={deleting || deleteConfirm !== "smazat"}
              style={{
                padding: "0.65rem 1.25rem", fontSize: 13, fontWeight: 700,
                background: deleteConfirm === "smazat" ? "#f87171" : "rgba(255,255,255,0.05)",
                border: "none", borderRadius: 10,
                color: deleteConfirm === "smazat" ? "#000" : "rgba(240,238,255,0.3)",
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

      {/* Google Sheets video modal */}
      {sheetsVideoOpen && (
        <>
          <div
            onClick={() => setSheetsVideoOpen(false)}
            style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.9)", zIndex: 500, backdropFilter: "blur(4px)", cursor: "pointer" }}
          />
          <div style={{
            position: "fixed", top: "50%", left: "50%",
            transform: "translate(-50%, -50%)",
            width: "90%", maxWidth: 800,
            zIndex: 501, borderRadius: 16, overflow: "hidden",
            boxShadow: "0 0 60px rgba(0,0,0,0.8)"
          }}>
            <div style={{ position: "relative", paddingBottom: "56.25%", height: 0 }}>
              <iframe
                src="https://www.youtube.com/embed/gCGOvM6WMrQ?autoplay=1"
                style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "100%" }}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            </div>
            <button
              onClick={() => setSheetsVideoOpen(false)}
              style={{ position: "absolute", top: 12, right: 12, background: "rgba(0,0,0,0.7)", border: "none", borderRadius: "50%", width: 32, height: 32, color: "#fff", cursor: "pointer", fontSize: 16, zIndex: 502 }}
            >
              ×
            </button>
          </div>
        </>
      )}
    </div>
  );
}
