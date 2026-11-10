import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import TopNav from "@/components/dashboard/TopNav";
import { CurrencyProvider } from "@/lib/context/CurrencyContext";

export default async function NakupyLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/prihlaseni");

  const { data: profile } = await supabase.from("profiles").select("*").eq("id", user.id).single();
  const displayCurrency = (profile?.display_currency ?? "EUR") as "EUR" | "CZK";

  return (
    <CurrencyProvider initialCurrency={displayCurrency}>
      <div style={{ minHeight: "100vh", background: "#0a0a10", display: "flex", flexDirection: "column", position: "relative" }}>
        <div style={{
          position: "fixed", inset: 0, zIndex: 0, pointerEvents: "none",
          background: `
            radial-gradient(ellipse 80% 50% at 20% 10%, rgba(123,108,246,0.12) 0%, transparent 60%),
            radial-gradient(ellipse 60% 40% at 80% 80%, rgba(89,52,196,0.08) 0%, transparent 60%),
            radial-gradient(ellipse 40% 30% at 60% 30%, rgba(168,109,247,0.06) 0%, transparent 50%)
          `,
        }} />
        <div style={{
          position: "fixed", inset: 0, zIndex: 0, pointerEvents: "none",
          backgroundImage: `
            linear-gradient(rgba(123,108,246,0.03) 1px, transparent 1px),
            linear-gradient(90deg, rgba(123,108,246,0.03) 1px, transparent 1px)
          `,
          backgroundSize: "48px 48px",
        }} />
        <TopNav user={user} profile={profile} />
        <div style={{ position: "relative", zIndex: 1, display: "flex", flexDirection: "column", flex: 1 }}>
          {children}
        </div>
      </div>
    </CurrencyProvider>
  );
}
