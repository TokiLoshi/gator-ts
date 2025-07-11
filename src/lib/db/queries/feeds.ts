import { UUID } from "crypto";
import { db } from "..";
import { feeds } from "../schema";
import { eq } from "drizzle-orm";

export async function createFeed(name: string, url: string, userId: string) {
	const [result] = await db
		.insert(feeds)
		.values({
			name,
			url,
			userId,
		})
		.returning();
	return result;
}

export async function getFeed(name: string) {
	const result = await db.select().from(feeds).where(eq(feeds.name, name));
	return result;
}

export async function getFeeds() {
	const result = await db.select().from(feeds);
	return result;
}
