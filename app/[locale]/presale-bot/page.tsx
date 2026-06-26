import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import PresaleBotClient from "@/components/presale-bot/PresaleBotClient";

export default async function PresaleBotPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/prihlaseni");

  return <PresaleBotClient />;
}
