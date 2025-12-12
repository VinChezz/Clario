"use client";

import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Loader2,
  Lock,
  RefreshCw,
  Shield,
  Smartphone,
  Mail,
} from "lucide-react";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

export default function TwoFactorPage() {
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const [requires2fa, setRequires2fa] = useState<boolean | null>(null);
  const [method, setMethod] = useState<"email" | "totp" | null>(null);
  const router = useRouter();

  useEffect(() => {
    check2FAStatus();
  }, []);

  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown]);

  const check2FAStatus = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/auth/2fa/status");

      if (!res.ok) {
        throw new Error("Failed to check 2FA status");
      }

      const data = await res.json();

      if (data.requires2fa) {
        setRequires2fa(true);
        setMethod(data.method);

        if (data.method === "email") {
          sendCode();
        }
      } else {
        setRequires2fa(false);

        router.push("/dashboard");
      }
    } catch (error) {
      console.error("Failed to check 2FA status:", error);
      toast.error("Failed to load 2FA settings");

      router.push("/dashboard");
    } finally {
      setLoading(false);
    }
  };

  const sendCode = async () => {
    if (countdown > 0) return;

    setSending(true);
    try {
      const res = await fetch("/api/auth/2fa/send", {
        method: "POST",
      });

      if (!res.ok) {
        const data = await res.json();
        toast.error(data.error || "Failed to send code");
        return;
      }

      setCountdown(60);
      toast.success("Verification code sent to your email");
    } catch {
      toast.error("Failed to send code");
    } finally {
      setSending(false);
    }
  };

  const verifyCode = async () => {
    if (code.length !== 6) {
      toast.error("Please enter a 6-digit code");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/api/auth/2fa/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          code,
          method: method || "email",
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        toast.error(data.error || "Invalid code");
        return;
      }

      toast.success("2FA verification successful!");

      if (data.backupCodes) {
        toast.info("Save your backup codes! They won't be shown again.", {
          duration: 5000,
        });
      }

      setTimeout(() => {
        window.location.href = "/dashboard";
      }, 1000);
    } catch (error) {
      console.error("Verification error:", error);
      toast.error("Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  if (loading && requires2fa === null) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="text-center space-y-4">
          <Loader2 className="h-8 w-8 animate-spin mx-auto text-blue-600" />
          <p className="text-sm text-muted-foreground">
            Checking security settings...
          </p>
        </div>
      </div>
    );
  }

  if (requires2fa === false) {
    return null;
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-sm space-y-6"
      >
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-linear-to-br from-blue-50 to-blue-100 mb-3">
            <Shield className="h-6 w-6 text-blue-600" />
          </div>
          <h1 className="text-2xl font-semibold">Two-Factor Authentication</h1>
          <p className="text-sm text-muted-foreground">
            {method === "email" ? (
              <>
                <Mail className="h-4 w-4 inline mr-1" />
                Enter verification code sent to your email
              </>
            ) : method === "totp" ? (
              <>
                <Smartphone className="h-4 w-4 inline mr-1" />
                Enter code from your authenticator app
              </>
            ) : (
              "Enter verification code"
            )}
          </p>
        </div>

        <div className="space-y-4">
          <div>
            <Input
              type="text"
              maxLength={6}
              placeholder="123456"
              className="text-center text-2xl font-mono tracking-widest h-14"
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/[^0-9]/g, ""))}
              autoFocus
            />
          </div>

          <Button
            onClick={verifyCode}
            disabled={loading || code.length !== 6}
            className="w-full h-11"
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Verifying...
              </>
            ) : (
              "Verify Code"
            )}
          </Button>

          {method === "email" && (
            <div className="text-center">
              <button
                onClick={sendCode}
                disabled={sending || countdown > 0}
                className="text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                {sending ? (
                  <span className="flex items-center justify-center gap-2">
                    <Loader2 className="h-3 w-3 animate-spin" />
                    Sending...
                  </span>
                ) : countdown > 0 ? (
                  `Resend code in ${countdown}s`
                ) : (
                  <span className="flex items-center justify-center gap-2">
                    <RefreshCw className="h-3 w-3" />
                    Resend code
                  </span>
                )}
              </button>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
}
