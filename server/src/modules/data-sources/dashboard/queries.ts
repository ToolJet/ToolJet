import { ActivityColumn, BuiltQuery, ENTRY_ORDER, PIN_ORDER } from '@modules/apps/dashboard/queries';
import { likePattern } from '@modules/apps/dashboard/actions';
import { SqlParams } from '@modules/apps/dashboard/sql-params';
import { DATA_SOURCE_FOLDER_TYPE } from '@modules/folders/constants';
import { DataSourceScopes, DataSourceTypes } from '../constants';
import { DataSourceFolderAccess, DataSourceGitState, folderVisibilityPredicate } from './actions';

export type { BuiltQuery };

export interface DataSourceDashboardScope {
  organizationId: string;
  userId: string;
  branchId: string;
  defaultBranchId: string;
  visibleDataSourceIds: string[] | null; // null = all
  activityColumn: ActivityColumn;
  folderAccess: DataSourceFolderAccess;
  git: DataSourceGitState;
}

export interface DataSourceEntryRow {
  kind: 'data_source' | 'folder';
  id: string;
  name: string;
  data_source_kind: string | null;
  plugin_id: string | null;
  owner_id: string | null;
  folder_id: string | null;
  data_source_count: number | null;
  has_data_sources_on_any_branch: boolean | null;
  last_modified_at: Date;
  modified_by_id: string | null;
  last_viewed_at: Date | null;
  pin_position: number | null;
  pinned: boolean;
}

// Same column list for both kinds so root / search can UNION them.
const DATA_SOURCE_COLUMNS = `'data_source' AS kind, vd.id, vd.name, vd.data_source_kind, vd.plugin_id, vd.owner_id,
  vd.folder_id, NULL::int AS data_source_count, NULL::boolean AS has_data_sources_on_any_branch,
  vd.last_modified_at, vd.modified_by_id, vd.last_viewed_at, vd.activity_at`;
const FOLDER_COLUMNS = `'folder' AS kind, vf.id, vf.name, NULL::varchar AS data_source_kind, NULL::uuid AS plugin_id,
  vf.owner_id, NULL::uuid AS folder_id, vf.data_source_count, vf.has_data_sources_on_any_branch,
  vf.last_modified_at, vf.modified_by_id, vf.last_viewed_at, vf.activity_at`;

const ROOT_ORDER = `${PIN_ORDER}, kind_order, ${ENTRY_ORDER}`;

