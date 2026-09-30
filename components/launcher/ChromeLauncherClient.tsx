"use client";
import { useState, useEffect } from "react";

export default function ChromeLauncherClient({ tokenData }: { tokenData: any }) {
  const [os, setOs] = useState<"windows" | "mac">("windows");

  useEffect(() => {
    if (navigator.userAgent.includes("Mac")) setOs("mac");
  }, []);

  return (
    <div style={{ color: "#ededed" }}>
      <h2 style={{ fontSize: 18, fontWeight: 700, color: "#fff", marginBottom: 16 }}>Chrome Launcher App</h2>
      <p style={{ fontSize: 14, color: "#a0a0a0", marginBottom: 20 }}>
        Stiahni Python aplikáciu ktorá automaticky nájde a otvorí všetky Chrome profily s Refresh Botom.
      </p>
      <a
        href="https://mega.nz/folder/GJVVDCTA#10BX6POImLbx89D-evwR1w"
        target="_blank"
        style={{
          display: "inline-block",
          padding: "10px 20px",
          background: "linear-gradient(135deg, #ffffff, #a0a0a0)",
          borderRadius: 10,
          color: "#000",
          fontWeight: 700,
          fontSize: 14,
          textDecoration: "none",
          marginBottom: 24,
        }}
      >
        ⬇ Stáhnout Chrome Launcher App
      </a>
      <div style={{ fontSize: 13, color: "#a0a0a0" }}>
        <div style={{ fontWeight: 700, color: "#fff", marginBottom: 12, letterSpacing: "0.08em" }}>NÁVOD K POUŽITÍ</div>

        <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
          {[{ id: "windows", label: "🪟 Windows" }, { id: "mac", label: "🍎 Mac" }].map(tab => (
            <button key={tab.id} onClick={() => setOs(tab.id as "windows" | "mac")}
              style={{ padding: "6px 16px", background: os === tab.id ? "#ffffff" : "transparent",
                border: os === tab.id ? "none" : "1px solid #2a2a2a", borderRadius: 8,
                color: os === tab.id ? "#000" : "#ededed", fontWeight: 600, fontSize: 12, cursor: "pointer" }}>
              {tab.label}
            </button>
          ))}
        </div>

        {os === "windows" && [
          "Stáhněte soubor z odkazu výše",
          "Nainstalujte Python z python.org — při instalaci zaškrtněte 'Add Python to PATH'",
          "Dvojklikem spusťte soubor Ticket_Club_Chrome_Launcher.py",
          "Při prvním spuštění zadejte email a licenční klíč z /ucet",
          "Vyberte Chrome profily s Refresh Botem a uložte výběr",
          "Klikněte ▶ Spustit vybrané — profily se otevřou automaticky",
        ].map((step, i) => (
          <div key={i} style={{ display: "flex", gap: 12, marginBottom: 10 }}>
            <div style={{ width: 24, height: 24, background: "#1a1a1a", borderRadius: 6, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, fontSize: 11, fontWeight: 700, color: "#fff" }}>{i + 1}</div>
            <span>{step}</span>
          </div>
        ))}

        {os === "mac" && [
          "Stáhněte soubor z odkazu výše",
          "Otevřete Terminal (Cmd+Space → napište Terminal → Enter)",
          "Nainstalujte Homebrew pokud ho nemáte: /bin/bash -c \"$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)\"",
          "Nainstalujte Python: brew install python3",
          "V Terminalu přejděte do složky se staženým souborem: cd ~/Downloads",
          "Spusťte: python3 Ticket_Club_Chrome_Launcher.py",
          "Při prvním spuštění zadejte email a licenční klíč z /ucet",
          "Vyberte Chrome profily s Refresh Botem a uložte výběr",
          "Klikněte ▶ Spustit vybrané — profily se otevřou automaticky",
        ].map((step, i) => (
          <div key={i} style={{ display: "flex", gap: 12, marginBottom: 10 }}>
            <div style={{ width: 24, height: 24, background: "#1a1a1a", borderRadius: 6, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, fontSize: 11, fontWeight: 700, color: "#fff" }}>{i + 1}</div>
            <span>{step}</span>
          </div>
        ))}
      </div>
      <div style={{ marginTop: 20 }}>
        <div style={{ fontWeight: 700, color: "#fff", marginBottom: 12, letterSpacing: "0.08em", fontSize: 13 }}>VIDEO NÁVOD</div>
        <a
          href="https://youtu.be/MU2Odl8Ypbc"
          target="_blank"
          style={{
            display: "inline-block",
            padding: "10px 20px",
            background: "transparent",
            border: "1px solid #2a2a2a",
            borderRadius: 10,
            color: "#ededed",
            fontWeight: 600,
            fontSize: 14,
            textDecoration: "none",
          }}
        >
          ▶ Pozrieť video návod
        </a>
      </div>
    </div>
  );
}
