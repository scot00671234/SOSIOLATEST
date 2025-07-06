import { Link } from "wouter";
import { MessageCircle, Share, Copy, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { useToast } from "@/hooks/use-toast";
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
    const url = `${window.location.origin}/post/${post.id}`;
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

  return (
    <Card className="hover:bg-muted/30 transition-all duration-200 border-border/50 shadow-sm hover:shadow-md">
      <CardContent className="p-5">
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
            <div className="flex items-center text-xs text-muted-foreground mb-2">
              <Link href={`/community/${post.community.id}`} className="hover:underline">
                {post.community.name}
              </Link>
              <span className="mx-2">•</span>
              <span>{formatTimeAgo(post.createdAt)}</span>
            </div>
            
            <Link href={`/post/${post.id}`}>
              <h3 className="font-semibold text-lg mb-2 cursor-pointer hover:text-primary">
                {post.title}
              </h3>
            </Link>
            
            <p className="text-muted-foreground dark:text-gray-300 mb-3 line-clamp-3">
              {post.content}
            </p>
            
            <div className="flex items-center space-x-4 text-sm text-muted-foreground">
              <Link href={`/post/${post.id}`}>
                <Button variant="ghost" size="sm" className="h-auto p-0 text-muted-foreground hover:text-foreground transition-colors">
                  <MessageCircle className="h-4 w-4 mr-1" />
                  {post.commentCount} comments
                </Button>
              </Link>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="h-auto p-0 text-muted-foreground hover:text-foreground transition-colors"
                  >
                    <Share className="h-4 w-4 mr-1" />
                    Share
                  </Button>
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
      </CardContent>
    </Card>
  );
}
