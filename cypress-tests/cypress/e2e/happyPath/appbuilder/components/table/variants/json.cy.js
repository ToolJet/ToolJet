/**
 * SPEC — Table — variants/json.
 *
 * FOR AI: covers the `json` COLUMN TYPE of the Table widget end to end — column
 * creation / type switching, the shared column controls, the ONE json-only
 * property (`jsonIndentation` / "Indent"), the two shared style controls, the
 * ABSENCE of validations, and the rendered cell contract.
 * Source root: frontend/src/AppBuilder/RightSideBar/Inspector/Components/Table/
 * (`columns` is declared bare as `type:'array'` at table.js:44, so NONE of these
 * controls live in the widget config — they live in the ColumnManager).
 *
 * ── NOT DOCUMENTED ──────────────────────────────────────────────────────────
 * docs/docs/widgets/table/columns.md covers 9 of the 15 shipped column types and
 * `json` is NOT one of them. Every literal asserted here is derived from SOURCE
 * and carries an inline `// source:` citation; nothing is inferred from docs.
 *
 * ── WHY A SEEDED DATASET AND A HAND-BUILT COLUMN ────────────────────────────
 * The shipped seed data (table.js:692) has no object-valued key, so there is
 * nothing for a json column to serialise. Each test therefore starts from
 * `variantJsonData` (setTableData in beforeEach).
 * The `config` column is then created BY HAND rather than relied upon from
 * autogeneration, because autoGenerateColumns.js:44-56 expands a plain-object
 * value into ONE-LEVEL-NESTED keys — the generated columns for this dataset are
 * `config.name` and `config.age`, never `config` itself. (columnSlice.js:85 also
 * passes the imported `autogenerateColumns` FUNCTION as the
 * `generateNestedColumns` argument, so nesting is unconditionally on — the
 * `generateNestedColumns: true` flag at table.js:712 is never actually read.)
 * Creating the column explicitly makes the spec independent of that defect, and
 * `config` stays a unique data-cy either way (`config.name` normalises to
 * `config-name`).
 *
 * ── HARNESS (deliberate deviation from the generic facet header contract) ────
 * `waitForDropSettle` DOES NOT EXIST in this repo, and the plain
 * `query-manager-toggle-button` beforeEach leaves the Table too short for its
 * cells to be reachable. This spec reuses the proven-green Table harness shared
 * by basics.cy.js / inspector.cy.js / styles.cy.js: viewport → drag →
 * hideTooltip → modifyCanvasSize → close the settings panel → resizeTableWidget
 * → resizeQueryPanel('1') → openEditorSidebar.
 * ONE cy.dragAndDropWidget per test MAX — cypress-real-dnd establishes its CDP
 * intercept once per AUT load, so a second drag in the same test never lands.
 *
 * ── TWO-NODE WIDGET ─────────────────────────────────────────────────────────
 * The Table renders `draggable-widget-table1` on BOTH the outer RenderWidget
 * wrapper AND its inner <table>, so openStateFromComponent / openNode /
 * openAndVerifyNode throw here. This facet asserts only rendered-canvas +
 * popover DOM, so it needs none of them.
 *
 * ── POPOVER LIFECYCLE (load-bearing) ────────────────────────────────────────
 * The column popover is an OverlayTrigger with a CONTROLLED `show`
 * (Table.jsx:536-543) whose rootClose is disabled while any CodeHinter preview
 * popover is open (usePopoverState.js:33-43), so a canvas click may NOT close
 * it — every test closes it with closeColumnPopover(<column>). Conversely
 * `cy.forceClickOnCanvas()` DESELECTS the widget and closes the right
 * Inspector, so openEditorSidebar(W) is re-issued before any popover is
 * re-opened after a canvas assertion.
 *
 * ── FINDINGS PINNED HERE (asserted, not papered over) ───────────────────────
 *  F9  json adds NO discriminating <td> class (TableRow.jsx:107-142 lists
 *      has-textarea/has-number/has-select/… but nothing for json), so the TYPE
 *      is proved by the SERIALISED CONTENT the renderer produces.
 *  F18 a duplicated column KEEPS ITS NAME (listItemHelpers.js:45-48 swaps only
 *      the uuid), so two list items — and two rendered <th> — share a data-cy.
 *  F19 the column-list data-cy is NOT normalised (Table.jsx:571 interpolates the
 *      raw display name), so helpers use `columnListItem`.
 *  F-INDENT (NEW, config-vs-runtime): the inspector shows `{{true}}` as the
 *      Indent default (ProgramaticallyHandleProperties.jsx:57-59) and the
 *      checkbox therefore renders CHECKED (Toggle.jsx:24), but a column that has
 *      never had `jsonIndentation` written carries no such key, so
 *      generateColumnsData.js:486 resolves `undefined` and JSONRenderer falls
 *      back to its OWN default `jsonIndentation = false` (JSONRenderer.jsx:28).
 *      A brand-new json column therefore renders COMPACT while its toggle reads
 *      ON. Asserted explicitly below.
 *
 * Helpers (all resolved through cypress/support/componentAutomation/type-helper-index.md):
 *   components/table.js — resizeTableWidget, setTableData, openColumnPopover,
 *     closeColumnPopover, switchColumnTab, setColumnType, addColumnOfType,
 *     duplicateColumn, deleteColumn, verifyAndEnterColumnOptionInput,
 *     setColumnCodeField, verifyColumnCodeField, setColumnProperty,
 *     verifyColumnProperty, toggleColumnProperty, toggleColumnFx,
 *     setColumnColor, verifyColumnColor, setColumnAlignment, setPinPosition,
 *     verifyCellValue, verifySingleValueOnTable, editTableCell
 *   appBuilder/properties.js — openEditorSidebar
 *   appBuilder/styles.js — verifyWidgetColorCss
 *   appBuilder/querymanager/queryPanel.js — resizeQueryPanel
 */
