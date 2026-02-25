"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  Calendar,
  CreditCard,
  MessageSquare,
  ArrowRight,
  CheckCircle2,
  Target,
  PhoneCall,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useKindeBrowserClient } from "@kinde-oss/kinde-auth-nextjs";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";

interface EnterpriseModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function EnterpriseModal({ open, onOpenChange }: EnterpriseModalProps) {
  const { user } = useKindeBrowserClient();
  const router = useRouter();
  const [billingPeriod, setBillingPeriod] = useState<"monthly" | "yearly">(
    "yearly",
  );
  const [step, setStep] = useState<"main" | "purchase" | "sales">("main");

  const handlePurchase = async () => {
    if (!user) {
      router.push("/api/auth/login");
      return;
    }

    try {
      const res = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          plan: "ENTERPRISE",
          billingPeriod: billingPeriod,
          userId: user.id,
        }),
      });

      const data = await res.json();
      if (data.url) window.location.href = data.url;
    } catch (error) {
      console.error("Error during checkout:", error);
    }
  };

  const price = billingPeriod === "monthly" ? "$25" : "$20";
  const totalYearly = billingPeriod === "yearly" ? "$240/year" : null;
  const savings = billingPeriod === "yearly" ? "Save $60/year" : null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[460px] p-0 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800">
        <DialogHeader className="px-6 pt-6 pb-2">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
              <Target className="h-5 w-5 text-gray-700 dark:text-gray-300" />
            </div>
            <DialogTitle className="text-xl font-semibold text-gray-900 dark:text-white">
              Enterprise Plan
            </DialogTitle>
          </div>
        </DialogHeader>

        <div className="px-6 pb-6">
          <AnimatePresence mode="wait">
            {step === "main" && (
              <motion.div
                key="main"
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -5 }}
                transition={{ duration: 0.15 }}
                className="space-y-2"
              >
                <button
                  onClick={() => setStep("purchase")}
                  className="w-full p-4 flex items-center justify-between rounded-lg border border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 transition-colors text-left"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-md bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
                      <CreditCard className="h-4 w-4 text-gray-700 dark:text-gray-300" />
                    </div>
                    <div>
                      <div className="font-medium text-gray-900 dark:text-white">
                        Quick Purchase
                      </div>
                      <div className="text-sm text-gray-500 dark:text-gray-400">
                        Buy now and start immediately
                      </div>
                    </div>
                  </div>
                  <ArrowRight className="h-4 w-4 text-gray-400" />
                </button>

                <button
                  onClick={() => setStep("sales")}
                  className="w-full p-4 flex items-center justify-between rounded-lg border border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 transition-colors text-left"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-md bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
                      <PhoneCall className="h-4 w-4 text-gray-700 dark:text-gray-300" />
                    </div>
                    <div>
                      <div className="font-medium text-gray-900 dark:text-white">
                        Talk to Sales
                      </div>
                      <div className="text-sm text-gray-500 dark:text-gray-400">
                        Get a personalized consultation
                      </div>
                    </div>
                  </div>
                  <ArrowRight className="h-4 w-4 text-gray-400" />
                </button>

                <p className="text-xs text-center text-gray-500 dark:text-gray-400 pt-4">
                  Need help? Our team is here for you
                </p>
              </motion.div>
            )}

            {step === "purchase" && (
              <motion.div
                key="purchase"
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -5 }}
                transition={{ duration: 0.15 }}
                className="space-y-4"
              >
                <button
                  onClick={() => setStep("main")}
                  className="text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300 mb-1"
                >
                  ← Back
                </button>

                <div className="flex gap-1 p-1 bg-gray-100 dark:bg-gray-800 rounded-lg">
                  <button
                    onClick={() => setBillingPeriod("monthly")}
                    className={cn(
                      "flex-1 py-2 text-sm font-medium rounded-md transition-all",
                      billingPeriod === "monthly"
                        ? "bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm"
                        : "text-gray-600 dark:text-gray-400",
                    )}
                  >
                    Monthly
                  </button>
                  <button
                    onClick={() => setBillingPeriod("yearly")}
                    className={cn(
                      "flex-1 py-2 text-sm font-medium rounded-md transition-all relative",
                      billingPeriod === "yearly"
                        ? "bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm"
                        : "text-gray-600 dark:text-gray-400",
                    )}
                  >
                    Yearly
                    <span className="absolute -top-2 -right-2 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 text-[10px] px-1.5 py-0.5 rounded-full border border-green-200 dark:border-green-800">
                      -20%
                    </span>
                  </button>
                </div>

                <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600 dark:text-gray-400">
                      Price
                    </span>
                    <div className="text-right">
                      <span className="text-2xl font-semibold text-gray-900 dark:text-white">
                        {price}
                      </span>
                      <span className="text-sm text-gray-500 ml-1">/month</span>
                    </div>
                  </div>
                  {billingPeriod === "yearly" && (
                    <>
                      <div className="flex justify-between items-center mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
                        <span className="text-sm text-gray-600 dark:text-gray-400">
                          Total/year
                        </span>
                        <span className="font-medium text-gray-900 dark:text-white">
                          {totalYearly}
                        </span>
                      </div>
                      <p className="text-xs text-green-700 dark:text-green-400 mt-2 text-center">
                        ✨ {savings}
                      </p>
                    </>
                  )}
                </div>

                <ul className="space-y-2 text-sm">
                  <li className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                    <CheckCircle2 className="h-4 w-4 text-green-600 dark:text-green-500" />
                    <span>Everything in Pro</span>
                  </li>
                  <li className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                    <CheckCircle2 className="h-4 w-4 text-green-600 dark:text-green-500" />
                    <span>20GB storage</span>
                  </li>
                  <li className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                    <CheckCircle2 className="h-4 w-4 text-green-600 dark:text-green-500" />
                    <span>Dedicated support & SAML/SSO</span>
                  </li>
                </ul>

                <Button
                  onClick={handlePurchase}
                  className="w-full h-11 bg-gray-900 hover:bg-gray-800 dark:bg-white dark:hover:bg-gray-100 dark:text-gray-900 text-white rounded-lg"
                >
                  Purchase Enterprise
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </motion.div>
            )}

            {step === "sales" && (
              <motion.div
                key="sales"
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -5 }}
                transition={{ duration: 0.15 }}
                className="space-y-2"
              >
                <button
                  onClick={() => setStep("main")}
                  className="text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300 mb-1"
                >
                  ← Back
                </button>

                <button
                  onClick={() => {
                    onOpenChange(false);
                    router.push("/contact-sales");
                  }}
                  className="w-full p-4 flex items-center justify-between rounded-lg border border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 transition-colors text-left"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-md bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
                      <MessageSquare className="h-4 w-4 text-gray-700 dark:text-gray-300" />
                    </div>
                    <div>
                      <div className="font-medium text-gray-900 dark:text-white">
                        Contact Sales
                      </div>
                      <div className="text-sm text-gray-500 dark:text-gray-400">
                        General inquiry
                      </div>
                    </div>
                  </div>
                  <ArrowRight className="h-4 w-4 text-gray-400" />
                </button>

                <button
                  onClick={() => {
                    onOpenChange(false);
                    router.push("/book-demo");
                  }}
                  className="w-full p-4 flex items-center justify-between rounded-lg border border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 transition-colors text-left"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-md bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
                      <Calendar className="h-4 w-4 text-gray-700 dark:text-gray-300" />
                    </div>
                    <div>
                      <div className="font-medium text-gray-900 dark:text-white">
                        Book a Demo
                      </div>
                      <div className="text-sm text-gray-500 dark:text-gray-400">
                        See the platform in action
                      </div>
                    </div>
                  </div>
                  <ArrowRight className="h-4 w-4 text-gray-400" />
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </DialogContent>
    </Dialog>
  );
}
