"use client";

import { useState } from "react";
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
  Upload,
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
} from "lucide-react";
import { toast } from "sonner";
import { Team, TeamSettings as TeamSettingsType } from "@prisma/client";
import { useRouter } from "next/navigation";

interface TeamDetailedSettingsProps {
  team: Team & { teamSettings: TeamSettingsType | null };
}

export function TeamDetailedSettings({ team }: TeamDetailedSettingsProps) {
  const router = useRouter();
  const [isSaving, setIsSaving] = useState(false);
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
  });

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

  const handleImageUpload = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error("Please upload an image file");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error("Image size should be less than 5MB");
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      setTeamData((prev) => ({
        ...prev,
        logo: e.target?.result as string,
      }));
      toast.success("Logo uploaded successfully");
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveLogo = () => {
    setTeamData((prev) => ({
      ...prev,
      logo: "",
    }));
    toast.info("Logo removed");
  };

  const handleBack = () => {
    router.push(`/settings/team/${team.id}`);
  };

  const handleSaveAll = async () => {
    setIsSaving(true);

    try {
      await new Promise((resolve) => setTimeout(resolve, 1500));

      const saveData = {
        teamData,
        teamSettings,
      };

      console.log("Saving team data:", saveData);

      toast.success("All settings saved successfully!");
    } catch (error) {
      console.error("Failed to save settings:", error);
      toast.error("Failed to save settings");
    } finally {
      setIsSaving(false);
    }
  };

  const hasChanges =
    teamData.name !== team.name ||
    teamData.description !== (team.description || "") ||
    teamData.logo !== (team.logo || "") ||
    teamSettings.defaultRole !== (team.teamSettings?.defaultRole || "VIEW") ||
    teamSettings.inviteOnly !== (team.teamSettings?.inviteOnly ?? true) ||
    teamSettings.requireTwoFactor !==
      (team.teamSettings?.requireTwoFactor ?? false) ||
    teamSettings.sessionTimeout !== (team.teamSettings?.sessionTimeout || 60) ||
    teamSettings.allowPublicLinks !==
      (team.teamSettings?.allowPublicLinks ?? true) ||
    teamSettings.autoArchive !== (team.teamSettings?.autoArchive ?? false) ||
    teamSettings.fileRetention !==
      (team.teamSettings?.fileRetention || "ONE_YEAR") ||
    teamSettings.versionHistory !== (team.teamSettings?.versionHistory ?? true);

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
            <div className="space-y-4">
              <Label>Team Logo</Label>
              <div className="flex items-start gap-6">
                <div className="relative">
                  {teamData.logo ? (
                    <div className="relative">
                      <img
                        src={teamData.logo}
                        alt="Team logo"
                        className="h-24 w-24 rounded-xl object-cover border border-gray-200 dark:border-gray-700"
                      />
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={handleRemoveLogo}
                        className="absolute -top-2 -right-2 h-6 w-6 p-0 rounded-full"
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  ) : (
                    <div className="h-24 w-24 rounded-xl bg-linear-to-br from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-900 border-2 border-dashed border-gray-300 dark:border-gray-700 flex items-center justify-center">
                      <ImageIcon className="h-8 w-8 text-gray-400" />
                    </div>
                  )}
                </div>

                <div className="flex-1 space-y-3">
                  <div>
                    <Label htmlFor="logo-upload" className="cursor-pointer">
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          type="button"
                          className="gap-2"
                        >
                          <Upload className="h-4 w-4" />
                          Upload New Logo
                        </Button>
                        <input
                          id="logo-upload"
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={handleImageUpload}
                        />
                      </div>
                    </Label>
                    <p className="text-sm text-gray-500 mt-2">
                      Recommended: 512x512px, PNG or JPG, max 5MB
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <Separator />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="team-name">Team Name</Label>
                <Input
                  id="team-name"
                  value={teamData.name}
                  onChange={(e) => handleTeamDataChange("name", e.target.value)}
                  placeholder="Enter team name"
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
                    {team.createdById || "Unknown"}
                  </p>
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
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
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
                      <Label className="text-base">Require 2FA</Label>
                      <p className="text-sm text-gray-500">
                        Extra security layer
                      </p>
                    </div>
                  </div>
                  <Switch
                    checked={teamSettings.requireTwoFactor}
                    onCheckedChange={(checked) =>
                      handleTeamSettingsChange("requireTwoFactor", checked)
                    }
                    className="data-[state=checked]:bg-red-500"
                  />
                </div>
              </div>

              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Default Role for New Members</Label>
                  <select
                    value={teamSettings.defaultRole}
                    onChange={(e) =>
                      handleTeamSettingsChange("defaultRole", e.target.value)
                    }
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900"
                  >
                    <option value="VIEW">Viewer</option>
                    <option value="EDIT">Editor</option>
                    <option value="ADMIN">Admin</option>
                  </select>
                  <p className="text-sm text-gray-500">
                    Role assigned to new members by default
                  </p>
                </div>

                <div className="space-y-2">
                  <Label>Session Timeout (minutes)</Label>
                  <Input
                    type="number"
                    min="5"
                    max="1440"
                    value={teamSettings.sessionTimeout}
                    onChange={(e) =>
                      handleTeamSettingsChange(
                        "sessionTimeout",
                        parseInt(e.target.value)
                      )
                    }
                  />
                  <p className="text-sm text-gray-500">
                    Auto-logout after inactivity
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
                  Share Settings
                </h4>
              </div>
              <p className="text-sm text-blue-600 dark:text-blue-400 mb-3">
                Generate a unique link to share this team's settings with other
                admins.
              </p>
              <Button
                variant="outline"
                size="sm"
                className="border-blue-200 text-blue-600 hover:bg-blue-50"
              >
                <Link className="h-4 w-4 mr-2" />
                Generate Share Link
              </Button>
            </div>
          </CardContent>
        </Card>
      </motion.div>

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
                    Transfer this team to another member
                  </p>
                </div>
                <Button
                  variant="outline"
                  className="border-red-200 text-red-600 hover:bg-red-100 hover:text-red-700"
                  onClick={() => toast.info("Transfer ownership feature")}
                >
                  Transfer
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
                    Permanently delete this team and all its files
                  </p>
                </div>
                <Button
                  variant="destructive"
                  onClick={() =>
                    toast.error("This action requires confirmation")
                  }
                >
                  Delete Team
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {hasChanges && (
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
                  });
                  toast.info("Changes discarded");
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
