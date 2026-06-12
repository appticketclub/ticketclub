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
      
      // Temporarily make card full height for capture
      const el = cardRef.current;
      const originalOverflow = el.style.overflow;
      const originalHeight = el.style.height;
      const originalMaxHeight = el.style.maxHeight;
      el.style.overflow = "visible";
      el.style.height = "auto";
      el.style.maxHeight = "none";
      
      // Small delay to let browser reflow
      await new Promise(resolve => setTimeout(resolve, 100));
      
      const canvas = await html2canvas(el, { 
        backgroundColor: "#0d0d0d", 
        scale: 2, 
        useCORS: true, 
        allowTaint: true, 
        logging: false, 
        width: el.scrollWidth, 
        height: el.scrollHeight, 
        windowWidth: el.scrollWidth, 
        windowHeight: el.scrollHeight, 
      });
      
      // Restore original styles
      el.style.overflow = originalOverflow;
      el.style.height = originalHeight;
      el.style.maxHeight = originalMaxHeight;

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
        background: "linear-gradient(145deg, #0f0f0f 0%, #080808 100%)",
        padding: "2rem",
        position: "relative",
        overflow: "hidden",
        boxShadow: `0 0 0 1px rgba(192,192,192,0.15), 0 0 40px rgba(192,192,192,0.06), 0 0 80px rgba(192,192,192,0.03)`,
      }}>
        {/* Animated corner glows */}
        <div style={{ position: "absolute", top: -40, left: -40, width: 120, height: 120, borderRadius: "50%", background: "radial-gradient(circle, rgba(192,192,192,0.08) 0%, transparent 70%)" }} />
        <div style={{ position: "absolute", bottom: -40, right: -40, width: 120, height: 120, borderRadius: "50%", background: `radial-gradient(circle, ${isProfit ? "rgba(52,211,153,0.1)" : "rgba(248,113,113,0.1)"} 0%, transparent 70%)` }} />

        {/* Chrome borders */}
        <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 1, background: "linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.4) 30%, rgba(192,192,192,0.8) 50%, rgba(255,255,255,0.4) 70%, transparent 100%)" }} />
        <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: 1, background: "linear-gradient(90deg, transparent, rgba(192,192,192,0.2), transparent)" }} />
        <div style={{ position: "absolute", top: 0, left: 0, bottom: 0, width: 1, background: "linear-gradient(180deg, rgba(192,192,192,0.4), rgba(192,192,192,0.1), transparent)" }} />
        <div style={{ position: "absolute", top: 0, right: 0, bottom: 0, width: 1, background: "linear-gradient(180deg, rgba(192,192,192,0.4), rgba(192,192,192,0.1), transparent)" }} />

        {/* Brand */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.25rem" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <img src="/logo.png" alt="TicketClub" style={{ height: 22, width: "auto", objectFit: "contain" }} />
            <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.12em", color: "#3a3a3a" }}>UZAVŘENÝ FLIP</span>
          </div>
          <span style={{ fontSize: 12, color: "#3a3a3a" }}>{new Date(banner.created_at).toLocaleDateString("cs-CZ")}</span>
        </div>

        {/* Event */}
        <div style={{ marginBottom: "1.25rem" }}>
          <div style={{ fontSize: 20, fontWeight: 700, color: "#fff", marginBottom: 4, letterSpacing: "-0.01em" }}>{banner.event_name}</div>
          <div style={{ fontSize: 13, color: "#525252", marginBottom: "0.5rem" }}>
            {banner.quantity}× lístků{banner.platform && ` · ${banner.platform}`}
          </div>
        </div>

        {/* Divider */}
        <div style={{ height: 1, background: "linear-gradient(90deg, rgba(192,192,192,0.2), rgba(192,192,192,0.05), transparent)", marginBottom: "1.5rem" }} />

        {/* Stats */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10, marginBottom: "1.5rem" }}>
          {[
            { label: "KOUPENO", value: `${banner.quantity}×` },
            { label: "NÁKUP / KS", value: format(banner.buy_price, banner.currency as "EUR" | "CZK") },
            { label: "PRODEJ / KS", value: format(banner.sell_price, banner.currency as "EUR" | "CZK") },
          ].map(stat => (
            <div key={stat.label} style={{
              background: "rgba(255,255,255,0.03)",
              border: "1px solid rgba(255,255,255,0.07)",
              borderRadius: 10, padding: "10px 12px", textAlign: "center",
            }}>
              <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: "0.1em", color: "#3a3a3a", marginBottom: 6 }}>{stat.label}</div>
              <div style={{ fontSize: 13, fontWeight: 600, color: "#c0c0c0" }}>{stat.value}</div>
            </div>
          ))}
        </div>

        {/* Profit box */}
        <div style={{
          background: isProfit ? "linear-gradient(135deg, rgba(52,211,153,0.08), rgba(52,211,153,0.04))" : "linear-gradient(135deg, rgba(248,113,113,0.08), rgba(248,113,113,0.04))",
          border: `1px solid ${isProfit ? "rgba(52,211,153,0.2)" : "rgba(248,113,113,0.2)"}`,
          borderRadius: 14, padding: "1.25rem 1.5rem",
          display: "flex", justifyContent: "space-between", alignItems: "center",
          marginBottom: "1.25rem",
          position: "relative", overflow: "hidden",
        }}>
          <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 1, background: `linear-gradient(90deg, transparent, ${isProfit ? "rgba(52,211,153,0.4)" : "rgba(248,113,113,0.4)"}, transparent)` }} />
          <div>
            <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: "0.08em", color: isProfit ? "rgba(52,211,153,0.6)" : "rgba(248,113,113,0.6)", marginBottom: 6 }}>ČISTÝ ZISK</div>
            <div style={{ fontSize: 30, fontWeight: 800, color: isProfit ? "#34d399" : "#f87171", letterSpacing: "-0.02em" }}>
              {isProfit ? "+" : ""}{format(banner.profit, banner.currency as "EUR" | "CZK")}
            </div>
          </div>
          <div style={{
            padding: "8px 16px", borderRadius: 10,
            background: isProfit ? "rgba(52,211,153,0.12)" : "rgba(248,113,113,0.12)",
            border: `1px solid ${isProfit ? "rgba(52,211,153,0.25)" : "rgba(248,113,113,0.25)"}`,
          }}>
            <div style={{ fontSize: 10, fontWeight: 600, letterSpacing: "0.08em", color: isProfit ? "rgba(52,211,153,0.6)" : "rgba(248,113,113,0.6)", marginBottom: 3 }}>ROI</div>
            <div style={{ fontSize: 20, fontWeight: 800, color: isProfit ? "#34d399" : "#f87171" }}>
              {isProfit ? "+" : ""}{banner.roi.toFixed(1)}%
            </div>
          </div>
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
                
                // Temporarily make card full height for capture
                const el = cardRef.current;
                const originalOverflow = el.style.overflow;
                const originalHeight = el.style.height;
                const originalMaxHeight = el.style.maxHeight;
                el.style.overflow = "visible";
                el.style.height = "auto";
                el.style.maxHeight = "none";
                
                // Small delay to let browser reflow
                await new Promise(resolve => setTimeout(resolve, 100));
                
                const canvas = await html2canvas(el, { 
                  backgroundColor: "#0d0d0d", 
                  scale: 2, 
                  useCORS: true, 
                  allowTaint: true, 
                  logging: false, 
                  width: el.scrollWidth, 
                  height: el.scrollHeight, 
                  windowWidth: el.scrollWidth, 
                  windowHeight: el.scrollHeight, 
                });
                
                // Restore original styles
                el.style.overflow = originalOverflow;
                el.style.height = originalHeight;
                el.style.maxHeight = originalMaxHeight;
                
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
