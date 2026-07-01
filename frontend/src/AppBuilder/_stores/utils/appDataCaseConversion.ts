/* Pure, dependency-free key-casing helper for the app-data payload. */

type JsonPrimitive = string | number | boolean | null | undefined;
type JsonValue = JsonPrimitive | JsonValue[] | { [key: string]: JsonValue };
type JsonObject = { [key: string]: JsonValue };

/**
 * convertAllKeysToSnakeCase
 *
 * WHERE IT RUNS
 *   - Called from the `useAppData` hook, inside the `isPreviewForVersion` branch
 *     — i.e. the public-app, releasedviewer, preview-for-version and module-viewer load paths.
 *   - downstream consumers read that metadata in snake_case — which is why the whole payload is swept here.
 *   - The editor path does NOT use this; it fetches queries separately, already in the right shape.
 *
 *   - On above mentioned load paths the backend bundles the app's data queries INSIDE the app json
 *   - a public/unauthenticated viewer can't make the authenticated data-queries fetch the editor uses,
 *   - so store in that case is populated using the bundled data queries.
 *
 * WHY OPAQUE_VALUE_KEYS EXISTS
 *   A data query carries a free-form `options` blob:
 *    - user-authored JSON such as SQL text, the GUI/SQL-mode flag (`activeTab`), query parameters (`defaultValue`),
 *    - and plugin-specific keys that are intentionally snake_case (`query_timeout`, `where_filters`, `proto_files`…).
 *
 *   Running a GENERIC key-casing rewrite over that blob corrupts it:
 *    — e.g. `sqlQuery` → `sql_query`, `activeTab` → `active_tab`, `defaultValue` → `default_value`.
 *    - The query then reads `undefined` at runtime,
 *    - and because the editor auto-saves the in-memory query, the mangled shape gets written back to the DB.
 *    — This permanently breaks the editor and the released app, not just the preview.
 *
 * NOTE
 *   - `pages` and `events` were already excluded for the same reason
 *   - they hold component definitions and event-handler option blobs.
 *   - Data queries are the same category of opaque, user-authored data and belong in this list too.
 */
const OPAQUE_VALUE_KEYS: readonly string[] = ['pages', 'events', 'dataQueries', 'data_queries'];

export function convertAllKeysToSnakeCase(o: JsonValue): JsonValue {
  if (Array.isArray(o)) {
    return o.map((value: JsonValue): JsonValue =>
      typeof value === 'object' && value !== null ? convertAllKeysToSnakeCase(value) : value
    );
  } else if (typeof o === 'object' && o !== null) {
    const source = o as JsonObject;
    const newO: JsonObject = {};
    for (const origKey in source) {
      if (Object.prototype.hasOwnProperty.call(source, origKey)) {
        /**
         * The wrapper KEY is always renamed, even for opaque subtrees:
         *   - `pages`/`events` are already lowercase, so this is a no-op;
         *   - `dataQueries` MUST become `data_queries`, because that's the key the
         *     query loader in useAppData reads
         *
         * For OPAQUE_VALUE_KEYS only the recursion INTO the value is skipped
         */
        const newKey = origKey
          .split(/(?=[A-Z])/)
          .join('_')
          .toLowerCase();
        let value: JsonValue = source[origKey];

        if (!OPAQUE_VALUE_KEYS.includes(origKey) && typeof value === 'object' && value !== null) {
          value = convertAllKeysToSnakeCase(value);
        }
        newO[newKey] = value;
      }
    }
    return newO;
  }
  return o;
}

/*
 * Query option keys that this normalizer coerces snake_case → camelCase.
 * These are the app-level flags the query editors read in camelCase.
 */
const QUERY_OPTION_KEYS_TO_NORMALIZE = [
  'enableTransformation',
  'transformationLanguage',
  'runOnPageLoad',
  'runOnDependencyChange',
  'requestConfirmation',
  'requestConfirmationFx',
  'confirmationMessage',
  'showSuccessNotification',
  'successMessage',
  'notificationDuration',
  'disableQuery',
  'disabledMessage',
];

const toSnakeCase = (camel: string): string => camel.replace(/[A-Z]/g, (m) => `_${m.toLowerCase()}`);

type QueryLike = { options?: Record<string, unknown> };

/**
 * normalizeQueryTransformationOptions
 *
 * NO-OP FOR CORRECTLY-STORED DATA (post backend-serialization unification)
 *  - The editor writes these keys camelCase, they are stored verbatim, and all the backend endpoints now return the `options` blob verbatim
 *  - so the whitelisted keys arrive camelCase everywhere and the guard below (`options[snakeKey] !== undefined`) never fires. 
 *
 * WHY IT'S KEPT (a cheap, idempotent safety net)
 *  - It still HEALS rows that already have these keys stored snake_case
 *  - e.g. legacy apps corrupted by the historical run-persist casing bug, or apps imported / git-synced with snake option keys.
 *  - For those, deleting this would silently break the flag (a query would stop running on page load, transformation would read as off, etc.).
 *  - It can be removed only after a one-time DB backfill that rewrites those stored keys.
 */
export function normalizeQueryTransformationOptions<T extends QueryLike>(query: T): T {
  if (!query?.options) return query;

  let options: Record<string, unknown> | undefined;
  for (const camelKey of QUERY_OPTION_KEYS_TO_NORMALIZE) {
    const snakeKey = toSnakeCase(camelKey);
    if (query.options[snakeKey] !== undefined) {
      // Clone lazily on first hit so the original options object is never touched.
      if (!options) options = { ...query.options };
      const value = options[snakeKey];
      delete options[snakeKey];
      if (options[camelKey] === undefined) options[camelKey] = value;
    }
  }

  return options ? { ...query, options } : query;
}
