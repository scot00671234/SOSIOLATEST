import levenshtein from 'js-levenshtein';
import type { PostWithCommunity, Community } from '@shared/schema';

export interface AntiSpamConfig {
  similarityThreshold: number; // 0.8 = 80% similarity threshold
  recentPostsWindow: number; // Number of recent posts to check against (default: 50)
  minContentLength: number; // Minimum content length to check (default: 10 chars)
  minCommunityNameLength: number; // Minimum community name length to check (default: 3 chars)
  repeatedWordThreshold: number; // Maximum allowed repeated words in community names (default: 2)
}

export class AntiSpamService {
  private config: AntiSpamConfig;

  constructor(config: Partial<AntiSpamConfig> = {}) {
    this.config = {
      similarityThreshold: config.similarityThreshold ?? 0.8, // 80% threshold
      recentPostsWindow: config.recentPostsWindow ?? 50,
      minContentLength: config.minContentLength ?? 10,
      minCommunityNameLength: config.minCommunityNameLength ?? 3,
      repeatedWordThreshold: config.repeatedWordThreshold ?? 2,
      ...config
    };
  }

  /**
   * Calculate text similarity between two strings using Levenshtein distance
   * Returns a value between 0 and 1, where 1 is identical and 0 is completely different
   */
  private calculateSimilarity(text1: string, text2: string): number {
    if (!text1 || !text2) return 0;
    
    // Normalize text for comparison (lowercase, trim whitespace)
    const normalized1 = text1.toLowerCase().trim();
    const normalized2 = text2.toLowerCase().trim();
    
    if (normalized1 === normalized2) return 1;
    
    const maxLength = Math.max(normalized1.length, normalized2.length);
    if (maxLength === 0) return 1; // Both strings are empty
    
    const distance = levenshtein(normalized1, normalized2);
    const similarity = 1 - (distance / maxLength);
    
    return Math.max(0, similarity); // Ensure non-negative
  }

  /**
   * Normalize post content for similarity checking
   * Combines title and content, removes extra whitespace
   */
  private normalizePostContent(post: PostWithCommunity): string {
    const title = post.title || '';
    const content = post.content || '';
    
    // Combine title and content, normalize whitespace
    const combined = `${title} ${content}`.replace(/\s+/g, ' ').trim();
    return combined;
  }

  /**
   * Check if a post is similar to any recent posts
   * Returns true if the post should be filtered out (is spam/duplicate)
   */
  private isPostSimilar(targetPost: PostWithCommunity, recentPosts: PostWithCommunity[]): boolean {
    const targetContent = this.normalizePostContent(targetPost);
    
    // Skip very short content
    if (targetContent.length < this.config.minContentLength) {
      return false;
    }

    // Check against recent posts
    for (const recentPost of recentPosts) {
      // Don't compare against itself
      if (targetPost.id === recentPost.id) continue;
      
      const recentContent = this.normalizePostContent(recentPost);
      
      // Skip very short content
      if (recentContent.length < this.config.minContentLength) continue;
      
      const similarity = this.calculateSimilarity(targetContent, recentContent);
      
      if (similarity > this.config.similarityThreshold) {
        console.log(`🚫 Anti-spam: Post "${targetPost.title}" (ID: ${targetPost.id}) filtered - ${Math.round(similarity * 100)}% similar to post "${recentPost.title}" (ID: ${recentPost.id})`);
        return true; // Found similar content, filter this post
      }
    }
    
    return false; // No similar content found
  }

