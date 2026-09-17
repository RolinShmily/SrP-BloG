/**
 * Minimal ambient types for `bun:sqlite`, so `tsc --noEmit` works without
 * installing `bun-types` (the package must stay dependency-free).
 */

declare module "bun:sqlite" {
	export interface BunRunResult {
		changes: number;
		lastInsertRowid: number | bigint;
	}

	export interface BunStatement {
		run(...params: unknown[]): BunRunResult;
		get(...params: unknown[]): unknown;
		all(...params: unknown[]): unknown[];
	}

	export class Database {
		constructor(filename?: string, options?: { create?: boolean; readonly?: boolean; strict?: boolean });
		run(sql: string, ...params: unknown[]): BunRunResult;
		query(sql: string): BunStatement;
		exec(sql: string): void;
		close(): void;
	}
}
