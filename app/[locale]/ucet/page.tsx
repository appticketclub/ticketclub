import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import TopNav from "@/components/dashboard/TopNav";
import UcetPageClient from "@/components/ucet/UcetPageClient";

export default async function UcetPage() {
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
    .select("*")
    .eq("user_id", user.id)
    .single();

  return (
    <div style={{ minHeight: "100vh", background: "#0a0a10", position: "relative" }}>
      <div style={{ position: "fixed", inset: 0, zIndex: 0, pointerEvents: "none", background: "radial-gradient(ellipse 80% 50% at 20% 10%, rgba(123,108,246,0.1) 0%, transparent 60%), radial-gradient(ellipse 60% 40% at 80% 80%, rgba(89,52,196,0.07) 0%, transparent 60%)" }} />
      <div style={{ position: "fixed", inset: 0, zIndex: 0, pointerEvents: "none", backgroundImage: "linear-gradient(rgba(123,108,246,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(123,108,246,0.03) 1px, transparent 1px)", backgroundSize: "48px 48px" }} />
      <div style={{ position: "relative", zIndex: 1 }}>
        <TopNav user={user} profile={profile} />
        <main style={{ maxWidth: 680, margin: "0 auto", padding: "2.5rem 1.5rem" }}>
          <UcetPageClient user={user} profile={profile} subscription={subscription} />
        </main>
      </div>
    </div>
  );
}
