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
 
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1280 720" width="100%" height="100%" preserveAspectRatio="xMidYMid meet"> 
  <defs> 
    <filter id="borderGlow" x="-5%" y="-5%" width="110%" height="110%"> 
      <feGaussianBlur stdDeviation="5" result="blur"/> 
      <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge> 
    </filter> 
    <filter id="lineGlow"> 
      <feGaussianBlur stdDeviation="5" result="blur"/> 
      <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge> 
    </filter> 
    <filter id="profitGlow"> 
      <feGaussianBlur stdDeviation="10" result="blur"/> 
      <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge> 
    </filter> 
    <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1"> 
      <stop offset="0%" stop-color="#c9a227" stop-opacity="0.3"/> 
      <stop offset="100%" stop-color="#c9a227" stop-opacity="0"/> 
    </linearGradient> 
    <linearGradient id="tcGrad" x1="0" y1="0" x2="0" y2="1"> 
      <stop offset="0%" stop-color="#ffffff"/> 
      <stop offset="40%" stop-color="#bbbbbb"/> 
      <stop offset="100%" stop-color="#555555"/> 
    </linearGradient> 
    <linearGradient id="divGrad" x1="0" y1="0" x2="1" y2="0"> 
      <stop offset="0%" stop-color="#c9a227" stop-opacity="0"/> 
      <stop offset="15%" stop-color="#c9a227"/> 
      <stop offset="85%" stop-color="#c9a227"/> 
      <stop offset="100%" stop-color="#c9a227" stop-opacity="0"/> 
    </linearGradient> 
  </defs> 
 
  <rect width="1280" height="720" fill="#0c0c0c"/> 
  <rect x="0" y="0" width="44" height="720" fill="#0a0800"/> 
  <rect x="1236" y="0" width="44" height="720" fill="#0a0800"/> 
 
  <rect x="44" y="28" width="1192" height="664" rx="16" fill="#151515"/> 
  <rect x="44" y="28" width="1192" height="664" rx="16" fill="none" stroke="#c9a227" stroke-width="2.5" filter="url(#borderGlow)"/> 
 
  ${[76,126,176,226,276,326,376,426,476,526,576,626,676].map(cy => 
    `<circle cx="55" cy="${cy}" r="10" fill="#0c0c0c"/> 
      <circle cx="1225" cy="${cy}" r="10" fill="#0c0c0c"/>` 
  ).join("")} 
 
  <text x="100" y="116" font-family="'Arial Black', Arial, sans-serif" font-size="56" font-weight="900" fill="#ffffff" letter-spacing="4">${data.eventName.toUpperCase().substring(0, 20)}</text> 
 
  <rect x="930" y="65" width="292" height="62" rx="31" fill="none" stroke="#c9a227" stroke-width="2.5"/> 
  <rect x="957" y="100" width="18" height="14" rx="3" fill="#c9a227"/> 
  <path d="M958 100 Q958 86 966 86 Q974 86 974 100" fill="none" stroke="#c9a227" stroke-width="2.5" stroke-linecap="round"/> 
  <text x="990" y="107" font-family="'Arial Black', Arial, sans-serif" font-size="20" font-weight="900" fill="#c9a227" letter-spacing="2">UZAVŘENÝ FLIP</text> 
 
  <line x1="80" y1="146" x2="1200" y2="146" stroke="url(#divGrad)" stroke-width="1.5"/> 
 
  <rect x="82" y="176" width="62" height="46" rx="8" fill="none" stroke="#c9a227" stroke-width="2.2"/> 
  <line x1="82" y1="199" x2="144" y2="199" stroke="#c9a227" stroke-width="1.5" stroke-dasharray="5,4"/> 
  <circle cx="75" cy="199" r="9" fill="#151515" stroke="#c9a227" stroke-width="2"/> 
  <circle cx="151" cy="199" r="9" fill="#151515" stroke="#c9a227" stroke-width="2"/> 
  <text x="168" y="197" font-family="Arial, sans-serif" font-size="17" fill="#888888" letter-spacing="1">POČET LÍSTKŮ</text> 
  <text x="168" y="238" font-family="'Arial Black', Arial, sans-serif" font-size="40" font-weight="900" fill="#ffffff">${data.quantity}x</text> 
 
  <line x1="440" y1="162" x2="440" y2="294" stroke="#2e2e2e" stroke-width="1.5"/> 
 
  <path d="M468 183 L478 183 L492 218 L528 218 L538 193 L486 193" fill="none" stroke="#c9a227" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/> 
  <circle cx="496" cy="227" r="6" fill="#c9a227"/> 
  <circle cx="522" cy="227" r="6" fill="#c9a227"/> 
  <text x="552" y="197" font-family="Arial, sans-serif" font-size="17" fill="#888888" letter-spacing="1">NÁKUP CELKEM</text> 
  <text x="552" y="238" font-family="'Arial Black', Arial, sans-serif" font-size="40" font-weight="900" fill="#ffffff">${fmt(data.buyPrice)} ${data.currency}</text> 
 
  <line x1="830" y1="162" x2="830" y2="294" stroke="#2e2e2e" stroke-width="1.5"/> 
 
  <path d="M858 178 L900 178 L924 202 L900 226 L858 226 Z" fill="none" stroke="#c9a227" stroke-width="2.5" stroke-linejoin="round"/> 
  <circle cx="872" cy="202" r="6" fill="#c9a227"/> 
  <text x="940" y="197" font-family="Arial, sans-serif" font-size="17" fill="#888888" letter-spacing="1">PRODEJ CELKEM</text> 
  <text x="940" y="238" font-family="'Arial Black', Arial, sans-serif" font-size="40" font-weight="900" fill="#ffffff">${fmt(data.sellPrice)} ${data.currency}</text> 
 
  <line x1="80" y1="302" x2="1200" y2="302" stroke="#222222" stroke-width="1.5"/> 
 
  <line x1="510" y1="310" x2="510" y2="660" stroke="#2a2a2a" stroke-width="1.5"/> 
  <line x1="510" y1="395" x2="1210" y2="395" stroke="#ffffff" stroke-width="0.5" opacity="0.05"/> 
  <line x1="510" y1="482" x2="1210" y2="482" stroke="#ffffff" stroke-width="0.5" opacity="0.05"/> 
  <line x1="510" y1="570" x2="1210" y2="570" stroke="#ffffff" stroke-width="0.5" opacity="0.05"/> 
 
  <path d="M 520 648 C 560 645 580 640 610 632 C 640 624 660 618 690 610 C 720 602 740 592 770 580 C 800 568 820 558 850 542 C 875 528 895 512 920 494 C 945 476 960 458 985 436 C 1005 416 1025 396 1050 370 C 1075 344 1095 318 1120 290 C 1145 262 1165 236 1190 200 L 1200 648 Z" fill="url(#areaGrad)"/> 
  <path d="M 520 648 C 560 645 580 640 610 632 C 640 624 660 618 690 610 C 720 602 740 592 770 580 C 800 568 820 558 850 542 C 875 528 895 512 920 494 C 945 476 960 458 985 436 C 1005 416 1025 396 1050 370 C 1075 344 1095 318 1120 290 C 1145 262 1165 236 1190 200" fill="none" stroke="#f0c030" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round" filter="url(#lineGlow)"/> 
 
  ${[520,570,620,670,720,770,820,870,920,970,1020,1070,1120,1170].map((cx, i) => { 
    const cy = [648,641,630,616,602,580,558,532,494,452,406,356,290,228][i]; 
    return `<circle cx="${cx}" cy="${cy}" r="5" fill="#c9a227" opacity="0.85"/>`; 
  }).join("")} 
  <circle cx="1192" cy="200" r="10" fill="#f0c030"/> 
 
  <text x="90" y="378" font-family="'Arial Black', Arial, sans-serif" font-size="24" font-weight="900" fill="#c9a227" letter-spacing="4">ZISK</text> 
  <text x="82" y="498" font-family="'Arial Black', Arial, sans-serif" font-size="96" font-weight="900" fill="${profitColor}" filter="url(#profitGlow)">${isProfit ? "+" : ""}${fmt(data.profit)} ${data.currency}</text> 
  <text x="90" y="556" font-family="Arial, sans-serif" font-size="20" fill="#666666" letter-spacing="2">ROI</text> 
  <text x="90" y="600" font-family="'Arial Black', Arial, sans-serif" font-size="30" font-weight="900" fill="${profitColor}">${isProfit ? "+" : ""}${data.roi.toFixed(1)}%</text> 
 
  <image href="/logo.png" x="1050" y="590" width="180" height="80" preserveAspectRatio="xMidYMid meet" opacity="0.9"/> 
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
        <div style={{ width: "100%", aspectRatio: "16/9", overflow: "hidden" }}>
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
