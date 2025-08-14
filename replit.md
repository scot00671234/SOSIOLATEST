# REST Express Social Platform

## Overview
This project is a Reddit-style social platform enabling users to create and join communities, post content, comment, and engage through a voting system. The platform aims to provide a robust, free-speech environment for community interaction, including features like anonymous usage and content policy adherence. A key business ambition is the integration of a text-based advertising system, offering a revenue stream through sponsored content seamlessly integrated into the user experience.

## User Preferences
- Remove "Advertise" button from navigation
- Reddit-style voting system behavior required
- Posts and comments should start at 1 vote, not 0
- Unlimited voting capacity needed - no 2-vote maximum
- Clean, minimalist UI styling for Community Notes feature
- Subtle outline button styling preferred over bold colors
- Communities sidebar should show full expanded layout with proper spacing and text truncation
- Community text should be truncated with ellipsis and flexbox constraints to prevent boundary issues
- Community Notes links must direct to actual external sites, not back to posts
- Comments should be sorted by Hot/New algorithm like posts, not just chronologically
- Communities sidebar should have text truncation with ellipsis (...)
- Communities sidebar should include sorting: Popular / Alphabetic / New
- Blog section added to navigation menu with SEO-focused content targeting free speech and Reddit alternative keywords

## System Architecture
The platform is built with a clear separation of concerns, using an Express.js backend with TypeScript and a React frontend with Vite. Data persistence is handled by PostgreSQL with Drizzle ORM.

**Technical Implementations:**
- **Backend**: Express.js server, TypeScript, Node.js.
- **Frontend**: React, Vite, Tailwind CSS for styling, Radix UI for accessible components.
- **Database**: PostgreSQL with Drizzle ORM for type-safe database interactions.
- **Authentication**: Session-based authentication with IP tracking for a unique voting system that does not require user accounts.
- **Voting System**: Implements a Reddit-style "hot" ranking algorithm combining votes and time, alongside a "new" sorting option. Votes are IP-based, allowing for unlimited voting from different IPs on the same post. Posts and comments start with a score of 1.
- **Community Notes**: Allows users to suggest helpful resources on posts via a modal, with each note having its own title, URL, and a 200-word comment. Notes have an independent voting system with step-by-step voting transitions, where high-scoring resources rise to the top. Features clean UI styling that matches the site theme. URLs are automatically formatted with proper protocols and direct to external sites.
- **Communities Sidebar**: Clean expanded design with sorting options (Popular, A-Z, New) defaulting to Popular, with proper text truncation and overflow handling to prevent boundary issues. Popular sorting is based on post count per community.
- **Comment Sorting**: Comments now support Hot/New sorting algorithms identical to posts, with Hot sorting using Reddit-style algorithm combining votes and time, and New sorting by creation date. Sorting is applied recursively to nested comment threads.
- **Advertising System**: A text-based ad system with Stripe integration allows users to purchase impressions. Ads are injected every 10 posts in the main feed, with impression tracking and automatic deactivation upon reaching paid impression limits. Sponsored ads are distinctly styled and labeled.
- **UI/UX Decisions**:
    - Minimalist design theme with adaptable styling for light/dark modes.
    - Responsive UI, including hidden communities sidebar on mobile.
    - Consistent navigation with scroll-to-top functionality on page changes.
    - Entire post cards are clickable for improved user experience, while preserving individual button functionalities.
    - Clean modal designs for features like Community Notes and general information (About, Privacy Policy, Stay Safe).
    - SEO-friendly URL structure for posts (e.g., `/post/id/slug`) and communities (e.g., `/c/community-name`).

**Feature Specifications:**
- **Communities**: Creation and management of distinct communities.
- **Posts**: Creation of posts within communities, with content and voting.
- **Comments**: Nested comments with individual voting capabilities.
- **Search**: Comprehensive search functionality across posts, communities, and comments.
- **About/Policy Sections**: Modals for About, Privacy Policy, Stay Safe, and Feedback information.
- **Blog**: SEO-optimized blog section with articles targeting keywords for Reddit alternatives, free speech social media, and community platforms without censorship.

## External Dependencies
- **Database**: PostgreSQL (with Drizzle ORM)
- **Payment Processing**: Stripe (for advertising system)
- **Styling**: Tailwind CSS, Radix UI

## Deployment Notes
- Automatic database migrations configured via `scripts/migrate-db.js`
- Community Notes table included in production migration script
- Nixpacks deployment runs migrations automatically before app start