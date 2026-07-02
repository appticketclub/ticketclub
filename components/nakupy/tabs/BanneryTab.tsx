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
  quantity_sold?: number;
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
  quantity_sold?: number;
  buyPrice: number; 
  sellPrice: number; 
  profit: number; 
  roi: number; 
  currency: string; 
}) { 
  const isProfit = data.profit >= 0; 
  const profitColor = isProfit ? "#4ade80" : "#f87171"; 
  const fmt = (n: number) => n.toLocaleString("cs-CZ", { minimumFractionDigits: 0, maximumFractionDigits: 0 }); 

  const buyStr = `${fmt(data.buyPrice)} ${data.currency}`; 
  const sellStr = `${fmt(data.sellPrice)} ${data.currency}`; 
  const profitStr = `${isProfit ? '+' : ''}${fmt(data.profit)} ${data.currency}`;

  const maxLen = Math.max(buyStr.length, sellStr.length, profitStr.length); 
  const priceSize = maxLen > 12 ? 28 : maxLen > 9 ? 36 : maxLen > 7 ? 42 : 48; 

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1280 600" width="100%" height="100%" preserveAspectRatio="xMidYMid meet"> 

  <rect width="1280" height="600" rx="24" fill="#111111"/> 
  <rect width="1280" height="600" rx="24" fill="none" stroke="${isProfit ? '#4ade80' : '#f87171'}" stroke-width="1.5" opacity="0.35"/> 
  <rect x="2" y="2" width="1276" height="596" rx="22" fill="none" stroke="${isProfit ? '#4ade80' : '#f87171'}" stroke-width="8" opacity="0.06"/> 

  <!-- UZAVŘENÝ FLIP badge vpravo hore --> 
  <rect x="910" y="30" width="340" height="48" rx="24" fill="none" stroke="#D4AF37" stroke-width="1" opacity="0.5"/> 
  <text x="1080" y="60" font-family="Arial, sans-serif" font-size="20" fill="#D4AF37" letter-spacing="3" text-anchor="middle">UZAVŘENÝ FLIP</text> 

  <!-- Názov eventu — menší --> 
  <text x="64" y="72" font-family="'Arial Black', Arial, sans-serif" font-size="52" font-weight="900" fill="#D4AF37">${data.eventName.toUpperCase().substring(0, 20)}</text> 

  <!-- Separator --> 
  <line x1="64" y1="110" x2="1216" y2="110" stroke="#222222" stroke-width="1.5"/> 

  <!-- 3 stĺpce hore --> 
  <text x="64" y="148" font-family="Arial, sans-serif" font-size="18" fill="#ffffff" letter-spacing="3">POČET LÍSTKŮ</text> 
  <text x="64" y="196" font-family="'Arial Black', Arial, sans-serif" font-size="42" font-weight="900" fill="#ffffff">${data.quantity_sold ?? data.quantity}×</text> 

  <line x1="380" y1="114" x2="380" y2="216" stroke="#222222" stroke-width="1.5"/> 

  <text x="410" y="148" font-family="Arial, sans-serif" font-size="18" fill="#ffffff" letter-spacing="3">NÁKUP CELKEM</text> 
  <text x="410" y="196" font-family="'Arial Black', Arial, sans-serif" font-size="${priceSize}" font-weight="900" fill="#888888">${buyStr}</text> 

  <line x1="840" y1="114" x2="840" y2="216" stroke="#222222" stroke-width="1.5"/> 

  <text x="870" y="148" font-family="Arial, sans-serif" font-size="18" fill="#ffffff" letter-spacing="3">PRODEJ CELKEM</text> 
  <text x="870" y="196" font-family="'Arial Black', Arial, sans-serif" font-size="${priceSize}" font-weight="900" fill="#ffffff">${sellStr}</text> 

  <!-- Separator --> 
  <line x1="64" y1="228" x2="1216" y2="228" stroke="#222222" stroke-width="1.5"/> 

  <!-- ZISK --> 
  <text x="64" y="272" font-family="Arial, sans-serif" font-size="20" fill="${isProfit ? '#4ade80' : '#f87171'}" letter-spacing="3">ZISK</text> 
  <text x="64" y="390" font-family="'Arial Black', Arial, sans-serif" font-size="110" font-weight="900" fill="${profitColor}">${profitStr}</text> 

  <!-- ROI --> 
  <text x="64" y="470" font-family="Arial, sans-serif" font-size="36" font-weight="900" fill="${isProfit ? '#4ade80' : '#f87171'}">ROI ${isProfit ? '+' : ''}${data.roi.toFixed(1)}%</text> 

  <!-- Logo TC vpravo dole --> 
  <image href="/logo.png" x="1060" y="460" width="200" height="70" preserveAspectRatio="xMidYMid meet" opacity="0.9"/> 

</svg>`; 
}

function BannerCard({ banner }: { banner: Banner }) {
  const cardRef = useRef<HTMLDivElement>(null);
  const svg = generateTicketSVG({
    eventName: banner.event_name,
    quantity: banner.quantity,
    quantity_sold: banner.quantity_sold,
    buyPrice: banner.buy_price * banner.quantity,
    sellPrice: banner.sell_price,
    profit: banner.profit,
    roi: banner.roi,
    currency: banner.currency,
  });

  async function downloadBanner() {
    const svgElement = cardRef.current?.querySelector("svg");
    if (!svgElement) return;

    const svgData = new XMLSerializer().serializeToString(svgElement);
    const svgBlob = new Blob([svgData], { type: "image/svg+xml;charset=utf-8" });

    const url = URL.createObjectURL(svgBlob);
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = 1280;
      canvas.height = 600;
      const ctx = canvas.getContext("2d")!;
      ctx.fillStyle = "#111111";
      ctx.fillRect(0, 0, 1280, 600);
      ctx.drawImage(img, 0, 0, 1280, 600);
      URL.revokeObjectURL(url);
      canvas.toBlob((blob) => {
        if (!blob) return;
        const a = document.createElement("a");
        a.href = URL.createObjectURL(blob);
        const safeName = banner.event_name.replace(/\s+/g, "-").toLowerCase();
        a.download = `ticketclub-${safeName}.png`;
        a.click();
        URL.revokeObjectURL(a.href);
      });
    };
    img.src = url;
  }

  async function handleShare() {
    const svgElement = cardRef.current?.querySelector("svg");
    if (!svgElement) return;

    const svgData = new XMLSerializer().serializeToString(svgElement);
    const svgBlob = new Blob([svgData], { type: "image/svg+xml;charset=utf-8" });

    const url = URL.createObjectURL(svgBlob);
    const img = new Image();
    img.onload = async () => {
      const canvas = document.createElement("canvas");
      canvas.width = 1280;
      canvas.height = 600;
      const ctx = canvas.getContext("2d")!;
      ctx.fillStyle = "#111111";
      ctx.fillRect(0, 0, 1280, 600);
      ctx.drawImage(img, 0, 0, 1280, 600);
      URL.revokeObjectURL(url);

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
          a.download = `ticketclub-${safeName}.png`;
          a.click();
          URL.revokeObjectURL(url);
        }
      });
    };
    img.src = url;
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
        <div style={{ width: "100%", aspectRatio: "1280/600", overflow: "hidden" }}>
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
            onClick={downloadBanner}
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
