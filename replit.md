# Reddit-Like Social Platform

## Overview

This is a modern Reddit-like social platform built with React, TypeScript, Express.js, and PostgreSQL. The application allows users to create communities, post content, comment on posts, and vote on both posts and comments. It features a clean, responsive design using shadcn/ui components and Tailwind CSS.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **Build Tool**: Vite for fast development and optimized builds
- **UI Library**: shadcn/ui components built on Radix UI primitives
- **Styling**: Tailwind CSS with custom design system
- **State Management**: TanStack Query (React Query) for server state management
- **Routing**: Wouter for lightweight client-side routing
- **Forms**: React Hook Form with Zod validation

### Backend Architecture
- **Runtime**: Node.js with TypeScript
- **Framework**: Express.js for REST API
- **Database**: PostgreSQL with Neon serverless
- **ORM**: Drizzle ORM for type-safe database operations
- **Validation**: Zod schemas for runtime type validation
- **Session Management**: IP-based voting system (no user authentication)

### Data Storage
- **Database**: PostgreSQL hosted on Neon
- **Schema**: Relational design with communities, posts, comments, and votes tables
- **Migrations**: Drizzle migrations in `/migrations` directory
- **Connection**: Serverless connection pooling via @neondatabase/serverless

## Key Components

### Database Schema
- **Communities**: Basic community structure with name and creation timestamp
- **Posts**: Content posts linked to communities with vote counts and comment counts
- **Comments**: Nested comments system with parent-child relationships
- **Votes**: IP-based voting system for both posts and comments

### API Endpoints
- `GET /api/communities` - Fetch all communities
- `POST /api/communities` - Create new community
- `GET /api/posts` - Fetch posts (optionally filtered by community)
- `POST /api/posts` - Create new post
- `GET /api/posts/:id` - Fetch specific post
- `POST /api/comments` - Create new comment
- `POST /api/vote` - Submit vote for post or comment

### Frontend Pages
- **Home**: Main feed showing all posts across communities
- **Community**: Community-specific post feed
- **Post**: Individual post view with comments
- **404**: Error page for invalid routes

### UI Components
- **Header**: Navigation with search, create post/community buttons
- **Sidebar**: Community list navigation
- **PostCard**: Individual post display with voting
- **Comment**: Recursive comment component with replies
- **VoteButton**: Reusable voting component for posts and comments

## Data Flow

1. **Content Creation**: Users create communities and posts through modal forms
2. **Data Fetching**: TanStack Query manages API calls and caching
3. **Real-time Updates**: Optimistic updates for voting with query invalidation
4. **State Synchronization**: Server state kept in sync through intelligent cache management

## External Dependencies

### Core Framework Dependencies
- React ecosystem (react, react-dom, @types/react)
- TypeScript for type safety
- Vite for build tooling and development server

### UI and Styling
- Tailwind CSS for utility-first styling
- Radix UI primitives for accessible components
- Lucide React for icons
- shadcn/ui component library

### Backend Dependencies
- Express.js for REST API
- Drizzle ORM for database operations
- Zod for schema validation
- @neondatabase/serverless for PostgreSQL connection

### Development Tools
- ESBuild for production builds
- TypeScript compiler for type checking
- PostCSS for CSS processing

## Deployment Strategy

### Development
- **Frontend**: Vite dev server with HMR
- **Backend**: tsx for TypeScript execution with nodemon-like functionality
- **Database**: Drizzle migrations via `npm run db:push`

### Production Build
- **Frontend**: Vite builds to `dist/public`
- **Backend**: ESBuild bundles server to `dist/index.js`
- **Deployment**: Single Node.js process serving both API and static files

### Environment Configuration
- `DATABASE_URL`: PostgreSQL connection string (required)
- `NODE_ENV`: Environment mode (development/production)

## Changelog

Changelog:
- July 05, 2025. Initial setup

## User Preferences

Preferred communication style: Simple, everyday language.