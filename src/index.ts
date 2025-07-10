import setUser from "../config.js";
import { readConfig } from "../config.js";
import {
	CommandHandler,
	CommandsRegistry,
	handlerLogin,
	registerCommand,
	runCommand,
} from "./commands.js";
import { argv } from "node:process";

function main() {
	console.log("Hello, Gator!");
	// Create a new commandsRegistery Object
	const registery: CommandsRegistry = {};
	// register a handler function for login
	const login = registerCommand(registery, "login", handlerLogin);
	// use process.argv to remove anything that's not needed
	const commands = process.argv.slice(2);
	// after splicing the arguments check for at least one argument
	if (commands.length === 0) {
		// if not one argument print error message and exit with code 1
		console.error("no commands provided");
		process.exit(1);
	}
	// Spit the command line arguments into command name and arguments array
	const commandName = commands[0];
	const argumentsArray = commands.slice(1);

	const results = runCommand(registery, commandName, ...argumentsArray);
	console.log(
		`Ran ${commandName} with args ${argumentsArray} and returned: ${results}`
	);

	// npm run start whould exit with code 1 and print an error (not enough arguments)
	// npm run start login (exit with code 1) print an error (username is required)
	// npm run start login alice (set the current user in the config to alice) - not overwrite db string
}

main();
