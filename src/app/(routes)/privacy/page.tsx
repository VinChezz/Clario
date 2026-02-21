"use client";

import { Button } from "@/components/ui/button";
import { Shield, ChevronRight } from "lucide-react";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";

export default function PrivacyPolicyPage() {
  const router = useRouter();
  const lastUpdated = "February 21, 2026";

  const sections = [
    {
      id: "data-collection",
      title: "Information We Collect",
      content: [
        "Personal Information: Name, email address, phone number, company details when you register or contact us.",
        "Usage Data: Information about how you interact with our platform, including IP address, browser type, pages visited, and time spent.",
        "Cookies: We use cookies and similar tracking technologies to enhance your experience and analyze site usage.",
        "Payment Information: When you purchase our services, we collect payment details through secure payment processors.",
      ],
    },
    {
      id: "data-usage",
      title: "How We Use Your Information",
      content: [
        "To provide and maintain our services",
        "To notify you about changes to our services",
        "To allow you to participate in interactive features",
        "To provide customer support",
        "To gather analysis or valuable information to improve our services",
        "To monitor the usage of our services",
        "To detect, prevent and address technical issues",
        "To send you marketing communications (with your consent)",
      ],
    },
    {
      id: "data-sharing",
      title: "Data Sharing and Disclosure",
      content: [
        "We do not sell your personal information to third parties.",
        "We may share your information with service providers who assist in operating our platform.",
        "We may disclose information if required by law or to protect our rights.",
        "In the event of a merger or acquisition, your information may be transferred to the new entity.",
        "We use analytics services like Google Analytics to understand usage patterns.",
      ],
    },
    {
      id: "data-security",
      title: "Data Security",
      content: [
        "We implement industry-standard security measures to protect your data.",
        "All data transmissions are encrypted using SSL/TLS protocols.",
        "Regular security audits and vulnerability assessments are conducted.",
        "Access to personal data is restricted to authorized personnel only.",
        "We retain your information only for as long as necessary to fulfill the purposes outlined in this policy.",
      ],
    },
    {
      id: "your-rights",
      title: "Your Rights",
      content: [
        "Access: You have the right to request copies of your personal data.",
        "Correction: You have the right to request correction of inaccurate information.",
        "Deletion: You have the right to request deletion of your personal data.",
        "Opt-out: You can opt-out of marketing communications at any time.",
        "Data Portability: You have the right to request transfer of your data to another organization.",
        "To exercise these rights, please contact us at privacy@clario.com.",
      ],
    },
    {
      id: "cookies",
      title: "Cookies and Tracking",
      content: [
        "We use essential cookies for site functionality and security.",
        "Analytics cookies help us understand how users interact with our site.",
        "Marketing cookies are used to deliver relevant advertisements.",
        "You can control cookie settings through your browser preferences.",
        "Disabling cookies may affect your ability to use certain features of our platform.",
      ],
    },
    {
      id: "children-privacy",
      title: "Children's Privacy",
      content: [
        "Our services are not intended for individuals under the age of 18.",
        "We do not knowingly collect personal information from children.",
        "If you are a parent or guardian and believe your child has provided us with personal information, please contact us immediately.",
        "We will take steps to remove such information from our servers.",
      ],
    },
    {
      id: "changes",
      title: "Changes to This Policy",
      content: [
        "We may update our Privacy Policy from time to time.",
        "We will notify you of any changes by posting the new policy on this page.",
        'We will update the "Last Updated" date at the top of this policy.',
        "You are advised to review this Privacy Policy periodically for any changes.",
        "Changes become effective immediately after they are posted on this page.",
      ],
    },
    {
      id: "contact",
      title: "Contact Us",
      content: [
        "If you have any questions about this Privacy Policy, please contact us:",
        "Email: privacy@clario.com",
        "Phone: +1 (888) 123-4567",
        "Address: 123 Innovation Drive, San Francisco, CA 94107",
        "Response Time: We aim to respond to all inquiries within 48 hours.",
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
      <div className="relative bg-linear-to-br from-blue-50 to-indigo-50 dark:from-[#0f172a] dark:to-[#1e1b4b] py-20">
        <div className="absolute inset-0 bg-grid-white/10 dark:bg-grid-gray-800/20" />
        <div className="relative max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center"
          >
            <div className="inline-flex items-center gap-3 bg-white/20 dark:bg-white/10 backdrop-blur-sm px-4 py-2 rounded-full mb-6">
              <Shield className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              <span className="text-blue-700 dark:text-blue-300 font-medium">
                Privacy Policy
              </span>
            </div>
            <h1 className="text-4xl lg:text-6xl font-bold text-gray-900 dark:text-white mb-6">
              Your Privacy Matters
            </h1>
            <p className="text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto mb-8">
              We are committed to protecting your personal information and being
              transparent about how we use it.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <div className="text-sm text-gray-500 dark:text-gray-400">
                Last Updated: {lastUpdated}
              </div>
              <Button
                variant="outline"
                onClick={() => router.push("/contact")}
                className="border-blue-200 dark:border-blue-800 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20"
              >
                Contact Privacy Team
                <ChevronRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </motion.div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="mb-12"
        >
          <div className="bg-linear-to-r from-blue-50 to-indigo-50 dark:from-[#1a1a1c] dark:to-[#252528] rounded-2xl p-6 border border-blue-100 dark:border-blue-900/30">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
              Table of Contents
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {sections.map((section, index) => (
                <a
                  key={section.id}
                  href={`#${section.id}`}
                  className="flex items-center gap-3 p-3 rounded-lg hover:bg-white dark:hover:bg-[#252528] transition-colors group"
                >
                  <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-600 dark:text-blue-400 font-medium">
                    {index + 1}
                  </div>
                  <span className="text-gray-700 dark:text-gray-300 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                    {section.title}
                  </span>
                </a>
              ))}
            </div>
          </div>
        </motion.div>

        <motion.div
          className="space-y-12"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          {sections.map((section, index) => (
            <motion.section
              key={section.id}
              id={section.id}
              className="scroll-mt-24"
            >
              <div className="bg-white dark:bg-[#1a1a1c] rounded-2xl p-6 lg:p-8 border border-gray-200 dark:border-[#2a2a2d] shadow-sm">
                <div className="flex items-center gap-4 mb-6 pb-4 border-b border-gray-100 dark:border-[#2a2a2d]">
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                      {section.title}
                    </h2>
                    <div className="text-sm text-gray-500 dark:text-gray-500 mt-1">
                      Section {index + 1} of {sections.length}
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  {section.content.map((item, itemIndex) => (
                    <div
                      key={itemIndex}
                      className="flex items-start gap-3 p-4 rounded-lg bg-gray-50 dark:bg-[#252528]"
                    >
                      <div className="w-6 h-6 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center shrink-0 mt-0.5">
                        <div className="w-2 h-2 rounded-full bg-green-600 dark:bg-green-400" />
                      </div>
                      <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                        {item}
                      </p>
                    </div>
                  ))}
                </div>

                <div className="mt-8 pt-6 border-t border-gray-100 dark:border-[#2a2a2d]">
                  <a
                    href="#"
                    className="inline-flex items-center text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 text-sm font-medium"
                  >
                    Back to top
                    <ChevronRight className="ml-1 h-4 w-4 rotate-90" />
                  </a>
                </div>
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
          <div className="bg-linear-to-r from-blue-600 to-indigo-600 dark:from-blue-500 dark:to-indigo-500 rounded-2xl p-8 text-center">
            <div className="w-16 h-16 rounded-full bg-white/20 flex items-center justify-center mx-auto mb-6">
              <Shield className="h-8 w-8 text-white" />
            </div>
            <h3 className="text-2xl font-bold text-white mb-4">
              Questions About Our Privacy Policy?
            </h3>
            <p className="text-blue-100 mb-6 max-w-2xl mx-auto">
              Our privacy team is here to help you understand how we protect
              your data and address any concerns you may have.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button
                onClick={() => router.push("/contact")}
                className="bg-white text-blue-600 hover:bg-gray-100"
              >
                Contact Privacy Team
                <ChevronRight className="ml-2 h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                onClick={() => router.push("/terms")}
                className="bg-transparent text-white border-white/30 hover:bg-white/10"
              >
                View Terms of Service
              </Button>
            </div>
          </div>
        </motion.div>

        <div className="mt-12 p-6 rounded-xl bg-gray-50 dark:bg-[#1a1a1c] border border-gray-200 dark:border-[#2a2a2d]">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
              <div className="w-6 h-6 bg-blue-600 dark:bg-blue-400 rounded-full animate-pulse" />
            </div>
            <div>
              <h4 className="font-bold text-gray-900 dark:text-white">
                Policy Updates
              </h4>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                This policy was last updated on {lastUpdated}. We regularly
                review and update our privacy practices.
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="border-t border-gray-200 dark:border-[#2a2a2d] py-8">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-gray-600 dark:text-gray-400 text-sm">
              © {new Date().getFullYear()} Clario. All rights reserved.
            </p>
            <div className="flex items-center gap-6">
              <a
                href="/terms"
                className="text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 text-sm font-medium"
              >
                Terms of Service
              </a>
              <a
                href="/privacy"
                className="text-blue-600 dark:text-blue-400 text-sm font-medium"
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
        </div>
      </div>
    </div>
  );
}
