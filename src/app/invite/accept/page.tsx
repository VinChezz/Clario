"use client";

import { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, CheckCircle, XCircle } from "lucide-react";

export default function AcceptInvitePage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get("token");

  const [status, setStatus] = useState<"loading" | "success" | "error">(
    "loading"
  );
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (!token) {
      setStatus("error");
      setMessage("Invalid invitation link");
      return;
    }

    const acceptInvite = async () => {
      try {
        const response = await fetch("/api/invite/accept", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ token }),
        });

        const data = await response.json();

        if (response.ok) {
          setStatus("success");
          setMessage(`You have successfully joined ${data.team.name}!`);

          setTimeout(() => {
            router.push("/dashboard");
          }, 2000);
        } else {
          setStatus("error");
          setMessage(data.error || "Failed to accept invitation");
        }
      } catch (error) {
        setStatus("error");
        setMessage("An error occurred while accepting the invitation");
      }
    };

    acceptInvite();
  }, [token, router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-linear-to-br from-blue-50 to-indigo-100 dark:from-[#1a1a1c] dark:to-[#252528] p-4">
      <Card className="w-full max-w-md bg-white dark:bg-[#1a1a1c] border-gray-200 dark:border-[#2a2a2d] shadow-lg">
        <CardHeader className="text-center space-y-2">
          <CardTitle className="text-2xl font-bold text-gray-900 dark:text-[#f0f0f0]">
            Team Invitation
          </CardTitle>
          <CardDescription className="text-gray-600 dark:text-[#a0a0a0]">
            {status === "loading" && "Processing your invitation..."}
            {status === "success" && "Welcome to the team!"}
            {status === "error" && "Invitation failed"}
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col items-center space-y-6">
          {status === "loading" && (
            <>
              <div className="relative">
                <div className="absolute -inset-4 bg-blue-500/20 dark:bg-blue-400/20 rounded-full blur-md" />
                <Loader2 className="h-12 w-12 animate-spin text-blue-500 dark:text-blue-400 relative z-10" />
              </div>
              <p className="text-gray-600 dark:text-[#a0a0a0] text-center">
                Please wait while we process your invitation...
              </p>
            </>
          )}

          {status === "success" && (
            <>
              <div className="relative">
                <div className="absolute -inset-4 bg-green-500/20 dark:bg-green-400/20 rounded-full blur-md" />
                <CheckCircle className="h-12 w-12 text-green-500 dark:text-green-400 relative z-10" />
              </div>
              <Alert className="bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800">
                <AlertDescription className="text-green-800 dark:text-green-300">
                  {message}
                </AlertDescription>
              </Alert>
              <p className="text-sm text-gray-600 dark:text-[#707070]">
                Redirecting to dashboard...
              </p>
              <div className="w-full pt-2">
                <div className="h-1 w-full bg-gray-200 dark:bg-[#2a2a2d] rounded-full overflow-hidden">
                  <div className="h-full bg-green-500 dark:bg-green-400 animate-pulse w-full"></div>
                </div>
              </div>
            </>
          )}

          {status === "error" && (
            <>
              <div className="relative">
                <div className="absolute -inset-4 bg-red-500/20 dark:bg-red-400/20 rounded-full blur-md" />
                <XCircle className="h-12 w-12 text-red-500 dark:text-red-400 relative z-10" />
              </div>
              <Alert className="bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800">
                <AlertDescription className="text-red-800 dark:text-red-300">
                  {message}
                </AlertDescription>
              </Alert>
              <Button
                onClick={() => router.push("/dashboard")}
                className="w-full bg-linear-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 dark:from-blue-500 dark:to-indigo-500 dark:hover:from-blue-600 dark:hover:to-indigo-600 text-white font-medium"
              >
                Go to Dashboard
              </Button>
              <Button
                variant="outline"
                onClick={() => window.location.reload()}
                className="w-full border-gray-300 dark:border-[#2a2a2d] text-gray-700 dark:text-[#a0a0a0] hover:bg-gray-100 dark:hover:bg-[#252528]"
              >
                Try Again
              </Button>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
