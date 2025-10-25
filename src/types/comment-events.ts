export interface CommentEvents {
  "comment:create": (comment: any) => void;
  "comment:update": (comment: any) => void;
  "comment:delete": (data: { commentId: string; fileId: string }) => void;
  "comment:resolve": (data: { commentId: string; status: string }) => void;

  "reply:create": (data: { commentId: string; reply: any }) => void;
  "reply:update": (data: {
    commentId: string;
    replyId: string;
    content: string;
  }) => void;
  "reply:delete": (data: { commentId: string; replyId: string }) => void;

  "comments:subscribe": (fileId: string) => void;
  "comments:unsubscribe": (fileId: string) => void;
}
