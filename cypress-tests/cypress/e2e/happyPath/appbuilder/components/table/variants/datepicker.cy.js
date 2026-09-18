/**
 * SPEC — Table — variants/datepicker.
 *
 * FOR AI: covers the `datepicker` COLUMN TYPE of the Table widget end to end.
 * `datepicker` is the most control-dense column type in the product: THIRTEEN
 * type-specific controls spread over two accordions
 * (`DatepickerProperties.jsx:93` "Date format" and `:252` "Parse format") on top
 * of the six shared column controls, three shared styles and SIX validations.
 * Source root: frontend/src/AppBuilder/RightSideBar/Inspector/Components/Table/
 * (`columns` is declared bare as `type:'array'` at table.js:44, so NONE of these
 * controls live in the widget config — they live in the ColumnManager).
 *
 * ── WHY THE SHIPPED `date` COLUMN AND NO setTableData ───────────────────────
 * Unlike `link`/`tagsV2`, this type needs no seeded dataset: the shipped default
 * already carries a real, data-bound datepicker column —
 *   { name:'date', key:'date', columnType:'datepicker', isTimeChecked:false,
 *     dateFormat:'DD/MM/YYYY', parseDateFormat:'DD/MM/YYYY',
 *     isDateSelectionEnabled:true }                     (table.js:754-766)
 * bound to `date: '15/05/2022'` on row 0 (table.js:692). Driving THAT column
 * means every assertion below runs against shipped defaults and simultaneously
 * proves the shipped configuration still renders. variants/image.cy.js takes the
 * same approach for `photo` and documents the same reasoning. Column CREATION —
 * where the useColumnManager type-switch seeding (:47-55) is what is under test —
 * gets its own it-block, and so does switching the type away and back.
 *
 * ── WHAT MAKES `datepicker` DIFFERENT FROM EVERY OTHER TYPE ────────────────
 *  · IT IS THE ONLY TYPE WITH AN INVERTED FX MODEL. `dateFormat` and
 *    `parseDateFormat` do NOT use `column.fxActiveFields` (the opt-IN array every
 *    other control uses, ProgramaticallyHandleProperties.jsx:104-147). They use
 *    `column.notActiveFxActiveFields` — an OPT-OUT array — plus a component-local
 *    useState (DatepickerProperties.jsx:82-89). Because the array starts
 *    undefined, `!undefined?.includes(x)` is `true`, so BOTH format fields open
 *    on their fx CodeHinter rather than on the DD/MM/YYYY dropdown. That single
 *    fact drives most of the gating below, including the fact that the display
 *    "Time Format" select (:184) never mounts until the display fx is turned OFF.
 *  · ITS CELL RENDERS THE VALUE TWICE. DatePickerRenderer.jsx:328-339 keeps a
 *    HIDDEN measuring <span> holding computeDateString(date), next to the visible
 *    DatepickerInput. `have.text` on the <td> therefore reads the value twice —
 *    every text assertion here uses tableSelector.cellDatepickerText /
 *    cellDatepickerInput, never verifyCellValue / tableSelector.cell.
 *  · IT IS THE ONLY TYPE WHOSE CELL TEXT IS COMPUTED, not echoed. The value is
 *    PARSED with `parseDateFormat` (+ optional unix / time-zone branches,
 *    DatePickerRenderer.jsx:64-96) and re-FORMATTED with `dateFormat`
 *    (+ time / 24h / time-zone branches, :162-186). Both a bad parse and a bad
 *    format are observable, which is what makes every control below assertable
 *    against the rendered cell rather than against the inspector alone.
 *
 * ── HARNESS (deliberate deviation from the generic facet header contract) ───
 * `waitForDropSettle` DOES NOT EXIST in this repo, and the plain
 * `query-manager-toggle-button` beforeEach leaves the Table too short for its
 * cells to be reachable. This spec reuses the proven-green Table harness shared
 * by basics.cy.js / inspector.cy.js / styles.cy.js / canvas.cy.js: viewport →
 * drag → hideTooltip → modifyCanvasSize → close the settings panel →
 * resizeTableWidget → resizeQueryPanel('1') → openEditorSidebar.
 * ONE cy.dragAndDropWidget per test, in beforeEach (F28 — cypress-real-dnd caches
 * its CDP client per AUT load, so a second drag in the same test throws).
 *
 * ── TWO-NODE WIDGET ────────────────────────────────────────────────────────
 * The Table renders `draggable-widget-table1` on BOTH the outer RenderWidget
 * wrapper AND its inner <table>, so `openStateFromComponent` / `openNode` /
 * `openAndVerifyNode` throw here (their internal realHover is unscoped). This
 * facet asserts only rendered-canvas + popover DOM, so it needs none of them.
 *
 * ── POPOVER LIFECYCLE (load-bearing) ───────────────────────────────────────
 * The column popover is an OverlayTrigger with a CONTROLLED `show`
 * (Table.jsx:536-543) whose rootClose is disabled while any CodeHinter preview
 * popover is open (usePopoverState.js:33-43). A canvas click therefore may NOT
 * close it — every test closes it with `closeColumnPopover(<column>)`, which
 * re-clicks the list item and asserts the popover is gone. openColumnPopover()
 * must never be called while the popover is already open (the same click would
 * toggle it shut). `cy.forceClickOnCanvas()` deselects the widget and closes the
 * right Inspector, so every return to the inspector is preceded by
 * `openEditorSidebar(W)`.
 *
 * ── PRODUCT BUGS / SOURCE QUIRKS HONOURED HERE ─────────────────────────────
 *  F15 (MED) DUPLICATE data-cy. `input-parse-timezone` is emitted TWICE by
 *      DatepickerProperties — once for the parse-format "Date" block (:291) and
 *      once for the parse "Time zone" block (:363) — and so is
 *      `label-parse-timezone` (:293, :364). Both duplicates are IN THE DOM
 *      simultaneously as soon as "Enable time" is on. Every helper pins `:eq(0)`
 *      for the Date field; the duplication itself is asserted in its own
 *      it-block so a future de-dupe breaks a test rather than silently
 *      re-pointing every selector.
 *  F6 (LOW) THE PARSE-FORMAT FX HANDLER IS CROSS-WIRED. `:301` branches on
 *      `isDateDisplayFormatFxOn` while `:306` sets `isParseDateFormatFxOn`, so
 *      what the PARSE fx button writes to `notActiveFxActiveFields` is decided by
 *      the DISPLAY fx state. The observable consequence — a parse fx-OFF that is
 *      never persisted and reverts on the next popover mount — is asserted in
 *      full. Its FxButton also gets no dataCy (:297-309), exactly like the
 *      display one (:124-136), so both render the literal `undefined-fx-button`.
 *  F1 (HIGH) NO VALIDATION CONTROL HAS A data-cy. getValidationList declares the
 *      key `dateCy` (:115,:122,:132,:139,:149,:156 for datepicker) but all three
 *      render branches read `validation.dataCy` (:179,:199,:216), so React drops
 *      `data-cy={undefined}`. setColumnValidation / verifyColumnValidation
 *      address the field by its <label> text instead; that workaround is the only
 *      reason the six validation blocks below can exist at all.
 *  F21       cell COLOUR assertions use `tableSelector.cellContentNode`
 *      (`div:not(:has(div))`), which for a read-only datepicker resolves to the
 *      SAME DatepickerInput div as `cellDatepickerText` — never `cellContent`,
 *      which matches the whole nested div chain.
 *  F19       the column-list data-cy is NOT normalised (Table.jsx:571
 *      interpolates the raw display name), so all helpers use `columnListItem`.
 *
 * Helpers (all resolved through cypress/support/componentAutomation/type-helper-index.md):
 *   components/table.js — resizeTableWidget, openColumnPopover,
 *     closeColumnPopover, switchColumnTab, setColumnType, addColumnOfType,
 *     deleteColumn, verifyAndEnterColumnOptionInput, setColumnCodeField,
 *     verifyColumnCodeField, setColumnProperty, verifyColumnProperty,
 *     toggleColumnProperty, toggleColumnFx, setColumnColor, verifyColumnColor,
 *     setColumnAlignment, setPinPosition, verifyCellType, setColumnValidation,
 *     verifyColumnValidation, setDateFormat, setParseDateFormat,
 *     toggleDateFormatFx, toggleParseDateFormatFx, toggleEnableTime,
 *     toggleParseUnixTimestamp, setTimeZone
 *   appBuilder/properties.js — openEditorSidebar
 *   appBuilder/styles.js — verifyWidgetColorCss
 *   appBuilder/querymanager/queryPanel.js — resizeQueryPanel
 */