import { fake } from "Fixtures/fake";
import { tableSelector } from "Selectors/appBuilder/components/table";
import { tableText } from "Texts/appBuilder/components/table";
import {
  resizeTableWidget,
  setTableData,
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
  setColumnAlignment,
  setPinPosition,
  verifyCellValue,
  verifySingleValueOnTable,
  editTableCell,
} from "Support/utils/appBuilder/components/table";
import { openEditorSidebar } from "Support/utils/appBuilder/properties";
import { verifyWidgetColorCss } from "Support/utils/appBuilder/styles";
import { resizeQueryPanel } from "Support/utils/appBuilder/querymanager/queryPanel";

// testIsolation:false — cypress-real-dnd caches its CDP client for the spec run;
// testIsolation's per-test AUT reset leaves that client stale, so 2nd+ test drags
// throw "No dragIntercepted". Keeping the AUT stable across tests keeps the drag
// intercept valid. Each test still re-logs-in + creates its own app in beforeEach,
// so shared browser state is not relied upon.
describe("Table — variants/json column type", { testIsolation: false }, () => {
  const W = tableText.defaultWidgetName; // 'table1'
  const C = tableText.variantJsonColumn; // 'config' — the hand-built json column

  beforeEach(() => {
    cy.apiLogin();
    cy.apiCreateApp(`${fake.companyName}-Table-Json-Column`); // dynamic: fake
    cy.openApp();
    cy.viewport(1400, 2200);
    cy.dragAndDropWidget("Table", 250, 100);
    cy.hideTooltip();
    cy.modifyCanvasSize(900, 800);
    cy.get("[data-cy='left-sidebar-settings-button']").click();
    resizeTableWidget(W, 750, 600);
    resizeQueryPanel("1");

    // Seed an object-valued dataset. The shipped autogenerated columns whose keys
    // are absent from the new data are dropped (autoGenerateColumns.js:90-104), so
    // afterwards only `id` (+ the one-level-nested `config.name` / `config.age`)
    // survive. setTableData ends on cy.forceClickOnCanvas(), which closes the
    // Inspector — hence the second openEditorSidebar.
    openEditorSidebar(W);
    setTableData(tableText.variantJsonData); // source: table.js:21

    // Build the column under test. addColumnOfType sets the TYPE first (so the
    // json-only fields mount), then the name, then the key — the key is what the
    // row data is read from (generateColumnsData.js:163 accessorKey =
    // column.key || column.name).
    openEditorSidebar(W);
    addColumnOfType(
      C,
      tableText.columnTypeValue.json, // source: PropertiesTabElements.jsx:135
      tableText.variantJsonColumn
    );
    closeColumnPopover(C);
  });

  afterEach(() => {
    cy.apiDeleteApp();
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // COLUMN CREATION / TYPE SWITCH
  // ═══════════════════════════════════════════════════════════════════════════

  it("column type — a json column reports `JSON` and serialises its object cell value", () => {
    openColumnPopover(C);
    // SelectComponent.jsx:51 resolves the stored value ('json') back to its option,
    // so the react-select SingleValue renders the option LABEL.
    cy.get(tableSelector.columnPopover)
      .find(tableSelector.columnTypeSelect)
      .should("contain.text", tableText.columnTypeLabel.json); // source: PropertiesTabElements.jsx:135
    closeColumnPopover(C);

    // F9: json adds NO <td> class, so the SERIALISATION is the discriminator.
    // A fresh column has no jsonIndentation key, so JSONRenderer's own default
    // (false) applies and format() emits the single-line two-space form.
    cy.forceClickOnCanvas();
    cy.get(tableSelector.cell(C, 0, W)).scrollIntoView();
    verifyCellValue(C, 0, tableText.variantJsonCompactRow0, W); // source: JSONRenderer.jsx:41-51

    // Switching to `string` swaps in the textarea renderer, which DOES stamp a class.
    openEditorSidebar(W);
    setColumnType(C, tableText.columnTypeValue.string); // source: PropertiesTabElements.jsx:125
    closeColumnPopover(C);
    cy.forceClickOnCanvas();
    cy.get(tableSelector.cell(C, 0, W)).should(
      "have.class",
      tableText.cellClassByType.string
    ); // source: TableRow.jsx:132

    // …and back to `json`: the class goes away again and the serialisation returns.
    openEditorSidebar(W);
    setColumnType(C, tableText.columnTypeValue.json); // source: PropertiesTabElements.jsx:135
    closeColumnPopover(C);
    cy.forceClickOnCanvas();
    cy.get(tableSelector.cell(C, 0, W)).should(
      "not.have.class",
      tableText.cellClassByType.string
    ); // source: TableRow.jsx:132
    verifyCellValue(C, 0, tableText.variantJsonCompactRow0, W); // source: JSONRenderer.jsx:41-51
  });

  it("column manager — a second json column can be added, bound to a key and deleted", () => {
    openEditorSidebar(W);
    addColumnOfType(
      tableText.variantNewJsonColumn,
      tableText.columnTypeValue.json, // source: PropertiesTabElements.jsx:135
      tableText.variantJsonColumn // bind to the same object key
    );
    closeColumnPopover(tableText.variantNewJsonColumn);

    cy.forceClickOnCanvas();
    cy.get(tableSelector.columnHeader(tableText.variantNewJsonColumn))
      .scrollIntoView()
      .should("have.text", tableText.variantNewJsonColumn); // source: TableHeader.jsx:153
    verifyCellValue(
      tableText.variantNewJsonColumn,
      0,
      tableText.variantJsonCompactRow0,
      W
    ); // source: JSONRenderer.jsx:41-51

    // deleteColumn drives the popover header's [title="Delete column"] and asserts
    // BOTH the inspector row and the rendered header are gone.
    openEditorSidebar(W);
    deleteColumn(tableText.variantNewJsonColumn); // source: ColumnPopover.jsx:130-138
  });

  it("column manager — duplicating a json column keeps its name (F18)", () => {
    // PRODUCT BUG F18 (MED): duplicateWithNewId (shared/utils/listItemHelpers.js:45-48)
    // copies the item verbatim and swaps ONLY the uuid, so the clone keeps the same
    // display name. duplicateColumn already asserts the two colliding list rows; the
    // rendered side collides too, because TableHeader.jsx:153 derives the header
    // data-cy from that same name.
    duplicateColumn(C);
    closeColumnPopover(C);
    cy.forceClickOnCanvas();
    cy.get(tableSelector.columnHeader(C)).should("have.length", 2); // source: listItemHelpers.js:45-48
    // Both clones serialise the same object, which proves the columnType was copied
    // along with the name rather than reset to the `string` default.
    verifyCellValue(C, 0, tableText.variantJsonCompactRow0, W); // source: JSONRenderer.jsx:41-51
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // SHARED PROPERTIES (Properties tab)
  // ═══════════════════════════════════════════════════════════════════════════

  it("properties — Column name renames the rendered column, Key rebinds its data", () => {
    openColumnPopover(C);
    verifyColumnCodeField(tableSelector.columnNameField, C); // source: PropertiesTabElements.jsx:164-181
    verifyColumnCodeField(tableSelector.columnKeyField, tableText.variantJsonColumn); // source: PropertiesTabElements.jsx:182-197

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
      tableText.variantJsonCompactRow0,
      W
    ); // source: JSONRenderer.jsx:41-51

    // The Key is the accessor, so re-pointing it at `id` swaps the rendered value
    // while the header (and therefore the data-cy) stays put. `1` is not an object,
    // so formatCellValue falls into its JSON.parse branch and renders the bare number.
    openEditorSidebar(W);
    openColumnPopover(tableText.variantRenamedColumn);
    verifyAndEnterColumnOptionInput(tableText.labelKey, tableText.id); // source: PropertiesTabElements.jsx:183
    closeColumnPopover(tableText.variantRenamedColumn);
    cy.forceClickOnCanvas();
    verifyCellValue(
      tableText.variantRenamedColumn,
      0,
      tableText.variantRebindValueRow0,
      W
    ); // source: JSONRenderer.jsx:61-67
  });

  it("properties — Transformation rewrites the rendered cell value", () => {
    openColumnPopover(C);
    verifyColumnCodeField(
      tableSelector.columnTransformationField,
      tableText.defaultTransformation
    ); // source: PropertiesTabElements.jsx:205

    // columnSlice.js:99 deliberately DROPS a transformation equal to '{{cellValue}}',
    // so only a real expression reaches transformTableData.js:33, which rewrites the
    // row's value for this key before the renderer ever sees it. Reducing the object
    // to one of its own fields proves the rule ran against the REAL cellValue.
    setColumnCodeField(
      tableSelector.columnTransformationField,
      tableText.variantJsonTransformation
    ); // source: PropertiesTabElements.jsx:200-218
    closeColumnPopover(C);
    cy.forceClickOnCanvas();
    cy.get(tableSelector.cell(C, 0, W)).scrollIntoView();
    // 'Ada' is no longer parseable JSON, so formatCellValue's try/catch returns the
    // raw string untouched (JSONRenderer.jsx:68-70).
    verifySingleValueOnTable(C, 0, tableText.variantJsonTransformedRow0); // source: transformTableData.js:33
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // TYPE-SPECIFIC PROPERTY — Indent (jsonIndentation), json ONLY
  // PropertiesTabElements.jsx:429-447 gates the whole card on
  // `column.columnType === 'json'`.
  // ═══════════════════════════════════════════════════════════════════════════

  it("properties — Indent flips the serialisation between the compact and the 4-space form", () => {
    // F-INDENT: the toggle reads ON (initialValue '{{true}}' →
    // ProgramaticallyHandleProperties.jsx:57-59 → Toggle.jsx:24 `checked={value}`)
    // yet nothing was ever written to the column, so generateColumnsData.js:486
    // resolves undefined and JSONRenderer applies its own `false` default.
    cy.forceClickOnCanvas();
    cy.get(tableSelector.cell(C, 0, W)).scrollIntoView();
    verifyCellValue(C, 0, tableText.variantJsonCompactRow0, W); // source: JSONRenderer.jsx:28

    openEditorSidebar(W);
    openColumnPopover(C);
    cy.get(tableSelector.columnParamToggle(tableText.labelIndent))
      .scrollIntoView()
      .should("be.checked"); // source: ProgramaticallyHandleProperties.jsx:57-59

    // First click writes `{{!value}}` = '{{false}}' (Toggle.jsx:23) — the stored
    // value now MATCHES what was already being rendered, so nothing changes.
    toggleColumnProperty(tableText.labelIndent); // source: PropertiesTabElements.jsx:431-448
    closeColumnPopover(C);
    cy.forceClickOnCanvas();
    verifyCellValue(C, 0, tableText.variantJsonCompactRow0, W); // source: JSONRenderer.jsx:45-51

    // Second click writes '{{true}}', which is the FIRST time the renderer sees a
    // truthy jsonIndentation — JSON.stringify(v, null, 4) plus the `":` → `":  `
    // rewrite gives a 4-space indent AND three spaces after every key.
    openEditorSidebar(W);
    openColumnPopover(C);
    toggleColumnProperty(tableText.labelIndent); // source: PropertiesTabElements.jsx:431-448
    closeColumnPopover(C);
    cy.forceClickOnCanvas();
    cy.get(tableSelector.cell(C, 0, W))
      .scrollIntoView()
      .should("contain.text", tableText.variantJsonIndentedFragmentRow0); // source: JSONRenderer.jsx:57
  });

  it("propertiesFx — Indent is fx-capable and its fx default reads {{true}}", () => {
    openColumnPopover(C);
    // `jsonIndentation` is rendered by ProgramaticallyHandleProperties, so it is
    // fx-capable: the fx button exists and turning it ON is what mounts the code
    // field (SingleLineCodeEditor.jsx:794-802). fx state for a column is the
    // `fxActiveFields[]` array, not a per-field boolean
    // (ProgramaticallyHandleProperties.jsx:104-147).
    toggleColumnFx(tableText.labelIndent); // source: PropertiesTabElements.jsx:431-448
    verifyColumnProperty(tableText.labelIndent, tableText.variantIndentOn); // source: ProgramaticallyHandleProperties.jsx:57-59

    // Writing the default back EXPLICITLY is what puts a real `jsonIndentation` on
    // the column, so this is also the shortest proof that fx drives the renderer.
    setColumnProperty(tableText.labelIndent, tableText.variantIndentOn); // source: PropertiesTabElements.jsx:437
    closeColumnPopover(C);
    cy.forceClickOnCanvas();
    cy.get(tableSelector.cell(C, 0, W))
      .scrollIntoView()
      .should("contain.text", tableText.variantJsonIndentedFragmentRow0); // source: JSONRenderer.jsx:57

    // …and an fx expression of '{{false}}' collapses it back to the compact form.
    openEditorSidebar(W);
    openColumnPopover(C);
    setColumnProperty(tableText.labelIndent, tableText.variantIndentOff); // source: PropertiesTabElements.jsx:437
    closeColumnPopover(C);
    cy.forceClickOnCanvas();
    verifyCellValue(C, 0, tableText.variantJsonCompactRow0, W); // source: JSONRenderer.jsx:45-51
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // REMAINING SHARED PROPERTIES
  // ═══════════════════════════════════════════════════════════════════════════

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

  it("properties — Freeze column pins the rendered json cell to the left", () => {
    openColumnPopover(C);
    setPinPosition(tableText.pinLeft); // source: PropertiesTabElements.jsx:76
    closeColumnPopover(C);

    cy.forceClickOnCanvas();
    cy.get(tableSelector.cell(C, 0, W))
      .scrollIntoView()
      .should("have.class", tableText.cellClassPinned); // source: TableRow.jsx:137
    cy.get(tableSelector.cell(C, 0, W)).should(
      "have.class",
      tableText.cellClassPinnedLeft
    ); // source: TableRow.jsx:138
  });

  it("properties — Make editable turns the json cell into a contenteditable JSON editor", () => {
    openColumnPopover(C);
    toggleColumnProperty(tableText.labelMakeEditable); // source: PropertiesTabElements.jsx:385-400
    closeColumnPopover(C);

    cy.forceClickOnCanvas();
    cy.get(tableSelector.cell(C, 0, W))
      .scrollIntoView()
      .should("have.class", tableText.cellClassEditable); // source: TableRow.jsx:135
    // TableRow.jsx:118 ORs `columnType === 'text'` with `isEditable`, so ANY editable
    // column — json included — picks up `has-text` even though it is not a text column.
    cy.get(tableSelector.cell(C, 0, W)).should(
      "have.class",
      tableText.cellClassEditableText
    ); // source: TableRow.jsx:118

    // Unlike StringRenderer, JSONRenderer mounts the contenteditable div immediately
    // in the editable branch — it is both `.long-text-input` and
    // `[contenteditable="true"]` (JSONRenderer.jsx:84-119), which is what
    // typeIntoEditableCell drives.
    cy.get(tableSelector.cell(C, 0, W))
      .find(".long-text-input")
      .should("have.attr", "contenteditable", "true"); // source: JSONRenderer.jsx:88

    // handleChange only commits when JSON.parse succeeds (JSONRenderer.jsx:73-82), so
    // the probe value is a bare number — it is also brace-free, which matters because
    // cy.type() would otherwise read `{…}` as a special key sequence.
    editTableCell(C, 0, tableText.variantJsonEditedValue, W);
    verifySingleValueOnTable(C, 0, tableText.variantJsonEditedValue); // source: JSONRenderer.jsx:76
  });

  it("validations — an editable json column mounts NO validation fields", () => {
    openColumnPopover(C);
    toggleColumnProperty(tableText.labelMakeEditable); // source: PropertiesTabElements.jsx:385-400

    // getValidationList falls through to `default: return []` for json, and
    // ValidationProperties bails out on an empty list before rendering anything, so
    // the whole `.optional-properties-when-editable-true` block never mounts.
    cy.get(tableSelector.columnValidationSection).should("not.exist"); // source: ValidationProperties.jsx:164-165
    cy.get(tableSelector.columnValidationLabels).should("have.length", 0); // source: ValidationProperties.jsx:170-172
    closeColumnPopover(C);

    // Proves the negative is not vacuous: "Make editable" really did take effect.
    cy.forceClickOnCanvas();
    cy.get(tableSelector.cell(C, 0, W))
      .scrollIntoView()
      .should("have.class", tableText.cellClassEditable); // source: TableRow.jsx:135
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // STYLES (Styles tab) — json is in the colour-control allowlist at
  // StylesTabElements.jsx:131-145.
  // ═══════════════════════════════════════════════════════════════════════════

  it("styles — Text Alignment moves the rendered json cell content", () => {
    // The default is 'left' (generateColumnsData.js:179 `?? 'left'`), which TableRow
    // stamps as an explicit class rather than leaving unset.
    cy.forceClickOnCanvas();
    cy.get(tableSelector.cell(C, 0, W))
      .scrollIntoView()
      .should("have.class", tableText.cellClassAlignLeft); // source: generateColumnsData.js:179

    openEditorSidebar(W);
    openColumnPopover(C);
    switchColumnTab(tableText.columnTabStyles); // source: ColumnPopover.jsx:157
    // The label reads "Text Alignment" for json (it becomes "Alignment" only for
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

  it("styles — Text color paints the rendered json cell content", () => {
    openColumnPopover(C);
    switchColumnTab(tableText.columnTabStyles); // source: ColumnPopover.jsx:157
    verifyColumnColor(tableText.labelTextColor, tableText.variantDefaultTextColor); // source: ProgramaticallyHandleProperties.jsx:38
    setColumnColor(tableText.labelTextColor, tableText.variantTextColorRgba); // source: StylesTabElements.jsx:148-161

    // useTextColor.js:7 falls back to the TABLE-level textColor whenever the column
    // value is falsy or still the '#11181C' default, so only a genuinely overridden
    // column colour can reach the rendered node.
    // cellContentNode (div:not(:has(div))) resolves to the read-only wrapper div that
    // carries `style={cellStyles}` — NOT `cellContent` (`<td> div`), which matches
    // every nested div and makes verifyWidgetColorCss read the wrong $el[0].
    verifyWidgetColorCss(
      tableSelector.cellContentNode(C, 0, W),
      "color",
      tableText.variantTextColorRgba,
      true
    ); // source: JSONRenderer.jsx:37-39, :159
  });

  it("styles — Cell color paints the rendered json cell background", () => {
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
  // CELL RENDERING CONTRACT (F9)
  // ═══════════════════════════════════════════════════════════════════════════

  it("cell rendering — a json cell carries no type class, so the serialised object is the discriminator", () => {
    cy.forceClickOnCanvas();
    cy.get(tableSelector.cell(C, 0, W)).scrollIntoView();

    // F9: TableRow.jsx:107-142 enumerates a class for 8 of the 15 column types and
    // json is NOT one of them, so none of the neighbouring discriminators may appear.
    cy.get(tableSelector.cell(C, 0, W)).should(
      "not.have.class",
      tableText.cellClassByType.string
    ); // source: TableRow.jsx:132
    cy.get(tableSelector.cell(C, 0, W)).should(
      "not.have.class",
      tableText.cellClassByType.number
    ); // source: TableRow.jsx:120
    cy.get(tableSelector.cell(C, 0, W)).should(
      "not.have.class",
      tableText.cellClassByType.text
    ); // source: TableRow.jsx:118

    // What DOES prove the json renderer ran: the object was SERIALISED. A non-json
    // column renders the same object as "[object Object]", which contains no quoted
    // key and no quoted string value.
    cy.get(tableSelector.cell(C, 0, W)).should(
      "contain.text",
      tableText.variantJsonSerialisedKeyRow0
    ); // source: JSONRenderer.jsx:48-50
    cy.get(tableSelector.cell(C, 0, W)).should(
      "contain.text",
      tableText.variantJsonSerialisedValueRow0
    ); // source: JSONRenderer.jsx:43
    // The read-only branch wraps the serialised text in a plain <span>; there is no
    // `.html-cell` (that is the HTML column) and no <strong> (that is markdown).
    cy.get(tableSelector.cellHtmlContent(C, 0, W)).should("not.exist"); // source: HTMLRenderer.jsx:149-156
    cy.get(tableSelector.cellMarkdownBold(C, 0, W)).should("not.exist"); // source: MarkdownRenderer.jsx:152
  });
});
