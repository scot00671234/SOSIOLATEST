import { 
  communities, 
  posts, 
  comments, 
  votes,
  type Community, 
  type Post, 
  type Comment,
  type Vote,
  type InsertCommunity, 
  type InsertPost, 
  type InsertComment,
  type InsertVote,
  type PostWithCommunity,
  type CommentWithChildren
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, sql, and, or, ilike } from "drizzle-orm";

export interface IStorage {
  // Communities
  getCommunities(): Promise<Community[]>;
  getCommunityByName(name: string): Promise<Community | undefined>;
  createCommunity(community: InsertCommunity): Promise<Community>;
  
  // Posts
  getPosts(communityId?: number): Promise<PostWithCommunity[]>;
  getPost(id: number): Promise<PostWithCommunity | undefined>;
  createPost(post: InsertPost): Promise<Post>;
  updatePostVotes(id: number, votes: number): Promise<void>;
  updatePostCommentCount(id: number, count: number): Promise<void>;
  
  // Comments
  getCommentsByPost(postId: number): Promise<CommentWithChildren[]>;
  getComment(id: number): Promise<Comment | undefined>;
  createComment(comment: InsertComment): Promise<Comment>;
  updateCommentVotes(id: number, votes: number): Promise<void>;
  
  // Votes
  getVote(ipAddress: string, targetType: string, targetId: number): Promise<Vote | undefined>;
  createVote(vote: InsertVote): Promise<Vote>;
  updateVote(id: number, voteType: number): Promise<void>;
  deleteVote(id: number): Promise<void>;
  
  // Search
  search(query: string): Promise<{
    posts: PostWithCommunity[];
    communities: Community[];
    comments: Comment[];
  }>;
}

export class DatabaseStorage implements IStorage {
  async getCommunities(): Promise<Community[]> {
    return await db.select().from(communities).orderBy(communities.name);
  }

  async getCommunityByName(name: string): Promise<Community | undefined> {
    const [community] = await db.select().from(communities).where(eq(communities.name, name));
    return community || undefined;
  }

  async createCommunity(insertCommunity: InsertCommunity): Promise<Community> {
    const [community] = await db
      .insert(communities)
      .values(insertCommunity)
      .returning();
    return community;
  }

  async getPosts(communityId?: number): Promise<PostWithCommunity[]> {
    const query = db
      .select()
      .from(posts)
      .leftJoin(communities, eq(posts.communityId, communities.id))
      .orderBy(desc(posts.votes), desc(posts.createdAt));
    
    if (communityId) {
      query.where(eq(posts.communityId, communityId));
    }
    
    const result = await query;
    return result.map(row => ({
      ...row.posts,
      community: row.communities!
    }));
  }

  async getPost(id: number): Promise<PostWithCommunity | undefined> {
    const [result] = await db
      .select()
      .from(posts)
      .leftJoin(communities, eq(posts.communityId, communities.id))
      .where(eq(posts.id, id));
    
    if (!result) return undefined;
    
    return {
      ...result.posts,
      community: result.communities!
    };
  }

  async createPost(insertPost: InsertPost): Promise<Post> {
    const [post] = await db
      .insert(posts)
      .values(insertPost)
      .returning();
    return post;
  }

  async updatePostVotes(id: number, votes: number): Promise<void> {
    await db
      .update(posts)
      .set({ votes })
      .where(eq(posts.id, id));
  }

  async updatePostCommentCount(id: number, count: number): Promise<void> {
    await db
      .update(posts)
      .set({ commentCount: count })
      .where(eq(posts.id, id));
  }

  async getComment(id: number): Promise<Comment | undefined> {
    const [comment] = await db.select().from(comments).where(eq(comments.id, id));
    return comment || undefined;
  }

  async getCommentsByPost(postId: number): Promise<CommentWithChildren[]> {
    const allComments = await db
      .select()
      .from(comments)
      .where(eq(comments.postId, postId))
      .orderBy(comments.createdAt);

    // Build nested structure
    const commentMap = new Map<number, CommentWithChildren>();
    const rootComments: CommentWithChildren[] = [];

    // First pass: create all comment objects
    allComments.forEach(comment => {
      commentMap.set(comment.id, { ...comment, children: [] });
    });

    // Second pass: build hierarchy
    allComments.forEach(comment => {
      const commentWithChildren = commentMap.get(comment.id)!;
      if (comment.parentId) {
        const parent = commentMap.get(comment.parentId);
        if (parent) {
          parent.children.push(commentWithChildren);
        }
      } else {
        rootComments.push(commentWithChildren);
      }
    });

    return rootComments;
  }

  async createComment(insertComment: InsertComment): Promise<Comment> {
    const [comment] = await db
      .insert(comments)
      .values(insertComment)
      .returning();
    
    // Update post comment count
    const commentCount = await db
      .select({ count: sql<number>`count(*)` })
      .from(comments)
      .where(eq(comments.postId, insertComment.postId));
    
    await this.updatePostCommentCount(insertComment.postId, commentCount[0].count);
    
    return comment;
  }

  async updateCommentVotes(id: number, votes: number): Promise<void> {
    await db
      .update(comments)
      .set({ votes })
      .where(eq(comments.id, id));
  }

  async getVote(ipAddress: string, targetType: string, targetId: number): Promise<Vote | undefined> {
    const [vote] = await db
      .select()
      .from(votes)
      .where(
        and(
          eq(votes.ipAddress, ipAddress),
          eq(votes.targetType, targetType),
          eq(votes.targetId, targetId)
        )
      );
    return vote || undefined;
  }

  async createVote(insertVote: InsertVote): Promise<Vote> {
    const [vote] = await db
      .insert(votes)
      .values(insertVote)
      .returning();
    return vote;
  }

  async updateVote(id: number, voteType: number): Promise<void> {
    await db
      .update(votes)
      .set({ voteType })
      .where(eq(votes.id, id));
  }

  async deleteVote(id: number): Promise<void> {
    await db
      .delete(votes)
      .where(eq(votes.id, id));
  }

  async search(query: string): Promise<{
    posts: PostWithCommunity[];
    communities: Community[];
    comments: Comment[];
  }> {
    const searchTerm = `%${query}%`;
    
    const [searchPosts, searchCommunities, searchComments] = await Promise.all([
      // Search posts
      db
        .select()
        .from(posts)
        .leftJoin(communities, eq(posts.communityId, communities.id))
        .where(
          or(
            ilike(posts.title, searchTerm),
            ilike(posts.content, searchTerm)
          )
        )
        .orderBy(desc(posts.votes)),
      
      // Search communities
      db
        .select()
        .from(communities)
        .where(ilike(communities.name, searchTerm)),
      
      // Search comments
      db
        .select()
        .from(comments)
        .where(ilike(comments.content, searchTerm))
        .orderBy(desc(comments.votes))
    ]);

    return {
      posts: searchPosts.map(row => ({
        ...row.posts,
        community: row.communities!
      })),
      communities: searchCommunities,
      comments: searchComments
    };
  }
}

export const storage = new DatabaseStorage();
