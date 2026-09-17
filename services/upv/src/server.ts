/**
 * Node.js entry point (VPS / Docker).
 *
 *   node --experimental-sqlite --experimental-strip-types src/server.ts
 *
 * Reads configuration from the environment (see .env.example). Bun users can
 * run the identical HTTP layer with the bun:sqlite store: `bun run src/server.bun.ts`.
 */

import process from "node:process";
import { createFetchHandler } from "./app.ts";
import { startNodeServer } from "./http-node.ts";
import { DEFAULT_SALT } from "./store.ts";
import { createSqliteStore } from "./store-sqlite.ts";
import type { Env } from "./types.ts";

function readEnv(): Env {
	return {
		DB_PATH: process.env.DB_PATH,
		SALT: process.env.SALT,
		ALLOWED_ORIGINS: process.env.ALLOWED_ORIGINS,
		THROTTLE_WINDOW_MS: process.env.THROTTLE_WINDOW_MS,
		BLOCK_BOTS: process.env.BLOCK_BOTS,
	};
}

const env = readEnv();
const dbPath = env.DB_PATH?.trim() || "./upv.sqlite";
const host = process.env.HOST?.trim() || "0.0.0.0";
const parsedPort = Number.parseInt(process.env.PORT ?? "8787", 10);
const port = Number.isFinite(parsedPort) && parsedPort > 0 ? parsedPort : 8787;

const store = createSqliteStore(dbPath);
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
		console.log(`[srp-blog-upv] listening on http://${boundHost}:${boundPort} (db: ${dbPath})`);
	},
});

let shuttingDown = false;
async function shutdown(signal: string): Promise<void> {
	if (shuttingDown) return;
	shuttingDown = true;
	console.log(`[srp-blog-upv] ${signal} received, shutting down`);
	try {
		await running.close();
	} catch (error) {
		// Server was most likely never listening (e.g. EADDRINUSE); report it.
		if (error instanceof Error) console.error(`[srp-blog-upv] error while closing: ${error.message}`);
	}
	store.close();
	process.exit(0);
}

process.on("SIGINT", () => void shutdown("SIGINT"));
process.on("SIGTERM", () => void shutdown("SIGTERM"));
