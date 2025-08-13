import { Link } from "wouter";
import { Users, ChevronDown, ChevronUp } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import type { Community } from "@shared/schema";

export default function Sidebar() {
  const [sortBy, setSortBy] = useState<'alphabetic' | 'popular' | 'new'>('popular');
  const [isExpanded, setIsExpanded] = useState(false);
  
  const { data: communities, isLoading } = useQuery<Community[]>({
    queryKey: ["/api/communities", sortBy],
    queryFn: () => fetch(`/api/communities?sort=${sortBy}`).then(res => res.json())
  });

  if (isLoading) {
    return (
      <aside className="lg:col-span-1 min-w-0">
        <Card className="overflow-hidden">
          <CardContent className="p-2">
            <Button
              variant="ghost"
              size="sm"
              className="w-full justify-center p-2"
              disabled
            >
              <ChevronDown className="h-4 w-4 animate-pulse" />
            </Button>
          </CardContent>
        </Card>
      </aside>
    );
  }

  return (
    <aside className="lg:col-span-1 min-w-0">
      <Card className="overflow-hidden">
        <CardContent className="p-2">
          {/* Collapsed state - just the toggle button */}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsExpanded(!isExpanded)}
            className="w-full justify-center p-2 hover:bg-muted"
          >
            {isExpanded ? (
              <ChevronUp className="h-4 w-4" />
            ) : (
              <ChevronDown className="h-4 w-4" />
            )}
          </Button>
          
          {/* Expanded state - show communities */}
          {isExpanded && (
            <div className="mt-2 pt-2 border-t">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-semibold text-sm">Communities</h3>
                <Select value={sortBy} onValueChange={(value: 'alphabetic' | 'popular' | 'new') => setSortBy(value)}>
                  <SelectTrigger className="w-[80px] h-7 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="popular">Popular</SelectItem>
                    <SelectItem value="alphabetic">Alphabetic</SelectItem>
                    <SelectItem value="new">New</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-1 max-h-48 overflow-y-auto">
                {communities?.map((community) => (
                  <Link 
                    key={community.id} 
                    href={`/c/${community.name}`}
                    className="flex items-center py-1.5 px-2 text-xs hover:bg-muted rounded-md transition-colors min-w-0 max-w-full"
                  >
                    <Users className="h-3 w-3 text-muted-foreground mr-1.5 flex-shrink-0" />
                    <span className="truncate min-w-0 flex-1" title={community.name}>
                      {community.name}
                    </span>
                  </Link>
                ))}
                
                {!communities?.length && (
                  <p className="text-xs text-muted-foreground py-3 px-2">
                    No communities yet. Create the first one!
                  </p>
                )}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </aside>
  );
}
