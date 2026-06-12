"use client";
import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import Sidebar from "@/components/nakupy/Sidebar";
import UvodTab from "@/components/nakupy/tabs/UvodTab";
import UctyTab from "@/components/nakupy/tabs/UctyTab";
import NakupyTab from "@/components/nakupy/tabs/NakupyTab";
import ProdejeTab from "@/components/nakupy/tabs/ProdejeTab";
import BanneryTab from "@/components/nakupy/tabs/BanneryTab";
import KalendarTab from "@/components/nakupy/tabs/KalendarTab";
import KalkulackaTab from "@/components/nakupy/tabs/KalkulackaTab";
import AiStatistikyTab from "@/components/nakupy/tabs/AiStatistikyTab";
import DoporuceneAkceTab from "@/components/nakupy/tabs/DoporuceneAkceTab";
import TymStatistikyTab from "@/components/nakupy/tabs/TymStatistikyTab";
import EvidenceTab from "@/components/nakupy/tabs/EvidenceTab";
import DetailyTab from "@/components/nakupy/tabs/DetailyTab";

export default function NakupyPage() {
  const [activeTab, setActiveTab] = useState("uvod");
  const [isAdmin, setIsAdmin] = useState(false);
  const supabase = createClient();

  useEffect(() => {
    async function fetchProfile() {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", user.id)
          .single();
        setIsAdmin(profile?.role === "admin");
      }
    }
    fetchProfile();
  }, [supabase]);

  const tabs: Record<string, React.ReactNode> = {
    uvod: <UvodTab />,
    ucty: <UctyTab />,
    evidence: <EvidenceTab />,
    detaily: <DetailyTab />,
    kalendar: <KalendarTab />,
    "ai-statistiky": <AiStatistikyTab />,
    "doporucene-akce": <DoporuceneAkceTab />,
    kalkulacka: <KalkulackaTab />,
    bannery: <BanneryTab />,
    ...(isAdmin ? { "tym-statistiky": <TymStatistikyTab /> } : {}),
  };

  return (
    <div style={{ display: "flex", minHeight: "calc(100vh - 65px)", flexDirection: "row" }}>
      <Sidebar activeTab={activeTab} onTabChange={setActiveTab} isAdmin={isAdmin} />
      <main style={{ flex: 1, padding: "1.5rem clamp(1rem, 3vw, 2.5rem)", overflowY: "auto", minWidth: 0 }}>
        {tabs[activeTab]}
      </main>
    </div>
  );
}
