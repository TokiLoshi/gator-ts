import { CommandHandler } from "./commands";
import { getUser } from "./lib/db/queries/users";
import { User } from "./commands/feeds";
import { readConfig } from "../config";

export type UserCommandHandler = (
	cmdName: string,
	user: User,
	...args: string[]
) => Promise<void>;

type middlewareLoggedIn = (handler: UserCommandHandler) => CommandHandler;

export const middlewareLoggedIn: middlewareLoggedIn = (
	handler: UserCommandHandler
) => {
	return async function (cmndName: string, ...args: string[]) {
		const configFile = readConfig();
		const userName = configFile["currentUserName"];
		const user = await getUser(userName);
		if (!user || user.length === 0) {
			throw new Error(`User ${userName} not found`);
		}
		const newArgs = args.slice(1);
		return handler(cmndName, user[0], ...args);
	};
};
