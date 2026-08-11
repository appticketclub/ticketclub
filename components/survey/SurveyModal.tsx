"use client";
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

const EMOJIS = ["😡", "😕", "😐", "🙂", "😍"];

export default function SurveyModal({ onClose }: { onClose: () => void }) {
  const [rating, setRating] = useState<number | null>(null);
  const [liked, setLiked] = useState("");
  const [disliked, setDisliked] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [hoveredRating, setHoveredRating] = useState<number | null>(null);

  async function handleSubmit() {
    if (!rating) return;
    setSubmitting(true);
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    await supabase.from("feedback").insert({
      user_id: user.id,
      rating,
      liked: liked.trim() || null,
      disliked: disliked.trim() || null,
    });

    await supabase.from("profiles")
      .update({ survey_completed: true })
      .eq("id", user.id);

    setSubmitting(false);
    onClose();
  }

  return (
    <>
      {/* Backdrop */}
      <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.85)", zIndex: 1000, backdropFilter: "blur(4px)" }} />
      
      {/* Modal */}
      <div style={{
        position: "fixed", top: "50%", left: "50%",
        transform: "translate(-50%, -50%)",
        width: "90%", maxWidth: 480,
        background: "#111111",
        border: "1px solid #2a2a2a",
        borderRadius: 20,
        padding: "2rem",
        zIndex: 1001,
        overflow: "hidden",
      }}>
        {/* Top accent */}
        <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 2, background: "linear-gradient(90deg, #4ade80, #22c55e)" }} />

        <h2 style={{ fontSize: "1.25rem", fontWeight: 800, color: "#fff", marginBottom: "0.5rem", textAlign: "center" as const }}>
          Jak hodnotíte TicketClub? 🎟️
        </h2>
        <p style={{ fontSize: 13, color: "#525252", textAlign: "center" as const, marginBottom: "1.5rem" }}>
          Váš názor nám pomáhá zlepšovat aplikaci. Zabere to jen 30 sekund.
        </p>

        {/* Emoji rating */}
        <div style={{ display: "flex", justifyContent: "center", gap: "1rem", marginBottom: "1.5rem" }}>
          {EMOJIS.map((emoji, i) => {
            const val = i + 1;
            const isSelected = rating === val;
            const isHovered = hoveredRating === val;
            return (
              <button
                key={val}
                onClick={() => setRating(val)}
                onMouseEnter={() => setHoveredRating(val)}
                onMouseLeave={() => setHoveredRating(null)}
                style={{
                  fontSize: isSelected || isHovered ? 44 : 36,
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  transition: "font-size 0.15s",
                  filter: isSelected ? "none" : "grayscale(30%)",
                  opacity: rating && !isSelected ? 0.5 : 1,
                }}
              >
                {emoji}
              </button>
            );
          })}
        </div>

        {rating && (
          <div style={{ fontSize: 13, color: "#4ade80", textAlign: "center" as const, marginBottom: "1rem" }}>
            {["Velmi špatné", "Špatné", "Průměrné", "Dobré", "Výborné!"][rating - 1]}
          </div>
        )}

        {/* Liked */}
        <div style={{ marginBottom: "1rem" }}>
          <label style={{ fontSize: 11, color: "#ededed", letterSpacing: "0.08em", display: "block", marginBottom: 6 }}>
            CO SE VÁM LÍBÍ? (volitelné)
          </label>
          <textarea
            value={liked}
            onChange={e => setLiked(e.target.value)}
            placeholder="Napište co oceňujete..."
            rows={2}
            style={{ width: "100%", padding: "0.75rem", background: "#1a1a1a", border: "1px solid #2a2a2a", borderRadius: 10, color: "#fff", fontSize: 13, resize: "none" as const, outline: "none", boxSizing: "border-box" as const }}
          />
        </div>

        {/* Disliked */}
        <div style={{ marginBottom: "1.5rem" }}>
          <label style={{ fontSize: 11, color: "#ededed", letterSpacing: "0.08em", display: "block", marginBottom: 6 }}>
            CO BY SE DÁ ZLEPŠIT? (volitelné)
          </label>
          <textarea
            value={disliked}
            onChange={e => setDisliked(e.target.value)}
            placeholder="Napište co vám chybí nebo vadí..."
            rows={2}
            style={{ width: "100%", padding: "0.75rem", background: "#1a1a1a", border: "1px solid #2a2a2a", borderRadius: 10, color: "#fff", fontSize: 13, resize: "none" as const, outline: "none", boxSizing: "border-box" as const }}
          />
        </div>

        {/* Submit */}
        <button
          onClick={handleSubmit}
          disabled={!rating || submitting}
          style={{
            width: "100%", padding: "0.85rem",
            background: rating ? "linear-gradient(135deg, #4ade80, #22c55e)" : "#1a1a1a",
            border: "none", borderRadius: 12,
            color: rating ? "#000" : "#525252",
            fontWeight: 800, fontSize: 14,
            cursor: rating ? "pointer" : "default",
            transition: "all 0.2s",
          }}
        >
          {submitting ? "Odesílám..." : "Odeslat hodnocení →"}
        </button>

        <p style={{ fontSize: 11, color: "#525252", textAlign: "center" as const, marginTop: "1rem" }}>
          Odpovědi jsou anonymní a slouží pouze ke zlepšení aplikace.
        </p>
      </div>
    </>
  );
}
