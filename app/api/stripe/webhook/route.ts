import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { createClient } from "@supabase/supabase-js";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2026-05-27.dahlia",
});

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: NextRequest) {
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
        const subscriptionId = session.subscription as string;
        if (!userId) { console.log("No userId in metadata"); break; }
        const sub = (await stripe.subscriptions.retrieve(subscriptionId)) as any;
        console.log("sub.current_period_end:", sub.current_period_end, typeof sub.current_period_end);
        const periodEndRaw = sub.current_period_end;
        const periodEnd =  periodEndRaw 
          ? new Date(typeof periodEndRaw === 'number' ? periodEndRaw * 1000 : periodEndRaw).toISOString() 
          : null;
        await supabase.from("subscriptions").upsert({
          user_id: userId,
          plan: "pro",
          status: "active",
          stripe_customer_id: customerId,
          stripe_subscription_id: subscriptionId,
          current_period_end: periodEnd,
          updated_at: new Date().toISOString(),
        }, { onConflict: "user_id" });
        // Activate extension license
        await supabase.from("extension_licenses").upsert({
          user_id: userId,
          is_active: true,
        }, { onConflict: "user_id" });
        // Activate launcher token
        await supabase.from("launcher_tokens").update({
          is_active: true,
        }).eq("user_id", userId);
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
        const periodEnd = new Date(sub.current_period_end * 1000).toISOString();
        await supabase.from("subscriptions").upsert({
          user_id: userId,
          plan: "pro",
          status: "active",
          stripe_customer_id: invoice.customer as string,
          stripe_subscription_id: subscriptionId,
          current_period_end: periodEnd,
          updated_at: new Date().toISOString(),
        }, { onConflict: "user_id" });
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
        await supabase.from("launcher_tokens").update({ is_active: false }).eq("user_id", userId);
        console.log("❌ Cancelled:", userId);
        break;
      }
      case "customer.subscription.updated": {
        const sub = event.data.object as any;
        const userId = sub.metadata?.supabase_user_id;
        if (!userId) break;
        console.log("sub.current_period_end:", sub.current_period_end, typeof sub.current_period_end);
        const periodEndRaw = sub.current_period_end;
        const periodEnd =  periodEndRaw 
          ? new Date(typeof periodEndRaw === 'number' ? periodEndRaw * 1000 : periodEndRaw).toISOString() 
          : null;
        await supabase.from("subscriptions").update({
          status: sub.status,
          current_period_end: periodEnd,
          updated_at: new Date().toISOString(),
        }).eq("user_id", userId);
        break;
      }
    }
  } catch (error: any) {
    console.error("Webhook handler error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}