import { fake } from "Fixtures/fake";
import { tableSelector } from "Selectors/appBuilder/components/table";
import { tableText } from "Texts/appBuilder/components/table";
import {
  resizeTableWidget,
  openColumnPopover,
  closeColumnPopover,
  switchColumnTab,
  setColumnType,
  addColumnOfType,
  deleteColumn,
  verifyAndEnterColumnOptionInput,
  setColumnCodeField,
  verifyColumnCodeField,
  setColumnProperty,
  verifyColumnProperty,
  toggleColumnProperty,
  toggleColumnFx,
  setColumnColor,
  verifyColumnColor,
  setColumnAlignment,
  setPinPosition,
  verifyCellType,
  setColumnValidation,
  verifyColumnValidation,
  setDateFormat,
  setParseDateFormat,
  toggleDateFormatFx,
  toggleParseDateFormatFx,
  toggleEnableTime,
  toggleParseUnixTimestamp,
  setTimeZone,
} from "Support/utils/appBuilder/components/table";
import { openEditorSidebar } from "Support/utils/appBuilder/properties";
import { verifyWidgetColorCss } from "Support/utils/appBuilder/styles";
import { resizeQueryPanel } from "Support/utils/appBuilder/querymanager/queryPanel";

// testIsolation:false — cypress-real-dnd caches its CDP client for the spec run;
// testIsolation's per-test AUT reset leaves that client stale, so 2nd+ test drags
// throw "No dragIntercepted". Keeping the AUT stable across tests keeps the drag
// intercept valid. Each test still re-logs-in + creates its own app in beforeEach,
// so shared browser state is not relied upon.
describe("Table — variants/datepicker column type", { testIsolation: false }, () => {
  const W = tableText.defaultWidgetName; // 'table1'
  const C = tableText.variantDateColumn; // 'date' — source: table.js:755

  // ── local helpers ────────────────────────────────────────────────────────
  // Two DatepickerProperties controls are mounted with NO data-cy anywhere in
  // their subtree: the DISPLAY "Time Format" select (:185-205) and the PARSE
  // "Time" select (:341-361). Their <label> text is the only hook — the same
  // shape setColumnValidation uses for the F1 validation defect. Scoped to the
  // popover so the Styles-tab / property-panel labels can never collide.
  // source: ColumnManager/DatepickerProperties.jsx:186,:342
  const popoverFieldByLabel = (labelText) =>
    cy
      .get(tableSelector.columnPopover)
      .find("label.form-label")
      .filter((_i, el) => el.innerText.trim() === labelText)
      .first()
      .parent();

  // Assert how many popover fields carry a given <label> text. Used to prove the
  // GATING of the two label-only selects (they must be ABSENT until their gate
  // resolves truthy), which a `.should('not.exist')` on a data-cy cannot express.
  const countPopoverFieldsByLabel = (labelText) =>
    cy
      .get(tableSelector.columnPopover)
      .find("label.form-label")
      .filter((_i, el) => el.innerText.trim() === labelText);

  // Pick the PARSE-side time zone. `setTimeZone` targets `input-display-time-zone`
  // (DatepickerProperties.jsx:223) which is unique; the parse-side select shares
  // the F15-duplicated `input-parse-timezone` with the parse "Date" field, and is
  // the SECOND of the two (:291 Date, :363 Time zone) — hence `.eq(1)`.
  // source: ColumnManager/DatepickerProperties.jsx:363-380
  const setParseTimeZone = (zoneName) => {
    cy.get(tableSelector.parseTimezoneField)
      .eq(1)
      .find("input")
      .first()
      .click({ force: true })
      .type(`${zoneName}`, { force: true });
    cy.get(tableSelector.inspectorSelectOption)
      .filter((_i, el) => el.innerText.trim() === zoneName)
      .first()
      .click({ force: true });
    cy.waitForAutoSave();
  };

  // Pick the unix-timestamp UNIT. The select carries no data-cy of its own
  // (:273-285); its `label-date-parse-format` label (:270) is its only anchor, so
  // it is reached through that label's parent field. No typing — with only two
  // options ('s' / 'ms') a text match on the open menu is unambiguous, and
  // react-select's default filter stringifies `label + value`, so typing 's'
  // would match BOTH options.
  // source: ColumnManager/DatepickerProperties.jsx:267-287
  const setUnixTimestampUnit = (optionLabel) => {
    cy.get(tableSelector.unixTimestampLabel)
      .parent()
      .find("input")
      .first()
      .click({ force: true });
    cy.get(tableSelector.inspectorSelectOption)
      .filter((_i, el) => el.innerText.trim() === optionLabel)
      .first()
      .click({ force: true });
    cy.waitForAutoSave();
  };

  beforeEach(() => {
    cy.apiLogin();
    cy.apiCreateApp(`${fake.companyName}-Table-Datepicker-Column`); // dynamic: fake
    cy.openApp();
    cy.viewport(1400, 2200);
    cy.dragAndDropWidget("Table", 250, 100);
    cy.hideTooltip();
    cy.modifyCanvasSize(900, 800);
    cy.get("[data-cy='left-sidebar-settings-button']").click();
    resizeTableWidget(W, 750, 600);
    resizeQueryPanel("1");
    openEditorSidebar(W);
  });

  afterEach(() => {
    cy.apiDeleteApp();
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // COLUMN CREATION / TYPE SWITCH
  // ═══════════════════════════════════════════════════════════════════════════

  it("column type — the shipped `date` column ships as `datepicker` with both accordions, and switching the type away and back re-seeds the useColumnManager defaults", () => {
    openColumnPopover(C);
    // SelectComponent.jsx:52 resolves the raw stored value ('datepicker') back to
    // its option, so the react-select SingleValue renders the option LABEL.
    cy.get(tableSelector.columnPopover)
      .find(tableSelector.columnTypeSelect)
      .should("contain.text", tableText.columnTypeLabel.datepicker); // source: PropertiesTabElements.jsx:128
    // DatepickerProperties pushes exactly two accordion items; AccordionItem.js:39
    // slugs each title into `widget-accordion-<slug>`.
    cy.get(tableSelector.dateFormatAccordion).should(
      "have.text",
      tableText.accordionDateFormat
    ); // source: DatepickerProperties.jsx:93
    cy.get(tableSelector.parseFormatAccordion).should(
      "have.text",
      tableText.accordionParseFormat
    ); // source: DatepickerProperties.jsx:252
    closeColumnPopover(C);

    cy.forceClickOnCanvas();
    cy.get(tableSelector.cell(C, 0, W)).scrollIntoView();
    // `datepicker` is one of the eight types that DO add a discriminating <td> class.
    verifyCellType(C, 0, tableText.cellClassByType.datepicker, W); // source: TableRow.jsx:119
    // The rendered text is COMPUTED: '15/05/2022' is parsed with parseDateFormat
    // 'DD/MM/YYYY' (DatePickerRenderer.jsx:90) and re-formatted with dateFormat
    // 'DD/MM/YYYY' (:180) — the round trip happens to be the identity here.
    cy.get(tableSelector.cellDatepickerText(C, 0, W)).should(
      "have.text",
      tableText.variantDateRow0Rendered
    ); // source: DatePickerRenderer.jsx:180

    // Switch to `string`: the textarea renderer takes over, the whole datepicker
    // input container is gone and the RAW stored value is rendered as plain text.
    openEditorSidebar(W);
    setColumnType(C, tableText.columnTypeValue.string); // source: PropertiesTabElements.jsx:125
    closeColumnPopover(C);
    cy.forceClickOnCanvas();
    verifyCellType(C, 0, tableText.cellClassByType.string, W); // source: TableRow.jsx:132
    cy.get(tableSelector.cellDatepickerContainer(C, 0, W)).should("not.exist"); // source: DatePickerRenderer.jsx:16
    cy.get(tableSelector.cell(C, 0, W)).should(
      "contain.text",
      tableText.variantDateRow0Raw
    ); // source: table.js:692

    // …and back to `datepicker`. useColumnManager.js:47-55 is the ONLY writer of
    // these four keys, so asserting them here is what proves the type-switch
    // seeding ran (the previous switch to `string` did not clear them, but a
    // freshly seeded column must show exactly these values).
    openEditorSidebar(W);
    setColumnType(C, tableText.columnTypeValue.datepicker); // source: PropertiesTabElements.jsx:128
    verifyColumnCodeField(
      tableSelector.dateDisplayFormatField,
      tableText.variantDateSeedDateFormat
    ); // source: useColumnManager.js:50
    verifyColumnCodeField(
      tableSelector.parseTimezoneField,
      tableText.variantDateSeedParseFormat
    ); // source: useColumnManager.js:51
    cy.get(tableSelector.columnParamToggle(tableText.labelEnableDate)).should(
      "be.checked"
    ); // source: useColumnManager.js:52
    cy.get(tableSelector.columnParamToggle(tableText.labelEnableTime)).should(
      "not.be.checked"
    ); // source: useColumnManager.js:49
    closeColumnPopover(C);

    cy.forceClickOnCanvas();
    verifyCellType(C, 0, tableText.cellClassByType.datepicker, W); // source: TableRow.jsx:119
    cy.get(tableSelector.cellDatepickerText(C, 0, W)).should(
      "have.text",
      tableText.variantDateRow0Rendered
    ); // source: DatePickerRenderer.jsx:180
  });

  it("column manager — a `datepicker` column can be added, seeded, bound to a key and deleted", () => {
    // addColumnOfType sets the TYPE first (so useColumnManager seeds the four
    // datepicker keys and the type-specific fields mount), then the name, then the
    // key — the key is what the row data is read from
    // (generateColumnsData.js:163 accessorKey = column.key || column.name).
    addColumnOfType(
      tableText.variantNewDateColumn,
      tableText.columnTypeValue.datepicker, // source: PropertiesTabElements.jsx:128
      tableText.variantDateColumnKey // source: table.js:756
    );
    // A brand-new column carries NO notActiveFxActiveFields, so both format fields
    // open on their fx CodeHinter (DatepickerProperties.jsx:82-89) showing the
    // seeded values verbatim.
    verifyColumnCodeField(
      tableSelector.dateDisplayFormatField,
      tableText.variantDateSeedDateFormat
    ); // source: useColumnManager.js:50
    verifyColumnCodeField(
      tableSelector.parseTimezoneField,
      tableText.variantDateSeedParseFormat
    ); // source: useColumnManager.js:51
    closeColumnPopover(tableText.variantNewDateColumn);

    cy.forceClickOnCanvas();
    cy.get(tableSelector.columnHeader(tableText.variantNewDateColumn))
      .scrollIntoView()
      .should("have.text", tableText.variantNewDateColumn); // source: TableHeader.jsx:153
    // Bound to the same `date` key, so it renders exactly like the shipped column —
    // which is only possible if the seeded parse AND display formats both took.
    cy.get(
      tableSelector.cellDatepickerText(tableText.variantNewDateColumn, 0, W)
    ).should("have.text", tableText.variantDateRow0Rendered); // source: DatePickerRenderer.jsx:180

    openEditorSidebar(W);
    // deleteColumn drives the popover header's [title="Delete column"] and asserts
    // BOTH the inspector row and the rendered header are gone.
    deleteColumn(tableText.variantNewDateColumn); // source: ColumnPopover.jsx:130-138
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // SHARED PROPERTIES (Properties tab)
  // ═══════════════════════════════════════════════════════════════════════════

  it("properties — Column name renames the rendered column, Key rebinds the value that gets parsed", () => {
    openColumnPopover(C);
    verifyColumnCodeField(tableSelector.columnNameField, C); // source: PropertiesTabElements.jsx:164-181
    verifyColumnCodeField(
      tableSelector.columnKeyField,
      tableText.variantDateColumnKey
    ); // source: PropertiesTabElements.jsx:182-197

    // Renaming re-keys the rendered header AND every cell data-cy, because both are
    // derived from `columnDef.header` = the resolved column name
    // (generateColumnsData.js:165 → TableHeader.jsx:153 / TableRow.jsx:102-105).
    verifyAndEnterColumnOptionInput(
      tableText.labelColumnName,
      tableText.variantRenamedDateColumn
    ); // source: PropertiesTabElements.jsx:166
    closeColumnPopover(tableText.variantRenamedDateColumn);
    cy.forceClickOnCanvas();
    cy.get(tableSelector.columnHeader(tableText.variantRenamedDateColumn))
      .scrollIntoView()
      .should("have.text", tableText.variantRenamedDateColumn); // source: TableHeader.jsx:153
    cy.get(
      tableSelector.cellDatepickerText(tableText.variantRenamedDateColumn, 0, W)
    ).should("have.text", tableText.variantDateRow0Rendered); // source: DatePickerRenderer.jsx:180

    // The Key is the accessor. Re-pointing it at the sibling `name` key feeds
    // 'Olivia Nguyen' into parseDate, which no branch can parse — momentObj is
    // invalid, parsedDate is null and computeDateString falls to its 'Invalid date'
    // literal. That is the cleanest possible proof the accessor really moved.
    openEditorSidebar(W);
    openColumnPopover(tableText.variantRenamedDateColumn);
    verifyAndEnterColumnOptionInput(
      tableText.labelKey,
      tableText.variantDateAltKey
    ); // source: PropertiesTabElements.jsx:183
    closeColumnPopover(tableText.variantRenamedDateColumn);
    cy.forceClickOnCanvas();
    cy.get(
      tableSelector.cellDatepickerText(tableText.variantRenamedDateColumn, 0, W)
    ).should("have.text", tableText.variantDateInvalid); // source: DatePickerRenderer.jsx:166
  });

  it("properties — Transformation rewrites the value BEFORE it is parsed and re-formatted", () => {
    openColumnPopover(C);
    verifyColumnCodeField(
      tableSelector.columnTransformationField,
      tableText.defaultTransformation
    ); // source: PropertiesTabElements.jsx:205

    // columnSlice.js:99 deliberately DROPS a transformation equal to '{{cellValue}}',
    // so only a real expression reaches transformTableData.js:33 — which rewrites the
    // row's value for this key BEFORE DatePickerRenderer ever parses it. The rewritten
    // string still matches parseDateFormat, so it round-trips to a valid new date
    // rather than to 'Invalid date'.
    setColumnCodeField(
      tableSelector.columnTransformationField,
      tableText.variantDateTransformation
    ); // source: PropertiesTabElements.jsx:200-218
    closeColumnPopover(C);

    cy.forceClickOnCanvas();
    cy.get(tableSelector.cell(C, 0, W)).scrollIntoView();
    cy.get(tableSelector.cellDatepickerText(C, 0, W)).should(
      "have.text",
      tableText.variantDateTransformedRow0
    ); // source: transformTableData.js:33
  });

  it("properties — Visibility (fx) removes the column from the rendered table", () => {
    openColumnPopover(C);
    toggleColumnFx(tableText.labelVisibility); // source: PropertiesTabElements.jsx:449-466
    verifyColumnProperty(
      tableText.labelVisibility,
      tableText.variantDefaultColumnVisibility
    ); // source: ProgramaticallyHandleProperties.jsx:22
    setColumnProperty(
      tableText.labelVisibility,
      tableText.variantHiddenColumnVisibility
    ); // source: PropertiesTabElements.jsx:457
    closeColumnPopover(C);

    // generateColumnsData.js:159 returns null for an invisible column, so the whole
    // column — header AND cells — is removed from the rendered table.
    cy.forceClickOnCanvas();
    cy.get(tableSelector.columnHeader(C)).should("not.exist"); // source: generateColumnsData.js:159
    cy.get(tableSelector.cell(C, 0, W)).should("not.exist"); // source: generateColumnsData.js:159
  });

  it("properties — Freeze column pins the rendered cell to the left", () => {
    openColumnPopover(C);
    setPinPosition(tableText.pinLeft); // source: PropertiesTabElements.jsx:76
    closeColumnPopover(C);

    cy.forceClickOnCanvas();
    cy.get(tableSelector.cell(C, 0, W))
      .scrollIntoView()
      .should("have.class", tableText.cellClassPinnedLeft); // source: TableRow.jsx:138
  });

  it("properties — Make editable swaps the read-only div for a real datepicker input with a calendar icon", () => {
    cy.forceClickOnCanvas();
    // Baseline: readOnly renders the plain measuring div (DatePickerRenderer.jsx:18-20)
    // and NO input at all.
    cy.get(tableSelector.cellDatepickerText(C, 0, W))
      .scrollIntoView()
      .should("have.text", tableText.variantDateRow0Rendered); // source: DatePickerRenderer.jsx:18
    cy.get(tableSelector.cellDatepickerInput(C, 0, W)).should("not.exist"); // source: DatePickerRenderer.jsx:23

    openEditorSidebar(W);
    openColumnPopover(C);
    toggleColumnProperty(tableText.labelMakeEditable); // source: PropertiesTabElements.jsx:385-400
    closeColumnPopover(C);

    cy.forceClickOnCanvas();
    cy.get(tableSelector.cell(C, 0, W)).scrollIntoView();
    // An editable cell keeps `has-datepicker` and ALSO picks up `has-text`, because
    // TableRow.jsx:118 ORs the text columnType with `isEditable`.
    verifyCellType(C, 0, tableText.cellClassByType.datepicker, W); // source: TableRow.jsx:119
    cy.get(tableSelector.cell(C, 0, W))
      .should("have.class", tableText.cellClassEditable) // source: TableRow.jsx:135
      .and("have.class", tableText.cellClassByType.text); // source: TableRow.jsx:118
    cy.get(tableSelector.cellDatepickerInput(C, 0, W)).should(
      "have.value",
      tableText.variantDateRow0Rendered
    ); // source: DatePickerRenderer.jsx:27
    // The calendar glyph is rendered ONLY in the editable branch (:35-43).
    cy.get(tableSelector.cellDatepickerIcon(C, 0, W)).should("have.length", 1); // source: DatePickerRenderer.jsx:41
    cy.get(tableSelector.cellDatepickerText(C, 0, W)).should("not.exist"); // source: DatePickerRenderer.jsx:17
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // ACCORDION "Date format" (DatepickerProperties.jsx:93)
  // ═══════════════════════════════════════════════════════════════════════════

  it("date format — `Enable date` defaults ON, is fx-capable, and turning it off blanks the cell and unmounts BOTH date-format fields", () => {
    openColumnPopover(C);
    // Seeded `true` as a RAW boolean (table.js:764), so the toggle's own checked
    // state — not an fx literal — is the faithful default assertion here.
    cy.get(tableSelector.columnParamToggle(tableText.labelEnableDate)).should(
      "be.checked"
    ); // source: table.js:764
    // Both format fields are gated on it: the DISPLAY format at :112 and the PARSE
    // "Date" block at :290.
    cy.get(tableSelector.dateDisplayFormatField).should("have.length", 1); // source: DatepickerProperties.jsx:112-114
    cy.get(tableSelector.parseTimezoneField).should("have.length", 1); // source: DatepickerProperties.jsx:290-291

    // It is mounted through ProgramaticallyHandleProperties (:99-110), so it is
    // fx-capable exactly like every other column toggle: the fx button mounts the
    // code field (SingleLineCodeEditor.jsx:794-802) and writing '{{false}}' there
    // is what proves the fx path reaches the same property.
    toggleColumnFx(tableText.labelEnableDate); // source: DatepickerProperties.jsx:99-110
    setColumnProperty(tableText.labelEnableDate, tableText.variantDateFxFalse); // source: DatepickerProperties.jsx:105
    cy.get(tableSelector.dateDisplayFormatField).should("not.exist"); // source: DatepickerProperties.jsx:112
    cy.get(tableSelector.parseTimezoneField).should("not.exist"); // source: DatepickerProperties.jsx:290
    closeColumnPopover(C);

    // computeDateString's second guard: with BOTH isDateSelectionEnabled and
    // isTimeChecked false the renderer returns the empty string, so the cell goes
    // BLANK rather than showing 'Invalid date'.
    cy.forceClickOnCanvas();
    cy.get(tableSelector.cellDatepickerText(C, 0, W))
      .scrollIntoView()
      .should("have.text", tableText.variantDateBlankCell); // source: DatePickerRenderer.jsx:165
  });

  it("date format — the display format field defaults to an fx CodeHinter (`notActiveFxActiveFields` is opt-OUT) and any moment token reaches the rendered cell", () => {
    openColumnPopover(C);
    cy.get(tableSelector.dateDisplayFormatLabel).should(
      "have.text",
      tableText.labelDateFormat
    ); // source: DatepickerProperties.jsx:120-122
    // THE INVERTED FX MODEL: `notActiveFxActiveFields` is undefined on the shipped
    // column, so `!undefined?.includes('dateFormat')` is true and the field opens on
    // the CodeHinter branch (:139-147), NOT on the DD/MM/YYYY dropdown (:149-161).
    cy.get(tableSelector.dateDisplayFormatField)
      .find(tableSelector.codeMirrorContent)
      .should("have.length", 1); // source: DatepickerProperties.jsx:82-89,:139
    verifyColumnCodeField(
      tableSelector.dateDisplayFormatField,
      tableText.variantDateSeedDateFormat
    ); // source: DatepickerProperties.jsx:141

    // generateColumnsData.js:431 passes `column.dateFormat` RAW (no getResolvedValue),
    // so any moment token works — which is the only reason the CodeHinter branch is
    // testable at all. 'YYYY' is used because clearAndTypeOnCodeMirror's tokenizer
    // (codemirrorCommands.js:29) silently drops '/', so the four slash formats can
    // only ever be set through the dropdown branch (next it-block).
    setDateFormat(tableText.variantDateFxFormat); // source: DatepickerProperties.jsx:146
    closeColumnPopover(C);

    cy.forceClickOnCanvas();
    cy.get(tableSelector.cellDatepickerText(C, 0, W))
      .scrollIntoView()
      .should("have.text", tableText.variantDateFxRendered); // source: DatePickerRenderer.jsx:180
  });

  it("date format — turning the display fx OFF mounts the four-option select, and MM/DD/YYYY re-formats the SAME instant", () => {
    openColumnPopover(C);
    // Flipping the (dataCy-less, F6) fx button PUSHES 'dateFormat' onto
    // `notActiveFxActiveFields` (:129) — the opt-OUT array — and the Select replaces
    // the CodeHinter.
    toggleDateFormatFx(); // source: DatepickerProperties.jsx:124-136
    cy.get(tableSelector.dateDisplayFormatField)
      .find(tableSelector.codeMirrorContent)
      .should("not.exist"); // source: DatepickerProperties.jsx:139

    // The whole DATE_FORMAT_OPTIONS set, in menu order. The menu is portalled to
    // document.body (SelectComponent.jsx:83) so it is NOT inside the popover.
    cy.get(tableSelector.dateDisplayFormatField)
      .find("input")
      .first()
      .click({ force: true });
    cy.get(tableSelector.inspectorSelectOption).should(
      "have.length",
      tableText.dateFormatOptions.length
    ); // source: DatepickerProperties.jsx:49-66
    tableText.dateFormatOptions.forEach((label, i) => {
      cy.get(tableSelector.inspectorSelectOption).eq(i).should("have.text", label); // source: DatepickerProperties.jsx:49-66
    });
    cy.get(tableSelector.inspectorSelectOption)
      .filter((_i, el) => el.innerText.trim() === tableText.dateFormatMmDdYyyy)
      .first()
      .click({ force: true });
    cy.waitForAutoSave();
    cy.get(tableSelector.dateDisplayFormatField)
      .find(tableSelector.inspectorSelectSingleValue)
      .should("have.text", tableText.dateFormatMmDdYyyy); // source: DatepickerProperties.jsx:151
    closeColumnPopover(C);

    // parseDateFormat is untouched, so the SAME instant (15 May 2022) is re-rendered
    // in US order — proof the display format is a pure formatting concern.
    cy.forceClickOnCanvas();
    cy.get(tableSelector.cellDatepickerText(C, 0, W))
      .scrollIntoView()
      .should("have.text", tableText.variantDateRow0RenderedUs); // source: DatePickerRenderer.jsx:180
  });

  it("date format — `Enable time` defaults OFF, gates the 24-hour toggle and the display time zone, and adds an LT time component to the cell", () => {
    openColumnPopover(C);
    // Seeded `false` as a RAW boolean (table.js:761).
    cy.get(tableSelector.columnParamToggle(tableText.labelEnableTime)).should(
      "not.be.checked"
    ); // source: table.js:761
    // Everything inside the `isTimeChecked` branch (:182-246) is absent.
    cy.get(
      tableSelector.columnParamToggle(tableText.labelEnable24HrFormat)
    ).should("not.exist"); // source: DatepickerProperties.jsx:207-220
    cy.get(tableSelector.displayTimeZoneField).should("not.exist"); // source: DatepickerProperties.jsx:222-244

    toggleEnableTime(); // source: DatepickerProperties.jsx:169-180
    cy.get(
      tableSelector.columnParamToggle(tableText.labelEnable24HrFormat)
    ).should("have.length", 1); // source: DatepickerProperties.jsx:207-220
    cy.get(tableSelector.displayTimeZoneField).should("have.length", 1); // source: DatepickerProperties.jsx:222-244
    // …but the display "Time Format" select stays away: it is ALSO gated on
    // `!isDateDisplayFormatFxOn` (:184), and the display format defaults to fx ON.
    countPopoverFieldsByLabel(tableText.labelTimeFormatDisplay).should(
      "have.length",
      0
    ); // source: DatepickerProperties.jsx:184-186
    closeColumnPopover(C);

    // getDateTimeFormat appends 'LT' (12-hour) when the 24-hour toggle is off
    // (DatePickerRenderer.jsx:168-169). The seed value carries no time, so the
    // non-strict moment fallback (:92) lands it at local midnight.
    cy.forceClickOnCanvas();
    cy.get(tableSelector.cellDatepickerText(C, 0, W))
      .scrollIntoView()
      .should("have.text", tableText.variantDateRow0Rendered12h); // source: DatePickerRenderer.jsx:168
  });

  it("date format — the display `Time Format` and parse `Time` selects mount only once their fx is OFF, and each offers exactly HH:mm", () => {
    openColumnPopover(C);
    toggleEnableTime(); // source: DatepickerProperties.jsx:169-180
    // DISPLAY side — gated on `!isDateDisplayFormatFxOn` (:184).
    toggleDateFormatFx(); // source: DatepickerProperties.jsx:124-136
    popoverFieldByLabel(tableText.labelTimeFormatDisplay)
      .find(tableSelector.inspectorSelectSingleValue)
      .should("have.text", tableText.timeFormatHhMm); // source: DatepickerProperties.jsx:194
    // Its option list is a single hard-coded entry (:188-193) — opening the menu and
    // re-selecting that entry is a no-op that also closes the menu again.
    popoverFieldByLabel(tableText.labelTimeFormatDisplay)
      .find("input")
      .first()
      .click({ force: true });
    cy.get(tableSelector.inspectorSelectOption)
      .should("have.length", 1)
      .and("have.text", tableText.timeFormatHhMm); // source: DatepickerProperties.jsx:190
    cy.get(tableSelector.inspectorSelectOption).first().click({ force: true });

    // PARSE side — gated on `!isParseDateFormatFxOn` AND `isTimeChecked` (:338-340).
    // Its label is the bare word "Time" (:342), NOT "Time Format".
    countPopoverFieldsByLabel(tableText.labelParseTimeFormat).should(
      "have.length",
      0
    ); // source: DatepickerProperties.jsx:340
    toggleParseDateFormatFx(); // source: DatepickerProperties.jsx:297-309
    popoverFieldByLabel(tableText.labelParseTimeFormat)
      .find(tableSelector.inspectorSelectSingleValue)
      .should("have.text", tableText.timeFormatHhMm); // source: DatepickerProperties.jsx:350
    closeColumnPopover(C);
  });

  it("date format — `Enable 24 hr time format` defaults to `{{false}}` in fx and switches the rendered cell from 12-hour to 24-hour", () => {
    openColumnPopover(C);
    toggleEnableTime(); // source: DatepickerProperties.jsx:169-180
    // The shipped column carries no `isTwentyFourHrFormatEnabled` at all, so
    // getInitialValue falls through to its final '{{false}}' default.
    toggleColumnFx(tableText.labelEnable24HrFormat); // source: DatepickerProperties.jsx:207-219
    verifyColumnProperty(
      tableText.labelEnable24HrFormat,
      tableText.variantDateFxFalse
    ); // source: ProgramaticallyHandleProperties.jsx:87
    setColumnProperty(
      tableText.labelEnable24HrFormat,
      tableText.variantDateFxTrue
    ); // source: DatepickerProperties.jsx:214
    closeColumnPopover(C);

    // computeDateString swaps the 'LT' token for 'HH:mm' (DatePickerRenderer.jsx:168),
    // so the very same midnight instant renders as 00:00 instead of 12:00 AM.
    cy.forceClickOnCanvas();
    cy.get(tableSelector.cellDatepickerText(C, 0, W))
      .scrollIntoView()
      .should("have.text", tableText.variantDateRow0Rendered24h); // source: DatePickerRenderer.jsx:168
  });

  it("date format — both time zones default to the placeholder, and setting the parse + display pair shifts the rendered instant", () => {
    openColumnPopover(C);
    toggleEnableTime(); // source: DatepickerProperties.jsx:169-180
    // Both selects store '' by default (:233 display, :369 parse), and
    // SelectComponent.jsx:52 turns a falsy value into `defaultValue` (null) — i.e.
    // the PLACEHOLDER renders, never an option.
    cy.get(tableSelector.displayTimeZoneField)
      .find(tableSelector.inspectorSelectPlaceholder)
      .should("have.text", tableText.selectPlaceholder); // source: DatepickerProperties.jsx:233,:240
    cy.get(tableSelector.parseTimezoneField)
      .eq(1)
      .find(tableSelector.inspectorSelectPlaceholder)
      .should("have.text", tableText.selectPlaceholder); // source: DatepickerProperties.jsx:369,:376

    // parseDate only takes its ABSOLUTE-INSTANT branch when isTimeChecked AND BOTH
    // zones are set (:84-88); with only the display zone the parse stays LOCAL and the
    // result depends on the CI machine. Parsing at Etc/UTC and displaying at
    // Asia/Colombo (+05:30) is machine-independent.
    setParseTimeZone(tableText.variantParseTimeZone); // source: DatepickerProperties.jsx:12,:373
    setTimeZone(tableText.variantDisplayTimeZone); // source: DatepickerProperties.jsx:35,:237
    closeColumnPopover(C);

    cy.forceClickOnCanvas();
    cy.get(tableSelector.cellDatepickerText(C, 0, W))
      .scrollIntoView()
      .should("have.text", tableText.variantDateRow0RenderedTz); // source: DatePickerRenderer.jsx:177-178
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // ACCORDION "Parse format" (DatepickerProperties.jsx:252)
  // ═══════════════════════════════════════════════════════════════════════════

  it("parse format — the parse Date field defaults to an fx CodeHinter showing DD/MM/YYYY, and re-parsing as MM/DD/YYYY invalidates the cell", () => {
    openColumnPopover(C);
    // Same inverted fx model as the display format: the shipped column carries no
    // `notActiveFxActiveFields`, so the CodeHinter branch (:312-320) wins.
    cy.get(tableSelector.parseTimezoneField)
      .eq(0)
      .find(tableSelector.codeMirrorContent)
      .should("have.length", 1); // source: DatepickerProperties.jsx:86-89,:312
    verifyColumnCodeField(
      tableSelector.parseTimezoneField,
      tableText.variantDateSeedParseFormat
    ); // source: DatepickerProperties.jsx:314

    toggleParseDateFormatFx(); // source: DatepickerProperties.jsx:297-309
    cy.get(tableSelector.parseTimezoneField)
      .eq(0)
      .find(tableSelector.codeMirrorContent)
      .should("not.exist"); // source: DatepickerProperties.jsx:312
    setParseDateFormat(tableText.variantDateParseFormatUs); // source: DatepickerProperties.jsx:322-334
    cy.get(tableSelector.parseTimezoneField)
      .eq(0)
      .find(tableSelector.inspectorSelectSingleValue)
      .should("have.text", tableText.variantDateParseFormatUs); // source: DatepickerProperties.jsx:324
    closeColumnPopover(C);

    // Re-parsing '15/05/2022' as MM/DD/YYYY makes the MONTH 15, which moment flags as
    // an overflow even NON-strictly (:90-92), so parsedDate is null and the cell falls
    // back to the 'Invalid date' literal.
    cy.forceClickOnCanvas();
    cy.get(tableSelector.cellDatepickerText(C, 0, W))
      .scrollIntoView()
      .should("have.text", tableText.variantDateInvalid); // source: DatePickerRenderer.jsx:166
  });

  it("parse format — `Parse in unix timestamp` defaults to `{{false}}`; turning it on unmounts every parse-date control and re-parses the value as an epoch", () => {
    openColumnPopover(C);
    cy.get(tableSelector.parseTimezoneField).should("have.length", 1); // source: DatepickerProperties.jsx:290-291
    cy.get(tableSelector.unixTimestampLabel).should("not.exist"); // source: DatepickerProperties.jsx:267-270

    // The shipped column carries no `parseInUnixTimestamp`, so getInitialValue falls
    // through to its final '{{false}}' default.
    toggleColumnFx(tableText.labelParseInUnixTimestamp); // source: DatepickerProperties.jsx:255-266
    verifyColumnProperty(
      tableText.labelParseInUnixTimestamp,
      tableText.variantDateFxFalse
    ); // source: ProgramaticallyHandleProperties.jsx:87
    setColumnProperty(
      tableText.labelParseInUnixTimestamp,
      tableText.variantDateFxTrue
    ); // source: DatepickerProperties.jsx:261

    // :267 is a TERNARY, so turning it on does not merely add the unit select — it
    // REPLACES the whole else-branch, taking the parse Date field (and, when time is
    // on, the parse Time + parse Time zone fields) with it.
    cy.get(tableSelector.parseTimezoneField).should("not.exist"); // source: DatepickerProperties.jsx:288-384
    cy.get(tableSelector.unixTimestampLabel).should(
      "have.text",
      tableText.labelUnixTimestamp
    ); // source: DatepickerProperties.jsx:270-272
    closeColumnPopover(C);

    // parseDate now takes :82-83. The stored value is a DATE STRING, so
    // moment.unix('15/05/2022') is NaN → invalid → parsedDate null → 'Invalid date'.
    cy.forceClickOnCanvas();
    cy.get(tableSelector.cellDatepickerText(C, 0, W))
      .scrollIntoView()
      .should("have.text", tableText.variantDateInvalid); // source: DatePickerRenderer.jsx:166
  });

  it("parse format — the Unix timestamp select defaults to seconds, offers s / ms, and switching to milliseconds changes the parsed instant", () => {
    openColumnPopover(C);
    toggleParseUnixTimestamp(); // source: DatepickerProperties.jsx:255-266
    // `unixTimestamp` is never seeded, so the select falls back to its own
    // `?? 'seconds'` (:275) and renders that option's label, 's'.
    cy.get(tableSelector.unixTimestampLabel)
      .parent()
      .find(tableSelector.inspectorSelectSingleValue)
      .should("have.text", tableText.unixSeconds); // source: DatepickerProperties.jsx:71,:275

    cy.get(tableSelector.unixTimestampLabel)
      .parent()
      .find("input")
      .first()
      .click({ force: true });
    cy.get(tableSelector.inspectorSelectOption).should(
      "have.length",
      tableText.unixTimestampOptions.length
    ); // source: DatepickerProperties.jsx:68-77
    tableText.unixTimestampOptions.forEach((label, i) => {
      cy.get(tableSelector.inspectorSelectOption).eq(i).should("have.text", label); // source: DatepickerProperties.jsx:68-77
    });
    cy.get(tableSelector.inspectorSelectOption)
      .filter((_i, el) => el.innerText.trim() === tableText.unixMilliseconds)
      .first()
      .click({ force: true });
    cy.waitForAutoSave();
    cy.get(tableSelector.unixTimestampLabel)
      .parent()
      .find(tableSelector.inspectorSelectSingleValue)
      .should("have.text", tableText.unixMilliseconds); // source: DatepickerProperties.jsx:75
    closeColumnPopover(C);

    // 'milliseconds' takes `moment(parseInt(value))` instead of `moment.unix(value)`
    // (:83), and parseInt('15/05/2022') === 15 → 15ms after the epoch. moment(Number)
    // is LOCAL, so which calendar day that lands on depends on the runner's zone —
    // hence a shape match on 1969/1970 rather than a fixed string.
    cy.forceClickOnCanvas();
    cy.get(tableSelector.cellDatepickerText(C, 0, W))
      .scrollIntoView()
      .invoke("text")
      .should("match", tableText.variantDateUnixMsPattern); // source: DatePickerRenderer.jsx:83
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // PRODUCT BUGS — required coverage
  // ═══════════════════════════════════════════════════════════════════════════

  it("PRODUCT BUG F15 — `input-parse-timezone` and `label-parse-timezone` are each emitted TWICE by the Parse format accordion", () => {
    openColumnPopover(C);
    // With time off only the parse "Date" block (:291) is mounted.
    cy.get(tableSelector.parseTimezoneField).should("have.length", 1); // source: DatepickerProperties.jsx:291
    toggleEnableTime(); // source: DatepickerProperties.jsx:169-180

    // …and now the parse "Time zone" block (:363) mounts alongside it, re-using the
    // SAME data-cy. Two nodes share `input-parse-timezone`, and their two labels
    // share `label-parse-timezone` (:293 "Date", :364 "Time zone"), which is the only
    // thing that tells them apart.
    cy.get(tableSelector.parseTimezoneField).should("have.length", 2); // source: DatepickerProperties.jsx:291,:363
    cy.get(tableSelector.parseTimezoneField)
      .eq(0)
      .find(tableSelector.dateParseFormatLabel)
      .should("have.text", tableText.labelParseDate); // source: DatepickerProperties.jsx:293-295
    cy.get(tableSelector.parseTimezoneField)
      .eq(1)
      .find(tableSelector.dateParseFormatLabel)
      .should("have.text", tableText.labelParseTimeZone); // source: DatepickerProperties.jsx:364-366
    cy.get(tableSelector.dateParseFormatLabel).should("have.length", 2); // source: DatepickerProperties.jsx:293,:364
    closeColumnPopover(C);
  });

  it("PRODUCT BUG F6 — the parse-format Fx handler reads `isDateDisplayFormatFxOn`, so a parse fx-OFF is never persisted once the display fx is off", () => {
    openColumnPopover(C);
    // Baseline: both format fields open on their fx CodeHinter, because
    // `notActiveFxActiveFields` is an OPT-OUT array the shipped column does not carry.
    cy.get(tableSelector.dateDisplayFormatField)
      .find(tableSelector.codeMirrorContent)
      .should("have.length", 1); // source: DatepickerProperties.jsx:82-85,:139
    cy.get(tableSelector.parseTimezoneField)
      .eq(0)
      .find(tableSelector.codeMirrorContent)
      .should("have.length", 1); // source: DatepickerProperties.jsx:86-89,:312

    // 1. DISPLAY fx off — handled correctly. Its handler branches on its OWN state
    //    (:128) and PUSHES 'dateFormat' onto the persisted array (:129).
    toggleDateFormatFx(); // source: DatepickerProperties.jsx:124-136
    cy.get(tableSelector.dateDisplayFormatField)
      .find(tableSelector.codeMirrorContent)
      .should("not.exist"); // source: DatepickerProperties.jsx:139

    // 2. PARSE fx off — the handler branches on `isDateDisplayFormatFxOn` (:301),
    //    which is now FALSE, so it takes the `else` and FILTERS 'parseDateFormat' out
    //    of an array that never contained it. Locally it still flips (:306), so the
    //    Select mounts and the UI looks exactly right.
    toggleParseDateFormatFx(); // source: DatepickerProperties.jsx:297-309
    cy.get(tableSelector.parseTimezoneField)
      .eq(0)
      .find(tableSelector.codeMirrorContent)
      .should("not.exist"); // source: DatepickerProperties.jsx:312

    // 3. Remount the popover. `useState` re-derives BOTH flags from the PERSISTED
    //    array (:82-89). 'dateFormat' is in it, so the display format correctly stays
    //    a dropdown — but 'parseDateFormat' never got written, so the parse field
    //    silently reverts to its CodeHinter. THAT is the observable consequence of the
    //    cross-wire, and it is asserted here rather than worked around.
    closeColumnPopover(C);
    openColumnPopover(C);
    cy.get(tableSelector.dateDisplayFormatField)
      .find(tableSelector.codeMirrorContent)
      .should("not.exist"); // source: DatepickerProperties.jsx:82-85
    cy.get(tableSelector.parseTimezoneField)
      .eq(0)
      .find(tableSelector.codeMirrorContent)
      .should("have.length", 1); // BUG F6 — source: DatepickerProperties.jsx:301 vs :306
    closeColumnPopover(C);
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // STYLES (Styles tab — StylesTabElements.jsx)
  // ═══════════════════════════════════════════════════════════════════════════

  it("styles — Text Alignment moves the rendered cell content", () => {
    openColumnPopover(C);
    switchColumnTab(tableText.columnTabStyles); // source: ColumnPopover.jsx:157
    // The label reads "Text Alignment" for datepicker — it becomes "Alignment" only
    // for boolean / image / rating (StylesTabElements.jsx:32-34).
    cy.get(tableSelector.columnPopover).should(
      "contain.text",
      tableText.labelTextAlignment
    ); // source: StylesTabElements.jsx:33
    setColumnAlignment(tableText.alignCenter); // source: StylesTabElements.jsx:44
    closeColumnPopover(C);

    cy.forceClickOnCanvas();
    cy.get(tableSelector.cell(C, 0, W))
      .scrollIntoView()
      .should("have.class", tableText.cellClassAlignCenter); // source: TableRow.jsx:114
  });

  it("styles — Text color paints the rendered datepicker cell text", () => {
    openColumnPopover(C);
    switchColumnTab(tableText.columnTabStyles); // source: ColumnPopover.jsx:157
    // `datepicker` IS in the shared colour carve-out (StylesTabElements.jsx:131-145),
    // so it gets the ordinary Text color / Cell color pair with the ordinary defaults.
    verifyColumnColor(
      tableText.labelTextColor,
      tableText.variantDefaultTextColor
    ); // source: ProgramaticallyHandleProperties.jsx:38
    setColumnColor(tableText.labelTextColor, tableText.variantTextColorRgba); // source: StylesTabElements.jsx:148-161
    closeColumnPopover(C);

    // useTextColor.js:7 falls back to the TABLE-level textColor whenever the column
    // value is falsy or still the '#11181C' default, so only a genuinely overridden
    // column colour can reach the rendered node.
    // F21: for a READ-ONLY datepicker the cell is
    // <td> > .td-container > div > .react-datepicker-wrapper > … > div(color), and the
    // coloured div is the ONLY leaf div, so cellContentNode (`div:not(:has(div))`)
    // resolves exactly the DatepickerInput read-only div.
    cy.forceClickOnCanvas();
    cy.get(tableSelector.cell(C, 0, W)).scrollIntoView();
    verifyWidgetColorCss(
      tableSelector.cellContentNode(C, 0, W),
      "color",
      tableText.variantTextColorRgba,
      true
    ); // source: DatePickerRenderer.jsx:18,:361
  });

  it("styles — Cell color paints the rendered cell background", () => {
    openColumnPopover(C);
    switchColumnTab(tableText.columnTabStyles); // source: ColumnPopover.jsx:157
    // The default is the design token var(--cc-surface1-surface); BaseColorSwatches
    // renders the token NAME rather than the raw var (BaseColorSwatches.jsx:153-157).
    verifyColumnColor(tableText.labelCellColor, tableText.colorTokenSurface1); // source: ProgramaticallyHandleProperties.jsx:35
    setColumnColor(tableText.labelCellColor, tableText.variantCellColorRgba); // source: StylesTabElements.jsx:163-176
    closeColumnPopover(C);

    // cellBackgroundColor lands as an inline backgroundColor on the <td> itself.
    cy.forceClickOnCanvas();
    cy.get(tableSelector.cell(C, 0, W)).scrollIntoView();
    verifyWidgetColorCss(
      tableSelector.cell(C, 0, W),
      "background-color",
      tableText.variantCellColorRgba,
      true
    ); // source: TableRow.jsx:81
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // VALIDATIONS — mount ONLY while the column is editable
  // (PropertiesTabElements.jsx:401) and only render feedback in the editable
  // renderer branch (DatePickerRenderer.jsx:397).
  //
  // PRODUCT BUG F1 (HIGH): none of these six controls has a usable data-cy —
  // getValidationList declares `dateCy` (ValidationProperties.jsx:115,122,132,
  // 139,149,156) but all three render branches read `validation.dataCy`
  // (:179,199,216), so React drops `data-cy={undefined}`. setColumnValidation /
  // verifyColumnValidation therefore address the field by its <label> text; that
  // workaround is the only reason these it-blocks can exist at all.
  //
  // NOTE the validation format is NOT the column's own: validateDates hard-codes
  // 'MM/DD/YYYY' (_helpers/utils.js:480) because Datepicker.jsx:32-55 passes no
  // dateFormat into the validationObject, and the inspector's ReactDatePicker
  // writes back with the same format (ValidationProperties.jsx:186).
  // ═══════════════════════════════════════════════════════════════════════════

  it("validations — the `datepicker` set is Minimum/Maximum date + Disabled dates + Custom rule, and gains Minimum/Maximum time once `Enable time` is on", () => {
    openColumnPopover(C);
    toggleColumnProperty(tableText.labelMakeEditable); // source: PropertiesTabElements.jsx:385-400

    // The exact ordered label set. minTime/maxTime are pushed ONLY while
    // `isTimeChecked` resolves truthy (ValidationProperties.jsx:129).
    cy.get(tableSelector.columnValidationLabels).should(($labels) => {
      const texts = [...$labels].map((el) => el.innerText.trim());
      expect(texts).to.deep.equal(tableText.variantDateValidationLabels);
    }); // source: ValidationProperties.jsx:112-159

    toggleEnableTime(); // source: DatepickerProperties.jsx:169-180
    cy.get(tableSelector.columnValidationLabels).should(($labels) => {
      const texts = [...$labels].map((el) => el.innerText.trim());
      expect(texts).to.deep.equal(tableText.variantDateValidationLabelsWithTime);
    }); // source: ValidationProperties.jsx:129-146
    closeColumnPopover(C);
  });

  it("validations — Minimum date rejects a cell before the bound", () => {
    openColumnPopover(C);
    toggleColumnProperty(tableText.labelMakeEditable); // source: PropertiesTabElements.jsx:385-400
    // minDate/maxDate render a ReactDatePicker, not a CodeHinter (:176-195), so the
    // value is a typed date string rather than an expression.
    setColumnValidation(tableText.labelMinimumDate, tableText.variantMinDate); // source: ValidationProperties.jsx:113-119 (F1)
    verifyColumnValidation(tableText.labelMinimumDate, tableText.variantMinDate); // source: ValidationProperties.jsx:185
    closeColumnPopover(C);

    // 1 Jun 2022 is not BEFORE 15 May 2022, so row 0 fails and the message is built
    // from the resolved bound verbatim.
    cy.forceClickOnCanvas();
    cy.get(tableSelector.cell(C, 0, W)).scrollIntoView();
    cy.get(tableSelector.cellDateInvalidFeedback(C, 0, W)).should(
      "have.text",
      tableText.variantMinDateError
    ); // source: _helpers/utils.js:519-523
  });

  it("validations — Maximum date rejects a cell after the bound", () => {
    openColumnPopover(C);
    toggleColumnProperty(tableText.labelMakeEditable); // source: PropertiesTabElements.jsx:385-400
    setColumnValidation(tableText.labelMaximumDate, tableText.variantMaxDate); // source: ValidationProperties.jsx:120-126 (F1)
    verifyColumnValidation(tableText.labelMaximumDate, tableText.variantMaxDate); // source: ValidationProperties.jsx:185
    closeColumnPopover(C);

    cy.forceClickOnCanvas();
    cy.get(tableSelector.cell(C, 0, W)).scrollIntoView();
    cy.get(tableSelector.cellDateInvalidFeedback(C, 0, W)).should(
      "have.text",
      tableText.variantMaxDateError
    ); // source: _helpers/utils.js:529-533
  });

  it("validations — Minimum time mounts only while `Enable time` is on and rejects a cell before the bound", () => {
    openColumnPopover(C);
    toggleColumnProperty(tableText.labelMakeEditable); // source: PropertiesTabElements.jsx:385-400
    toggleEnableTime(); // source: DatepickerProperties.jsx:169-180 → ValidationProperties.jsx:129
    // minTime/maxTime render a ToolJetUI <Timepicker>, which is itself a
    // react-datepicker (Timepicker.jsx:19), so setColumnValidation's
    // `.inspector-validation-date-picker` branch reaches it the same way.
    setColumnValidation(tableText.labelMinimumTime, tableText.variantMinTime); // source: ValidationProperties.jsx:131-137 (F1)
    verifyColumnValidation(tableText.labelMinimumTime, tableText.variantMinTime); // source: ValidationProperties.jsx:205
    closeColumnPopover(C);

    // The widget's TIME value is 00:00 — the stored string carries no time, so
    // moment('15/05/2022','DD/MM/YYYY LT').format('HH:mm') is '00:00'
    // (_helpers/utils.js:487-490) and 01:00 is not before it.
    cy.forceClickOnCanvas();
    cy.get(tableSelector.cell(C, 0, W)).scrollIntoView();
    cy.get(tableSelector.cellDateInvalidFeedback(C, 0, W)).should(
      "have.text",
      tableText.variantMinTimeError
    ); // source: _helpers/utils.js:539-543
  });

  it("validations — Custom rule renders its message from the real cellValue", () => {
    openColumnPopover(C);
    toggleColumnProperty(tableText.labelMakeEditable); // source: PropertiesTabElements.jsx:385-400
    setColumnValidation(
      tableText.labelCustomRule,
      tableText.variantDateCustomRule
    ); // source: ValidationProperties.jsx:154-159 (F1)
    closeColumnPopover(C);

    // Datepicker.jsx:54 passes customResolveObjects { cellValue }, so the rule sees
    // the real cell; a non-empty STRING is the failure signal AND becomes the message.
    cy.forceClickOnCanvas();
    cy.get(tableSelector.cell(C, 0, W)).scrollIntoView();
    cy.get(tableSelector.cellDateInvalidFeedback(C, 0, W)).should(
      "have.text",
      tableText.variantDateCustomRuleError
    ); // source: _helpers/utils.js:558-560
  });

  it("validations — Disabled dates excludes the day from the editable cell's calendar", () => {
    openColumnPopover(C);
    toggleColumnProperty(tableText.labelMakeEditable); // source: PropertiesTabElements.jsx:385-400
    // `disabledDates` is a plain CodeHinter (:147-152, default render branch) read with
    // DISABLED_DATE_FORMAT = 'MM/DD/YYYY' (DatePickerRenderer.jsx:10,:283) — NOT with
    // the column's own parseDateFormat.
    setColumnValidation(
      tableText.labelDisabledDates,
      tableText.variantDisabledDates
    ); // source: ValidationProperties.jsx:147-152 (F1)
    verifyColumnValidation(
      tableText.labelDisabledDates,
      tableText.variantDisabledDates
    ); // source: ValidationProperties.jsx:231
    closeColumnPopover(C);

    // It never changes the rendered TEXT — it only feeds react-datepicker's
    // `excludeDates` (:376), so the single observable effect is the `--excluded` day
    // inside the OPEN calendar, which is portalled to #component-portal (:370).
    cy.forceClickOnCanvas();
    cy.get(tableSelector.cellDatepickerInput(C, 0, W))
      .scrollIntoView()
      .click({ force: true });
    cy.get(tableSelector.datepickerCalendar).should("have.length", 1); // source: DatePickerRenderer.jsx:340,:370
    cy.get(tableSelector.datepickerExcludedDay)
      .should("have.length", 1)
      .and("have.text", tableText.variantDateExcludedDay); // source: DatePickerRenderer.jsx:280-286,:376
  });
});
