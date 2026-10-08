import { APP_TYPES } from '@modules/apps/constants';
import { FolderAccess, folderVisibilityPredicate, GitState } from './actions';
import { SqlParams } from './sql-params';

export type ActivityColumn = 'last_viewed_at' | 'last_edited_at';

export interface DashboardScope {
  organizationId: string;
  userId: string;
  type: APP_TYPES;
  branchId: string;
  visibleAppIds: string[];
  releasedOnly: boolean;
  activityColumn: ActivityColumn;
  folderAccess: FolderAccess;
  git: GitState;
}

export interface EntryRow {
  kind: 'app' | 'folder';
  id: string;
  name: string;
  slug: string | null;
  icon: string | null;
  owner_id: string | null; // folders.created_by is NULL for folders made before 1766500000000
  current_version_id: string | null;
  is_maintenance_on: boolean | null;
  folder_id: string | null;
  app_count: number | null;
  last_modified_at: Date;
  modified_by_id: string | null;
  last_viewed_at: Date | null;
  pin_position: number | null;
  pinned: boolean;
}

export interface BuiltQuery {
  sql: string;
  params: unknown[];
}

// Same column list for both kinds so root / search can UNION them.
export const APP_COLUMNS = `'app' AS kind, va.id, va.name, va.slug, va.icon, va.owner_id,
  va.current_version_id, va.is_maintenance_on, va.folder_id, NULL::int AS app_count,
  va.last_modified_at, va.modified_by_id, va.last_viewed_at, va.activity_at`;
export const FOLDER_COLUMNS = `'folder' AS kind, vf.id, vf.name, NULL::varchar AS slug, NULL::varchar AS icon,
  vf.owner_id, NULL::uuid AS current_version_id, NULL::boolean AS is_maintenance_on,
  NULL::uuid AS folder_id, vf.app_count, vf.last_modified_at, vf.modified_by_id, vf.last_viewed_at, vf.activity_at`;

// Every mode: pins first by position, then the mode's order. Needs `pin_position` (NULL = unpinned).
export const PIN_ORDER = '(pin_position IS NULL), pin_position';
// Phase 2 sort swaps this key; dropping `kind_order` from ROOT_ORDER gives mixed folder/app sort.
export const ENTRY_ORDER = 'activity_at DESC NULLS LAST, LOWER(name), id';
const ROOT_ORDER = `${PIN_ORDER}, kind_order, ${ENTRY_ORDER}`;

// visible_apps: one row per visible app on the branch (metadata from its latest-updated version row).
// visible_folders: folders of the type passing folder access, with summaries over visible apps only.
export function dashboardCtes(s: DashboardScope, p: SqlParams): string {
  const branch = p.add(s.branchId);
  const user = p.add(s.userId);
  const org = p.add(s.organizationId);
  return `WITH visible_apps AS (
    SELECT a.id, a.user_id AS owner_id, a.current_version_id, a.is_maintenance_on,
           meta.app_name AS name, meta.slug, meta.icon,
           meta.updated_at AS last_modified_at, editor.user_id AS modified_by_id,
           fa.folder_id, ua.last_viewed_at, ua.${s.activityColumn} AS activity_at
    FROM apps a
    JOIN LATERAL (
      SELECT av.app_name, av.slug, av.icon, av.updated_at
      FROM app_versions av
      WHERE av.app_id = a.id AND av.branch_id = ${branch}
      ORDER BY av.updated_at DESC
      LIMIT 1
    ) meta ON true
    LEFT JOIN LATERAL (
      SELECT ue.user_id FROM user_app_activity ue
      WHERE ue.app_id = a.id AND ue.branch_id = ${branch} AND ue.last_edited_at IS NOT NULL
      ORDER BY ue.last_edited_at DESC, ue.user_id
      LIMIT 1
    ) editor ON true
    LEFT JOIN folder_apps fa ON fa.app_id = a.id AND fa.branch_id = ${branch}
    LEFT JOIN user_app_activity ua ON ua.user_id = ${user} AND ua.app_id = a.id AND ua.branch_id = ${branch}
    WHERE a.id = ANY(${p.add(s.visibleAppIds)}::uuid[])
      ${s.releasedOnly ? 'AND a.current_version_id IS NOT NULL' : ''}
  ),
  folder_stats AS (
    SELECT f.id, f.name, f.created_by AS owner_id, f.updated_at AS folder_updated_at,
           COUNT(va.id)::int AS app_count,
           MAX(va.activity_at) AS app_activity_at,
           MAX(va.last_modified_at) AS app_modified_at,
           MAX(va.last_viewed_at) AS last_viewed_at,
           (ARRAY_AGG(va.modified_by_id ORDER BY va.last_modified_at DESC NULLS LAST))[1] AS modified_by_id
    FROM folders f
    LEFT JOIN visible_apps va ON va.folder_id = f.id
    WHERE f.organization_id = ${org} AND f.type = ${p.add(s.type)}
    GROUP BY f.id
  ),
  visible_folders AS (
    SELECT fs.id, fs.name, fs.owner_id, fs.app_count, fs.modified_by_id, fs.last_viewed_at,
           COALESCE(fs.app_modified_at, fs.folder_updated_at) AS last_modified_at,
           CASE WHEN fs.app_count = 0 THEN fs.folder_updated_at ELSE fs.app_activity_at END AS activity_at
    FROM folder_stats fs
    WHERE ${folderVisibilityPredicate(s.folderAccess, 'fs', p)}
  ),
  pins AS (
    SELECT app_id, folder_id, position FROM pinned_items
    WHERE user_id = ${user} AND branch_id = ${branch}
  )`;
}

// Root rows: every visible folder + stray apps, plus pinned apps that live in a folder (flat, with
// their folder ref). pins is unique per (user, branch, resource), so the LEFT JOINs never fan out.
const ROOT_ENTRIES = `root_entries AS (
    SELECT ${FOLDER_COLUMNS}, 0 AS kind_order, pins.position AS pin_position
    FROM visible_folders vf LEFT JOIN pins ON pins.folder_id = vf.id
    UNION ALL
    SELECT ${APP_COLUMNS}, 1, pins.position
    FROM visible_apps va LEFT JOIN pins ON pins.app_id = va.id
    WHERE va.folder_id IS NULL OR pins.app_id IS NOT NULL
  )`;

export function rootPageQuery(s: DashboardScope, limit: number, offset: number): BuiltQuery {
  const p = new SqlParams();
  const sql = `${dashboardCtes(s, p)}, ${ROOT_ENTRIES}
    SELECT *, pin_position IS NOT NULL AS pinned FROM root_entries
    ORDER BY ${ROOT_ORDER}
    LIMIT ${p.add(limit)} OFFSET ${p.add(offset)}`;
  return { sql, params: p.values };
}

// counts.folders / counts.apps are unpinned only; total = pinned + folders + apps.
export function rootCountsQuery(s: DashboardScope): BuiltQuery {
  const p = new SqlParams();
  const sql = `${dashboardCtes(s, p)}, ${ROOT_ENTRIES}
    SELECT COUNT(*) FILTER (WHERE pin_position IS NOT NULL)::int AS pinned,
           COUNT(*) FILTER (WHERE pin_position IS NULL AND kind = 'folder')::int AS folders,
           COUNT(*) FILTER (WHERE pin_position IS NULL AND kind = 'app')::int AS apps
    FROM root_entries`;
  return { sql, params: p.values };
}
