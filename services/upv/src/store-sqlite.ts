/**
 * Node.js (>= 22.5) driver: built-in `node:sqlite`, no third-party package.
 *
 * On Node 22.x the module still requires `--experimental-sqlite`; it is
 * unflagged from Node 23.4 / 22.13 onwards. The npm script already passes the
 * flag so the same command works on both. For Bun, see store-bun.ts.
 */

import { DatabaseSync } from "node:sqlite";
import { SCHEMA_STATEMENTS, SqlUPVStore, type UPVStore } from "./store.ts";
import type { SqlRunner, SqlValue } from "./types.ts";

class NodeSqliteRunner implements SqlRunner {
	readonly #db: DatabaseSync;

	constructor(db: DatabaseSync) {
		this.#db = db;
	}

	async execute(sql: string, params: readonly SqlValue[] = []): Promise<{ changes: number }> {
		const result = this.#db.prepare(sql).run(...(params as SqlValue[]));
		return { changes: Number(result.changes ?? 0) };
	}

	async first<T>(sql: string, params: readonly SqlValue[] = []): Promise<T | null> {
		const row = this.#db.prepare(sql).get(...(params as SqlValue[]));
		return (row as T | undefined) ?? null;
	}

	async all<T>(sql: string, params: readonly SqlValue[] = []): Promise<T[]> {
		return this.#db.prepare(sql).all(...(params as SqlValue[])) as T[];
	}
}

export interface SqliteUPVStore extends UPVStore {
	close(): void;
}

/**
 * Open (creating if needed) a SQLite database and apply the idempotent schema.
 * `dbPath` defaults to `:memory:` which is convenient for tests.
 */
export function createSqliteStore(dbPath = ":memory:"): SqliteUPVStore {
	const db = new DatabaseSync(dbPath);
	try {
		// WAL keeps readers from blocking the single writer; harmless on :memory:.
		db.exec("PRAGMA journal_mode = WAL;");
		db.exec("PRAGMA busy_timeout = 5000;");
		for (const statement of SCHEMA_STATEMENTS) db.exec(statement);
	} catch (error) {
		db.close();
		if (error instanceof Error) {
			throw new Error(`failed to initialise SQLite database at ${dbPath}: ${error.message}`, {
				cause: error,
			});
		}
		throw error;
	}

	const store = new SqlUPVStore(new NodeSqliteRunner(db));
	return Object.assign(store, {
		close: (): void => db.close(),
	});
}
