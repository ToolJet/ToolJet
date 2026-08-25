// Pure calculations over a PostgREST URL. No I/O, no entity access — the effects live in
// PostgrestProxyService, which decides what a missing resolution means.
//
// Only UUID-shaped tokens are candidates. Physical table names are always uuids today
// (internal_tables.id — eventually internal_table_relations.id), while physical COLUMN names are
// human — prepareColumnListForCreateTable uses column.column_name. So a uuid in an embed position
// is a table reference and nothing else, and a blanket substitution would be wrong only for
// filter VALUES, which this file never touches.

const UUID = '[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}';

// `<uuid>(` — an embedded resource, optionally behind an alias (`alias:`) or a hint (`!hint`).
// Depth is irrelevant: a nested embed matches the same shape.
const EMBEDDED_RESOURCE = new RegExp(`(${UUID})(?=!?[A-Za-z0-9_]*\\()`, 'g');

// `<uuid>.` at the start of a query-string KEY — the `<rel>.` filter prefix. Anchored on `?`/`&`
// so it can never match inside a value.
const FILTER_KEY_PREFIX = new RegExp(`(?<=[?&])(${UUID})(?=\\.)`, 'g');

const PATH_SEGMENT = new RegExp(`^/(${UUID})$`);

export function extractTableRefs(url: string): { path: string | null; embedded: string[] } {
  const [pathPart, queryString = ''] = splitUrl(url);
  const pathMatch = pathPart.match(PATH_SEGMENT);
  const embedded: string[] = [];

  if (queryString) {
    const fullQuery = '?' + queryString;
    for (const match of fullQuery.matchAll(EMBEDDED_RESOURCE)) embedded.push(match[1]);
    for (const match of fullQuery.matchAll(FILTER_KEY_PREFIX)) embedded.push(match[1]);
  }

  return { path: pathMatch ? pathMatch[1] : null, embedded };
}

export function rewriteTableRefs(url: string, relationIdByLogicalId: Map<string, string>): string {
  const [pathPart, queryString] = splitUrl(url);
  const substitute = (_full: string, id: string) => relationIdByLogicalId.get(id) ?? id;

  const rewrittenPath = pathPart.replace(PATH_SEGMENT, (full, id) =>
    relationIdByLogicalId.has(id) ? `/${relationIdByLogicalId.get(id)}` : full
  );

  if (queryString === undefined) return rewrittenPath;

  const fullQuery = '?' + queryString;
  const rewrittenQuery = fullQuery
    .replace(EMBEDDED_RESOURCE, substitute)
    .replace(FILTER_KEY_PREFIX, substitute)
    .slice(1);

  return `${rewrittenPath}?${rewrittenQuery}`;
}

function splitUrl(url: string): [string, string | undefined] {
  const separatorIndex = url.indexOf('?');
  if (separatorIndex === -1) return [url, undefined];
  return [url.slice(0, separatorIndex), url.slice(separatorIndex + 1)];
}
