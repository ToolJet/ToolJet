/**
 * SPEC — Table — variants/html.
 *
 * FOR AI: covers the `html` COLUMN TYPE of the Table widget end to end — column
 * creation / type switching, the shared column controls, the two shared style
 * controls, the ABSENCE of any type-specific property, the ABSENCE of
 * validations, inline editing, and the rendered cell contract.
 * Source root: frontend/src/AppBuilder/RightSideBar/Inspector/Components/Table/
 * (`columns` is declared bare as `type:'array'` at table.js:44, so NONE of these
 * controls live in the widget config — they live in the ColumnManager).
 *
 * ── NOT DOCUMENTED ──────────────────────────────────────────────────────────
 * docs/docs/widgets/table/columns.md covers 9 of the 15 shipped column types and
 * `html` is NOT one of them. Every literal asserted here is derived from SOURCE
 * and carries an inline `// source:` citation; nothing is inferred from docs.
 *
 * ── WHY A SEEDED DATASET ────────────────────────────────────────────────────
 * The shipped seed data (table.js:692) contains no markup, so an html column
 * over it is indistinguishable from a string column. Each test therefore starts
 * from `variantHtmlData` — one string-valued `snippet` key holding
 * `<b>Ada</b> Lovelace`. Because `snippet` is a PRIMITIVE,
 * autoGenerateColumns.js:66-71 generates exactly one top-level `snippet` column
 * (type `string`, since typeof 'x' === 'string' → :110-119) and drops every
 * shipped column whose key is absent from the new data (:90-104). The spec then
 * only switches that generated column's type, which is the shortest honest path
 * to a REAL data-bound html column.
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
 *  F9  html adds NO discriminating <td> class (TableRow.jsx:107-142 lists
 *      has-textarea/has-number/has-select/… but nothing for html), so the TYPE
 *      is proved by the RENDERED MARKUP. html is nevertheless the ONE of the
 *      three undocumented types that stamps a class of its own INSIDE the cell —
 *      `span.html-cell`, filled through dangerouslySetInnerHTML
 *      (HTMLRenderer.jsx:149-156) — so `<b>x</b>` becomes a real <b> element
 *      rather than escaped text.
 *  F18 a duplicated column KEEPS ITS NAME (listItemHelpers.js:45-48).
 *  F19 the column-list data-cy is NOT normalised (Table.jsx:571).
 *  SANITISATION: the value passes through DOMPurify.sanitize
 *      (HTMLRenderer.jsx:50) before injection, which is why an upper-cased
 *      `<B>ADA</B>` still yields a lower-cased <b> element.
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
describe("Table — variants/html column type", { testIsolation: false }, () => {
  const W = tableText.defaultWidgetName; // 'table1'
  const C = tableText.variantHtmlColumn; // 'snippet' — the autogenerated column

  beforeEach(() => {
    cy.apiLogin();
    cy.apiCreateApp(`${fake.companyName}-Table-Html-Column`); // dynamic: fake
    cy.openApp();
    cy.viewport(1400, 2200);
    cy.dragAndDropWidget("Table", 250, 100);
    cy.hideTooltip();
    cy.modifyCanvasSize(900, 800);
    cy.get("[data-cy='left-sidebar-settings-button']").click();
    resizeTableWidget(W, 750, 600);
    resizeQueryPanel("1");

    // Seed markup-bearing data; autogeneration produces `id` + `snippet`.
    // setTableData ends on cy.forceClickOnCanvas(), which closes the Inspector —
    // hence the second openEditorSidebar.
    openEditorSidebar(W);
    setTableData(tableText.variantHtmlData); // source: table.js:21

    // Flip the generated `snippet` column from its `string` default to `html`.
    openEditorSidebar(W);
    setColumnType(C, tableText.columnTypeValue.html); // source: PropertiesTabElements.jsx:137
    closeColumnPopover(C);
  });

  afterEach(() => {
    cy.apiDeleteApp();
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // COLUMN CREATION / TYPE SWITCH
  // ═══════════════════════════════════════════════════════════════════════════

  it("column type — an html column reports `HTML` and parses its markup instead of escaping it", () => {
    openColumnPopover(C);
    // SelectComponent.jsx:51 resolves the stored value ('html') back to its option,
    // so the react-select SingleValue renders the option LABEL.
    cy.get(tableSelector.columnPopover)
      .find(tableSelector.columnTypeSelect)
      .should("contain.text", tableText.columnTypeLabel.html); // source: PropertiesTabElements.jsx:137
    closeColumnPopover(C);

    // F9: html adds NO <td> class, so the INJECTED MARKUP is the discriminator.
    cy.forceClickOnCanvas();
    cy.get(tableSelector.cell(C, 0, W)).scrollIntoView();
    cy.get(tableSelector.cellHtmlBold(C, 0, W)).should(
      "have.text",
      tableText.variantHtmlBoldRow0
    ); // source: HTMLRenderer.jsx:149-156
    // The tags themselves are consumed by the parser, so the cell's own text is the
    // rendered prose — not the raw source.
    verifyCellValue(C, 0, tableText.variantHtmlPlainRow0, W); // source: HTMLRenderer.jsx:41-51

    // Switching to `string` hands the same value to the textarea renderer, which
    // stamps a class of its own and shows the RAW markup verbatim as text.
    openEditorSidebar(W);
    setColumnType(C, tableText.columnTypeValue.string); // source: PropertiesTabElements.jsx:125
    closeColumnPopover(C);
    cy.forceClickOnCanvas();
    cy.get(tableSelector.cell(C, 0, W)).should(
      "have.class",
      tableText.cellClassByType.string
    ); // source: TableRow.jsx:132
    cy.get(tableSelector.cellHtmlContent(C, 0, W)).should("not.exist"); // source: HTMLRenderer.jsx:154
    verifyCellValue(C, 0, tableText.variantHtmlSourceRow0, W); // source: table.js:21

    // …and back to `html`: the class goes away and the parsed <b> returns.
    openEditorSidebar(W);
    setColumnType(C, tableText.columnTypeValue.html); // source: PropertiesTabElements.jsx:137
    closeColumnPopover(C);
    cy.forceClickOnCanvas();
    cy.get(tableSelector.cell(C, 0, W)).should(
      "not.have.class",
      tableText.cellClassByType.string
    ); // source: TableRow.jsx:132
    cy.get(tableSelector.cellHtmlBold(C, 0, W)).should(
      "have.text",
      tableText.variantHtmlBoldRow0
    ); // source: HTMLRenderer.jsx:149-156
  });

  it("column manager — an html column can be added, bound to a key and deleted", () => {
    // addColumnOfType sets the TYPE first (so type-specific fields mount), then the
    // name, then the key — the key is what the row data is read from
    // (generateColumnsData.js:163 accessorKey = column.key || column.name).
    openEditorSidebar(W);
    addColumnOfType(
      tableText.variantNewHtmlColumn,
      tableText.columnTypeValue.html, // source: PropertiesTabElements.jsx:137
      tableText.variantHtmlColumn
    );
    closeColumnPopover(tableText.variantNewHtmlColumn);

    cy.forceClickOnCanvas();
    cy.get(tableSelector.columnHeader(tableText.variantNewHtmlColumn))
      .scrollIntoView()
      .should("have.text", tableText.variantNewHtmlColumn); // source: TableHeader.jsx:153
    // Bound to the same `snippet` key, so it injects the same markup.
    cy.get(
      tableSelector.cellHtmlBold(tableText.variantNewHtmlColumn, 0, W)
    ).should("have.text", tableText.variantHtmlBoldRow0); // source: HTMLRenderer.jsx:149-156
    verifyCellValue(
      tableText.variantNewHtmlColumn,
      0,
      tableText.variantHtmlPlainRow0,
      W
    ); // source: HTMLRenderer.jsx:41-51

    // deleteColumn drives the popover header's [title="Delete column"] and asserts
    // BOTH the inspector row and the rendered header are gone.
    openEditorSidebar(W);
    deleteColumn(tableText.variantNewHtmlColumn); // source: ColumnPopover.jsx:130-138
  });

  it("column manager — duplicating an html column keeps its name (F18)", () => {
    // PRODUCT BUG F18 (MED): duplicateWithNewId (shared/utils/listItemHelpers.js:45-48)
    // copies the item verbatim and swaps ONLY the uuid, so the clone keeps the same
    // display name; TableHeader.jsx:153 derives the header data-cy from that name, so
    // the rendered side collides too.
    duplicateColumn(C);
    closeColumnPopover(C);
    cy.forceClickOnCanvas();
    cy.get(tableSelector.columnHeader(C)).should("have.length", 2); // source: listItemHelpers.js:45-48
    // Both clones inject markup, which proves the columnType was copied along with
    // the name rather than reset to the `string` default.
    cy.get(tableSelector.cellHtmlContent(C, 0, W)).should("have.length", 2); // source: HTMLRenderer.jsx:154
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // SHARED PROPERTIES (Properties tab)
  // ═══════════════════════════════════════════════════════════════════════════

  it("properties — Column name renames the rendered column, Key rebinds its data", () => {
    openColumnPopover(C);
    verifyColumnCodeField(tableSelector.columnNameField, C); // source: PropertiesTabElements.jsx:164-181
    verifyColumnCodeField(tableSelector.columnKeyField, tableText.variantHtmlColumn); // source: PropertiesTabElements.jsx:182-197

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
      tableText.variantHtmlPlainRow0,
      W
    ); // source: HTMLRenderer.jsx:41-51

    // The Key is the accessor, so re-pointing it at `id` swaps the rendered value
    // while the header (and therefore the data-cy) stays put. getCellValue coerces the
    // non-string 1 with String() before sanitising (HTMLRenderer.jsx:41-51).
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
    ); // source: HTMLRenderer.jsx:43-49
  });

  it("properties — Transformation rewrites the markup before it is injected", () => {
    openColumnPopover(C);
    verifyColumnCodeField(
      tableSelector.columnTransformationField,
      tableText.defaultTransformation
    ); // source: PropertiesTabElements.jsx:205

    // columnSlice.js:99 deliberately DROPS a transformation equal to '{{cellValue}}',
    // so only a real expression reaches transformTableData.js:33, which rewrites the
    // row's value for this key BEFORE the renderer ever sees it. Upper-casing turns
    // `<b>` into `<B>`; DOMPurify normalises the tag back to lower case while leaving
    // the TEXT upper-cased, which is what proves the transform ran upstream of the
    // sanitiser rather than on the already-rendered DOM.
    setColumnCodeField(
      tableSelector.columnTransformationField,
      tableText.variantTransformationUpper
    ); // source: PropertiesTabElements.jsx:200-218
    closeColumnPopover(C);
    cy.forceClickOnCanvas();
    cy.get(tableSelector.cell(C, 0, W)).scrollIntoView();
    cy.get(tableSelector.cellHtmlBold(C, 0, W)).should(
      "have.text",
      tableText.variantHtmlTransformedBoldRow0
    ); // source: HTMLRenderer.jsx:50
    verifyCellValue(C, 0, tableText.variantHtmlTransformedPlainRow0, W); // source: transformTableData.js:33
  });

  it("properties — html exposes NO type-specific property (no Indent card)", () => {
    openColumnPopover(C);
    // The Indent card is gated on `column.columnType === 'json'`, so an html column
    // must not mount it — neither the toggle nor its fx button.
    cy.get(tableSelector.columnParamToggle(tableText.labelIndent)).should(
      "not.exist"
    ); // source: PropertiesTabElements.jsx:429-448
    cy.get(tableSelector.columnParamFxButton(tableText.labelIndent)).should(
      "not.exist"
    ); // source: PropertiesTabElements.jsx:429-448

    // The shared, non-json-gated controls ARE present, which keeps the negative from
    // being an accident of a popover that failed to render.
    cy.get(tableSelector.columnParamToggle(tableText.labelMakeEditable)).should(
      "have.length",
      1
    ); // source: PropertiesTabElements.jsx:385-400
    cy.get(tableSelector.columnParamToggle(tableText.labelVisibility)).should(
      "have.length",
      1
    ); // source: PropertiesTabElements.jsx:449-466
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

  it("properties — Freeze column pins the rendered html cell to the left", () => {
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

  it("properties — Make editable turns the html cell into an inline editor", () => {
    openColumnPopover(C);
    toggleColumnProperty(tableText.labelMakeEditable); // source: PropertiesTabElements.jsx:385-400
    closeColumnPopover(C);

    cy.forceClickOnCanvas();
    cy.get(tableSelector.cell(C, 0, W))
      .scrollIntoView()
      .should("have.class", tableText.cellClassEditable); // source: TableRow.jsx:135
    // TableRow.jsx:118 ORs `columnType === 'text'` with `isEditable`, so ANY editable
    // column — html included — picks up `has-text` even though it is not a text
    // column. The td class is therefore NOT a type discriminator once editing is on.
    cy.get(tableSelector.cell(C, 0, W)).should(
      "have.class",
      tableText.cellClassEditableText
    ); // source: TableRow.jsx:118

    // renderEditable() mounts one div that is BOTH `.long-text-input` and
    // contenteditable, and — while `isEditing` is false — still injects through
    // `span.html-cell`, so the parsed <b> survives the switch to editable mode.
    cy.get(tableSelector.cell(C, 0, W))
      .find(".long-text-input")
      .should("have.attr", "contenteditable", "true"); // source: HTMLRenderer.jsx:84
    cy.get(tableSelector.cellHtmlBold(C, 0, W)).should(
      "have.text",
      tableText.variantHtmlBoldRow0
    ); // source: HTMLRenderer.jsx:116

    // Focusing flips isEditing on (HTMLRenderer.jsx:108-111), which swaps the injected
    // span for the RAW value as editable text; the edit commits from `e.target.textContent`
    // on blur, which {enter} triggers (:98-107). Unlike json this needs no parseable
    // syntax, so a plain name is the safest probe.
    const editedValue = fake.firstName; // dynamic: fake
    editTableCell(C, 0, editedValue, W);
    verifySingleValueOnTable(C, 0, editedValue); // source: HTMLRenderer.jsx:73-77
  });

  it("validations — an editable html column mounts NO validation fields", () => {
    openColumnPopover(C);
    toggleColumnProperty(tableText.labelMakeEditable); // source: PropertiesTabElements.jsx:385-400

    // getValidationList falls through to `default: return []` for html, and
    // ValidationProperties bails out on an empty list before rendering anything, so
    // the whole `.optional-properties-when-editable-true` block never mounts — no
    // Regex, no Min/Max length, no Custom rule.
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
  // STYLES (Styles tab) — html is in the colour-control allowlist at
  // StylesTabElements.jsx:131-145.
  // ═══════════════════════════════════════════════════════════════════════════

  it("styles — Text Alignment moves the rendered html cell content", () => {
    // The default is 'left' (generateColumnsData.js:179 `?? 'left'`), which TableRow
    // stamps as an explicit class rather than leaving unset.
    cy.forceClickOnCanvas();
    cy.get(tableSelector.cell(C, 0, W))
      .scrollIntoView()
      .should("have.class", tableText.cellClassAlignLeft); // source: generateColumnsData.js:179

    openEditorSidebar(W);
    openColumnPopover(C);
    switchColumnTab(tableText.columnTabStyles); // source: ColumnPopover.jsx:157
    // The label reads "Text Alignment" for html (it becomes "Alignment" only for
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

  it("styles — Text color paints the rendered html cell content", () => {
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
    ); // source: HTMLRenderer.jsx:37-39, :140
  });

  it("styles — Cell color paints the rendered html cell background", () => {
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

  it("cell rendering — an html cell carries no type class, so span.html-cell and its parsed <b> are the discriminator", () => {
    cy.forceClickOnCanvas();
    cy.get(tableSelector.cell(C, 0, W)).scrollIntoView();

    // F9: TableRow.jsx:107-142 enumerates a class for 8 of the 15 column types and
    // html is NOT one of them, so none of the neighbouring discriminators appear.
    cy.get(tableSelector.cell(C, 0, W)).should(
      "not.have.class",
      tableText.cellClassByType.string
    ); // source: TableRow.jsx:132
    cy.get(tableSelector.cell(C, 0, W)).should(
      "not.have.class",
      tableText.cellClassByType.text
    ); // source: TableRow.jsx:118
    cy.get(tableSelector.cell(C, 0, W)).should(
      "not.have.class",
      tableText.cellClassByType.link
    ); // source: TableRow.jsx:129

    // What DOES prove the html renderer ran: the ONE in-cell class of the three
    // undocumented types, holding a REAL <b> element rather than escaped text.
    cy.get(tableSelector.cellHtmlContent(C, 0, W)).should(
      "have.text",
      tableText.variantHtmlPlainRow0
    ); // source: HTMLRenderer.jsx:149-156
    cy.get(tableSelector.cellHtmlBold(C, 0, W)).should(
      "have.text",
      tableText.variantHtmlBoldRow0
    ); // source: HTMLRenderer.jsx:155
    // dangerouslySetInnerHTML emits elements, never the <strong> that only
    // ReactMarkdown produces from `**…**`.
    cy.get(tableSelector.cellMarkdownBold(C, 0, W)).should("not.exist"); // source: MarkdownRenderer.jsx:152
  });
});
