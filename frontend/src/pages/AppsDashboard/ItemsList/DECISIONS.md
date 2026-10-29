# Dashboard apps & folders list — decisions and open questions

Figma: `Dashboards--Sep-2026` — list `1118-98555`, table constraints `1222-127102`, sort `1339-133278` (menu `1339-133358`), filter `1194-117167` (menu `1194-117247`), pagination `1437-85711`, selection bar `1174-101868` (superseded by the floating bar `3373-744`), icons `2413-2003` / `1194-116409`, folder loading `1407-52207` (first batch) / `1407-53214` (next batch).

## Decisions

### Architecture
- `@tanstack/react-table` is used in a limited role: shared column definitions, expansion via `getRowCanExpand` + a sub-component (not `getSubRows`), and stable row ids `${kind}:${id}`.
- Sorting, filtering and pagination all happen on the server.
- Sort and filters are owned by the URL (`hooks/useListQueryParams.js`); page and search are owned by the store (`store/itemsListStore.js`).
- Virtualization uses `@tanstack/react-virtual`; drag and drop uses `@dnd-kit/sortable`.
- Rows are CSS-grid `div`s with `treegrid` roles, not `<table>`, because an expanded folder needs its own nested scroll region.
- Frontend only for now: everything runs against a mock API (`services/dashboardItemsMock.js`, backed by `pages/AppsDashboard/dummyData`), switched by `USE_MOCK_DASHBOARD_API`. Responses follow the `ListResponse` contract in `pages/AppsDashboard/dummyData/types.ts`.

### Data
- Root items are folders plus stray apps (apps not in any folder).
- The app icon color is stored as a key: `purple | green | indigo | yellow | pink | blue | red` → `--list-icon-*` tokens.
- Legacy icon names map to Lucide icons in `pages/AppsDashboard/components/AppIcon.jsx` until the DB stores Lucide names.

### Pagination
- 50 items per page. The footer reads "Showing x-y of N items".
- Page items show first, last, current ± 1, and ellipses.

### Sort and filter
- Sort is a single choice from Figma's 6 options (chosen over the PRD's 4): `name_asc | name_desc | modified_desc | modified_asc | activity_desc | activity_asc`.
- The default sort is `activity_desc` ("Recent activity" = last viewed by the current user), per the PRD.
- Sorting runs in two levels: root items first, then the apps inside each folder.
- Pinned items are excluded from sorting.
- Filters follow Figma's groups:
  - release status `released | unreleased`
  - visibility `public | private`
- Within a group, options combine with OR; the groups combine with AND. Each app has exactly one value per group, so AND within a group would always match nothing.
- Nothing checked = the PRD's "All". Filters apply to both pinned and unpinned items.
- **URL state** (PRD):
  - `?sort=&release_status=&visibility=`. The default sort and empty filters are left out; unknown values are ignored; other params (e.g. `branch`) are kept.
  - The page is not in the URL.
  - Changes use `replace`, so a refresh or a shared link restores the view, but each click does not add a history entry.
- **UI:**
  - Rocket `DropdownMenu` through its `sections` wrapper, extended with section labels, radio sections, checkbox items and `keepOpen`.
  - The item itself is the `menuitemradio` / `menuitemcheckbox` control. The checkbox look is a decorative `aria-hidden` span built from `checkboxVariants`, because a real checkbox inside a menu item would add a second focus stop and toggle twice per click.
- The column header shows a direction icon plus `aria-sort` on the sorted column (Name / Last modified). "Recent activity" has no column, so it shows no icon.

### Expanding folders
- Expansion uses TanStack's controlled `expanded` state, stored in the items list store and keyed `folder:<id>`.
- The chevron is a `<button>` with `aria-expanded` and an aria-label. An expanded folder shows `ChevronDown` + `FolderOpen`.
- Each expanded folder has its own scroll area, up to **600px**, virtualized with `@tanstack/react-virtual`.
  - Apps load **20 per page**; the next page is requested when the rendered rows come within 5 of the loaded count.
  - The scroll area is focusable (`tabIndex=0`, labelled "Apps in <folder>").
- Child app rows indent their icon by 24px, in line with the parent folder's label.
- When things change:
  - **Sort:** expanded folders stay open and reload in the new order.
  - **Filter or search:** all folders collapse and the cache is cleared.
  - **Page:** the expanded set and the cache are kept.
- A folder with 0 apps still shows a chevron; expanding it shows "No apps in this folder".
- Folder app search: a folder whose own name matches the search lists all its apps; otherwise only the apps that match.

### Selection
- Only one kind is selected at a time: several folders or several apps, never a mix.
- Apps are one kind wherever they appear: a stray app and an app inside a folder can be selected together.
- Selecting a folder selects only the folder, not its apps.
- Selection is TanStack's controlled `rowSelection`, held in the store and shared by the root table and every folder table (`hooks/useSharedRowSelection.js`).
  - `enableRowSelection` disables the other kind.
  - Rows carry `aria-selected`; the treegrid is `aria-multiselectable`.
