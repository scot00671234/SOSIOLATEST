import { Link, useLocation } from "wouter";
import { Users } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { Community } from "@shared/schema";

export default function Sidebar() {
  const [sortBy, setSortBy] = useState<'alphabetic' | 'popular' | 'new'>('popular');
  const [location] = useLocation();
  
  // Check if we're on a post page (format: /post/id or /post/id/title)
  const isPostPage = location.startsWith('/post/');
  
  const { data: communities, isLoading } = useQuery<Community[]>({
    queryKey: ["/api/communities", sortBy],
    queryFn: () => fetch(`/api/communities?sort=${sortBy}`).then(res => res.json())
  });

  if (isLoading) {
    return (
      <aside className="lg:col-span-1 min-w-0">
        <Card className="overflow-hidden">
          <CardContent className="p-4">
            {!isPostPage ? (
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-lg">Communities</h3>
                <div className="w-16 h-7 bg-muted rounded animate-pulse" />
              </div>
            ) : (
              <div className="mb-4">
                <h3 className="font-semibold text-lg">Communities</h3>
              </div>
            )}
            <div className="space-y-2">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="h-8 bg-muted rounded animate-pulse" />
              ))}
            </div>
          </CardContent>
        </Card>
      </aside>
    );
  }

  return (
    <aside className="lg:col-span-1 min-w-0">
      <Card className="overflow-hidden">
        <CardContent className="p-4">
          {!isPostPage ? (
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-lg">Communities</h3>
              <Select value={sortBy} onValueChange={(value: 'alphabetic' | 'popular' | 'new') => setSortBy(value)}>
                <SelectTrigger className="w-[90px] h-7 text-sm border border-border shadow-sm px-3 py-1.5">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="popular">Popular</SelectItem>
                  <SelectItem value="alphabetic">A-Z</SelectItem>
                  <SelectItem value="new">New</SelectItem>
                </SelectContent>
              </Select>
            </div>
          ) : (
            <div className="mb-4">
              <h3 className="font-semibold text-lg">Communities</h3>
            </div>
          )}
          
          <div className="space-y-2">
            {communities?.map((community) => (
              <Link 
                key={community.id} 
                href={`/c/${encodeURIComponent(community.name)}`}
                className="flex items-center py-2 px-3 text-sm hover:bg-muted rounded-lg transition-colors min-w-0"
              >
                <Users className="h-4 w-4 text-muted-foreground mr-2 flex-shrink-0" />
                <span className="truncate min-w-0 flex-1" title={community.name}>
                  {community.name}
                </span>
              </Link>
            ))}
            
            {!communities?.length && (
              <p className="text-sm text-muted-foreground py-4 text-center">
                No communities yet. Create the first one!
              </p>
            )}
          </div>
        </CardContent>
      </Card>
    </aside>
  );
}
