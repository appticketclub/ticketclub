import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import TopNav from "@/components/dashboard/TopNav";
import ChromeLauncherClient from "@/components/launcher/ChromeLauncherClient";

export default async function ChromeLauncherPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/prihlaseni");

  const { data: profile } = await supabase.from("profiles").select("*").eq("id", user.id).single();
  const { data: tokenData } = await supabase.from("launcher_tokens").select("*").eq("user_id", user.id).single();

  return (
    <div style={{ minHeight: "100vh", background: "#080808" }}>
      <TopNav user={user} profile={profile} />
      <main style={{ maxWidth: 680, margin: "0 auto", padding: "2.5rem 1.5rem" }}>
        <ChromeLauncherClient tokenData={tokenData} />
      </main>
    </div>
  );
}
