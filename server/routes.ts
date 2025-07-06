import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertCommunitySchema, insertPostSchema, insertCommentSchema } from "@shared/schema";
import { z } from "zod";

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
          // User clicked same vote - remove it (toggle off)
          await storage.deleteVote(existingVote.id);
          voteChange = voteType === 1 ? -1 : 1; // Remove upvote (-1) or remove downvote (+1)
        } else {
          // User changed their vote - first remove old, then add new
          await storage.deleteVote(existingVote.id);
          await storage.createVote({
            ipAddress,
            targetType,
            targetId,
            voteType
          });
          // This is a 2-step change: remove old vote + add new vote
          const oldVoteRemoval = existingVote.voteType === 1 ? -1 : 1;
          const newVoteAddition = voteType === 1 ? 1 : -1;
          voteChange = oldVoteRemoval + newVoteAddition;
        }
      } else {
        // New vote
        await storage.createVote({
          ipAddress,
          targetType,
          targetId,
          voteType
        });
        voteChange = voteType === 1 ? 1 : -1; // Add upvote (+1) or add downvote (-1)
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

  const httpServer = createServer(app);
  return httpServer;
}
