# Stage 3: Branch-Specific App Metadata — Technical Design

## Core Data Model Change

**Columns moved from `apps` → `app_versions`:**

| Column | `apps` table | `app_versions` table (new) |
|--------|-------------|---------------------------|
| `slug` | Kept ONLY for workflows; non-workflows get `slug = app.id` | `slug VARCHAR` |
| `name` | Kept ONLY for workflows; non-workflows get `name = NULL` | `app_name VARCHAR` |
| `icon` | Kept ONLY for workflows; non-workflows get `icon = NULL` | `icon VARCHAR` |
| `is_public` | Kept ONLY for workflows; non-workflows get `is_public = NULL` | `is_public BOOLEAN DEFAULT true` |

- For `type = 'front_end'` or `type = 'module'`: all reads/writes go through `app_versions`
- For `type = 'workflow'`: continue using `apps.*` columns (unchanged)

### Two Workspace Types

**Git-sync workspaces (has BRANCH versions):**
- Each app has exactly ONE `BRANCH`-type version per workspace branch
- The BRANCH version is the canonical carrier of `slug` and `app_name`
- VERSION-type versions (draft, saved, released) keep `slug = NULL`, `app_name = NULL`
- `icon` and `is_public` live on ALL versions (both BRANCH and VERSION)

**Non-git-sync workspaces (no BRANCH versions):**
- All versions are VERSION-type with `branch_id = NULL`
- `slug`, `app_name`, `icon`, `is_public` live directly on these VERSION versions
- Partial unique indexes exclude these rows — uniqueness enforced at application level

### DB Constraints

- `UNIQUE(slug, branch_id) WHERE branch_id IS NOT NULL` — prevents slug conflicts within a branch
- `UNIQUE(app_name, branch_id) WHERE branch_id IS NOT NULL` — prevents name conflicts within a branch
- `UNIQUE(name, app_id, branch_id) WHERE branch_id IS NOT NULL` — allows same version name across branches

Partial indexes only cover git-sync workspaces (where `branch_id IS NOT NULL`). Non-git-sync uniqueness is enforced at application level.

---

## Subscriber Overlay (Transparency Layer)

**File**: `server/src/modules/apps/subscribers/apps.subscriber.ts`

The `afterLoad()` hook overlays version-level metadata onto the App entity so all read paths work transparently without frontend changes.

### Version resolution (two-step fallback):
1. Find a non-BRANCH, non-stub version (normal editing version)
2. **Fallback**: find a BRANCH-type version (handles apps created on feature branches that only have a BRANCH version)

### Metadata overlay (three branches):
```
if editingVersion IS a BRANCH version:
  → read slug/appName directly from it
else if editingVersion has a branchId:
  → look up the sibling BRANCH version for slug/appName
else (non-git-sync):
  → read slug/appName from editingVersion itself
```

`icon` and `isPublic` are always read from `editingVersion` regardless of version type.

---

## Write Path Splitting

**File**: `server/src/modules/apps/util.service.ts` — `update()` method

For non-workflows, metadata is divided into:

| Category | Fields | Where written (git-sync) | Where written (non-git-sync) |
|----------|--------|--------------------------|------------------------------|
| Broad params | `icon`, `isPublic` | All versions on the branch | All versions (branchId=NULL) |
| Unique params | `slug`, `appName` | BRANCH-type version only | All versions |
| App-level params | `isMaintenanceOn`, `currentVersionId` | `apps` table | `apps` table |

For workflows: all params written to `apps` table (unchanged).

---

## Flow 1: Slug/Name/Icon/IsPublic Update (Editor)

1. Frontend sends `PATCH /apps/:appId` with `{ slug, name, icon, is_public, branch_id }`
2. Backend splits params into broad vs unique
3. Broad params → update all versions matching `(appId, branchId)` or `(appId)` for non-git-sync
4. Unique params → update BRANCH-type version only (git-sync) or all versions (non-git-sync)
5. DB constraint catches conflicts via `catchDbException`

## Flow 2: Public App Routing (`/applications/:slug`)

1. User hits `/applications/:slug`
2. Guard resolves app: `INNER JOIN app_versions av ON av.app_id = app.id WHERE av.slug = :slug`
3. No `version_type` filter — works for both BRANCH versions (git-sync) and VERSION versions (non-git-sync)
4. Checks `av.is_public = true` (from the version, not the app)
5. Fallback to `apps WHERE slug` for workflows

## Flow 3: Editor/Preview Routing

1. User opens app in editor
2. Backend `getOne(app)` uses subscriber overlay → `app.editingVersion` is set
3. For BRANCH-only apps (created on feature branch): subscriber falls back to BRANCH version as editingVersion
4. Frontend receives `editing_version` → sets `selectedVersion` → git controls work

## Flow 4: Branch Creation (ensureBranchVersion)

1. New branch created from source branch
2. `ensureBranchVersion` duplicates the BRANCH-type version for the new branch
3. New BRANCH version inherits `slug`, `appName`, `icon`, `isPublic` from source

## Flow 5: Push to GitHub

1. Serializes app data from `app_versions` (branch-specific slug/name/icon/is_public)
2. `app.name` comes from subscriber overlay (reads from BRANCH version)
3. Pushes to remote branch

## Flow 6: Pull from GitHub (Merge to Default)

