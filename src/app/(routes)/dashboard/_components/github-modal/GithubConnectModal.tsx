"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useState, useEffect } from "react";
import {
  Github,
  GitBranch,
  FileText,
  GitPullRequest,
  AlertCircle,
  FolderTree,
  Loader2,
  CheckCircle2,
  XCircle,
  ExternalLink,
  Plus,
  Folder,
  ChevronRight,
  Home,
  RefreshCw,
  Copy,
  FileCode,
  Eye,
  Star,
  GitFork,
  Users,
  Calendar,
  Code,
  Terminal,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useActiveTeam } from "@/app/_context/ActiveTeamContext";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useGithub } from "@/app/_context/GithubContext";
import {
  useIsMobile,
  useIsTablet,
  useIsLargeTablet,
  useIsHorizontalMobile,
  useIsHorizontalTablet,
  useIsSmallMobile,
} from "@/hooks/useMediaQuery";
import { CodeViewerModal } from "./_components/CodeViewer";
import { Separator } from "@/components/ui/separator";
import { AddReadmeToFileModal } from "./_components/addReadmeToFileModal";
import { ReadmeUploadProgress } from "./_components/readmeUploadProgress";

interface GithubConnectModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onRepoConnected?: () => void;
}

export function GithubConnectModal({
  open,
  onOpenChange,
  onRepoConnected,
}: GithubConnectModalProps) {
  const { activeTeam } = useActiveTeam();
  const {
    connectedRepo,
    setConnectedRepo,
    checkRepoConnection,
    openCodeViewer,
  } = useGithub();

  const [repoUrl, setRepoUrl] = useState("");
  const [isConnecting, setIsConnecting] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const [activeTab, setActiveTab] = useState("overview");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [branches, setBranches] = useState<string[]>([]);
  const [selectedBranch, setSelectedBranch] = useState<string>("master");
  const [issues, setIssues] = useState<any[]>([]);
  const [pulls, setPulls] = useState<any[]>([]);
  const [readme, setReadme] = useState<string | null>(null);
  const [repoTree, setRepoTree] = useState<any>(null);
  const [currentPath, setCurrentPath] = useState<string>("");
  const [pathHistory, setPathHistory] = useState<string[]>([]);
  const [isCopied, setIsCopied] = useState(false);
  const [codeViewerOpen, setCodeViewerOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState<any>(null);
  const [repoStats, setRepoStats] = useState<any>(null);
  const [showFileSelectModal, setShowFileSelectModal] = useState(false);
  const [showUploadProgress, setShowUploadProgress] = useState(false);
  const [selectedFileForUpload, setSelectedFileForUpload] = useState<{
    id: string;
    name: string;
  } | null>(null);
  const [readmeContent, setReadmeContent] = useState<string>("");

  const isMobile = useIsMobile();
  const isTablet = useIsTablet();
  const isLargeTablet = useIsLargeTablet();
  const isHorizontalMobile = useIsHorizontalMobile();
  const isHorizontalTablet = useIsHorizontalTablet();
  const isSmallMobile = useIsSmallMobile();

  const getConnectDialogSize = () => {
    if (isSmallMobile) return "max-w-[95vw]";
    if (isMobile) return "max-w-[95vw]";
    if (isTablet) return "max-w-[90vw]";
    if (isLargeTablet) return "max-w-4xl";
    return "min-w-[25vw]";
  };

  const getDialogSize = () => {
    if (isSmallMobile) return "max-w-[95vw]";
    if (isMobile) return "max-w-[95vw]";
    if (isTablet) return "max-w-[90vw]";
    if (isLargeTablet) return "max-w-4xl";
    return "min-w-[45vw]";
  };

  const getHeaderSize = () => {
    if (isSmallMobile) return "text-lg";
    if (isMobile) return "text-lg";
    if (isTablet) return "text-2xl";
    return "text-2xl";
  };

  const getIconSize = () => {
    if (isSmallMobile) return "w-8 h-8";
    if (isMobile) return "w-8 h-8";
    if (isTablet) return "w-10 h-10";
    return "w-10 h-10";
  };

  const getButtonSize = () => {
    if (isSmallMobile) return "h-8 text-xs";
    if (isMobile) return "h-9 text-sm";
    if (isTablet) return "h-10 text-sm";
    return "h-10 text-sm";
  };

  const getTabListLayout = () => {
    if (isSmallMobile) return "grid-cols-3 text-xs gap-0.5";
    if (isMobile) return "grid-cols-3 text-xs";
    if (isTablet) return "grid-cols-5 text-sm";
    return "grid-cols-5 text-sm";
  };

  const getTabLabels = () => {
    if (isSmallMobile || isMobile) {
      return [
        { value: "overview", label: "Overview" },
        { value: "issues", label: "Issues" },
        { value: "pulls", label: "PRs" },
        { value: "readme", label: "Readme" },
        { value: "tree", label: "Files" },
      ];
    }
    return [
      { value: "overview", label: "Overview" },
      { value: "issues", label: "Issues" },
      { value: "pulls", label: "Pull Requests" },
      { value: "readme", label: "README" },
      { value: "tree", label: "Files" },
    ];
  };

  const getGridLayout = () => {
    if (isSmallMobile || isMobile) return "grid-cols-1 gap-2";
    return "grid-cols-2 gap-3";
  };

  const getCardPadding = () => {
    if (isSmallMobile) return "p-3";
    if (isMobile) return "p-2";
    return "p-4";
  };

  const getContentPadding = () => {
    if (isSmallMobile) return "pr-1";
    if (isMobile) return "pr-2";
    return "pr-2";
  };

  const isValidGithubUrl = (url: string): boolean => {
    const pattern = /^https?:\/\/github\.com\/[\w-]+\/[\w.-]+\/?$/;
    return pattern.test(url.trim());
  };

  const isButtonEnabled = isValidGithubUrl(repoUrl);

  useEffect(() => {
    if (open && activeTeam?.id) {
      checkConnectedRepo();
      setError(null);
      setSuccess(null);
    }
  }, [open, activeTeam]);

  useEffect(() => {
    if (!open) {
      setIssues([]);
      setPulls([]);
      setReadme(null);
      setRepoTree(null);
      setCurrentPath("");
      setPathHistory([]);
      setError(null);
      setSuccess(null);
    }
  }, [open]);

  useEffect(() => {
    if (open && connectedRepo && activeTeam?.id) {
      fetchBranches();
      fetchRepoStats();
    }
  }, [open, connectedRepo, activeTeam]);

  const checkConnectedRepo = async () => {
    if (activeTeam?.id) {
      await checkRepoConnection(activeTeam.id);
    }
  };

  const fetchRepoStats = async () => {
    if (!activeTeam?.id) return;

    try {
      const url = new URL(`/api/github/data`, window.location.origin);
      url.searchParams.set("teamId", activeTeam.id);
      url.searchParams.set("type", "stats");

      const response = await fetch(url.toString());
      const result = await response.json();

      if (result.success) {
        setRepoStats(result.data);
      }
    } catch (error) {
      console.error("Failed to fetch repo stats:", error);
    }
  };

  const handleConnect = async () => {
    if (!activeTeam?.id || !isButtonEnabled) return;

    setIsConnecting(true);
    setError(null);
    setSuccess(null);

    try {
      const match = repoUrl.match(/github\.com\/([^\/]+)\/([^\/\s?]+)/);
      if (!match) {
        setError(
          "Invalid GitHub URL format. Please use: https://github.com/username/repository"
        );
        return;
      }

      const [, owner, repo] = match;

      const response = await fetch("/api/github/connect", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          owner,
          repo: repo.replace(/\.git$/, ""),
          teamId: activeTeam.id,
        }),
      });

      const result = await response.json();

      if (result.success) {
        setConnectedRepo(result.data);
        setActiveTab("overview");
        setSuccess("Repository connected successfully!");
        setRepoUrl("");
        onRepoConnected?.();

        if (activeTeam?.id) {
          await checkRepoConnection(activeTeam.id);
        }
      } else {
        setError(
          result.error ||
            "Failed to connect repository. Please check if the repository exists and is accessible."
        );
      }
    } catch (error: any) {
      console.error("Failed to connect repo:", error);
      setError("Network error. Please check your connection and try again.");
    } finally {
      setIsConnecting(false);
    }
  };

  const handleDisconnect = async () => {
    if (!activeTeam?.id) return;

    try {
      await fetch("/api/github/connect", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ teamId: activeTeam.id }),
      });

      setConnectedRepo(null);
      setActiveTab("connect");
      setRepoUrl("");
      setSuccess("Repository disconnected successfully!");
      onRepoConnected?.();

      if (activeTeam?.id) {
        await checkRepoConnection(activeTeam.id);
      }
    } catch (error) {
      console.error("Failed to disconnect:", error);
      setError("Failed to disconnect repository. Please try again.");
    }
  };

  const fetchBranches = async () => {
    if (!activeTeam?.id) return;

    try {
      const url = new URL(`/api/github/data`, window.location.origin);
      url.searchParams.set("teamId", activeTeam.id);
      url.searchParams.set("type", "branches");

      const response = await fetch(url.toString());
      const result = await response.json();

      if (result.success) {
        const branchNames = result.data.map((branch: any) => branch.name);
        setBranches(branchNames);

        if (branchNames.includes("main")) {
          setSelectedBranch("main");
        } else if (branchNames.includes("master")) {
          setSelectedBranch("master");
        } else if (branchNames.length > 0) {
          setSelectedBranch(branchNames[0]);
        }
      }
    } catch (error) {
      console.error("Failed to fetch branches:", error);
    }
  };

  const fetchGithubData = async (type: string, path?: string) => {
    if (!activeTeam?.id) return;

    setIsLoading(true);
    setError(null);

    try {
      const url = new URL(`/api/github/data`, window.location.origin);
      url.searchParams.set("teamId", activeTeam.id);
      url.searchParams.set("type", type);
      if (path) url.searchParams.set("path", path);
      if (type === "tree") {
        url.searchParams.set("branch", selectedBranch);
      }

      const response = await fetch(url.toString());
      const result = await response.json();

      if (result.success) {
        switch (type) {
          case "issues":
            setIssues(result.data);
            break;
          case "pulls":
            setPulls(result.data);
            break;
          case "readme":
            setReadme(result.data.content);
            setReadmeContent(result.data.content);
            break;
          case "tree":
            setRepoTree(result.data);
            break;
          case "branches":
            setBranches(result.data.map((branch: any) => branch.name));
            break;
        }
      } else {
        setError(result.error || `Failed to fetch ${type}`);
      }
    } catch (error: any) {
      console.error(`Failed to fetch ${type}:`, error);
      setError(`Failed to load ${type}. Please try again.`);
    } finally {
      setIsLoading(false);
    }
  };

  const addToDocument = (content: string, type: string) => {
    if (type === "readme") {
      setReadmeContent(content);
      setShowFileSelectModal(true);
    } else {
      console.log("Add to document:", { content, type });
    }
  };

  const navigateToFolder = async (folderPath: string) => {
    setPathHistory([...pathHistory, currentPath]);
    setCurrentPath(folderPath);
    await fetchGithubData("tree", folderPath);
  };

  const navigateBack = () => {
    if (pathHistory.length === 0) return;
    const previousPath = pathHistory[pathHistory.length - 1];
    setPathHistory(pathHistory.slice(0, -1));
    setCurrentPath(previousPath);
    fetchGithubData("tree", previousPath || undefined);
  };

  const navigateToRoot = () => {
    setCurrentPath("");
    setPathHistory([]);
    fetchGithubData("tree");
  };

  const getCurrentFolderContents = () => {
    if (!repoTree?.tree) return { folders: [], files: [] };

    const items = repoTree.tree.filter((item: any) => {
      if (!currentPath) {
        return !item.path.includes("/");
      }

      const relativePath = item.path.startsWith(currentPath + "/")
        ? item.path.slice(currentPath.length + 1)
        : null;

      return relativePath && !relativePath.includes("/");
    });

    const folders = items
      .filter((item: any) => item.type === "tree")
      .map((item: any) => ({
        ...item,
        name: currentPath ? item.path.split("/").pop() : item.path,
      }));

    const files = items
      .filter((item: any) => item.type === "blob")
      .map((item: any) => ({
        ...item,
        name: currentPath ? item.path.split("/").pop() : item.path,
      }));

    return { folders, files };
  };

  const handleFileClick = async (file: any) => {
    if (!activeTeam?.id) return;

    setSelectedFile(file);
    setCodeViewerOpen(true);
  };

  const handleFileConfirm = async (fileId: string, fileName: string) => {
    setSelectedFileForUpload({ id: fileId, name: fileName });
    setShowFileSelectModal(false);
    setShowUploadProgress(true);
  };

  const StatCard = ({
    icon: Icon,
    value,
    label,
    color = "blue",
  }: {
    icon: any;
    value: string | number;
    label: string;
    color?: "blue" | "purple" | "green" | "orange";
  }) => {
    const colors = {
      blue: "from-blue-500 to-cyan-500 dark:from-blue-400 dark:to-cyan-400",
      purple:
        "from-purple-500 to-pink-500 dark:from-purple-400 dark:to-pink-400",
      green:
        "from-green-500 to-emerald-500 dark:from-green-400 dark:to-emerald-400",
      orange:
        "from-orange-500 to-amber-500 dark:from-orange-400 dark:to-amber-400",
    };

    return (
      <div className="flex flex-col items-center p-3 rounded-xl bg-white/50 dark:bg-[#252528]/50 backdrop-blur-sm border border-gray-200/50 dark:border-[#2a2a2d]/50">
        <div
          className={`w-10 h-10 rounded-lg bg-linear-to-br ${colors[color]} flex items-center justify-center mb-2`}
        >
          <Icon className="h-5 w-5 text-white" />
        </div>
        <div className="text-2xl font-bold text-gray-900 dark:text-[#f0f0f0]">
          {value}
        </div>
        <div className="text-xs text-gray-500 dark:text-[#a0a0a0] mt-1">
          {label}
        </div>
      </div>
    );
  };

  if (!connectedRepo) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent
          className={cn(
            "rounded-2xl border border-gray-200 dark:border-[#2a2a2d] bg-white dark:bg-[#1a1a1c] shadow-xl overflow-hidden flex flex-col",
            getConnectDialogSize()
          )}
        >
          <DialogHeader className="text-center space-y-3 pt-6">
            <div
              className={cn(
                "mx-auto bg-linear-to-br from-purple-600 to-blue-600 dark:from-purple-500 dark:to-blue-500 rounded-xl flex items-center justify-center shadow-lg",
                getIconSize()
              )}
            >
              <Github
                className={cn(
                  "text-white",
                  isSmallMobile ? "h-4 w-4" : "h-6 w-6"
                )}
              />
            </div>
            <DialogTitle
              className={cn(
                "font-bold text-gray-900 dark:text-[#f0f0f0]",
                getHeaderSize()
              )}
            >
              Connect GitHub Repository
            </DialogTitle>
            <DialogDescription className="text-gray-500 dark:text-[#a0a0a0] text-sm">
              Sync your GitHub repository to track issues, PRs, and collaborate
              with your team
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 mt-2 px-6 pb-6">
            {error && (
              <div className="w-full p-3 rounded-xl bg-red-50/90 dark:bg-red-900/20 border border-red-200 dark:border-red-800/50 backdrop-blur-sm">
                <div className="flex items-start gap-2 w-full">
                  <div className="w-5 h-5 bg-red-100 dark:bg-red-900/40 rounded-full flex items-center justify-center shrink-0 mt-0.5">
                    <AlertCircle className="h-3 w-3 text-red-600 dark:text-red-400" />
                  </div>
                  <div className="flex-1">
                    <p
                      className={cn(
                        "text-red-800 dark:text-red-300 font-medium leading-relaxed",
                        isSmallMobile ? "text-xs" : "text-sm"
                      )}
                    >
                      {error}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {success && (
              <div className="w-full p-3 rounded-xl bg-green-50/90 dark:bg-green-900/20 border border-green-200 dark:border-green-800/50 backdrop-blur-sm">
                <div className="flex items-start gap-2 w-full">
                  <div className="w-5 h-5 bg-green-100 dark:bg-green-900/40 rounded-full flex items-center justify-center shrink-0 mt-0.5">
                    <CheckCircle2 className="h-3 w-3 text-green-600 dark:text-green-400" />
                  </div>
                  <div className="flex-1">
                    <p
                      className={cn(
                        "text-green-800 dark:text-green-300 font-medium leading-relaxed",
                        isSmallMobile ? "text-xs" : "text-sm"
                      )}
                    >
                      {success}
                    </p>
                  </div>
                </div>
              </div>
            )}

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label
                  className={cn(
                    "font-semibold text-gray-700 dark:text-[#f0f0f0]",
                    isSmallMobile ? "text-xs" : "text-sm"
                  )}
                >
                  Repository URL
                </label>
                <span
                  className={cn(
                    "text-gray-400 dark:text-[#707070]",
                    isSmallMobile ? "text-[10px]" : "text-xs"
                  )}
                >
                  Required
                </span>
              </div>
              <div className="relative">
                <Input
                  placeholder="https://github.com/username/repository"
                  value={repoUrl}
                  onChange={(e) => {
                    setRepoUrl(e.target.value);
                    setError(null);
                  }}
                  className={cn(
                    "w-full rounded-xl border-2 bg-white dark:bg-[#252528] backdrop-blur-sm transition-all duration-200 focus:ring-2 focus:ring-offset-1 dark:border-[#2a2a2d] dark:text-[#f0f0f0]",
                    getButtonSize(),
                    repoUrl && !isValidGithubUrl(repoUrl)
                      ? "border-red-300 dark:border-red-500 focus:border-red-500 focus:ring-red-500/20"
                      : "border-gray-200 focus:border-blue-500 focus:ring-blue-500/20 dark:focus:border-blue-500"
                  )}
                />
                {isValidGithubUrl(repoUrl) && (
                  <CheckCircle2 className="h-4 w-4 text-green-500 absolute right-3 top-1/2 transform -translate-y-1/2" />
                )}
              </div>
              {repoUrl && !isValidGithubUrl(repoUrl) && (
                <div className="flex items-center gap-2 text-red-600 dark:text-red-400 text-xs">
                  <AlertCircle className="h-3 w-3" />
                  Please enter a valid GitHub repository URL
                </div>
              )}
            </div>

            <div
              className={cn(
                "rounded-xl text-sm bg-blue-50/80 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800/50 backdrop-blur-sm",
                isSmallMobile ? "p-2" : "p-3"
              )}
            >
              <div className="flex items-start gap-2">
                <div className="w-5 h-5 bg-blue-100 dark:bg-blue-900/40 rounded-lg flex items-center justify-center shrink-0 mt-0.5">
                  <svg
                    className="w-2.5 h-2.5 text-blue-600 dark:text-blue-400"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path d="M10 2a8 8 0 100 16 8 8 0 000-16zm0 14.5a6.5 6.5 0 110-13 6.5 6.5 0 010 13zm1-9.75a1 1 0 11-2 0 1 1 0 012 0zM10 13a1 1 0 00-1 1v1a1 1 0 002 0v-1a1 1 0 00-1-1z" />
                  </svg>
                </div>
                <div className="flex-1">
                  <p
                    className={cn(
                      "font-medium text-blue-900 dark:text-blue-300 mb-1",
                      isSmallMobile ? "text-xs" : "text-sm"
                    )}
                  >
                    What happens next?
                  </p>
                  <p
                    className={cn(
                      "text-blue-700 dark:text-blue-400 leading-relaxed",
                      isSmallMobile ? "text-xs" : "text-sm"
                    )}
                  >
                    • Read-only access to repository contents
                    <br />
                    • Sync issues and pull requests
                    <br />
                    • View files and code directly
                    <br />• Secure OAuth-based connection
                  </p>
                </div>
              </div>
            </div>

            <Button
              onClick={handleConnect}
              disabled={!isButtonEnabled || isConnecting}
              className={cn(
                "w-full rounded-xl font-semibold transition-all duration-200 shadow-lg bg-linear-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 disabled:opacity-50 disabled:pointer-events-none",
                getButtonSize()
              )}
            >
              {isConnecting ? (
                <>
                  <Loader2
                    className={cn(
                      "animate-spin mr-2",
                      isSmallMobile ? "h-3 w-3" : "h-4 w-4"
                    )}
                  />
                  {isSmallMobile ? "Connecting..." : "Connecting Repository..."}
                </>
              ) : (
                <>
                  <GitBranch
                    className={cn(
                      "mr-2",
                      isSmallMobile ? "h-3 w-3" : "h-4 w-4"
                    )}
                  />
                  {isSmallMobile ? "Connect Repo" : "Connect Repository"}
                </>
              )}
            </Button>

            <p
              className={cn(
                "text-center text-gray-400 dark:text-[#707070]",
                isSmallMobile ? "text-[10px]" : "text-xs"
              )}
            >
              Secure connection • Read-only access
            </p>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent
          className={cn(
            "rounded-2xl max-h-[90vh] overflow-hidden flex flex-col border border-gray-200 dark:border-[#2a2a2d] bg-white dark:bg-[#1a1a1c] shadow-xl",
            getDialogSize()
          )}
        >
          <DialogHeader
            className={cn(
              "shrink-0 px-6 pt-6",
              isSmallMobile ? "pb-2" : "pb-3"
            )}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div
                  className={cn(
                    "bg-linear-to-br from-purple-600 to-blue-600 dark:from-purple-500 dark:to-blue-500 rounded-xl flex items-center justify-center shadow-lg",
                    getIconSize()
                  )}
                >
                  <Github
                    className={cn(
                      "text-white",
                      isSmallMobile ? "h-3 w-3" : "h-4 w-4"
                    )}
                  />
                </div>
                <div>
                  <DialogTitle
                    className={cn(
                      "font-bold text-gray-900 dark:text-[#f0f0f0] flex items-center gap-2",
                      getHeaderSize()
                    )}
                  >
                    <span className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors cursor-pointer">
                      {connectedRepo.owner}/{connectedRepo.repo}
                    </span>
                    {repoStats?.stargazers_count && (
                      <Badge
                        variant="outline"
                        className="gap-1 bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800/50"
                      >
                        <Star className="h-3 w-3 fill-yellow-500 text-yellow-500" />
                        {repoStats.stargazers_count}
                      </Badge>
                    )}
                  </DialogTitle>
                  <div className="flex items-center gap-3 mt-1">
                    <div className="flex items-center gap-1 text-sm text-gray-500 dark:text-[#a0a0a0]">
                      <GitBranch className="h-3 w-3" />
                      <span>{selectedBranch}</span>
                    </div>
                    {repoStats?.language && (
                      <div className="flex items-center gap-1 text-sm text-gray-500 dark:text-[#a0a0a0]">
                        <Code className="h-3 w-3" />
                        <span>{repoStats.language}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleDisconnect}
                className={cn(
                  "text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl border border-red-200 dark:border-red-800/50 transition-all duration-200",
                  isSmallMobile ? "h-7 text-xs" : "h-8 text-sm"
                )}
              >
                <XCircle
                  className={cn("mr-1", isSmallMobile ? "h-3 w-3" : "h-2 w-2")}
                />
                {isSmallMobile ? "Disconnect" : "Disconnect"}
              </Button>
            </div>
          </DialogHeader>

          {error && (
            <div
              className={cn(
                "w-full mx-6 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800/50 backdrop-blur-sm shrink-0",
                isSmallMobile ? "p-2" : "p-3"
              )}
            >
              <div className="flex items-start gap-2 w-full">
                <div className="w-5 h-5 bg-red-100 dark:bg-red-900/40 rounded-full flex items-center justify-center shrink-0 mt-0.5">
                  <AlertCircle className="h-3 w-3 text-red-600 dark:text-red-400" />
                </div>
                <div className="flex-1">
                  <p
                    className={cn(
                      "text-red-800 dark:text-red-300 font-medium leading-relaxed",
                      isSmallMobile ? "text-xs" : "text-sm"
                    )}
                  >
                    {error}
                  </p>
                </div>
              </div>
            </div>
          )}

          {success && (
            <div
              className={cn(
                "w-full mx-6 rounded-xl bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800/50 backdrop-blur-sm shrink-0",
                isSmallMobile ? "p-2" : "p-3"
              )}
            >
              <div className="flex items-start gap-2 w-full">
                <div className="w-5 h-5 bg-green-100 dark:bg-green-900/40 rounded-full flex items-center justify-center shrink-0 mt-0.5">
                  <CheckCircle2 className="h-3 w-3 text-green-600 dark:text-green-400" />
                </div>
                <div className="flex-1">
                  <p
                    className={cn(
                      "text-green-800 dark:text-green-300 font-medium leading-relaxed",
                      isSmallMobile ? "text-xs" : "text-sm"
                    )}
                  >
                    {success}
                  </p>
                </div>
              </div>
            </div>
          )}

          <div className="px-6 py-3">
            <Separator className="bg-gray-200 dark:bg-[#2a2a2d]" />
          </div>

          <Tabs
            value={activeTab}
            onValueChange={setActiveTab}
            className="w-full flex-1 flex flex-col overflow-hidden px-6 pb-6"
          >
            <TabsList
              className={cn(
                "w-full shrink-0 bg-gray-100/80 dark:bg-[#252528] rounded-xl border border-gray-200 dark:border-[#2a2a2d] mb-4",
                getTabListLayout()
              )}
            >
              {getTabLabels().map((tab) => (
                <TabsTrigger
                  key={tab.value}
                  value={tab.value}
                  onClick={() => {
                    if (tab.value === "issues" && !issues.length)
                      fetchGithubData("issues");
                    if (tab.value === "pulls" && !pulls.length)
                      fetchGithubData("pulls");
                    if (tab.value === "readme" && !readme)
                      fetchGithubData("readme");
                    if (tab.value === "tree" && !repoTree)
                      fetchGithubData("tree");
                  }}
                  className="rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm data-[state=active]:text-blue-600 dark:data-[state=active]:bg-[#252528] dark:data-[state=active]:text-blue-400 font-medium transition-all duration-200 text-gray-600 dark:text-[#a0a0a0]"
                >
                  {tab.label}
                </TabsTrigger>
              ))}
            </TabsList>

            <TabsContent
              value="overview"
              className={cn(
                "space-y-4 overflow-y-auto flex-1 opacity-100",
                getContentPadding()
              )}
            >
              {repoStats && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <StatCard
                    icon={Star}
                    value={repoStats.stargazers_count || 0}
                    label="Stars"
                    color="orange"
                  />
                  <StatCard
                    icon={GitFork}
                    value={repoStats.forks_count || 0}
                    label="Forks"
                    color="green"
                  />
                  <StatCard
                    icon={Eye}
                    value={repoStats.watchers_count || 0}
                    label="Watchers"
                    color="purple"
                  />
                  <StatCard
                    icon={FileCode}
                    value={
                      repoStats.size
                        ? `${(repoStats.size / 1024).toFixed(1)} MB`
                        : "N/A"
                    }
                    label="Size"
                    color="blue"
                  />
                </div>
              )}

              <div className={cn("grid", getGridLayout())}>
                <div
                  className={cn(
                    "rounded-xl border border-green-200 dark:border-green-800/50 bg-green-50/80 dark:bg-green-900/20 backdrop-blur-sm",
                    getCardPadding()
                  )}
                >
                  <div className="flex items-center gap-2">
                    <div
                      className={cn(
                        "bg-green-100 dark:bg-green-900/40 rounded-lg flex items-center justify-center",
                        isSmallMobile ? "w-8 h-8" : "w-10 h-10"
                      )}
                    >
                      <CheckCircle2
                        className={cn(
                          "text-green-600 dark:text-green-400",
                          isSmallMobile ? "h-4 w-4" : "h-5 w-5"
                        )}
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p
                        className={cn(
                          "font-semibold text-green-900 dark:text-green-300",
                          isSmallMobile ? "text-xs" : "text-sm"
                        )}
                      >
                        Repository Connected
                      </p>
                      <div className="flex items-center gap-1 mt-1 group">
                        <p
                          className={cn(
                            "text-green-700 dark:text-green-400 break-all opacity-80 flex-1",
                            isSmallMobile ? "text-[10px]" : "text-xs"
                          )}
                        >
                          {connectedRepo.fullUrl}
                        </p>
                        <div className="relative">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={(event) => {
                              event.preventDefault();
                              navigator.clipboard.writeText(
                                connectedRepo.fullUrl
                              );
                              setIsCopied(true);
                              setTimeout(() => setIsCopied(false), 2000);
                            }}
                            className={cn(
                              "p-0 opacity-0 group-hover:opacity-100 transition-opacity duration-200 hover:bg-green-100 dark:hover:bg-green-900/40 rounded-lg shrink-0 cursor-pointer relative",
                              isSmallMobile ? "h-5 w-5" : "h-6 w-6"
                            )}
                            title="Copy repository URL"
                          >
                            {isCopied ? (
                              <CheckCircle2
                                className={
                                  isSmallMobile
                                    ? "h-2.5 w-2.5 text-green-600 dark:text-green-400"
                                    : "h-3 w-3 text-green-600 dark:text-green-400"
                                }
                              />
                            ) : (
                              <Copy
                                className={
                                  isSmallMobile
                                    ? "h-2.5 w-2.5 text-green-600 dark:text-green-400"
                                    : "h-3 w-3 text-green-600 dark:text-green-400"
                                }
                              />
                            )}
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div
                  className={cn(
                    "rounded-xl border border-gray-200 dark:border-[#2a2a2d] bg-gray-50/80 dark:bg-[#252528]/80 backdrop-blur-sm",
                    getCardPadding()
                  )}
                >
                  <div className="flex items-center gap-2">
                    <div
                      className={cn(
                        "bg-blue-100 dark:bg-blue-900/40 rounded-lg flex items-center justify-center",
                        isSmallMobile ? "w-8 h-8" : "w-10 h-10"
                      )}
                    >
                      <RefreshCw
                        className={cn(
                          "text-blue-600 dark:text-blue-400",
                          isSmallMobile ? "h-4 w-4" : "h-5 w-5"
                        )}
                      />
                    </div>
                    <div>
                      <p
                        className={cn(
                          "font-semibold text-gray-900 dark:text-[#f0f0f0]",
                          isSmallMobile ? "text-xs" : "text-sm"
                        )}
                      >
                        Last Synced
                      </p>
                      <p
                        className={cn(
                          "text-gray-600 dark:text-[#a0a0a0] mt-1",
                          isSmallMobile ? "text-[10px]" : "text-xs"
                        )}
                      >
                        {connectedRepo.lastSyncAt
                          ? new Date(connectedRepo.lastSyncAt).toLocaleString()
                          : "Never"}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div
                className={cn(
                  "flex items-center gap-2 rounded-xl border border-gray-200 dark:border-[#2a2a2d] bg-gray-50/80 dark:bg-[#252528]/80 backdrop-blur-sm",
                  isSmallMobile ? "p-2" : "p-3"
                )}
              >
                <div
                  className={cn(
                    "bg-purple-100 dark:bg-purple-900/40 rounded-lg flex items-center justify-center shrink-0",
                    isSmallMobile ? "w-8 h-8" : "w-10 h-10"
                  )}
                >
                  <GitBranch
                    className={cn(
                      "text-purple-600 dark:text-purple-400",
                      isSmallMobile ? "h-4 w-4" : "h-5 w-5"
                    )}
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <label
                    className={cn(
                      "font-semibold text-gray-600 dark:text-[#a0a0a0] block mb-1",
                      isSmallMobile ? "text-[10px]" : "text-xs"
                    )}
                  >
                    Current Branch
                  </label>
                  <div className="flex items-center gap-2">
                    <select
                      value={selectedBranch}
                      onChange={(e) => {
                        setSelectedBranch(e.target.value);
                        if (activeTab === "tree") {
                          setCurrentPath("");
                          setPathHistory([]);
                          fetchGithubData("tree");
                        }
                      }}
                      className={cn(
                        "border border-gray-200 dark:border-[#2a2a2d] rounded-lg bg-white dark:bg-[#1a1a1c] text-gray-900 dark:text-[#f0f0f0] focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-transparent transition-all duration-200",
                        isSmallMobile
                          ? "text-xs px-2 py-1 max-w-[120px]"
                          : "text-sm px-3 py-2 max-w-[150px]"
                      )}
                    >
                      {branches.map((branch) => (
                        <option key={branch} value={branch}>
                          {branch}
                        </option>
                      ))}
                    </select>
                    <Badge
                      variant="outline"
                      className={cn(
                        "bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800/50",
                        isSmallMobile ? "text-[10px] px-1.5" : "text-xs"
                      )}
                    >
                      {branches.length}{" "}
                      {branches.length === 1 ? "branch" : "branches"}
                    </Badge>
                  </div>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={fetchBranches}
                  disabled={isLoading}
                  className={cn(
                    "shrink-0 rounded-lg border border-gray-200 dark:border-[#2a2a2d] bg-white dark:bg-[#252528] hover:bg-gray-100 dark:hover:bg-[#2a2a2d] cursor-pointer",
                    isSmallMobile ? "h-7 w-7" : "h-8 w-8"
                  )}
                  title="Refresh branches"
                >
                  <RefreshCw
                    className={cn(
                      isSmallMobile ? "h-3 w-3" : "h-3 w-3",
                      isLoading ? "animate-spin" : ""
                    )}
                  />
                </Button>
              </div>

              <div className="space-y-2">
                {[
                  {
                    label: "View Issues",
                    icon: AlertCircle,
                    action: () => {
                      fetchGithubData("issues");
                      setActiveTab("issues");
                    },
                  },
                  {
                    label: "View Pull Requests",
                    icon: GitPullRequest,
                    action: () => {
                      fetchGithubData("pulls");
                      setActiveTab("pulls");
                    },
                  },
                  {
                    label: "View README",
                    icon: FileText,
                    action: () => {
                      fetchGithubData("readme");
                      setActiveTab("readme");
                    },
                  },
                  {
                    label: "Browse Files",
                    icon: FolderTree,
                    action: () => {
                      fetchGithubData("tree");
                      setActiveTab("tree");
                    },
                  },
                ].map((item, index) => (
                  <Button
                    key={index}
                    variant="outline"
                    className={cn(
                      "w-full justify-start rounded-lg border border-gray-200 dark:border-[#2a2a2d] bg-white dark:bg-[#252528] hover:bg-gray-50 dark:hover:bg-[#2a2a2d] hover:border-blue-300 dark:hover:border-blue-500 transition-all duration-200 text-gray-700 dark:text-[#f0f0f0]",
                      isSmallMobile ? "h-10 text-xs" : "h-12 text-sm"
                    )}
                    onClick={item.action}
                  >
                    <div
                      className={cn(
                        "bg-linear-to-br from-blue-100 to-purple-100 dark:from-blue-900/40 dark:to-purple-900/40 rounded-lg flex items-center justify-center mr-2",
                        isSmallMobile ? "w-7 h-7" : "w-8 h-8"
                      )}
                    >
                      <item.icon
                        className={cn(
                          "text-blue-600 dark:text-blue-400",
                          isSmallMobile ? "h-3 w-3" : "h-4 w-4"
                        )}
                      />
                    </div>
                    {item.label}
                  </Button>
                ))}
              </div>
            </TabsContent>

            <TabsContent
              value="issues"
              className="mt-4 overflow-y-auto flex-1 pr-2"
            >
              {isLoading ? (
                <div className="flex items-center justify-center h-40">
                  <Loader2 className="h-8 w-8 animate-spin text-blue-600 dark:text-blue-400" />
                </div>
              ) : issues.length === 0 ? (
                <div className="text-center py-12">
                  <div className="w-16 h-16 bg-gray-100 dark:bg-[#252528] rounded-2xl flex items-center justify-center mx-auto mb-4">
                    <AlertCircle className="h-8 w-8 text-gray-400 dark:text-[#707070]" />
                  </div>
                  <p className="text-gray-500 dark:text-[#a0a0a0] font-medium">
                    No issues found
                  </p>
                </div>
              ) : (
                <div className="space-y-3 pb-4">
                  {issues.map((issue) => (
                    <div
                      key={issue.id}
                      className="p-4 border-2 border-gray-200 dark:border-[#2a2a2d] rounded-xl bg-white dark:bg-[#252528] hover:bg-gray-50 dark:hover:bg-[#2a2a2d] hover:border-blue-300 dark:hover:border-blue-500 transition-all duration-200 group"
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-2 flex-wrap">
                            <Badge
                              variant={
                                issue.state === "open" ? "default" : "secondary"
                              }
                              className={`rounded-lg ${
                                issue.state === "open"
                                  ? "bg-green-100 dark:bg-green-900/20 text-green-800 dark:text-green-300 border-green-200 dark:border-green-800/50"
                                  : "bg-gray-100 dark:bg-[#2a2a2d] text-gray-800 dark:text-[#a0a0a0] border-gray-200 dark:border-[#2a2a2d]"
                              }`}
                            >
                              {issue.state}
                            </Badge>
                            <span className="text-sm font-semibold text-gray-600 dark:text-[#a0a0a0]">
                              #{issue.number}
                            </span>
                          </div>
                          <h4 className="font-semibold text-gray-900 dark:text-[#f0f0f0] mb-2">
                            {issue.title}
                          </h4>
                          <p className="text-sm text-gray-600 dark:text-[#a0a0a0] line-clamp-2 leading-relaxed">
                            {issue.body || "No description provided"}
                          </p>
                        </div>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="shrink-0 rounded-xl opacity-0 group-hover:opacity-100 transition-all duration-200 bg-blue-50 dark:bg-blue-900/20 hover:bg-blue-100 dark:hover:bg-blue-900/40 border border-blue-200 dark:border-blue-800/50"
                          onClick={() =>
                            addToDocument(
                              `Issue #${issue.number}: ${issue.title}\n\n${issue.body}`,
                              "issue"
                            )
                          }
                        >
                          <Plus className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </TabsContent>

            <TabsContent
              value="pulls"
              className="mt-4 overflow-y-auto flex-1 pr-2"
            >
              {isLoading ? (
                <div className="flex items-center justify-center h-40">
                  <Loader2 className="h-8 w-8 animate-spin text-blue-600 dark:text-blue-400" />
                </div>
              ) : pulls.length === 0 ? (
                <div className="text-center py-12">
                  <div className="w-16 h-16 bg-gray-100 dark:bg-[#252528] rounded-2xl flex items-center justify-center mx-auto mb-4">
                    <GitPullRequest className="h-8 w-8 text-gray-400 dark:text-[#707070]" />
                  </div>
                  <p className="text-gray-500 dark:text-[#a0a0a0] font-medium">
                    No pull requests found
                  </p>
                </div>
              ) : (
                <div className="space-y-3 pb-4">
                  {pulls.map((pr) => (
                    <div
                      key={pr.id}
                      className="p-4 border-2 border-gray-200 dark:border-[#2a2a2d] rounded-xl bg-white dark:bg-[#252528] hover:bg-gray-50 dark:hover:bg-[#2a2a2d] hover:border-blue-300 dark:hover:border-blue-500 transition-all duration-200 group"
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-2 flex-wrap">
                            <Badge
                              variant={
                                pr.state === "open" ? "default" : "secondary"
                              }
                              className={`rounded-lg ${
                                pr.state === "open"
                                  ? "bg-purple-100 dark:bg-purple-900/20 text-purple-800 dark:text-purple-300 border-purple-200 dark:border-purple-800/50"
                                  : "bg-gray-100 dark:bg-[#2a2a2d] text-gray-800 dark:text-[#a0a0a0] border-gray-200 dark:border-[#2a2a2d]"
                              }`}
                            >
                              {pr.state}
                            </Badge>
                            <span className="text-sm font-semibold text-gray-600 dark:text-[#a0a0a0]">
                              #{pr.number}
                            </span>
                          </div>
                          <h4 className="font-semibold text-gray-900 dark:text-[#f0f0f0] mb-2">
                            {pr.title}
                          </h4>
                          <p className="text-sm text-gray-600 dark:text-[#a0a0a0] line-clamp-2 leading-relaxed">
                            {pr.body || "No description provided"}
                          </p>
                        </div>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="shrink-0 rounded-xl opacity-0 group-hover:opacity-100 transition-all duration-200 bg-blue-50 dark:bg-blue-900/20 hover:bg-blue-100 dark:hover:bg-blue-900/40 border border-blue-200 dark:border-blue-800/50 cursor-pointer"
                          onClick={() =>
                            addToDocument(
                              `PR #${pr.number}: ${pr.title}\n\n${pr.body}`,
                              "pr"
                            )
                          }
                        >
                          <Plus className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </TabsContent>

            <TabsContent value="readme" className="mt-4 overflow-y-auto flex-1">
              {isLoading ? (
                <div className="flex items-center justify-center h-40">
                  <Loader2 className="h-8 w-8 animate-spin text-blue-600 dark:text-blue-400" />
                </div>
              ) : !readme ? (
                <div className="text-center py-12">
                  <div className="w-16 h-16 bg-gray-100 dark:bg-[#252528] rounded-2xl flex items-center justify-center mx-auto mb-4">
                    <FileText className="h-8 w-8 text-gray-400 dark:text-[#707070]" />
                  </div>
                  <p className="text-gray-500 dark:text-[#a0a0a0] font-medium">
                    README not found
                  </p>
                </div>
              ) : (
                <div className="space-y-4 pb-4">
                  <div
                    className={cn(
                      "flex items-center",
                      isSmallMobile || isMobile
                        ? "justify-between"
                        : "justify-end"
                    )}
                  >
                    {(isSmallMobile || isMobile) && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={(event) => {
                          event.preventDefault();
                          navigator.clipboard.writeText(readme);
                          setIsCopied(true);
                          setTimeout(() => setIsCopied(false), 2000);
                        }}
                        className="rounded-xl border-2 border-gray-200 dark:border-[#2a2a2d] bg-white dark:bg-[#252528] hover:bg-gray-50 dark:hover:bg-[#2a2a2d] hover:border-blue-300 dark:hover:border-blue-500 transition-all duration-200 cursor-pointer flex items-center gap-2"
                        title="Copy README content"
                      >
                        {isCopied ? (
                          <>
                            <CheckCircle2 className="h-4 w-4 text-green-600 dark:text-green-400" />
                            <span className="text-green-600 dark:text-green-400 font-medium">
                              Copied!
                            </span>
                          </>
                        ) : (
                          <>
                            <Copy className="h-4 w-4 text-gray-600 dark:text-[#a0a0a0]" />
                            <span className="text-gray-700 dark:text-[#f0f0f0] font-medium">
                              Copy README
                            </span>
                          </>
                        )}
                      </Button>
                    )}

                    <Button
                      size="sm"
                      onClick={() => addToDocument(readme, "readme")}
                      className="rounded-xl bg-linear-to-r from-blue-600 to-purple-600 dark:from-blue-500 dark:to-purple-500 hover:from-blue-700 hover:to-purple-700 dark:hover:from-blue-600 dark:hover:to-purple-600 shadow-lg transition-all duration-200 cursor-pointer"
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Add to Document
                    </Button>
                  </div>

                  <div className="relative p-6 border-2 border-gray-200 dark:border-[#2a2a2d] rounded-xl bg-white dark:bg-[#252528] overflow-auto group">
                    {!isSmallMobile && !isMobile && (
                      <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity duration-200 z-10">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={(event) => {
                            event.preventDefault();
                            navigator.clipboard.writeText(readme);
                            setIsCopied(true);
                            setTimeout(() => setIsCopied(false), 2000);
                          }}
                          className="h-8 w-8 p-0 rounded-lg bg-white dark:bg-[#252528] backdrop-blur-sm border border-gray-300 dark:border-[#2a2a2d] shadow-sm hover:bg-gray-50 dark:hover:bg-[#2a2a2d] hover:border-blue-300 dark:hover:border-blue-500 transition-all duration-200 cursor-pointer flex items-center justify-center"
                          title="Copy README content"
                        >
                          {isCopied ? (
                            <Copy className="h-4 w-4 text-green-600 dark:text-green-400" />
                          ) : (
                            <Copy className="h-4 w-4 text-gray-600 dark:text-[#a0a0a0]" />
                          )}
                        </Button>
                      </div>
                    )}

                    <pre className="text-sm whitespace-pre-wrap wrap-break-word font-mono leading-relaxed text-gray-800 dark:text-[#f0f0f0] pt-2">
                      {readme}
                    </pre>
                  </div>
                </div>
              )}
            </TabsContent>

            <TabsContent value="tree" className="mt-4 overflow-y-auto flex-1">
              {isLoading ? (
                <div className="flex items-center justify-center h-40">
                  <Loader2 className="h-8 w-8 animate-spin text-blue-600 dark:text-blue-400" />
                </div>
              ) : !repoTree?.tree ? (
                <div className="text-center py-12">
                  <div className="w-16 h-16 bg-gray-100 dark:bg-[#252528] rounded-2xl flex items-center justify-center mx-auto mb-4">
                    <FolderTree className="h-8 w-8 text-gray-400 dark:text-[#707070]" />
                  </div>
                  <p className="text-gray-500 dark:text-[#a0a0a0] font-medium">
                    No files found
                  </p>
                </div>
              ) : (
                <div className="space-y-3 pb-4">
                  <div className="flex items-center gap-2 p-3 rounded-xl border-2 border-gray-200 dark:border-[#2a2a2d] bg-white dark:bg-[#252528]">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={navigateToRoot}
                      disabled={!currentPath}
                      className="h-8 w-8 rounded-lg bg-gray-100 dark:bg-[#2a2a2d] hover:bg-gray-200 dark:hover:bg-[#353538]"
                    >
                      <Home className="h-4 w-4" />
                    </Button>
                    {pathHistory.length > 0 && (
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={navigateBack}
                        className="h-8 w-8 rounded-lg bg-gray-100 dark:bg-[#2a2a2d] hover:bg-gray-200 dark:hover:bg-[#353538]"
                      >
                        <ChevronRight className="h-4 w-4 rotate-180" />
                      </Button>
                    )}
                    <span className="text-sm font-medium text-gray-700 dark:text-[#f0f0f0] truncate flex-1">
                      {currentPath ? `/${currentPath}` : "root"}
                    </span>
                  </div>

                  {getCurrentFolderContents().folders.length > 0 && (
                    <div className="space-y-1">
                      {getCurrentFolderContents().folders.map((folder: any) => (
                        <button
                          key={folder.path}
                          onClick={() => navigateToFolder(folder.path)}
                          className="w-full flex items-center gap-3 p-3 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-xl border-2 border-transparent hover:border-blue-200 dark:hover:border-blue-800/50 transition-all duration-200 group cursor-pointer"
                        >
                          <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900/40 rounded-lg flex items-center justify-center">
                            <Folder className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                          </div>
                          <span className="text-sm font-medium text-gray-900 dark:text-[#f0f0f0] truncate flex-1 text-left">
                            {folder.name}
                          </span>
                          <ChevronRight className="h-4 w-4 text-gray-400 dark:text-[#707070] group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors" />
                        </button>
                      ))}
                    </div>
                  )}

                  {getCurrentFolderContents().files.map((file: any) => (
                    <div
                      key={file.path}
                      className="flex items-center justify-between p-3 hover:bg-gray-50 dark:hover:bg-[#2a2a2d] rounded-xl border-2 border-transparent hover:border-gray-200 dark:hover:border-[#353538] transition-all duration-200 group cursor-pointer"
                    >
                      <div
                        className="flex items-center gap-3 min-w-0 flex-1"
                        onClick={() => handleFileClick(file)}
                      >
                        <div className="w-8 h-8 bg-gray-100 dark:bg-[#2a2a2d] rounded-lg flex items-center justify-center">
                          <FileCode className="h-4 w-4 text-gray-400 dark:text-[#707070]" />
                        </div>
                        <span className="text-sm text-gray-900 dark:text-[#f0f0f0] truncate">
                          {file.name}
                        </span>
                      </div>
                      <a
                        href={`${connectedRepo.fullUrl}/blob/${selectedBranch}/${file.path}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="shrink-0"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <Button
                          size="sm"
                          variant="ghost"
                          className="rounded-lg bg-gray-100 dark:bg-[#2a2a2d] hover:bg-gray-200 dark:hover:bg-[#353538] cursor-pointer"
                        >
                          <ExternalLink className="h-4 w-4" />
                        </Button>
                      </a>
                    </div>
                  ))}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </DialogContent>
      </Dialog>

      {selectedFile && (
        <CodeViewerModal
          open={codeViewerOpen}
          onOpenChange={setCodeViewerOpen}
          filePath={selectedFile.path}
          fileName={selectedFile.name}
          repoUrl={connectedRepo.fullUrl}
          branch={selectedBranch}
          teamId={activeTeam?.id || ""}
        />
      )}

      {readmeContent && (
        <>
          <AddReadmeToFileModal
            open={showFileSelectModal}
            onOpenChange={setShowFileSelectModal}
            readmeContent={readmeContent}
            onConfirm={handleFileConfirm}
          />

          {selectedFileForUpload && (
            <ReadmeUploadProgress
              open={showUploadProgress}
              onOpenChange={setShowUploadProgress}
              fileId={selectedFileForUpload.id}
              fileName={selectedFileForUpload.name}
              readmeContent={readmeContent}
            />
          )}
        </>
      )}
    </>
  );
}
