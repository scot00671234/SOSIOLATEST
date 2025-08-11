import { pgTable, text, serial, integer, timestamp, boolean, varchar } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const communities = pgTable("communities", {
  id: serial("id").primaryKey(),
  name: text("name").notNull().unique(),
  description: text("description"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const posts = pgTable("posts", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  content: text("content").notNull(),
  communityId: integer("community_id").notNull().references(() => communities.id),
  votes: integer("votes").default(0).notNull(),
  commentCount: integer("comment_count").default(0).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const comments = pgTable("comments", {
  id: serial("id").primaryKey(),
  content: text("content").notNull(),
  postId: integer("post_id").notNull().references(() => posts.id),
  parentId: integer("parent_id"),
  votes: integer("votes").default(0).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});



export const votes = pgTable("votes", {
  id: serial("id").primaryKey(),
  ipAddress: text("ip_address").notNull(),
  targetType: text("target_type").notNull(), // 'post' or 'comment'
  targetId: integer("target_id").notNull(),
  voteType: integer("vote_type").notNull(), // 1 for upvote, -1 for downvote
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const sponsoredAds = pgTable("sponsored_ads", {
  id: serial("id").primaryKey(),
  title: varchar("title", { length: 200 }).notNull(),
  body: text("body"),
  link: varchar("link", { length: 500 }),
  impressionsPaid: integer("impressions_paid").notNull(),
  impressionsServed: integer("impressions_served").default(0).notNull(),
  active: boolean("active").default(true).notNull(),
  stripePaymentIntentId: varchar("stripe_payment_intent_id", { length: 100 }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Relations
export const communitiesRelations = relations(communities, ({ many }) => ({
  posts: many(posts),
}));

export const postsRelations = relations(posts, ({ one, many }) => ({
  community: one(communities, {
    fields: [posts.communityId],
    references: [communities.id],
  }),
  comments: many(comments),
}));

export const commentsRelations = relations(comments, ({ one, many }) => ({
  post: one(posts, {
    fields: [comments.postId],
    references: [posts.id],
  }),
  parent: one(comments, {
    fields: [comments.parentId],
    references: [comments.id],
    relationName: "parent_child",
  }),
  children: many(comments, {
    relationName: "parent_child",
  }),
}));

// Insert schemas
export const insertCommunitySchema = createInsertSchema(communities).omit({
  id: true,
  createdAt: true,
});

export const insertPostSchema = createInsertSchema(posts).omit({
  id: true,
  votes: true,
  commentCount: true,
  createdAt: true,
});

export const insertCommentSchema = createInsertSchema(comments).omit({
  id: true,
  votes: true,
  createdAt: true,
});

export const insertVoteSchema = createInsertSchema(votes).omit({
  id: true,
  createdAt: true,
});

export const insertSponsoredAdSchema = createInsertSchema(sponsoredAds).omit({
  id: true,
  impressionsServed: true,
  active: true,
  createdAt: true,
});

export const createAdSchema = z.object({
  title: z.string().min(1, "Title is required").max(200, "Title too long"),
  body: z.string().max(1000, "Body too long").optional(),
  link: z.string().min(1).optional().or(z.literal("")).transform((val) => {
    if (!val || val === "") return "";
    // Add https:// if no protocol specified
    if (!val.startsWith("http://") && !val.startsWith("https://")) {
      return `https://${val}`;
    }
    return val;
  }),
  impressions: z.number().min(1000, "Minimum 1000 impressions").max(100000, "Maximum 100000 impressions"),
  email: z.string().email("Must be a valid email address").optional(),
});

// Types
export type Community = typeof communities.$inferSelect;
export type Post = typeof posts.$inferSelect;
export type Comment = typeof comments.$inferSelect;
export type Vote = typeof votes.$inferSelect;
export type SponsoredAd = typeof sponsoredAds.$inferSelect;

export type InsertCommunity = z.infer<typeof insertCommunitySchema>;
export type InsertPost = z.infer<typeof insertPostSchema>;
export type InsertComment = z.infer<typeof insertCommentSchema>;
export type InsertVote = z.infer<typeof insertVoteSchema>;
export type InsertSponsoredAd = z.infer<typeof insertSponsoredAdSchema>;
export type CreateAd = z.infer<typeof createAdSchema>;

// Extended types for joined data
export type PostWithCommunity = Post & {
  community: Community;
  userVote?: 1 | -1 | null;
};

export type CommentWithChildren = Comment & {
  children: CommentWithChildren[];
  userVote?: 1 | -1 | null;
};
