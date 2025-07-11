import setUser from "../config.js";
import { readConfig } from "../config.js";
import {
	CommandHandler,
	CommandsRegistry,
	handlerLogin,
	registerCommand,
	runCommand,
	registerUser,
	resetDB,
	getAllUsers,
	agg,
} from "./commands.js";
import { argv } from "node:process";

async function main() {
	console.log("Hello, Gator!");
	// Create a new commandsRegistery Object
	const registery: CommandsRegistry = {};
	// register a handler function for login
	const login = await registerCommand(registery, "login", handlerLogin);
	const register = await registerCommand(registery, "register", registerUser);
	const reset = await registerCommand(registery, "reset", resetDB);
	const getUsers = await registerCommand(registery, "users", getAllUsers);
	const aggregate = await registerCommand(registery, "agg", agg);

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

	const results = await runCommand(registery, commandName, ...argumentsArray);

	console.log(
		`Ran ${commandName} with args ${argumentsArray} and returned: ${results}`
	);

	process.exit(0);
}

main();
