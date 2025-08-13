import { Link } from "wouter";
import { Users } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { Community } from "@shared/schema";

export default function Sidebar() {
  const [sortBy, setSortBy] = useState<'alphabetic' | 'popular' | 'new'>('popular');
  
  const { data: communities, isLoading } = useQuery<Community[]>({
    queryKey: ["/api/communities", sortBy],
    queryFn: () => fetch(`/api/communities?sort=${sortBy}`).then(res => res.json())
  });

  if (isLoading) {
    return (
      <aside className="lg:col-span-1 min-w-0">
        <Card className="overflow-hidden">
          <CardContent className="p-3 sm:p-4 min-w-0">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-lg">Communities</h3>
              <div className="w-20 h-8 bg-muted rounded animate-pulse" />
            </div>
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
        <CardContent className="p-3 sm:p-4 min-w-0">
          <div className="flex items-center justify-between mb-3 sm:mb-4">
            <h3 className="font-semibold text-base sm:text-lg">Communities</h3>
            <Select value={sortBy} onValueChange={(value: 'alphabetic' | 'popular' | 'new') => setSortBy(value)}>
              <SelectTrigger className="w-[90px] h-8 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="popular">Popular</SelectItem>
                <SelectItem value="alphabetic">Alphabetic</SelectItem>
                <SelectItem value="new">New</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div className="space-y-1 sm:space-y-2">
            {communities?.map((community) => (
              <Link 
                key={community.id} 
                href={`/c/${community.name}`}
                className="flex items-center py-2 px-2 sm:px-3 text-xs sm:text-sm hover:bg-muted rounded-lg transition-colors min-w-0 max-w-full"
              >
                <Users className="h-3 sm:h-4 w-3 sm:w-4 text-muted-foreground mr-1 sm:mr-2 flex-shrink-0" />
                <span className="truncate min-w-0 flex-1" title={community.name}>
                  {community.name}
                </span>
              </Link>
            ))}
            
            {!communities?.length && (
              <p className="text-xs sm:text-sm text-muted-foreground py-3 sm:py-4">
                No communities yet. Create the first one!
              </p>
            )}
          </div>
        </CardContent>
      </Card>
    </aside>
  );
}
