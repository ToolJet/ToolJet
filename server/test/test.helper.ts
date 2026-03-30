/**
 * test.helper.ts — Barrel re-export file.
 *
 * All implementation lives in focused modules under ./helpers/:
 * - bootstrap.ts — Test app factory, DataSource singletons, global side effects
 * - cleanup.ts  — Database cleanup (resetDB), generic entity helpers
 * - seed.ts     — Entity creation functions (users, apps, data sources, etc.)
 * - api.ts      — HTTP/auth helpers (authenticateUser, buildTestSession, etc.)
 *
 * This file re-exports everything so existing `import { X } from '../test.helper'`
 * statements continue to work without changes.
 *
 * NOTE: No backward-compat aliases — all exports use canonical names only.
 */

// --- Layer 0: Bootstrap (app factory, DataSource singletons) ---
export * from './helpers/bootstrap';

// --- Layer 1: Cleanup (resetDB, generic entity helpers) ---
export * from './helpers/cleanup';

// --- Layer 2: Seed (entity creation) ---
export * from './helpers/seed';

// --- Layer 3: API (HTTP requests, auth) ---
export * from './helpers/api';
