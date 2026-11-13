/*
  Whose a component library is. One model for every reader and writer: bundle access and the library list
  (ee/custom-component-libraries), import, publish, dev uploads, ensureLibrary and own-library.ts (ee/code-mode-source),
  the library authoring routes, and the AI builder's session (ai-builder-library-scope.ts).

  - Owner: an app in Code mode whose stored code builds into the library (code_mode_sources.library_correlation_id).
    Only server flows write that link, and only after checking the library is free, under claimLock so two apps cannot
    both take it. The owner's permissions decide who may read the library's unreleased code and who may write to it.
  - Reference: an app whose components (a LibraryComponent) or version settings (a pin) name the library. Editors type
    references, so a reference never grants anything. It only keeps a library that no app owns yet from being adopted
    by another app.

  A released version's pin is not decided here: the bundle guard evaluates it against the app that released it.
*/

export type OwnershipQuery = (sql: string, params: unknown[]) => Promise<Array<Record<string, any>>>;

/** Code mode apps whose stored code builds into library $2 of workspace $1. */
export const LIBRARY_OWNERS_SQL = `
  SELECT DISTINCT v.app_id AS "appId"
    FROM code_mode_sources s
    JOIN app_versions v ON v.id = s.app_version_id
    JOIN apps a ON a.id = v.app_id
   WHERE a.organization_id = $1 AND a.build_mode = 'code' AND s.library_correlation_id::text = lower($2)`;

/** Apps that name library $2 of workspace $1 in a component or in a version's pins (either key, either container). */
export const LIBRARY_REFERENCES_SQL = `
  SELECT DISTINCT v.app_id AS "appId"
    FROM components c
    JOIN pages p ON p.id = c.page_id
    JOIN app_versions v ON v.id = p.app_version_id
    JOIN apps a ON a.id = v.app_id
   WHERE a.organization_id = $1 AND c.type = 'LibraryComponent'
     AND lower(c.properties -> 'correlationId' ->> 'value') = lower($2)
  UNION
  SELECT DISTINCT v.app_id AS "appId"
    FROM app_versions v
    JOIN apps a ON a.id = v.app_id
   WHERE a.organization_id = $1 AND (
     (v.global_settings -> 'customComponentLibraries') -> replace(lower($2), '-', '') IS NOT NULL
     OR (v.global_settings -> 'customComponentLibraries') -> lower($2) IS NOT NULL
     OR (v.global_settings -> 'custom_component_libraries') -> replace(lower($2), '-', '') IS NOT NULL
     OR (v.global_settings -> 'custom_component_libraries') -> lower($2) IS NOT NULL
   )`;

export interface LibraryClaims {
  /** Apps whose stored code builds into the library. */
  owners: string[];
  /** Apps that name it in a component or a pin. */
  references: string[];
}

export async function libraryClaims(
  organizationId: string,
  correlationId: string,
  query: OwnershipQuery
): Promise<LibraryClaims> {
  const [owners, references] = await Promise.all([
    query(LIBRARY_OWNERS_SQL, [organizationId, correlationId]),
    query(LIBRARY_REFERENCES_SQL, [organizationId, correlationId]),
  ]);
  return { owners: owners.map((r) => r.appId), references: references.map((r) => r.appId) };
}

/**
 * Whether the library is another app's, for `appId`. An owned library is its owners' only: references to it do not
 * count. A library no app owns is free unless another app names it.
 */
export const heldByAnotherApp = ({ owners, references }: LibraryClaims, appId: string): boolean =>
  owners.length ? owners.some((id) => id !== appId) : references.some((id) => id !== appId);

/**
 * Holds the library's ownership until the transaction ends, so checking that a library is free and linking stored code
 * to it happen as one step. Without a transaction it holds nothing, so callers run it inside one.
 */
export const claimLock = (query: OwnershipQuery, organizationId: string, correlationId: string) =>
  query('SELECT pg_advisory_xact_lock(hashtext($1))', [
    `component-library-claim:${organizationId}:${String(correlationId).toLowerCase()}`,
  ]);
