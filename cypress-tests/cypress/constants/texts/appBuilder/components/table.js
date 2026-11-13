export const tableText = {
  defaultWidgetName: "table1",
  tableDocumentationLink: "Table documentation",
  // NewTable default sample dataset (verified at runtime, DIAG dump). The widget now
  // ships a 10-row demo dataset with columns id/photo/name/email/date/interest/phone.
  // (Legacy 4-row Sarah/Lisa/Sam/Jon data is GONE.)
  defaultInput: [
    { id: 1, name: "Olivia Nguyen", email: "olivia.nguyen@example.com" },
    { id: 2, name: "Liam Patel", email: "liam.patel@example.com" },
    { id: 3, name: "Sophia Reyes", email: "sophia.reyes@example.com" },
    { id: 4, name: "Jacob Hernandez", email: "jacob.hernandez@example.com" },
    { id: 5, name: "William Sanchez", email: "william.sanchez@example.com" },
    { id: 6, name: "Ethan Morales", email: "ethan.morales@example.com" },
    { id: 7, name: "Mia Tiana", email: "mia.tiana@example.com" },
    { id: 8, name: "Lucas Ramirez", email: "lucas.ramirez@example.com" },
    { id: 9, name: "Alexander Vela", email: "alexander.vela@example.com" },
    { id: 10, name: "Michael Reyes", email: "michael.reyes@example.com" },
  ],

  // Custom dataset some tests load explicitly via the Table data input field.
  customInput: [
    { id: 1, name: "Sarah", email: "sarah@example.com" },
    { id: 2, name: "Lisa", email: "lisa@example.com" },
    { id: 3, name: "Sam", email: "sam@example.com" },
    { id: 4, name: "Jon", email: "jon@example.com" },
  ],

  placeHolderSearch: "Search",
  defaultNumberOfRecords: "10 Records",

  optionDownloadCSV: "Download as CSV",
  optionDownloadExcel: "Download as Excel",

  oprionSelectAll: "Select All",

  headerFilters: "Filters",
  labelNoFilters: "no filters yet.",
  buttonLabelAddFilter: "+ add filter",
  buttonLabelClearFilters: "clear filters",
  labelColumn: "column",
  labelAnd: "and",
  id: "id",
  email: "email",
  name: "name",
  optionEquals: "equals",

  // ---- event trigger display names (WidgetManager/widgets/table.js:348-363) ----
  // These are the LABELS the add-event-handler popover lists; selectEvent matches them
  // case-insensitively against `event-trigger-option-*`.
  eventRowClicked: "Row clicked",
  eventRowHovered: "Row hovered",
  eventPageChanged: "Page changed",
  eventSearch: "Search",
  eventSortApplied: "Sort applied",
  eventFilterChanged: "Filter changed",
  eventCellValueChanged: "Cell value changed",
  eventAddNewRows: "Add new rows",
  eventSaveChanges: "Save changes",
  eventCancelChanges: "Cancel changes",

  // ---- per-event toast messages used by the interactions chunk ----
  // IMPORTANT: alphanumerics, spaces, `.`, `_` and `-` ONLY. These strings are typed
  // into the Show Alert message CodeHinter through `clearAndTypeOnCodeMirror`
  // (commands/commands.js), which tokenizes the value with
  //   /(\{|\}|\(|\)|\[|\]|,|:|;|=>|\*|"[^"]*"|'[^']*'|[a-zA-Z0-9._-]+|\s+)/g
  // and KEEPS ONLY MATCHED SUBSTRINGS — any character absent from every alternative is
  // silently dropped before it is ever typed. A trailing `!` therefore never reaches
  // the field, the alert fires with the punctuation-stripped text, and the toast
  // assertion fails on a message that looks correct in the spec. Do not add `!`, `?`
  // or other punctuation to these constants.
  toastRowClicked: "row clicked",
  toastPageChanged: "page changed",
  toastSearch: "search fired",
  toastSortApplied: "sort applied",
  toastFilterChanged: "filter changed",
  toastCellValueChanged: "cell value changed",
  toastNewRowsAdded: "new rows added",

  // ---- CSA display names (WidgetManager/widgets/table.js:545-660) ----
  // Passed to selectCSA(); param labels are passed to wireTableCSA as { label }.
  csaSetPage: "Set page",
  csaSelectRow: "Select row",
  csaDeselectRow: "Deselect row",
  csaSelectRows: "Select rows",
  csaDeselectRows: "Deselect rows",
  csaSelectAllRows: "Select all rows",
  csaDeselectAllRows: "Deselect all rows",
  csaSetSort: "Set sort",
  csaSetFilters: "Set filters",
  csaClearFilters: "Clear filters",
  csaDiscardChanges: "Discard Changes",
  csaDiscardNewlyAddedRows: "Discard newly added rows",
  csaDownloadTableData: "Download table data",
  csaSetDisable: "Set disable",
  csaSetLoading: "Set loading",
  csaSetVisibility: "Set visibility",

  // CSA param displayNames -> field data-cy is `event-<label>-input-field` (raw case).
  csaParamPage: "Page",
  csaParamKey: "Key",
  csaParamValue: "Value",
  csaParamValues: "Values",
  csaParamParameters: "Parameters",
  csaParamColumnKey: "Column key",

  // ---- property toggle display names (table.js:82,117,222,230,238) ----
  // tableSelector.toggleButton(<displayName>) -> `<slug>-toggle-button`.
  toggleAllowSelection: "Allow selection",
  toggleBulkSelection: "Bulk selection",
  toggleHighlightSelectedRow: "Highlight selected row",
  toggleEnablePagination: "Enable pagination",
  toggleEnableColumnSorting: "Enable column sorting",

  labelDynamicColumn: "Use dynamic column",
  makeEditable: "Make editable",
  lableDisableActionButton: "Disable action button",
};
