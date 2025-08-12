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

const noteFormSchema = insertCommunityNoteSchema.extend({
  comment: z.string().min(1, "Comment is required").max(1000, "Comment cannot exceed 1000 characters")
});

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
  const [wordCount, setWordCount] = useState(0);

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
      setWordCount(0);
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
    const words = value.trim() ? value.trim().split(/\s+/).length : 0;
    setWordCount(words);
    return value;
  };

  const onSubmit = (data: NoteFormData) => {
    createNoteMutation.mutate(data);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Add Community Note</DialogTitle>
          <DialogDescription>
            Suggest a helpful resource (article, video, study) related to this post. 
            High-quality resources will be voted up by the community.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Resource Title</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="e.g., Comprehensive Guide to React Hooks"
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
                  <FormLabel>URL</FormLabel>
                  <FormControl>
                    <Input
                      type="url"
                      placeholder="https://example.com/article"
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
                  <FormLabel>
                    Comment ({wordCount}/200 words)
                  </FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Briefly explain why this resource is helpful and relevant..."
                      className="min-h-[100px]"
                      {...field}
                      onChange={(e) => {
                        const value = handleCommentChange(e.target.value);
                        field.onChange(value);
                      }}
                      data-testid="textarea-note-comment"
                    />
                  </FormControl>
                  <FormMessage />
                  {wordCount > 200 && (
                    <p className="text-sm text-destructive">
                      Comment exceeds 200 word limit
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
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={createNoteMutation.isPending || wordCount > 200}
                data-testid="button-submit-note"
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