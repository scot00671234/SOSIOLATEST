import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import VoteButton from "./vote-button";
import type { CommentWithChildren } from "@shared/schema";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";

interface CommentProps {
  comment: CommentWithChildren;
  postId: number;
  depth?: number;
}

function formatTimeAgo(date: Date | string): string {
  const now = new Date();
  const commentDate = new Date(date);
  const diffInSeconds = Math.floor((now.getTime() - commentDate.getTime()) / 1000);
  
  if (diffInSeconds < 60) return "just now";
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} minutes ago`;
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} hours ago`;
  return `${Math.floor(diffInSeconds / 86400)} days ago`;
}

export default function Comment({ comment, postId, depth = 0 }: CommentProps) {
  const [showReplyForm, setShowReplyForm] = useState(false);
  const [replyContent, setReplyContent] = useState("");
  const queryClient = useQueryClient();

  const replyMutation = useMutation({
    mutationFn: async (content: string) => {
      return apiRequest("POST", "/api/comments", {
        content,
        postId,
        parentId: comment.id
      });
    },
    onSuccess: () => {
      setReplyContent("");
      setShowReplyForm(false);
      queryClient.invalidateQueries({ queryKey: ["/api/posts", postId, "comments"] });
      queryClient.invalidateQueries({ queryKey: ["/api/posts"] });
    }
  });

  const handleReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyContent.trim()) return;
    
    await replyMutation.mutateAsync(replyContent.trim());
  };

  const paddingLeft = Math.min(depth * 16, 64); // Max 4 levels deep
  const showThreadLine = depth > 0;

  return (
    <div className={`border border-border rounded-lg p-4 w-full overflow-x-hidden break-words ${
      showThreadLine ? 'border-l-2 border-l-muted-foreground/20' : ''
    }`} style={{ paddingLeft: `${paddingLeft + 16}px` }}>
      <div className="flex items-start space-x-3 w-full min-w-0">
        {/* Vote Column */}
        <div className="flex-none">
          <VoteButton
            targetType="comment"
            targetId={comment.id}
            currentVotes={comment.votes}
            vertical={true}
          />
        </div>
        
        {/* Comment Content */}
        <div className="flex-1 min-w-0 overflow-hidden">
          <div className="text-xs text-muted-foreground mb-2">
            <span>{formatTimeAgo(comment.createdAt)}</span>
          </div>
          
          <div className="mb-3 break-words overflow-wrap-anywhere whitespace-pre-wrap">{comment.content}</div>
          
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => setShowReplyForm(!showReplyForm)}
            className="text-muted-foreground hover:text-foreground h-auto p-0 transition-colors"
          >
            Reply
          </Button>
          
          {/* Reply Form */}
          {showReplyForm && (
            <form onSubmit={handleReply} className="mt-4 space-y-3">
              <Textarea
                value={replyContent}
                onChange={(e) => setReplyContent(e.target.value)}
                placeholder="Write a reply..."
                className="resize-none"
                rows={3}
              />
              <div className="flex justify-end space-x-2">
                <Button 
                  type="button" 
                  variant="ghost" 
                  size="sm"
                  onClick={() => setShowReplyForm(false)}
                  className="text-muted-foreground hover:text-foreground"
                >
                  Cancel
                </Button>
                <Button 
                  type="submit" 
                  size="sm" 
                  className="bg-muted text-foreground hover:bg-muted/80 transition-all border border-border/50 hover:border-border/80 hover:shadow-sm"
                  disabled={!replyContent.trim() || replyMutation.isPending}
                >
                  Reply
                </Button>
              </div>
            </form>
          )}
        </div>
      </div>
      
      {/* Nested Replies */}
      {comment.children && comment.children.length > 0 && (
        <div className="mt-4 space-y-3 w-full overflow-x-hidden">
          {comment.children.map((childComment) => (
            <Comment
              key={childComment.id}
              comment={childComment}
              postId={postId}
              depth={depth + 1}
            />
          ))}
        </div>
      )}
    </div>
  );
}
