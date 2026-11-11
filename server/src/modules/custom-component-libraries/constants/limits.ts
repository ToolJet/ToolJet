// Upload byte limits (DECISIONS-2026-07-30 / Register #10, #18). Enforced in the handler.
export const MB = 1024 * 1024;
export const BUNDLE_LIMIT_DEV = 30 * MB;
export const BUNDLE_LIMIT_PROD = 10 * MB;
export const CSS_LIMIT = 5 * MB;
export const MANIFEST_LIMIT = 1 * MB;
