import { Link } from "wouter";
import { MessageCircle, Share } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
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
  return (
    <Card className="hover:bg-muted/50 transition-colors">
      <CardContent className="p-4">
        <div className="flex items-start space-x-3">
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
            
            <p className="text-muted-foreground mb-3 line-clamp-3">
              {post.content}
            </p>
            
            <div className="flex items-center space-x-4 text-sm text-muted-foreground">
              <Link href={`/post/${post.id}`}>
                <Button variant="ghost" size="sm" className="h-auto p-0 hover:text-primary">
                  <MessageCircle className="h-4 w-4 mr-1" />
                  {post.commentCount} comments
                </Button>
              </Link>
              <Button variant="ghost" size="sm" className="h-auto p-0 hover:text-primary">
                <Share className="h-4 w-4 mr-1" />
                Share
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
