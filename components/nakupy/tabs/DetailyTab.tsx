"use client";
import { useState } from "react";
import NakupyTab from "./NakupyTab";
import ProdejeTab from "./ProdejeTab";

const subtabs = [
  { id: "nakupy", label: "🛒 Nákupy" },
  { id: "prodeje", label: "💰 Prodeje" },
];

export default function DetailyTab() {
  const [active, setActive] = useState("nakupy");

  return (
    <div>
      {/* Subtab switcher */}
      <div style={{
        display: "flex", gap: "0.5rem",
        marginBottom: "1.75rem",
        background: "#0a0a0a",
        border: "1px solid #1a1a1a",
        borderRadius: 12, padding: "0.35rem",
        width: "fit-content",
      }}>
        {subtabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActive(tab.id)}
            style={{
              padding: "0.5rem 1.5rem",
              borderRadius: 9, border: "none",
              fontSize: 13,
              fontWeight: active === tab.id ? 700 : 400,
              background: active === tab.id
                ? "linear-gradient(135deg, #ffffff, #a0a0a0)"
                : "transparent",
              color: active === tab.id ? "#000" : "#525252",
              cursor: "pointer",
              transition: "all 0.15s",
              letterSpacing: active === tab.id ? "0.03em" : "0",
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Content */}
      {active === "nakupy" && <NakupyTab />}
      {active === "prodeje" && <ProdejeTab />}
    </div>
  );
}
