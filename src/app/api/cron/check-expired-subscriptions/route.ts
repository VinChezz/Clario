import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { Plan } from "@prisma/client";

export async function POST() {
  try {
    const now = new Date();

    console.log(
      `🔍 Checking for expired subscriptions at ${now.toISOString()}`,
    );

    const expiredUsers = await prisma.user.findMany({
      where: {
        plan: { not: Plan.FREE },
        currentPeriodEnd: { lt: now },
        stripeSubscriptionId: { not: null },
      },
    });

    if (expiredUsers.length === 0) {
      return NextResponse.json({
        success: true,
        message: "No expired subscriptions found",
        processed: 0,
      });
    }

    const results = [];

    for (const user of expiredUsers) {
      try {
        await prisma.user.update({
          where: { id: user.id },
          data: {
            plan: Plan.FREE,
            subscriptionStatus: "expired",
            stripeSubscriptionId: null,
            storageLimitBytes: BigInt(2 * 1024 ** 3),
          },
        });

        results.push({
          userId: user.id,
          email: user.email,
          status: "downgraded to FREE",
        });

        console.log(
          `✅ User ${user.id} (${user.email}) downgraded to FREE plan`,
        );
      } catch (error) {
        console.error(`❌ Error downgrading user ${user.id}:`, error);
        results.push({
          userId: user.id,
          email: user.email,
          status: "error",
          error: String(error),
        });
      }
    }

    return NextResponse.json({
      success: true,
      message: `Processed ${results.length} expired subscriptions`,
      processed: results.length,
      results,
    });
  } catch (error) {
    console.error("Error checking expired subscriptions:", error);
    return NextResponse.json(
      { error: "Failed to check expired subscriptions" },
      { status: 500 },
    );
  }
}

export async function GET() {
  return POST();
}
