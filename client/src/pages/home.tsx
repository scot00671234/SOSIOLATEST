import { useQuery } from "@tanstack/react-query";
import Header from "@/components/header";
import Sidebar from "@/components/sidebar";
import PostCard from "@/components/post-card";
import SponsoredAdComponent from "@/components/sponsored-ad";
import { Card, CardContent } from "@/components/ui/card";
import type { PostWithCommunity, SponsoredAd } from "@shared/schema";

export default function Home() {
  const { data: posts, isLoading } = useQuery<PostWithCommunity[]>({
    queryKey: ["/api/posts"],
  });

  const { data: currentAd } = useQuery<SponsoredAd | null>({
    queryKey: ["/api/active-ad"],
    refetchInterval: 30000, // Refetch every 30 seconds to get new ads
  });

  // Function to inject ads every 10 posts
  const createFeedWithAds = (posts: PostWithCommunity[], ad: SponsoredAd | null) => {
    if (!ad || !posts.length) return posts.map((post, index) => ({ type: 'post', content: post, key: `post-${index}` }));
    
    const feedItems: Array<{ type: 'post' | 'ad', content: PostWithCommunity | SponsoredAd, key: string }> = [];
    
    posts.forEach((post, index) => {
      feedItems.push({ type: 'post', content: post, key: `post-${index}` });
      
      // Inject ad every 10 posts (after positions 9, 19, 29, etc.)
      if ((index + 1) % 10 === 0) {
        feedItems.push({ type: 'ad', content: ad, key: `ad-${index}` });
      }
    });
    
    return feedItems;
  };

  const feedItems = posts ? createFeedWithAds(posts, currentAd) : [];

  return (
    <div className="min-h-screen bg-background transition-colors">
      <Header />
      
      <div className="max-w-6xl mx-auto px-3 sm:px-4 py-3 sm:py-6">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-3 sm:gap-6">
          {/* Sidebar - Hidden on mobile, shown as drawer */}
          <div className="hidden lg:block">
            <Sidebar />
          </div>
          
          <main className="lg:col-span-3">
            <Card className="border-border/50 shadow-sm">
              <CardContent className="p-3 sm:p-6">
                <h2 className="font-semibold text-lg sm:text-xl mb-3 sm:mb-4 tracking-tight">Popular Posts</h2>
                
                {isLoading ? (
                  <div className="space-y-3 sm:space-y-4">
                    {[1, 2, 3].map((i) => (
                      <div key={i} className="border rounded-lg p-3 sm:p-4">
                        <div className="animate-pulse space-y-2 sm:space-y-3">
                          <div className="h-3 sm:h-4 bg-muted rounded w-1/4"></div>
                          <div className="h-5 sm:h-6 bg-muted rounded w-3/4"></div>
                          <div className="h-3 sm:h-4 bg-muted rounded w-full"></div>
                          <div className="h-3 sm:h-4 bg-muted rounded w-2/3"></div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : feedItems.length ? (
                  <div className="space-y-3 sm:space-y-4">
                    {feedItems.map((item) => 
                      item.type === 'post' ? (
                        <PostCard key={item.key} post={item.content as PostWithCommunity} />
                      ) : (
                        <SponsoredAdComponent key={item.key} ad={item.content as SponsoredAd} />
                      )
                    )}
                  </div>
                ) : (
                  <div className="text-center py-6 sm:py-8">
                    <p className="text-muted-foreground text-sm sm:text-base">
                      No posts yet. Create the first post!
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
