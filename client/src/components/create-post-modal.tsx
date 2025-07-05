import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { apiRequest } from "@/lib/queryClient";
import type { Community } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";
import { Check, ChevronsUpDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { useLocation } from "wouter";

const createPostSchema = z.object({
  title: z.string().min(1, "Title is required").max(200, "Title too long"),
  content: z.string().min(1, "Content is required").max(5000, "Content too long"),
  communityId: z.string().min(1, "Please select a community"),
});

type CreatePostData = z.infer<typeof createPostSchema>;

interface CreatePostModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function CreatePostModal({ open, onOpenChange }: CreatePostModalProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [location] = useLocation();
  const [communityOpen, setCommunityOpen] = useState(false);

  const { data: communities, isLoading: communitiesLoading } = useQuery<Community[]>({
    queryKey: ["/api/communities"],
  });

  // Detect current community from URL
  const currentCommunityId = (() => {
    const match = location.match(/^\/community\/(\d+)/);
    return match ? match[1] : "";
  })();

  const form = useForm<CreatePostData>({
    resolver: zodResolver(createPostSchema),
    defaultValues: {
      title: "",
      content: "",
      communityId: currentCommunityId,
    },
  });

  const createPostMutation = useMutation({
    mutationFn: async (data: CreatePostData) => {
      return apiRequest("POST", "/api/posts", {
        title: data.title,
        content: data.content,
        communityId: parseInt(data.communityId),
      });
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Post created successfully!",
      });
      form.reset();
      onOpenChange(false);
      queryClient.invalidateQueries({ queryKey: ["/api/posts"] });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create post",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: CreatePostData) => {
    createPostMutation.mutate(data);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Create Post</DialogTitle>
        </DialogHeader>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="communityId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Community</FormLabel>
                  <Popover open={communityOpen} onOpenChange={setCommunityOpen}>
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button
                          variant="outline"
                          role="combobox"
                          aria-expanded={communityOpen}
                          className={cn(
                            "w-full justify-between",
                            !field.value && "text-muted-foreground"
                          )}
                        >
                          {field.value
                            ? communities?.find(
                                (community) => community.id.toString() === field.value
                              )?.name
                            : "Select a community"}
                          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                        </Button>
                      </FormControl>
                    </PopoverTrigger>
                    <PopoverContent className="w-full p-0">
                      <Command>
                        <CommandInput placeholder="Search communities..." />
                        <CommandEmpty>No community found.</CommandEmpty>
                        <CommandGroup>
                          {communities?.map((community) => (
                            <CommandItem
                              key={community.id}
                              value={community.name}
                              onSelect={() => {
                                form.setValue("communityId", community.id.toString());
                                setCommunityOpen(false);
                              }}
                            >
                              <Check
                                className={cn(
                                  "mr-2 h-4 w-4",
                                  field.value === community.id.toString()
                                    ? "opacity-100"
                                    : "opacity-0"
                                )}
                              />
                              {community.name}
                            </CommandItem>
                          ))}
                        </CommandGroup>
                      </Command>
                    </PopoverContent>
                  </Popover>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Title</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter post title..." {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="content"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Content</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Share your thoughts..."
                      className="resize-none"
                      rows={6}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <div className="flex justify-end space-x-3">
              <Button 
                type="button" 
                variant="ghost" 
                onClick={() => onOpenChange(false)}
                className="text-muted-foreground hover:text-foreground"
              >
                Cancel
              </Button>
              <Button 
                type="submit" 
                disabled={createPostMutation.isPending || communitiesLoading}
                className="bg-muted text-foreground hover:bg-muted/80 transition-all border border-border/50 hover:border-border/80 hover:shadow-sm"
              >
                {createPostMutation.isPending ? "Creating..." : "Create Post"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
