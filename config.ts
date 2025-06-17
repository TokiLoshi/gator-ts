import fs from "fs";
import os from "os";
import path from "path";

type Config = {
	dbUrl: string;
	currentUserName: string;
};

export default function setUser(user: string) {
	// writes a config object to JSON file after setting current user name
	const username = user;
	const currentConfig: Config = readConfig();
	currentConfig["currentUserName"] = username;
	writeConfig(currentConfig);
}

// reads the json file and returns a config object
export function readConfig() {
	// Set up path
	const filePath = getConfigFilePath();
	// read from the home directory
	const readFile = fs.readFileSync(filePath, "utf8");
	console.log("REad file: ", readFile);
	const decodedData = JSON.parse(readFile);
	// decode the json string
	const validatedData = validateConfig(decodedData);
	const config: Config = {
		dbUrl: validatedData["dbUrl"],
		currentUserName: validatedData["currentUserName"],
	};
	console.log("Config: ", config);
	return config;
}

function getConfigFilePath(): string {
	const homeDir = os.homedir();
	console.log("Home directory: ", homeDir);
	const fileName = ".gatorconfig.json";
	const filePath = path.join(homeDir, fileName);
	console.log("Path: ", filePath);
	return filePath;
}

function writeConfig(cfg: Config): void {
	const filePath = getConfigFilePath();
	const jsonObject = {
		db_url: cfg.dbUrl,
		current_user_name: cfg.currentUserName,
	};
	const stringifiedData = JSON.stringify(jsonObject);
	fs.writeFileSync(filePath, stringifiedData);
}

function validateConfig(rawConfig: any): Config {
	let validatedConfig: Config = {
		dbUrl: "",
		currentUserName: "",
	};
	// check for the expected keys
	if ("db_url" in rawConfig) {
		let dbUrl = rawConfig["db_url"];
		let username = "";
		if ("current_user_name" in rawConfig) {
			username = rawConfig["current_user_name"];
		}
		// check db and username types must be strings
		if (typeof dbUrl !== "string") {
			console.warn("dbUrl must be a string");
			dbUrl = "";
		}
		if (typeof username !== "string") {
			console.warn("username must be a string ");
			username = "";
		}
		// check if the current username or db is not empty
		if (dbUrl.length === 0) {
			console.warn("dbURL is empty");
			dbUrl = "";
		}
		if (username.length === 0) {
			console.warn("username is blank");
			username = "";
		}
		validatedConfig["dbUrl"] = dbUrl;
		validatedConfig["currentUserName"] = username;
		return validatedConfig;
	} else {
		console.warn(
			"config had incorrect values, returning a default empty config"
		);
		return validatedConfig;
	}
}
