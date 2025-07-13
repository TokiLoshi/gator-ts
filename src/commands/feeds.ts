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
export type User = typeof users.$inferSelect;

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

function parseDuration(durationStr: string): number {
	const regex = /^(\d+)(ms|s|m|h)$/;
	const match = durationStr.match(regex);
	if (match) {
		const duration = parseInt(match[1]);
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
				return 16000;
		}
	}
	return 16000;
}

export async function agg(time_between_reqs: string) {
	const duration = parseDuration(time_between_reqs);
	console.log(`Collecting feeds every ${time_between_reqs}`);

	scrapeFeeds().catch((error) => console.log(`Error: ${error}`));

	const interval = setInterval(() => {
		scrapeFeeds().catch((error) => console.log(`Error: ${error}`));
	}, duration);

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

export async function scrapeFeeds() {
	// get the next feed to fetch from the db
	const nextFeed = await getNextFeedToFetch();

	if (nextFeed) {
		// mark it as fetched
		const feedId = nextFeed?.id;
		const markedFetch = await markFeedFetched(feedId);
		// fetch the feed using the url
		const feedURL = nextFeed.url;
		const feed = await fetchFeed(feedURL);
		if (!feed) {
			console.log("No feed to fetch");
		} else if (feed) {
			const feedItem = feed.channel.item;
			for (let i = 0; i < feedItem.length; i++) {
				const title = feedItem[i].title;
				if (title) {
					console.log(`Title: ${title}`);
				}
			}
		}
	}
}