// visible_data_sources: one row per visible data source on the branch — its active row on the branch,
// else (no row at all there) the default branch's active row, as DataSourcesRepository.allGlobalDS.
// visible_folders: data-source folders passing folder access, with summaries over visible data sources only.
function dashboardCtes(s: DataSourceDashboardScope, p: SqlParams): string {
  const branch = p.add(s.branchId);
  const defaultBranch = p.add(s.defaultBranchId);
  const user = p.add(s.userId);
  const org = p.add(s.organizationId);
  const visibleFilter = s.visibleDataSourceIds ? `AND ds.id = ANY(${p.add(s.visibleDataSourceIds)}::uuid[])` : '';
  return `WITH visible_data_sources AS (
    SELECT ds.id, ds.kind AS data_source_kind, ds.plugin_id, ds.created_by AS owner_id, dsv.name,
           COALESCE(editor.last_edited_at, dsv.updated_at, ds.updated_at) AS last_modified_at,
           editor.user_id AS modified_by_id,
           fds.folder_id, ua.last_viewed_at, ua.${s.activityColumn} AS activity_at
    FROM data_sources ds
    JOIN LATERAL (
      SELECT v.name, v.updated_at
      FROM data_source_versions v
      WHERE v.data_source_id = ds.id AND v.is_active AND (
        v.branch_id = ${branch}
        OR (v.branch_id = ${defaultBranch} AND NOT EXISTS (
          SELECT 1 FROM data_source_versions v2 WHERE v2.data_source_id = ds.id AND v2.branch_id = ${branch}
        ))
      )
      ORDER BY (v.branch_id = ${branch}) DESC
      LIMIT 1
    ) dsv ON true
    LEFT JOIN LATERAL (
      SELECT ue.user_id, ue.last_edited_at FROM user_data_source_activity ue
      WHERE ue.data_source_id = ds.id AND ue.branch_id = ${branch} AND ue.last_edited_at IS NOT NULL
      ORDER BY ue.last_edited_at DESC, ue.user_id
      LIMIT 1
    ) editor ON true
    LEFT JOIN folder_data_sources fds ON fds.data_source_id = ds.id AND fds.branch_id = ${branch}
    LEFT JOIN user_data_source_activity ua
      ON ua.user_id = ${user} AND ua.data_source_id = ds.id AND ua.branch_id = ${branch}
    WHERE ds.organization_id = ${org}
      AND ds.scope = ${p.add(DataSourceScopes.GLOBAL)}
      AND ds.type NOT IN (${p.add(DataSourceTypes.SAMPLE)}, ${p.add(DataSourceTypes.STATIC)})
      ${visibleFilter}
  ),
  folder_stats AS (
    SELECT f.id, f.name, f.created_by AS owner_id, f.updated_at AS folder_updated_at,
           COUNT(vd.id)::int AS data_source_count,
           MAX(vd.activity_at) AS data_source_activity_at,
           MAX(vd.last_modified_at) AS data_source_modified_at,
           MAX(vd.last_viewed_at) AS last_viewed_at,
           (ARRAY_AGG(vd.modified_by_id ORDER BY vd.last_modified_at DESC NULLS LAST))[1] AS modified_by_id,
           EXISTS (SELECT 1 FROM folder_data_sources x WHERE x.folder_id = f.id) AS has_data_sources_on_any_branch
    FROM folders f
    LEFT JOIN visible_data_sources vd ON vd.folder_id = f.id
    WHERE f.organization_id = ${org} AND f.type = ${p.add(DATA_SOURCE_FOLDER_TYPE)}
    GROUP BY f.id
  ),
  visible_folders AS (
    SELECT fs.id, fs.name, fs.owner_id, fs.data_source_count, fs.has_data_sources_on_any_branch,
           fs.modified_by_id, fs.last_viewed_at,
           COALESCE(fs.data_source_modified_at, fs.folder_updated_at) AS last_modified_at,
           CASE WHEN fs.data_source_count = 0 THEN fs.folder_updated_at ELSE fs.data_source_activity_at END AS activity_at
    FROM folder_stats fs
    WHERE ${folderVisibilityPredicate(s.folderAccess, 'fs', p)}
  ),
  pins AS (
    SELECT data_source_id, folder_id, position FROM pinned_items
    WHERE user_id = ${user} AND branch_id = ${branch}
  )`;
}

// Root rows: every visible folder + loose data sources, plus pinned data sources that live in a
// folder (flat, with their folder ref). pins is unique per (user, branch, resource), so no fan-out.
const ROOT_ENTRIES = `root_entries AS (
    SELECT ${FOLDER_COLUMNS}, 0 AS kind_order, pins.position AS pin_position
    FROM visible_folders vf LEFT JOIN pins ON pins.folder_id = vf.id
    UNION ALL
    SELECT ${DATA_SOURCE_COLUMNS}, 1, pins.position
    FROM visible_data_sources vd LEFT JOIN pins ON pins.data_source_id = vd.id
    WHERE vd.folder_id IS NULL OR pins.data_source_id IS NOT NULL
  )`;

const COUNTS = `COUNT(*) FILTER (WHERE pin_position IS NOT NULL)::int AS pinned,
           COUNT(*) FILTER (WHERE pin_position IS NULL AND kind = 'folder')::int AS folders,
           COUNT(*) FILTER (WHERE pin_position IS NULL AND kind = 'data_source')::int AS data_sources`;

export function rootPageQuery(s: DataSourceDashboardScope, limit: number, offset: number): BuiltQuery {
  const p = new SqlParams();
  const sql = `${dashboardCtes(s, p)}, ${ROOT_ENTRIES}
    SELECT *, pin_position IS NOT NULL AS pinned FROM root_entries
    ORDER BY ${ROOT_ORDER}
    LIMIT ${p.add(limit)} OFFSET ${p.add(offset)}`;
  return { sql, params: p.values };
}

