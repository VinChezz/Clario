"use client";

import { Button } from "@/components/ui/button";
import {
  Mail,
  Phone,
  MessageSquare,
  Calendar,
  Globe,
  Building,
  User,
  Users,
  Target,
  Zap,
  ArrowRight,
  CheckCircle2,
  Star,
  Sparkles,
  Clock,
  Shield,
  BadgeCheck,
} from "lucide-react";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence, Variants } from "framer-motion";

export default function ContactSalesPage() {
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    company: "",
    companySize: "",
    phone: "",
    country: "",
    message: "",
    helpType: "general",
  });
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const handleInputChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >,
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/send-email", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          to: formData.email,
          type: "contact-sales",
          formData: formData,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Failed to send email");
      }

      setIsSubmitted(true);
    } catch (error) {
      console.error("Submission error:", error);
      setError(
        error instanceof Error
          ? error.message
          : "Failed to send your message. Please try again or contact us directly at sales@yourcompany.com",
      );
    } finally {
      setIsLoading(false);
    }
  };

  const companySizes = [
    "1-10 employees",
    "11-50 employees",
    "51-200 employees",
    "201-500 employees",
    "501-1000 employees",
    "1000+ employees",
  ];

  const helpTypes = [
    { value: "general", label: "General Inquiry", icon: MessageSquare },
    { value: "demo", label: "Product Demo", icon: Calendar },
    { value: "pricing", label: "Enterprise Pricing", icon: Target },
    { value: "implementation", label: "Implementation", icon: Zap },
    { value: "support", label: "Technical Support", icon: Shield },
  ];

  const benefits = [
    {
      icon: BadgeCheck,
      title: "Dedicated Account Manager",
      description: "Personal guidance from onboarding to launch",
    },
    {
      icon: Clock,
      title: "24/7 Priority Support",
      description: "Get help when you need it with priority response",
    },
    {
      icon: Users,
      title: "Custom Implementation",
      description: "Tailored setup for your specific workflow",
    },
    {
      icon: Target,
      title: "Strategic Consultation",
      description: "Expert advice to maximize your ROI",
    },
    {
      icon: Shield,
      title: "Security Review",
      description: "Comprehensive security assessment and compliance",
    },
    {
      icon: Sparkles,
      title: "Early Access",
      description: "Get early access to new features and betas",
    },
  ];

  const testimonials = [
    {
      name: "Alex Johnson",
      role: "CTO at TechCorp",
      content:
        "The sales team was incredibly helpful in tailoring a solution that perfectly fit our needs. Implementation was seamless.",
      rating: 5,
    },
    {
      name: "Sarah Chen",
      role: "VP Operations at GrowthLabs",
      content:
        "Outstanding support throughout our journey. The dedicated account manager made all the difference.",
      rating: 5,
    },
    {
      name: "Michael Rodriguez",
      role: "Director at InnovateCo",
      content:
        "From initial contact to final implementation, the process was smooth and professional. Highly recommended!",
      rating: 5,
    },
  ];

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
      y: -4,
      transition: {
        type: "spring",
        stiffness: 400,
        damping: 10,
      },
    },
  };

  return (
    <div className="min-h-screen bg-white dark:bg-[#0a0a0b]">
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-linear-to-br from-blue-50/20 via-white to-indigo-50/20 dark:from-[#0f172a]/20 dark:via-[#0a0a0b] dark:to-[#1e1b4b]/20" />

        <div className="absolute inset-0">
          <div
            className={`absolute inset-0 bg-[url("data:image/svg+xml,%3Csvg%20width='60'%20height='60'%20viewBox='0%200%2060%2060'%20xmlns='http://www.w3.org/2000/svg'%3E%3Cg%20fill='none'%20fill-rule='evenodd'%3E%3Cg%20fill='%23ffffff'%20fill-opacity='0.1'%3E%3Cpath%20d='M36%2034v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6%2034v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6%204V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")] opacity-20 dark:opacity-10`}
          />
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
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
              Get in Touch with Our Experts
            </motion.div>

            <h1 className="text-5xl lg:text-7xl font-bold mb-6">
              <span className="bg-clip-text text-transparent bg-linear-to-r from-gray-900 to-gray-700 dark:from-white dark:to-gray-300">
                Let's Build
              </span>
              <br />
              <span className="bg-clip-text text-transparent bg-linear-to-r from-blue-600 to-indigo-600 dark:from-blue-400 dark:to-indigo-400">
                Something Great
              </span>
            </h1>

            <p className="text-xl text-gray-600 dark:text-gray-400 max-w-2xl mx-auto mb-12">
              Connect with our sales team to discuss custom solutions,
              enterprise pricing, and how we can help your team succeed.
            </p>

            <motion.div
              className="flex flex-wrap justify-center gap-8 mb-16"
              variants={containerVariants}
              initial="hidden"
              animate="visible"
            >
              {["<24h Response", "Free Consultation", "Custom Solution"].map(
                (stat, index) => (
                  <motion.div
                    key={stat}
                    variants={itemVariants}
                    className="text-center"
                  >
                    <div className="text-2xl font-bold text-gray-900 dark:text-white mb-1">
                      {stat}
                    </div>
                    <div className="text-sm text-gray-500 dark:text-gray-400">
                      Guaranteed
                    </div>
                  </motion.div>
                ),
              )}
            </motion.div>
          </motion.div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-32">
        <div className="grid lg:grid-cols-2 gap-16">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6 }}
          >
            <div className="bg-white dark:bg-[#1a1a1c] rounded-3xl p-8 border border-gray-200 dark:border-[#2a2a2d] shadow-xl">
              {isSubmitted ? (
                <motion.div
                  initial={{ scale: 0.9, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  className="text-center py-12"
                >
                  <motion.div
                    animate={{ scale: [1, 1.2, 1] }}
                    transition={{ duration: 0.5 }}
                    className="w-20 h-20 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-6"
                  >
                    <CheckCircle2 className="h-10 w-10 text-green-600 dark:text-green-400" />
                  </motion.div>
                  <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                    Message Sent Successfully!
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400 mb-8">
                    Thank you for reaching out. Our sales team will contact you
                    within 24 hours.
                  </p>
                  <Button
                    onClick={() => {
                      setIsSubmitted(false);
                      setFormData({
                        firstName: "",
                        lastName: "",
                        email: "",
                        company: "",
                        companySize: "",
                        phone: "",
                        country: "",
                        message: "",
                        helpType: "general",
                      });
                    }}
                    className="bg-linear-to-r from-blue-600 to-indigo-600 text-white"
                  >
                    Send Another Message
                  </Button>
                </motion.div>
              ) : (
                <>
                  <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                    Contact Our Sales Team
                  </h2>
                  <p className="text-gray-600 dark:text-gray-400 mb-8">
                    Fill out the form below and we'll get back to you within 24
                    hours.
                  </p>

                  <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          First Name *
                        </label>
                        <div className="relative">
                          <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                          <input
                            type="text"
                            name="firstName"
                            required
                            value={formData.firstName}
                            onChange={handleInputChange}
                            className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-300 dark:border-[#2a2a2d] bg-white dark:bg-[#252528] text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                            placeholder="John"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          Last Name *
                        </label>
                        <input
                          type="text"
                          name="lastName"
                          required
                          value={formData.lastName}
                          onChange={handleInputChange}
                          className="w-full px-4 py-3 rounded-xl border border-gray-300 dark:border-[#2a2a2d] bg-white dark:bg-[#252528] text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                          placeholder="Doe"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Work Email *
                      </label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                        <input
                          type="email"
                          name="email"
                          required
                          value={formData.email}
                          onChange={handleInputChange}
                          className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-300 dark:border-[#2a2a2d] bg-white dark:bg-[#252528] text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                          placeholder="john@company.com"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Company *
                      </label>
                      <div className="relative">
                        <Building className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                        <input
                          type="text"
                          name="company"
                          required
                          value={formData.company}
                          onChange={handleInputChange}
                          className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-300 dark:border-[#2a2a2d] bg-white dark:bg-[#252528] text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                          placeholder="Your Company"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          Company Size *
                        </label>
                        <select
                          name="companySize"
                          required
                          value={formData.companySize}
                          onChange={handleInputChange}
                          className="w-full px-4 py-3 rounded-xl border border-gray-300 dark:border-[#2a2a2d] bg-white dark:bg-[#252528] text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                        >
                          <option value="">Select size</option>
                          {companySizes.map((size) => (
                            <option key={size} value={size}>
                              {size}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          Phone Number
                        </label>
                        <div className="relative">
                          <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                          <input
                            type="tel"
                            name="phone"
                            value={formData.phone}
                            onChange={handleInputChange}
                            className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-300 dark:border-[#2a2a2d] bg-white dark:bg-[#252528] text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                            placeholder="+1 (555) 000-0000"
                          />
                        </div>
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Country *
                      </label>
                      <div className="relative">
                        <Globe className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                        <input
                          type="text"
                          name="country"
                          required
                          value={formData.country}
                          onChange={handleInputChange}
                          className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-300 dark:border-[#2a2a2d] bg-white dark:bg-[#252528] text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                          placeholder="United States"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        How can we help you? *
                      </label>
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-4">
                        {helpTypes.map((type) => (
                          <button
                            key={type.value}
                            type="button"
                            onClick={() =>
                              setFormData((prev) => ({
                                ...prev,
                                helpType: type.value,
                              }))
                            }
                            className={`flex flex-col items-center justify-center p-4 rounded-xl border transition-all ${
                              formData.helpType === type.value
                                ? "border-blue-500 bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400"
                                : "border-gray-300 dark:border-[#2a2a2d] hover:border-gray-400 dark:hover:border-[#3a3a3d]"
                            }`}
                          >
                            <type.icon className="h-5 w-5 mb-2" />
                            <span className="text-xs font-medium">
                              {type.label}
                            </span>
                          </button>
                        ))}
                      </div>
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
                        placeholder="Tell us about your project, requirements, and timeline..."
                      />
                    </div>

                    <Button
                      type="submit"
                      disabled={isLoading}
                      className="w-full py-6 text-lg font-semibold rounded-xl bg-linear-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-lg hover:shadow-xl transition-all duration-300"
                    >
                      {isLoading ? (
                        <span className="flex items-center justify-center gap-2">
                          <div className="h-5 w-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                          Sending...
                        </span>
                      ) : (
                        <span className="flex items-center justify-center gap-2">
                          Send Message to Sales Team
                          <ArrowRight className="h-4 w-4" />
                        </span>
                      )}
                    </Button>

                    {error && (
                      <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="p-4 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-500/30"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
                            <span className="text-red-600 dark:text-red-400 font-bold">
                              !
                            </span>
                          </div>
                          <p className="text-red-700 dark:text-red-300">
                            {error}
                          </p>
                        </div>
                        <p className="mt-2 text-sm text-red-600 dark:text-red-400">
                          Please try again or contact us directly at
                          sales@yourcompany.com
                        </p>
                      </motion.div>
                    )}
                  </form>

                  {isSubmitted && (
                    <motion.div
                      initial={{ scale: 0.9, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      className="text-center py-12"
                    >
                      <motion.div
                        animate={{ scale: [1, 1.2, 1] }}
                        transition={{ duration: 0.5 }}
                        className="w-20 h-20 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-6"
                      >
                        <CheckCircle2 className="h-10 w-10 text-green-600 dark:text-green-400" />
                      </motion.div>
                      <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                        Message Sent Successfully!
                      </h3>
                      <p className="text-gray-600 dark:text-gray-400 mb-6">
                        Thank you for reaching out. We've sent a confirmation
                        email to:
                      </p>
                      <div className="bg-gray-50 dark:bg-[#252528] rounded-xl p-4 mb-6 inline-block">
                        <div className="flex items-center gap-2">
                          <Mail className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                          <code className="text-lg font-mono text-gray-900 dark:text-white">
                            {formData.email}
                          </code>
                        </div>
                      </div>
                      <p className="text-gray-600 dark:text-gray-400 mb-8">
                        Our sales team will contact you within 24 hours. Please
                        check your inbox (and spam folder) for our confirmation.
                      </p>
                      <Button
                        onClick={() => {
                          setIsSubmitted(false);
                          setFormData({
                            firstName: "",
                            lastName: "",
                            email: "",
                            company: "",
                            companySize: "",
                            phone: "",
                            country: "",
                            message: "",
                            helpType: "general",
                          });
                        }}
                        className="bg-linear-to-r from-blue-600 to-indigo-600 text-white"
                      >
                        Send Another Message
                      </Button>
                    </motion.div>
                  )}
                </>
              )}
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="space-y-8"
          >
            <div className="bg-linear-to-br from-blue-50 to-indigo-50 dark:from-[#1a1a1c] dark:to-[#252528] rounded-3xl p-8 border border-gray-200 dark:border-[#2a2a2d]">
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
                Why Choose Enterprise?
              </h3>

              <motion.div
                className="grid grid-cols-1 sm:grid-cols-2 gap-6"
                variants={containerVariants}
                initial="hidden"
                animate="visible"
              >
                {benefits.map((benefit, index) => (
                  <motion.div
                    key={benefit.title}
                    variants={itemVariants}
                    className="group"
                  >
                    <motion.div
                      whileHover="hover"
                      variants={cardVariants}
                      className="p-4 rounded-2xl bg-white dark:bg-[#1a1a1c] border border-gray-200 dark:border-[#2a2a2d] hover:border-blue-300 dark:hover:border-blue-500/30 transition-all"
                    >
                      <div className="flex items-start gap-4">
                        <div className="w-12 h-12 rounded-xl bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center shrink-0">
                          <benefit.icon className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                        </div>
                        <div>
                          <h4 className="font-semibold text-gray-900 dark:text-white mb-1">
                            {benefit.title}
                          </h4>
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            {benefit.description}
                          </p>
                        </div>
                      </div>
                    </motion.div>
                  </motion.div>
                ))}
              </motion.div>
            </div>

            <div className="bg-white dark:bg-[#1a1a1c] rounded-3xl p-8 border border-gray-200 dark:border-[#2a2a2d]">
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
                Other Ways to Reach Us
              </h3>

              <div className="space-y-6">
                <div className="flex items-center gap-4 p-4 rounded-2xl bg-gray-50 dark:bg-[#252528]">
                  <div className="w-12 h-12 rounded-xl bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                    <Mail className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900 dark:text-white">
                      Email
                    </h4>
                    <p className="text-gray-600 dark:text-gray-400">
                      clario-sales@company.com
                    </p>
                    <p className="text-sm text-gray-500 dark:text-gray-500">
                      Typically responds within 2 hours
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-4 p-4 rounded-2xl bg-gray-50 dark:bg-[#252528]">
                  <div className="w-12 h-12 rounded-xl bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                    <Phone className="h-6 w-6 text-green-600 dark:text-green-400" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900 dark:text-white">
                      Phone
                    </h4>
                    <p className="text-gray-600 dark:text-gray-400">
                      +1 (888) 123-4567
                    </p>
                    <p className="text-sm text-gray-500 dark:text-gray-500">
                      Mon-Fri, 9am-6pm EST
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-4 p-4 rounded-2xl bg-gray-50 dark:bg-[#252528]">
                  <div className="w-12 h-12 rounded-xl bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
                    <Calendar className="h-6 w-6 text-purple-600 dark:text-purple-400" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900 dark:text-white">
                      Book a Demo
                    </h4>
                    <p className="text-gray-600 dark:text-gray-400">
                      30-minute personalized walkthrough
                    </p>
                    <Button
                      variant="outline"
                      className="mt-2"
                      onClick={() => router.push("/book-demo")}
                    >
                      Schedule Demo
                      <Calendar className="ml-2 h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-32">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="text-center mb-12"
        >
          <h2 className="text-4xl lg:text-5xl font-bold text-gray-900 dark:text-white mb-6">
            Trusted by Industry Leaders
          </h2>
          <p className="text-xl text-gray-600 dark:text-gray-400 max-w-3xl mx-auto">
            See what our enterprise customers have to say about working with our
            sales team.
          </p>
        </motion.div>

        <motion.div
          className="grid grid-cols-1 md:grid-cols-3 gap-8"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          {testimonials.map((testimonial, index) => (
            <motion.div
              key={testimonial.name}
              variants={itemVariants}
              className="relative"
            >
              <div className="bg-white dark:bg-[#1a1a1c] rounded-3xl p-8 border border-gray-200 dark:border-[#2a2a2d] h-full">
                <div className="flex items-center gap-1 mb-4">
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      className="h-5 w-5 fill-yellow-400 text-yellow-400"
                    />
                  ))}
                </div>
                <p className="text-gray-700 dark:text-gray-300 italic mb-6">
                  "{testimonial.content}"
                </p>
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-linear-to-br from-blue-500 to-indigo-500 flex items-center justify-center text-white font-bold">
                    {testimonial.name.charAt(0)}
                  </div>
                  <div>
                    <h4 className="font-bold text-gray-900 dark:text-white">
                      {testimonial.name}
                    </h4>
                    <p className="text-gray-600 dark:text-gray-400 text-sm">
                      {testimonial.role}
                    </p>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </motion.div>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 mb-32">
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.5 }}
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
                <Sparkles className="h-16 w-16 text-white/80 mx-auto mb-6" />
              </motion.div>
              <h2 className="text-4xl lg:text-6xl font-bold text-white mb-6">
                Ready to Transform Your Business?
              </h2>
              <p className="text-blue-100 text-xl mb-10 max-w-2xl mx-auto">
                Join thousands of enterprises who have accelerated their growth
                with our platform.
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
                  onClick={() => router.push("/pricing")}
                >
                  View Pricing Plans
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </motion.div>
              <motion.div whileHover={{ scale: 1.05 }}>
                <Button
                  size="lg"
                  className="bg-transparent text-white hover:bg-white/10 font-semibold text-lg px-8 py-3 rounded-xl border-2 border-white/30 hover:border-white"
                  onClick={() => router.push("/book-demo")}
                >
                  Book a Demo
                  <Calendar className="ml-2 h-5 w-5" />
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
            className="ml-4 hover:text-blue-600 dark:hover:text-blue-400"
          >
            Privacy Policy
          </a>
          <a
            href="/terms"
            className="ml-4 hover:text-blue-600 dark:hover:text-blue-400"
          >
            Terms of Service
          </a>
        </p>
      </motion.div>
    </div>
  );
}
