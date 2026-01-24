"use client";

import { Button } from "@/components/ui/button";
import {
  FileText,
  Scale,
  AlertCircle,
  BookOpen,
  ChevronRight,
} from "lucide-react";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";

export default function TermsOfServicePage() {
  const router = useRouter();
  const effectiveDate = "January 9, 2026";

  const sections = [
    {
      id: "agreement",
      title: "Agreement to Terms",
      icon: Scale,
      content: [
        "By accessing or using Clario's services, you agree to be bound by these Terms of Service.",
        "If you disagree with any part of the terms, you may not access the service.",
        "These terms apply to all visitors, users, and others who access or use the service.",
        "Additional terms may apply to specific services or features.",
      ],
    },
    {
      id: "accounts",
      title: "User Accounts",
      content: [
        "You must be at least 18 years old to create an account.",
        "You are responsible for maintaining the confidentiality of your account and password.",
        "You agree to provide accurate, current, and complete information during registration.",
        "You must notify us immediately of any unauthorized use of your account.",
        "We reserve the right to refuse service, terminate accounts, or remove content at our discretion.",
      ],
    },
    {
      id: "services",
      title: "Services Description",
      icon: BookOpen,
      content: [
        "Clario provides cloud-based collaboration and productivity tools.",
        "We reserve the right to modify, suspend, or discontinue any part of our services at any time.",
        "Technical support is provided according to your subscription plan.",
        "We may update features and functionality as part of our continuous improvement.",
        "Some features may be limited based on your subscription tier.",
      ],
    },
    {
      id: "subscriptions",
      title: "Subscriptions and Payments",
      content: [
        "Subscription fees are billed in advance on a monthly or annual basis.",
        "All payments are processed through secure third-party payment processors.",
        "No refunds are provided for partial months or years of service.",
        "Prices are subject to change with 30 days notice to current subscribers.",
        "You may cancel your subscription at any time through your account settings.",
        "Upon cancellation, you will have access to your account until the end of your billing period.",
      ],
    },
    {
      id: "content",
      title: "User Content",
      content: [
        "You retain all rights to the content you create using our services.",
        "By uploading content, you grant us a license to store, process, and display that content.",
        "You are solely responsible for the content you upload and its legality.",
        "We do not claim ownership of your content.",
        "We may remove content that violates these terms or applicable laws.",
      ],
    },
    {
      id: "prohibited",
      title: "Prohibited Uses",
      icon: AlertCircle,
      content: [
        "Violating any laws or regulations",
        "Infringing upon intellectual property rights",
        "Harassing, abusing, or harming others",
        "Transmitting viruses or malicious code",
        "Attempting to gain unauthorized access to our systems",
        "Interfering with the proper working of the service",
        "Using the service for any illegal purpose",
        "Engaging in data mining or similar data gathering activities",
      ],
    },
    {
      id: "intellectual",
      title: "Intellectual Property",
      content: [
        "The service and its original content are owned by Clario and are protected by intellectual property laws.",
        "Our trademarks and trade dress may not be used without prior written permission.",
        "You may not modify, publish, transmit, reverse engineer, or create derivative works of our software.",
        "All rights not expressly granted herein are reserved.",
        "Any feedback or suggestions you provide may be used without compensation.",
      ],
    },
    {
      id: "liability",
      title: "Limitation of Liability",
      content: [
        "To the maximum extent permitted by law, Clario shall not be liable for any indirect, incidental, or consequential damages.",
        "Our total liability for any claims under these terms shall not exceed the amount you paid us in the last 12 months.",
        "We make no warranties about the reliability or availability of the service.",
        "The service is provided 'as is' and 'as available' without warranties of any kind.",
        "We do not guarantee that the service will be uninterrupted, timely, secure, or error-free.",
      ],
    },
    {
      id: "termination",
      title: "Termination",
      content: [
        "We may terminate or suspend your account immediately for violations of these terms.",
        "Upon termination, your right to use the service will immediately cease.",
        "We may delete your content upon termination of service.",
        "You may terminate your account at any time through your account settings.",
        "Provisions that by their nature should survive termination shall survive.",
      ],
    },
    {
      id: "governing",
      title: "Governing Law",
      content: [
        "These terms shall be governed by the laws of the State of California.",
        "Any disputes shall be resolved in the courts located in San Francisco, California.",
        "The United Nations Convention on Contracts for the International Sale of Goods does not apply.",
        "If any provision is found invalid, the remaining provisions remain in full effect.",
        "Our failure to enforce any right or provision will not be considered a waiver.",
      ],
    },
    {
      id: "changes",
      title: "Changes to Terms",
      content: [
        "We reserve the right to modify these terms at any time.",
        "We will provide at least 30 days notice for material changes.",
        "By continuing to access or use our service after revisions become effective, you agree to be bound by the revised terms.",
        "If you do not agree to the new terms, you must stop using the service.",
        "We will post the most current version of these terms on our website.",
      ],
    },
    {
      id: "contact",
      title: "Contact Information",
      content: [
        "For questions about these Terms of Service, please contact us:",
        "Email: legal@clario.com",
        "Phone: +1 (888) 123-4567",
        "Address: 123 Innovation Drive, San Francisco, CA 94107",
        "Response Time: We aim to respond to legal inquiries within 72 hours.",
      ],
    },
  ];

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.2,
      },
    },
  };

  const itemVariants = {
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

  return (
    <div className="min-h-screen bg-white dark:bg-[#0a0a0b]">
      <div className="relative bg-linear-to-br from-gray-50 to-gray-100 dark:from-[#1a1a1c] dark:to-[#252528] py-20">
        <div className="absolute inset-0 bg-grid-black/5 dark:bg-grid-white/5" />
        <div className="relative max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center"
          >
            <div className="inline-flex items-center gap-3 bg-white/20 dark:bg-white/10 backdrop-blur-sm px-4 py-2 rounded-full mb-6">
              <FileText className="h-5 w-5 text-gray-600 dark:text-gray-400" />
              <span className="text-gray-700 dark:text-gray-300 font-medium">
                Terms of Service
              </span>
            </div>
            <h1 className="text-4xl lg:text-6xl font-bold text-gray-900 dark:text-white mb-6">
              Terms of Service
            </h1>
            <p className="text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto mb-8">
              Please read these terms carefully before using our services.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <div className="text-sm text-gray-500 dark:text-gray-400">
                Effective Date: {effectiveDate}
              </div>
              <Button
                variant="outline"
                onClick={() => router.push("/contact")}
                className="border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800"
              >
                Contact Legal Team
                <ChevronRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </motion.div>
        </div>
      </div>

      <div className="bg-yellow-50 dark:bg-yellow-900/20 border-b border-yellow-200 dark:border-yellow-800">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-yellow-600 dark:text-yellow-400 mt-0.5" />
            <div className="text-sm text-yellow-800 dark:text-yellow-300">
              <span className="font-semibold">Important:</span> This is a legal
              agreement between you and Clario. By using our services, you agree
              to these terms.
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="mb-12"
        >
          <div className="bg-linear-to-r from-gray-50 to-gray-100 dark:from-[#1a1a1c] dark:to-[#252528] rounded-2xl p-6 border border-gray-200 dark:border-gray-800">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
              Quick Summary
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-green-500" />
                  <span className="text-gray-700 dark:text-gray-300">
                    You own your content
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-green-500" />
                  <span className="text-gray-700 dark:text-gray-300">
                    Cancel anytime
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-green-500" />
                  <span className="text-gray-700 dark:text-gray-300">
                    30-day notice for major changes
                  </span>
                </div>
              </div>
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-red-500" />
                  <span className="text-gray-700 dark:text-gray-300">
                    No refunds for partial periods
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-red-500" />
                  <span className="text-gray-700 dark:text-gray-300">
                    Must be 18+ to use
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-red-500" />
                  <span className="text-gray-700 dark:text-gray-300">
                    California law applies
                  </span>
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        <div className="mb-12">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
            Table of Contents
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            {sections.map((section, index) => (
              <a
                key={section.id}
                href={`#${section.id}`}
                className="flex items-center gap-3 p-4 rounded-lg bg-gray-50 dark:bg-[#252528] hover:bg-gray-100 dark:hover:bg-[#2a2a2d] transition-colors group"
              >
                <div className="w-8 h-8 rounded-lg bg-gray-200 dark:bg-gray-800 flex items-center justify-center text-gray-700 dark:text-gray-300 font-medium group-hover:bg-gray-300 dark:group-hover:bg-gray-700">
                  {index + 1}
                </div>
                <span className="text-gray-700 dark:text-gray-300 font-medium">
                  {section.title}
                </span>
              </a>
            ))}
          </div>
        </div>

        <motion.div
          className="space-y-8"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          {sections.map((section, index) => (
            <motion.section
              key={section.id}
              id={section.id}
              className="scroll-mt-24 bg-white dark:bg-[#1a1a1c] rounded-xl p-6 border border-gray-200 dark:border-[#2a2a2d]"
            >
              <div className="flex items-center gap-3 mb-4 pb-4 border-b border-gray-100 dark:border-[#2a2a2d]">
                {section.icon && (
                  <div className="w-10 h-10 rounded-lg bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
                    <section.icon className="h-5 w-5 text-gray-600 dark:text-gray-400" />
                  </div>
                )}
                <div>
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                    {index + 1}. {section.title}
                  </h3>
                </div>
              </div>

              <div className="space-y-3">
                {section.content.map((item, itemIndex) => (
                  <div key={itemIndex} className="flex items-start gap-3">
                    <div className="w-6 h-6 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center shrink-0 mt-0.5">
                      <div className="w-1.5 h-1.5 rounded-full bg-gray-400 dark:bg-gray-600" />
                    </div>
                    <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                      {item}
                    </p>
                  </div>
                ))}
              </div>
            </motion.section>
          ))}
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="mt-16"
        >
          <div className="bg-linear-to-r from-gray-900 to-black dark:from-gray-800 dark:to-gray-900 rounded-2xl p-8 text-center">
            <div className="w-16 h-16 rounded-full bg-white/10 flex items-center justify-center mx-auto mb-6">
              <Scale className="h-8 w-8 text-white" />
            </div>
            <h3 className="text-2xl font-bold text-white mb-4">
              Agreement Acceptance
            </h3>
            <p className="text-gray-300 mb-6 max-w-2xl mx-auto">
              By using Clario's services, you acknowledge that you have read,
              understood, and agree to be bound by these Terms of Service.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button
                onClick={() => router.push("/")}
                className="bg-white text-gray-900 hover:bg-gray-100"
              >
                Return to Home
              </Button>
              <Button
                variant="outline"
                onClick={() => router.push("/contact")}
                className="bg-transparent text-white border-white/30 hover:bg-white/10"
              >
                Have Questions?
              </Button>
            </div>
          </div>
        </motion.div>

        <div className="mt-12 p-6 rounded-xl bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-800">
          <div className="flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400 mt-0.5" />
            <div>
              <h4 className="font-bold text-gray-900 dark:text-white mb-2">
                Legal Notice
              </h4>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                This document is for informational purposes only and does not
                constitute legal advice. For specific legal questions, please
                consult with a qualified attorney.
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="border-t border-gray-200 dark:border-[#2a2a2d] py-8 mt-12">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-gray-600 dark:text-gray-400 text-sm">
              © {new Date().getFullYear()} Clario. All rights reserved.
            </p>
            <div className="flex items-center gap-6">
              <a
                href="/terms"
                className="text-blue-600 dark:text-blue-400 text-sm font-medium"
              >
                Terms of Service
              </a>
              <a
                href="/privacy"
                className="text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 text-sm font-medium"
              >
                Privacy Policy
              </a>
              <a
                href="/contact"
                className="text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 text-sm font-medium"
              >
                Contact Us
              </a>
            </div>
          </div>
          <div className="mt-4 text-center md:text-left">
            <p className="text-xs text-gray-500 dark:text-gray-500">
              Version 2.1 • Effective {effectiveDate}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
