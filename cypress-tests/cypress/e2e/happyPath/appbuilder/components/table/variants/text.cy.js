/**
 * SPEC — Table — variants/text.
 *
 * FOR AI: covers the `text` COLUMN TYPE of the Table widget end to end — type
 * switching, column creation / duplication / deletion, the shared column
 * controls, the two style controls `text` exposes, all four validations it
 * mounts (Regex included — PRODUCT BUG F2) and the rendered cell contract.
 * Source root: frontend/src/AppBuilder/RightSideBar/Inspector/Components/Table/
 * (`columns` is declared bare as `type:'array'` at table.js:44, so NONE of these
 * controls live in the widget config — they live in the ColumnManager).
 *
 * ── `text` vs `string` ──────────────────────────────────────────────────────
 * The two types share every inspector control: they are adjacent labels of the
 * SAME switch case in ValidationProperties (:34-37) and sit in the same
 * StylesTabElements type list (:131-144). `text` has NO type-specific property
 * of its own (PropertiesTabElements has no `columnType === 'text'` branch).
 * Exactly three things differ, and each has its own assertion below:
 *   1. the <td> carries `has-text` (TableRow.jsx:118) IN ADDITION TO the shared
 *      `has-textarea` (:132) — and it carries it while READ-ONLY, which a
 *      `string` column only does once it is made editable;
 *   2. TextRenderer.jsx:181-201 nests the cell TWO divs deeper than
 *      StringRenderer, and the contentEditable div is mounted up-front
 *      (:111-143) instead of being swapped in on click;
 *   3. PRODUCT BUG F2 — `text` is the one type the source TRIES to hide Regex
 *      from, and fails.
 *
 * ── WHY THE SEED `name` COLUMN ──────────────────────────────────────────────
 * The shipped `columns` default contains a data-bound column
 * { name:'name', key:'name', columnType:'string' } (table.js:734-742). Switching
 * THAT column to `text` means every assertion runs against real seed data
 * (table.js:692) and simultaneously proves the type switch itself. Column
 * creation / duplication / deletion get their own it-blocks, where creation is
 * what is under test.
 *
 * ── HARNESS (deliberate deviation from the generic facet header contract) ────
 * `waitForDropSettle` DOES NOT EXIST in this repo (repo-wide grep: no
 * definition), and the plain `query-manager-toggle-button` beforeEach leaves the
 * Table too short for its cells to be reachable. This spec reuses the
 * proven-green Table harness shared by basics.cy.js / inspector.cy.js /
 * contexts.cy.js / variants/string.cy.js: viewport → drag → hideTooltip →
 * modifyCanvasSize → close the settings panel → resizeTableWidget →
 * resizeQueryPanel('1') → openEditorSidebar. Exactly ONE cy.dragAndDropWidget
 * per test — cypress-real-dnd establishes its CDP intercept once per AUT load,
 * so a second drag in the same test silently never lands (F27 also notes that
 * cy.dragAndDropWidget clicks `right-sidebar-components-button` itself, so this
 * spec must NOT toggle that panel).
 *
 * ── TWO-NODE WIDGET ─────────────────────────────────────────────────────────
 * The Table renders `draggable-widget-table1` on BOTH the outer RenderWidget
 * wrapper AND its inner <table>, so `openStateFromComponent` / `openNode` /
 * `openAndVerifyNode` throw here (their internal realHover is unscoped). This
 * facet asserts only rendered-canvas + popover DOM, so it needs neither.
 *
 * ── POPOVER LIFECYCLE (load-bearing) ────────────────────────────────────────
 * The column popover is an OverlayTrigger with a CONTROLLED `show`
 * (Table.jsx:536-543) whose rootClose is disabled while any CodeHinter preview
 * popover is open (usePopoverState.js:33-43). A canvas click therefore may NOT
 * close it — every test closes it with `closeColumnPopover(<column>)`, which
 * re-clicks the list item and asserts the popover is gone. It also means
 * openColumnPopover() must never be called while the popover is already open
 * (the same click would toggle it shut) — which is why every test here reaches
 * the popover through `setColumnType(C, 'text')`, whose first act is to open it.
 *
 * ── PRODUCT BUGS HONOURED HERE (not papered over) ────────────────────────────
 *  F1 (HIGH) no validation control has a usable data-cy — `getValidationList`
 *      writes `dateCy` (ValidationProperties.jsx:41,50,56,64) while every render
 *      branch reads `validation.dataCy` (:179,199,216), so React drops the
 *      attribute. setColumnValidation / verifyColumnValidation select on LABEL
 *      TEXT as the documented workaround.
 *  F2 (MED)  `text` columns DO show Regex. The guard reads `item.itemType`
 *      (ValidationProperties.jsx:39) but a column object carries `columnType` —
 *      the type only arrives as the separate `itemType` PROP switched on at :33 —
 *      so the guard never fires. Asserted as PRESENT and as FUNCTIONAL below.
 *  F18       a duplicated column KEEPS ITS NAME (listItemHelpers.js:45-48 swaps
 *      only the uuid), so two list items — and two rendered <th> — share a
 *      data-cy. Asserted explicitly below.
 *  F19       the column-list data-cy is NOT normalised (Table.jsx:571
 *      interpolates the raw display name), so all helpers use `columnListItem`
 *      rather than the older normalising `tableSelector.columnItem`.
 *  F21       cell colour must be read from `cellContentNode`
 *      (`div:not(:has(div))`), never `cellContent` (`<td> div`) — the latter
 *      matches every nested div and verifyWidgetColorCss reads $el[0], the outer
 *      wrapper, which computes to inherited black. TextRenderer nests one level
 *      deeper than StringRenderer, so a fixed depth would not work for both.
 *
 * Helpers (all resolved through cypress/support/componentAutomation/type-helper-index.md):
 *   components/table.js — resizeTableWidget, openColumnPopover, closeColumnPopover,
 *     switchColumnTab, setColumnType, addColumnOfType, duplicateColumn, deleteColumn,
 *     verifyAndEnterColumnOptionInput, setColumnCodeField, verifyColumnCodeField,
 *     setColumnProperty, verifyColumnProperty, toggleColumnProperty, toggleColumnFx,
 *     setColumnColor, verifyColumnColor, setColumnValidation, verifyColumnValidation,
 *     setColumnAlignment, setPinPosition, verifyCellType, verifyCellValue,
 *     verifySingleValueOnTable, editTableCell, verifyInvalidFeedback
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
  duplicateColumn,
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
  setColumnValidation,
  verifyColumnValidation,
  setColumnAlignment,
  setPinPosition,
  verifyCellType,
  verifyCellValue,
  verifySingleValueOnTable,
  editTableCell,
  verifyInvalidFeedback,
} from "Support/utils/appBuilder/components/table";
import { openEditorSidebar } from "Support/utils/appBuilder/properties";
import { verifyWidgetColorCss } from "Support/utils/appBuilder/styles";
import { resizeQueryPanel } from "Support/utils/appBuilder/querymanager/queryPanel";

// testIsolation:false — cypress-real-dnd caches its CDP client for the spec run;
// testIsolation's per-test AUT reset leaves that client stale, so 2nd+ test drags
// throw "No dragIntercepted". Keeping the AUT stable across tests keeps the drag
// intercept valid. Each test still re-logs-in + creates its own app in beforeEach,
// so shared browser state is not relied upon.
describe("Table — variants/text column type", { testIsolation: false }, () => {
  const W = tableText.defaultWidgetName; // 'table1'
  const C = tableText.variantSeedColumn; // 'name' — source: table.js:736

  beforeEach(() => {
    cy.apiLogin();
    cy.apiCreateApp(`${fake.companyName}-Table-Text-Column`); // dynamic: fake
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

  it("column type — the seed column switches to `text`, which adds `has-text` on top of `has-textarea`", () => {
    // The seed column ships as `string`; SelectComponent.jsx:51 resolves the raw
    // stored value back to its option, so the SingleValue renders the option LABEL.
    openColumnPopover(C);
    cy.get(tableSelector.columnPopover)
      .find(tableSelector.columnTypeSelect)
      .should("contain.text", tableText.columnTypeLabel.string); // source: PropertiesTabElements.jsx:125
    closeColumnPopover(C);

    cy.forceClickOnCanvas();
    cy.get(tableSelector.cell(C, 0, W)).scrollIntoView();
    // While it is still `string` the cell has ONLY the shared textarea class.
    verifyCellType(C, 0, tableText.cellClassByType.string, W); // source: TableRow.jsx:132
    cy.get(tableSelector.cell(C, 0, W)).should(
      "not.have.class",
      tableText.cellClassByType.text
    ); // source: TableRow.jsx:118

    setColumnType(C, tableText.columnTypeValue.text); // source: PropertiesTabElements.jsx:127
    cy.get(tableSelector.columnPopover)
      .find(tableSelector.columnTypeSelect)
      .should("contain.text", tableText.columnTypeLabel.text); // source: PropertiesTabElements.jsx:127
    // `text` contributes NO type-specific property; the one property that is
    // type-gated in this region of the popover is number's Decimal Places
    // (PropertiesTabElements.jsx:367), so it must stay absent.
    cy.get(tableSelector.columnPopover).should(
      "not.contain.text",
      tableText.labelDecimalPlaces
    ); // source: PropertiesTabElements.jsx:367
    closeColumnPopover(C);

    cy.forceClickOnCanvas();
    cy.get(tableSelector.cell(C, 0, W)).scrollIntoView();
    verifyCellType(C, 0, tableText.cellClassByType.text, W); // source: TableRow.jsx:118
    verifyCellType(C, 0, tableText.cellClassByType.string, W); // source: TableRow.jsx:132 ('string'|'text')
    verifyCellValue(C, 0, tableText.variantSeedCellValue, W); // source: table.js:692

    // Switching away drops BOTH classes and swaps the renderer.
    setColumnType(C, tableText.columnTypeValue.number); // source: PropertiesTabElements.jsx:126
    closeColumnPopover(C);
    cy.forceClickOnCanvas();
    verifyCellType(C, 0, tableText.cellClassByType.number, W); // source: TableRow.jsx:120
    cy.get(tableSelector.cell(C, 0, W)).should(
      "not.have.class",
      tableText.cellClassByType.text
    ); // source: TableRow.jsx:118
    cy.get(tableSelector.cell(C, 0, W)).should(
      "not.have.class",
      tableText.cellClassByType.string
    ); // source: TableRow.jsx:132
  });

  it("column manager — a `text` column can be added, bound to a key and deleted", () => {
    // addColumnOfType sets the TYPE first (so type-specific fields mount), then the
    // name, then the key — the key is what the row data is read from
    // (generateColumnsData.js:163 accessorKey = column.key || column.name).
    addColumnOfType(
      tableText.variantNewTextColumn,
      tableText.columnTypeValue.text, // source: PropertiesTabElements.jsx:127
      tableText.variantSeedColumnKey // source: table.js:737
    );
    closeColumnPopover(tableText.variantNewTextColumn);

    cy.forceClickOnCanvas();
    cy.get(tableSelector.columnHeader(tableText.variantNewTextColumn))
      .scrollIntoView()
      .should("have.text", tableText.variantNewTextColumn); // source: TableHeader.jsx:153
    // Bound to the seed `name` key, so it renders the same value as the seed column.
    verifyCellValue(
      tableText.variantNewTextColumn,
      0,
      tableText.variantSeedCellValue,
      W
    ); // source: table.js:692
    verifyCellType(
      tableText.variantNewTextColumn,
      0,
      tableText.cellClassByType.text,
      W
    ); // source: TableRow.jsx:118

    // deleteColumn drives the popover header's [title="Delete column"] and asserts
    // BOTH the inspector row and the rendered header are gone.
    deleteColumn(tableText.variantNewTextColumn); // source: ColumnPopover.jsx:130-138
  });

  it("column manager — duplicating a `text` column keeps its name (F18)", () => {
    addColumnOfType(
      tableText.variantNewTextColumn,
      tableText.columnTypeValue.text, // source: PropertiesTabElements.jsx:127
      tableText.variantSeedColumnKey // source: table.js:737
    );
    closeColumnPopover(tableText.variantNewTextColumn);

    // PRODUCT BUG F18 (MED): duplicateWithNewId (shared/utils/listItemHelpers.js:45-48)
    // copies the item verbatim and swaps ONLY the uuid, so the clone keeps the same
    // display name. duplicateColumn already asserts the two colliding list rows; the
    // rendered side collides too, because TableHeader.jsx:153 derives the header
    // data-cy from that same name. Asserting the collision documents the bug instead
    // of hiding it behind a .first().
    duplicateColumn(tableText.variantNewTextColumn);
    cy.forceClickOnCanvas();
    cy.get(tableSelector.columnHeader(tableText.variantNewTextColumn)).should(
      "have.length",
      2
    ); // source: listItemHelpers.js:45-48
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // SHARED PROPERTIES (Properties tab)
  // ═══════════════════════════════════════════════════════════════════════════

  it("properties — Column name renames the rendered column, Key rebinds its data", () => {
    setColumnType(C, tableText.columnTypeValue.text); // source: PropertiesTabElements.jsx:127
    verifyColumnCodeField(tableSelector.columnNameField, C); // source: PropertiesTabElements.jsx:164-181
    verifyColumnCodeField(
      tableSelector.columnKeyField,
      tableText.variantSeedColumnKey
    ); // source: PropertiesTabElements.jsx:182-197

    // Renaming re-keys the rendered header AND every cell data-cy, because both are
    // derived from `columnDef.header` = the resolved column name
    // (generateColumnsData.js:165 → TableHeader.jsx:153 / TableRow.jsx:102-105).
    verifyAndEnterColumnOptionInput(
      tableText.labelColumnName,
      tableText.variantRenamedColumn
    ); // source: PropertiesTabElements.jsx:166
    closeColumnPopover(tableText.variantRenamedColumn);
    cy.forceClickOnCanvas();
    cy.get(tableSelector.columnHeader(tableText.variantRenamedColumn))
      .scrollIntoView()
      .should("have.text", tableText.variantRenamedColumn); // source: TableHeader.jsx:153
    verifyCellValue(
      tableText.variantRenamedColumn,
      0,
      tableText.variantSeedCellValue,
      W
    ); // source: table.js:692
    // The type survives the rename.
    verifyCellType(
      tableText.variantRenamedColumn,
      0,
      tableText.cellClassByType.text,
      W
    ); // source: TableRow.jsx:118

    // The Key is the accessor, so re-pointing it at `email` swaps the rendered value
    // while the header (and therefore the data-cy) stays put.
    openColumnPopover(tableText.variantRenamedColumn);
    verifyAndEnterColumnOptionInput(tableText.labelKey, tableText.variantAltKey); // source: PropertiesTabElements.jsx:183
    closeColumnPopover(tableText.variantRenamedColumn);
    cy.forceClickOnCanvas();
    verifyCellValue(
      tableText.variantRenamedColumn,
      0,
      tableText.variantAltCellValue,
      W
    ); // source: table.js:692
  });

  it("properties — Transformation rewrites the rendered cell value", () => {
    setColumnType(C, tableText.columnTypeValue.text); // source: PropertiesTabElements.jsx:127
    verifyColumnCodeField(
      tableSelector.columnTransformationField,
      tableText.defaultTransformation
    ); // source: PropertiesTabElements.jsx:205

    // columnSlice.js:99 deliberately DROPS a transformation equal to '{{cellValue}}',
    // so only a real expression reaches transformTableData.js:33, which rewrites the
    // row's value for this key before the renderer ever sees it.
    setColumnCodeField(
      tableSelector.columnTransformationField,
      tableText.variantTransformationUpper
    ); // source: PropertiesTabElements.jsx:200-218
    closeColumnPopover(C);
    cy.forceClickOnCanvas();
    cy.get(tableSelector.cell(C, 0, W)).scrollIntoView();
    verifySingleValueOnTable(C, 0, tableText.variantSeedCellValueUpper); // source: transformTableData.js:33
  });

  it("properties — Visibility (fx) removes the column from the rendered table", () => {
    setColumnType(C, tableText.columnTypeValue.text); // source: PropertiesTabElements.jsx:127
    // `columnVisibility` is rendered by ProgramaticallyHandleProperties, so it is
    // fx-capable: the fx button exists and turning it ON is what mounts the code
    // field (SingleLineCodeEditor.jsx:794-802). fx state for a column is the
    // `fxActiveFields[]` array, not a per-field boolean
    // (ProgramaticallyHandleProperties.jsx:104-147).
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
    setColumnType(C, tableText.columnTypeValue.text); // source: PropertiesTabElements.jsx:127
    setPinPosition(tableText.pinLeft); // source: PropertiesTabElements.jsx:76
    closeColumnPopover(C);

    cy.forceClickOnCanvas();
    cy.get(tableSelector.cell(C, 0, W))
      .scrollIntoView()
      .should("have.class", tableText.cellClassPinnedLeft); // source: TableRow.jsx:138
    cy.get(tableSelector.cell(C, 0, W)).should(
      "have.class",
      tableText.cellClassPinned
    ); // source: TableRow.jsx:137
  });

  it("properties — Make editable turns the text cell into a contenteditable editor", () => {
    setColumnType(C, tableText.columnTypeValue.text); // source: PropertiesTabElements.jsx:127
    toggleColumnProperty(tableText.labelMakeEditable); // source: PropertiesTabElements.jsx:385-400
    closeColumnPopover(C);

    cy.forceClickOnCanvas();
    cy.get(tableSelector.cell(C, 0, W))
      .scrollIntoView()
      .should("have.class", tableText.cellClassEditable); // source: TableRow.jsx:135

    // Unlike StringRenderer (which only swaps the contenteditable div in on click),
    // TextRenderer mounts `.long-text-input` WITH contentEditable="true" up front
    // (TextRenderer.jsx:111-118); the edit commits on blur, which {enter} triggers
    // via handleKeyDown → e.target.blur() (:61-69, :131-136).
    const editedValue = fake.firstName; // dynamic: fake
    editTableCell(C, 0, editedValue, W);
    verifySingleValueOnTable(C, 0, editedValue); // source: TextRenderer.jsx:131-136
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // TYPE-SPECIFIC STYLES (Styles tab)
  // `text` is in the StylesTabElements type list at :131-144, so it gets exactly
  // Text Alignment (:29-52), Text color (:148-161) and Cell color (:163-176).
  // ═══════════════════════════════════════════════════════════════════════════

  it("styles — Text Alignment moves the rendered cell content", () => {
    setColumnType(C, tableText.columnTypeValue.text); // source: PropertiesTabElements.jsx:127
    switchColumnTab(tableText.columnTabStyles); // source: ColumnPopover.jsx:157
    // The label reads "Text Alignment" for text (it becomes "Alignment" only for
    // boolean / image / rating) — StylesTabElements.jsx:32-34.
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

  it("styles — Text color paints the rendered cell content", () => {
    setColumnType(C, tableText.columnTypeValue.text); // source: PropertiesTabElements.jsx:127
    switchColumnTab(tableText.columnTabStyles); // source: ColumnPopover.jsx:157
    verifyColumnColor(
      tableText.labelTextColor,
      tableText.variantDefaultTextColor
    ); // source: ProgramaticallyHandleProperties.jsx:38
    setColumnColor(tableText.labelTextColor, tableText.variantTextColorRgba); // source: StylesTabElements.jsx:148-161
    closeColumnPopover(C);

    // useTextColor.js:7 falls back to the TABLE-level textColor whenever the column
    // value is falsy or still the '#11181C' default, so only a genuinely overridden
    // column colour can reach the rendered node — which is what this asserts.
    // F21: TextRenderer nests <td> > div > div > div, so the inline `color` lands on
    // the DEEPEST div; `cellContentNode` (div:not(:has(div))) is the only selector
    // that resolves it for both this renderer and StringRenderer's shallower shape.
    cy.forceClickOnCanvas();
    cy.get(tableSelector.cell(C, 0, W)).scrollIntoView();
    verifyWidgetColorCss(
      tableSelector.cellContentNode(C, 0, W),
      "color",
      tableText.variantTextColorRgba,
      true
    ); // source: TextRenderer.jsx:75-81, :104
  });

  it("styles — Cell color paints the rendered cell background", () => {
    setColumnType(C, tableText.columnTypeValue.text); // source: PropertiesTabElements.jsx:127
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
  // renderer branch (TextRenderer.jsx:196-200).
  //
  // PRODUCT BUG F1 (HIGH): none of these controls has a usable data-cy —
  // getValidationList declares `dateCy` (ValidationProperties.jsx:41,50,56,64)
  // but the render branches read `validation.dataCy` (:179,199,216), so React
  // drops `data-cy={undefined}`. setColumnValidation / verifyColumnValidation
  // therefore address the field by its <label> text; that workaround is the only
  // reason these it-blocks can exist at all.
  // ═══════════════════════════════════════════════════════════════════════════

  it("validations — F2: `text` still renders Regex, and the regex is actually applied", () => {
    setColumnType(C, tableText.columnTypeValue.text); // source: PropertiesTabElements.jsx:127
    toggleColumnProperty(tableText.labelMakeEditable); // source: PropertiesTabElements.jsx:385-400

    // PRODUCT BUG F2 (MED): ValidationProperties.jsx:39 tries to skip Regex for
    // `text` with `if (item.itemType !== 'text')`, but `item` IS the column object
    // and a column carries `columnType` — the type only arrives as the separate
    // `itemType` PROP that the switch at :33 reads. The guard therefore never fires
    // and the rendered label set is IDENTICAL to `string`'s. Asserting the whole
    // ordered set documents the defect instead of quietly omitting Regex.
    cy.get(tableSelector.columnValidationLabels).should(($labels) => {
      expect(
        Cypress._.map($labels, (el) => el.innerText.trim())
      ).to.deep.equal(tableText.variantTextValidationLabels); // source: ValidationProperties.jsx:39-68
    });

    // …and it is not merely rendered: the value it stores really reaches
    // validateWidget, so a `text` column can be made invalid by a regex.
    setColumnValidation(tableText.labelRegex, tableText.variantRegex); // source: ValidationProperties.jsx:43
    verifyColumnValidation(tableText.labelRegex, tableText.variantRegex); // source: ValidationProperties.jsx:43
    closeColumnPopover(C);

    cy.forceClickOnCanvas();
    cy.get(tableSelector.cell(C, 0, W)).scrollIntoView();
    // 'Olivia Nguyen' contains no digit, so validateWidget returns the pattern error
    // and TextRenderer mounts `.invalid-feedback` (:196-200).
    verifyInvalidFeedback(C, 0, tableText.variantRegexError, W); // source: _helpers/utils.js:415
  });

  it("validations — Min length rejects a too-short cell value", () => {
    setColumnType(C, tableText.columnTypeValue.text); // source: PropertiesTabElements.jsx:127
    toggleColumnProperty(tableText.labelMakeEditable); // source: PropertiesTabElements.jsx:385-400
    setColumnValidation(tableText.labelMinLength, tableText.variantMinLength); // source: ValidationProperties.jsx:52
    verifyColumnValidation(tableText.labelMinLength, tableText.variantMinLength); // source: ValidationProperties.jsx:52
    closeColumnPopover(C);

    cy.forceClickOnCanvas();
    cy.get(tableSelector.cell(C, 0, W)).scrollIntoView();
    verifyInvalidFeedback(C, 0, tableText.variantMinLengthError, W); // source: _helpers/utils.js:424
  });

  it("validations — Max length rejects a too-long cell value", () => {
    setColumnType(C, tableText.columnTypeValue.text); // source: PropertiesTabElements.jsx:127
    toggleColumnProperty(tableText.labelMakeEditable); // source: PropertiesTabElements.jsx:385-400
    setColumnValidation(tableText.labelMaxLength, tableText.variantMaxLength); // source: ValidationProperties.jsx:58
    verifyColumnValidation(tableText.labelMaxLength, tableText.variantMaxLength); // source: ValidationProperties.jsx:58
    closeColumnPopover(C);

    cy.forceClickOnCanvas();
    cy.get(tableSelector.cell(C, 0, W)).scrollIntoView();
    verifyInvalidFeedback(C, 0, tableText.variantMaxLengthError, W); // source: _helpers/utils.js:433
  });

  it("validations — Custom rule renders its message from the real cellValue", () => {
    setColumnType(C, tableText.columnTypeValue.text); // source: PropertiesTabElements.jsx:127
    toggleColumnProperty(tableText.labelMakeEditable); // source: PropertiesTabElements.jsx:385-400
    // A customRule that resolves to a NON-EMPTY STRING is the failure signal and the
    // string itself becomes the message (_helpers/utils.js:457-460). Deriving it from
    // `cellValue` is what proves the rule is evaluated against the real cell rather
    // than echoed back — customRule passes THREE arguments to
    // resolveWidgetFieldValue (:459), so its customResolveObjects really arrives.
    setColumnValidation(tableText.labelCustomRule, tableText.variantCustomRule); // source: ValidationProperties.jsx:66
    verifyColumnValidation(
      tableText.labelCustomRule,
      tableText.variantCustomRule
    ); // source: ValidationProperties.jsx:66
    closeColumnPopover(C);

    cy.forceClickOnCanvas();
    cy.get(tableSelector.cell(C, 0, W)).scrollIntoView();
    verifyInvalidFeedback(C, 0, tableText.variantCustomRuleError, W); // source: _helpers/utils.js:459
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // CELL RENDERING CONTRACT
  // ═══════════════════════════════════════════════════════════════════════════

  it("cell rendering — a read-only text cell already carries `has-text` AND `has-textarea`", () => {
    setColumnType(C, tableText.columnTypeValue.text); // source: PropertiesTabElements.jsx:127
    closeColumnPopover(C);
    cy.forceClickOnCanvas();
    cy.get(tableSelector.cell(C, 0, W)).scrollIntoView();

    // This is the ONE class contract that separates `text` from `string`:
    // TableRow.jsx:118 ORs `columnType === 'text'` with `isEditable`, so a `text`
    // column carries `has-text` even while READ-ONLY, whereas a `string` column only
    // acquires it once editing is enabled. Both share `has-textarea` (:132).
    verifyCellType(C, 0, tableText.cellClassByType.text, W); // source: TableRow.jsx:118
    verifyCellType(C, 0, tableText.cellClassByType.string, W); // source: TableRow.jsx:132
    cy.get(tableSelector.cell(C, 0, W)).should(
      "not.have.class",
      tableText.cellClassEditable
    ); // source: TableRow.jsx:135
    // horizontalAlignment defaults to 'left' (generateColumnsData.js:179).
    cy.get(tableSelector.cell(C, 0, W)).should(
      "have.class",
      tableText.cellClassAlignLeft
    ); // source: TableRow.jsx:116

    // Enabling editing adds `isEditable` and keeps both type classes.
    openColumnPopover(C);
    toggleColumnProperty(tableText.labelMakeEditable); // source: PropertiesTabElements.jsx:385-400
    closeColumnPopover(C);
    cy.forceClickOnCanvas();
    cy.get(tableSelector.cell(C, 0, W)).scrollIntoView();
    verifyCellType(C, 0, tableText.cellClassEditable, W); // source: TableRow.jsx:135
    verifyCellType(C, 0, tableText.cellClassByType.text, W); // source: TableRow.jsx:118
    verifyCellType(C, 0, tableText.cellClassByType.string, W); // source: TableRow.jsx:132
  });
});
