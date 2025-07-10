import setUser from "../config.js";
import {
	createUser,
	getUser,
	deleteUsers,
	getUsers,
} from "./lib/db/queries/users.js";
import { readConfig } from "../config.js";

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
