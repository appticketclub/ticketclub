"use client";
import { useState, useEffect, useRef } from "react";
import { createClient } from "@/lib/supabase/client";
import { useCurrency } from "@/lib/context/CurrencyContext";

type Banner = {
  id: string;
  event_name: string;
  buy_price: number;
  sell_price: number;
  quantity: number;
  fees: number;
  profit: number;
  roi: number;
  currency: string;
  platform: string | null;
  created_at: string;
};

function generateTicketSVG(data: { 
  event_name: string; 
  quantity: number; 
  buy_price: number; 
  sell_price: number; 
  profit: number; 
  roi: number; 
  currency: string; 
}) { 
  const isProfit = data.profit >= 0; 
  const color = isProfit ? "#34d399" : "#f87171"; 
  const fmt = (n: number) => n.toLocaleString("cs-CZ", { minimumFractionDigits: 2, maximumFractionDigits: 2 }); 

  return `<svg viewBox="0 0 700 220" xmlns="http://www.w3.org/2000/svg" width="700" height="220"> 
    <path d="M20,0 L560,0 Q580,0 580,20 L580,85 Q565,85 565,100 Q565,115 580,115 L580,200 Q580,220 560,220 L20,220 Q0,220 0,200 L0,115 Q15,115 15,100 Q15,85 0,85 L0,20 Q0,0 20,0 Z" fill="#0d0d0d" stroke="#2a2a2a" stroke-width="1"/> 
    <path d="M20,0 L560,0" stroke="#D4AF37" stroke-width="2"/> 
    <line x1="580" y1="85" x2="700" y2="85" stroke="#1a1a1a" stroke-width="1" stroke-dasharray="5,4"/> 
    <line x1="580" y1="115" x2="700" y2="115" stroke="#1a1a1a" stroke-width="1" stroke-dasharray="5,4"/> 
    <circle cx="580" cy="95" r="11" fill="#080808" stroke="#1a1a1a" stroke-width="1"/> 
    <circle cx="580" cy="105" r="11" fill="#080808" stroke="#1a1a1a" stroke-width="1"/> 
    <rect x="580" y="0" width="120" height="220" fill="#0d0d0d"/> 
    <line x1="580" y1="0" x2="580" y2="84" stroke="#1a1a1a" stroke-width="1" stroke-dasharray="5,4"/> 
    <line x1="580" y1="116" x2="580" y2="220" stroke="#1a1a1a" stroke-width="1" stroke-dasharray="5,4"/> 

    <text x="28" y="30" font-size="10" font-weight="700" fill="#D4AF37" letter-spacing="2" font-family="monospace">TICKETCLUB</text> 
    <text x="28" y="52" font-size="18" font-weight="900" fill="#ffffff" font-family="monospace">${data.event_name.substring(0, 28)}</text> 
    <text x="28" y="68" font-size="10" fill="#525252" font-family="monospace">UZAVŘENÝ FLIP</text> 

    <line x1="28" y1="78" x2="552" y2="78" stroke="#1a1a1a" stroke-width="0.5"/> 

    <text x="28" y="95" font-size="9" fill="#525252" font-family="monospace" letter-spacing="1">POČET LÍSTKŮ</text> 
    <text x="28" y="110" font-size="16" font-weight="700" fill="#ffffff" font-family="monospace">${data.quantity}×</text> 

    <text x="140" y="95" font-size="9" fill="#525252" font-family="monospace" letter-spacing="1">KOUPENO</text> 
    <text x="140" y="110" font-size="16" font-weight="700" fill="#c0c0c0" font-family="monospace">${fmt(data.buy_price * data.quantity)} ${data.currency}</text> 

    <text x="320" y="95" font-size="9" fill="#525252" font-family="monospace" letter-spacing="1">NÁKUP / KS</text> 
    <text x="320" y="110" font-size="16" font-weight="700" fill="#c0c0c0" font-family="monospace">${fmt(data.buy_price)} ${data.currency}</text> 

    <text x="320" y="130" font-size="9" fill="#525252" font-family="monospace" letter-spacing="1">PRODEJ / KS</text> 
    <text x="320" y="145" font-size="16" font-weight="700" fill="#c0c0c0" font-family="monospace">${fmt(data.sell_price)} ${data.currency}</text> 

    <line x1="28" y1="120" x2="552" y2="120" stroke="#1a1a1a" stroke-width="0.5"/> 

    <text x="28" y="140" font-size="9" fill="#525252" font-family="monospace" letter-spacing="1">ZISK</text> 
    <text x="28" y="162" font-size="32" font-weight="900" fill="${color}" font-family="monospace">${isProfit ? "+" : ""}${fmt(data.profit)} ${data.currency}</text> 

    <text x="28" y="182" font-size="9" fill="#525252" font-family="monospace" letter-spacing="1">ROI</text> 
    <text x="28" y="197" font-size="14" font-weight="700" fill="${color}" font-family="monospace">${isProfit ? "+" : ""}${data.roi.toFixed(1)}%</text> 

    <line x1="28" y1="205" x2="552" y2="205" stroke="#1a1a1a" stroke-width="0.5"/> 
    <text x="28" y="216" font-size="9" fill="#3a3a3a" font-family="monospace">ticketclub.vip</text> 

    <rect x="600" y="30" width="3" height="160" fill="#1a1a1a"/> 
    <rect x="606" y="30" width="6" height="160" fill="#1a1a1a"/> 
    <rect x="615" y="30" width="3" height="160" fill="#1a1a1a"/> 
    <rect x="620" y="30" width="5" height="160" fill="#1a1a1a"/> 
    <rect x="628" y="30" width="3" height="160" fill="#1a1a1a"/> 
    <rect x="633" y="30" width="7" height="160" fill="#1a1a1a"/> 
    <rect x="643" y="30" width="3" height="160" fill="#1a1a1a"/> 
    <rect x="648" y="30" width="4" height="160" fill="#1a1a1a"/> 
    <rect x="655" y="30" width="6" height="160" fill="#1a1a1a"/> 
    <rect x="664" y="30" width="3" height="160" fill="#1a1a1a"/> 
    <rect x="669" y="30" width="5" height="160" fill="#1a1a1a"/> 
    <rect x="677" y="30" width="3" height="160" fill="#1a1a1a"/> 
  </svg>`; 
}

