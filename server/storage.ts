import { 
  communities, 
  posts, 
  comments, 
  votes,
  sponsoredAds,
  communityNotes,
  type Community, 
  type Post, 
  type Comment,
  type Vote,
  type SponsoredAd,
  type CommunityNote,
  type InsertCommunity, 
  type InsertPost, 
  type InsertComment,
  type InsertVote,
  type InsertSponsoredAd,
  type InsertCommunityNote,
  type PostWithCommunity,
  type CommentWithChildren,
  type CommunityNoteWithVote
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, sql, and, or, ilike } from "drizzle-orm";
// Slug generation functions
function createPostSlug(title: string): string {
  return title.toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .replace(/-+/g, '-')
    .substring(0, 100); // Limit slug length
}

async function generateUniqueSlug(title: string): Promise<string> {
  const baseSlug = createPostSlug(title);
  let uniqueSlug = baseSlug;
  let counter = 1;
  
  try {
    while (true) {
      const existingPost = await db.select({ id: posts.id }).from(posts).where(eq(posts.slug, uniqueSlug)).limit(1);
      if (existingPost.length === 0) {
        break;
      }
      uniqueSlug = `${baseSlug}-${counter}`;
      counter++;
    }
  } catch (error: any) {
    // If slug column doesn't exist, just return the base slug
    console.warn('Slug column may not exist, returning base slug:', error.message);
    return baseSlug;
  }
  
  return uniqueSlug;
}

// Reddit-style hot algorithm
function calculateHotScore(votes: number, createdAt: Date): number {
  const score = votes;
  const order = Math.log10(Math.max(Math.abs(score), 1));
  const sign = score > 0 ? 1 : (score < 0 ? -1 : 0);
  
  // Convert to seconds since epoch (Reddit uses December 8, 2005 as epoch: 1134028003)
  // We'll use January 1, 2020 as our epoch for simplicity: 1577836800
  const epochSeconds = Math.floor(createdAt.getTime() / 1000) - 1577836800;
  
  // The 45000 divisor controls how much time matters vs votes
  // Smaller number = time matters more, larger = votes matter more  
  return Math.round((sign * order + epochSeconds / 45000) * 10000000) / 10000000;
}

export interface IStorage {
  // Communities
  getCommunities(sort?: 'alphabetic' | 'new' | 'popular'): Promise<Community[]>;
  getCommunityByName(name: string): Promise<Community | undefined>;
  createCommunity(community: InsertCommunity): Promise<Community>;
  
  // Posts
  getPosts(communityId?: number, sort?: 'hot' | 'new'): Promise<PostWithCommunity[]>;
  getPost(id: number): Promise<PostWithCommunity | undefined>;
  getPostBySlug(slug: string): Promise<PostWithCommunity | undefined>;
  createPost(post: InsertPost): Promise<Post>;
  updatePostVotes(id: number, votes: number): Promise<void>;
  updatePostCommentCount(id: number, count: number): Promise<void>;
  
  // Comments
  getCommentsByPost(postId: number, sort?: 'hot' | 'new'): Promise<CommentWithChildren[]>;
  getComment(id: number): Promise<Comment | undefined>;
  createComment(comment: InsertComment): Promise<Comment>;
  updateCommentVotes(id: number, votes: number): Promise<void>;
  
  // Votes
  getVote(ipAddress: string, targetType: string, targetId: number): Promise<Vote | undefined>;
  createVote(vote: InsertVote): Promise<Vote>;
  updateVote(id: number, voteType: number): Promise<void>;
  deleteVote(id: number): Promise<void>;

  // Community Notes
  getCommunityNotes(postId: number): Promise<CommunityNoteWithVote[]>;
  createCommunityNote(note: InsertCommunityNote): Promise<CommunityNote>;
  updateCommunityNoteVotes(id: number, votes: number): Promise<void>;
  
  // Search
  search(query: string): Promise<{
    posts: PostWithCommunity[];
    communities: Community[];
    comments: Comment[];
  }>;
  
  // Sponsored Ads
  getActiveAd(): Promise<SponsoredAd | undefined>;
  createSponsoredAd(ad: InsertSponsoredAd): Promise<SponsoredAd>;
  incrementAdImpressions(id: number): Promise<void>;
  getAdsByPaymentIntentId(paymentIntentId: string): Promise<SponsoredAd[]>;
}

