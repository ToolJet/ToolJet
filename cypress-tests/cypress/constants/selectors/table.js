export const tableSelector = {
  searchInputField: '[data-cy="search-input-field"]',
  column: (index) => {
    return `[data-cy*="-cell-${index}"]`;
  },
  pageIndexDetails: '[data-cy="page-index-details"]',

  paginationButtonToFirst: '[data-cy="pagination-button-to-first"]',
  paginationButtonToPrevious: '[data-cy="pagination-button-to-previous"]',
  paginationButtonToNext: '[data-cy="pagination-button-to-next"]',
  paginationButtonToLast: '[data-cy="pagination-button-to-last"]',

  labelNumberOfRecords: '[data-cy="footer-number-of-records"]',

  buttonDownloadDropdown: '[data-tooltip-id="tooltip-for-download"]',
  optionDownloadCSV: '[data-cy="option-download-CSV"]',
  optionDownloadExcel: '[data-cy="option-download-execel"]',
  optionDownloadPdf: '[data-cy="option-download-pdf"]',

  selectColumnDropdown: '[data-cy="select-column-icon"]',
  selectAllOption: '[data-cy="options-select-all-coloumn"]',

  selectColumnOption: (column) => {
    return `[data-cy="options-coloumn-${column}"]`;
  },
  selectColumnCheckbox: (column) => {
    return `[data-cy="checkbox-coloumn-${column}"]`;
  },

  columnHeader: (column) => {
    return `[data-cy="column-header-${column}"]`;
  },

  draggableHandleColumn: (column) => {
    return `[data-cy="draggable-handle-column-${column}"]`;
  },
  filterButton: '[data-tooltip-id="tooltip-for-filter-data"]',
  headerFilters: '[data-cy="header-filters"]',
  labelNoFilters: '[data-cy="label-no-filters"]',
  buttonAddFilter: '[data-cy="button-add-filter"]',
  buttonClearFilter: '[data-cy="button-clear-filters"]',
  buttonCloseFilters: '[data-cy="button-close-filters"]',

  labelColumn: '[data-cy="label-filter-column"]:eq(0)',
  labelDynamicColumn: '[data-cy="label-use-dynamic-column"]',
  dynamicColumnInputField: '[data-cy="use-dynamic-column-input-field"]',

  fxButton: (action) => {
    return `[data-cy="${String(action)
      .toLowerCase()
      .replace(/\s+/g, "-")}-fx-button"]`;
  },

  toggleButton: (action) => {
    return `[data-cy="${String(action)
      .toLowerCase()
      .replace(/\s+/g, "-")}-toggle-button"]`;
  },

  labelAnd: (index = 1) => {
    return `[data-cy="label-filter-column"]:eq(${index})`;
  },

  filterSelectColumn: (index) => {
    return `[data-cy="select-coloumn-dropdown-${index}"]`;
  },

  filterSelectOperation: (index) => {
    return `[data-cy="select-operation-dropdown-${index}"]`;
  },
  filterInput: (index) => {
    return `[data-cy="data-filtervalue-input-${index}"]`;
  },
  filterClose: (index) => {
    return `[data-cy="button-close-filter-${index}"]`;
  },

  addNewRowTooltip: '[data-tooltip-id="tooltip-for-add-new-row"]',
};
