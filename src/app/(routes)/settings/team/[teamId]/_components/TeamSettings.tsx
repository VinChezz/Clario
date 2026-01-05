"use client";

import { useState, useRef, useEffect } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import {
  Save,
  Trash2,
  Users,
  Globe,
  Shield,
  Archive,
  History,
  Link,
  Image as ImageIcon,
  Building,
  Mail,
  Calendar,
  ArrowLeft,
  Loader2,
  Copy,
  XCircle,
  CheckCircle,
} from "lucide-react";
import { Team, TeamSettings as TeamSettingsType } from "@prisma/client";
import { useRouter } from "next/navigation";
import { TeamLogoUpload } from "./TeamLogoUpload";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface TeamDetailedSettingsProps {
  team: Team & { teamSettings: TeamSettingsType | null };
  hasAdminAccess: boolean;
}

export function TeamDetailedSettings({
  team,
  hasAdminAccess,
}: TeamDetailedSettingsProps) {
  const router = useRouter();
  const [isSaving, setIsSaving] = useState(false);
  const [showSaveBar, setShowSaveBar] = useState(false);
  const [showShareLinkDialog, setShowShareLinkDialog] = useState(false);
  const [generatedShareLink, setGeneratedShareLink] = useState("");
  const [showTransferDialog, setShowTransferDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [selectedMemberId, setSelectedMemberId] = useState<string>("");
  const [teamMembers, setTeamMembers] = useState<
    Array<{
      id: string;
      name: string | null;
      email: string;
      role: string;
    }>
  >([]);
  const [confirmationText, setConfirmationText] = useState("");
  const [copied, setCopied] = useState(false);
  const [creator, setCreator] = useState<{
    name: string | null;
    email: string;
  } | null>(null);

  const [teamData, setTeamData] = useState({
    name: team.name,
    description: team.description || "",
    logo: team.logo || "",
  });

  const [teamSettings, setTeamSettings] = useState({
    defaultRole: team.teamSettings?.defaultRole || "VIEW",
    inviteOnly: team.teamSettings?.inviteOnly ?? true,
    requireTwoFactor: team.teamSettings?.requireTwoFactor ?? false,
    sessionTimeout: team.teamSettings?.sessionTimeout || 60,
    allowPublicLinks: team.teamSettings?.allowPublicLinks ?? true,
    autoArchive: team.teamSettings?.autoArchive ?? false,
    fileRetention: team.teamSettings?.fileRetention || "ONE_YEAR",
    versionHistory: team.teamSettings?.versionHistory ?? true,
    sessionTimeoutEnabled: (team.teamSettings?.sessionTimeout ?? 0) > 0,
  });

  const [currentValues, setCurrentValues] = useState({
    inviteOnly: team.teamSettings?.inviteOnly ?? true,
    allowPublicLinks: team.teamSettings?.allowPublicLinks ?? true,
    sessionTimeout: team.teamSettings?.sessionTimeout || 60,
    defaultRole: team.teamSettings?.defaultRole || "VIEW",
    autoArchive: team.teamSettings?.autoArchive ?? false,
    versionHistory: team.teamSettings?.versionHistory ?? true,
    fileRetention: team.teamSettings?.fileRetention || "ONE_YEAR",
  });

  useEffect(() => {
    setCurrentValues({
      inviteOnly: team.teamSettings?.inviteOnly ?? true,
      allowPublicLinks: team.teamSettings?.allowPublicLinks ?? true,
      sessionTimeout: team.teamSettings?.sessionTimeout || 60,
      defaultRole: team.teamSettings?.defaultRole || "VIEW",
      autoArchive: team.teamSettings?.autoArchive ?? false,
      versionHistory: team.teamSettings?.versionHistory ?? true,
      fileRetention: team.teamSettings?.fileRetention || "ONE_YEAR",
    });
  }, [team]);

  useEffect(() => {
    setTeamData({
      name: team.name,
      description: team.description || "",
      logo: team.logo || "",
    });

    setTeamSettings({
      defaultRole: team.teamSettings?.defaultRole || "VIEW",
      inviteOnly: team.teamSettings?.inviteOnly ?? true,
      requireTwoFactor: team.teamSettings?.requireTwoFactor ?? false,
      sessionTimeout: team.teamSettings?.sessionTimeout || 60,
      allowPublicLinks: team.teamSettings?.allowPublicLinks ?? true,
      autoArchive: team.teamSettings?.autoArchive ?? false,
      fileRetention: team.teamSettings?.fileRetention || "ONE_YEAR",
      versionHistory: team.teamSettings?.versionHistory ?? true,
      sessionTimeoutEnabled: (team.teamSettings?.sessionTimeout ?? 0) > 0,
    });
  }, [team]);

  useEffect(() => {
    const hasChanges =
      teamData.name !== team.name ||
      teamData.description !== (team.description || "") ||
      teamData.logo !== (team.logo || "") ||
      teamSettings.defaultRole !== (team.teamSettings?.defaultRole || "VIEW") ||
      teamSettings.inviteOnly !== (team.teamSettings?.inviteOnly ?? true) ||
      teamSettings.requireTwoFactor !==
        (team.teamSettings?.requireTwoFactor ?? false) ||
      teamSettings.sessionTimeout !==
        (team.teamSettings?.sessionTimeout || 60) ||
      teamSettings.allowPublicLinks !==
        (team.teamSettings?.allowPublicLinks ?? true) ||
      teamSettings.autoArchive !== (team.teamSettings?.autoArchive ?? false) ||
      teamSettings.fileRetention !==
        (team.teamSettings?.fileRetention || "ONE_YEAR") ||
      teamSettings.versionHistory !==
        (team.teamSettings?.versionHistory ?? true) ||
      teamSettings.sessionTimeoutEnabled !==
        (team.teamSettings?.sessionTimeout ?? 0) > 0;

    setShowSaveBar(hasChanges);
  }, [teamData, teamSettings, team]);

  const handleTeamDataChange = (
    field: keyof typeof teamData,
    value: string
  ) => {
    setTeamData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleTeamSettingsChange = (
    field: keyof typeof teamSettings,
    value: any
  ) => {
    setTeamSettings((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleLogoUpdate = (logoUrl: string) => {
    setTeamData((prev) => ({
      ...prev,
      logo: logoUrl,
    }));
  };

  const handleBack = () => {
    router.push(`/settings/team/${team.id}`);
  };

  useEffect(() => {
    const fetchCreator = async () => {
      try {
        if (team.createdById) {
          const response = await fetch(`/api/users/${team.createdById}`);
          if (response.ok) {
            const data = await response.json();
            setCreator(data);
          } else {
            setCreator({
              name: "Unknown User",
              email: team.createdById.substring(0, 8) + "...",
            });
          }
        }
      } catch (error) {
        console.error("Error fetching creator:", error);
        setCreator({
          name: "Unknown User",
          email: team.createdById
            ? team.createdById.substring(0, 8) + "..."
            : "Unknown",
        });
      }
    };

    fetchCreator();
  }, [team.createdById]);

  useEffect(() => {
    const loadTeamMembers = async () => {
      try {
        const response = await fetch(`/api/teams/${team.id}/members`);
        if (response.ok) {
          const data = await response.json();
          const members = data.members.filter(
            (member: any) => member.userId !== team.createdById
          );
          setTeamMembers(members);
        }
      } catch (error) {
        console.error("Error loading team members:", error);
      }
    };

    if (hasAdminAccess) {
      loadTeamMembers();
    }
  }, [team.id, team.createdById, hasAdminAccess]);

  const handleSaveAll = async () => {
    setIsSaving(true);
    setShowSaveBar(false);

    try {
      const teamUpdateResponse = await fetch(`/api/teams/${team.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: teamData.name,
          description: teamData.description,
          logo: teamData.logo,
        }),
      });

      if (!teamUpdateResponse.ok) {
        const error = await teamUpdateResponse.json();
        throw new Error(error.error || "Failed to update team information");
      }

      const settingsData = {
        teamId: team.id,
        defaultRole: teamSettings.defaultRole,
        inviteOnly: teamSettings.inviteOnly,
        requireTwoFactor: teamSettings.requireTwoFactor,
        sessionTimeout: teamSettings.sessionTimeoutEnabled
          ? teamSettings.sessionTimeout
          : 0,
        allowPublicLinks: teamSettings.allowPublicLinks,
        autoArchive: teamSettings.autoArchive,
        fileRetention: teamSettings.fileRetention,
        versionHistory: teamSettings.versionHistory,
      };

      console.log("🔧 Отправляемые настройки команды:", settingsData);

      const settingsResponse = await fetch("/api/teams/settings", {
        method: team.teamSettings ? "PUT" : "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(settingsData),
      });

      const responseData = await settingsResponse.json();

      if (!settingsResponse.ok) {
        throw new Error(responseData.error || "Failed to update team settings");
      }

      setTimeout(() => {
        router.refresh();
      }, 500);
    } catch (error) {
      console.error("❌ Failed to save settings:", error);

      setShowSaveBar(true);
    } finally {
      setIsSaving(false);
    }
  };

  useEffect(() => {
    if (showDeleteDialog) {
      const confirmInput = document.getElementById(
        "confirm-team-name"
      ) as HTMLInputElement;
      const confirmButton = document.getElementById(
        "confirm-delete-btn"
      ) as HTMLButtonElement;

      const checkConfirmation = () => {
        if (confirmInput && confirmButton) {
          confirmButton.disabled = confirmInput.value !== team.name;
        }
      };

      confirmInput?.addEventListener("input", checkConfirmation);
      checkConfirmation();

      return () => {
        confirmInput?.removeEventListener("input", checkConfirmation);
      };
    }
  }, [showDeleteDialog, team.name]);

  const handleTransferOwnership = () => {
    setShowTransferDialog(true);
  };

  const handleConfirmTransfer = async () => {
    if (!selectedMemberId) {
      return;
    }

    setIsSaving(true);
    try {
      const response = await fetch(`/api/teams/${team.id}/transfer`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          newOwnerId: selectedMemberId,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to transfer ownership");
      }

      setShowTransferDialog(false);

      setTimeout(() => {
        router.refresh();
      }, 1000);
    } catch (error) {
      console.error("Transfer ownership error:", error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteTeam = () => {
    setShowDeleteDialog(true);
  };

  const handleConfirmDelete = async () => {
    setIsSaving(true);
    try {
      const response = await fetch(`/api/teams/${team.id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to delete team");
      }

      setConfirmationText("");

      setTimeout(() => {
        router.push("/settings");
        router.refresh();
      }, 1000);
    } catch (error) {
      console.error("Delete team error:", error);
    } finally {
      setIsSaving(false);
      setShowDeleteDialog(false);
    }
  };

  const handleGenerateShareLink = async () => {
    setIsSaving(true);

    try {
      const response = await fetch("/api/teams/share-link", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          teamId: team.id,
          expiresIn: "7d",
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to generate share link");
      }

      const data = await response.json();
      setGeneratedShareLink(data.shareLink);
      setShowShareLinkDialog(true);
    } catch (error) {
      console.error("Share link generation error:", error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleSessionTimeoutToggle = (checked: boolean) => {
    handleTeamSettingsChange("sessionTimeoutEnabled", checked);
    if (!checked) {
      handleTeamSettingsChange("sessionTimeout", 60);
    } else {
      handleTeamSettingsChange(
        "sessionTimeout",
        teamSettings.sessionTimeout || 60
      );
    }
  };

  if (!hasAdminAccess) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center space-y-4">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            Access Denied
          </h2>
          <p className="text-gray-600 dark:text-gray-400">
            You don't have permission to access team settings.
          </p>
          <Button onClick={() => router.push(`/settings/team/${team.id}`)}>
            Back to Team
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="sm"
          onClick={handleBack}
          className="gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
          Back
        </Button>
        <div className="flex-1 space-y-1">
          <h1 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white">
            Detailed Team Settings
          </h1>
          <p className="text-sm text-muted-foreground">
            Manage your Team security and management
          </p>
        </div>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building className="h-5 w-5" />
              Team Information
            </CardTitle>
            <CardDescription>Basic details about your team</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <TeamLogoUpload
              teamId={team.id}
              currentLogo={teamData.logo}
              teamName={teamData.name}
              onLogoUpdate={handleLogoUpdate}
            />

            <Separator />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="team-name">Team Name</Label>
                <Input
                  id="team-name"
                  value={teamData.name}
                  onChange={(e) => handleTeamDataChange("name", e.target.value)}
                  placeholder="Enter team name"
                  disabled={isSaving}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="team-id">Team ID</Label>
                <Input
                  id="team-id"
                  value={team.id}
                  disabled
                  className="bg-gray-50 dark:bg-gray-800"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="team-description">Description</Label>
              <Textarea
                id="team-description"
                value={teamData.description}
                onChange={(e) =>
                  handleTeamDataChange("description", e.target.value)
                }
                placeholder="Describe your team's purpose and goals"
                rows={3}
                disabled={isSaving}
              />
              <p className="text-sm text-gray-500">
                This will be visible to all team members
              </p>
            </div>

            <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                  <Mail className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <p className="text-sm font-medium">Created by</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {creator?.name || creator?.email || "Unknown"}
                  </p>
                  {creator?.email && creator.email.includes("@") && (
                    <p className="text-xs text-gray-500">{creator.email}</p>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-3 mt-3">
                <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
                  <Calendar className="h-4 w-4 text-green-600 dark:text-green-400" />
                </div>
                <div>
                  <p className="text-sm font-medium">Created on</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {new Date(team.createdAt).toLocaleDateString("en-US", {
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    })}
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.1 }}
      >
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Access & Security
            </CardTitle>
            <CardDescription>
              Control how members join and access your team
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
                      <Users className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                    </div>
                    <div>
                      <Label className="text-base">Invite Only</Label>
                      <p className="text-sm text-gray-500">
                        Require invites to join
                      </p>
                    </div>
                  </div>
                  <Switch
                    checked={teamSettings.inviteOnly}
                    onCheckedChange={(checked) =>
                      handleTeamSettingsChange("inviteOnly", checked)
                    }
                    className="data-[state=checked]:bg-purple-500"
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                      <Globe className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                    </div>
                    <div>
                      <Label className="text-base">Public Links</Label>
                      <p className="text-sm text-gray-500">
                        Allow sharing with public
                      </p>
                    </div>
                  </div>
                  <Switch
                    checked={teamSettings.allowPublicLinks}
                    onCheckedChange={(checked) =>
                      handleTeamSettingsChange("allowPublicLinks", checked)
                    }
                    className="data-[state=checked]:bg-blue-500"
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-red-100 dark:bg-red-900/30 rounded-lg">
                      <Shield className="h-4 w-4 text-red-600 dark:text-red-400" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <Label className="text-base">Require 2FA</Label>
                        <span className="text-xs px-2 py-0.5 rounded-full bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300">
                          Soon
                        </span>
                      </div>
                      <p className="text-sm text-gray-500">
                        Extra security layer
                      </p>
                    </div>
                  </div>
                  <Switch
                    checked={teamSettings.requireTwoFactor}
                    disabled
                    className="data-[state=checked]:bg-red-500 opacity-60"
                  />
                </div>
              </div>

              <div className="space-y-8">
                <div className="flex items-center justify-between">
                  <div>
                    <Label className="text-base">Enable session timeout</Label>
                    <p className="text-sm text-gray-500">
                      Automatically log out inactive users
                    </p>
                  </div>
                  <Switch
                    checked={teamSettings.sessionTimeoutEnabled}
                    onCheckedChange={handleSessionTimeoutToggle}
                  />
                </div>

                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Session Timeout (minutes)</Label>
                      <p className="text-sm text-gray-500">
                        Auto-logout after inactivity
                      </p>
                    </div>
                    <div className="w-24">
                      <Input
                        type="number"
                        min="5"
                        max="1440"
                        value={teamSettings.sessionTimeout}
                        disabled={!teamSettings.sessionTimeoutEnabled}
                        onChange={(e) => {
                          const value = parseInt(e.target.value);
                          handleTeamSettingsChange(
                            "sessionTimeout",
                            isNaN(value) || value < 5 ? 60 : value
                          );
                        }}
                        className={`w-full transition-opacity ${
                          !teamSettings.sessionTimeoutEnabled
                            ? "opacity-50 cursor-not-allowed"
                            : ""
                        }`}
                      />
                    </div>
                  </div>
                  {!teamSettings.sessionTimeoutEnabled && (
                    <p className="text-xs text-gray-500 italic">
                      Session timeout is disabled. Users will not be
                      automatically logged out.
                    </p>
                  )}
                </div>

                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Default Member Role</Label>
                      <p className="text-sm text-gray-500">
                        Default role for new members
                      </p>
                    </div>
                    <div className="w-32">
                      <select
                        value={teamSettings.defaultRole}
                        onChange={(e) =>
                          handleTeamSettingsChange(
                            "defaultRole",
                            e.target.value
                          )
                        }
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900"
                      >
                        <option value="VIEW">Viewer</option>
                        <option value="EDIT">Editor</option>
                      </select>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.2 }}
      >
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Archive className="h-5 w-5" />
              File Management
            </CardTitle>
            <CardDescription>
              Control how files are stored and managed
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
                      <Archive className="h-4 w-4 text-green-600 dark:text-green-400" />
                    </div>
                    <div>
                      <Label className="text-base">Auto-Archive</Label>
                      <p className="text-sm text-gray-500">Archive old files</p>
                    </div>
                  </div>
                  <Switch
                    checked={teamSettings.autoArchive}
                    onCheckedChange={(checked) =>
                      handleTeamSettingsChange("autoArchive", checked)
                    }
                    className="data-[state=checked]:bg-green-500"
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-orange-100 dark:bg-orange-900/30 rounded-lg">
                      <History className="h-4 w-4 text-orange-600 dark:text-orange-400" />
                    </div>
                    <div>
                      <Label className="text-base">Version History</Label>
                      <p className="text-sm text-gray-500">
                        Track file changes
                      </p>
                    </div>
                  </div>
                  <Switch
                    checked={teamSettings.versionHistory}
                    onCheckedChange={(checked) =>
                      handleTeamSettingsChange("versionHistory", checked)
                    }
                    className="data-[state=checked]:bg-orange-500"
                  />
                </div>
              </div>

              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>File Retention Period</Label>
                  <p className="text-sm text-gray-500">
                    How long to keep archived files
                  </p>
                  <select
                    value={teamSettings.fileRetention}
                    onChange={(e) =>
                      handleTeamSettingsChange("fileRetention", e.target.value)
                    }
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900"
                  >
                    <option value="THIRTY_DAYS">30 Days</option>
                    <option value="ONE_YEAR">1 Year</option>
                    <option value="FOREVER">Forever</option>
                  </select>
                  <p className="text-sm text-gray-500">
                    How long to keep archived files
                  </p>
                </div>
              </div>
            </div>

            <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
              <div className="flex items-center gap-3 mb-3">
                <Link className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                <h4 className="font-medium text-blue-700 dark:text-blue-300">
                  Share Team
                </h4>
              </div>
              <p className="text-sm text-blue-600 dark:text-blue-400 mb-3">
                Generate a unique link to share with other future members.
              </p>
              <Button
                variant="outline"
                size="sm"
                className="border-blue-200 text-blue-600 hover:bg-blue-50"
                onClick={handleGenerateShareLink}
              >
                <Link className="h-4 w-4 mr-2" />
                Generate Share Link
              </Button>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      <Dialog open={showShareLinkDialog} onOpenChange={setShowShareLinkDialog}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Link className="h-5 w-5" />
              Share Link Generated
            </DialogTitle>
            <DialogDescription>
              Share this link with others to give them access to join the team.
              This link will expire in 7 days.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="relative p-3 bg-gray-100 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="absolute top-2.5 right-2 h-7 w-7 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                onClick={async () => {
                  await navigator.clipboard.writeText(generatedShareLink);
                  setCopied(true);
                  setTimeout(() => setCopied(false), 3000);
                }}
              >
                <Copy className="h-4 w-4" />
              </Button>

              <code className="block text-sm break-all text-gray-800 dark:text-gray-200 pr-8">
                {generatedShareLink}
              </code>
            </div>

            {copied && (
              <p className="text-xs text-green-600 dark:text-green-400">
                Copied to clipboard
              </p>
            )}

            <p className="text-xs text-gray-500 dark:text-gray-400">
              <strong>Note:</strong> Anyone with this link will be able to join
              this team. Keep it safe and only share it with people you trust.
            </p>
          </div>
        </DialogContent>
      </Dialog>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.3 }}
      >
        <Card className="border-red-200 dark:border-red-800">
          <CardHeader>
            <CardTitle className="text-red-600 dark:text-red-400">
              Danger Zone
            </CardTitle>
            <CardDescription className="text-red-500 dark:text-red-400">
              Irreversible actions. Proceed with caution.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="p-4 bg-red-50 dark:bg-red-900/20 rounded-lg">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-medium text-red-700 dark:text-red-300">
                    Transfer Ownership
                  </h4>
                  <p className="text-sm text-red-600 dark:text-red-400">
                    Transfer team ownership to another member. You will become a
                    regular member.
                  </p>
                </div>
                <Button
                  variant="outline"
                  className="border-red-200 text-red-600 hover:bg-red-100 hover:text-red-700"
                  onClick={handleTransferOwnership}
                  disabled={isSaving}
                >
                  Transfer Ownership
                </Button>
              </div>
            </div>

            <div className="p-4 bg-red-50 dark:bg-red-900/20 rounded-lg">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-medium text-red-700 dark:text-red-300">
                    Delete Team
                  </h4>
                  <p className="text-sm text-red-600 dark:text-red-400">
                    Permanently delete this team and all its files. This action
                    cannot be undone.
                  </p>
                </div>
                <Button
                  variant="destructive"
                  onClick={handleDeleteTeam}
                  disabled={isSaving}
                >
                  Delete Team
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      <Dialog open={showTransferDialog} onOpenChange={setShowTransferDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-red-600 dark:text-red-400">
              Transfer Team Ownership
            </DialogTitle>
            <DialogDescription className="text-red-500 dark:text-red-400">
              Select a team member to transfer ownership to. You will become a
              regular member.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {teamMembers.length > 0 ? (
              <div className="space-y-3">
                <Label htmlFor="member-select">Select New Owner</Label>
                <select
                  id="member-select"
                  value={selectedMemberId}
                  onChange={(e) => setSelectedMemberId(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900"
                >
                  <option value="">Select a team member</option>
                  {teamMembers.map((member) => (
                    <option key={member.id} value={member.id}>
                      {member.name || member.email}
                    </option>
                  ))}
                </select>
              </div>
            ) : (
              <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
                <p className="text-sm text-yellow-600 dark:text-yellow-400">
                  No other team members available to transfer ownership to.
                </p>
              </div>
            )}

            <div className="flex justify-end gap-3">
              <Button
                variant="outline"
                onClick={() => {
                  setShowTransferDialog(false);
                  setSelectedMemberId("");
                }}
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={handleConfirmTransfer}
                disabled={
                  !selectedMemberId || teamMembers.length === 0 || isSaving
                }
              >
                {isSaving ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    Transferring...
                  </>
                ) : (
                  "Transfer Ownership"
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-red-600 dark:text-red-400">
              Delete Team
            </DialogTitle>
            <DialogDescription className="text-red-500 dark:text-red-400">
              This action cannot be undone. All team data will be permanently
              deleted.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="p-4 bg-red-50 dark:bg-red-900/20 rounded-lg">
              <p className="text-sm text-red-600 dark:text-red-400">
                <strong>Warning:</strong> This will permanently delete:
              </p>
              <ul className="text-sm text-red-600 dark:text-red-400 mt-2 ml-4 list-disc">
                <li>All team files and documents</li>
                <li>Team settings and configurations</li>
                <li>Team memberships and permissions</li>
                <li>Team comments and version history</li>
              </ul>
            </div>

            <div className="flex items-center gap-3">
              <div className="relative flex-1">
                <Input
                  type="text"
                  placeholder={`Type "${team.name}" to confirm`}
                  className={`flex-1 pr-10 ${
                    confirmationText && confirmationText !== team.name
                      ? "border-red-300 dark:border-red-700 focus-visible:ring-red-500"
                      : ""
                  }`}
                  id="confirm-team-name"
                  onChange={(e) => setConfirmationText(e.target.value)}
                  value={confirmationText}
                />
                {confirmationText && (
                  <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                    {confirmationText === team.name ? (
                      <CheckCircle className="h-5 w-5 text-green-500" />
                    ) : (
                      <XCircle className="h-5 w-5 text-red-500" />
                    )}
                  </div>
                )}
              </div>
            </div>

            <div className="flex justify-end gap-3">
              <Button
                variant="outline"
                onClick={() => {
                  setShowDeleteDialog(false);
                  setConfirmationText("");
                }}
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={handleConfirmDelete}
                disabled={isSaving || confirmationText !== team.name}
                id="confirm-delete-btn"
              >
                {isSaving ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    Deleting...
                  </>
                ) : (
                  "Delete Team"
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {showSaveBar && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="sticky bottom-6 bg-white dark:bg-gray-900 p-4 rounded-xl border border-gray-200 dark:border-gray-800 shadow-lg"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Unsaved Changes</p>
              <p className="text-sm text-gray-500">
                You have modified team settings
              </p>
            </div>
            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                onClick={() => {
                  setTeamData({
                    name: team.name,
                    description: team.description || "",
                    logo: team.logo || "",
                  });
                  setTeamSettings({
                    defaultRole: team.teamSettings?.defaultRole || "VIEW",
                    inviteOnly: team.teamSettings?.inviteOnly ?? true,
                    requireTwoFactor:
                      team.teamSettings?.requireTwoFactor ?? false,
                    sessionTimeout: team.teamSettings?.sessionTimeout || 60,
                    allowPublicLinks:
                      team.teamSettings?.allowPublicLinks ?? true,
                    autoArchive: team.teamSettings?.autoArchive ?? false,
                    fileRetention:
                      team.teamSettings?.fileRetention || "ONE_YEAR",
                    versionHistory: team.teamSettings?.versionHistory ?? true,
                    sessionTimeoutEnabled:
                      (team.teamSettings?.sessionTimeout ?? 0) > 0,
                  });
                }}
              >
                Discard
              </Button>
              <Button
                onClick={handleSaveAll}
                disabled={isSaving}
                className="min-w-[140px]"
              >
                {isSaving ? (
                  <>
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent mr-2" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    Save All Changes
                  </>
                )}
              </Button>
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
}