function BannerCard({ banner }: { banner: Banner }) {
  const cardRef = useRef<HTMLDivElement>(null);
  const svg = generateTicketSVG({
    event_name: banner.event_name,
    quantity: banner.quantity,
    buy_price: banner.buy_price,
    sell_price: banner.sell_price,
    profit: banner.profit,
    roi: banner.roi,
    currency: banner.currency,
  });

  async function handleShare() {
    if (!cardRef.current) return;
    try {
      const { default: html2canvas } = await import("html2canvas");
      
      const canvas = await html2canvas(cardRef.current, { 
        backgroundColor: "#0d0d0d", 
        scale: 2, 
        useCORS: true, 
        allowTaint: true, 
        logging: false, 
      });
      
      canvas.toBlob(async (blob) => {
        if (!blob) return;
        const file = new File([blob], "ticketclub-flip.png", { type: "image/png" });
        if (navigator.share && navigator.canShare({ files: [file] })) {
          await navigator.share({ files: [file], title: "Můj flip na TicketClub" });
        } else {
          const url = URL.createObjectURL(blob);
          const a = document.createElement("a");
          a.href = url;
          const safeName = banner.event_name.replace(/\s+/g, "-").toLowerCase();
          a.download = "ticketclub-" + safeName + ".png";
          a.click();
          URL.revokeObjectURL(url);
        }
      });
    } catch (e) { console.error(e); }
  }

  return (
    <div style={{ background: "#111111", border: "1px solid #1a1a1a", borderRadius: 16, overflow: "hidden" }}>
      {/* Full banner preview with ref! */}
      <div ref={cardRef} style={{
        padding: "1rem",
        display: "flex",
        justifyContent: "center",
      }} dangerouslySetInnerHTML={{ __html: svg }} />

      {/* Footer */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "0.75rem 1.25rem", gap: "0.5rem" }}>
        <span style={{ fontSize: 12, color: "#3a3a3a" }}>
          {new Date(banner.created_at).toLocaleDateString("cs-CZ")}
        </span>
        <div style={{ display: "flex", gap: "0.5rem" }}>
          {/* Download button */}
          <button
            onClick={async () => {
              if (!cardRef.current) return;
              try {
                const { default: html2canvas } = await import("html2canvas");
                const canvas = await html2canvas(cardRef.current, { 
                  backgroundColor: "#0d0d0d", 
                  scale: 2, 
                  useCORS: true, 
                  allowTaint: true, 
                  logging: false, 
                });
                
                canvas.toBlob((blob) => {
                  if (!blob) return;
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement("a");
                  a.href = url;
                  const safeName = banner.event_name.replace(/\s+/g, "-").toLowerCase();
                  a.download = "ticketclub-" + safeName + ".png";
                  a.click();
                  URL.revokeObjectURL(url);
                });
              } catch (e) { console.error(e); }
            }}
            style={{
              padding: "6px 14px", fontSize: 12, fontWeight: 700,
              background: "transparent",
              border: "1px solid #2a2a2a",
              borderRadius: 8, color: "#c0c0c0",
              cursor: "pointer", letterSpacing: "0.05em",
            }}
          >
            ⬇ Stáhnout
          </button>

          {/* Share button */}
          <button
            onClick={handleShare}
            style={{
              padding: "6px 16px", fontSize: 12, fontWeight: 700,
              background: "linear-gradient(135deg, #ffffff, #a0a0a0)",
              border: "none", borderRadius: 8,
              color: "#000", cursor: "pointer", letterSpacing: "0.05em",
            }}
          >
            ↗ Sdílet
          </button>
        </div>
      </div>
    </div>
  );
}

