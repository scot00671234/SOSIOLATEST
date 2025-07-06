
import { ChevronUp, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { cn } from "@/lib/utils";

interface VoteButtonProps {
  targetType: 'post' | 'comment';
  targetId: number;
  currentVotes: number;
  userVote?: 1 | -1 | null;
  vertical?: boolean;
}

export default function VoteButton({ 
  targetType, 
  targetId, 
  currentVotes, 
  userVote, 
  vertical = true 
}: VoteButtonProps) {
  const queryClient = useQueryClient();

  const voteMutation = useMutation({
    mutationFn: async (voteType: 1 | -1) => {
      return apiRequest("POST", "/api/vote", {
        targetType,
        targetId,
        voteType
      });
    },
    onSuccess: () => {
      // Invalidate relevant queries
      queryClient.invalidateQueries({ queryKey: ["/api/posts"] });
      if (targetType === 'post') {
        queryClient.invalidateQueries({ queryKey: ["/api/posts", targetId] });
      }
    }
  });

  const handleVote = async (voteType: 1 | -1) => {
    // Prevent double-clicking
    if (voteMutation.isPending) {
      return;
    }
    
    console.log("Vote clicked:", { voteType, currentUserVote: userVote, currentVotes });
    
    try {
      await voteMutation.mutateAsync(voteType);
      console.log("Vote request successful");
    } catch (error) {
      console.error("Vote request failed:", error);
    }
  };

  const containerClass = vertical 
    ? "flex flex-col items-center space-y-1 min-w-0"
    : "flex items-center space-x-2";

  return (
    <div className={containerClass}>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => handleVote(1)}
        disabled={voteMutation.isPending}
        className={cn(
          "p-1 hover:bg-muted/50 rounded transition-colors",
          userVote === 1 && "text-foreground bg-muted"
        )}
      >
        <ChevronUp className={cn(
          "text-muted-foreground hover:text-foreground transition-colors",
          userVote === 1 && "text-foreground",
          vertical ? "h-4 w-4" : "h-3 w-3"
        )} />
      </Button>
      
      <span className={cn(
        "font-medium",
        userVote === 1 && "text-foreground",
        userVote === -1 && "text-foreground",
        vertical ? "text-sm" : "text-xs"
      )}>
        {currentVotes}
      </span>
      
      <Button
        variant="ghost"
        size="sm"
        onClick={() => handleVote(-1)}
        disabled={voteMutation.isPending}
        className={cn(
          "p-1 hover:bg-muted/50 rounded transition-colors",
          userVote === -1 && "text-foreground bg-muted"
        )}
      >
        <ChevronDown className={cn(
          "text-muted-foreground hover:text-foreground transition-colors",
          userVote === -1 && "text-foreground",
          vertical ? "h-4 w-4" : "h-3 w-3"
        )} />
      </Button>
    </div>
  );
}
