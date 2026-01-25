"use client";

import { Button } from "@/components/ui/button";
import {
  Calendar,
  Clock,
  Users,
  Video,
  CheckCircle2,
  Star,
  Sparkles,
  Zap,
  Target,
  Globe,
  Building,
  User,
  Mail,
  Phone,
  MessageSquare,
  Shield,
  BadgeCheck,
  AlertCircle,
} from "lucide-react";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence, Variants } from "framer-motion";

export default function BookDemoPage() {
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    company: "",
    companySize: "",
    phone: "",
    country: "",
    demoType: "platform",
    preferredDate: "",
    preferredTime: "",
    timezone: "",
    attendees: "1-3",
    goals: "",
  });
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [today] = useState<string>(
    () => new Date().toISOString().split("T")[0],
  );
  const [currentTime, setCurrentTime] = useState<string>("");
  const router = useRouter();

  useEffect(() => {
    const updateCurrentTime = () => {
      const now = new Date();
      const hours = now.getHours().toString().padStart(2, "0");
      const minutes = now.getMinutes().toString().padStart(2, "0");
      setCurrentTime(`${hours}:${minutes}`);
    };

    updateCurrentTime();
    const interval = setInterval(updateCurrentTime, 60000);

    return () => clearInterval(interval);
  }, []);

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
          type: "book-demo",
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
          : "Failed to schedule your demo. Please try again or contact us directly at demo@yourcompany.com",
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

  const demoTypes = [
    {
      value: "platform",
      label: "Platform Overview",
      description: "Complete walkthrough of all features",
      duration: "45 min",
      icon: Globe,
      color: "from-blue-500 to-indigo-500",
    },
    {
      value: "enterprise",
      label: "Enterprise Solution",
      description: "Custom solutions for large teams",
      duration: "60 min",
      icon: Building,
      color: "from-purple-500 to-pink-500",
    },
    {
      value: "technical",
      label: "Technical Deep Dive",
      description: "API, integrations & architecture",
      duration: "60 min",
      icon: Zap,
      color: "from-green-500 to-emerald-500",
    },
    {
      value: "security",
      label: "Security & Compliance",
      description: "Security features and compliance",
      duration: "30 min",
      icon: Shield,
      color: "from-orange-500 to-red-500",
    },
  ];

  // Время слотов
  const timeSlots = [
    "09:00",
    "10:00",
    "11:00",
    "12:00",
    "13:00",
    "14:00",
    "15:00",
    "16:00",
    "17:00",
    "18:00",
  ];

  const timezones = [
    "EST (Eastern Time)",
    "CST (Central Time)",
    "MST (Mountain Time)",
    "PST (Pacific Time)",
    "GMT (London)",
    "CET (Central Europe)",
    "IST (India)",
    "SGT (Singapore)",
    "AEST (Sydney)",
  ];

  const attendeesOptions = [
    "1-3 people",
    "4-6 people",
    "7-10 people",
    "10+ people",
  ];

  const getOccupiedSlotsForDate = (dateStr: string): string[] => {
    const date = new Date(dateStr);
    const dayOfWeek = date.getDay();
    const dayNumber = date.getDate();

    switch (dayOfWeek) {
      case 1:
        return ["09:00", "11:00", "14:00", "15:00"];
      case 2:
        return ["11:00", "14:00", "16:00"];
      case 3:
        return ["09:00", "12:00", "14:00", "18:00"];
      case 4:
        return ["10:00", "13:00", "15:00"];
      case 5:
        return ["09:00", "12:00", "15:00", "16:00"];
      default:
        return [
          "09:00",
          "10:00",
          "11:00",
          "12:00",
          "13:00",
          "14:00",
          "15:00",
          "16:00",
          "17:00",
          "18:00",
        ];
    }
  };

  const isTimeSlotAvailable = (dateStr: string, timeStr: string): boolean => {
    const selectedDate = new Date(dateStr);
    const todayDate = new Date(today);
    todayDate.setHours(0, 0, 0, 0);

    if (selectedDate < todayDate) {
      return false;
    }

    if (dateStr === today) {
      const slotTime = timeStr.split(":");
      const slotHour = parseInt(slotTime[0]);
      const slotMinute = parseInt(slotTime[1]);

      const currentHour = parseInt(currentTime.split(":")[0]);
      const currentMinute = parseInt(currentTime.split(":")[1]);

      if (
        slotHour < currentHour ||
        (slotHour === currentHour && slotMinute <= currentMinute)
      ) {
        return false;
      }

      const totalCurrentMinutes = currentHour * 60 + currentMinute;
      const totalSlotMinutes = slotHour * 60 + slotMinute;

      if (totalSlotMinutes - totalCurrentMinutes < 60) {
        return false;
      }
    }

    const occupiedSlots = getOccupiedSlotsForDate(dateStr);
    return !occupiedSlots.includes(timeStr);
  };

  // Генерация следующих 7 дней с учетом доступности
  const next7Days = Array.from({ length: 7 }, (_, i) => {
    const date = new Date();
    date.setDate(date.getDate() + i);
    const dateStr = date.toISOString().split("T")[0];

    // День доступен, если это не сегодня (или если сегодня, но еще есть доступные слоты)
    const isToday = i === 0;
    const hasAvailableSlots = timeSlots.some((time) =>
      isTimeSlotAvailable(dateStr, time),
    );
    const available = i > 0 || (isToday && hasAvailableSlots);

    return {
      date: dateStr,
      day: date.toLocaleDateString("en-US", { weekday: "short" }),
      dayNumber: date.getDate(),
      month: date.toLocaleDateString("en-US", { month: "short" }),
      available,
      isToday,
    };
  });

  const demoBenefits = [
    {
      icon: CheckCircle2,
      title: "Live Product Tour",
      description: "See the platform in action with real use cases",
    },
    {
      icon: Users,
      title: "Team Onboarding",
      description: "Learn how to get your team started quickly",
    },
    {
      icon: Target,
      title: "Custom Solutions",
      description: "See how we can tailor the platform to your needs",
    },
    {
      icon: Clock,
      title: "Q&A Session",
      description: "Get all your questions answered in real-time",
    },
    {
      icon: Shield,
      title: "Security Walkthrough",
      description: "See our security features and compliance standards",
    },
    {
      icon: Video,
      title: "Recording Available",
      description: "Get a recording to share with your team",
    },
  ];

  const testimonials = [
    {
      name: "Jessica Parker",
      role: "Product Lead at ScaleAI",
      content:
        "The demo was incredibly insightful. The team understood our needs perfectly and showed exactly how their platform could solve our challenges.",
      rating: 5,
    },
    {
      name: "David Kim",
      role: "Engineering Director at CloudTech",
      content:
        "One of the most productive demos I've attended. Came out with a clear understanding of the ROI and implementation plan.",
      rating: 5,
    },
    {
      name: "Maria Rodriguez",
      role: "CTO at InnovateLabs",
      content:
        "The technical deep dive was exactly what we needed. The team was knowledgeable and addressed all our technical concerns.",
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

  const calendarVariants: Variants = {
    hidden: { opacity: 0, scale: 0.8 },
    visible: {
      opacity: 1,
      scale: 1,
      transition: {
        type: "spring",
        stiffness: 200,
      },
    },
  };

  // Обработчик выбора даты
  const handleDateSelect = (date: string) => {
    setFormData((prev) => ({
      ...prev,
      preferredDate: date,
      preferredTime: "", // Сбрасываем время при смене даты
    }));
    setSelectedSlot(null);
  };

  // Обработчик выбора времени
  const handleTimeSelect = (time: string) => {
    if (
      formData.preferredDate &&
      isTimeSlotAvailable(formData.preferredDate, time)
    ) {
      setSelectedSlot(time);
      setFormData((prev) => ({ ...prev, preferredTime: time }));
    }
  };

  return (
    <div className="min-h-screen bg-white dark:bg-[#0a0a0b]">
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-linear-to-br from-green-50/20 via-white to-emerald-50/20 dark:from-[#0f172a]/20 dark:via-[#0a0a0b] dark:to-[#064e3b]/20" />

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
              className="inline-flex items-center gap-2 bg-green-500/10 dark:bg-green-500/20 text-green-600 dark:text-green-400 px-4 py-2 rounded-full text-sm font-medium mb-8"
            >
              <Calendar className="h-4 w-4" />
              Book Your Personalized Demo
            </motion.div>

            <h1 className="text-5xl lg:text-7xl font-bold mb-6">
              <span className="bg-clip-text text-transparent bg-linear-to-r from-gray-900 to-gray-700 dark:from-white dark:to-gray-300">
                See Our Platform
              </span>
              <br />
              <span className="bg-clip-text text-transparent bg-linear-to-r from-green-600 to-emerald-600 dark:from-green-400 dark:to-emerald-400">
                In Action
              </span>
            </h1>

            <p className="text-xl text-gray-600 dark:text-gray-400 max-w-2xl mx-auto mb-12">
              Get a personalized walkthrough of our platform and see how it can
              transform your workflow.
            </p>

            <motion.div
              className="flex justify-center gap-8 mb-16"
              variants={containerVariants}
              initial="hidden"
              animate="visible"
            >
              {["Free Demo", "No Commitment", "Expert Guide"].map(
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
                      {index === 0
                        ? "30-60 minutes"
                        : index === 1
                          ? "No sales pressure"
                          : "Live Q&A"}
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
                    Demo Scheduled Successfully!
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400 mb-6">
                    We've sent a confirmation email to:
                  </p>
                  <div className="bg-gray-50 dark:bg-[#252528] rounded-xl p-4 mb-6 inline-block">
                    <div className="flex items-center gap-2">
                      <Mail className="h-5 w-5 text-green-600 dark:text-green-400" />
                      <code className="text-lg font-mono text-gray-900 dark:text-white">
                        {formData.email}
                      </code>
                    </div>
                  </div>
                  <p className="text-gray-600 dark:text-gray-400 mb-8">
                    Please check your inbox (and spam folder) for the meeting
                    details.
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
                        demoType: "platform",
                        preferredDate: "",
                        preferredTime: "",
                        timezone: "",
                        attendees: "1-3",
                        goals: "",
                      });
                      setSelectedSlot(null);
                    }}
                    className="bg-linear-to-r from-green-600 to-emerald-600 text-white"
                  >
                    Book Another Demo
                  </Button>
                </motion.div>
              ) : (
                <>
                  <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                    Schedule Your Demo
                  </h2>
                  <p className="text-gray-600 dark:text-gray-400 mb-8">
                    Fill out the form below to book a personalized demo with our
                    experts.
                  </p>

                  <form onSubmit={handleSubmit} className="space-y-6">
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
                          demo@yourcompany.com
                        </p>
                      </motion.div>
                    )}

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
                            className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-300 dark:border-[#2a2a2d] bg-white dark:bg-[#252528] text-gray-900 dark:text-white focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all"
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
                          className="w-full px-4 py-3 rounded-xl border border-gray-300 dark:border-[#2a2a2d] bg-white dark:bg-[#252528] text-gray-900 dark:text-white focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all"
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
                          className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-300 dark:border-[#2a2a2d] bg-white dark:bg-[#252528] text-gray-900 dark:text-white focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all"
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
                          className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-300 dark:border-[#2a2a2d] bg-white dark:bg-[#252528] text-gray-900 dark:text-white focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all"
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
                          className="w-full px-4 py-3 rounded-xl border border-gray-300 dark:border-[#2a2a2d] bg-white dark:bg-[#252528] text-gray-900 dark:text-white focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all"
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
                            className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-300 dark:border-[#2a2a2d] bg-white dark:bg-[#252528] text-gray-900 dark:text-white focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all"
                            placeholder="+1 (555) 000-0000"
                          />
                        </div>
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-4">
                        Choose Demo Type *
                      </label>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {demoTypes.map((type) => (
                          <motion.button
                            key={type.value}
                            type="button"
                            onClick={() =>
                              setFormData((prev) => ({
                                ...prev,
                                demoType: type.value,
                              }))
                            }
                            whileHover="hover"
                            variants={cardVariants}
                            className={`flex items-start gap-4 p-4 rounded-2xl border transition-all text-left ${
                              formData.demoType === type.value
                                ? "border-green-500 bg-green-50 dark:bg-green-900/20"
                                : "border-gray-300 dark:border-[#2a2a2d] hover:border-gray-400 dark:hover:border-[#3a3a3d]"
                            }`}
                          >
                            <div
                              className={`w-12 h-12 rounded-xl bg-linear-to-br ${type.color} flex items-center justify-center shrink-0`}
                            >
                              <type.icon className="h-6 w-6 text-white" />
                            </div>
                            <div>
                              <div className="font-semibold text-gray-900 dark:text-white mb-1">
                                {type.label}
                              </div>
                              <div className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                                {type.description}
                              </div>
                              <div className="text-xs font-medium text-gray-500 dark:text-gray-500">
                                {type.duration}
                              </div>
                            </div>
                          </motion.button>
                        ))}
                      </div>
                    </div>

                    <div className="space-y-6">
                      <div>
                        <div className="flex items-center justify-between mb-4">
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                            Select Date *
                          </label>
                          <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
                            <AlertCircle className="h-4 w-4" />
                            <span>Available from tomorrow</span>
                          </div>
                        </div>
                        <motion.div
                          variants={calendarVariants}
                          initial="hidden"
                          animate="visible"
                          className="grid grid-cols-7 gap-2"
                        >
                          {next7Days.map((day) => (
                            <motion.button
                              key={day.date}
                              type="button"
                              onClick={() => handleDateSelect(day.date)}
                              whileHover={{ scale: 1.05 }}
                              whileTap={{ scale: 0.95 }}
                              disabled={!day.available}
                              className={`flex flex-col items-center justify-center p-3 rounded-xl border transition-all relative ${
                                formData.preferredDate === day.date
                                  ? "border-green-500 bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400"
                                  : day.available
                                    ? "border-gray-300 dark:border-[#2a2a2d] hover:border-green-300 dark:hover:border-green-500/30"
                                    : "border-gray-200 dark:border-[#1a1a1c] bg-gray-50 dark:bg-[#252528] opacity-50 cursor-not-allowed"
                              } ${day.isToday ? "ring-2 ring-blue-500/30" : ""}`}
                            >
                              {day.isToday && (
                                <div className="absolute -top-1 -right-1 w-6 h-6 rounded-full bg-blue-500 text-white text-xs flex items-center justify-center">
                                  Now
                                </div>
                              )}
                              <div className="text-sm font-medium">
                                {day.day}
                              </div>
                              <div className="text-lg font-bold">
                                {day.dayNumber}
                              </div>
                              <div className="text-xs text-gray-500 dark:text-gray-500">
                                {day.month}
                              </div>
                            </motion.button>
                          ))}
                        </motion.div>
                      </div>

                      {formData.preferredDate && (
                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-4">
                            Select Time *{" "}
                            {formData.preferredDate === today &&
                              "(Available slots only)"}
                          </label>
                          <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                            {timeSlots.map((slot) => {
                              const isAvailable = isTimeSlotAvailable(
                                formData.preferredDate,
                                slot,
                              );
                              const isOccupied = !isAvailable;

                              return (
                                <button
                                  key={slot}
                                  type="button"
                                  onClick={() => handleTimeSelect(slot)}
                                  disabled={!isAvailable}
                                  className={`p-3 rounded-xl border text-center transition-all relative ${
                                    selectedSlot === slot && isAvailable
                                      ? "border-green-500 bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400"
                                      : isAvailable
                                        ? "border-gray-300 dark:border-[#2a2a2d] hover:border-green-300 dark:hover:border-green-500/30 text-gray-700 dark:text-gray-300"
                                        : "border-gray-200 dark:border-[#1a1a1c] bg-gray-50 dark:bg-[#252528] opacity-50 cursor-not-allowed text-gray-400"
                                  }`}
                                >
                                  {slot}
                                  {isOccupied && (
                                    <div className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-red-500" />
                                  )}
                                </button>
                              );
                            })}
                          </div>
                          {formData.preferredDate && (
                            <div className="mt-3 flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
                              <AlertCircle className="h-4 w-4" />
                              <span>
                                {formData.preferredDate === today
                                  ? `Current time: ${currentTime}. Slots within 1 hour are unavailable.`
                                  : "Red dots indicate already booked slots"}
                              </span>
                            </div>
                          )}
                        </div>
                      )}

                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          Timezone *
                        </label>
                        <select
                          name="timezone"
                          required
                          value={formData.timezone}
                          onChange={handleInputChange}
                          className="w-full px-4 py-3 rounded-xl border border-gray-300 dark:border-[#2a2a2d] bg-white dark:bg-[#252528] text-gray-900 dark:text-white focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all"
                        >
                          <option value="">Select timezone</option>
                          {timezones.map((tz) => (
                            <option key={tz} value={tz}>
                              {tz}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          Number of Attendees *
                        </label>
                        <div className="flex flex-wrap gap-2">
                          {attendeesOptions.map((option) => (
                            <button
                              key={option}
                              type="button"
                              onClick={() =>
                                setFormData((prev) => ({
                                  ...prev,
                                  attendees: option,
                                }))
                              }
                              className={`px-4 py-2 rounded-lg border transition-all ${
                                formData.attendees === option
                                  ? "border-green-500 bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400"
                                  : "border-gray-300 dark:border-[#2a2a2d] hover:border-gray-400 dark:hover:border-[#3a3a3d]"
                              }`}
                            >
                              {option}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        What are your main goals for this demo? *
                      </label>
                      <textarea
                        name="goals"
                        required
                        value={formData.goals}
                        onChange={handleInputChange}
                        rows={3}
                        className="w-full px-4 py-3 rounded-xl border border-gray-300 dark:border-[#2a2a2d] bg-white dark:bg-[#252528] text-gray-900 dark:text-white focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all"
                        placeholder="Tell us what you'd like to see, any specific challenges you're facing, or questions you have..."
                      />
                    </div>

                    <Button
                      type="submit"
                      disabled={
                        isLoading ||
                        !formData.preferredDate ||
                        !formData.preferredTime ||
                        !formData.timezone
                      }
                      className="w-full py-6 text-lg font-semibold rounded-xl bg-linear-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white shadow-lg hover:shadow-xl transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isLoading ? (
                        <span className="flex items-center justify-center gap-2">
                          <div className="h-5 w-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                          Scheduling Your Demo...
                        </span>
                      ) : (
                        <span className="flex items-center justify-center gap-2">
                          Schedule Demo
                          <Calendar className="h-4 w-4" />
                        </span>
                      )}
                    </Button>

                    <p className="text-center text-sm text-gray-500 dark:text-gray-500">
                      By scheduling a demo, you agree to our{" "}
                      <a
                        href="/privacy"
                        className="text-green-600 dark:text-green-400 hover:underline"
                      >
                        Privacy Policy
                      </a>
                      . We'll send calendar details to your email.
                    </p>
                  </form>
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
            <div className="bg-linear-to-br from-green-50 to-emerald-50 dark:from-[#1a1a1c] dark:to-[#252528] rounded-3xl p-8 border border-gray-200 dark:border-[#2a2a2d]">
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
                What to Expect
              </h3>

              <motion.div
                className="space-y-6"
                variants={containerVariants}
                initial="hidden"
                animate="visible"
              >
                {demoBenefits.map((benefit, index) => (
                  <motion.div
                    key={benefit.title}
                    variants={itemVariants}
                    className="group"
                  >
                    <motion.div
                      whileHover="hover"
                      variants={cardVariants}
                      className="flex items-start gap-4 p-4 rounded-2xl bg-white dark:bg-[#1a1a1c] border border-gray-200 dark:border-[#2a2a2d] hover:border-green-300 dark:hover:border-green-500/30 transition-all"
                    >
                      <div className="w-12 h-12 rounded-xl bg-green-100 dark:bg-green-900/30 flex items-center justify-center shrink-0">
                        <benefit.icon className="h-6 w-6 text-green-600 dark:text-green-400" />
                      </div>
                      <div>
                        <h4 className="font-semibold text-gray-900 dark:text-white mb-1">
                          {benefit.title}
                        </h4>
                        <p className="text-gray-600 dark:text-gray-400">
                          {benefit.description}
                        </p>
                      </div>
                    </motion.div>
                  </motion.div>
                ))}
              </motion.div>

              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5 }}
                className="mt-8 p-6 rounded-2xl bg-linear-to-r from-green-600/10 to-emerald-600/10 dark:from-green-500/20 dark:to-emerald-500/20 border border-green-200 dark:border-green-500/30"
              >
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-green-100 dark:bg-green-900/30 flex items-center justify-center shrink-0">
                    <Clock className="h-6 w-6 text-green-600 dark:text-green-400" />
                  </div>
                  <div>
                    <h4 className="font-bold text-gray-900 dark:text-white mb-1">
                      Booking Rules
                    </h4>
                    <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
                      <li>• Available slots starting from tomorrow</li>
                      <li>• Today's slots available with 1+ hour notice</li>
                      <li>• Different occupied slots each weekday</li>
                      <li>• Red dots indicate already booked times</li>
                    </ul>
                  </div>
                </div>
              </motion.div>
            </div>

            <div className="bg-white dark:bg-[#1a1a1c] rounded-3xl p-8 border border-gray-200 dark:border-[#2a2a2d]">
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
                Meet Your Demo Host
              </h3>

              <div className="flex items-center gap-6 mb-8">
                <div className="relative">
                  <div className="w-20 h-20 rounded-full bg-linear-to-br from-green-500 to-emerald-500" />
                  <div className="absolute -bottom-2 -right-2 w-10 h-10 rounded-full bg-blue-500 flex items-center justify-center border-4 border-white dark:border-[#1a1a1c]">
                    <BadgeCheck className="h-5 w-5 text-white" />
                  </div>
                </div>
                <div>
                  <h4 className="text-xl font-bold text-gray-900 dark:text-white">
                    Alex Morgan
                  </h4>
                  <p className="text-gray-600 dark:text-gray-400 mb-2">
                    Senior Solutions Engineer
                  </p>
                  <div className="flex items-center gap-2">
                    {[...Array(5)].map((_, i) => (
                      <Star
                        key={i}
                        className="h-4 w-4 fill-yellow-400 text-yellow-400"
                      />
                    ))}
                    <span className="text-sm text-gray-500 dark:text-gray-500">
                      4.9/5 from 200+ demos
                    </span>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-center gap-3 text-gray-600 dark:text-gray-400">
                  <CheckCircle2 className="h-5 w-5 text-green-500" />
                  <span>8+ years experience in SaaS solutions</span>
                </div>
                <div className="flex items-center gap-3 text-gray-600 dark:text-gray-400">
                  <CheckCircle2 className="h-5 w-5 text-green-500" />
                  <span>Specializes in enterprise implementations</span>
                </div>
                <div className="flex items-center gap-3 text-gray-600 dark:text-gray-400">
                  <CheckCircle2 className="h-5 w-5 text-green-500" />
                  <span>
                    Technical background with 100+ successful deployments
                  </span>
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
            Loved by Product Teams
          </h2>
          <p className="text-xl text-gray-600 dark:text-gray-400 max-w-3xl mx-auto">
            See what product leaders say about their demo experience.
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
                  <div className="w-12 h-12 rounded-full bg-linear-to-br from-green-500 to-emerald-500 flex items-center justify-center text-white font-bold">
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
          <div className="absolute inset-0 bg-linear-to-br from-green-600 via-emerald-600 to-teal-600 dark:from-green-500 dark:via-emerald-500 dark:to-teal-500" />

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
                Still Have Questions?
              </h2>
              <p className="text-green-100 text-xl mb-10 max-w-2xl mx-auto">
                Our team is here to help you make the right decision for your
                business.
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
                  className="bg-white text-green-600 hover:bg-gray-100 font-semibold text-lg px-8 py-3 rounded-xl"
                  onClick={() => router.push("/contact-sales")}
                >
                  Contact Sales
                  <MessageSquare className="ml-2 h-5 w-5" />
                </Button>
              </motion.div>
              <motion.div whileHover={{ scale: 1.05 }}>
                <Button
                  size="lg"
                  className="bg-transparent text-white hover:bg-white/10 font-semibold text-lg px-8 py-3 rounded-xl border-2 border-white/30 hover:border-white"
                  onClick={() => window.open("https://calendly.com", "_blank")}
                >
                  View Available Slots
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
            className="ml-4 hover:text-green-600 dark:hover:text-green-400"
          >
            Privacy Policy
          </a>
          <a
            href="/terms"
            className="ml-4 hover:text-green-600 dark:hover:text-green-400"
          >
            Terms of Service
          </a>
        </p>
      </motion.div>
    </div>
  );
}
