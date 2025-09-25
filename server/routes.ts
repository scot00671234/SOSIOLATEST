import type { Express, Request } from "express";
import { createServer, type Server } from "http";
import Stripe from "stripe";
import { db } from "./db";
import { storage } from "./storage";
import { createAdSchema, insertCommunityNoteSchema } from "@shared/schema";
import { insertCommunitySchema, insertPostSchema, insertCommentSchema } from "@shared/schema";
import { eq } from "drizzle-orm";
import { communityNotes } from "@shared/schema";
import { z } from "zod";
import { extractLinkPreview, isValidUrl } from "./linkPreview";

// Extend Express Request interface for rate limiting
declare global {
  namespace Express {
    interface Request {
      clientIP?: string;
      recordRateLimit?: () => void;
    }
  }
}

// Initialize Stripe
const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
let stripe: Stripe | null = null;

if (stripeSecretKey) {
  stripe = new Stripe(stripeSecretKey, {
    apiVersion: "2025-06-30.basil",
  });
} else {
  console.warn("STRIPE_SECRET_KEY environment variable not set. Stripe payments will be disabled.");
}

function getClientIP(req: any): string {
  // Use X-Forwarded-For header first (for proxies), then req.ip (when trust proxy is set)
  const forwarded = req.headers['x-forwarded-for'];
  if (forwarded) {
    // X-Forwarded-For can contain multiple IPs, take the first one
    const ip = forwarded.split(',')[0].trim();
    if (ip) return ip;
  }
  
  // Fallback to Express req.ip (works when trust proxy is enabled)
  if (req.ip && req.ip !== '::1' && req.ip !== '127.0.0.1') {
    return req.ip;
  }
  
  // Last resort fallbacks
  return req.connection?.remoteAddress || 
         req.socket?.remoteAddress || 
         req.headers['x-real-ip'] ||
         `fallback-${Date.now()}-${Math.random()}`; // Generate unique fallback for testing
}

// Rate limiting store - tracks IP addresses and their actions
interface RateLimitEntry {
  timestamps: number[];
}

const rateLimitStore = new Map<string, {
  communities: RateLimitEntry;
  posts: RateLimitEntry;
  comments: RateLimitEntry;
}>();

// Rate limit configurations
const RATE_LIMITS = {
  communities: { maxActions: 5, windowMs: 60 * 60 * 1000 }, // 5 per hour
  posts: { maxActions: 4, windowMs: 60 * 60 * 1000 }, // 4 per hour
  comments: { maxActions: 100, windowMs: 60 * 60 * 1000 }, // 100 per hour
} as const;

type ActionType = keyof typeof RATE_LIMITS;

// Clean up old entries (remove timestamps older than the window)
function cleanupRateLimit(entry: RateLimitEntry, windowMs: number): void {
  const now = Date.now();
  entry.timestamps = entry.timestamps.filter(timestamp => now - timestamp < windowMs);
}

// Check if IP has exceeded rate limit for a specific action type
function checkRateLimit(ip: string, actionType: ActionType): boolean {
  const config = RATE_LIMITS[actionType];
  
  // Get or create IP entry
  let ipEntry = rateLimitStore.get(ip);
  if (!ipEntry) {
    ipEntry = {
      communities: { timestamps: [] },
      posts: { timestamps: [] },
      comments: { timestamps: [] },
    };
    rateLimitStore.set(ip, ipEntry);
  }
  
  const actionEntry = ipEntry[actionType];
  
  // Clean up old timestamps
  cleanupRateLimit(actionEntry, config.windowMs);
  
  // Check if limit exceeded
  return actionEntry.timestamps.length >= config.maxActions;
}

// Record an action for rate limiting
function recordAction(ip: string, actionType: ActionType): void {
  const ipEntry = rateLimitStore.get(ip);
  if (ipEntry) {
    ipEntry[actionType].timestamps.push(Date.now());
  }
}

