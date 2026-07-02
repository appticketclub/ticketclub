"use client";

export default function PresaleBotClient() {
  return (
    <div style={{ maxWidth: 720, margin: "0 auto", padding: "2rem 1rem" }}>

      {/* Header */}
      <div style={{ marginBottom: "2rem" }}>
        <div style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "4px 12px", background: "rgba(167,139,250,0.1)", border: "1px solid rgba(167,139,250,0.3)", borderRadius: 100, marginBottom: "0.75rem" }}>
          <div style={{ width: 6, height: 6, borderRadius: "50%", background: "#a78bfa", animation: "pulse 1.5s infinite" }} />
          <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.1em", color: "#a78bfa" }}>BRZY K DISPOZICI</span>
        </div>
        <h1 style={{ fontSize: "1.75rem", fontWeight: 800, color: "#fff", marginBottom: "0.5rem", letterSpacing: "-0.02em" }}>
          ⚡ Pre-sale Bot
        </h1>
        <p style={{ fontSize: 14, color: "#ededed" , lineHeight: 1.7 }}>
          Automatická registrace na pre-sale akce.
        </p>
      </div>

      {/* Info card */}
      <div style={{ background: "#111111", border: "1px solid #1a1a1a", borderRadius: 20, padding: "1.75rem", marginBottom: "1.5rem", position: "relative", overflow: "hidden" }}>
        <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 1, background: "linear-gradient(90deg, transparent, #a78bfa, transparent)" }} />
        <div style={{ fontSize: 48, marginBottom: "1rem" }}>⚡</div>
        <p style={{ fontSize: 14, color: "#ffffff", lineHeight: 1.8, marginBottom: "1.5rem" }}>
          Pre-sale Bot bude dostupný při další pre-sale akci. O dostupnosti vás budeme informovat v Discordu TicketClub. Pokud máte informace o akci s velkým potenciálem, napište Jirkovi nebo do Discordu TicketClub — a pokud akce stojí za to, bota připravíme.
        </p>
        <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap" as const }}>
          <a
            href="https://discord.gg/ticketclub"
            target="_blank"
            style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "0.75rem 1.5rem", background: "linear-gradient(135deg, #5865F2, #4752c4)", border: "none", borderRadius: 12, color: "#fff", fontWeight: 700, fontSize: 13, textDecoration: "none" }}
          >
            Discord TicketClub →
          </a>
          <a
            href="mailto:pato.strnadel@gmail.com"
            style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "0.75rem 1.5rem", background: "transparent", border: "1px solid #2a2a2a", borderRadius: 12, color: "#ffffff", fontWeight: 600, fontSize: 13, textDecoration: "none" }}
          >
            ✉ Napsat Jirkovi
          </a>
        </div>
      </div>

      {/* Support */}
      <div style={{ background: "#111111", border: "1px solid #1a1a1a", borderRadius: 16, padding: "1.25rem 1.5rem", display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap" as const, gap: "1rem" }}>
        <div>
          <div style={{ fontSize: 13, fontWeight: 600, color: "#fff", marginBottom: 3 }}>Máte problémy nebo dotazy?</div>
          <div style={{ fontSize: 12, color: "#ededed"  }}>Napište nám a rádi pomůžeme.</div>
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