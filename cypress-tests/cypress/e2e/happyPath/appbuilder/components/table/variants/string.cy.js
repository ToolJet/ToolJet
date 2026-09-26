/**
 * SPEC — Table — variants/string.
 *
 * FOR AI: covers the `string` COLUMN TYPE of the Table widget end to end —
 * creation / type switching, the shared column controls, the two `string`-only
 * style controls, all four validations and the rendered cell contract.
 * Source root: frontend/src/AppBuilder/RightSideBar/Inspector/Components/Table/
 * (`columns` is declared bare as `type:'array'` at table.js:44, so NONE of these
 * controls live in the widget config — they live in the ColumnManager).
 *
 * ── WHY THE SEED `name` COLUMN AND NOT A FRESH ONE ──────────────────────────
 * The shipped `columns` default already contains a data-bound column
 * { name:'name', key:'name', columnType:'string' } (table.js:734-742). Driving
 * THAT column means every assertion runs against real seed data (table.js:692)
 * and simultaneously proves `string` is the shipped default type. Column
 * creation / duplication / deletion get their own it-blocks, where creation
 * itself is what is under test.
 *
 * ── HARNESS (deliberate deviation from the generic facet header contract) ────
 * `waitForDropSettle` DOES NOT EXIST in this repo (repo-wide grep: no
 * definition), and the plain `query-manager-toggle-button` beforeEach leaves the
 * Table too short for its cells to be reachable. This spec reuses the
 * proven-green Table harness shared by basics.cy.js / inspector.cy.js /
 * contexts.cy.js: viewport → drag → hideTooltip → modifyCanvasSize → close the
 * settings panel → resizeTableWidget → resizeQueryPanel('1') → openEditorSidebar.
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
 * (the same click would toggle it shut).
 *
 * ── PRODUCT BUGS HONOURED HERE (not papered over) ────────────────────────────
 *  F1 (HIGH) no validation control has a usable data-cy — `getValidationList`
 *      writes `dateCy` (ValidationProperties.jsx:41,50,56,64) while every render
 *      branch reads `validation.dataCy` (:179,199,216), so React drops the
 *      attribute. setColumnValidation / verifyColumnValidation select on LABEL
 *      TEXT as the documented workaround.
 *  F18       a duplicated column KEEPS ITS NAME (listItemHelpers.js:45-48 swaps
 *      only the uuid), so two list items — and two rendered <th> — share a
 *      data-cy. Asserted explicitly below.
 *  F19       the column-list data-cy is NOT normalised (Table.jsx:571
 *      interpolates the raw display name), so all helpers use `columnListItem`
 *      rather than the older normalising `tableSelector.columnItem`.
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
describe("Table — variants/string column type", { testIsolation: false }, () => {
  const W = tableText.defaultWidgetName; // 'table1'
  const C = tableText.variantSeedColumn; // 'name' — source: table.js:736

  beforeEach(() => {
    cy.apiLogin();
    cy.apiCreateApp(`${fake.companyName}-Table-String-Column`); // dynamic: fake
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

  it("column type — the seed column ships as `string` and the type can be switched away and back", () => {
    openColumnPopover(C);
    // SelectComponent.jsx:51 resolves the raw stored value ('string') back to its
    // option, so the react-select SingleValue renders the option LABEL.
    cy.get(tableSelector.columnPopover)
      .find(tableSelector.columnTypeSelect)
      .should("contain.text", tableText.columnTypeLabel.string); // source: PropertiesTabElements.jsx:125
    closeColumnPopover(C);

    // A string cell is discriminated ONLY by its <td> class — every column type
    // shares the `<table>-<header>-row-<i>` data-cy (F9).
    cy.forceClickOnCanvas();
    cy.get(tableSelector.cell(C, 0, W)).scrollIntoView();
    verifyCellType(C, 0, tableText.cellClassByType.string, W); // source: TableRow.jsx:132
    verifyCellValue(C, 0, tableText.variantSeedCellValue, W); // source: table.js:692

    // Switch to `number`: the renderer swaps and the td class follows it.
    setColumnType(C, tableText.columnTypeValue.number); // source: PropertiesTabElements.jsx:126
    closeColumnPopover(C);
    cy.forceClickOnCanvas();
    verifyCellType(C, 0, tableText.cellClassByType.number, W); // source: TableRow.jsx:120
    cy.get(tableSelector.cell(C, 0, W)).should(
      "not.have.class",
      tableText.cellClassByType.string
    ); // source: TableRow.jsx:132

    // …and back to `string`, which restores the textarea renderer.
    setColumnType(C, tableText.columnTypeValue.string); // source: PropertiesTabElements.jsx:125
    closeColumnPopover(C);
    cy.forceClickOnCanvas();
    verifyCellType(C, 0, tableText.cellClassByType.string, W); // source: TableRow.jsx:132
    verifyCellValue(C, 0, tableText.variantSeedCellValue, W); // source: table.js:692
  });

  it("column manager — a `string` column can be added, bound to a key and deleted", () => {
    // addColumnOfType sets the TYPE first (so type-specific fields mount), then the
    // name, then the key — the key is what the row data is read from
    // (generateColumnsData.js:163 accessorKey = column.key || column.name).
    addColumnOfType(
      tableText.variantNewStringColumn,
      tableText.columnTypeValue.string, // source: PropertiesTabElements.jsx:125
      tableText.variantSeedColumnKey // source: table.js:737
    );
    closeColumnPopover(tableText.variantNewStringColumn);

    cy.forceClickOnCanvas();
    cy.get(tableSelector.columnHeader(tableText.variantNewStringColumn))
      .scrollIntoView()
      .should("have.text", tableText.variantNewStringColumn); // source: TableHeader.jsx:153
    // Bound to the seed `name` key, so it renders the same value as the seed column.
    verifyCellValue(
      tableText.variantNewStringColumn,
      0,
      tableText.variantSeedCellValue,
      W
    ); // source: table.js:692
    verifyCellType(
      tableText.variantNewStringColumn,
      0,
      tableText.cellClassByType.string,
      W
    ); // source: TableRow.jsx:132

    // deleteColumn drives the popover header's [title="Delete column"] and asserts
    // BOTH the inspector row and the rendered header are gone.
    deleteColumn(tableText.variantNewStringColumn); // source: ColumnPopover.jsx:130-138
  });

  it("column manager — duplicating a `string` column keeps its name (F18)", () => {
    addColumnOfType(
      tableText.variantNewStringColumn,
      tableText.columnTypeValue.string, // source: PropertiesTabElements.jsx:125
      tableText.variantSeedColumnKey // source: table.js:737
    );
    closeColumnPopover(tableText.variantNewStringColumn);

    // PRODUCT BUG F18 (MED): duplicateWithNewId (shared/utils/listItemHelpers.js:45-48)
    // copies the item verbatim and swaps ONLY the uuid, so the clone keeps the same
    // display name. duplicateColumn already asserts the two colliding list rows; the
    // rendered side collides too, because TableHeader.jsx:153 derives the header
    // data-cy from that same name. Asserting the collision documents the bug instead
    // of hiding it behind a .first().
    duplicateColumn(tableText.variantNewStringColumn);
    cy.forceClickOnCanvas();
    cy.get(tableSelector.columnHeader(tableText.variantNewStringColumn)).should(
      "have.length",
      2
    ); // source: listItemHelpers.js:45-48
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // SHARED PROPERTIES (Properties tab)
  // ═══════════════════════════════════════════════════════════════════════════

  it("properties — Column name renames the rendered column, Key rebinds its data", () => {
    openColumnPopover(C);
    verifyColumnCodeField(tableSelector.columnNameField, C); // source: PropertiesTabElements.jsx:164-181
    verifyColumnCodeField(tableSelector.columnKeyField, tableText.variantSeedColumnKey); // source: PropertiesTabElements.jsx:182-197

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
    openColumnPopover(C);
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
    openColumnPopover(C);
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
    openColumnPopover(C);
    setPinPosition(tableText.pinLeft); // source: PropertiesTabElements.jsx:76
    closeColumnPopover(C);

    cy.forceClickOnCanvas();
    cy.get(tableSelector.cell(C, 0, W))
      .scrollIntoView()
      .should("have.class", tableText.cellClassPinnedLeft); // source: TableRow.jsx:138
  });

  it("properties — Make editable turns the string cell into an inline editor", () => {
    openColumnPopover(C);
    toggleColumnProperty(tableText.labelMakeEditable); // source: PropertiesTabElements.jsx:385-400
    closeColumnPopover(C);

    cy.forceClickOnCanvas();
    cy.get(tableSelector.cell(C, 0, W))
      .scrollIntoView()
      .should("have.class", tableText.cellClassEditable); // source: TableRow.jsx:135

    // StringRenderer.jsx:145-150 keeps the idle cell NON-contenteditable; the click
    // on `.long-text-input` is what swaps in the contenteditable div (:110-112) and
    // the edit commits on blur, which {enter} triggers (:130-140).
    const editedValue = fake.firstName; // dynamic: fake
    editTableCell(C, 0, editedValue, W);
    verifySingleValueOnTable(C, 0, editedValue); // source: StringRenderer.jsx:126-129
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // TYPE-SPECIFIC STYLES (Styles tab)
  // ═══════════════════════════════════════════════════════════════════════════

  it("styles — Text Alignment moves the rendered cell content", () => {
    openColumnPopover(C);
    switchColumnTab(tableText.columnTabStyles); // source: ColumnPopover.jsx:157
    // The label reads "Text Alignment" for string (it becomes "Alignment" only for
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
    openColumnPopover(C);
    switchColumnTab(tableText.columnTabStyles); // source: ColumnPopover.jsx:157
    verifyColumnColor(tableText.labelTextColor, tableText.variantDefaultTextColor); // source: ProgramaticallyHandleProperties.jsx:38
    setColumnColor(tableText.labelTextColor, tableText.variantTextColorRgba); // source: StylesTabElements.jsx:148-161

    // useTextColor.js:7 falls back to the TABLE-level textColor whenever the column
    // value is falsy or still the '#11181C' default, so only a genuinely overridden
    // column colour can reach the rendered node — which is what this asserts.
    verifyWidgetColorCss(
      tableSelector.cellContentNode(C, 0, W),
      "color",
      tableText.variantTextColorRgba,
      true
    ); // source: StringRenderer.jsx:203
  });

  it("styles — Cell color paints the rendered cell background", () => {
    openColumnPopover(C);
    switchColumnTab(tableText.columnTabStyles); // source: ColumnPopover.jsx:157
    // The default is the design token var(--cc-surface1-surface); BaseColorSwatches
    // renders the token NAME rather than the raw var (BaseColorSwatches.jsx:153-157).
    verifyColumnColor(tableText.labelCellColor, tableText.colorTokenSurface1); // source: ProgramaticallyHandleProperties.jsx:35
    setColumnColor(tableText.labelCellColor, tableText.variantCellColorRgba); // source: StylesTabElements.jsx:163-176

    // cellBackgroundColor lands as an inline backgroundColor on the <td> itself.
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
  // renderer branch (StringRenderer.jsx:189-193).
  //
  // PRODUCT BUG F1 (HIGH): none of these controls has a usable data-cy —
  // getValidationList declares `dateCy` (ValidationProperties.jsx:41,50,56,64)
  // but the render branches read `validation.dataCy` (:179,199,216), so React
  // drops `data-cy={undefined}`. setColumnValidation / verifyColumnValidation
  // therefore address the field by its <label> text; that workaround is the only
  // reason these it-blocks can exist at all.
  // ═══════════════════════════════════════════════════════════════════════════

  it("validations — Regex rejects a non-matching cell value", () => {
    openColumnPopover(C);
    toggleColumnProperty(tableText.labelMakeEditable); // source: PropertiesTabElements.jsx:385-400
    // string columns DO get Regex — the `item.itemType !== 'text'` guard at
    // ValidationProperties.jsx:39 is irrelevant for this type.
    setColumnValidation(tableText.labelRegex, tableText.variantRegex); // source: ValidationProperties.jsx:43
    verifyColumnValidation(tableText.labelRegex, tableText.variantRegex); // source: ValidationProperties.jsx:43
    closeColumnPopover(C);

    cy.forceClickOnCanvas();
    cy.get(tableSelector.cell(C, 0, W)).scrollIntoView();
    // 'Olivia Nguyen' contains no digit, so useStringValidation → validateWidget
    // returns the pattern error and StringRenderer mounts `.invalid-feedback`.
    verifyInvalidFeedback(C, 0, tableText.variantRegexError, W); // source: _helpers/utils.js:415
  });

  it("validations — Min length rejects a too-short cell value", () => {
    openColumnPopover(C);
    toggleColumnProperty(tableText.labelMakeEditable); // source: PropertiesTabElements.jsx:385-400
    setColumnValidation(tableText.labelMinLength, tableText.variantMinLength); // source: ValidationProperties.jsx:52
    verifyColumnValidation(tableText.labelMinLength, tableText.variantMinLength); // source: ValidationProperties.jsx:52
    closeColumnPopover(C);

    cy.forceClickOnCanvas();
    cy.get(tableSelector.cell(C, 0, W)).scrollIntoView();
    verifyInvalidFeedback(C, 0, tableText.variantMinLengthError, W); // source: _helpers/utils.js:424
  });

  it("validations — Max length rejects a too-long cell value", () => {
    openColumnPopover(C);
    toggleColumnProperty(tableText.labelMakeEditable); // source: PropertiesTabElements.jsx:385-400
    setColumnValidation(tableText.labelMaxLength, tableText.variantMaxLength); // source: ValidationProperties.jsx:58
    verifyColumnValidation(tableText.labelMaxLength, tableText.variantMaxLength); // source: ValidationProperties.jsx:58
    closeColumnPopover(C);

    cy.forceClickOnCanvas();
    cy.get(tableSelector.cell(C, 0, W)).scrollIntoView();
    verifyInvalidFeedback(C, 0, tableText.variantMaxLengthError, W); // source: _helpers/utils.js:433
  });

  it("validations — Custom rule renders its message from the real cellValue", () => {
    openColumnPopover(C);
    toggleColumnProperty(tableText.labelMakeEditable); // source: PropertiesTabElements.jsx:385-400
    // A customRule that resolves to a NON-EMPTY STRING is the failure signal and the
    // string itself becomes the message (_helpers/utils.js:457-460). Deriving it from
    // `cellValue` is what proves the rule is evaluated against the real cell rather
    // than echoed back.
    setColumnValidation(tableText.labelCustomRule, tableText.variantCustomRule); // source: ValidationProperties.jsx:66
    verifyColumnValidation(tableText.labelCustomRule, tableText.variantCustomRule); // source: ValidationProperties.jsx:66
    closeColumnPopover(C);

    cy.forceClickOnCanvas();
    cy.get(tableSelector.cell(C, 0, W)).scrollIntoView();
    verifyInvalidFeedback(C, 0, tableText.variantCustomRuleError, W); // source: _helpers/utils.js:459
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // CELL RENDERING CONTRACT
  // ═══════════════════════════════════════════════════════════════════════════

  it("cell rendering — a string cell is `has-textarea`, and gains `has-text` once editable", () => {
    cy.forceClickOnCanvas();
    cy.get(tableSelector.cell(C, 0, W)).scrollIntoView();
    verifyCellType(C, 0, tableText.cellClassByType.string, W); // source: TableRow.jsx:132
    // Read-only, so it must NOT yet carry the `text`-column class.
    cy.get(tableSelector.cell(C, 0, W)).should(
      "not.have.class",
      tableText.cellClassByType.text
    ); // source: TableRow.jsx:118

    openColumnPopover(C);
    toggleColumnProperty(tableText.labelMakeEditable); // source: PropertiesTabElements.jsx:385-400
    closeColumnPopover(C);
    cy.forceClickOnCanvas();

    // SOURCE CONTRADICTION worth reporting: `has-text` is documented (and named) as
    // the `text` column type's discriminator, but TableRow.jsx:118 ORs it with
    // `isEditable` — so an EDITABLE STRING column carries `has-text` too. The td
    // class is therefore NOT a reliable type discriminator once editing is enabled;
    // only `has-textarea` (:132, string|text) and `has-text` TOGETHER identify a
    // `text` column. Asserted here so the behaviour is pinned rather than assumed.
    cy.get(tableSelector.cell(C, 0, W)).should(
      "have.class",
      tableText.cellClassByType.text
    ); // source: TableRow.jsx:118
    verifyCellType(C, 0, tableText.cellClassByType.string, W); // source: TableRow.jsx:132
    cy.get(tableSelector.cell(C, 0, W)).should(
      "have.class",
      tableText.cellClassEditable
    ); // source: TableRow.jsx:135
  });
});
