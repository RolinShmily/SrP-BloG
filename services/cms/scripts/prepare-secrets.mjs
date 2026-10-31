import { writeFileSync } from 'node:fs';

const filePath = process.argv[2];
if (!filePath) {
  throw new Error('Usage: node scripts/prepare-secrets.mjs <temporary-secrets-file>');
}

const mapping = {
  GITHUB_CLIENT_ID: 'CMS_GITHUB_CLIENT_ID',
  GITHUB_CLIENT_SECRET: 'CMS_GITHUB_CLIENT_SECRET',
};
const missing = Object.values(mapping).filter((name) => !process.env[name]?.trim());
if (missing.length) {
  throw new Error(`Missing repository secrets: ${missing.join(', ')}`);
}

const secrets = Object.fromEntries(
  Object.entries(mapping).map(([binding, name]) => [binding, process.env[name]]),
);
// The deploy command binds this file to the Worker selected by --config.
// Create a private file without overwriting an existing one; never print its contents.
writeFileSync(filePath, JSON.stringify(secrets), { mode: 0o600, flag: 'wx' });
