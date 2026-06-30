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

  // ---- misc ----
  addNewRowButton: (name = "table1") =>
    `[data-cy="${normalize(name)}-add-new-row-button"]`,

  fxButton: (action) =>
    `[data-cy="${String(action).toLowerCase().replace(/\s+/g, "-")}-fx-button"] > svg`,
  toggleButton: (action) =>
    `[data-cy="${String(action).toLowerCase().replace(/\s+/g, "-")}-toggle-button"]`,
};
