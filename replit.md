# REST Express Social Platform

## Overview
A Reddit-style social platform built with Express.js backend and React frontend. Features communities, posts, comments, and voting system.

## Architecture
- **Backend**: Express.js server with TypeScript
- **Frontend**: React with Vite
- **Database**: PostgreSQL with Drizzle ORM
- **Authentication**: Session-based with IP tracking for voting
- **Styling**: Tailwind CSS with Radix UI components

## Recent Changes
- **2025-01-10**: Created Dokploy VPS Deployment Configuration
  - Added nixpacks.toml to force Node.js deployment and prevent Caddy conflicts
  - Created alternative Dockerfile for pure Node.js container deployment
  - Configured proper build commands and environment variables for VPS deployment
  - Ensured deployment files are not gitignored and will be included in repository
- **2025-01-10**: Fixed Stripe Payment Integration
  - Resolved "A processing error occurred" by fixing invalid hardcoded API keys
  - Implemented proper environment variable handling for STRIPE_SECRET_KEY and STRIPE_PUBLISHABLE_KEY
  - Added secure key validation and clear error messaging when Stripe is not configured
  - Payment system now fully operational with valid API keys from user's Stripe account
  - Both backend payment intent creation and frontend payment processing working correctly
- **2025-01-10**: Added Text-Based Ad System
  - Created complete Stripe-integrated ad system with $2 per 1000 impressions pricing
  - Added `/advertise` page with form for title, body, link, and impression selection
  - Built sponsored ads database table with impression tracking and auto-deactivation
  - Implemented ad injection every 10 posts in the main feed
  - Added "Advertise" button to header navigation
  - Created distinct sponsored ad component with orange styling and "Sponsored" badge
  - Added content policy disclaimer about violent/hostile ad removal
  - System ready for Stripe API key integration for payment processing
- **2025-01-10**: Enhanced URL structure and navigation
  - Updated post URLs to include title slugs (e.g., `/post/15/tell-me-about-what-you-are-building`)
  - Made community names clickable throughout the application
  - Created utility function `createPostSlug()` for consistent URL generation
  - Community links now use name-based routing `/c/community-name`
  - Improved user experience with SEO-friendly URLs
- **2025-01-09**: Completed migration from Replit Agent to standard Replit environment
  - Set up PostgreSQL database with proper environment variables
  - Ran database migration with `npm run db:push` to create all tables
  - Fixed community routing issue: added `/c/:name` route to handle name-based navigation
  - Updated CommunityPage component to support both ID and name-based routing
  - Application fully functional with search, community navigation, and all features working
- **2025-01-06**: Initial Replit environment setup
  - Created PostgreSQL database with environment variables
  - Installed Node.js dependencies
  - Fixed database migration by running `npm run db:push`
  - Switched from Neon serverless to standard PostgreSQL driver for Railway compatibility
  - Fixed database connection issues for both Replit and Railway deployments
  - APIs now returning 200 status codes consistently
  - Increased Railway healthcheck timeout to 300s for reliable deployments

## Key Features
- Communities creation and management
- Post creation with voting system
- Nested comments with voting
- Search functionality
- Responsive UI with dark/light theme
- IP-based vote tracking (no user accounts needed)
- Text-based advertising system with Stripe payments
- Ad injection every 10 posts with impression tracking
- Automated ad deactivation when impression limit reached

## API Endpoints
- `GET /api/communities` - List all communities
- `POST /api/communities` - Create new community
- `GET /api/posts` - List posts (optionally filtered by community)
- `POST /api/posts` - Create new post
- `GET /api/posts/:id/comments` - Get comments for post
- `POST /api/comments` - Create new comment
- `POST /api/vote` - Vote on post or comment
- `GET /api/search` - Search posts, communities, and comments
- `POST /api/create-ad-payment` - Create Stripe payment intent for ads
- `GET /api/active-ad` - Get active ad for feed injection (increments impressions)

## Database Schema
- **communities**: id, name, description, created_at
- **posts**: id, title, content, community_id, votes, comment_count, created_at
- **comments**: id, content, post_id, parent_id, votes, created_at
- **votes**: id, ip_address, target_type, target_id, vote_type, created_at
- **sponsored_ads**: id, title, body, link, impressions_paid, impressions_served, active, stripe_payment_intent_id, created_at

## Project Structure
- `/server` - Express.js backend
- `/client` - React frontend
- `/shared` - Shared TypeScript schemas and types
- Database configuration in `server/db.ts`
- API routes in `server/routes.ts`
- Data access layer in `server/storage.ts`

## User Preferences
*No specific user preferences recorded yet*