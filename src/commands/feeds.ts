import { XMLParser } from "fast-xml-parser";
import { readConfig } from "../../config";
import { getUser, getUserById } from "../lib/db/queries/users";
import {
	createFeed,
	getFeeds,
	getFeedByUrl,
	createFeedFollow,
	getFeedFollowsForUser,
	getFeed,
	deleteFeedFollow,
	getNextFeedToFetch,
	markFeedFetched,
} from "../lib/db/queries/feeds";
import { feeds, users } from "../lib/db/schema";
import { getCurrentUser } from "./users";
import { createPost, getPostsForUser } from "../lib/db/queries/posts";
import type { NewPost, User } from "../lib/db/schema";

type RSSFeed = {
	channel: {
		title: string;
		link: string;
		description: string;
		item: RSSItem[];
	};
};

type RSSItem = {
	title: string;
	link: string;
	description: string;
	pubDate: string;
};

export type Feed = typeof feeds.$inferSelect;

export async function fetchFeed(feedURL: string) {
	// fetch feed data
	const data = await fetch(feedURL, {
		method: "GET",
		// set User-Agent header to gator (identify program to server)
		headers: {
			"User-Agent": "gator",
		},
	});

	console.log("Data from fetch: ", data);
	const text = await data.text();

	// resolve response using text
	console.log("Resolved text: ", text);

	// Parse the XMP
	// use XML Parser constructor from fast-xml parser and create new parser object
	const parser = new XMLParser();
	const parsedData = parser.parse(text);
	// use parse() method on parser object to convert XML into js
	console.log("Parsed Text: ", parsedData);

	// Extract channel field
	const channel = parsedData.rss.channel;
	if (channel.length === 0) {
		console.log("Channel doesn't exist");
		return;
	} else {
		console.log("Channel exists: ", channel);
	}
	// verify channel exists handle errors if it doesn't
	if (!channel.title) {
		console.log("Channel doesn't have a title");
		return;
	}
	if (!channel.link) {
		console.log("Channel doesn't have a link");
		return;
	}
	if (!channel.description) {
		console.log("Channel doesn't have a description");
	}

	// Extract the metadata
	// ensure there is a title, link, and description from the channel field
	const { title, link, description } = channel;

	// Extract feed items
	// if channel field has item field it should be array
	let item = channel.item;
	const isArray = Array.isArray(item);
	if (!item || !isArray) {
		item = [];
	}
	let dataItems = [];

	// use Array.isArray function if its not set field to empty array
	// for each item extract title, link, description and pubdate
	for (let i = 0; i < item.length; i++) {
		const title = item[i].title;
		const description = item[i].description;
		const link = item[i].link;
		const pubDate = item[i].pubDate;
		// skip any item that has missing or invalid fields
		if (!title || !description || !link || !pubDate) {
			continue;
		}
		if (
			typeof title !== "string" ||
			typeof description !== "string" ||
			typeof link !== "string" ||
			typeof pubDate !== "string"
		) {
			continue;
		}

		let newItem: RSSItem = {
			title,
			link,
			description,
			pubDate,
		};

		dataItems.push(newItem);
	}

	// create an object with the channel metadata and list of items

	const newsFeed: RSSFeed = {
		channel: {
			title,
			link,
			description,
			item: dataItems,
		},
	};

	return newsFeed;
}

function parseDuration(durationStr: string) {
	const regex = /^(\d+)(ms|s|m|h)$/;
	const match = durationStr.match(regex);
	if (!match) return;
	if (match.length !== 3) return;

	const duration = parseInt(match[1], 10);
	const multiplier = match[2];

	switch (multiplier) {
		case "ms":
			return duration;
		case "s":
			return duration * 1000;
		case "m":
			return duration * 1000 * 60;
		case "h":
			return duration * 1000 * 60 * 60;
		default:
			return;
	}
}

export async function agg(cmndName: string, ...args: string[]) {
	if (args.length !== 1) {
		throw new Error(`usage: ${cmndName} <time_between_reqs>`);
	}
	const timeArg = args[0];
	const timeBetweenRequests = parseDuration(timeArg);
	if (!timeBetweenRequests) {
		throw new Error(
			`invalid duration: ${timeArg} - format 2h 20min 2s or 1600ms`
		);
	}
	console.log(`Collecting feeds every ${timeBetweenRequests}`);

	scrapeFeeds().catch((error) => console.log(`Error: ${error}`));

	const interval = setInterval(() => {
		scrapeFeeds().catch((error) => console.log(`Error: ${error}`));
	}, timeBetweenRequests);

	await new Promise<void>((resolve) => {
		process.on("SIGNINT", () => {
			console.log("Shutting down the feed aggregator...");
			clearInterval(interval);
			resolve();
		});
	});
}

