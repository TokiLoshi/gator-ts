export type CommandHandler = (
	cmdName: string,
	...args: string[]
) => Promise<void>;

export type CommandsRegistry = Record<string, CommandHandler>;

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
