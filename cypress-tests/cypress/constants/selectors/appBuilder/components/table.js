// NewTable (frontend/src/AppBuilder/Widgets/NewTable) data-cy schema.
// The widget migrated Table -> NewTable; the entire data-cy schema changed and is
// keyed by widget name + column HEADER (not numeric column index). All values below
// were verified against frontend source AND captured at runtime (DIAG dump).
//   - search input  : `<name>-search-input-field`          (SearchBar.jsx:38)
//   - row           : `<name>-row-<i>`                      (TableRow.jsx:60)
//   - cell          : `<name>-<columnHeader>-row-<i>`       (TableRow.jsx:103)  NO more `-cell-`
//   - header        : `<columnName>-column-header`          (TableHeader.jsx:150)
// Header/cell tokens are normalised via generateCypressDataCy(): lowercased,
// non-alphanumeric runs collapsed to `-` (cypressHelpers.js).
const normalize = (text) =>
  String(text)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

export const tableSelector = {
  // ---- search (verified runtime: table1-search-input-field) ----
  searchInputField: (name = "table1") =>
    `[data-cy="${normalize(name)}-search-input-field"]`,
  searchClearIcon: (name = "table1") =>
    `[data-cy="${normalize(name)}-search-clear-icon"]`,

  // ---- rows & cells (verified runtime: table1-row-0, table1-id-row-0) ----
  row: (rowIndex, name = "table1") =>
    `[data-cy="${normalize(name)}-row-${rowIndex}"]`,
  // cell keyed by column header (the migrated schema). e.g. cell("id", 0) -> table1-id-row-0
  cell: (columnHeader, rowIndex, name = "table1") =>
    `[data-cy="${normalize(name)}-${normalize(columnHeader)}-row-${rowIndex}"]`,
  // any cell of a given column across all rows (no row index)
  columnCells: (columnHeader, name = "table1") =>
    `[data-cy^="${normalize(name)}-${normalize(columnHeader)}-row-"]`,

  // ---- header (verified runtime: id-column-header) ----
  columnHeader: (column) => `[data-cy="${normalize(column)}-column-header"]`,
  draggableHandleColumn: (column) =>
    `[data-cy="draggable-handle-column-${column}"]`,

  // ---- footer / pagination (verified runtime) ----
  // page-index-details is GONE; pagination is now a section with prev / go-to-page / next.
  paginationSection: '[data-cy="pagination-section"]',
  paginationButtonToPrevious: '[data-cy="pagination-button-to-previous"]',
  paginationButtonToNext: '[data-cy="pagination-button-to-next"]',
  paginationButtonGoToPage: '[data-cy="pagination-button-go-to-page"]',

  labelNumberOfRecords: '[data-cy="footer-number-of-records"]',

  // ---- download (verified runtime: table1-file-download-button) ----
  buttonDownloadDropdown: (name = "table1") =>
    `[data-cy="${normalize(name)}-file-download-button"]`,
  optionDownloadCSV: '[data-cy="option-download-CSV"]',
  optionDownloadExcel: '[data-cy="option-download-execel"]',
  optionDownloadPdf: '[data-cy="option-download-pdf"]',

  // ---- column manager ----
  selectColumnDropdown: '[data-cy="select-column-icon"]',
  selectAllOption: '[data-cy="options-select-all-coloumn"]',
  selectColumnOption: (column) => `[data-cy="options-coloumn-${column}"]`,
  selectColumnCheckbox: (column) => `[data-cy="checkbox-coloumn-${column}"]`,

  // ---- filter panel (verified runtime: table1-filter-panel etc.) ----
  filterButton: (name = "table1") =>
    `[data-cy="${normalize(name)}-filter-button"]`,
  filterPanel: (name = "table1") => `[data-cy="${normalize(name)}-filter-panel"]`,
  headerFilters: '[data-cy="filter-header"]',
  labelNoFilters: '[data-cy="no-filters-yet-label"]',
  buttonAddFilter: '[data-cy="button-add-filter"]',
  buttonClearFilter: '[data-cy="button-clear-filters"]',
  buttonCloseFilters: '[data-cy="close-filters-button"]',

  // Filter row schema verified vs FilterRow.jsx:31-77 (NewTable):
  //   column dropdown : select-column-dropdown-<i>   (was select-coloumn-dropdown-)
  //   operation       : select-operation-dropdown-<i>
  //   value input     : filter-value-input-<i>        (was data-filtervalue-input-)
  //   close button    : close-filter-button-<i>       (was button-close-filter-)
  //   labels          : filter-column-label / filter-and-label (was label-filter-column)
  labelColumn: '[data-cy="filter-column-label"]:eq(0)',
  labelDynamicColumn: '[data-cy="label-use-dynamic-column"]',
  dynamicColumnInputField: '[data-cy="use-dynamic-column-input-field"]',

  filterSelectColumn: (index) => `[data-cy="select-column-dropdown-${index}"]`,
  filterSelectOperation: (index) =>
    `[data-cy="select-operation-dropdown-${index}"]`,
  filterInput: (index) => `[data-cy="filter-value-input-${index}"]`,
  filterClose: (index) => `[data-cy="close-filter-button-${index}"]`,

  labelAnd: (index = 0) => `[data-cy="filter-and-label"]:eq(${index})`,

  // ---- inline editing (column-editable toggles) ----
  // ProgramaticallyHandleProperties feeds paramLabel={paramMeta.displayName} to the
  // toggle, whose data-cy = displayName lowercased, spaces->'-', + '-toggle-button'
  // (CodeBuilder/Elements/Toggle.jsx). Verified in frontend source:
  //   - per column   : "Make editable"            -> make-editable-toggle-button
  //                     (Table/ColumnManager/PropertiesTabElements.jsx:389)
  //   - all columns  : "Make all columns editable"-> make-all-columns-editable-toggle-button
  //                     (Inspector/Components/Table/Table.jsx:606-617)
  makeEditableToggle: '[data-cy="make-editable-toggle-button"]',
  makeAllColumnsEditableToggle:
    '[data-cy="make-all-columns-editable-toggle-button"]',
  // Column list item in the inspector's column manager (opens the column popover).
  // Keyed by column KEY, not the display header (Support/utils/table.js already uses
  // `column-<name>` in deleteAndVerifyColumn).
  columnItem: (columnKey) => `[data-cy="column-${normalize(columnKey)}"]`,

  // ---- change bar (renders in footer when there are pending inline edits) ----
  // ChangeSetUI.jsx:17,35 — text spans only render when table width > 650.
  saveChangesButton: '[data-cy="table-button-save-changes"]',
  discardChangesButton: '[data-cy="table-button-discard-changes"]',

  // ---- add-new-row modal (AddNewRow.jsx) ----
  addNewRowSaveButton: '[data-cy="save-button"]',
  addNewRowDiscardButton: '[data-cy="discard-button"]',
  addAnotherRowButton: '[data-cy="add-another-row-button"]',
  addNewRowsHeader: '[data-cy="add-new-rows-header"]',

  // ---- selection (Chunk 3) ----
  // The selector column is `id: 'selection'` with a FUNCTION header, so TableRow falls
  // back to `cell.column.id` for the cell data-cy -> `<name>-selection-row-<i>`
  // (buildTableColumn.js:62, TableRow.jsx:103-105). The checkbox itself is a plain
  // `checkbox-input` (IndeterminateCheckbox.jsx:19) — NOT unique on its own, so always
  // scope it to a row (or to thead for the bulk select-all).
  rowCheckbox: (rowIndex, name = "table1") =>
    `[data-cy="${normalize(name)}-selection-row-${rowIndex}"] [data-cy="checkbox-input"]`,
  // Bulk select-all lives in the header row and only renders when showBulkSelector is
  // on (buildTableColumn.js:74-83).
  selectAllRowsCheckbox: 'thead [data-cy="checkbox-input"]',
  anyRowCheckbox: '[data-cy="checkbox-input"]',

  // ---- sort (Chunk 3) ----
  // The sort arrow only renders once a column IS sorted (TableHeader.jsx:165-179), so
  // its existence is the assertion that a sort was applied, and asc/desc distinguishes
  // the first click from the second.
  sortIconAscending: (column) =>
    `[data-cy="${normalize(column)}-sort-icon-ascending"]`,
  sortIconDescending: (column) =>
    `[data-cy="${normalize(column)}-sort-icon-descending"]`,

  // ---- pagination (Chunk 3) ----
  // Verified vs Pagination.jsx dataCy props (:122,170,180,189,203,213,223).
  paginationButtonToFirst: '[data-cy="pagination-button-to-first"]',
  paginationButtonToLast: '[data-cy="pagination-button-to-last"]',
  // Page buttons inside the go-to-page popover are 1-based.
  pageOptionButton: (pageNumber) =>
    `[data-cy="page-${pageNumber}-button-option"]`,

  // ---- misc ----
  addNewRowButton: (name = "table1") =>
    `[data-cy="${normalize(name)}-add-new-row-button"]`,

  fxButton: (action) =>
    `[data-cy="${String(action).toLowerCase().replace(/\s+/g, "-")}-fx-button"] > svg`,
  toggleButton: (action) =>
    `[data-cy="${String(action).toLowerCase().replace(/\s+/g, "-")}-toggle-button"]`,
};
