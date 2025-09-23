import { useState, useEffect } from "react";
import { useParams, Link, useLocation } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import Header from "@/components/header";
import Sidebar from "@/components/sidebar";
import VoteButton from "@/components/vote-button";
import Comment from "@/components/comment";
import CommunityNotesModal from "@/components/community-notes-modal";
import SortMenu from "@/components/sort-menu";
import LinkPreview from "@/components/link-preview";
import { Card, CardContent } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { FileText } from "lucide-react";
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
  const params = useParams<{ id?: string; title?: string; slug?: string }>();
  const [location, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [showCommunityNotes, setShowCommunityNotes] = useState(false);
  const [commentSort, setCommentSort] = useState<'hot' | 'new'>('hot');
  const [visibleComments, setVisibleComments] = useState(10); // Show first 10 comments by default

  // Determine if this is a slug-based or ID-based URL
  const isSlugBased = !!params.slug;
  const postId = params.id ? parseInt(params.id || "0") : 0;
  const postSlug = params.slug;

  // Scroll to top when navigating to post page
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [params.id, params.slug]);

  const { data: post, isLoading: postLoading } = useQuery<PostWithCommunity>({
    queryKey: isSlugBased ? ["/api/posts/by-slug", postSlug] : ["/api/posts", postId],
    queryFn: isSlugBased 
      ? () => fetch(`/api/posts/by-slug/${encodeURIComponent(postSlug!)}`).then(res => res.json())
      : () => fetch(`/api/posts/${postId}`).then(res => res.json()),
    enabled: isSlugBased ? !!postSlug : postId > 0,
  });

  // Canonical URL redirect: if accessed via ID but post has slug, redirect to slug URL
  useEffect(() => {
    if (post && !isSlugBased && post.slug) {
      // Replace current URL with canonical slug-based URL
      setLocation(`/post/${post.slug}`, { replace: true });
    }
  }, [post, isSlugBased, setLocation]);

  const { data: comments, isLoading: commentsLoading } = useQuery<CommentWithChildren[]>({
    queryKey: ["/api/posts", post?.id, "comments", commentSort],
    queryFn: () => fetch(`/api/posts/${post?.id}/comments?sort=${commentSort}`).then(res => res.json()),
    enabled: !!post?.id,
  });

  const handleCommentSortChange = (sort: 'hot' | 'new') => {
    setCommentSort(sort);
    setVisibleComments(10); // Reset to initial count when sorting changes
  };

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
        postId: post!.id,
        parentId: null,
      });
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Comment posted successfully!",
      });
      form.reset();
      queryClient.invalidateQueries({ queryKey: ["/api/posts", post!.id, "comments", commentSort] });
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
      <div className="min-h-screen bg-background transition-colors">
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
      <div className="min-h-screen bg-background transition-colors">
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
    <div className="min-h-screen bg-background transition-colors">
      <Header />
      
      <div className="max-w-4xl mx-auto px-4 py-6">
        <div className="lg:grid lg:grid-cols-4 lg:gap-6">
          <div className="hidden lg:block lg:col-span-1">
            <Sidebar />
          </div>
          
          <main className="w-full lg:col-span-3">
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
                        <Link href={`/c/${post.community.name}`} className="hover:underline">
                          {post.community.name}
                        </Link>
                        <span className="mx-2">•</span>
                        <span>{formatTimeAgo(post.createdAt)}</span>
                      </div>
                      
                      <h1 className="font-semibold text-2xl mb-4">
                        {post.title}
                      </h1>
                      
                      <div className="prose max-w-none mb-4">
                        <p className="whitespace-pre-wrap text-foreground">{post.content}</p>
                      </div>
                      
                      {/* Link Preview */}
                      {post.link && (
                        <LinkPreview
                          link={post.link}
                          linkTitle={post.linkTitle}
                          linkDescription={post.linkDescription}
                          linkImage={post.linkImage}
                          linkSiteName={post.linkSiteName}
                          compact={false}
                        />
                      )}
                      
                      {/* Community Notes Button */}
                      <div className="flex justify-end">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setShowCommunityNotes(true)}
                          className="text-muted-foreground hover:text-foreground"
                          data-testid="community-notes-button"
                        >
                          <FileText className="w-4 h-4 mr-2" />
                          Community Notes
                        </Button>
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
                          className="bg-muted text-foreground hover:bg-muted/80 transition-all border border-border/50 hover:border-border/80 hover:shadow-sm"
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
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-semibold text-lg">Comments</h3>
                    <SortMenu 
                      currentSort={commentSort}
                      onSortChange={handleCommentSortChange}
                    />
                  </div>
                  
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
                      {comments.slice(0, visibleComments).map((comment) => (
                        <Comment
                          key={comment.id}
                          comment={comment}
                          postId={post.id}
                        />
                      ))}
                      
                      {/* Load More Comments Button */}
                      {comments.length > visibleComments && (
                        <div className="text-center pt-4">
                          <button
                            onClick={() => setVisibleComments(prev => prev + 10)}
                            className="text-sm text-muted-foreground hover:text-foreground underline transition-colors"
                          >
                            Load {Math.min(comments.length - visibleComments, 10)} more comments ({comments.length - visibleComments} remaining)
                          </button>
                        </div>
                      )}
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

      {/* Community Notes Modal */}
      <CommunityNotesModal
        open={showCommunityNotes}
        onOpenChange={setShowCommunityNotes}
        postId={post?.id || 0}
      />
    </div>
  );
}
