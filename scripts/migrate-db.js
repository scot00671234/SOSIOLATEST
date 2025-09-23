#!/usr/bin/env node

// Database migration script for production deployment
// This ensures the database schema exists when deployed to VPS

import { drizzle } from 'drizzle-orm/node-postgres';
import { migrate } from 'drizzle-orm/node-postgres/migrator';
import pg from 'pg';
const { Pool } = pg;

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  console.error('❌ DATABASE_URL environment variable is required');
  process.exit(1);
}

console.log('🔄 Connecting to database...');

// Configure SSL based on DATABASE_URL or environment
let sslConfig = false;
if (connectionString.includes('sslmode=require') || process.env.DATABASE_SSL === 'true') {
  sslConfig = { rejectUnauthorized: false };
}

const pool = new Pool({
  connectionString,
  ssl: sslConfig,
  max: 5,
  connectionTimeoutMillis: 10000,
});

const db = drizzle(pool);

async function runMigration() {
  try {
    console.log('🔄 Running database migration...');
    
    // First, create tables if they don't exist (for new deployments)
    await pool.query(`
      -- Create communities table
      CREATE TABLE IF NOT EXISTS communities (
        id SERIAL PRIMARY KEY,
        name TEXT NOT NULL UNIQUE,
        description TEXT,
        created_at TIMESTAMP DEFAULT NOW() NOT NULL
      );

      -- Create posts table (for new databases)
      CREATE TABLE IF NOT EXISTS posts (
        id SERIAL PRIMARY KEY,
        title TEXT NOT NULL,
        slug TEXT UNIQUE,
        content TEXT NOT NULL,
        community_id INTEGER NOT NULL REFERENCES communities(id),
        votes INTEGER DEFAULT 1 NOT NULL,
        comment_count INTEGER DEFAULT 0 NOT NULL,
        link TEXT,
        link_title TEXT,
        link_description TEXT,
        link_image TEXT,
        link_site_name TEXT,
        created_at TIMESTAMP DEFAULT NOW() NOT NULL
      );

      -- Create comments table
      CREATE TABLE IF NOT EXISTS comments (
        id SERIAL PRIMARY KEY,
        content TEXT NOT NULL,
        post_id INTEGER NOT NULL REFERENCES posts(id),
        parent_id INTEGER REFERENCES comments(id),
        votes INTEGER DEFAULT 1 NOT NULL,
        created_at TIMESTAMP DEFAULT NOW() NOT NULL
      );

      -- Create votes table
      CREATE TABLE IF NOT EXISTS votes (
        id SERIAL PRIMARY KEY,
        ip_address TEXT NOT NULL,
        target_type TEXT NOT NULL,
        target_id INTEGER NOT NULL,
        vote_type INTEGER NOT NULL,
        created_at TIMESTAMP DEFAULT NOW() NOT NULL
      );

      -- Create sponsored_ads table
      CREATE TABLE IF NOT EXISTS sponsored_ads (
        id SERIAL PRIMARY KEY,
        title VARCHAR(200) NOT NULL,
        body TEXT,
        link VARCHAR(500),
        impressions_paid INTEGER NOT NULL,
        impressions_served INTEGER DEFAULT 0 NOT NULL,
        active BOOLEAN DEFAULT true NOT NULL,
        stripe_payment_intent_id VARCHAR(100),
        created_at TIMESTAMP DEFAULT NOW() NOT NULL
      );

      -- Create community_notes table
      CREATE TABLE IF NOT EXISTS community_notes (
        id SERIAL PRIMARY KEY,
        post_id INTEGER NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
        title VARCHAR(255) NOT NULL,
        url VARCHAR(500) NOT NULL,
        comment TEXT NOT NULL,
        votes INTEGER DEFAULT 1 NOT NULL,
        created_at TIMESTAMP DEFAULT NOW() NOT NULL
      );

    `);

    // Now add missing columns to existing posts table (critical for production)
    console.log('🔄 Adding missing columns to existing posts table...');
    
    try {
      await pool.query('ALTER TABLE posts ADD COLUMN IF NOT EXISTS slug TEXT');
      console.log('✅ Added slug column');
    } catch (e) { console.log('ℹ️  Slug column already exists or error:', e.message); }
    
    try {
      await pool.query('ALTER TABLE posts ADD COLUMN IF NOT EXISTS link TEXT');
      console.log('✅ Added link column');
    } catch (e) { console.log('ℹ️  Link column already exists or error:', e.message); }
    
    try {
      await pool.query('ALTER TABLE posts ADD COLUMN IF NOT EXISTS link_title TEXT');
      console.log('✅ Added link_title column');
    } catch (e) { console.log('ℹ️  Link_title column already exists or error:', e.message); }
    
    try {
      await pool.query('ALTER TABLE posts ADD COLUMN IF NOT EXISTS link_description TEXT');
      console.log('✅ Added link_description column');
    } catch (e) { console.log('ℹ️  Link_description column already exists or error:', e.message); }
    
    try {
      await pool.query('ALTER TABLE posts ADD COLUMN IF NOT EXISTS link_image TEXT');
      console.log('✅ Added link_image column');  
    } catch (e) { console.log('ℹ️  Link_image column already exists or error:', e.message); }
    
    try {
      await pool.query('ALTER TABLE posts ADD COLUMN IF NOT EXISTS link_site_name TEXT');
      console.log('✅ Added link_site_name column');
    } catch (e) { console.log('ℹ️  Link_site_name column already exists or error:', e.message); }

    // Continue with remaining table creation
    await pool.query(`
      
      -- Create indexes for other tables  
      CREATE INDEX IF NOT EXISTS idx_comments_post_id ON comments(post_id);
      CREATE INDEX IF NOT EXISTS idx_comments_parent_id ON comments(parent_id);
      CREATE INDEX IF NOT EXISTS idx_votes_target ON votes(target_type, target_id);
      CREATE INDEX IF NOT EXISTS idx_sponsored_ads_active ON sponsored_ads(active);
      CREATE INDEX IF NOT EXISTS idx_community_notes_post_id ON community_notes(post_id);
      CREATE INDEX IF NOT EXISTS idx_community_notes_votes ON community_notes(votes DESC);
    `);

    // Create indexes for performance
    try {
      await pool.query('CREATE INDEX IF NOT EXISTS idx_posts_community_id ON posts(community_id)');
      await pool.query('CREATE INDEX IF NOT EXISTS idx_posts_created_at ON posts(created_at DESC)');
      await pool.query('CREATE UNIQUE INDEX IF NOT EXISTS idx_posts_slug_unique ON posts(slug) WHERE slug IS NOT NULL AND slug != \'\'');
      console.log('✅ Created database indexes with unique slug constraint');
    } catch (e) { 
      console.log('ℹ️  Indexes already exist or error:', e.message); 
    }

    // Backfill slugs for existing posts (CRITICAL FOR PRODUCTION)
    console.log('🔄 Backfilling slugs for existing posts...');
    
    try {
      // Get posts that don't have slugs
      const postsResult = await pool.query('SELECT id, title FROM posts WHERE slug IS NULL OR slug = $1', ['']);
      
      if (postsResult.rows.length > 0) {
        console.log(`📝 Found ${postsResult.rows.length} posts without slugs`);
        
        // Get all existing slugs to avoid duplicates
        const existingSlugsResult = await pool.query('SELECT DISTINCT slug FROM posts WHERE slug IS NOT NULL AND slug != $1', ['']);
        const existingSlugs = new Set(existingSlugsResult.rows.map(row => row.slug));
        
        // Function to create URL-friendly slug
        function createPostSlug(title) {
          if (!title) return 'untitled';
          return title.toLowerCase()
            .replace(/[^a-z0-9\s-]/g, '') // Remove special characters
            .replace(/\s+/g, '-') // Replace spaces with hyphens
            .replace(/-+/g, '-') // Remove duplicate hyphens  
            .replace(/^-|-$/g, '') // Remove leading/trailing hyphens
            .substring(0, 80) || 'untitled'; // Limit slug length with fallback
        }
        
        // Function to generate unique slug
        function generateUniqueSlug(title, postId, existingSlugs) {
          const baseSlug = createPostSlug(title);
          let uniqueSlug = baseSlug + '-' + postId; // Always include post ID for uniqueness
          
          // If still conflicts, add counter
          let counter = 2;
          while (existingSlugs.has(uniqueSlug)) {
            uniqueSlug = `${baseSlug}-${postId}-${counter}`;
            counter++;
          }
          
          existingSlugs.add(uniqueSlug);
          return uniqueSlug;
        }
        
        // Update each post with a unique slug
        for (const post of postsResult.rows) {
          const slug = generateUniqueSlug(post.title, post.id, existingSlugs);
          await pool.query('UPDATE posts SET slug = $1 WHERE id = $2', [slug, post.id]);
        }
        
        console.log(`✅ Successfully generated slugs for ${postsResult.rows.length} posts`);
      } else {
        console.log('✅ All posts already have slugs');
      }
    } catch (slugError) {
      console.error('⚠️  Slug generation error (non-critical):', slugError.message);
      console.log('✅ Continuing migration - posts will work without slugs');
    }

    console.log('✅ Database migration completed successfully!');
    console.log('📊 All tables created:');
    console.log('   • communities');
    console.log('   • posts');
    console.log('   • comments');
    console.log('   • votes');
    console.log('   • sponsored_ads');
    console.log('   • community_notes');
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

runMigration();