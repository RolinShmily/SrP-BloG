/**
 * Bun entry point. Identical to server.ts except for the SQLite driver
 * (`bun:sqlite` instead of `node:sqlite`), which is the whole point of the
 * SqlRunner abstraction.
 *
 *   bun run src/server.bun.ts
 */

import process from "node:process";
import { createFetchHandler } from "./app.ts";
import { startNodeServer } from "./http-node.ts";
import { DEFAULT_SALT } from "./store.ts";
import { createBunSqliteStore } from "./store-bun.ts";
import type { Env } from "./types.ts";

const env: Env = {
	DB_PATH: process.env.DB_PATH,
	SALT: process.env.SALT,
	ALLOWED_ORIGINS: process.env.ALLOWED_ORIGINS,
	THROTTLE_WINDOW_MS: process.env.THROTTLE_WINDOW_MS,
	BLOCK_BOTS: process.env.BLOCK_BOTS,
};

const dbPath = env.DB_PATH?.trim() || "./upv.sqlite";
const host = process.env.HOST?.trim() || "0.0.0.0";
const parsedPort = Number.parseInt(process.env.PORT ?? "8787", 10);
const port = Number.isFinite(parsedPort) && parsedPort > 0 ? parsedPort : 8787;

const store = createBunSqliteStore(dbPath);
await store.migrate();

if (!env.SALT?.trim()) {
	console.warn(
		`[srp-blog-upv] SALT not set, falling back to the public default (${DEFAULT_SALT}). ` +
			"Set SALT before exposing this service.",
	);
}

const running = startNodeServer({
	handler: createFetchHandler({ store, env }),
	port,
	host,
	onListen: ({ host: boundHost, port: boundPort }) => {
		console.log(`[srp-blog-upv] (bun) listening on http://${boundHost}:${boundPort} (db: ${dbPath})`);
	},
});

for (const signal of ["SIGINT", "SIGTERM"] as const) {
	process.on(signal, () => {
		void running.close().then(() => {
			store.close();
			process.exit(0);
		});
	});
}
