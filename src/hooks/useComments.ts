import { useState, useCallback } from "react";
import { toast } from "sonner";
import { useRealtimeComments } from "./useRealtimeComments";

interface Comment {
  id: string;
  content: string;
  type: string;
  status: string;
  author: {
    id: string;
    name: string;
    email: string;
    image: string;
  };
  selection?: {
    start: number;
    end: number;
    text: string;
  };
  replies: CommentReply[];
  mentions: Mention[];
  createdAt: string;
  updatedAt: string;
}

interface CommentReply {
  id: string;
  content: string;
  author: {
    id: string;
    name: string;
    email: string;
    image: string;
  };
  createdAt: string;
}

interface Mention {
  id: string;
  user: {
    id: string;
    name: string;
    email: string;
    image: string;
  };
}

export function useComments(fileId: string, currentUser: any) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [optimisticIds] = useState(new Set());

  const sortComments = (comments: Comment[]): Comment[] => {
    return [...comments].sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    );
  };

  const handleCommentCreate = useCallback(
    (newComment: any) => {
      setComments((prev) => {
        const filtered = prev.filter(
          (comment) =>
            !optimisticIds.has(comment.id) || comment.id !== newComment.id,
        );
        const exists = filtered.find((c) => c.id === newComment.id);
        if (exists) {
          return sortComments(
            filtered.map((comment) =>
              comment.id === newComment.id ? newComment : comment,
            ),
          );
        }
        return sortComments([...filtered, newComment]);
      });
    },
    [optimisticIds],
  );

  const handleCommentUpdate = useCallback((updatedComment: any) => {
    setComments((prev) =>
      sortComments(
        prev.map((comment) =>
          comment.id === updatedComment.id ? updatedComment : comment,
        ),
      ),
    );
  }, []);

  const handleCommentDelete = useCallback(
    (data: { commentId: string; fileId: string }) => {
      setComments((prev) =>
        sortComments(prev.filter((comment) => comment.id !== data.commentId)),
      );
    },
    [],
  );

  const handleReplyCreate = useCallback(
    (data: { commentId: string; reply: any }) => {
      setComments((prev) =>
        prev.map((comment) => {
          if (comment.id === data.commentId) {
            const currentReplies = comment.replies || [];
            const exists = currentReplies.find((r) => r.id === data.reply.id);

            if (exists) {
              return {
                ...comment,
                replies: currentReplies.map((reply) =>
                  reply.id === data.reply.id ? data.reply : reply,
                ),
              };
            }

            return {
              ...comment,
              replies: [...currentReplies, data.reply],
            };
          }
          return comment;
        }),
      );
    },
    [],
  );

  const handleReplyDelete = useCallback(
    (data: { commentId: string; replyId: string }) => {
      setComments((prev) =>
        prev.map((comment) =>
          comment.id === data.commentId
            ? {
                ...comment,
                replies: (comment.replies || []).filter(
                  (reply) => reply.id !== data.replyId,
                ),
              }
            : comment,
        ),
      );
    },
    [],
  );

  const realtimeComments = useRealtimeComments({
    fileId,
    currentUser,
    onCommentCreate: handleCommentCreate,
    onCommentUpdate: handleCommentUpdate,
    onCommentDelete: handleCommentDelete,
    onReplyCreate: handleReplyCreate,
    onReplyDelete: handleReplyDelete,
  });

  const fetchComments = useCallback(async () => {
    if (!fileId) return;
    setIsLoading(true);
    try {
      const response = await fetch(`/api/comments?fileId=${fileId}`);
      if (!response.ok) throw new Error("Failed to fetch comments");
      const data = await response.json();
      setComments(sortComments(data));
    } catch (error) {
      console.error("Error fetching comments:", error);
      toast.error("Failed to load comments");
    } finally {
      setIsLoading(false);
    }
  }, [fileId]);

  const createComment = useCallback(
    async (data: {
      content: string;
      type?: string;
      selection?: any;
      mentions?: string[];
    }) => {
      const tempId = `temp-${Date.now()}`;

      const optimisticComment = {
        id: tempId,
        content: data.content,
        type: data.type || "QUESTION",
        status: "OPEN",
        author: currentUser,
        selection: data.selection,
        replies: [],
        mentions: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      setComments((prev) => [...prev, optimisticComment]);

      try {
        const response = await fetch("/api/comments", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ...data, fileId }),
        });

        if (!response.ok) throw new Error("Failed to create comment");

        const newComment = await response.json();

        setComments((prev) =>
          prev.map((comment) => (comment.id === tempId ? newComment : comment)),
        );

        realtimeComments.emitCommentCreate(newComment);

        toast.success("Comment added");
        return newComment;
      } catch (error) {
        setComments((prev) => prev.filter((comment) => comment.id !== tempId));
        console.error("Error creating comment:", error);
        toast.error("Failed to add comment");
        throw error;
      }
    },
    [fileId, realtimeComments, currentUser],
  );

  const createReply = useCallback(
    async (commentId: string, content: string, mentions?: string[]) => {
      const tempId = `temp-reply-${Date.now()}`;

      const optimisticReply = {
        id: tempId,
        content,
        author: currentUser,
        createdAt: new Date().toISOString(),
      };

      setComments((prev) =>
        prev.map((comment) =>
          comment.id === commentId
            ? {
                ...comment,
                replies: [...(comment.replies || []), optimisticReply],
              }
            : comment,
        ),
      );

      try {
        const response = await fetch(`/api/comments/${commentId}/replies`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ content, mentions }),
        });

        if (!response.ok) throw new Error("Failed to create reply");

        const newReply = await response.json();

        setComments((prev) =>
          prev.map((comment) =>
            comment.id === commentId
              ? {
                  ...comment,
                  replies: (comment.replies || []).map((reply) =>
                    reply.id === tempId ? newReply : reply,
                  ),
                }
              : comment,
          ),
        );

        const replyWithFileId = {
          ...newReply,
          fileId: newReply.fileId || fileId,
        };

        realtimeComments.emitReplyCreate(commentId, replyWithFileId);

        toast.success("Reply added");
        return newReply;
      } catch (error) {
        setComments((prev) =>
          prev.map((comment) =>
            comment.id === commentId
              ? {
                  ...comment,
                  replies: (comment.replies || []).filter(
                    (reply) => reply.id !== tempId,
                  ),
                }
              : comment,
          ),
        );
        console.error("Error creating reply:", error);
        toast.error("Failed to add reply");
        throw error;
      }
    },
    [realtimeComments, currentUser, fileId],
  );

  const updateComment = useCallback(
    async (commentId: string, data: { status?: string; content?: string }) => {
      setComments((prev) =>
        sortComments(
          prev.map((comment) => {
            if (comment.id === commentId) {
              return {
                ...comment,
                ...data,
                updatedAt: new Date().toISOString(),
              };
            }
            return comment;
          }),
        ),
      );

      try {
        const response = await fetch(`/api/comments/${commentId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(data),
        });

        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(`Failed to update comment: ${errorText}`);
        }

        const updatedComment = await response.json();

        realtimeComments.emitCommentUpdate(updatedComment);

        toast.success("Comment updated");
        return updatedComment;
      } catch (error) {
        fetchComments();

        console.error("Error updating comment:", error);
        toast.error("Failed to update comment");
        throw error;
      }
    },
    [realtimeComments, fetchComments],
  );

  const deleteComment = useCallback(
    async (commentId: string) => {
      setComments((prev) => prev.filter((comment) => comment.id !== commentId));

      try {
        const response = await fetch(`/api/comments/${commentId}`, {
          method: "DELETE",
        });

        if (!response.ok) throw new Error("Failed to delete comment");

        realtimeComments.emitCommentDelete(commentId);

        toast.success("Comment deleted");
      } catch (error) {
        fetchComments();

        console.error("Error deleting comment:", error);
        toast.error("Failed to delete comment");
        throw error;
      }
    },
    [realtimeComments, fetchComments],
  );

  const deleteReply = useCallback(
    async (commentId: string, replyId: string) => {
      try {
        const response = await fetch(
          `/api/comments/${commentId}/replies/${replyId}`,
          {
            method: "DELETE",
          },
        );

        if (!response.ok) throw new Error("Failed to delete reply");

        realtimeComments.emitReplyDelete(commentId, replyId);

        toast.success("Reply deleted");
      } catch (error) {
        console.error("Error deleting reply:", error);
        toast.error("Failed to delete reply");
        throw error;
      }
    },
    [realtimeComments],
  );

  return {
    comments,
    isLoading,
    fetchComments,
    createComment,
    createReply,
    updateComment,
    deleteComment,
    deleteReply,
  };
}
