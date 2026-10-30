# Query Library lifecycle UI

`LibraryVersionDropdown` keys its adapter/provider/content subtree by the real query ID. It renders the shared Modules version manager; keep forms, rows, search and confirmations in that shared implementation. `useLibraryVersionLifecycle` only normalizes library state and delegates explicit-ID actions to `queryLibrarySlice`.

Drafts and saved versions use their persisted UUIDs and names. Saving keeps the same ID and awaits the store's pending-write barrier. Multiple drafts are valid; saved snapshots and their metadata are immutable. Content locking is separate from lifecycle permissions: selecting a saved version must not disable authorized creation, promotion or release.

Environment tabs browse locally until a version is selected; opening resets browsing to the committed editor environment. Source permissions use `canUseDataSourceForQuery`; workspace environment defaults come from `app_group_permissions.environment_access`, matching the library backend guard without app-specific grants. Administrators retain workspace access. Source deletion (`dataSourceId: null`) must not block surviving draft metadata editing.

Library adapters supply real environment/license metadata and disable Git capabilities. Never initialize a fake app or call app/Git endpoints for a library action. Integration coverage lives in `__tests__/integration/LibraryVersionDropdown.spec.jsx`; shared module/library parity lives in `../Header/VersionManager/__tests__/integration/lifecycleParity.spec.jsx`.
