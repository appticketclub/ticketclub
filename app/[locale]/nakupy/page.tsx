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
import UpozorneniaTab from "@/components/nakupy/tabs/UpozorneniaTab";
// import SurveyModal from "@/components/survey/SurveyModal";
import UpgradeModal from "@/components/ucet/UpgradeModal";
import UpgradePopup from "@/components/nakupy/UpgradePopup";
import RefreshBotClient from "@/components/refresh-bot/RefreshBotClient";
import SalesTrackerClient from "@/components/sales-tracker/SalesTrackerClient";
import ChromeLauncherClient from "@/components/launcher/ChromeLauncherClient";

function ProGate({ isPro, children, toolName }: {
  isPro: boolean;
  children: React.ReactNode;
  toolName: string;
}) {
  const [showUpgrade, setShowUpgrade] = useState(false);
  if (isPro) return <>{children}</>;
  return (
    <div style={{
      display: "flex", flexDirection: "column",
      alignItems: "center", justifyContent: "center",
      minHeight: 400, gap: "1.5rem",
    }}>
      <div style={{ textAlign: "center" }}>
        <div style={{ fontSize: 48, marginBottom: "1rem" }}>🔒</div>
        <div style={{
          fontFamily: "'Space Grotesk', sans-serif",
          fontSize: 22, fontWeight: 700, color: "#fff", marginBottom: "0.5rem",
        }}>
          {toolName}
        </div>
        <div style={{ fontSize: 14, color: "rgba(255,255,255,0.4)", marginBottom: "1.5rem" }}>
          Tento nástroj je dostupný len pre PRO členov.
        </div>
        <button
          onClick={() => setShowUpgrade(true)}
          style={{
            background: "linear-gradient(135deg, #7b6cf6, #9d8ff5)",
            border: "none", borderRadius: 12,
            padding: "0.75rem 2rem",
            color: "#fff", fontSize: 14, fontWeight: 700, cursor: "pointer",
            boxShadow: "0 4px 20px rgba(123,108,246,0.4)",
          }}
        >
          Upgradovať na PRO →
        </button>
      </div>
      {showUpgrade && <UpgradeModal onClose={() => setShowUpgrade(false)} />}
    </div>
  );
}

export default function NakupyPage() {
  const [activeTab, setActiveTab] = useState("uvod");
  const [isAdmin, setIsAdmin] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const [showSurvey, setShowSurvey] = useState(false);
  const [plan, setPlan] = useState<"free" | "scale" | null>(null);
  const [showUpgrade, setShowUpgrade] = useState(false);
  const supabase = createClient();

  useEffect(() => {
    async function fetchPlan() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data } = await supabase
        .from("subscriptions")
        .select("plan")
        .eq("user_id", user.id)
        .single();
      setPlan((data?.plan === "scale" ? "scale" : "free") as "free" | "scale");
    }
    fetchPlan();
  }, [supabase]);

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

  const isPro = plan === "scale";

  const tabs: Record<string, React.ReactNode> = {
    uvod: <UvodTab onTabChange={setActiveTab} />,
    ucty: <UctyTab />,
    evidence: <EvidenceTab />,
    detaily: <DetailyTab />,
    kalendar: <KalendarTab />,
    "ai-statistiky": <AiStatistikyTab />,
    "doporucene-akce": <DoporuceneAkceTab />,
    kalkulacka: <KalkulackaTab />,
    bannery: <BanneryTab />,
    "refresh-bot": (
      <ProGate isPro={isPro} toolName="Refresh Bot">
        <RefreshBotClient />
      </ProGate>
    ),
    "sales-tracker": <SalesTrackerClient />,
    "chrome-launcher": (
      <ProGate isPro={isPro} toolName="Chrome Launcher">
        <ChromeLauncherClient />
      </ProGate>
    ),
    ...(isAdmin ? { upozornenia: <UpozorneniaTab /> } : {}),
    ...(isAdmin ? { "tym-statistiky": <TymStatistikyTab /> } : {}),
  };

  return (
    <div style={{ display: "flex", minHeight: "calc(100vh - 65px)", flexDirection: "row" }}>
      <Sidebar activeTab={activeTab} onTabChange={setActiveTab} isAdmin={isAdmin} collapsed={collapsed} setCollapsed={setCollapsed} />
      <main style={{ flex: 1, padding: "1.5rem clamp(1rem, 3vw, 2.5rem)", overflowY: "auto", minWidth: 0, transition: "all 0.25s ease" }}>
        {tabs[activeTab]}
      </main>
      {collapsed && (
        <button
          onClick={() => setCollapsed(false)}
          style={{
            position: "fixed",
            left: 8,
            bottom: 20,
            background: "#1a1a1a",
            border: "1px solid #2a2a2a",
            borderRadius: 8,
            color: "#fff",
            cursor: "pointer",
            padding: "8px 10px",
            fontSize: 16,
            zIndex: 100,
          }}
        >
          →
        </button>
      )}
      {/* {false && showSurvey && <SurveyModal onClose={() => setShowSurvey(false)} />} */}
      {plan === "free" && (
        <UpgradePopup onUpgrade={() => setShowUpgrade(true)} />
      )}
      {showUpgrade && <UpgradeModal onClose={() => setShowUpgrade(false)} />}
    </div>
  );
}
