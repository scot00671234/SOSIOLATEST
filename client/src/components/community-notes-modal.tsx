import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ExternalLink, ChevronUp, ChevronDown, Plus } from "lucide-react";
import { queryClient } from "@/lib/queryClient";
import { cn } from "@/lib/utils";
import AddCommunityNoteDialog from "@/components/add-community-note-dialog";
import type { CommunityNoteWithVote } from "@shared/schema";

interface CommunityNotesModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  postId: number;
}

export default function CommunityNotesModal({ 
  open, 
  onOpenChange, 
  postId 
}: CommunityNotesModalProps) {
  const [showAddNote, setShowAddNote] = useState(false);

  const { data: notes = [], isLoading } = useQuery<CommunityNoteWithVote[]>({
    queryKey: [`/api/posts/${postId}/notes`],
    enabled: open, // Only fetch when modal is open
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

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle>Community Notes</DialogTitle>
            <DialogDescription>
              Helpful resources suggested by the community for this post.
            </DialogDescription>
          </DialogHeader>

          <div className="flex justify-end mb-4">
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

          <div className="flex-1 overflow-y-auto">
            {isLoading ? (
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
            ) : notes.length === 0 ? (
              <Card className="border-dashed">
                <CardContent className="p-8 text-center text-muted-foreground">
                  <p>No community notes yet.</p>
                  <p className="text-sm mt-1">Be the first to suggest a helpful resource!</p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4 pr-2">
                {notes.map((note) => (
                  <Card key={note.id} className="relative" data-testid={`note-${note.id}`}>
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <CardTitle className="text-base font-medium mb-2">
                            {note.title}
                          </CardTitle>
                          <div className="mb-2">
                            <a
                              href={note.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
                              data-testid={`note-link-${note.id}`}
                            >
                              <span className="truncate max-w-[300px]">{note.url}</span>
                              <ExternalLink className="w-3 h-3 flex-shrink-0" />
                            </a>
                          </div>
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
          </div>
        </DialogContent>
      </Dialog>

      <AddCommunityNoteDialog
        open={showAddNote}
        onOpenChange={setShowAddNote}
        postId={postId}
      />
    </>
  );
}