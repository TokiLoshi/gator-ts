import { deleteUsers } from "../lib/db/queries/users";

export async function resetDB() {
	const deletedUsers = await deleteUsers();
	console.log("Database reset");
	return deletedUsers;
}
