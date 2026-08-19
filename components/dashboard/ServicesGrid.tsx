"use client";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
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

export default function ServicesGrid({
  isPro,
  isScale = false,
  isAdmin = false,
  user,
}: {
  isPro: boolean;
  isScale?: boolean;
  isAdmin?: boolean;
  user?: { id: string } | null;
}) {
  const router = useRouter();
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);

  useEffect(() => {
    const handler = () => setShowUpgradeModal(true);
    window.addEventListener("openUpgradeModal", handler);
    return () => window.removeEventListener("openUpgradeModal", handler);
  }, []);

  const videoMap: Record<string, string> = {
    "Refresh Bot": "https://www.youtube.com/embed/LJyLx5W9NLU",
    "Discord Watcher Bot": "https://www.youtube.com/embed/cMOqe1PVGTU",
    "Sales Tracker": "https://www.youtube.com/embed/M5XX5B0Wz30",
    "Chrome Launcher": "https://www.youtube.com/embed/ugbHFLb5Wcs",
    "Pre-sale Bot": "https://www.youtube.com/embed/tLOV3Jn4hzU",
    "Email Import": "https://www.youtube.com/embed/zZDGoWBib9s",
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
      id: "email-import",
      title: "Email Import",
      description: "Přeposílejte potvrzovací emaily z Ticketmaster a nákupy se automaticky přidají do Evidence.",
      icon: "📧",
      href: "/ucet",
      free: false,
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
      id: "discord-watcher",
      title: "Discord Watcher Bot",
      description: "Automatické sledování Discord alertů a nakupování vstupenek na Ticketmaster.",
      badge: "SCALE",
      href: "/discord-watcher",
      icon: "🤖",
      pro: false,
      scale: true,
    },
    {
      id: "sales-tracker",
      title: "Sales Tracker",
      description: "Sledujte prodeje a ceny vstupenek na Viagogo v reálném čase.",
      icon: "📊",
      href: "/sales-tracker",
      free: true,
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
      {/* Dynamic upgrade banner */}
      {!isScale && (
        <div style={{
          background: "linear-gradient(135deg, #1a1a2e, #16213e)",
          border: `1px solid ${isPro ? "rgba(59,130,246,0.3)" : "rgba(168,85,247,0.3)"}`,
          borderRadius: 16,
          padding: "1.25rem 1.5rem",
          marginBottom: "1.5rem",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          gap: "1rem",
          flexWrap: "wrap" as const,
        }}>
          <div>
            <div style={{ fontSize: 14, fontWeight: 700, color: isPro ? "#3b82f6" : "#a855f7", marginBottom: 4 }}>
              {isPro ? "🎁 Vyzkoušejte Scale zdarma na 12 dní" : "🎁 Vyzkoušejte PRO zdarma na 12 dní"}
            </div>
            <div style={{ fontSize: 12, color: "#ededed" }}>
              {isPro 
                ? "Odemkněte Refresh Bot unlimited a Discord Watcher Bot. Akce platí do 28. 8."
                : "Získejte přístup k Refresh Botu, Sales Trackeru a dalším PRO funkcím. Akce platí do 28. 8."
              }
            </div>
          </div>
          <button
            onClick={() => setShowUpgradeModal(true)}
            style={{
              padding: "0.6rem 1.25rem",
              background: isPro ? "#3b82f6" : "linear-gradient(135deg, #a855f7, #7c3aed)",
              border: "none",
              borderRadius: 10,
              color: "#fff",
              fontWeight: 700,
              fontSize: 13,
              cursor: "pointer",
              whiteSpace: "nowrap" as const,
            }}
          >
            {isPro ? "Začít 12denní trial →" : "Začít 12denní trial →"}
          </button>
        </div>
      )}

      {showUpgradeModal && <UpgradeModal onClose={() => setShowUpgradeModal(false)} />}
      <div className="services-grid" style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "1rem" }}>
        {services.map(service => {
          const locked = (service.scale ? (!isScale && !isAdmin) : (!service.free && !isPro && !isAdmin));
          return (
            <div
              key={service.id}
              onClick={() => { if (!locked && service.href) router.push(service.href); }}
              style={{
                background: "#111111",
                border: `1px solid ${locked ? "#1a1a1a" : "#ededed"}`,
                borderRadius: 16, padding: "1.5rem",
                cursor: (!locked && service.href) ? "pointer" : "default",
                position: "relative", overflow: "hidden",
                transition: "border-color 0.2s, transform 0.2s",
                ...(service.scale ? {
                  border: "1px solid rgba(168,85,247,0.4)",
                  boxShadow: "0 0 20px rgba(168,85,247,0.1)",
                  background: "linear-gradient(135deg, #111111, #130d1a)",
                } : {})
              }}
              onMouseEnter={e => {
                if (!locked && service.href) {
                  (e.currentTarget as HTMLDivElement).style.borderColor = service.scale ? "#a855f7" : "#ffffff";
                  (e.currentTarget as HTMLDivElement).style.transform = "translateY(-3px)";
                }
              }}
              onMouseLeave={e => {
                if (service.scale) {
                  (e.currentTarget as HTMLDivElement).style.borderColor = "rgba(168,85,247,0.4)";
                } else {
                  (e.currentTarget as HTMLDivElement).style.borderColor = locked ? "#1a1a1a" : "#ededed";
                }
                (e.currentTarget as HTMLDivElement).style.transform = "translateY(0)";
              }}
            >
              {service.scale && (
                <span style={{
                  position: "absolute", top: 12, right: 12,
                  background: "rgba(168,85,247,0.15)",
                  color: "#a855f7",
                  border: "1px solid rgba(168,85,247,0.3)",
                  fontSize: 10,
                  fontWeight: 700,
                  padding: "2px 8px",
                  borderRadius: 99,
                  letterSpacing: "0.08em",
                }}>SCALE</span>
              )}
              {!service.scale && !service.free && (
                <div style={{
                  position: "absolute", top: 12, right: 12,
                  padding: "3px 10px", borderRadius: 6, fontSize: 11, fontWeight: 700,
                  background: (isPro || isAdmin) ? "linear-gradient(135deg, #7c3aed, #5b21b6)" : "#1a1a1a",
                  color: (isPro || isAdmin) ? "#fff" : "#ededed",
                  border: (isPro || isAdmin) ? "none" : "1px solid #2a2a2a",
                  opacity: locked ? 0.6 : 1,
                }}>
                  {(isPro || isAdmin)
                    ? (service.id === "refresh-bot" ? "PRO / SCALE" : "PRO")
                    : (service.id === "refresh-bot" ? "🔒 PRO / SCALE" : "🔒 PRO")}
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
                <div style={{ flex: 1 }}>
                  {locked ? (
                    <div style={{ position: "relative" }}>
                      <div style={{
                        padding: "0.6rem 1rem",
                        background: "#0a0a0a",
                        border: "1px solid #1a1a1a",
                        borderRadius: 8,
                        color: service.scale ? "#a855f7" : "#4ade80",
                        fontSize: 13,
                        filter: "blur(4px)",
                        userSelect: "none" as const,
                        textAlign: "center" as const,
                      }}>
                        Otevřít aplikaci →
                      </div>
                      <div style={{
                        position: "absolute", inset: 0,
                        display: "flex", alignItems: "center", justifyContent: "center",
                      }}>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            window.dispatchEvent(new CustomEvent("openUpgradeModal"));
                          }}
                          style={{
                            padding: "0.5rem 1.25rem",
                            background: service.scale
                              ? "linear-gradient(135deg, #a855f7, #7c3aed)"
                              : "linear-gradient(135deg, #ffffff, #a0a0a0)",
                            border: "none",
                            borderRadius: 8,
                            color: service.scale ? "#fff" : "#000",
                            fontWeight: 700,
                            fontSize: 12,
                            cursor: "pointer",
                          }}
                        >
                          {service.scale ? "Upgradovat na Scale →" : "Upgradovat na PRO →"}
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div style={{
                      padding: "0.6rem 1rem",
                      background: "#1a1a1a",
                      border: "1px solid #2a2a2a",
                      borderRadius: 8,
                      color: "#fff",
                      fontSize: 13,
                      textAlign: "center" as const,
                      fontWeight: 600,
                    }}>
                      Otevřít aplikaci →
                    </div>
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
