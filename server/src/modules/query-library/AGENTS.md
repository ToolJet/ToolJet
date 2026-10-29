# Query Library

Workspace-owned query identities live in `LibraryQuery`; editable snapshots live in
`LibraryQueryDraft`, and immutable saved snapshots live in `LibraryQueryVersion`.
`LibraryQueryState` stores only the released saved-version pointer.

- `LibraryDraftService.createInitialDraft` requires the caller's transaction manager,
  locks the parent query, and allocates the initial named `v1` draft once.
- `QueryLibraryService.create` creates query identity, initial draft, and release state
  in one transaction. Its result includes `draftId`; the create response maps identity
  fields and that explicit UUID through `LibraryQueryCreatedResponseDto`.
- `getDraft(queryId, draftId, manager)` always scopes lookup to the parent query and
  excludes soft-deleted drafts.
- Draft and saved names are required, case-sensitive, and at most 25 characters;
  descriptions are at most 500 characters. Deleted names can be reused.
- Every lifecycle mutation must lock the parent before cross-table name checks and
  writes. Per-table partial indexes protect live names inside each table.
- Saving retains the draft UUID in the saved row and soft-deletes the draft in the
  same transaction. Readers resolve a live saved row first.
- Fresh schema lives in `1792500000000-CreateLibraryQueryVersions.ts` and
  `1792600000000-AddLibraryQueryLifecycle.ts`; there is no legacy conversion path.

Storage tests: `test/modules/query-library/unit/library-query-schema.spec.ts` and
`ee/test/modules/query-library/e2e/library-drafts-storage.spec.ts`.

## Named lifecycle API

- `LibraryLifecycleService` owns explicit draft reads, creation from a saved version,
  metadata/options PATCH, source changes, UUID-preserving save, and deletion.
- `/queries/:id/drafts/:draftId` identifies an editable snapshot. Saved rows are
  immutable; these routes never resolve a saved UUID back to its deleted draft.
- `GET versions` returns `drafts[]` and `versions[]`, using persisted names.
  Save accepts unchanged content under a unique name and may retain its own name.
- `PATCH /queries/:id` changes identity/folder only; content/source writes require
  a draft UUID. The old single-draft save/discard routes have been removed.
- Each lifecycle mutation holds the parent query lock through name checks,
  snapshot/state writes, and edition-specific audit persistence. Audit failure rolls back
  the mutation; the audit service keeps its licensed file sink. No deferred audit
  locals are set, avoiding duplicate entries.
- The last live draft/saved version, a Released saved version, and any consumer
  pin cannot be deleted. Allocation numbers still include deleted saved rows.
- Standalone runs accept exactly one `draftId` or saved `libraryVersionId`;
  draft runs are Development-only and authorize that draft's actual source.

Lifecycle verification: `ee/test/modules/query-library/e2e/library-lifecycle.spec.ts`;
metadata/run validation: `test/modules/query-library/unit/library-version-validation.spec.ts`.

- Consumer runtime resolves the required `libraryQueryVersionId` UUID from saved
  storage first, then drafts scoped to its workspace-authorized query. There is no
  selected-draft fallback. Saving keeps a consumer's UUID and freezes its snapshot.
- Catalog returns `drafts[]` with UUIDs and persisted names, plus named saved
  versions; it exposes input definitions only, never snapshot options.
- Consumer release/promote gates use stored status and version IDs. A saved
  version named `draft` remains a saved version.

## Dependency deletion locks

`locking.ts` is the shared protocol: `lockLibraryQuery` scopes by workspace before usage lookup; `lockLibraryPins` locks distinct parent IDs in sorted order and resolves each exact live draft/saved UUID. Callers keep the same transaction manager through persistence. Draft/version/whole-query deletion holds that parent lock through the authoritative usage check and deletion. `LibraryQueryInUseException` exposes its code both on the exception and body because the HTTP filter reads the former. In-use responses carry `code: LIBRARY_QUERY_IN_USE`; released/sole-version errors remain separate. See lifecycle e2e tests for both real transaction orderings and draft pins.

Recursive import uses `withLibraryImportLocks` before any child import. It walks the entire bundle, matches existing bundled identities and retained local pins, then locks that relevant union in sorted order. Nested imports reuse the manager's plan. Newly inserted parents register as transaction-private; discovering any other existing parent aborts with 409 and a user-retry message (no automatic retry), so partial child writes roll back. Keep this prepass when Task 8 replaces snapshot formats.