  /**
   * Filter posts to remove those with high similarity to recent posts
   * For frontpage, we only want to filter against recent posts to catch duplicates/spam
   */
  filterDuplicatePosts(posts: PostWithCommunity[]): PostWithCommunity[] {
    if (posts.length === 0) return posts;
    
    // Sort posts by creation date (newest first) to properly identify recent vs older posts
    const sortedPosts = [...posts].sort((a, b) => 
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
    
    const filteredPosts: PostWithCommunity[] = [];
    
    for (let i = 0; i < sortedPosts.length; i++) {
      const currentPost = sortedPosts[i];
      
      // For spam detection, check against posts that we've already approved (are in filteredPosts)
      // Also check against a window of recent posts from the sorted list
      const recentApprovedPosts = filteredPosts.slice(0, this.config.recentPostsWindow);
      const recentWindowPosts = sortedPosts.slice(0, Math.min(i, this.config.recentPostsWindow));
      
      // Combine recent approved posts with recent window posts, remove duplicates
      const postsToCheckAgainst = [...recentApprovedPosts, ...recentWindowPosts]
        .filter((post, index, array) => 
          array.findIndex(p => p.id === post.id) === index
        );
      
      // Check if current post is similar to any recent posts
      if (!this.isPostSimilar(currentPost, postsToCheckAgainst)) {
        filteredPosts.push(currentPost);
      }
    }
    
    console.log(`✅ Anti-spam: ${posts.length - filteredPosts.length} duplicate/spam posts filtered out of ${posts.length} total posts`);
    
    return filteredPosts;
  }

  /**
   * Detect repeated words or phrases in a community name
   * Returns true if the name contains too many repeated words
   */
  private hasRepeatedWords(communityName: string): boolean {
    if (!communityName || communityName.length < this.config.minCommunityNameLength) {
      return false;
    }

    // Normalize the name: lowercase, remove special chars, split by spaces/delimiters
    const normalized = communityName.toLowerCase()
      .replace(/[^\w\s]/g, ' ') // Replace special chars with spaces
      .replace(/\s+/g, ' ') // Normalize whitespace
      .trim();
    
    const words = normalized.split(' ').filter(word => word.length > 1); // Ignore single chars
    
    if (words.length < 2) return false;
    
    // Count word occurrences
    const wordCounts = new Map<string, number>();
    words.forEach(word => {
      wordCounts.set(word, (wordCounts.get(word) || 0) + 1);
    });
    
    // Check if any word appears at or above the threshold (2+ times = repeated)
    for (const [word, count] of wordCounts) {
      if (count >= this.config.repeatedWordThreshold) {
        console.log(`🚫 Community name "${communityName}" has repeated word "${word}" ${count} times (threshold: ${this.config.repeatedWordThreshold})`);
        return true;
      }
    }
    
    return false;
  }

  /**
   * Check if a community name is similar to any existing community names
   * Returns the most similar community if similarity exceeds threshold, otherwise null
   */
  private findSimilarCommunity(targetCommunity: Community, allCommunities: Community[]): Community | null {
    const targetName = targetCommunity.name?.toLowerCase().trim() || '';
    
    if (targetName.length < this.config.minCommunityNameLength) {
      return null;
    }

    for (const community of allCommunities) {
      // Don't compare against itself
      if (targetCommunity.id === community.id) continue;
      
      const existingName = community.name?.toLowerCase().trim() || '';
      
      if (existingName.length < this.config.minCommunityNameLength) continue;
      
      const similarity = this.calculateSimilarity(targetName, existingName);
      
      if (similarity > this.config.similarityThreshold) {
        console.log(`🚫 Community "${targetCommunity.name}" (ID: ${targetCommunity.id}) is ${Math.round(similarity * 100)}% similar to "${community.name}" (ID: ${community.id})`);
        return community; // Found similar community
      }
    }
    
    return null; // No similar community found
  }

  /**
   * Filter communities to hide duplicates based on similarity and repeated words
   * Keeps the oldest community when duplicates are found
   * Returns filtered list with duplicates hidden but still accessible via search
   */
  filterDuplicateCommunities(communities: Community[]): Community[] {
    if (communities.length === 0) return communities;
    
    // Sort by creation date (oldest first) to keep original communities
    const sortedCommunities = [...communities].sort((a, b) => 
      new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
    );
    
    const filteredCommunities: Community[] = [];
    const duplicateIds = new Set<number>();
    
    for (const community of sortedCommunities) {
      // Skip if already marked as duplicate
      if (duplicateIds.has(community.id)) continue;
      
      // Check for repeated words in community name
      if (this.hasRepeatedWords(community.name)) {
        duplicateIds.add(community.id);
        continue;
      }
      
      // Check for similarity to already approved communities
      const approvedCommunities = filteredCommunities;
      const similarCommunity = this.findSimilarCommunity(community, approvedCommunities);
      
      if (similarCommunity) {
        // Mark this community as duplicate (keep the older one)
        duplicateIds.add(community.id);
        continue;
      }
      
      // Community passed all checks, add to filtered list
      filteredCommunities.push(community);
    }
    
    console.log(`✅ Community filter: ${communities.length - filteredCommunities.length} duplicate communities hidden from ${communities.length} total communities`);
    
    return filteredCommunities;
  }

  /**
   * Get current anti-spam configuration
   */
  getConfig(): AntiSpamConfig {
    return { ...this.config };
  }

  /**
   * Update anti-spam configuration
   */
  updateConfig(newConfig: Partial<AntiSpamConfig>): void {
    this.config = { ...this.config, ...newConfig };
  }
}

// Export a default instance with default settings
export const antiSpamService = new AntiSpamService({
  similarityThreshold: 0.8, // 80% similarity threshold as requested
  recentPostsWindow: 50,    // Check against 50 most recent posts
  minContentLength: 10,     // Only check posts with at least 10 characters
  minCommunityNameLength: 3, // Only check community names with at least 3 characters
  repeatedWordThreshold: 2   // Flag communities with words repeated 2 or more times
});