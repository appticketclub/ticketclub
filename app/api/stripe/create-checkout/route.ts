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
      .select("stripe_customer_id, status")
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

    const PROMO_CODES: Record<string, number> = {
      "SKOUSKA": 12,
    };
    
    const isNewUser = !existingSub?.stripe_customer_id;
    const trialDays = (promoCode && isNewUser) ? (PROMO_CODES[promoCode.toUpperCase()] ?? 0) : 0;

    const priceId =
      plan === "yearly" ? process.env.STRIPE_PRO_YEARLY_PRICE_ID! :
      plan === "scale_monthly" ? process.env.STRIPE_SCALE_PRICE_ID! :
      plan === "scale_yearly" ? process.env.STRIPE_SCALE_YEARLY_PRICE_ID! :
      process.env.STRIPE_PRO_PRICE_ID!;

    // Check if user has active subscription - if upgrading, use subscription update instead
    const { data: activeSub } = await supabase
      .from("subscriptions")
      .select("stripe_subscription_id, plan, status")
      .eq("user_id", user.id)
      .single();

    const isUpgrade = activeSub?.stripe_subscription_id &&
                      activeSub?.status === "active" &&
                      (plan === "scale_monthly" || plan === "scale_yearly");

    if (isUpgrade) {
      try {
        // Get current subscription from Stripe
        const currentSub = await stripe.subscriptions.retrieve(activeSub.stripe_subscription_id);
        const currentItemId = currentSub.items.data[0]?.id;

        // Update subscription with proration
        const updatedSub = await stripe.subscriptions.update(activeSub.stripe_subscription_id, {
          items: [{
            id: currentItemId,
            price: priceId,
          }],
          proration_behavior: "create_prorations",
          metadata: {
            supabase_user_id: user.id,
          },
        });

        // Update DB immediately
        const { createClient: createServiceClient } = await import("@supabase/supabase-js");
        const serviceSupabase = createServiceClient(
          process.env.NEXT_PUBLIC_SUPABASE_URL!,
          process.env.SUPABASE_SERVICE_ROLE_KEY!
        );
        
        await serviceSupabase.from("subscriptions").update({
          plan: plan.includes("scale") ? "scale" : "pro",
          stripe_subscription_id: updatedSub.id,
          updated_at: new Date().toISOString(),
        }).eq("user_id", user.id);

        await serviceSupabase.from("extension_licenses").update({
          plan: "unlimited"
        }).eq("user_id", user.id);

        return NextResponse.json({ upgraded: true, message: "Předplatné bylo úspěšně aktualizováno." });
      } catch (upgradeError: any) {
        console.error("Upgrade error:", upgradeError);
        // Fallback to checkout if upgrade fails
      }
    }

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
      allow_promotion_codes: trialDays > 0 ? false : true,
      success_url: `https://app.ticketclub.vip/dostupne-sluzby?upgraded=true`,
      cancel_url: `https://app.ticketclub.vip/dostupne-sluzby?cancelled=true`,
      metadata: {
        supabase_user_id: user.id,
      },
      subscription_data: {
        ...(trialDays > 0 ? { trial_period_days: trialDays } : {}),
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
