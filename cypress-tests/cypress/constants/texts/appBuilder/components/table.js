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
  optionDownloadPdf: "Download as PDF",

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
  // Added for the events facet — the remaining 4 triggers of config.events.
  eventRowExpanded: "Row expanded", // source: table.js:360
  eventDownloadData: "Download data", // source: table.js:369
  eventRefresh: "Refresh", // source: table.js:370
  eventHeaderClicked: "Header clicked", // source: table.js:371

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
  // Added for the events facet — one unique punctuation-free message per trigger.
  toastRowHovered: "row hovered",
  toastRowExpanded: "row expanded",
  toastSaveChanges: "save changes fired",
  toastCancelChanges: "cancel changes fired",
  toastDownloadData: "download data fired",
  toastRefresh: "refresh fired",
  toastHeaderClicked: "header clicked",

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
  // downloadTableData `type` param — table.js:619
  csaParamType: "Type",
  // setSort `direction` param — table.js:668
  csaParamOrder: "Order",

  // ---- downloadTableData `type` option NAMES (table.js:621-625) ----
  // The CSA select stores the option's `value` (xlsx | csv | pdf) but the combobox is
  // matched on its `name`, so these are the strings passed to setCSAParam.
  csaOptionDownloadExcel: "Download as Excel",
  csaOptionDownloadCsv: "Download as CSV",
  csaOptionDownloadPdf: "Download as PDF",

  // ---- setSort `direction` option NAMES (table.js:671-675) ----
  csaOrderAscending: "Ascending",
  csaOrderDescending: "Descending",
  csaOrderAuto: "Auto",

  // ---- downloadTableData export file naming (NewTable/_utils/exportData.js:99) ----
  // `${componentName}_${moment().format("DD-MM-YYYY_HH-mm")}` + extension, so the
  // timestamp is unknowable at spec-authoring time — assert on prefix + extension.
  exportFileNamePrefix: "table1_",
  exportExtensionCsv: ".csv",
  exportExtensionExcel: ".xlsx",
  exportExtensionPdf: ".pdf",

  // ---- property toggle display names (table.js:82,117,222,230,238) ----
  // tableSelector.toggleButton(<displayName>) -> `<slug>-toggle-button`.
  toggleAllowSelection: "Allow selection",
  toggleBulkSelection: "Bulk selection",
  toggleHighlightSelectedRow: "Highlight selected row",
  toggleEnablePagination: "Enable pagination",
  toggleEnableColumnSorting: "Enable column sorting",
  toggleEnableExpandableRows: "Enable expandable rows", // source: table.js:328
  toggleShowRefreshButton: "Show refresh button", // source: table.js:282
  toggleShowDownloadButton: "Show download button", // source: table.js:209

  labelDynamicColumn: "Use dynamic column",
  makeEditable: "Make editable",
  lableDisableActionButton: "Disable action button",

  // ═════════════ COLUMN MANAGER (Inspector › Table › Columns) ═════════════
  // Every string below is the literal displayName / label / option name rendered by
  // frontend/src/AppBuilder/RightSideBar/Inspector/Components/Table/**. Helpers turn these
  // into data-cy values via the cyLabel rule (SingleLineCodeEditor.jsx:687), so they must
  // match the source EXACTLY, including capitalisation.

  // ---- popover chrome (ColumnPopover.jsx) ----
  columnPopoverTitle: "Edit Column", // :116
  buttonDetailTitle: "Edit Button", // :117
  titleDuplicateColumn: "Duplicate column", // :128
  titleDeleteColumn: "Delete column", // :137
  titleDuplicateButton: "Duplicate button", // :128
  titleDeleteButton: "Delete button", // :137
  columnTabProperties: "Properties", // :149
  columnTabStyles: "Styles", // :157

  // ---- column type option order (PropertiesTabElements.jsx:124-149) ----
  // The dropdown is a react-select whose option list repeats labels ("Tags" at :131 AND
  // :148; "MultiSelect" :130 vs "Multiselect" :143 differ only in case), so text matching is
  // ambiguous — helpers select by INDEX. Index == position in the source options array.
  columnTypeOptionIndex: {
    string: 0,
    number: 1,
    text: 2,
    datepicker: 3,
    select: 4,
    newMultiSelect: 5,
    tagsV2: 6,
    boolean: 7,
    image: 8,
    link: 9,
    json: 10,
    markdown: 11,
    html: 12,
    rating: 13,
    button: 14,
    // deprecated types below this line
    default: 15,
    dropdown: 16,
    multiselect: 17,
    toggle: 18,
    radio: 19,
    badge: 20,
    badges: 21,
    tags: 22,
  },
  // The stored `columnType` VALUES (what setColumnType() takes), as opposed to
  // columnTypeLabel below (what the dropdown renders).
  columnTypeValue: {
    string: "string", // source: PropertiesTabElements.jsx:125
    select: "select", // source: PropertiesTabElements.jsx:129
    newMultiSelect: "newMultiSelect", // source: PropertiesTabElements.jsx:130
    tagsV2: "tagsV2", // source: PropertiesTabElements.jsx:131
    // DEPRECATED. Shares the LABEL "Tags" with tagsV2 (:131 vs :148) — the two are
    // only separable by their position in columnTypeOptionIndex (6 vs 22).
    tags: "tags", // source: PropertiesTabElements.jsx:148
    number: "number", // source: PropertiesTabElements.jsx:126
    text: "text", // source: PropertiesTabElements.jsx:127
    datepicker: "datepicker", // source: PropertiesTabElements.jsx:128
    json: "json", // source: PropertiesTabElements.jsx:135
    markdown: "markdown", // source: PropertiesTabElements.jsx:136
    html: "html", // source: PropertiesTabElements.jsx:137
    boolean: "boolean", // source: PropertiesTabElements.jsx:132
    image: "image", // source: PropertiesTabElements.jsx:133
    link: "link", // source: PropertiesTabElements.jsx:134
    rating: "rating", // source: PropertiesTabElements.jsx:138
    button: "button", // source: PropertiesTabElements.jsx:139
  },
  columnTypeLabel: {
    string: "String",
    number: "Number",
    text: "Text",
    datepicker: "Date Picker",
    select: "Select",
    newMultiSelect: "MultiSelect",
    tagsV2: "Tags",
    boolean: "Boolean",
    image: "Image",
    link: "Link",
    json: "JSON",
    markdown: "Markdown",
    html: "HTML",
    rating: "Rating",
    button: "Button",
  },

  // ---- rendered cell class per column type (TableRow.jsx:107-142) ----
  // ALL 15 types share ONE cell selector (`<table>-<column>-row-<i>`); the <td> class is the
  // only discriminator. `null` = the type adds NO class of its own, so verifyCellType cannot
  // assert it — assert the cell's inner control instead.
  cellClassByType: {
    string: "has-textarea", // :132
    text: "has-text", // :118
    number: "has-number", // :120
    datepicker: "has-datepicker", // :119
    select: "has-select", // :127
    newMultiSelect: "has-select", // :127
    tagsV2: "has-select", // :127
    link: "has-link", // :129
    button: "has-actions", // :111
    boolean: null,
    image: null,
    json: null,
    markdown: null,
    html: null,
    rating: null,
  },
  // The DEPRECATED `tags` type gets its OWN class, which is what separates it from
  // tagsV2 (`has-select`, :127) on the rendered side despite the shared dropdown label.
  cellClassDeprecatedTags: "has-tags", // source: TableRow.jsx:128
  cellClassSelector: "selector-column", // :126
  cellClassEditable: "isEditable", // :135
  cellClassEdited: "isEdited", // :136

  // ---- shared Properties-tab labels ----
  labelColumnType: "Column type", // PropertiesTabElements.jsx:120
  labelColumnName: "Column name", // :166
  labelKey: "Key", // :183
  labelTransformation: "Transformation", // :202
  defaultTransformation: "{{cellValue}}", // :205
  labelMakeEditable: "Make editable", // :397
  labelVisibility: "Visibility", // :261,:461
  labelFreezeColumn: "Freeze column", // :73
  labelIndent: "Indent", // :443
  labelOpenInNewTab: "Open in new tab", // :359
  labelDisplayText: "Display text", // :333
  labelDecimalPlaces: "Decimal Places", // :369
  labelIcon: "Icon", // :221
  labelMaxRating: "Max rating", // RatingColumnProperties.jsx:23
  labelDefaultRating: "Default rating", // :39
  labelAllowHalfRating: "Allow half rating", // :65

  // ---- pin / alignment toggle-group VALUES (not labels) ----
  pinLeft: "left", // PropertiesTabElements.jsx:76
  pinUnpinned: "unpinned", // :79 (default)
  pinRight: "right", // :82
  alignLeft: "left", // StylesTabElements.jsx:41 (default)
  alignCenter: "center", // :44
  alignRight: "right", // :47
  // StylesTabElements.jsx:32-34 — the alignment label text flips per column type.
  labelTextAlignment: "Text Alignment",
  labelAlignment: "Alignment", // boolean | image | rating

  // ---- Styles-tab labels ----
  labelTextColor: "Text color", // StylesTabElements.jsx:158,:192
  labelCellColor: "Cell color", // :173,:276
  labelUnderlineColor: "Underline color", // :206
  labelShowUnderline: "Show underline", // :216
  underlineHover: "hover", // :223 (default)
  underlineAlways: "always", // :224
  labelActiveColor: "Active color", // :57 (deprecated toggle type)
  labelChecked: "Checked", // :110 (boolean)
  labelUnchecked: "Unchecked", // :121 (boolean)
  labelSelectedColor: "Selected color", // :243 (rating)
  labelUnselectedColor: "Unselected color", // :257 (rating)
  labelBorderRadius: "Border radius", // :70 (image) / ButtonStylesTab.jsx:176
  labelImageFit: "Image fit", // :83
  // PRODUCT BUG F5: "Selected color" writes selectedBgColorStars when iconType === 'stars'
  // and selectedBgColorHearts otherwise (StylesTabElements.jsx:240) — the data-cy is the same
  // either way, so the helper must be told which iconType is active.
  ratingIconStars: "stars", // RatingIconToggle.jsx:16
  ratingIconHearts: "hearts", // :19

  // ---- validation labels (ValidationProperties.jsx) — F1: label text is the ONLY hook ----
  labelRegex: "Regex", // :43
  labelMinLength: "Min length", // :52
  labelMaxLength: "Max length", // :58
  labelMinValue: "Min value", // :80
  labelMaxValue: "Max value", // :86
  labelCustomRule: "Custom rule", // :66,:93,:105,:158
  labelMinimumDate: "Minimum date", // :117
  labelMaximumDate: "Maximum date", // :123
  labelMinimumTime: "Minimum time", // :135
  labelMaximumTime: "Maximum time", // :141
  labelDisabledDates: "Disabled dates", // :150

  // ---- options list: select / newMultiSelect / tagsV2 (SelectOptionsList/OptionsList.jsx) ----
  labelOptionLabel: "Option label", // :184
  labelOptionValue: "Option value", // :202
  labelLabelColor: "Label color", // :227
  labelOptionColor: "Option color", // :240
  labelMakeDefaultOption: "Make this option as default", // :255
  labelAutoAssignColors: "Auto assign colors", // :301
  labelAllowMultipleSelection: "Allow multiple selection", // :317
  labelDynamicOption: "Dynamic option", // :333
  labelOptionsLoadingState: "Options loading state", // :363
  labelSortTags: "Sort tags", // :277
  sortTagsNone: "none", // :283 (default)
  sortTagsAsc: "a-z", // :284
  sortTagsDesc: "z-a", // :285
  buttonAddNewOption: "Add new option", // :441
  buttonAddNewTag: "Add new tag", // :441 (tagsV2)
  // OptionsList.jsx:64-71 — createNewOption names options `Option 1`, `Option 2`, …
  defaultOptionNamePrefix: "Option",

  // ---- button column (ButtonListManager / ButtonPropertiesTab / ButtonStylesTab) ----
  buttonAddNewActionButton: "Add new action button", // ButtonListManager.jsx:114
  labelNoActionButton: "No action button added", // :90
  defaultActionButtonLabel: "Button", // useButtonManager.js:5
  labelButtonLabel: "Button label", // ButtonPropertiesTab.jsx:27
  labelButtonTooltip: "Tooltip", // :42
  labelLoadingState: "Loading state", // :67
  labelDisableActionButton: "Disable action button", // :101
  labelButtonType: "Button type", // ButtonStylesTab.jsx:47
  buttonTypeSolid: "solid", // :49 (default)
  buttonTypeOutline: "outline", // :50
  labelBackground: "Background", // :66
  labelLabelColorButton: "Label color", // :83
  labelBorderColor: "Border color", // :99
  labelLoaderColor: "Loader color", // :115
  // ButtonStylesTab.jsx:144 mounts Icon color with displayName '' → its picker collapses to
  // `undefined-picker` (F3). Pass an empty label + index to setColumnColor.
  labelIconColorUnnamed: "",
  buttonIconAlignLeft: "left", // :156
  buttonIconAlignRight: "right", // :159

  // ---- datepicker column (DatepickerProperties.jsx) ----
  labelEnableDate: "Enable date", // :109
  labelDateFormat: "Date format", // :121
  labelEnableTime: "Enable time", // :179
  labelEnable24HrFormat: "Enable 24 hr time format", // :218
  labelTimeZone: "Time zone", // :229
  labelParseInUnixTimestamp: "Parse in unix timestamp", // :265
  labelUnixTimestamp: "Unix timestamp", // :271
  labelParseDate: "Date", // :294
  labelParseTimeZone: "Time zone", // :365
  // The two single-option time selects. Neither carries a data-cy of its own, so both are
  // addressed by these <label> texts. NOTE the DISPLAY one reads "Time Format" (:186) while
  // the PARSE one reads plain "Time" (:342) — the i18n KEY is the same
  // (`widget.Table.timeFormat`) for both, only the fallback differs.
  labelTimeFormatDisplay: "Time Format", // :186
  labelParseTimeFormat: "Time", // :342
  // The four DATE_FORMAT_OPTIONS in menu order (:49-66) — the whole option set of BOTH
  // format selects (display :150 and parse :323).
  dateFormatOptions: ["DD/MM/YYYY", "MM/DD/YYYY", "YYYY/DD/MM", "YYYY/MM/DD"], // :49-66
  // The two UNIX_TIMESTAMP_OPTIONS labels in menu order (:68-77).
  unixTimestampOptions: ["s", "ms"], // :68-77
  dateFormatDdMmYyyy: "DD/MM/YYYY", // :51 (default)
  dateFormatMmDdYyyy: "MM/DD/YYYY", // :55
  dateFormatYyyyDdMm: "YYYY/DD/MM", // :59
  dateFormatYyyyMmDd: "YYYY/MM/DD", // :63
  timeFormatHhMm: "HH:mm", // :190
  unixSeconds: "s", // :71
  unixMilliseconds: "ms", // :75

  // ---- new-column naming (listItemHelpers.js:10-24 + useColumnManager.js:109) ----
  newColumnNamePrefix: "new_column",
  firstNewColumnName: "new_column1",

  // ═════════ PROPERTIES FACET — remaining toggle displayNames ═════════
  // Every value is the config `displayName` verbatim; tableSelector.toggleButton() /
  // toggleTableProperty() slug it to `<displayName>-toggle-button`.
  toggleUseDynamicColumn: "Use dynamic column", // source: table.js:50
  toggleLockColumnSchema: "Lock column schema", // source: table.js:58
  toggleEnableNextPageButton: "Enable next page button", // source: table.js:85
  toggleEnablePrevPageButton: "Enable previous page button", // source: table.js:109
  toggleHideColumnSelectorButton: "Hide column selector button", // source: table.js:101
  toggleShowSearch: "Show search", // source: table.js:201
  toggleEnableFiltering: "Enable filtering", // source: table.js:217
  toggleShowUpdateButtons: "Show update buttons", // source: table.js:225
  toggleDisableRowDeselection: "Disable row deselection", // source: table.js:257
  toggleShowAddNewRowButton: "Show add new row button", // source: table.js:276
  toggleSelectRowOnCellEdit: "Select row on cell edit", // source: table.js:292
  toggleLoadingState: "Loading state", // source: table.js:38
  toggleVisibility: "Visibility", // source: table.js:300
  toggleCollapseWhenHidden: "Collapse when hidden", // source: table.js:308
  toggleDisable: "Disable", // source: table.js:314
  toggleDynamicHeight: "Dynamic height", // source: table.js:321

  // ═════════ PROPERTIES FACET — code / number field displayNames ═════════
  paramColumnData: "Column data", // source: table.js:67
  paramRowsPerPage: "Number of rows per page", // source: table.js:76 (and :124 server side)
  paramTotalRecords: "Total records server side", // source: table.js:116
  paramDefaultSelectedRow: "Default selected row", // source: table.js:265
  paramExpandedRowHeight: "Expanded row height", // source: table.js:338

  // ═════════ PROPERTIES FACET — clientServerSwitch ═════════
  // All FOUR clientServerSwitch fields share displayName 'Type' AND the option data-cy
  // values below, so they are only distinguishable by owning accordion (+ index in it).
  switchOptionClientSide: "clientSide", // source: table.js:142
  switchOptionServerSide: "serverSide", // source: table.js:143

  // ═════════ PROPERTIES FACET — dataSourceSelector ═════════
  sourceRawJson: "Raw JSON", // source: table.js:17

  // ═════════ Table inspector accordion titles ═════════
  // Inspector/Components/Table/Table.jsx:474-745. ALL render EXPANDED by default
  // (_ui/Accordion/AccordionItem.js:5 — `open = true` when `isOpen` is undefined).
  accordionData: "Data",
  accordionColumns: "Columns",
  accordionRowSelection: "Row Selection",
  accordionSearchSortFilter: "Search, sort and filter",
  accordionPagination: "Pagination",
  accordionAdditionalActions: "Additional actions",

  // ═════════ STYLES FACET — display names & option labels ═════════
  // All from config.styles (WidgetManager/widgets/table.js:373-537). The three
  // `accordian` groups, then one entry per style displayName and per switch/select
  // option label. Option labels are what the user clicks; the stored VALUE (which
  // the runtime maps to a class / CSS value) is noted in the comment.
  styleAccordionColumnHeader: "Column Header", // source: table.js:378
  styleAccordionData: "Data", // source: table.js:412
  styleAccordionContainer: "Container", // source: table.js:505

  styleColumnTitle: "Column title", // source: table.js:374
  styleOverflow: "Overflow", // source: table.js:380
  styleOverflowNone: "None", // value 'fixed'  — source: table.js:386
  styleOverflowWrap: "Wrap", // value 'wrap'   — source: table.js:387
  styleHeaderCasing: "Header casing", // source: table.js:390
  styleHeaderCasingAsTyped: "As typed", // value 'none'      — source: table.js:396
  styleHeaderCasingUppercase: "AA", // value 'uppercase' — source: table.js:397
  styleBackground: "Background", // columnBackgroundColor :400 AND containerBackgroundColor :501

  styleText: "Text", // source: table.js:406
  styleSelectedRow: "Selected row", // source: table.js:415
  styleRowStyle: "Row style", // source: table.js:424
  styleRowStyleRegular: "Regular", // value 'table-classic'  — source: table.js:428
  styleRowStyleBordered: "Bordered", // value 'table-bordered' — source: table.js:429
  styleRowStyleStriped: "Striped", // value 'table-striped'  — source: table.js:430
  styleCellHeight: "Cell height", // source: table.js:438
  styleCellHeightRegular: "Regular", // value 'regular'   — source: table.js:442
  styleCellHeightCondensed: "Condensed", // value 'condensed' — source: table.js:443
  // contentWrap ships showLabel:false, so Inspector/Elements/Code.jsx:82 falls back
  // to `param.name.toLowerCase()` for its data-cy — NOT the toggleLabel text.
  styleContentWrapParam: "contentwrap", // source: table.js:450-452
  styleContentWrapLabel: "Content wrap", // toggleLabel — source: table.js:452
  styleMaxRowHeight: "Max row height", // source: table.js:460
  styleMaxRowHeightAuto: "Auto", // value 'auto'   — source: table.js:466
  styleMaxRowHeightCustom: "Custom", // value 'custom' — source: table.js:467
  // maxRowHeightValue is also showLabel:false → cyLabel = param name lowercased.
  styleMaxRowHeightValueParam: "maxrowheightvalue", // source: table.js:474-475
  styleActionButtonRadius: "Action button radius", // source: table.js:493

  styleBorderRadius: "Border radius", // source: table.js:507
  styleBorder: "Border", // source: table.js:513
  styleBoxShadow: "Box Shadow", // source: table.js:522
  stylePadding: "Padding", // source: table.js:528
  stylePaddingDefault: "Default", // value 'default' — source: table.js:533
  stylePaddingNone: "None", // value 'none'    — source: table.js:534

  // ---- colour-picker VALUE row labels for the shipped definition defaults ----
  // BaseColorSwatches/index.jsx:153-157 renders `colorMap[value]` — the map is
  // built as `var(--cc-<type>-<category>)` -> `<Category>/<Type>`
  // (ee/modules/Appbuilder/components/ColorSwatches/ColorSwatches.jsx:36-46), and
  // every token below exists in the default theme (_stores/utils.js:681-760).
  colorTokenTextPrimary: "Text/Primary", // var(--cc-primary-text)
  colorTokenSurface1: "Surface/Surface1", // var(--cc-surface1-surface)
  colorTokenSurface2: "Surface/Surface2", // var(--cc-surface2-surface)
  colorTokenBorderWeak: "Border/Weak", // var(--cc-weak-border)

  // ---- rendered style defaults ----
  // TableData.jsx:14-15 DEFAULT_ROW_HEIGHT 46 / CONDENSED_ROW_HEIGHT 40.
  defaultRowHeightRegular: "46px",
  rowHeightCondensed: "40px",
  // Table.jsx:355 `borderRadius: Number.parseFloat(borderRadius)` of '6' (table.js:861).
  defaultBorderRadius: "6px",
  // RenderWidget.jsx:320 — padding 'default' -> BOX_PADDING (appCanvasConstants.js:57).
  defaultWidgetPadding: "2px",
  noWidgetPadding: "0px",
  // TableRowHeightInput.jsx:4-10 clamps the {{0}} definition default (table.js:865)
  // up to MIN_TABLE_ROW_HEIGHT_DEFAULT when cellSize is 'regular'.
  defaultMaxRowHeightValue: "45",

  // ═════════ PROPERTIES FACET — dynamic-column expectations ═════════
  // columnData default (table.js:697-700) generates exactly these two headers.
  dynamicColumnHeaderEmail: "email",
  dynamicColumnHeaderFullName: "Full name",
  // A one-column override typed back into `Column data` to prove the field drives the
  // generated schema (autoGenerateColumns.js:12-27 maps each entry to a column).
  dynamicColumnDataOverride: "{{[{name: 'Contact', key: 'email', id: '1'}]}}",
  dynamicColumnOverrideHeader: "Contact",

  // ═════════ PROPERTIES FACET — probe datasets & override values ═════════
  // Raw `data` expressions (WITHOUT the {{ }} wrapper — setTableData adds it) used to
  // prove autogenerateColumns / Lock column schema.
  schemaProbeData: "[{ id: 1, name: 'A', score: 10 }]",
  schemaProbeDataExtended: "[{ id: 1, name: 'A', score: 10, city: 'Paris' }]",
  schemaProbeColumn: "score",
  schemaProbeExtraColumn: "city",
  // RowCount.jsx:13-14 renders `${count} Records`.
  recordsSuffix: " Records",
  // A surname shared by exactly two rows of the seed dataset (ids 3 and 10).
  filterSharedSurname: "Reyes",
  // Deliberate, non-config override values for the modify-then-assert legs.
  rowsPerPageOverride: 4,
  serverSideRowsPerPageOverride: 5,
  totalRecordsOverride: 20,
  expansionHeightOverride: 300,
  // ═════════ PROPERTIES-FX FACET — displayNames the fx facet needs ═════════
  // Every string is the config `displayName` verbatim; the fx / label / input data-cy
  // are all derived from it by SingleLineCodeEditor.jsx:687
  // (`toLowerCase().trim().replace(/\s+/g,'-')`).
  paramDataSource: "Data source", // source: table.js:16
  paramTableColumns: "Table Columns", // source: table.js:46
  paramTitle: "Title", // source: table.js:9
  paramActionButtonBackgroundColor: "Background color", // source: table.js:185
  paramActionButtonTextColor: "Text color", // source: table.js:193
  // All FOUR clientServerSwitch fields share this displayName, which is exactly why
  // SingleLineCodeEditor.jsx:699 refuses to render an fx button for any of them.
  paramSwitchType: "Type", // source: table.js:135/147/159/171

  // ═════════ PROPERTIES-FX FACET — binding expressions & resolved results ═════════
  // Deliberately COMPUTED expressions (never `{{true}}` / `{{'literal'}}`), so each leg
  // proves the binding is evaluated rather than echoed. They are typed with a native
  // `.type(..., {parseSpecialCharSequences:false})`, so `{`, `}`, `=>` and `+` all reach
  // the editor intact (clearAndTypeOnCodeMirror's tokenizer would drop `=` and `!`).

  // dataSourceSelector — must still resolve to 'rawJson' so `data`'s conditionallyRender
  // gate (table.js:31-34) stays satisfied.
  fxDataSourceRawJson: "{{['rawJson'][0]}}",

  // data — setTableData adds the `{{ }}` wrapper itself, so this is the bare expression.
  fxDataExpression:
    "[1,2,3].map((n) => ({ id: n, name: 'Row ' + n, email: 'row' + n + '@mail.com' }))",
  fxDataRows: [
    { id: 1, name: "Row 1", email: "row1@mail.com" },
    { id: 2, name: "Row 2", email: "row2@mail.com" },
    { id: 3, name: "Row 3", email: "row3@mail.com" },
  ],

  // columnData — autoGenerateColumns.js:12-27 maps each entry to one rendered column,
  // so the two generated headers are `email` and `name`.
  fxColumnDataExpression:
    "{{['email', 'name'].map((k, i) => ({ name: k, key: k, id: String(i) }))}}",

  // rowsPerPage / serverSideRowsPerPage — setRowsPerPage adds the `{{ }}` wrapper.
  fxRowsPerPageExpression: "[1,2,3].length",
  fxRowsPerPageResolved: 3,
  fxServerSideRowsPerPageExpression: "[1,2,3,4,5].length",

  // totalRecords — RowCount.jsx:14 renders `${totalRecords} Records` in server-side mode.
  fxTotalRecordsExpression: "{{[1,2,3,4,5,6,7,8].length}}",
  fxTotalRecordsResolved: 8,

  // defaultSelectedRow — an ARRAY-INDEX expression, so it can only match seed row id 3
  // (row index 2) if it is actually evaluated (TableExposedVariables.jsx:268-273).
  fxDefaultSelectedRowExpression: "{{[{ id: 3 }][0]}}",

  // expansionHeight — ExpandedRowContainer.jsx:38 writes the resolved number as an
  // inline `height: <n>px`.
  fxExpansionHeightExpression: "{{100 * 3}}",
  fxExpansionHeightResolved: 300,

  // ═════════ VARIANTS FACET — string / text column types ═════════
  // Used by variants/string.cy.js and variants/text.cy.js. The shipped default
  // `columns` array ALREADY contains a `name` column whose columnType is 'string'
  // (table.js:734-742), so both specs drive that real, data-bound column and only
  // create a fresh one where column creation itself is under test.
  variantSeedColumn: "name", // source: table.js:736
  variantSeedColumnKey: "name", // source: table.js:737
  variantSeedCellValue: "Olivia Nguyen", // source: table.js:692 (row 0, key `name`)
  variantSeedCellValueUpper: "OLIVIA NGUYEN",
  // The `email` column of the same seed row — used to prove the Key field rebinds.
  variantAltKey: "email", // source: table.js:749
  variantAltCellValue: "olivia.nguyen@example.com", // source: table.js:692

  // Column names typed into the popover's "Column name" field. Kept lowercase and
  // punctuation-free on purpose: the column list data-cy is NOT normalised
  // (F19 — Table.jsx:571) while the rendered header/cell data-cy IS
  // (generateCypressDataCy), so a single token keeps both spellings identical.
  variantNewStringColumn: "strcol",
  variantNewTextColumn: "txtcol",
  variantRenamedColumn: "renamedcol",

  // Transformation (PropertiesTabElements.jsx:200-218). Only tokens the
  // clearAndTypeOnCodeMirror tokenizer keeps — `{`, `}`, `(`, `)` and word chars.
  variantTransformationUpper: "{{cellValue.toUpperCase()}}",

  // ---- validation inputs + the EXACT message validateWidget renders ----
  // Values are chosen so every character survives clearAndTypeOnCodeMirror's
  // tokenizer (commands/appbuilder/codemirrorCommands.js:29) — no `^`, `$`, `+`,
  // `<`, `>`, `?` or `!`, all of which are silently dropped before typing.
  variantMinLength: "{{50}}",
  variantMinLengthError: "Minimum 50 characters is needed", // source: _helpers/utils.js:424
  variantMaxLength: "{{4}}",
  variantMaxLengthError: "Maximum 4 characters is allowed", // source: _helpers/utils.js:433
  // "must contain a digit" — the seed value 'Olivia Nguyen' has none, so the cell
  // is invalid whenever the regex is actually applied.
  variantRegex: "[0-9]",
  variantRegexError: "The input should match pattern", // source: _helpers/utils.js:415
  // customRule resolving to a NON-EMPTY STRING is the failure signal, and the
  // string itself becomes the message (_helpers/utils.js:457-460). Deriving it
  // from cellValue proves the rule is evaluated against the real cell.
  variantCustomRule: "{{cellValue.slice(0,6)}}",
  variantCustomRuleError: "Olivia", // 'Olivia Nguyen'.slice(0,6) — source: table.js:692

  // ---- colour defaults + probe colours ----
  variantDefaultTextColor: "#11181C", // source: ProgramaticallyHandleProperties.jsx:38
  // cellBackgroundColor defaults to var(--cc-surface1-surface)
  // (ProgramaticallyHandleProperties.jsx:35); BaseColorSwatches renders the token
  // NAME, which is already available as colorTokenSurface1 above.
  variantTextColorRgba: ["255", "0", "0", "100"],
  variantCellColorRgba: ["0", "0", "255", "100"],

  // columnVisibility fx default (ProgramaticallyHandleProperties.jsx:22).
  variantDefaultColumnVisibility: "{{true}}",
  variantHiddenColumnVisibility: "{{false}}",

  // ---- rendered <td> classes the variants assert (TableRow.jsx:107-142) ----
  cellClassPinnedLeft: "pinned-column-left", // source: TableRow.jsx:138
  cellClassAlignCenter: "table-text-align-center", // source: TableRow.jsx:114

  // ═════════ VARIANTS FACET — json · markdown · html column types ═════════
  // Used by variants/json.cy.js, variants/markdown.cy.js and variants/html.cy.js.
  // NONE of these three types is covered by docs/docs/widgets/table/columns.md (it
  // documents 9 of the 15 current types), so every literal below is derived from
  // SOURCE only — the renderer files are cited inline.
  //
  // Each spec seeds its own dataset with setTableData(): "Lock column schema"
  // (autogenerateColumns) drops OFF, so a fresh dataset regenerates the column list
  // and the spec then only has to switch that generated column's type.

  // ---- datasets (bare expressions — setTableData() adds the {{ }} wrapper) ----
  variantJsonData:
    "[{ id: 1, config: { name: 'Ada', age: 36 } }, { id: 2, config: { name: 'Grace', age: 45 } }]",
  variantMarkdownData:
    "[{ id: 1, doc: '**Ada** was here' }, { id: 2, doc: '**Grace** was here' }]",
  variantHtmlData:
    "[{ id: 1, snippet: '<b>Ada</b> Lovelace' }, { id: 2, snippet: '<b>Grace</b> Hopper' }]",

  // ---- the auto-generated column each dataset produces (name === key) ----
  variantJsonColumn: "config",
  variantMarkdownColumn: "doc",
  variantHtmlColumn: "snippet",

  // ---- names typed into "Column name" when column CREATION is under test ----
  // Single lowercase tokens on purpose: the column-list data-cy is NOT normalised
  // (F19 — Table.jsx:571) while the rendered header/cell data-cy IS, so a single
  // token keeps both spellings identical.
  variantNewJsonColumn: "jsoncol",
  variantNewMarkdownColumn: "mdcol",
  variantNewHtmlColumn: "htmlcol",

  // ---- Key-rebind probe: every dataset also carries `id`, whose row-0 value is 1 ----
  variantRebindValueRow0: "1",

  // ---- JSON rendering (JSONRenderer.jsx:41-71) ----
  // jsonIndentation FALSE -> format(): `{  "k":  v,  "k":  v  }` (two spaces
  // everywhere, single line) — JSONRenderer.jsx:45-51.
  variantJsonCompactRow0: '{  "name":  "Ada",  "age":  36  }',
  // jsonIndentation TRUE -> JSON.stringify(v, null, 4).replace(/":/g, '":  '),
  // i.e. a 4-space indent AND a THIRD space after every key — JSONRenderer.jsx:57.
  // Asserted as a fragment because the newline + indent is the whole point.
  variantJsonIndentedFragmentRow0: '\n    "name":   "Ada"',
  // Mode-independent proof that the value was SERIALISED at all (a non-json column
  // renders the same object as "[object Object]", which contains no quoted key).
  variantJsonSerialisedKeyRow0: '"name"',
  variantJsonSerialisedValueRow0: '"Ada"',
  // Indent fx default — ProgramaticallyHandleProperties.jsx:57-59.
  variantIndentOn: "{{true}}",
  variantIndentOff: "{{false}}",
  // Transformation that reduces the object to one of its own fields, proving the
  // transformation runs against the real cellValue (transformTableData.js:32-36).
  variantJsonTransformation: "{{cellValue.name}}",
  variantJsonTransformedRow0: "Ada",

  // ---- Markdown rendering (MarkdownRenderer.jsx:146-153) ----
  variantMarkdownBoldRow0: "Ada",
  variantMarkdownPlainRow0: "Ada was here",
  variantMarkdownSourceRow0: "**Ada** was here",
  variantMarkdownTransformedBoldRow0: "ADA",
  variantMarkdownTransformedPlainRow0: "ADA WAS HERE",

  // ---- HTML rendering (HTMLRenderer.jsx:149-156) ----
  variantHtmlBoldRow0: "Ada",
  variantHtmlPlainRow0: "Ada Lovelace",
  variantHtmlSourceRow0: "<b>Ada</b> Lovelace",
  variantHtmlTransformedPlainRow0: "ADA LOVELACE",

  // ---- rendered <td> classes these three specs assert (TableRow.jsx:107-142) ----
  // horizontalAlignment defaults to 'left' (generateColumnsData.js:179).
  cellClassAlignLeft: "table-text-align-left", // source: TableRow.jsx:116
  // pinPosition 'left' — the generic marker plus the side-specific one.
  cellClassPinned: "pinned-column", // source: TableRow.jsx:137
  // TableRow.jsx:118 ORs `columnType === 'text'` with `isEditable`, so ANY editable
  // column — json/markdown/html included — picks up `has-text`.
  cellClassEditableText: "has-text", // source: TableRow.jsx:118

  // ═════════ VARIANTS FACET — text column type ═════════
  // Used by variants/text.cy.js. `text` and `string` are adjacent branches of the
  // SAME switch case in ValidationProperties (:34-37) and sit in the same
  // StylesTabElements type list (:131-144), so `text` reuses every seed-column
  // literal declared in the string block above (variantSeedColumn / …CellValue /
  // …Upper / variantAltKey / variantMinLength / variantRegex / …). Only what
  // `text` genuinely changes is declared here.

  // PRODUCT BUG F2 (MED): ValidationProperties.jsx:39 tries to hide Regex from
  // `text` columns with `if (item.itemType !== 'text')`, but a COLUMN object
  // carries `columnType` and never `itemType` (the value is passed separately as
  // the `itemType` PROP and switched on at :33), so the guard never fires. The
  // array below is the EXACT ordered set of validation <label> texts a `text`
  // column actually renders (:39-68) — Regex included. Asserting it is how
  // variants/text.cy.js documents the bug instead of hiding it.
  variantTextValidationLabels: [
    "Regex", // source: ValidationProperties.jsx:43 (should NOT render — F2)
    "Min length", // source: ValidationProperties.jsx:52
    "Max length", // source: ValidationProperties.jsx:58
    "Custom rule", // source: ValidationProperties.jsx:66
  ],

  // ═════════ VARIANTS FACET — number column type ═════════
  // Used by variants/number.cy.js.
  //
  // WHY THE AUTO-GENERATED `phone` COLUMN IS THE SEED: the shipped `columns`
  // default declares a number column keyed `mobile_number` (table.js:768) but the
  // shipped dataset has no such key — row 0 carries `phone: 9876543210`
  // (table.js:692). autoGenerateColumns.js:90-105 keeps an `autogenerated` column
  // only while its key is still present in the data, so `mobile_number` is
  // DROPPED, and :85-100 generates a fresh column for the unmatched `phone` key
  // whose columnType is `convertDataTypeToColumnType(typeof 9876543210)` =
  // 'number' (:110-119). That generated column is therefore a real, data-bound
  // `number` column — already proven to exist at runtime by inspector.cy.js:98.
  variantNumberColumn: "phone", // source: autoGenerateColumns.js:94-100 (key table.js:692)
  variantNumberColumnKey: "phone", // source: table.js:692
  variantNumberDroppedColumn: "mobile_number", // source: table.js:768 (dropped — :90-92)
  variantNumberCellValueRow0: "9876543210", // source: table.js:692 (row 0, key `phone`)
  // The `id` key of the same seed row — used to prove the Key field rebinds.
  variantNumberAltKey: "id", // source: table.js:692
  variantNumberAltCellValueRow0: "1", // source: table.js:692

  // Name typed into "Column name" when column CREATION is under test. Single
  // lowercase token on purpose (F19 — the column-list data-cy is NOT normalised
  // while the rendered header/cell data-cy IS).
  variantNewNumberColumn: "numcol",

  // Transformation. `/` is SILENTLY DROPPED by clearAndTypeOnCodeMirror's
  // tokenizer (codemirrorCommands.js:29 keeps only { } ( ) [ ] , : ; => * quoted
  // strings, [a-zA-Z0-9._#-]+ and whitespace), so a division would be typed as
  // `{{cellValue10}}`. `*` IS kept, hence the doubling.
  variantNumberTransformation: "{{cellValue*2}}",
  variantNumberTransformedRow0: "19753086420", // 9876543210 * 2

  // Inline-edit probe. NumberRenderer.jsx:144-172 renders a real
  // <input type="number">, so this is asserted with have.value, not have.text.
  variantNumberEditedValue: "4242",
  // getInputStep(null) — no decimalPlaces set (NumberRenderer.jsx:10-22, :157).
  variantNumberDefaultStep: "any",

  // ---- validations: number swaps minLength/maxLength for minValue/maxValue ----
  // (ValidationProperties.jsx:74-96). Values chosen so every character survives
  // the clearAndTypeOnCodeMirror tokenizer.
  // `[a-z]` never matches String(9876543210), so the cell is invalid whenever the
  // regex is genuinely applied.
  // The EXACT ordered set of validation <label> texts a `number` column renders
  // (ValidationProperties.jsx:74-96). Number swaps string/text's Min length +
  // Max length for Min value + Max value, and — unlike `text` (F2) — its Regex
  // entry is intentional (:75).
  variantNumberValidationLabels: [
    "Regex", // source: ValidationProperties.jsx:75
    "Min value", // source: ValidationProperties.jsx:80
    "Max value", // source: ValidationProperties.jsx:86
    "Custom rule", // source: ValidationProperties.jsx:93
  ],
  variantNumberRegex: "[a-z]",
  variantNumberRegexError: "The input should match pattern", // source: _helpers/utils.js:415
  variantMinValue: "{{9999999999}}", // > 9876543210, so row 0 fails
  variantMinValueError: "Minimum value is 9999999999", // source: _helpers/utils.js:443
  variantMaxValue: "{{100}}", // < 9876543210, so row 0 fails
  variantMaxValueError: "Maximum value is 100", // source: _helpers/utils.js:453
  // PRODUCT BUG F28 (MED) — maxValue MUST be a literal: _helpers/utils.js:448
  // calls resolveWidgetFieldValue(maxValue, currentState, undefined,
  // customResolveObjects) with FOUR arguments against the three-parameter
  // signature (prop, _default, customResolveObjects) declared at :386, so
  // `customResolveObjects` receives `undefined` and `cellValue` is never injected
  // for maxValue. minValue (:438) and customRule (:459) pass three arguments and
  // resolve `cellValue` correctly.
  variantNumberCustomRule: "{{cellValue.toString().slice(0,4)}}",
  variantNumberCustomRuleError: "9876", // '9876543210'.slice(0,4) — source: table.js:692

  // ---- decimalPlaces probe dataset ----
  // The shipped `phone` value is an INTEGER, and removingExcessDecimalPlaces
  // (NumberRenderer.jsx:27-34) returns the value untouched when it has no '.', so
  // decimalPlaces has no observable effect on the seed data. This dataset gives it
  // one. setTableData() adds the `{{ }}` wrapper.
  variantNumberDecimalData:
    "[{ id: 1, amount: 3.14159 }, { id: 2, amount: 2.71828 }]",
  // autoGenerateColumns.js:94-100 names the generated column after its key, and
  // typeof 3.14159 === 'number' → columnType 'number' (:110-119).
  variantDecimalColumn: "amount",
  variantDecimalRawRow0: "3.14159",
  variantDecimalPlaces: "{{2}}", // PropertiesTabElements.jsx:374 placeholder
  variantDecimalTruncatedRow0: "3.14", // source: NumberRenderer.jsx:27-34, :73
  // ---- additions for variants/json.cy.js · variants/html.cy.js ----
  // Inline-edit probe for a json cell. Deliberately BRACE-FREE: cy.type() would read a
  // `{...}` sequence as a special key and throw, and JSONRenderer.handleChange only
  // commits when JSON.parse succeeds (JSONRenderer.jsx:73-82) — `42` parses, plain
  // prose does not. After the edit the stored value is the string "42" and format()
  // renders it back as `42` (JSONRenderer.jsx:41-51).
  variantJsonEditedValue: "42",
  // '<b>Ada</b> Lovelace'.toUpperCase() → '<B>ADA</B> LOVELACE'; DOMPurify lower-cases
  // the tag while leaving the text upper-cased, so the <b> survives with this text.
  variantHtmlTransformedBoldRow0: "ADA", // source: HTMLRenderer.jsx:41-51

  // ═════════ VARIANTS FACET — boolean · image column types ═════════
  // Used by variants/boolean.cy.js and variants/image.cy.js. These two types are
  // the ONLY ones that DROP shared style controls, so half of each spec is an
  // ABSENCE assertion (boolean: no Text color; image: no Text color, no Cell
  // color, no Make editable). Every literal below is source-cited inline.

  // ---- boolean dataset ----------------------------------------------------
  // The shipped seed data (table.js:692) has NO boolean field, so boolean.cy.js
  // seeds its own with setTableData() (which adds the `{{ }}` wrapper). Because
  // `autogenerateColumns` ships ON (table.js:713), a fresh dataset regenerates the
  // column list — and `typeof true === 'boolean'` maps STRAIGHT to columnType
  // 'boolean' (autoGenerateColumns.js:110-119), so the generated `flag` column IS
  // already a boolean column. Row 0 is true and row 1 is false so that the checked
  // AND unchecked renderer branches are both reachable in one dataset; `active` is
  // the inverse of `flag`, which is what the Key-rebind test flips to.
  variantBooleanData:
    "[{ id: 1, flag: true, active: false }, { id: 2, flag: false, active: true }]",
  variantBooleanColumn: "flag", // autoGenerateColumns.js:96 (name === key)
  variantBooleanAltKey: "active",
  variantNewBooleanColumn: "boolcol",
  variantRenamedBooleanColumn: "renamedbool",
  // A constant transformation is enough to prove transformTableData.js:33 ran: row 0
  // ships `true` (tick icon) and must flip to the cross icon. `{{false}}` also avoids
  // every character clearAndTypeOnCodeMirror drops (no `!`, `<`, `>`, `?`).
  variantBooleanTransformation: "{{false}}",

  // ---- boolean toggle colours (LIGHT mode defaults) ----
  // StylesTabElements.jsx:113 / :123 — `darkMode ? '#849DFF' : '#3A5CCC'` and
  // `darkMode ? '#3A3F42' : '#D7DBDF'`. The editor runs light in CI.
  // PRODUCT BUG F3: both pickers are raw `Elements/Color` mounted with NO cyLabel,
  // so both render `data-cy="undefined-picker"` (Color.jsx:68) and can only be told
  // apart POSITIONALLY — Checked is index 0, Unchecked index 1.
  // F3 — the Checked / Unchecked pickers are raw `Inspector/Elements/Color` mounted
  // with NO cyLabel prop, so both emit `undefined-picker` (Color.jsx:68). Pass this
  // empty label PLUS a positional index to setColumnColor / verifyColumnColor.
  labelUnnamedColorPicker: "",
  variantToggleOnDefault: "#3A5CCC", // source: StylesTabElements.jsx:113
  variantToggleOffDefault: "#D7DBDF", // source: StylesTabElements.jsx:123
  variantToggleOnRgba: ["255", "0", "0", "100"],
  variantToggleOffRgba: ["0", "0", "255", "100"],
  // How many `undefined-picker` nodes a boolean column's Styles tab mounts — the
  // guard that keeps the F3 index disambiguation honest.
  variantBooleanUndefinedPickerCount: 2, // source: StylesTabElements.jsx:109,119

  // ---- image column (driven through the SHIPPED seed column) --------------
  // table.js:726-735 already ships a real image column: { name:'photo', key:'photo',
  // columnType:'image', objectFit:'contain', borderRadius:'100' }, bound to the seed
  // rows' `photo` URLs (table.js:692). Driving THAT column means every assertion runs
  // against shipped defaults and simultaneously proves the shipped configuration.
  variantImageColumn: "photo", // source: table.js:727
  variantImageColumnKey: "photo", // source: table.js:728
  variantImageRow0Src: "https://reqres.in/img/faces/7-image.jpg", // source: table.js:692
  // `{{cellValue.toUpperCase()}}` (variantTransformationUpper) applied to that URL.
  variantImageRow0SrcUpper: "HTTPS://REQRES.IN/IMG/FACES/7-IMAGE.JPG",
  variantNewImageColumn: "imgcol",
  variantRenamedImageColumn: "renamedimg",
  // A key absent from every row → cellValue undefined → ImageRenderer returns null
  // BEFORE rendering an <img> (ImageRenderer.jsx:25-27), which is the cleanest proof
  // that the Key really is the accessor.
  variantMissingKey: "nosuchkey",

  // ---- image styles ----
  // borderRadius is a plain CodeHinter string; ImageRenderer.jsx:42 appends 'px'.
  variantDefaultBorderRadius: "100", // source: table.js:733
  variantDefaultBorderRadiusCss: "100px", // source: ImageRenderer.jsx:42
  variantBorderRadius: "8",
  variantBorderRadiusCss: "8px",
  // objectFit lands verbatim as the CSS object-fit (ImageRenderer.jsx:43). The Select
  // renders the option LABEL for the stored value (SelectComponent.jsx:52).
  variantDefaultObjectFit: "contain", // source: table.js:732
  variantDefaultObjectFitLabel: "Contain", // source: StylesTabElements.jsx:89
  variantObjectFitCover: "cover",
  variantObjectFitCoverLabel: "Cover", // source: StylesTabElements.jsx:88
  // A sibling STRING column of the seed data — used by the image spec to prove that
  // "Make all columns editable" DID fire while the image column stayed read-only.
  variantEditableSiblingColumn: "name", // source: table.js:736

  // ---- shared rendered-cell classes these two specs assert ----
  // determineJustifyContentValue (_helpers/utils.js:1196-1207) maps left→start,
  // center→center, right→end onto the renderer's own flex wrapper — the boolean and
  // image renderers both build `justify-content-<that>` (BooleanRenderer.jsx:54-56,
  // ImageRenderer.jsx:31-33). This is the INNER counterpart of the <td> class.
  cellFlexJustifyCenter: "justify-content-center", // source: _helpers/utils.js:1202
  cellFlexJustifyStart: "justify-content-start", // source: _helpers/utils.js:1198

  // ═════════ VARIANTS FACET — link column type ═════════
  // Used by variants/link.cy.js. The shipped `columns` default (table.js:713-800)
  // contains NO link column and the seed dataset carries no URL-shaped key, so the
  // spec seeds its own data. `autogenerateColumns` ships ON (table.js:713) and
  // `typeof 'https://…' === 'string'` maps to columnType 'string'
  // (autoGenerateColumns.js:110-119), so the generated `url` column still has to be
  // re-typed to `link` — which is done once in the spec's beforeEach.

  // Bare expression (setTableData adds the `{{ }}` wrapper itself). Two keys per row:
  // `url` is the column under test and `label` is what the Key-rebind leg re-points at.
  variantLinkData:
    "[{ id: 1, url: 'https://tooljet.com/pricing', label: 'Pricing page' }, { id: 2, url: 'https://tooljet.com/docs', label: 'Docs page' }]",
  variantLinkColumn: "url", // autoGenerateColumns.js:96 (name === key)
  variantLinkColumnKey: "url",
  variantLinkAltKey: "label",
  variantLinkRow0Href: "https://tooljet.com/pricing",
  // `{{cellValue.toUpperCase()}}` (variantTransformationUpper) applied to that URL —
  // LinkRenderer.jsx:48 pipes the transformed value straight into `href`.
  variantLinkRow0HrefUpper: "HTTPS://TOOLJET.COM/PRICING",
  variantLinkAltValueRow0: "Pricing page",
  // Single lowercase tokens (F19 — the column-list data-cy is NOT normalised while the
  // rendered header/cell data-cy IS).
  variantNewLinkColumn: "linkcol",
  variantRenamedLinkColumn: "renamedlink",

  // ---- displayText (PropertiesTabElements.jsx:332-344) ----
  // Only characters the clearAndTypeOnCodeMirror tokenizer keeps (word chars + spaces).
  variantLinkDisplayText: "Open ToolJet",

  // ---- linkTarget (PropertiesTabElements.jsx:346-364) ----
  // ProgramaticallyHandleProperties.jsx:27-33 shows `{{true}}` when the column carries
  // no linkTarget at all, and normalises the three legacy falsy spellings
  // ('_self' | '{{false}}' | '') to `{{false}}`.
  variantDefaultLinkTarget: "{{true}}", // source: ProgramaticallyHandleProperties.jsx:32
  variantSelfLinkTarget: "{{false}}", // source: ProgramaticallyHandleProperties.jsx:30
  linkTargetBlank: "_blank", // source: LinkRenderer.jsx:49
  linkTargetSelf: "_self", // source: LinkRenderer.jsx:49

  // ---- link styles (StylesTabElements.jsx:180-227) ----
  // linkColor / underlineColor REPLACE the shared textColor / cellBackgroundColor pair
  // for a link column, and their inspector defaults come from
  // ProgramaticallyHandleProperties.jsx:54-56 / :48-50.
  variantDefaultLinkColor: "#1B1F24", // source: ProgramaticallyHandleProperties.jsx:55
  variantDefaultUnderlineColor: "#4368E3", // source: ProgramaticallyHandleProperties.jsx:49
  // LinkRenderer.jsx:26-31 collapses the sentinel '#1B1F24' back to itself in light mode.
  variantDefaultLinkColorCss: "rgb(27, 31, 36)", // source: LinkRenderer.jsx:30
  variantLinkColorRgba: ["255", "0", "0", "100"],
  variantUnderlineColorRgba: ["0", "0", "255", "100"],
  // `underline` toggleGroup VALUES (StylesTabElements.jsx:223-224) — the ToggleGroupItem
  // data-cy is `togglr-button-<value>` (note the source typo).
  underlineHoverValue: "hover", // source: StylesTabElements.jsx:223
  underlineAlwaysValue: "always", // source: StylesTabElements.jsx:224
  // LinkRenderer.jsx:33-41 — the class the anchor gets for each mode. They are distinct
  // tokens, so `have.class('table-link')` is FALSE while the mode is 'hover'.
  linkClassUnderlineHover: "table-link-hover", // source: LinkRenderer.jsx:36
  linkClassUnderlineAlways: "table-link", // source: LinkRenderer.jsx:39
  // LinkRenderer.jsx:53 writes the inline text-decoration ONLY for the 'always' mode.
  linkTextDecorationAlways: "underline", // source: LinkRenderer.jsx:53
  // LinkRenderer.jsx:56 — fixed rel on every rendered link.
  linkRelValue: "noopener noreferrer", // source: LinkRenderer.jsx:56

  // ═════════ VARIANTS FACET — rating column type ═════════
  // Used by variants/rating.cy.js. As with link, nothing rating-shaped ships in the
  // default `columns` (table.js:713-800), so the spec seeds its own dataset and re-types
  // the generated `score` column (typeof 1 === 'number' → columnType 'number',
  // autoGenerateColumns.js:110-119) to `rating` in beforeEach.
  //
  // The four rows are deliberate — every renderer branch of RatingColumn is reachable:
  //   row 0  score 1   → 1 selected icon (and id 4, so the Key-rebind leg is observable)
  //   row 1  score 3   → 3 selected icons
  //   row 2  no score  → cellValue undefined → the `defaultRating` branch (Rating.jsx:42-44)
  //   row 3  score 2.5 → currentRatingIndex 1.5 → the HALF-icon branch (Rating.jsx:80-83)
  variantRatingData:
    "[{ id: 4, score: 1 }, { id: 2, score: 3 }, { id: 7 }, { id: 9, score: 2.5 }]",
  variantRatingColumn: "score", // autoGenerateColumns.js:96 (name === key)
  variantRatingColumnKey: "score",
  variantRatingAltKey: "id",
  variantNewRatingColumn: "ratecol",
  variantRenamedRatingColumn: "renamedrate",

  // ---- selected-icon counts (aria-checked === `index <= currentRatingIndex`) ----
  variantRatingRow0Selected: 1, // source: Rating.jsx:45 (cellValue 1 → index 0)
  variantRatingRow1Selected: 3, // source: Rating.jsx:45 (cellValue 3 → index 2)
  variantRatingAltRow0Selected: 4, // key rebound to `id` → cellValue 4
  variantRatingHalfRowSelected: 2, // row 3: 2.5 → indices 0,1 are aria-checked
  variantRatingEmptyRowIndex: 2, // the row with no `score` key
  variantRatingHalfRowIndex: 3, // the row whose score is 2.5

  // `*` survives the clearAndTypeOnCodeMirror tokenizer (`/` does not), so a doubling is
  // the safe transformation. Row 0 ships 1 → 2 selected icons.
  variantRatingTransformation: "{{cellValue*2}}",
  variantRatingTransformedRow0Selected: 2, // source: transformTableData.js:33

  // ---- maxRating / defaultRating (RatingColumnProperties.jsx:22-53) ----
  variantDefaultMaxRating: 5, // source: Rating.jsx:24 (`|| 5`)
  variantMaxRatingOverride: "{{3}}",
  variantMaxRatingOverrideCount: 3,
  // defaultRating is consumed ONLY when the cell value is empty (Rating.jsx:38-46).
  variantDefaultRatingOverride: "{{2}}",
  variantDefaultRatingOverrideSelected: 2,
  // Rating.jsx:37 — `?? 0`, so an unset defaultRating leaves an empty cell with NO
  // selected icon (currentRatingIndex -1).
  variantDefaultRatingUnsetSelected: 0,

  // ---- iconType (PropertiesTabElements.jsx:219-227 + RatingIconToggle.jsx:14-23) ----
  // The group's aria-label carries BOTH the icon type and maxRating (Rating.jsx:100), so
  // one attribute assertion pins both.
  variantRatingAriaGroupStars: "Rating widget, stars from 1 to 5", // source: Rating.jsx:100
  variantRatingAriaGroupHearts: "Rating widget, hearts from 1 to 5", // source: Rating.jsx:100
  variantRatingAriaGroupMax3: "Rating widget, stars from 1 to 3", // source: Rating.jsx:100

  // ---- allowHalfStar (RatingColumnProperties.jsx:54-68) ----
  variantDefaultAllowHalfRating: "{{false}}", // source: ProgramaticallyHandleProperties.jsx:87
  variantAllowHalfRatingOn: "{{true}}",

  // ---- rating colours ----
  // Rating.jsx:28-30 fallbacks, written verbatim into the icon's `fill` ATTRIBUTE
  // (RatingIcon.jsx:35-43 → icons/star.jsx:16,31), so they are asserted with have.attr
  // rather than have.css.
  variantDefaultSelectedStarsColor: "#EFB82D", // source: Rating.jsx:28
  variantDefaultUnselectedColor: "var(--cc-surface3-surface)", // source: Rating.jsx:30
  // BaseColorSwatches.jsx:67-72 builds `#rrggbb` + a 2-digit alpha, so an rgba of
  // [r,g,b,100] always lands as the 8-digit hex below.
  variantRatingSelectedStarsRgba: ["255", "0", "0", "100"],
  variantRatingSelectedStarsHex: "#ff0000ff",
  variantRatingSelectedHeartsRgba: ["0", "0", "255", "100"],
  variantRatingSelectedHeartsHex: "#0000ffff",
  variantRatingUnselectedRgba: ["0", "255", "0", "100"],
  variantRatingUnselectedHex: "#00ff00ff",

  // ═════════ VARIANTS FACET — datepicker column type ═════════
  // Used by variants/datepicker.cy.js. `datepicker` is the most control-dense column
  // type: 13 inspector controls across TWO accordions (DatepickerProperties.jsx:93 and
  // :252) on top of the shared controls, plus SIX validations. Every literal below is
  // derived from source and cited inline.

  // ---- the SHIPPED seed column ------------------------------------------
  // table.js:753-764 already ships a real, data-bound datepicker column:
  // { name:'date', key:'date', columnType:'datepicker', isTimeChecked:false,
  //   dateFormat:'DD/MM/YYYY', parseDateFormat:'DD/MM/YYYY',
  //   isDateSelectionEnabled:true }. Driving THAT column means every assertion runs
  // against shipped defaults AND simultaneously proves the shipped configuration —
  // the same approach variants/image.cy.js takes for `photo`. Column CREATION gets its
  // own it-block, where the useColumnManager seeding is what is under test.
  variantDateColumn: "date", // source: table.js:754
  variantDateColumnKey: "date", // source: table.js:755
  variantDateRow0Raw: "15/05/2022", // source: table.js:692 (row 0, key `date`)
  // computeDateString → moment(parsedDate).format('DD/MM/YYYY') with the shipped
  // dateFormat — DatePickerRenderer.jsx:168-180.
  variantDateRow0Rendered: "15/05/2022", // source: DatePickerRenderer.jsx:180
  variantNewDateColumn: "datecol",
  variantRenamedDateColumn: "renameddate",

  // ---- seeded defaults written on switching a column TO `datepicker` ----
  // useColumnManager.js:47-55 — the ONLY four keys the type switch seeds.
  variantDateSeedDateFormat: "DD/MM/YYYY", // source: useColumnManager.js:50
  variantDateSeedParseFormat: "DD/MM/YYYY", // source: useColumnManager.js:51

  // ---- accordion titles (DatepickerProperties.jsx:93, :252) ----
  accordionDateFormat: "Date format", // source: DatepickerProperties.jsx:93
  accordionParseFormat: "Parse format", // source: DatepickerProperties.jsx:252

  // ---- display-format probes -------------------------------------------
  // `dateFormat` is written RAW into the renderer (generateColumnsData.js:431 passes
  // `column.dateFormat` with no getResolvedValue), so ANY moment format token works —
  // which is what makes the fx CodeHinter branch testable at all. `YYYY` is used
  // instead of one of the four dropdown formats because clearAndTypeOnCodeMirror's
  // tokenizer (codemirrorCommands.js:29) SILENTLY DROPS `/`: typing 'MM/DD/YYYY' into
  // a CodeMirror lands as 'MMDDYYYY'. The four slash formats are therefore only ever
  // set through the react-select branch (fx OFF), where a plain cy.type() is used.
  variantDateFxFormat: "YYYY",
  variantDateFxRendered: "2022", // moment('15/05/2022','DD/MM/YYYY').format('YYYY')
  // MM/DD/YYYY re-formats the SAME parsed instant (15 May 2022) as 05/15/2022.
  variantDateRow0RenderedUs: "05/15/2022", // source: DatePickerRenderer.jsx:180

  // ---- time probes ------------------------------------------------------
  // getDateTimeFormat(dateDisplayFormat, isTimeChecked, isTwentyFourHrFormatEnabled,
  // isDateSelectionEnabled) = `${dateDisplayFormat} ${LT|HH:mm}`
  // (DatePickerRenderer.jsx:53-62, :168-169). The seed value carries no time, so the
  // non-strict moment fallback (:92) lands it at local midnight.
  variantDateRow0Rendered12h: "15/05/2022 12:00 AM", // source: DatePickerRenderer.jsx:168 ('LT')
  variantDateRow0Rendered24h: "15/05/2022 00:00", // source: DatePickerRenderer.jsx:168 ('HH:mm')
  // Both time-zone selects must be set for parseDate to take the ABSOLUTE-INSTANT
  // branch (:84-88); with only `timeZoneDisplay` set the parse stays LOCAL and the
  // result depends on the CI machine's zone. Parsing 15/05/2022 00:00 in Etc/UTC and
  // displaying it in Asia/Colombo (+05:30) is machine-independent.
  variantParseTimeZone: "UTC", // source: DatepickerProperties.jsx:12 (value 'Etc/UTC')
  variantDisplayTimeZone: "+05:30", // source: DatepickerProperties.jsx:34 (value 'Asia/Colombo')
  variantDateRow0RenderedTz: "15/05/2022 5:30 AM", // source: DatePickerRenderer.jsx:177-178
  // `Select..` is _ui/Select/SelectComponent.jsx:28's placeholder, and both time-zone
  // selects default to `''` (DatepickerProperties.jsx:231, :372) which SelectComponent
  // :52 turns into `defaultValue` (null) — i.e. the placeholder, not an option.
  selectPlaceholder: "Select..", // source: _ui/Select/SelectComponent.jsx:28

  // ---- unix-timestamp probes -------------------------------------------
  // With `parseInUnixTimestamp` on, parseDate takes :82-83. The seed value is a DATE
  // STRING, so moment.unix('15/05/2022') is NaN → invalid → parsedDate null → the
  // renderer emits the literal 'Invalid date' (:166).
  variantDateInvalid: "Invalid date", // source: DatePickerRenderer.jsx:166
  unixSecondsLabel: "s", // source: DatepickerProperties.jsx:71
  unixMillisecondsLabel: "ms", // source: DatepickerProperties.jsx:75
  // Switching to milliseconds takes :83's `moment(parseInt(value))` instead, and
  // parseInt('15/05/2022') === 15 → 15 ms after the epoch. Which calendar DAY that
  // renders as depends on the runner's local zone (moment(Number) is local), so the
  // assertion is a shape match on 1969/1970 rather than a fixed string.
  variantDateUnixMsPattern: /^(01\/01\/1970|31\/12\/1969)$/, // source: DatePickerRenderer.jsx:83

  // ---- parse-format probe ----------------------------------------------
  // Re-parsing '15/05/2022' as MM/DD/YYYY makes the MONTH 15, which moment flags as an
  // overflow even non-strictly (:90-92), so the cell falls back to 'Invalid date'.
  variantDateParseFormatUs: "MM/DD/YYYY", // source: DatepickerProperties.jsx:55

  // ---- transformation ---------------------------------------------------
  // Runs BEFORE the renderer parses (transformTableData.js:33), so the new string is
  // what gets parsed and re-formatted. Every character survives the
  // clearAndTypeOnCodeMirror tokenizer (no `/` — the digits are replaced, not the
  // separators).
  variantDateTransformation: "{{cellValue.replace(2022,2030)}}",
  variantDateTransformedRow0: "15/05/2030", // source: transformTableData.js:33

  // ---- key rebind -------------------------------------------------------
  // `name` is a sibling seed key whose row-0 value ('Olivia Nguyen') no moment format
  // can parse, so the cell falls to 'Invalid date' — the cleanest proof that the Key
  // really is the accessor (generateColumnsData.js:163).
  variantDateAltKey: "name", // source: table.js:692

  // ---- validations ------------------------------------------------------
  // The EXACT ordered <label> set a datepicker column mounts. minTime/maxTime are
  // pushed ONLY while `isTimeChecked` resolves truthy (ValidationProperties.jsx:129).
  // PRODUCT BUG F1 (HIGH) applies here too: getValidationList writes `dateCy`
  // (:115,:122,:132,:139,:149,:156) while the render branches read `validation.dataCy`
  // (:179,:199,:216), so NONE of these six controls has a data-cy — they are addressed
  // by label text.
  variantDateValidationLabels: [
    "Minimum date", // source: ValidationProperties.jsx:117
    "Maximum date", // source: ValidationProperties.jsx:123
    "Disabled dates", // source: ValidationProperties.jsx:150
    "Custom rule", // source: ValidationProperties.jsx:157
  ],
  variantDateValidationLabelsWithTime: [
    "Minimum date", // source: ValidationProperties.jsx:117
    "Maximum date", // source: ValidationProperties.jsx:123
    "Minimum time", // source: ValidationProperties.jsx:132
    "Maximum time", // source: ValidationProperties.jsx:139
    "Disabled dates", // source: ValidationProperties.jsx:150
    "Custom rule", // source: ValidationProperties.jsx:157
  ],
  // validateDates hard-codes 'MM/DD/YYYY' as the validation format (_helpers/utils.js:480 —
  // Datepicker.jsx:32-55 passes NO dateFormat into the validationObject), and the inspector's
  // ReactDatePicker writes back with the same format (ValidationProperties.jsx:186).
  variantMinDate: "06/01/2022", // 1 Jun 2022 > 15 May 2022 → row 0 fails
  variantMinDateError: "Minimum date is 06/01/2022", // source: _helpers/utils.js:519
  variantMaxDate: "01/01/2022", // 1 Jan 2022 < 15 May 2022 → row 0 fails
  variantMaxDateError: "Maximum date is 01/01/2022", // source: _helpers/utils.js:529
  // The widget's TIME value is 00:00 — the seed string carries no time, so
  // moment('15/05/2022','DD/MM/YYYY LT').format('HH:mm') is '00:00'
  // (_helpers/utils.js:487-490).
  variantMinTime: "01:00", // 01:00 is not before 00:00 → row 0 fails
  variantMinTimeError: "Minimum time is 01:00", // source: _helpers/utils.js:539
  variantMaxTime: "00:00", // 00:00 is not after 00:00 → row 0 fails
  variantMaxTimeError: "Maximum time is 00:00", // source: _helpers/utils.js:549
  // disabledDates is read with DISABLED_DATE_FORMAT = 'MM/DD/YYYY'
  // (DatePickerRenderer.jsx:10, :277-283) — NOT the column's own parseDateFormat.
  variantDisabledDates: "{{['05/15/2022']}}",
  // customRule resolving to a NON-EMPTY STRING is the failure signal and the string
  // itself becomes the message (_helpers/utils.js:556-559). Datepicker.jsx:54 passes
  // customResolveObjects { cellValue }, so the rule sees the real cell.
  variantDateCustomRule: "{{cellValue.slice(0,2)}}",
  variantDateCustomRuleError: "15", // '15/05/2022'.slice(0,2) — source: table.js:692
  // `disabledDates` never changes the rendered TEXT — it only feeds react-datepicker's
  // `excludeDates` (DatePickerRenderer.jsx:376), so the single observable effect is the
  // `--excluded` day inside the OPEN calendar, which needs the column to be editable.
  // The calendar opens on the selected date (15 May 2022), so the excluded day is on the
  // first visible month page.
  variantDateExcludedDay: "15", // source: variantDisabledDates ('05/15/2022')

  // ---- fx literals -------------------------------------------------------
  // getInitialValue's final fallback (ProgramaticallyHandleProperties.jsx:87) for the two
  // datepicker toggles the shipped column does NOT carry (`isTwentyFourHrFormatEnabled`,
  // `parseInUnixTimestamp`) — both are undefined, so the fx editor opens on '{{false}}'.
  // `isDateSelectionEnabled` / `isTimeChecked` ARE seeded (table.js:761,764) as RAW JS
  // booleans, so their fx editors do NOT show a braced literal — this spec proves those two
  // through the toggle's own checked state plus the rendered effect instead.
  variantDateFxFalse: "{{false}}", // source: ProgramaticallyHandleProperties.jsx:87
  variantDateFxTrue: "{{true}}", // source: CodeBuilder/Elements/Toggle.jsx:23
  // computeDateString's second guard (DatePickerRenderer.jsx:165): with BOTH
  // isDateSelectionEnabled and isTimeChecked false the renderer returns the empty string, so
  // the cell goes blank rather than showing 'Invalid date'.
  variantDateBlankCell: "", // source: DatePickerRenderer.jsx:165

  // ---- editable rating ----
  // RatingIcon.jsx:99-100 commits `index + 1`, so clicking the LAST icon of the default
  // 5-icon group selects all five.
  variantRatingClickIndex: 4,
  variantRatingClickedSelected: 5,

  // ═════════ VARIANTS FACET — tagsV2 (the `Tags` column type) ═════════
  // Used by variants/tagsV2.cy.js. NOT covered by docs/docs/widgets/table/columns.md,
  // so every literal below is derived from SOURCE and cited inline.
  //
  // ---- dataset (bare expression — setTableData() adds the `{{ }}` wrapper) ----
  // Row 0 carries TWO tags (so multi-selection is observable), row 1 exactly one (an
  // unambiguous single-chip probe for the colour assertions) and row 2 an EMPTY string,
  // which is the only shape that lets `defaultOptionsList` reach the renderer:
  // SelectComponent.jsx:52 uses `value ? … : defaultValue`, and an empty ARRAY is truthy.
  // Every value is one of DEFAULT_SELECT_COLUMN_OPTIONS (utils.js:23-28) so the cell
  // values resolve to real options rather than to the String() fallback
  // (TagsRenderer.jsx:354-369).
  variantTagsData:
    "[{ id: 1, hobbies: ['Reading', 'Music'] }, { id: 2, hobbies: ['Photography'] }, { id: 3, hobbies: '' }]",
  // autoGenerateColumns.js:94-98 names the column after the key; an ARRAY value maps to
  // columnType 'string' (:116-119, only string/number/boolean are mapped), so the spec
  // switches it to tagsV2 itself — which is also what seeds the tagsV2 defaults.
  variantTagsColumn: "hobbies",
  variantNewTagsColumn: "tagcol",
  variantRenamedTagsColumn: "renamedtags",
  variantNewSelectColumn: "selcol",
  // Key-rebind probe: the dataset also carries `id`, whose row-0 value is 1. `1` matches
  // no option, so resolveSelectedOption falls back to String(1) (TagsRenderer.jsx:361-366).
  variantTagsAltKey: "id",
  variantTagsAltChipRow0: "1",

  // ---- DEFAULT_SELECT_COLUMN_OPTIONS, seeded on the type switch ----
  // source: Inspector/Components/Table/utils.js:23-28 (via useColumnManager.js:32)
  variantTagsDefaultOptions: ["Reading", "Traveling", "Photography", "Music"],
  variantTagsOptionReading: "Reading",
  variantTagsOptionTraveling: "Traveling",
  variantTagsOptionPhotography: "Photography",
  variantTagsOptionMusic: "Music",
  // createNewOption names a fresh option `Option N`, skipping labels already taken
  // (OptionsList.jsx:59-71) — none of the four defaults is an `Option N`, so it is 1.
  variantTagsNewOptionLabel: "Option 1",
  variantTagsRenamedOptionLabel: "Novels",

  // ---- sortTags: the order of the DROPDOWN option list, not of the chips ----
  // sortOptions (TagsRenderer.jsx:22-28) sorts the `options` handed to react-select by
  // LABEL; the selected chips keep the cell value's own order. Asserted on row 2, whose
  // value is empty, so `hideSelectedOptions` removes nothing and all four options show.
  variantTagsOptionsOrderNone: ["Reading", "Traveling", "Photography", "Music"], // source: utils.js:23-28
  variantTagsOptionsOrderAsc: ["Music", "Photography", "Reading", "Traveling"], // source: TagsRenderer.jsx:26
  variantTagsOptionsOrderDesc: ["Traveling", "Reading", "Photography", "Music"], // source: TagsRenderer.jsx:26

  // ---- rendered chips ----
  variantTagsRow0Labels: ["Reading", "Music"], // source: variantTagsData row 0
  variantTagsRow0FirstLabel: "Reading",
  variantTagsRow1Label: "Photography",
  variantTagsRow0MultiChipCount: 2,
  variantTagsSingleChipCount: 1,

  // ---- colours ----
  // autoAssignColors ON paints option i with COLORS[i % 13] (TagsRenderer.jsx:200-208).
  // `Photography` is options index 2 → COLORS[2] === '#6745E233' → rgba(103,69,226,0.2).
  variantTagsAutoColorPhotography: ["103", "69", "226", "20"], // source: SelectRenderer.jsx:15
  // autoAssignColors OFF falls back to this token (TagsRenderer.jsx:13,204).
  variantTagsDefaultChipBackground: "var(--surfaces-surface-03)",
  variantTagsOptionColorRgba: ["255", "0", "0", "100"],
  variantTagsLabelColorRgba: ["0", "0", "255", "100"],
  // The INSPECTOR defaults for the two per-option swatches. Note they are inspector-only:
  // the renderer reads `option.optionColor` / `option.labelColor`, which are still
  // undefined, so the chip is auto-coloured while the swatch reads these hexes.
  variantTagsDefaultOptionColor: "#E4E7EB", // source: ProgramaticallyHandleProperties.jsx:46
  variantTagsDefaultLabelColor: "#1B1F24", // source: ProgramaticallyHandleProperties.jsx:42

  // ---- accordion / button copy that flips with the column type ----
  variantTagsAccordionTitle: "Tags", // source: OptionsList.jsx:271
  variantSelectAccordionTitle: "Options", // source: OptionsList.jsx:271
  // The two Tags labels in the column-type dropdown (:131 tagsV2, :148 deprecated tags).
  variantTagsLabelCollisionCount: 2, // source: PropertiesTabElements.jsx:131,148

  // ---- transformation / validation ----
  // Row 0 is ['Reading','Music']; slicing to the first element must drop the `Music` chip,
  // which proves the transformation ran against the REAL array cellValue.
  variantTagsTransformation: "{{cellValue.slice(0,1)}}",
  // customRule is the ONLY validation tagsV2 mounts (ValidationProperties.jsx:100-108) and
  // the adapter resolves it against `value` — NOT `cellValue` (TagsV2ColumnAdapter.jsx:33-39).
  // A non-empty STRING is the failure signal and becomes the message (_helpers/utils.js:459).
  variantTagsCustomRule: "{{value.toString()}}",
  variantTagsCustomRuleErrorRow1: "Photography", // ['Photography'].toString()

  // ---- dynamic options ----
  // Re-labels the `Reading` VALUE, so row 0's first chip must render the new label while
  // its `Music` tag falls back to String(value) — proof the dynamic list replaced the
  // static one (generateColumnsData.js:337-350).
  variantTagsDynamicOptions: "{{[{ label: 'Novel', value: 'Reading' }]}}",
  variantTagsDynamicFirstLabel: "Novel",

  // ---- react-select state classes the tags cell is read through ----
  // generateColumnsData.js:361 passes `disabled={!isEditable}` → TagsRenderer.jsx:440
  // `isDisabled` → react-select's Control emits `<prefix>__control--is-disabled`. This is
  // the cleanest proof that "Make editable" reached the renderer.
  variantTagsControlDisabledClass: "react-select__control--is-disabled",
  // All four DEFAULT_SELECT_COLUMN_OPTIONS show in the menu of the empty row: nothing is
  // selected there, so `hideSelectedOptions` (TagsRenderer.jsx:451) removes nothing.
  variantTagsMenuOptionCount: 4, // source: utils.js:23-28

  // ═════════ VARIANTS FACET — select · newMultiSelect column types ═════════
  // Used by variants/select.cy.js and variants/newMultiSelect.cy.js. Both types are
  // rendered by the SAME component pair (CustomSelectColumn -> SelectRenderer,
  // generateColumnsData.js:293-334) and configured by the SAME inspector block
  // (SelectOptionsList/OptionsList.jsx); `isMulti` (generateColumnsData.js:325) is the only
  // switch between them. Every literal below is derived from SOURCE and cited inline.

  // ---- datasets (bare expressions — setTableData() adds the `{{ }}` wrapper) ----
  // `hobby` holds a SCALAR (what a single-select cell binds to) and `alt` a second scalar
  // so the Key-rebind leg is observable. Row 2 is deliberately the EMPTY STRING: it is the
  // only shape that lets `defaultOptionsList` reach the renderer, because SelectComponent
  // .jsx:52 resolves `value ? … : defaultValue`. Every value is one of
  // DEFAULT_SELECT_COLUMN_OPTIONS (utils.js:23-28) so it matches a real option
  // (SelectRenderer.jsx:356-368) instead of collapsing to the no-match branch.
  variantSelectData:
    "[{ id: 1, hobby: 'Reading', alt: 'Music' }, { id: 2, hobby: 'Photography', alt: 'Traveling' }, { id: 3, hobby: '', alt: '' }]",
  // newMultiSelect binds to an ARRAY. Row 0 carries TWO values (so the multi-chip count is
  // observable), row 1 exactly one, row 2 the empty string (the defaultOptionsList probe).
  variantMultiSelectData:
    "[{ id: 1, hobbies: ['Reading', 'Music'], alt: ['Traveling'] }, { id: 2, hobbies: ['Photography'], alt: ['Music', 'Reading'] }, { id: 3, hobbies: '', alt: '' }]",
  // autoGenerateColumns.js:94-98 names the column after the key; both a STRING and an ARRAY
  // value map to columnType 'string' (:116-119 maps only string/number/boolean), so each
  // spec switches its column itself — which is also what seeds the option defaults
  // (useColumnManager.js:24-34).
  variantSelectColumn: "hobby",
  variantMultiSelectColumn: "hobbies",
  variantSelectAltKey: "alt",
  variantRenamedSelectColumn: "renamedselect",
  variantRenamedMultiSelectColumn: "renamedmulti",
  variantNewMultiSelectColumn: "mscol",

  // ---- DEFAULT_SELECT_COLUMN_OPTIONS, seeded on the type switch ----
  // source: Inspector/Components/Table/utils.js:23-28 (via useColumnManager.js:24-34).
  // This is the SAME array the tagsV2 block above reads; it is named again here only so the
  // select / newMultiSelect specs never have to reach into `variantTags*`.
  variantSelectDefaultOptions: ["Reading", "Traveling", "Photography", "Music"],
  variantSelectOptionReading: "Reading", // source: utils.js:24
  variantSelectOptionTraveling: "Traveling", // source: utils.js:25
  variantSelectOptionPhotography: "Photography", // source: utils.js:26
  variantSelectOptionMusic: "Music", // source: utils.js:27
  variantSelectDefaultOptionCount: 4, // source: utils.js:23-28
  // createNewOption names a fresh option `Option N`, skipping labels already taken
  // (OptionsList.jsx:59-76) — none of the four defaults is an `Option N`, so it is 1.
  variantSelectNewOptionLabel: "Option 1",
  variantSelectRenamedOptionLabel: "Novels",
  variantSelectRenamedOptionValue: "novels",

  // ---- rendered chips ----
  variantSelectRow0Label: "Reading", // source: variantSelectData row 0
  variantSelectRow1Label: "Photography", // source: variantSelectData row 1
  variantSelectAltRow0Label: "Music", // source: variantSelectData row 0 `alt`
  variantMultiSelectRow0Labels: ["Reading", "Music"], // source: variantMultiSelectData row 0
  variantMultiSelectRow0ChipCount: 2,
  variantMultiSelectRow1ChipCount: 1,
  variantMultiSelectAltRow0Label: "Traveling", // source: variantMultiSelectData row 0 `alt`
  variantSelectSingleValueCount: 1,

  // ---- the toggle default every OptionsList toggle falls back to ----
  // ProgramaticallyHandleProperties.jsx:87 — `return definitionObj?.value ?? '{{false}}'`
  // is the terminal branch, so autoAssignColors / useDynamicOptions / optionsLoadingState /
  // makeDefaultOption all read `{{false}}` in their fx editor until they are touched.
  variantSelectToggleDefault: "{{false}}", // source: ProgramaticallyHandleProperties.jsx:87

  // ---- colours ----
  // optionColors maps each option's VALUE to `option.optionColor || (autoAssignColors ?
  // COLORS[i % 13] : 'var(--surfaces-surface-03)')` (SelectRenderer.jsx:250-256), and that
  // colour is written as the chip's inline `background` (singleValue :325-336 /
  // multiValueLabel :293-304).
  // `Reading` is options index 0 → COLORS[0] === '#40474D33' → rgba(64,71,77,0.2).
  variantSelectAutoColorReading: ["64", "71", "77", "20"], // source: SelectRenderer.jsx:13
  // `Photography` is options index 2 → COLORS[2] === '#6745E233' → rgba(103,69,226,0.2).
  variantSelectAutoColorPhotography: ["103", "69", "226", "20"], // source: SelectRenderer.jsx:15
  // autoAssignColors OFF falls back to this token, which stays a raw `var()` in the inline
  // style attribute (React never resolves custom properties).
  variantSelectDefaultChipBackground: "var(--surfaces-surface-03)", // source: SelectRenderer.jsx:253
  variantSelectOptionColorRgba: ["255", "0", "0", "100"],
  variantSelectLabelColorRgba: ["0", "0", "255", "100"],
  variantSelectTextColorRgba: ["0", "128", "0", "100"],
  variantSelectCellColorRgba: ["255", "255", "0", "100"],
  // The INSPECTOR defaults for the two per-option swatches
  // (ProgramaticallyHandleProperties.jsx:42 / :46). They are inspector-only: the renderer
  // reads `option.labelColor` / `option.optionColor`, which are still UNDEFINED until the
  // user picks, so an untouched chip is auto-coloured while the swatch shows these hexes.
  variantSelectDefaultLabelColor: "#1B1F24", // source: ProgramaticallyHandleProperties.jsx:42
  variantSelectDefaultOptionColor: "#E4E7EB", // source: ProgramaticallyHandleProperties.jsx:46

  // ---- transformation ----
  // columnSlice.js:99 drops a transformation equal to '{{cellValue}}', so only a real
  // expression reaches transformTableData.js:33. Remapping row 0's `Reading` to `Music`
  // keeps the value inside the option list, so the chip label must change rather than the
  // chip disappearing.
  // NOT a ternary. `clearAndTypeOnCodeMirror`'s tokenizer (codemirrorCommands.js:29)
  // keeps only `{ } ( ) [ ] , : ; => *`, quoted strings, `[a-zA-Z0-9._#-]+` and
  // whitespace — so `=` and `?` are SILENTLY DROPPED and
  // `{{cellValue === 'Reading' ? 'Music' : cellValue}}` would be typed as the
  // invalid `{{cellValue 'Reading' 'Music' : cellValue}}`. String.replace uses only
  // surviving characters and is semantically identical for this dataset: row 0
  // 'Reading' -> 'Music', every other row unchanged.
  variantSelectTransformation: "{{cellValue.replace('Reading','Music')}}",
  variantSelectTransformedRow0Label: "Music",
  // Row 0 is ['Reading','Music']; slicing to the first element must drop the `Music` chip,
  // which proves the transformation ran against the REAL array cellValue.
  variantMultiSelectTransformation: "{{cellValue.slice(0,1)}}",

  // ---- validation ----
  // customRule is the ONLY validation these two types mount (ValidationProperties.jsx:97-108)
  // and the adapter resolves it against `value` — NOT `cellValue`
  // (SelectColumnAdapter.jsx:40-47). A non-empty STRING is the failure signal and becomes the
  // message verbatim (_helpers/utils.js:458-461).
  variantSelectCustomRule: "{{value}}",
  variantSelectCustomRuleErrorRow0: "Reading", // 'Reading' resolves to itself
  variantMultiSelectCustomRule: "{{value.toString()}}",
  variantMultiSelectCustomRuleErrorRow0: "Reading,Music", // ['Reading','Music'].toString()

  // ---- dynamic options ----
  // Re-labels the `Reading` VALUE, so row 0's chip must render the new label — proof the
  // dynamic list replaced the static one (generateColumnsData.js:295-300).
  variantSelectDynamicOptions: "{{[{ label: 'Novel', value: 'Reading' }]}}",
  variantSelectDynamicFirstLabel: "Novel",
  variantSelectDynamicOptionCount: 1,

  // ---- react-select state classes the select cell is read through ----
  // generateColumnsData.js:320 passes `disabled={!isEditable}` → SelectRenderer.jsx:424
  // `isDisabled` → react-select's Control emits `<prefix>__control--is-disabled`. This is
  // the cleanest proof that "Make editable" reached the renderer.
  variantSelectControlDisabledClass: "react-select__control--is-disabled",
  // Nothing is filtered out of the menu — SelectRenderer.jsx:430 sets
  // `hideSelectedOptions={false}` — so all four seeded options are listed.
  variantSelectMenuOptionCount: 4, // source: utils.js:23-28

  // ---- inline justify-content written from horizontalAlignment ----
  // SelectRenderer.jsx:305-315 puts `justifyContent: horizontalAlignment` on the
  // valueContainer, so the CSS value IS the stored toggle value.
  variantSelectJustifyCenter: "center", // source: StylesTabElements.jsx:44

  // ═════════════════════════════════════════════════════════════════════════════
  // VARIANTS FACET — tagsV2 · rating, driven by SHIPPED columns
  // ═════════════════════════════════════════════════════════════════════════════
  // Used by variants/tagsV2.cy.js and variants/rating.cy.js.
  //
  // WHY THESE TWO SPECS SEED NOTHING: a runtime run proved that calling
  // setTableData() from a beforeEach aborts the whole spec — the helper ends with
  // cy.forceClickOnCanvas() + cy.waitForAutoSave(), and the autosave indicator does
  // not settle in that position, so the HOOK fails and every it() is skipped
  // (boolean/html/json/link/markdown all died that way; image/number/string/text/
  // datepicker, which seed nothing, all ran). Both specs below therefore drive a
  // column the widget ALREADY ships and re-type it, which is also strictly better
  // coverage: every assertion runs against shipped configuration.

  // ───────────────────────── tagsV2 — the shipped `interest` column ─────────────
  // table.js:777-825 ships { name:'interest', key:'interest',
  // columnType:'newMultiSelect', columnSize:300, options:[10 entries] } and the
  // shipped dataset gives every row a real ARRAY value (table.js:692). Re-typing it
  // to tagsV2 keeps those 10 options verbatim — useColumnManager.js:26-33 only seeds
  // DEFAULT_SELECT_COLUMN_OPTIONS when the column has NO options — while :36-43
  // still runs and stamps the three tagsV2-only defaults.
  variantTagsShippedColumn: "interest", // source: table.js:777
  variantTagsShippedColumnKey: "interest", // source: table.js:778
  variantTagsShippedSourceType: "newMultiSelect", // source: table.js:782
  // The option list in SOURCE ORDER — which is what autoAssignColors indexes into
  // (TagsRenderer.jsx:200-208 keys COLORS by the option's POSITION).
  variantTagsShippedOptions: [
    "Reading", // source: table.js:786
    "Traveling", // source: table.js:790
    "Photography", // source: table.js:794
    "Music", // source: table.js:798
    "Cooking", // source: table.js:802
    "Crafting", // source: table.js:806
    "Volunteering", // source: table.js:810
    "Gardening", // source: table.js:814
    "Dancing", // source: table.js:818
    "Hiking", // source: table.js:822
  ],
  variantTagsShippedOptionCount: 10, // source: table.js:785-824
  // Row 0 of the shipped dataset — three real tags, so multi-selection, per-option
  // colouring and the transformation leg are all observable on one row.
  variantTagsShippedRow0Labels: ["Reading", "Traveling", "Photography"], // source: table.js:692
  variantTagsShippedRow0ChipCount: 3,
  variantTagsShippedRow0FirstLabel: "Reading", // source: table.js:692
  variantTagsShippedRow1FirstLabel: "Cooking", // source: table.js:692 (row 1 `interest`)
  // Key-rebind probe: `email` is a scalar string that matches NO option, so
  // resolveSelectedOption falls back to String(value) (TagsRenderer.jsx:361-366).
  variantTagsShippedAltKey: "email", // source: table.js:692
  variantTagsShippedAltChipRow0: "olivia.nguyen@example.com", // source: table.js:692
  variantTagsShippedAltChipCount: 1,
  // Names typed into "Column name" when creation / renaming is under test. Single
  // lowercase tokens on purpose (F19 — the column-list data-cy is NOT normalised
  // while the rendered header/cell data-cy IS).
  variantTagsShippedNewColumn: "tagcol",
  variantTagsShippedRenamedColumn: "renamedtags",

  // ---- the three defaults the tagsV2 type switch stamps (useColumnManager.js:36-43) ----
  // `autoAssignColors: true` is the one that DIFFERS from select / newMultiSelect,
  // where the property is never seeded and the fx editor falls back to `{{false}}`
  // (ProgramaticallyHandleProperties.jsx:87) — asserting it is what proves the
  // tagsV2 seed path ran rather than the shared select path.
  variantTagsSeedSortTags: "none", // source: useColumnManager.js:40
  variantTagsSeedAllowMultipleSelection: true, // source: useColumnManager.js:41
  variantTagsSeedAutoAssignColors: true, // source: useColumnManager.js:42

  // ---- sortTags: the order of the DROPDOWN option list, not of the chips ----
  // sortOptions (TagsRenderer.jsx:22-28) sorts by LABEL with localeCompare, and
  // `hideSelectedOptions` (TagsRenderer.jsx:451) then drops whatever row 0 already
  // holds (Reading / Traveling / Photography) — leaving these seven, in these orders.
  variantTagsShippedMenuOptionCount: 7, // 10 options − 3 selected on row 0
  variantTagsShippedMenuOrderNone: [
    "Music",
    "Cooking",
    "Crafting",
    "Volunteering",
    "Gardening",
    "Dancing",
    "Hiking",
  ], // source: table.js:785-824 (array order)
  variantTagsShippedMenuOrderAsc: [
    "Cooking",
    "Crafting",
    "Dancing",
    "Gardening",
    "Hiking",
    "Music",
    "Volunteering",
  ], // source: TagsRenderer.jsx:25-26 (localeCompare, a-z)
  variantTagsShippedMenuOrderDesc: [
    "Volunteering",
    "Music",
    "Hiking",
    "Gardening",
    "Dancing",
    "Crafting",
    "Cooking",
  ], // source: TagsRenderer.jsx:25-26 (localeCompare, z-a)

  // ---- colours on the rendered chip ----
  // optionColors[value] = option.optionColor || (autoAssignColors ? COLORS[i % 13]
  // : DEFAULT_TAG_BACKGROUND_COLOR) — TagsRenderer.jsx:200-208. `Reading` is options
  // index 0 -> COLORS[0] '#40474D33'; `Photography` is index 2 -> COLORS[2] '#6745E233'.
  variantTagsShippedAutoColorReading: ["64", "71", "77", "20"], // source: SelectRenderer.jsx:13
  variantTagsShippedAutoColorPhotography: ["103", "69", "226", "20"], // source: SelectRenderer.jsx:15
  // With autoAssignColors OFF the chip falls back to this design token, which stays a
  // RAW var() in the inline style attribute (React never resolves custom properties),
  // so it is asserted on the `style` attribute rather than through have.css.
  variantTagsShippedFallbackChipBackground: "var(--surfaces-surface-03)", // source: TagsRenderer.jsx:13,204

  // ---- transformation / validation ----
  // Row 0 is ['Reading','Traveling','Photography']; slicing to the first element must
  // drop two chips, which proves the transformation ran against the REAL array
  // cellValue. Every character survives clearAndTypeOnCodeMirror's tokenizer
  // (codemirrorCommands.js:29 keeps { } ( ) [ ] , : ; => * quoted strings,
  // [a-zA-Z0-9._#-]+ and whitespace).
  variantTagsShippedTransformation: "{{cellValue.slice(0,1)}}",
  variantTagsShippedTransformedChipCount: 1,
  // Emptying every cell is the ONLY way defaultOptionsList reaches the renderer with
  // the shipped dataset (SelectComponent.jsx:52 resolves `value ? … : defaultValue`,
  // and transformTableData.js:32-36 keeps '' because it uses `??`, not `||`).
  variantTagsShippedEmptyTransformation: "{{''}}",
  // customRule is the ONLY validation tagsV2 mounts (ValidationProperties.jsx:97-108)
  // and TagsV2ColumnAdapter.jsx:33-39 resolves it against `value`, NOT `cellValue`.
  // A non-empty STRING is the failure signal and becomes the message verbatim
  // (_helpers/utils.js:458-461).
  variantTagsShippedCustomRule: "{{value.toString()}}",
  variantTagsShippedCustomRuleErrorRow0: "Reading,Traveling,Photography",

  // ---- dynamic options ----
  // Re-labels the `Reading` VALUE only, so row 0's first chip must render the new
  // label while its other two tags fall back to String(value) — proof the dynamic
  // list replaced the static one (generateColumnsData.js:337-350).
  variantTagsShippedDynamicOptions:
    "{{[{ label: 'Novel', value: 'Reading' }]}}",
  variantTagsShippedDynamicFirstLabel: "Novel",

  // ---- the deprecation banner that separates tagsV2 (:131) from tags (:148) ----
  // DeprecatedColumnTypeMsg.jsx:57 returns null unless the columnType is one of the
  // eight DEPRECATED_COLUMN_TYPES (:5-14); :67 is the banner copy. The banner carries
  // no data-cy, so a contain.text / not.contain.text pair on the popover is the hook.
  deprecatedColumnTypeBanner: "This column type is deprecated", // source: DeprecatedColumnTypeMsg.jsx:67
  // DEPRECATED_COLUMN_TYPES entry for `tags` recommends this replacement (:10).
  deprecatedTagsAlternative: "Multiselect", // source: DeprecatedColumnTypeMsg.jsx:10

  // ───────────────────────── rating — the shipped `id` column ───────────────────
  // table.js:717-723 ships { name:'id', key:'id', columnType:'string' } and the
  // shipped dataset numbers the rows 1..10 (table.js:692), so re-typing `id` to
  // `rating` gives a REAL, data-bound rating column whose rows differ from one
  // another — row 0 lights one icon, row 2 lights three. No seeding required.
  // Nothing in useColumnManager seeds a rating column (there is no
  // `value === 'rating'` branch), which is exactly what makes F5 observable.
  variantRatingShippedColumn: "id", // source: table.js:717
  variantRatingShippedColumnKey: "id", // source: table.js:718
  variantRatingShippedSourceType: "string", // source: table.js:723
  variantRatingShippedRow0Selected: 1, // cellValue 1 -> index 0 — source: Rating.jsx:45
  variantRatingShippedRow2Selected: 3, // cellValue 3 -> index 2 — source: Rating.jsx:45
  variantRatingShippedEditRowIndex: 1, // row 1 (id 2) — kept off row 0 so the shipped
  // `defaultSelectedRow` {{{"id":1}}} (table.js:836) is never invalidated by an edit.
  variantRatingShippedRow1Selected: 2, // cellValue 2 -> index 1 — source: Rating.jsx:45
  // Key-rebind probe: `phone` is a 10-digit number, so numValue-1 exceeds every icon
  // index and the whole group lights up (Rating.jsx:111 `index <= currentRatingIndex`).
  variantRatingShippedAltKey: "phone", // source: table.js:692
  variantRatingShippedAltRow0Selected: 5, // maxRating default — source: Rating.jsx:24
  variantRatingShippedNewColumn: "ratecol",
  variantRatingShippedRenamedColumn: "renamedrate",

  // ---- transformations that expose the branches the shipped data cannot ----
  // `*` survives clearAndTypeOnCodeMirror's tokenizer, `/` does not — so a doubling
  // and a halving are the two safe arithmetic probes.
  variantRatingShippedTransformation: "{{cellValue*2}}",
  variantRatingShippedTransformedRow0Selected: 2, // 1*2 — source: transformTableData.js:32-36
  // transformTableData.js:32-36 commits '' because it falls back with `??` (not `||`),
  // so this empties EVERY cell and drives Rating.jsx:40-44's `isEmpty` branch — the
  // only branch in which `defaultRating` is consumed at all.
  variantRatingEmptyTransformation: "{{''}}",
  variantRatingUnsetDefaultSelected: 0, // defaultRating `?? 0` -> index -1 — source: Rating.jsx:37,43
  variantRatingDefaultOverride: "{{2}}",
  variantRatingDefaultOverrideSelected: 2, // source: Rating.jsx:43
  // Halving turns row 2 (id 3) into 1.5 -> currentRatingIndex 0.5, which makes icon 0
  // aria-checked and icon 1 the HALF icon (Rating.jsx:80-83, :111).
  variantRatingHalfTransformation: "{{cellValue*0.5}}",
  variantRatingHalfRowIndexShipped: 2,
  variantRatingHalfRowSelectedShipped: 1, // source: Rating.jsx:111
  variantRatingHalfIconIndexShipped: 1, // source: Rating.jsx:82

  // ---- maxRating (RatingColumnProperties.jsx:22-37) ----
  variantRatingDefaultMaxRating: 5, // source: Rating.jsx:24 (`|| 5`)
  variantRatingMaxOverride: "{{3}}",
  variantRatingMaxOverrideCount: 3,
  variantRatingAriaSetSizeDefault: "5", // source: RatingIcon.jsx:149
  variantRatingAriaSetSizeOverride: "3", // source: RatingIcon.jsx:149

  // ---- the three unnamed code-field wrappers a rating column mounts ----
  // RatingColumnProperties.jsx:22 (Max rating), :38 (Default rating) and :54 (Allow
  // half rating) all use `div.field.mb-2.px-3` with NO data-cy — the same F29-shaped
  // defect as number's Decimal Places and link's Display text. Pinning the count is
  // what keeps tableSelector.columnMaxRatingField / columnDefaultRatingField's
  // positional :eq(0) / :eq(1) honest.
  variantRatingUnnamedFieldCount: 3, // source: RatingColumnProperties.jsx:22,38,54

  // ---- allowHalfStar (RatingColumnProperties.jsx:54-68) ----
  // The fx editor falls through to ProgramaticallyHandleProperties.jsx:87's terminal
  // `{{false}}` because there is no `allowHalfStar` branch in getInitialValue.
  variantRatingAllowHalfDefault: "{{false}}", // source: ProgramaticallyHandleProperties.jsx:87

  // ---- iconType (PropertiesTabElements.jsx:219-227 + RatingIconToggle.jsx:14-23) ----
  // Rating.jsx:100 encodes BOTH the icon type and maxRating into the radiogroup's
  // aria-label, so one attribute assertion pins both at once.
  variantRatingAriaGroupStars5: "Rating widget, stars from 1 to 5", // source: Rating.jsx:100
  variantRatingAriaGroupHearts5: "Rating widget, hearts from 1 to 5", // source: Rating.jsx:100
  variantRatingAriaGroupStars3: "Rating widget, stars from 1 to 3", // source: Rating.jsx:100

  // ---- rating colours ----
  // Rating.jsx:28-30 fallbacks. They are written into the icon's `fill` ATTRIBUTE
  // (RatingIcon.jsx:35-43 -> icons/star.jsx:16,31 / icons/heart.jsx), never as CSS, so
  // every colour assertion here is have.attr, not have.css.
  variantRatingDefaultSelectedHeartsColor: "#EE5B67", // source: Rating.jsx:29
  // BaseColorSwatches.jsx:67-72 builds `#rrggbb` + a 2-digit alpha, so an rgba of
  // [r,g,b,100] always lands as the 8-digit hex beside it.
  variantRatingUnselectedRgbaHex: "#00ff00ff", // for variantRatingUnselectedRgba

  // ═════════ VARIANTS FACET — table-wide labels these two specs assert ═════════
  // PropertiesTabElements.jsx:220 renders the Icon field's label as a bare string
  // (no i18n key), which is why it is spelled out here rather than reused.
  labelRatingIcon: "Icon", // source: PropertiesTabElements.jsx:221
  // RatingColumnProperties.jsx:20 — the section heading above Max/Default rating.
  labelRatingOptionsSection: "Options", // source: RatingColumnProperties.jsx:20

  // ═════════ VARIANTS FACET — button column type ═════════
  // Used by variants/button.cy.js. `button` is the ONLY column type with a TWO-LEVEL
  // popover: level 1 (selectedButtonId === null) is the column itself + the button
  // LIST, level 2 is the per-button editor that replaces BOTH tabs
  // (ColumnPopover.jsx:25,65-66 · PropertiesTabElements.jsx:248,275 ·
  // StylesTabElements.jsx:264,283). It is also the only type that renders ACTIONS
  // rather than a cell value, so it has no data dependency at all — the spec re-types
  // the shipped `name` column and seeds nothing.

  // ---- event trigger + accordion the per-button EventManager mounts ----
  // NOT a widget-config event: ButtonPropertiesTab.jsx:119 hands the EventManager its
  // own eventMetaDefinition, so "On click" exists only inside the Edit Button view and
  // is keyed on the compound ref `${column.key || column.name}::${button.id}` (:22).
  variantButtonEventOnClick: "On click", // source: ButtonPropertiesTab.jsx:119
  variantButtonEventsAccordion: "Events", // source: ButtonPropertiesTab.jsx:111

  // ---- <td> classes a button column shares with the action pseudo-columns ----
  // TableRow.jsx:108-111 ORs `has-actions` across leftActions / rightActions / button,
  // so the two sibling classes are what prove this cell is the COLUMN, not a gutter.
  variantButtonCellClassLeftActions: "has-left-actions", // source: TableRow.jsx:112
  variantButtonCellClassRightActions: "has-right-actions", // source: TableRow.jsx:113

  // ---- the shipped column the spec drives ----
  variantButtonColumn: "name", // source: table.js:736
  variantButtonColumnKey: "name", // source: table.js:737
  variantNewButtonColumn: "btncol",

  // ---- the four defaults the type switch seeds (useColumnManager.js:58-66) ----
  variantButtonSeedAlignment: "left", // source: useColumnManager.js:62
  variantButtonSeedAlignmentClass: "table-text-align-left", // source: TableRow.jsx:116
  variantButtonSeedPinPosition: "unpinned", // source: useColumnManager.js:63
  variantButtonSeedButtonCount: 0, // source: useColumnManager.js:64 (buttons: [])
  // columnVisibility is seeded as a real BOOLEAN true (:61), not the '{{true}}' STRING
  // every other column type falls back to (ProgramaticallyHandleProperties.jsx:22), so
  // the fx editor's default text differs per type — the spec proves visibility through
  // its RENDERED effect instead of that text.
  variantButtonHiddenColumnVisibility: "{{false}}",
  variantButtonHiddenButtonVisibility: "{{false}}",

  // ---- the empty state (ButtonListManager.jsx:72-96) ----
  variantButtonListSectionHeader: "Buttons", // source: ButtonListManager.jsx:69
  variantButtonEmptyStateBody:
    "Add action buttons to table rows and configure events like you would with any button component", // source: ButtonListManager.jsx:93

  // ---- per-button labels typed by the spec ----
  variantButtonRenamedLabel: "Approve", // written into buttonLabel (ButtonPropertiesTab.jsx:26-39)
  variantButtonSecondLabel: "Reject",
  // clearAndTypeOnCodeMirror drops every character outside its tokenizer
  // (codemirrorCommands.js:29), so tooltip/alert copy stays alphanumeric + spaces.
  variantButtonTooltipText: "Approve this row", // buttonTooltip (:41-54)
  variantButtonToastOnClick: "action button clicked", // Show Alert message

  // ---- rendered button contract (ButtonColumnAdapter.jsx) ----
  // Every default below is a design TOKEN that React writes verbatim into the inline
  // style attribute (custom properties are never resolved by React), so they are
  // asserted on the attribute string, not through have.css.
  variantButtonSolidBackground: "var(--cc-primary-brand)", // source: ButtonColumnAdapter.jsx:55
  variantButtonSolidLabelColor: "var(--text-on-solid)", // source: ButtonColumnAdapter.jsx:63
  variantButtonOutlineBackground: "transparent", // source: ButtonColumnAdapter.jsx:54,57
  // ButtonStylesTab.jsx:36 rewrites buttonLabelColor when the stored one is still a
  // DEFAULT (:22-28) — the side effect of switching to outline.
  variantButtonOutlineLabelColor: "var(--cc-primary-text)", // source: ButtonStylesTab.jsx:36
  variantButtonDefaultIconColor: "var(--icon-on-solid)", // source: ButtonColumnAdapter.jsx:66
  variantButtonDefaultLoaderFill: "var(--icon-on-solid)", // source: ButtonUtils.jsx:5
  variantButtonDisabledOpacity: "0.5", // source: ButtonColumnAdapter.jsx:92 (opacity: '50%')
  variantButtonDefaultBorderRadius: "6", // source: useButtonManager.js:14
  variantButtonDefaultBorderRadiusCss: "6px", // source: ButtonColumnAdapter.jsx:77
  variantButtonBorderRadius: "16",
  variantButtonBorderRadiusCss: "16px",
  variantButtonDefaultIconName: "IconHome2", // source: useButtonManager.js:16

  // ---- colours the spec writes (BaseColorSwatches.jsx:67-72 stores #rrggbbaa) ----
  variantButtonBackgroundRgba: ["255", "0", "0", "100"],
  variantButtonLabelColorRgba: ["0", "0", "255", "100"],
  variantButtonBorderColorRgba: ["0", "128", "0", "100"],
  variantButtonLoaderColorRgba: ["255", "0", "255", "100"],
  variantButtonIconColorRgba: ["255", "128", "0", "100"],
  variantButtonCellColorRgba: ["0", "0", "255", "100"],
  // The Loader's colour is interpolated into a radial-gradient STRING
  // (utilComponents/loader.jsx:9-11), so it can only be matched as a substring of the
  // spinner's inline style. Chrome normalises the 8-digit hex to `rgb(r, g, b)`.
  variantButtonLoaderColorCss: "255, 0, 255",

  // ---- F3: the ONE unnamed picker in the Edit Button > Styles view ----
  // ButtonStylesTab.jsx:144 mounts Icon color with `displayName: ''`, so
  // BaseColorSwatches.jsx:139 interpolates String(undefined) and it renders
  // `undefined-picker`. Pinning the count keeps the positional index honest.
  variantButtonUndefinedPickerCount: 1, // source: ButtonStylesTab.jsx:134-147

  // ---- ToggleGroup VALUES in the Edit Button > Styles view ----
  // ToggleGroup.jsx:18 swallows Radix's empty onValueChange, so clicking an item that
  // is ALREADY pressed is a silent no-op — `solid` can only be set by going through
  // `outline` first.
  variantButtonTypeSolid: "solid", // source: ButtonStylesTab.jsx:49
  variantButtonTypeOutline: "outline", // source: ButtonStylesTab.jsx:50
};