export async function addfeed(cmdName: string, user: User, ...args: string[]) {
	if (args.length !== 2) {
		throw new Error(`usage: ${cmdName} <feed_name> <url>`);
	}
	const feedName = args[0];
	const url = args[1];
	console.log("Name: ", feedName);
	console.log("Url", url);

	// const configFile = readConfig();
	// const currentUser = configFile["currentUserName"];
	// const users = await getUser(currentUser);
	// const user = users[0];
	// if (!user) {
	// 	throw new Error("no valid id");
	// }
	const userId = user.id;
	const addedFeed = await createFeed(feedName, url, userId);
	printFeed(addedFeed, user);

	const feedInfo = await getFeed(feedName);
	const feedId = feedInfo[0].id;
	const newFeedFollow = await createFeedFollow(userId, feedId);
}

function printFeed(feed: Feed, user: User) {
	console.log(`Feed: ${feed.name} (${feed.url}) [ID: ${feed.id}]`);
	console.log(`User: ${user.name} [User ID: ${user.id}]`);
}

export async function allFeeds() {
	const allFeeds = await getFeeds();
	for (let i = 0; i < allFeeds.length; i++) {
		const feedName = allFeeds[i].name;
		const feedUrl = allFeeds[i].url;
		const userId = allFeeds[i].userId;
		const user = await getUserById(userId);
		const userName = user[0].name;
		console.log(feedName);
		console.log(feedUrl);
		console.log(userName);
	}
}

export async function follow(cmndName: string, user: User, ...args: string[]) {
	if (args.length !== 1) {
		throw new Error(`usage ${cmndName} <feedURL>`);
	}
	const feedUrl = args[0];
	// get current user
	// const currentUser = await getCurrentUser();
	const userId = user.id;
	const feed = await getFeedByUrl(feedUrl);
	const feedId = feed.id;
	// create a new follow record for current user
	const newFeedFollow = await createFeedFollow(userId, feedId);
	console.log(user.name);
	console.log(feed.name);
}

export async function following() {
	const currentUser = await getCurrentUser();
	const currentUserId = currentUser[0].id;
	const feeds = await getFeedFollowsForUser(currentUserId);
	for (let i = 0; i < feeds.length; i++) {
		console.log(feeds[i].name);
	}
}

export async function unfollow(
	cmndName: string,
	user: User,
	...args: string[]
) {
	const feedUrl = args[0];
	if (feedUrl.length === 0) {
		throw new Error(`usage: ${cmndName}: <feedURL>`);
	}
	const unfollowed = await deleteFeedFollow(feedUrl, user.id);
	console.log("Unfollowed: ", unfollowed);
}

async function scrapeFeeds() {
	const feed = await getNextFeedToFetch();
	if (!feed) {
		console.log(`No more feeds`);
		return;
	}
	console.log(`Found feed to fetch!`);
	scrapeFeed(feed);
}

export async function scrapeFeed(feed: Feed) {
	await markFeedFetched(feed.id);
	const feedData = await fetchFeed(feed.url);

	if (!feedData) {
		throw new Error("something went wrong fetching feed data");
	}

	for (let item of feedData.channel.item) {
		console.log(`Found post: ${item.title}`);
		const now = new Date();
		await createPost({
			url: item.link,
			feedId: feed.id,
			title: item.title,
			createdAt: now,
			updatedAt: now,
			description: item.description,
			publishedAt: new Date(item.pubDate),
		} satisfies NewPost);
	}
	console.log(
		`Feed ${feed.name} collected, ${feedData.channel.item.length} posts found`
	);
}

export async function browse(cmdName: string, user: User, ...args: string[]) {
	console.log("User: ", user);
	let limit = 2;
	if (args.length === 1) {
		let postLimit = parseInt(args[0]);
		if (postLimit) {
			limit = postLimit;
		} else {
			throw new Error(`usage: ${cmdName} [limit]`);
		}
	}
	const posts = await getPostsForUser(user.id, limit);
	console.log(`Found: ${posts.length} posts for user ${user.name}`);

	for (let post of posts) {
		console.log(`${post.publishedAt} from ${post.feedName}`);
		console.log(`---${post.title}---`);
		console.log(` ${post.description}   `);
		console.log(`Link: ${post.url}`);
		console.log(`=======>>>`);
	}
}
