import { pgTable, timestamp, uuid, text, unique } from "drizzle-orm/pg-core";

export const users = pgTable("users", {
	id: uuid("id").primaryKey().defaultRandom().notNull(),
	createdAt: timestamp("created_at").notNull().defaultNow(),
	updatedAt: timestamp("updated_at")
		.notNull()
		.defaultNow()
		.$onUpdate(() => new Date()),
	name: text("name").notNull().unique(),
});

export type User = typeof users.$inferSelect;

export const feeds = pgTable("feeds", {
	id: uuid("id").primaryKey().defaultRandom().notNull(),
	createdAt: timestamp("created_at").notNull().defaultNow(),
	updatedAt: timestamp("updated_at").notNull().defaultNow(),
	lastFetchedAt: timestamp("last_fetched_at"),
	name: text("name").notNull(),
	url: text("url").notNull().unique(),
	userId: uuid("user_id")
		.references(() => users.id, { onDelete: "cascade" })
		.notNull(),
});

export type Feed = typeof feeds.$inferSelect;

export const feedFollows = pgTable(
	"feed_follows",
	{
		id: uuid("id").primaryKey().defaultRandom().notNull(),
		createdAt: timestamp("created_at").notNull().defaultNow(),
		updatedAt: timestamp("updated_at").notNull().defaultNow(),
		userId: uuid("user_id").references(() => users.id, { onDelete: "cascade" }),
		feedId: uuid("feed_id").references(() => feeds.id, { onDelete: "cascade" }),
	},
	(table) => [unique().on(table.userId, table.feedId)]
);

export type FeedFollows = typeof feeds.$inferSelect;

export const posts = pgTable("posts", {
	id: uuid("id").primaryKey().defaultRandom().notNull(),
	createdAt: timestamp("created_at").notNull().defaultNow(),
	updatedAt: timestamp("updated_at").notNull().defaultNow(),
	title: text("title").notNull(),
	url: text("url").notNull().unique(),
	description: text("description"),
	publishedAt: timestamp("published_at"),
	feedId: uuid("feed_id").references(() => feeds.id, { onDelete: "cascade" }),
});

export type NewPost = typeof posts.$inferInsert;
export type Post = typeof posts.$inferSelect;
