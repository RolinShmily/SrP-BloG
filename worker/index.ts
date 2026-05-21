export interface Env {
  DB: D1Database;
  VISITOR_SALT: string;
  ASSETS: Fetcher;
}

async function hashVisitor(ip: string, ua: string, salt: string): Promise<string> {
  const data = new TextEncoder().encode(ip + ua + salt);
  const hash = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(hash))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

function json(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

async function handleHit(request: Request, env: Env): Promise<Response> {
  try {
    const body = await request.json<{ path: string }>();
    const path = body.path;
    if (!path) return json({ error: "path required" }, 400);

    const ip = request.headers.get("CF-Connecting-IP") || "unknown";
    const ua = request.headers.get("User-Agent") || "unknown";
    const visitorHash = await hashVisitor(ip, ua, env.VISITOR_SALT);
    const today = new Date().toISOString().slice(0, 10);

    // Upsert page view count
    await env.DB.prepare(
      "INSERT INTO page_views (path, views) VALUES (?1, 1) ON CONFLICT(path) DO UPDATE SET views = views + 1"
    )
      .bind(path)
      .run();

    // Increment total views
    await env.DB.prepare(
      "UPDATE site_stats SET value = value + 1 WHERE key = 'total_views'"
    ).run();

    // Try to insert visitor record (only increments if new)
    const visitorResult = await env.DB.prepare(
      "INSERT OR IGNORE INTO page_visitors (visitor_hash, path, visit_date) VALUES (?1, ?2, ?3)"
    )
      .bind(visitorHash, path, today)
      .run();

    // If a new row was inserted, increment total visitors
    const meta = visitorResult.meta as { changes?: number };
    if (meta?.changes && meta.changes > 0) {
      await env.DB.prepare(
        "UPDATE site_stats SET value = value + 1 WHERE key = 'total_visitors'"
      ).run();
    }

    // Return updated page view count
    const row = await env.DB.prepare(
      "SELECT views FROM page_views WHERE path = ?1"
    )
      .bind(path)
      .first<{ views: number }>();

    return json({ views: row?.views ?? 0 });
  } catch (e) {
    console.error("handleHit error:", e);
    return json({ views: 0 });
  }
}

async function handlePostStats(
  request: Request,
  env: Env
): Promise<Response> {
  try {
    const url = new URL(request.url);
    const path = url.searchParams.get("path");
    if (!path) return json({ views: 0 });

    const row = await env.DB.prepare(
      "SELECT views FROM page_views WHERE path = ?1"
    )
      .bind(path)
      .first<{ views: number }>();

    return json({ views: row?.views ?? 0 });
  } catch (e) {
    console.error("handlePostStats error:", e);
    return json({ views: 0 });
  }
}

async function handleSiteStats(
  _request: Request,
  env: Env
): Promise<Response> {
  try {
    const { results } = await env.DB.prepare(
      "SELECT key, value FROM site_stats WHERE key IN ('total_views', 'total_visitors')"
    ).all<{ key: string; value: number }>();

    const stats: Record<string, number> = {};
    for (const row of results) {
      stats[row.key] = row.value;
    }

    return json({
      views: stats.total_views ?? 0,
      visitors: stats.total_visitors ?? 0,
    });
  } catch (e) {
    console.error("handleSiteStats error:", e);
    return json({ views: 0, visitors: 0 });
  }
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);

    if (url.pathname === "/api/stats/hit" && request.method === "POST") {
      return handleHit(request, env);
    }
    if (url.pathname === "/api/stats/post" && request.method === "GET") {
      return handlePostStats(request, env);
    }
    if (url.pathname === "/api/stats/site" && request.method === "GET") {
      return handleSiteStats(request, env);
    }

    return env.ASSETS.fetch(request);
  },
};
