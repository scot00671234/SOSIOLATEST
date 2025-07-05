import { useState } from "react";
import { Link, useLocation } from "wouter";
import { Search, Users, Plus } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import CreatePostModal from "./create-post-modal";
import CreateCommunityModal from "./create-community-modal";
import { useQuery } from "@tanstack/react-query";

export default function Header() {
  const [location, navigate] = useLocation();
  const [showCreatePost, setShowCreatePost] = useState(false);
  const [showCreateCommunity, setShowCreateCommunity] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  return (
    <>
      <header className="border-b border-border bg-white sticky top-0 z-50">
        <div className="max-w-4xl mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            {/* Logo */}
            <div className="flex items-center space-x-4">
              <Link href="/">
                <h1 className="text-2xl font-semibold text-primary cursor-pointer">
                  Sosiol
                </h1>
              </Link>
            </div>
            
            {/* Search Bar */}
            <div className="flex-1 max-w-md mx-8">
              <form onSubmit={handleSearch} className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <Input
                  type="text"
                  placeholder="Search posts, communities, comments..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 rounded-full bg-muted border-border focus:ring-2 focus:ring-primary focus:border-transparent"
                />
              </form>
            </div>
            
            {/* Action Buttons */}
            <div className="flex items-center space-x-3">
              <Button
                variant="ghost"
                onClick={() => setShowCreateCommunity(true)}
                className="text-primary hover:bg-muted"
              >
                <Users className="h-4 w-4 mr-2" />
                Create Community
              </Button>
              <Button
                onClick={() => setShowCreatePost(true)}
                className="bg-primary text-white hover:bg-blue-600"
              >
                <Plus className="h-4 w-4 mr-2" />
                Create Post
              </Button>
            </div>
          </div>
        </div>
      </header>

      <CreatePostModal 
        open={showCreatePost} 
        onOpenChange={setShowCreatePost} 
      />
      <CreateCommunityModal 
        open={showCreateCommunity} 
        onOpenChange={setShowCreateCommunity} 
      />
    </>
  );
}
