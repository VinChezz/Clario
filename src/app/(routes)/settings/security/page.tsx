"use client";

import { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Shield,
  Key,
  Smartphone,
  Mail,
  CheckCircle,
  XCircle,
  Loader2,
  Copy,
  RefreshCw,
  AlertTriangle,
  LogOut,
  Clock,
  ShieldCheck,
  Monitor,
  Globe,
  MapPin,
  Check,
  ArrowLeft,
  Lock,
  UserCheck,
  Scan,
  Eye,
  EyeOff,
  QrCode,
} from "lucide-react";

type TwoFactorStatus = {
  isEnabled: boolean;
  method: "email" | "totp" | null;
  lastUsed?: string;
};

type ConfirmDialog = {
  open: boolean;
  title: string;
  description: string;
  action: () => void;
  variant?: "default" | "destructive";
};

export default function SecuritySettingsPage() {
  const [loading, setLoading] = useState(false);
  const [notification, setNotification] = useState("");
  const [status, setStatus] = useState<TwoFactorStatus>({
    isEnabled: false,
    method: null,
  });
  const [setupStep, setSetupStep] = useState<
    "idle" | "method" | "verify" | "complete"
  >("idle");
  const [selectedMethod, setSelectedMethod] = useState<"email" | "totp">(
    "email"
  );
  const [verificationCode, setVerificationCode] = useState("");
  const [qrCodeData, setQrCodeData] = useState<string>("");
  const [totpSecret, setTotpSecret] = useState("");
  const [showSecret, setShowSecret] = useState(false);
  const [backupCodes, setBackupCodes] = useState<string[]>([]);
  const [isShowingBackupCodes, setIsShowingBackupCodes] = useState(false);
  const [confirmDialog, setConfirmDialog] = useState<ConfirmDialog>({
    open: false,
    title: "",
    description: "",
    action: () => {},
  });

  useEffect(() => {
    fetchTwoFactorStatus();
  }, []);

  const showNotification = (msg: string) => {
    setNotification(msg);
    setTimeout(() => setNotification(""), 3000);
  };

  const showConfirm = (
    title: string,
    description: string,
    action: () => void,
    variant: "default" | "destructive" = "default"
  ) => {
    setConfirmDialog({ open: true, title, description, action, variant });
  };

  const handleConfirm = () => {
    confirmDialog.action();
    setConfirmDialog({ ...confirmDialog, open: false });
  };

  const fetchTwoFactorStatus = async () => {
    try {
      const res = await fetch("/api/auth/2fa/status");
      if (res.ok) {
        const data = await res.json();
        setStatus(data);
      }
    } catch (error) {
      console.error("Failed to fetch 2FA status:", error);
    }
  };

  const handleEnable2FA = async () => {
    if (status.isEnabled) {
      showConfirm(
        "Disable Two-Factor Authentication",
        "This will reduce your account security. Are you sure you want to continue?",
        async () => {
          setLoading(true);
          try {
            const res = await fetch("/api/auth/2fa/disable", {
              method: "POST",
            });
            if (res.ok) {
              showNotification("2FA disabled successfully");
              setStatus({ isEnabled: false, method: null });
              setSetupStep("idle");
            } else {
              showNotification("Failed to disable 2FA");
            }
          } catch (error) {
            showNotification("Failed to disable 2FA");
          } finally {
            setLoading(false);
          }
        },
        "destructive"
      );
    } else {
      setSetupStep("method");
    }
  };

  const handleSelectMethod = async (method: "email" | "totp") => {
    setSelectedMethod(method);
    setLoading(true);

    try {
      if (method === "email") {
        const res = await fetch("/api/auth/2fa/send", { method: "POST" });
        if (res.ok) {
          showNotification("Verification code sent to your email");
          setSetupStep("verify");
        } else {
          showNotification("Failed to send verification code");
        }
      } else if (method === "totp") {
        const res = await fetch("/api/auth/2fa/totp/setup", {
          method: "POST",
        });

        if (res.ok) {
          const data = await res.json();
          setQrCodeData(data.qrCode);
          setTotpSecret(data.secret);
          setSetupStep("verify");
          showNotification("Scan QR code with your authenticator app");
        } else {
          const error = await res.json();
          showNotification(error.error || "Failed to setup TOTP");
        }
      }
    } catch (error) {
      showNotification("Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyCode = async () => {
    if (!verificationCode || verificationCode.length !== 6) {
      showNotification("Please enter a valid 6-digit code");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/auth/2fa/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          code: verificationCode,
          method: selectedMethod,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        setStatus({
          isEnabled: true,
          method: selectedMethod,
        });

        if (data.backupCodes) {
          setBackupCodes(data.backupCodes);
          setIsShowingBackupCodes(true);
        }

        setSetupStep("complete");
        showNotification("2FA enabled successfully!");

        // Автоматически скрыть backup codes через 10 секунд
        setTimeout(() => {
          setIsShowingBackupCodes(false);
        }, 10000);

        // Сбросить состояние через 3 секунды
        setTimeout(() => {
          setSetupStep("idle");
          setVerificationCode("");
          setQrCodeData("");
          setTotpSecret("");
        }, 3000);
      } else {
        const error = await res.json();
        showNotification(error.error || "Invalid verification code");
      }
    } catch (error) {
      showNotification("Failed to verify code");
    } finally {
      setLoading(false);
    }
  };

  const generateBackupCodes = async () => {
    showConfirm(
      "Generate New Backup Codes",
      "This will invalidate your existing backup codes. Make sure to save the new ones.",
      async () => {
        setLoading(true);
        try {
          const res = await fetch("/api/auth/2fa/backup-codes", {
            method: "POST",
          });
          if (res.ok) {
            const data = await res.json();
            setBackupCodes(data.codes);
            setIsShowingBackupCodes(true);
            showNotification("New backup codes generated");
          } else {
            showNotification("Failed to generate backup codes");
          }
        } catch (error) {
          showNotification("Failed to generate backup codes");
        } finally {
          setLoading(false);
        }
      }
    );
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    showNotification("Copied to clipboard!");
  };

  const copyBackupCodes = () => {
    navigator.clipboard.writeText(backupCodes.join("\n"));
    showNotification("Backup codes copied!");
  };

  const calculateSecurityScore = () => {
    let score = 40;

    if (status.isEnabled) {
      score += 40;
    }

    score += 20;

    return score;
  };

  const securityScore = calculateSecurityScore();

  const securityChecks = [
    {
      icon: <Lock className="h-4 w-4" />,
      title: "Strong Password",
      description: "Use a unique password with letters, numbers, and symbols",
      completed: true,
      color: "blue",
    },
    {
      icon: <Shield className="h-4 w-4" />,
      title: "Two-Factor Authentication",
      description: "Add an extra layer of security to your account",
      completed: status.isEnabled,
      color: "green",
    },
    {
      icon: <UserCheck className="h-4 w-4" />,
      title: "Email Verified",
      description: "Your email address is verified",
      completed: true,
      color: "purple",
    },
  ];

  const completedChecks = securityChecks.filter((c) => c.completed).length;

  const downloadQRCode = () => {
    if (!qrCodeData) return;

    const link = document.createElement("a");
    link.href = qrCodeData;
    link.download = "2fa-qr-code.png";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showNotification("QR code downloaded");
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 p-8">
      {notification && (
        <div className="fixed top-4 right-4 z-50 bg-background border rounded-lg shadow-lg p-4 flex items-center gap-2 animate-in slide-in-from-top">
          <Check className="h-4 w-4 text-green-600" />
          <p className="text-sm">{notification}</p>
        </div>
      )}

      <Dialog
        open={confirmDialog.open}
        onOpenChange={(open) => setConfirmDialog({ ...confirmDialog, open })}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{confirmDialog.title}</DialogTitle>
            <DialogDescription>{confirmDialog.description}</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() =>
                setConfirmDialog({ ...confirmDialog, open: false })
              }
            >
              Cancel
            </Button>
            <Button
              variant={confirmDialog.variant || "default"}
              onClick={handleConfirm}
            >
              Continue
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Header */}
      <div className="flex items-center gap-4 mt-6">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => (window.location.href = "/settings/profile")}
          className="gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
          Back
        </Button>
        <div className="flex-1 space-y-1">
          <h1 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white">
            Security
          </h1>
          <p className="text-sm text-muted-foreground">
            Manage your account security and authentication
          </p>
        </div>
      </div>

      <Card className="border shadow-sm dark:border-gray-700 dark:bg-gray-900/30">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <ShieldCheck className="h-4 w-4" />
            Security Score
          </CardTitle>
          <CardDescription className="text-xs">
            Your account security status
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Account Protection</span>
              <span className="text-2xl font-bold">{securityScore}%</span>
            </div>
            <Progress value={securityScore} className="h-2" />
            <p className="text-xs text-muted-foreground">
              {securityScore >= 80
                ? "Excellent security level"
                : securityScore >= 60
                ? "Good security level"
                : "Consider improving your security"}
            </p>
          </div>

          <div className="space-y-2 pt-2">
            <p className="text-sm font-medium">
              Security Checklist ({completedChecks}/{securityChecks.length})
            </p>
            <div className="space-y-2">
              {securityChecks.map((check, i) => (
                <div
                  key={i}
                  className={`p-3 rounded-lg border ${
                    check.completed ? "bg-muted/50" : "bg-background"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`p-2 rounded-full ${
                        check.completed
                          ? check.color === "blue"
                            ? "bg-blue-100 dark:bg-blue-900/30"
                            : check.color === "green"
                            ? "bg-green-100 dark:bg-green-900/30"
                            : "bg-purple-100 dark:bg-purple-900/30"
                          : "bg-gray-100 dark:bg-gray-800"
                      }`}
                    >
                      {check.icon}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-medium">{check.title}</p>
                        {check.completed && (
                          <CheckCircle className="h-4 w-4 text-green-600" />
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {check.description}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="border shadow-sm dark:border-gray-700 dark:bg-gray-900/30">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <CardTitle className="text-base flex items-center gap-2">
                <Shield className="h-4 w-4" />
                Two-Factor Authentication
              </CardTitle>
              <CardDescription className="text-xs">
                Add an extra layer of security
              </CardDescription>
            </div>
            <Badge
              variant={status.isEnabled ? "default" : "secondary"}
              className={
                status.isEnabled
                  ? "bg-green-100 text-green-800 hover:bg-green-100 dark:bg-green-900/30 dark:text-green-400"
                  : ""
              }
            >
              {status.isEnabled ? "Enabled" : "Disabled"}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Status */}
          <div className="flex items-center justify-between p-3 rounded-lg border">
            <div className="flex items-center gap-3">
              {status.isEnabled ? (
                <CheckCircle className="h-5 w-5 text-green-600" />
              ) : (
                <XCircle className="h-5 w-5 text-gray-400" />
              )}
              <div>
                <p className="text-sm font-medium">
                  {status.isEnabled ? "Protected" : "Not Protected"}
                </p>
                <p className="text-xs text-muted-foreground">
                  {status.isEnabled
                    ? `Using ${
                        status.method === "email"
                          ? "email verification"
                          : "authenticator app"
                      }`
                    : "Enable 2FA to secure your account"}
                </p>
              </div>
            </div>
            <Button
              onClick={handleEnable2FA}
              variant={status.isEnabled ? "outline" : "outline"}
              size="sm"
              disabled={loading}
              className={
                status.isEnabled
                  ? "text-red-600 border-red-200 hover:bg-red-50 hover:text-red-700"
                  : "text-green-600 border-green-200 hover:bg-green-50 hover:text-green-700"
              }
            >
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : status.isEnabled ? (
                "Disable"
              ) : (
                "Enable"
              )}
            </Button>
          </div>

          {/* Setup Method Selection */}
          {setupStep === "method" && (
            <div className="space-y-3 p-4 rounded-lg border bg-muted/30">
              <p className="text-sm font-medium">
                Choose authentication method
              </p>
              <div className="grid gap-2">
                <button
                  onClick={() => handleSelectMethod("email")}
                  disabled={loading}
                  className={`flex items-center gap-3 p-3 rounded-lg border hover:bg-accent transition-colors text-left ${
                    selectedMethod === "email"
                      ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20"
                      : ""
                  }`}
                >
                  <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900/30">
                    <Mail className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium">Email Verification</p>
                    <p className="text-xs text-muted-foreground">
                      Receive codes via email
                    </p>
                  </div>
                  {selectedMethod === "email" && (
                    <CheckCircle className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                  )}
                </button>
                <button
                  onClick={() => handleSelectMethod("totp")}
                  disabled={loading}
                  className={`flex items-center gap-3 p-3 rounded-lg border hover:bg-accent transition-colors text-left ${
                    selectedMethod === "totp"
                      ? "border-green-500 bg-green-50 dark:bg-green-900/20"
                      : ""
                  }`}
                >
                  <div className="p-2 rounded-lg bg-green-100 dark:bg-green-900/30">
                    <Smartphone className="h-5 w-5 text-green-600 dark:text-green-400" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium">Authenticator App</p>
                    <p className="text-xs text-muted-foreground">
                      Google Authenticator, Authy, etc.
                    </p>
                  </div>
                  {selectedMethod === "totp" && (
                    <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400" />
                  )}
                </button>
              </div>
              <div className="flex gap-2">
                <Button
                  onClick={() => handleSelectMethod(selectedMethod)}
                  disabled={loading}
                  className="flex-1"
                  size="sm"
                >
                  {loading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    "Continue"
                  )}
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSetupStep("idle")}
                  className="flex-1"
                >
                  Cancel
                </Button>
              </div>
            </div>
          )}

          {/* Verification Step - TOTP */}
          {setupStep === "verify" && selectedMethod === "totp" && (
            <div className="space-y-4 p-4 rounded-lg border bg-muted/30">
              <h3 className="text-sm font-medium flex items-center gap-2">
                <Scan className="h-4 w-4 text-green-600" />
                Setup Authenticator App
              </h3>

              <div className="grid md:grid-cols-2 gap-6">
                {/* QR Code Section */}
                <div className="space-y-3">
                  <p className="text-sm font-medium">Scan QR Code</p>
                  <div className="border rounded-lg p-4 flex justify-center bg-white">
                    {qrCodeData ? (
                      <div className="relative">
                        <img
                          src={qrCodeData}
                          alt="QR Code for 2FA"
                          className="w-48 h-48"
                        />
                        <div className="absolute top-0 right-0 flex gap-1">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={downloadQRCode}
                            className="h-7 w-7 p-0"
                            title="Download QR code"
                          >
                            <Download className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <div className="w-48 h-48 flex items-center justify-center border-2 border-dashed">
                        <QrCode className="h-12 w-12 text-gray-300" />
                      </div>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground text-center">
                    1. Open authenticator app
                    <br />
                    2. Tap "Add account"
                    <br />
                    3. Scan this QR code
                  </p>
                </div>

                {/* Manual Entry Section */}
                <div className="space-y-3">
                  <p className="text-sm font-medium">Or enter manually</p>
                  <div className="space-y-2">
                    <Label htmlFor="secret-key" className="text-xs">
                      Secret Key
                    </Label>
                    <div className="relative">
                      <Input
                        id="secret-key"
                        type={showSecret ? "text" : "password"}
                        value={totpSecret}
                        readOnly
                        className="font-mono text-sm pr-10"
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute right-1 top-1 h-7 w-7 p-0"
                        onClick={() => setShowSecret(!showSecret)}
                      >
                        {showSecret ? (
                          <EyeOff className="h-3 w-3" />
                        ) : (
                          <Eye className="h-3 w-3" />
                        )}
                      </Button>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => copyToClipboard(totpSecret)}
                        className="flex-1"
                      >
                        <Copy className="h-3 w-3 mr-1" />
                        Copy Key
                      </Button>
                    </div>
                  </div>

                  <div className="space-y-2 pt-2">
                    <Label htmlFor="totp-code" className="text-xs">
                      Verification Code
                    </Label>
                    <Input
                      id="totp-code"
                      placeholder="000000"
                      maxLength={6}
                      value={verificationCode}
                      onChange={(e) =>
                        setVerificationCode(
                          e.target.value.replace(/[^0-9]/g, "")
                        )
                      }
                      className="text-center text-lg tracking-widest font-mono"
                    />
                    <p className="text-xs text-muted-foreground">
                      Enter 6-digit code from your app
                    </p>
                  </div>

                  <Alert className="bg-amber-50 border-amber-200 dark:bg-amber-900/20 dark:border-amber-800">
                    <AlertTriangle className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                    <AlertDescription className="text-xs text-amber-800 dark:text-amber-200">
                      Save your secret key! You'll need it if you lose your
                      device.
                    </AlertDescription>
                  </Alert>
                </div>
              </div>

              <div className="flex gap-2 pt-2">
                <Button
                  onClick={handleVerifyCode}
                  disabled={loading || verificationCode.length !== 6}
                  className="flex-1"
                  size="sm"
                >
                  {loading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    "Verify & Enable 2FA"
                  )}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setSetupStep("method")}
                  size="sm"
                >
                  Back
                </Button>
              </div>
            </div>
          )}

          {/* Verification Step - Email */}
          {setupStep === "verify" && selectedMethod === "email" && (
            <div className="space-y-4 p-4 rounded-lg border bg-muted/30">
              <h3 className="text-sm font-medium flex items-center gap-2">
                <Mail className="h-4 w-4 text-blue-600" />
                Verify Email Code
              </h3>

              <div className="space-y-3">
                <p className="text-sm text-muted-foreground">
                  We've sent a 6-digit verification code to your email address.
                </p>

                <div className="space-y-2">
                  <Label htmlFor="email-code" className="text-xs">
                    Verification Code
                  </Label>
                  <Input
                    id="email-code"
                    placeholder="000000"
                    maxLength={6}
                    value={verificationCode}
                    onChange={(e) =>
                      setVerificationCode(e.target.value.replace(/[^0-9]/g, ""))
                    }
                    className="text-center text-lg tracking-widest font-mono"
                  />
                  <p className="text-xs text-muted-foreground">
                    Check your email for the code
                  </p>
                </div>

                <Alert className="bg-blue-50 border-blue-200 dark:bg-blue-900/20 dark:border-blue-800">
                  <AlertTriangle className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                  <AlertDescription className="text-xs text-blue-800 dark:text-blue-200">
                    The code is valid for 5 minutes. Didn't receive it? Check
                    spam folder.
                  </AlertDescription>
                </Alert>
              </div>

              <div className="flex gap-2">
                <Button
                  onClick={handleVerifyCode}
                  disabled={loading || verificationCode.length !== 6}
                  className="flex-1"
                  size="sm"
                >
                  {loading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    "Verify & Enable 2FA"
                  )}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setSetupStep("method")}
                  size="sm"
                >
                  Back
                </Button>
              </div>
            </div>
          )}

          {/* Success Step */}
          {setupStep === "complete" && (
            <div className="space-y-4 p-4 rounded-lg border bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800">
              <div className="flex items-center gap-3">
                <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400" />
                <div>
                  <p className="text-sm font-medium text-green-800 dark:text-green-300">
                    Two-Factor Authentication Enabled!
                  </p>
                  <p className="text-xs text-green-700 dark:text-green-400">
                    Your account is now protected with{" "}
                    {selectedMethod === "email"
                      ? "email verification"
                      : "authenticator app"}
                    .
                  </p>
                </div>
              </div>

              {selectedMethod === "totp" && totpSecret && (
                <Alert className="bg-amber-50 border-amber-200 dark:bg-amber-900/20 dark:border-amber-800">
                  <AlertTriangle className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                  <AlertDescription className="text-xs text-amber-800 dark:text-amber-200">
                    <div className="space-y-1">
                      <p className="font-medium">Save your secret key!</p>
                      <div className="flex items-center gap-2">
                        <code className="flex-1 p-1 bg-white dark:bg-gray-800 rounded text-xs font-mono break-all">
                          {totpSecret}
                        </code>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => copyToClipboard(totpSecret)}
                          className="h-6 text-xs"
                        >
                          <Copy className="h-3 w-3 mr-1" />
                          Copy
                        </Button>
                      </div>
                    </div>
                  </AlertDescription>
                </Alert>
              )}
            </div>
          )}

          {/* Backup Codes */}
          {status.isEnabled && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <p className="text-sm font-medium flex items-center gap-2">
                    <Key className="h-4 w-4" />
                    Backup Codes
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Use if you lose access to your authentication method
                  </p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={generateBackupCodes}
                  disabled={loading}
                >
                  <RefreshCw className="h-3 w-3 mr-2" />
                  Generate New
                </Button>
              </div>

              {isShowingBackupCodes && backupCodes.length > 0 && (
                <Alert className="bg-amber-50 border-amber-200 dark:bg-amber-900/20 dark:border-amber-800">
                  <AlertTriangle className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                  <AlertDescription>
                    <div className="space-y-3">
                      <p className="text-sm font-medium text-amber-800 dark:text-amber-300">
                        Save these backup codes!
                      </p>
                      <p className="text-xs text-amber-700 dark:text-amber-400">
                        Each code can be used only once. Store them in a secure
                        place.
                      </p>
                      <div className="grid grid-cols-2 gap-2">
                        {backupCodes.map((code, i) => (
                          <code
                            key={i}
                            className="block p-2 bg-white dark:bg-gray-800 border rounded text-center text-xs font-mono"
                          >
                            {code}
                          </code>
                        ))}
                      </div>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={copyBackupCodes}
                          className="flex-1"
                        >
                          <Copy className="h-3 w-3 mr-1" />
                          Copy All
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setIsShowingBackupCodes(false)}
                          className="flex-1"
                        >
                          Hide
                        </Button>
                      </div>
                    </div>
                  </AlertDescription>
                </Alert>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

// Добавьте эту иконку в imports
function Download(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
      <polyline points="7 10 12 15 17 10" />
      <line x1="12" x2="12" y1="15" y2="3" />
    </svg>
  );
}
