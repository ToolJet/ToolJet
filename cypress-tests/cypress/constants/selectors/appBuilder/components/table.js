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

// Column-manager controls use a DIFFERENT normalisation from the rendered table: every
// data-cy in the inspector popover is derived from the control's displayName by
// SingleLineCodeEditor.jsx:687 — `displayName.toLowerCase().trim().replace(/\s+/g, '-')`.
// It does NOT strip punctuation, so keep it separate from `normalize` above.
const cyLabel = (displayName = "") =>
  String(displayName).toLowerCase().trim().replace(/\s+/g, "-");

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
  // Verified vs Footer/_components/ControlButtons.jsx:126,133,140 (downlaodPopover).
  // The old `option-download-CSV` / `option-download-execel` / `option-download-pdf`
  // values are STALE — NewTable renders `option-download-as-*`.
  optionDownloadCSV: '[data-cy="option-download-as-csv"]',
  optionDownloadExcel: '[data-cy="option-download-as-excel"]',
  optionDownloadPdf: '[data-cy="option-download-as-pdf"]',

  // ---- column manager ----
  selectColumnDropdown: '[data-cy="select-column-icon"]',
  selectAllOption: '[data-cy="options-select-all-coloumn"]',
  selectColumnOption: (column) => `[data-cy="options-coloumn-${column}"]`,
  selectColumnCheckbox: (column) => `[data-cy="checkbox-coloumn-${column}"]`,

  // ---- filter panel (verified runtime: table1-filter-panel etc.) ----
  filterButton: (name = "table1") =>
    `[data-cy="${normalize(name)}-filter-button"]`,
  filterPanel: (name = "table1") =>
    `[data-cy="${normalize(name)}-filter-panel"]`,
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

  // ---- refresh (ControlButtons.jsx:177 — renders only when showRefreshButton is on) ----
  refreshButton: (name = "table1") =>
    `[data-cy="${normalize(name)}-refresh-button"]`,

  // ---- expandable rows (buildTableColumn.js:26-56) ----
  // The expansion column has id 'expansion' and a `() => null` header, so TableRow
  // falls back to `cell.column.id` for the cell data-cy -> `<name>-expansion-row-<i>`.
  // The chevron itself carries no data-cy; it is a `button.table-expansion-toggle`
  // whose aria-label flips between "Expand row" and "Collapse row".
  expansionCell: (rowIndex, name = "table1") =>
    `[data-cy="${normalize(name)}-expansion-row-${rowIndex}"]`,
  expandRowToggle: (rowIndex, name = "table1") =>
    `[data-cy="${normalize(name)}-expansion-row-${rowIndex}"] button.table-expansion-toggle`,

  // ---- CSA effect targets (Chunk 2) ----
  // `draggable-widget-<name>` matches TWO nodes for the Table: the outer RenderWidget
  // wrapper (RenderWidget.jsx:308) and the inner <table> root (Table.jsx:344). The
  // INNER one carries `data-disabled` and the `display:none` visibility style, so
  // always disambiguate with .first()/.last() — never a bare cy.get().
  widgetRoot: (name = "table1") =>
    `[data-cy="draggable-widget-${normalize(name)}"]`,
  // Table.jsx:344 — data-disabled mirrors the isDisabled exposed variable.
  widgetDisabled: (name = "table1") =>
    `[data-cy="draggable-widget-${normalize(name)}"][data-disabled="true"]`,
  // LoadingState.jsx:8 — replaces the tbody while loadingState is on.
  loadingSpinner: ".loading-spinner-table-component",
  // AddNewRow.jsx:137 — the add-new-row card, removed by discardNewlyAddedRows.
  addNewRowPanel: ".table-add-new-row",

  // ═════════════ COLUMN MANAGER (Inspector › Table › Columns) ═════════════
  // Everything below is derived from
  // frontend/src/AppBuilder/RightSideBar/Inspector/Components/Table/**.
  // `cyLabel` (private, above) mirrors SingleLineCodeEditor.jsx:687 — the ONE rule that
  // turns a control's displayName into its data-cy prefix.

  // ---- table-level column controls ----
  // source: Inspector/Components/Table/Table.jsx:607
  buttonAddColumn: '[data-cy="button-add-column"]',
  // source: Inspector/Components/Table/Table.jsx:613-636 (isFxNotRequired -> no fx button)
  lockColumnSchemaToggle: '[data-cy="lock-column-schema-toggle-button"]',

  // ---- column list item ----
  // Table.jsx:571 sets data-cy={`column-${resolvedItemName}`} from the RAW resolved display
  // name and List.jsx:47 spreads it straight onto the ListGroup.Item — it is NOT normalised,
  // so a column called "Order Status" is `column-Order Status`. `columnItem` (further up)
  // normalises and therefore only agrees for lowercase single-word columns; prefer this one.
  columnListItem: (displayName) => `[data-cy="column-${displayName}"]`,
  // Freshly added columns are named new_column1, new_column2, … (listItemHelpers.js:10-24
  // with namePrefix from useColumnManager.js:109), so a prefix match finds the newest one.
  columnListNewItems: '[data-cy^="column-new_column"]',
  // List.jsx:58 — the inner text cell; THIS one is normalised via generateCypressDataCy().
  columnListItemLabel: (displayName) =>
    `[data-cy="pages-name-${normalize(displayName)}"]`,
  // List.jsx:132-147 / :148-163 — duplicate + delete icons render only while the row is
  // hovered and carry no data-cy of their own (the `data-cy={'page-menu'}` lines are
  // commented out in source).
  columnListCopyIcon: ".copy-column-icon",
  columnListDeleteIcon: ".delete-icon-btn",

  // ---- popover chrome (Table.jsx:156-158 + ColumnPopover.jsx:100-160) ----
  // NOTE: `.table-column-popover` matches TWO nodes — the Popover root (Table.jsx:158) AND
  // Popover.Body (ColumnPopover.jsx:161). Always scope through the id.
  columnPopover: "#table-column-popover-basic",
  columnPopoverTitle: "#table-column-popover-basic .tj-header-h8",
  // ColumnPopover.jsx:104-114 — ghost icon Button, no data-cy/title; it is the only <button>
  // in the header's left `.custom-gap-6` group and renders only in the button detail view.
  columnPopoverBackButton: "#table-column-popover-basic .custom-gap-6 button",
  // ColumnPopover.jsx:121-138 — title flips with the detail view.
  columnPopoverDuplicate:
    '#table-column-popover-basic [title="Duplicate column"]',
  columnPopoverDelete: '#table-column-popover-basic [title="Delete column"]',
  buttonDetailDuplicate:
    '#table-column-popover-basic [title="Duplicate button"]',
  buttonDetailDelete: '#table-column-popover-basic [title="Delete button"]',
  // ColumnPopover.jsx:143-158 — tabs carry no data-cy, only classes + text.
  columnTabs: "#table-column-popover-basic .column-header-tab",
  activeColumnTab: "#table-column-popover-basic .active-column-tab",

  // ---- Properties tab, shared controls (PropertiesTabElements.jsx) ----
  columnTypeDropdown: '[data-cy="dropdown-column-type"]', // :118
  columnTypeLabel: '[data-cy="label-column-type"]', // :119
  columnTypeSelect: ".column-type-table-inspector", // :161
  // _ui/Select/SelectComponent.jsx:85 builds classNamePrefix `"<prefix> <dark> react-select"`;
  // the space-separated prefix still yields a literal `react-select__option` class, and the
  // menu is portalled to document.body (useMenuPortal default true) so it is NOT inside the
  // popover. Two option LABELS repeat ("Tags" at :131 and :148, "MultiSelect"/"Multiselect"
  // at :130/:143) — always pick by index, never by text (see tableText.columnTypeOptionIndex).
  columnTypeOption: ".react-select__option",
  // Same react-select menu class, used by every other inspector Select in the popover
  // (image fit, date format, time zone, unix timestamp) — DatepickerProperties.jsx:149,
  // :187, :231, :273 and StylesTabElements.jsx:84.
  inspectorSelectOption: ".react-select__option",
  // The SAME space-separated classNamePrefix (SelectComponent.jsx:85) also yields literal
  // `react-select__single-value` / `react-select__placeholder` classes. These two are the
  // ONLY way to read what an inspector Select currently shows without also picking up the
  // sibling <label> text of its wrapper. `value ? … : defaultValue` (SelectComponent.jsx:52)
  // means an empty stored value renders the PLACEHOLDER, never an option — which is exactly
  // how both datepicker time-zone selects default (DatepickerProperties.jsx:233, :369).
  inspectorSelectSingleValue: ".react-select__single-value",
  inspectorSelectPlaceholder: ".react-select__placeholder",
  // ee/modules/Appbuilder/components/ColorSwatches/ColorSwatches.jsx — the colorSwatches
  // popover opens on a Theme/Color-picker ToggleGroup and can default to the Theme view,
  // which renders no editable rgba inputs. Click this first.
  colorPickerModeToggle: '[data-cy="togglr-button-color"]',
  columnNameField: '[data-cy="input-and-label-column-name"]', // :164
  columnKeyField: '[data-cy="input-and-label-key"]', // :182
  columnTransformationField: '[data-cy="transformation-field"]', // :200
  columnValuesField: '[data-cy="input-and-label-values"]', // :296 (deprecated types)
  columnLabelsField: '[data-cy="input-and-label-labels"]', // :312 (deprecated types)
  // Every plain CodeHinter in the popover is mounted WITHOUT a paramLabel, so
  // SingleLineCodeEditor.jsx:561 falls back to cyLabel '' and emits `-input-field`. It is
  // therefore never unique on its own — always scope it to its wrapper.
  columnCodeInputField: '[data-cy="-input-field"]',
  // PropertiesTabElements.jsx:69-88 / :467-474 — Freeze column; ToggleGroup, no data-cy.
  pinColumnControl: ".pin-column-control",
  // ToolJetUI/SwitchGroup/ToggleGroupItem.jsx:33 — note the "togglr" typo in source.
  toggleGroupItem: (value) => `[data-cy="togglr-button-${value}"]`,
  // PropertiesTabElements.jsx:220 + RatingColumn/RatingIconToggle.jsx:14
  ratingTypeField: '[data-cy="rating-type-field"]',
  ratingIconToggle: ".table-rating-column-inspector-toggle",

  // ---- displayName-keyed controls rendered by ProgramaticallyHandleProperties ----
  // ProgramaticallyHandleProperties.jsx:151-167 feeds paramLabel=paramMeta.displayName into
  // CodeHinter; SingleLineCodeEditor.jsx:687 derives every data-cy below from it.
  columnParamLabel: (displayName) =>
    `[data-cy="${cyLabel(displayName)}-widget-parameter-label"]`, // :737
  columnParamFxButton: (displayName) =>
    `[data-cy="${cyLabel(displayName)}-fx-button"]`, // FxButton.jsx:10
  columnParamInputField: (displayName) =>
    `[data-cy="${cyLabel(displayName)}-input-field"]`, // :567
  columnParamToggle: (displayName) =>
    `[data-cy="${cyLabel(displayName)}-toggle-button"]`, // Toggle.jsx:25
  columnParamNumberInput: (displayName) =>
    `[data-cy="${cyLabel(displayName)}-input"]`, // NumberInput.jsx:13
  // BaseColorSwatches.jsx:139/146 (paramType colorSwatches) AND Inspector/Elements/Color.jsx:68
  // (raw Color) both emit `<cyLabel>-picker`. PRODUCT BUG F3: four column pickers are mounted
  // with NO cyLabel at all, so `String(undefined)` makes them collide on `undefined-picker` —
  // boolean Checked (StylesTabElements.jsx:109-116), boolean Unchecked (:119-126), deprecated
  // toggle Active color (:56-63) and button Icon color (ButtonStylesTab.jsx:134-147).
  // Passing a falsy displayName reproduces that literal so callers can disambiguate by index.
  columnColorPicker: (displayName) =>
    `[data-cy="${displayName ? cyLabel(displayName) : "undefined"}-picker"]`,
  columnColorValue: (displayName) =>
    `[data-cy="${displayName ? cyLabel(displayName) : "undefined"}-value"]`,
  // CodeBuilder/Elements/Select.jsx:85-87 — note: NO trim, and no displayName falls back to
  // `dropdown-common`.
  columnParamDropdown: (displayName) =>
    `[data-cy="dropdown-${
      displayName
        ? String(displayName).toLowerCase().replace(/\s+/g, "-")
        : "common"
    }"]`,

  // ---- validation block (ValidationProperties.jsx) ----
  // PRODUCT BUG F1: getValidationList declares the key `dateCy` (:41,50,56,64,75,79,85,91,
  // 103,115,122,132,139,149,156) but all three render branches read `validation.dataCy`
  // (:179,199,216) — React drops `data-cy={undefined}`, so NO validation control has a
  // data-cy. Address them by their <label> text inside this container instead.
  columnValidationSection: ".optional-properties-when-editable-true", // :248
  columnValidationField: ".optional-properties-when-editable-true .field", // :178,199,215
  columnValidationDateField: ".inspector-validation-date-picker", // :180,200
  columnValidationDateInput: ".react-datepicker__input-container input",

  // ---- Styles tab (StylesTabElements.jsx) ----
  columnBorderRadiusField: '[data-cy="input-and-label-border-radius"]', // :69 (image)
  columnObjectFitField: '[data-cy="input-and-label-object-fit"]', // :82 (image)
  columnTextColorField: '[data-cy="input-and-label-text-color"]', // :148,:182
  // PRODUCT BUG F4: for LINK columns this wrapper holds "Underline color", not a cell colour
  // (:196), and "Show underline" is wrapped in `input-overflow`/`label-overflow` (:212,:215).
  columnCellColorField: '[data-cy="input-and-label-cell-background-color"]', // :163,:196,:266
  columnUnderlineToggleField: '[data-cy="input-overflow"]', // :212
  columnUnderlineToggleLabel: '[data-cy="label-overflow"]', // :215

  // ---- options list: select / newMultiSelect / tagsV2 (SelectOptionsList/OptionsList.jsx) ----
  optionsAccordion: ".table-select-column-accordian", // :451
  // :407 — same raw (non-normalised) `column-<label>` shape as the column list item.
  optionListItem: (optionLabel) => `[data-cy="column-${optionLabel}"]`,
  // :432-442 — plain ui Button, no data-cy. The accordion's own collapse trigger is a <div>
  // (_ui/Accordion/AccordionItem.js:62-64), so this is the only <button> in the accordion.
  optionsAddButton: ".table-select-column-accordian button",
  // :169-260 — the per-option editor popover (distinct from #table-column-popover-basic).
  optionPopover: "#popover-basic",

  // ---- button column (ButtonListManager.jsx / ButtonPropertiesTab.jsx / ButtonStylesTab.jsx) ----
  addNewActionButton: '[data-cy="add-new-action-button"]', // ButtonListManager.jsx:113
  buttonListManager: ".button-list-manager", // :63
  // :12-27 — list rows carry no data-cy; match on the `.page-name` span's text.
  buttonListItem: ".button-list-manager .page-menu-item",
  buttonListItemName: ".page-name",

  // ---- datepicker column (DatepickerProperties.jsx) ----
  dateDisplayFormatField: '[data-cy="input-date-display-format"]', // :114
  dateDisplayFormatLabel: '[data-cy="label-date-display-format"]', // :120
  displayTimeZoneField: '[data-cy="input-display-time-zone"]', // :223
  // PRODUCT BUG (duplicate data-cy): `input-parse-timezone` is emitted TWICE — once for the
  // parse-format "Date" block (:291) and once for the parse "Time zone" block (:363).
  parseTimezoneField: '[data-cy="input-parse-timezone"]',
  dateParseFormatLabel: '[data-cy="label-parse-timezone"]', // :293,:364
  // _ui/Accordion/AccordionItem.js:39 — the two accordions DatepickerProperties pushes.
  dateFormatAccordion: '[data-cy="widget-accordion-date-format"]',
  parseFormatAccordion: '[data-cy="widget-accordion-parse-format"]',
  // PRODUCT BUG F6: both datepicker FxButtons are mounted without a dataCy
  // (DatepickerProperties.jsx:124-136 and :297-309), so both render `undefined-fx-button`.
  // Scope by the owning field wrapper; never use this bare.
  undefinedFxButton: '[data-cy="undefined-fx-button"]',
  // The UNIX-timestamp select's label (:270). NOTE it is `label-date-parse-format`, which
  // sounds like the parse DATE field but is not — the parse date field's label is the
  // duplicated `label-parse-timezone` (:293). The select itself carries no data-cy, so reach
  // it through this label's parent `.field.mb-2.tj-app-input` (:269).
  unixTimestampLabel: '[data-cy="label-date-parse-format"]', // :270
  // Every DatepickerProperties Select renders its own value as react-select's SingleValue.
  // Used to tell the fx CodeHinter branch (`.cm-content` present) from the dropdown branch.
  codeMirrorContent: ".cm-content",

  // ---- datepicker CELL (Shared/DataTypes/renderers/DatePickerRenderer.jsx) ----
  // The rendered cell nests deeply:
  //   <td> > .td-container > div(ref) > span(HIDDEN measuring copy, :328-339)
  //                                   + .react-datepicker-wrapper
  //                                     > .react-datepicker__input-container
  //                                       > .table-column-datepicker-input-container (:16)
  //                                         > readOnly ? div(:18-20) : input(:23-34)
  // The hidden <span> renders computeDateString a SECOND time, so `have.text` on the <td>
  // (verifyCellValue / tableSelector.cell) reads the value TWICE. Every datepicker text
  // assertion must target the nodes below, never the cell itself.
  cellDatepickerContainer: (columnHeader, rowIndex, name = "table1") =>
    `[data-cy="${normalize(name)}-${normalize(
      columnHeader,
    )}-row-${rowIndex}"] .table-column-datepicker-input-container`,
  // The READ-ONLY branch (:18-20) — a bare div carrying the inline `color` fed by the
  // column's textColor (:361 styles={{ color: textColor }}).
  cellDatepickerText: (columnHeader, rowIndex, name = "table1") =>
    `[data-cy="${normalize(name)}-${normalize(
      columnHeader,
    )}-row-${rowIndex}"] .table-column-datepicker-input-container > div`,
  // The EDITABLE branch (:23-34) — a real <input>, so read it with have.value.
  cellDatepickerInput: (columnHeader, rowIndex, name = "table1") =>
    `[data-cy="${normalize(name)}-${normalize(
      columnHeader,
    )}-row-${rowIndex}"] input.table-column-datepicker-input`,
  // :36-43 — the calendar glyph, rendered only in the editable branch.
  cellDatepickerIcon: (columnHeader, rowIndex, name = "table1") =>
    `[data-cy="${normalize(name)}-${normalize(
      columnHeader,
    )}-row-${rowIndex}"] .table-column-datepicker-input-icon`,
  // :397 — the validation message, rendered only while `isEditable && !isValid`.
  cellDateInvalidFeedback: (columnHeader, rowIndex, name = "table1") =>
    `[data-cy="${normalize(name)}-${normalize(
      columnHeader,
    )}-row-${rowIndex}"] .invalid-feedback-date`,
  // react-datepicker portals the open calendar to `#component-portal`
  // (DatePickerRenderer.jsx:370 + AppCanvas/CanvasContentTail.jsx:14), so it is NOT inside
  // the cell. `excludeDates` marks a day `react-datepicker__day--excluded`
  // (react-datepicker/dist/index.js:1576) — that is how `disabledDates` becomes observable.
  datepickerCalendar: "#component-portal .react-datepicker",
  datepickerExcludedDay: "#component-portal .react-datepicker__day--excluded",

  // ═════════ PROPERTIES PANEL (Inspector › Table › accordions) ═════════
  // Added for the properties facet. Every accordion of the Table inspector renders
  // EXPANDED by default (Inspector/Components/Table/Table.jsx passes `isOpen` only for
  // Events + Devices, and _ui/Accordion/AccordionItem.js:5 defaults `open = true`), so
  // controls that share a displayName are simultaneously in the DOM. Scope by accordion.

  // ---- Data accordion (Table.jsx:475-499) ----
  // `dataSourceSelector` is a `dropdownMenu`; DropdownMenu.jsx:166-203 renders NO data-cy
  // at all, so the selected source is only readable from its trigger label span (:186).
  dataSourceTriggerLabel: ".dropdown-menu-trigger-label",
  // `data` has displayName ' ' (table.js:23) -> SingleLineCodeEditor cyLabel '' -> `-input-field`.
  dataInputField: '[data-cy="-input-field"]',

  // ---- column-selector / "Manage columns" toolbar button ----
  // ControlButtons.jsx:225-227 renders `<name>-manage-columns-button`. The legacy
  // `selectColumnDropdown` ('select-column-icon') above is STALE — nothing emits it.
  manageColumnsButton: (name = "table1") =>
    `[data-cy="${normalize(name)}-manage-columns-button"]`,
  optionSelectAllColumn: '[data-cy="option-select-all-column"]', // ControlButtons.jsx:85
  optionColumn: (header) => `[data-cy="option-column-${normalize(header)}"]`, // :102

  // ---- filter "applied" badge (Header.jsx:82) — proves a filter registered even when
  // serverSideFilter suppresses client-side row reduction. ----
  filterAppliedState: (name = "table1") =>
    `[data-cy="${normalize(name)}-filter-applied-state"]`,

  // ---- expansionHeight (table.js:336, type 'number') ----
  // CodeBuilder/Elements/Number.jsx:22 emits `<cyLabel>-input-field` on a real
  // <input type="number">.
  expandedRowHeightInput: '[data-cy="expanded-row-height-input-field"]',
  // ExpandedRowContainer.jsx:59 — the wrapper whose inline height is `${expansionHeight}px`.
  expandedRowContent: ".table-expanded-row-content",

  // ---- generic property-panel controls (same derivation rule as columnParam*) ----
  propertyLabel: (displayName) =>
    `[data-cy="${cyLabel(displayName)}-widget-parameter-label"]`,
  propertyInputField: (displayName) =>
    `[data-cy="${cyLabel(displayName)}-input-field"]`,
  propertyToggle: (displayName) =>
    `[data-cy="${cyLabel(displayName)}-toggle-button"]`,

  // ═════════ STYLES FACET (table.js:374-537) ═════════
  // The right-Inspector tab strip is a ToolJetUI <Tabs id="inspector"> with two
  // tabs — Properties (1st nav-link) and Styles (2nd, already exposed as
  // commonWidgetSelector.buttonStylesEditorSideBar). Inspector.jsx:594-599.
  inspectorPropertiesTab: "#inspector .nav-link:eq(0)",

  // AccordionItem.js:38 stamps `widget-accordion-<slug>` on the <h2> header and
  // renders the body as the immediately following `.accordion-collapse` sibling
  // (AccordionItem.js:63). Every styles accordion ships OPEN (Accordion/index.js
  // passes `open={isOpen}` and AccordionItem defaults `open = true`), so ALL
  // accordions' controls coexist in the DOM — several Table switch OPTIONS share
  // a displayName across accordions ("None" is both Overflow/fixed and
  // Padding/none), which makes unscoped text matching ambiguous. Scope with this.
  styleAccordionBody: (title) =>
    `[data-cy="widget-accordion-${normalize(title)}"] + .accordion-collapse`,

  // NumberInput.jsx:15 / TableRowHeightInput.jsx:32 — `${cyLabel}-input`. For
  // showLabel:false style fields cyLabel falls back to `param.name.toLowerCase()`
  // (Inspector/Elements/Code.jsx:82), e.g. maxRowHeightValue -> `maxrowheightvalue`.
  styleValueInput: (cyLabelText) =>
    `[data-cy="${normalize(cyLabelText)}-input"]`,

  // Inspector/Components/Table/Table.jsx:698 — AddNewButton that appends an entry
  // to `actions`; needed before `actionButtonRadius` has anything to render on.
  buttonAddNewAction: '[data-cy="button-add-new-action-button"]',
  // ActionButtons.jsx:29-34 — the rendered per-row action <button> carrying the
  // inline `borderRadius: actionButtonRadius`. It has no data-cy of its own.
  actionButton: (name = "table1") =>
    `[data-cy="draggable-widget-${normalize(name)}"] .action-button`,

  // --- style ASSERTION targets (which element each style key lands on) ---
  // RenderWidget.jsx:316-323 — the OUTER `draggable-widget-<name>` div (first in
  // DOM) is the canvas-component box that carries the `padding` style.
  widgetOuterBox: (name = "table1") =>
    `[data-cy="draggable-widget-${normalize(name)}"]:eq(0)`,
  // Table.jsx:344-366 — the INNER `draggable-widget-<name>` div (`card jet-table`)
  // carries borderRadius / boxShadow / borderColor / containerBackgroundColor and
  // the `--cc-table-selected-row-bg` custom property.
  widgetCard: (name = "table1") =>
    `[data-cy="draggable-widget-${normalize(name)}"]:eq(1)`,
  // TableData.jsx:184 — `<table class="table ${rowStyle}">`; rowStyle is the
  // `tableType` style value (initSlice.js:133 maps tableType -> rowStyle).
  dataTable: (name = "table1") =>
    `[data-cy="draggable-widget-${normalize(name)}"] table.table`,
  // TableHeader.jsx:85-105 — the <th> carries the inline backgroundColor
  // (columnBackgroundColor), color (columnTitleColor) and whiteSpace
  // (columnHeaderWrap). The `<col>-column-header` div inside it only carries
  // textTransform (headerCasing) and inherits the colour.
  columnHeaderCell: (name = "table1") =>
    `[data-cy="draggable-widget-${normalize(name)}"] thead th`,
  // StringRenderer.jsx:203-208 — the read-only cell content div holds the inline
  // `color` fed by the `textColor` style (via useTextColor.js:7).
  cellContent: (columnHeader, rowIndex, name = "table1") =>
    `[data-cy="${normalize(name)}-${normalize(columnHeader)}-row-${rowIndex}"] div`,

  // ═════════ VARIANTS FACET (variants/string.cy.js · variants/text.cy.js) ═════════
  // Added by the string/text column-variant specs. Everything below addresses the
  // RENDERED cell, which is where a column-type setting has to prove its effect.

  // The DEEPEST <div> inside a rendered <td> — the node that carries the inline
  // `color` written from the column's `textColor`. The two renderers nest
  // differently, so a fixed depth does NOT work for both:
  //   string : StringRenderer.jsx:199-207  → <td> > div(color) > span
  //   text   : TextRenderer.jsx:184-196    → <td> > div(wrapper) > div(container) > div(color)
  // `div:not(:has(div))` resolves to the coloured content div for BOTH shapes
  // (HighLightSearch.jsx renders <span>/<mark> only, never a <div>).
  cellContentNode: (columnHeader, rowIndex, name = "table1") =>
    `[data-cy="${normalize(name)}-${normalize(
      columnHeader,
    )}-row-${rowIndex}"] div:not(:has(div))`,

  // Validation feedback inside a rendered cell. Rendered ONLY while the column is
  // editable AND the value is invalid — StringRenderer.jsx:189-193 and
  // TextRenderer.jsx:197-201 both emit `div.invalid-feedback.text-truncate`.
  cellInvalidFeedback: (columnHeader, rowIndex, name = "table1") =>
    `[data-cy="${normalize(name)}-${normalize(
      columnHeader,
    )}-row-${rowIndex}"] .invalid-feedback`,

  // PRODUCT BUG F1: no validation control has a usable data-cy (ValidationProperties.jsx
  // declares `dateCy` at :41,50,56,64 but the render branches read `validation.dataCy`
  // at :179,199,216). The field <label> text is the ONLY hook, so this collection is how
  // a spec proves WHICH validations a column type mounts (used for F2 in text.cy.js).
  columnValidationLabels:
    ".optional-properties-when-editable-true label.form-label",

  // ---- misc ----
  addNewRowButton: (name = "table1") =>
    `[data-cy="${normalize(name)}-add-new-row-button"]`,

  fxButton: (action) =>
    `[data-cy="${String(action).toLowerCase().replace(/\s+/g, "-")}-fx-button"] > svg`,
  toggleButton: (action) =>
    `[data-cy="${String(action).toLowerCase().replace(/\s+/g, "-")}-toggle-button"]`,

  // ═════════ VARIANTS FACET (variants/json.cy.js · markdown.cy.js · html.cy.js) ═════════
  // PRODUCT BUG F9: json / markdown / html add NO discriminating <td> class — every one
  // of them falls through TableRow.jsx:107-142 as a plain `table-cell td`. The ONLY way
  // to prove which renderer ran is the MARKUP it produced inside the cell, which is what
  // the three selectors below address.

  // HTMLRenderer.jsx:149-156 (read-only) / :116 (editable) is the single renderer of the
  // three that stamps a class of its own — `span.html-cell` — and it is filled through
  // dangerouslySetInnerHTML, so real elements (not escaped text) land inside it.
  cellHtmlContent: (columnHeader, rowIndex, name = "table1") =>
    `[data-cy="${normalize(name)}-${normalize(
      columnHeader,
    )}-row-${rowIndex}"] span.html-cell`,
  // The <b> that only exists if the HTML fragment was PARSED rather than escaped.
  cellHtmlBold: (columnHeader, rowIndex, name = "table1") =>
    `[data-cy="${normalize(name)}-${normalize(
      columnHeader,
    )}-row-${rowIndex}"] span.html-cell b`,
  // MarkdownRenderer.jsx:152 pipes the value through <ReactMarkdown>, so `**x**` becomes
  // a REAL <strong>. No other column type produces one from the same source string.
  cellMarkdownBold: (columnHeader, rowIndex, name = "table1") =>
    `[data-cy="${normalize(name)}-${normalize(
      columnHeader,
    )}-row-${rowIndex}"] strong`,

  // ═════════ VARIANTS FACET (variants/number.cy.js) ═════════
  // `decimalPlaces` is the ONLY type-specific property of a `number` column
  // (PropertiesTabElements.jsx:367-384) and it is also the ONLY Properties-tab
  // control mounted with NO data-cy on its wrapper AND no paramLabel on its
  // CodeHinter — see PRODUCT BUG F29 below — so it is unaddressable by data-cy
  // and can only be reached structurally.
  //
  // F29 (LOW): every sibling field in PropertiesTabElements carries a wrapper
  // data-cy (`dropdown-column-type` :118, `input-and-label-column-name` :164,
  // `input-and-label-key` :182, `transformation-field` :201, `rating-type-field`
  // :220, `input-and-label-values` :296, `input-and-label-labels` :312); the
  // Decimal Places wrapper at :368 has none. Its CodeHinter is mounted without a
  // paramLabel too, so SingleLineCodeEditor.jsx:561 falls back to cyLabel '' and
  // the editor itself is only the non-unique `-input-field`.
  //
  // WHY THIS SELECTOR IS UNIQUE FOR A `number` COLUMN: `field mb-2 px-3` occurs
  // exactly three times in PropertiesTabElements — :296 and :312 (both carry a
  // data-cy, and both render only for the deprecated dropdown/multiselect/badge/
  // badges/radio types) and :332 (link's "Display text", gated
  // `columnType === 'link'`). :368 is gated `columnType === 'number'` and is the
  // only one of the four with no data-cy, so `:not([data-cy])` isolates it.
  // Feed it to setColumnCodeField / verifyColumnCodeField as the `container`.
  columnDecimalPlacesField:
    "#table-column-popover-basic div.field.mb-2.px-3:not([data-cy])",

  // NumberRenderer.jsx:141-172 — an EDITABLE number cell renders a real
  // `<input type="number" class="input-number">` instead of text, so
  // verifyCellValue / `have.text` read '' once "Make editable" is on; assert
  // `have.value` on this instead. (The read-only branch, :208-218, is a plain
  // coloured div and IS covered by cellContentNode.)
  cellNumberInput: (columnHeader, rowIndex, name = "table1") =>
    `[data-cy="${normalize(name)}-${normalize(
      columnHeader,
    )}-row-${rowIndex}"] input.input-number`,

  // ═════════ VARIANTS FACET (variants/boolean.cy.js · variants/image.cy.js) ═════════
  // PRODUCT BUG F9 again: boolean and image add NO discriminating <td> class
  // (tableText.cellClassByType maps both to null), so the ONLY proof of which renderer
  // ran is the MARKUP produced inside the cell — which is what these address.

  // BooleanRenderer.jsx:45-50 — the EDITABLE branch. `label.boolean-switch` wraps the
  // checkbox that carries the value and the `span.boolean-slider` that carries the
  // `toggleOnBg` / `toggleOffBg` inline backgroundColor (:48). Neither exists in the
  // read-only branch, so their presence IS the "Make editable" proof.
  cellBooleanSwitch: (columnHeader, rowIndex, name = "table1") =>
    `[data-cy="${normalize(name)}-${normalize(
      columnHeader,
    )}-row-${rowIndex}"] label.boolean-switch`,
  cellBooleanCheckbox: (columnHeader, rowIndex, name = "table1") =>
    `[data-cy="${normalize(name)}-${normalize(
      columnHeader,
    )}-row-${rowIndex}"] label.boolean-switch input[type="checkbox"]`,
  cellBooleanSlider: (columnHeader, rowIndex, name = "table1") =>
    `[data-cy="${normalize(name)}-${normalize(
      columnHeader,
    )}-row-${rowIndex}"] span.boolean-slider`,
  // BooleanRenderer.jsx:38-43 — the READ-ONLY branch renders `<SolidIcon name="tick">`
  // / `"remove"`, and SolidIcons/index.js adds no class, id or data-cy of its own
  // (Tick.jsx:4-21, Remove.jsx:4-21 are bare <svg><path/></svg>). The ONLY thing that
  // distinguishes the two icons is the `fill` handed to the <path>: `var(--grass9)`
  // for the tick (:40) and `var(--tomato9)` for the cross (:42).
  cellBooleanTickIcon: (columnHeader, rowIndex, name = "table1") =>
    `[data-cy="${normalize(name)}-${normalize(
      columnHeader,
    )}-row-${rowIndex}"] svg path[fill="var(--grass9)"]`,
  cellBooleanCrossIcon: (columnHeader, rowIndex, name = "table1") =>
    `[data-cy="${normalize(name)}-${normalize(
      columnHeader,
    )}-row-${rowIndex}"] svg path[fill="var(--tomato9)"]`,

  // TableRow.jsx:167-170 — the per-cell container. An IMAGE cell is the only type that
  // gets `jet-table-image-column h-100`; every other type gets `w-100 h-100` instead.
  cellImageContainer: (columnHeader, rowIndex, name = "table1") =>
    `[data-cy="${normalize(name)}-${normalize(
      columnHeader,
    )}-row-${rowIndex}"] div.td-container.jet-table-image-column`,
  // ImageRenderer.jsx:35-45 — the rendered <img>. It carries the objectFit and
  // borderRadius styles inline, and its `src` is the resolved cellValue. Renders at all
  // ONLY for a truthy value (:25-27).
  cellImage: (columnHeader, rowIndex, name = "table1") =>
    `[data-cy="${normalize(name)}-${normalize(columnHeader)}-row-${rowIndex}"] img`,

  // The renderer's OWN flex wrapper, which is where horizontalAlignment lands as a
  // bootstrap `justify-content-*` class (BooleanRenderer.jsx:53-57 /
  // ImageRenderer.jsx:30-34) — the inner counterpart of the <td>'s
  // `table-text-align-*`. It is the first <div> inside `.td-container` for both types.
  cellRendererFlexWrapper: (columnHeader, rowIndex, name = "table1") =>
    `[data-cy="${normalize(name)}-${normalize(
      columnHeader,
    )}-row-${rowIndex}"] div.td-container > div`,

  // ═════════ VARIANTS FACET (variants/link.cy.js) ═════════
  // LinkRenderer.jsx:43-61 — the ONLY markup a link cell produces is a single <a>. It
  // carries href / target / rel as attributes and colour + text-decoration as INLINE
  // styles, so every link assertion hangs off this one node. (The <td> also gets the
  // `has-link` class, TableRow.jsx:129 — that one is covered by verifyCellType.)
  cellLink: (columnHeader, rowIndex, name = "table1") =>
    `[data-cy="${normalize(name)}-${normalize(columnHeader)}-row-${rowIndex}"] a`,

  // PropertiesTabElements.jsx:332 — "Display text" is mounted with NO wrapper data-cy
  // and its CodeHinter has no paramLabel (so the editor itself is only the non-unique
  // `-input-field`). Same F29-shaped defect as `number`'s Decimal Places at :368.
  // WHY THIS IS UNIQUE FOR A LINK COLUMN: `field mb-2 px-3` occurs four times in
  // PropertiesTabElements — :296 and :312 both carry a data-cy AND only render for the
  // deprecated dropdown/multiselect/badge/badges/radio types, and :368 is gated
  // `columnType === 'number'`. For `columnType === 'link'` the Display text wrapper is
  // therefore the only `div.field.mb-2.px-3:not([data-cy])` in the popover.
  // Feed it to setColumnCodeField / verifyColumnCodeField as the `container`.
  columnDisplayTextField:
    "#table-column-popover-basic div.field.mb-2.px-3:not([data-cy])",

  // ═════════ VARIANTS FACET (variants/rating.cy.js) ═════════
  // RatingColumnProperties.jsx:22 / :38 mount "Max rating" and "Default rating" with the
  // same missing-wrapper-data-cy defect as Display text above, and RatingColumnProperties
  // adds a THIRD identically-classed wrapper at :54 ("Allow half rating"). For a rating
  // column `div.field.mb-2.px-3:not([data-cy])` therefore matches exactly three nodes in
  // DOM/source order, so the two code fields are addressed positionally.
  columnMaxRatingField:
    "#table-column-popover-basic div.field.mb-2.px-3:not([data-cy]):eq(0)", // :22
  columnDefaultRatingField:
    "#table-column-popover-basic div.field.mb-2.px-3:not([data-cy]):eq(1)", // :38
  // The guard that keeps the positional indices above honest.
  columnRatingUnnamedFields:
    "#table-column-popover-basic div.field.mb-2.px-3:not([data-cy])",

  // Rating.jsx:98-108 — the renderer's own flex row. It carries role="radiogroup", the
  // `justify-content-*` class built from horizontalAlignment, and an aria-label that
  // encodes BOTH the icon type and maxRating.
  cellRatingGroup: (columnHeader, rowIndex, name = "table1") =>
    `[data-cy="${normalize(name)}-${normalize(
      columnHeader,
    )}-row-${rowIndex}"] .rating-widget-group`,
  // RatingIcon.jsx:131-150 — one <span role="radio"> per icon; `aria-checked` is the
  // selected state and `aria-setsize` is maxRating.
  cellRatingIcon: (columnHeader, rowIndex, name = "table1") =>
    `[data-cy="${normalize(name)}-${normalize(
      columnHeader,
    )}-row-${rowIndex}"] span.rating-icon-widget`,
  cellRatingIconSelected: (columnHeader, rowIndex, name = "table1") =>
    `[data-cy="${normalize(name)}-${normalize(
      columnHeader,
    )}-row-${rowIndex}"] span.rating-icon-widget[aria-checked="true"]`,
  // icons/star.jsx:16 / icons/heart.jsx — the colour lands as the svg `fill` ATTRIBUTE
  // (selected icons get the Selected color, the rest the Unselected color).
  cellRatingIconSvg: (columnHeader, rowIndex, iconIndex, name = "table1") =>
    `[data-cy="${normalize(name)}-${normalize(
      columnHeader,
    )}-row-${rowIndex}"] span.rating-icon-widget:eq(${iconIndex}) svg`,
  // icons/star.jsx:5-8 — a HALF icon swaps the flat fill for a generated linearGradient
  // whose id is randomised per render, so only a prefix match is stable.
  cellRatingHalfIcon: (columnHeader, rowIndex, name = "table1") =>
    `[data-cy="${normalize(name)}-${normalize(
      columnHeader,
    )}-row-${rowIndex}"] span.rating-icon-widget svg[fill^="url(#starGradient"]`,

  // ═════════ VARIANTS FACET (variants/tagsV2.cy.js) ═════════
  // A tagsV2 cell IS discriminated by its <td> class (`has-select`, TableRow.jsx:127)
  // but that class is SHARED with select / newMultiSelect, so everything below
  // addresses the markup that only the tags renderer produces.
  //
  // TagsV2ColumnAdapter.jsx:83 mounts TagsRenderer, which mounts _ui/Select with
  // className "select-search table-select-search" (generateColumnsData.js:372).
  // SelectComponent.jsx:85 builds classNamePrefix `"<prefix> <dark> react-select"`; the
  // space-separated prefix still yields literal `react-select__*` classes.
  cellTagsSelect: (columnHeader, rowIndex, name = "table1") =>
    `[data-cy="${normalize(name)}-${normalize(
      columnHeader,
    )}-row-${rowIndex}"] .select-search.table-select-search`,
  // react-select's Control — clicking it is what opens the (portalled) tag menu. It is
  // only clickable while the column is editable: TagsRenderer passes isDisabled={disabled}
  // and generateColumnsData.js:361 sets disabled={!isEditable}.
  cellTagsControl: (columnHeader, rowIndex, name = "table1") =>
    `[data-cy="${normalize(name)}-${normalize(
      columnHeader,
    )}-row-${rowIndex}"] .react-select__control`,
  cellTagsValueContainer: (columnHeader, rowIndex, name = "table1") =>
    `[data-cy="${normalize(name)}-${normalize(
      columnHeader,
    )}-row-${rowIndex}"] .react-select__value-container`,
  // THE TAG CHIP. Both chip components — TagsMultiValueContainer (TagsRenderer.jsx:62-64)
  // and TagsSingleValue (:66-99) — render a bare `<div style={getTagChipStyles(...)}>` and
  // deliberately DROP react-select's `innerProps`, so neither carries a class of any kind.
  // `> div:not([class])` is therefore the only stable hook, and it is the node holding the
  // inline `background` (auto-assigned colour / optionColor) and `color` (labelColor /
  // textColor). It works in BOTH modes: N chips while allowMultipleSelection is on,
  // exactly one once it is off.
  cellTagChip: (columnHeader, rowIndex, name = "table1") =>
    `[data-cy="${normalize(name)}-${normalize(
      columnHeader,
    )}-row-${rowIndex}"] .react-select__value-container > div:not([class])`,
  // MultiValueLabel is NOT overridden, so it keeps react-select's own class — which makes
  // it the discriminator between multi mode (present) and single mode (absent).
  cellTagLabel: (columnHeader, rowIndex, name = "table1") =>
    `[data-cy="${normalize(name)}-${normalize(
      columnHeader,
    )}-row-${rowIndex}"] .react-select__multi-value__label`,

  // The OPEN tag menu. _ui/Select defaults useMenuPortal=true and TagsRenderer never
  // overrides it (SelectComponent.jsx:83), so the menu is PORTALLED TO document.body and
  // is never inside the cell. MenuListWithSearch (TagsRenderer.jsx:115-164) wraps it in
  // `.table-select-custom-menu-list`, TagsInputMenuList.jsx:53 in `.tags-input-menu-list`,
  // and TagsInputOption.jsx:64-72 renders each option label inside `.tags-input-option-chip`.
  tagsMenu: ".table-select-custom-menu-list",
  tagsMenuList: ".tags-input-menu-list",
  tagsMenuOptionChip: ".tags-input-menu-list .tags-input-option-chip",
  tagsMenuSearchInput: ".table-select-column-type-search-box",

  // OptionsList.jsx:270-271 + _ui/Accordion/AccordionItem.js:39,51 — the accordion title is
  // "Tags" for tagsV2 and "Options" for select / newMultiSelect, so the header data-cy is
  // itself a type discriminator. The parameterised form below is the general one; the
  // `select`/`newMultiSelect` specs use the pre-bound `optionsAccordionHeader` /
  // `optionsAccordionLabel` string constants further down.
  // (A previous edit declared `optionsAccordionHeader` TWICE in this object literal — once
  // here as a function and once below as a string — and the later key silently won. The
  // function form is kept under its own name so both shapes stay available.)
  optionsAccordionHeaderFor: (title) =>
    `[data-cy="widget-accordion-${normalize(title)}"]`,
  optionsAccordionTitleLabel: (title) =>
    `[data-cy="label-${normalize(title)}"]`,

  // ═════════ VARIANTS FACET (variants/select.cy.js · variants/newMultiSelect.cy.js) ═════════
  // The OptionsList pushes ONE accordion whose title is 'Options' for select/newMultiSelect and
  // 'Tags' for tagsV2 (OptionsList.jsx:271). _ui/Accordion/AccordionItem.js:39 stamps the header
  // `widget-accordion-<title lowercased, spaces->->` and :51 the inner label `label-<same>`, so
  // the accordion TITLE is itself assertable — which is how a spec proves it is NOT looking at
  // the tagsV2 variant of the same component.
  optionsAccordionHeader: '[data-cy="widget-accordion-options"]',
  optionsAccordionLabel: '[data-cy="label-options"]',
  // OptionsList.jsx:430 mounts <NoListItem text='There are no columns' dataCy='-columns'/> when
  // the option array is empty; NoListItem.jsx:7 prefixes that with `no-items-banner`.
  optionsEmptyState: '[data-cy="no-items-banner-columns"]',

  // ---- the RENDERED select / multiselect cell ----
  // generateColumnsData.js:311-332 mounts <CustomSelectColumn className="select-search
  // table-select-search">, which SelectColumnAdapter.jsx:57 forwards to SelectRenderer and
  // SelectRenderer.jsx:414 forwards to _ui/Select → react-select's own `className`. It is the
  // ONE class that identifies the select renderer inside the cell (the <td>'s `has-select` is
  // shared with tagsV2 — TableRow.jsx:127).
  cellSelectControl: (columnHeader, rowIndex, name = "table1") =>
    `[data-cy="${normalize(name)}-${normalize(
      columnHeader,
    )}-row-${rowIndex}"] .select-search.table-select-search`,
  // _ui/Select/SelectComponent.jsx:85 sets classNamePrefix `"<prefix> <dark> react-select"`, and
  // react-select's `cx` emits `<prefix>__<key>` for each state key — the space-separated prefix
  // still yields a literal `react-select__*` TOKEN in the class attribute (same mechanism the
  // column-type menu's `.react-select__option` relies on).
  //   single-value       → SingleValue, rendered only when isMulti is FALSE
  //   multi-value__label → MultiValueLabel, one node PER selected value when isMulti is TRUE.
  //     NOTE the container is NOT `react-select__multi-value`: SelectRenderer.jsx:149-159
  //     overrides MultiValueContainer with a bare <div> that drops react-select's className,
  //     so the label is the only multi-value node that keeps its prefix class.
  //   placeholder        → rendered only while react-select has NO value at all
  cellSelectSingleValue: (columnHeader, rowIndex, name = "table1") =>
    `[data-cy="${normalize(name)}-${normalize(
      columnHeader,
    )}-row-${rowIndex}"] .react-select__single-value`,
  cellSelectMultiValueLabel: (columnHeader, rowIndex, name = "table1") =>
    `[data-cy="${normalize(name)}-${normalize(
      columnHeader,
    )}-row-${rowIndex}"] .react-select__multi-value__label`,
  cellSelectPlaceholder: (columnHeader, rowIndex, name = "table1") =>
    `[data-cy="${normalize(name)}-${normalize(
      columnHeader,
    )}-row-${rowIndex}"] .react-select__placeholder`,
  // The MULTI-VALUE CONTAINER react-select would normally emit. SelectRenderer.jsx:149-159
  // overrides MultiValueContainer with `CustomMultiValueContainer`, a bare <div> that keeps
  // only inline flex styles and DROPS react-select's className — so `react-select__multi-value`
  // never appears even in isMulti mode, while `react-select__multi-value__label` (a separate
  // class token, emitted by the un-overridden MultiValueLabel) does. Asserting this absence is
  // how a spec proves the override is in place rather than assuming the DOM shape.
  cellSelectMultiValueContainer: (columnHeader, rowIndex, name = "table1") =>
    `[data-cy="${normalize(name)}-${normalize(
      columnHeader,
    )}-row-${rowIndex}"] .react-select__multi-value`,
  // SelectRenderer.jsx:277 mounts the custom DropdownIndicator ONLY when isEditable is true
  // (`DropdownIndicator: isEditable ? DropdownIndicator : null`), and that indicator is the only
  // node carrying `.cell-icon-display` (:164). Its presence IS the "Make editable" proof for a
  // select cell — the has-select class is unchanged by editability.
  cellSelectDropdownIcon: (columnHeader, rowIndex, name = "table1") =>
    `[data-cy="${normalize(name)}-${normalize(
      columnHeader,
    )}-row-${rowIndex}"] .cell-icon-display`,

  // react-select's Control and ValueContainer inside a select / multiselect cell. Same SHAPE
  // as the tagsV2 pair above (cellTagsControl / cellTagsValueContainer) — both renderers
  // mount the same _ui/Select — but named for this facet so the specs read straight.
  //   control          → carries `react-select__control--is-disabled` while the column is
  //                      NOT editable (generateColumnsData.js:320 `disabled={!isEditable}`),
  //                      and clicking it is what opens the (portalled) option menu.
  //   value-container  → carries the inline `justify-content` written from the column's
  //                      horizontalAlignment (SelectRenderer.jsx:305-315).
  cellSelectControlBox: (columnHeader, rowIndex, name = "table1") =>
    `[data-cy="${normalize(name)}-${normalize(
      columnHeader,
    )}-row-${rowIndex}"] .react-select__control`,
  cellSelectValueContainer: (columnHeader, rowIndex, name = "table1") =>
    `[data-cy="${normalize(name)}-${normalize(
      columnHeader,
    )}-row-${rowIndex}"] .react-select__value-container`,

  // ---- the OPEN option menu ----
  // _ui/Select defaults useMenuPortal=true and SelectRenderer never overrides it
  // (SelectComponent.jsx:83), so the menu is PORTALLED TO document.body and is NEVER inside
  // the cell. CustomMenuList wraps it in `.table-select-custom-menu-list`
  // (SelectRenderer.jsx:57) and CustomOption renders each option label inside
  // `.table-select-menu-pill` (:132).
  selectMenu: ".table-select-custom-menu-list",
  selectMenuOptionPill:
    ".table-select-custom-menu-list .table-select-menu-pill",
  selectMenuSearchInput:
    ".table-select-custom-menu-list .table-select-column-type-search-box", // :85
  // SelectRenderer.jsx:99-102 — while `optionsLoadingState` resolves truthy the option list
  // is replaced wholesale by a bootstrap spinner.
  selectMenuSpinner: ".table-select-custom-menu-list .spinner-border", // :100

  // ═════════ VARIANTS FACET — tagsV2 · rating (shipped-column specs) ═════════
  // Added by variants/tagsV2.cy.js and variants/rating.cy.js. Both specs drive a
  // column that the widget ALREADY ships (table.js:777 `interest` for tagsV2,
  // table.js:717 `id` for rating) instead of seeding data, so nothing below needs a
  // setTableData() prelude.

  // ---- rating: the Icon ToggleGroup (PropertiesTabElements.jsx:219-227) ----
  // ToggleGroupItem.jsx:31-35 puts the data-cy on a CHILD <div> of the Radix
  // ToggleGroup.Item, and Radix stamps `data-state="on"|"off"` on the Item itself —
  // so the pressed state is always one level ABOVE the addressable node.
  ratingIconToggleOption: (value) =>
    `[data-cy="rating-type-field"] [data-cy="togglr-button-${value}"]`, // ToggleGroupItem.jsx:33
  ratingIconToggleOptionActive: (value) =>
    `[data-cy="rating-type-field"] [data-state="on"] > [data-cy="togglr-button-${value}"]`,

  // ---- tagsV2: the Sort tags ToggleGroup (OptionsList.jsx:274-289) ----
  // Same shape as the rating Icon group; scoped to the Options/Tags accordion because
  // `togglr-button-none` would otherwise be ambiguous with other ToggleGroups.
  sortTagsOptionActive: (value) =>
    `.table-select-column-accordian [data-state="on"] > [data-cy="togglr-button-${value}"]`, // OptionsList.jsx:283-285

  // ---- rating: every icon's <svg>, for the UNSELECTED colour ----
  // cellRatingIconSvg (above) takes a single icon index; this is the whole set, which
  // is what an "every unselected icon is painted" assertion needs. The colour lands as
  // the svg `fill` ATTRIBUTE (icons/star.jsx:16), never as CSS.
  cellRatingIconSvgAll: (columnHeader, rowIndex, name = "table1") =>
    `[data-cy="${normalize(name)}-${normalize(
      columnHeader,
    )}-row-${rowIndex}"] span.rating-icon-widget svg`,

  // ---- tagsV2: the two mutually exclusive halves of the open tag menu ----
  // TagsInputMenuList.jsx:54 swaps the whole option list for a bootstrap-centred
  // <Loader> while `optionsLoadingState` resolves truthy, so these two are the
  // loading / loaded discriminators.
  tagsMenuBody: ".tags-input-menu-list .tags-input-menu-list-body", // TagsInputMenuList.jsx:56
  tagsMenuLoadingState: ".tags-input-menu-list > .text-center.py-4", // TagsInputMenuList.jsx:111
  // TagsRenderer.jsx:277 mounts the shared DropdownIndicator (SelectRenderer.jsx:161-165,
  // the only node carrying `.cell-icon-display`) ONLY when isEditable — its presence IS
  // the "Make editable" proof for a tags cell, exactly as it is for a select cell.
  cellTagsDropdownIcon: (columnHeader, rowIndex, name = "table1") =>
    `[data-cy="${normalize(name)}-${normalize(
      columnHeader,
    )}-row-${rowIndex}"] .cell-icon-display`,
  // TagsRenderer.jsx:472-480 — the validation message, rendered only while the column
  // is editable AND the adapter's customRule marked the cell invalid.
  cellTagsInvalidFeedback: (columnHeader, rowIndex, name = "table1") =>
    `[data-cy="${normalize(name)}-${normalize(
      columnHeader,
    )}-row-${rowIndex}"] .invalid-feedback`,

  // ═════════ VARIANTS FACET (variants/button.cy.js) ═════════
  // Added by the button column-variant spec. A button column renders ACTIONS, not a
  // value, so none of the cellContent* selectors above apply — everything below
  // addresses the <button> elements ButtonColumnGroupAdapter.jsx:18-60 emits inside
  // the cell, plus the two-level popover chrome.

  // PRODUCT BUG F37 (MED): the rendered action buttons carry NO data-cy, id or
  // distinguishing class of their own — ButtonColumnAdapter.jsx:96-108 mounts the
  // shared ui <Button> with only its cva utility classes, and the group wrapper
  // (ButtonColumnGroupAdapter.jsx:12-17) is a bare `div.h-100.d-flex`. A cell with two
  // buttons can therefore only be disambiguated POSITIONALLY or by label TEXT.
  cellActionButton: (columnHeader, rowIndex, name = "table1") =>
    `[data-cy="${normalize(name)}-${normalize(
      columnHeader,
    )}-row-${rowIndex}"] button`,
  // ButtonColumnGroupAdapter.jsx:12-17 — the flex row that holds every button of the
  // cell. Its presence proves the button renderer ran even when `buttons` is empty.
  cellActionButtonGroup: (columnHeader, rowIndex, name = "table1") =>
    `[data-cy="${normalize(name)}-${normalize(
      columnHeader,
    )}-row-${rowIndex}"] .td-container > div`,
  // ButtonColumnAdapter.jsx:113-118 — a button with a non-empty tooltip is wrapped in
  // an extra `<div style="display:flex">` inside an OverlayTrigger; without a tooltip
  // the <button> is a DIRECT child of the group. That extra div is the discriminator.
  cellActionButtonTooltipWrapper: (columnHeader, rowIndex, name = "table1") =>
    `[data-cy="${normalize(name)}-${normalize(
      columnHeader,
    )}-row-${rowIndex}"] .td-container > div > div`,
  // ButtonColumnAdapter.jsx:72 — TablerIcon renders a real <svg> inside the button,
  // and it is the ONLY svg a button column cell ever contains (the ui Button emits no
  // icon of its own here), so its count is the icon-visibility proof.
  cellActionButtonIcon: (columnHeader, rowIndex, name = "table1") =>
    `[data-cy="${normalize(name)}-${normalize(
      columnHeader,
    )}-row-${rowIndex}"] button svg`,
  // components/ui/utilComponents/loader.jsx:17 — `isLoading` swaps the button children
  // for this spinner (Button.jsx:168-183); the label survives as an invisible span.
  cellActionButtonSpinner: (columnHeader, rowIndex, name = "table1") =>
    `[data-cy="${normalize(name)}-${normalize(
      columnHeader,
    )}-row-${rowIndex}"] button .component-spinner`,

  // ---- Edit Button view: the EventManager mounted on the compound ref ----
  // ButtonPropertiesTab.jsx:107-132 mounts an EventManager with
  // customEventRefs.ref = `${column.key || column.name}::${button.id}` (:22). Every
  // selector below is SCOPED to the column popover because the table's own Events
  // accordion in the Inspector renders an identical, unscoped EventManager.
  columnPopoverAddEventHandler:
    '#table-column-popover-basic [data-cy="add-event-handler"]', // EventManager.jsx:1315
  columnPopoverEventHandlerCard:
    '#table-column-popover-basic [data-cy="event-handler-card"]', // EventManager.jsx:1204
  // EventManager.jsx:1358-1373 — rendered instead of a bare add button because
  // ButtonPropertiesTab passes hideEmptyEventsAlert={false} (:118).
  columnPopoverNoEventHandler:
    '#table-column-popover-basic [data-cy="no-event-handler-message"]', // EventManager.jsx:1359

  // ---- Edit Button > Styles: the icon picker (CodeBuilder/Elements/Icon.jsx) ----
  // Icon.jsx:107 puts the data-cy on the tabler <svg> itself, and Icon.jsx:121 renders
  // the icon NAME beside it inside `.icon-style-container`.
  // Both are popover-SCOPED: `icon-on-side-panel` / `icon-visibility-button` are emitted
  // by every Icon picker in the editor (the Inspector's own style accordions include
  // them for other widgets), so the bare data-cy is not unique on the page.
  buttonIconPickerIcon:
    '#table-column-popover-basic [data-cy="icon-on-side-panel"]', // Icon.jsx:107
  buttonIconPickerBox: "#table-column-popover-basic .icon-style-container", // Icon.jsx:93
  // Visibility.jsx:10 — the eye toggle; clicking it writes `{{true}}`/`{{false}}` into
  // buttonIconVisibility (ButtonStylesTab.jsx:126).
  buttonIconVisibilityToggle:
    '#table-column-popover-basic [data-cy="icon-visibility-button"]', // Visibility.jsx:10
};
