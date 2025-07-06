import { useState, useEffect } from "react";
import { useLocation, Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import Header from "@/components/header";
import Sidebar from "@/components/sidebar";
import PostCard from "@/components/post-card";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MessageCircle, Users, FileText } from "lucide-react";
import type { PostWithCommunity, Community, Comment } from "@shared/schema";

export default function SearchPage() {
  const [location] = useLocation();
  const [query, setQuery] = useState('');
  
  // Update query when location changes
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const newQuery = urlParams.get('q') || '';
    setQuery(newQuery);
  }, [location]);

  const { data: searchResults, isLoading, error } = useQuery<{
    posts: PostWithCommunity[];
    communities: Community[];
    comments: Comment[];
  }>({
    queryKey: ['search', query],
    queryFn: async () => {
      const response = await fetch(`/api/search?q=${encodeURIComponent(query)}`);
      if (!response.ok) throw new Error('Search failed');
      return response.json();
    },
    enabled: !!query.trim(),
  });

  if (!query.trim()) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="max-w-4xl mx-auto px-4 py-6">
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            <Sidebar />
            <main className="lg:col-span-3">
              <Card>
                <CardContent className="p-8 text-center">
                  <h1 className="text-2xl font-semibold mb-2">Search Sosiol</h1>
                  <p className="text-muted-foreground">
                    Enter a search term to find posts, communities, and comments.
                  </p>
                </CardContent>
              </Card>
            </main>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <div className="max-w-4xl mx-auto px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          <Sidebar />
          
          <main className="lg:col-span-3">
            <div className="space-y-6">
              <Card>
                <CardContent className="p-4">
                  <h1 className="text-xl font-semibold mb-4">
                    Search results for "{query}"
                  </h1>
                  
                  {isLoading ? (
                    <div className="space-y-4">
                      {[1, 2, 3].map((i) => (
                        <div key={i} className="border rounded-lg p-4">
                          <div className="animate-pulse space-y-3">
                            <div className="h-4 bg-muted rounded w-1/4"></div>
                            <div className="h-6 bg-muted rounded w-3/4"></div>
                            <div className="h-4 bg-muted rounded w-full"></div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="space-y-6">
                      {/* Communities */}
                      {searchResults?.communities && searchResults.communities.length > 0 && (
                        <div>
                          <h3 className="font-medium text-lg mb-3 flex items-center gap-2">
                            <Users className="h-5 w-5" />
                            Communities
                          </h3>
                          <div className="space-y-2">
                            {searchResults.communities.map((community) => (
                              <Link key={community.id} href={`/c/${community.name}`}>
                                <Card className="hover:bg-muted/50 transition-colors cursor-pointer">
                                  <CardContent className="p-3">
                                    <div className="flex items-center justify-between">
                                      <div>
                                        <h4 className="font-medium">c/{community.name}</h4>
                                        {community.description && (
                                          <p className="text-sm text-muted-foreground mb-1">
                                            {community.description}
                                          </p>
                                        )}
                                        <p className="text-xs text-muted-foreground">
                                          Created {new Date(community.createdAt).toLocaleDateString()}
                                        </p>
                                      </div>
                                      <Badge variant="secondary">Community</Badge>
                                    </div>
                                  </CardContent>
                                </Card>
                              </Link>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Posts */}
                      {searchResults?.posts && searchResults.posts.length > 0 && (
                        <div>
                          <h3 className="font-medium text-lg mb-3 flex items-center gap-2">
                            <FileText className="h-5 w-5" />
                            Posts
                          </h3>
                          <div className="space-y-4">
                            {searchResults.posts.map((post) => (
                              <PostCard key={post.id} post={post} />
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Comments */}
                      {searchResults?.comments && searchResults.comments.length > 0 && (
                        <div>
                          <h3 className="font-medium text-lg mb-3 flex items-center gap-2">
                            <MessageCircle className="h-5 w-5" />
                            Comments
                          </h3>
                          <div className="space-y-2">
                            {searchResults.comments.map((comment) => (
                              <Link key={comment.id} href={`/posts/${comment.postId}`}>
                                <Card className="hover:bg-muted/50 transition-colors cursor-pointer">
                                  <CardContent className="p-3">
                                    <div className="flex items-center justify-between">
                                      <div className="flex-1">
                                        <p className="text-sm line-clamp-2">{comment.content}</p>
                                        <p className="text-xs text-muted-foreground mt-1">
                                          {comment.votes} votes • {new Date(comment.createdAt).toLocaleDateString()}
                                        </p>
                                      </div>
                                      <Badge variant="outline">Comment</Badge>
                                    </div>
                                  </CardContent>
                                </Card>
                              </Link>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* No results */}
                      {searchResults && 
                       searchResults.posts.length === 0 && 
                       searchResults.communities.length === 0 && 
                       searchResults.comments.length === 0 && (
                        <div className="text-center py-8">
                          <p className="text-muted-foreground">
                            No results found for "{query}". Try different keywords.
                          </p>
                        </div>
                      )}
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