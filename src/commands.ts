import setUser from "../config.js";
import {
	createUser,
	getUser,
	deleteUsers,
	getUsers,
} from "./lib/db/queries/users.js";
import { createFeed, getFeed, getFeeds } from "./lib/db/queries/feeds.js";
import { readConfig } from "../config.js";
import { XMLParser, XMLValidator } from "fast-xml-parser";
import { users, feeds } from "./lib/db/schema.js";

export type CommandHandler = (
	cmdName: string,
	...args: string[]
) => Promise<void>;

export type CommandsRegistry = Record<string, CommandHandler>;

export async function handlerLogin(cmdName: string, ...args: string[]) {
	// if args is empty throw an error
	if (args.length === 0) {
		throw new Error("username cannot be empty");
	}
	// handlerLogin takes username as single arg
	const userName = args[0];
	// use setUser function to set user to given username
	const existingUser = await getUser(userName);
	if (existingUser.length === 0) {
		throw new Error("cannot login, user doesn't exist");
	}
	setUser(userName);
	console.log(`username has been set to: ${userName}`);
}

export async function registerCommand(
	registry: CommandsRegistry,
	cmdName: string,
	handler: CommandHandler
) {
	// registers a new handler for a command name
	registry[cmdName] = handler;
}

export async function runCommand(
	registery: CommandsRegistry,
	cmdName: string,
	...args: string[]
) {
	// runs a given command with provided state if it exists
	if (!registery[cmdName]) {
		throw new Error("Command doesn't exist");
		return;
	}
	await registery[cmdName](cmdName, ...args);
}

export async function registerUser(cmdName: string, ...args: string[]) {
	const username = args[0];
	// check name in args
	if (username.length === 0) {
		throw new Error("name required to register a new user");
	}

	const user = await getUser(username);

	if (user.length !== 0) {
		throw new Error("user already exists");
	} else {
		const newUser = await createUser(username);
		setUser(username);
		console.log("user was created: ", username);
		console.log("User Data: ", newUser);
	}
}

export async function resetDB() {
	const deletedUsers = await deleteUsers();
	console.log("Database reset");
	return deletedUsers;
}

export async function getAllUsers() {
	const userList = await getUsers();
	const configFile = readConfig();
	const currentUser = configFile["currentUserName"];

	if (userList.length === 0) {
		console.log("Database is empty");
	}
	for (let i = 0; i < userList.length; i++) {
		const username = userList[i].name;
		if (username === currentUser) {
			console.log(`${username} (current)`);
		} else {
			console.log(`${username}`);
		}
	}
}

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

export async function agg() {
	const feedName = "https://www.wagslane.dev/index.xml";
	const feed = await fetchFeed(feedName);
	console.log(feed);
}

export async function addfeed(name: string, url: string) {
	console.log("Name: ", name);
	console.log("Url", url);
	if (!name) {
		console.error("Name is required");
		process.exit(1);
	}
	if (!url) {
		console.error("Url is required");
		process.exit(1);
	}
	const configFile = readConfig();
	const currentUser = configFile["currentUserName"];
	const users = await getUser(currentUser);
	const user = users[0];
	if (!user) {
		throw new Error("no valid id");
	}
	const userId = user.id;
	const addedFeed = await createFeed(name, url, userId);
	printFeed(addedFeed, user);
}

export type Feed = typeof feeds.$inferSelect;
export type User = typeof users.$inferSelect;

function printFeed(feed: Feed, user: User) {
	console.log(`Feed: ${feed.name} (${feed.url}) [ID: ${feed.id}]`);
	console.log(`User: ${user.name} [User ID: ${user.id}]`);
}
