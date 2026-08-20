import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import RefreshBotClient from "@/components/refresh-bot/RefreshBotClient";

export default async function RefreshBotPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/prihlaseni");

  const { data: subscription } = await supabase
    .from("subscriptions")
    .select("plan, status")
    .eq("user_id", user.id)
    .single();

  const isPro = (subscription?.plan === "pro" || subscription?.plan === "scale") && subscription?.status === "active";
  if (!isPro) redirect("/ucet?upgrade=true");

  return <RefreshBotClient />;
}
