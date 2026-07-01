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

export function generateTicketSVG(data: { 
  eventName: string; 
  quantity: number; 
  buyPrice: number; 
  sellPrice: number; 
  profit: number; 
  roi: number; 
  currency: string; 
}) { 
  const isProfit = data.profit >= 0; 
  const profitColor = isProfit ? "#4ade80" : "#f87171"; 
  const fmt = (n: number) => n.toLocaleString("cs-CZ", { minimumFractionDigits: 0, maximumFractionDigits: 0 }); 
 
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1280 480" width="100%" height="100%" preserveAspectRatio="xMidYMid meet"> 
   <defs> 
     <filter id="profitGlow"> 
       <feGaussianBlur stdDeviation="8" result="blur"/> 
       <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge> 
     </filter> 
   </defs> 

   <!-- Pozadie --> 
   <rect width="1280" height="480" fill="#111111" rx="0"/> 

   <!-- Zelený pruh navrchu --> 
   <rect x="0" y="0" width="1280" height="8" fill="${isProfit ? '#4ade80' : '#f87171'}"/> 

   <!-- Label hore --> 
   <text x="64" y="56" font-family="Arial, sans-serif" font-size="22" fill="${isProfit ? '#4ade80' : '#f87171'}" letter-spacing="4">UZAVŘENÝ FLIP · P&amp;L REPORT</text> 

   <!-- Logo vpravo --> 
   <image href="/logo.png" x="1060" y="20" width="200" height="70" preserveAspectRatio="xMidYMid meet" opacity="0.9"/> 

   <!-- Názov eventu --> 
   <text x="64" y="130" font-family="'Arial Black', Arial, sans-serif" font-size="72" font-weight="900" fill="#ffffff">${data.eventName.toUpperCase().substring(0, 18)}</text> 

   <!-- Deliaaca čiara --> 
   <line x1="64" y1="152" x2="1216" y2="152" stroke="#222222" stroke-width="1.5"/> 

   <!-- 3 stĺpce — NÁKUP, PREDAJ, ZISK --> 
   <text x="64" y="192" font-family="Arial, sans-serif" font-size="20" fill="#444444" letter-spacing="3">NÁKUP CELKEM</text> 
   <text x="64" y="240" font-family="'Arial Black', Arial, sans-serif" font-size="48" font-weight="900" fill="#888888">${fmt(data.buyPrice)} ${data.currency}</text> 

   <text x="500" y="192" font-family="Arial, sans-serif" font-size="20" fill="#444444" letter-spacing="3">PRODEJ CELKEM</text> 
   <text x="500" y="240" font-family="'Arial Black', Arial, sans-serif" font-size="48" font-weight="900" fill="#ffffff">${fmt(data.sellPrice)} ${data.currency}</text> 

   <text x="950" y="192" font-family="Arial, sans-serif" font-size="20" fill="${isProfit ? '#4ade80' : '#f87171'}" letter-spacing="3">ZISK</text> 
   <text x="950" y="240" font-family="'Arial Black', Arial, sans-serif" font-size="56" font-weight="900" fill="${profitColor}" filter="url(#profitGlow)">${isProfit ? '+' : ''}${fmt(data.profit)} ${data.currency}</text> 

   <!-- Deliaaca čiara --> 
   <line x1="64" y1="268" x2="1216" y2="268" stroke="#222222" stroke-width="1.5"/> 

   <!-- Spodný riadok --> 
   <text x="64" y="312" font-family="Arial, sans-serif" font-size="22" fill="#444444">${data.quantity}× lístků</text> 
   <text x="320" y="312" font-family="Arial, sans-serif" font-size="22" fill="#444444">ROI ${isProfit ? '+' : ''}${data.roi.toFixed(1)}%</text> 

   <!-- ticketclub.vip zelené vpravo dole --> 
   <text x="1216" y="312" font-family="'Arial Black', Arial, sans-serif" font-size="22" font-weight="900" fill="${isProfit ? '#4ade80' : '#f87171'}" text-anchor="end" letter-spacing="1">ticketclub.vip</text> 
 </svg>`; 
}

function BannerCard({ banner }: { banner: Banner }) {
  const cardRef = useRef<HTMLDivElement>(null);
  const svg = generateTicketSVG({
    eventName: banner.event_name,
    quantity: banner.quantity,
    buyPrice: banner.buy_price * banner.quantity,
    sellPrice: banner.sell_price,
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
        width: "100%",
        borderRadius: 12,
        overflow: "hidden",
        border: "1px solid #1a1a1a",
      }}>
        <div style={{ width: "100%", aspectRatio: "8/3", overflow: "hidden" }}>
          <div
            style={{ width: "100%", height: "100%", lineHeight: 0 }}
            dangerouslySetInnerHTML={{ __html: svg }}
          />
        </div>
      </div>

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
              borderRadius: 8, color: "#ffffff",
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
