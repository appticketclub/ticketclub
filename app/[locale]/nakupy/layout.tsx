import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import TopNav from "@/components/dashboard/TopNav";
import { CurrencyProvider } from "@/lib/context/CurrencyContext";
import AnimatedBackground from "@/components/nakupy/AnimatedBackground";

export default async function NakupyLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/prihlaseni");

  const { data: profile } = await supabase.from("profiles").select("*").eq("id", user.id).single();
  const displayCurrency = (profile?.display_currency ?? "EUR") as "EUR" | "CZK";

  return (
    <CurrencyProvider initialCurrency={displayCurrency}>
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@700;800&display=swap" />
      <div style={{ minHeight: "100vh", background: "transparent", display: "flex", flexDirection: "column", position: "relative" }}>
        <AnimatedBackground />
        <div style={{ position: "relative", zIndex: 1, display: "flex", flexDirection: "column", flex: 1 }}>
          <TopNav user={user} profile={profile} />
          {children}
        </div>
      </div>
    </CurrencyProvider>
  );
}
