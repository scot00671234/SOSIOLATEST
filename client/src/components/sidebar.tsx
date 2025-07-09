import { Link } from "wouter";
import { Users } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import type { Community } from "@shared/schema";

export default function Sidebar() {
  const { data: communities, isLoading } = useQuery<Community[]>({
    queryKey: ["/api/communities"],
  });

  if (isLoading) {
    return (
      <aside className="lg:col-span-1">
        <Card>
          <CardContent className="p-4">
            <h3 className="font-semibold text-lg mb-4">Communities</h3>
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
    <aside className="lg:col-span-1">
      <Card>
        <CardContent className="p-3 sm:p-4">
          <h3 className="font-semibold text-base sm:text-lg mb-3 sm:mb-4">Communities</h3>
          
          <div className="space-y-1 sm:space-y-2">
            {communities?.map((community) => (
              <Link 
                key={community.id} 
                href={`/c/${community.name}`}
                className="block py-2 px-2 sm:px-3 text-xs sm:text-sm hover:bg-muted rounded-lg transition-colors"
              >
                <Users className="h-3 sm:h-4 w-3 sm:w-4 text-muted-foreground mr-1 sm:mr-2 inline" />
                <span className="truncate">{community.name}</span>
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
