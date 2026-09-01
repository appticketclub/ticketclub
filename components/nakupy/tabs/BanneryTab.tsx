"use client";
import { useState, useEffect, useRef } from "react";
import { createClient } from "@/lib/supabase/client";
import { useCurrency } from "@/lib/context/CurrencyContext";

let logoBase64: string | null = null;

export async function getLogoBase64(): Promise<string> {
  if (logoBase64) return logoBase64;
  try {
    const res = await fetch("/logo.png");
    const blob = await res.blob();
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        logoBase64 = reader.result as string;
        resolve(logoBase64);
      };
      reader.readAsDataURL(blob);
    });
  } catch {
    return "";
  }
}

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
  city?: string | null;
  event_actual_date?: string | null;
};

export function generateTicketSVG(data: any, logoSrc: string = ""): string {
  const isProfit = data.profit >= 0;
  const buyStr = `${data.buyPrice?.toLocaleString("cs-CZ")} ${data.currency ?? "€"}`;
  const sellStr = `${data.sellPrice?.toLocaleString("cs-CZ")} ${data.currency ?? "€"}`;
  const profitStr = `${isProfit ? "+" : ""}${data.profit?.toLocaleString("cs-CZ")} ${data.currency ?? "€"}`;
  const priceSize = buyStr.length > 10 ? 32 : 40;

  return `
<svg width="100%" viewBox="0 0 1280 600" xmlns="http://www.w3.org/2000/svg">
<defs>
  <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
    <stop offset="0%" stop-color="#181A19"/>
    <stop offset="38%" stop-color="#111312"/>
    <stop offset="72%" stop-color="#0D100F"/>
    <stop offset="100%" stop-color="#090B0A"/>
  </linearGradient>
  <radialGradient id="ambientTop" cx="18%" cy="2%" r="74%">
    <stop offset="0%" stop-color="#FFFFFF" stop-opacity=".055"/>
    <stop offset="100%" stop-color="#FFFFFF" stop-opacity="0"/>
  </radialGradient>
  <linearGradient id="panelBg" x1="0" y1="0" x2="0" y2="1">
    <stop offset="0%" stop-color="#191C1A"/>
    <stop offset="50%" stop-color="#151817"/>
    <stop offset="100%" stop-color="#111413"/>
  </linearGradient>
  <linearGradient id="gold" x1="0" y1="0" x2="1" y2="1">
    <stop offset="0%" stop-color="#F0BF52"/>
    <stop offset="45%" stop-color="#D49C34"/>
    <stop offset="100%" stop-color="#F1BF50"/>
  </linearGradient>
  <linearGradient id="profitGradient" x1="0" y1="0" x2="0" y2="1">
    ${isProfit ? `
      <stop offset="0%" stop-color="#82C956"/>
      <stop offset="45%" stop-color="#68B746"/>
      <stop offset="100%" stop-color="#3E8730"/>
    ` : `
      <stop offset="0%" stop-color="#F07A7A"/>
      <stop offset="48%" stop-color="#DC5A5A"/>
      <stop offset="100%" stop-color="#A93A3A"/>
    `}
  </linearGradient>
  <filter id="panelShadow" x="-20%" y="-30%" width="140%" height="160%">
    <feDropShadow dx="0" dy="8" stdDeviation="12" flood-color="#000000" flood-opacity=".35"/>
  </filter>
  <filter id="numberShadow" x="-20%" y="-30%" width="140%" height="160%">
    <feDropShadow dx="0" dy="6" stdDeviation="4" flood-color="#000000" flood-opacity=".48"/>
  </filter>
  <filter id="iconShadow" x="-30%" y="-30%" width="160%" height="160%">
    <feDropShadow dx="0" dy="4" stdDeviation="6" flood-color="#000000" flood-opacity=".35"/>
  </filter>
  <linearGradient id="waveFade" x1="0" y1="0" x2="1" y2="0">
    <stop offset="0%" stop-color="#FFFFFF" stop-opacity="0"/>
    <stop offset="45%" stop-color="#FFFFFF" stop-opacity=".38"/>
    <stop offset="100%" stop-color="#FFFFFF" stop-opacity=".72"/>
  </linearGradient>
  <mask id="waveMask">
    <rect x="280" y="345" width="1000" height="255" fill="url(#waveFade)"/>
  </mask>
</defs>

<rect width="1280" height="600" rx="24" fill="url(#bg)"/>
<rect width="1280" height="600" rx="24" fill="url(#ambientTop)"/>
<rect x="1" y="1" width="1278" height="598" rx="23" fill="none" stroke="#C99B3D" stroke-width="1" stroke-opacity=".78"/>

<text x="64" y="91" font-family="'Arial Black', Arial, sans-serif" font-weight="900" fill="#F5F5F4">
  <tspan font-size="50" letter-spacing="-1.6">${data.eventName?.toUpperCase().substring(0, 20) ?? ""}</tspan>
  <tspan dx="26" font-family="Arial, sans-serif" font-size="22" font-weight="500" letter-spacing="3" fill="#E0AA3C">${(data.city ?? "").toUpperCase()}</tspan>
</text>

<g transform="translate(65 116)" fill="none" stroke="#E1A93B" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">
  <rect x="0" y="4" width="22" height="19" rx="2"/>
  <line x1="0" y1="10" x2="22" y2="10"/>
  <line x1="6" y1="0" x2="6" y2="7" stroke-width="2"/>
  <line x1="16" y1="0" x2="16" y2="7" stroke-width="2"/>
</g>
<text x="103" y="136" font-family="Arial, sans-serif" font-size="20" font-weight="400" letter-spacing="3" fill="#D9D9D9">${data.eventDate ?? ""}</text>

<rect x="954" y="54" width="270" height="48" rx="24" fill="#0F1210" fill-opacity=".70" stroke="#D9A43A" stroke-width="1" stroke-opacity=".95"/>
<circle cx="986" cy="78" r="6" fill="url(#gold)"/>
<text x="1100" y="85" font-family="Arial, sans-serif" font-size="18" font-weight="500" fill="#E0AA3F" letter-spacing="3.3" text-anchor="middle">UZAVŘENÝ FLIP</text>

<rect x="64" y="176" width="1152" height="142" rx="17" fill="url(#panelBg)" stroke="#FFFFFF" stroke-width="1" stroke-opacity=".10" filter="url(#panelShadow)"/>

<circle cx="129" cy="247" r="36" fill="#1C1F1D" stroke="#AD8D4A" stroke-width="1" stroke-opacity=".28" filter="url(#iconShadow)"/>
<g transform="translate(112 230) rotate(-40 17 17)" fill="none" stroke="url(#gold)" stroke-width="2.2" stroke-linejoin="round">
  <path d="M3 8 Q3 4 7 4 H27 Q31 4 31 8 V12 Q26 13 26 17 Q26 21 31 22 V26 Q31 30 27 30 H7 Q3 30 3 26 V22 Q8 21 8 17 Q8 13 3 12 Z"/>
  <line x1="17" y1="8" x2="17" y2="26" stroke-dasharray="3 3"/>
</g>
<text x="190" y="224" font-family="Arial, sans-serif" font-size="13" font-weight="500" fill="#E9E9E9" letter-spacing="3">POČET LÍSTKŮ</text>
<text x="190" y="275" font-family="'Arial Black', Arial, sans-serif" font-size="42" font-weight="900" fill="#FFFFFF" letter-spacing="-1">${data.quantity_sold ?? data.quantity}×</text>

<line x1="411" y1="201" x2="411" y2="294" stroke="#FFFFFF" stroke-width="1" stroke-opacity=".23"/>

<circle cx="500" cy="247" r="36" fill="#1C1F1D" stroke="#AD8D4A" stroke-width="1" stroke-opacity=".28" filter="url(#iconShadow)"/>
<g transform="translate(482 229)" fill="none" stroke="url(#gold)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
  <path d="M2 5 H7 L11 23 H29 L34 10 H10"/>
  <line x1="12" y1="26" x2="29" y2="26"/>
  <circle cx="14" cy="31" r="2"/>
  <circle cx="28" cy="31" r="2"/>
</g>
<text x="560" y="224" font-family="Arial, sans-serif" font-size="13" font-weight="500" fill="#E9E9E9" letter-spacing="3">NÁKUP CELKEM</text>
<text x="560" y="275" font-family="'Arial Black', Arial, sans-serif" font-size="${priceSize}" font-weight="900" fill="#FFFFFF" letter-spacing="-1">${buyStr}</text>

<line x1="790" y1="201" x2="790" y2="294" stroke="#FFFFFF" stroke-width="1" stroke-opacity=".23"/>

<circle cx="880" cy="247" r="36" fill="#1C1F1D" stroke="#AD8D4A" stroke-width="1" stroke-opacity=".28" filter="url(#iconShadow)"/>
<g transform="translate(861 228)" fill="none" stroke="url(#gold)" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
  <path d="M2 27 L12 17 L19 21 L34 5"/>
  <path d="M27 5 H34 V12"/>
  <line x1="7" y1="32" x2="7" y2="27"/>
  <line x1="14" y1="32" x2="14" y2="24"/>
  <line x1="21" y1="32" x2="21" y2="21"/>
  <line x1="28" y1="32" x2="28" y2="16"/>
</g>
<text x="940" y="224" font-family="Arial, sans-serif" font-size="13" font-weight="500" fill="#E9E9E9" letter-spacing="3">PRODEJ CELKEM</text>
<text x="940" y="275" font-family="'Arial Black', Arial, sans-serif" font-size="${priceSize}" font-weight="900" fill="#FFFFFF" letter-spacing="-1">${sellStr}</text>

<text x="64" y="364" font-family="Arial, sans-serif" font-size="16" font-weight="500" fill="${isProfit ? "#67B746" : "#E15D5D"}" letter-spacing="4">ČISTÝ ZISK</text>
<rect x="64" y="381" width="67" height="2" rx="1" fill="${isProfit ? "#68B746" : "#E15D5D"}"/>
<text x="64" y="486" font-family="'Arial Black', Arial, sans-serif" font-size="92" font-weight="900" fill="url(#profitGradient)" letter-spacing="-3.5" filter="url(#numberShadow)">${profitStr}</text>

<rect x="64" y="510" width="282" height="62" rx="14" fill="${isProfit ? "#0B110B" : "#150D0D"}" fill-opacity=".90" stroke="${isProfit ? "#5AA03E" : "#B84B4B"}" stroke-width="1" stroke-opacity=".7"/>
<g transform="translate(104 541)" fill="none" stroke="${isProfit ? "#69B846" : "#E15D5D"}" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">
  <circle cx="0" cy="0" r="16"/>
  <circle cx="0" cy="0" r="9"/>
  <circle cx="0" cy="0" r="2.5" fill="${isProfit ? "#69B846" : "#E15D5D"}"/>
  <path d="M1 -1 L15 -15" fill="none"/>
  <path d="M10 -15 H16 V-9" fill="none"/>
</g>
<text x="145" y="550" font-family="'Arial Black', Arial, sans-serif" font-size="24" font-weight="900" fill="${isProfit ? "#69B846" : "#E15D5D"}" letter-spacing="1.6">ROI ${isProfit ? "+" : ""}${data.roi?.toFixed(1) ?? "0.0"}%</text>

<g mask="url(#waveMask)" fill="none" stroke="#B79540" stroke-width="1" stroke-linecap="round" opacity=".30">
  <path d="M300 590 C450 550 560 528 680 475 C825 412 945 382 1080 370 C1160 363 1225 372 1285 390" stroke-dasharray="1 8"/>
  <path d="M350 600 C520 580 630 555 745 515 C875 467 995 438 1120 427 C1190 422 1242 432 1285 447" stroke-dasharray="1 8"/>
  <path d="M440 600 C590 595 700 577 810 550 C925 521 1030 498 1140 489 C1200 485 1248 494 1285 506" stroke-dasharray="1 8"/>
  <path d="M570 600 C700 600 800 595 900 582 C995 569 1080 559 1165 554 C1218 551 1255 560 1285 569" stroke-dasharray="1 8"/>
</g>

  ${logoSrc ? `<image href="${logoSrc}" x="730" y="415" width="520" height="180" preserveAspectRatio="xMaxYMax meet"/>` : ""}
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
    city: banner.city ?? "",
    eventDate: banner.event_actual_date
      ? new Date(banner.event_actual_date).toLocaleDateString("cs-CZ")
      : "",
  });

  async function downloadBanner() {
    const logoSrc = await getLogoBase64();
    const svgData = generateTicketSVG({
      eventName: banner.event_name,
      quantity: banner.quantity,
      quantity_sold: banner.quantity_sold,
      buyPrice: banner.buy_price * banner.quantity,
      sellPrice: banner.sell_price,
      profit: banner.profit,
      roi: banner.roi,
      currency: banner.currency,
      city: banner.city ?? "",
      eventDate: banner.event_actual_date
        ? new Date(banner.event_actual_date).toLocaleDateString("cs-CZ")
        : "",
    }, logoSrc);
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
    const logoSrc = await getLogoBase64();
    const svgData = generateTicketSVG({
      eventName: banner.event_name,
      quantity: banner.quantity,
      quantity_sold: banner.quantity_sold,
      buyPrice: banner.buy_price * banner.quantity,
      sellPrice: banner.sell_price,
      profit: banner.profit,
      roi: banner.roi,
      currency: banner.currency,
      city: banner.city ?? "",
      eventDate: banner.event_actual_date
        ? new Date(banner.event_actual_date).toLocaleDateString("cs-CZ")
        : "",
    }, logoSrc);
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
        <span style={{ fontSize: 12, color: "#ededed"  }}>
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
        <p style={{ fontSize: 13, color: "#ededed"  }}>{banners.length} {banners.length === 1 ? "banner" : banners.length < 5 ? "bannery" : "bannerů"}</p>
      </div>

      {loading && <div style={{ color: "#ededed" , fontSize: 14 }}>Načítání...</div>}

      {!loading && banners.length === 0 && (
        <div style={{ background: "#111111", border: "1px dashed #2a2a2a", borderRadius: 16, padding: "4rem", textAlign: "center" }}>
          <div style={{ fontSize: "2.5rem", marginBottom: "1rem" }}>🖼️</div>
          <p style={{ color: "#ededed" , fontSize: 14 }}>Zatím žádné bannery. Zaznamenejte prodej a banner se automaticky uloží.</p>
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
