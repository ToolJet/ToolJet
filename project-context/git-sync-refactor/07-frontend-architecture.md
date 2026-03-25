# Part 7: Frontend Architecture

## Overview

The git sync frontend has two separate UI surfaces:
1. **Workspace Settings** — Admin configures org-level git provider (SSH/HTTPS/GitLab)
2. **App Builder** — Developer pushes/pulls individual apps via GitSyncModal

No branching UI exists on this branch (`feature/git-sync-phase-2.1`).

## File Map

### API Client
| File | Lines | Purpose |
|------|-------|---------|
| `frontend/src/_services/git_sync.service.js` | 224 | All git sync API calls (both `/git-sync` and `/app-git`) |

**17 exported functions** covering both modules. Has a comment at line 224: *"Remove all app-git api's to separate service from here."*

Key functions:
- `getGitStatus(orgId)` → `GET /git-sync/:id/status`
- `create(orgId, gitUrl, gitType)` → `POST /git-sync?gitType=...`
- `getGitConfig(orgId, gitType?)` → `GET /git-sync/:id`
- `updateConfig(id, body, gitType?)` → `PUT /git-sync/:id?gitType=...`
- `updateStatus(id, isEnabled, gitType)` → `PUT /git-sync/status/:id`
- `deleteConfig(id, gitType)` → `DELETE /git-sync/:id?gitType=...`
- `setFinalizeConfig(id, body)` → `PUT /git-sync/finalize/:id`
- `saveProviderConfigs(body)` → `POST /git-sync/configs`
- `checkSyncApp(workspaceId, versionId)` → `GET /app-git/:workspaceId/app/:versionId`
- `gitPush(appGitId, versionId, body)` → `POST /app-git/gitpush/:appGitId/:versionId`
- `gitPull()` → `GET /app-git/gitpull`
- `gitPullApp(appId)` → `GET /app-git/gitpull/app/:appId`
- `importGitApp(body)` → `POST /app-git/gitpull/app`
- `pullGitAppChanges(appId, body)` → `POST /app-git/gitpull/app/:appId`
- `renameAppOrVersion(appId, body)` → `PUT /app-git/app/:appId/rename`
- `updateAppGitConfigs(appId, body)` → `PUT /app-git/:appId/configs`
- `getAppGitConfigs(workspaceId, versionId)` → `GET /app-git/:workspaceId/app/:versionId/configs`

### State Management (Zustand)
| File | Lines | Purpose |
|------|-------|---------|
| `frontend/src/AppBuilder/_stores/slices/gitSyncSlice.js` | 49 | App builder git sync state |

**State:**
```
showGitSyncModal: false
allowEditing: true
appLoading: false
orgGit: {}
appGit: {}
isGitSyncConfigured: false
```

**Actions:**
- `toggleGitSyncModal(bool)` — Show/hide the modal
- `fetchAppGit(workspaceId, versionId)` — Calls `checkSyncApp`, sets `appGit` + `orgGit`
- `setAppGit(appGit)` — Direct state setter

**Note:** Has `console.log('app git', appGit)` left in code.

### App Builder Components

| File | Lines | Purpose |
|------|-------|---------|
| `frontend/ee/modules/Appbuilder/components/GitSyncManager/GitSyncManager.jsx` | 58 | Header button (GitBranch icon) |
| `frontend/ee/modules/Appbuilder/components/GitSyncManager/GitSyncModal.jsx` | 795 | Main push/pull modal |

#### GitSyncManager (Button)
- Renders in app builder header bar
- Shows GitBranch icon
- Enabled when: `featureAccess.gitSync && selectedEnvironment.priority === 1 && (creationMode === 'GIT' || !isEditorFreezed) && !isVersionLocked`
- On click: calls `fetchAppGit()` then `toggleGitSyncModal(true)`

#### GitSyncModal (Main Modal)
**4 modal modes** determined by app state:

| Mode | Condition | Purpose |
|------|-----------|---------|
| `CONFIG` | No `appGit.lastPushDate` and `allowEditing` | First-time setup — name app/version |
| `COMMIT` | Has `lastPushDate` and `allowEditing` | Push changes to git |
| `PULL` | Has `lastPushDate` and NOT `allowEditing` | Pull-only mode |
| `PUSHPULL` | Has `lastPushDate` and `allowEditing` and NOT `isAutoCommit` | Full push+pull mode |

**Auto-commit flow:**
- `commitEnabled` flag triggers auto-commit on app/version creation events
- Listens for `app-rename-commit` and `version-rename-commit` events
- On these events, automatically pushes to git

**Key UI features:**
- Commit message input (user-entered)
- Last commit info display (message, user, date)
- Git app name / version name fields (CONFIG mode)
- Pull button with version compatibility check
- Push button with loading state

**Issues identified:**
- Massive JSX duplication between PULL and PUSHPULL modes
- Comment at line 794: *"Review and Refactor this component to make it more readable and maintainable"*
- 795 lines in a single component

