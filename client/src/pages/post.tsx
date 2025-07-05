import { useState } from "react";
import { useParams } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import Header from "@/components/header";
import Sidebar from "@/components/sidebar";
import VoteButton from "@/components/vote-button";
import Comment from "@/components/comment";
import { Card, CardContent } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from "@/components/ui/form";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { PostWithCommunity, CommentWithChildren } from "@shared/schema";

const commentSchema = z.object({
  content: z.string().min(1, "Comment cannot be empty").max(2000, "Comment too long"),
});

type CommentData = z.infer<typeof commentSchema>;

function formatTimeAgo(date: Date | string): string {
  const now = new Date();
  const postDate = new Date(date);
  const diffInSeconds = Math.floor((now.getTime() - postDate.getTime()) / 1000);
  
  if (diffInSeconds < 60) return "just now";
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} minutes ago`;
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} hours ago`;
  return `${Math.floor(diffInSeconds / 86400)} days ago`;
}

export default function PostPage() {
  const { id } = useParams<{ id: string }>();
  const postId = parseInt(id || "0");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: post, isLoading: postLoading } = useQuery<PostWithCommunity>({
    queryKey: ["/api/posts", postId],
    queryFn: () => fetch(`/api/posts/${postId}`).then(res => res.json()),
  });

  const { data: comments, isLoading: commentsLoading } = useQuery<CommentWithChildren[]>({
    queryKey: ["/api/posts", postId, "comments"],
    queryFn: () => fetch(`/api/posts/${postId}/comments`).then(res => res.json()),
  });

  const form = useForm<CommentData>({
    resolver: zodResolver(commentSchema),
    defaultValues: {
      content: "",
    },
  });

  const commentMutation = useMutation({
    mutationFn: async (data: CommentData) => {
      return apiRequest("POST", "/api/comments", {
        content: data.content,
        postId,
        parentId: null,
      });
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Comment posted successfully!",
      });
      form.reset();
      queryClient.invalidateQueries({ queryKey: ["/api/posts", postId, "comments"] });
      queryClient.invalidateQueries({ queryKey: ["/api/posts"] });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to post comment",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: CommentData) => {
    commentMutation.mutate(data);
  };

  if (postLoading) {
    return (
      <div className="min-h-screen bg-white">
        <Header />
        <div className="max-w-4xl mx-auto px-4 py-6">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-muted rounded w-3/4"></div>
            <div className="h-4 bg-muted rounded w-1/2"></div>
            <div className="h-32 bg-muted rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  if (!post) {
    return (
      <div className="min-h-screen bg-white">
        <Header />
        <div className="max-w-4xl mx-auto px-4 py-6">
          <Card>
            <CardContent className="p-8 text-center">
              <h1 className="text-2xl font-bold mb-2">Post Not Found</h1>
              <p className="text-muted-foreground">
                The post you're looking for doesn't exist.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      <Header />
      
      <div className="max-w-4xl mx-auto px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          <Sidebar />
          
          <main className="lg:col-span-3">
            <div className="space-y-6">
              {/* Post Content */}
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-start space-x-4">
                    {/* Vote Column */}
                    <VoteButton
                      targetType="post"
                      targetId={post.id}
                      currentVotes={post.votes}
                      vertical={true}
                    />
                    
                    {/* Post Content */}
                    <div className="flex-1">
                      <div className="flex items-center text-sm text-muted-foreground mb-3">
                        <span>{post.community.name}</span>
                        <span className="mx-2">•</span>
                        <span>{formatTimeAgo(post.createdAt)}</span>
                      </div>
                      
                      <h1 className="font-semibold text-2xl mb-4">
                        {post.title}
                      </h1>
                      
                      <div className="prose max-w-none">
                        <p className="whitespace-pre-wrap">{post.content}</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              {/* Comment Form */}
              <Card>
                <CardContent className="p-4">
                  <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-3">
                      <FormField
                        control={form.control}
                        name="content"
                        render={({ field }) => (
                          <FormItem>
                            <FormControl>
                              <Textarea
                                placeholder="Add a comment..."
                                className="resize-none"
                                rows={3}
                                {...field}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <div className="flex justify-end">
                        <Button 
                          type="submit" 
                          disabled={commentMutation.isPending || !form.watch("content")?.trim()}
                        >
                          {commentMutation.isPending ? "Posting..." : "Comment"}
                        </Button>
                      </div>
                    </form>
                  </Form>
                </CardContent>
              </Card>
              
              {/* Comments Section */}
              <Card>
                <CardContent className="p-4">
                  <h3 className="font-semibold text-lg mb-4">Comments</h3>
                  
                  {commentsLoading ? (
                    <div className="space-y-4">
                      {[1, 2, 3].map((i) => (
                        <div key={i} className="border rounded-lg p-4">
                          <div className="animate-pulse space-y-2">
                            <div className="h-3 bg-muted rounded w-1/4"></div>
                            <div className="h-4 bg-muted rounded w-full"></div>
                            <div className="h-4 bg-muted rounded w-3/4"></div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : comments?.length ? (
                    <div className="space-y-4">
                      {comments.map((comment) => (
                        <Comment
                          key={comment.id}
                          comment={comment}
                          postId={postId}
                        />
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <p className="text-muted-foreground">
                        No comments yet. Be the first to comment!
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}
