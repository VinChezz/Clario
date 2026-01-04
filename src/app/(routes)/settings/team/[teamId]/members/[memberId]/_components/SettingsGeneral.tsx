"use client";

import { useState } from "react";
import { TeamMember, Role } from "@prisma/client";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Shield,
  Save,
  Eye,
  Edit2,
  Settings,
  UserPlus,
  FilePlus,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Users,
  Lock,
  Unlock,
} from "lucide-react";
import { toast } from "sonner";

interface SettingsGeneralProps {
  member: TeamMember & {
    user: {
      id: string;
      name: string;
      email: string;
    };
  };
  currentUserRole?: Role;
  onRoleChange?: (memberId: string, newRole: Role) => Promise<void>;
}

export function SettingsGeneral({
  member,
  currentUserRole = "ADMIN",
  onRoleChange,
}: SettingsGeneralProps) {
  const [role, setRole] = useState<Role>(member.role);
  const [isSaving, setIsSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  const canChangeRole = currentUserRole === "ADMIN";

  const getRoleInfo = (role: Role) => {
    switch (role) {
      case "ADMIN":
        return {
          title: "Admin",
          description: "Can manage team settings and members",
          color:
            "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300",
          icon: <Settings className="h-4 w-4" />,
          level: 2,
        };
      case "EDIT":
        return {
          title: "Editor",
          description: "Can create and edit files",
          color:
            "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300",
          icon: <Edit2 className="h-4 w-4" />,
          level: 1,
        };
      case "VIEW":
        return {
          title: "Viewer",
          description: "Can only view files",
          color:
            "bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300",
          icon: <Eye className="h-4 w-4" />,
          level: 0,
        };
    }
  };

  const currentRoleInfo = getRoleInfo(role);
  const originalRoleInfo = getRoleInfo(member.role);

  const handleRoleChange = (value: Role) => {
    setRole(value);
    setHasChanges(value !== member.role);
  };

  const handleSave = async () => {
    if (!hasChanges || !canChangeRole) return;

    setIsSaving(true);

    try {
      if (onRoleChange) {
        await onRoleChange(member.id, role);
        setHasChanges(false);
      } else {
        await new Promise((resolve) => setTimeout(resolve, 1000));
        setHasChanges(false);
      }
    } catch (error) {
      toast.error("Failed to update role");
      setRole(member.role);
    } finally {
      setIsSaving(false);
    }
  };

  const getPermissionIcon = (hasPermission: boolean) => {
    return hasPermission ? (
      <CheckCircle className="h-5 w-5 text-green-500" />
    ) : (
      <XCircle className="h-5 w-5 text-gray-300" />
    );
  };

  const permissions = {
    [Role.VIEW]: {
      viewFiles: true,
      createFiles: false,
      editFiles: false,
      deleteFiles: false,
      inviteMembers: false,
      manageSettings: false,
      removeMembers: false,
    },
    [Role.EDIT]: {
      viewFiles: true,
      createFiles: true,
      editFiles: true,
      deleteFiles: false,
      inviteMembers: true,
      manageSettings: false,
      removeMembers: false,
    },
    [Role.ADMIN]: {
      viewFiles: true,
      createFiles: true,
      editFiles: true,
      deleteFiles: true,
      inviteMembers: true,
      manageSettings: true,
      removeMembers: true,
    },
  };

  const currentPermissions = permissions[role];

  return (
    <div className="space-y-6 p-4">
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Role & Permissions
          </CardTitle>
          <CardDescription>
            Change member's role and associated permissions
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <label className="text-sm font-medium">Select Role</label>
                <p className="text-sm text-gray-500">
                  Choose the appropriate role for this member
                </p>
              </div>
              {hasChanges && (
                <Badge variant="outline" className="animate-pulse">
                  Changes pending
                </Badge>
              )}
            </div>

            <Select
              value={role}
              onValueChange={handleRoleChange}
              disabled={!canChangeRole || isSaving}
            >
              <SelectTrigger
                className={`${
                  !canChangeRole ? "opacity-50 cursor-not-allowed" : ""
                }`}
              >
                <SelectValue>
                  <div className="flex items-center gap-2">
                    {currentRoleInfo.icon}
                    <span>{currentRoleInfo.title}</span>
                  </div>
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                {member.role !== "ADMIN" && (
                  <>
                    <SelectItem
                      value="VIEW"
                      className="flex items-center gap-2"
                    >
                      <Eye className="h-4 w-4" />
                      <div>
                        <p className="font-medium">Viewer</p>
                        <p className="text-xs text-gray-500">
                          Can only view files
                        </p>
                      </div>
                    </SelectItem>
                    <SelectItem
                      value="EDIT"
                      className="flex items-center gap-2"
                    >
                      <Edit2 className="h-4 w-4" />
                      <div>
                        <p className="font-medium">Editor</p>
                        <p className="text-xs text-gray-500">
                          Can create and edit files
                        </p>
                      </div>
                    </SelectItem>
                  </>
                )}
                {member.role === "ADMIN" && (
                  <SelectItem value="ADMIN" className="flex items-center gap-2">
                    <Shield className="h-4 w-4" />
                    <div>
                      <p className="font-medium">Admin</p>
                      <p className="text-xs text-gray-500">Team admin</p>
                    </div>
                  </SelectItem>
                )}
              </SelectContent>
            </Select>

            {!canChangeRole && (
              <div className="flex items-center gap-2 p-3 bg-amber-50 dark:bg-amber-900/20 rounded-lg border border-amber-200 dark:border-amber-800">
                <AlertTriangle className="h-4 w-4 text-amber-600" />
                <p className="text-sm text-amber-700 dark:text-amber-300">
                  {member.role === "ADMIN"
                    ? "Team admin role cannot be changed"
                    : "You don't have permission to change roles"}
                </p>
              </div>
            )}
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-medium">Permission Overview</h4>
                <p className="text-sm text-gray-500">
                  {currentRoleInfo.description}
                </p>
              </div>
              {hasChanges && (
                <div className="text-sm text-blue-600 dark:text-blue-400">
                  {originalRoleInfo.title} → {currentRoleInfo.title}
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="space-y-2">
                <h5 className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center gap-1.5">
                  <FilePlus className="h-4 w-4" />
                  File Access
                </h5>
                <div className="space-y-2">
                  <div className="flex items-center justify-between p-2 rounded hover:bg-gray-50 dark:hover:bg-gray-900/50">
                    <span className="text-sm">View files</span>
                    {getPermissionIcon(currentPermissions.viewFiles)}
                  </div>
                  <div className="flex items-center justify-between p-2 rounded hover:bg-gray-50 dark:hover:bg-gray-900/50">
                    <span className="text-sm">Create files</span>
                    {getPermissionIcon(currentPermissions.createFiles)}
                  </div>
                  <div className="flex items-center justify-between p-2 rounded hover:bg-gray-50 dark:hover:bg-gray-900/50">
                    <span className="text-sm">Edit files</span>
                    {getPermissionIcon(currentPermissions.editFiles)}
                  </div>
                  <div className="flex items-center justify-between p-2 rounded hover:bg-gray-50 dark:hover:bg-gray-900/50">
                    <span className="text-sm">Delete files</span>
                    {getPermissionIcon(currentPermissions.deleteFiles)}
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <h5 className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center gap-1.5">
                  <Users className="h-4 w-4" />
                  Team Management
                </h5>
                <div className="space-y-2">
                  <div className="flex items-center justify-between p-2 rounded hover:bg-gray-50 dark:hover:bg-gray-900/50">
                    <span className="text-sm">Invite members</span>
                    {getPermissionIcon(currentPermissions.inviteMembers)}
                  </div>
                  <div className="flex items-center justify-between p-2 rounded hover:bg-gray-50 dark:hover:bg-gray-900/50">
                    <span className="text-sm">Manage settings</span>
                    {getPermissionIcon(currentPermissions.manageSettings)}
                  </div>
                  <div className="flex items-center justify-between p-2 rounded hover:bg-gray-50 dark:hover:bg-gray-900/50">
                    <span className="text-sm">Remove members</span>
                    {getPermissionIcon(currentPermissions.removeMembers)}
                  </div>
                  {role === "ADMIN" && (
                    <>
                      <div className="flex items-center justify-between p-2 rounded hover:bg-gray-50 dark:hover:bg-gray-900/50">
                        <span className="text-sm">Manage billing</span>
                        {getPermissionIcon(true)}
                      </div>
                      <div className="flex items-center justify-between p-2 rounded hover:bg-gray-50 dark:hover:bg-gray-900/50">
                        <span className="text-sm">Delete team</span>
                        {getPermissionIcon(true)}
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>

            {hasChanges && (
              <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="h-5 w-5 text-blue-600 dark:text-blue-400 mt-0.5" />
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-blue-800 dark:text-blue-300">
                      Role change warning
                    </p>
                    <ul className="text-xs text-blue-700 dark:text-blue-400 space-y-1">
                      <li>
                        • This will immediately update the member's permissions
                      </li>
                      <li>• The member will be notified of the change</li>
                      {originalRoleInfo.level > currentRoleInfo.level && (
                        <li>• Member will lose some permissions</li>
                      )}
                      {originalRoleInfo.level < currentRoleInfo.level && (
                        <li>• Member will gain additional permissions</li>
                      )}
                    </ul>
                  </div>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <div className="bottom-6 bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm p-4 rounded-lg border shadow-sm">
        <div className="flex items-center justify-between">
          <div>
            <p className="font-medium">Apply role change</p>
            <p className="text-sm text-gray-500">
              {hasChanges
                ? `Change role from ${originalRoleInfo.title} to ${currentRoleInfo.title}`
                : "No changes made"}
            </p>
          </div>
          <Button
            onClick={handleSave}
            disabled={!hasChanges || !canChangeRole || isSaving}
            size="lg"
            className="min-w-[120px]"
          >
            {isSaving ? (
              <>
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent mr-2" />
                Saving...
              </>
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" />
                Save Changes
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
