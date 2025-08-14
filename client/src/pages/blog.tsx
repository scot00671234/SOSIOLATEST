import { useState } from "react";
import { Helmet } from "react-helmet";
import Header from "@/components/header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArrowRight, Calendar, Clock } from "lucide-react";

interface BlogPost {
  id: string;
  title: string;
  excerpt: string;
  content: string;
  readTime: string;
  publishDate: string;
  category: string;
  slug: string;
}

const blogPosts: BlogPost[] = [
  {
    id: "1",
    title: "Why Choose a Free Speech Alternative to Reddit",
    excerpt: "Discover how Sosiol provides the community-driven discussions you love without the censorship concerns that plague mainstream platforms.",
    content: `
In today's digital landscape, finding a platform that truly respects free speech while maintaining meaningful community discussions has become increasingly challenging. Traditional social media platforms often struggle to balance content moderation with genuine free expression, leaving users searching for alternatives.

Sosiol emerges as a compelling solution for those seeking a Reddit-style experience without the heavy-handed moderation that has frustrated many users. Our platform prioritizes open dialogue while still maintaining a respectful environment for diverse perspectives.

Unlike mainstream platforms that often implement broad content restrictions, Sosiol operates on the principle that the best response to speech you disagree with is more speech, not censorship. This approach fosters more authentic discussions and allows communities to self-regulate through voting mechanisms rather than top-down moderation.

The nested comment system that made Reddit popular remains intact on Sosiol, but with the added benefit of knowing your contributions won't be removed simply for expressing unpopular opinions. Each community can establish its own guidelines while still preserving the fundamental right to express diverse viewpoints.

For users tired of walking on eggshells or having their content unexpectedly removed, Sosiol offers a refreshing alternative where meaningful discussions can flourish without fear of arbitrary censorship.`,
    readTime: "4 min read",
    publishDate: "2024-01-15",
    category: "Platform",
    slug: "free-speech-alternative-reddit"
  },
  {
    id: "2", 
    title: "Building Communities Without Censorship: The Sosiol Approach",
    excerpt: "Learn how Sosiol empowers communities to self-govern while maintaining the engaging, threaded discussions that make social platforms valuable.",
    content: `
Community building thrives when members feel they can express themselves authentically without fear of censorship. Traditional platforms often struggle with this balance, implementing blanket policies that can stifle genuine conversation and community growth.

Sosiol takes a different approach by putting community governance in the hands of users themselves. Through our voting system and community-driven moderation tools, members can collectively decide what content adds value to their discussions without relying on algorithmic or corporate oversight.

This decentralized approach to community management creates more engaged user bases. When people know their voices matter and won't be arbitrarily silenced, they invest more deeply in building meaningful connections and contributing valuable content.

Our nested comment system allows for nuanced discussions that can explore complex topics from multiple angles. Unlike platforms that might remove entire comment threads for containing controversial viewpoints, Sosiol preserves these conversations so communities can engage with difficult topics thoughtfully.

The result is communities that feel more authentic and democratic. Users report feeling more connected to their fellow community members when they know everyone's playing by the same rules and that those rules are enforced consistently and transparently.

For community leaders looking to build engaged, active groups around shared interests, Sosiol provides the tools needed without the constant worry about platform policies changing overnight.`,
    readTime: "5 min read",
    publishDate: "2024-01-08",
    category: "Community",
    slug: "building-communities-without-censorship"
  },
  {
    id: "3",
    title: "The Power of Nested Comments in Free Speech Platforms", 
    excerpt: "Explore how threaded discussions create more meaningful conversations and why this format is essential for genuine free speech online.",
    content: `
Threaded, nested comments represent one of the most important innovations in online discussion formats. This system allows conversations to branch naturally, creating space for detailed exploration of topics while maintaining organizational clarity.

In the context of free speech platforms, nested comments become even more crucial. They allow minority viewpoints to find their place in discussions without being drowned out by popular opinions. Each branch of conversation can develop its own momentum and depth.

Sosiol's implementation of nested comments goes beyond simple threading. Our voting system allows communities to surface the most valuable contributions while still preserving less popular but potentially important perspectives in the thread structure.

This format proves particularly valuable for complex topics that require nuanced discussion. Rather than forcing all responses into a flat, chronological structure, nested comments let users respond directly to specific points, building more coherent and productive conversations.

The democratic nature of threaded discussions aligns perfectly with free speech principles. No single voice dominates the conversation, and multiple perspectives can coexist within the same thread, creating a richer discussion environment.

For users accustomed to platforms where comments can be hidden or removed, Sosiol's approach preserves the full context of discussions, allowing readers to form their own opinions based on complete information rather than curated selections.`,
    readTime: "3 min read", 
    publishDate: "2024-01-01",
    category: "Features",
    slug: "power-of-nested-comments"
  },
  {
    id: "4",
    title: "Social Media Without Algorithmic Manipulation",
    excerpt: "Discover how Sosiol lets users control their own content discovery through transparent sorting options instead of opaque algorithmic feeds.",
    content: `
Modern social media platforms increasingly rely on algorithmic feeds that determine what content users see, often prioritizing engagement over relevance or user preference. This approach can create echo chambers and manipulate user behavior in ways that aren't transparent or user-controlled.

Sosiol takes a fundamentally different approach by putting content discovery control directly in users' hands. Instead of mysterious algorithms deciding what you see, our platform offers clear, transparent sorting options that let you choose how to discover content.

Our "Hot" sorting algorithm follows Reddit's time-tested approach, balancing recency with popularity to surface trending discussions. The "New" sorting option ensures fresh content gets visibility, while community-based sorting helps users focus on specific topics of interest.

This transparency extends to our voting system, where user engagement directly determines content visibility without hidden algorithmic manipulation. What rises to the top does so because real people found it valuable, not because it met some corporate engagement metric.

The absence of algorithmic manipulation also means users can trust that their content feeds aren't being artificially influenced to promote certain viewpoints or commercial interests. The organic nature of content discovery creates more authentic community interactions.

For users frustrated with platforms that seem to hide content they want to see while promoting content that feels forced, Sosiol's transparent approach offers a refreshing alternative where user agency comes first.`,
    readTime: "4 min read",
    publishDate: "2023-12-28",
    category: "Technology", 
    slug: "social-media-without-algorithmic-manipulation"
  },
  {
    id: "5",
    title: "Creating Authentic Online Communities in 2024",
    excerpt: "Learn the key principles for building genuine online communities that prioritize real connections over metrics and engagement manipulation.",
    content: `
Authentic online communities have become increasingly rare as platforms prioritize metrics over meaningful connections. Building genuine communities requires intentional design choices that put user experience and authentic interaction ahead of engagement gaming.

Sosiol's approach to community building starts with the fundamental principle that real people should drive community growth, not artificial engagement boosters or algorithmic manipulation. This creates communities that feel more organic and sustainable over time.

The key to authentic communities lies in transparency and user agency. When community members understand how the platform works and have control over their experience, they can build more meaningful connections with others who share their interests.

Our community structure allows for self-governance while maintaining tools that help prevent abuse. This balance creates environments where people feel safe to express themselves authentically while still being part of a larger community conversation.

Unlike platforms that segment users into isolated bubbles, Sosiol encourages cross-community interaction while still allowing specialized spaces for niche interests. This design promotes both deep community connections and broader exposure to diverse perspectives.

The voting system serves as a democratic tool for community curation, allowing members to collectively determine what content adds value to their discussions. This community-driven approach creates stronger investment in maintaining positive community culture.

For anyone looking to build or join authentic online communities, understanding these principles can help identify platforms and spaces that prioritize genuine human connection over commercial metrics.`,
    readTime: "5 min read",
    publishDate: "2023-12-20",
    category: "Community",
    slug: "creating-authentic-online-communities-2024"
  }
];

