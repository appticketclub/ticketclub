import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import ServicesGrid from "@/components/dashboard/ServicesGrid";
import TopNav from "@/components/dashboard/TopNav";

export default async function DostupneSluzbyPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect("/prihlaseni");

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  const { data: subscription } = await supabase
    .from("subscriptions")
    .select("plan, status, current_period_end")
    .eq("user_id", user.id)
    .single();

  const isPro = subscription?.plan === "pro" && subscription?.status === "active";
  const isAdmin = profile?.role === "admin";

  return (
    <div style={{ minHeight: "100vh", background: "#080808" }}>
      <TopNav user={user} profile={profile} />
      <main style={{ padding: "2rem 3rem" }}>
        <div style={{ marginBottom: "2.5rem" }}>
          <h1 style={{ fontSize: "1.75rem", fontWeight: 700, color: "#fff", marginBottom: "0.5rem" }}>
            Vítejte zpět{profile?.full_name ? `, ${profile.full_name.split(" ")[0]}` : ""}
          </h1>
          <p style={{ color: "#f5f5f5" }}>Vyberte si nástroj, se kterým chcete pracovat.</p>
        </div>
        <ServicesGrid isPro={isPro} isAdmin={isAdmin} user={user} />
      </main>
    </div>
  );
}
