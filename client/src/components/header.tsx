import { useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { Search, Users, Plus, Moon, Sun, Menu, X } from "lucide-react";
import { useTheme } from "@/components/theme-provider";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import CreatePostModal from "./create-post-modal";
import CreateCommunityModal from "./create-community-modal";
import { useQuery } from "@tanstack/react-query";
import type { Community } from "@shared/schema";

function MobileCommunities({ onCommunityClick }: { onCommunityClick: () => void }) {
  const { data: communities, isLoading } = useQuery<Community[]>({
    queryKey: ["/api/communities"],
  });

  if (isLoading) {
    return (
      <div className="space-y-2">
        <h3 className="font-semibold text-sm text-muted-foreground px-1">Communities</h3>
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-8 bg-muted rounded animate-pulse" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <h3 className="font-semibold text-sm text-muted-foreground px-1">Communities</h3>
      <div className="space-y-1">
        {communities?.map((community) => (
          <Link 
            key={community.id} 
            href={`/c/${community.name}`}
            onClick={onCommunityClick}
            className="block py-2 px-3 text-sm hover:bg-muted rounded-lg transition-colors"
          >
            <Users className="h-4 w-4 text-muted-foreground mr-2 inline" />
            {community.name}
          </Link>
        ))}
        
        {!communities?.length && (
          <p className="text-xs text-muted-foreground py-3 px-1">
            No communities yet. Create the first one!
          </p>
        )}
      </div>
    </div>
  );
}

export default function Header() {
  const [location, navigate] = useLocation();
  const [showCreatePost, setShowCreatePost] = useState(false);
  const [showCreateCommunity, setShowCreateCommunity] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
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
        <div className="max-w-6xl mx-auto px-3 sm:px-4 py-3">
          <div className="flex items-center justify-between">
            {/* Logo */}
            <div className="flex items-center space-x-2 sm:space-x-4">
              <Link href="/">
                <h1 className="text-xl sm:text-2xl font-semibold text-foreground hover:text-muted-foreground cursor-pointer tracking-tight transition-colors">
                  Sosiol
                </h1>
              </Link>
            </div>
            
            {/* Desktop Search Bar */}
            <div className="hidden md:flex flex-1 max-w-md mx-4 lg:mx-8">
              <form onSubmit={handleSearch} className="relative w-full">
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
            
            {/* Desktop Action Buttons */}
            <div className="hidden md:flex items-center space-x-2">
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
                <span className="hidden lg:inline">Community</span>
              </Button>
              <Link href="/advertise">
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-muted-foreground hover:text-foreground hover:bg-muted/40 transition-all border border-border/30 hover:border-border/60"
                >
                  <span className="hidden lg:inline">Advertise</span>
                  <span className="lg:hidden">Ad</span>
                </Button>
              </Link>
              <Button
                size="sm"
                onClick={() => setShowCreatePost(true)}
                className="bg-muted text-foreground hover:bg-muted/80 transition-all border border-border/50 hover:border-border/80 hover:shadow-sm"
              >
                <Plus className="h-4 w-4 mr-2" />
                <span className="hidden lg:inline">Post</span>
              </Button>
            </div>

            {/* Mobile Menu Button */}
            <div className="flex md:hidden items-center space-x-2">
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
              <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
                <SheetTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
                  >
                    <Menu className="h-5 w-5" />
                  </Button>
                </SheetTrigger>
                <SheetContent side="right" className="w-[280px] sm:w-[320px]">
                  <div className="flex flex-col space-y-4 mt-4">
                    {/* Mobile Search */}
                    <form onSubmit={handleSearch} className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                      <Input
                        type="text"
                        placeholder="Search..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-10 rounded-full bg-muted/50 border-border/50"
                      />
                    </form>
                    
                    {/* Mobile Action Buttons */}
                    <Button
                      onClick={() => {
                        setShowCreatePost(true);
                        setMobileMenuOpen(false);
                      }}
                      className="w-full justify-start"
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Create Post
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => {
                        setShowCreateCommunity(true);
                        setMobileMenuOpen(false);
                      }}
                      className="w-full justify-start"
                    >
                      <Users className="h-4 w-4 mr-2" />
                      Create Community
                    </Button>
                    
                    {/* Mobile Communities List */}
                    <MobileCommunities onCommunityClick={() => setMobileMenuOpen(false)} />
                  </div>
                </SheetContent>
              </Sheet>
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
