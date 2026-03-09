import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getKindeServerSession } from "@kinde-oss/kinde-auth-nextjs/server";
import Stripe from "stripe";
import { Plan } from "@prisma/client";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2026-02-25.clover",
});

export async function GET(req: NextRequest) {
  try {
    const { getUser } = getKindeServerSession();
    const user = await getUser();

    if (!user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const dbUser = await prisma.user.findUnique({
      where: { email: user.email },
    });

    if (!dbUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    let plan = dbUser.plan;
    let subscriptionStatus = dbUser.subscriptionStatus;
    let currentPeriodEnd = dbUser.currentPeriodEnd;

    if (dbUser.stripeSubscriptionId && dbUser.plan !== Plan.FREE) {
      try {
        const subscription = await stripe.subscriptions.retrieve(
          dbUser.stripeSubscriptionId,
        );

        const subscriptionAny = subscription as any;
        const currentPeriodEndTimestamp =
          subscriptionAny.current_period_end ||
          subscriptionAny.items?.data?.[0]?.current_period_end;

        if (currentPeriodEndTimestamp) {
          const stripeCurrentPeriodEnd = new Date(
            currentPeriodEndTimestamp * 1000,
          );
          const now = new Date();

          if (
            stripeCurrentPeriodEnd < now ||
            subscription.status !== "active"
          ) {
            console.log(
              `⚠️ Subscription ${dbUser.stripeSubscriptionId} expired for user ${dbUser.id}`,
            );

            await prisma.user.update({
              where: { id: dbUser.id },
              data: {
                plan: Plan.FREE,
                subscriptionStatus: "expired",
                stripeSubscriptionId: null,
                storageLimitBytes: BigInt(2 * 1024 ** 3),
              },
            });

            plan = Plan.FREE;
            subscriptionStatus = "expired";
            currentPeriodEnd = null;
          } else {
            if (
              stripeCurrentPeriodEnd.getTime() !==
              dbUser.currentPeriodEnd?.getTime()
            ) {
              await prisma.user.update({
                where: { id: dbUser.id },
                data: {
                  currentPeriodEnd: stripeCurrentPeriodEnd,
                },
              });
              currentPeriodEnd = stripeCurrentPeriodEnd;
            }
          }
        }
      } catch (error) {
        console.error("Error checking subscription status:", error);

        await prisma.user.update({
          where: { id: dbUser.id },
          data: {
            plan: Plan.FREE,
            subscriptionStatus: "invalid",
            stripeSubscriptionId: null,
            storageLimitBytes: BigInt(2 * 1024 ** 3),
          },
        });

        plan = Plan.FREE;
        subscriptionStatus = "invalid";
        currentPeriodEnd = null;
      }
    }

    return NextResponse.json({
      plan,
      subscriptionStatus,
      currentPeriodEnd,
      message:
        plan === Plan.FREE
          ? "You are on FREE plan"
          : "Your subscription is active",
    });
  } catch (error) {
    console.error("Error checking subscription status:", error);
    return NextResponse.json(
      { error: "Failed to check subscription status" },
      { status: 500 },
    );
  }
}
