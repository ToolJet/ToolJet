import { EntityManager } from 'typeorm';
import { App } from 'src/entities/app.entity';
import { AppVersion } from 'src/entities/app_version.entity';
import { WorkspaceBranch } from '@entities/workspace_branch.entity';

/**
 * Helpers for normalizing legacy go-to-app references during app import.
 *
 * Cross-app links are stored as the target app's `co_relation_id` (a portable
 * identity that survives rename, export/import and git-sync). Dumps that predate
 * the deprecation still reference targets by slug — `event.slug` on go-to-app
 * event blobs and `pages.app_id` on app-type pages. These helpers resolve those
 * slugs to `co_relation_id`s and rewrite the blobs, mirroring the two backfill
 * migrations (1781645306551 / 1781645376435) so importing an old dump produces
 * the same result as migrating a live database.
 */

/**
 * Reverse lookup: given app slugs (as stored on `app_versions.slug`), return their
 * owning apps' `co_relation_id`s within one organization.
 *
 * Restricted to `apps.type = 'front-end'` because go-to-app navigation and
 * cross-app page targets only point at front-end apps (modules and workflows are
 * never valid targets).
 *
 * Tie-breaker mirrors `findAppBySlug`'s runtime priority so the import resolves the
 * same logical app a click would:
 *   1. Default-branch row (`organization_git_sync_branches.is_default = true`)
 *   2. Branchless row (`av.branch_id IS NULL`, for git-disabled orgs)
 *   3. Anything else (sub-branches, stale tag snapshots after rename)
 *   Within tier: newest `updated_at`, then `id` for determinism.
 */
export async function resolveCorelationIdsBySlugs(
  manager: EntityManager,
  slugs: string[],
  organizationId: string
): Promise<Map<string, string>> {
  const distinct = Array.from(new Set((slugs || []).filter(Boolean)));
  if (distinct.length === 0) return new Map();

  const rows = await manager
    .createQueryBuilder(App, 'app')
    .innerJoin(AppVersion, 'av', 'av.appId = app.id AND av.slug IS NOT NULL')
    .leftJoin(WorkspaceBranch, 'wb', 'wb.id = av.branch_id')
    .where('av.slug IN (:...slugs)', { slugs: distinct })
    .andWhere('app.organizationId = :organizationId', { organizationId })
    .andWhere('app.co_relation_id IS NOT NULL')
    .andWhere(`app.type = 'front-end'`)
    .select('av.slug', 'slug')
    .addSelect('app.co_relation_id', 'coRelationId')
    .orderBy(
      `CASE WHEN wb.is_default = true THEN 0
            WHEN av.branch_id IS NULL THEN 1
            ELSE 2 END`,
      'ASC'
    )
    .addOrderBy('av.updatedAt', 'DESC')
    .addOrderBy('av.id', 'ASC')
    .getRawMany<{ slug: string; coRelationId: string }>();

  const result = new Map<string, string>();
  for (const row of rows) {
    if (row.slug && row.coRelationId && !result.has(row.slug)) {
      result.set(row.slug, row.coRelationId);
    }
  }
  return result;
}

/**
 * Rewrite a single go-to-app event blob: replace legacy `slug` with `correlationId`
 * if the slug resolves in the target org. Blobs that already carry a correlationId,
 * aren't go-to-app, or whose slug doesn't resolve are returned unchanged.
 */
export function rewriteGoToAppBlob(blob: any, slugToCo: Map<string, string>): any {
  if (blob?.actionId !== 'go-to-app' || blob.correlationId || !blob.slug) return blob;

  const co = slugToCo.get(blob.slug);
  if (!co) return blob;

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { slug, ...rest } = blob;
  return { ...rest, correlationId: co };
}

/** Slug of a legacy (pre-correlationId) go-to-app blob, or nothing. */
export function collectLegacyGoToAppSlug(blob: any): string[] {
  return blob?.actionId === 'go-to-app' && !blob.correlationId && blob.slug ? [blob.slug] : [];
}

/**
 * Batched slug→co_relation_id lookup for app-type pages that only carry the legacy
 * slug in `appId` (dumps predating migration 1781645376435). Returns an empty map
 * when nothing needs resolving so callers can skip the query.
 */
export async function resolveLegacyPageTargetSlugs(
  manager: EntityManager,
  pages: any[],
  organizationId: string
): Promise<Map<string, string>> {
  const legacySlugs = (pages || [])
    .filter((p) => p?.type === 'app' && !p?.targetCorelationId && p?.appId)
    .map((p) => p.appId as string);
  if (legacySlugs.length === 0) return new Map();
  return resolveCorelationIdsBySlugs(manager, legacySlugs, organizationId);
}

/** Target co_relation_id for a page: its own value, or the resolved legacy slug, or null. */
export function resolvePageTargetCorelationId(page: any, slugToCo: Map<string, string>): string | null {
  return page?.targetCorelationId ?? (page?.type === 'app' && page?.appId ? (slugToCo.get(page.appId) ?? null) : null);
}

/**
 * Event blobs nested inside Table widget definitions — per-action buttons and
 * per-toggle-column events. These live in component properties (not the
 * event_handlers table) in old exports, so import must normalize them too.
 */
export function collectTableGoToAppEventBlobs(components: any[]): any[] {
  return (components || []).flatMap((comp) => {
    if (comp?.type !== 'Table') return [];
    const blobs = [];
    for (const action of comp.properties?.actions?.value || []) {
      for (const ev of action.events || []) blobs.push(ev);
    }
    for (const column of comp.properties?.columns?.value || []) {
      if (column?.columnType !== 'toggle') continue;
      for (const ev of column.events || []) blobs.push(ev);
    }
    return blobs;
  });
}
