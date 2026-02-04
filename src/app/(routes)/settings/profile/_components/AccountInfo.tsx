"use client";

import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import {
  CreditCard,
  Download,
  Shield,
  Calendar,
  FileText,
  Users,
  Database,
  Zap,
  Lock,
  CheckCircle,
  Clock,
  Mail,
  User as UserIcon,
  ChevronDown,
  ChevronUp,
  Star,
  Target,
  BarChart3,
  ShieldCheck,
  Server,
  Headphones,
  Share2,
  Palette,
  FileBarChart,
  Zap as ZapIcon,
  Users2,
  Building,
  BookOpen,
  Award,
  ExternalLink,
  Loader2,
  Github,
  X,
  HardDrive,
  HardDriveIcon,
  Save,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { GithubConnectModal } from "@/app/(routes)/dashboard/_components/github-modal/GithubConnectModal";
import { GithubProvider } from "@/app/_context/GithubContext";

const PLANS = {
  FREE: {
    name: "Free",
    storage: "2GB",
    limitBytes: 2147483648, // 2GB in bytes
    features: [
      { name: "Basic collaboration", icon: <Users className="h-4 w-4" /> },
      { name: "2GB storage", icon: <Database className="h-4 w-4" /> },
      { name: "Standard support", icon: <Headphones className="h-4 w-4" /> },
      { name: "Public sharing", icon: <Share2 className="h-4 w-4" /> },
    ],
    color: "from-gray-600 to-gray-700",
    description: "Perfect for getting started",
  },
  PRO: {
    name: "Pro",
    storage: "10GB",
    limitBytes: 10737418240, // 10GB in bytes
    features: [
      { name: "Advanced collaboration", icon: <Users2 className="h-4 w-4" /> },
      { name: "10GB storage", icon: <Database className="h-4 w-4" /> },
      { name: "Priority support", icon: <Headphones className="h-4 w-4" /> },
      { name: "Private sharing", icon: <Share2 className="h-4 w-4" /> },
      { name: "Custom branding", icon: <Palette className="h-4 w-4" /> },
      { name: "Advanced analytics", icon: <BarChart3 className="h-4 w-4" /> },
    ],
    color: "from-red-600 to-pink-600",
    description: "For teams and professionals",
  },
  ENTERPRISE: {
    name: "Enterprise",
    storage: "20GB",
    limitBytes: 21474836480, // 20GB in bytes
    features: [
      { name: "Everything in Pro", icon: <CheckCircle className="h-4 w-4" /> },
      { name: "20GB storage", icon: <Database className="h-4 w-4" /> },
      { name: "Dedicated support", icon: <Headphones className="h-4 w-4" /> },
      { name: "SAML/SSO", icon: <ShieldCheck className="h-4 w-4" /> },
      { name: "Custom contracts", icon: <FileBarChart className="h-4 w-4" /> },
      { name: "On-premise deployment", icon: <Server className="h-4 w-4" /> },
      { name: "Training & onboarding", icon: <BookOpen className="h-4 w-4" /> },
      { name: "99.9% SLA", icon: <Award className="h-4 w-4" /> },
    ],
    color: "from-indigo-600 to-blue-600",
    description: "For large organizations",
  },
} as const;

type PlanType = keyof typeof PLANS;

interface TwoFactorStatus {
  isEnabled: boolean;
  method: string | null;
  error?: string;
}

interface StorageStats {
  storage: {
    usedBytes: string;
    usedFormatted: string;
    usedFormattedGB: string;
    limitBytes: string;
    limitFormatted: string;
    limitFormattedGB: string;
    percentage: number;
    remainingBytes: string;
    remainingFormatted: string;
    remainingFormattedGB: string;
  };
  teamStorage: {
    teamId: string;
    teamName: string;
    usedFormatted: string;
    usedFormattedGB: string;
    limitFormatted: string;
    limitFormattedGB: string;
    availableFormatted: string;
    availableFormattedGB: string;
    percentage: number;
    creatorPlan: PlanType;
    filesCount: number;
    membersCount: number;
  };
  requiresUpgrade: boolean;
}

export function AccountInfo() {
  const router = useRouter();
  const [showAccountDetails, setShowAccountDetails] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [githubConnected, setGithubConnected] = useState(false);
  const [githubRepo, setGithubRepo] = useState<string | null>(null);
  const [isLoadingGithub, setIsLoadingGithub] = useState(false);
  const [githubModalOpen, setGithubModalOpen] = useState(false);
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false);
  const [twoFactorMethod, setTwoFactorMethod] = useState<string | null>(null);

  const { data: settings, isLoading } = useQuery({
    queryKey: ["user-settings"],
    queryFn: async () => {
      const res = await fetch("/api/users/settings");
      if (!res.ok) throw new Error("Failed to fetch settings");
      return res.json();
    },
  });

  const { data: storageData, isLoading: isLoadingStorage } = useQuery({
    queryKey: ["storage-stats", settings?.teamId],
    queryFn: async () => {
      if (!settings?.teamId) return null;
      const res = await fetch(
        `/api/users/storage?teamId=${settings.teamId}&includeTrash=true`,
      );
      if (!res.ok) throw new Error("Failed to fetch storage stats");
      return res.json();
    },
    enabled: !!settings?.teamId,
  });

  const { data: twoFactorStatus, isLoading: isLoading2FA } =
    useQuery<TwoFactorStatus>({
      queryKey: ["two-factor-status"],
      queryFn: async () => {
        try {
          const res = await fetch("/api/auth/2fa/status");
          if (!res.ok) {
            console.error("Failed to fetch 2FA status:", res.status);
            return { enabled: false, method: null };
          }
          return await res.json();
        } catch (error) {
          console.error("Error fetching 2FA status:", error);
          return { enabled: false, method: null };
        }
      },
      refetchOnWindowFocus: true,
    });

  useEffect(() => {
    if (settings?.teamId) {
      checkGitHubConnection(settings.teamId);
    }
  }, [settings?.teamId]);

  useEffect(() => {
    if (twoFactorStatus) {
      setTwoFactorEnabled(twoFactorStatus.isEnabled || false);
      setTwoFactorMethod(twoFactorStatus.method || null);
    }
  }, [twoFactorStatus]);

  const checkGitHubConnection = async (teamId: string) => {
    try {
      setIsLoadingGithub(true);
      const response = await fetch(`/api/github/connect?teamId=${teamId}`);

      if (response.ok) {
        const data = await response.json();
        setGithubConnected(data.connected);
        if (data.data) {
          setGithubRepo(`${data.data.owner}/${data.data.repo}`);
        }
      }
    } catch (error) {
      console.error("Error checking GitHub connection:", error);
    } finally {
      setIsLoadingGithub(false);
    }
  };

  const handleDisconnectGitHub = async (teamId: string) => {
    if (!confirm("Are you sure you want to disconnect GitHub repository?")) {
      return;
    }

    try {
      setIsLoadingGithub(true);
      const response = await fetch("/api/github/connect", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ teamId }),
      });

      if (response.ok) {
        setGithubConnected(false);
        setGithubRepo(null);
        toast.success("GitHub disconnected successfully");
      } else {
        throw new Error("Failed to disconnect");
      }
    } catch (error) {
      toast.error("Failed to disconnect GitHub");
    } finally {
      setIsLoadingGithub(false);
    }
  };

  if (isLoading || isLoadingStorage) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  const user = settings?.user;
  const planType = (user?.plan || "FREE") as PlanType;
  const currentPlan = PLANS[planType];

  // Форматирование байтов в читаемый формат
  const formatStorage = (bytes: number): { value: string; unit: string } => {
    if (!bytes || bytes === 0) return { value: "0", unit: "MB" };

    const units = ["B", "KB", "MB", "GB", "TB"];
    let unitIndex = 0;
    let value = bytes;

    while (value >= 1024 && unitIndex < units.length - 1) {
      value /= 1024;
      unitIndex++;
    }

    // Для GB и TB показываем 1 decimal, для MB и ниже - целые числа
    const decimals = unitIndex >= 3 ? 1 : 0;

    return {
      value: value.toFixed(decimals),
      unit: units[unitIndex],
    };
  };

  // Получаем реальные данные из API
  const usedBytes = storageData?.storage?.usedBytes
    ? Number(storageData.storage.usedBytes)
    : 0;

  const limitBytes = currentPlan.limitBytes;
  const percentage = storageData?.storage?.percentage
    ? Math.min(storageData.storage.percentage, 100)
    : usedBytes > 0
      ? Math.min((usedBytes / limitBytes) * 100, 100)
      : 0;

  // Форматируем для отображения
  const usedFormatted = formatStorage(usedBytes);
  const limitFormatted = formatStorage(limitBytes);

  // Для отображения в GB
  const usedGB = (usedBytes / 1024 ** 3).toFixed(1);
  const limitGB = (limitBytes / 1024 ** 3).toFixed(0);

  const filesCount = storageData?.files?.inTrash
    ? `${storageData.teamStorage?.filesCount || 0} files (${storageData.files.inTrash} in trash)`
    : `${storageData?.teamStorage?.filesCount || 0} files`;

  const getAvailableSpaceMessage = () => {
    if (storageData?.storage?.remainingFormattedGB) {
      return `${storageData.storage.remainingFormattedGB} available`;
    }

    if (percentage < 50) {
      return "Plenty of storage space available";
    } else if (percentage < 80) {
      return "Storage usage is moderate";
    } else if (percentage < 90) {
      return "Storage usage is high";
    } else {
      return "Storage almost full! Consider managing your files.";
    }
  };

  const shouldShowWarning = percentage >= 80;

  const handleUpgrade = () => {
    router.push("/pricing");
  };

  const handleExportData = async () => {
    setIsExporting(true);
    try {
      const response = await fetch("/api/users/export-data");

      if (!response.ok) {
        throw new Error("Export failed");
      }

      const data = await response.json();
      const blob = new Blob([JSON.stringify(data, null, 2)], {
        type: "application/json",
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `user-data-${new Date().toISOString().split("T")[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toast.success("Data exported successfully!");
    } catch (error) {
      console.error("Export error:", error);
      toast.error("Failed to export data");
    } finally {
      setIsExporting(false);
    }
  };

  const handleDeleteAccount = () => {
    if (
      confirm(
        "Are you sure you want to delete your account? This action cannot be undone.",
      )
    ) {
      toast.info("Account deletion feature coming soon");
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getTwoFactorMethodText = (method: string | null) => {
    if (!method) return "Not set";

    switch (method.toLowerCase()) {
      case "authenticator":
        return "Authenticator App";
      case "email":
        return "Email";
      case "sms":
        return "SMS";
      default:
        return method;
    }
  };

  const showUpgradeButton = planType !== "ENTERPRISE";

  return (
    <GithubProvider>
      <div className="space-y-8">
        <div className="grid gap-6 md:grid-cols-2">
          <Card className="border shadow-sm dark:border-gray-700 dark:bg-gray-900/30">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-xl">Current Plan</CardTitle>
                  <CardDescription>{currentPlan.description}</CardDescription>
                </div>
                <Badge
                  className={`bg-linear-to-r ${currentPlan.color} text-white`}
                >
                  {currentPlan.name}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <HardDrive className="h-5 w-5 text-gray-500 dark:text-gray-400" />
                      <span className="font-medium">Storage Usage</span>
                    </div>
                    <span className="text-sm font-medium">
                      {usedFormatted.value} {usedFormatted.unit} / {limitGB} GB
                      used
                    </span>
                  </div>
                  <Progress value={percentage} className="h-2" />
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {shouldShowWarning ? (
                      <span className="text-amber-600 font-medium">
                        ⚠️ Storage almost full! Consider managing your files.
                      </span>
                    ) : (
                      getAvailableSpaceMessage()
                    )}
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-4 pt-2">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <Database className="h-4 w-4 text-gray-500 dark:text-gray-400" />
                      <span className="text-sm font-medium">Storage Used</span>
                    </div>
                    <p className="text-2xl font-bold">
                      {usedFormatted.value} {usedFormatted.unit}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {filesCount}
                    </p>
                  </div>
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <FileText className="h-4 w-4 text-gray-500 dark:text-gray-400" />
                      <span className="text-sm font-medium">Storage Limit</span>
                    </div>
                    <p className="text-2xl font-bold">{limitGB} GB</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {planType === "ENTERPRISE"
                        ? "20GB Enterprise plan"
                        : "Total available"}
                    </p>
                  </div>
                </div>
              </div>

              {showUpgradeButton && (
                <Button
                  onClick={handleUpgrade}
                  className={`w-full bg-linear-to-r ${
                    planType === "FREE"
                      ? "from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
                      : "from-red-600 to-pink-600 hover:from-red-700 hover:to-pink-700"
                  } text-white`}
                >
                  <CreditCard className="mr-2 h-4 w-4" />
                  {planType === "FREE"
                    ? "Upgrade to Pro"
                    : "Upgrade to Enterprise"}
                </Button>
              )}

              <div className="pt-4 border-t dark:border-gray-700">
                <h4 className="font-medium mb-3 flex items-center gap-2">
                  <Star className="h-4 w-4 text-amber-500" />
                  Key Features
                </h4>
                <div className="space-y-2">
                  {currentPlan.features.slice(0, 4).map((feature, index) => (
                    <div key={index} className="flex items-center gap-2">
                      <div className="text-green-600">
                        <CheckCircle className="h-4 w-4" />
                      </div>
                      <span className="text-sm">{feature.name}</span>
                    </div>
                  ))}
                  {currentPlan.features.length > 4 && (
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      + {currentPlan.features.length - 4} more features
                    </p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border shadow-sm dark:border-gray-700 dark:bg-gray-900/30">
            <CardHeader>
              <CardTitle className="text-xl">Account Details</CardTitle>
              <CardDescription>
                Your personal account information
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <UserIcon className="h-4 w-4" />
                    <span>Username</span>
                  </div>
                  <p className="font-medium text-lg">
                    {user?.name || "Not set"}
                  </p>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Mail className="h-4 w-4" />
                    <span>Email Address</span>
                  </div>
                  <p className="font-medium">{user?.email}</p>
                  <p className="text-sm text-muted-foreground">
                    Used for login and notifications
                  </p>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Calendar className="h-4 w-4" />
                    <span>Member Since</span>
                  </div>
                  <p className="font-medium">
                    {user?.createdAt
                      ? formatDate(user.createdAt)
                      : "Not available"}
                  </p>
                </div>
              </div>

              <div className="space-y-4">
                <Button
                  variant="outline"
                  className="w-full justify-between"
                  onClick={() => setShowAccountDetails(!showAccountDetails)}
                >
                  <div className="flex items-center gap-2">
                    <Shield className="h-4 w-4" />
                    <span>Sensitive Information</span>
                  </div>
                  {showAccountDetails ? (
                    <ChevronUp className="h-4 w-4" />
                  ) : (
                    <ChevronDown className="h-4 w-4" />
                  )}
                </Button>

                {showAccountDetails && (
                  <div className="animate-in fade-in">
                    <div className="p-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg border dark:border-gray-700 space-y-6">
                      <div className="grid gap-4 md:grid-cols-2">
                        <div className="space-y-2">
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Shield className="h-4 w-4" />
                            <span>Account ID</span>
                          </div>
                          <div className="space-y-2">
                            <p className="font-mono text-xs bg-white dark:bg-gray-800 p-2 rounded border dark:border-gray-700 break-all text-foreground">
                              {user?.id || "Not available"}
                            </p>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                navigator.clipboard.writeText(user?.id || "");
                                toast.success("Account ID copied to clipboard");
                              }}
                              className="w-full"
                            >
                              Copy Account ID
                            </Button>
                          </div>
                        </div>

                        <div className="space-y-2">
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Clock className="h-4 w-4" />
                            <span>Last Login</span>
                          </div>
                          <p className="text-sm bg-white dark:bg-gray-800 p-3 rounded border dark:border-gray-700 text-foreground">
                            {user?.lastLoginAt
                              ? formatDate(user.lastLoginAt)
                              : "Not available"}
                          </p>
                        </div>
                      </div>

                      <div className="space-y-4">
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <ExternalLink className="h-4 w-4" />
                          <span>Connected Services</span>
                        </div>

                        <div className="grid gap-4 sm:grid-cols-2">
                          <div className="relative p-4 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
                            <div className="flex flex-col items-center text-center">
                              <div className="p-3 rounded-full mb-3 bg-blue-100 dark:bg-blue-900/30">
                                <div className="h-6 w-6">
                                  <svg
                                    className="h-full w-full text-blue-600 dark:text-blue-400"
                                    viewBox="0 0 24 24"
                                  >
                                    <path
                                      fill="currentColor"
                                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                                    />
                                    <path
                                      fill="currentColor"
                                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                                    />
                                    <path
                                      fill="currentColor"
                                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                                    />
                                    <path
                                      fill="currentColor"
                                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                                    />
                                  </svg>
                                </div>
                              </div>

                              <span className="text-sm font-medium text-foreground mb-2">
                                Google Account
                              </span>

                              <p className="text-xs text-muted-foreground mb-3">
                                {user?.email || "Not available"}
                              </p>

                              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800">
                                <CheckCircle className="h-3 w-3 text-green-600 dark:text-green-400" />
                                <span className="text-xs font-medium text-green-600 dark:text-green-400">
                                  Connected
                                </span>
                              </div>
                            </div>
                          </div>

                          <div className="relative p-4 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
                            {githubConnected && (
                              <Button
                                size="icon"
                                variant="ghost"
                                onClick={() => {
                                  const teamId = settings?.teamId;
                                  if (
                                    teamId &&
                                    confirm(
                                      "Are you sure you want to disconnect GitHub repository?",
                                    )
                                  ) {
                                    handleDisconnectGitHub(teamId);
                                  }
                                }}
                                disabled={isLoadingGithub}
                                className="absolute top-2 right-2 h-7 w-7 text-gray-500 hover:text-red-600 dark:text-gray-400 dark:hover:text-red-400"
                                title="Disconnect repository"
                              >
                                {isLoadingGithub ? (
                                  <Loader2 className="h-3 w-3 animate-spin" />
                                ) : (
                                  <X className="h-3 w-3" />
                                )}
                              </Button>
                            )}

                            <div className="flex flex-col items-center text-center">
                              <div
                                className={`p-3 rounded-full mb-3 ${
                                  githubConnected
                                    ? "bg-green-100 dark:bg-green-900/30"
                                    : "bg-gray-100 dark:bg-gray-800"
                                }`}
                              >
                                <Github
                                  className={`h-6 w-6 ${
                                    githubConnected
                                      ? "text-green-600 dark:text-green-400"
                                      : "text-gray-500 dark:text-gray-400"
                                  }`}
                                />
                              </div>

                              <span className="text-sm font-medium text-foreground mb-2">
                                GitHub
                              </span>

                              {githubRepo ? (
                                <>
                                  <p className="text-xs text-muted-foreground mb-3 truncate max-w-full">
                                    {githubRepo}
                                  </p>
                                  <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800">
                                    <CheckCircle className="h-3 w-3 text-green-600 dark:text-green-400" />
                                    <span className="text-xs font-medium text-green-600 dark:text-green-400">
                                      Connected
                                    </span>
                                  </div>
                                </>
                              ) : (
                                <>
                                  <p className="text-xs text-muted-foreground mb-3">
                                    Repository not connected
                                  </p>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={async () => {
                                      const teamId = settings?.teamId;
                                      if (!teamId) {
                                        toast.error(
                                          "No team found. Please create or join a team first.",
                                        );
                                        return;
                                      }

                                      try {
                                        const checkResponse = await fetch(
                                          `/api/github/check?teamId=${teamId}`,
                                        );
                                        const checkData =
                                          await checkResponse.json();

                                        if (checkData.connected) {
                                          setGithubModalOpen(true);
                                        } else {
                                          setGithubModalOpen(true);
                                        }
                                      } catch (error) {
                                        console.error(
                                          "Failed to check GitHub connection:",
                                          error,
                                        );
                                        setGithubModalOpen(true);
                                      }
                                    }}
                                    disabled={isLoadingGithub}
                                    className="border-blue-200 dark:border-blue-800 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20"
                                  >
                                    {isLoadingGithub ? (
                                      <Loader2 className="h-3 w-3 animate-spin mr-2" />
                                    ) : (
                                      <Github className="h-3 w-3 mr-2" />
                                    )}
                                    Connect
                                  </Button>

                                  <GithubConnectModal
                                    open={githubModalOpen}
                                    onOpenChange={setGithubModalOpen}
                                    onRepoConnected={() => {
                                      setIsLoadingGithub(true);
                                      setTimeout(() => {
                                        setIsLoadingGithub(false);
                                        toast.success(
                                          "GitHub repository connected successfully!",
                                        );
                                      }, 1000);
                                    }}
                                  />
                                </>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <div className="space-y-3 pt-4 border-t dark:border-gray-700">
                <h4 className="font-medium">Account Actions</h4>
                <div className="grid gap-2 sm:grid-cols-2">
                  <Button
                    variant="outline"
                    className="w-full justify-start"
                    onClick={handleExportData}
                    disabled={isExporting}
                  >
                    {isExporting ? (
                      <>
                        <div className="h-4 w-4 mr-2 border-2 border-current border-t-transparent rounded-full animate-spin" />
                        Exporting...
                      </>
                    ) : (
                      <>
                        <Download className="mr-2 h-4 w-4" />
                        Export All Data
                      </>
                    )}
                  </Button>

                  <Button
                    variant="outline"
                    className="w-full justify-start text-blue-600 hover:text-blue-700 hover:bg-blue-50 dark:hover:bg-blue-900/20"
                    onClick={() => router.push("/settings/security")}
                  >
                    <Shield className="mr-2 h-4 w-4" />
                    Security Settings
                  </Button>

                  <Button
                    variant="outline"
                    className="w-full justify-start text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20 sm:col-span-2"
                    onClick={handleDeleteAccount}
                  >
                    Delete Account
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card className="border shadow-sm dark:border-gray-700 dark:bg-gray-900/30">
          <CardHeader>
            <CardTitle className="text-xl flex items-center gap-2 text-foreground">
              {planType === "PRO" ? (
                <Star className="h-5 w-5 text-purple-600 dark:text-purple-400" />
              ) : planType === "ENTERPRISE" ? (
                <Building className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
              ) : (
                <ZapIcon className="h-5 w-5 text-gray-600 dark:text-gray-400" />
              )}
              {currentPlan.name} Plan Features
            </CardTitle>
            <CardDescription className="text-muted-foreground">
              All features included in your current plan
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {currentPlan.features.map((feature, index) => (
                <div
                  key={index}
                  className="group flex items-start gap-3 p-4 rounded-lg border dark:border-gray-700 hover:bg-accent/50 transition-colors hover:shadow-sm cursor-pointer"
                  onClick={() => {
                    toast.info(feature.name, {
                      description: getFeatureDescription(feature.name),
                      className:
                        "dark:bg-gray-800 dark:text-white dark:border-gray-700",
                    });
                  }}
                >
                  <div
                    className={`p-2 rounded-lg ${
                      planType === "FREE"
                        ? "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 group-hover:bg-gray-200 dark:group-hover:bg-gray-700"
                        : planType === "PRO"
                          ? "bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 group-hover:bg-purple-200 dark:group-hover:bg-purple-800/40"
                          : "bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 group-hover:bg-indigo-200 dark:group-hover:bg-indigo-800/40"
                    } transition-colors`}
                  >
                    {feature.icon}
                  </div>
                  <div className="flex-1">
                    <h4 className="font-medium text-foreground group-hover:text-foreground/90">
                      {feature.name}
                    </h4>
                    <p className="text-sm text-muted-foreground mt-1">
                      {getFeatureDescription(feature.name)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="border shadow-sm dark:border-gray-700 dark:bg-gray-900/30">
          <CardHeader>
            <CardTitle className="text-xl flex items-center gap-2 text-foreground">
              <BarChart3 className="h-5 w-5 text-green-600 dark:text-green-400" />
              Usage Insights
            </CardTitle>
            <CardDescription className="text-muted-foreground">
              Detailed analytics and usage statistics
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-6 md:grid-cols-3">
              <div className="space-y-2 p-4 rounded-lg bg-linear-to-br from-green-50 to-emerald-50 dark:from-green-900/10 dark:to-emerald-900/10 border dark:border-gray-700">
                <div className="flex items-center gap-2">
                  <HardDriveIcon className="h-5 w-5 text-green-600 dark:text-green-400" />
                  <span className="font-medium text-foreground">
                    Storage Used
                  </span>
                </div>
                <p className="text-3xl font-bold text-foreground">
                  {usedFormatted.value} {usedFormatted.unit}
                </p>
                <p className="text-sm text-muted-foreground">
                  {storageData?.teamStorage?.filesCount || 0} files in your
                  workspace
                  {storageData?.files?.inTrash > 0 && (
                    <span className="text-amber-500 ml-1">
                      • {storageData.files.inTrash} in trash
                    </span>
                  )}
                </p>
                <div className="pt-2">
                  <Progress value={percentage} className="h-1.5" />
                  <p className="text-xs text-muted-foreground mt-1">
                    {Math.round(percentage)}% of {limitGB} GB used
                  </p>
                </div>
              </div>

              {/* Остальные секции остаются без изменений */}
              <div className="space-y-2 p-4 rounded-lg bg-linear-to-br from-blue-50 to-cyan-50 dark:from-blue-900/10 dark:to-cyan-900/10 border dark:border-gray-700">
                <div className="flex items-center gap-2">
                  <Clock className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                  <span className="font-medium text-foreground">
                    Account Age
                  </span>
                </div>
                <p className="text-3xl font-bold text-foreground">
                  {user?.createdAt
                    ? Math.floor(
                        (new Date().getTime() -
                          new Date(user.createdAt).getTime()) /
                          (1000 * 60 * 60 * 24),
                      )
                    : 0}
                </p>
                <p className="text-sm text-muted-foreground">
                  Days since registration
                </p>
                <div className="pt-2">
                  <p className="text-xs text-blue-600 dark:text-blue-400">
                    🎉 Thank you for being with us!
                  </p>
                </div>
              </div>

              <div className="space-y-2 p-4 rounded-lg bg-linear-to-br from-purple-50 to-pink-50 dark:from-purple-900/10 dark:to-pink-900/10 border dark:border-gray-700">
                <div className="flex items-center gap-2">
                  <Save className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                  <span className="font-medium text-foreground">
                    Storage Limit
                  </span>
                </div>
                <p className="text-3xl font-bold text-foreground">
                  {limitGB} GB
                </p>
                <p className="text-sm text-muted-foreground">
                  {planType === "ENTERPRISE"
                    ? "20GB Enterprise plan"
                    : "Total storage available"}
                </p>
                {storageData?.storage && (
                  <div className="pt-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-muted-foreground">Available</span>
                      <span className="font-medium text-foreground">
                        {storageData.storage.remainingFormattedGB}
                      </span>
                    </div>
                    <Progress value={percentage} className="h-1.5 mt-1" />
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {planType !== "ENTERPRISE" && (
          <Card className="border shadow-sm dark:border-gray-700 dark:bg-gray-900/30">
            <CardHeader>
              <CardTitle className="text-xl flex items-center gap-2 text-foreground">
                <Target className="h-5 w-5 text-amber-600 dark:text-amber-400" />
                Upgrade Recommendations
              </CardTitle>
              <CardDescription className="text-muted-foreground">
                See what you could get with an upgrade
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="p-4 rounded-lg bg-linear-to-r from-amber-50 to-orange-50 dark:from-amber-900/10 dark:to-orange-900/10 border border-amber-200 dark:border-amber-800">
                  <p className="text-foreground mb-3">
                    With{" "}
                    <span className="font-bold">
                      {planType === "FREE" ? "Pro" : "Enterprise"}
                    </span>{" "}
                    plan, you would get:
                  </p>
                  <div className="grid gap-3 md:grid-cols-2">
                    {(planType === "FREE"
                      ? PLANS.PRO
                      : PLANS.ENTERPRISE
                    ).features
                      .filter(
                        (feature) =>
                          !currentPlan.features.some(
                            (f) => f.name === feature.name,
                          ),
                      )
                      .slice(0, 6)
                      .map((feature, index) => (
                        <div
                          key={index}
                          className="flex items-center gap-2 p-3 rounded-lg border border-dashed border-amber-300 dark:border-amber-700 bg-background"
                        >
                          <div className="p-2 rounded-lg bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400">
                            <Star className="h-4 w-4" />
                          </div>
                          <div>
                            <span className="font-medium text-foreground">
                              {feature.name}
                            </span>
                            <p className="text-xs text-muted-foreground mt-0.5">
                              {getFeatureDescription(feature.name)}
                            </p>
                          </div>
                        </div>
                      ))}
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-bold text-lg text-foreground">
                      {planType === "FREE" ? "$10/month" : "$25/month"}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {planType === "FREE"
                        ? "Billed annually: $8/month"
                        : "Billed annually: $20/month"}
                    </p>
                  </div>
                  <Button
                    onClick={handleUpgrade}
                    className="bg-linear-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white"
                  >
                    <CreditCard className="mr-2 h-4 w-4" />
                    Upgrade Now
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        <Card className="border shadow-sm dark:border-gray-700 dark:bg-gray-900/30">
          <CardHeader>
            <CardTitle className="text-xl flex items-center gap-2 text-foreground">
              <ShieldCheck className="h-5 w-5 text-green-600 dark:text-green-400" />
              Security Tips
            </CardTitle>
            <CardDescription className="text-muted-foreground">
              Keep your account safe and secure
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-3">
              <div className="space-y-2 p-4 rounded-lg border dark:border-gray-700">
                <div className="flex items-center gap-2">
                  <Lock className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                  <span className="font-medium text-foreground">
                    Strong Password
                  </span>
                </div>
                <p className="text-sm text-muted-foreground">
                  Use a unique password with letters, numbers, and symbols
                </p>
              </div>

              <div className="space-y-2 p-4 rounded-lg border dark:border-gray-700">
                <div className="flex items-center gap-2">
                  <Shield className="h-5 w-5 text-green-600 dark:text-green-400" />
                  <span className="font-medium text-foreground">
                    Two-Factor Authentication
                  </span>
                </div>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">
                      Status
                    </span>
                    <Badge
                      variant={twoFactorEnabled ? "default" : "outline"}
                      className={
                        twoFactorEnabled
                          ? "bg-green-100 text-green-800 hover:bg-green-100 dark:bg-green-900/30 dark:text-green-400"
                          : ""
                      }
                    >
                      <span className="cursor-default">
                        {twoFactorEnabled ? "Enabled" : "Disabled"}
                      </span>
                    </Badge>
                  </div>

                  {twoFactorEnabled && twoFactorMethod && (
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">
                        Method
                      </span>
                      <span className="text-sm font-medium">
                        {getTwoFactorMethodText(twoFactorMethod)}
                      </span>
                    </div>
                  )}

                  <p className="text-sm text-muted-foreground">
                    {twoFactorEnabled
                      ? "Your account is protected with two-factor authentication"
                      : "Add an extra layer of security to your account"}
                  </p>

                  <Button
                    size="sm"
                    variant={"outline"}
                    className="w-full"
                    onClick={() => router.push("/settings/security")}
                  >
                    {twoFactorEnabled ? "Manage 2FA" : "Enable 2FA"}
                  </Button>
                </div>
              </div>

              <div className="space-y-2 p-4 rounded-lg border dark:border-gray-700">
                <div className="flex items-center gap-2">
                  <ExternalLink className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                  <span className="font-medium text-foreground">
                    Connected Apps
                  </span>
                </div>
                <p className="text-sm text-muted-foreground">
                  Review and manage third-party app permissions
                </p>
                <Button
                  size="sm"
                  variant="outline"
                  className="mt-2 border-input bg-background hover:bg-accent hover:text-accent-foreground"
                  onClick={() => router.push("/settings/apps")}
                  disabled
                >
                  Manage Apps
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </GithubProvider>
  );
}

function getFeatureDescription(featureName: string): string {
  switch (featureName) {
    case "Basic collaboration":
      return "Share files with team members";
    case "2GB storage":
      return "Total storage space available";
    case "Standard support":
      return "Email support with 48-hour response";
    case "Public sharing":
      return "Share files with public links";
    case "Advanced collaboration":
      return "Real-time collaboration with permissions";
    case "10GB storage":
      return "Ample space for all your documents";
    case "Priority support":
      return "24/7 chat support with 2-hour response";
    case "Private sharing":
      return "Share files with password protection";
    case "Custom branding":
      return "Add your logo and brand colors";
    case "Advanced analytics":
      return "Detailed usage reports and insights";
    case "Everything in Pro":
      return "All Pro features plus more";
    case "20GB storage":
      return "Generous storage for enterprise needs";
    case "Dedicated support":
      return "Personal account manager";
    case "SAML/SSO":
      return "Enterprise-grade authentication";
    case "Custom contracts":
      return "Tailored agreements and pricing";
    case "On-premise deployment":
      return "Deploy on your own servers";
    case "Training & onboarding":
      return "Custom training for your team";
    case "99.9% SLA":
      return "Enterprise reliability guarantee";
    default:
      return "";
  }
}
