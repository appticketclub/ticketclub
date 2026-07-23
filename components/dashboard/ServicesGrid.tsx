"use client";
import { useRouter } from "next/navigation";
import { useState } from "react";
import UpgradeModal from "@/components/ucet/UpgradeModal";

function UpgradeButton() {
  const [show, setShow] = useState(false);
  return (
    <>
      <button onClick={() => setShow(true)} style={{
        padding: "8px 20px", fontSize: 13, fontWeight: 700,
        background: "linear-gradient(135deg, #7c3aed, #5b21b6)",
        border: "none", borderRadius: 10, color: "#fff",
        cursor: "pointer", whiteSpace: "nowrap" as const,
      }}>
        Upgradovat na PRO →
      </button>
      {show && <UpgradeModal onClose={() => setShow(false)} />}
    </>
  );
}

function UpgradeLink() {
  const [show, setShow] = useState(false);
  return (
    <>
      <button onClick={() => setShow(true)} style={{
        color: "#7c3aed",
        background: "none",
        border: "none",
        cursor: "pointer",
        fontWeight: 600,
        fontSize: 13,
      }}>
        Upgradovat na PRO →
      </button>
      {show && <UpgradeModal onClose={() => setShow(false)} />}
    </>
  );
}

export default function ServicesGrid({ isPro }: { isPro: boolean }) {
  const router = useRouter();
  const [videoUrl, setVideoUrl] = useState<string | null>(null);

  const videoMap: Record<string, string> = {
    "Refresh Bot": "https://www.youtube.com/embed/LJyLx5W9NLU",
    "Sales Tracker": "https://www.youtube.com/embed/M5XX5B0Wz30",
    "Chrome Launcher": "https://www.youtube.com/embed/ugbHFLb5Wcs",
    "Pre-sale Bot": "https://www.youtube.com/embed/tLOV3Jn4hzU",
  };

  const services = [
    {
      id: "nakupy",
      title: "Evidence nákupů",
      description: "P&L tracker pro ticket resellery.",
      icon: "🎟️",
      href: "/nakupy",
      free: true,
    },
    {
      id: "refresh-bot",
      title: "Refresh Bot",
      description: "Automatické refreshování vstupenek na Ticketmaster.",
      icon: "🔄",
      href: "/refresh-bot",
      free: false,
    },
    {
      id: "sales-tracker",
      title: "Sales Tracker",
      description: "Sledujte prodeje a ceny vstupenek na Viagogo v reálném čase.",
      icon: "📊",
      href: "/sales-tracker",
      free: false,
    },
    {
      id: "chrome-launcher",
      title: "Chrome Launcher",
      description: "Spusťte víc Chrome profilů najednou s jedním odkazem.",
      icon: "🚀",
      href: "/chrome-launcher",
      free: false,
    },
    {
      id: "presale-bot",
      title: "Pre-sale Bot",
      description: "Automatické hromadné registrace na předprodeje.",
      icon: "⚡",
      href: "/presale-bot",
      free: true,
    },
  ];

  return (
    <div>
      <style>{`
        @media (max-width: 640px) {
          .services-grid {
            grid-template-columns: 1fr !important;
          }
        }
        @media (min-width: 641px) and (max-width: 1024px) {
          .services-grid {
            grid-template-columns: repeat(2, 1fr) !important;
          }
        }
      `}</style>
      {!isPro && (
        <div style={{
          background: "linear-gradient(135deg, #0f0a1f, #0a0a1a)",
          border: "1px solid rgba(124,58,237,0.3)",
          borderRadius: 16, padding: "1.25rem 1.5rem",
          marginBottom: "1.5rem",
          position: "relative", overflow: "hidden",
          display: "flex", justifyContent: "space-between", alignItems: "center",
        }}>
          <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 1, background: "linear-gradient(90deg, transparent, #7c3aed, transparent)" }} />
          <div>
            <div style={{ fontSize: 14, fontWeight: 700, color: "#fff", marginBottom: 4 }}>
              ⭐ Vyzkoušej 12 dní zdarma
            </div>
            <div style={{ fontSize: 12, color: "#f5f5f5" }}>
              Použijte kód SKOUSKA při platbě
            </div>
          </div>
          <UpgradeButton />
        </div>
      )}
      <div className="services-grid" style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "1rem" }}>
        {services.map(service => {
          const locked = !service.free && !isPro;
          return (
            <div
              key={service.id}
              onClick={() => { if (!locked) router.push(service.href); }}
              style={{
                background: "#111111",
                border: `1px solid ${locked ? "#1a1a1a" : "#ededed"}`,
                borderRadius: 16, padding: "1.5rem",
                cursor: locked ? "default" : "pointer",
                position: "relative", overflow: "hidden",
                transition: "border-color 0.2s, transform 0.2s",
              }}
              onMouseEnter={e => {
                if (!locked) {
                  (e.currentTarget as HTMLDivElement).style.borderColor = "#ffffff";
                  (e.currentTarget as HTMLDivElement).style.transform = "translateY(-3px)";
                }
              }}
              onMouseLeave={e => {
                (e.currentTarget as HTMLDivElement).style.borderColor = locked ? "#1a1a1a" : "#ededed";
                (e.currentTarget as HTMLDivElement).style.transform = "translateY(0)";
              }}
            >
              {/* Pro badge */}
              {!service.free && (
                <div style={{
                  position: "absolute", top: 12, right: 12,
                  padding: "3px 10px", borderRadius: 6, fontSize: 11, fontWeight: 700,
                  background: isPro ? "linear-gradient(135deg, #7c3aed, #5b21b6)" : "#1a1a1a",
                  color: isPro ? "#fff" : "#ededed",
                  border: isPro ? "none" : "1px solid #2a2a2a",
                  opacity: locked ? 0.6 : 1,
                }}>
                  {isPro ? "PRO" : "🔒 PRO"}
                </div>
              )}



              <div style={{
                width: 52, height: 52, borderRadius: 14,
                background: "linear-gradient(135deg, #2a2a2a, #1a1a1a)",
                border: "1px solid #ededed",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: "1.5rem", marginBottom: "1.25rem",
                opacity: locked ? 0.6 : 1,
              }}>
                {service.icon}
              </div>

              <h3 style={{ fontSize: "1.2rem", fontWeight: 700, color: locked ? "#ededed" : "#fff", marginBottom: "0.5rem", opacity: locked ? 0.6 : 1 }}>
                {service.title}
              </h3>
              <p style={{ fontSize: "0.875rem", color: "#f5f5f5", lineHeight: 1.6, marginBottom: "1.5rem", opacity: locked ? 0.6 : 1 }}>
                {service.description}
              </p>

              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: "auto" }}>
                <div style={{ opacity: locked ? 0.6 : 1, flex: 1 }}>
                  {locked ? (
                    <div style={{ fontSize: 13, color: "#f5f5f5", display: "flex", alignItems: "center", gap: 6 }}>
                      🔒 Dostupné v Pro plánu
                      <div style={{ marginLeft: "auto" }}>
                        <UpgradeLink />
                      </div>
                    </div>
                  ) : (
                    <a href={service.href} style={{ fontSize: 13, color: "#ffffff", textDecoration: "none" }}>
                      Otevřít aplikaci →
                    </a>
                  )}
                </div>
                {videoMap[service.title] && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      e.preventDefault();
                      setVideoUrl(videoMap[service.title]);
                    }}
                    style={{ 
                      background: "none", 
                      border: "1px solid #2a2a2a", 
                      borderRadius: 8, 
                      padding: "4px 10px", 
                      color: "#ffffff", 
                      fontSize: 12, 
                      cursor: "pointer", 
                      display: "flex", 
                      alignItems: "center", 
                      gap: 4, 
                      marginLeft: locked ? "8px" : "0", 
                    }}
                  >
                    ℹ️ Video ukázka
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {videoUrl && (
        <>
          <div
            onClick={() => setVideoUrl(null)}
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
                src={`${videoUrl}?autoplay=1`}
                style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "100%" }}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            </div>
            <button
              onClick={() => setVideoUrl(null)}
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
