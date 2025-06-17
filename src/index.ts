import setUser from "../config.js";
import { readConfig } from "../config.js";

function main() {
	console.log("Hello, world!");
	const userName = "Toki";
	console.log("Setting username: ", userName);
	setUser(userName);
	readConfig();
}

main();
