import Stripe from "stripe";
import { prisma } from "@/lib/prisma";
import { headers } from "next/headers";
import { Plan } from "@prisma/client";
import { sendPaymentSuccessEmail } from "@/lib/email/sendPaymentSuccessEmail";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2026-02-25.clover",
});

export async function POST(req: Request) {
  const body = await req.text();
  const sig = (await headers()).get("stripe-signature")!;

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(
      body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET!,
    );
  } catch (err: any) {
    console.error("❌ Webhook signature verification failed:", err);
    return new Response(`Webhook error: ${err.message}`, { status: 400 });
  }

  console.log(`✅ Webhook received: ${event.type}`);

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as any;

        console.log("🔍 Session metadata:", session.metadata);

        const userId = session.metadata?.userId;
        const plan = session.metadata?.plan as Plan;
        const billingPeriod = session.metadata?.billingPeriod;

        if (!userId) {
          console.error("❌ No userId in session metadata");
          return new Response("No user", { status: 400 });
        }

        if (!plan) {
          console.error("❌ No plan in session metadata");
          return new Response("No plan", { status: 400 });
        }

        console.log("🔍 Looking for user with id:", userId);

        const user = await prisma.user.findUnique({
          where: {
            id: userId,
          },
        });

        if (!user) {
          console.error("❌ User not found with id:", userId);
          return new Response("User not found", { status: 404 });
        }

        console.log("✅ Found user in database:", user.id);

        const subscription = (await stripe.subscriptions.retrieve(
          session.subscription,
        )) as any;

        console.log("🔍 Subscription items:", subscription.items?.data);

        const currentPeriodEnd =
          subscription.items?.data?.[0]?.current_period_end;

        if (!currentPeriodEnd) {
          console.error("❌ No current_period_end in subscription items");
          return new Response("No current_period_end", { status: 400 });
        }

        console.log("✅ Found current_period_end:", currentPeriodEnd);

        const updatedUser = await prisma.user.update({
          where: { id: user.id },
          data: {
            plan,
            stripeSubscriptionId: subscription.id,
            stripeCustomerId: session.customer,
            subscriptionStatus: subscription.status,
            currentPeriodEnd: new Date(currentPeriodEnd * 1000),
            storageLimitBytes:
              plan === "PRO" ? BigInt(10 * 1024 ** 3) : BigInt(20 * 1024 ** 3),
          },
        });

        console.log(`✅ User ${user.id} upgraded to ${plan} plan`);

        try {
          const planName = plan === "PRO" ? "Pro Plan" : "Enterprise Plan";
          const amount = session.amount_total
            ? `$${(session.amount_total / 100).toFixed(2)}`
            : "$0.00";
          const date = session.created
            ? new Date(session.created * 1000).toLocaleDateString("en-US", {
                year: "numeric",
                month: "long",
                day: "numeric",
              })
            : new Date().toLocaleDateString();

          const downloadLink = `${process.env.NEXT_PUBLIC_URL}/api/receipt/generate-receipt?session_id=${session.id}`;

          if (updatedUser.email) {
            await sendPaymentSuccessEmail({
              to: updatedUser.email,
              customerName: updatedUser.name || "Valued Customer",
              planName,
              amount,
              date,
              transactionId: session.id.slice(-12).toUpperCase(),
              downloadLink,
            });

            console.log(
              `✅ Payment confirmation email sent to ${updatedUser.email}`,
            );
          } else {
            console.warn("⚠️ User has no email, skipping email notification");
          }
        } catch (emailError) {
          console.error(
            "❌ Failed to send payment confirmation email:",
            emailError,
          );
        }

        break;
      }

      case "customer.subscription.updated": {
        const subscription = event.data.object as any;

        console.log("🔍 Subscription updated:", {
          id: subscription.id,
          status: subscription.status,
          current_period_end: subscription.current_period_end,
          cancel_at_period_end: subscription.cancel_at_period_end,
        });

        const currentPeriodEnd =
          subscription.items?.data?.[0]?.current_period_end ||
          subscription.current_period_end;

        if (!currentPeriodEnd) {
          console.error("❌ No current_period_end in subscription");
          return new Response("No current_period_end", { status: 400 });
        }

        let newPlan: Plan;
        let subscriptionStatus: string;
        let updateData: any = {
          subscriptionStatus: subscription.status,
          currentPeriodEnd: new Date(currentPeriodEnd * 1000),
        };

        if (
          subscription.status === "canceled" ||
          subscription.status === "past_due"
        ) {
          newPlan = Plan.FREE;
          subscriptionStatus = "canceled";
          updateData = {
            ...updateData,
            plan: Plan.FREE,
            stripeSubscriptionId: null,
            storageLimitBytes: BigInt(2 * 1024 ** 3),
          };
        } else {
          newPlan = Plan.PRO;
          subscriptionStatus = subscription.status;
        }

        await prisma.user.updateMany({
          where: { stripeSubscriptionId: subscription.id },
          data: updateData,
        });

        console.log(
          `✅ Subscription ${subscription.id} updated to status: ${subscription.status}`,
        );
        break;
      }

      case "customer.subscription.deleted": {
        const subscription = event.data.object as any;

        console.log("🔍 Subscription deleted:", subscription.id);

        await prisma.user.updateMany({
          where: { stripeSubscriptionId: subscription.id },
          data: {
            plan: Plan.FREE,
            subscriptionStatus: "canceled",
            stripeSubscriptionId: null,
            storageLimitBytes: BigInt(2 * 1024 ** 3),
          },
        });

        console.log(
          `✅ Subscription ${subscription.id} cancelled and reverted to FREE plan`,
        );
        break;
      }

      case "invoice.payment_succeeded": {
        const invoice = event.data.object as any;

        if (invoice.subscription) {
          const subscription = (await stripe.subscriptions.retrieve(
            invoice.subscription,
          )) as any;

          const currentPeriodEnd =
            subscription.items?.data?.[0]?.current_period_end;

          if (!currentPeriodEnd) {
            console.error("❌ No current_period_end in subscription items");
            return new Response("No current_period_end", { status: 400 });
          }

          await prisma.user.updateMany({
            where: { stripeSubscriptionId: subscription.id },
            data: {
              subscriptionStatus: subscription.status,
              currentPeriodEnd: new Date(currentPeriodEnd * 1000),
            },
          });

          console.log(
            `✅ Payment succeeded for subscription ${subscription.id}`,
          );
        }
        break;
      }

      case "invoice.payment_failed": {
        const invoice = event.data.object as any;

        if (invoice.subscription) {
          console.log(
            `❌ Payment failed for subscription ${invoice.subscription}`,
          );

          await prisma.user.updateMany({
            where: { stripeSubscriptionId: invoice.subscription },
            data: {
              subscriptionStatus: "past_due",
            },
          });
        }
        break;
      }

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }
  } catch (error: any) {
    console.error("❌ Error processing webhook:", {
      error: error.message,
      stack: error.stack,
    });
    return new Response(`Webhook error: ${error.message}`, { status: 500 });
  }

  return new Response("OK", { status: 200 });
}
