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