export class DatabaseStorage implements IStorage {
  async getCommunities(sort: 'alphabetic' | 'new' | 'popular' = 'popular'): Promise<Community[]> {
    if (sort === 'new') {
      return await db.select().from(communities).orderBy(desc(communities.createdAt));
    } else if (sort === 'popular') {
      // Sort by popularity (communities with most posts)
      const result = await db
        .select({
          id: communities.id,
          name: communities.name,
          description: communities.description,
          createdAt: communities.createdAt,
          postCount: sql<number>`count(${posts.id})`.as('post_count')
        })
        .from(communities)
        .leftJoin(posts, eq(communities.id, posts.communityId))
        .groupBy(communities.id)
        .orderBy(desc(sql`count(${posts.id})`), communities.name);
      
      return result.map(({ postCount, ...community }) => community);
    } else {
      // alphabetic (default)
      return await db.select().from(communities).orderBy(communities.name);
    }
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

  async getPosts(communityId?: number, sort: 'hot' | 'new' = 'hot'): Promise<PostWithCommunity[]> {
    try {
      // Select specific fields to avoid missing slug column errors in production
      const query = db
        .select({
          post: {
            id: posts.id,
            title: posts.title,
            content: posts.content,
            communityId: posts.communityId,
            votes: posts.votes,
            commentCount: posts.commentCount,
            createdAt: posts.createdAt
          },
          community: {
            id: communities.id,
            name: communities.name,
            description: communities.description,
            createdAt: communities.createdAt
          }
        })
        .from(posts)
        .leftJoin(communities, eq(posts.communityId, communities.id));
      
      let result;
      if (communityId) {
        result = await query.where(eq(posts.communityId, communityId));
      } else {
        result = await query;
      }
      
      const postsWithCommunity = result.map(row => ({
        ...row.post,
        slug: null, // Set to null for compatibility with production databases without slug column
        community: row.community!
      }));
      
      if (sort === 'new') {
        // Sort by creation date (newest first)
        return postsWithCommunity.sort((a, b) => 
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
      } else {
        // Calculate hot scores and sort using Reddit algorithm
        const postsWithScores = postsWithCommunity.map(post => {
          const hotScore = calculateHotScore(post.votes, new Date(post.createdAt));
          return { ...post, hotScore };
        });
        
        // Sort by hot score (highest first)
        postsWithScores.sort((a, b) => b.hotScore - a.hotScore);
        
        // Remove hotScore from final result
        return postsWithScores.map(({ hotScore, ...post }) => post);
      }
    } catch (error: any) {
      console.error('Error fetching posts:', error);
      return []; // Return empty array instead of crashing
    }
  }

  async getPost(id: number): Promise<PostWithCommunity | undefined> {
    try {
      const [result] = await db
        .select({
          post: {
            id: posts.id,
            title: posts.title,
            content: posts.content,
            communityId: posts.communityId,
            votes: posts.votes,
            commentCount: posts.commentCount,
            createdAt: posts.createdAt
          },
          community: {
            id: communities.id,
            name: communities.name,
            description: communities.description,
            createdAt: communities.createdAt
          }
        })
        .from(posts)
        .leftJoin(communities, eq(posts.communityId, communities.id))
        .where(eq(posts.id, id));
      
      if (!result) return undefined;
      
      return {
        ...result.post,
        slug: null, // Set to null for compatibility with production databases without slug column
        community: result.community!
      };
    } catch (error: any) {
      console.error('Error fetching post:', error);
      return undefined;
    }
  }

  async createPost(insertPost: InsertPost): Promise<Post> {
    try {
      // Try to generate unique slug from title
      const slug = await generateUniqueSlug(insertPost.title);
      
      const [post] = await db
        .insert(posts)
        .values({
          ...insertPost,
          slug
        })
        .returning();
      return post;
    } catch (error: any) {
      console.log('⚠️  Slug column missing or error creating post with slug, trying without slug...', error.message);
      // Fallback: create post without slug for production databases that don't have the column
      try {
        const [post] = await db
          .insert(posts)
          .values(insertPost)
          .returning();
        return post;
      } catch (fallbackError: any) {
        console.error('Failed to create post even without slug:', fallbackError.message);
        throw fallbackError;
      }
    }
  }

  async getPostBySlug(slug: string): Promise<PostWithCommunity | undefined> {
    try {
      // Check if slug column exists by trying to query it
      const [result] = await db
        .select({
          post: {
            id: posts.id,
            title: posts.title,
            content: posts.content,
            communityId: posts.communityId,
            votes: posts.votes,
            commentCount: posts.commentCount,
            createdAt: posts.createdAt
          },
          community: {
            id: communities.id,
            name: communities.name,
            description: communities.description,
            createdAt: communities.createdAt
          }
        })
        .from(posts)
        .leftJoin(communities, eq(posts.communityId, communities.id))
        .where(eq(posts.slug, slug));
      
      if (!result) return undefined;
      
      return {
        ...result.post,
        slug: null, // Set to null for compatibility with production databases without slug column
        community: result.community!
      };
    } catch (error: any) {
      console.error('Error fetching post by slug (slug column may not exist):', error);
      return undefined;
    }
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

  async getCommentsByPost(postId: number, sort: 'hot' | 'new' = 'hot'): Promise<CommentWithChildren[]> {
    const allComments = await db
      .select()
      .from(comments)
      .where(eq(comments.postId, postId));

    // Build nested structure first
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

    // Third pass: sort comments recursively
    const sortComments = (comments: CommentWithChildren[]): CommentWithChildren[] => {
      if (sort === 'new') {
        // Sort by creation date (newest first)
        comments.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      } else {
        // Sort by hot score (like posts)
        const commentsWithScores = comments.map(comment => {
          const hotScore = calculateHotScore(comment.votes, new Date(comment.createdAt));
          return { ...comment, hotScore };
        });
        
        commentsWithScores.sort((a, b) => b.hotScore - a.hotScore);
        
        // Remove hotScore and update original array
        comments.length = 0;
        comments.push(...commentsWithScores.map(({ hotScore, ...comment }) => comment));
      }

      // Recursively sort children
      comments.forEach(comment => {
        if (comment.children.length > 0) {
          comment.children = sortComments(comment.children);
        }
      });

      return comments;
    };

    return sortComments(rootComments);
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
        .orderBy(desc(posts.createdAt)),
      
      // Search communities
      db
        .select()
        .from(communities)
        .where(
          or(
            ilike(communities.name, searchTerm),
            ilike(communities.description, searchTerm)
          )
        ),
      
      // Search comments
      db
        .select()
        .from(comments)
        .where(ilike(comments.content, searchTerm))
        .orderBy(desc(comments.votes))
    ]);

    // Apply hot algorithm to search results
    const postsWithScores = searchPosts.map(row => {
      const post = row.posts;
      const hotScore = calculateHotScore(post.votes, new Date(post.createdAt));
      return {
        ...post,
        community: row.communities!,
        hotScore
      };
    });
    
    // Sort by hot score
    postsWithScores.sort((a, b) => b.hotScore - a.hotScore);

    return {
      posts: postsWithScores.map(({ hotScore, ...post }) => post),
      communities: searchCommunities,
      comments: searchComments
    };
  }

  async getActiveAd(): Promise<SponsoredAd | undefined> {
    const [ad] = await db
      .select()
      .from(sponsoredAds)
      .where(
        and(
          eq(sponsoredAds.active, true),
          sql`${sponsoredAds.impressionsServed} < ${sponsoredAds.impressionsPaid}`
        )
      )
      .orderBy(sql`RANDOM()`)
      .limit(1);
    return ad || undefined;
  }

  async createSponsoredAd(insertAd: InsertSponsoredAd): Promise<SponsoredAd> {
    const [ad] = await db
      .insert(sponsoredAds)
      .values(insertAd)
      .returning();
    return ad;
  }

  async incrementAdImpressions(id: number): Promise<void> {
    await db
      .update(sponsoredAds)
      .set({ 
        impressionsServed: sql`${sponsoredAds.impressionsServed} + 1` 
      })
      .where(eq(sponsoredAds.id, id));

    // Check if we need to deactivate the ad
    const [ad] = await db
      .select()
      .from(sponsoredAds)
      .where(eq(sponsoredAds.id, id));

    if (ad && ad.impressionsServed >= ad.impressionsPaid) {
      await db
        .update(sponsoredAds)
        .set({ active: false })
        .where(eq(sponsoredAds.id, id));
    }
  }

  async getAdsByPaymentIntentId(paymentIntentId: string): Promise<SponsoredAd[]> {
    return await db
      .select()
      .from(sponsoredAds)
      .where(eq(sponsoredAds.stripePaymentIntentId, paymentIntentId));
  }

  async getCommunityNotes(postId: number): Promise<CommunityNoteWithVote[]> {
    const query = db.select().from(communityNotes);
    
    // If postId is 0, get all notes; otherwise filter by postId
    const notes = postId === 0 
      ? await query.orderBy(desc(communityNotes.votes))
      : await query.where(eq(communityNotes.postId, postId)).orderBy(desc(communityNotes.votes));
    
    // For now, return without user votes (will be added when implementing voting)
    return notes.map(note => ({ ...note, userVote: null as 1 | -1 | null }));
  }

  async createCommunityNote(insertNote: InsertCommunityNote): Promise<CommunityNote> {
    const [note] = await db
      .insert(communityNotes)
      .values(insertNote)
      .returning();
    return note;
  }

  async updateCommunityNoteVotes(id: number, votes: number): Promise<void> {
    await db
      .update(communityNotes)
      .set({ votes })
      .where(eq(communityNotes.id, id));
  }
}

export const storage = new DatabaseStorage();
