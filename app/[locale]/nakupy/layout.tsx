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
      <div style={{ minHeight: "100vh", background: "#080808", display: "flex", flexDirection: "column" }}>
        <TopNav user={user} profile={profile} />
        {children}
      </div>
    </CurrencyProvider>
  );
}
