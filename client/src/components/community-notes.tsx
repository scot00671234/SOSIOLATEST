import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ExternalLink, ChevronUp, ChevronDown, Plus } from "lucide-react";
import { queryClient } from "@/lib/queryClient";
import { cn } from "@/lib/utils";
import AddCommunityNoteDialog from "@/components/add-community-note-dialog";
import type { CommunityNoteWithVote } from "@shared/schema";

interface CommunityNotesProps {
  postId: number;
}

export default function CommunityNotes({ postId }: CommunityNotesProps) {
  const [showAddNote, setShowAddNote] = useState(false);

  const { data: notes = [], isLoading } = useQuery<CommunityNoteWithVote[]>({
    queryKey: [`/api/posts/${postId}/notes`],
  });

  const voteMutation = useMutation({
    mutationFn: ({ noteId, voteType }: { noteId: number; voteType: 1 | -1 }) =>
      fetch(`/api/community-notes/${noteId}/vote`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ voteType }),
      }).then(res => res.json()),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/posts/${postId}/notes`] });
    },
  });

  const handleVote = (noteId: number, voteType: 1 | -1) => {
    voteMutation.mutate({ noteId, voteType });
  };

  if (isLoading) {
    return (
      <div className="mt-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">Community Notes</h3>
        </div>
        <div className="space-y-3">
          {[1, 2].map((i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-4">
                <div className="h-4 bg-muted rounded mb-2"></div>
                <div className="h-4 bg-muted rounded w-3/4"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="mt-6" data-testid="community-notes">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold">Community Notes</h3>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setShowAddNote(true)}
          data-testid="add-note-button"
        >
          <Plus className="w-4 h-4 mr-2" />
          Add Note
        </Button>
      </div>

      {notes.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="p-6 text-center text-muted-foreground">
            <p>No community notes yet.</p>
            <p className="text-sm mt-1">Be the first to suggest a helpful resource!</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {notes.map((note) => (
            <Card key={note.id} className="relative" data-testid={`note-${note.id}`}>
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-base font-medium mb-2">
                      <a
                        href={note.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 text-primary hover:underline"
                        data-testid={`note-link-${note.id}`}
                      >
                        {note.title}
                        <ExternalLink className="w-4 h-4" />
                      </a>
                    </CardTitle>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      {note.comment}
                    </p>
                  </div>
                  
                  <div className="flex flex-col items-center gap-1 ml-4">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleVote(note.id, 1)}
                      disabled={voteMutation.isPending}
                      className={cn(
                        "h-8 w-8 p-0 hover:bg-green-50 hover:text-green-600 dark:hover:bg-green-950",
                        note.userVote === 1 && "bg-green-50 text-green-600 dark:bg-green-950"
                      )}
                      data-testid={`upvote-note-${note.id}`}
                    >
                      <ChevronUp className="w-4 h-4" />
                    </Button>
                    
                    <span className="text-sm font-medium min-w-[20px] text-center">
                      {note.votes}
                    </span>
                    
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleVote(note.id, -1)}
                      disabled={voteMutation.isPending}
                      className={cn(
                        "h-8 w-8 p-0 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950",
                        note.userVote === -1 && "bg-red-50 text-red-600 dark:bg-red-950"
                      )}
                      data-testid={`downvote-note-${note.id}`}
                    >
                      <ChevronDown className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
            </Card>
          ))}
        </div>
      )}

      <AddCommunityNoteDialog
        open={showAddNote}
        onOpenChange={setShowAddNote}
        postId={postId}
      />
    </div>
  );
}