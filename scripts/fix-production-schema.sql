-- Fix Production Database Schema
-- Run this directly on your Hostinger PostgreSQL database

-- Add missing columns to posts table (safe - won't break if columns exist)
ALTER TABLE posts ADD COLUMN IF NOT EXISTS link TEXT;
ALTER TABLE posts ADD COLUMN IF NOT EXISTS link_title TEXT;
ALTER TABLE posts ADD COLUMN IF NOT EXISTS link_description TEXT;
ALTER TABLE posts ADD COLUMN IF NOT EXISTS link_image TEXT;
ALTER TABLE posts ADD COLUMN IF NOT EXISTS link_site_name TEXT;
ALTER TABLE posts ADD COLUMN IF NOT EXISTS slug TEXT;

-- Create unique index on slug column (safe - ignores if exists)
CREATE UNIQUE INDEX IF NOT EXISTS idx_posts_slug_unique ON posts(slug) WHERE slug IS NOT NULL;

-- Update NULL slugs to prevent conflicts
UPDATE posts 
SET slug = 'post-' || id::text 
WHERE slug IS NULL OR slug = '';

-- Verify the changes
SELECT column_name, data_type, is_nullable
FROM information_schema.columns 
WHERE table_name = 'posts' 
ORDER BY ordinal_position;

-- Success message
SELECT 'Database schema updated successfully!' as status;