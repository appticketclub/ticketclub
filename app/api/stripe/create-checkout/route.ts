import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { stripe } from "@/lib/stripe";

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { data: profile } = await supabase
      .from("profiles")
      .select("email, full_name")
      .eq("id", user.id)
      .single();

    const { data: existingSub } = await supabase
      .from("subscriptions")
      .select("stripe_customer_id, stripe_subscription_id, status, plan")
      .eq("user_id", user.id)
      .single();

    let customerId = existingSub?.stripe_customer_id;

    // If no customer ID saved, check if customer already exists in Stripe by email
    if (!customerId) {
      const existing = await stripe.customers.list({ email: user.email, limit: 1 });
      if (existing.data.length > 0) {
        customerId = existing.data[0].id;
        // Save to DB
        await supabase.from("subscriptions").upsert({
          user_id: user.id,
          stripe_customer_id: customerId,
        }, { onConflict: "user_id" });
      }
    }

    if (!customerId) {
      const customer = await stripe.customers.create({
        email: user.email,
        name: profile?.full_name ?? undefined,
        metadata: { supabase_user_id: user.id },
      });
      customerId = customer.id;
    }

    const { plan, promoCode, priceId: clientPriceId } = await request.json().catch(() => ({ plan: "pro_monthly", promoCode: "", priceId: undefined }));

    console.log("[checkout] existingSub:", existingSub?.plan, existingSub?.status, existingSub?.stripe_subscription_id);
    console.log("[checkout] plan requested:", plan);

    const priceId = clientPriceId ?? (
      plan === "pro_yearly" || plan === "yearly" ? process.env.STRIPE_PRO_YEARLY_PRICE_ID! :
      process.env.STRIPE_PRO_PRICE_ID!
    );

    const isScale = false;
    const isPro = priceId === process.env.STRIPE_PRO_PRICE_ID || priceId === process.env.STRIPE_PRO_YEARLY_PRICE_ID;

    const PROMO_CODES: Record<string, number> = {
      SKOUSKA: 12,
      MENTORING1V1: 180,
      MESIAC: 30,
    };

    const promoUpper = promoCode?.toUpperCase();
    const trialDays = (promoUpper && PROMO_CODES[promoUpper]) ? PROMO_CODES[promoUpper] : 0;

    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      payment_method_types: ["card"],
      line_items: [{ price: priceId, quantity: 1 }],
      mode: "subscription",
      allow_promotion_codes: false,
      success_url: `https://app.ticketclub.vip/dostupne-sluzby?upgraded=true`,
      cancel_url: `https://app.ticketclub.vip/dostupne-sluzby?cancelled=true`,
      metadata: { supabase_user_id: user.id },
      subscription_data: {
        ...(trialDays > 0 ? { trial_period_days: trialDays } : {}),
        metadata: { supabase_user_id: user.id },
      },
      billing_address_collection: "auto",
    });

    return NextResponse.json({ url: session.url });
  } catch (error: any) {
    console.error("Stripe checkout error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