- **Checkbox column:** a 44px column in the page padding, left of the row grid, per Figma.
  - The checkbox stays hidden until hover or keyboard focus while nothing is selected. It uses opacity, not `visibility`, so it stays focusable.
  - Once anything is selected, every row shows its checkbox; the other kind's is disabled.
- The column header shows the parent checkbox only once something is selected (checked when the page is fully selected, otherwise indeterminate). A floating bar at the bottom of the list (Figma 3373-744) shows the count, Clear, Pin and Delete.
- **Select-all covers the current page only.** That means this page's root rows of the selected kind; for apps, it also includes the apps loaded so far in this page's expanded folders. Label: "All N apps on this page selected" / "N apps selected".
- No row highlight for selected rows (per Figma).
- Selection is cleared on page, sort, filter or search change. Collapsing a folder keeps its selected apps selected.
- The Delete button is UI only; wiring bulk actions is separate work.

### Layout
- **Docked Name column** (Figma 3352-14623):
  - The Name column is `minmax(328px, 1fr)`; below that width the list scrolls sideways.
  - The checkbox column and the Name block (including the ⋮ menu, which now sits beside the name) stay docked on the left; the info columns scroll under them.
  - A 10px edge shadow (`--docked-column-shadow`) shows only while the list is scrolled sideways.
  - Root rows and the header use CSS `sticky`. Sticky offsets are measured from the scroller's content edge (inside its 70px padding), so the gutter docks at `-70px` and the name at `0`.
  - Apps inside an open folder can't use `sticky`, because the folder's own scroll box would be their reference. They follow the list's horizontal scroll timeline instead (`itemsList.scss`: a scroll-driven animation from 0 to `--list-max-scroll-left`, kept current by a ResizeObserver), so they move in the same frame as sticky rows. Browsers without `animation-timeline` fall back to a `--list-scroll-left` variable written on scroll, which trails by about a frame.
  - The right 70px page gutter is a margin on the scroller, not padding: content shows through a scroller's padding while scrolled. The scrollbars therefore end at the table's right edge, not the page edge.
  - The selection checkbox column now spans the full 70px page padding, so it also hides columns that scroll under the padding.
- Info columns are a fixed 160px, truncated with a tooltip on hover.
- The Name column takes the remaining space and truncates first.

## Open questions
- [ ] **Icon colors:** blue `#86B9FB` has no Figma variable (token `--list-icon-blue` was named by us).
- [ ] **Icon colors:** there are no dark-mode values yet, so dark mode uses the light colors.
- [ ] **Icon colors:** confirm the color storage format against the backend contract.
- [ ] Do pinned items count toward the pagination total? (Decide in the pinning phase.)
- [ ] The backend needs to provide `last_viewed_at` (the current user's last view) for "Recent activity" sorting. The mock ignores sort and filters until the API supports them.
- [ ] The PRD says "Last modified" sort is builders only. It is currently visible to everyone, pending a decision on how to check the user's role.
- [ ] The sort/filter triggers show a pressed background only while the menu is open; Figma shows no indicator for applied filters or a non-default sort.
- [ ] The toolbar's third icon (`list-collapse`, likely "collapse all folders") and the List/Grid view tabs are not built yet.
- [ ] With filters active, is a folder shown only if it contains a matching app? (Current assumption.)
- [ ] Pinning and drag-and-drop behavior is unconfirmed; re-check before Phases 6–7.
- [ ] The page header and the list's column header stay fixed, only the rows scroll, and the pagination footer is pinned to the bottom (assumption — Figma doesn't show scroll behavior).
- [ ] The footer uses Figma's 80px side padding, while the list uses the page's 70px.
- [ ] Bulk actions in the selection bar (e.g. Delete) are wired separately from Phase 5.
- [ ] The empty-folder row ("No apps in this folder") and the load-error row ("Couldn't load apps. Retry") have no Figma design yet.
- [ ] When a folder's scroll area reaches its end, further scrolling continues into the main list (browser default). Should it stop at the folder instead (`overscroll-behavior: contain`)?
- [ ] Apps selected inside a folder stay selected after the folder is collapsed (they're hidden but counted). Should collapsing deselect them?
- [ ] `--controls-base-inactive` (disabled checkbox/radio background) was missing from the token files, which made Rocket's disabled `Checkbox`/`RadioGroup` invisible everywhere. It has been added; the light value is from Figma, but the dark value `rgba(133, 140, 148, 0.12)` is inferred and needs design confirmation.
- [ ] Row action menus (Figma 1194-110986 app / 1194-121374 folder) are UI only; no item has a handler yet. The folder menu's Pin/Unpin item waits for pinning (Phase 6).
- [ ] Figma labels the folder menu's first item "Rename app"; built as "Rename folder", matching the stray "Rename folder" label in the frame. Confirm with design.
- [ ] Menu item icons were matched by eye from the screenshot (`app-window`, `pencil-ruler`, `copy`, `folder-input`, `file-up`, `trash-2`); Figma's metadata doesn't expose the Lucide names.
- [ ] The `--docked-column-shadow` color `rgba(15, 23, 41, 0.12)` is a raw Figma value without a variable, and there is no dark variant.
- [ ] Tablet layout (Figma uses 24px page padding there) is not built; the checkbox column needs 70px of padding.
