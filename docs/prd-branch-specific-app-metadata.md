  # Branch-Specific App Metadata

  Github issues - TBD
  Design file - TBD

  ---

  ## 📋 Executive Summary

  **Who is this for?**
  Workspace admins and builders using ToolJet's git sync and branching features, working in teams where multiple people develop apps and modules concurrently on separate branches.

  **Why would someone use this feature?**
  When a builder renames an app, changes its slug, updates its icon, or toggles its public visibility on a feature branch, that change immediately affects the default branch and all other users in the workspace. There is no isolation — metadata edits on one branch bleed into another, breaking the branch-as-sandbox model that git sync is designed to provide. This makes concurrent development unreliable for anything beyond component/query changes.

  **What is the feature?**
  App and module metadata (slug, name, icon, is_public) moves from the shared `apps` table to `app_versions`, where each branch already has its own version rows. This makes metadata changes branch-isolated: a rename on a feature branch only appears on the default branch after the GitHub PR is merged and pulled. The same isolation applies to modules (which share the `apps` table). Released apps continue to serve their public slug via `current_version_id` without branch awareness. Workflows are unaffected.

  **What is the differentiator?**
  N/A

  **Value**
  Completes the branch isolation model for app development. Builders can safely rename, re-slug, and reconfigure apps on feature branches without side effects, enabling true concurrent development workflows. Reduces coordination overhead in teams and eliminates a class of accidental production changes.

  **Release note**

  - **Heading:** Isolate app metadata changes to branches
  - **Description:** App name, slug, icon, and public visibility are now branch-specific. Changes made on a feature branch stay on that branch until merged — no more accidental renames on production. Modules follow the same isolation model.
  - **Image:** Editor showing the app settings panel (slug input, name, icon picker) with a branch indicator visible, demonstrating that the change is scoped to the current branch.

  ---

  ## 💢 Pain Points & JTBD

  > *"When I'm developing an app on a feature branch, I want metadata changes (name, slug, icon, visibility) to stay on my branch until I merge, so that my work doesn't accidentally affect production or other developers' branches."*

  **Job Executor**
  - Primary: Builder developing apps/modules on feature branches
  - Secondary: Workspace admin managing released apps; other builders working on the same app from different branches

  **Functional Jobs**
  1. I want to rename an app on my branch without it showing up on other branches
  2. I want to change an app's slug on my branch without breaking the released URL
  3. I want to change an app's icon on my branch as part of a design update that ships together
  4. I want to toggle is_public on my branch and have it take effect only after merge + release
  5. I want the same isolation for modules (slug, name, icon)
  6. I want to rename a version on my branch without conflicting with same-named versions on other branches
  7. I want branch context in the URL when previewing so I see the correct branch's state
  8. I want import (git and JSON) to correctly place metadata per-branch

  **Emotional Jobs**
  - Confidence that feature branch work is safe and isolated
  - No anxiety about accidentally breaking production URLs or visibility

  **Social Jobs**
  - Perceived as a reliable platform for team-based development
  - Admins trust that branch isolation means what it says

  **Struggles & Anxieties**
  - Today: renaming an app on a feature branch immediately renames it everywhere
  - Today: changing a slug on a feature branch could break the released public URL
  - Today: no way to "preview" a name/slug change before it goes live
  - Today: multiple builders editing the same app's metadata create unpredictable state

  **Success Criteria**
  1. Renaming an app on a feature branch does NOT change the app name on default branch
  2. Changing a slug on a feature branch does NOT affect the released app's public URL
  3. After merge + pull to default, metadata changes appear on the default branch
  4. Slug uniqueness is enforced globally at release and pull-to-default checkpoints
  5. If an app has no version on the active branch, the system returns an error (no fallback)
  6. Git import onto a feature branch also creates the app on default branch for sync integrity
  7. JSON import onto a feature branch also creates presence on default branch

  ---

  ## 💡 Solution Approach

  Move `slug`, `name` (as `app_name`), `icon`, and `is_public` from the `apps` table to `app_versions`. Since `app_versions` already has a `branch_id` foreign key to `workspace_branch`, this makes all four fields inherently branch-scoped without adding new junction tables or context mechanisms. The `apps` table columns (`slug`, `name`, `icon`, `is_public`) are cleaned up for apps/modules via migration — set to NULL or a safe default since these columns are no longer the source of truth for non-workflow types. The unique constraint on `apps.slug` is retained for workflows. All read and write paths for apps and modules (`type IN ('front_end', 'module')`) are rewritten to go through `app_versions`.

  > 💪 Guiding principle: Branch isolation must be complete for app metadata — no partial isolation where some fields are branch-aware and others bleed through.
  > → If it lives in `app_versions`, it's branch-isolated. If it lives in `apps`, it's shared. No middle ground.

  > 🔍 Scope
  > - **In scope (Phase 1):** slug, app_name, icon, is_public for apps and modules. All guards, repositories, services, subscriber, frontend routing, git sync, JSON import, AppBase entity update.
  > - **Explicitly out of scope:** Workflows (`type = 'workflow'`). They will eventually migrate but are untouched in this PR.

  ---

  ## 📊 Success Criteria

  | # | Criteria | Measured by |
  |---|----------|-------------|
  | 1 | Metadata change on feature branch does not affect default branch | Manual test: rename app on branch, verify default unchanged |
  | 2 | Released app URL (`/applications/:slug`) continues working after branch changes | Integration test: change slug on branch, verify public URL unaffected |
  | 3 | Pull to default propagates merged metadata correctly | E2E test: push → merge → pull → verify default branch updated |
  | 4 | Slug conflict at pull/release produces clear error, not silent overwrite | Integration test: create conflicting slugs, attempt pull |
  | 5 | App not found on branch returns 404, never falls back to default | Unit test: request app on branch without version → 404 |
  | 6 | Git import on feature branch creates dual presence (feature + default) | Integration test: import → verify both branches have app_versions rows |
  | 7 | Existing apps backfilled correctly (all app_versions get metadata) | Migration test: run migration, verify all non-workflow versions have slug/name/icon/is_public |
  | 8 | App listing respects active branch — only shows apps with versions on that branch | Integration test: switch branch, verify listing changes |

  ---

  ## 🎯 Impact Areas

  | Area | Impact | In scope? |
  |------|--------|-----------|
  | App builder (editor) | Slug/name/icon/is_public reads from `app_versions`; settings panel passes `branch_id` | ✅ Phase 1 |
  | Viewer / preview | `/apps/:slug?branch_id=xxx` resolves through `app_versions` | ✅ Phase 1 |
  | Released app routing | `/applications/:slug` resolves via `current_version_id` → `app_versions` | ✅ Phase 1 |
  | Guards (app-auth, public-app-env, valid-slug) | Rewritten to JOIN through `app_versions` | ✅ Phase 1 |
  | Repository layer | `findBySlug`, `retrieveAppDataUsingSlug`, `findAllOrganizationApps` rewritten | ✅ Phase 1 |
  | Subscriber (afterLoad, afterInsert) | Updated for apps/modules; workflow path unchanged | ✅ Phase 1 |
  | AppBase entity | Updated to not expose deprecated fields for non-workflow types | ✅ Phase 1 |
  | Git sync (push) | Serializes metadata from `app_versions` (branch-specific) | ✅ Phase 1 |
  | Git sync (pull) | Writes merged metadata to default branch `app_versions`; validates slug uniqueness | ✅ Phase 1 |
  | Git import | Creates app on both feature and default branch | ✅ Phase 1 |
  | JSON import/export | Reads/writes metadata from `app_versions`; dual-branch creation on feature import | ✅ Phase 1 |
  | Release operation | Validates slug uniqueness before setting `current_version_id` | ✅ Phase 1 |
  | Folder-apps (search) | Search by `app_versions.app_name` instead of `apps.name` | ✅ Phase 1 |
  | Frontend routing | Passes `branch_id` query param; reads metadata from version-level state | ✅ Phase 1 |
  | App listing endpoint | Respects active branch — only shows apps with BRANCH-type versions on active branch | ✅ Phase 1 |
  | Module resolution at runtime | Uses same `branch_id` as parent app context | ✅ Phase 1 |
  | Branch deletion | Cascades to `app_versions` rows — unreleased changes lost (expected) | ✅ Phase 1 |
  | Workflow builder | Not affected — workflows continue using `apps.*` | ➖ Not affected |
  | Audit logs | Existing app update events capture branch context | ✅ Phase 1 |
  | Permissions / RBAC | No new permissions needed — same guards, different resolution path | ➖ Not affected |
  | License / feature flags | No new flags — this is core branching behaviour | ➖ Not affected |
  | ToolJet external API | App API endpoints resolve through `app_versions` with branch context | ✅ Phase 1 |
  | Constants | Not affected | ➖ Not affected |
  | Themes | Not affected | ➖ Not affected |

  ---

  ## 🛠 Implementation Details

  ### Data Model Changes

  **New columns on `app_versions`:**

  | Column | Type | Nullable | Default | Notes |
  |--------|------|----------|---------|-------|
  | `slug` | `VARCHAR` | YES (nullable during migration) | NULL | Backfilled from `apps.slug` |
  | `app_name` | `VARCHAR` | YES | NULL | Backfilled from `apps.name` |
  | `icon` | `VARCHAR` | YES | NULL | Backfilled from `apps.icon` |
  | `is_public` | `BOOLEAN` | YES | `true` | Backfilled from `apps.is_public` |

  **New DB constraints:**

  | Constraint | Type | Columns | Notes |
  |------------|------|---------|-------|
  | `UQ_app_versions_slug_branch` | Partial UNIQUE index | `(slug, branch_id) WHERE branch_id IS NOT NULL` | Excludes NULL branch_id rows |
  | `UQ_app_versions_app_name_branch` | Partial UNIQUE index | `(app_name, branch_id) WHERE branch_id IS NOT NULL` | Excludes NULL branch_id rows |
  | `UQ_app_versions_name_app_branch` | UNIQUE (replacing existing) | `(name, app_id, branch_id)` | Allows same version name across branches |

  > ⚠️ Partial unique indexes exclude rows where `branch_id IS NULL` (pre-branching versions). For NULL branch_id rows, uniqueness is enforced at the application level. This avoids migration issues where multiple versions of the same app would violate `UNIQUE(slug, NULL)`.

  **`apps` table column cleanup (migration):**
  - For all apps where `type IN ('front_end', 'module')`: set `slug = id`, `name = NULL`, `icon = NULL`, `is_public = NULL`
  - The `apps.slug` unique constraint is retained (still needed for workflows)
  - Setting `slug = id` for apps/modules ensures the unique constraint isn't violated while keeping the column inert

  ---

  ### Migration Strategy

  **Step 1: Add columns to app_versions**
  ```sql
  ALTER TABLE app_versions ADD COLUMN slug VARCHAR;
  ALTER TABLE app_versions ADD COLUMN app_name VARCHAR;
  ALTER TABLE app_versions ADD COLUMN icon VARCHAR;
  ALTER TABLE app_versions ADD COLUMN is_public BOOLEAN DEFAULT true;
  ```

  **Step 2: Backfill all existing app_versions for apps/modules**
  ```sql
  UPDATE app_versions av
  SET slug = a.slug,
      app_name = a.name,
      icon = a.icon,
      is_public = a.is_public
  FROM apps a
  WHERE av.app_id = a.id
    AND a.type IN ('front_end', 'module');
  ```

  **Step 3: Clean apps table columns for non-workflow types**
  ```sql
  UPDATE apps
  SET slug = id,
      name = NULL,
      icon = NULL,
      is_public = NULL
  WHERE type IN ('front_end', 'module');
  ```

  **Step 4: Add partial unique indexes**
  ```sql
  CREATE UNIQUE INDEX UQ_app_versions_slug_branch
    ON app_versions (slug, branch_id)
    WHERE branch_id IS NOT NULL;

  CREATE UNIQUE INDEX UQ_app_versions_app_name_branch
    ON app_versions (app_name, branch_id)
    WHERE branch_id IS NOT NULL;

  -- Drop and recreate version name uniqueness
  ALTER TABLE app_versions DROP CONSTRAINT IF EXISTS UQ_version_name_app;
  ALTER TABLE app_versions ADD CONSTRAINT UQ_version_name_app_branch UNIQUE (name, app_id, branch_id);
  ```

  **Step 5: Application-level enforcement for NULL branch_id**
  - For `app_versions` rows with `branch_id = NULL` (legacy pre-branching versions):
  - Uniqueness of slug and app_name enforced in the service layer before insert/update
  - These rows are treated as "default branch" semantically

  > 💡 Migration order matters: backfill BEFORE adding constraints. Clean apps table AFTER backfill to preserve data integrity during the migration window.

  ---

  ### Slug Uniqueness Rules

  | Scope | Enforcement | Mechanism |
  |-------|-------------|-----------|
  | Within a single branch (non-NULL branch_id) | DB partial unique index | `UNIQUE(slug, branch_id) WHERE branch_id IS NOT NULL` |
  | Within NULL branch_id rows | Application-level | Service checks before insert/update |
  | Across all released apps in org | Application-level | Checked at 3 checkpoints |

  **Three application-level checkpoints for global released slug uniqueness:**

  1. **Slug update on default branch**
    - Query: `SELECT 1 FROM app_versions av JOIN apps a ON av.app_id = a.id WHERE av.slug = :newSlug AND av.id = a.current_version_id AND a.organization_id = :orgId AND av.id != :currentVersionId`
    - If exists → reject with error: "This slug is already in use by a released app"

  2. **Release operation**
    - Same query as above, run before setting `apps.current_version_id`
    - If conflict → reject: "Cannot release — slug conflicts with another released app"

  3. **Pull to default branch**
    - After merging metadata from feature branch to default, validate all incoming slugs
    - If any conflict → reject entire pull: "Pull blocked — slug '{slug}' conflicts with released app '{appName}'"

  ---

  ### Slug Format Rules

  Slug validation (verify existing implementation and align):
  - Lowercase alphanumeric characters and hyphens only
  - No leading or trailing hyphens
  - Minimum 1 character (auto-generated slugs use app ID)
  - No uppercase (auto-lowercased if entered)
  - Must be unique within the branch scope

  > 💡 Verify existing slug validation in the codebase (`appsUtilService` slug generation) and document exact rules. Align new validation with existing behaviour — do not introduce stricter rules that break existing slugs.

  ---

  ### Branch ID Resolution & Precedence

  **How `branch_id` is determined for a request:**

  | Source | Priority | Notes |
  |--------|----------|-------|
  | Query param `?branch_id=xxx` | 1 (highest) | Used in URL-shared links |
  | Header `x-branch-id` | 2 | Set by frontend for API calls |
  | Default branch (fallback) | 3 (lowest) | If neither is present, resolve to org's default branch |

  > ⚠️ If both query param and header are present with different values, query param wins. The frontend must append `branch_id` from the header into URLs to avoid race conditions where a user switches branches mid-navigation and stale API calls resolve against the wrong branch.

  **Frontend rule:** When the user is on a non-default branch, all navigation URLs must include `?branch_id=xxx` in the URL itself (not just the header). This ensures bookmarked/shared links resolve correctly and prevents race conditions during branch switches.

  ---

  ### App Listing Endpoint

  **`findAllOrganizationApps(orgId, branchId)`** — behaviour change:

  - **Current:** Selects all apps in org, reads `app.slug`, `app.name` from `apps` table
  - **New:** JOINs `app_versions` WHERE `branch_id = :activeBranchId` AND `versionType = 'BRANCH'`
  - Only apps that have a BRANCH-type version on the active branch appear in the list
  - Metadata (name, slug, icon) comes from the branch-specific `app_versions` row
  - Apps without a version on the active branch are NOT shown (they don't exist on that branch)

  This means:
  - Default branch shows all apps that have been created/pulled to default
  - Feature branch shows only apps that were branched, created, or imported there
  - Switching branches may change the visible app list — this is correct and expected

  ---

  ### Guard Rewrites

  **`app-auth.guard.ts`** and **`public_app_environment.guard.ts`** — resolve slug through any version (no `version_type` filter):
  ```typescript
  // Resolve app through any version carrying the slug
  const app = await this.appRepository
    .createQueryBuilder('app')
    .innerJoin('app_versions', 'av', 'av.app_id = app.id')
    .where('av.slug = :slug', { slug })
    .andWhere('app.organization_id = :orgId', { orgId })
    .getOne();

  // is_public read from the version, not the app
  const version = await this.appVersionRepository.findOne({ where: { slug, appId: app.id } });
  if (version.isPublic === true) { /* allow */ }
  ```

  Key design decisions:
  - No `version_type` filter — works for both BRANCH versions (git-sync) and VERSION versions (non-git-sync)
  - No `current_version_id` join — released versions have `slug = NULL` in git-sync (only BRANCH version carries slug)
  - `is_public` read from the version row, not from `apps` table
  - Fallback: `apps WHERE slug` for workflows only

  ---

  ### Repository Method Rewrites

  All methods resolve slugs through `app_versions` — no `version_type` filter on reads:

  | Method | Resolution |
  |--------|-----------|
  | `findBySlug(slug, orgId, branchId?)` | With branchId: `app_versions WHERE slug AND branchId` → join to app. Without: any version WHERE slug. Fallback: `apps WHERE slug` (workflows). |
  | `retrieveAppDataUsingSlug(slug)` | Version WHERE slug → returns `{ orgId, isPublic, isReleased }`. `isPublic` from version. Fallback: apps table. |
  | `findByAppName(name, orgId)` | Version WHERE app_name → join to app. Fallback: `apps WHERE name` (workflows). |
  | `findByIdOrSlug(idOrSlug)` | UUID → apps table. Then version WHERE slug. Fallback: `apps WHERE slug` (workflows). |
  | `findAllOrganizationApps(orgId, branchId?)` | With branchId: INNER JOIN to BRANCH-type version. Without: subquery picks best version with slug (BRANCH preferred, then VERSION by updated_at DESC), COALESCE fallback to apps table. |

  ---

  ### Subscriber Changes (`apps.subscriber.ts`)

  **`afterInsert`:**
  - Sets `apps.slug = app.id` if slug not provided (placeholder for non-workflows)
  - For workflows: unchanged

  **`afterLoad` — Two-step version resolution:**
  1. First try: find a non-BRANCH, non-stub version (the normal editing version)
  2. Fallback: find a BRANCH-type version (handles apps created on feature branches that only have a BRANCH version)

  **`afterLoad` — Three-branch metadata overlay:**
  ```
  if editingVersion IS a BRANCH version:
    → read slug/appName directly from it
  else if editingVersion has a branchId:
    → look up the sibling BRANCH version for slug/appName
  else (non-git-sync):
    → read slug/appName from editingVersion itself
  ```

  `icon` and `isPublic` are always read from `editingVersion` regardless of version type.

  This fallback is critical for apps created on non-default branches — the `create()` method only produces a BRANCH-type version for these apps (no VERSION-type version exists until git pull hydrates the default branch). Without the fallback, these apps would have no `editingVersion`, causing the frontend to show no app name and "Configure Git" instead of branch controls.

  ---

  ### AppBase Entity Update

  **`app_base.entity.ts`** changes:
  - The `slug`, `name`, `icon`, `isPublic` columns remain declared on `AppBase` (they're physical columns)
  - Add a transient/virtual property pattern: when the entity is loaded for a non-workflow type, the subscriber overwrites these with values from `app_versions`
  - This minimizes blast radius — existing code that reads `app.slug` continues to work without changes throughout the codebase
  - The subscriber handles the translation transparently

  > 💡 This approach (subscriber attaches version-level values onto the entity) means most consuming code doesn't need changes. Only code that WRITES to these fields needs updating to write to `app_versions` instead. This significantly reduces blast radius compared to renaming all read sites.

  **Blast radius mitigation strategy:**
  1. Subscriber transparently loads branch-specific values onto the entity properties
  2. All READ paths continue working via `app.slug`, `app.name`, etc. — no changes needed
  3. Only WRITE paths (update slug, rename, toggle is_public, change icon) are rewritten to target `app_versions`
  4. API responses use existing field names (`slug`, `name`, `icon`, `isPublic`) — no frontend contract change for reads

  ---

  ### Frontend Changes

  **State store:**
  - Currently stores `app.slug`, `app.name`, `app.icon` from the app entity
  - Backend continues returning these fields (subscriber attaches from version) — no store change needed for reads
  - Write operations pass `branchId` as additional parameter

  **SlugInput component (`frontend/src/AppBuilder/LeftSidebar/GlobalSettings/SlugInput.jsx`):**
  - Currently calls `appsService.setSlug(appId, value)`
  - Must pass `branchId`: `appsService.setSlug(appId, value, branchId)`
  - `branchId` available from workspace branch store

  **URL handling:**
  - Editor routes: unchanged structurally (`/:workspaceId/apps/:slug/:pageHandle?`)
  - Add `?branch_id=xxx` to ALL editor/preview URLs when on non-default branch
  - Viewer preview: `/apps/:slug/:pageHandle?branch_id=xxx`
  - Released apps: `/applications/:slug/:pageHandle?` (no branch param)
  - Frontend must append `branch_id` to URL (not just header) to prevent race conditions on branch switch

  **API response shape — field naming:**
  - `versionName` → from `app_versions.name` (the version label like "v1", "v2")
  - `appName` / `name` → from `app_versions.app_name` (the display name of the app)
  - Since the subscriber attaches `app_name` as `app.name` on the entity, the API response field name stays `name` — no breaking change

  ---

  ### Module Resolution at Runtime

  When an app renders a module at runtime:
  - Module is resolved by `moduleReferenceId`
  - The resolution uses the **same `branch_id`** as the parent app's context
  - If the module doesn't have an `app_versions` row on that branch → throw error: "Module not found on branch '{branchName}'"
  - This ensures module and parent app always come from the same branch context

  ---

  ### Branch Deletion

  When a workspace branch is deleted:
  - `workspace_branch` row is removed
  - All `app_versions` rows with `branch_id = deletedBranchId` are cascade-deleted
  - Any unreleased metadata changes on that branch are permanently lost
  - This matches git semantics: deleting a branch loses unmerged work
  - The `apps` rows are NOT deleted (they may have versions on other branches or be released)

  ---

  ### Git Sync — Push

  When serializing an app for push:
  - Read `slug`, `app_name`, `icon`, `is_public` from the branch-specific `app_versions` row
  - Include in the serialized app payload
  - Push to the corresponding remote branch

  No changes to the push structure — just the data source for these fields changes.

  ---

  ### Git Sync — Pull (to Default)

  When pulling merged changes to the default branch:

  1. Parse incoming app payload (contains slug/name/icon/is_public from merged state)
  2. Find or create the `app_versions` row for the default branch
  3. Update `slug`, `app_name`, `icon`, `is_public` on the default branch version
  4. **Before committing**: run slug uniqueness validation (checkpoint 3)
  5. If app doesn't exist on default yet (created on feature branch, merged):
    - Create `apps` row (with `slug = id` since apps.slug is just a placeholder for non-workflows)
    - Create `app_versions` row on default branch with merged metadata

  > ⚠️ If slug validation fails at pull time, the entire pull operation is rejected with a descriptive error. The user must resolve the conflict on GitHub and re-pull.

  ---

  ### Import Behaviour

  **Git import (to feature branch):**
  1. Create `apps` row (if not exists, with `slug = id`)
  2. Create `app_versions` row on the feature branch with imported metadata
  3. **Also create** `app_versions` row on the default branch (for sync integrity)
  4. Default branch version gets the same metadata initially

  **JSON import (to feature branch):**
  - Same dual-creation logic as git import
  - Slug uniqueness validated per-branch at creation time

  **JSON import (to default branch):**
  - Single `app_versions` row created on default
  - Slug uniqueness validated against released apps in the org

  **JSON export:**
  - Reads metadata from `app_versions` for the active branch
  - Exported JSON contains slug/name/icon/is_public from the branch-specific version

  **Bulk import behaviour:** Follows existing transactional semantics — if the current bulk import is transactional (all-or-nothing), it stays that way. If it currently allows partial success, it stays that way. No change to bulk operation semantics in this PR.

  ---

  ### Error Handling — No Fallback Policy

  > ⚠️ When any endpoint resolves an app by slug or ID in a branch context, if no `app_version` exists for that `(appId, branchId)` combination, the system MUST throw an error. Never fall back to default branch data. Never show another branch's data.

  This applies to:
  - Editor app load
  - Preview routing
  - Any API call with branch context (header `x-branch-id` or query `?branch_id=`)
  - Module resolution within an app
  - App listing (app simply doesn't appear if no version on branch)

  Error response: `404 Not Found` with message: `"App not found on branch '{branchName}'"` or `"Module not found on branch '{branchName}'"`

  ---

  ### Module-Specific Considerations

  Modules are apps with `type = 'module'`. They follow the exact same mechanism:
  - `app_versions` holds their slug/name/icon/is_public per-branch
  - Module slug in URLs uses the same resolution path
  - Module resolution at runtime uses the parent app's `branch_id`
  - When a module is used inside an app and the app is pushed, the module is implicitly included
  - On pull to default, module metadata also propagates

  **Edge case — module created on feature branch, used in app, not explicitly committed:**
  - Current behaviour: module travels with the app push implicitly
  - New behaviour: same — module's branch-specific metadata (slug/name/icon) is serialized alongside it
  - On pull to default: module gets created on default branch if it doesn't exist there yet

  ---

  ## 🌊 User Flows

  ### Rename an app on a feature branch

  → Builder opens app editor on a feature branch
  → Builder navigates to Settings → App Name
  → Builder types new name
  → Backend receives `PATCH /apps/:appId` with `{ name: "New Name", branch_id: "feature-branch-id" }`
  → Backend finds `app_versions` row for `(appId, featureBranchId)`
  → Updates `app_name` on that row
  → On success: app displays new name in editor, other branches unaffected
  → On error:
    → Duplicate name on same branch → "An app with this name already exists on this branch"
    → Version not found → "App not found on branch 'feature-branch-name'" (404)

  ### Change app slug on a feature branch

  → Builder opens app editor on a feature branch
  → Builder navigates to Settings → Slug
  → Builder types new slug value
  → Backend receives `PATCH /apps/:appId` with `{ slug: "new-slug", branch_id: "feature-branch-id" }`
  → Backend finds `app_versions` row for `(appId, featureBranchId)`
  → Validates slug format (lowercase alphanumeric + hyphens, no leading/trailing hyphens)
  → Updates `slug` on that row (no global uniqueness check on feature branch)
  → On success: slug updated, editor URL reflects new slug
  → On error:
    → Duplicate slug on same branch → "This slug is already in use on this branch"
    → Invalid characters → "Slug can only contain lowercase letters, numbers, and hyphens"

  ### Change app slug on the default branch

  → Builder opens app editor on the default branch
  → Builder navigates to Settings → Slug
  → Builder types new slug value
  → Backend receives `PATCH /apps/:appId` with `{ slug: "new-slug", branch_id: "default-branch-id" }`
  → Backend validates: slug not already used by another released app in this org
  → Updates `slug` on the default branch `app_versions` row
  → On success: slug updated
  → On error:
    → Conflict with released app → "This slug is already in use by a released app"
    → Duplicate on same branch → "This slug is already in use on this branch"

  ### Push app changes to GitHub

  → Builder clicks "Push" on a feature branch
  → Backend serializes app state including metadata from `app_versions` (slug, app_name, icon, is_public)
  → Pushes to remote feature branch
  → On success: changes visible on GitHub in the branch
  → Default branch state: unchanged

  ### Pull merged changes to default

  → Builder merges PR on GitHub (feature → main)
  → Builder clicks "Pull" on ToolJet (default branch active)
  → Backend fetches merged state from remote
  → For each app in the payload:
    → Finds or creates `app_versions` row on default branch
    → Validates slug uniqueness against released apps in the org
    → Updates slug/app_name/icon/is_public on default branch version
  → On success: default branch reflects merged metadata
  → On error:
    → Slug conflict → "Pull blocked — slug 'my-slug' conflicts with released app 'Other App'. Resolve on GitHub and retry."

  ### Release an app

  → Admin clicks "Release" on an app version
  → Backend validates: the version's slug is globally unique among released apps in the org
  → Sets `apps.current_version_id` to this version's ID
  → On success: public URL `/applications/:slug` now serves this version
  → On error:
    → Slug conflict → "Cannot release — slug 'my-slug' conflicts with another released app"

  ### Access released app (public)

  → End user visits `/applications/:slug`
  → Backend resolves: `apps` WHERE `current_version_id` → `app_versions` WHERE `slug = :slug`
  → Checks `app_versions.is_public = true`
  → On success: renders the released app
  → On error:
    → Slug not found → 404 page
    → `is_public = false` → 403 or redirect to login

  ### Preview app on feature branch

  → Builder visits `/apps/:slug?branch_id=xxx`
  → Backend resolves: `app_versions` WHERE `slug = :slug AND branch_id = :branchId`
  → If found: renders app preview for that branch
  → If not found: returns 404 — does NOT fall back to default branch
  → Error shown: "App not found on branch 'branch-name'"

  ### Import app from git (feature branch)

  → Builder triggers git import on a feature branch
  → Backend creates `apps` row (if not exists, slug = app.id)
  → Creates `app_versions` row on the feature branch with imported metadata
  → Also creates `app_versions` row on the default branch (sync integrity)
  → Default branch version gets same initial metadata
  → On success: app visible on both branches
  → Slug uniqueness: enforced per-branch at creation time

  ### Import app from JSON (feature branch)

  → Builder imports JSON file while on a feature branch
  → Backend parses JSON, extracts app metadata
  → Creates `apps` row (if not exists, slug = app.id)
  → Creates `app_versions` row on feature branch with imported slug/name/icon/is_public
  → Also creates `app_versions` row on default branch (same as git import)
  → On success: app visible on both branches
  → On error:
    → Slug conflict on the branch → "An app with slug 'x' already exists on this branch"

  ### Load app that doesn't exist on current branch

  → Builder navigates to an app on a feature branch
  → Backend queries `app_versions` WHERE `(appId, branchId)`
  → No row found
  → Returns 404: "App not found on branch 'branch-name'"
  → Frontend shows error state — does NOT show default branch data
  → Builder must switch to a branch where the app exists

  ### Switch branches (app listing update)

  → Builder switches from Branch A to Branch B
  → Frontend updates `branch_id` in state and URL
  → App listing re-fetches with new `branchId`
  → Only apps with `app_versions` on Branch B appear
  → Some apps from Branch A may not be visible on Branch B — this is expected
  → No error — listing is simply filtered

  ### Delete a branch

  → Admin deletes a workspace branch
  → `workspace_branch` row removed
  → All `app_versions` with that `branch_id` cascade-deleted
  → Any uncommitted/unmerged metadata changes on that branch are permanently lost
  → Apps themselves (`apps` rows) are NOT deleted
  → Released apps continue serving via `current_version_id` (unaffected)

  ---

  ## Appendix: What Stays on `apps` Table

  | Column | Used by | After migration |
  |--------|---------|-----------------|
  | `slug` | Workflows only | Apps/modules: set to `app.id` (placeholder, unique constraint satisfied) |
  | `name` | Workflows only | Apps/modules: set to NULL |
  | `icon` | Workflows only | Apps/modules: set to NULL |
  | `is_public` | Workflows only | Apps/modules: set to NULL |
  | `current_version_id` | All types | Points to the released version — unchanged |
  | `organization_id` | All types | Org ownership — unchanged |
  | `type` | All types | Discriminator — unchanged |
  | `user_id` | All types | Creator — unchanged |
