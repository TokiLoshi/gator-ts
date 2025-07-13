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
import { agg, addfeed, allFeeds, follow, following } from "./commands/feeds.js";
import { middlewareLoggedIn } from "./middleware.js";

async function main() {
	console.log("Hello, Gator!");
	const registery: CommandsRegistry = {};

	// Register Commands
	await registerCommand(registery, "login", handlerLogin);
	await registerCommand(registery, "register", registerUser);
	await registerCommand(registery, "reset", resetDB);
	await registerCommand(registery, "users", getAllUsers);
	await registerCommand(registery, "agg", agg);
	await registerCommand(registery, "addfeed", middlewareLoggedIn(addfeed));
	await registerCommand(registery, "feeds", allFeeds);
	await registerCommand(registery, "follow", middlewareLoggedIn(follow));
	await registerCommand(registery, "following", middlewareLoggedIn(following));

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
