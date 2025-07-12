import setUser from "../config.js";
import { readConfig } from "../config.js";
import {
	CommandHandler,
	CommandsRegistry,
	registerCommand,
	runCommand,
} from "./commands.js";
import { argv } from "node:process";
import { registerUser, getAllUsers, handlerLogin } from "./commands/users.js";
import { resetDB } from "./commands/reset.js";
import { agg, addfeed, allFeeds } from "./commands/feeds.js";

async function main() {
	console.log("Hello, Gator!");
	const registery: CommandsRegistry = {};

	// Register Commands
	const login = await registerCommand(registery, "login", handlerLogin);
	const register = await registerCommand(registery, "register", registerUser);
	const reset = await registerCommand(registery, "reset", resetDB);
	const getUsers = await registerCommand(registery, "users", getAllUsers);
	const aggregate = await registerCommand(registery, "agg", agg);
	const createFeed = await registerCommand(registery, "addfeed", addfeed);
	const getAllFeeds = await registerCommand(registery, "feeds", allFeeds);

	// Handle arguments
	const commands = process.argv.slice(2);
	if (commands.length === 0) {
		// if not one argument print error message and exit with code 1
		console.error("no commands provided");
		process.exit(1);
	}
	const commandName = commands[0];
	const argumentsArray = commands.slice(1);

	try {
		const results = await runCommand(registery, commandName, ...argumentsArray);
		console.log(
			`Ran ${commandName} with args ${argumentsArray} and returned: ${results}`
		);
	} catch (error) {
		if (error instanceof Error) {
			console.error(`Error running command ${commandName}: ${error.message}`);
		} else {
			console.log(`Error running ${commandName}: ${error}`);
		}
		process.exit(1);
	}
	process.exit(0);
}

main();
