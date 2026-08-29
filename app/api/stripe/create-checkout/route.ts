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

    // Check if customer already exists
    const { data: existingSub } = await supabase
      .from("subscriptions")
      .select("stripe_customer_id, stripe_subscription_id, status, plan")
      .eq("user_id", user.id)
      .single();

    let customerId = existingSub?.stripe_customer_id;

    // Create Stripe customer if doesn't exist
    if (!customerId) {
      const customer = await stripe.customers.create({
        email: user.email,
        name: profile?.full_name ?? undefined,
        metadata: { supabase_user_id: user.id },
      });
      customerId = customer.id;
    }

    const { plan, promoCode } = await request.json().catch(() => ({ plan: "monthly", promoCode: "" }));

    const priceId =
      plan === "yearly" ? process.env.STRIPE_PRO_YEARLY_PRICE_ID! :
      plan === "scale_monthly" ? process.env.STRIPE_SCALE_PRICE_ID! :
      plan === "scale_yearly" ? process.env.STRIPE_SCALE_YEARLY_PRICE_ID! :
      process.env.STRIPE_PRO_PRICE_ID!;

    // Check if PRO user upgrading to Scale
    const isScalePlan = plan === "scale_monthly" || plan === "scale_yearly";
    const hasActiveSub = existingSub?.stripe_subscription_id && existingSub?.status === "active";
    const isProUpgradingToScale = hasActiveSub && existingSub?.plan === "pro" && isScalePlan;

    if (isProUpgradingToScale) {
      // Cancel PRO at period end
      await stripe.subscriptions.update(existingSub.stripe_subscription_id, {
        cancel_at_period_end: true,
      });
    }

    const PROMO_CODES: Record<string, number> = {
      SKOUSKA: 12,
    };

    const trialDays = (promoCode && PROMO_CODES[promoCode.toUpperCase()])
      ? PROMO_CODES[promoCode.toUpperCase()]
      : 0;

    // Create checkout session with trial
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
        trial_period_days: trialDays,
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
