"use client";

import { useState, useRef, useEffect, useCallback, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Send,
  Reply,
  CheckCircle,
  MoreVertical,
  Edit,
  Trash2,
  MessageCircleMore,
  X,
  Search,
  Filter,
  Users,
  Clock,
  Eye,
  RotateCcw,
  ChevronUp,
  ChevronDown,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useIsMobile } from "@/hooks/useIsMobile";

interface CommentThreadProps {
  comments: any[];
  onClose: () => void;
  onAddComment: (content: string, type?: string) => void;
  onReplyComment: (commentId: string, content: string) => void;
  onResolveComment: (commentId: string) => void;
  onDeleteComment: (commentId: string) => void;
  onDeleteReply?: (commentId: string, replyId: string) => void;
  onUpdateComment?: (commentId: string, content: string) => void;
  fileId: string;
  permissions: "ADMIN" | "VIEW" | "EDIT";
  currentUser?: any;
}

const CommentTypeSelector = ({
  selectedType,
  onTypeChange,
  isMobile,
}: {
  selectedType: string;
  onTypeChange: (type: "QUESTION" | "SUGGESTION" | "ISSUE" | "PRAISE") => void;
  isMobile: boolean;
}) => {
  const types = [
    {
      value: "QUESTION" as const,
      label: "❓",
      color: "purple",
      title: "Question",
      darkColor: "indigo",
    },
    {
      value: "SUGGESTION" as const,
      label: "💡",
      color: "blue",
      title: "Suggestion",
      darkColor: "blue",
    },
    {
      value: "ISSUE" as const,
      label: "🐛",
      color: "red",
      title: "Issue",
      darkColor: "red",
    },
    {
      value: "PRAISE" as const,
      label: "🎉",
      color: "green",
      title: "Praise",
      darkColor: "green",
    },
  ];

  return (
    <div
      className={`flex gap-3 ${
        isMobile ? "mb-3" : "mb-2"
      } flex-wrap justify-center bg-transparent`}
    >
      {types.map((type) => (
        <button
          key={type.value}
          type="button"
          onClick={() => onTypeChange(type.value)}
          title={type.title}
          className={`
            flex flex-col items-center justify-center w-19.5 h-15
            p-3 rounded-xl border-2 transition-all duration-200 min-w-[60px]
            ${
              selectedType === type.value
                ? `
                  bg-${type.color}-100 dark:bg-${type.darkColor}-900/30
                  text-${type.color}-700 dark:text-${type.darkColor}-300
                  border-${type.color}-300 dark:border-${type.darkColor}-600
                  shadow-sm scale-105
                `
                : `
                  bg-white dark:bg-[#252528]
                  text-gray-500 dark:text-[#a0a0a0]
                  border-gray-200 dark:border-[#2a2a2d]
                  hover:bg-gray-50 dark:hover:bg-[#2a2a2d]
                  hover:scale-105 hover:border-gray-300 dark:hover:border-[#3a3a3d]
                `
            }
          `}
        >
          <span className={`${isMobile ? "text-2xl" : "text-xl"} mb-1`}>
            {type.label}
          </span>
          <span
            className={`text-xs font-medium ${
              selectedType === type.value
                ? `text-${type.color}-700 dark:text-${type.darkColor}-300`
                : "text-gray-500 dark:text-[#a0a0a0]"
            }`}
          >
            {type.title}
          </span>
        </button>
      ))}
    </div>
  );
};
export function CommentThread({
  comments,
  onClose,
  onAddComment,
  onReplyComment,
  onResolveComment,
  onDeleteComment,
  onDeleteReply,
  onUpdateComment,
  fileId,
  permissions,
  currentUser,
}: CommentThreadProps) {
  const [newComment, setNewComment] = useState("");
  const [commentType, setCommentType] = useState<
    "QUESTION" | "SUGGESTION" | "ISSUE" | "PRAISE"
  >("QUESTION");
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [replyContent, setReplyContent] = useState("");
  const [editingComment, setEditingComment] = useState<string | null>(null);
  const [editContent, setEditContent] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [filterByAuthor, setFilterByAuthor] = useState("");
  const [filterByStatus, setFilterByStatus] = useState<
    "all" | "OPEN" | "RESOLVED"
  >("all");
  const [filterByType, setFilterByType] = useState<
    "all" | "QUESTION" | "SUGGESTION" | "ISSUE" | "PRAISE"
  >("all");
  const [expandedComments, setExpandedComments] = useState<Set<string>>(
    new Set()
  );
  const [filterOpen, setFilterOpen] = useState(false);
  const [isHeaderCollapsed, setIsHeaderCollapsed] = useState(false);

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const replyTextareaRef = useRef<HTMLTextAreaElement>(null);
  const editTextareaRef = useRef<HTMLTextAreaElement>(null);
  const isMobile = useIsMobile();

  const stats = useMemo(() => {
    const openComments = comments.filter((c) => c.status === "OPEN");
    const resolvedComments = comments.filter((c) => c.status === "RESOLVED");
    const totalReplies = comments.reduce(
      (sum, comment) => sum + (comment.replies?.length || 0),
      0
    );

    const typeCounts = {
      QUESTION: comments.filter((c) => c.type === "QUESTION").length,
      SUGGESTION: comments.filter((c) => c.type === "SUGGESTION").length,
      ISSUE: comments.filter((c) => c.type === "ISSUE").length,
      PRAISE: comments.filter((c) => c.type === "PRAISE").length,
    };

    return {
      total: comments.length,
      open: openComments.length,
      resolved: resolvedComments.length,
      totalReplies,
      typeCounts,
      uniqueAuthors: new Set(comments.map((c) => c.author.id)).size,
    };
  }, [comments]);

  const filteredComments = useMemo(() => {
    return comments.filter((comment) => {
      const matchesSearch =
        comment.content?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        comment.author.name?.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesAuthor =
        !filterByAuthor || comment.author.id === filterByAuthor;
      const matchesStatus =
        filterByStatus === "all" || comment.status === filterByStatus;
      const matchesType =
        filterByType === "all" || comment.type === filterByType;

      return matchesSearch && matchesAuthor && matchesStatus && matchesType;
    });
  }, [comments, searchTerm, filterByAuthor, filterByStatus, filterByType]);

  const uniqueAuthors = useMemo(() => {
    const authors = comments.reduce((acc: any[], comment) => {
      if (!acc.find((a: any) => a.id === comment.author.id)) {
        acc.push(comment.author);
      }
      return acc;
    }, []);
    return authors;
  }, [comments]);

  const isCommentEdited = (comment: any) => {
    if (!comment.updatedAt || !comment.createdAt) return false;
    const createdAt = new Date(comment.createdAt).getTime();
    const updatedAt = new Date(comment.updatedAt).getTime();
    return updatedAt - createdAt > 5000 || comment.edited === true;
  };

  const isReplyEdited = (reply: any) => {
    if (!reply.updatedAt || !reply.createdAt) return false;
    const createdAt = new Date(reply.createdAt).getTime();
    const updatedAt = new Date(reply.updatedAt).getTime();
    return updatedAt - createdAt > 5000 || reply.edited === true;
  };

  const handleTypeChange = useCallback(
    (type: "QUESTION" | "SUGGESTION" | "ISSUE" | "PRAISE") => {
      setCommentType(type);
    },
    []
  );

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height =
        textareaRef.current.scrollHeight + "px";
    }
    if (replyTextareaRef.current) {
      replyTextareaRef.current.style.height = "auto";
      replyTextareaRef.current.style.height =
        replyTextareaRef.current.scrollHeight + "px";
    }
    if (editTextareaRef.current) {
      editTextareaRef.current.style.height = "auto";
      editTextareaRef.current.style.height =
        editTextareaRef.current.scrollHeight + "px";
    }
  }, [newComment, replyContent, editContent]);

  useEffect(() => {
    if (replyingTo && replyTextareaRef.current) {
      replyTextareaRef.current.focus();
    }
  }, [replyingTo]);

  useEffect(() => {
    if (editingComment && editTextareaRef.current) {
      editTextareaRef.current.focus();
    }
  }, [editingComment]);

  const canAddComment = permissions === "EDIT" || permissions === "ADMIN";
  const canReply = permissions === "EDIT" || permissions === "ADMIN";
  const canResolve = permissions === "EDIT" || permissions === "ADMIN";

  const canEditComment = (comment: any) => {
    const isAuthor = currentUser && comment.author.id === currentUser.id;
    return (permissions === "EDIT" && isAuthor) || permissions === "ADMIN";
  };

  const canDeleteComment = (comment: any) => {
    const isAuthor = currentUser && comment.author.id === currentUser.id;
    return (permissions === "EDIT" && isAuthor) || permissions === "ADMIN";
  };

  const canDeleteReply = (reply: any) => {
    const isAuthor = currentUser && reply.author.id === currentUser.id;
    return (permissions === "EDIT" && isAuthor) || permissions === "ADMIN";
  };

  const handleSubmitComment = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!newComment.trim()) return;

    onAddComment(newComment, commentType);
    setNewComment("");
    setCommentType("QUESTION");
  };

  const handleSubmitReply = (commentId: string) => {
    if (!replyContent.trim()) return;

    onReplyComment(commentId, replyContent);
    setReplyContent("");
    setReplyingTo(null);
  };

  const handleSaveEdit = () => {
    if (editingComment && onUpdateComment) {
      onUpdateComment(editingComment, editContent);
      cancelEditing();
    }
  };

  const startEditing = (comment: any) => {
    setEditingComment(comment.id);
    setEditContent(comment.content);
  };

  const cancelEditing = () => {
    setEditingComment(null);
    setEditContent("");
  };

  const toggleCommentExpanded = (commentId: string) => {
    const newExpanded = new Set(expandedComments);
    if (newExpanded.has(commentId)) {
      newExpanded.delete(commentId);
    } else {
      newExpanded.add(commentId);
    }
    setExpandedComments(newExpanded);
  };

  const handleKeyDown = (
    e: React.KeyboardEvent,
    action: () => void,
    shiftAction?: () => void
  ) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      action();
    } else if (e.key === "Enter" && e.shiftKey && shiftAction) {
      e.preventDefault();
      shiftAction();
    }
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  const handleNewCommentKeyDown = (e: React.KeyboardEvent) => {
    handleKeyDown(
      e,
      () => handleSubmitComment(),
      () => setNewComment((prev) => prev + "\n")
    );
  };

  const handleReplyKeyDown = (e: React.KeyboardEvent, commentId: string) => {
    handleKeyDown(
      e,
      () => handleSubmitReply(commentId),
      () => setReplyContent((prev) => prev + "\n")
    );
  };

  const handleEditKeyDown = (e: React.KeyboardEvent) => {
    handleKeyDown(
      e,
      () => handleSaveEdit(),
      () => setEditContent((prev) => prev + "\n")
    );
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "OPEN":
        return "bg-blue-100 text-blue-700 border-blue-200";
      case "RESOLVED":
        return "bg-green-100 text-green-700 border-green-200";
      case "CLOSED":
        return "bg-gray-100 text-gray-700 border-gray-200";
      default:
        return "bg-gray-100 text-gray-700 border-gray-200";
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case "QUESTION":
        return "bg-purple-100 text-purple-700";
      case "SUGGESTION":
        return "bg-blue-100 text-blue-700";
      case "ISSUE":
        return "bg-red-100 text-red-700";
      case "PRAISE":
        return "bg-green-100 text-green-700";
      default:
        return "bg-gray-100 text-gray-700";
    }
  };

  const getTypeColorDark = (type: string): string => {
    switch (type) {
      case "QUESTION":
        return "bg-blue-900/20 text-blue-400 border-blue-800";
      case "SUGGESTION":
        return "bg-green-900/20 text-green-400 border-green-800";
      case "ISSUE":
        return "bg-red-900/20 text-red-400 border-red-800";
      case "PRAISE":
        return "bg-yellow-900/20 text-yellow-400 border-yellow-800";
      default:
        return "bg-gray-900/20 text-gray-400 border-gray-800";
    }
  };

  const getStatusColorDark = (status: string): string => {
    switch (status) {
      case "OPEN":
        return "bg-green-900/20 text-green-400 border-green-800";
      case "RESOLVED":
        return "bg-blue-900/20 text-blue-400 border-blue-800";
      case "CLOSED":
        return "bg-gray-900/20 text-gray-400 border-gray-800";
      default:
        return "bg-gray-900/20 text-gray-400 border-gray-800";
    }
  };

  const formatTimeAgo = (date: Date) => {
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (diffInSeconds < 60) return "just now";
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
    if (diffInSeconds < 86400)
      return `${Math.floor(diffInSeconds / 3600)}h ago`;
    return `${Math.floor(diffInSeconds / 86400)}d ago`;
  };

  return (
    <div
      className={`bg-white dark:bg-[#1a1a1c] flex flex-col shadow-2xl rounded-xl border border-gray-200 dark:border-[#2a2a2d] ${
        isMobile ? "fixed inset-0 z-50 w-full h-full" : "w-96 h-[92vh]"
      }`}
    >
      <div
        className={`
          border-b from-blue-50 via-indigo-50 to-purple-50
          dark:from-[#252528] dark:via-[#2a2a2d] dark:to-[#303034] shrink-0
          transition-all duration-300 ease-in-out
          ${isHeaderCollapsed ? "max-h-16" : "max-h-80"}
        `}
      >
        <div className="p-2 relative">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="bg-white dark:bg-[#252528] rounded-lg shadow-sm p-2">
                <MessageCircleMore className="text-indigo-600 dark:text-indigo-400 h-5 w-5" />
              </div>
              <div>
                <h3 className="font-bold text-gray-900 dark:text-[#f0f0f0] text-lg">
                  Comments
                </h3>
                <p className="text-gray-600 dark:text-[#a0a0a0] text-sm">
                  {stats.total} comments • {stats.totalReplies} replies
                </p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="hover:bg-white/80 dark:hover:bg-[#252528] rounded-lg h-9 w-9 p-0"
            >
              <X className="h-5 w-5" />
            </Button>
          </div>

          <div
            className={`
            transition-all duration-300 ease-in-out
            ${
              isHeaderCollapsed
                ? "opacity-0 max-h-0 overflow-hidden"
                : "opacity-100 max-h-64 overflow-visible"
            }
          `}
          >
            <div className="flex bg-white dark:bg-[#252528] rounded-lg p-1 border border-gray-200 dark:border-[#2a2a2d] mb-4">
              {[
                { key: "all" as const, label: "All", count: stats.total },
                { key: "OPEN" as const, label: "Open", count: stats.open },
                {
                  key: "RESOLVED" as const,
                  label: "Resolved",
                  count: stats.resolved,
                },
              ].map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => setFilterByStatus(tab.key)}
                  className={`flex-1 py-2 px-2 rounded-md text-sm font-medium transition-colors flex items-center justify-center gap-1 ${
                    filterByStatus === tab.key
                      ? "bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 shadow-sm"
                      : "text-gray-600 dark:text-[#a0a0a0] hover:text-gray-900 dark:hover:text-[#f0f0f0] hover:bg-gray-50 dark:hover:bg-[#252528]"
                  }`}
                >
                  <span>{tab.label}</span>
                  {tab.count > 0 && (
                    <span
                      className={`px-1 py-0.5 text-xs rounded-full min-w-5 ${
                        filterByStatus === tab.key
                          ? "bg-indigo-200 dark:bg-indigo-800 text-indigo-800 dark:text-indigo-200"
                          : "bg-gray-200 dark:bg-[#2a2a2d] text-gray-700 dark:text-[#a0a0a0]"
                      }`}
                    >
                      {tab.count}
                    </span>
                  )}
                </button>
              ))}
            </div>

            <div className="grid grid-cols-3 gap-2 mb-4">
              <div className="bg-white dark:bg-[#252528] rounded-lg p-2.5 shadow-sm border border-gray-200/50 dark:border-[#2a2a2d]">
                <div className="flex items-center gap-1.5 mb-1">
                  <Users className="text-blue-600 dark:text-blue-400 h-3.5 w-3.5" />
                  <span className="font-medium text-gray-600 dark:text-[#a0a0a0] text-xs">
                    Authors
                  </span>
                </div>
                <div className="font-bold text-gray-900 dark:text-[#f0f0f0] text-xl">
                  {stats.uniqueAuthors}
                </div>
              </div>
              <div className="bg-white dark:bg-[#252528] rounded-lg p-2.5 shadow-sm border border-gray-200/50 dark:border-[#2a2a2d]">
                <div className="flex items-center gap-1.5 mb-1">
                  <Clock className="text-purple-600 dark:text-purple-400 h-3.5 w-3.5" />
                  <span className="font-medium text-gray-600 dark:text-[#a0a0a0] text-xs">
                    Open
                  </span>
                </div>
                <div className="font-bold text-gray-900 dark:text-[#f0f0f0] text-xl">
                  {stats.open}
                </div>
              </div>
              <div className="bg-white dark:bg-[#252528] rounded-lg p-2.5 shadow-sm border border-gray-200/50 dark:border-[#2a2a2d]">
                <div className="flex items-center gap-1.5 mb-1">
                  <CheckCircle className="text-green-600 dark:text-green-400 h-3.5 w-3.5" />
                  <span className="font-medium text-gray-600 dark:text-[#a0a0a0] text-xs">
                    Resolved
                  </span>
                </div>
                <div className="font-bold text-gray-900 dark:text-[#f0f0f0] text-xl">
                  {stats.resolved}
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-[#707070] h-4 w-4" />
                <Input
                  placeholder="Search comments..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="bg-white dark:bg-[#252528] border-gray-300 dark:border-[#2a2a2d] focus:border-indigo-500 dark:focus:border-indigo-400 focus:ring-indigo-500 dark:focus:ring-indigo-400 pl-9 text-gray-900 dark:text-[#f0f0f0]"
                />
              </div>
              <div className="flex gap-2">
                <div className="flex-1 relative">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setFilterOpen(!filterOpen)}
                    className="w-full bg-white dark:bg-[#252528] hover:bg-gray-50 dark:hover:bg-[#2a2a2d] border-gray-300 dark:border-[#2a2a2d]"
                  >
                    <Filter className="h-4 w-4 mr-2" />
                    {filterByAuthor || filterByType !== "all"
                      ? "Filtered"
                      : "Filter"}
                  </Button>

                  {filterOpen && (
                    <div className="absolute top-full mt-1 left-0 right-0 bg-white dark:bg-[#1a1a1c] border border-gray-200 dark:border-[#2a2a2d] rounded-lg shadow-lg z-10 p-4 space-y-4">
                      <div className="space-y-2">
                        <div className="text-xs font-medium text-gray-500 dark:text-[#a0a0a0] uppercase tracking-wide">
                          Author
                        </div>
                        <button
                          onClick={() => setFilterByAuthor("")}
                          className={`
                            w-full px-3 py-2 text-left hover:bg-gray-50 dark:hover:bg-[#252528]
                            text-sm rounded-md transition-colors
                            ${
                              !filterByAuthor
                                ? "bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800"
                                : "text-gray-700 dark:text-[#f0f0f0] border-transparent"
                            }
                          `}
                        >
                          All Authors
                        </button>
                        {uniqueAuthors.map((author) => (
                          <button
                            key={author.id}
                            onClick={() => {
                              setFilterByAuthor(author.id);
                              setFilterOpen(false);
                            }}
                            className={`
                              w-full px-3 py-2 text-left hover:bg-gray-50 dark:hover:bg-[#252528]
                              flex items-center gap-2 text-sm rounded-md transition-colors
                              ${
                                filterByAuthor === author.id
                                  ? "bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800"
                                  : "text-gray-700 dark:text-[#f0f0f0] border-transparent"
                              }
                            `}
                          >
                            <Avatar className="h-4 w-4">
                              <AvatarImage src={author.image} />
                              <AvatarFallback className="text-xs bg-gray-100 dark:bg-[#2a2a2d] text-gray-600 dark:text-[#a0a0a0]">
                                {author.name?.charAt(0)}
                              </AvatarFallback>
                            </Avatar>
                            {author.name}
                          </button>
                        ))}
                      </div>

                      <div className="space-y-3">
                        <div className="text-xs font-medium text-gray-500 dark:text-[#a0a0a0] uppercase tracking-wide">
                          Type
                        </div>

                        <div className="grid grid-cols-3 gap-2">
                          {[
                            {
                              key: "all",
                              label: "All",
                              emoji: "📝",
                              color: "gray",
                              activeClasses:
                                "bg-gray-100 dark:bg-gray-800/30 text-gray-700 dark:text-gray-400 border-gray-300 dark:border-gray-800/50",
                              textClasses: "text-gray-700 dark:text-gray-400",
                            },
                            {
                              key: "QUESTION",
                              label: "Questions",
                              emoji: "❓",
                              color: "purple",
                              activeClasses:
                                "bg-purple-100 dark:bg-purple-800/30 text-purple-700 dark:text-purple-400 border-purple-300 dark:border-purple-800/50",
                              textClasses:
                                "text-purple-700 dark:text-purple-400",
                            },
                            {
                              key: "SUGGESTION",
                              label: "Suggestions",
                              emoji: "💡",
                              color: "blue",
                              activeClasses:
                                "bg-blue-100 dark:bg-blue-800/30 text-blue-700 dark:text-blue-400 border-blue-300 dark:border-blue-800/50",
                              textClasses: "text-blue-700 dark:text-blue-400",
                            },
                          ].map((type) => (
                            <button
                              key={type.key}
                              onClick={() => {
                                setFilterByType(
                                  type.key as "all" | "QUESTION" | "SUGGESTION"
                                );
                                setFilterOpen(false);
                              }}
                              className={`
                                flex flex-col items-center justify-center p-2
                                rounded-xl border-2 transition-all duration-200 min-h-[60px] w-full
                                ${
                                  filterByType === type.key
                                    ? `${type.activeClasses} shadow-sm scale-105`
                                    : "bg-white dark:bg-[#252528] text-gray-500 dark:text-[#a0a0a0] border-gray-200 dark:border-[#2a2a2d] hover:bg-gray-50 dark:hover:bg-[#2a2a2d] hover:scale-105 hover:border-gray-300 dark:hover:border-[#3a3a3d]"
                                }
                              `}
                            >
                              <span className="text-lg mb-1">{type.emoji}</span>
                              <span
                                className={`
                                  text-xs font-medium text-center
                                  ${
                                    filterByType === type.key
                                      ? type.textClasses
                                      : "text-gray-500 dark:text-[#a0a0a0]"
                                  }
                                `}
                              >
                                {type.label}
                              </span>
                            </button>
                          ))}
                        </div>

                        <div className="flex justify-center gap-2">
                          {[
                            {
                              key: "ISSUE",
                              label: "Issues",
                              emoji: "🐛",
                              color: "red",
                              activeClasses:
                                "bg-red-100 dark:bg-red-800/30 text-red-700 dark:text-red-400 border-red-300 dark:border-red-800/50",
                              textClasses: "text-red-700 dark:text-red-400",
                            },
                            {
                              key: "PRAISE",
                              label: "Praise",
                              emoji: "🎉",
                              color: "green",
                              activeClasses:
                                "bg-green-100 dark:bg-green-800/30 text-green-700 dark:text-green-400 border-green-300 dark:border-green-800/50",
                              textClasses: "text-green-700 dark:text-green-400",
                            },
                          ].map((type) => (
                            <button
                              key={type.key}
                              onClick={() => {
                                setFilterByType(type.key as "ISSUE" | "PRAISE");
                                setFilterOpen(false);
                              }}
                              className={`
                                flex flex-col items-center justify-center p-2
                                rounded-xl border-2 transition-all duration-200 min-h-[60px] w-[calc(33.333%-0.5rem)]
                                ${
                                  filterByType === type.key
                                    ? `${type.activeClasses} shadow-sm scale-105`
                                    : "bg-white dark:bg-[#252528] text-gray-500 dark:text-[#a0a0a0] border-gray-200 dark:border-[#2a2a2d] hover:bg-gray-50 dark:hover:bg-[#2a2a2d] hover:scale-105 hover:border-gray-300 dark:hover:border-[#3a3a3d]"
                                }
                              `}
                            >
                              <span className="text-lg mb-1">{type.emoji}</span>
                              <span
                                className={`
                                  text-xs font-medium text-center
                                  ${
                                    filterByType === type.key
                                      ? type.textClasses
                                      : "text-gray-500 dark:text-[#a0a0a0]"
                                  }
                                `}
                              >
                                {type.label}
                              </span>
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {(filterByAuthor ||
                  filterByType !== "all" ||
                  filterByStatus !== "all" ||
                  searchTerm) && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setFilterByAuthor("");
                      setFilterByType("all");
                      setFilterByStatus("all");
                      setSearchTerm("");
                    }}
                    className="bg-white dark:bg-[#252528] hover:bg-gray-50 dark:hover:bg-[#2a2a2d] border-gray-300 dark:border-[#2a2a2d]"
                  >
                    <RotateCcw className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="flex justify-center ml-0.5">
        <Button
          variant="outline"
          onClick={() => setIsHeaderCollapsed(!isHeaderCollapsed)}
          className={`
              flex items-center justify-center rounded-full
              border border-transparent
              active:scale-95
              transition-all duration-300 ease-in-out
              group
            `}
          title={isHeaderCollapsed ? "Expand header" : "Collapse header"}
        >
          <ChevronUp
            className={`
                h-8 w-8 text-gray-600 dark:text-[#a0a0a0] transition-transform duration-500 ease-in-out
                ${isHeaderCollapsed ? "rotate-180" : "rotate-0"}
                group-hover:scale-135
              `}
          />
        </Button>
      </div>

      <div
        className={`
            flex-1 overflow-y-auto bg-gray-50 dark:bg-[#1a1a1c] transition-[max-height] duration-700 ease-in-out
            ${
              isHeaderCollapsed
                ? "max-h-[calc(100%-4rem)]"
                : "max-h-[calc(100%-20rem)]"
            }
          `}
      >
        {filteredComments.length === 0 ? (
          <div className="text-center text-gray-500 dark:text-[#a0a0a0] py-12">
            <MessageCircleMore className="mx-auto mb-4 text-gray-300 dark:text-[#2a2a2d] w-16 h-16" />
            <h3 className="font-semibold mb-2 text-gray-800 dark:text-[#f0f0f0] text-lg">
              {comments.length === 0
                ? "No comments yet"
                : "No matching comments"}
            </h3>
            <p className="text-gray-600 dark:text-[#a0a0a0] mb-4 max-w-sm mx-auto text-sm">
              {comments.length === 0
                ? "Start a conversation by adding the first comment"
                : "Try adjusting your filters to see more results"}
            </p>
          </div>
        ) : (
          <div className="space-y-4 p-4">
            {filteredComments.map((comment) => {
              const isCommentAuthor =
                currentUser && comment.author.id === currentUser.id;
              const isEdited = isCommentEdited(comment);
              const isExpanded = expandedComments.has(comment.id);

              return (
                <div
                  key={comment.id}
                  className="border bg-white dark:bg-[#1a1a1c] hover:shadow-md transition-all duration-200 rounded-xl border-gray-200 dark:border-[#2a2a2d] hover:border-indigo-300 dark:hover:border-indigo-500/60 p-4"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-2 flex-wrap">
                        <Avatar className="h-6 w-6">
                          <AvatarImage src={comment.author.image} />
                          <AvatarFallback className="bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-400 text-xs">
                            {comment.author.name?.charAt(0)?.toUpperCase() ||
                              "U"}
                          </AvatarFallback>
                        </Avatar>
                        <span className="font-semibold text-gray-900 dark:text-[#f0f0f0] text-sm">
                          {comment.author.name}
                          {isCommentAuthor && (
                            <span className="text-blue-600 dark:text-blue-400 ml-1 text-xs">
                              (you)
                            </span>
                          )}
                        </span>

                        <Badge
                          variant="outline"
                          className={`${getTypeColor(
                            comment.type
                          )} dark:${getTypeColorDark(
                            comment.type
                          )} border-0 text-xs`}
                        >
                          {comment.type === "QUESTION" && "❓"}
                          {comment.type === "SUGGESTION" && "💡"}
                          {comment.type === "ISSUE" && "🐛"}
                          {comment.type === "PRAISE" && "🎉"}
                          {comment.type.toLowerCase()}
                        </Badge>

                        <Badge
                          variant="outline"
                          className={`${getStatusColor(
                            comment.status
                          )} dark:${getStatusColorDark(
                            comment.status
                          )} text-xs`}
                        >
                          {comment.status.toLowerCase()}
                        </Badge>
                      </div>

                      <div className="flex items-center gap-3 text-gray-500 dark:text-[#a0a0a0] mb-2 flex-wrap text-xs">
                        <span>
                          {formatTimeAgo(new Date(comment.createdAt))}
                        </span>
                        {comment.replies && comment.replies.length > 0 && (
                          <>
                            <span className="dark:text-[#707070]">•</span>
                            <span>
                              {comment.replies.length}{" "}
                              {comment.replies.length === 1
                                ? "reply"
                                : "replies"}
                            </span>
                          </>
                        )}
                      </div>
                    </div>

                    {(canEditComment(comment) ||
                      canResolve ||
                      canDeleteComment(comment)) && (
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="p-0 opacity-60 hover:opacity-100 h-6 w-6 text-gray-600 dark:text-[#a0a0a0] hover:bg-gray-100 dark:hover:bg-[#252528]"
                          >
                            <MoreVertical className="h-3.5 w-3.5" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent
                          align="end"
                          className="w-40 text-sm bg-white dark:bg-[#1a1a1c] border-gray-200 dark:border-[#2a2a2d]"
                        >
                          {canEditComment(comment) && (
                            <DropdownMenuItem
                              onClick={() => startEditing(comment)}
                              className="text-gray-700 dark:text-[#f0f0f0] hover:bg-gray-100 dark:hover:bg-[#252528] focus:bg-gray-100 dark:focus:bg-[#252528]"
                            >
                              <Edit className="h-3 w-3 mr-2" />
                              Edit
                            </DropdownMenuItem>
                          )}
                          {canResolve && (
                            <DropdownMenuItem
                              onClick={() => onResolveComment(comment.id)}
                              className="text-gray-700 dark:text-[#f0f0f0] hover:bg-gray-100 dark:hover:bg-[#252528] focus:bg-gray-100 dark:focus:bg-[#252528]"
                            >
                              <CheckCircle className="h-3 w-3 mr-2" />
                              {comment.status === "OPEN" ? "Resolve" : "Reopen"}
                            </DropdownMenuItem>
                          )}
                          {canDeleteComment(comment) && (
                            <DropdownMenuItem
                              onClick={() => onDeleteComment(comment.id)}
                              className="text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 hover:bg-red-50 dark:hover:bg-red-900/20"
                            >
                              <Trash2 className="h-3 w-3 mr-2" />
                              Delete
                            </DropdownMenuItem>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    )}
                  </div>

                  {comment.selection && (
                    <div className="mb-3 p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800/50 rounded-lg text-sm">
                      <p className="text-yellow-800 dark:text-yellow-300 font-medium text-xs mb-1 uppercase tracking-wide">
                        Selected Text
                      </p>
                      <p className="text-yellow-700 dark:text-yellow-400 font-medium line-clamp-2">
                        "{comment.selection.text}"
                      </p>
                    </div>
                  )}

                  {editingComment === comment.id ? (
                    <div className="mb-3">
                      <textarea
                        ref={editTextareaRef}
                        value={editContent}
                        onChange={(e) => setEditContent(e.target.value)}
                        onKeyDown={handleEditKeyDown}
                        className="w-full p-3 border border-gray-300 dark:border-[#2a2a2d] rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm bg-white dark:bg-[#1f1f21] text-gray-900 dark:text-[#f0f0f0] placeholder-gray-500 dark:placeholder-[#707070]"
                        rows={3}
                        placeholder="Edit your comment..."
                      />
                      <div className="flex gap-2 mt-2">
                        <Button
                          size="sm"
                          onClick={handleSaveEdit}
                          className="h-7 text-xs bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600"
                        >
                          <Send className="h-3 w-3 mr-1" />
                          Save
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={cancelEditing}
                          className="h-7 text-xs border-gray-300 dark:border-[#2a2a2d] text-gray-700 dark:text-[#a0a0a0] hover:bg-gray-100 dark:hover:bg-[#252528]"
                        >
                          Cancel
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="mb-3">
                      <p className="text-gray-800 dark:text-[#e0e0e0] leading-relaxed whitespace-pre-wrap text-sm">
                        {comment.content}
                      </p>
                      {isEdited && (
                        <div className="mt-1 flex items-center gap-1 text-xs text-gray-500 dark:text-[#707070] italic">
                          ✏️ Edited {formatTimeAgo(new Date(comment.updatedAt))}
                        </div>
                      )}
                    </div>
                  )}

                  <div className="flex items-center justify-between pt-3 border-t border-gray-100 dark:border-[#2a2a2d]">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => toggleCommentExpanded(comment.id)}
                      className="text-gray-600 dark:text-[#a0a0a0] hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 h-7 text-xs px-3"
                    >
                      {isExpanded ? (
                        <ChevronUp className="h-3.5 w-3.5 mr-1" />
                      ) : (
                        <ChevronDown className="h-3.5 w-3.5 mr-1" />
                      )}
                      {isExpanded ? "Hide" : "Show"} Details
                    </Button>

                    <div className="flex items-center gap-2">
                      {canReply && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() =>
                            setReplyingTo(
                              replyingTo === comment.id ? null : comment.id
                            )
                          }
                          className="h-7 text-xs px-3 border-gray-300 dark:border-[#2a2a2d] text-gray-700 dark:text-[#a0a0a0] hover:bg-gray-100 dark:hover:bg-[#252528]"
                        >
                          <Reply className="h-3.5 w-3.5 mr-1" />
                          Reply
                        </Button>
                      )}
                      {canResolve && comment.status === "OPEN" && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => onResolveComment(comment.id)}
                          className="h-7 text-xs px-3 text-green-600 dark:text-green-400 hover:text-green-700 dark:hover:text-green-300 hover:bg-green-50 dark:hover:bg-green-900/20 border-green-200 dark:border-green-800"
                        >
                          <CheckCircle className="h-3.5 w-3.5 mr-1" />
                          Resolve
                        </Button>
                      )}
                    </div>
                  </div>

                  {isExpanded && (
                    <div className="mt-3 p-3 bg-linear-to-br from-blue-50/50 to-indigo-50/50 dark:from-blue-900/10 dark:to-indigo-900/10 rounded-lg border border-blue-200/60 dark:border-blue-800/30">
                      <div className="grid grid-cols-2 gap-3 mb-3">
                        <div className="bg-white/90 dark:bg-[#252528]/90 rounded-lg p-3 border border-gray-200/50 dark:border-[#2a2a2d]/50">
                          <div className="text-xs font-medium text-gray-600 dark:text-[#a0a0a0] mb-1">
                            Created
                          </div>
                          <div className="font-bold text-gray-900 dark:text-[#f0f0f0] text-sm">
                            {new Date(comment.createdAt).toLocaleDateString()}
                          </div>
                          <div className="text-xs text-gray-500 dark:text-[#707070] mt-1">
                            {new Date(comment.createdAt).toLocaleTimeString()}
                          </div>
                        </div>
                        <div className="bg-white/90 dark:bg-[#252528]/90 rounded-lg p-3 border border-gray-200/50 dark:border-[#2a2a2d]/50">
                          <div className="text-xs font-medium text-gray-600 dark:text-[#a0a0a0] mb-1">
                            Replies
                          </div>
                          <div className="font-bold text-gray-900 dark:text-[#f0f0f0] text-xl">
                            {comment.replies?.length || 0}
                          </div>
                          <div className="text-xs text-gray-500 dark:text-[#707070] mt-1">
                            {comment.replies?.length === 1
                              ? "reply"
                              : "replies"}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {replyingTo === comment.id && (
                    <div className="mt-3 p-3 bg-gray-50 dark:bg-[#252528] rounded-lg border border-gray-200 dark:border-[#2a2a2d]">
                      <textarea
                        ref={replyTextareaRef}
                        value={replyContent}
                        onChange={(e) => setReplyContent(e.target.value)}
                        onKeyDown={(e) => handleReplyKeyDown(e, comment.id)}
                        className="w-full p-2 border border-gray-300 dark:border-[#2a2a2d] rounded resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm bg-white dark:bg-[#1f1f21] text-gray-900 dark:text-[#f0f0f0] placeholder-gray-500 dark:placeholder-[#707070]"
                        rows={2}
                        placeholder="Write your reply..."
                      />
                      <div className="flex gap-2 mt-2">
                        <Button
                          size="sm"
                          onClick={() => handleSubmitReply(comment.id)}
                          disabled={!replyContent.trim()}
                          className="h-7 text-xs bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600"
                        >
                          <Send className="h-3 w-3 mr-1" />
                          Post Reply
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setReplyingTo(null);
                            setReplyContent("");
                          }}
                          className="h-7 text-xs border-gray-300 dark:border-[#2a2a2d] text-gray-700 dark:text-[#a0a0a0] hover:bg-gray-100 dark:hover:bg-[#252528]"
                        >
                          Cancel
                        </Button>
                      </div>
                    </div>
                  )}

                  {comment.replies && comment.replies.length > 0 && (
                    <div className="mt-3 space-y-2">
                      <p className="text-xs text-gray-500 dark:text-[#707070] font-medium uppercase tracking-wide">
                        Replies ({comment.replies.length})
                      </p>
                      {comment.replies.map((reply: any) => {
                        const isReplyAuthor =
                          currentUser && reply.author.id === currentUser.id;
                        const isReplyEditedValue = isReplyEdited(reply);

                        return (
                          <div
                            key={reply.id}
                            className="flex gap-2 p-3 bg-gray-50 dark:bg-[#252528] rounded-lg border border-gray-200 dark:border-[#2a2a2d] group relative"
                          >
                            <Avatar className="h-6 w-6 shrink-0 mt-0.5">
                              <AvatarImage src={reply.author.image} />
                              <AvatarFallback className="text-xs bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400">
                                {reply.author.name?.charAt(0)?.toUpperCase() ||
                                  "U"}
                              </AvatarFallback>
                            </Avatar>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1 flex-wrap">
                                <span className="text-sm font-medium text-gray-900 dark:text-[#f0f0f0]">
                                  {reply.author.name}
                                  {isReplyAuthor && (
                                    <span className="text-blue-600 dark:text-blue-400 ml-1 text-xs">
                                      (you)
                                    </span>
                                  )}
                                </span>
                                <span className="text-xs text-gray-500 dark:text-[#a0a0a0]">
                                  {formatTimeAgo(new Date(reply.createdAt))}
                                </span>
                              </div>
                              <p className="text-sm text-gray-700 dark:text-[#e0e0e0] leading-relaxed whitespace-pre-wrap">
                                {reply.content}
                              </p>
                              {isReplyEditedValue && (
                                <div className="mt-1 flex items-center gap-1 text-xs text-gray-500 dark:text-[#707070] italic">
                                  ✏️ Edited{" "}
                                  {formatTimeAgo(new Date(reply.updatedAt))}
                                </div>
                              )}
                            </div>

                            {canDeleteReply(reply) && (
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity absolute top-2 right-2 text-red-500 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20"
                                onClick={() => {
                                  if (onDeleteReply)
                                    onDeleteReply(comment.id, reply.id);
                                }}
                              >
                                <Trash2 className="h-3 w-3" />
                              </Button>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {canAddComment && (
        <div className="border-t from-gray-50 to-white dark:from-[#0a0a0a] dark:to-[#1a1a1c] shrink-0 p-4">
          <form onSubmit={handleSubmitComment} className="space-y-2">
            <CommentTypeSelector
              selectedType={commentType}
              onTypeChange={handleTypeChange}
              isMobile={isMobile}
            />

            <div className="relative">
              <textarea
                ref={textareaRef}
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                onKeyDown={handleNewCommentKeyDown}
                placeholder="Add a comment to this document..."
                className="w-full p-3 pr-12 border border-gray-300 dark:border-[#2a2a2d] rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent text-sm bg-white dark:bg-[#252528] text-gray-900 dark:text-[#f0f0f0]"
                rows={2}
              />
              <Button
                type="submit"
                size="sm"
                disabled={!newComment.trim()}
                className="absolute bottom-2 right-2 h-8 w-8 p-0"
              >
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </form>
        </div>
      )}

      {!canAddComment && permissions === "VIEW" && (
        <div className="border-t from-gray-50 to-white dark:from-[#0a0a0a] dark:to-[#1a1a1c] shrink-0 p-4 text-center">
          <div className="text-gray-500 dark:text-[#a0a0a0] space-y-1 text-center text-xs">
            <p>👀 You have view-only permissions</p>
            <p>Cannot add or reply to comments</p>
          </div>
        </div>
      )}
    </div>
  );
}
