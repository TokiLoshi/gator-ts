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

export const feeds = pgTable("feeds", {
	id: uuid("id").primaryKey().defaultRandom().notNull(),
	createdAt: timestamp("created_at").notNull().defaultNow(),
	updatedAt: timestamp("updated_at").notNull().defaultNow(),
	name: text("name").notNull(),
	url: text("url").notNull().unique(),
	userId: uuid("user_id")
		.references(() => users.id, { onDelete: "cascade" })
		.notNull(),
});

export const feed_follows = pgTable(
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
