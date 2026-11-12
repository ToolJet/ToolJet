# ManageOrgConstantsSettings module

The Workspace Constants page (route `/workspace-constants`): lists, creates, edits, pins and deletes Workspace Constants and Workspace Secrets across the workspace's Environments. It talks to the v2 API (`/api/v2/organization-constants`); the backend contract is in `server/src/modules/organization-constants/AGENTS.md`. Code says `organization` for Workspace.

## Domain terms

- **Constant Type**: `Global` or `Secret` (a tab). A Global and a Secret can share a name.
- **Constant Source**: `workspace` (database row) or `env` (server environment variable, read-only). Shown as Workspace and `.env`. Not an Environment (dev/staging/prod).
- **Pinned Constant**: a row held at the top of its tab; kept in the store only. The pin button after the name pins and unpins; the row menu holds only Delete.

## Key files

| File | Role |
|---|---|
| `ManageOrgConstantsSettings.jsx` | The page. Wires the URL hook, the store, environments, the modal and the delete flow. Mounted by `frontend/src/WorkspaceConstants/index.jsx`. |
| `hooks/useConstantsListQueryParams.ts` | Environment, tab, sort and source in the URL, seeded from `sessionStorage` on mount. |
| `store/constantsListStore.ts` | Zustand store: page, search, rows, selection, pins, and the list, create, update and delete calls. |
| `components/` | Table, controls (filter, sort), footer, selection bar, row menu, delete dialog, empty state, pin reorder. |
| `frontend/src/_ui/Header/HeaderEnvironmentSelect.tsx` | The environment select: a pill in the header right of the search. The page fills it through `useHeaderEnvironmentSelect` (`_hooks/`, store `_stores/headerEnvironmentStore.ts`) and it is removed when the page unmounts. |
| `components/ConstantModal/` | Create and edit modal. `useConstantForm.ts` holds the form rules. |
| `helpers/` | `pinOrder.ts` (pin slots), `pageWindow.ts`, `constants.ts` (masks, tooltip text), `errors.ts`, `constantType.ts`, `constantReference.ts`, `highlightMatch.ts`. |
| `frontend/src/_services/organization_constants_v2.service.ts` | v2 requests; types in `_services/types/organizationConstantsV2.types.ts`. |

## Invariants

- The URL is the source of truth for environment, tab, sort and source. On a plain visit the view saved in `sessionStorage` (per workspace) is copied into the URL once; after that only the URL is read. Page and search live in the store.
- The page reads the store only; it does not call the list service itself. `fetchList` aborts the previous request, so a stale response never overwrites a newer one.
- Pins live in memory (`pins` in the store) and reset on reload. They cover the loaded page only, and reordering is off while a search or a source filter is active.
- A Secret's value is never in the client. The list and detail APIs return `null` for it; the table shows a fixed mask and the edit field shows the mask as a placeholder, so the only Secret text the client holds is what the user types.
- The list is paged by the server (50 per page). `.env` rows are read-only: no edit, and they are never sent to bulk delete (they can still be selected to pin).
- Creating a constant opens the modal on the open tab's type and, once saved, switches to the tab of the type created.
- Without the multi-environment license the page passes `multiEnvironment={false}` to the modal: create and edit take one value, which the server writes to every environment. Environment switching is hidden then too.
- Every workspace constant is listed in every Environment. One with no value in the viewed Environment has `has_value: false` and shows "No value in <environment>" in place of the mask and the eye; Edit still works.

## Gotchas

- The redesigned header is on only for `/workspace-constants`, through `NEW_HEADER_PATHS` in `frontend/src/_ui/Layout/LayoutRouteWrapper.tsx` (matched on the end of the path). Other pages keep the old header.
- The page height is `100vh` minus the header (`3rem`) and `--dynamic-margin-2` (the banner height set in `App.jsx`). A different header height needs a change in both the header and this calc.
- Search text comes from the header search store (`useHeaderSearchConfig`); the page clears it on unmount.
- A Rocket primitive imported from a `.ts` or `.tsx` file needs a `.d.ts` next to its `.jsx` (see `components/ui/Rocket/Button/Button.d.ts`). Some primitives have none yet.
- The glossary terms above are in `UBIQUITOUS_LANGUAGE.md`.

## Related modules

- `frontend/src/_ui/Header` and `frontend/src/_ui/Layout`: the new header and the page shell.
- `frontend/src/modules/common/components/BaseManageOrgConstants`: older constants components; separate from this module.
