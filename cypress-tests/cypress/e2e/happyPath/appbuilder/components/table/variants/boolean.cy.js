/**
 * SPEC — Table — variants/boolean.
 *
 * FOR AI: covers the `boolean` COLUMN TYPE of the Table widget end to end —
 * auto-generation / type switching, the shared column controls, the three
 * boolean-only style controls, the two ABSENCES that define the type
 * (no Text color, no validations) and the rendered cell contract.
 * Source root: frontend/src/AppBuilder/RightSideBar/Inspector/Components/Table/
 * (`columns` is declared bare as `type:'array'` at table.js:44, so NONE of these
 * controls live in the widget config — they live in the ColumnManager).
 *
 * ── WHY A SEEDED DATASET AND NOT THE SHIPPED ONE ────────────────────────────
 * The shipped seed data (table.js:692) has no boolean field, and a boolean cell
 * is rendered from `!!cellValue` (generateColumnsData.js:258) — so a string
 * column re-typed to boolean would render "true" for EVERY row and the
 * unchecked branch would be unreachable. `autogenerateColumns` ships ON
 * (table.js:713), and `typeof true === 'boolean'` maps straight to columnType
 * 'boolean' (autoGenerateColumns.js:110-119), so seeding
 * `[{ id:1, flag:true, active:false }, { id:2, flag:false, active:true }]` with
 * setTableData() produces a REAL boolean column whose row 0 is checked and row 1
 * unchecked. That both types the column for free and makes every renderer branch
 * reachable. The seeding lives in beforeEach so each it() stays self-contained.
 *
 * ── WHAT MAKES `boolean` DIFFERENT FROM EVERY OTHER TYPE ────────────────────
 *  · "Text color" is explicitly NOT rendered — StylesTabElements.jsx:147 wraps it
 *    in `column.columnType !== 'boolean'`, while "Cell color" (:163-176) IS.
 *  · It mounts NO validations — ValidationProperties' getValidationList falls to
 *    the default branch (:164-165) and the component returns '' before rendering
 *    its container (:170-172) — even though `isEditable` IS available for boolean
 *    (only image/link/button are excluded, PropertiesTabElements.jsx:385).
 *  · The Styles-tab alignment label reads "Alignment", not "Text Alignment"
 *    (StylesTabElements.jsx:32-34, shared with image/rating).
 * Those absences are asserted here as first-class coverage.
 *
 * ── HARNESS (deliberate deviation from the generic facet header contract) ────
 * `waitForDropSettle` DOES NOT EXIST in this repo (repo-wide grep: no
 * definition), and the plain `query-manager-toggle-button` beforeEach leaves the
 * Table too short for its cells to be reachable. This spec reuses the
 * proven-green Table harness shared by basics.cy.js / inspector.cy.js /
 * styles.cy.js: viewport → drag → hideTooltip → modifyCanvasSize → close the
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
 *  F3 (MED)  the "Checked" and "Unchecked" colour pickers are raw
 *      `Inspector/Elements/Color` mounted with NO cyLabel prop
 *      (StylesTabElements.jsx:109-116 / :119-126), so Color.jsx:68 interpolates
 *      `String(undefined)` and BOTH render `data-cy="undefined-picker"`. They can
 *      only be told apart POSITIONALLY, which is exactly what
 *      setColumnColor/verifyColumnColor's `index` argument exists for. The count
 *      assertion below pins the collision so the indices stay meaningful.
 *  F9 (INFO) boolean adds NO discriminating <td> class (TableRow.jsx:107-142
 *      lists no `boolean` branch), so `tableText.cellClassByType.boolean` is null
 *      and the renderer must be identified by the markup inside the cell.
 *  F19       the column-list data-cy is NOT normalised (Table.jsx:571
 *      interpolates the raw display name), so all helpers use `columnListItem`
 *      rather than the older normalising `tableSelector.columnItem`.
 *
 * Helpers (all resolved through cypress/support/componentAutomation/type-helper-index.md):
 *   components/table.js — resizeTableWidget, setTableData, openColumnPopover,
 *     closeColumnPopover, switchColumnTab, setColumnType, addColumnOfType,
 *     deleteColumn, verifyAndEnterColumnOptionInput, setColumnCodeField,
 *     verifyColumnCodeField, setColumnProperty, verifyColumnProperty,
 *     toggleColumnProperty, toggleColumnFx, setColumnColor, verifyColumnColor,
 *     setColumnAlignment, setPinPosition, verifyCellType
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
} from "Support/utils/appBuilder/components/table";
import { openEditorSidebar } from "Support/utils/appBuilder/properties";
import { verifyWidgetColorCss } from "Support/utils/appBuilder/styles";
import { resizeQueryPanel } from "Support/utils/appBuilder/querymanager/queryPanel";

// testIsolation:false — cypress-real-dnd caches its CDP client for the spec run;
// testIsolation's per-test AUT reset leaves that client stale, so 2nd+ test drags
// throw "No dragIntercepted". Keeping the AUT stable across tests keeps the drag
// intercept valid. Each test still re-logs-in + creates its own app in beforeEach,
// so shared browser state is not relied upon.
describe("Table — variants/boolean column type", { testIsolation: false }, () => {
  const W = tableText.defaultWidgetName; // 'table1'
  const C = tableText.variantBooleanColumn; // 'flag' — autoGenerateColumns.js:96

  beforeEach(() => {
    cy.apiLogin();
    cy.apiCreateApp(`${fake.companyName}-Table-Boolean-Column`); // dynamic: fake
    cy.openApp();
    cy.viewport(1400, 2200);
    cy.dragAndDropWidget("Table", 250, 100);
    cy.hideTooltip();
    cy.modifyCanvasSize(900, 800);
    cy.get("[data-cy='left-sidebar-settings-button']").click();
    resizeTableWidget(W, 750, 600);
    resizeQueryPanel("1");
    openEditorSidebar(W);
    // Seed the boolean dataset. setTableData ends with a canvas click (which
    // deselects the widget and closes the Inspector), so the sidebar is re-opened
    // afterwards — every it() below starts with the column list on screen.
    setTableData(tableText.variantBooleanData); // source: autoGenerateColumns.js:110-119
    openEditorSidebar(W);
  });

  afterEach(() => {
    cy.apiDeleteApp();
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // COLUMN CREATION / TYPE SWITCH
  // ═══════════════════════════════════════════════════════════════════════════

  it("column type — a boolean-valued key auto-generates as `boolean` and the type can be switched away and back", () => {
    openColumnPopover(C);
    // SelectComponent.jsx:52 resolves the raw stored value ('boolean') back to its
    // option, so the react-select SingleValue renders the option LABEL.
    cy.get(tableSelector.columnPopover)
      .find(tableSelector.columnTypeSelect)
      .should("contain.text", tableText.columnTypeLabel.boolean); // source: PropertiesTabElements.jsx:132
    closeColumnPopover(C);

    cy.forceClickOnCanvas();
    cy.get(tableSelector.cell(C, 0, W)).scrollIntoView();
    // F9: boolean adds NO <td> class of its own, so the READ-ONLY renderer branch is
    // the discriminator — a tick for a truthy value, a cross for a falsy one, told
    // apart only by the fill their <path> is given (BooleanRenderer.jsx:38-43).
    cy.get(tableSelector.cellBooleanTickIcon(C, 0, W)).should("have.length", 1); // source: BooleanRenderer.jsx:40
    cy.get(tableSelector.cellBooleanCrossIcon(C, 1, W)).should("have.length", 1); // source: BooleanRenderer.jsx:42
    cy.get(tableSelector.cell(C, 0, W)).should(
      "not.have.class",
      tableText.cellClassByType.string
    ); // source: TableRow.jsx:132

    // Switch to `string`: the textarea renderer takes over and the icon disappears.
    setColumnType(C, tableText.columnTypeValue.string); // source: PropertiesTabElements.jsx:125
    closeColumnPopover(C);
    cy.forceClickOnCanvas();
    verifyCellType(C, 0, tableText.cellClassByType.string, W); // source: TableRow.jsx:132
    cy.get(tableSelector.cellBooleanTickIcon(C, 0, W)).should("not.exist"); // source: BooleanRenderer.jsx:38-43

    // …and back to `boolean`, which restores the icon renderer.
    setColumnType(C, tableText.columnTypeValue.boolean); // source: PropertiesTabElements.jsx:132
    closeColumnPopover(C);
    cy.forceClickOnCanvas();
    cy.get(tableSelector.cell(C, 0, W)).should(
      "not.have.class",
      tableText.cellClassByType.string
    ); // source: TableRow.jsx:132
    cy.get(tableSelector.cellBooleanTickIcon(C, 0, W)).should("have.length", 1); // source: BooleanRenderer.jsx:40
  });

  it("column manager — a `boolean` column can be added, bound to a key and deleted", () => {
    // addColumnOfType sets the TYPE first (so type-specific fields mount), then the
    // name, then the key — the key is what the row data is read from
    // (generateColumnsData.js:163 accessorKey = column.key || column.name).
    addColumnOfType(
      tableText.variantNewBooleanColumn,
      tableText.columnTypeValue.boolean, // source: PropertiesTabElements.jsx:132
      tableText.variantBooleanColumn // source: autoGenerateColumns.js:96
    );
    closeColumnPopover(tableText.variantNewBooleanColumn);

    cy.forceClickOnCanvas();
    cy.get(tableSelector.columnHeader(tableText.variantNewBooleanColumn))
      .scrollIntoView()
      .should("have.text", tableText.variantNewBooleanColumn); // source: TableHeader.jsx:153
    // Bound to the same `flag` key, so it renders the same tick as the seed column.
    cy.get(
      tableSelector.cellBooleanTickIcon(
        tableText.variantNewBooleanColumn,
        0,
        W
      )
    ).should("have.length", 1); // source: BooleanRenderer.jsx:40

    // deleteColumn drives the popover header's [title="Delete column"] and asserts
    // BOTH the inspector row and the rendered header are gone.
    deleteColumn(tableText.variantNewBooleanColumn); // source: ColumnPopover.jsx:130-138
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // SHARED PROPERTIES (Properties tab)
  // ═══════════════════════════════════════════════════════════════════════════

  it("properties — Column name renames the rendered column, Key rebinds its data", () => {
    openColumnPopover(C);
    verifyColumnCodeField(tableSelector.columnNameField, C); // source: PropertiesTabElements.jsx:164-181
    verifyColumnCodeField(tableSelector.columnKeyField, tableText.variantBooleanColumn); // source: PropertiesTabElements.jsx:182-197

    // Renaming re-keys the rendered header AND every cell data-cy, because both are
    // derived from `columnDef.header` = the resolved column name
    // (generateColumnsData.js:165 → TableHeader.jsx:153 / TableRow.jsx:102-105).
    verifyAndEnterColumnOptionInput(
      tableText.labelColumnName,
      tableText.variantRenamedBooleanColumn
    ); // source: PropertiesTabElements.jsx:166
    closeColumnPopover(tableText.variantRenamedBooleanColumn);
    cy.forceClickOnCanvas();
    cy.get(tableSelector.columnHeader(tableText.variantRenamedBooleanColumn))
      .scrollIntoView()
      .should("have.text", tableText.variantRenamedBooleanColumn); // source: TableHeader.jsx:153
    cy.get(
      tableSelector.cellBooleanTickIcon(
        tableText.variantRenamedBooleanColumn,
        0,
        W
      )
    ).should("have.length", 1); // source: BooleanRenderer.jsx:40

    // The Key is the accessor, so re-pointing it at `active` — the inverse flag of the
    // seeded dataset — flips row 0 from the tick to the cross while the header (and
    // therefore the data-cy) stays put.
    openColumnPopover(tableText.variantRenamedBooleanColumn);
    verifyAndEnterColumnOptionInput(
      tableText.labelKey,
      tableText.variantBooleanAltKey
    ); // source: PropertiesTabElements.jsx:183
    closeColumnPopover(tableText.variantRenamedBooleanColumn);
    cy.forceClickOnCanvas();
    cy.get(
      tableSelector.cellBooleanCrossIcon(
        tableText.variantRenamedBooleanColumn,
        0,
        W
      )
    ).should("have.length", 1); // source: BooleanRenderer.jsx:42
    cy.get(
      tableSelector.cellBooleanTickIcon(
        tableText.variantRenamedBooleanColumn,
        0,
        W
      )
    ).should("not.exist"); // source: BooleanRenderer.jsx:40
  });

  it("properties — Transformation rewrites the rendered boolean", () => {
    openColumnPopover(C);
    verifyColumnCodeField(
      tableSelector.columnTransformationField,
      tableText.defaultTransformation
    ); // source: PropertiesTabElements.jsx:205

    // columnSlice.js:99 deliberately DROPS a transformation equal to '{{cellValue}}',
    // so only a real expression reaches transformTableData.js:33, which rewrites the
    // row's value for this key before the renderer ever sees it. Row 0 ships `true`,
    // so forcing `{{false}}` must swap its tick for a cross.
    setColumnCodeField(
      tableSelector.columnTransformationField,
      tableText.variantBooleanTransformation
    ); // source: PropertiesTabElements.jsx:200-218
    closeColumnPopover(C);

    cy.forceClickOnCanvas();
    cy.get(tableSelector.cell(C, 0, W)).scrollIntoView();
    cy.get(tableSelector.cellBooleanCrossIcon(C, 0, W)).should("have.length", 1); // source: transformTableData.js:33
    cy.get(tableSelector.cellBooleanTickIcon(C, 0, W)).should("not.exist"); // source: BooleanRenderer.jsx:40
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

  it("properties — Make editable swaps the icon for a real switch that commits a new value", () => {
    openColumnPopover(C);
    // `isEditable` IS offered for boolean — PropertiesTabElements.jsx:385 excludes
    // only image / link / button.
    toggleColumnProperty(tableText.labelMakeEditable); // source: PropertiesTabElements.jsx:385-400
    closeColumnPopover(C);

    cy.forceClickOnCanvas();
    cy.get(tableSelector.cell(C, 0, W))
      .scrollIntoView()
      .should("have.class", tableText.cellClassEditable); // source: TableRow.jsx:135
    // The read-only icon branch is replaced wholesale by the switch branch.
    cy.get(tableSelector.cellBooleanTickIcon(C, 0, W)).should("not.exist"); // source: BooleanRenderer.jsx:59
    cy.get(tableSelector.cellBooleanCheckbox(C, 0, W))
      .should("be.checked")
      .and("not.be.disabled"); // source: BooleanRenderer.jsx:47

    // `checked={value}` is driven straight off the cell value, so an unchecked box
    // after the click is proof the new value was committed through
    // handleCellValueChange (generateColumnsData.js:261-263).
    cy.get(tableSelector.cellBooleanCheckbox(C, 0, W)).click({ force: true });
    cy.get(tableSelector.cellBooleanCheckbox(C, 0, W)).should("not.be.checked"); // source: BooleanRenderer.jsx:47
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // VALIDATIONS — a boolean column mounts NONE
  // ═══════════════════════════════════════════════════════════════════════════

  it("validations — an editable `boolean` column mounts no validation controls at all", () => {
    openColumnPopover(C);
    toggleColumnProperty(tableText.labelMakeEditable); // source: PropertiesTabElements.jsx:385-400

    // PropertiesTabElements.jsx:401-412 DOES mount <ValidationProperties> once the
    // column is editable, but getValidationList has no `boolean` branch, so it falls
    // through to `default: return []` (:164-165) and the component bails out with ''
    // BEFORE rendering its container (:170-172). The section therefore never exists —
    // unlike string/number/text, where it holds 3-4 fields.
    cy.get(tableSelector.columnValidationSection).should("not.exist"); // source: ValidationProperties.jsx:170-172
    cy.get(tableSelector.columnPopover)
      .should("not.contain.text", tableText.labelRegex) // source: ValidationProperties.jsx:43
      .and("not.contain.text", tableText.labelMinLength) // source: ValidationProperties.jsx:52
      .and("not.contain.text", tableText.labelCustomRule); // source: ValidationProperties.jsx:66
    closeColumnPopover(C);
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // TYPE-SPECIFIC STYLES (Styles tab)
  // ═══════════════════════════════════════════════════════════════════════════

  it("styles — the alignment label reads `Alignment` for boolean and moves the rendered cell content", () => {
    openColumnPopover(C);
    switchColumnTab(tableText.columnTabStyles); // source: ColumnPopover.jsx:157
    // StylesTabElements.jsx:32-34 renders "Text Alignment" for every type EXCEPT
    // boolean / image / rating, which read plain "Alignment". Since "Alignment" is a
    // substring of "Text Alignment", the NEGATIVE assertion is the real discriminator.
    cy.get(tableSelector.columnPopover)
      .should("contain.text", tableText.labelAlignment) // source: StylesTabElements.jsx:34
      .and("not.contain.text", tableText.labelTextAlignment); // source: StylesTabElements.jsx:33
    setColumnAlignment(tableText.alignCenter); // source: StylesTabElements.jsx:44
    closeColumnPopover(C);

    cy.forceClickOnCanvas();
    cy.get(tableSelector.cell(C, 0, W))
      .scrollIntoView()
      .should("have.class", tableText.cellClassAlignCenter); // source: TableRow.jsx:114
    // The renderer builds its OWN flex class from the same value through
    // determineJustifyContentValue (_helpers/utils.js:1202).
    cy.get(tableSelector.cellRendererFlexWrapper(C, 0, W)).should(
      "have.class",
      tableText.cellFlexJustifyCenter
    ); // source: BooleanRenderer.jsx:54-56
  });

  it("styles — Checked / Unchecked paint the editable switch (both are `undefined-picker`, F3)", () => {
    openColumnPopover(C);
    // toggleOnBg / toggleOffBg are only consumed by the EDITABLE branch
    // (BooleanRenderer.jsx:48 styles the slider; the read-only icons take none), so
    // the column has to be editable before the colours can be observed at all.
    toggleColumnProperty(tableText.labelMakeEditable); // source: PropertiesTabElements.jsx:385-400
    switchColumnTab(tableText.columnTabStyles); // source: ColumnPopover.jsx:157

    // PRODUCT BUG F3 (MED): both pickers are raw `Inspector/Elements/Color` mounted
    // with NO cyLabel prop, so Color.jsx:68 emits the literal `undefined-picker` for
    // BOTH. Pinning the count is what makes the positional disambiguation below
    // meaningful — if a third unnamed picker ever appears, this fails loudly instead
    // of silently colouring the wrong control.
    cy.get(tableSelector.columnColorPicker(tableText.labelUnnamedColorPicker)).should(
      "have.length",
      tableText.variantBooleanUndefinedPickerCount
    ); // source: StylesTabElements.jsx:109-126 + Color.jsx:68

    // Light-mode shipped defaults; Color.jsx:83-85 renders the value as the picker's
    // own text.
    verifyColumnColor(
      tableText.labelUnnamedColorPicker,
      tableText.variantToggleOnDefault,
      0
    ); // source: StylesTabElements.jsx:113
    verifyColumnColor(
      tableText.labelUnnamedColorPicker,
      tableText.variantToggleOffDefault,
      1
    ); // source: StylesTabElements.jsx:123

    setColumnColor(
      tableText.labelUnnamedColorPicker,
      tableText.variantToggleOnRgba,
      0
    ); // source: StylesTabElements.jsx:109-116
    setColumnColor(
      tableText.labelUnnamedColorPicker,
      tableText.variantToggleOffRgba,
      1
    ); // source: StylesTabElements.jsx:119-126
    closeColumnPopover(C);

    // getCustomBgStyles picks toggleOnBg for a truthy value and toggleOffBg for a
    // falsy one (BooleanRenderer.jsx:28-36), so the seeded row 0 (true) must take the
    // "Checked" colour and row 1 (false) the "Unchecked" one — which is also what
    // proves the two colliding pickers wrote to two DIFFERENT properties.
    verifyWidgetColorCss(
      tableSelector.cellBooleanSlider(C, 0, W),
      "background-color",
      tableText.variantToggleOnRgba,
      true
    ); // source: BooleanRenderer.jsx:30
    verifyWidgetColorCss(
      tableSelector.cellBooleanSlider(C, 1, W),
      "background-color",
      tableText.variantToggleOffRgba,
      true
    ); // source: BooleanRenderer.jsx:33
  });

  it("styles — Cell color paints the rendered cell background", () => {
    openColumnPopover(C);
    switchColumnTab(tableText.columnTabStyles); // source: ColumnPopover.jsx:157
    // `cellBackgroundColor` IS offered for boolean — StylesTabElements.jsx:128-145
    // lists 'boolean' in the shared block, and only textColor is carved out of it.
    // The default is the design token var(--cc-surface1-surface); BaseColorSwatches
    // renders the token NAME rather than the raw var (BaseColorSwatches.jsx:153-157).
    verifyColumnColor(tableText.labelCellColor, tableText.colorTokenSurface1); // source: ProgramaticallyHandleProperties.jsx:35
    setColumnColor(tableText.labelCellColor, tableText.variantCellColorRgba); // source: StylesTabElements.jsx:163-176
    closeColumnPopover(C);

    // cellBackgroundColor lands as an inline backgroundColor on the <td> itself.
    cy.forceClickOnCanvas();
    verifyWidgetColorCss(
      tableSelector.cell(C, 0, W),
      "background-color",
      tableText.variantCellColorRgba,
      true
    ); // source: TableRow.jsx:81
  });

  it("styles — Text color is NOT offered for a boolean column", () => {
    openColumnPopover(C);
    switchColumnTab(tableText.columnTabStyles); // source: ColumnPopover.jsx:157

    // StylesTabElements.jsx:147 wraps the whole Text color field in
    // `column.columnType !== 'boolean'`, so neither its wrapper nor its picker is
    // ever mounted for this type — this is the single control that separates a
    // boolean column's Styles tab from a string column's.
    cy.get(tableSelector.columnTextColorField).should("not.exist"); // source: StylesTabElements.jsx:147-148
    cy.get(tableSelector.columnColorPicker(tableText.labelTextColor)).should(
      "not.exist"
    ); // source: StylesTabElements.jsx:158
    // …while the sibling Cell color from the SAME block (:163-176) is present, which
    // proves the tab rendered and the absence above is a real carve-out.
    cy.get(tableSelector.columnCellColorField).should(
      "contain.text",
      tableText.labelCellColor
    ); // source: StylesTabElements.jsx:165
    closeColumnPopover(C);
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // CELL RENDERING CONTRACT
  // ═══════════════════════════════════════════════════════════════════════════

  it("cell rendering — a boolean cell carries no type class (F9) and renders icons until it is editable", () => {
    cy.forceClickOnCanvas();
    cy.get(tableSelector.cell(C, 0, W)).scrollIntoView();
    // F9 (INFO): TableRow.jsx:107-142 has no `boolean` branch, so the cell is a plain
    // `table-cell td` — none of the type classes other renderers get apply here.
    cy.get(tableSelector.cell(C, 0, W))
      .should("not.have.class", tableText.cellClassByType.string) // source: TableRow.jsx:132
      .and("not.have.class", tableText.cellClassByType.number) // source: TableRow.jsx:120
      .and("not.have.class", tableText.cellClassByType.select) // source: TableRow.jsx:127
      .and("not.have.class", tableText.cellClassByType.text); // source: TableRow.jsx:118
    // Read-only: icons, no switch.
    cy.get(tableSelector.cellBooleanSwitch(C, 0, W)).should("not.exist"); // source: BooleanRenderer.jsx:46
    cy.get(tableSelector.cellBooleanTickIcon(C, 0, W)).should("have.length", 1); // source: BooleanRenderer.jsx:40

    openColumnPopover(C);
    toggleColumnProperty(tableText.labelMakeEditable); // source: PropertiesTabElements.jsx:385-400
    closeColumnPopover(C);
    cy.forceClickOnCanvas();

    // SOURCE CONTRADICTION worth reporting: `has-text` is documented (and named) as
    // the `text` column type's discriminator, but TableRow.jsx:118 ORs it with
    // `isEditable` — so an EDITABLE BOOLEAN column carries `has-text` too. Pinned
    // here so the behaviour is recorded rather than assumed.
    cy.get(tableSelector.cell(C, 0, W))
      .should("have.class", tableText.cellClassByType.text) // source: TableRow.jsx:118
      .and("have.class", tableText.cellClassEditable); // source: TableRow.jsx:135
    cy.get(tableSelector.cellBooleanSwitch(C, 0, W)).should("have.length", 1); // source: BooleanRenderer.jsx:46
    cy.get(tableSelector.cellBooleanSlider(C, 0, W)).should("have.length", 1); // source: BooleanRenderer.jsx:48
  });
});
