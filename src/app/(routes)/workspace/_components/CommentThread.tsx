"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  Send,
  Reply,
  CheckCircle,
  MoreVertical,
  Edit,
  Trash2,
  MessageCircleMore,
  X,
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
    { value: "QUESTION" as const, label: "❓ Question", color: "purple" },
    { value: "SUGGESTION" as const, label: "💡 Suggestion", color: "blue" },
    { value: "ISSUE" as const, label: "🐛 Issue", color: "red" },
    { value: "PRAISE" as const, label: "🎉 Praise", color: "green" },
  ];

  return (
    <div className={`flex gap-2 mb-3 ${isMobile ? "mb-4" : ""} flex-wrap`}>
      {types.map((type) => (
        <button
          key={type.value}
          type="button"
          onClick={() => onTypeChange(type.value)}
          className={`${
            isMobile ? "px-4 py-2 text-base" : "px-3 py-1 text-sm"
          } rounded-full border transition-colors duration-200 font-medium ${
            selectedType === type.value
              ? `bg-${type.color}-100 text-${type.color}-800 border-${type.color}-300 shadow-sm`
              : "bg-gray-100 text-gray-600 border-gray-300 hover:bg-gray-200"
          }`}
        >
          {type.label}
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
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const replyTextareaRef = useRef<HTMLTextAreaElement>(null);
  const editTextareaRef = useRef<HTMLTextAreaElement>(null);
  const isMobile = useIsMobile();

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
    if (e) {
      e.preventDefault();
    }

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
        return "bg-blue-100 text-blue-800 border-blue-200";
      case "RESOLVED":
        return "bg-green-100 text-green-800 border-green-200";
      case "CLOSED":
        return "bg-gray-100 text-gray-800 border-gray-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "QUESTION":
        return "❓";
      case "SUGGESTION":
        return "💡";
      case "ISSUE":
        return "🐛";
      case "PRAISE":
        return "🎉";
      default:
        return <MessageCircleMore className="w-4 h-4" />;
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case "QUESTION":
        return "bg-purple-100 text-purple-800";
      case "SUGGESTION":
        return "bg-blue-100 text-blue-800";
      case "ISSUE":
        return "bg-red-100 text-red-800";
      case "PRAISE":
        return "bg-green-100 text-green-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <div
      className={`h-full flex flex-col bg-white ${
        isMobile ? "fixed inset-0 z-50 w-full" : "w-80 lg:w-96"
      }`}
    >
      <div className="p-4 border-b bg-gradient-to-r from-gray-50 to-white flex-shrink-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <MessageCircleMore
              className={`${isMobile ? "w-7 h-7" : "w-6 h-6"} text-blue-600`}
            />
            <div>
              <h3
                className={`font-semibold ${
                  isMobile ? "text-xl" : "text-lg"
                } flex items-center gap-2`}
              >
                Comments
                {comments.length > 0 && (
                  <Badge
                    variant="secondary"
                    className={`bg-blue-500 text-white ${
                      isMobile ? "text-base px-2 py-1" : "text-sm"
                    }`}
                  >
                    {comments.length}
                  </Badge>
                )}
                <div className="relative mb-2">
                  {!isMobile && (
                    <Badge
                      variant="outline"
                      className={
                        permissions === "ADMIN"
                          ? "bg-red-200 border border-red-200/50 text-white font-semibold backdrop-blur-md shadow-[inset_0_0_10px_rgba(255,0,0,0.15)] hover:bg-red-300 mt-2 text-sm"
                          : permissions === "EDIT"
                          ? "bg-indigo-800/30 border border-indigo-200/30 text-white font-semibold backdrop-blur-md shadow-[inset_0_0_10px_rgba(99,102,241,0.25)] hover:bg-indigo-700/40 mt-2 text-sm"
                          : "bg-blue-700/30 border border-blue-300/30 text-white font-semibold backdrop-blur-md shadow-[inset_0_0_10px_rgba(59,130,246,0.15)] hover:bg-blue-900/40 mt-2 text-sm"
                      }
                    >
                      {permissions === "ADMIN"
                        ? "Admin"
                        : permissions === "EDIT"
                        ? "Editor"
                        : "Viewer"}
                    </Badge>
                  )}
                </div>
              </h3>
              <p
                className={`${
                  isMobile ? "text-base" : "text-sm"
                } text-gray-600`}
              >
                Collaborate with your team
              </p>
            </div>
          </div>

          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className={`${
              isMobile ? "h-10 w-10" : "h-8 w-8"
            } p-0 hover:bg-gray-100`}
          >
            <X className={`${isMobile ? "h-5 w-5" : "h-4 w-4"}`} />
          </Button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {comments.length === 0 ? (
          <div className="text-center text-gray-500 py-16">
            <MessageCircleMore
              className={`${
                isMobile ? "w-20 h-20" : "w-16 h-16"
              } mx-auto mb-4 text-gray-300`}
            />
            <p
              className={`font-medium ${
                isMobile ? "text-xl mb-3" : "text-lg mb-2"
              }`}
            >
              No comments yet
            </p>
            <p
              className={`${
                isMobile ? "text-lg" : "text-sm"
              } text-gray-600 max-w-sm mx-auto`}
            >
              {canAddComment
                ? "Start a conversation by adding the first comment to this document"
                : "You don't have permission to add comments"}
            </p>
          </div>
        ) : (
          comments.map((comment) => {
            const isCommentAuthor =
              currentUser && comment.author.id === currentUser.id;
            const isEdited = isCommentEdited(comment);

            return (
              <div
                key={comment.id}
                className="bg-white border border-gray-200 rounded-lg sm:rounded-xl p-3 sm:p-4 hover:border-gray-300 transition-colors shadow-sm"
              >
                {/* Заголовок комментария */}
                <div className="flex items-start justify-between mb-2 sm:mb-3">
                  <div className="flex items-center gap-2 sm:gap-3 flex-1 min-w-0">
                    <Avatar
                      className={`${
                        isMobile ? "h-10 w-10" : "h-8 w-8"
                      } border border-white shadow-sm flex-shrink-0`}
                    >
                      <AvatarImage src={comment.author.image} />
                      <AvatarFallback
                        className={`${
                          isMobile ? "text-base" : "text-sm"
                        } bg-blue-100 text-blue-600 font-medium`}
                      >
                        {comment.author.name?.charAt(0)?.toUpperCase() || "U"}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1 sm:gap-2 flex-wrap">
                        <span
                          className={`${
                            isMobile ? "text-lg" : "text-sm"
                          } font-semibold text-gray-900`}
                        >
                          {comment.author.name}
                          {isCommentAuthor && (
                            <span
                              className={`${
                                isMobile ? "text-sm" : "text-xs"
                              } text-blue-600 ml-1`}
                            >
                              (you)
                            </span>
                          )}
                        </span>
                        <Badge
                          variant="outline"
                          className={`${
                            isMobile
                              ? "text-base px-3 py-1"
                              : "text-xs px-2 py-0.5"
                          } ${getTypeColor(comment.type)} border-0`}
                        >
                          {getTypeIcon(comment.type)}
                          {isMobile && ` ${comment.type.toLowerCase()}`}
                        </Badge>
                        <Badge
                          variant="outline"
                          className={`${
                            isMobile
                              ? "text-base px-3 py-1"
                              : "text-xs px-2 py-0.5"
                          } ${getStatusColor(comment.status)}`}
                        >
                          {comment.status.toLowerCase()}
                        </Badge>
                      </div>
                      <p
                        className={`${
                          isMobile ? "text-base" : "text-xs"
                        } text-gray-500 mt-0.5`}
                      >
                        {new Date(comment.createdAt).toLocaleString()}
                      </p>
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
                          className={`${
                            isMobile ? "h-9 w-9" : "h-6 w-6"
                          } p-0 opacity-60 hover:opacity-100 flex-shrink-0`}
                        >
                          <MoreVertical
                            className={`${isMobile ? "h-5 w-5" : "h-3 w-3"}`}
                          />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent
                        align="end"
                        className={`${
                          isMobile ? "w-48 text-base" : "w-40 text-sm"
                        }`}
                      >
                        {canEditComment(comment) && (
                          <DropdownMenuItem
                            onClick={() => startEditing(comment)}
                          >
                            <Edit
                              className={`${
                                isMobile ? "h-4 w-4" : "h-3 w-3"
                              } mr-2`}
                            />
                            Edit
                          </DropdownMenuItem>
                        )}
                        {canResolve && (
                          <DropdownMenuItem
                            onClick={() => onResolveComment(comment.id)}
                          >
                            <CheckCircle
                              className={`${
                                isMobile ? "h-4 w-4" : "h-3 w-3"
                              } mr-2`}
                            />
                            {comment.status === "OPEN" ? "Resolve" : "Reopen"}
                          </DropdownMenuItem>
                        )}
                        {canDeleteComment(comment) && (
                          <DropdownMenuItem
                            onClick={() => onDeleteComment(comment.id)}
                            className="text-red-600"
                          >
                            <Trash2
                              className={`${
                                isMobile ? "h-4 w-4" : "h-3 w-3"
                              } mr-2`}
                            />
                            Delete
                          </DropdownMenuItem>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  )}
                </div>

                {comment.selection && (
                  <div
                    className={`mb-2 sm:mb-3 p-2 sm:p-3 bg-yellow-50 border border-yellow-200 rounded ${
                      isMobile ? "text-base" : "text-sm"
                    }`}
                  >
                    <p className="text-yellow-800 font-medium text-xs mb-0.5 uppercase tracking-wide">
                      Selected Text
                    </p>
                    <p className="text-yellow-700 font-medium line-clamp-2">
                      "{comment.selection.text}"
                    </p>
                  </div>
                )}

                {editingComment === comment.id ? (
                  <div className="mb-2 sm:mb-3">
                    <textarea
                      ref={editTextareaRef}
                      value={editContent}
                      onChange={(e) => setEditContent(e.target.value)}
                      onKeyDown={handleEditKeyDown}
                      className={`w-full p-2 sm:p-3 border border-gray-300 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                        isMobile ? "text-base min-h-[120px]" : "text-sm"
                      }`}
                      rows={3}
                      placeholder="Edit your comment..."
                    />
                    <div className="flex gap-2 mt-2">
                      <Button
                        size="sm"
                        onClick={handleSaveEdit}
                        className={`${
                          isMobile ? "h-8 text-base px-6 py-2" : "h-7 text-xs"
                        }`}
                      >
                        <Send
                          className={`${
                            isMobile ? "h-4 w-4 mr-2" : "h-3 w-3 mr-1"
                          }`}
                        />
                        Save
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={cancelEditing}
                        className={`${
                          isMobile ? "h-8 text-base px-6 py-2" : "h-7 text-xs"
                        }`}
                      >
                        Cancel
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="mb-2 sm:mb-3">
                    <p
                      className={`text-gray-800 leading-relaxed whitespace-pre-wrap ${
                        isMobile ? "text-lg" : "text-sm"
                      }`}
                    >
                      {comment.content}
                    </p>
                    {isEdited && (
                      <div className="mt-1 flex items-center gap-1 text-xs text-gray-500 italic">
                        ✏️ Edited on{" "}
                        {new Date(comment.updatedAt).toLocaleString()}
                      </div>
                    )}
                  </div>
                )}

                {/* Кнопки действий */}
                <div className="flex items-center justify-between pt-2 sm:pt-3 border-t border-gray-100">
                  <div className="flex items-center gap-2 sm:gap-3">
                    {canReply && (
                      <button
                        onClick={() =>
                          setReplyingTo(
                            replyingTo === comment.id ? null : comment.id
                          )
                        }
                        className={`flex items-center gap-1 ${
                          isMobile ? "text-base" : "text-sm"
                        } text-blue-600 hover:text-blue-800 font-medium transition-colors`}
                      >
                        <Reply
                          className={`${isMobile ? "h-5 w-5" : "h-4 w-4"}`}
                        />
                        Reply
                      </button>
                    )}
                    {comment.replies && comment.replies.length > 0 && (
                      <span
                        className={`${
                          isMobile ? "text-base" : "text-sm"
                        } text-gray-500`}
                      >
                        {comment.replies.length}{" "}
                        {comment.replies.length === 1 ? "reply" : "replies"}
                      </span>
                    )}
                  </div>

                  {canResolve && comment.status === "OPEN" && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onResolveComment(comment.id)}
                      className={`${
                        isMobile ? "h-8 text-base px-4 py-2" : "h-7 text-xs"
                      } text-green-600 hover:text-green-700 hover:bg-green-50`}
                    >
                      <CheckCircle
                        className={`${
                          isMobile ? "h-4 w-4 mr-2" : "h-3 w-3 mr-1"
                        }`}
                      />
                      Resolve
                    </Button>
                  )}
                </div>

                {replyingTo === comment.id && (
                  <div className="mt-3 p-2 sm:p-3 bg-gray-50 rounded-lg border border-gray-200">
                    <textarea
                      ref={replyTextareaRef}
                      value={replyContent}
                      onChange={(e) => setReplyContent(e.target.value)}
                      onKeyDown={(e) => handleReplyKeyDown(e, comment.id)}
                      className={`w-full p-2 border border-gray-300 rounded resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                        isMobile ? "text-base min-h-[100px]" : "text-sm"
                      }`}
                      rows={2}
                      placeholder="Write your reply..."
                    />
                    <div className="flex gap-2 mt-2">
                      <Button
                        size="sm"
                        onClick={() => handleSubmitReply(comment.id)}
                        disabled={!replyContent.trim()}
                        className={`${
                          isMobile ? "h-8 text-base px-6 py-2" : "h-7 text-xs"
                        }`}
                      >
                        <Send
                          className={`${
                            isMobile ? "h-4 w-4 mr-2" : "h-3 w-3 mr-1"
                          }`}
                        />
                        Post Reply
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setReplyingTo(null);
                          setReplyContent("");
                        }}
                        className={`${
                          isMobile ? "h-8 text-base px-6 py-2" : "h-7 text-xs"
                        }`}
                      >
                        Cancel
                      </Button>
                    </div>
                  </div>
                )}

                {comment.replies && comment.replies.length > 0 && (
                  <div className="mt-3 space-y-2">
                    <p
                      className={`${
                        isMobile ? "text-base" : "text-xs"
                      } text-gray-500 font-medium uppercase tracking-wide`}
                    >
                      Replies ({comment.replies.length})
                    </p>
                    {comment.replies.map((reply: any) => {
                      const isReplyAuthor =
                        currentUser && reply.author.id === currentUser.id;
                      const isReplyEditedValue = isReplyEdited(reply);

                      return (
                        <div
                          key={reply.id}
                          className="flex gap-2 p-2 bg-gray-50 rounded border border-gray-200 group relative"
                        >
                          <Avatar className="h-6 w-6 flex-shrink-0 mt-1">
                            <AvatarImage src={reply.author.image} />
                            <AvatarFallback
                              className={`${
                                isMobile ? "text-sm" : "text-xs"
                              } bg-green-100 text-green-600`}
                            >
                              {reply.author.name?.charAt(0)?.toUpperCase() ||
                                "U"}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1 flex-wrap">
                              <span
                                className={`${
                                  isMobile ? "text-base" : "text-sm"
                                } font-medium text-gray-900`}
                              >
                                {reply.author.name}
                                {isReplyAuthor && (
                                  <span
                                    className={`${
                                      isMobile ? "text-sm" : "text-xs"
                                    } text-blue-600 ml-1`}
                                  >
                                    (you)
                                  </span>
                                )}
                              </span>
                              <span
                                className={`${
                                  isMobile ? "text-sm" : "text-xs"
                                } text-gray-500`}
                              >
                                {new Date(reply.createdAt).toLocaleString()}
                              </span>
                            </div>
                            <p
                              className={`${
                                isMobile ? "text-base" : "text-sm"
                              } text-gray-700 leading-relaxed whitespace-pre-wrap`}
                            >
                              {reply.content}
                            </p>
                            {isReplyEditedValue && (
                              <div className="mt-1 flex items-center gap-1 text-xs text-gray-500 italic">
                                ✏️ Edited on{" "}
                                {new Date(reply.updatedAt).toLocaleString()}
                              </div>
                            )}
                          </div>

                          {canDeleteReply(reply) && (
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity absolute top-2 right-2"
                              onClick={() => {
                                if (onDeleteReply)
                                  onDeleteReply(comment.id, reply.id);
                              }}
                            >
                              <Trash2 className="h-3 w-3 text-red-500" />
                            </Button>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {canAddComment && (
        <div className="p-3 sm:p-4 border-t bg-gray-50 flex-shrink-0">
          <form
            onSubmit={handleSubmitComment}
            className="space-y-2 sm:space-y-3"
          >
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
                className={`w-full p-2 sm:p-3 pr-10 border border-gray-300 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                  isMobile ? "text-base min-h-[120px]" : "text-sm"
                }`}
                rows={2}
              />
              <Button
                type="submit"
                size="sm"
                disabled={!newComment.trim()}
                className={`absolute ${
                  isMobile
                    ? "bottom-4 right-4 h-10 w-10"
                    : "bottom-2 right-2 h-7 w-7"
                } p-0`}
              >
                <Send className={`${isMobile ? "h-5 w-5" : "h-3 w-3"}`} />
              </Button>
            </div>
          </form>
        </div>
      )}

      {!canAddComment && permissions === "VIEW" && (
        <div className="p-3 sm:p-4 border-t bg-gray-50 text-center text-gray-500 text-xs sm:text-sm">
          <p>You have view-only permissions and cannot add comments</p>
        </div>
      )}
    </div>
  );
}
