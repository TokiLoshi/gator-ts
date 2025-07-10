import { defineConfig } from "drizzle-kit";

export default defineConfig({
	schema: "src/lib/db/schema.ts",
	out: "src/lib/dist",
	dialect: "postgresql",
	dbCredentials: {
		url: "postgres://biancasilva@localhost:5432/gator?sslmode=disable",
	},
});
