"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
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
  FolderOpen,
  Copy,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useActiveTeam } from "@/app/_context/ActiveTeamContext";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useGithub } from "@/app/_context/GithubContext";

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
  const { connectedRepo, setConnectedRepo, checkRepoConnection } = useGithub();
  const [repoUrl, setRepoUrl] = useState("");
  const [isConnecting, setIsConnecting] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const [activeTab, setActiveTab] = useState("connect");
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
    }
  }, [open, connectedRepo, activeTeam]);

  const checkConnectedRepo = async () => {
    if (activeTeam?.id) {
      await checkRepoConnection(activeTeam.id);
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
    console.log("Add to document:", { content, type });
    setSuccess(
      `${type} will be added to document (EditorJS integration pending)`
    );
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

  if (!connectedRepo) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-lg rounded-2xl border-0 bg-linear-to-br from-white to-gray-50/80 backdrop-blur-sm shadow-xl">
          <DialogHeader className="text-center space-y-3">
            <div className="mx-auto w-12 h-12 bg-linear-to-br from-purple-500 to-blue-600 rounded-xl flex items-center justify-center shadow-lg">
              <Github className="h-6 w-6 text-white" />
            </div>
            <DialogTitle className="text-2xl font-bold bg-linear-to-br from-gray-900 to-gray-700 bg-clip-text text-transparent">
              Connect Repository
            </DialogTitle>
            <p className="text-sm text-gray-500 font-normal">
              Sync your GitHub repository to track issues and collaborate
            </p>
          </DialogHeader>

          <div className="space-y-5 mt-2">
            {error && (
              <Alert
                variant="destructive"
                className="rounded-xl border-l-4 border-l-red-500"
              >
                <div className="flex items-start gap-3">
                  <AlertCircle className="h-5 w-5 mt-0.5 shrink-0" />
                  <AlertDescription className="text-sm">
                    {error}
                  </AlertDescription>
                </div>
              </Alert>
            )}

            {success && (
              <Alert className="rounded-xl border-l-4 border-l-green-500 bg-green-50/80 border-green-200/80">
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="h-5 w-5 mt-0.5 text-green-600 shrink-0" />
                  <AlertDescription className="text-green-800 text-sm">
                    {success}
                  </AlertDescription>
                </div>
              </Alert>
            )}

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-sm font-semibold text-gray-700">
                  Repository URL
                </label>
                <span className="text-xs text-gray-400">Required</span>
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
                    "w-full rounded-xl h-12 px-4 border-2 bg-white/80 backdrop-blur-sm transition-all duration-200",
                    "focus:bg-white focus:ring-2 focus:ring-offset-1",
                    repoUrl && !isValidGithubUrl(repoUrl)
                      ? "border-red-300 focus:border-red-500 focus:ring-red-500/20"
                      : "border-gray-200 focus:border-blue-500 focus:ring-blue-500/20"
                  )}
                />
                {isValidGithubUrl(repoUrl) && (
                  <CheckCircle2 className="h-5 w-5 text-green-500 absolute right-3 top-1/2 transform -translate-y-1/2" />
                )}
              </div>
              {repoUrl && !isValidGithubUrl(repoUrl) && (
                <div className="flex items-center gap-2 text-red-600 text-xs">
                  <AlertCircle className="h-4 w-4" />
                  Please enter a valid GitHub repository URL
                </div>
              )}
            </div>

            <div className="p-4 rounded-xl text-sm bg-linear-to-r from-blue-50/80 to-indigo-50/80 border border-blue-200/60 backdrop-blur-sm">
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 bg-blue-100 rounded-lg flex items-center justify-center shrink-0 mt-0.5">
                  <svg
                    className="w-3 h-3 text-blue-600"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path d="M10 2a8 8 0 100 16 8 8 0 000-16zm0 14.5a6.5 6.5 0 110-13 6.5 6.5 0 010 13zm1-9.75a1 1 0 11-2 0 1 1 0 012 0zM10 13a1 1 0 00-1 1v1a1 1 0 002 0v-1a1 1 0 00-1-1z" />
                  </svg>
                </div>
                <div>
                  <p className="font-medium text-blue-900 mb-1">
                    What happens next?
                  </p>
                  <p className="text-blue-700 leading-relaxed">
                    Connect your repository to sync issues, track progress, and
                    collaborate with your team in real-time.
                  </p>
                </div>
              </div>
            </div>

            <Button
              onClick={handleConnect}
              disabled={!isButtonEnabled || isConnecting}
              className={cn(
                "w-full rounded-xl h-12 font-semibold text-base transition-all duration-200 shadow-lg",
                "bg-linear-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700",
                "disabled:opacity-50 disabled:pointer-events-none disabled:bg-gray-400"
              )}
            >
              {isConnecting ? (
                <>
                  <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                  Connecting Repository...
                </>
              ) : (
                <>
                  <GitBranch className="h-5 w-5 mr-2" />
                  Connect Repository
                </>
              )}
            </Button>

            <p className="text-center text-xs text-gray-400">
              Secure connection • Read-only access
            </p>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-4xl rounded-2xl max-h-[90vh] overflow-hidden flex flex-col border-0 bg-linear-to-br from-white to-gray-50/80 backdrop-blur-sm shadow-xl">
        <DialogHeader className="shrink-0 pb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-linear-to-br from-purple-500 to-blue-600 rounded-xl flex items-center justify-center shadow-lg">
                <Github className="h-5 w-5 text-white" />
              </div>
              <div>
                <DialogTitle className="text-2xl font-bold bg-linear-to-br from-gray-900 to-gray-700 bg-clip-text text-transparent">
                  {connectedRepo.owner}/{connectedRepo.repo}
                </DialogTitle>
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleDisconnect}
              className="text-red-600 hover:text-red-700 hover:bg-red-50/80 rounded-xl border border-red-200/60 transition-all duration-200"
            >
              <XCircle className="h-4 w-4 mr-1" />
              Disconnect
            </Button>
          </div>
        </DialogHeader>

        {error && (
          <Alert
            variant="destructive"
            className="rounded-xl border-l-4 border-l-red-500 shrink-0"
          >
            <div className="flex items-start gap-3">
              <AlertCircle className="h-5 w-5 mt-0.5 shrink-0" />
              <AlertDescription className="text-sm">{error}</AlertDescription>
            </div>
          </Alert>
        )}

        {success && (
          <Alert className="rounded-xl border-l-4 border-l-green-500 bg-green-50/80 border-green-200/80 shrink-0">
            <div className="flex items-start gap-3">
              <CheckCircle2 className="h-5 w-5 mt-0.5 text-green-600 shrink-0" />
              <AlertDescription className="text-green-800 text-sm">
                {success}
              </AlertDescription>
            </div>
          </Alert>
        )}

        <Tabs
          value={activeTab}
          onValueChange={setActiveTab}
          className="w-full flex-1 flex flex-col overflow-hidden"
        >
          <TabsList className="grid w-full grid-cols-5 shrink-0 bg-gray-100/80 p-1 rounded-2xl border">
            {[
              { value: "overview", label: "Overview" },
              { value: "issues", label: "Issues" },
              { value: "pulls", label: "Pull Requests" },
              { value: "readme", label: "README" },
              { value: "tree", label: "Files" },
            ].map((tab) => (
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
                className="rounded-xl data-[state=active]:bg-white data-[state=active]:shadow-sm data-[state=active]:text-blue-600 font-medium transition-all duration-200"
              >
                {tab.label}
              </TabsTrigger>
            ))}
          </TabsList>

          <TabsContent
            value="overview"
            className="space-y-4 mt-4 overflow-y-auto flex-1 pr-2"
          >
            <div className="grid grid-cols-2 gap-3">
              <div className="p-4 rounded-xl border-2 border-green-200/60 bg-linear-to-br from-green-50/80 to-emerald-50/80 backdrop-blur-sm">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                    <CheckCircle2 className="h-5 w-5 text-green-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-green-900">
                      Repository Connected
                    </p>
                    <div className="flex items-center gap-2 mt-1 group">
                      <p className="text-xs text-green-700 break-all opacity-80 flex-1">
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
                          className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity duration-200 hover:bg-green-100 rounded-lg shrink-0 cursor-pointer relative"
                          title="Copy repository URL"
                        >
                          {isCopied ? (
                            <CheckCircle2 className="h-3 w-3 text-green-600" />
                          ) : (
                            <Copy className="h-3 w-3 text-green-600" />
                          )}
                        </Button>

                        {isCopied && (
                          <div className="absolute -top-8 -right-4.5 bg-green-600 text-white text-xs px-2 py-1 rounded-lg pointer-events-none whitespace-nowrap z-10">
                            Copied!
                            <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 translate-y-1 w-2 h-2 bg-green-600 rotate-45"></div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <div className="p-4 rounded-xl border-2 border-gray-200/60 bg-white/80 backdrop-blur-sm">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                    <RefreshCw className="h-5 w-5 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-gray-900">
                      Last Synced
                    </p>
                    <p className="text-xs text-gray-600 mt-1">
                      {connectedRepo.lastSyncAt
                        ? new Date(connectedRepo.lastSyncAt).toLocaleString()
                        : "Never"}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3 p-4 rounded-xl border-2 border-gray-200/60 bg-white/80 backdrop-blur-sm">
              <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center shrink-0">
                <GitBranch className="h-5 w-5 text-purple-600" />
              </div>
              <div className="flex-1 min-w-0">
                <label className="text-xs font-semibold text-gray-600 block mb-2">
                  Current Branch
                </label>
                <div className="flex items-center gap-3">
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
                    className="text-sm border-2 border-gray-200 rounded-xl px-3 py-2 bg-white w-full max-w-[200px] focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                  >
                    {branches.map((branch) => (
                      <option key={branch} value={branch}>
                        {branch}
                      </option>
                    ))}
                  </select>
                  <Badge
                    variant="outline"
                    className="text-xs bg-blue-50 text-blue-700 border-blue-200"
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
                className="shrink-0 rounded-xl border-2"
                title="Refresh branches"
              >
                <RefreshCw
                  className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`}
                />
              </Button>
            </div>

            <div className="space-y-3">
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
                  className="w-full justify-start rounded-xl h-12 border-2 border-gray-200/60 bg-white/80 hover:bg-white hover:border-blue-300 transition-all duration-200"
                  onClick={item.action}
                >
                  <div className="w-8 h-8 bg-linear-to-br from-blue-100 to-purple-100 rounded-lg flex items-center justify-center mr-3">
                    <item.icon className="h-4 w-4 text-blue-600" />
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
                <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
              </div>
            ) : issues.length === 0 ? (
              <div className="text-center py-12">
                <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <AlertCircle className="h-8 w-8 text-gray-400" />
                </div>
                <p className="text-gray-500 font-medium">No issues found</p>
              </div>
            ) : (
              <div className="space-y-3 pb-4">
                {issues.map((issue) => (
                  <div
                    key={issue.id}
                    className="p-4 border-2 border-gray-200/60 rounded-xl bg-white/80 hover:bg-white hover:border-blue-300 transition-all duration-200 group"
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
                                ? "bg-green-100 text-green-800 border-green-200"
                                : "bg-gray-100 text-gray-800 border-gray-200"
                            }`}
                          >
                            {issue.state}
                          </Badge>
                          <span className="text-sm font-semibold text-gray-600">
                            #{issue.number}
                          </span>
                        </div>
                        <h4 className="font-semibold text-gray-900 mb-2">
                          {issue.title}
                        </h4>
                        <p className="text-sm text-gray-600 line-clamp-2 leading-relaxed">
                          {issue.body || "No description provided"}
                        </p>
                      </div>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="shrink-0 rounded-xl opacity-0 group-hover:opacity-100 transition-all duration-200 bg-blue-50 hover:bg-blue-100 border border-blue-200"
                        onClick={() =>
                          addToDocument(
                            `Issue #${issue.number}: ${issue.title}\n\n${issue.body}`,
                            "issue"
                          )
                        }
                      >
                        <Plus className="h-4 w-4 text-blue-600" />
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
                <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
              </div>
            ) : pulls.length === 0 ? (
              <div className="text-center py-12">
                <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <GitPullRequest className="h-8 w-8 text-gray-400" />
                </div>
                <p className="text-gray-500 font-medium">
                  No pull requests found
                </p>
              </div>
            ) : (
              <div className="space-y-3 pb-4">
                {pulls.map((pr) => (
                  <div
                    key={pr.id}
                    className="p-4 border-2 border-gray-200/60 rounded-xl bg-white/80 hover:bg-white hover:border-blue-300 transition-all duration-200 group"
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
                                ? "bg-purple-100 text-purple-800 border-purple-200"
                                : "bg-gray-100 text-gray-800 border-gray-200"
                            }`}
                          >
                            {pr.state}
                          </Badge>
                          <span className="text-sm font-semibold text-gray-600">
                            #{pr.number}
                          </span>
                        </div>
                        <h4 className="font-semibold text-gray-900 mb-2">
                          {pr.title}
                        </h4>
                        <p className="text-sm text-gray-600 line-clamp-2 leading-relaxed">
                          {pr.body || "No description provided"}
                        </p>
                      </div>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="shrink-0 rounded-xl opacity-0 group-hover:opacity-100 transition-all duration-200 bg-blue-50 hover:bg-blue-100 border border-blue-200"
                        onClick={() =>
                          addToDocument(
                            `PR #${pr.number}: ${pr.title}\n\n${pr.body}`,
                            "pr"
                          )
                        }
                      >
                        <Plus className="h-4 w-4 text-blue-600" />
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
                <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
              </div>
            ) : !readme ? (
              <div className="text-center py-12">
                <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <FileText className="h-8 w-8 text-gray-400" />
                </div>
                <p className="text-gray-500 font-medium">README not found</p>
              </div>
            ) : (
              <div className="space-y-4 pb-4">
                <div className="flex justify-end">
                  <Button
                    size="sm"
                    onClick={() => addToDocument(readme, "readme")}
                    className="rounded-xl bg-linear-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 shadow-lg transition-all duration-200"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add to Document
                  </Button>
                </div>
                <div className="p-6 border-2 border-gray-200/60 rounded-xl bg-white/80 backdrop-blur-sm overflow-auto">
                  <pre className="text-sm whitespace-pre-wrap wrap-break-words font-mono leading-relaxed text-gray-800">
                    {readme}
                  </pre>
                </div>
              </div>
            )}
          </TabsContent>

          <TabsContent value="tree" className="mt-4 overflow-y-auto flex-1">
            {isLoading ? (
              <div className="flex items-center justify-center h-40">
                <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
              </div>
            ) : !repoTree?.tree ? (
              <div className="text-center py-12">
                <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <FolderTree className="h-8 w-8 text-gray-400" />
                </div>
                <p className="text-gray-500 font-medium">No files found</p>
              </div>
            ) : (
              <div className="space-y-3 pb-4">
                {/* Breadcrumb navigation */}
                <div className="flex items-center gap-2 p-3 rounded-xl border-2 border-gray-200/60 bg-white/80 backdrop-blur-sm">
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={navigateToRoot}
                    disabled={!currentPath}
                    className="h-8 w-8 rounded-lg bg-gray-100 hover:bg-gray-200"
                  >
                    <Home className="h-4 w-4" />
                  </Button>
                  {pathHistory.length > 0 && (
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={navigateBack}
                      className="h-8 w-8 rounded-lg bg-gray-100 hover:bg-gray-200"
                    >
                      <ChevronRight className="h-4 w-4 rotate-180" />
                    </Button>
                  )}
                  <span className="text-sm font-medium text-gray-700 truncate flex-1">
                    {currentPath ? `/${currentPath}` : "root"}
                  </span>
                </div>

                {/* Folders */}
                {getCurrentFolderContents().folders.length > 0 && (
                  <div className="space-y-1">
                    {getCurrentFolderContents().folders.map((folder: any) => (
                      <button
                        key={folder.path}
                        onClick={() => navigateToFolder(folder.path)}
                        className="w-full flex items-center gap-3 p-3 hover:bg-blue-50 rounded-xl border-2 border-transparent hover:border-blue-200 transition-all duration-200 group"
                      >
                        <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                          <Folder className="h-4 w-4 text-blue-600" />
                        </div>
                        <span className="text-sm font-medium text-gray-900 truncate flex-1 text-left">
                          {folder.name}
                        </span>
                        <ChevronRight className="h-4 w-4 text-gray-400 group-hover:text-blue-600 transition-colors" />
                      </button>
                    ))}
                  </div>
                )}

                {/* Files */}
                {getCurrentFolderContents().files.length > 0 && (
                  <div className="space-y-1">
                    {getCurrentFolderContents().files.map((file: any) => (
                      <div
                        key={file.path}
                        className="flex items-center justify-between p-3 hover:bg-gray-50 rounded-xl border-2 border-transparent hover:border-gray-200 transition-all duration-200 group"
                      >
                        <div className="flex items-center gap-3 min-w-0 flex-1">
                          <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center">
                            <FileText className="h-4 w-4 text-gray-400" />
                          </div>
                          <span className="text-sm text-gray-900 truncate">
                            {file.name}
                          </span>
                        </div>
                        <a
                          href={`${connectedRepo.fullUrl}/blob/${selectedBranch}/${file.path}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="shrink-0"
                        >
                          <Button
                            size="sm"
                            variant="ghost"
                            className="rounded-lg bg-gray-100 hover:bg-gray-200"
                          >
                            <ExternalLink className="h-4 w-4" />
                          </Button>
                        </a>
                      </div>
                    ))}
                  </div>
                )}

                {getCurrentFolderContents().folders.length === 0 &&
                  getCurrentFolderContents().files.length === 0 && (
                    <div className="text-center py-12">
                      <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                        <FolderOpen className="h-8 w-8 text-gray-400" />
                      </div>
                      <p className="text-gray-500 font-medium">Empty folder</p>
                    </div>
                  )}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
