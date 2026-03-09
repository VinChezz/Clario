import { NextRequest, NextResponse } from "next/server";
import { renderToBuffer } from "@react-pdf/renderer";
import { ReceiptPDF } from "@/components/ReceiptPDF";
import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2026-02-25.clover",
});

export async function POST(req: NextRequest) {
  return handleRequest(req);
}

export async function GET(req: NextRequest) {
  return handleRequest(req);
}

async function handleRequest(req: NextRequest) {
  try {
    let sessionId, session, paymentData;

    if (req.method === "GET") {
      const url = new URL(req.url);
      sessionId = url.searchParams.get("session_id");

      if (!sessionId) {
        return NextResponse.json(
          { error: "Session ID required" },
          { status: 400 },
        );
      }

      const fullSession = await stripe.checkout.sessions.retrieve(sessionId, {
        expand: ["customer", "line_items"],
      });

      session = fullSession;
      paymentData = {
        transactionId: sessionId.slice(-12).toUpperCase(),
        cardLast4: "4242",
        customerEmail:
          fullSession.customer_email ||
          fullSession.customer_details?.email ||
          "customer@example.com",
      };
    } else {
      // Для POST запроса - получаем данные из тела
      const body = await req.json();
      sessionId = body.sessionId;
      session = body.session;
      paymentData = body.paymentData;
    }

    console.log("Generating receipt for session:", sessionId);

    const fullSession = await stripe.checkout.sessions.retrieve(sessionId, {
      expand: ["subscription", "invoice", "payment_intent"],
    });

    console.log("Full session retrieved:", {
      id: fullSession.id,
      subscription: fullSession.subscription
        ? typeof fullSession.subscription
        : "none",
      invoice: fullSession.invoice ? typeof fullSession.invoice : "none",
      payment_intent: fullSession.payment_intent
        ? typeof fullSession.payment_intent
        : "none",
    });

    let subscription = null;
    if (fullSession.subscription) {
      const subscriptionId =
        typeof fullSession.subscription === "string"
          ? fullSession.subscription
          : fullSession.subscription.id;

      if (subscriptionId) {
        subscription = await stripe.subscriptions.retrieve(subscriptionId, {
          expand: ["items.data.price.product"],
        });
      }
    }

    let paymentIntent = null;
    let paymentIntentId = "N/A";

    if (fullSession.payment_intent) {
      const paymentIntentIdValue =
        typeof fullSession.payment_intent === "string"
          ? fullSession.payment_intent
          : fullSession.payment_intent.id;

      if (paymentIntentIdValue) {
        try {
          paymentIntent =
            await stripe.paymentIntents.retrieve(paymentIntentIdValue);
          paymentIntentId = paymentIntent.id;
        } catch (error) {
          console.error("Error retrieving payment intent:", error);
        }
      }
    } else if (fullSession.subscription) {
      const subscriptionId =
        typeof fullSession.subscription === "string"
          ? fullSession.subscription
          : fullSession.subscription.id;

      if (subscriptionId) {
        try {
          const invoices = await stripe.invoices.list({
            subscription: subscriptionId,
            limit: 1,
          });

          if (invoices.data.length > 0) {
            const invoice = invoices.data[0] as any;
            if (invoice.payment_intent) {
              const paymentIntentIdValue =
                typeof invoice.payment_intent === "string"
                  ? invoice.payment_intent
                  : invoice.payment_intent.id;

              if (paymentIntentIdValue) {
                paymentIntent =
                  await stripe.paymentIntents.retrieve(paymentIntentIdValue);
                paymentIntentId = paymentIntent.id;
              }
            }
          }
        } catch (error) {
          console.error("Error retrieving invoices:", error);
        }
      }
    }

    if (paymentIntentId === "N/A" && fullSession.subscription) {
      try {
        const subscriptionId =
          typeof fullSession.subscription === "string"
            ? fullSession.subscription
            : fullSession.subscription.id;

        const subscription =
          await stripe.subscriptions.retrieve(subscriptionId);

        if (subscription.latest_invoice) {
          const invoice = await stripe.invoices.retrieve(
            subscription.latest_invoice as string,
          );
          const invoiceAny = invoice as any;
          if (invoiceAny.payment_intent) {
            paymentIntentId =
              typeof invoiceAny.payment_intent === "string"
                ? invoiceAny.payment_intent
                : invoiceAny.payment_intent.id;
          }
        }
      } catch (error) {
        console.error("Error retrieving subscription details:", error);
      }
    }

    const amountTotal = fullSession.amount_total || 0;
    const currency = fullSession.currency?.toUpperCase() || "USD";

    const paymentDate = fullSession.created
      ? new Date(fullSession.created * 1000)
      : new Date();

    let paymentMethodType = "Card";
    let cardLast4 = paymentData.cardLast4 || "4242";

    if (paymentIntent?.payment_method_types) {
      paymentMethodType = paymentIntent.payment_method_types[0] || "Card";
    }

    const receiptData = {
      companyName: "Clario",
      supportEmail: "support@clario.com",
      companyAddress: "123 Innovation Drive, San Francisco, CA 94107",
      receiptNumber: `INV-2024-${sessionId?.slice(-6) || "000123"}`,
      transactionId: paymentData.transactionId,
      paymentIntentId: paymentIntentId,
      date: paymentDate,
      paymentMethod: `${paymentMethodType} **** ${cardLast4}`,
      currency: currency,
      customerName:
        fullSession.customer_details?.name ||
        paymentData.customerEmail.split("@")[0] ||
        "Valued Customer",
      customerEmail:
        fullSession.customer_details?.email || paymentData.customerEmail,
      billingAddress: fullSession.customer_details?.address
        ? [
            fullSession.customer_details.address.line1,
            fullSession.customer_details.address.line2,
            fullSession.customer_details.address.city,
            fullSession.customer_details.address.state,
            fullSession.customer_details.address.postal_code,
            fullSession.customer_details.address.country,
          ]
            .filter(Boolean)
            .join(", ")
        : undefined,
      items: [
        {
          name:
            fullSession.metadata?.plan === "PRO"
              ? "Pro Plan"
              : "Enterprise Plan",
          description: `${fullSession.metadata?.billingPeriod || "monthly"} subscription`,
          quantity: 1,
          unitPrice: amountTotal ? amountTotal / 100 : 0,
          tax: 0,
          total: amountTotal ? amountTotal / 100 : 0,
        },
      ],
      subtotal: amountTotal ? amountTotal / 100 : 0,
      taxTotal: 0,
      total: amountTotal ? amountTotal / 100 : 0,
      isTestMode: fullSession.livemode === false,
      vatId: "VAT123456789",
      registrationNumber: "REG987654321",
    };

    console.log("Generated receipt data:", receiptData);

    if (!receiptData) {
      throw new Error("Receipt data is undefined");
    }

    const pdfBuffer = await renderToBuffer(<ReceiptPDF data={receiptData} />);

    return new NextResponse(new Uint8Array(pdfBuffer), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="receipt-${paymentData.transactionId}.pdf"`,
      },
    });
  } catch (error) {
    console.error("Error generating PDF:", error);
    return NextResponse.json(
      {
        error:
          "Failed to generate PDF: " +
          (error instanceof Error ? error.message : String(error)),
      },
      { status: 500 },
    );
  }
}
