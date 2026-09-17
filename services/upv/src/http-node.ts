/**
 * Node HTTP glue: converts `node:http` request/response objects to and from the
 * Web `Request`/`Response` pair used by the shared handler in app.ts.
 * Bun can use this too (Bun implements node:http).
 */

import { Buffer } from "node:buffer";
import { type IncomingMessage, type Server, type ServerResponse, createServer } from "node:http";
import type { FetchHandler, Logger } from "./app.ts";

export interface NodeServerOptions {
	handler: FetchHandler;
	port: number;
	host: string;
	logger?: Logger;
	onListen?: (info: { host: string; port: number }) => void;
}

export interface RunningNodeServer {
	server: Server;
	close(): Promise<void>;
}

async function readRequestBody(request: IncomingMessage): Promise<Uint8Array<ArrayBuffer> | undefined> {
	if (request.method === "GET" || request.method === "HEAD") return undefined;
	const chunks: Buffer[] = [];
	for await (const chunk of request) {
		chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk as string));
	}
	if (chunks.length === 0) return undefined;
	const merged = Buffer.concat(chunks);
	// Copy into a plain ArrayBuffer-backed view so it satisfies `BodyInit`.
	return new Uint8Array(merged.buffer.slice(merged.byteOffset, merged.byteOffset + merged.byteLength));
}

function toWebRequest(request: IncomingMessage, body: Uint8Array<ArrayBuffer> | undefined): Request {
	const host = request.headers.host ?? "localhost";
	const url = new URL(request.url ?? "/", `http://${host}`);
	const headers = new Headers();
	for (const [key, value] of Object.entries(request.headers)) {
		if (Array.isArray(value)) {
			for (const item of value) headers.append(key, item);
		} else if (typeof value === "string") {
			headers.set(key, value);
		}
	}
	return new Request(url, {
		method: request.method ?? "GET",
		headers,
		body,
		redirect: "manual",
	});
}

async function writeWebResponse(response: Response, target: ServerResponse): Promise<void> {
	const headers: Record<string, string> = {};
	response.headers.forEach((value, key) => {
		headers[key] = value;
	});
	target.writeHead(response.status, headers);
	const buffer = Buffer.from(await response.arrayBuffer());
	target.end(buffer);
}

export function startNodeServer(options: NodeServerOptions): RunningNodeServer {
	const logger: Logger = options.logger ?? console;

	async function handle(request: IncomingMessage, response: ServerResponse): Promise<void> {
		try {
			const webRequest = toWebRequest(request, await readRequestBody(request));
			await writeWebResponse(await options.handler(webRequest), response);
		} catch (error) {
			logger.error("[srp-blog-upv] request failed", error);
			if (!response.headersSent) {
				response.writeHead(500, { "content-type": "application/json; charset=utf-8" });
			}
			response.end(JSON.stringify({ error: { code: "internal_error", message: "internal error" } }));
		}
	}

	const server = createServer((request, response) => {
		void handle(request, response);
	});

	server.listen(options.port, options.host, () => {
		options.onListen?.({ host: options.host, port: options.port });
	});

	return {
		server,
		close: () =>
			new Promise<void>((resolve, reject) => {
				server.close((error) => (error ? reject(error) : resolve()));
			}),
	};
}
