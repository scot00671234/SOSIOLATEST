import { useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { Search, Users, Plus, Moon, Sun, Menu, X, MoreHorizontal, Info, Shield, AlertTriangle, MessageSquare } from "lucide-react";
import { useTheme } from "@/components/theme-provider";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
      <div className="max-h-[300px] overflow-y-auto space-y-1 pr-1 custom-scrollbar">
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
  const [showAbout, setShowAbout] = useState(false);
  const [showPrivacyPolicy, setShowPrivacyPolicy] = useState(false);
  const [showStaySafe, setShowStaySafe] = useState(false);
  const [showFeedback, setShowFeedback] = useState(false);
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

              <Button
                size="sm"
                onClick={() => setShowCreatePost(true)}
                className="bg-muted text-foreground hover:bg-muted/80 transition-all border border-border/50 hover:border-border/80 hover:shadow-sm"
              >
                <Plus className="h-4 w-4 mr-2" />
                <span className="hidden lg:inline">Post</span>
              </Button>

              {/* Three-dot menu */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
                    data-testid="menu-button"
                  >
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuItem 
                    onClick={() => setShowAbout(true)}
                    data-testid="about-menu-item"
                  >
                    <Info className="mr-2 h-4 w-4" />
                    <span>About</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem 
                    onClick={() => setShowPrivacyPolicy(true)}
                    data-testid="privacy-menu-item"
                  >
                    <Shield className="mr-2 h-4 w-4" />
                    <span>Privacy Policy</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem 
                    onClick={() => setShowStaySafe(true)}
                    data-testid="stay-safe-menu-item"
                  >
                    <AlertTriangle className="mr-2 h-4 w-4" />
                    <span>Stay Safe</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem 
                    onClick={() => setShowFeedback(true)}
                    data-testid="feedback-menu-item"
                  >
                    <MessageSquare className="mr-2 h-4 w-4" />
                    <span>Feedback</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
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
              
              {/* Mobile three-dot menu */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
                    data-testid="mobile-menu-button"
                  >
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuItem 
                    onClick={() => setShowAbout(true)}
                    data-testid="mobile-about-menu-item"
                  >
                    <Info className="mr-2 h-4 w-4" />
                    <span>About</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem 
                    onClick={() => setShowPrivacyPolicy(true)}
                    data-testid="mobile-privacy-menu-item"
                  >
                    <Shield className="mr-2 h-4 w-4" />
                    <span>Privacy Policy</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem 
                    onClick={() => setShowStaySafe(true)}
                    data-testid="mobile-stay-safe-menu-item"
                  >
                    <AlertTriangle className="mr-2 h-4 w-4" />
                    <span>Stay Safe</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem 
                    onClick={() => setShowFeedback(true)}
                    data-testid="mobile-feedback-menu-item"
                  >
                    <MessageSquare className="mr-2 h-4 w-4" />
                    <span>Feedback</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
              
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
                      className="w-full justify-start bg-muted text-foreground hover:bg-muted/80 transition-all border border-border/50 hover:border-border/80"
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Create Post
                    </Button>
                    <Button
                      variant="ghost"
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

      {/* About Dialog */}
      <Dialog open={showAbout} onOpenChange={setShowAbout}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Info className="h-5 w-5" />
              About Sosiol
            </DialogTitle>
          </DialogHeader>
          <DialogDescription className="text-base leading-relaxed space-y-4">
            <p>
              Sosiol is a free speech platform designed for open and anonymous discussions. 
              Share your thoughts, create communities, and engage in meaningful conversations 
              without barriers.
            </p>
            <p className="text-sm text-muted-foreground">
              Built with privacy and community in mind.
            </p>
          </DialogDescription>
        </DialogContent>
      </Dialog>

      {/* Privacy Policy Dialog */}
      <Dialog open={showPrivacyPolicy} onOpenChange={setShowPrivacyPolicy}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Privacy Policy
            </DialogTitle>
          </DialogHeader>
          <DialogDescription className="text-sm leading-relaxed space-y-3">
            <div>
              <h4 className="font-semibold text-foreground mb-2">Anonymous Social Media</h4>
              <p>
                Sosiol is designed as an anonymous social platform. We do not require or collect 
                personal information such as names, emails, or phone numbers for basic usage.
              </p>
            </div>
            
            <div>
              <h4 className="font-semibold text-foreground mb-2">Data Policy</h4>
              <p className="mb-3">
                We collect minimal information necessary to run Sosiol and keep it fair. This includes:
              </p>
              <ul className="list-disc pl-4 space-y-1 mb-3">
                <li>Temporary technical identifiers (such as IP addresses) to prevent duplicate voting and maintain system integrity.</li>
                <li>The posts and comments you create on the platform.</li>
              </ul>
              <p>
                Your information is used solely to operate the platform.
              </p>
            </div>
            
            <div>
              <h4 className="font-semibold text-foreground mb-2">Content Policy</h4>
              <p>
                While we support free speech, content that is illegal according to US law, 
                will be removed at our discretion.
              </p>
            </div>
            
            <p className="text-xs text-muted-foreground border-t pt-3">
              Last updated: August 2025
            </p>
          </DialogDescription>
        </DialogContent>
      </Dialog>

      {/* Stay Safe Dialog */}
      <Dialog open={showStaySafe} onOpenChange={setShowStaySafe}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5" />
              Stay Safe
            </DialogTitle>
          </DialogHeader>
          <DialogDescription className="text-base leading-relaxed space-y-4">
            <p>
              Remember: Sosiol supports free speech, but that doesn't mean your country's laws 
              will protect you the same way. Know your local laws before posting. Avoid sharing 
              personal details, and use a VPN if privacy is important to you. Stay smart, stay safe.
            </p>
          </DialogDescription>
        </DialogContent>
      </Dialog>

      {/* Feedback Dialog */}
      <Dialog open={showFeedback} onOpenChange={setShowFeedback}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <MessageSquare className="h-5 w-5" />
              Feedback
            </DialogTitle>
          </DialogHeader>
          <DialogDescription className="text-base leading-relaxed space-y-4">
            <p>
              We're always improving Sosiol, and your input matters. Join the Sosiol Feedback 
              community to share your ideas, report bugs, and suggest features. We read everything 
              and act on what helps make the platform better.
            </p>
            <div className="pt-2 border-t">
              <Link 
                href="/c/Sosiol Feedback"
                onClick={() => setShowFeedback(false)}
                className="inline-flex items-center gap-2 text-primary hover:underline font-medium"
              >
                <Users className="h-4 w-4" />
                Visit Sosiol Feedback Community
              </Link>
            </div>
          </DialogDescription>
        </DialogContent>
      </Dialog>
    </>
  );
}
