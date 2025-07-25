import { useParams } from "wouter";
import { useQuery } from "@tanstack/react-query";
import Header from "@/components/header";
import Sidebar from "@/components/sidebar";
import PostCard from "@/components/post-card";
import { Card, CardContent } from "@/components/ui/card";
import type { PostWithCommunity, Community } from "@shared/schema";

export default function CommunityPage() {
  const { id, name } = useParams<{ id?: string; name?: string }>();
  
  // Determine if we're using ID or name-based routing
  const isNameBased = !!name;
  const communityId = id ? parseInt(id) : 0;

  const { data: communities } = useQuery<Community[]>({
    queryKey: ["/api/communities"],
  });

  // Find community by either ID or name
  const community = isNameBased 
    ? communities?.find(c => c.name === name)
    : communities?.find(c => c.id === communityId);

  const actualCommunityId = community?.id || 0;

  const { data: posts, isLoading: postsLoading } = useQuery<PostWithCommunity[]>({
    queryKey: ["/api/posts", { communityId: actualCommunityId }],
    queryFn: () => fetch(`/api/posts?communityId=${actualCommunityId}`).then(res => res.json()),
    enabled: !!actualCommunityId,
  });

  return (
    <div className="min-h-screen bg-background transition-colors">
      <Header />
      
      <div className="max-w-6xl mx-auto px-3 sm:px-4 py-3 sm:py-6">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-3 sm:gap-6">
          <div className="hidden lg:block">
            <Sidebar />
          </div>
          
          <main className="lg:col-span-3">
            <Card>
              <CardContent className="p-3 sm:p-4">
                <div className="mb-4 sm:mb-6">
                  <h1 className="text-xl sm:text-2xl font-bold mb-1 sm:mb-2">
                    {community?.name || "Community"}
                  </h1>
                  <p className="text-muted-foreground text-sm sm:text-base">
                    Posts from this community
                  </p>
                </div>
                
                {postsLoading ? (
                  <div className="space-y-4">
                    {[1, 2, 3].map((i) => (
                      <div key={i} className="border rounded-lg p-4">
                        <div className="animate-pulse space-y-3">
                          <div className="h-4 bg-muted rounded w-1/4"></div>
                          <div className="h-6 bg-muted rounded w-3/4"></div>
                          <div className="h-4 bg-muted rounded w-full"></div>
                          <div className="h-4 bg-muted rounded w-2/3"></div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : posts?.length ? (
                  <div className="space-y-4">
                    {posts.map((post) => (
                      <PostCard key={post.id} post={post} />
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <p className="text-muted-foreground">
                      No posts in this community yet. Be the first to post!
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </main>
        </div>
      </div>
    </div>
  );
}
