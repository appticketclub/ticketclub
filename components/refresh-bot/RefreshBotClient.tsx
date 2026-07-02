"use client";

export default function RefreshBotClient() {
  return (
    <div style={{ maxWidth: 720, margin: "0 auto", padding: "2rem 1rem" }}>
      {/* Header */}
      <div style={{ marginBottom: "2rem" }}>
        <div style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "4px 12px", background: "rgba(52,211,153,0.1)", border: "1px solid rgba(52,211,153,0.3)", borderRadius: 100, marginBottom: "0.75rem" }}>
          <div style={{ width: 6, height: 6, borderRadius: "50%", background: "#34d399", animation: "pulse 1.5s infinite" }} />
          <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.1em", color: "#34d399" }}>PRO FUNKCE</span>
        </div>
        <h1 style={{ fontSize: "1.75rem", fontWeight: 800, color: "#fff", marginBottom: "0.5rem", letterSpacing: "-0.02em" }}>
          🔄 Refresh Bot
        </h1>
        <p style={{ fontSize: 14, color: "#ededed", lineHeight: 1.7 }}>
          Automatické monitorování vstupenek na Ticketmaster. Bot obnovuje stránku a klikne za vás.
        </p>
      </div>

      {/* Download */}
      <div style={{ background: "#111111", border: "1px solid #1a1a1a", borderRadius: 20, padding: "1.75rem", marginBottom: "1.5rem", position: "relative", overflow: "hidden" }}>
        <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 1, background: "linear-gradient(90deg, transparent, #34d399, transparent)" }} />
        <h2 style={{ fontSize: "1rem", fontWeight: 700, color: "#fff", marginBottom: "0.5rem" }}>Stáhnout Refresh Bot</h2>
        <p style={{ fontSize: 13, color: "#ededed", marginBottom: "1.25rem" }}>
          Stáhněte si rozšíření a nainstalujte ho do Chrome.
        </p>

        <a
          href="https://mega.nz/folder/zBFTRKYZ#NazWHgpLgy6L_iFJuSynvQ"
          target="_blank"
          rel="noopener noreferrer"
          style={{
            display: "inline-flex", alignItems: "center", gap: 8,
            padding: "0.875rem 1.75rem",
            background: "linear-gradient(135deg, #34d399, #059669)",
            border: "none", borderRadius: 12,
            color: "#000", fontWeight: 800, fontSize: 14,
            textDecoration: "none", letterSpacing: "0.05em",
          }}
        >
          ⬇ Stáhnout Refresh Bot
        </a>
        <p style={{ fontSize: 11, color: "#ededed", marginTop: "0.75rem" }}>
          Verze 1.0.0 · Chrome Extension · Windows & Mac
        </p>
      </div>

      {/* How to use */}
      <div style={{ background: "#111111", border: "1px solid #1a1a1a", borderRadius: 20, padding: "1.75rem", marginBottom: "1.5rem" }}>
        <h2 style={{ fontSize: "1rem", fontWeight: 700, color: "#fff", marginBottom: "1.25rem" }}>Jak používat</h2>
        <div style={{ display: "flex", flexDirection: "column" as const, gap: "1rem" }}>
          {[
            { step: "1", title: "Stáhněte a nainstalujte", desc: "Stáhněte ZIP soubor, rozbalte a v Chrome otevřete chrome://extensions → Load unpacked → vyberte složku." },
            { step: "2", title: "Zadejte licenční klíč", desc: "Otevřete rozšíření a zadejte svůj licenční klíč z účtu na app.ticketclub.vip/ucet." },
            { step: "3", title: "Otevřete Ticketmaster", desc: "Přejděte na stránku eventu na Ticketmaster kde chcete sledovat vstupenky." },
            { step: "4", title: "Spusťte bota", desc: "Klikněte na Start v rozšíření, nastavte interval obnovování a bot začne automaticky hledat vstupenky." },
            { step: "5", title: "Bot najde vstupenky", desc: "Jakmile bot najde dostupné vstupenky, automaticky klikne na Get Tickets a upozorní vás zvukem." },
          ].map((item) => (
            <div key={item.step} style={{ display: "flex", gap: "1rem", alignItems: "flex-start" }}>
              <div style={{ width: 28, height: 28, borderRadius: "50%", background: "linear-gradient(135deg, #34d399, #059669)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, fontSize: 12, fontWeight: 800, color: "#000" }}>
                {item.step}
              </div>
              <div>
                <div style={{ fontSize: 13, fontWeight: 700, color: "#fff", marginBottom: 3 }}>{item.title}</div>
                <div style={{ fontSize: 12, color: "#ededed", lineHeight: 1.6 }}>{item.desc}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Support */}
      <div style={{ background: "#111111", border: "1px solid #1a1a1a", borderRadius: 16, padding: "1.25rem 1.5rem", display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap" as const, gap: "1rem" }}>
        <div>
          <div style={{ fontSize: 13, fontWeight: 600, color: "#fff", marginBottom: 3 }}>Máte problémy?</div>
          <div style={{ fontSize: 12, color: "#ededed" }}>Napište nám a rádi pomůžeme.</div>
        </div>

        <a
          href="mailto:pato.strnadel@gmail.com"
          style={{ padding: "0.6rem 1.25rem", background: "transparent", border: "1px solid #2a2a2a", borderRadius: 10, color: "#ffffff", fontSize: 13, fontWeight: 600, textDecoration: "none" }}
        >
          ✉ pato.strnadel@gmail.com
        </a>
      </div>

      <style>{`@keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.4} }`}</style>
    </div>
  );
}