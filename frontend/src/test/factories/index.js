// Deterministic test-data factories. Plain functions, fixed values, overrides
// via spread — no faker/randomness so failures always reproduce.
export { buildSession, seedSession } from './session';
export { buildApp } from './app';
export { buildUser } from './user';
