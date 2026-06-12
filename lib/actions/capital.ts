"use server";
import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function getCapital() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  const { data } = await supabase
    .from("profiles")
    .select("capital, capital_initial, capital_currency")
    .eq("id", user.id)
    .single();
  return data;
}

export async function setCapital(amount: number, currency: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Unauthorized" };

  // Load all purchases and sales to recalculate real balance
  const [{ data: purchases }, { data: sales }] = await Promise.all([
    supabase.from("purchases").select("buy_price, quantity").eq("user_id", user.id),
    supabase.from("sales").select("sell_price, quantity_sold, fees").eq("user_id", user.id),
  ]);

  const totalInvested = purchases?.reduce((sum, p) => sum + (p.buy_price * p.quantity), 0) ?? 0;
  const totalRevenue = sales?.reduce((sum, s) => sum + (s.sell_price * s.quantity_sold), 0) ?? 0;
  const totalFees = sales?.reduce((sum, s) => sum + (s.fees ?? 0), 0) ?? 0;

  // New balance = new initial capital - total invested + total revenue - fees
  const newBalance = amount - totalInvested + totalRevenue - totalFees;

  const { error } = await supabase
    .from("profiles")
    .update({
      capital: newBalance,
      capital_initial: amount,
      capital_currency: currency,
    })
    .eq("id", user.id);

  if (error) return { error: error.message };

  // Clear old capital history and add fresh entry
  await supabase.from("capital_history").delete().eq("user_id", user.id);
  await supabase.from("capital_history").insert({
    user_id: user.id,
    amount: amount,
    type: "deposit",
    description: "Initial capital (recalculated)",
    balance_after: newBalance,
  });

  // After inserting, check count and delete oldest if over 100
  const { count } = await supabase
    .from("capital_history")
    .select("*", { count: "exact", head: true })
    .eq("user_id", user.id);

  if ((count ?? 0) > 100) {
    const { data: oldest } = await supabase
      .from("capital_history")
      .select("id")
      .eq("user_id", user.id)
      .order("created_at", { ascending: true })
      .limit(10);
    if (oldest?.length) {
      await supabase.from("capital_history").delete().in("id", oldest.map(r => r.id));
    }
  }

  revalidatePath("/nakupy");
  return { success: true };
}
