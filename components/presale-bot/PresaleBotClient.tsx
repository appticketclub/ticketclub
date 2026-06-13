"use client";

export default function PresaleBotClient() {
  return (
    <div style={{ maxWidth: 720, margin: "0 auto", padding: "2rem 1rem", position: "relative" }}>
      {/* Overlay */}
      <div style={{
        position: "fixed", inset: 0,
        background: "rgba(8,8,8,0.92)",
        zIndex: 50,
        display: "flex", flexDirection: "column" as const,
        alignItems: "center", justifyContent: "center",
        gap: "1.25rem",
        backdropFilter: "blur(6px)",
        padding: "2rem",
      }}>
        <div style={{ fontSize: 48 }}>⚡</div>
        <h2 style={{ fontSize: "1.25rem", fontWeight: 800, color: "#fff", textAlign: "center" as const, letterSpacing: "-0.02em" }}>
          Pre-sale Bot
        </h2>
        <p style={{ fontSize: 14, color: "#c0c0c0", textAlign: "center" as const, lineHeight: 1.8, maxWidth: 480 }}>
          Pre-sale Bot bude dostupný při další pre-sale akci. O dostupnosti vás budeme informovat v Discordu TicketClub. Pokud máte informace o akci s velkým potenciálem, napište Jirkovi nebo do Discordu TicketClub — a pokud akce stojí za to, bota připravíme.
        </p>
        <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap" as const, justifyContent: "center" }}>
          <a
            href="https://discord.gg/ticketclub"
            target="_blank"
            style={{ padding: "0.75rem 1.5rem", background: "linear-gradient(135deg, #5865F2, #4752c4)", border: "none", borderRadius: 12, color: "#fff", fontWeight: 700, fontSize: 13, textDecoration: "none" }}
          >
            Discord TicketClub →
          </a>
          <a
            href="mailto:pato.strnadel@gmail.com"
            style={{ padding: "0.75rem 1.5rem", background: "transparent", border: "1px solid #2a2a2a", borderRadius: 12, color: "#c0c0c0", fontWeight: 600, fontSize: 13, textDecoration: "none" }}
          >
            ✉ Napsat Jirkovi
          </a>
        </div>
      </div>

      {/* Background content (blurred) */}
      <h1 style={{ fontSize: "1.75rem", fontWeight: 800, color: "#fff", marginBottom: "0.5rem" }}>⚡ Pre-sale Bot</h1>
      <p style={{ fontSize: 14, color: "#525252" }}>Automatická registrace na pre-sale akce.</p>
    </div>
  );
}