// Middleware factory for rate limiting
function createRateLimitMiddleware(actionType: ActionType) {
  return (req: any, res: any, next: any) => {
    const ip = getClientIP(req);
    
    if (checkRateLimit(ip, actionType)) {
      const config = RATE_LIMITS[actionType];
      return res.status(429).json({
        message: `Rate limit exceeded. Maximum ${config.maxActions} ${actionType} per hour allowed.`,
        retryAfter: Math.ceil(config.windowMs / 1000), // seconds
      });
    }
    
    // Add IP and record function to request for use in route handler
    req.clientIP = ip;
    req.recordRateLimit = () => recordAction(ip, actionType);
    next();
  };
}

export async function registerRoutes(app: Express): Promise<Server> {
  
  // Health check endpoint
  app.get("/health", async (req, res) => {
    try {
      // Test database connection
      const result = await storage.getCommunities();
      res.json({ 
        status: "ok", 
        database: "connected",
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error("Health check failed:", error);
      res.status(500).json({ 
        status: "error", 
        database: "disconnected",
        error: error instanceof Error ? error.message : "Unknown error",
        timestamp: new Date().toISOString()
      });
    }
  });

  // Get all communities
  app.get("/api/communities", async (req, res) => {
    try {
      const sort = (req.query.sort as 'alphabetic' | 'new' | 'popular') || 'alphabetic';
      const filterDuplicates = req.query.filterDuplicates === 'true'; // Default to false for backward compatibility
      const communities = await storage.getCommunities(sort, filterDuplicates);
      res.json(communities);
    } catch (error) {
      console.error("Failed to fetch communities:", error);
      res.status(500).json({ message: "Failed to fetch communities" });
    }
  });

  // Create a new community
  app.post("/api/communities", createRateLimitMiddleware('communities'), async (req, res) => {
    try {
      const data = insertCommunitySchema.parse(req.body);
      
      // Check if community already exists
      const existing = await storage.getCommunityByName(data.name);
      if (existing) {
        return res.status(400).json({ message: "Community already exists" });
      }
      
      const community = await storage.createCommunity(data);
      req.recordRateLimit?.(); // Record successful community creation
      res.status(201).json(community);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create community" });
    }
  });

  // Get posts (all or by community)
  app.get("/api/posts", async (req, res) => {
    try {
      const communityId = req.query.communityId ? parseInt(req.query.communityId as string) : undefined;
      const sort = (req.query.sort as 'hot' | 'new') || 'hot';
      const ipAddress = getClientIP(req);
      const posts = await storage.getPosts(communityId, sort);
      
      // Add user vote information
      const postsWithVotes = await Promise.all(
        posts.map(async (post) => {
          const userVote = await storage.getVote(ipAddress, 'post', post.id);
          return {
            ...post,
            userVote: userVote?.voteType || null
          };
        })
      );
      
      res.json(postsWithVotes);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch posts" });
    }
  });

  // Get a specific post
  app.get("/api/posts/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const ipAddress = getClientIP(req);
      const post = await storage.getPost(id);
      if (!post) {
        return res.status(404).json({ message: "Post not found" });
      }
      
      // Add user vote information
      const userVote = await storage.getVote(ipAddress, 'post', post.id);
      const postWithVote = {
        ...post,
        userVote: userVote?.voteType || null
      };
      
      res.json(postWithVote);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch post" });
    }
  });

  // Get post by slug
  app.get("/api/posts/by-slug/:slug", async (req, res) => {
    try {
      const { slug } = req.params;
      const ipAddress = getClientIP(req);
      const post = await storage.getPostBySlug(slug);
      if (!post) {
        return res.status(404).json({ message: "Post not found" });
      }
      
      // Add user vote information
      const userVote = await storage.getVote(ipAddress, 'post', post.id);
      const postWithVote = {
        ...post,
        userVote: userVote?.voteType || null
      };
      
      res.json(postWithVote);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch post" });
    }
  });

  // Extract link preview metadata
  app.post("/api/link-preview", async (req, res) => {
    try {
      const { url } = z.object({ url: z.string() }).parse(req.body);
      
      if (!isValidUrl(url)) {
        return res.status(400).json({ message: "Invalid URL format" });
      }

      const preview = await extractLinkPreview(url);
      if (!preview) {
        return res.status(400).json({ message: "Unable to extract preview from this URL" });
      }

      res.json(preview);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid data", errors: error.errors });
      }
      console.error("Link preview error:", error);
      res.status(500).json({ message: "Failed to extract link preview" });
    }
  });

  // Create a new post
  app.post("/api/posts", createRateLimitMiddleware('posts'), async (req, res) => {
    try {
      const data = insertPostSchema.parse(req.body);
      
      // If a link is provided, extract its metadata
      let linkPreview = null;
      if (data.link && isValidUrl(data.link)) {
        linkPreview = await extractLinkPreview(data.link);
      }

      // Create post with link metadata
      const postData = {
        ...data,
        linkTitle: linkPreview?.title || null,
        linkDescription: linkPreview?.description || null,
        linkImage: linkPreview?.image || null,
        linkSiteName: linkPreview?.siteName || null,
      };

      const post = await storage.createPost(postData);
      req.recordRateLimit?.(); // Record successful post creation
      res.status(201).json(post);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create post" });
    }
  });

  // Get comments for a post
  app.get("/api/posts/:id/comments", async (req, res) => {
    try {
      const postId = parseInt(req.params.id);
      const sort = (req.query.sort as 'hot' | 'new') || 'hot';
      const ipAddress = getClientIP(req);
      const comments = await storage.getCommentsByPost(postId, sort);
      
      // Add user vote information to comments recursively
      const addVotesToComments = async (commentList: any[]): Promise<any[]> => {
        return Promise.all(
          commentList.map(async (comment) => {
            const userVote = await storage.getVote(ipAddress, 'comment', comment.id);
            return {
              ...comment,
              userVote: userVote?.voteType || null,
              children: await addVotesToComments(comment.children || [])
            };
          })
        );
      };
      
      const commentsWithVotes = await addVotesToComments(comments);
      res.json(commentsWithVotes);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch comments" });
    }
  });

  // Create a new comment
  app.post("/api/comments", createRateLimitMiddleware('comments'), async (req, res) => {
    try {
      const data = insertCommentSchema.parse(req.body);
      console.log("Creating comment with data:", data);
      const comment = await storage.createComment(data);
      req.recordRateLimit?.(); // Record successful comment creation
      res.status(201).json(comment);
    } catch (error) {
      if (error instanceof z.ZodError) {
        console.error("Comment validation error:", error.errors);
        return res.status(400).json({ message: "Invalid data", errors: error.errors });
      }
      console.error("Comment creation error:", error);
      res.status(500).json({ message: "Failed to create comment" });
    }
  });

  // Vote on a post or comment
  app.post("/api/vote", async (req, res) => {
    try {
      const { targetType, targetId, voteType } = req.body;
      const ipAddress = getClientIP(req);
      
      if (!['post', 'comment'].includes(targetType)) {
        return res.status(400).json({ message: "Invalid target type" });
      }
      
      if (![1, -1].includes(voteType)) {
        return res.status(400).json({ message: "Invalid vote type" });
      }

      // Check if user already voted
      const existingVote = await storage.getVote(ipAddress, targetType, targetId);
      
      let voteChange = 0;
      
      if (existingVote) {
        if (existingVote.voteType === voteType) {
          // User clicks same vote type: remove their vote (toggle off)
          await storage.deleteVote(existingVote.id);
          voteChange = -voteType; // Remove their vote: upvote removal = -1, downvote removal = +1
        } else {
          // User clicks different vote type: FIRST remove old vote, user becomes neutral
          await storage.deleteVote(existingVote.id);
          voteChange = -existingVote.voteType; // Remove old vote only, don't add new one yet
        }
      } else {
        // User has no existing vote: add new vote
        await storage.createVote({
          ipAddress,
          targetType,
          targetId,
          voteType
        });
        voteChange = voteType; // Add their vote: upvote = +1, downvote = -1
      }

      // Update target votes
      if (targetType === 'post') {
        const post = await storage.getPost(targetId);
        if (post) {
          await storage.updatePostVotes(targetId, post.votes + voteChange);
        }
      } else {
        // For comments, get the current comment to update its votes
        const comment = await storage.getComment(targetId);
        if (comment) {
          await storage.updateCommentVotes(targetId, comment.votes + voteChange);
        }
      }

      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ message: "Failed to process vote" });
    }
  });

  // Search
  app.get("/api/search", async (req, res) => {
    try {
      const query = req.query.q as string;
      if (!query || query.trim().length === 0) {
        return res.json({ posts: [], communities: [], comments: [] });
      }
      
      const results = await storage.search(query.trim());
      res.json(results);
    } catch (error) {
      res.status(500).json({ message: "Search failed" });
    }
  });

  // Create Stripe payment intent for ads
  app.post("/api/create-ad-payment", async (req, res) => {
    try {
      if (!stripe) {
        return res.status(500).json({ 
          message: "Stripe not configured", 
          error: "STRIPE_SECRET_KEY environment variable is required for payment processing"
        });
      }

      const adData = createAdSchema.parse(req.body);
      
      // Calculate price: $2 per 1000 impressions
      const priceInCents = Math.round((adData.impressions / 1000) * 2 * 100);
      
      // Create payment intent with Stripe
      const paymentIntent = await stripe.paymentIntents.create({
        amount: priceInCents,
        currency: "usd",
        automatic_payment_methods: {
          enabled: true,
        },
        metadata: {
          ad_title: adData.title,
          ad_impressions: adData.impressions.toString(),
          ad_body: adData.body || "",
          ad_link: adData.link || "",
        },
        receipt_email: req.body.email, // Optional: if you collect email
        description: `Sosiol Ad: ${adData.title} (${adData.impressions.toLocaleString()} impressions)`,
      });

      res.json({
        clientSecret: paymentIntent.client_secret,
        amount: priceInCents,
        paymentIntentId: paymentIntent.id,
      });
    } catch (error) {
      console.error("Stripe payment intent error:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid ad data", errors: error.errors });
      }
      // Enhanced error logging for Stripe issues
      if (error && typeof error === 'object' && 'type' in error) {
        console.error("Stripe error details:", {
          type: error.type,
          code: (error as any).code,
          message: (error as any).message,
          statusCode: (error as any).statusCode
        });
      }
      res.status(500).json({ 
        message: "Failed to create payment intent", 
        error: error instanceof Error ? error.message : "Unknown error" 
      });
    }
  });

  // Get active ad for feed injection
  app.get("/api/active-ad", async (req, res) => {
    try {
      const ad = await storage.getActiveAd();
      if (ad) {
        // Increment impression count
        await storage.incrementAdImpressions(ad.id);
      }
      res.json(ad || null);
    } catch (error) {
      console.error("Failed to get active ad:", error);
      res.status(500).json({ message: "Failed to get ad" });
    }
  });

  // Activate ad after successful payment (fallback if webhook not set up)
  app.post("/api/activate-ad", async (req, res) => {
    try {
      const { paymentIntentId } = req.body;
      
      if (!stripe || !paymentIntentId) {
        return res.status(400).json({ message: "Invalid request" });
      }

      // Verify payment was successful
      const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
      
      if (paymentIntent.status === "succeeded") {
        // Check if ad already exists
        const existingAds = await storage.getAdsByPaymentIntentId(paymentIntentId);
        
        if (existingAds.length === 0) {
          // Create the ad in database
          await storage.createSponsoredAd({
            title: paymentIntent.metadata.ad_title,
            body: paymentIntent.metadata.ad_body || null,
            link: paymentIntent.metadata.ad_link || null,
            impressionsPaid: parseInt(paymentIntent.metadata.ad_impressions),
            stripePaymentIntentId: paymentIntent.id,
          });
          
          console.log("Ad activated successfully for payment:", paymentIntent.id);
        }
        
        res.json({ success: true, activated: true });
      } else {
        res.status(400).json({ message: "Payment not completed" });
      }
    } catch (error) {
      console.error("Ad activation error:", error);
      res.status(500).json({ message: "Failed to activate ad" });
    }
  });

  // Stripe webhook to handle successful payments
  app.post("/api/stripe-webhook", async (req, res) => {
    try {
      if (!stripe) {
        return res.status(500).json({ message: "Stripe not configured" });
      }

      const event = req.body;
      
      // Handle successful payment
      if (event.type === "payment_intent.succeeded") {
        const paymentIntent = event.data.object;
        
        // Create the ad in database
        await storage.createSponsoredAd({
          title: paymentIntent.metadata.ad_title,
          body: paymentIntent.metadata.ad_body || null,
          link: paymentIntent.metadata.ad_link || null,
          impressionsPaid: parseInt(paymentIntent.metadata.ad_impressions),
          stripePaymentIntentId: paymentIntent.id,
        });
        
        console.log("Ad created successfully for payment:", paymentIntent.id);
      }
      
      res.json({ received: true });
    } catch (error) {
      console.error("Webhook error:", error);
      res.status(500).json({ message: "Webhook failed" });
    }
  });

  // Get community notes for a post
  app.get("/api/posts/:postId/notes", async (req, res) => {
    try {
      const postId = parseInt(req.params.postId);
      const notes = await storage.getCommunityNotes(postId);
      res.json(notes);
    } catch (error) {
      console.error("Failed to get community notes:", error);
      res.status(500).json({ message: "Failed to get community notes" });
    }
  });

  // Create a new community note
  app.post("/api/community-notes", async (req, res) => {
    try {
      const noteData = insertCommunityNoteSchema.parse(req.body);
      const note = await storage.createCommunityNote(noteData);
      res.status(201).json(note);
    } catch (error) {
      console.error("Failed to create community note:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid note data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create community note" });
    }
  });

  // Vote on community note
  app.post("/api/community-notes/:id/vote", async (req, res) => {
    try {
      const noteId = parseInt(req.params.id);
      const { voteType } = req.body; // 1 for upvote, -1 for downvote
      const ipAddress = getClientIP(req);

      if (![-1, 1].includes(voteType)) {
        return res.status(400).json({ message: "Invalid vote type" });
      }

      // Get existing vote for this note by this IP
      const existingVote = await storage.getVote(ipAddress, "community_note", noteId);
      
      let voteChange = 0;
      
      if (existingVote) {
        if (existingVote.voteType === voteType) {
          // User clicks same vote type: remove their vote (toggle off)
          await storage.deleteVote(existingVote.id);
          voteChange = -voteType; // Remove their vote: upvote removal = -1, downvote removal = +1
        } else {
          // User clicks different vote type: FIRST remove old vote, user becomes neutral
          await storage.deleteVote(existingVote.id);
          voteChange = -existingVote.voteType; // Remove old vote only, don't add new one yet
        }
      } else {
        // User has no existing vote: add new vote
        await storage.createVote({
          ipAddress,
          targetType: "community_note",
          targetId: noteId,
          voteType
        });
        voteChange = voteType; // Add their vote: upvote = +1, downvote = -1
      }

      // Get current note to update votes - use storage method instead of direct DB query
      const allNotes = await storage.getCommunityNotes(0); // Get all notes
      const note = allNotes.find(n => n.id === noteId);
      
      if (note) {
        const newVotes = note.votes + voteChange;
        await storage.updateCommunityNoteVotes(noteId, newVotes);
        
        // Determine current user vote state after this action
        let userVote = null;
        if (existingVote) {
          if (existingVote.voteType === voteType) {
            // Same vote clicked - vote was removed, user is now neutral
            userVote = null;
          } else {
            // Different vote clicked - old vote was removed, user is now neutral (step-by-step)
            userVote = null;
          }
        } else {
          // No existing vote - new vote was added
          userVote = voteType;
        }
        
        res.json({ votes: newVotes, userVote });
      } else {
        console.error(`Community note with ID ${noteId} not found. Available notes:`, allNotes.map(n => n.id));
        res.status(404).json({ message: "Community note not found" });
      }
    } catch (error) {
      console.error("Failed to vote on community note:", error);
      res.status(500).json({ message: "Failed to vote on community note" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
