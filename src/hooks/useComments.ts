import { useState, useCallback } from "react";
import { toast } from "sonner";

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

export function useComments(fileId: string) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const fetchComments = useCallback(async () => {
    if (!fileId) return;
    setIsLoading(true);
    try {
      const response = await fetch(`/api/comments?fileId=${fileId}`);
      if (!response.ok) throw new Error("Failed to fetch comments");
      const data = await response.json();
      setComments(data);
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
      selection?: {
        start?: number;
        end?: number;
        text?: string;
        elementId?: string;
        elementType?: string;
      };
      mentions?: string[];
      parentId?: string;
    }) => {
      try {
        const response = await fetch("/api/comments", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ...data, fileId }),
        });

        if (!response.ok) throw new Error("Failed to create comment");

        const newComment = await response.json();
        setComments((prev) => [...prev, newComment]);
        toast.success("Comment added");
        return newComment;
      } catch (error) {
        console.error("Error creating comment:", error);
        toast.error("Failed to add comment");
        throw error;
      }
    },
    [fileId]
  );

  const createReply = useCallback(
    async (commentId: string, content: string, mentions?: string[]) => {
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
              ? { ...comment, replies: [...comment.replies, newReply] }
              : comment
          )
        );

        toast.success("Reply added");
        return newReply;
      } catch (error) {
        console.error("Error creating reply:", error);
        toast.error("Failed to add reply");
        throw error;
      }
    },
    []
  );

  const updateCommentStatus = useCallback(
    async (commentId: string, status: string) => {
      try {
        const response = await fetch(`/api/comments/${commentId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status }),
        });

        if (!response.ok) throw new Error("Failed to update comment");

        const updatedComment = await response.json();

        setComments((prev) =>
          prev.map((comment) =>
            comment.id === commentId ? updatedComment : comment
          )
        );

        toast.success("Comment updated");
        return updatedComment;
      } catch (error) {
        console.error("Error updating comment:", error);
        toast.error("Failed to update comment");
        throw error;
      }
    },
    []
  );

  const deleteComment = useCallback(async (commentId: string) => {
    try {
      const response = await fetch(`/api/comments/${commentId}`, {
        method: "DELETE",
      });

      if (!response.ok) throw new Error("Failed to delete comment");

      setComments((prev) => prev.filter((comment) => comment.id !== commentId));
      toast.success("Comment deleted");
    } catch (error) {
      console.error("Error deleting comment:", error);
      toast.error("Failed to delete comment");
      throw error;
    }
  }, []);

  return {
    comments,
    isLoading,
    fetchComments,
    createComment,
    createReply,
    updateCommentStatus,
    deleteComment,
  };
}
