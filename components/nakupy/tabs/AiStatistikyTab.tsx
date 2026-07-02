"use client";
import { useState, useEffect } from "react";

type Insight = { type: "positive" | "negative" | "tip"; title: string; description: string };
type Analysis = {
  overall_score: number;
  overall_verdict: string;
  best_flip: { event: string; profit: number; roi: number; reason: string };
  worst_flip: { event: string; profit: number; roi: number; reason: string };
  insights: Insight[];
  platform_analysis: string;
  timing_analysis: string;
  recommendation: string;
};

export default function AiStatistikyTab() {
  const [analysis, setAnalysis] = useState<Analysis | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [cachedAt, setCachedAt] = useState<string | null>(null);

  useEffect(() => {
    // Load cached analysis on mount
    fetch("/api/ai/analyze-stats")
      .then(r => r.json())
      .then(data => {
        if (data.success && data.analysis) {
          setAnalysis(data.analysis);
          setCachedAt(data.cached_at);
        }
      });
  }, []);

  async function runAnalysis() {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/ai/analyze-stats", { method: "POST" });
      const data = await res.json();
      if (!data.success) throw new Error(data.error);
      setAnalysis(data.analysis);
      setCachedAt(new Date().toISOString());
    } catch (e: any) {
      setError(e.message);
    }
    setLoading(false);
  }

  const insightColors = {
    positive: { bg: "#0a2a1a", border: "rgba(52,211,153,0.25)", color: "#34d399", icon: "✓" },
    negative: { bg: "#2a0a0a", border: "rgba(248,113,113,0.25)", color: "#f87171", icon: "✗" },
    tip: { bg: "#0a1520", border: "rgba(139,92,246,0.25)", color: "#a78bfa", icon: "💡" },
  };

  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1.75rem" }}>
        <div>
          <h1 style={{ fontSize: "1.5rem", fontWeight: 700, color: "#fff", marginBottom: "0.25rem" }}>AI statistiky</h1>
          <p style={{ fontSize: 13, color: "#ededed"  }}>Analýza vašich nákupů a prodejů pomocí AI</p>
        </div>
        <button
          onClick={runAnalysis}
          disabled={loading}
          style={{
            padding: "0.7rem 1.5rem", fontSize: 13, fontWeight: 700,
            background: loading ? "#2a2a2a" : "linear-gradient(135deg, #7c3aed, #5b21b6)",
            border: "none", borderRadius: 10, color: "#fff",
            cursor: loading ? "default" : "pointer",
            display: "flex", alignItems: "center", gap: 8,
            letterSpacing: "0.05em",
          }}
        >
          {loading ? "⏳ Analyzuji..." : "🤖 Spustit analýzu"}
        </button>
      </div>

      {error && (
        <div style={{ padding: "1rem", background: "#2a0a0a", border: "1px solid #7f1d1d", borderRadius: 12, color: "#fca5a5", marginBottom: "1rem" }}>
          Chyba: {error}
        </div>
      )}

      {!analysis && !loading && (
        <div style={{ background: "#111111", border: "1px dashed #2a2a2a", borderRadius: 16, padding: "4rem", textAlign: "center" }}>
          <div style={{ fontSize: "3rem", marginBottom: "1rem" }}>🤖</div>
          <p style={{ color: "#ededed" , fontSize: 14, marginBottom: "1.5rem" }}>
            Klikněte na "Spustit analýzu" a AI prozkoumá všechny vaše nákupy a prodeje.
          </p>
          <p style={{ color: "#ededed" , fontSize: 12 }}>Analýza trvá ~10-15 sekund</p>
        </div>
      )}

      {loading && (
        <div style={{ background: "#111111", border: "1px solid #1a1a1a", borderRadius: 16, padding: "4rem", textAlign: "center" }}>
          <div style={{ fontSize: "2rem", marginBottom: "1rem", animation: "pulse 1.5s infinite" }}>🤖</div>
          <p style={{ color: "#a78bfa", fontSize: 14, marginBottom: "0.5rem" }}>AI analyzuje vaše data...</p>
          <p style={{ color: "#ededed" , fontSize: 12 }}>Kontroluji nákupy, prodeje, timing a platformy</p>
          <style>{`@keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.4} }`}</style>
        </div>
      )}

      {analysis && (
        <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>

          {/* Overall score */}
          <div style={{ background: "#111111", border: "1px solid #1a1a1a", borderRadius: 20, padding: "1.75rem", position: "relative", overflow: "hidden" }}>
            <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 1, background: "linear-gradient(90deg, transparent, #a78bfa, transparent)" }} />
            <div style={{ display: "flex", alignItems: "center", gap: "2rem" }}>
              <div style={{ textAlign: "center" }}>
                <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: "0.08em", color: "#ededed" , marginBottom: 8 }}>AI SKÓRE</div>
                <div style={{ fontSize: 48, fontWeight: 800, color: analysis.overall_score >= 7 ? "#34d399" : analysis.overall_score >= 5 ? "#fbbf24" : "#f87171", lineHeight: 1 }}>
                  {analysis.overall_score}
                </div>
                <div style={{ fontSize: 12, color: "#ededed"  }}>/ 10</div>
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: "0.08em", color: "#ededed" , marginBottom: 8 }}>CELKOVÉ HODNOCENÍ</div>
                <p style={{ fontSize: 15, color: "#e8e8e8", lineHeight: 1.6 }}>{analysis.overall_verdict}</p>
              </div>
            </div>
          </div>

          {/* Best & worst flip */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "1rem" }}>
            <div style={{ background: "#0a2a1a", border: "1px solid rgba(52,211,153,0.2)", borderRadius: 16, padding: "1.25rem 1.5rem", position: "relative", overflow: "hidden" }}>
              <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 1, background: "linear-gradient(90deg, transparent, #34d399, transparent)" }} />
              <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: "0.08em", color: "rgba(52,211,153,0.6)", marginBottom: 8 }}>🏆 NEJLEPŠÍ FLIP</div>
              <div style={{ fontSize: 16, fontWeight: 700, color: "#fff", marginBottom: 4 }}>{analysis.best_flip.event}</div>
              <div style={{ fontSize: 20, fontWeight: 800, color: "#34d399", marginBottom: 8 }}>+{analysis.best_flip.profit} · ROI {analysis.best_flip.roi}%</div>
              <p style={{ fontSize: 12, color: "rgba(52,211,153,0.6)" }}>{analysis.best_flip.reason}</p>
            </div>
            <div style={{ background: "#2a0a0a", border: "1px solid rgba(248,113,113,0.2)", borderRadius: 16, padding: "1.25rem 1.5rem", position: "relative", overflow: "hidden" }}>
              <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 1, background: "linear-gradient(90deg, transparent, #f87171, transparent)" }} />
              <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: "0.08em", color: "rgba(248,113,113,0.6)", marginBottom: 8 }}>📉 NEJHORŠÍ FLIP</div>
              <div style={{ fontSize: 16, fontWeight: 700, color: "#fff", marginBottom: 4 }}>{analysis.worst_flip.event}</div>
              <div style={{ fontSize: 20, fontWeight: 800, color: "#f87171", marginBottom: 8 }}>{analysis.worst_flip.profit} · ROI {analysis.worst_flip.roi}%</div>
              <p style={{ fontSize: 12, color: "rgba(248,113,113,0.6)" }}>{analysis.worst_flip.reason}</p>
            </div>
          </div>

          {/* Insights */}
          <div style={{ background: "#111111", border: "1px solid #1a1a1a", borderRadius: 16, padding: "1.5rem" }}>
            <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: "0.08em", color: "#ededed" , marginBottom: "1rem" }}>POZNATKY & DOPORUČENÍ</div>
            <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
              {analysis.insights.map((insight, i) => {
                const c = insightColors[insight.type];
                return (
                  <div key={i} style={{ background: c.bg, border: `1px solid ${c.border}`, borderRadius: 12, padding: "1rem 1.25rem", display: "flex", gap: 12 }}>
                    <div style={{ fontSize: 16, flexShrink: 0, marginTop: 1 }}>{c.icon}</div>
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 700, color: c.color, marginBottom: 4 }}>{insight.title}</div>
                      <div style={{ fontSize: 13, color: "#ffffff", lineHeight: 1.5 }}>{insight.description}</div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Timing & Platform */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "1rem" }}>
            <div style={{ background: "#111111", border: "1px solid #1a1a1a", borderRadius: 16, padding: "1.25rem 1.5rem" }}>
              <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: "0.08em", color: "#ededed" , marginBottom: 8 }}>⏱️ TIMING ANALÝZA</div>
              <p style={{ fontSize: 13, color: "#ffffff", lineHeight: 1.6 }}>{analysis.timing_analysis}</p>
            </div>
            <div style={{ background: "#111111", border: "1px solid #1a1a1a", borderRadius: 16, padding: "1.25rem 1.5rem" }}>
              <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: "0.08em", color: "#ededed" , marginBottom: 8 }}>🏪 PLATFORMA ANALÝZA</div>
              <p style={{ fontSize: 13, color: "#ffffff", lineHeight: 1.6 }}>{analysis.platform_analysis}</p>
            </div>
          </div>

          {/* Main recommendation */}
          <div style={{ background: "linear-gradient(135deg, #0f0a1f, #0a1020)", border: "1px solid rgba(139,92,246,0.3)", borderRadius: 16, padding: "1.5rem", position: "relative", overflow: "hidden" }}>
            <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 1, background: "linear-gradient(90deg, transparent, rgba(139,92,246,0.6), transparent)" }} />
            <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: "0.08em", color: "rgba(139,92,246,0.6)", marginBottom: 8 }}>🎯 HLAVNÍ DOPORUČENÍ NA PŘÍŠTÍCH 30 DNÍ</div>
            <p style={{ fontSize: 14, color: "#e8e8e8", lineHeight: 1.7 }}>{analysis.recommendation}</p>
          </div>

          {/* Refresh */}
          <button onClick={runAnalysis} style={{ padding: "0.6rem", background: "transparent", border: "1px solid #2a2a2a", borderRadius: 10, color: "#ededed" , cursor: "pointer", fontSize: 13 }}>
            🔄 Obnovit analýzu
          </button>
          {cachedAt && (
            <p style={{ fontSize: 11, color: "#ededed" , textAlign: "center", marginTop: 4 }}>
              Poslední analýza: {new Date(cachedAt).toLocaleString("cs-CZ")}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
