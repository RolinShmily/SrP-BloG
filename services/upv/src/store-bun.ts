/**
 * Bun driver: `bun:sqlite` (the only change needed to run on Bun).
 *
 * Bun does not implement `node:sqlite` identically, so the Node driver is not
 * used there. Everything above the SqlRunner boundary stays identical.
 */

import { Database } from "bun:sqlite";
import { SCHEMA_STATEMENTS, SqlUPVStore, type UPVStore } from "./store.ts";
import type { SqlRunner, SqlValue } from "./types.ts";

class BunSqliteRunner implements SqlRunner {
	readonly #db: Database;

	constructor(db: Database) {
		this.#db = db;
	}

	async execute(sql: string, params: readonly SqlValue[] = []): Promise<{ changes: number }> {
		const result = this.#db.run(sql, ...(params as SqlValue[]));
		return { changes: Number(result?.changes ?? 0) };
	}

	async first<T>(sql: string, params: readonly SqlValue[] = []): Promise<T | null> {
		const row = this.#db.query(sql).get(...(params as SqlValue[]));
		return (row as T | undefined) ?? null;
	}

	async all<T>(sql: string, params: readonly SqlValue[] = []): Promise<T[]> {
		return this.#db.query(sql).all(...(params as SqlValue[])) as T[];
	}
}

export interface BunSqliteUPVStore extends UPVStore {
	close(): void;
}

export function createBunSqliteStore(dbPath = ":memory:"): BunSqliteUPVStore {
	const db = new Database(dbPath, { create: true });
	db.run("PRAGMA journal_mode = WAL;");
	db.run("PRAGMA busy_timeout = 5000;");
	for (const statement of SCHEMA_STATEMENTS) db.run(statement);

	const store = new SqlUPVStore(new BunSqliteRunner(db));
	return Object.assign(store, {
		close: (): void => db.close(),
	});
}
