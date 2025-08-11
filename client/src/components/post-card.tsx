import { Link } from "wouter";
import { MessageCircle, Share, Copy, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { useToast } from "@/hooks/use-toast";
import { createPostSlug } from "@/lib/utils";
import VoteButton from "./vote-button";
import type { PostWithCommunity } from "@shared/schema";

interface PostCardProps {
  post: PostWithCommunity;
}

function formatTimeAgo(date: Date | string): string {
  const now = new Date();
  const postDate = new Date(date);
  const diffInSeconds = Math.floor((now.getTime() - postDate.getTime()) / 1000);
  
  if (diffInSeconds < 60) return "just now";
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} minutes ago`;
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} hours ago`;
  return `${Math.floor(diffInSeconds / 86400)} days ago`;
}

export default function PostCard({ post }: PostCardProps) {
  const { toast } = useToast();

  const handleShare = async (type: string) => {
    const titleSlug = createPostSlug(post.title);
    const url = `${window.location.origin}/post/${post.id}/${titleSlug}`;
    const title = post.title;
    const text = `Check out this post: ${title}`;

    switch (type) {
      case 'copy':
        try {
          await navigator.clipboard.writeText(url);
          toast({
            title: "Link copied!",
            description: "Post link has been copied to clipboard",
          });
        } catch (err) {
          toast({
            title: "Failed to copy",
            description: "Please try again",
            variant: "destructive",
          });
        }
        break;
      case 'twitter':
        window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`, '_blank');
        break;
      case 'facebook':
        window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`, '_blank');
        break;
      case 'linkedin':
        window.open(`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`, '_blank');
        break;
      case 'reddit':
        window.open(`https://www.reddit.com/submit?url=${encodeURIComponent(url)}&title=${encodeURIComponent(title)}`, '_blank');
        break;
    }
  };

  const postUrl = `/post/${post.id}/${createPostSlug(post.title)}`;

  return (
    <Link href={postUrl} className="block">
      <Card className="hover:bg-muted/30 transition-all duration-200 border-border/50 shadow-sm hover:shadow-md group cursor-pointer">
        <CardContent className="p-3 sm:p-5">
          <div className="flex items-start space-x-2 sm:space-x-4">
            {/* Vote Column */}
            <div className="flex-shrink-0" onClick={(e) => e.stopPropagation()}>
              <VoteButton
                targetType="post"
                targetId={post.id}
                currentVotes={post.votes}
                vertical={true}
              />
            </div>
            
            {/* Post Content */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center text-xs text-muted-foreground mb-1 sm:mb-2">
                <span 
                  className="hover:underline truncate cursor-pointer" 
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    window.location.href = `/c/${post.community.name}`;
                  }}
                >
                  {post.community.name}
                </span>
                <span className="mx-1 sm:mx-2">•</span>
                <span className="truncate">{formatTimeAgo(post.createdAt)}</span>
              </div>
              
              <h3 className="font-semibold text-base sm:text-lg mb-1 sm:mb-2 group-hover:text-primary line-clamp-2 transition-colors">
                {post.title}
              </h3>
              
              <p className="text-foreground mb-2 sm:mb-3 line-clamp-2 sm:line-clamp-3 text-sm sm:text-base">
                {post.content}
              </p>
              
              <div className="flex items-center space-x-2 sm:space-x-4 text-xs sm:text-sm text-muted-foreground">
                <div className="flex items-center">
                  <MessageCircle className="h-3 sm:h-4 w-3 sm:w-4 mr-1" />
                  <span className="hidden xs:inline">{post.commentCount} comments</span>
                  <span className="xs:hidden">{post.commentCount}</span>
                </div>
                <div 
                  className="flex items-center cursor-pointer hover:text-foreground transition-colors"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                  }}
                >
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <div className="flex items-center">
                        <Share className="h-3 sm:h-4 w-3 sm:w-4 mr-1" />
                        <span className="hidden sm:inline">Share</span>
                      </div>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="start">
                      <DropdownMenuItem onClick={() => handleShare('copy')}>
                        <Copy className="h-4 w-4 mr-2" />
                        Copy Link
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleShare('twitter')}>
                        <ExternalLink className="h-4 w-4 mr-2" />
                        Share on X (Twitter)
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleShare('facebook')}>
                        <ExternalLink className="h-4 w-4 mr-2" />
                        Share on Facebook
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleShare('linkedin')}>
                        <ExternalLink className="h-4 w-4 mr-2" />
                        Share on LinkedIn
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleShare('reddit')}>
                        <ExternalLink className="h-4 w-4 mr-2" />
                        Share on Reddit
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
