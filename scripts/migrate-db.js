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

const pool = new Pool({
  connectionString,
  ssl: false, // VPS doesn't support SSL
  max: 5,
  connectionTimeoutMillis: 10000,
});

const db = drizzle(pool);

async function runMigration() {
  try {
    console.log('🔄 Running database migration...');
    
    // Create tables manually to match Drizzle schema exactly
    await pool.query(`
      -- Create communities table
      CREATE TABLE IF NOT EXISTS communities (
        id SERIAL PRIMARY KEY,
        name TEXT NOT NULL UNIQUE,
        description TEXT,
        created_at TIMESTAMP DEFAULT NOW() NOT NULL
      );

      -- Create posts table  
      CREATE TABLE IF NOT EXISTS posts (
        id SERIAL PRIMARY KEY,
        title TEXT NOT NULL,
        content TEXT NOT NULL,
        community_id INTEGER NOT NULL REFERENCES communities(id),
        votes INTEGER DEFAULT 1 NOT NULL,
        comment_count INTEGER DEFAULT 0 NOT NULL,
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

      -- Create indexes for performance
      CREATE INDEX IF NOT EXISTS idx_posts_community_id ON posts(community_id);
      CREATE INDEX IF NOT EXISTS idx_posts_created_at ON posts(created_at DESC);
      CREATE INDEX IF NOT EXISTS idx_comments_post_id ON comments(post_id);
      CREATE INDEX IF NOT EXISTS idx_comments_parent_id ON comments(parent_id);
      CREATE INDEX IF NOT EXISTS idx_votes_target ON votes(target_type, target_id);
      CREATE INDEX IF NOT EXISTS idx_sponsored_ads_active ON sponsored_ads(active);
      CREATE INDEX IF NOT EXISTS idx_community_notes_post_id ON community_notes(post_id);
      CREATE INDEX IF NOT EXISTS idx_community_notes_votes ON community_notes(votes DESC);
    `);

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