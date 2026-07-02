# Table & Listview Widget Reference

> Internal reference for the Table (`NewTable/`) and Listview (`Listview/`) widgets in `frontend/src/AppBuilder/`.

---

## Table of Contents

- [Table Widget](#table-widget)
  - [Architecture](#table-architecture)
  - [Rendering Pipeline](#table-rendering-pipeline)
  - [Properties](#table-properties)
  - [Styles](#table-styles)
  - [Exposed Variables](#table-exposed-variables)
  - [Events](#table-events)
  - [Column Configuration](#table-column-configuration)
  - [Virtualizer](#table-virtualizer)
  - [Dynamic Height](#table-dynamic-height)
  - [Pagination / Sorting / Filtering](#table-pagination-sorting-filtering)
  - [State Management](#table-state-management)
  - [Custom Hooks](#table-custom-hooks)
  - [Edge Cases & Special Conditions](#table-edge-cases)
- [Listview Widget](#listview-widget)
  - [Architecture](#listview-architecture)
  - [Rendering Pipeline](#listview-rendering-pipeline)
  - [Properties](#listview-properties)
  - [Exposed Variables](#listview-exposed-variables)
  - [Events](#listview-events)
  - [Dynamic Height](#listview-dynamic-height)
  - [Row Rendering & SubcontainerContext](#listview-row-rendering)
  - [temporaryLayouts Key Structure](#listview-temporarylayouts)
  - [gridSlice Integration](#listview-gridslice-integration)
  - [State Management](#listview-state-management)
  - [Custom Hooks](#listview-custom-hooks)
  - [Edge Cases & Special Conditions](#listview-edge-cases)

---

# Table Widget

**Entry point:** `frontend/src/AppBuilder/Widgets/NewTable/Table.jsx`

## Table Architecture

```
NewTable/
├── Table.jsx                          # Root memo-wrapped component; lifecycle, dynamic height, dark mode
├── TableContainer/
│   └── TableContainer.jsx             # Orchestrates Header + TableData + Footer + TableExposedVariables
├── TableData/
│   ├── TableData.jsx                  # Virtual-scroll row renderer; row click/selection/hover
│   └── _components/
│       ├── TableRow.jsx               # Individual row; cell rendering, hover events
│       ├── TableHeader.jsx            # Column headers; sort icons, DnD reordering
│       ├── EmptyState.jsx
│       └── LoadingState.jsx
├── TableExposedVariables/
│   └── TableExposedVariables.jsx      # Side-effect only (returns null); manages all exposed vars + event firing
├── Header/
│   ├── Header.jsx                     # Search bar + filter button
│   └── _components/
│       ├── SearchBar.jsx
│       └── Filter/
│           ├── Filter.jsx
│           ├── FilterRow.jsx
│           ├── FilterFooter.jsx
│           ├── FilterHeader.jsx
│           ├── filterUtils.js         # Filter operation logic
│           └── filterConstants.js
├── Footer/
│   ├── Footer.jsx
│   └── _components/
│       ├── Pagination/                # Virtualized page picker
│       ├── AddNewRow.jsx
│       ├── ChangeSetUI.jsx            # Changeset count + save/discard
│       ├── ControlButtons.jsx
│       ├── RowCount.jsx
│       └── LoadingFooter.jsx
├── _components/
│   ├── ActionButtons/ActionButtons.jsx
│   ├── DataTypes/adapters/            # 17+ column type adapters (see Column Configuration)
│   ├── IndeterminateCheckbox/
│   └── HighLightSearch/
├── _stores/
│   ├── tableStore.js                  # Zustand store combining initSlice + columnSlice
│   └── slices/
│       ├── initSlice.js               # Component init, properties, styles, actions, events
│       └── columnSlice.js             # Column config and auto-generation logic
├── _utils/
│   ├── buildTableColumn.js            # Assembles [select] + [left actions] + [data cols] + [right actions]
│   ├── generateColumnsData.js         # Per-column definitions with cell renderers (~400+ lines)
│   ├── generateActionColumns.js       # Action button column definitions
│   ├── autoGenerateColumns.js         # Auto-generate from first data row
│   ├── transformTableData.js          # {{cellValue}} replacement across data
│   ├── helper.js                      # getMaxHeight and misc utils
│   ├── normalizeButtonEvent.js        # Maps user-facing event labels to internal IDs
│   └── exportData.js                  # CSV / XLSX / PDF export
└── _hooks/
    ├── useTable.js                    # TanStack React Table setup (sorting, filter, pagination, resizing)
    ├── useTableProperties.js          # Memoized property defaults
    └── useTableStyles.js              # Memoized style defaults
```

---

## Table Rendering Pipeline

```
Table.jsx
  │
  ├─ initializeComponent(id) on mount / removeComponent(id) on unmount
  ├─ setTableProperties, setTableStyles, setTableActions, setTableEvents via useEffects
  ├─ Auto-generate columns if useDynamicColumn or firstRow changed
  │    └─ setColumnDetails → generateColumns → store updated with column configs
  ├─ transformTableData: applies column {{cellValue}} transformations to data
  ├─ buildTableColumn: [select checkbox] + [left actions] + [data columns] + [right actions]
  │
  └─ TableContainer
       ├─ useTable hook → useReactTable (TanStack v8)
       │    state: sorting, pagination, filtering, columnVisibility, columnResizing
       │
       ├─ TableExposedVariables (side-effect, no DOM output)
       │    └─ setExposedVariables: selectedRow(s), pageIndex, sortApplied, filteredData, etc.
       │    └─ fireEvent: onRowClicked, onSort, onSearch, onFilterChanged, onPageChanged, etc.
       │
       ├─ Header
       │    ├─ SearchBar → globalFilter state
       │    └─ Filter panel → columnFilters state
       │
       ├─ TableData
       │    ├─ useVirtualizer → absolute-positioned rows in <tbody>
       │    └─ virtualRows.map → <TableRow> per visible row
       │
       └─ Footer
            ├─ Pagination UI
            ├─ AddNewRow modal
            ├─ RowCount
            └─ ChangeSetUI (save / discard)
```

---

## Table Properties

All received via `properties` prop and stored through `setTableProperties(id, properties)`.

| Property | Type | Default | Description |
|---|---|---|---|
| `data` | Array | `[]` | Raw data source |
| `dataSourceSelector` | string | `'rawJson'` | `'rawJson'` or dynamic datasource expression |
| `columns` | Array | `[]` | User-defined column configurations |
| `useDynamicColumn` | boolean | `false` | Enable auto-generated columns |
| `columnData` | Array | `[]` | Column source for dynamic columns |
| `autogenerateColumns` | boolean | `false` | Auto-generate from first data row |
| `columnDeletionHistory` | Array | `[]` | Tracks deleted columns to prevent re-generation |
| `actions` | Array | `[]` | Action button configs |
| `visibility` | boolean | `true` | Show/hide component |
| `disabledState` | boolean | `false` | Disable interaction |
| `displaySearchBox` | boolean | `true` | Show search input |
| `showFilterButton` | boolean | `true` | Show filter button |
| `showAddNewRowButton` | boolean | `true` | Show add-new-row button |
| `showDownloadButton` | boolean | `true` | Show download button |
| `showBulkUpdateActions` | boolean | `true` | Show save/discard buttons |
| `hideColumnSelectorButton` | boolean | `false` | Hide column visibility toggle |
| `showBulkSelector` | boolean | `false` | Enable multi-row checkbox selection |
| `highlightSelectedRow` | boolean | `false` | Highlight clicked row |
| `allowSelection` | boolean | computed | `showBulkSelector \|\| highlightSelectedRow` |
| `selectRowOnCellEdit` | boolean | `false` | Auto-select row when editing a cell |
| `defaultSelectedRow` | object | `{}` | `{key: value}` to pre-select on load |
| `enablePagination` | boolean | `false` | Enable pagination |
| `serverSidePagination` | boolean | `false` | Pagination handled by server |
| `rowsPerPage` | number | `10` | Rows per page |
| `totalRecords` | number | — | Total records for server-side pagination |
| `enablePrevButton` | boolean | `true` | Enable previous page button |
| `enableNextButton` | boolean | `true` | Enable next page button |
| `enabledSort` | boolean | `true` | Enable column sorting |
| `serverSideSort` | boolean | `false` | Sort handled by server (manualSorting) |
| `serverSideFilter` | boolean | `false` | Filter handled by server (manualFiltering) |
| `serverSideSearch` | boolean | `false` | Search handled by server |
| `columnSizes` | object | `{}` | `{columnId: width}` persisted column widths |
| `dynamicHeight` | boolean | `false` | Auto-adjust component height in view mode |
| `loadingState` | boolean | `false` | Show skeleton loaders |

---

## Table Styles

Stored via `setTableStyles(id, styles, darkMode)`.

| Style | Default | Description |
|---|---|---|
| `borderRadius` | `0` | Container border radius |
| `boxShadow` | — | Box shadow |
| `borderColor` | `'var(--borders-weak-disabled)'` | Table border color |
| `containerBackgroundColor` | `'#fff'` | Background color |
| `tableType` / `rowStyle` | — | `'table-bordered'`, `'table-striped'`, etc. |
| `cellSize` / `cellHeight` | `45px` | `'condensed'` (39px) or normal (45px) |
| `maxRowHeight` / `isMaxRowHeightAuto` | `'auto'` | `'auto'` or `'fixed'` |
| `maxRowHeightValue` | `80` | Pixel value when maxRowHeight is fixed |
| `contentWrap` | `true` | Enable text wrapping in cells |
| `columnHeaderWrap` | — | Fixed or wrapping column headers |
| `headerCasing` | — | `'uppercase'`, `'lowercase'`, etc. |
| `columnTitleColor` | `'#6A727C'` | Column header text color |
| `columnBackgroundColor` | `'#F6F8FA'` | Column header background color |
| `textColor` | — | Global cell text color; overridden by darkMode if `'#000'` |
| `actionButtonRadius` | — | Border radius for action buttons |

---

## Table Exposed Variables

### Reactive State (via `setExposedVariables` in `TableExposedVariables.jsx`)

| Variable | Type | Description |
|---|---|---|
| `currentData` | Array | Raw table data |
| `changeSet` | Object | `{rowIndex: {field: newValue}}` — edited fields |
| `dataUpdates` | Object | `{rowIndex: fullRowObject}` — edited rows |
| `updatedData` | Array | Original data with edits merged in |
| `newRows` | Array | Rows added via "Add New Row" |
| `selectedRows` | Array | Selected row objects (when `showBulkSelector`) |
| `selectedRowsId` | Array | Indices of selected rows |
| `selectedRow` | Object | Single clicked/selected row |
| `selectedRowId` | number | Index of single selected row |
| `selectedCell` | Object | `{columnName, columnKey, value}` of clicked cell |
| `pageIndex` | number | Current page (1-indexed) |
| `sortApplied` | Array | `[{column, columnKey, direction}]` or `[]` |
| `filteredData` | Array | Rows after search + filter |
| `currentPageData` | Array | Rows on current page after pagination |
| `searchText` | string | Current global search query |
| `filters` | Array | Applied filter values |

### Component State (via single `setExposedVariable` in `Table.jsx`)

| Variable | Description |
|---|---|
| `isLoading` | Loading state |
| `isVisible` | Visibility state |
| `isDisabled` | Disabled state |

### Control Surface Actions (CSA)

| Method | Description |
|---|---|
| `selectAllRows()` | Toggle select all on current page |
| `deselectAllRows()` | Toggle deselect all |
| `setPage(pageIndex)` | Jump to page (1-indexed) |
| `selectRow(key, value)` | Select row by field match |
| `deselectRow(key, value)` | Deselect row by field match |
| `selectRows(key, values)` | Select multiple rows by field matches |
| `deselectRows(key, values)` | Deselect multiple rows |
| `setFilters(filters)` | Apply filters `[{column, condition, value}]` |
| `clearFilters()` | Remove all filters |
| `discardChanges()` / `resetChanges()` | Clear edited rows + changeSet |
| `downloadTableData(format)` | Export to `'csv'` \| `'xlsx'` \| `'pdf'` |
| `setLoading(boolean)` | Set loading state |
| `setVisibility(boolean)` | Set visibility |
| `setDisable(boolean)` | Set disabled state |

---

## Table Events

| Event | Trigger |
|---|---|
| `onRowClicked` | Row clicked |
| `onRowHovered` | Mouse enters row (only fired if `hasHoveredEvent` is true) |
| `onCellValueChanged` | Any cell edited |
| `onSort` | Sort state changes |
| `onSearch` | Search text changes |
| `onFilterChanged` | Filters added, removed, or value changed |
| `onPageChanged` | Page changed via UI (not via `setPage` CSA) |
| `onTableActionButtonClicked` | Action button clicked in a cell |
| `onCancelChanges` | `resetChanges()` or discard button triggered |
| `onTableDataDownload` | Download button clicked |

**Performance note:** `hasHoveredEvent` and `hasDownloadEvent` flags in the store prevent firing events when no handler is attached.

---

## Table Column Configuration

### Column Definition Structure

Each column compiled in `generateColumnsData.js`:

```js
{
  id: string,                    // UUID
  accessorKey: string,           // column.key || column.name
  header: string,                // Resolved display name
  enableSorting: true,
  enableResizing: true,
  enableHiding: true,
  size: number,                  // From columnSizes or defaultColumn.width (150px)
  minSize: 60,
  meta: {
    columnType: string,          // See types below
    isEditable: boolean,
    textColor: string,
    cellBackgroundColor: string, // Resolved per-cell (supports {{rowData.field}})
    horizontalAlignment: 'left' | 'center' | 'right',
    transformation: string,      // {{cellValue}} formula
    validation: object,
    columnVisibility: boolean,
    // ...all other column properties
  },
  cell: function,                // Renders based on columnType
}
```

### Column Types & Adapters

| Type | Notes |
|---|---|
| `string` | Text editing, validation, search highlight |
| `text` | Multi-line text |
| `number` | Numeric validation, formatting |
| `boolean` | Toggle switch |
| `datepicker` | Date input with validation |
| `link` | Clickable link |
| `image` | Image display |
| `json` | JSON viewer |
| `markdown` | Markdown renderer |
| `html` | Raw HTML renderer |
| `button` | Single button in cell |
| `button-group` | Multiple buttons with visibility/state control |
| `badge` | Colored badge |
| `select` / `newMultiSelect` | Dropdown selection |
| `tags` | Tag display |
| `radio` | *(deprecated)* |
| `toggle` | *(deprecated)* |
| `dropdown` | Legacy dropdown |
| `multiselect` | Legacy multiselect |
| `rating` | Star rating |

### Column Resizing
- `columnResizeMode: 'onChange'` (live resize)
- Widths persisted to store via debounced `setComponentProperty` — saved in `properties.columnSizes`

### Column Ordering
- Drag-and-drop via `@dnd-kit` in `TableHeader.jsx`
- `DndContext` + `horizontalListSortingStrategy`
- Calls `setColumnOrder(newOrder)` on drag complete

---

## Table Virtualizer

**Library:** `@tanstack/react-virtual` — `useVirtualizer`

```js
// TableData.jsx
const rowVirtualizer = useVirtualizer({
  count: table.getRowModel().rows.length,
  getScrollElement: () => tableBodyRef.current,
  estimateSize: () => (cellHeight === 'condensed' ? 40 : 46),
  overscan: 5,
  scrollMargin: 0,
});
```

- Rows rendered as `position: absolute; top: virtualRow.start` inside `<tbody>`
- `<tbody>` height = `rowVirtualizer.getTotalSize()`
- `measureElement` callback present for dynamic row heights (not used in current base implementation)
- Pagination page list also uses a separate virtualizer for large page counts

---

## Table Dynamic Height

**Location:** `Table.jsx` lines ~89, 124, 238–260

```js
const isDynamicHeightEnabled = properties.dynamicHeight && currentMode === 'view';

// Observe actual DOM height of tableBodyRef
const heightChangeValue = useHeightObserver(tableBodyRef, isDynamicHeightEnabled);

useDynamicHeight({
  isDynamicHeightEnabled,
  id,
  height,
  value: JSON.stringify({ heightChangeValue, tableData }), // triggers on data OR DOM change
  skipAdjustment: isLoading || (tableData.length === 0 && !hasVisibilityChanged),
  adjustComponentPositions,
  currentLayout,
  width,
  visibility,
  subContainerIndex,
  componentType,
});
```

- Only active in `'view'` mode
- `skipAdjustment` prevents flicker on empty tables or during loading
- View mode applies `minHeight: ${height}px` + `height: 100%` to the table wrapper
- `subContainerIndex` is passed through for when Table is nested inside a Listview or other container

---

## Table Pagination, Sorting, Filtering

### Pagination

```js
// useTable.js
const [pagination, setPagination] = useState({
  pageIndex: 0,
  pageSize: enablePagination ? rowsPerPage : data.length,
});
// manualPagination: serverSidePagination
```

- Client-side: TanStack slices rows automatically
- Server-side: `manualPagination: true`, UI exposes `pageIndex`, `enablePrevButton`/`enableNextButton` controls visibility

### Sorting

- `enableSorting` per column via `meta`
- `manualSorting: serverSideSort`
- Fires `onSort` event + updates `sortApplied` exposed variable
- Sort icons: `IconSortAscending` / `IconSortDescending` (tabler-icons)

### Filtering

**Global filter (search box):**
```js
globalFilterFn: (row, columnId, filterValue) =>
  String(row.getValue(columnId) || '').toLowerCase()
    .includes(String(filterValue).toLowerCase())
```

**Column filters:**
```js
filterFns: {
  applyFilters: (row, columnId) => applyFilters(row, columnId, columnFilters)
}
```

**Supported filter operations** (`filterUtils.js`):
`contains`, `doesNotContains`, `matches` (regex), `nl` (not matches), `equals`, `ne`, `isEmpty`, `isNotEmpty`, `gt`, `lt`, `gte`, `lte`

---

## Table State Management

**Store:** `useTableStore` — Zustand + Immer, per-component state keyed by `id`.

### Store Structure per Component

```js
components[id] = {
  properties: { visibility, disabledState, displaySearchBox, ... },
  styles: { borderRadius, cellHeight, maxRowHeightValue, ... },
  loadingState: boolean,
  addNewRow: Map<index, rowObject>,
  shouldPersistAddNewRow: boolean,
  editedRowDetails: {
    editedRows: Map<index, rowObject>,
    editedFields: Map<index, { field: value }>,
  },
  events: {
    hasHoveredEvent: boolean,
    hasDownloadEvent: boolean,
    tableComponentEvents: Array,
    tableColumnEvents: Array,
    tableActionEvents: Array,
  },
  columnDetails: {
    columnProperties: Array,
    useDynamicColumn: boolean,
    columnData: Array,
    transformations: Array<{ key, transformation }>,
  },
}
```

### Key Actions

**initSlice:** `initializeComponent`, `removeComponent`, `setTableProperties`, `setTableStyles`, `setTableActions`, `setTableEvents`, `updateEditedRowsAndFields`, `clearEditedRows`, `updateAddNewRowDetails`, `clearAddNewRowDetails`

**columnSlice:** `setColumnDetails`, `generateColumns`, `generateColumnTransformations`

**Key Selectors:** `getTableProperties`, `getTableStyles`, `getColumnProperties`, `getColumnTransformations`, `getActions`, `getEditedRowFromIndex`, `getAllEditedRows`, `getAllAddNewRowDetails`, `getHasHoveredEvent`

---

## Table Custom Hooks

| Hook | Source | Purpose |
|---|---|---|
| `useTable` | `_hooks/useTable.js` | Full TanStack React Table setup |
| `useTableProperties` | `_hooks/useTableProperties.js` | Memoized property defaults |
| `useTableStyles` | `_hooks/useTableStyles.js` | Memoized style defaults |
| `useDynamicHeight` | `@/_hooks/useDynamicHeight` | Trigger layout adjustment on height change |
| `useHeightObserver` | `@/_hooks/useHeightObserver` | Observe DOM element height via ResizeObserver |
| `useBatchedUpdateEffectArray` | `@/_hooks/useBatchedUpdateEffectArray` | Batch multiple effect triggers |
| `useVirtualizer` | `@tanstack/react-virtual` | Virtual scroll for rows and page list |
| `useReactTable` | `@tanstack/react-table` | Table state management |
| `useSortable` / `useSensor` | `@dnd-kit/*` | Column header drag-and-drop |

---

## Table Edge Cases

- **Data change resets:** `editedRows`, `changeSet`, and row selection are cleared when `data` prop changes. `defaultSelectedRow` is re-applied.
- **Empty table:** Dynamic height skips adjustment when `data.length === 0 && !hasVisibilityChanged` to prevent flicker.
- **Nested data:** Column keys support dot notation (`'user.name'`). `transformTableData` and `autoGenerateColumns` handle one level of nesting. `utilityForNestedNewRow` reconstructs nested objects on add-new-row.
- **Server-side:** When `serverSidePagination` is true, `pageIndex` persists across data refreshes; sort/filter reset.
- **`allowSelection` edge case:** When `allowSelection=false`, clicking a row still fires `onRowClicked` with the row as payload.
- **Selection column visibility:** Hidden if `!allowSelection` or when `allowSelection && !highlightSelectedRow && showBulkSelector` to avoid double-selection UI.
- **Button column width:** Calculated via canvas text measurement in `calculateButtonColumnWidth`; accounts for padding, borders, icons, minimum 90px.
- **Add New Row persistence:** Controlled by `shouldPersistAddNewRow` flag — rows survive data refreshes when true.
- **Subcontainer index:** Passed through to `useDynamicHeight` for correct layout scoping when Table is nested inside a ListView row or other container.

---
---

# Listview Widget

**Entry point:** `frontend/src/AppBuilder/Widgets/Listview/Listview.jsx`

## Listview Architecture

```
Listview/
├── Listview.jsx               # Main component; data, pagination, row orchestration
├── ListviewSubcontainer.jsx   # Per-row wrapper; dynamic height, SubcontainerContext
├── index.js                   # Re-exports Listview as default
└── listview.scss              # Hides overflow on sub-canvas within .list-items in viewer mode
```

**Related config files:**
- `frontend/src/AppBuilder/WidgetManager/widgets/listview.js` — Widget property/event/style definitions + defaults

---

## Listview Rendering Pipeline

```
Listview.jsx
  │
  ├─ Resolve data source (rawJson or expression)
  ├─ Paginate: data.slice(startIndex, endIndex) if enablePagination
  ├─ Update customResolvables on filteredData change:
  │    └─ updateCustomResolvables(id, [{listItem: row}, ...], 'listItem', moduleId, parentIndices)
  │    └─ initExposedValueArrayForChildren(id, rowCount, moduleId, parentIndices)
  │
  ├─ filteredData.map(row, index) →
  │    └─ <ListviewSubcontainer>
  │         ├─ Extend SubcontainerContext: [...parentPath, { containerId: id, index }]
  │         ├─ Read temporaryLayouts[`${id}-${index}`] for row height override
  │         ├─ useDynamicHeight (triggers adjustComponentPositions via rAF)
  │         └─ <SubContainer index={index} id={id} canvasHeight={rowHeight} ...>
  │              └─ Renders all child widgets for this row
  │                 (row 0 = editable template; rows 1+ = read-only mirrors)
  │
  └─ <Pagination> if enablePagination
```

---

## Listview Properties

| Property | Type | Default | Description |
|---|---|---|---|
| `dataSourceSelector` | dropdown | `'rawJson'` | `'rawJson'` or dynamic expression |
| `data` | code | `[{text: 'Sample text 1'}]` | Array of objects (raw JSON source) |
| `mode` | select | `'list'` | `'list'` or `'grid'` |
| `columns` | number | `3` | Grid columns count (grid mode only) |
| `rowHeight` | code | `100` | Row height in pixels |
| `showBorder` | code | `true` | Bottom border between rows (list mode only) |
| `enablePagination` | toggle | `false` | Enable pagination |
| `rowsPerPage` | code | `10` | Rows per page |
| `dynamicHeight` | toggle | `false` | Enable per-row dynamic height (view mode only) |
| `visibility` | — | `true` | Show/hide component |
| `disabledState` | — | `false` | Disable interaction |
| `borderRadius` | — | `6` | Border radius |
| `backgroundColor` | — | `'var(--cc-surface1-surface)'` | Background color |
| `borderColor` | — | `'var(--cc-weak-border)'` | Border color |

---

## Listview Exposed Variables

### Widget-Level (set on row click via `setExposedVariables`)

| Variable | Description |
|---|---|
| `selectedRecordId` | Row index of the clicked row |
| `selectedRecord` | Full data object of the clicked row |
| `selectedRowId` | Alias for `selectedRecordId` (legacy) |
| `selectedRow` | Alias for `selectedRecord` (legacy) |

**Reading selected row data (Listview.jsx:95–106):**
```js
// Reads imperatively from store to avoid stale closure
const state = useStore.getState();
const lvExposed = state.resolvedStore.modules[moduleId]?.exposedValues?.components?.[id];
// For nested: navigate parentIndices through lvExposed.children[index]
selectedRow = lvExposed?.children?.[index];
```

### Per-Row Child Variables (derived, not set directly)

Child components inside a Listview row store their exposed values as arrays:
- `components[childId] = [row0Values, row1Values, ...]`
- Written via `setExposedValuePerRow` / `setExposedValuesPerRow`
- Initialized to `[{}, {}, ...]` via `initExposedValueArrayForChildren`

### Derived in Store

| Variable | Description |
|---|---|
| `children[rowIndex]` | Object mapping child component names → their row-specific values |
| `data[rowIndex]` | Cloned row data (function objects removed) |

---

## Listview Events

| Event | Display Name | Notes |
|---|---|---|
| `onRecordClicked` | Record clicked | Primary event |
| `onRowClicked` | Row clicked | Deprecated alias |

Both fired together on row click. Click uses `onClickCapture` (capture phase) to ensure it fires even through nested component clicks.

**Event context:** Events have access to `listItem` via `customResolvables[rowIndex]`, so handlers can reference `{{listItem.fieldName}}`.

---

## Listview Dynamic Height

### Enable Condition

```js
// Listview.jsx:65
const isDynamicHeightEnabled = dynamicHeight && currentMode === 'view';
```

Only active in view mode.

### Container Height Behaviour

```js
// Listview.jsx:71-72
style={{
  minHeight: isDynamicHeightEnabled ? `${height}px` : undefined,
  height: isDynamicHeightEnabled ? '100%' : (enablePagination ? height - 54 : height),
}}
```

### Per-Row Height Resolution (ListviewSubcontainer.jsx)

```js
const temporaryLayout = useStore(state => state.temporaryLayouts?.[`${id}-${index}`], shallow);
const transformedRowHeight = isDynamicHeightEnabled
  ? temporaryLayout?.height ?? rowHeight
  : rowHeight;
```

Row height is overridden by `temporaryLayouts[listviewId-rowIndex].height` when available.

### useDynamicHeight Call (ListviewSubcontainer.jsx:37–48)

```js
useDynamicHeight({
  isDynamicHeightEnabled,
  id,                        // Listview ID (not the row's ID)
  value: data,               // Re-triggers on data array change
  adjustComponentPositions,
  currentLayout,
  visibility,
  isContainer: true,
  subContainerIndex: index,  // Row index
  height: parentHeight,      // Listview widget height from layouts
  componentType: 'Listview',
});
```

### adjustComponentPositions Behavior for Listview

Called as `adjustComponentPositions(listviewId, layout, isContainer=true, rowIndex)`:

1. **Line 156–159 (gridSlice):** For Listview with subContainerIndex, sets initial `containerHeight = rowHeight` (from properties), not from DOM.
2. **Line 206–209:** DOM selector uses `.ele-${listviewId}` without `[subcontainer-id]` — special case because `componentType === 'Listview'`.
3. **Line 315–316:** Applies `extraHeight -= 40` for Listview rows.
4. **Content height calculation:** Merges `currentPageComponents[childId].layouts` with `temporaryLayouts[childId-rowIndex]` overrides, computes `max(top + height)` across all children.
5. **`containerHeight = Math.max(contentHeight, rowHeight)`** — rows never shrink below their static `rowHeight`.
6. **Sibling adjustment:** Adjusts positions of other row-level siblings (same parent) that are below the changed component.
7. **Bubble up:** Calls `adjustComponentPositions(listviewId, layout, true, null)` to recalculate the full listview widget height, then continues upward.

---

## Listview Row Rendering

### SubcontainerContext

Each `ListviewSubcontainer` extends the context path:

```js
const contextValue = useMemo(
  () => ({ contextPath: [...parentContext.contextPath, { containerId: id, index }] }),
  [parentContext.contextPath, id, index]
);
```

This chain is used throughout the widget tree to determine per-row scope for resolved values and event context. `parentIndices` in `Listview.jsx` is derived from `contextPath.map(s => s.index)`.

### Read-Only Mirrors (Critical)

```js
// Container.jsx:80-82
const isContainerReadOnly = useMemo(() => {
  return (index !== 0 && (componentType === 'Listview' || componentType === 'Kanban'))
    || currentMode === 'view';
}, [index, componentType, currentMode]);
```

- **Row 0 only** is editable in the designer (acts as the row template).
- **Rows 1+** are always read-only in the designer — cannot be selected, dragged, or resized.
- In view mode, all rows are read-only (interaction via events only).

### Grid Mode Width Calculation

```js
// Container.jsx:118-119
if (componentType === 'Listview' && listViewMode === 'grid')
  return canvasWidth / columns - 2;
```

Each grid cell = `(parentWidth / columns) - 2px`.

---

## Listview temporaryLayouts

### Key Format

```
${listviewId}-${rowIndex}
```

Examples:
- `listview1-0`, `listview1-1`, `listview1-2` for rows 0, 1, 2
- For nested Listview (inner ID `lv2`, row 1): key = `lv2-1`

### What Gets Stored

```js
temporaryLayouts = {
  'listview1-0': { height: 120, top: 0, left: 0, width: 24 },  // row 0 height override
  'listview1-1': { height: 150, top: 0, left: 0, width: 24 },  // row 1 height override
  // child component overrides within row 0:
  'accordionId-0': { height: 50, top: 0 },
  // ...
}
```

**Note on `top` in row entries:** When `adjustComponentPositions(listviewId, ..., rowIndex)` runs, `changedComponent` is the listview widget on the page canvas. Its page-level `top`/`left`/`width` end up in the row's `temporaryLayouts` entry as base values — but `ListviewSubcontainer` only reads `.height`, so the extra fields are benign noise.

### Child Widget Keys

Child widgets inside a Listview row also get suffixed keys:
- `${childId}-${rowIndex}` — e.g., `accordionId-0`, `textInputId-1`
- These are used for sibling repositioning within the row

---

## Listview gridSlice Integration

### Full Height Update Flow

```
Child inside row changes height (e.g., Accordion collapses)
  │
  ├─ useDynamicHeight fires (via React effect + rAF)
  │
  ▼
adjustComponentPositions(childId, layout, isContainer=true, rowIndex)
  ├─ Calculates new child height
  ├─ setTemporaryLayouts({ 'childId-rowIndex': { height: newHeight, ... } })
  ├─ Adjusts siblings in same row (same parent = listviewId, below old bottom)
  └─ Bubbles up ↓

adjustComponentPositions(listviewId, layout, isContainer=true, rowIndex)
  ├─ containerHeight = rowHeight (from properties)
  ├─ Calculates contentHeight from children:
  │    componentLayouts merged with temporaryLayouts[childId-rowIndex]
  │    contentHeight = max(child.top + child.height) + extraHeight
  ├─ containerHeight = Math.max(contentHeight, rowHeight)
  ├─ setTemporaryLayouts({ 'listviewId-rowIndex': { height: containerHeight, ... } })
  └─ Bubbles up ↓

adjustComponentPositions(listviewId, layout, isContainer=true, null)
  ├─ No subContainerIndex → skips child height calc for pure Listview
  ├─ newHeight = componentElement.offsetHeight (actual DOM height)
  ├─ setTemporaryLayouts({ 'listviewId': { height: domHeight, ... } })
  ├─ Adjusts page-level siblings of the Listview
  └─ Bubbles to Listview's parent container (if any)
```

### Height Merging for Container Content Calculation

```js
// gridSlice.js:243-251
const componentLayouts = getContainerChildrenMapping(componentId)
  .reduce((acc, id) => ({ ...acc, [id]: currentPageComponents[id].layouts[currentLayout] }), {});

const filteredTemporaryLayouts = Object.keys(componentLayouts).reduce((acc, id) => {
  const transformedId = doesSubContainerIndexExist ? `${id}-${subContainerIndex}` : id;
  return { ...acc, ...(temporaryLayouts[transformedId] && { [id]: temporaryLayouts[transformedId] }) };
}, {});

const mergedLayouts = { ...componentLayouts, ...filteredTemporaryLayouts };
// Then: contentHeight = max(layout.top + layout.height) across mergedLayouts
```

---

## Listview State Management

| Slice | Key Functions Used |
|---|---|
| `resolvedSlice` | `updateCustomResolvables`, `initExposedValueArrayForChildren`, `setExposedValue`, `setExposedVariables`, `updateDependencyValues` |
| `listViewComponentSlice` | `setExposedValuePerRow`, `setExposedValuesPerRow`, `prepareRowScope`, `updateRowScope`, `deriveListviewExposedData`, `_deriveListviewChain` |
| `gridSlice` | `setTemporaryLayouts`, `adjustComponentPositions`, `deleteContainerTemporaryLayouts` |
| `componentsSlice` | `getContainerChildrenMapping`, `checkIfParentIsListviewOrKanban` |

---

## Listview Custom Hooks

| Hook | Purpose |
|---|---|
| `useDynamicHeight` | Per-row height adjustment via `adjustComponentPositions` |
| `useSubcontainerContext` | Read parent `contextPath` to build extended context |
| `useModuleContext` | Get `moduleId` for scoped store operations |
| `useStore` | Zustand state access (`temporaryLayouts`, `containerChildrenMapping`, etc.) |
| `useMemo` | Memoize `parentIndices`, `contextValue`, `computeCanvasBackgroundColor` |
| `useCallback` | Memoize `onRecordOrRowClicked` |
| `useRef` | `prevFilteredDataRef`, `prevChildComponentCount`, `prevParentIndicesRef`, `parentRef` |

---

## Listview Edge Cases

- **Data type guard:** Non-array data silently becomes `[]` (Listview.jsx:131–135) — prevents runtime errors.
- **Columns minimum:** `columns < 1` clamped to `1` (Listview.jsx:119–123).
- **Row 0 only editable:** Rows 1+ are read-only mirrors of the template defined in row 0. This is enforced in `Container.jsx` via `isContainerReadOnly`.
- **No practical nesting limit in code:** Each nested Listview adds a level to `contextPath` / `parentIndices`. Practical performance limit ~3–4 levels.
- **Custom resolvables diff check:** Uses `deep-object-diff` to compare `filteredData` before updating resolvables — avoids unnecessary store writes on every render.
- **Pagination positioning:** Class `pagination-margin-bottom-last-child` applied to prevent the last row from being hidden behind the pagination bar.
- **Dynamic height off → container is fixed height:** `height: enablePagination ? height - 54 : height` (subtracts 54px for the pagination bar).
- **`adjustComponentPositions` `oldHeight` bug (line 374 in gridSlice):** `oldHeight` is read from `temporaryLayouts[componentId]` (no suffix) while `updatedLayouts` uses `temporaryLayouts[transformedComponentId]` (with suffix). This mismatch means `dynamicHeightDifference` can be wrong for the early-return check, but the actual sibling repositioning uses `oldChangedCompBottom` (lines 406–408) which correctly reads from `transformedComponentId` — so the visual bug manifests only in edge cases where the early-return fires incorrectly.
- **Accordion inside Listview:** When an Accordion collapses inside a Listview row, the full chain `adjustComponentPositions(accordionId, ..., rowIndex)` → `adjustComponentPositions(listviewId, ..., rowIndex)` → `adjustComponentPositions(listviewId, ..., null)` fires. Each call updates the appropriate `temporaryLayouts` key. Known issue: after multiple row accordion collapses, extra space can appear above accordion headers in subsequent rows — root cause is in how `temporaryLayouts` keys with suffix interact with sibling repositioning across different row indices in `adjustComponentPositions`.
