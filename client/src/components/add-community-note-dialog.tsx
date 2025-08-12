import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { insertCommunityNoteSchema } from "@shared/schema";
import { z } from "zod";

const noteFormSchema = insertCommunityNoteSchema;

type NoteFormData = z.infer<typeof noteFormSchema>;

interface AddCommunityNoteDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  postId: number;
}

export default function AddCommunityNoteDialog({ 
  open, 
  onOpenChange, 
  postId 
}: AddCommunityNoteDialogProps) {
  const { toast } = useToast();
  const [charCount, setCharCount] = useState(0);

  const form = useForm<NoteFormData>({
    resolver: zodResolver(noteFormSchema),
    defaultValues: {
      postId,
      title: "",
      url: "",
      comment: "",
    },
  });

  const createNoteMutation = useMutation({
    mutationFn: (data: NoteFormData) =>
      fetch("/api/community-notes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      }).then(res => res.json()),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/posts/${postId}/notes`] });
      onOpenChange(false);
      form.reset();
      setCharCount(0);
      toast({
        title: "Community note added",
        description: "Your resource has been added to help other users.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to add community note. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleCommentChange = (value: string) => {
    setCharCount(value.length);
    return value;
  };

  const onSubmit = (data: NoteFormData) => {
    createNoteMutation.mutate(data);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-foreground">Add Community Note</DialogTitle>
          <DialogDescription className="text-muted-foreground">
            Suggest a helpful resource (article, video, study) related to this post. 
            High-quality resources will be voted up by the community.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 pb-4">
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-foreground">Resource Title</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="e.g., Comprehensive Guide to React Hooks"
                      className="bg-card border-border text-foreground placeholder:text-muted-foreground"
                      {...field}
                      data-testid="input-note-title"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="url"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-foreground">URL</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="https://example.com, youtube.com/watch?v=..., /local-path"
                      className="bg-card border-border text-foreground placeholder:text-muted-foreground"
                      {...field}
                      data-testid="input-note-url"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="comment"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-foreground">
                    Comment ({charCount}/200 characters)
                  </FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Briefly explain why this resource is helpful and relevant..."
                      className="min-h-[100px] bg-card border-border text-foreground placeholder:text-muted-foreground"
                      {...field}
                      onChange={(e) => {
                        const value = handleCommentChange(e.target.value);
                        field.onChange(value);
                      }}
                      data-testid="textarea-note-comment"
                    />
                  </FormControl>
                  <FormMessage />
                  {charCount > 200 && (
                    <p className="text-sm text-destructive">
                      Comment exceeds 200 character limit
                    </p>
                  )}
                </FormItem>
              )}
            />

            <div className="flex justify-end space-x-2 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={createNoteMutation.isPending}
                data-testid="button-cancel-note"
                className="border-border text-foreground hover:bg-muted"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={createNoteMutation.isPending || charCount > 200}
                data-testid="button-submit-note"
                className="bg-foreground text-background hover:bg-foreground/90"
              >
                {createNoteMutation.isPending ? "Adding..." : "Add Note"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}