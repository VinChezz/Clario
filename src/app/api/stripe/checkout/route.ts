import Stripe from "stripe";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2026-01-28.clover",
});

export async function POST(req: Request) {
  try {
    const { plan, billingPeriod, userId } = await req.json();

    console.log("Checkout request:", { plan, billingPeriod, userId });

    if (!userId) {
      return NextResponse.json({ error: "User ID required" }, { status: 400 });
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    let priceId: string;

    if (plan === "PRO") {
      priceId =
        billingPeriod === "monthly"
          ? process.env.STRIPE_PRO_PRICE_MONTHLY_ID!
          : process.env.STRIPE_PRO_PRICE_YEARLY_ID!;
    } else if (plan === "ENTERPRISE") {
      priceId =
        billingPeriod === "monthly"
          ? process.env.STRIPE_ENTERPRISE_PRICE_MONTHLY_ID!
          : process.env.STRIPE_ENTERPRISE_PRICE_YEARLY_ID!;
    } else {
      return NextResponse.json({ error: "Invalid plan" }, { status: 400 });
    }

    if (!priceId || priceId === "price_xxxxx") {
      return NextResponse.json(
        { error: "Price ID not configured" },
        { status: 500 },
      );
    }

    let customerId = user.stripeCustomerId;

    if (!customerId) {
      const customer = await stripe.customers.create({
        email: user.email || undefined,
        name: user.name || undefined,
        metadata: {
          userId: user.id,
        },
      });

      customerId = customer.id;

      await prisma.user.update({
        where: { id: user.id },
        data: { stripeCustomerId: customerId },
      });
    }

    const baseUrl = process.env.NEXT_PUBLIC_URL;
    if (!baseUrl) {
      throw new Error("NEXT_PUBLIC_URL is not set");
    }

    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      mode: "subscription",
      payment_method_types: ["card"],
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      success_url: `${baseUrl}/dashboard/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${baseUrl}/pricing?canceled=true`,
      metadata: {
        userId: user.id,
        plan,
        billingPeriod,
      },
    });

    console.log("Checkout session created:", session.id);
    return NextResponse.json({ url: session.url });
  } catch (error: any) {
    console.error("Stripe checkout error:", error);

    if (error.type === "StripeInvalidRequestError") {
      return NextResponse.json(
        {
          error: error.message,
          param: error.param,
          code: error.code,
        },
        { status: 400 },
      );
    }

    return NextResponse.json(
      { error: error.message || "Failed to create checkout session" },
      { status: 500 },
    );
  }
}
