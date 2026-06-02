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

export async function setCapital(amount: number, currency: "EUR" | "CZK") {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Nepřihlášen" };

  // Set BOTH initial and current capital — only on first setup
  const { error } = await supabase
    .from("profiles")
    .update({
      capital: amount,
      capital_initial: amount,
      capital_currency: currency,
    })
    .eq("id", user.id);

  if (error) return { error: error.message };

  await supabase.from("capital_history").insert({
    user_id: user.id,
    amount: amount,
    type: "deposit",
    description: "Počáteční kapitál",
    balance_after: amount,
  });

  revalidatePath("/nakupy");
  return { success: true };
}