1. User merges PR on GitHub (feature → main)
2. User triggers pull on ToolJet for default branch
3. Pull updates `app_versions` via `update()` which routes to correct version
4. **Slug uniqueness validated** — if conflict, reject
5. Slug dedup on import checks `appVersionRepository.findOne({ where: { slug } })` (not apps table)

## Flow 7: Release Operation

1. User releases a version → sets `apps.current_version_id`
2. Backend resolves canonical slug from any version with slug on this app
3. Checks no other released app (with `current_version_id IS NOT NULL`) has the same slug
4. If conflict → `BadRequestException`

## Flow 8: App Creation on Feature Branch

1. `create()` called with `branchId` for non-default branch
2. Only a BRANCH-type version is created (no VERSION-type)
3. `update()` called immediately after with slug/name/icon → written to BRANCH version
4. Subscriber fallback finds this BRANCH version as editingVersion
5. Frontend receives full app data including editing_version → app name + git controls work

## Flow 9: Import from JSON

1. JSON import creates app with `apps.slug = app.id` (placeholder)
2. Real slug goes to `app_versions` via the normal update path
3. Module name lookup uses `EXISTS (SELECT 1 FROM app_versions WHERE app_name IN (...))`

## Flow 10: App List / Search

All search queries filter by app name via `app_versions.app_name`:
```sql
WHERE (
  EXISTS (SELECT 1 FROM app_versions av_s WHERE av_s.app_id = apps.id AND LOWER(av_s.app_name) LIKE :searchKey)
  OR (apps.type = 'workflow' AND LOWER(apps.name) LIKE :searchKey)
)
```

`findAllOrganizationApps` uses raw SQL with COALESCE:
- With branchId: INNER JOIN to BRANCH-type version for that branch
- Without branchId: subquery picks best version with slug (BRANCH preferred, then VERSION by updated_at DESC), COALESCE fallback to apps table

---

## Slug Global Uniqueness — Three Checkpoints

1. **On update** (util.service.ts): DB partial constraint catches conflicts within same branch via `catchDbException`
2. **On release** (service.ts): Checks no other released app has same slug across all versions in the org
3. **On git pull** (EE): Slug dedup validated during import to default branch

Within a single branch, the DB constraint `UNIQUE(slug, branch_id) WHERE branch_id IS NOT NULL` prevents duplicates.

---

## Repository — Slug Resolution

**File**: `server/src/modules/apps/repository.ts`

All methods resolve slugs through `app_versions` — no `version_type` filter on reads:

| Method | Resolution |
|--------|-----------|
| `findBySlug(slug, orgId, branchId?)` | With branchId: version WHERE slug AND branchId. Without: any version WHERE slug. Fallback: apps table. |
| `retrieveAppDataUsingSlug(slug)` | Version WHERE slug → returns `{ orgId, isPublic, isReleased }`. Fallback: apps table. |
| `findByAppName(name, orgId)` | Version WHERE app_name → join to app. Fallback: apps table. |
| `findByIdOrSlug(idOrSlug)` | UUID → apps table. Then version WHERE slug. Fallback: apps WHERE slug. |
| `findAllOrganizationApps(orgId, branchId?)` | Raw SQL with COALESCE/subquery as described above. |

---

## URL Patterns Summary

| Context | URL | Branch handling |
|---------|-----|-----------------|
| Editor | `/:workspaceId/apps/:slug/:pageHandle?` | `?branch_id=xxx` query param |
| Viewer Preview | `/apps/:slug/:pageHandle?` | `?branch_id=xxx` query param |
| Released App | `/applications/:slug/:pageHandle?` | No branch param (resolved via any version with slug) |

---

## What's NOT Changing

- Workflows (`type = 'workflow'`) — untouched, still use `apps.*`
- Data source rename — already branch-specific via `app_version_id`
- `apps` table columns — remain physically (for workflows), unused for apps/modules
- `apps.current_version_id` — still points to released version
- Frontend — no changes needed (subscriber overlay provides transparency)

---

## Files Modified

| File | Change |
|------|--------|
| `server/migrations/1778000000000-AddMetadataColumnsToAppVersions.ts` | Migration + backfill |
| `server/src/entities/app_version.entity.ts` | New columns + uniqueness |
| `server/src/helpers/db_constraints.constants.ts` | New constraint names |
| `server/src/modules/apps/subscribers/apps.subscriber.ts` | Overlay with two-step fallback |
| `server/src/modules/apps/util.service.ts` | Write path splitting + search |
| `server/src/modules/apps/repository.ts` | All slug/name resolution methods |
| `server/src/modules/apps/service.ts` | getAppAuthenticationConfig + release check |
| `server/src/modules/apps/guards/app-auth.guard.ts` | Slug resolution via version |
| `server/src/modules/app-environments/guards/public_app_environment.guard.ts` | Same |
| `server/src/modules/folder-apps/util.service.ts` | Search via app_versions.app_name |
| `server/src/modules/apps/services/app-import-export.service.ts` | Module name lookup |
| `server/ee/apps/util.service.ts` | EE search override |
| `server/ee/app-git/shared/app-git-operations.util.ts` | ensureBranchVersion + slug dedup |
| `server/ee/external-apis/service.ts` | PAT slug lookup |
