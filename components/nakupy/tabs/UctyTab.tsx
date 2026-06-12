"use client";
import { useState } from "react";
import NakupniUctyTab from "./NakupniUctyTab";
import UctyHeslaTab from "./UctyHeslaTab";

const subtabs = [
  { id: "nakupni", label: "Nákupní účty" },
  { id: "hesla", label: "Ostatní účty" },
];

export default function UctyTab() {
  const [active, setActive] = useState("nakupni");

  return (
    <div>
      {/* Subtab switcher */}
      <div style={{ display: "flex", gap: "0.5rem", marginBottom: "1.75rem", background: "#0a0a0a", border: "1px solid #1a1a1a", borderRadius: 12, padding: "0.35rem", width: "fit-content" }}>
        {subtabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActive(tab.id)}
            style={{
              padding: "0.5rem 1.25rem",
              borderRadius: 9,
              border: "none",
              fontSize: 13,
              fontWeight: active === tab.id ? 600 : 400,
              background: active === tab.id ? "linear-gradient(135deg, #ffffff, #a0a0a0)" : "transparent",
              color: active === tab.id ? "#000" : "#525252",
              cursor: "pointer",
              transition: "all 0.15s",
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Content */}
      {active === "nakupni" && <NakupniUctyTab />}
      {active === "hesla" && <UctyHeslaTab />}
    </div>
  );
}
