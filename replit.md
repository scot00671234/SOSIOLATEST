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
- **2025-01-06**: Completed migration to Replit environment
  - Created PostgreSQL database with environment variables
  - Installed Node.js dependencies
  - Fixed database migration by running `npm run db:push`
  - APIs now returning 200 status codes
  - Application ready for deployment

## Key Features
- Communities creation and management
- Post creation with voting system
- Nested comments with voting
- Search functionality
- Responsive UI with dark/light theme
- IP-based vote tracking (no user accounts needed)

## API Endpoints
- `GET /api/communities` - List all communities
- `POST /api/communities` - Create new community
- `GET /api/posts` - List posts (optionally filtered by community)
- `POST /api/posts` - Create new post
- `GET /api/posts/:id/comments` - Get comments for post
- `POST /api/comments` - Create new comment
- `POST /api/vote` - Vote on post or comment
- `GET /api/search` - Search posts, communities, and comments

## Database Schema
- **communities**: id, name, description, created_at
- **posts**: id, title, content, community_id, votes, comment_count, created_at
- **comments**: id, content, post_id, parent_id, votes, created_at
- **votes**: id, ip_address, target_type, target_id, vote_type, created_at

## Project Structure
- `/server` - Express.js backend
- `/client` - React frontend
- `/shared` - Shared TypeScript schemas and types
- Database configuration in `server/db.ts`
- API routes in `server/routes.ts`
- Data access layer in `server/storage.ts`

## User Preferences
*No specific user preferences recorded yet*