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
  Sparkles,
  ArrowRight,
  ChevronRight,
  Rocket,
  Target,
  Heart,
  ArrowLeft,
} from "lucide-react";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence, Variants } from "framer-motion";
import { useKindeBrowserClient } from "@kinde-oss/kinde-auth-nextjs";
import NotFound from "@/app/not-found";
import { EnterpriseModal } from "@/components/EnterpriseModal";

export default function PricingPage() {
  const [billingPeriod, setBillingPeriod] = useState<"monthly" | "yearly">(
    "monthly",
  );
  const [hoveredPlan, setHoveredPlan] = useState<string | null>(null);
  const [isVisible, setIsVisible] = useState(false);
  const [enterpriseModalOpen, setEnterpriseModalOpen] = useState(false);
  const router = useRouter();
  const { user } = useKindeBrowserClient();

  useEffect(() => {
    setIsVisible(true);
  }, []);

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
        "Basic collaboration",
        "2GB storage",
        "Standard support",
        "Public sharing",
      ],
      buttonText: "Get Started",
      highlighted: false,
      icon: Sparkles,
      color: "from-gray-500 to-gray-600",
      darkColor: "from-gray-400 to-gray-500",
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
        "10GB storage",
        "Advanced collaboration",
        "Priority support",
        "Private sharing",
        "Custom branding",
        "Advanced analytics",
      ],
      buttonText: "Upgrade to Pro",
      highlighted: true,
      icon: Rocket,
      color: "from-blue-500 to-indigo-500",
      darkColor: "from-blue-400 to-indigo-400",
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
        "20GB storage",
        "Dedicated support",
        "SAML/SSO",
        "Custom contracts",
        "On-premise deployment",
        "Training & onboarding",
      ],
      buttonText: "Contact Sales",
      highlighted: false,
      icon: Target,
      color: "from-purple-500 to-pink-500",
      darkColor: "from-purple-400 to-pink-400",
    },
  ];

  const features = [
    {
      icon: FileText,
      title: "Flexible Storage Plans",
      description: "Choose the storage limit that fits your needs",
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

  const faqs = [
    {
      question: "Can I change plans later?",
      answer:
        "Yes, you can upgrade or downgrade your plan at any time. Changes take effect immediately.",
    },
    {
      question: "Is there a free trial?",
      answer:
        "Currently, we do not offer a 14-day free trial for the Pro plan. Our Free plan is always available at no cost.",
    },
    {
      question: "What payment methods do you accept?",
      answer:
        "We accept all major credit cards, PayPal, and bank transfers for annual plans.",
    },
    {
      question: "Can I cancel anytime?",
      answer:
        "Yes, you can cancel your subscription at any time. You'll continue to have access until the end of your billing period.",
    },
    {
      question: "Do you offer discounts for nonprofits?",
      answer:
        "Yes, we offer a 50% discount for registered nonprofit organizations. Contact our sales team for more information.",
    },
    {
      question: "Is my data secure?",
      answer:
        "We use enterprise-grade security with encryption at rest and in transit, and comply with major data protection regulations.",
    },
  ];

  const handleUpgrade = async (plan: string) => {
    if (!user) {
      router.push("/api/auth/login");
      return;
    }

    if (plan === "Enterprise") {
      setEnterpriseModalOpen(true);
      return;
    }

    if (plan === "Pro") {
      try {
        const res = await fetch("/api/stripe/checkout", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            plan: "PRO",
            billingPeriod: billingPeriod,
            userId: user.id,
          }),
        });

        const data = await res.json();
        if (data.url) window.location.href = data.url;
      } catch (error) {
        console.error("Error during checkout:", error);
      }
    }
  };

  const handleGoBack = () => {
    router.back();
  };

  const containerVariants: Variants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.2,
      },
    },
  };

  const itemVariants: Variants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: {
        type: "spring",
        stiffness: 100,
      },
    },
  };

  const cardVariants: Variants = {
    hidden: { scale: 0.9, opacity: 0 },
    visible: {
      scale: 1,
      opacity: 1,
      transition: {
        type: "spring",
        stiffness: 100,
      },
    },
    hover: {
      y: -8,
      transition: {
        type: "spring",
        stiffness: 400,
        damping: 10,
      },
    },
  };

  const featureVariants: Variants = {
    hidden: { x: -20, opacity: 0 },
    visible: {
      x: 0,
      opacity: 1,
      transition: {
        type: "spring",
        stiffness: 100,
      },
    },
    hover: {
      y: -5,
      transition: {
        type: "spring",
        stiffness: 400,
        damping: 10,
      },
    },
  };

  const faqVariants: Variants = {
    hidden: { y: 10, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: {
        type: "spring",
        stiffness: 100,
      },
    },
  };

  const ctaVariants: Variants = {
    hidden: { scale: 0.95, opacity: 0 },
    visible: {
      scale: 1,
      opacity: 1,
      transition: {
        type: "spring",
        stiffness: 100,
        delay: 0.3,
      },
    },
  };

  return (
    <div className="min-h-screen bg-white dark:bg-[#0a0a0b]">
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-linear-to-br from-blue-50/20 via-white to-indigo-50/20 dark:from-[#0f172a]/20 dark:via-[#0a0a0b] dark:to-[#1e1b4b]/20" />

        <div className="absolute inset-0">
          <div
            className={`absolute inset-0 bg-[url("data:image/svg+xml,%3Csvg%20width='60'%20height='60'%20viewBox='0%200%2060%2060'%20xmlns='http://www.w3.org/2000/svg'%3E%3Cg%20fill='none'%20fill-rule='evenodd'%3E%3Cg%20fill='%23ffffff'%20fill-opacity='0.1'%3E%3Cpath%20d='M36%2034v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6%2034v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6%204V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")]opacity-20 dark:opacity-10`}
          />
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5 }}
            className="absolute top-8 left-8 z-10"
          >
            <Button
              variant="ghost"
              onClick={handleGoBack}
              className="group flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-all duration-300"
            >
              <motion.div
                whileHover={{ x: -4 }}
                transition={{ type: "spring", stiffness: 400 }}
              >
                <ArrowLeft className="h-5 w-5" />
              </motion.div>
              <span>Back</span>
            </Button>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-center"
          >
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", stiffness: 200, delay: 0.2 }}
              className="inline-flex items-center gap-2 bg-blue-500/10 dark:bg-blue-500/20 text-blue-600 dark:text-blue-400 px-4 py-2 rounded-full text-sm font-medium mb-8"
            >
              <Sparkles className="h-4 w-4" />
              Simple, Transparent Pricing
            </motion.div>

            <h1 className="text-5xl lg:text-7xl font-bold mb-6">
              <span className="bg-clip-text text-transparent bg-linear-to-r from-gray-900 to-gray-700 dark:from-white dark:to-gray-300">
                Choose Your
              </span>
              <br />
              <span className="bg-clip-text text-transparent bg-linear-to-r from-blue-600 to-indigo-600 dark:from-blue-400 dark:to-indigo-400">
                Perfect Plan
              </span>
            </h1>

            <p className="text-xl text-gray-600 dark:text-gray-400 max-w-2xl mx-auto mb-12">
              Start free and scale as you grow. No hidden fees, no surprises.
            </p>

            <motion.div
              className="flex justify-center gap-8 mb-16"
              variants={containerVariants}
              initial="hidden"
              animate="visible"
            >
              {["10K+ Teams", "99% Uptime", "24/7 Support"].map(
                (stat, index) => (
                  <motion.div
                    key={stat}
                    variants={itemVariants}
                    className="text-center"
                  >
                    <div className="text-2xl font-bold text-gray-900 dark:text-white mb-1">
                      {stat.split(" ")[0]}
                    </div>
                    <div className="text-sm text-gray-500 dark:text-gray-400">
                      {stat.split(" ")[1]}
                    </div>
                  </motion.div>
                ),
              )}
            </motion.div>
          </motion.div>
        </div>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.3 }}
        className="flex justify-center mb-16 px-4"
      >
        <div className="bg-gray-100 dark:bg-[#1a1a1c] rounded-2xl p-1.5 inline-flex border border-gray-200 dark:border-[#2a2a2d]">
          <button
            onClick={() => setBillingPeriod("monthly")}
            className={`px-8 py-3 rounded-xl font-medium transition-all duration-200 flex items-center gap-2 ${
              billingPeriod === "monthly"
                ? "bg-white dark:bg-[#252528] text-gray-900 dark:text-white shadow-sm"
                : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
            }`}
          >
            Monthly
          </button>
          <button
            onClick={() => setBillingPeriod("yearly")}
            className={`px-8 py-3 rounded-xl font-medium transition-all duration-200 flex items-center gap-2 ${
              billingPeriod === "yearly"
                ? "bg-white dark:bg-[#252528] text-gray-900 dark:text-white shadow-sm"
                : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
            }`}
          >
            Yearly
            <span className="bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 text-xs px-2 py-1 rounded-full">
              Save 20%
            </span>
          </button>
        </div>
      </motion.div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-32">
        <motion.div
          className="grid grid-cols-1 lg:grid-cols-3 gap-8"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          <AnimatePresence>
            {plans.map((plan, index) => (
              <motion.div
                key={plan.name}
                variants={cardVariants}
                initial="hidden"
                animate="visible"
                exit="hidden"
                whileHover="hover"
                onHoverStart={() => setHoveredPlan(plan.name)}
                onHoverEnd={() => setHoveredPlan(null)}
                className={`relative rounded-3xl p-8 backdrop-blur-sm ${
                  plan.highlighted
                    ? "bg-linear-to-b from-white to-gray-50 dark:from-[#1a1a1c] dark:to-[#252528] border-2 border-blue-500/20 dark:border-blue-500/30 shadow-2xl"
                    : "bg-white/50 dark:bg-[#1a1a1c]/50 border border-gray-200/50 dark:border-[#2a2a2d] shadow-lg"
                }`}
              >
                {plan.highlighted && (
                  <div className="absolute inset-0 bg-linear-to-r from-blue-500/5 to-indigo-500/5 dark:from-blue-500/10 dark:to-indigo-500/10 rounded-3xl blur-xl" />
                )}

                {plan.popular && (
                  <motion.div
                    initial={{ y: -20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    className="absolute -top-3 left-1/2 transform -translate-x-1/2"
                  >
                    <div className="bg-linear-to-r from-blue-600 to-indigo-600 dark:from-blue-500 dark:to-indigo-500 text-white px-6 py-2 rounded-full text-sm font-medium flex items-center gap-2 shadow-lg">
                      <Star className="h-4 w-4 fill-current" />
                      Most Popular
                    </div>
                  </motion.div>
                )}

                <div className="relative">
                  <div className="flex items-center gap-4 mb-6">
                    <motion.div
                      className={`w-14 h-14 rounded-2xl bg-linear-to-br ${plan.color} dark:${plan.darkColor} flex items-center justify-center shadow-lg`}
                      whileHover={{ rotate: 5 }}
                    >
                      <plan.icon className="h-7 w-7 text-white" />
                    </motion.div>
                    <div>
                      <h3 className="text-2xl font-bold text-gray-900 dark:text-white">
                        {plan.name}
                      </h3>
                      <p className="text-gray-500 dark:text-gray-400 text-sm">
                        {plan.description}
                      </p>
                    </div>
                  </div>

                  <div className="mb-8">
                    <div className="flex items-baseline">
                      <span className="text-5xl lg:text-6xl font-bold text-gray-900 dark:text-white">
                        {billingPeriod === "monthly"
                          ? plan.price.monthly
                          : plan.price.yearly}
                      </span>
                      <span className="text-gray-500 dark:text-gray-400 ml-2 text-lg">
                        {billingPeriod === "monthly"
                          ? plan.period.monthly
                          : plan.period.yearly}
                      </span>
                    </div>
                    {billingPeriod === "yearly" && plan.name !== "Free" && (
                      <p className="text-green-600 dark:text-green-400 text-sm font-medium mt-2">
                        Save $
                        {parseInt(plan.price.monthly.replace("$", "")) * 12 -
                          parseInt(plan.price.yearly.replace("$", "")) *
                            12}{" "}
                        per year
                      </p>
                    )}
                  </div>

                  <motion.ul
                    className="space-y-4 mb-8"
                    variants={containerVariants}
                    initial="hidden"
                    animate="visible"
                  >
                    {plan.features.map((feature, featureIndex) => (
                      <motion.li
                        key={featureIndex}
                        variants={itemVariants}
                        custom={featureIndex}
                        className="flex items-center gap-3"
                      >
                        <motion.div
                          className="w-6 h-6 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center shrink-0"
                          whileHover={{ scale: 1.1 }}
                        >
                          <Check className="h-3 w-3 text-green-600 dark:text-green-400" />
                        </motion.div>
                        <span className="text-gray-700 dark:text-gray-300">
                          {feature}
                        </span>
                      </motion.li>
                    ))}
                  </motion.ul>

                  <Button
                    className={`w-full py-6 text-lg font-semibold rounded-xl transition-all duration-300 ${
                      plan.highlighted
                        ? "bg-linear-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-lg hover:shadow-xl"
                        : "bg-gray-900 dark:bg-white text-white dark:text-gray-900 hover:bg-gray-800 dark:hover:bg-gray-100 border-0"
                    }`}
                    onClick={() => handleUpgrade(plan.name)}
                  >
                    <span className="flex items-center justify-center gap-2">
                      {plan.buttonText}
                      <motion.span
                        animate={{ x: hoveredPlan === plan.name ? 4 : 0 }}
                        transition={{ type: "spring", stiffness: 400 }}
                      >
                        <ArrowRight className="h-4 w-4" />
                      </motion.span>
                    </span>
                  </Button>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </motion.div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-32">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="text-center mb-16"
        >
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", delay: 0.3 }}
            className="inline-flex items-center gap-2 bg-purple-500/10 dark:bg-purple-500/20 text-purple-600 dark:text-purple-400 px-4 py-2 rounded-full text-sm font-medium mb-4"
          >
            <Heart className="h-4 w-4" />
            Loved by Teams Worldwide
          </motion.div>
          <h2 className="text-4xl lg:text-5xl font-bold text-gray-900 dark:text-white mb-6">
            Everything You Need
            <br />
            <span className="bg-clip-text text-transparent bg-linear-to-r from-purple-600 to-pink-600 dark:from-purple-400 dark:to-pink-400">
              To Succeed
            </span>
          </h2>
          <p className="text-xl text-gray-600 dark:text-gray-400 max-w-3xl mx-auto">
            Powerful features designed to help you and your team work better,
            faster, and smarter.
          </p>
        </motion.div>

        <motion.div
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          {features.map((feature, index) => (
            <motion.div
              key={feature.title}
              variants={featureVariants}
              whileHover="hover"
              className="group relative p-8 rounded-3xl bg-white/50 dark:bg-[#1a1a1c]/50 border border-gray-200/50 dark:border-[#2a2a2d] backdrop-blur-sm hover:border-blue-300/50 dark:hover:border-blue-500/30 transition-all duration-300"
            >
              <motion.div
                className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-1/2"
                animate={{ scale: [1, 1.2, 1] }}
                transition={{ repeat: Infinity, duration: 2 }}
              >
                <div className="w-3 h-3 rounded-full bg-linear-to-r from-blue-500 to-indigo-500 blur-sm" />
              </motion.div>

              <motion.div
                className="w-16 h-16 rounded-2xl bg-linear-to-br from-blue-500/10 to-indigo-500/10 dark:from-blue-500/20 dark:to-indigo-500/20 flex items-center justify-center mb-6"
                whileHover={{ scale: 1.1 }}
              >
                <feature.icon className="h-8 w-8 text-blue-600 dark:text-blue-400" />
              </motion.div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">
                {feature.title}
              </h3>
              <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
                {feature.description}
              </p>
            </motion.div>
          ))}
        </motion.div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 mb-32">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="text-center mb-16"
        >
          <h2 className="text-4xl lg:text-5xl font-bold text-gray-900 dark:text-white mb-6">
            Common Questions
          </h2>
          <p className="text-xl text-gray-600 dark:text-gray-400">
            Get answers to the most common questions about our plans
          </p>
        </motion.div>

        <motion.div
          className="space-y-4"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          {faqs.map((faq, index) => (
            <motion.div
              key={faq.question}
              variants={faqVariants}
              className="group"
            >
              <motion.div
                className="p-6 rounded-2xl bg-white/50 dark:bg-[#1a1a1c]/50 border border-gray-200/50 dark:border-[#2a2a2d] hover:border-blue-300/50 dark:hover:border-blue-500/30 transition-all duration-300"
                whileHover={{ x: 5 }}
              >
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-3">
                  <motion.div
                    className="w-2 h-2 rounded-full bg-blue-500"
                    animate={{ scale: [1, 1.5, 1] }}
                    transition={{
                      repeat: Infinity,
                      duration: 2,
                      delay: index * 0.1,
                    }}
                  />
                  {faq.question}
                </h3>
                <p className="text-gray-600 dark:text-gray-400 pl-5">
                  {faq.answer}
                </p>
              </motion.div>
            </motion.div>
          ))}
        </motion.div>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 mb-32">
        <motion.div
          variants={ctaVariants}
          initial="hidden"
          animate="visible"
          className="relative rounded-4xl overflow-hidden"
        >
          <div className="absolute inset-0 bg-linear-to-br from-blue-600 via-indigo-600 to-purple-600 dark:from-blue-500 dark:via-indigo-500 dark:to-purple-500" />

          <div className="absolute inset-0 opacity-20">
            <div
              className={`absolute inset-0 bg-[url("data:image/svg+xml,%3Csvg%20width='60'%20height='60'%20viewBox='0%200%2060%2060'%20xmlns='http://www.w3.org/2000/svg'%3E%3Cg%20fill='none'%20fill-rule='evenodd'%3E%3Cg%20fill='%23ffffff'%20fill-opacity='0.1'%3E%3Cpath%20d='M36%2034v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6%2034v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6%204V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")]`}
            />
          </div>

          <div className="relative p-12 lg:p-20 text-center">
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="mb-8"
            >
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ repeat: Infinity, duration: 20, ease: "linear" }}
              >
                <Zap className="h-16 w-16 text-white/80 mx-auto mb-6" />
              </motion.div>
              <h2 className="text-4xl lg:text-6xl font-bold text-white mb-6">
                Ready to Get Started?
              </h2>
              <p className="text-blue-100 text-xl mb-10 max-w-2xl mx-auto">
                Join thousands of teams already using our platform to streamline
                their workflow and boost productivity.
              </p>
            </motion.div>

            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.4 }}
              className="flex flex-col sm:flex-row gap-4 justify-center"
            >
              <motion.div whileHover={{ scale: 1.05 }}>
                <Button
                  size="lg"
                  className="bg-white text-blue-600 hover:bg-gray-100 font-semibold text-lg px-8 py-3 rounded-xl"
                  onClick={() => handleUpgrade("Pro")}
                >
                  Start Free Trial
                  <motion.span
                    animate={{ x: [0, 5, 0] }}
                    transition={{ repeat: Infinity, duration: 1.5 }}
                  >
                    <ChevronRight className="ml-2 h-5 w-5" />
                  </motion.span>
                </Button>
              </motion.div>
              <motion.div whileHover={{ scale: 1.05 }}>
                <Button
                  size="lg"
                  className="bg-transparent text-white hover:bg-white/10 font-semibold text-lg px-8 py-3 rounded-xl border-2 border-white/30 hover:border-white"
                  onClick={() => router.push("/contact")}
                >
                  Contact Sales
                </Button>
              </motion.div>
            </motion.div>
          </div>
        </motion.div>
      </div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
        className="text-center py-8 border-t border-gray-200/50 dark:border-[#2a2a2d]"
      >
        <p className="text-gray-500 dark:text-gray-400 text-sm">
          © {new Date().getFullYear()} Company. All rights reserved.
          <a
            href="/privacy"
            className="ml-4 hover:text-blue-600 dark:from-blue-500"
          >
            Privacy Policy
          </a>
          <a
            href="/terms"
            className="ml-4 hover:text-blue-600 dark:from-blue-500"
          >
            Terms of Service
          </a>
        </p>
      </motion.div>

      <EnterpriseModal
        open={enterpriseModalOpen}
        onOpenChange={setEnterpriseModalOpen}
      />
    </div>
  );
}
