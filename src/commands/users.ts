import setUser, { readConfig } from "../../config";
import { createUser, getUser, getUsers } from "../lib/db/queries/users";

export async function registerUser(cmdName: string, ...args: string[]) {
	if (args.length !== 1) {
		throw new Error(`sage: ${cmdName} <name>`);
	}
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

export async function getCurrentUser() {
	const configFile = readConfig();
	const currentUserName = configFile["currentUserName"];
	const currentUser = await getUser(currentUserName);
	return currentUser;
}
