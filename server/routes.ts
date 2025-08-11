import type { Express } from "express";
import { createServer, type Server } from "http";
import Stripe from "stripe";
import { storage } from "./storage";
import { createAdSchema } from "@shared/schema";
import { insertCommunitySchema, insertPostSchema, insertCommentSchema } from "@shared/schema";
import { z } from "zod";

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
  return req.ip || req.connection.remoteAddress || req.socket.remoteAddress || 'unknown';
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
      const communities = await storage.getCommunities();
      res.json(communities);
    } catch (error) {
      console.error("Failed to fetch communities:", error);
      res.status(500).json({ message: "Failed to fetch communities" });
    }
  });

  // Create a new community
  app.post("/api/communities", async (req, res) => {
    try {
      const data = insertCommunitySchema.parse(req.body);
      
      // Check if community already exists
      const existing = await storage.getCommunityByName(data.name);
      if (existing) {
        return res.status(400).json({ message: "Community already exists" });
      }
      
      const community = await storage.createCommunity(data);
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
      const ipAddress = getClientIP(req);
      const posts = await storage.getPosts(communityId);
      
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

  // Create a new post
  app.post("/api/posts", async (req, res) => {
    try {
      const data = insertPostSchema.parse(req.body);
      const post = await storage.createPost(data);
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
      const ipAddress = getClientIP(req);
      const comments = await storage.getCommentsByPost(postId);
      
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
  app.post("/api/comments", async (req, res) => {
    try {
      const data = insertCommentSchema.parse(req.body);
      const comment = await storage.createComment(data);
      res.status(201).json(comment);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid data", errors: error.errors });
      }
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

  const httpServer = createServer(app);
  return httpServer;
}
