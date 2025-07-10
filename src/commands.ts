import setUser from "../config.js";

export type CommandHandler = (cmdName: string, ...args: string[]) => void;

export type CommandsRegistry = Record<string, CommandHandler>;

export function handlerLogin(cmdName: string, ...args: string[]) {
	// if args is empty throw an error
	if (args.length === 0) {
		throw new Error("username cannot be empty");
	}
	// handlerLogin takes username as single arg
	const userName = args[0];
	// use setUser function to set user to given username
	setUser(userName);
	console.log(`username has been set to: ${userName}`);
}

export function registerCommand(
	registry: CommandsRegistry,
	cmdName: string,
	handler: CommandHandler
) {
	// registers a new handler for a command name
	registry[cmdName] = handler;
}

export function runCommand(
	registery: CommandsRegistry,
	cmdName: string,
	...args: string[]
) {
	// runs a given command with provided state if it exists
	if (!registery[cmdName]) {
		throw new Error("Command doesn't exist");
		return;
	}
	registery[cmdName](cmdName, ...args);
}
