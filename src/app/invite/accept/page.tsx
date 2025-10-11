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
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold">Team Invitation</CardTitle>
          <CardDescription>
            {status === "loading" && "Processing your invitation..."}
            {status === "success" && "Welcome to the team!"}
            {status === "error" && "Invitation failed"}
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col items-center space-y-4">
          {status === "loading" && (
            <>
              <Loader2 className="h-12 w-12 animate-spin text-blue-500" />
              <p className="text-gray-600">
                Please wait while we process your invitation...
              </p>
            </>
          )}

          {status === "success" && (
            <>
              <CheckCircle className="h-12 w-12 text-green-500" />
              <Alert className="bg-green-50 border-green-200">
                <AlertDescription className="text-green-800">
                  {message}
                </AlertDescription>
              </Alert>
              <p className="text-sm text-gray-600">
                Redirecting to dashboard...
              </p>
            </>
          )}

          {status === "error" && (
            <>
              <XCircle className="h-12 w-12 text-red-500" />
              <Alert className="bg-red-50 border-red-200">
                <AlertDescription className="text-red-800">
                  {message}
                </AlertDescription>
              </Alert>
              <Button
                onClick={() => router.push("/dashboard")}
                className="w-full"
              >
                Go to Dashboard
              </Button>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
