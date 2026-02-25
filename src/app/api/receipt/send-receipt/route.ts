import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { sendPaymentSuccessEmail } from "@/lib/email/sendPaymentSuccessEmail";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2026-01-28.clover",
});

export async function POST(req: NextRequest) {
  try {
    const { sessionId, email } = await req.json();

    const session = await stripe.checkout.sessions.retrieve(sessionId, {
      expand: ["customer", "line_items"],
    });

    const planName =
      session.metadata?.plan === "PRO" ? "Pro Plan" : "Enterprise Plan";

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

    await sendPaymentSuccessEmail({
      to: email,
      customerName: session.customer_details?.name || "Valued Customer",
      planName,
      amount,
      date,
      transactionId: sessionId.slice(-12).toUpperCase(),
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error sending receipt:", error);
    return NextResponse.json(
      { error: "Failed to send receipt" },
      { status: 500 },
    );
  }
}
