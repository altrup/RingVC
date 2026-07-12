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
	},
});
