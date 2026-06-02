"use client";
import { useRouter } from "next/navigation";

const services = [
  {
    id: "pl-tracker",
    title: "Seznam nákupů",
    description: "Sledujte nákupy, prodeje a zisky z ticket resellingu.",
    icon: "🎟️",
    href: "/dashboard",
    available: true,
    badge: null,
  },
  {
    id: "kalkulacka",
    title: "Kalkulačka",
    description: "Vypočítejte break-even a minimální prodejní cenu.",
    icon: "🧮",
    href: "/kalkulacka",
    available: false,
    badge: "Brzy",
  },
  {
    id: "email-generator",
    title: "Generátor e-mailů",
    description: "AI generování e-mailů pro kupující a transfer lístků.",
    icon: "✉️",
    href: "/emaily",
    available: false,
    badge: "Brzy",
  },
  {
    id: "account-vault",
    title: "Account Vault",
    description: "Správa vašich reseller účtů bezpečně na jednom místě.",
    icon: "🔐",
    href: "/vault",
    available: false,
    badge: "Brzy",
  },
  {
    id: "ai-asistent",
    title: "AI Asistent",
    description: "Ptejte se na vaše statistiky a získejte doporučení.",
    icon: "🤖",
    href: "/ai",
    available: false,
    badge: "Brzy",
  },
  {
    id: "event-scoring",
    title: "Event Scoring",
    description: "AI hodnocení eventů na základě dat z Ticketmaster.",
    icon: "📊",
    href: "/scoring",
    available: false,
    badge: "Brzy",
  },
];

export default function ServicesGrid() {
  const router = useRouter();

  return (
    <div style={{
      display: "grid",
      gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
      gap: "1.25rem",
    }}>
      {services.map((service) => (
        <div
          key={service.id}
          onClick={() => service.available && router.push(service.href)}
          style={{
            background: "#111111",
            border: service.available ? "1px solid #3a3a3a" : "1px solid #1a1a1a",
            borderRadius: 16,
            padding: "1.75rem",
            cursor: service.available ? "pointer" : "default",
            opacity: service.available ? 1 : 0.5,
            transition: "border-color 0.2s, transform 0.2s",
            position: "relative",
          }}
          onMouseEnter={e => {
            if (service.available) {
              (e.currentTarget as HTMLDivElement).style.borderColor = "#c0c0c0";
              (e.currentTarget as HTMLDivElement).style.transform = "translateY(-2px)";
            }
          }}
          onMouseLeave={e => {
            (e.currentTarget as HTMLDivElement).style.borderColor = service.available ? "#3a3a3a" : "#1a1a1a";
            (e.currentTarget as HTMLDivElement).style.transform = "translateY(0)";
          }}
        >
          {service.badge && (
            <span style={{
              position: "absolute", top: 16, right: 16,
              fontSize: 11, fontWeight: 600,
              background: "#1f1f1f", color: "#525252",
              border: "1px solid #2a2a2a",
              borderRadius: 6, padding: "2px 8px",
            }}>
              {service.badge}
            </span>
          )}
          <div style={{ fontSize: "2rem", marginBottom: "1rem" }}>{service.icon}</div>
          <h3 style={{ fontSize: "1.1rem", fontWeight: 700, color: "#fff", marginBottom: "0.5rem" }}>
            {service.title}
          </h3>
          <p style={{ fontSize: "0.875rem", color: "#525252", lineHeight: 1.6 }}>
            {service.description}
          </p>
          {service.available && (
            <div style={{ marginTop: "1.25rem", fontSize: 13, color: "#c0c0c0", display: "flex", alignItems: "center", gap: 4 }}>
              Otevřít →
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
