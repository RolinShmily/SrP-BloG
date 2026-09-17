#!/usr/bin/env bash
# End-to-end smoke test for srp-blog-upv.
#
# Starts the real Node server against a throwaway SQLite file and exercises the
# full HTTP API with curl. Run from the services/upv directory:
#
#   bash smoke-test.sh
#
# Everything it creates lives in a mktemp directory and is removed on exit.

set -euo pipefail

SERVICE_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
TMP_DIR="$(mktemp -d "${TMPDIR:-/tmp}/uv-smoke.XXXXXX")"
PORT="${UV_SMOKE_PORT:-8791}"
BASE="http://127.0.0.1:${PORT}"
SALT="smoke-test-salt"
DB_FILE="${TMP_DIR}/upv.sqlite"
SERVER_PID=""

cleanup() {
	if [[ -n "${SERVER_PID}" ]] && kill -0 "${SERVER_PID}" 2>/dev/null; then
		kill "${SERVER_PID}" 2>/dev/null || true
		wait "${SERVER_PID}" 2>/dev/null || true
	fi
	rm -rf "${TMP_DIR}"
}
trap cleanup EXIT

log() { printf '\n\033[1m### %s\033[0m\n' "$*"; }

run_curl() {
	printf '$ curl %s\n' "$*"
	curl -sS --max-time 5 -w '\nHTTP %{http_code}\n' "$@"
}

log "starting service on port ${PORT} (db: ${DB_FILE})"
(
	cd "${SERVICE_DIR}"
	PORT="${PORT}" DB_PATH="${DB_FILE}" SALT="${SALT}" ALLOWED_ORIGINS='*' \
		node --experimental-sqlite --experimental-strip-types src/server.ts
) >"${TMP_DIR}/server.log" 2>&1 &
SERVER_PID=$!

for _ in $(seq 1 40); do
	if curl -sS --max-time 2 -o /dev/null "${BASE}/api/health"; then break; fi
	sleep 0.25
done

log "1. GET /api/health"
run_curl "${BASE}/api/health"

log "2. POST /api/hit /posts/hello (twice, same UA -> PV=2, UV=1)"
run_curl -X POST "${BASE}/api/hit" -H 'content-type: application/json' \
	-H 'user-agent: SmokeTest/1.0' -d '{"path":"/posts/hello"}'
run_curl -X POST "${BASE}/api/hit" -H 'content-type: application/json' \
	-H 'user-agent: SmokeTest/1.0' -d '{"path":"/posts/hello"}'

log "3. POST /api/hit /posts/hello (different UA -> PV=3, UV=2)"
run_curl -X POST "${BASE}/api/hit" -H 'content-type: application/json' \
	-H 'user-agent: SmokeTest/2.0' -d '{"path":"/posts/hello","referrer":"https://example.com"}'

log "4. POST /api/hit /posts/second with the first UA (site UV stays 2)"
run_curl -X POST "${BASE}/api/hit" -H 'content-type: application/json' \
	-H 'user-agent: SmokeTest/1.0' -d '{"path":"/posts/second"}'

log "5. GET /api/stats?paths=/posts/hello,/posts/second,/posts/missing"
run_curl "${BASE}/api/stats?paths=/posts/hello,/posts/second,/posts/missing"

log "6. POST /api/hit with an illegal path -> 400"
run_curl -X POST "${BASE}/api/hit" -H 'content-type: application/json' \
	-H 'user-agent: SmokeTest/1.0' -d '{"path":"../etc/passwd"}'

log "7. POST /api/hit with malformed JSON -> 400"
run_curl -X POST "${BASE}/api/hit" -H 'content-type: application/json' \
	-H 'user-agent: SmokeTest/1.0' -d '{oops}'

log "8. CORS preflight for a configured origin"
run_curl -X OPTIONS "${BASE}/api/hit" -H 'origin: https://example.com' \
	-H 'access-control-request-method: POST' -i

log "9. Unknown route -> 404"
run_curl "${BASE}/api/nope"

log "server log"
cat "${TMP_DIR}/server.log"