export default function BlogPage() {
  const [selectedPost, setSelectedPost] = useState<BlogPost | null>(null);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  };

  return (
    <>
      <Helmet>
        <title>Blog - Free Speech Social Media Platform | Sosiol</title>
        <meta name="description" content="Explore articles about free speech social media, Reddit alternatives, community building without censorship, and creating authentic online discussions." />
        <meta name="keywords" content="free speech social media, reddit alternative, social media without censorship, nested comments, community platform, free speech platform, social network alternative" />
        <meta property="og:title" content="Sosiol Blog - Free Speech Social Media Insights" />
        <meta property="og:description" content="Discover insights about free speech platforms, community building, and authentic social media alternatives." />
        <meta property="og:type" content="website" />
      </Helmet>
      
      <div className="min-h-screen bg-background">
        <Header />
        
        <main className="max-w-6xl mx-auto px-4 py-8">
          {!selectedPost ? (
            <div>
              <div className="text-center mb-12">
                <h1 className="text-4xl font-bold text-foreground mb-4">
                  Sosiol Blog
                </h1>
                <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
                  Insights on free speech platforms, community building, and creating authentic online discussions
                </p>
              </div>

              <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
                {blogPosts.map((post) => (
                  <Card key={post.id} className="hover:shadow-lg transition-shadow cursor-pointer h-full flex flex-col" onClick={() => setSelectedPost(post)}>
                    <CardHeader className="flex-shrink-0">
                      <div className="flex items-center justify-between mb-2">
                        <Badge variant="secondary" className="text-xs">
                          {post.category}
                        </Badge>
                        <div className="flex items-center text-xs text-muted-foreground">
                          <Clock className="h-3 w-3 mr-1" />
                          {post.readTime}
                        </div>
                      </div>
                      <CardTitle className="text-lg line-clamp-2">{post.title}</CardTitle>
                      <div className="flex items-center text-xs text-muted-foreground">
                        <Calendar className="h-3 w-3 mr-1" />
                        {formatDate(post.publishDate)}
                      </div>
                    </CardHeader>
                    <CardContent className="flex-grow flex flex-col">
                      <p className="text-muted-foreground mb-4 line-clamp-3 flex-grow">
                        {post.excerpt}
                      </p>
                      <Button variant="ghost" size="sm" className="self-start p-0 h-auto font-medium text-primary hover:text-primary/80">
                        Read more <ArrowRight className="h-3 w-3 ml-1" />
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          ) : (
            <div className="max-w-4xl mx-auto">
              <Button 
                variant="ghost" 
                onClick={() => setSelectedPost(null)}
                className="mb-6 text-muted-foreground hover:text-foreground"
              >
                ← Back to Blog
              </Button>
              
              <article>
                <header className="mb-8">
                  <div className="flex items-center gap-4 mb-4">
                    <Badge variant="secondary">
                      {selectedPost.category}
                    </Badge>
                    <div className="flex items-center text-sm text-muted-foreground">
                      <Calendar className="h-4 w-4 mr-1" />
                      {formatDate(selectedPost.publishDate)}
                    </div>
                    <div className="flex items-center text-sm text-muted-foreground">
                      <Clock className="h-4 w-4 mr-1" />
                      {selectedPost.readTime}
                    </div>
                  </div>
                  <h1 className="text-4xl font-bold text-foreground mb-4">
                    {selectedPost.title}
                  </h1>
                  <p className="text-xl text-muted-foreground">
                    {selectedPost.excerpt}
                  </p>
                </header>
                
                <div className="prose prose-lg max-w-none dark:prose-invert">
                  {selectedPost.content.split('\n\n').map((paragraph, index) => (
                    paragraph.trim() && (
                      <p key={index} className="mb-6 text-foreground leading-relaxed">
                        {paragraph.trim()}
                      </p>
                    )
                  ))}
                </div>
              </article>
            </div>
          )}
        </main>
      </div>
    </>
  );
}