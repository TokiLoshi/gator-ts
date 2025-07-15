import { pgTable, timestamp, uuid, text, unique } from "drizzle-orm/pg-core";
import { db } from "..";
import { NewPost, posts, users, feeds, feedFollows } from "../schema";
import { asc, desc, eq } from "drizzle-orm";

export async function createPost(post: NewPost) {
	const [result] = await db.insert(posts).values(post).returning();
	return result;
}

export async function getPostsForUser(userId: string, postLimit: number) {
	console.log("getting posts for user");
	// get posts for user in order
	const result = await db
		.select({
			id: posts.id,
			createdAt: posts.updatedAt,
			title: posts.title,
			url: posts.url,
			description: posts.description,
			publishedAt: posts.publishedAt,
			feedId: posts.feedId,
			feedName: feeds.name,
		})
		.from(posts)
		.innerJoin(feedFollows, eq(posts.feedId, feedFollows.feedId))
		.innerJoin(feeds, eq(posts.feedId, feeds.id))
		.where(eq(feedFollows.userId, userId))
		.orderBy(desc(posts.publishedAt))
		.limit(postLimit);

	return result;
}
