"use client";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Users, Calendar, Clock, Shield, User } from "lucide-react";
import { format } from "date-fns";
import { useRouter } from "next/navigation";
import { useState } from "react";

interface JoinTeamClientProps {
  status: "expired" | "used" | "unauthenticated" | "authenticated";
  teamName: string;
  teamMembers?: number;
  creator?: {
    name: string | null;
    email: string;
    image: string | null;
  } | null;
  expiresAt?: Date;
  usedAt?: Date | null;
  permissions?: string;
  token: string;
  user?: {
    username?: string;
    email: string;
    name?: string;
  } | null;
}

export function JoinTeamClient({
  status,
  teamName,
  teamMembers,
  creator,
  expiresAt,
  usedAt,
  permissions,
  token,
  user,
}: JoinTeamClientProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSignIn = () => {
    // Сохраняем токен в sessionStorage (более безопасно чем localStorage для временных данных)
    sessionStorage.setItem("pending_invite_token", token);
    router.push(`/api/auth/login?post_login_redirect_url=/join/${token}`);
  };

  const handleAcceptInvitation = async () => {
    setIsSubmitting(true);
    try {
      const formData = new FormData();
      formData.append("token", token);

      const response = await fetch("/api/join-team", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();

      if (response.ok) {
        router.push(data.redirectUrl || "/dashboard");
      } else {
        alert(data.error || "Failed to accept invitation");
        setIsSubmitting(false);
      }
    } catch (error) {
      console.error("Error accepting invitation:", error);
      alert("An error occurred while accepting the invitation");
      setIsSubmitting(false);
    }
  };

  const handleGoHome = () => {
    router.push("/dashboard");
  };

  if (status === "expired") {
    return (
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-red-600 dark:text-red-400">
            Invitation Expired
          </CardTitle>
          <CardDescription>This invitation link has expired.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="p-4 bg-red-50 dark:bg-red-900/20 rounded-lg">
              <p className="text-sm text-red-600 dark:text-red-400">
                This invitation link expired on{" "}
                {expiresAt ? format(expiresAt, "PPP") : "unknown date"}. Please
                ask the team admin to send you a new invitation.
              </p>
            </div>
            <Button onClick={handleGoHome} className="w-full">
              Go Home
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (status === "used") {
    return (
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Link Already Used</CardTitle>
          <CardDescription>
            This invitation link has already been used.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
              <p className="text-sm text-yellow-600 dark:text-yellow-400">
                This invitation link was used on{" "}
                {usedAt ? format(usedAt, "PPP") : "unknown date"}.
              </p>
            </div>
            <Button onClick={handleGoHome} className="w-full">
              Go Home
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (status === "unauthenticated") {
    return (
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto w-16 h-16 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center mb-4">
            <Users className="h-8 w-8 text-blue-600 dark:text-blue-400" />
          </div>
          <CardTitle>Join {teamName}</CardTitle>
          <CardDescription>
            You've been invited to join this team
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Информация о команде */}
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-gray-100 dark:bg-gray-800 rounded-lg">
                <Users className="h-4 w-4" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium">Team Members</p>
                <p className="text-sm text-gray-500">{teamMembers} members</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="p-2 bg-gray-100 dark:bg-gray-800 rounded-lg">
                <Calendar className="h-4 w-4" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium">Invited by</p>
                <p className="text-sm text-gray-500">
                  {creator?.name || creator?.email || "Unknown"}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="p-2 bg-gray-100 dark:bg-gray-800 rounded-lg">
                <Clock className="h-4 w-4" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium">Expires</p>
                <p className="text-sm text-gray-500">
                  {expiresAt ? format(expiresAt, "PPP") : "Never"}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="p-2 bg-gray-100 dark:bg-gray-800 rounded-lg">
                <Shield className="h-4 w-4" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium">Access Level</p>
                <p className="text-sm text-gray-500">
                  {permissions === "EDIT" ? "Editor" : "Viewer"}
                </p>
              </div>
            </div>
          </div>

          {/* Кнопки действий */}
          <div className="space-y-3">
            <p className="text-sm text-gray-500 text-center">
              Please sign in to accept this invitation
            </p>
            <div className="flex flex-col gap-2">
              <Button onClick={handleSignIn} className="w-full">
                Sign In to Join Team
              </Button>
              <Button
                variant="outline"
                onClick={handleGoHome}
                className="w-full"
              >
                Go Home
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (status === "authenticated") {
    return (
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto w-16 h-16 rounded-full bg-green-100 dark:bg-green-900 flex items-center justify-center mb-4">
            <Users className="h-8 w-8 text-green-600 dark:text-green-400" />
          </div>
          <CardTitle>Join {teamName}</CardTitle>
          <CardDescription>Accept invitation to join this team</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
            <p className="text-sm font-medium text-blue-700 dark:text-blue-300">
              You are signed in as
            </p>
            <p className="text-lg font-semibold text-blue-800 dark:text-blue-200">
              {user?.name || user?.username || user?.email}
            </p>
          </div>

          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-gray-100 dark:bg-gray-800 rounded-lg">
                <Shield className="h-4 w-4" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium">Your Role</p>
                <p className="text-sm text-gray-500">
                  {permissions === "EDIT" ? "Editor" : "Viewer"}
                </p>
                <p className="text-xs text-gray-400 mt-1">
                  You will have {permissions === "EDIT" ? "edit" : "view-only"}{" "}
                  access to team files
                </p>
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <Button
              onClick={handleAcceptInvitation}
              disabled={isSubmitting}
              className="w-full bg-green-600 hover:bg-green-700"
            >
              {isSubmitting ? "Accepting..." : "Accept Invitation"}
            </Button>
            <Button variant="outline" onClick={handleGoHome} className="w-full">
              Decline
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return null;
}
