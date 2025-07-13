import { UUID } from "crypto";
import { db } from "..";
import { feeds, feed_follows, users } from "../schema";
import { and, eq, sql } from "drizzle-orm";

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

export async function createFeedFollow(user_id: string, feed_id: string) {
	// insert a feedfollow record
	const [newFeedFollow] = await db
		.insert(feed_follows)
		.values({
			userId: user_id,
			feedId: feed_id,
		})
		.returning();

	const [joinedFollows] = await db
		.select({
			id: feed_follows.id,
			createdAt: feed_follows.createdAt,
			updatedAt: feed_follows.updatedAt,
			userId: feed_follows.userId,
			feedId: feed_follows.feedId,
			userName: users.name,
			feedName: feeds.name,
		})
		.from(feed_follows)
		.innerJoin(users, eq(feed_follows.userId, users.id))
		.innerJoin(feeds, eq(feed_follows.feedId, feeds.id))
		.where(eq(feed_follows.id, newFeedFollow.id));

	return joinedFollows;
}

export async function getFeedByUrl(feed_url: string) {
	const [feed] = await db.select().from(feeds).where(eq(feeds.url, feed_url));
	return feed;
}

export async function getFeedFollowsForUser(id: string) {
	const userFeeds = await db
		.select({
			name: feeds.name,
		})
		.from(feed_follows)
		.innerJoin(feeds, eq(feed_follows.feedId, feeds.id))
		.where(eq(feed_follows.userId, id));
	return userFeeds;
}

export async function deleteFeedFollow(feedUrl: string, userId: string) {
	const feed = await getFeedByUrl(feedUrl);
	if (!feed) {
		throw new Error("feed doesn't exist");
	}
	const feedId = feed.id;

	const deletedFeedFollow = await db
		.delete(feed_follows)
		.where(
			and(eq(feed_follows.feedId, feedId), eq(feed_follows.userId, userId))
		)
		.returning();
	return deletedFeedFollow;
}

export async function markFeedFetched(feedId: string) {
	const currentTime = new Date();
	const fetchedFeed = await db
		.update(feeds)
		.set({
			updatedAt: currentTime,
			lastFetchedAt: currentTime,
		})
		.where(eq(feeds.id, feedId));
}

export async function getNextFeedToFetch() {
	const orderedFeeds = await db
		.select()
		.from(feeds)
		.orderBy(sql`${feeds.lastFetchedAt} asc nulls first`);

	if (orderedFeeds.length === 0) {
		return;
	}
	const nextFeed = orderedFeeds[0];
	return nextFeed;
}
