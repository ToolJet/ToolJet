# Query Library lifecycle UI

`LibraryVersionDropdown` keys its adapter/provider/content subtree by the real query ID. It renders the shared Modules version manager; keep forms, rows, search and confirmations in that shared implementation. `useLibraryVersionLifecycle` only normalizes library state and delegates explicit-ID actions to `queryLibrarySlice`.

Drafts and saved versions use their persisted UUIDs and names. Saving keeps the same ID and awaits the store's pending-write barrier. Multiple drafts are valid; saved snapshots and their metadata are immutable. Content locking is separate from lifecycle permissions: selecting a saved version must not disable authorized creation, promotion or release.

Saved versions remain visible and selectable in every environment they have reached: Development includes all saved versions, Staging includes Staging/Production versions, and Production includes Production versions. Drafts appear only in Development. `isLibraryVersionInEnvironment` is shared by the picker and store selection; keep their eligibility rules identical. Committing a selection records the browsed run environment even when it previously came from a default, without rewriting the version’s furthest promoted environment.

Environment tabs browse locally until a version is selected; opening resets browsing to the committed editor environment. Source permissions use `canUseDataSourceForQuery`; workspace environment defaults come from `app_group_permissions.environment_access`, matching the library backend guard without app-specific grants. Administrators retain workspace access. Source deletion (`dataSourceId: null`) must not block surviving draft metadata editing.

Library adapters supply real environment/license metadata and disable Git capabilities. Never initialize a fake app or call app/Git endpoints for a library action. Integration coverage follows the selected edition implementation; shared module/library parity lives in `../Header/VersionManager/__tests__/integration/lifecycleParity.spec.jsx`.

## Edition and license boundary

These public component paths are facades; the editor and lifecycle adapter are selected through the QueryLibrary module registry. CE keeps inert queryLibrary state so ordinary panels can read session and selection fields safely. Pure selectors tolerate absent selection maps. Feature implementations and their tests live with the selected edition module. Shared lifecycle dialogs remain in Header/VersionManager.

The page checks the effective workspace entitlement before beginning an editor session or requesting library content. Missing/false access, loading, failure and stale workspace responses grant no access. Consumers, discovery controls and local execution react to the current effective flag.
