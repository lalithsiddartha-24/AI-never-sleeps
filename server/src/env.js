// Environment loader. Importing this module (for its side effects) populates
// process.env from server/.env before anything else reads it. Resolves the
// .env path relative to this file so it works regardless of the cwd.
//
// All keys are OPTIONAL: the app must boot and ingest from free/public sources
// with none of them set. This module never throws when .env is missing.

import path from 'node:path';
import { fileURLToPath } from 'node:url';
import dotenv from 'dotenv';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const envPath = path.join(__dirname, '..', '.env');

// quiet: don't log a hint when .env is absent (a valid no-keys setup).
dotenv.config({ path: envPath, quiet: true });

// Centralized, typed access to the optional configuration. Keeping reads here
// means the rest of the codebase never touches process.env directly and secrets
// can never be imported into the client bundle.
function intFromEnv(name, fallback) {
  const raw = process.env[name];
  const n = parseInt(raw, 10);
  return Number.isFinite(n) && n > 0 ? n : fallback;
}

export const config = {
  gnewsApiKey: process.env.GNEWS_API_KEY || '',
  newsApiKey: process.env.NEWS_API_KEY || '',
  aiApiKey: process.env.AI_API_KEY || process.env.OPENAI_API_KEY || '',
  aiBaseUrl: process.env.AI_BASE_URL || '',
  aiModel: process.env.AI_MODEL || 'gpt-4o-mini',
  githubToken: process.env.GITHUB_TOKEN || '',
  fetchIntervalMinutes: intFromEnv('NEWS_FETCH_INTERVAL_MINUTES', 15),
  port: intFromEnv('PORT', 4000),
};

export const hasGNews = Boolean(config.gnewsApiKey);
export const hasNewsAPI = Boolean(config.newsApiKey);
export const hasAI = Boolean(config.aiApiKey);

export default config;
