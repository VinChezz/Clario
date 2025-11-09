"use client";

import { Button } from "@/components/ui/button";
import {
  Check,
  Crown,
  Star,
  Zap,
  Users,
  FileText,
  Cloud,
  Shield,
  Globe,
  BadgeCheck,
} from "lucide-react";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";

export default function PricingPage() {
  const [billingPeriod, setBillingPeriod] = useState<"monthly" | "yearly">(
    "monthly"
  );
  const router = useRouter();

  const plans = [
    {
      name: "Free",
      description: "Perfect for getting started",
      price: {
        monthly: "$0",
        yearly: "$0",
      },
      period: {
        monthly: "forever",
        yearly: "forever",
      },
      popular: false,
      features: [
        "Up to 10 files",
        "Basic collaboration",
        "2GB storage",
        "Standard support",
        "Public sharing",
      ],
      buttonText: "Get Started",
      buttonVariant: "outline" as const,
      highlighted: false,
      buttonColor:
        "bg-gray-100 hover:bg-gray-200 text-gray-900 border-gray-300",
    },
    {
      name: "Pro",
      description: "For teams and professionals",
      price: {
        monthly: "$10",
        yearly: "$8",
      },
      period: {
        monthly: "per month",
        yearly: "per month",
      },
      popular: true,
      features: [
        "Unlimited files",
        "Advanced collaboration",
        "100GB storage",
        "Priority support",
        "Private sharing",
        "Custom branding",
        "Advanced analytics",
        "API access",
      ],
      buttonText: "Upgrade to Pro",
      buttonVariant: "default" as const,
      highlighted: true,
      buttonColor:
        "bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white",
    },
    {
      name: "Enterprise",
      description: "For large organizations",
      price: {
        monthly: "$25",
        yearly: "$20",
      },
      period: {
        monthly: "per month",
        yearly: "per month",
      },
      popular: false,
      features: [
        "Everything in Pro",
        "Unlimited storage",
        "Dedicated support",
        "SAML/SSO",
        "Custom contracts",
        "On-premise deployment",
        "Training & onboarding",
        "99.9% SLA",
      ],
      buttonText: "Contact Sales",
      buttonVariant: "outline" as const,
      highlighted: false,
      buttonColor: "bg-blue-50 hover:bg-blue-100 text-blue-700 border-blue-300",
    },
  ];

  const features = [
    {
      icon: FileText,
      title: "Unlimited Files",
      description: "Create as many files as you need without restrictions",
    },
    {
      icon: Users,
      title: "Team Collaboration",
      description: "Work together with your team in real-time",
    },
    {
      icon: Cloud,
      title: "Cloud Storage",
      description: "Secure cloud storage with automatic backups",
    },
    {
      icon: Shield,
      title: "Advanced Security",
      description: "Enterprise-grade security and compliance",
    },
    {
      icon: Globe,
      title: "Global Access",
      description: "Access your files from anywhere in the world",
    },
    {
      icon: BadgeCheck,
      title: "Priority Support",
      description: "Get help when you need it with priority support",
    },
  ];

  const handleUpgrade = (plan: string) => {
    if (plan === "Pro") {
      // logic for payment
      console.log("Upgrading to Pro plan");
    } else if (plan === "Enterprise") {
      router.push("/contact");
    }
  };

  return (
    <div className="min-h-screen bg-linear-to-br from-gray-50 to-blue-50/30 py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <div className="flex justify-center mb-4">
            <div className="inline-flex items-center gap-2 bg-blue-100 text-blue-700 px-4 py-2 rounded-full text-sm font-medium">
              <Crown className="h-4 w-4" />
              Choose Your Plan
            </div>
          </div>
          <h1 className="text-4xl lg:text-5xl font-bold text-gray-900 mb-4">
            Simple, Transparent Pricing
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Start free and scale as you grow. No hidden fees, no surprises.
          </p>
        </motion.div>

        {/* Billing Toggle */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="flex justify-center mb-12"
        >
          <div className="bg-white rounded-2xl p-2 shadow-sm border border-gray-200 inline-flex">
            <button
              onClick={() => setBillingPeriod("monthly")}
              className={`px-6 py-3 rounded-xl font-medium transition-all duration-200 ${
                billingPeriod === "monthly"
                  ? "bg-blue-600 text-white shadow-sm"
                  : "text-gray-600 hover:text-gray-900"
              }`}
            >
              Monthly
            </button>
            <button
              onClick={() => setBillingPeriod("yearly")}
              className={`px-6 py-3 rounded-xl font-medium transition-all duration-200 flex items-center gap-2 ${
                billingPeriod === "yearly"
                  ? "bg-blue-600 text-white shadow-sm"
                  : "text-gray-600 hover:text-gray-900"
              }`}
            >
              Yearly
              <span className="bg-green-100 text-green-700 text-xs px-2 py-1 rounded-full">
                Save 20%
              </span>
            </button>
          </div>
        </motion.div>

        {/* Pricing Cards */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-20"
        >
          {plans.map((plan, index) => (
            <motion.div
              key={plan.name}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3 + index * 0.1 }}
              className={`relative rounded-3xl p-8 ${
                plan.highlighted
                  ? "bg-white border-2 border-blue-500 shadow-xl scale-105"
                  : "bg-white border border-gray-200 shadow-sm"
              }`}
            >
              {/* Popular Badge */}
              {plan.popular && (
                <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                  <div className="bg-linear-to-r from-blue-600 to-indigo-600 text-white px-4 py-2 rounded-full text-sm font-medium flex items-center gap-2 shadow-lg">
                    <Star className="h-4 w-4 fill-current" />
                    Most Popular
                  </div>
                </div>
              )}

              <div className="text-center mb-8">
                <h3 className="text-2xl font-bold text-gray-900 mb-2">
                  {plan.name}
                </h3>
                <p className="text-gray-600 mb-6">{plan.description}</p>

                <div className="mb-4">
                  <span className="text-4xl lg:text-5xl font-bold text-gray-900">
                    {billingPeriod === "monthly"
                      ? plan.price.monthly
                      : plan.price.yearly}
                  </span>
                  <span className="text-gray-600 ml-2">
                    {billingPeriod === "monthly"
                      ? plan.period.monthly
                      : plan.period.yearly}
                  </span>
                </div>

                {billingPeriod === "yearly" && plan.name !== "Free" && (
                  <p className="text-green-600 text-sm font-medium">
                    Billed annually ($
                    {billingPeriod === "yearly"
                      ? parseInt(plan.price.yearly.replace("$", "")) * 12
                      : parseInt(plan.price.monthly.replace("$", "")) * 12}{" "}
                    total)
                  </p>
                )}
              </div>

              <Button
                className={`w-full py-3 text-lg font-semibold transition-all duration-200 ${plan.buttonColor}`}
                variant={plan.buttonVariant}
                onClick={() => handleUpgrade(plan.name)}
              >
                {plan.buttonText}
              </Button>

              <ul className="mt-8 space-y-4">
                {plan.features.map((feature, featureIndex) => (
                  <li key={featureIndex} className="flex items-start gap-3">
                    <Check className="h-5 w-5 text-green-500 mt-0.5 shrink-0" />
                    <span className="text-gray-700">{feature}</span>
                  </li>
                ))}
              </ul>
            </motion.div>
          ))}
        </motion.div>

        {/* Features Grid */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="mb-20"
        >
          <div className="text-center mb-12">
            <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-4">
              Everything You Need to Succeed
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Powerful features designed to help you and your team work better,
              faster, and smarter.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.5 + index * 0.1 }}
                className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200 hover:shadow-md transition-shadow duration-300"
              >
                <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center mb-4">
                  <feature.icon className="h-6 w-6 text-blue-600" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  {feature.title}
                </h3>
                <p className="text-gray-600 leading-relaxed">
                  {feature.description}
                </p>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* FAQ Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.6 }}
          className="bg-white rounded-3xl p-8 lg:p-12 shadow-sm border border-gray-200"
        >
          <div className="text-center mb-12">
            <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-4">
              Frequently Asked Questions
            </h2>
            <p className="text-xl text-gray-600">
              Get answers to the most common questions about our plans
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 max-w-4xl mx-auto">
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  Can I change plans later?
                </h3>
                <p className="text-gray-600">
                  Yes, you can upgrade or downgrade your plan at any time.
                  Changes take effect immediately.
                </p>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  Is there a free trial?
                </h3>
                <p className="text-gray-600">
                  Our Free plan is always free. For Pro features, we offer a
                  14-day free trial with no credit card required.
                </p>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  What payment methods do you accept?
                </h3>
                <p className="text-gray-600">
                  We accept all major credit cards, PayPal, and bank transfers
                  for annual plans.
                </p>
              </div>
            </div>
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  Can I cancel anytime?
                </h3>
                <p className="text-gray-600">
                  Yes, you can cancel your subscription at any time. You'll
                  continue to have access until the end of your billing period.
                </p>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  Do you offer discounts for nonprofits?
                </h3>
                <p className="text-gray-600">
                  Yes, we offer a 50% discount for registered nonprofit
                  organizations. Contact our sales team for more information.
                </p>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  Is my data secure?
                </h3>
                <p className="text-gray-600">
                  We use enterprise-grade security with encryption at rest and
                  in transit, and comply with major data protection regulations.
                </p>
              </div>
            </div>
          </div>
        </motion.div>

        {/* CTA Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.7 }}
          className="text-center mt-16"
        >
          <div className="bg-linear-to-r from-blue-600 to-indigo-600 rounded-3xl p-8 lg:p-12 text-white">
            <Zap className="h-12 w-12 mx-auto mb-4" />
            <h2 className="text-3xl lg:text-4xl font-bold mb-4">
              Ready to Get Started?
            </h2>
            <p className="text-blue-100 text-xl mb-8 max-w-2xl mx-auto">
              Join thousands of teams already using our platform to streamline
              their workflow and boost productivity.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button
                size="lg"
                className="bg-white text-blue-600 hover:bg-gray-100 font-semibold text-lg px-8 py-3"
                onClick={() => handleUpgrade("Pro")}
              >
                Start Free Trial
              </Button>
              <Button
                size="lg"
                className="bg-white text-blue-600 hover:bg-gray-100 font-semibold text-lg px-8 py-3"
                onClick={() => router.push("/contact")}
              >
                Contact Sales
              </Button>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