### Workspace Settings Components

| File | Lines | Purpose |
|------|-------|---------|
| `ConfigureGitSync.jsx` | 229 | Main settings page |
| `RepositoryConnections.jsx` | 334 | Provider card list + toggle |
| `BaseProviderModal.jsx` | 63 | Provider modal router |
| `GitSSHModal.jsx` | 737 | SSH configuration modal |
| `GithubHTTPSModal.jsx` | 706 | GitHub HTTPS configuration modal |
| `GitLabModal.jsx` | 618 | GitLab configuration modal |

#### ConfigureGitSync (Page)
- **Class component** (not functional — legacy pattern)
- Split layout: left = auto-commit toggle, right = RepositoryConnections
- Fetches config on mount via `getGitConfig(workspaceId)`
- Auto-commit toggle disabled until a provider is configured
- License check: hides feature if basic/trial plan

#### RepositoryConnections (Provider List)
- **Class component** (legacy)
- Renders 3 provider cards: Git SSH Protocol, GitHub, GitLab
- Only ONE provider can be active at a time
- Click on card → opens BaseProviderModal
- Toggle switch → enable/disable provider (calls `updateStatus` API)
- Disable current provider before enabling another

#### BaseProviderModal (Router)
- Simple switch: `provider` prop → renders `GitSSHModal` | `GithubHTTPSModal` | `GitLabModal`

#### GitSSHModal (SSH Config)
- **Two-step flow:**
  1. Enter git URL → "Generate SSH key" button → calls `POST /git-sync` → displays public key
  2. User copies key to GitHub as deploy key → enters branch → "Save Changes" → calls `POST /git-sync/configs`
- Key type toggle: ED25519 (default) / RSA
- Shows public key with copy-to-clipboard
- "Open Git Repository" link (converts SSH URL to HTTPS)
- Enable/disable toggle (only after finalization)
- Delete configuration button

**State:** 25+ individual `useState` hooks (excessive, should be consolidated)

#### GithubHTTPSModal (GitHub App Config)
- **One-step flow:** Fill all fields → "Save Changes" → calls `POST /git-sync/configs`
- 3 form sections:
  - **REPOSITORY:** Repo URL + Branch name
  - **SELF HOSTED GITHUB:** Enterprise URL + Enterprise API URL (optional)
  - **APP ACCESS:** GitHub App ID + Installation ID + Private key
- Field validation with error messages
- Private key visibility toggle (eye icon)
- Masked private key display after finalization

#### GitLabModal (GitLab Config)
- **One-step flow:** Same as HTTPS
- 3 form sections:
  - **REPOSITORY:** Repo URL + Branch name
  - **SELF HOSTED GITLAB:** Enterprise URL (optional)
  - **PROJECT ACCESS:** Project ID + Project Access Token
- Nearly identical structure to GithubHTTPSModal (massive duplication)
- Has `console.log('configs', gitlab_configs)` left in code

## Component Tree

```
Workspace Settings:
  ConfigureGitSync (class component)
    ├── Auto-commit toggle
    └── RepositoryConnections (class component)
        ├── Provider Card: Git SSH Protocol
        ├── Provider Card: GitHub
        ├── Provider Card: GitLab
        └── BaseProviderModal (functional)
            ├── GitSSHModal
            ├── GithubHTTPSModal
            └── GitLabModal

App Builder:
  GitSyncManager (functional)
    └── GitSyncModal (functional, 795 lines)
        ├── CONFIG mode (first-time setup)
        ├── COMMIT mode (push only)
        ├── PULL mode (pull only)
        └── PUSHPULL mode (both)
```

## Frontend Issues for Refactoring

### Critical
1. **GitSyncModal is 795 lines** — needs decomposition into sub-components per mode
2. **GithubHTTPSModal and GitLabModal are 90% identical** — should share a base component
3. **All 3 provider modals duplicate**: state management, validation, finalize/delete/toggle flows

### Code Quality
4. **ConfigureGitSync and RepositoryConnections are class components** — should be functional with hooks
5. **25+ individual useState hooks per modal** — should use `useReducer` or a form library
6. **Mixed API patterns** — some use `.then()/.catch()`, others could use async/await
7. **Console.logs left in code** — `gitSyncSlice.js` and `GitLabModal.jsx`
8. **API service combines both modules** — comment says to split but hasn't been done
9. **No error boundary** — git operations can fail in many ways
10. **Inline styles everywhere** — should use CSS classes

### Architecture
11. **No shared form/validation framework** — each modal reimplements validation
12. **No shared provider modal base** — `BaseProviderModal` is just a router, not a shared form
13. **State not centralized** — workspace settings uses component state, app builder uses Zustand
14. **License check duplicated** — each modal independently calls `licenseService.getFeatureAccess()`
15. **Fields locked after finalization** — to edit, user must delete config and recreate (no edit mode)