export default function BanneryTab() {
  const [banners, setBanners] = useState<Banner[]>([]);
  const [loading, setLoading] = useState(true);
  const lastLoadRef = useRef<number>(0);

  async function loadData(force = false) {
    const now = Date.now();
    if (!force && now - lastLoadRef.current < 30000) return; // 30s cache
    lastLoadRef.current = now;

    const supabase = createClient();
    const { data } = await supabase.from("banners").select("*").order("created_at", { ascending: false });
    setBanners(data ?? []);
    setLoading(false);
  }

  useEffect(() => { loadData(); }, []);

  return (
    <div>
      <div style={{ marginBottom: "1.75rem" }}>
        <h1 style={{ fontSize: "1.5rem", fontWeight: 700, color: "#fff", marginBottom: "0.25rem" }}>P&L bannery</h1>
        <p style={{ fontSize: 13, color: "#3a3a3a" }}>{banners.length} {banners.length === 1 ? "banner" : banners.length < 5 ? "bannery" : "bannerů"}</p>
      </div>

      {loading && <div style={{ color: "#525252", fontSize: 14 }}>Načítání...</div>}

      {!loading && banners.length === 0 && (
        <div style={{ background: "#111111", border: "1px dashed #2a2a2a", borderRadius: 16, padding: "4rem", textAlign: "center" }}>
          <div style={{ fontSize: "2.5rem", marginBottom: "1rem" }}>🖼️</div>
          <p style={{ color: "#525252", fontSize: 14 }}>Zatím žádné bannery. Zaznamenejte prodej a banner se automaticky uloží.</p>
        </div>
      )}

      {!loading && banners.length > 0 && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(340px, 1fr))", gap: "1rem" }}>
          {banners.map(banner => <BannerCard key={banner.id} banner={banner} />)}
        </div>
      )}
    </div>
  );
}
