"use client";

import { useRouter } from "next/navigation";
import { XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function PaymentCancelPage() {
  const router = useRouter();

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white dark:bg-[#1a1a1c] rounded-3xl shadow-2xl p-8 text-center border border-gray-200 dark:border-[#2a2a2d]">
        <div className="w-20 h-20 bg-yellow-100 dark:bg-yellow-900/30 rounded-full flex items-center justify-center mx-auto mb-6">
          <XCircle className="h-10 w-10 text-yellow-600 dark:text-yellow-400" />
        </div>

        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
          Payment Cancelled
        </h1>

        <p className="text-gray-600 dark:text-gray-400 mb-8">
          Your payment was cancelled. No charges were made.
        </p>

        <div className="space-y-3">
          <Button
            onClick={() => router.push("/pricing")}
            className="w-full bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 text-white py-6 text-lg"
          >
            Back to Pricing
          </Button>

          <Button
            variant="outline"
            onClick={() => router.push("/dashboard")}
            className="w-full border-gray-300 dark:border-[#2a2a2d]"
          >
            Go to Dashboard
          </Button>
        </div>

        <p className="text-sm text-gray-500 dark:text-gray-400 mt-6">
          If you encountered any issues, please contact support.
        </p>
      </div>
    </div>
  );
}
