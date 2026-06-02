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

function BannerCard({ banner }: { banner: Banner }) {
  const isProfit = banner.profit >= 0;
  const { format } = useCurrency();
  const cardRef = useRef<HTMLDivElement>(null);

  async function handleShare() {
    if (!cardRef.current) return;
    try {
      const { default: html2canvas } = await import("html2canvas");
      const canvas = await html2canvas(cardRef.current, { backgroundColor: "#080808", scale: 2 });
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
      {/* Mini banner preview */}
      <div ref={cardRef} style={{
        background: "linear-gradient(145deg, #0f0f0f, #080808)",
        padding: "1.25rem 1.5rem",
        position: "relative",
        overflow: "hidden",
        borderBottom: "1px solid #1a1a1a",
      }}>
        <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 1, background: "linear-gradient(90deg, transparent, rgba(192,192,192,0.6), transparent)" }} />
        <div style={{ position: "absolute", top: -30, right: -30, width: 80, height: 80, borderRadius: "50%", background: `radial-gradient(circle, ${isProfit ? "rgba(52,211,153,0.1)" : "rgba(248,113,113,0.1)"} 0%, transparent 70%)` }} />

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
          <div>
            <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: "0.12em", color: "#3a3a3a", marginBottom: 6 }}>TICKETCLUB · FLIP</div>
            <div style={{ fontSize: 15, fontWeight: 700, color: "#fff", marginBottom: 4 }}>{banner.event_name}</div>
            {banner.platform && <div style={{ fontSize: 11, color: "#525252" }}>{banner.platform}</div>}
          </div>
          <div style={{ textAlign: "right" }}>
            <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: "0.08em", color: isProfit ? "rgba(52,211,153,0.6)" : "rgba(248,113,113,0.6)", marginBottom: 4 }}>ZISK</div>
            <div style={{ fontSize: 20, fontWeight: 800, color: isProfit ? "#34d399" : "#f87171" }}>
              {isProfit ? "+" : ""}{format(banner.profit, banner.currency as "EUR" | "CZK")}
            </div>
            <div style={{ fontSize: 12, fontWeight: 600, color: isProfit ? "rgba(52,211,153,0.7)" : "rgba(248,113,113,0.7)" }}>
              ROI {isProfit ? "+" : ""}{banner.roi.toFixed(1)}%
            </div>
          </div>
        </div>

        <div style={{ display: "flex", gap: 8, marginTop: "1rem" }}>
          {[
            { label: "Koupeno", value: `${banner.quantity}×` },
            { label: "Nákup/ks", value: format(banner.buy_price, banner.currency as "EUR" | "CZK") },
            { label: "Prodej/ks", value: format(banner.sell_price, banner.currency as "EUR" | "CZK") },
          ].map(s => (
            <div key={s.label} style={{ flex: 1, background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 8, padding: "6px 8px", textAlign: "center" }}>
              <div style={{ fontSize: 9, color: "#3a3a3a", marginBottom: 3 }}>{s.label}</div>
              <div style={{ fontSize: 11, fontWeight: 600, color: "#c0c0c0" }}>{s.value}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Footer */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "0.75rem 1.25rem" }}>
        <span style={{ fontSize: 12, color: "#3a3a3a" }}>
          {new Date(banner.created_at).toLocaleDateString("cs-CZ")}
        </span>
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
  );
}

export default function BanneryTab() {
  const [banners, setBanners] = useState<Banner[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const supabase = createClient();
    supabase.from("banners").select("*").order("created_at", { ascending: false })
      .then(({ data }) => { setBanners(data ?? []); setLoading(false); });
  }, []);

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
