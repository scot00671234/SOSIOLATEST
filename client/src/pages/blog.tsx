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
    title: "Best Reddit Alternative 2025: Why Sosiol is Leading the Way",
    excerpt: "Discover the top Reddit alternative that preserves everything you love about community discussions while addressing the censorship concerns driving users away.",
    content: `
Are you searching for a Reddit alternative that actually delivers on the promise of free speech and community-driven content? In 2025, Sosiol has emerged as the leading platform for users seeking authentic discussions without arbitrary censorship.

Why Users Are Leaving Reddit

Reddit's increasing content restrictions have left many users feeling frustrated. Subreddits being banned, comments removed without clear explanations, and shadowbanning have created an environment where users feel they're walking on eggshells.

What Makes Sosiol Different

Sosiol preserves everything that made Reddit great while fixing its biggest problems:

• **Familiar Interface**: The same threaded comment system and voting mechanism you know and love
• **Community-Driven Moderation**: Communities self-regulate through voting rather than top-down censorship
• **Transparent Rules**: Clear, consistent guidelines that don't change overnight
• **No Shadowbanning**: You'll always know where you stand
• **Anonymous Usage**: Participate without creating accounts

Sosiol's voting system uses the proven Reddit-style "hot" algorithm that balances recency with popularity, ensuring quality content rises naturally without algorithmic manipulation.

Real Community Building

Unlike platforms that segment users into echo chambers, Sosiol encourages genuine cross-community interaction. Communities can establish their own culture while remaining part of the broader platform ecosystem.

The result is more authentic discussions where diverse perspectives can coexist. When people aren't afraid of arbitrary punishment, they contribute more thoughtfully to conversations.

**Ready to experience social media the way it should be? Join thousands of users who've already made Sosiol their primary platform for meaningful online discussions. Create your first community or join existing conversations today.**`,
    readTime: "4 min read",
    publishDate: "2025-08-14",
    category: "Platform",
    slug: "best-reddit-alternative-2025"
  },
  {
    id: "2", 
    title: "Free Speech Social Media Platform: Complete Guide to Uncensored Discussion",
    excerpt: "Everything you need to know about joining and thriving on free speech social media platforms that prioritize open dialogue over corporate censorship.",
    content: `
Tired of having your posts removed or shadowbanned for expressing legitimate opinions? Free speech social media platforms are gaining momentum as users seek alternatives to heavily moderated mainstream sites.

What is a Free Speech Social Media Platform?

A free speech social media platform prioritizes open dialogue and user expression over corporate content guidelines. These platforms typically feature:

• **Transparent Moderation**: Clear rules that don't change arbitrarily
• **Community Self-Governance**: Users vote on content quality rather than corporate moderators deciding
• **No Shadowbanning**: You always know if and why content was restricted
• **Diverse Perspectives**: Multiple viewpoints coexist in discussions

Why Choose Sosiol for Free Speech?

Sosiol stands out among free speech platforms because it combines principle with practicality:

**Technical Excellence**: Our platform uses proven Reddit-style voting algorithms and nested comment systems that users already understand and love.

**Anonymous Participation**: No account required - participate based on your ideas, not your identity.

**Community Focus**: Create and join communities around specific interests while maintaining broader platform freedom.

**Sustainable Model**: Optional text-based advertising supports the platform without compromising user experience.

Making the Most of Free Speech Platforms

Success on free speech platforms requires understanding that with freedom comes responsibility:

1. **Engage Thoughtfully**: Quality contributions get recognized through community voting
2. **Respect Community Culture**: Each community develops its own norms while respecting platform-wide principles
3. **Use Voting Wisely**: Help curate content by voting on posts and comments that add value

The Future of Online Discussion

As mainstream platforms become increasingly restrictive, free speech alternatives are becoming essential for maintaining open dialogue online. Platforms like Sosiol prove that you can have both free expression and quality discussions.

**Ready to experience truly free online discussion? Join Sosiol today and discover what social media feels like when your voice actually matters. Start by exploring our communities or create your own around topics you're passionate about.**`,
    readTime: "5 min read",
    publishDate: "2025-08-14",
    category: "Free Speech",
    slug: "free-speech-social-media-platform-guide"
  },
  {
    id: "3",
    title: "Social Media Without Censorship: Why Users Are Making the Switch", 
    excerpt: "Discover why millions are leaving mainstream platforms for uncensored social media alternatives and how to make the transition smoothly.",
    content: `
The exodus from mainstream social media is accelerating as users seek platforms that prioritize authentic expression over corporate-friendly content. If you're considering social media without censorship, you're not alone.

The Censorship Problem on Mainstream Platforms

Major social media platforms have implemented increasingly restrictive policies:

• **Arbitrary Rules**: Terms of service that can be interpreted broadly to remove content
• **Shadowbanning**: Content restriction without notification
• **Account Suspensions**: Losing years of content and connections for unclear violations
• **Algorithm Manipulation**: Artificially suppressing certain viewpoints

Why Choose Uncensored Social Media?

Platforms like Sosiol offer genuine alternatives:

**Authentic Conversations**: When people aren't afraid of arbitrary punishment, discussions become more honest and meaningful.

**Diverse Perspectives**: Multiple viewpoints can coexist, creating richer dialogue and better understanding between different groups.

**User Control**: Community-driven moderation through voting systems puts power in users' hands rather than corporate moderators.

**Transparent Operation**: Clear, consistent rules that don't change based on political pressure or advertiser demands.

Making the Transition

Switching to uncensored social media platforms is easier than you might think:

1. **Start Gradually**: Begin by cross-posting content to test the new platform
2. **Find Your Communities**: Look for groups focused on your interests
3. **Engage Authentically**: Contribute thoughtfully to build your reputation
4. **Invite Others**: Bring friends and followers to maintain connections

Sosiol's Approach to Free Expression

Our platform demonstrates that you can have both free speech and quality discussions:

• **Reddit-Style Interface**: Familiar voting and comment systems
• **Anonymous Participation**: No account required to join conversations  
• **Community Creation**: Start your own communities around any topic
• **Sustainable Model**: Text-based advertising that doesn't compromise user experience

**Ready to experience social media without fear of censorship? Join thousands who've already discovered the freedom of authentic online discussion on Sosiol. Explore our communities today and see what social media feels like when your voice truly matters.**`,
    readTime: "4 min read", 
    publishDate: "2025-08-14",
    category: "Free Speech",
    slug: "social-media-without-censorship"
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
    publishDate: "2025-08-14",
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
    publishDate: "2025-08-14",
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