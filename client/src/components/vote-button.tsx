import { useState } from "react";
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
  const [localVotes, setLocalVotes] = useState(currentVotes);
  const [localUserVote, setLocalUserVote] = useState(userVote);
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
    const wasVoted = localUserVote === voteType;
    const newUserVote = wasVoted ? null : voteType;
    
    // Optimistic update
    let voteDelta = 0;
    if (localUserVote === null) {
      voteDelta = voteType;
    } else if (wasVoted) {
      voteDelta = -voteType;
    } else {
      voteDelta = voteType * 2;
    }
    
    setLocalVotes(prev => prev + voteDelta);
    setLocalUserVote(newUserVote);
    
    try {
      await voteMutation.mutateAsync(voteType);
    } catch (error) {
      // Revert on error
      setLocalVotes(currentVotes);
      setLocalUserVote(userVote);
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
          "p-1 hover:bg-orange-50 dark:hover:bg-orange-950/30 rounded transition-colors",
          localUserVote === 1 && "text-orange-500 bg-orange-50 dark:bg-orange-950/30"
        )}
      >
        <ChevronUp className={cn(
          "text-muted-foreground hover:text-orange-500 transition-colors",
          localUserVote === 1 && "text-orange-500",
          vertical ? "h-4 w-4" : "h-3 w-3"
        )} />
      </Button>
      
      <span className={cn(
        "font-medium",
        localUserVote === 1 && "text-orange-500",
        localUserVote === -1 && "text-blue-500",
        vertical ? "text-sm" : "text-xs"
      )}>
        {localVotes}
      </span>
      
      <Button
        variant="ghost"
        size="sm"
        onClick={() => handleVote(-1)}
        disabled={voteMutation.isPending}
        className={cn(
          "p-1 hover:bg-blue-50 dark:hover:bg-blue-950/30 rounded transition-colors",
          localUserVote === -1 && "text-blue-500 bg-blue-50 dark:bg-blue-950/30"
        )}
      >
        <ChevronDown className={cn(
          "text-muted-foreground hover:text-blue-500 transition-colors",
          localUserVote === -1 && "text-blue-500",
          vertical ? "h-4 w-4" : "h-3 w-3"
        )} />
      </Button>
    </div>
  );
}
