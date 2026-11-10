"use client";

export default function PresaleBotClient() {
  return (
    <div style={{ maxWidth: 720, margin: "0 auto", padding: "2rem 1rem", background: "#0a0a10", position: "relative" }}>
      <div style={{ position: "fixed", inset: 0, zIndex: 0, pointerEvents: "none", background: "radial-gradient(ellipse 80% 50% at 20% 10%, rgba(123,108,246,0.1) 0%, transparent 60%), radial-gradient(ellipse 60% 40% at 80% 80%, rgba(89,52,196,0.07) 0%, transparent 60%)" }} />
      <div style={{ position: "fixed", inset: 0, zIndex: 0, pointerEvents: "none", backgroundImage: "linear-gradient(rgba(123,108,246,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(123,108,246,0.03) 1px, transparent 1px)", backgroundSize: "48px 48px" }} />

      {/* Header */}
      <div style={{ marginBottom: "2rem" }}>
        <div style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "4px 12px", background: "rgba(123,108,246,0.1)", border: "1px solid rgba(123,108,246,0.3)", borderRadius: 100, marginBottom: "0.75rem" }}>
          <div style={{ width: 6, height: 6, borderRadius: "50%", background: "#7b6cf6", animation: "pulse 1.5s infinite" }} />
          <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.1em", color: "#a78bfa" }}>BRZY K DISPOZICI</span>
        </div>
        <h1 style={{ fontSize: "1.75rem", fontWeight: 800, color: "#fff", marginBottom: "0.5rem", letterSpacing: "-0.02em" }}>
          ⚡ Pre-sale Bot
        </h1>
        <p style={{ fontSize: 14, color: "#ededed" , lineHeight: 1.7 }}>
          Automatické hromadné registrace na předprodeje.
        </p>
      </div>

      {/* Info card */}
      <div style={{ background: "linear-gradient(145deg, #1e1e26, #19191f)", border: "1px solid rgba(123,108,246,0.15)", borderRadius: 20, padding: "1.75rem", marginBottom: "1.5rem", position: "relative", overflow: "hidden" }}>
        <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 1, background: "linear-gradient(90deg, transparent, rgba(123,108,246,0.5), transparent)" }} />
        <div style={{ fontSize: 48, marginBottom: "1rem" }}>⚡</div>
        <p style={{ fontSize: 14, color: "#ffffff", lineHeight: 1.8, marginBottom: "1.5rem" }}>
          Pre-sale Bot bude dostupný při dalším větším předprodeji. O dostupnosti vás budeme informovat v Discordu. Pokud máte informace o akci s velkým potenciálem, napište Jirkovi nebo do Discordu a pokud akce stojí za to, bota připravíme. Na velké akce s potenciálem jako Coldplay nebo Taylor Swift bude bot zprovozněn.
        </p>
        <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap" as const }}>
          <a
            href="https://discord.com/invite/8ByCXzSSPP"
            target="_blank"
            rel="noopener noreferrer"
            style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "0.75rem 1.5rem", background: "#5865F2", border: "none", borderRadius: 10, color: "#fff", fontWeight: 700, fontSize: 14, cursor: "pointer", textDecoration: "none" }}
          >
            Discord TicketClub
          </a>
        </div>
      </div>

      {/* Support */}
      <div style={{ background: "linear-gradient(145deg, #1e1e26, #19191f)", border: "1px solid rgba(123,108,246,0.15)", borderRadius: 16, padding: "1.25rem 1.5rem", display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap" as const, gap: "1rem" }}>
        <div>
          <div style={{ fontSize: 13, fontWeight: 600, color: "#fff", marginBottom: 3 }}>Máte problémy nebo dotazy?</div>
          <div style={{ fontSize: 12, color: "#ededed"  }}>Napište nám a rádi pomůžeme.</div>
        </div>
        <a
          href="mailto:pato.strnadel@gmail.com"
          style={{ padding: "0.6rem 1.25rem", background: "transparent", border: "1px solid rgba(123,108,246,0.2)", borderRadius: 10, color: "#ffffff", fontSize: 13, fontWeight: 600, textDecoration: "none" }}
        >
          ✉ pato.strnadel@gmail.com
        </a>
      </div>

      <style>{`@keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.4} }`}</style>
    </div>
  );
}