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
    const { data: subscription } = await supabase
      .from("subscriptions")
      .select("stripe_customer_id")
      .eq("user_id", user.id)
      .single();

    let customerId = subscription?.stripe_customer_id;

    // Create Stripe customer if doesn't exist
    if (!customerId) {
      const customer = await stripe.customers.create({
        email: user.email,
        name: profile?.full_name ?? undefined,
        metadata: { supabase_user_id: user.id },
      });
      customerId = customer.id;
    }

    const { plan } = await request.json().catch(() => ({ plan: "monthly" }));

    const priceId = 
      plan === "yearly" ? process.env.STRIPE_PRO_YEARLY_PRICE_ID! :
      plan === "pro_max_monthly" ? process.env.STRIPE_PRO_MAX_PRICE_ID! :
      plan === "pro_max_yearly" ? process.env.STRIPE_PRO_MAX_YEARLY_PRICE_ID! :
      process.env.STRIPE_PRO_PRICE_ID!;

    // Create checkout session
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      payment_method_types: ["card"],
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      mode: "subscription",
      allow_promotion_codes: true,
      success_url: `https://app.ticketclub.vip/dostupne-sluzby?upgraded=true`,
      cancel_url: `https://app.ticketclub.vip/dostupne-sluzby?cancelled=true`,
      metadata: {
        supabase_user_id: user.id,
      },
      subscription_data: {
        trial_period_days: 14,
        metadata: {
          supabase_user_id: user.id,
        },
      },
      billing_address_collection: "auto",
    });

    return NextResponse.json({ url: session.url });
  } catch (error: any) {
    console.error("Stripe checkout error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
