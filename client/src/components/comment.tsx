import { useState, useMemo } from "react";
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
  parentVisualDepth?: number;
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

export default function Comment({ comment, postId, depth = 0, parentVisualDepth = 0 }: CommentProps) {
  const [showReplyForm, setShowReplyForm] = useState(false);
  const [replyContent, setReplyContent] = useState("");
  const [isContentExpanded, setIsContentExpanded] = useState(false);
  const [visibleReplies, setVisibleReplies] = useState(2); // Show first 2 replies by default
  const [isDeepThreadExpanded, setIsDeepThreadExpanded] = useState(false);
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

  // Visual depth capping for clean UI - but allow infinite replies
  const MAX_INDENT_LEVEL = 8; // Reduced visual indentation limit for cleaner mobile experience
  const CONTINUE_THREAD_LEVEL = 999; // Effectively disable "Continue this thread" - allow infinite nesting
  const indentWidth = typeof window !== 'undefined' && window.innerWidth < 768 ? 16 : 20; // Responsive indent
  
  // Calculate visual depth (capped) vs actual depth
  const visualDepth = Math.min(depth, MAX_INDENT_LEVEL);
  const localIndent = (visualDepth - parentVisualDepth) * indentWidth;
  const baseGutter = visualDepth > parentVisualDepth ? 16 : 0; // Only add base padding when visual depth increases
  const showThreadLine = depth > 0;
  
  // Create rail elements for threading - improved for infinite depth with no click interference
  const ThreadRail = () => {
    if (depth === 0) return null;
    
    return (
      <div className="absolute left-0 top-0 bottom-0 flex pointer-events-none z-0">
        {/* Show visual thread lines up to the cap */}
        {Array.from({ length: visualDepth }, (_, i) => (
          <div
            key={i}
            className="w-5 flex-shrink-0 relative pointer-events-none"
          >
            <div className="absolute left-2.5 top-0 bottom-0 w-px bg-border/20 pointer-events-none" />
            {i === visualDepth - 1 && (
              <div className="absolute left-2.5 top-6 w-2.5 h-px bg-border/20 pointer-events-none" />
            )}
          </div>
        ))}
        {/* For very deep threads beyond visual cap, show a thicker continuing line with depth indicator */}
        {depth > MAX_INDENT_LEVEL && (
          <div className="w-5 flex-shrink-0 relative pointer-events-none">
            <div className="absolute left-2.5 top-0 bottom-0 w-0.5 bg-border/30 rounded-full pointer-events-none" />
            {/* Add small depth indicator for very deep threads */}
            <div className="absolute left-2 top-6 w-2 h-2 bg-border/20 rounded-full pointer-events-none" />
          </div>
        )}
      </div>
    );
  };
  
  // Content clamping logic
  const CONTENT_LIMIT = 280;
  const shouldClampContent = comment.content.length > CONTENT_LIMIT;
  const displayContent = shouldClampContent && !isContentExpanded 
    ? comment.content.slice(0, CONTENT_LIMIT) + "..." 
    : comment.content;
  
  // Reply limiting logic
  const REPLIES_INCREMENT = 3; // Show 3 more replies when "show more" is clicked
  const hasChildren = comment.children && comment.children.length > 0;
  const totalReplies = hasChildren ? comment.children.length : 0;
  const shouldShowMoreButton = totalReplies > visibleReplies;
  const displayedReplies = hasChildren ? comment.children.slice(0, visibleReplies) : [];
  const remainingReplies = totalReplies - visibleReplies;
  
  // Deep thread handling - only for very deep threads like Reddit
  const isDeepThread = depth >= CONTINUE_THREAD_LEVEL;
  
  // Count all descendants for "continue thread" display (memoized for performance)
  const totalDescendants = useMemo(() => {
    if (!hasChildren) return 0;
    
    const countAllDescendants = (comments: CommentWithChildren[]): number => {
      let count = 0;
      comments.forEach(c => {
        count += 1;
        if (c.children && c.children.length > 0) {
          count += countAllDescendants(c.children);
        }
      });
      return count;
    };
    
    return countAllDescendants(comment.children);
  }, [hasChildren, comment.children]);

  return (
    <div 
      className="relative w-full overflow-x-hidden break-words py-3"
      style={{ paddingLeft: `${localIndent + baseGutter}px` }}
    >
      <ThreadRail />
      <div className={`relative z-10 ${depth > 0 ? 'border-t border-border/20 pt-3' : 'border border-border rounded-lg p-4'}`}>
      <div className="relative z-20 flex items-start space-x-3 w-full min-w-0">
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
          
          <div className="mb-3 break-words [overflow-wrap:anywhere] whitespace-pre-wrap">
            {displayContent}
            {shouldClampContent && (
              <button
                onClick={() => setIsContentExpanded(!isContentExpanded)}
                className="ml-2 text-sm text-muted-foreground hover:text-foreground underline transition-colors"
              >
                {isContentExpanded ? "Show less" : "Read more"}
              </button>
            )}
          </div>
          
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => setShowReplyForm(!showReplyForm)}
            className="relative z-30 text-muted-foreground hover:text-foreground h-auto p-1 px-2 transition-colors pointer-events-auto"
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
      {hasChildren && (
        <div className="mt-3 w-full overflow-x-hidden">
          {isDeepThread ? (
            /* Inline Continue this thread for deep nesting */
            <div>
              <button
                onClick={() => setIsDeepThreadExpanded(!isDeepThreadExpanded)}
                className="text-sm text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1 py-2"
                data-testid={`button-continue-thread-${comment.id}`}
              >
                {isDeepThreadExpanded ? 'Collapse' : 'Continue'} this thread ({totalDescendants} {totalDescendants === 1 ? 'reply' : 'replies'})
              </button>
              
              {/* Expanded deep thread content */}
              {isDeepThreadExpanded && (
                <div className="space-y-0">
                  {displayedReplies.map((childComment) => (
                    <Comment
                      key={childComment.id}
                      comment={childComment}
                      postId={postId}
                      depth={depth + 1}
                      parentVisualDepth={visualDepth}
                    />
                  ))}
                  
                  {/* Show More Replies Button */}
                  {shouldShowMoreButton && (
                    <div className="py-2 pl-6">
                      <button
                        onClick={() => setVisibleReplies(prev => prev + REPLIES_INCREMENT)}
                        className="text-sm text-muted-foreground hover:text-foreground underline transition-colors"
                        data-testid={`button-show-more-replies-${comment.id}`}
                      >
                        Show {Math.min(remainingReplies, REPLIES_INCREMENT)} more {remainingReplies === 1 ? 'reply' : 'replies'} ({remainingReplies} remaining)
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          ) : (
            /* Normal nested display for shallow threads */
            <div className="space-y-0">
              {displayedReplies.map((childComment) => (
                <Comment
                  key={childComment.id}
                  comment={childComment}
                  postId={postId}
                  depth={depth + 1}
                  parentVisualDepth={visualDepth}
                />
              ))}
              
              {/* Show More Replies Button */}
              {shouldShowMoreButton && (
                <div className="py-2 pl-6">
                  <button
                    onClick={() => setVisibleReplies(prev => prev + REPLIES_INCREMENT)}
                    className="text-sm text-muted-foreground hover:text-foreground underline transition-colors"
                    data-testid={`button-show-more-replies-${comment.id}`}
                  >
                    Show {Math.min(remainingReplies, REPLIES_INCREMENT)} more {remainingReplies === 1 ? 'reply' : 'replies'} ({remainingReplies} remaining)
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      )}
      </div>
    </div>
  );
}
