/**
 * Server-only friend-link and sponsor access.
 *
 * Both underlying modules read JSON files from `content/` through `node:fs`;
 * the `.server.ts` suffix keeps them out of the browser bundle while the
 * prerender pass still runs this loader in Node.
 */
export { getFriendLinks } from "../lib/friends";
export { getSponsors } from "../lib/sponsors";
