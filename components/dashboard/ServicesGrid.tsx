"use client";
import { useRouter } from "next/navigation";

export default function ServicesGrid() {
  const router = useRouter();

  const services = [
    {
      id: "nakupy",
      title: "Seznam nákupů",
      description: "Sledujte nákupy, prodeje a zisky z ticket resellingu. P&L přehledy, statistiky a AI analýza.",
      icon: "🎟️",
      href: "/nakupy",
      available: true,
      badge: "AKTIVNÍ",
    },
    {
      id: "chrome-launcher",
      title: "Chrome Launcher",
      description: "Spusťte všechny vaše Chrome profily najednou. Ideální pro správu více reseller účtů.",
      icon: "🚀",
      href: "/chrome-launcher",
      available: true,
      badge: null,
    },
  ];

  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: "1.25rem" }}>
      {services.map(service => (
        <div
          key={service.id}
          onClick={() => service.available && router.push(service.href)}
          style={{
            background: "linear-gradient(135deg, #161616 0%, #111111 100%)",
            border: "1px solid #3a3a3a",
            borderRadius: 20,
            padding: "2rem",
            cursor: service.available ? "pointer" : "default",
            position: "relative",
            overflow: "hidden",
            transition: "transform 0.2s, border-color 0.2s",
            opacity: service.available ? 1 : 0.5,
          }}
          onMouseEnter={e => {
            if (service.available) {
              (e.currentTarget as HTMLDivElement).style.transform = "translateY(-3px)";
              (e.currentTarget as HTMLDivElement).style.borderColor = "#c0c0c0";
            }
          }}
          onMouseLeave={e => {
            if (service.available) {
              (e.currentTarget as HTMLDivElement).style.transform = "translateY(0)";
              (e.currentTarget as HTMLDivElement).style.borderColor = "#3a3a3a";
            }
          }}
        >
          {/* Chrome glow top */}
          <div style={{
            position: "absolute", top: 0, left: 0, right: 0, height: 1,
            background: "linear-gradient(90deg, transparent, #c0c0c0, transparent)",
          }} />

          {/* Icon */}
          <div style={{
            width: 52, height: 52, borderRadius: 14,
            background: "linear-gradient(135deg, #2a2a2a, #1a1a1a)",
            border: "1px solid #3a3a3a",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: "1.5rem", marginBottom: "1.25rem",
          }}>
            {service.icon}
          </div>

          {/* Badge */}
          {service.badge && (
            <span style={{
              position: "absolute", top: 20, right: 20,
              fontSize: 11, fontWeight: 600, letterSpacing: "0.05em",
              background: "linear-gradient(135deg, #2a2a2a, #1f1f1f)",
              color: "#c0c0c0", border: "1px solid #3a3a3a",
              borderRadius: 6, padding: "3px 10px",
            }}>
              {service.badge}
            </span>
          )}

          <h3 style={{ fontSize: "1.2rem", fontWeight: 700, color: "#fff", marginBottom: "0.5rem" }}>
            {service.title}
          </h3>
          <p style={{ fontSize: "0.875rem", color: "#525252", lineHeight: 1.6, marginBottom: "1.5rem" }}>
            {service.description}
          </p>

          <div style={{
            display: "flex", alignItems: "center", gap: 6,
            fontSize: 13, fontWeight: 600,
            color: service.available ? "#c0c0c0" : "#525252",
          }}>
            {service.available ? "Otevřít aplikaci" : "Brzy dostupné"}
            {service.available && <span style={{ fontSize: 16 }}>→</span>}
          </div>
        </div>
      ))}
    </div>
  );
}
