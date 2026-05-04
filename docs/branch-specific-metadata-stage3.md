# Stage 3: Flows, Nuances & Impact Areas

## Core Data Model Change

**Columns moving from `apps` → `app_versions`:**

| Column | `apps` table | `app_versions` table (new) |
|--------|-------------|---------------------------|
| `slug` | Kept ONLY for workflows | `slug VARCHAR, UNIQUE(slug, branch_id)` |
| `name` | Kept ONLY for workflows | `app_name VARCHAR, UNIQUE(app_name, branch_id)` |
| `icon` | Kept ONLY for workflows | `icon VARCHAR` |
| `is_public` | Kept ONLY for workflows | `is_public BOOLEAN DEFAULT true` |

- For `type = 'front_end'` or `type = 'module'`: all reads/writes go through `app_versions`
- For `type = 'workflow'`: continue using `apps.*` columns (future migration, not this PR)

## Version Name Uniqueness

Current constraint: `UNIQUE(name, appId)` on `app_versions`
New constraint: `UNIQUE(name, appId, branchId)` — allows same version name across branches.

---

## Flow 1: Slug/Name/Icon/IsPublic Update (Editor)

1. Frontend sends `PATCH /apps/:appId` with `{ slug, name, icon, is_public, branch_id }`
2. Backend resolves the active `app_version` for that `(appId, branchId)`
3. Writes to `app_versions` row
4. **If on default branch**: validate slug global uniqueness (application-level)
5. **If on feature branch**: no global slug check needed (only enforced on pull/release)

## Flow 2: Public App Routing (`/applications/:slug`)

1. User hits `/applications/:slug`
2. Backend finds the app via: `app_versions` WHERE `slug = :slug` AND `app_versions.id = apps.current_version_id` (the released version)
3. Checks `app_versions.is_public = true`
4. No branch param needed — released apps always come from the released version

## Flow 3: Editor/Preview Routing (`/apps/:slug?branch_id=xxx`)

1. User hits `/apps/:slug?branch_id=xxx` (or without branch_id for default)
2. Backend resolves: `app_versions` WHERE `slug = :slug` AND `branch_id = :branchId`
3. **If no version found for that branch → throw error (404).** Do NOT fall back to default branch data.
4. Returns the branch-specific version

## Flow 4: Branch Creation

1. New branch created from source branch
2. All `app_versions` with `versionType = BRANCH` on source are duplicated for the new branch
3. New rows inherit `slug`, `app_name`, `icon`, `is_public` from source

## Flow 5: Push to GitHub

1. Serializes app data from `app_versions` (branch-specific slug/name/icon/is_public)
2. Pushes to remote branch
3. No changes to default branch

## Flow 6: Pull from GitHub (Merge to Default)

1. User merges PR on GitHub (feature → main)
2. User triggers pull on ToolJet for default branch
3. Pull updates `app_versions` on default branch with merged values (slug/name/icon/is_public)
4. **Slug uniqueness validated at this point** — if conflict, reject pull with descriptive error
5. If app was created on feature branch and doesn't exist on default yet, create it on default during pull

## Flow 7: Release Operation

1. User releases a version → sets `apps.current_version_id`
2. **Slug uniqueness validated** — the slug being released must be globally unique among all released versions in that org
3. `is_public` of the released version becomes what the public sees

## Flow 8: Import from Git (Feature Branch)

1. App imported from git onto a feature branch
2. **Also creates the app on default branch** (for sync integrity)
3. Both get `app_versions` rows with their respective branch-specific metadata

## Flow 9: Import from JSON

1. JSON import creates app + version
2. If importing onto a feature branch: also create presence on default branch (same as git import)
3. Slug/name uniqueness enforced per-branch

## Flow 10: App Not Found on Feature Branch

- **Any endpoint** that resolves an app by slug or ID on a specific branch:
  - If no `app_version` exists for that `(appId, branchId)` → **throw error**
  - Do NOT fall back to default branch
  - Do NOT show another branch's data
  - This applies to: editor load, preview, API calls with branch context

## Flow 11: Module Used Inside App (Cross-Push)

1. Module created on feature branch, added to an app
2. When app is pushed, module is implicitly included (current behavior)
3. Module's branch-specific metadata (slug/name/icon) travels with it
4. On pull to default, module also gets created/updated on default branch

---

## Slug Global Uniqueness — Application-Level Enforcement

**Three checkpoints (no DB constraint for cross-branch uniqueness):**

1. **Slug update on default branch** — reject if slug already exists on another released version in same org
2. **Release operation** — reject if slug conflicts with any other released app in same org
3. **Pull to default** — reject if incoming slug conflicts with existing released slugs in same org

Within a single branch, the DB constraint `UNIQUE(slug, branch_id)` prevents duplicates.

---

## URL Patterns Summary

| Context | URL | Branch handling |
|---------|-----|-----------------|
| Editor | `/:workspaceId/apps/:slug/:pageHandle?` | `?branch_id=xxx` query param |
| Viewer Preview | `/apps/:slug/:pageHandle?` | `?branch_id=xxx` query param |
| Released App | `/applications/:slug/:pageHandle?` | No branch param (uses `current_version_id`) |

---

## Migration (Backfill)

1. Add new columns to `app_versions`: `slug`, `app_name`, `icon`, `is_public`
2. For all existing `app_versions` where `app.type IN ('front_end', 'module')`:
   - Copy `apps.slug` → `app_versions.slug`
   - Copy `apps.name` → `app_versions.app_name`
   - Copy `apps.icon` → `app_versions.icon`
   - Copy `apps.is_public` → `app_versions.is_public`
3. Add DB constraints: `UNIQUE(slug, branch_id)`, `UNIQUE(app_name, branch_id)`
4. Update uniqueness on version name: `UNIQUE(name, appId, branchId)`

---

## What's NOT Changing

- Workflows (`type = 'workflow'`) — untouched, still use `apps.*`
- Data source rename — already branch-specific via `app_version_id`
- `apps` table columns — remain physically (for workflows), just unused for apps/modules
- `apps.current_version_id` — still points to released version

---

## Phase 1 Scope (Single PR)

- Data model migration + backfill
- All read/write paths for slug/name/icon/is_public → `app_versions`
- Guards (app-auth, public-app-environment, valid-slug) rewritten
- Repository methods rewritten
- Subscriber updated
- Editor/preview branch-aware routing
- Push/pull flows handle branch-specific metadata
- Release validates slug uniqueness
- Git import + JSON import both fixed
- Frontend passes `branch_id` where needed
- Error thrown (not fallback) when app not found on branch
