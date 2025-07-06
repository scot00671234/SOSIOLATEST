import { useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { Search, Users, Plus, Moon, Sun } from "lucide-react";
import { useTheme } from "@/components/theme-provider";
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
  const { theme, toggleTheme } = useTheme();

  // Update search query when on search page
  useEffect(() => {
    if (location.startsWith('/search')) {
      const urlParams = new URLSearchParams(window.location.search);
      const query = urlParams.get('q') || '';
      setSearchQuery(query);
    } else {
      // Clear search query when not on search page
      setSearchQuery('');
    }
  }, [location]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      const searchUrl = `/search?q=${encodeURIComponent(searchQuery.trim())}`;
      
      // If we're already on search page, force reload to update query
      if (location.startsWith('/search')) {
        window.location.href = searchUrl;
      } else {
        navigate(searchUrl);
      }
    }
  };

  return (
    <>
      <header className="border-b border-border bg-card/80 backdrop-blur-sm sticky top-0 z-50 transition-colors">
        <div className="max-w-4xl mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            {/* Logo */}
            <div className="flex items-center space-x-4">
              <Link href="/">
                <h1 className="text-2xl font-semibold text-foreground hover:text-muted-foreground cursor-pointer tracking-tight transition-colors">
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
                  className="pl-10 rounded-full bg-muted/50 border-border/50 focus:ring-2 focus:ring-primary/50 focus:border-primary/50 transition-all text-black placeholder:text-muted-foreground"
                />
              </form>
            </div>
            
            {/* Action Buttons */}
            <div className="flex items-center space-x-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={toggleTheme}
                className="text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
              >
                {theme === "light" ? (
                  <Moon className="h-4 w-4" />
                ) : (
                  <Sun className="h-4 w-4" />
                )}
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowCreateCommunity(true)}
                className="text-muted-foreground hover:text-foreground hover:bg-muted/40 transition-all border border-border/30 hover:border-border/60"
              >
                <Users className="h-4 w-4 mr-2" />
                Community
              </Button>
              <Button
                size="sm"
                onClick={() => setShowCreatePost(true)}
                className="bg-muted text-foreground hover:bg-muted/80 transition-all border border-border/50 hover:border-border/80 hover:shadow-sm"
              >
                <Plus className="h-4 w-4 mr-2" />
                Post
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
