"use client";

import { Button } from "@/components/ui/button";
import {
  Mail,
  Phone,
  MapPin,
  Clock,
  MessageSquare,
  Users,
  Globe,
  ChevronRight,
  Sparkles,
} from "lucide-react";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";

export default function ContactPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    subject: "",
    message: "",
  });

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    router.push("/contact-sales");
  };

  const contactInfo = [
    {
      icon: Mail,
      title: "Email",
      value: "admin@clario.com",
      description: "General inquiries",
      color: "from-blue-500 to-indigo-500",
    },
    {
      icon: Phone,
      title: "Phone",
      value: "+1 (888) 123-4567",
      description: "Mon-Fri, 9am-6pm EST",
      color: "from-green-500 to-emerald-500",
    },
    {
      icon: MapPin,
      title: "Office",
      value: "San Francisco, CA",
      description: "123 Innovation Drive",
      color: "from-purple-500 to-pink-500",
    },
    {
      icon: Clock,
      title: "Response Time",
      value: "< 24 hours",
      description: "For all inquiries",
      color: "from-orange-500 to-red-500",
    },
  ];

  const departments = [
    {
      name: "Sales",
      email: "clario-sales@company.com",
      phone: "+1 (888) 123-4567",
      description: "Pricing, demos, enterprise solutions",
    },
    {
      name: "Support",
      email: "support@clario.com",
      phone: "+1 (888) 987-6543",
      description: "Technical issues, account help",
    },
    {
      name: "Partnerships",
      email: "partners@clario.com",
      phone: "+1 (888) 555-4321",
      description: "Business development, integrations",
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

  return (
    <div className="min-h-screen bg-white dark:bg-[#0a0a0b]">
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-linear-to-br from-blue-50/50 via-white to-indigo-50/50 dark:from-[#0f172a]/50 dark:via-[#0a0a0b] dark:to-[#1e1b4b]/50" />
        <div className="absolute inset-0">
          <div
            className={`absolute inset-0 bg-[url("data:image/svg+xml,%3Csvg%20width='60'%20height='60'%20viewBox='0%200%2060%2060'%20xmlns='http://www.w3.org/2000/svg'%3E%3Cg%20fill='none'%20fill-rule='evenodd'%3E%3Cg%20fill='%23ffffff'%20fill-opacity='0.1'%3E%3Cpath%20d='M36%2034v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6%2034v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6%204V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")] opacity-20 dark:opacity-10`}
          />
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
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
              <MessageSquare className="h-4 w-4" />
              Get in Touch
            </motion.div>

            <h1 className="text-4xl lg:text-6xl font-bold mb-6">
              <span className="bg-clip-text text-transparent bg-linear-to-r from-gray-900 to-gray-700 dark:from-white dark:to-gray-300">
                Let's Connect
              </span>
            </h1>

            <p className="text-xl text-gray-600 dark:text-gray-400 max-w-2xl mx-auto mb-12">
              Have questions? We're here to help. Reach out to our team for
              assistance.
            </p>

            <motion.div
              className="flex justify-center gap-6"
              variants={containerVariants}
              initial="hidden"
              animate="visible"
            >
              <Button
                onClick={() => router.push("/contact-sales")}
                className="bg-linear-to-r from-blue-600 to-indigo-600 text-white"
              >
                Contact Sales
                <ChevronRight className="ml-2 h-4 w-4" />
              </Button>

              <Button
                onClick={() => router.push("/book-demo")}
                variant="outline"
                className="border-gray-300 dark:border-gray-700"
              >
                Book a Demo
              </Button>
            </motion.div>
          </motion.div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <motion.div
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-16"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          {contactInfo.map((info, index) => (
            <motion.div key={info.title} className="group">
              <div className="bg-white dark:bg-[#1a1a1c] rounded-2xl p-6 border border-gray-200 dark:border-[#2a2a2d] hover:border-blue-300 dark:hover:border-blue-500/30 transition-all duration-300 h-full">
                <div
                  className={`w-12 h-12 rounded-xl bg-linear-to-br ${info.color} flex items-center justify-center mb-4`}
                >
                  <info.icon className="h-6 w-6 text-white" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                  {info.title}
                </h3>
                <p className="text-gray-700 dark:text-gray-300 text-sm mb-1">
                  {info.value}
                </p>
                <p className="text-gray-500 dark:text-gray-500 text-xs">
                  {info.description}
                </p>
              </div>
            </motion.div>
          ))}
        </motion.div>

        <div className="mb-16">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-12"
          >
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
              Contact the Right Team
            </h2>
            <p className="text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
              Connect with the department that can best assist you
            </p>
          </motion.div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {departments.map((dept, index) => (
              <motion.div
                key={dept.name}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="bg-linear-to-br from-gray-50 to-white dark:from-[#1a1a1c] dark:to-[#252528] rounded-2xl p-6 border border-gray-200 dark:border-[#2a2a2d]"
              >
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                    <Users className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                    {dept.name}
                  </h3>
                </div>
                <p className="text-gray-600 dark:text-gray-400 text-sm mb-6">
                  {dept.description}
                </p>
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <Mail className="h-4 w-4 text-gray-400" />
                    <a
                      href={`mailto:${dept.email}`}
                      className="text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 text-sm"
                    >
                      {dept.email}
                    </a>
                  </div>
                  <div className="flex items-center gap-2">
                    <Phone className="h-4 w-4 text-gray-400" />
                    <span className="text-gray-700 dark:text-gray-300 text-sm">
                      {dept.phone}
                    </span>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="max-w-2xl mx-auto"
        >
          <div className="bg-white dark:bg-[#1a1a1c] rounded-3xl p-8 border border-gray-200 dark:border-[#2a2a2d] shadow-lg">
            <div className="text-center mb-8">
              <div className="w-16 h-16 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center mx-auto mb-4">
                <Sparkles className="h-7 w-7 text-blue-600 dark:text-blue-400" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                Send us a Message
              </h2>
              <p className="text-gray-600 dark:text-gray-400">
                We'll get back to you within 24 hours
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Your Name *
                  </label>
                  <input
                    type="text"
                    name="name"
                    required
                    value={formData.name}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 rounded-xl border border-gray-300 dark:border-[#2a2a2d] bg-white dark:bg-[#252528] text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                    placeholder="John Doe"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Email Address *
                  </label>
                  <input
                    type="email"
                    name="email"
                    required
                    value={formData.email}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 rounded-xl border border-gray-300 dark:border-[#2a2a2d] bg-white dark:bg-[#252528] text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                    placeholder="john@company.com"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Subject *
                </label>
                <input
                  type="text"
                  name="subject"
                  required
                  value={formData.subject}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 rounded-xl border border-gray-300 dark:border-[#2a2a2d] bg-white dark:bg-[#252528] text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  placeholder="How can we help you?"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Message *
                </label>
                <textarea
                  name="message"
                  required
                  value={formData.message}
                  onChange={handleInputChange}
                  rows={4}
                  className="w-full px-4 py-3 rounded-xl border border-gray-300 dark:border-[#2a2a2d] bg-white dark:bg-[#252528] text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  placeholder="Tell us about your inquiry..."
                />
              </div>

              <Button
                type="submit"
                className="w-full py-3 bg-linear-to-r from-blue-600 to-indigo-600 text-white hover:from-blue-700 hover:to-indigo-700"
              >
                Send Message
                <ChevronRight className="ml-2 h-4 w-4" />
              </Button>
            </form>

            <p className="text-center text-sm text-gray-500 dark:text-gray-500 mt-6">
              By submitting, you agree to our{" "}
              <a
                href="/privacy"
                className="text-blue-600 dark:text-blue-400 hover:underline"
              >
                Privacy Policy
              </a>
            </p>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="mt-16 text-center"
        >
          <div className="inline-flex items-center gap-2 bg-gray-100 dark:bg-gray-800 px-4 py-2 rounded-full text-sm font-medium mb-4">
            <Globe className="h-4 w-4" />
            Global Presence
          </div>
          <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
            We're Here Worldwide
          </h3>
          <div className="flex flex-wrap justify-center gap-8 text-gray-600 dark:text-gray-400">
            <div className="text-center">
              <div className="text-lg font-semibold text-gray-900 dark:text-white">
                San Francisco
              </div>
              <div className="text-sm">Headquarters</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-semibold text-gray-900 dark:text-white">
                New York
              </div>
              <div className="text-sm">Sales Office</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-semibold text-gray-900 dark:text-white">
                London
              </div>
              <div className="text-sm">EMEA Hub</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-semibold text-gray-900 dark:text-white">
                Singapore
              </div>
              <div className="text-sm">APAC Office</div>
            </div>
          </div>
        </motion.div>
      </div>

      <div className="border-t border-gray-200/50 dark:border-[#2a2a2d] py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-gray-500 dark:text-gray-400 text-sm">
              © {new Date().getFullYear()} Clario. All rights reserved.
            </p>
            <div className="flex items-center gap-6">
              <a
                href="/terms"
                className="text-gray-500 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 text-sm"
              >
                Terms of Service
              </a>
              <a
                href="/privacy"
                className="text-gray-500 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 text-sm"
              >
                Privacy Policy
              </a>
              <a
                href="/contact"
                className="text-blue-600 dark:text-blue-400 text-sm font-medium"
              >
                Contact
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
