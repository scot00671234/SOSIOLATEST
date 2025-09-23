import { db } from "../server/db";
import { posts } from "../shared/schema";
import { eq, isNull, or } from "drizzle-orm";

// Unicode-aware slug generation for international characters (unified with server logic)
function createPostSlug(title: string): string {
  // Normalize and create Unicode-aware slug that preserves international characters
  let slug = title
    .normalize('NFKC') // Normalize Unicode characters
    .toLowerCase()
    // Remove HTML tags
    .replace(/<[^>]*>/g, '')
    // Keep Unicode letters, numbers, spaces, and hyphens only (using Unicode property escapes)
    .replace(/[^\p{Letter}\p{Number}\s-]/gu, '')
    // Replace spaces and multiple hyphens with single hyphen
    .replace(/[\s_-]+/g, '-')
    // Remove leading/trailing hyphens
    .replace(/^-+|-+$/g, '')
    // Limit length
    .substring(0, 80);

  return slug;
}

function generateSlugForMigration(title: string, postId: number): string {
  const baseSlug = createPostSlug(title);
  
  // If slug is empty after processing, use post ID as fallback
  if (!baseSlug || baseSlug.length < 2) {
    return `post-${postId}`;
  }
  
  // For migration, always append post ID to ensure uniqueness without collision checks
  return `${baseSlug}-${postId}`;
}

async function migrateSlugs() {
  console.log('🔄 Starting slug migration...');
  
  try {
    // Get all posts without slugs (null or empty string)
    const postsWithoutSlugs = await db.select().from(posts).where(or(isNull(posts.slug), eq(posts.slug, '')));
    
    if (postsWithoutSlugs.length === 0) {
      console.log('✅ No posts need slug migration');
      return;
    }
    
    console.log(`📝 Found ${postsWithoutSlugs.length} posts without slugs`);
    
    // Generate and update slugs using new international-character-friendly approach
    for (const post of postsWithoutSlugs) {
      const slug = generateSlugForMigration(post.title, post.id);
      
      await db
        .update(posts)
        .set({ slug })
        .where(eq(posts.id, post.id));
      
      console.log(`✅ Updated post "${post.title}" with slug: ${slug}`);
    }
    
    console.log(`🎉 Migration completed! Updated ${postsWithoutSlugs.length} posts`);
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
    throw error;
  }
}

// Run the migration
migrateSlugs().catch((error) => {
  console.error('Migration failed:', error);
  process.exit(1);
});