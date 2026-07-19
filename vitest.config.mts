import { resolve } from "node:path";

import { defineConfig } from "vitest/config";

// mirrors the path aliases in tsconfig.json
const src = (subpath: string) => resolve(import.meta.dirname, "src", subpath);

export default defineConfig({
	resolve: {
		alias: [
			{ find: /^@config$/, replacement: src("config.ts") },
			{ find: /^@commands\//, replacement: src("commands") + "/" },
			{ find: /^@db\//, replacement: src("main/db") + "/" },
			{ find: /^@main\//, replacement: src("main") + "/" },
			{ find: /^@routes\//, replacement: src("routes") + "/" },
		],
	},
	test: {
		include: ["src/**/*.test.ts"],
		// config.ts and the supabase client validate these at import, and test
		// modules pull them in transitively (e.g. mocking a db module with its
		// real implementation). Dummy values keep the suite self-contained so it
		// never depends on a developer's .env; the db layer is mocked in tests
		env: {
			DISCORD_TOKEN: "test-token",
			DISCORD_CLIENT_ID: "test-client-id",
			SUPABASE_URL: "http://localhost:54321",
			SUPABASE_SERVICE_ROLE_KEY: "test-service-role-key",
		},
	},
});
