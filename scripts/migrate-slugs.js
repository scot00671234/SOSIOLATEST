const { drizzle } = require('drizzle-orm/node-postgres');
const { Pool } = require('pg');
const { posts } = require('../shared/schema.ts');
const { eq, isNull } = require('drizzle-orm');

// Slug generation function
function createPostSlug(title) {
  return title.toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .replace(/-+/g, '-')
    .substring(0, 100); // Limit slug length
}

async function generateUniqueSlug(db, title, existingSlugs = new Set()) {
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
  
  // Create database connection
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL || 'postgresql://replit:replit@localhost:5432/replit'
  });
  
  const db = drizzle(pool);
  
  try {
    // Get all posts without slugs
    const postsWithoutSlugs = await db.select().from(posts).where(isNull(posts.slug));
    
    if (postsWithoutSlugs.length === 0) {
      console.log('✅ No posts need slug migration');
      return;
    }
    
    console.log(`📝 Found ${postsWithoutSlugs.length} posts without slugs`);
    
    // Get existing slugs to avoid conflicts
    const existingPosts = await db.select().from(posts).where(posts.slug);
    const existingSlugs = new Set(existingPosts.map(p => p.slug).filter(Boolean));
    
    // Generate and update slugs
    for (const post of postsWithoutSlugs) {
      const slug = await generateUniqueSlug(db, post.title, existingSlugs);
      
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
  } finally {
    await pool.end();
  }
}

// Run if called directly
if (require.main === module) {
  migrateSlugs().catch((error) => {
    console.error('Migration failed:', error);
    process.exit(1);
  });
}

module.exports = { migrateSlugs };