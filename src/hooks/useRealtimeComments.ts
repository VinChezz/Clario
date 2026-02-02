import { useCallback, useEffect } from "react";
import { useSocket } from "./useSocket";

interface UseRealtimeCommentsProps {
  fileId: string;
  currentUser: any;
  onCommentCreate: (comment: any) => void;
  onCommentUpdate: (comment: any) => void;
  onCommentDelete: (data: { commentId: string; fileId: string }) => void;
  onReplyCreate: (data: { commentId: string; reply: any }) => void;
  onReplyDelete: (data: { commentId: string; replyId: string }) => void;
}

export function useRealtimeComments({
  fileId,
  currentUser,
  onCommentCreate,
  onCommentUpdate,
  onCommentDelete,
  onReplyCreate,
  onReplyDelete,
}: UseRealtimeCommentsProps) {
  const { subscribe, emitEvent, isConnected } = useSocket(fileId, currentUser);

  useEffect(() => {
    if (!fileId || !isConnected) return;

    emitEvent("join_comments_room", { fileId });

    return () => {
      emitEvent("leave_comments_room", { fileId });
    };
  }, [
    fileId,
    isConnected,
    subscribe,
    emitEvent,
    onCommentCreate,
    onCommentUpdate,
    onCommentDelete,
    onReplyCreate,
    onReplyDelete,
  ]);

  const emitCommentCreate = useCallback(
    (comment: any) => {
      emitEvent("comment:create", comment);
    },
    [emitEvent],
  );

  const emitCommentUpdate = useCallback(
    (comment: any) => {
      emitEvent("comment:update", comment);
    },
    [emitEvent],
  );

  const emitCommentDelete = useCallback(
    (commentId: string) => {
      emitEvent("comment:delete", { commentId, fileId });
    },
    [emitEvent, fileId],
  );

  const emitReplyCreate = useCallback(
    (commentId: string, reply: any) => {
      emitEvent("reply:create", {
        commentId,
        reply,
        fileId,
      });
    },
    [emitEvent, fileId],
  );

  const emitReplyDelete = useCallback(
    (commentId: string, replyId: string) => {
      emitEvent("reply:delete", {
        commentId,
        replyId,
        fileId,
      });
    },
    [emitEvent, fileId],
  );

  return {
    emitCommentCreate,
    emitCommentUpdate,
    emitCommentDelete,
    emitReplyCreate,
    emitReplyDelete,
  };
}
