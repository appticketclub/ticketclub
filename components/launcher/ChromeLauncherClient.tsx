"use client";
import { useState, useEffect } from "react";

export default function ChromeLauncherClient({ tokenData }: { tokenData: any }) {
  const [profilesCount, setProfilesCount] = useState(tokenData?.profiles_count ?? 5);
  const [startUrl, setStartUrl] = useState("");
  const [downloading, setDownloading] = useState(false);
  const [downloaded, setDownloaded] = useState(false);
  const [os, setOs] = useState<"windows" | "mac">("windows");

  // Auto-detect OS
  useEffect(() => {
    if (navigator.userAgent.includes("Mac")) setOs("mac");
  }, []);

  async function handleDownload() {
    setDownloading(true);
    try {
      const res = await fetch("/api/launcher/download", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ profilesCount, startUrl, os }),
      });

      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = os === "mac" ? "ticketclub-launcher.sh" : "ticketclub-launcher.bat";
      a.click();
      URL.revokeObjectURL(url);
      setDownloaded(true);
    } catch (e) {
      console.error(e);
    }
    setDownloading(false);
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
    letterSpacing: "0.08em", color: "#525252",
    display: "block" as const, marginBottom: "0.4rem",
  };

  return (
    <div>
      {/* Header */}
      <div style={{ marginBottom: "2rem" }}>
        <a href="/dostupne-sluzby" style={{ fontSize: 13, color: "#525252", textDecoration: "none", display: "inline-flex", alignItems: "center", gap: 6, marginBottom: "1rem" }}>
          ← Zpět na přehled
        </a>
        <h1 style={{ fontSize: "1.75rem", fontWeight: 700, color: "#fff", marginBottom: "0.25rem" }}>🚀 Chrome Launcher</h1>
        <p style={{ fontSize: 13, color: "#3a3a3a" }}>Spusťte všechny vaše Chrome profily najednou</p>
      </div>

      {/* How it works */}
      <div style={cardStyle}>
        <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 1, background: "linear-gradient(90deg, transparent, #c0c0c0, transparent)" }} />
        <h2 style={{ fontSize: "1rem", fontWeight: 700, color: "#fff", marginBottom: "1rem" }}>Jak to funguje</h2>
        <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
          {[
            { step: "1", text: "Nastavte počet Chrome profilů a volitelnou URL" },
            { step: "2", text: "Stáhněte launcher (.bat nebo .sh soubor) a uložte na plochu" },
            { step: "3", text: "Spusťte launcher — automaticky otevře všechny profily" },
            { step: "4", text: "Licence se ověří online — funguje pouze s aktivním účtem" },
          ].map(item => (
            <div key={item.step} style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
              <div style={{
                width: 24, height: 24, borderRadius: "50%", flexShrink: 0,
                background: "linear-gradient(135deg, #ffffff, #a0a0a0)",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 11, fontWeight: 800, color: "#000",
              }}>{item.step}</div>
              <p style={{ fontSize: 13, color: "#c0c0c0", margin: 0, lineHeight: 1.5 }}>{item.text}</p>
            </div>
          ))}
        </div>
        {os === "mac" && (
          <div style={{ marginTop: "0.75rem", padding: "0.75rem 1rem", background: "#0a0a0a", border: "1px solid #1f1f1f", borderRadius: 10 }}>
            <p style={{ fontSize: 12, color: "#525252", margin: 0, lineHeight: 1.6 }}>
              <strong style={{ color: "#c0c0c0" }}>Mac instrukce:</strong> Po stažení otevřete Terminal, napište{" "}
              <code style={{ background: "#1a1a1a", padding: "1px 6px", borderRadius: 4, color: "#a78bfa" }}>chmod +x ~/Downloads/ticketclub-launcher.sh</code>{" "}
              a pak{" "}
              <code style={{ background: "#1a1a1a", padding: "1px 6px", borderRadius: 4, color: "#a78bfa" }}>~/Downloads/ticketclub-launcher.sh</code>
            </p>
          </div>
        )}
      </div>

      {/* OS Selector */}
      <div style={{ display: "flex", gap: "0.5rem", marginBottom: "1rem" }}>
        {[
          { id: "windows", label: "🪟 Windows (.bat)" },
          { id: "mac", label: "🍎 Mac (.sh)" },
        ].map(o => (
          <button
            key={o.id}
            onClick={() => setOs(o.id as "windows" | "mac")}
            style={{
              padding: "6px 16px", fontSize: 13, fontWeight: 600,
              background: os === o.id ? "linear-gradient(135deg, #ffffff, #a0a0a0)" : "transparent",
              border: os === o.id ? "none" : "1px solid #2a2a2a",
              borderRadius: 8,
              color: os === o.id ? "#000" : "#525252",
              cursor: "pointer",
            }}
          >
            {o.label}
          </button>
        ))}
      </div>

      {/* Settings */}
      <div style={cardStyle}>
        <h2 style={{ fontSize: "1rem", fontWeight: 700, color: "#fff", marginBottom: "1.25rem" }}>Nastavení</h2>
        <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
          <div>
            <label style={labelStyle}>POČET PROFILŮ (1–100)</label>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <input
                type="range" min={1} max={100} value={profilesCount}
                onChange={e => setProfilesCount(Number(e.target.value))}
                style={{ flex: 1, accentColor: "#c0c0c0" }}
              />
              <span style={{ fontSize: 18, fontWeight: 700, color: "#fff", minWidth: 32, textAlign: "center" as const }}>
                {profilesCount}
              </span>
            </div>
            <p style={{ fontSize: 12, color: "#3a3a3a", marginTop: 6 }}>
              Launcher spustí Default profil + Profile 1 až Profile {profilesCount}
            </p>
          </div>

          <div>
            <label style={labelStyle}>ÚVODNÍ URL (volitelné)</label>
            <input
              type="text"
              placeholder="https://www.viagogo.com"
              value={startUrl}
              onChange={e => setStartUrl(e.target.value)}
              style={inputStyle}
            />
            <p style={{ fontSize: 12, color: "#3a3a3a", marginTop: 6 }}>
              Tato URL se otevře v každém profilu při spuštění
            </p>
          </div>
        </div>
      </div>

      {/* License info */}
      {tokenData && (
        <div style={{ ...cardStyle, background: "#0a1520", border: "1px solid rgba(139,92,246,0.2)" }}>
          <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 1, background: "linear-gradient(90deg, transparent, rgba(139,92,246,0.4), transparent)" }} />
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div>
              <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: "0.08em", color: "rgba(139,92,246,0.6)", marginBottom: 4 }}>VAŠE LICENCE</div>
              <div style={{ fontSize: 13, color: "#a78bfa" }}>
                {tokenData.is_active ? "✓ Aktivní" : "✗ Neaktivní"}
              </div>
            </div>
            {tokenData.last_used_at && (
              <div style={{ textAlign: "right" as const }}>
                <div style={{ fontSize: 11, color: "#3a3a3a" }}>Poslední použití</div>
                <div style={{ fontSize: 12, color: "#525252" }}>
                  {new Date(tokenData.last_used_at).toLocaleDateString("cs-CZ")}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Download button */}
      <button
        onClick={handleDownload}
        disabled={downloading}
        style={{
          width: "100%", padding: "1rem",
          background: downloading ? "#2a2a2a" : "linear-gradient(135deg, #ffffff, #a0a0a0)",
          border: "none", borderRadius: 12,
          color: "#000", fontWeight: 800, fontSize: 15,
          letterSpacing: "0.06em", cursor: downloading ? "default" : "pointer",
          marginBottom: "0.75rem",
        }}
      >
        {downloading ? "⏳ Generuji launcher..." : "⬇ Stáhnout Chrome Launcher"}
      </button>

      {downloaded && (
        <div style={{ padding: "1rem", background: "#0a2a1a", border: "1px solid rgba(52,211,153,0.3)", borderRadius: 12, textAlign: "center" as const }}>
          <p style={{ color: "#34d399", fontWeight: 600, fontSize: 14, margin: 0 }}>
            ✓ Launcher stažen! Uložte soubor na plochu a spusťte.
          </p>
        </div>
      )}

      {/* Warning */}
      <div style={{ marginTop: "1rem", padding: "1rem", background: "#0a0a0a", border: "1px solid #1f1f1f", borderRadius: 12 }}>
        <p style={{ fontSize: 12, color: "#3a3a3a", margin: 0, lineHeight: 1.6 }}>
          ⚠️ Launcher funguje pouze na Windows/Mac s nainstalovaným Google Chrome.
          Každý stažený soubor je vázán na váš účet a nelze sdílet.
          Při vypršení předplatného přestane fungovat.
        </p>
      </div>
    </div>
  );
}
