"use client";
import { useState } from "react";
import Sidebar from "@/components/nakupy/Sidebar";
import UvodTab from "@/components/nakupy/tabs/UvodTab";
import NakupniUctyTab from "@/components/nakupy/tabs/NakupniUctyTab";
import NakupyTab from "@/components/nakupy/tabs/NakupyTab";
import BanneryTab from "@/components/nakupy/tabs/BanneryTab";

function KalendarTab() {
  return (
    <div>
      <h1 style={{ fontSize: "1.5rem", fontWeight: 700, color: "#fff", marginBottom: "0.5rem" }}>Kalendář</h1>
      <p style={{ color: "#525252" }}>Přehled vašich eventů podle data — připravujeme...</p>
    </div>
  );
}

function AiStatistikyTab() {
  return (
    <div>
      <h1 style={{ fontSize: "1.5rem", fontWeight: 700, color: "#fff", marginBottom: "0.5rem" }}>AI statistiky</h1>
      <p style={{ color: "#525252" }}>AI analýza vašich zisků a doporučení — připravujeme...</p>
    </div>
  );
}

function KalkulackaTab() {
  return (
    <div>
      <h1 style={{ fontSize: "1.5rem", fontWeight: 700, color: "#fff", marginBottom: "0.5rem" }}>Kalkulačka profitů</h1>
      <p style={{ color: "#525252" }}>Výpočet break-even a minimální prodejní ceny — připravujeme...</p>
    </div>
  );
}

const tabs: Record<string, React.ReactNode> = {
  uvod: <UvodTab />,
  "nakupni-ucty": <NakupniUctyTab />,
  nakupy: <NakupyTab />,
  kalendar: <KalendarTab />,
  "ai-statistiky": <AiStatistikyTab />,
  kalkulacka: <KalkulackaTab />,
  bannery: <BanneryTab />,
};

export default function NakupyPage() {
  const [activeTab, setActiveTab] = useState("uvod");

  return (
    <div style={{ display: "flex", minHeight: "calc(100vh - 65px)" }}>
      <Sidebar activeTab={activeTab} onTabChange={setActiveTab} />
      <main style={{ flex: 1, padding: "2rem 2.5rem" }}>
        {tabs[activeTab]}
      </main>
    </div>
  );
}
