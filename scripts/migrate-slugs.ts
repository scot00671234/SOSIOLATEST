import { db } from "../server/db";
import { posts } from "../shared/schema";
import { eq, isNull } from "drizzle-orm";

// Slug generation function
function createPostSlug(title: string): string {
  return title.toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .replace(/-+/g, '-')
    .substring(0, 100); // Limit slug length
}

async function generateUniqueSlug(title: string, existingSlugs: Set<string>): Promise<string> {
  const baseSlug = createPostSlug(title);
  let uniqueSlug = baseSlug;
  let counter = 1;
  
  while (existingSlugs.has(uniqueSlug)) {
    uniqueSlug = `${baseSlug}-${counter}`;
    counter++;
  }
  
  existingSlugs.add(uniqueSlug);
  return uniqueSlug;
}

async function migrateSlugs() {
  console.log('🔄 Starting slug migration...');
  
  try {
    // Get all posts without slugs
    const postsWithoutSlugs = await db.select().from(posts).where(isNull(posts.slug));
    
    if (postsWithoutSlugs.length === 0) {
      console.log('✅ No posts need slug migration');
      return;
    }
    
    console.log(`📝 Found ${postsWithoutSlugs.length} posts without slugs`);
    
    // Get existing slugs to avoid conflicts
    const existingPosts = await db.select().from(posts);
    const existingSlugs = new Set(existingPosts.map(p => p.slug).filter(Boolean));
    
    // Generate and update slugs
    for (const post of postsWithoutSlugs) {
      const slug = await generateUniqueSlug(post.title, existingSlugs);
      
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