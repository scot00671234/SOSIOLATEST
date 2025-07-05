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
        <CardContent className="p-4">
          <h3 className="font-semibold text-lg mb-4">Communities</h3>
          
          <div className="space-y-2">
            {communities?.map((community) => (
              <Link 
                key={community.id} 
                href={`/community/${community.id}`}
                className="block py-2 px-3 text-sm hover:bg-muted rounded-lg transition-colors"
              >
                <Users className="h-4 w-4 text-muted-foreground mr-2 inline" />
                {community.name}
              </Link>
            ))}
            
            {!communities?.length && (
              <p className="text-sm text-muted-foreground py-4">
                No communities yet. Create the first one!
              </p>
            )}
          </div>
        </CardContent>
      </Card>
    </aside>
  );
}
