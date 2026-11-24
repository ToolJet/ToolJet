/**
 * Shared `{{self}}` token both TJDB SQL surfaces (raw-SQL migrations and seed-data SQL) use to
 * mean "the table this editor/migration was opened for" - kept in one place so the token format
 * can't drift between the two call sites. `SELF_PLACEHOLDER_REGEX` is global (`/g`) for use with
 * `.replace()`/`.matchAll()` only - `.test()`/`.exec()` on a shared global regex mutate its
 * `lastIndex`, which is a real cross-request bug on a module-level singleton. Use
 * `sql.includes(SELF_PLACEHOLDER)` for presence checks instead.
 */
export const SELF_PLACEHOLDER = '{{self}}';
export const SELF_PLACEHOLDER_REGEX = /\{\{self\}\}/g;

/** True if `sql` contains a `{{table.<name>}}` reference - only legal in raw-SQL migrations. */
export function containsTablePlaceholder(sql: string): boolean {
  return /\{\{table\.[\w-]+\}\}/.test(sql);
}
