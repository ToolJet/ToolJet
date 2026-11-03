# folder-data-sources module

Owns the membership between a **Data source folder** (a `folders` row with `type = 'data_source'`) and the global **Data sources** inside it, plus the permission-filtered listing that backs the global Data sources page. Folder CRUD itself lives in `folders`; this module only owns what is *in* a folder and who may see it.

## Domain terms

- **Data source folder** — a `Folder` discriminated by `type = DATA_SOURCE_FOLDER_TYPE`, never an app type. Builder/admin-facing; never end-user assignable.
- **Membership** — a `folder_data_sources` row (`folder_id`, `data_source_id`, `branch_id`). A data source belongs to at most one folder per branch.
- **Stray data source** — a global data source in no folder; the frontend renders it at the root of the list.

## Key files

| File | Role |
|---|---|
| `controller.ts` | `GET /api/folder-data-sources` (listing), `POST` (add/bulk add), `PUT /:folderId` (remove) |
| `service.ts` | `getFolders()` — resolves permissions, builds the folder→membership map, filters; `filterFoldersByPermissions()`, `resolveViewableDataSourceIds()` |
| `util.service.ts` | `findFolderDataSourcesForFolders()` + `buildFolderDataSourcesQuery()` (branch-presence join); `getFoldersWithDataSourceIds()` for the app-builder tree |
| `ability/index.ts` | Authorizes add/remove: granular `DATA_SOURCE_FOLDER` grant **or** the coarse `dataSourceFolderCreate` flag, or folder ownership |

## Edition split

- EE override: `server/ee/folder-data-sources/` — constructor pass-throughs only; all listing and permission logic lives in CE and is shared.
- Granular per-folder grants are an EE feature. The ability service builds the `MODULES.DATA_SOURCE_FOLDER` bucket in **both** editions (`src/modules/ability/service.ts`, `ee/ability/service.ts`); with no grants configured it resolves to an object with empty id lists, not `undefined`.

## Invariants & gotchas

- **A folder is listed when the user owns it, holds a grant on it, OR it holds at least one data source they may see.** That last clause mirrors `FolderAppsService.filterFoldersByPermissions` (`folderApps.length > 0`). Without it a data source reached by a direct grant renders at the *root* as though unfoldered, because the frontend derives "is foldered" from the folders the API returned. Pinned by `test/modules/folder-data-sources/unit/service.spec.ts` and the direct-grant describe in `ee/test/modules/folder-data-sources/e2e/folder-data-source-permissions.spec.ts`.
- **Visibility is not management.** A folder revealed only by its contents carries no folder grant: rename is still refused by `FoldersService.checkFolderManagePermission` (admin / owner / granular `editableFoldersId` only). The frontend must gate the folder's ⋮ menu per-folder, not on the coarse workspace flags — see `frontend/src/modules/dataSources/pages/GlobalDataSourcesPage/index.jsx` (`canUpdateDataSourceFolder` / `canDeleteDataSourceFolder`), mirroring `frontend/src/HomePage/Folders.jsx`. Gating rename on the coarse `data_source_folder_create` flag offers an action the API then 403s.
- **Contents are permission-filtered before the folder filter runs.** `getFolders()` builds `byFolder` from an already-filtered membership query and passes it in, so a revealed folder shows only the data sources the user may see and `count` matches. Any new caller must preserve that order — filtering folders before filtering contents would leak counts.
- **`resolveViewableDataSourceIds()` returns `null` for "no restriction"** (admins, and users with blanket usable/configurable access) — not an empty array. An empty array means "nothing visible". Mirrors `DataSourcesRepository.allGlobalDS`.
- **Coarse and granular are additive, not fallback.** A holder of `dataSourceFolderCreate` may move data sources into any folder, including one revealed only by its contents. Deliberate, and matches app folders.
- **Two listing paths exist and must not drift.** `getFolders()` backs the global Data sources page; `getFoldersWithDataSourceIds()` backs the app-builder query panel (getForApp) and already drops folders with no permitted data source. They previously disagreed on the direct-grant case.
- `branch_id` is NOT NULL on `folder_data_sources` (unlike `folder_apps`), so there is no legacy `IS NULL` case. Branch presence is enforced by the inner join to an active `data_source_versions` row.

## Related modules

- `folders` — owns folder CRUD and `checkFolderManagePermission`, the real authority on rename/delete
- `folder-apps` — the app-folder analogue; the reference implementation for folder visibility rules
- `data-sources` — `allGlobalDS()` decides which data sources exist for the user at all
- `ability` — builds the `DATA_SOURCE_FOLDER` and `GLOBAL_DATA_SOURCE` permission buckets
