"use client";
import { useState, useRef } from "react";
import html2canvas from "html2canvas";

const PERIODS = [
  { id: "day", label: "Den" },
  { id: "week", label: "Týden" },
  { id: "month", label: "Měsíc" },
  { id: "quarter", label: "Čtvrtletí" },
  { id: "half", label: "Půl roku" },
  { id: "custom", label: "Vlastní" },
];

export default function TymStatistikyTab() {
  const [profit, setProfit] = useState("");
  const [invested, setInvested] = useState("");
  const [purchases, setPurchases] = useState("");
  const [period, setPeriod] = useState("month");
  const [customFrom, setCustomFrom] = useState("");
  const [customTo, setCustomTo] = useState("");
  const [currency, setCurrency] = useState("EUR");
  const [showBanner, setShowBanner] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const bannerRef = useRef<HTMLDivElement>(null);

  const profitNum = parseFloat(profit.replace(",", ".")) || 0;
  const investedNum = parseFloat(invested.replace(",", ".")) || 0;
  const purchasesNum = parseInt(purchases) || 0;
  const roi = investedNum > 0 ? (profitNum / investedNum) * 100 : 0;
  const isProfit = profitNum >= 0;

  const periodLabel = period === "custom"
    ? `${customFrom} — ${customTo}`
    : PERIODS.find(p => p.id === period)?.label ?? "";

  const inputStyle = {
    width: "100%", padding: "0.875rem 1rem",
    background: "#0a0a0a", border: "1px solid #1f1f1f",
    borderRadius: 12, color: "#fff", fontSize: 16,
    fontWeight: 600, outline: "none",
    boxSizing: "border-box" as const,
    transition: "border-color 0.2s",
  };

  const labelStyle = {
    fontSize: 11, fontWeight: 700 as const,
    letterSpacing: "0.1em", color: "#525252",
    display: "block" as const, marginBottom: "0.5rem",
  };

  async function handleDownload() {
    if (!bannerRef.current) return;
    setDownloading(true);
    try {
      const canvas = await html2canvas(bannerRef.current, {
        backgroundColor: "#0d0d0d", scale: 2,
        useCORS: true, logging: false,
        width: bannerRef.current.scrollWidth,
        height: bannerRef.current.scrollHeight,
      });
      canvas.toBlob((blob) => {
        if (!blob) return;
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `ticketclub-tym-${period}.png`;
        a.click();
        URL.revokeObjectURL(url);
      });
    } catch (e) { console.error(e); }
    setDownloading(false);
  }

  async function handleShare() {
    if (!bannerRef.current) return;
    try {
      const canvas = await html2canvas(bannerRef.current, {
        backgroundColor: "#0d0d0d", scale: 2, useCORS: true,
        width: bannerRef.current.scrollWidth,
        height: bannerRef.current.scrollHeight,
      });
      canvas.toBlob(async (blob) => {
        if (!blob) return;
        const file = new File([blob], "ticketclub-tym.png", { type: "image/png" });
        if (navigator.share && navigator.canShare({ files: [file] })) {
          await navigator.share({ files: [file], title: "TicketClub Tým" });
        } else {
          const url = URL.createObjectURL(blob);
          window.open(url, "_blank");
        }
      });
    } catch (e) { console.error(e); }
  }

  return (
    <div>
      {/* Header */}
      <div style={{ marginBottom: "2rem" }}>
        <div style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "4px 12px", background: "rgba(139,92,246,0.1)", border: "1px solid rgba(139,92,246,0.3)", borderRadius: 100, marginBottom: "0.75rem" }}>
          <div style={{ width: 6, height: 6, borderRadius: "50%", background: "#a78bfa" }} />
          <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.1em", color: "#a78bfa" }}>ADMIN ONLY</span>
        </div>
        <h1 style={{ fontSize: "1.5rem", fontWeight: 800, color: "#fff", marginBottom: "0.25rem", letterSpacing: "-0.02em" }}>Štatistiky týmu</h1>
        <p style={{ fontSize: 13, color: "#3a3a3a" }}>Manuálny generátor P&L banneru pre tým</p>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: "1.5rem" }}>

        {/* LEFT — Inputs */}
        <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>

          {/* Period selector */}
          <div style={{ background: "#111111", border: "1px solid #1a1a1a", borderRadius: 16, padding: "1.25rem", position: "relative", overflow: "hidden" }}>
            <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 1, background: "linear-gradient(90deg, transparent, rgba(139,92,246,0.5), transparent)" }} />
            <label style={labelStyle}>OBDOBIE</label>
            <div style={{ display: "flex", flexWrap: "wrap" as const, gap: "0.5rem" }}>
              {PERIODS.map(p => (
                <button key={p.id} onClick={() => setPeriod(p.id)} style={{
                  padding: "6px 14px", fontSize: 12, fontWeight: 600,
                  background: period === p.id ? "linear-gradient(135deg, #7c3aed, #5b21b6)" : "transparent",
                  border: period === p.id ? "none" : "1px solid #2a2a2a",
                  borderRadius: 8,
                  color: period === p.id ? "#fff" : "#525252",
                  cursor: "pointer",
                }}>{p.label}</button>
              ))}
            </div>
            {period === "custom" && (
              <div style={{ display: "flex", gap: "0.75rem", marginTop: "0.75rem", alignItems: "center" }}>
                <input type="date" value={customFrom} onChange={e => setCustomFrom(e.target.value)}
                  style={{ ...inputStyle, fontSize: 13, padding: "0.5rem 0.75rem", colorScheme: "dark" }} />
                <span style={{ color: "#525252" }}>—</span>
                <input type="date" value={customTo} onChange={e => setCustomTo(e.target.value)}
                  style={{ ...inputStyle, fontSize: 13, padding: "0.5rem 0.75rem", colorScheme: "dark" }} />
              </div>
            )}
          </div>

          {/* Stats inputs */}
          <div style={{ background: "#111111", border: "1px solid #1a1a1a", borderRadius: 16, padding: "1.25rem", display: "flex", flexDirection: "column", gap: "1rem" }}>

            {/* Currency */}
            <div>
              <label style={labelStyle}>MĚNA</label>
              <div style={{ display: "flex", gap: "0.5rem" }}>
                {(["EUR", "CZK"] as const).map(c => (
                  <button key={c} onClick={() => setCurrency(c)} style={{
                    padding: "6px 16px", fontSize: 13, fontWeight: 700,
                    background: currency === c ? "linear-gradient(135deg, #ffffff, #a0a0a0)" : "transparent",
                    border: currency === c ? "none" : "1px solid #2a2a2a",
                    borderRadius: 8,
                    color: currency === c ? "#000" : "#525252",
                    cursor: "pointer",
                  }}>{c}</button>
                ))}
              </div>
            </div>

            <div>
              <label style={labelStyle}>CELKOVÝ ZISK</label>
              <div style={{ position: "relative" }}>
                <input type="text" value={profit} onChange={e => setProfit(e.target.value)}
                  placeholder="0" style={inputStyle}
                  onFocus={e => (e.target as HTMLInputElement).style.borderColor = "#7c3aed"}
                  onBlur={e => (e.target as HTMLInputElement).style.borderColor = "#1f1f1f"} />
                <span style={{ position: "absolute", right: 14, top: "50%", transform: "translateY(-50%)", fontSize: 13, color: "#525252", fontWeight: 700 }}>{currency}</span>
              </div>
            </div>

            <div>
              <label style={labelStyle}>CELKOVO INVESTOVÁNO</label>
              <div style={{ position: "relative" }}>
                <input type="text" value={invested} onChange={e => setInvested(e.target.value)}
                  placeholder="0" style={inputStyle}
                  onFocus={e => (e.target as HTMLInputElement).style.borderColor = "#7c3aed"}
                  onBlur={e => (e.target as HTMLInputElement).style.borderColor = "#1f1f1f"} />
                <span style={{ position: "absolute", right: 14, top: "50%", transform: "translateY(-50%)", fontSize: 13, color: "#525252", fontWeight: 700 }}>{currency}</span>
              </div>
            </div>

            <div>
              <label style={labelStyle}>POČET NÁKUPŮ</label>
              <input type="number" value={purchases} onChange={e => setPurchases(e.target.value)}
                placeholder="0" style={inputStyle} min={0}
                onFocus={e => (e.target as HTMLInputElement).style.borderColor = "#7c3aed"}
                onBlur={e => (e.target as HTMLInputElement).style.borderColor = "#1f1f1f"} />
            </div>

            {/* Live ROI preview */}
            {investedNum > 0 && (
              <div style={{ padding: "0.875rem 1rem", background: isProfit ? "rgba(52,211,153,0.06)" : "rgba(248,113,113,0.06)", border: `1px solid ${isProfit ? "rgba(52,211,153,0.2)" : "rgba(248,113,113,0.2)"}`, borderRadius: 10, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ fontSize: 12, color: "#525252" }}>ROI</span>
                <span style={{ fontSize: 20, fontWeight: 800, color: isProfit ? "#34d399" : "#f87171" }}>
                  {isProfit ? "+" : ""}{roi.toFixed(1)}%
                </span>
              </div>
            )}
          </div>

          <button
            onClick={() => setShowBanner(true)}
            style={{
              width: "100%", padding: "0.875rem",
              background: "linear-gradient(135deg, #7c3aed, #5b21b6)",
              border: "none", borderRadius: 12,
              color: "#fff", fontWeight: 800, fontSize: 14,
              letterSpacing: "0.06em", cursor: "pointer",
            }}
          >
            🎯 VYGENEROVAŤ BANNER
          </button>
        </div>

        {/* RIGHT — Live banner preview */}
        <div>
          <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.1em", color: "#3a3a3a", marginBottom: "0.75rem" }}>LIVE NÁHLED BANNERU</div>

          {/* Banner */}
          <div ref={bannerRef} style={{ 
            background: "linear-gradient(145deg, #0f0d08, #0a0800, #0f0d08)", 
            border: "1px solid rgba(212,175,55,0.25)", 
            borderRadius: 20, padding: "2rem 2.25rem", 
            position: "relative", overflow: "hidden", 
            minWidth: "100%", 
          }}> 
            {/* Gold top line */} 
            <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 1, background: "linear-gradient(90deg, transparent, #D4AF37, #FFD700, #D4AF37, transparent)" }} /> 
            {/* Gold glow */} 
            <div style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0, background: "radial-gradient(ellipse at top center, rgba(212,175,55,0.06) 0%, transparent 60%)", pointerEvents: "none" }} /> 
            {/* Corner decoration */} 
            <div style={{ position: "absolute", top: 16, right: 16, width: 60, height: 60, borderRadius: "50%", background: "radial-gradient(circle, rgba(212,175,55,0.08) 0%, transparent 70%)", pointerEvents: "none" }} />

            {/* Header */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem" }}> 
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}> 
                <img src="/logo.png" alt="TicketClub" style={{ height: 24, width: "auto" }} onError={e => (e.currentTarget.style.display = "none")} /> 
                <div> 
                  <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: "0.15em", color: "#D4AF37" }}>TÍMOVÉ ŠTATISTIKY</div> 
                  <div style={{ fontSize: 11, fontWeight: 700, color: "rgba(212,175,55,0.7)", letterSpacing: "0.08em" }}> 
                    {period === "custom" && customFrom && customTo 
                      ? `${new Date(customFrom).toLocaleDateString("cs-CZ")} — ${new Date(customTo).toLocaleDateString("cs-CZ")}` 
                      : periodLabel.toUpperCase()} 
                  </div> 
                </div> 
              </div> 
              <div style={{ padding: "4px 12px", background: "rgba(212,175,55,0.08)", border: "1px solid rgba(212,175,55,0.2)", borderRadius: 100 }}> 
                <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.1em", color: "#D4AF37" }}>PREMIUM</span> 
              </div> 
            </div>

            {/* Main profit */}
            <div style={{ marginBottom: "1.75rem" }}> 
              <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.12em", color: isProfit ? "rgba(52,211,153,0.6)" : "rgba(248,113,113,0.6)", marginBottom: 8 }}> 
                {isProfit ? "✓ ZISKOVÉ OBDOBIE" : "✗ STRATOVÉ OBDOBIE"} 
              </div> 
              <div style={{ 
                fontSize: 52, fontWeight: 900, 
                background: isProfit 
                  ? "linear-gradient(135deg, #34d399, #10b981)" 
                  : "linear-gradient(135deg, #f87171, #dc2626)", 
                WebkitBackgroundClip: "text", 
                WebkitTextFillColor: "transparent", 
                backgroundClip: "text", 
                letterSpacing: "-0.03em", lineHeight: 1, 
              }}> 
                {isProfit ? "+" : ""}{profitNum.toLocaleString("cs-CZ")} 
                <span style={{ fontSize: 24, marginLeft: 8 }}>{currency}</span> 
              </div> 
            </div>

            {/* Period badge */} 
            <div style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "4px 12px", background: "rgba(212,175,55,0.08)", border: "1px solid rgba(212,175,55,0.2)", borderRadius: 100, marginBottom: "1.75rem" }}> 
              <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.1em", color: "#D4AF37" }}> 
                📅 {period === "custom" && customFrom && customTo 
                  ? `${new Date(customFrom).toLocaleDateString("cs-CZ")} — ${new Date(customTo).toLocaleDateString("cs-CZ")}` 
                  : periodLabel.toUpperCase()} 
              </span> 
            </div>

            {/* Stats row */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "0.75rem", marginBottom: "1.5rem" }}> 
              {[ 
                { label: "ROI", value: `${isProfit ? "+" : ""}${roi.toFixed(1)}%`, color: isProfit ? "#34d399" : "#f87171" }, 
                { label: "INVESTOVÁNO", value: `${investedNum.toLocaleString("cs-CZ")} ${currency}`, color: "#e8e8e8" }, 
                { label: "NÁKUPŮ", value: String(purchasesNum), color: "#D4AF37" }, 
              ].map(stat => ( 
                <div key={stat.label} style={{ 
                  background: "rgba(212,175,55,0.04)", 
                  border: "1px solid rgba(212,175,55,0.12)", 
                  borderRadius: 12, padding: "0.875rem", 
                }}> 
                  <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: "0.12em", color: "rgba(212,175,55,0.5)", marginBottom: 6 }}>{stat.label}</div> 
                  <div style={{ fontSize: 15, fontWeight: 800, color: stat.color }}>{stat.value}</div> 
                </div> 
              ))} 
            </div>

            {/* Footer */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", paddingTop: "1rem", borderTop: "1px solid rgba(212,175,55,0.1)" }}> 
              <span style={{ fontSize: 11, color: "rgba(212,175,55,0.4)", letterSpacing: "0.05em" }}>ticketclub.vip</span> 
              <div style={{ display: "flex", gap: 4 }}> 
                {[...Array(3)].map((_, i) => ( 
                  <div key={i} style={{ width: 4, height: 4, borderRadius: "50%", background: "#D4AF37", opacity: 1 - i * 0.35 }} /> 
                ))} 
              </div> 
            </div>
          </div>

          <p style={{ fontSize: 11, color: "#3a3a3a", marginTop: 8, textAlign: "center" as const }}>
            Banner sa aktualizuje naživo pri zmene hodnôt
          </p>
        </div>
      </div>

      {/* Banner modal */}
      {showBanner && (
        <>
          <div onClick={() => setShowBanner(false)} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.85)", zIndex: 100, backdropFilter: "blur(8px)" }} />
          <div style={{
            position: "fixed", top: "50%", left: "50%",
            transform: "translate(-50%, -50%)",
            width: "100%", maxWidth: 480,
            background: "#111111", border: "1px solid #2a2a2a",
            borderRadius: 24, padding: "2rem", zIndex: 101,
            overflow: "hidden",
          }}>
            <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 1, background: "linear-gradient(90deg, transparent, #7c3aed, transparent)" }} />

            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem" }}>
              <h2 style={{ fontSize: "1.1rem", fontWeight: 700, color: "#fff", margin: 0 }}>Tímový banner</h2>
              <button onClick={() => setShowBanner(false)} style={{ background: "none", border: "none", color: "#525252", cursor: "pointer", fontSize: 22 }}>×</button>
            </div>

            {/* Banner preview in modal */}
            <div style={{ 
              background: "linear-gradient(145deg, #0f0d08, #0a0800, #0f0d08)", 
              border: "1px solid rgba(212,175,55,0.25)", 
              borderRadius: 20, padding: "2rem 2.25rem", 
              position: "relative", overflow: "hidden", 
              marginBottom: "1.5rem"
            }}> 
              {/* Gold top line */} 
              <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 1, background: "linear-gradient(90deg, transparent, #D4AF37, #FFD700, #D4AF37, transparent)" }} /> 
              {/* Gold glow */} 
              <div style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0, background: "radial-gradient(ellipse at top center, rgba(212,175,55,0.06) 0%, transparent 60%)", pointerEvents: "none" }} /> 
              {/* Corner decoration */} 
              <div style={{ position: "absolute", top: 16, right: 16, width: 60, height: 60, borderRadius: "50%", background: "radial-gradient(circle, rgba(212,175,55,0.08) 0%, transparent 70%)", pointerEvents: "none" }} />

              {/* Header */}
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem" }}> 
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}> 
                  <img src="/logo.png" alt="TicketClub" style={{ height: 24, width: "auto" }} onError={e => (e.currentTarget.style.display = "none")} /> 
                  <div> 
                    <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: "0.15em", color: "#D4AF37" }}>TÍMOVÉ ŠTATISTIKY</div> 
                    <div style={{ fontSize: 11, fontWeight: 700, color: "rgba(212,175,55,0.7)", letterSpacing: "0.08em" }}> 
                      {period === "custom" && customFrom && customTo 
                        ? `${new Date(customFrom).toLocaleDateString("cs-CZ")} — ${new Date(customTo).toLocaleDateString("cs-CZ")}` 
                        : periodLabel.toUpperCase()} 
                    </div> 
                  </div> 
                </div> 
                <div style={{ padding: "4px 12px", background: "rgba(212,175,55,0.08)", border: "1px solid rgba(212,175,55,0.2)", borderRadius: 100 }}> 
                  <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.1em", color: "#D4AF37" }}>PREMIUM</span> 
                </div> 
              </div>

              {/* Main profit */}
              <div style={{ marginBottom: "1.75rem" }}> 
                <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.12em", color: isProfit ? "rgba(52,211,153,0.6)" : "rgba(248,113,113,0.6)", marginBottom: 8 }}> 
                  {isProfit ? "✓ ZISKOVÉ OBDOBIE" : "✗ STRATOVÉ OBDOBIE"} 
                </div> 
                <div style={{ 
                  fontSize: 52, fontWeight: 900, 
                  background: isProfit 
                    ? "linear-gradient(135deg, #34d399, #10b981)" 
                    : "linear-gradient(135deg, #f87171, #dc2626)", 
                  WebkitBackgroundClip: "text", 
                  WebkitTextFillColor: "transparent", 
                  backgroundClip: "text", 
                  letterSpacing: "-0.03em", lineHeight: 1, 
                }}> 
                  {isProfit ? "+" : ""}{profitNum.toLocaleString("cs-CZ")} 
                  <span style={{ fontSize: 24, marginLeft: 8 }}>{currency}</span> 
                </div> 
              </div>

              {/* Period badge */} 
              <div style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "4px 12px", background: "rgba(212,175,55,0.08)", border: "1px solid rgba(212,175,55,0.2)", borderRadius: 100, marginBottom: "1.75rem" }}> 
                <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.1em", color: "#D4AF37" }}> 
                  📅 {period === "custom" && customFrom && customTo 
                    ? `${new Date(customFrom).toLocaleDateString("cs-CZ")} — ${new Date(customTo).toLocaleDateString("cs-CZ")}` 
                    : periodLabel.toUpperCase()} 
                </span> 
              </div>

              {/* Stats row */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "0.75rem", marginBottom: "1.5rem" }}> 
                {[ 
                  { label: "ROI", value: `${isProfit ? "+" : ""}${roi.toFixed(1)}%`, color: isProfit ? "#34d399" : "#f87171" }, 
                  { label: "INVESTOVÁNO", value: `${investedNum.toLocaleString("cs-CZ")} ${currency}`, color: "#e8e8e8" }, 
                  { label: "NÁKUPŮ", value: String(purchasesNum), color: "#D4AF37" }, 
                ].map(stat => ( 
                  <div key={stat.label} style={{ 
                    background: "rgba(212,175,55,0.04)", 
                    border: "1px solid rgba(212,175,55,0.12)", 
                    borderRadius: 12, padding: "0.875rem", 
                  }}> 
                    <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: "0.12em", color: "rgba(212,175,55,0.5)", marginBottom: 6 }}>{stat.label}</div> 
                    <div style={{ fontSize: 15, fontWeight: 800, color: stat.color }}>{stat.value}</div> 
                  </div> 
                ))} 
              </div>

              {/* Footer */}
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", paddingTop: "1rem", borderTop: "1px solid rgba(212,175,55,0.1)" }}> 
                <span style={{ fontSize: 11, color: "rgba(212,175,55,0.4)", letterSpacing: "0.05em" }}>ticketclub.vip</span> 
                <div style={{ display: "flex", gap: 4 }}> 
                  {[...Array(3)].map((_, i) => ( 
                    <div key={i} style={{ width: 4, height: 4, borderRadius: "50%", background: "#D4AF37", opacity: 1 - i * 0.35 }} /> 
                  ))} 
                </div> 
              </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem" }}>
              <button
                onClick={handleDownload}
                disabled={downloading}
                style={{
                  padding: "0.875rem", fontSize: 13, fontWeight: 700,
                  background: "transparent", border: "1px solid #2a2a2a",
                  borderRadius: 12, color: "#ffffff", cursor: "pointer",
                  letterSpacing: "0.05em",
                }}
              >
                {downloading ? "⏳ Sťahujem..." : "⬇ Stáhnout"}
              </button>
              <button
                onClick={handleShare}
                style={{
                  padding: "0.875rem", fontSize: 13, fontWeight: 700,
                  background: "linear-gradient(135deg, #7c3aed, #5b21b6)",
                  border: "none", borderRadius: 12,
                  color: "#fff", cursor: "pointer",
                  letterSpacing: "0.05em",
                }}
              >
                ↗ Zdieľať
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}