// counts.folders / counts.data_sources are unpinned only; total = pinned + folders + data sources.
export function rootCountsQuery(s: DataSourceDashboardScope): BuiltQuery {
  const p = new SqlParams();
  const sql = `${dashboardCtes(s, p)}, ${ROOT_ENTRIES}
    SELECT ${COUNTS} FROM root_entries`;
  return { sql, params: p.values };
}

export function folderHeaderQuery(s: DataSourceDashboardScope, folderId: string): BuiltQuery {
  const p = new SqlParams();
  const ctes = dashboardCtes(s, p);
  const sql = `${ctes}
    SELECT vf.id, vf.name, c.total, c.pinned
    FROM visible_folders vf
    CROSS JOIN LATERAL (
      SELECT COUNT(*)::int AS total, COUNT(pins.data_source_id)::int AS pinned
      FROM visible_data_sources vd LEFT JOIN pins ON pins.data_source_id = vd.id
      WHERE vd.folder_id = vf.id
    ) c
    WHERE vf.id = ${p.add(folderId)}`;
  return { sql, params: p.values };
}

export function folderPageQuery(
  s: DataSourceDashboardScope,
  folderId: string,
  limit: number,
  offset: number
): BuiltQuery {
  const p = new SqlParams();
  const ctes = dashboardCtes(s, p);
  const sql = `${ctes}
    SELECT *, pin_position IS NOT NULL AS pinned FROM (
      SELECT ${DATA_SOURCE_COLUMNS}, pins.position AS pin_position
      FROM visible_data_sources vd LEFT JOIN pins ON pins.data_source_id = vd.id
      WHERE vd.folder_id = ${p.add(folderId)}
    ) e
    ORDER BY ${PIN_ORDER}, ${ENTRY_ORDER}
    LIMIT ${p.add(limit)} OFFSET ${p.add(offset)}`;
  return { sql, params: p.values };
}

// Pinned matches (by position), then folders (by rank), then data sources grouped by their folder
// (folder rank, name, id), loose ones last.
function searchMatchesCte(search: string, p: SqlParams): string {
  const pattern = p.add(likePattern(search));
  return `matches AS (
    SELECT ${FOLDER_COLUMNS}, 0 AS kind_order, NULL::timestamp AS group_rank, NULL::text AS group_name,
           pins.position AS pin_position
    FROM visible_folders vf LEFT JOIN pins ON pins.folder_id = vf.id
    WHERE vf.name ILIKE ${pattern} ESCAPE '\\'
    UNION ALL
    SELECT ${DATA_SOURCE_COLUMNS}, 1, gf.activity_at, LOWER(gf.name), pins.position
    FROM visible_data_sources vd
    LEFT JOIN visible_folders gf ON gf.id = vd.folder_id
    LEFT JOIN pins ON pins.data_source_id = vd.id
    WHERE vd.name ILIKE ${pattern} ESCAPE '\\'
  )`;
}

export function searchPageQuery(
  s: DataSourceDashboardScope,
  search: string,
  limit: number,
  offset: number
): BuiltQuery {
  const p = new SqlParams();
  const sql = `${dashboardCtes(s, p)}, ${searchMatchesCte(search, p)}
    SELECT *, pin_position IS NOT NULL AS pinned FROM matches
    ORDER BY ${PIN_ORDER}, kind_order, (folder_id IS NULL), group_rank DESC NULLS LAST, group_name, folder_id, ${ENTRY_ORDER}
    LIMIT ${p.add(limit)} OFFSET ${p.add(offset)}`;
  return { sql, params: p.values };
}

// counts.folders / counts.data_sources are unpinned only; total = pinned + folders + data sources.
export function searchCountsQuery(s: DataSourceDashboardScope, search: string): BuiltQuery {
  const p = new SqlParams();
  const sql = `${dashboardCtes(s, p)}, ${searchMatchesCte(search, p)}
    SELECT ${COUNTS} FROM matches`;
  return { sql, params: p.values };
}
