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

    console.log("[checkout] existingSub:", existingSub?.plan, existingSub?.status, existingSub?.stripe_subscription_id);
    console.log("[checkout] plan requested:", plan);

    const priceId =
      plan === "yearly" ? process.env.STRIPE_PRO_YEARLY_PRICE_ID! :
      plan === "scale_monthly" ? process.env.STRIPE_SCALE_PRICE_ID! :
      plan === "scale_yearly" ? process.env.STRIPE_SCALE_YEARLY_PRICE_ID! :
      process.env.STRIPE_PRO_PRICE_ID!;

    // Check if PRO user upgrading to Scale
    const isScalePlan = plan === "scale_monthly" || plan === "scale_yearly";
    const hasActiveSub = existingSub?.stripe_subscription_id && existingSub?.status === "active";
    const isProUpgradingToScale = hasActiveSub && existingSub?.plan === "pro" && isScalePlan;

    if (isProUpgradingToScale && existingSub.stripe_subscription_id) {
      try {
        const currentSub = await stripe.subscriptions.retrieve(existingSub.stripe_subscription_id);
        const currentItemId = currentSub.items.data[0]?.id;

        // Don't do proration upgrade if user is in trial
        const isInTrial = currentSub.status === "trialing" ||
          (currentSub.trial_end && currentSub.trial_end > Math.floor(Date.now() / 1000));

        if (!isInTrial) {
          await stripe.subscriptions.update(existingSub.stripe_subscription_id, {
            items: [{ id: currentItemId, price: priceId }],
            proration_behavior: "create_prorations",
            metadata: { supabase_user_id: user.id },
          });

          // Create and pay proration invoice immediately
          try {
            const invoice = await stripe.invoices.create({
              customer: customerId!,
              subscription: existingSub.stripe_subscription_id,
              auto_advance: false,
            });

            if (invoice.amount_due > 0) {
              await stripe.invoices.finalizeInvoice(invoice.id);
              await stripe.invoices.pay(invoice.id);
              console.log("[checkout] Proration invoice paid:", invoice.id, invoice.amount_due);
            } else {
              console.log("[checkout] No amount due, skipping payment");
            }
          } catch (invoiceErr: any) {
            console.log("[checkout] Invoice error:", invoiceErr.message);
          }

          return NextResponse.json({ upgraded: true });
        }
        // If in trial — fall through to normal checkout
      } catch (e: any) {
        console.error("[checkout] upgrade error:", e.message);
        // Fall through to normal checkout on error
      }
    }

    const PROMO_CODES: Record<string, number> = {
      SKOUSKA: 12,
      MENTORING1V1: 180,
    };

    const PROMO_CODE_PLAN_RESTRICTION: Record<string, string> = {
      MENTORING1V1: "scale_yearly",
    };

    const promoUpper = promoCode?.toUpperCase();
    const trialDays = (promoUpper && PROMO_CODES[promoUpper]) ? PROMO_CODES[promoUpper] : 0;

    if (promoUpper && PROMO_CODE_PLAN_RESTRICTION[promoUpper]) {
      if (plan !== PROMO_CODE_PLAN_RESTRICTION[promoUpper]) {
        return NextResponse.json({ error: "Tento promo kód je platný len pre Scale ročný plán." }, { status: 400 });
      }
    }

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
