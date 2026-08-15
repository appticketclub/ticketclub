import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { createClient } from "@supabase/supabase-js";

function getStripe() {
  return new Stripe(process.env.STRIPE_SECRET_KEY!, {
    apiVersion: "2026-05-27.dahlia",
  });
}

function getSupabaseServiceRole() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

export async function POST(request: NextRequest) {
  const stripe = getStripe();
  const supabase = getSupabaseServiceRole();
  const body = await request.text();
  const signature = request.headers.get("stripe-signature");

  if (!signature) {
    return NextResponse.json({ error: "No signature" }, { status: 400 });
  }

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch (err: any) {
    console.error("Webhook signature error:", err.message);
    return NextResponse.json({ error: err.message }, { status: 400 });
  }

  console.log("Stripe event:", event.type);

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as any;
        const userId = session.metadata?.supabase_user_id;
        const customerId = session.customer as string;
        let subscriptionId = session.subscription as string;
        if (!userId) { console.log("No userId in metadata"); break; }

        // Check if SKOUSKA coupon was used
        const discounts = session.total_details?.breakdown?.discounts ?? [];
        const usedSkouska = discounts.some((d: any) => 
          d.discount?.coupon?.id === "SKOUSKA" || 
          d.discount?.coupon?.name === "SKOUSKA" ||
          d.discount?.promotion_code?.code === "SKOUSKA"
        );
        
        if (usedSkouska && subscriptionId) {
          // Apply 12-day trial to subscription
          await stripe.subscriptions.update(subscriptionId, {
            trial_end: Math.floor(Date.now() / 1000) + (12 * 24 * 60 * 60), // 12 days
          });
        }

        const sub = (await stripe.subscriptions.retrieve(subscriptionId)) as any;
        console.log("sub.current_period_end:", sub.current_period_end, typeof sub.current_period_end);
        const periodEndRaw = sub.current_period_end;
        const periodEnd =  periodEndRaw 
          ? new Date(typeof periodEndRaw === 'number' ? periodEndRaw * 1000 : periodEndRaw).toISOString() 
          : null;
        const interval = sub.items?.data?.[0]?.plan?.interval ?? "month";
        const planInterval = interval === "year" ? "yearly" : "monthly";
        
        const priceId = sub.items?.data?.[0]?.price?.id;
        const isProMax = priceId === process.env.STRIPE_PRO_MAX_PRICE_ID || 
                          priceId === process.env.STRIPE_PRO_MAX_YEARLY_PRICE_ID;
        const isScale = priceId === process.env.STRIPE_SCALE_PRICE_ID || 
                        priceId === process.env.STRIPE_SCALE_YEARLY_PRICE_ID;
        const extensionPlan = isScale || isProMax ? "unlimited" : "single";
        
        await supabase.from("subscriptions").upsert({
          user_id: userId,
          plan: isScale ? "scale" : isProMax ? "pro_max" : "pro",
          plan_interval: planInterval,
          status: "active",
          stripe_customer_id: customerId,
          stripe_subscription_id: subscriptionId,
          current_period_end: periodEnd,
          updated_at: new Date().toISOString(),
        }, { onConflict: "user_id" });
        if (isScale) {
          await supabase.from("extension_licenses").update({ plan: "unlimited" }).eq("user_id", userId);
        } else {
          await supabase.from("extension_licenses").update({ plan: "single" }).eq("user_id", userId);
        }
        // Reactivate launcher token if exists, otherwise skip
        const { data: existingToken } = await supabase
          .from("launcher_tokens")
          .select("id, is_active")
          .eq("user_id", userId)
          .maybeSingle();

        if (existingToken) {
          await supabase.from("launcher_tokens")
            .update({ is_active: true })
            .eq("user_id", userId);
          console.log("✅ Launcher token reactivated for:", userId);
        }

        // Reactivate or create extension license
        const { data: existingLicense } = await supabase
          .from("extension_licenses")
          .select("id")
          .eq("user_id", userId)
          .maybeSingle();

        if (existingLicense) {
          await supabase.from("extension_licenses")
            .update({ is_active: true, plan: extensionPlan })
            .eq("user_id", userId);
        } else {
          const licenseKey = "TC-" + Array.from({length: 3}, () =>
            Math.random().toString(36).toUpperCase().substring(2, 6)
          ).join("-");
          await supabase.from("extension_licenses").insert({
            user_id: userId,
            license_key: licenseKey,
            is_active: true,
            plan: extensionPlan,
          });
        }
        console.log("✅ Pro activated:", userId);
        break;
      }
      case "invoice.payment_succeeded": {
        const invoice = event.data.object as any;
        const subscriptionId = invoice.subscription as string;
        if (!subscriptionId) break;
        const sub = (await stripe.subscriptions.retrieve(subscriptionId)) as any;
        const userId = sub.metadata?.supabase_user_id;
        if (!userId) break;
        const periodEndRaw = sub.current_period_end;
        const periodEnd =  periodEndRaw 
          ? new Date(typeof periodEndRaw === 'number' ? periodEndRaw * 1000 : periodEndRaw).toISOString() 
          : null;
        const interval = sub.items?.data?.[0]?.plan?.interval ?? "month";
        const planInterval = interval === "year" ? "yearly" : "monthly";
        
        const priceId = sub.items?.data?.[0]?.price?.id;
        const isProMax = priceId === process.env.STRIPE_PRO_MAX_PRICE_ID || 
                          priceId === process.env.STRIPE_PRO_MAX_YEARLY_PRICE_ID;
        const isScale = priceId === process.env.STRIPE_SCALE_PRICE_ID || 
                        priceId === process.env.STRIPE_SCALE_YEARLY_PRICE_ID;
        const extensionPlan = isScale || isProMax ? "unlimited" : "single";
        
        await supabase.from("subscriptions").upsert({
          user_id: userId,
          plan: isScale ? "scale" : isProMax ? "pro_max" : "pro",
          plan_interval: planInterval,
          status: "active",
          stripe_customer_id: invoice.customer as string,
          stripe_subscription_id: subscriptionId,
          current_period_end: periodEnd,
          updated_at: new Date().toISOString(),
        }, { onConflict: "user_id" });
        if (isScale) {
          await supabase.from("extension_licenses").update({ plan: "unlimited" }).eq("user_id", userId);
        } else {
          await supabase.from("extension_licenses").update({ plan: "single" }).eq("user_id", userId);
        }
        // Reactivate launcher token if exists, otherwise skip
        const { data: existingToken } = await supabase
          .from("launcher_tokens")
          .select("id, is_active")
          .eq("user_id", userId)
          .maybeSingle();

        if (existingToken) {
          await supabase.from("launcher_tokens")
            .update({ is_active: true })
            .eq("user_id", userId);
          console.log("✅ Launcher token reactivated for:", userId);
        }

        // Reactivate or create extension license
        const { data: existingLicense } = await supabase
          .from("extension_licenses")
          .select("id")
          .eq("user_id", userId)
          .maybeSingle();

        if (existingLicense) {
          await supabase.from("extension_licenses")
            .update({ is_active: true, plan: extensionPlan })
            .eq("user_id", userId);
        } else {
          const licenseKey = "TC-" + Array.from({length: 3}, () =>
            Math.random().toString(36).toUpperCase().substring(2, 6)
          ).join("-");
          await supabase.from("extension_licenses").insert({
            user_id: userId,
            license_key: licenseKey,
            is_active: true,
            plan: extensionPlan,
          });
        }
        console.log("✅ Renewed:", userId);
        break;
      }
      case "invoice.payment_failed": {
        const invoice = event.data.object as any;
        const subscriptionId = invoice.subscription as string;
        if (!subscriptionId) break;
        const sub = (await stripe.subscriptions.retrieve(subscriptionId)) as any;
        const userId = sub.metadata?.supabase_user_id;
        if (!userId) break;
        await supabase.from("subscriptions").update({
          status: "past_due",
          updated_at: new Date().toISOString(),
        }).eq("user_id", userId);
        console.log("⚠️ Payment failed:", userId);
        break;
      }
      case "customer.subscription.deleted": {
        const sub = event.data.object as any;
        const userId = sub.metadata?.supabase_user_id;
        if (!userId) break;
        await supabase.from("subscriptions").update({
          plan: "free",
          status: "canceled",
          stripe_subscription_id: null,
          current_period_end: null,
          updated_at: new Date().toISOString(),
        }).eq("user_id", userId);
        await supabase.from("extension_licenses").update({ is_active: false }).eq("user_id", userId);
        await supabase.from("extension_licenses").delete().eq("user_id", userId);
        await supabase.from("launcher_tokens").update({ is_active: false }).eq("user_id", userId);
        console.log("❌ Cancelled:", userId);
        break;
      }
      case "customer.subscription.updated": {
        const sub = event.data.object as any;
        const userId = sub.metadata?.supabase_user_id;
        if (!userId) break;

        const periodEnd = sub.current_period_end
          ? new Date(sub.current_period_end * 1000).toISOString()
          : null;

        const isCanceled = sub.canceled_at !== null && sub.canceled_at !== undefined;
        const isFullyCanceled = sub.status === "canceled";

        // Check if this is a RENEWAL — previous had canceled_at but now it's null
        const previousCanceledAt = (event.data as any).previous_attributes?.canceled_at;
        const isRenewal = previousCanceledAt !== undefined && sub.canceled_at === null && sub.status === "active";

        if (isFullyCanceled || isCanceled) {
          // Deactivate
          await supabase.from("subscriptions").update({
            plan: "free",
            status: "canceled",
            stripe_subscription_id: null,
            current_period_end: null,
            updated_at: new Date().toISOString(),
          }).eq("user_id", userId);

          await supabase.from("extension_licenses").delete().eq("user_id", userId);
          await supabase.from("launcher_tokens").update({ is_active: false }).eq("user_id", userId);
          console.log("❌ Canceled:", userId);

        } else if (isRenewal) {
          // Reactivate
          await supabase.from("subscriptions").update({
            plan: "pro",
            status: "active",
            current_period_end: periodEnd,
            updated_at: new Date().toISOString(),
          }).eq("user_id", userId);

          // Reactivate launcher token if exists, otherwise skip
          const { data: existingToken } = await supabase
            .from("launcher_tokens")
            .select("id, is_active")
            .eq("user_id", userId)
            .maybeSingle();

          if (existingToken) {
            await supabase.from("launcher_tokens")
              .update({ is_active: true })
              .eq("user_id", userId);
            console.log("✅ Launcher token reactivated for:", userId);
          }

          // Reactivate or create extension license
          const { data: existingLicense } = await supabase
            .from("extension_licenses")
            .select("id")
            .eq("user_id", userId)
            .maybeSingle();

          if (existingLicense) {
            await supabase.from("extension_licenses")
              .update({ is_active: true })
              .eq("user_id", userId);
          } else {
            const licenseKey = "TC-" + Array.from({length: 3}, () =>
              Math.random().toString(36).toUpperCase().substring(2, 6)
            ).join("-");
            await supabase.from("extension_licenses").insert({
              user_id: userId,
              license_key: licenseKey,
              is_active: true,
            });
          }
          console.log("✅ Reactivated:", userId);

        } else {
          // Normal update
          await supabase.from("subscriptions").update({
            status: sub.status,
            current_period_end: periodEnd,
            updated_at: new Date().toISOString(),
          }).eq("user_id", userId);
        }

        break;
      }
    }
  } catch (error: any) {
    console.error("Webhook handler error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}
