# Platform Git Sync: Shared App Entity Refactor

## Problem

When pulling apps from git (workspace pull or branch creation), the current code creates a **new `App` entity per branch** for each app in the repository. Each branch gets its own `app_id` even though all branches represent the same logical app (identified by `co_relation_id`).

### Why this is wrong

| Impact Area | Current Behaviour | Expected Behaviour |
|---|---|---|
| **Permissions** | Each branch app is a separate entity — no permission rows are created for stub apps | Permissions set once on the app apply to all branches |
| **App groups** | Each branch app is not in any group | App group membership works across all branches |
| **Folder associations** | Re-associated per branch on each pull | Associated once, works across branches |
| **Navigation** | `switchBranch` resolves via `co_relation_id` join — works, but navigates to a different `app_id` | Same `app_id`, just a different `AppVersion` |
| **App history** | Isolated per `app_id` | Unified across branches |

---

## Root Cause

`findOrCreateStubApp` in `pull.service.ts` (line 270) always creates a new `App` row:

```typescript
const appId = randomUUID();
const app = manager.create(App, { id: appId, ... });
await manager.save(App, app);
```

It never looks up whether an `App` with the same `co_relation_id` already exists in the org.

---

## Solution

**One `App` entity per `co_relation_id` per org. One `AppVersion` per branch.**

- Find the existing `App` by `co_relation_id + organizationId` first
- Only create a new `App` row if none exists (first time this app is ever seen in the org)
- Always create a new `AppVersion` with `branchId` set for the current branch

---

## Scope of Changes

All changes are in **one file**: `server/ee/platform-git-sync/pull.service.ts`

Three methods need updating:

### 1. `findOrCreateStubApp` (line 270)

**What changes:** Look up existing App by `co_relation_id` org-wide before creating.

```typescript
// BEFORE: always creates new App
const appId = randomUUID();
const app = manager.create(App, {
  id: appId,
  name: appName,
  organizationId,
  userId: user.id,
  co_relation_id: coRelationId,
  creationMode: 'GIT',
  isStub: true,
  isPublic: false,
  icon: 'home',
  slug: appId,
});
let savedApp = await manager.save(App, app);

// AFTER: find existing App first, only create if missing
let savedApp = await manager.findOne(App, {
  where: { co_relation_id: coRelationId, organizationId },
  order: { createdAt: 'ASC' }, // oldest = canonical
});
if (!savedApp) {
  const appId = randomUUID();
  const app = manager.create(App, {
    id: appId,
    name: appName,
    organizationId,
    userId: user.id,
    co_relation_id: coRelationId,
    creationMode: 'GIT',
    isStub: true,
    isPublic: false,
    icon: 'home',
    slug: appId,
  });
  savedApp = await manager.save(App, app);
}

// Always create a fresh AppVersion for this branch (same as before)
const version = manager.create(AppVersion, {
  name: 'v1',
  appId: savedApp.id,
  versionType: AppVersionType.BRANCH,
  branchId,
  status: AppVersionStatus.DRAFT,
  definition: {},
  globalSettings: {},
  pageSettings: {},
  showViewerNavigation: false,
  homePageId: null,
  currentEnvironmentId: null,
});
await manager.save(AppVersion, version);
```

**Why `order: { createdAt: 'ASC' }`:** If (in existing deployments) multiple App rows exist for the same `co_relation_id` across branches, pick the oldest as canonical.

---

### 2. `markAppAsStub` (line 351)

**What changes:** Delete only the current branch's `AppVersion`, not all versions of the app.

```typescript
// BEFORE: fetches and deletes ALL versions for appId (no branchId filter)
const versionIds = await manager
  .find(AppVersion, { where: { appId } })
  .then((vs) => vs.map((v) => v.id));

// deletes DataQuery, DataSource for all versionIds...

await manager.delete(AppVersion, { appId }); // ← wipes every branch

// AFTER: scope everything to this branch only
const versionIds = await manager
  .find(AppVersion, { where: { appId, branchId } })  // ← branchId filter added
  .then((vs) => vs.map((v) => v.id));

// deletes DataQuery, DataSource for branch-specific versionIds only...

await manager.delete(AppVersion, { appId, branchId }); // ← branchId filter added
```

**Also:** Remove `await manager.update(App, { id: appId }, { isStub: true })` — with a shared App, another branch may already be fully hydrated. `isStub` on the App entity should only be set to `true` on initial creation and `false` on first hydration.

---

### 3. `processAppEntry` — stale check (line 220)

**No code change needed.** The `existingVersion` query already filters by `branchId` (line 210):

```typescript
.where('av.branchId = :branchId', { branchId })
.andWhere('app.co_relation_id = :coRelationId', { coRelationId })
```

So the stale/skip logic remains correct — it checks the version on this specific branch.

---

## What Does NOT Change

| Component | Reason |
|---|---|
| `hydrateStubApp` | Creates temp app, re-parents versions to the stub app by `app_id` — works the same |
| `switchBranch` | Already resolves via `co_relation_id` join — no change needed |
| `canSkipAppPull` | Counts `DISTINCT av.app_id WHERE branchId = X` — accurate with shared App |
| Dashboard listing / `addBranchFilter` | No change — already filters by `AppVersion.branchId` |
| Permissions | No change needed — this is the fix. Shared `app_id` means existing permissions apply automatically |
| `pullDataSources` | Completely unrelated |
| Migrations | No schema changes — `App` and `AppVersion` tables are unchanged |

---

## Existing Deployment Consideration

For workspaces that already have multiple `App` rows for the same `co_relation_id` (created by the old code), the `findOrCreateStubApp` change handles this gracefully:

- `findOne` with `order: { createdAt: 'ASC' }` returns the oldest App as canonical
- New `AppVersion` rows are created under the canonical `app_id`
- Old branch-specific App rows remain but are orphaned — no new versions are added to them
- They will stop appearing in the dashboard (no `AppVersion` with matching `branchId` → filtered out by `addBranchFilter`)

No data migration is required.

---

## Testing Checklist

- [ ] Pull workspace on default branch → apps appear in dashboard
- [ ] Create new branch → pull → apps appear under new branch
- [ ] Switch branch on dashboard → same app (same `app_id`) visible on target branch
- [ ] Update app on one branch, pull again → only that branch's version updates, other branch unchanged
- [ ] Delete app from git, pull → app disappears from that branch (version deactivated), still visible on other branches
- [ ] App permissions set before branching → visible on all branches
- [ ] App group membership → works across branches
- [ ] `hydrateStubApp` → hydration works correctly with shared `app_id`
- [ ] Workspace with existing per-branch App rows (old deployment) → new pulls consolidate under canonical App
