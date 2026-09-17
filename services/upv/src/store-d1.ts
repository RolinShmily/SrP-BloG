/**
 * Cloudflare D1 driver.
 *
 * D1 speaks SQLite, so the shared logic in store.ts works unchanged — only the
 * async plumbing differs. Notes:
 *   * `prepare()` accepts exactly one statement, which is why the schema is
 *     exported as a statement list rather than one big script.
 *   * `meta.changes` tells us whether `INSERT OR IGNORE` really inserted a row,
 *     which is how the site-wide unique-visitor counter stays exact.
 *   * D1 has no interactive transactions; the shared hit() flow is written as
 *     idempotent statements so a retry can only double-count PV, never UV.
 */

import { SCHEMA_STATEMENTS, SqlUPVStore, type UPVStore } from "./store.ts";
import type { D1DatabaseLike, D1PreparedStatementLike, SqlRunner, SqlValue } from "./types.ts";

export class D1SqlRunner implements SqlRunner {
	readonly #db: D1DatabaseLike;

	constructor(db: D1DatabaseLike) {
		this.#db = db;
	}

	#statement(sql: string, params: readonly SqlValue[]): D1PreparedStatementLike {
		const statement = this.#db.prepare(sql);
		return params.length > 0 ? statement.bind(...params) : statement;
	}

	async execute(sql: string, params: readonly SqlValue[] = []): Promise<{ changes: number }> {
		const result = await this.#statement(sql, params).run();
		return { changes: Number(result.meta?.changes ?? 0) };
	}

	async first<T>(sql: string, params: readonly SqlValue[] = []): Promise<T | null> {
		const row = await this.#statement(sql, params).first<T>();
		return row ?? null;
	}

	async all<T>(sql: string, params: readonly SqlValue[] = []): Promise<T[]> {
		const result = await this.#statement(sql, params).all<T>();
		return result.results ?? [];
	}
}

/**
 * Apply the schema. D1's `exec()` runs a multi-statement script, but it does
 * not support parameters, so we batch the idempotent statements instead.
 */
export async function initD1Schema(db: D1DatabaseLike): Promise<void> {
	for (const statement of SCHEMA_STATEMENTS) {
		await db.prepare(statement).run();
	}
}

export function createD1Store(db: D1DatabaseLike): UPVStore {
	return new SqlUPVStore(new D1SqlRunner(db));
}
