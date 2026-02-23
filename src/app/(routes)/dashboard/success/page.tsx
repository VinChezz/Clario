"use client";

import { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { CheckCircle, Download, ArrowLeft, Mail } from "lucide-react";
import { format } from "date-fns";

export default function PaymentSuccessPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [paymentData, setPaymentData] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [session, setSession] = useState<any>(null);

  const searchParams = useSearchParams();
  const sessionId = searchParams.get("session_id");

  useEffect(() => {
    if (!sessionId) {
      setError("No session ID provided");
      setLoading(false);
      return;
    }

    const fetchPaymentDetails = async () => {
      try {
        const res = await fetch(`/api/stripe/verify?session_id=${sessionId}`);
        const data = await res.json();

        if (data.success) {
          setSession(data.session);

          const session = data.session;
          const amount = session.amount_total
            ? `$${(session.amount_total / 100).toFixed(2)}`
            : "$149.99";
          const date = session.created
            ? format(new Date(session.created * 1000), "MMM d, yyyy")
            : format(new Date(), "MMM d, yyyy");

          setPaymentData({
            amount: amount,
            transactionId:
              sessionId.slice(-12).toUpperCase() || "TXN-789123456",
            cardLast4: "4242",
            date: date,
            merchant: "Clario",
            customerEmail: session.customer_email || "customer@example.com",
            supportEmail: "support@clario.com",
          });
          setLoading(false);
        } else {
          setError("Payment verification failed");
          setLoading(false);
        }
      } catch (err) {
        console.error("Error fetching payment details:", err);
        setError("Failed to load payment details");
        setLoading(false);
      }
    };

    fetchPaymentDetails();
  }, [sessionId]);

  const handleDownloadReceipt = async () => {
    if (!session || !paymentData) {
      console.error("No session or payment data available");
      return;
    }

    try {
      const response = await fetch("/api/receipt/generate-receipt", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          sessionId,
          session,
          paymentData,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to generate receipt");
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `receipt-${paymentData.transactionId}.pdf`;
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Error generating PDF:", error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 dark:bg-gray-900 flex items-center justify-center px-4">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-gray-300 dark:border-gray-700 border-t-green-600 rounded-full animate-spin mx-auto" />
          <p className="mt-4 text-gray-600 dark:text-gray-400">
            Loading payment details...
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-100 dark:bg-gray-900 flex items-center justify-center px-4">
        <div className="w-full max-w-lg bg-white dark:bg-gray-800 rounded-3xl shadow-xl p-8 text-center">
          <div className="w-20 h-20 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg
              className="w-10 h-10 text-red-600 dark:text-red-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            Error
          </h1>
          <p className="text-gray-500 dark:text-gray-400 mb-6">{error}</p>
          <button
            onClick={() => router.push("/pricing")}
            className="w-full bg-black dark:bg-white dark:text-black text-white py-3 rounded-xl font-semibold hover:bg-gray-900 dark:hover:bg-gray-100 transition"
          >
            Back to Pricing
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900 flex items-center justify-center px-4">
      <div className="w-full max-w-lg bg-white dark:bg-gray-800 rounded-3xl shadow-xl dark:shadow-2xl p-8 transition-colors">
        <div className="flex justify-center mb-6">
          <div className="w-20 h-20 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center">
            <CheckCircle className="w-10 h-10 text-green-600 dark:text-green-400" />
          </div>
        </div>

        <h1 className="text-3xl font-bold text-center text-green-600 dark:text-green-400 mb-3">
          Payment Successful!
        </h1>

        <p className="text-center text-gray-500 dark:text-gray-400 mb-8">
          Your payment has been processed successfully. You will receive a
          confirmation email shortly.
        </p>

        <div className="bg-gray-50 dark:bg-gray-900/50 rounded-2xl p-6 space-y-4 mb-6">
          <div className="flex justify-between">
            <span className="text-gray-500 dark:text-gray-400">Amount</span>
            <span className="font-semibold text-xl text-gray-900 dark:text-white">
              {paymentData?.amount}
            </span>
          </div>

          <hr className="border-gray-200 dark:border-gray-700" />

          <div className="flex justify-between items-center">
            <span className="text-gray-500 dark:text-gray-400">
              Transaction ID
            </span>
            <span className="bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 px-3 py-1 rounded-full text-sm font-mono">
              {paymentData?.transactionId}
            </span>
          </div>

          <div className="flex justify-between">
            <span className="text-gray-500 dark:text-gray-400">
              Payment Method
            </span>
            <span className="text-gray-900 dark:text-white text-lg">
              **** {paymentData?.cardLast4}
            </span>
          </div>

          <div className="flex justify-between">
            <span className="text-gray-500 dark:text-gray-400">Date</span>
            <span className="text-gray-900 dark:text-white text-lg">
              {paymentData?.date}
            </span>
          </div>

          <div className="flex justify-between">
            <span className="text-gray-500 dark:text-gray-400">Merchant</span>
            <span className="text-gray-900 dark:text-white text-lg">
              {paymentData?.merchant}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-3 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 px-4 py-3 rounded-xl mb-6">
          <Mail className="w-5 h-5 shrink-0" />
          <span className="text-sm">
            Receipt sent to {paymentData?.customerEmail}
          </span>
        </div>

        <div className="space-y-4">
          <button
            onClick={handleDownloadReceipt}
            className="w-full bg-black dark:bg-white text-white dark:text-black py-3 rounded-xl font-semibold flex items-center justify-center gap-2 hover:bg-gray-900 dark:hover:bg-gray-100 transition cursor-pointer"
          >
            <Download className="w-5 h-5" />
            Download Receipt (PDF)
          </button>

          <Link
            href="/dashboard"
            className="w-full border border-gray-300 dark:border-gray-600 py-3 rounded-xl font-semibold flex items-center justify-center gap-2 hover:bg-gray-50 dark:hover:bg-gray-700 transition text-gray-900 dark:text-white"
          >
            <ArrowLeft className="w-5 h-5" />
            Return to Dashboard
          </Link>
        </div>

        <p className="text-center text-gray-400 dark:text-gray-500 text-sm mt-8">
          Need help? Contact our support team at{" "}
          <a
            href={`mailto:${paymentData?.supportEmail}`}
            className="text-blue-600 dark:text-blue-400 hover:underline"
          >
            {paymentData?.supportEmail}
          </a>
        </p>
      </div>
    </div>
  );
}
