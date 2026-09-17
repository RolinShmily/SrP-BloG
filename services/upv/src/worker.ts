/**
 * Cloudflare Workers entry point (Workers + D1).
 *
 *   wrangler dev      # local, uses a Miniflare-backed D1
 *   wrangler deploy
 *
 * One handler is built per D1 binding per isolate; the schema is applied once
 * per isolate (all statements are idempotent, so this is just a safety net —
 * run `wrangler d1 execute --file=schema.sql` in CI as the primary path).
 */

import { createFetchHandler, type FetchHandler } from "./app.ts";
import { createD1Store, initD1Schema } from "./store-d1.ts";
import type { D1DatabaseLike, Env } from "./types.ts";

export interface ExecutionContextLike {
	waitUntil(promise: Promise<unknown>): void;
	passThroughOnException(): void;
}

const handlers = new WeakMap<object, FetchHandler>();

function missingBindingResponse(): Response {
	return new Response(
		JSON.stringify({ error: { code: "missing_binding", message: "D1 binding `DB` is not configured" } }),
		{ status: 500, headers: { "content-type": "application/json; charset=utf-8" } },
	);
}

export default {
	// `ctx` is part of the Workers handler contract (unused for now).
	async fetch(request: Request, env: Env, ctx: ExecutionContextLike): Promise<Response> {
		void ctx;
		const db: D1DatabaseLike | undefined = env.DB;
		if (db === undefined) return missingBindingResponse();

		let handler = handlers.get(db as object);
		if (handler === undefined) {
			await initD1Schema(db);
			handler = createFetchHandler({ store: createD1Store(db), env });
			handlers.set(db as object, handler);
		}

		return handler(request);
	},
};
