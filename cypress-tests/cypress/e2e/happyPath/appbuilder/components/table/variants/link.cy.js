/**
 * SPEC — Table — variants/link.
 *
 * FOR AI: covers the `link` COLUMN TYPE of the Table widget end to end — type
 * switching / column creation, the shared column controls, the two link-only
 * properties (Display text, Open in new tab), the three link-only style
 * controls (Text color→linkColor, Underline color, Show underline) and the TWO
 * absences that define the type (no "Make editable", no shared Cell color).
 * Source root: frontend/src/AppBuilder/RightSideBar/Inspector/Components/Table/
 * (`columns` is declared bare as `type:'array'` at table.js:44, so NONE of these
 * controls live in the widget config — they live in the ColumnManager).
 *
 * ── WHY A SEEDED DATASET AND A beforeEach TYPE SWITCH ───────────────────────
 * Neither the shipped `columns` default (table.js:713-800) nor the shipped seed
 * data (table.js:692) contains anything link-shaped, and `autogenerateColumns`
 * maps `typeof 'https://…' === 'string'` to columnType 'string'
 * (autoGenerateColumns.js:110-119) — so a URL-valued key auto-generates as a
 * STRING column. beforeEach therefore seeds
 * `[{ id, url, label }, …]` with setTableData() and re-types the generated `url`
 * column to `link` once, which leaves every it() below able to start from a real,
 * data-bound link column while still relying on nothing but beforeEach.
 *
 * ── WHAT MAKES `link` DIFFERENT FROM EVERY OTHER TYPE ───────────────────────
 *  · It is one of the two NEVER-EDITABLE types: PropertiesTabElements.jsx:385
 *    gates the whole "Make editable" card (toggle AND the ValidationProperties
 *    block it wraps) on `!['image','link','button'].includes(columnType)`, and
 *    useColumnManager.js:108 lists 'link' among the nonEditableTypes that get
 *    `isEditable:'{{false}}'` hard-written. Because it is never editable,
 *    ValidationProperties never mounts — a link column has NO validations.
 *  · It is the only type that REPLACES the shared colour pair instead of merely
 *    dropping it: StylesTabElements.jsx:131-144 does not list 'link', so neither
 *    `textColor` nor `cellBackgroundColor` is rendered; :180-209 re-adds a
 *    link-only pair (`linkColor` + `underlineColor`) under the SAME two wrapper
 *    data-cy values. The defaults are what tell them apart — the shared textColor
 *    defaults to #11181C (ProgramaticallyHandleProperties.jsx:38) while linkColor
 *    defaults to #1B1F24 (:55) — and "Cell color" simply has no counterpart.
 *  · Its Styles-tab alignment label reads "Text Alignment" (link is NOT in the
 *    boolean/image/rating carve-out at StylesTabElements.jsx:32-34).
 * Those two absences are asserted here as first-class coverage.
 *
 * ── HARNESS (deliberate deviation from the generic facet header contract) ────
 * `waitForDropSettle` DOES NOT EXIST in this repo (repo-wide grep: no
 * definition), and the plain `query-manager-toggle-button` beforeEach leaves the
 * Table too short for its cells to be reachable. This spec reuses the
 * proven-green Table harness shared by basics.cy.js / inspector.cy.js /
 * styles.cy.js: viewport → drag → hideTooltip → modifyCanvasSize → close the
 * settings panel → resizeTableWidget → resizeQueryPanel('1') → openEditorSidebar.
 * ONE cy.dragAndDropWidget per test, in beforeEach (F28).
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
 * ── PRODUCT BUGS / SOURCE QUIRKS HONOURED HERE ──────────────────────────────
 *  F4 (LOW)  MISLEADING WRAPPER data-cy on the link Styles tab. "Underline
 *      color" is wrapped in `input-and-label-cell-background-color`
 *      (StylesTabElements.jsx:196) even though it is not a cell background, and
 *      "Show underline" is wrapped in `input-overflow` with a `label-overflow`
 *      label (:212, :215) even though it has nothing to do with overflow. Both
 *      are used verbatim below (tableSelector.columnCellColorField /
 *      columnUnderlineToggleField) and cited at every use site, because renaming
 *      them is a product change, not a spec change.
 *  F30 (LOW, new) THE UNDERLINE-COLOUR DEFAULT IS DISPLAY-ONLY. The inspector
 *      shows #4368E3 for "Underline color" (ProgramaticallyHandleProperties.jsx:
 *      48-50 is a render-time fallback, not a write), but nothing is stored on
 *      the column until the user picks a colour — and generateColumnsData.js:463
 *      passes the RAW `column?.underlineColor`, so the rendered <a> gets
 *      `textDecorationColor: undefined` and React omits the declaration entirely.
 *      The same shape applies to `linkTarget` (:462 vs the '{{true}}' shown at
 *      ProgramaticallyHandleProperties.jsx:32) — there the renderer's own default
 *      (LinkRenderer.jsx:20 `linkTarget = '_blank'`) happens to agree, so it is
 *      invisible. Asserted below as an INLINE-style-empty check rather than
 *      papered over.
 *  F29 (LOW)  "Display text" (PropertiesTabElements.jsx:332) is mounted with no
 *      wrapper data-cy and no paramLabel, exactly like `number`'s Decimal Places
 *      at :368, so it is only reachable structurally — see
 *      tableSelector.columnDisplayTextField.
 *  F19       the column-list data-cy is NOT normalised (Table.jsx:571
 *      interpolates the raw display name), so all helpers use `columnListItem`
 *      rather than the older normalising `tableSelector.columnItem`.
 *
 * Helpers (all resolved through cypress/support/componentAutomation/type-helper-index.md):
 *   components/table.js — resizeTableWidget, setTableData, openColumnPopover,
 *     closeColumnPopover, switchColumnTab, setColumnType, addColumnOfType,
 *     deleteColumn, verifyAndEnterColumnOptionInput, setColumnCodeField,
 *     verifyColumnCodeField, setColumnProperty, verifyColumnProperty,
 *     toggleColumnFx, setColumnColor, verifyColumnColor, setColumnAlignment,
 *     setPinPosition, verifyCellType
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
describe("Table — variants/link column type", { testIsolation: false }, () => {
  const W = tableText.defaultWidgetName; // 'table1'
  const C = tableText.variantLinkColumn; // 'url' — autoGenerateColumns.js:96

  // "Show underline" is a bare ToggleGroup (StylesTabElements.jsx:217-226): the group
  // itself carries no data-cy and its items are the generic `togglr-button-<value>`
  // (ToggleGroupItem.jsx:33 — note the source typo), which collide with the Styles-tab
  // alignment group in the same panel. Scoping through the owning wrapper is the only
  // unambiguous path — and that wrapper is the misleadingly named `input-overflow` (F4).
  const setUnderlineMode = (value) => {
    cy.get(tableSelector.columnUnderlineToggleField)
      .find(tableSelector.toggleGroupItem(value))
      .first()
      .click({ force: true });
    cy.waitForAutoSave();
  };

  beforeEach(() => {
    cy.apiLogin();
    cy.apiCreateApp(`${fake.companyName}-Table-Link-Column`); // dynamic: fake
    cy.openApp();
    cy.viewport(1400, 2200);
    cy.dragAndDropWidget("Table", 250, 100);
    cy.hideTooltip();
    cy.modifyCanvasSize(900, 800);
    cy.get("[data-cy='left-sidebar-settings-button']").click();
    resizeTableWidget(W, 750, 600);
    resizeQueryPanel("1");
    openEditorSidebar(W);
    // Seed the link dataset. setTableData ends with a canvas click (which deselects the
    // widget and closes the Inspector), so the sidebar is re-opened afterwards.
    setTableData(tableText.variantLinkData); // source: autoGenerateColumns.js:110-119
    openEditorSidebar(W);
    // A URL-valued key auto-generates as `string`, so the type switch is what makes the
    // column a LINK column. setColumnType opens the popover itself; close it again so
    // every it() starts from the same state (column list on screen, popover shut).
    setColumnType(C, tableText.columnTypeValue.link); // source: PropertiesTabElements.jsx:134
    closeColumnPopover(C);
  });

  afterEach(() => {
    cy.apiDeleteApp();
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // COLUMN CREATION / TYPE SWITCH
  // ═══════════════════════════════════════════════════════════════════════════

  it("column type — a string column re-typed to `link` renders an anchor, and the type can be switched away and back", () => {
    openColumnPopover(C);
    // SelectComponent.jsx:52 resolves the raw stored value ('link') back to its option,
    // so the react-select SingleValue renders the option LABEL.
    cy.get(tableSelector.columnPopover)
      .find(tableSelector.columnTypeSelect)
      .should("contain.text", tableText.columnTypeLabel.link); // source: PropertiesTabElements.jsx:134
    closeColumnPopover(C);

    cy.forceClickOnCanvas();
    cy.get(tableSelector.cell(C, 0, W)).scrollIntoView();
    // `link` is one of the eight types that DO add a discriminating <td> class.
    verifyCellType(C, 0, tableText.cellClassByType.link, W); // source: TableRow.jsx:129
    // LinkRenderer.jsx:46-59 — the anchor is the whole rendered contract: href is the
    // raw cell value and the visible text falls back to it when displayText is unset.
    cy.get(tableSelector.cellLink(C, 0, W))
      .should("have.attr", "href", tableText.variantLinkRow0Href) // source: LinkRenderer.jsx:48
      .and("have.text", tableText.variantLinkRow0Href); // source: LinkRenderer.jsx:58

    // Switch to `string`: the textarea renderer takes over, the <a> is gone and the raw
    // URL is rendered as plain text instead.
    setColumnType(C, tableText.columnTypeValue.string); // source: PropertiesTabElements.jsx:125
    closeColumnPopover(C);
    cy.forceClickOnCanvas();
    verifyCellType(C, 0, tableText.cellClassByType.string, W); // source: TableRow.jsx:132
    cy.get(tableSelector.cellLink(C, 0, W)).should("not.exist"); // source: LinkRenderer.jsx:46
    cy.get(tableSelector.cell(C, 0, W)).should(
      "not.have.class",
      tableText.cellClassByType.link
    ); // source: TableRow.jsx:129

    // …and back to `link`, which restores both the class and the anchor.
    setColumnType(C, tableText.columnTypeValue.link); // source: PropertiesTabElements.jsx:134
    closeColumnPopover(C);
    cy.forceClickOnCanvas();
    verifyCellType(C, 0, tableText.cellClassByType.link, W); // source: TableRow.jsx:129
    cy.get(tableSelector.cellLink(C, 0, W)).should(
      "have.attr",
      "href",
      tableText.variantLinkRow0Href
    ); // source: LinkRenderer.jsx:48
  });

  it("column manager — a `link` column can be added, bound to a key and deleted", () => {
    // addColumnOfType sets the TYPE first (so the link-only fields mount), then the
    // name, then the key — the key is what the row data is read from
    // (generateColumnsData.js:163 accessorKey = column.key || column.name).
    addColumnOfType(
      tableText.variantNewLinkColumn,
      tableText.columnTypeValue.link, // source: PropertiesTabElements.jsx:134
      tableText.variantLinkColumnKey // source: autoGenerateColumns.js:96
    );
    closeColumnPopover(tableText.variantNewLinkColumn);

    cy.forceClickOnCanvas();
    cy.get(tableSelector.columnHeader(tableText.variantNewLinkColumn))
      .scrollIntoView()
      .should("have.text", tableText.variantNewLinkColumn); // source: TableHeader.jsx:153
    // Bound to the same `url` key, so it renders the same anchor as the seed column.
    cy.get(tableSelector.cellLink(tableText.variantNewLinkColumn, 0, W)).should(
      "have.attr",
      "href",
      tableText.variantLinkRow0Href
    ); // source: LinkRenderer.jsx:48

    // deleteColumn drives the popover header's [title="Delete column"] and asserts BOTH
    // the inspector row and the rendered header are gone.
    deleteColumn(tableText.variantNewLinkColumn); // source: ColumnPopover.jsx:130-138
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // SHARED PROPERTIES (Properties tab)
  // ═══════════════════════════════════════════════════════════════════════════

  it("properties — Column name renames the rendered column, Key rebinds its href", () => {
    openColumnPopover(C);
    verifyColumnCodeField(tableSelector.columnNameField, C); // source: PropertiesTabElements.jsx:164-181
    verifyColumnCodeField(
      tableSelector.columnKeyField,
      tableText.variantLinkColumnKey
    ); // source: PropertiesTabElements.jsx:182-197

    // Renaming re-keys the rendered header AND every cell data-cy, because both are
    // derived from `columnDef.header` = the resolved column name
    // (generateColumnsData.js:165 → TableHeader.jsx:153 / TableRow.jsx:102-105).
    verifyAndEnterColumnOptionInput(
      tableText.labelColumnName,
      tableText.variantRenamedLinkColumn
    ); // source: PropertiesTabElements.jsx:166
    closeColumnPopover(tableText.variantRenamedLinkColumn);
    cy.forceClickOnCanvas();
    cy.get(tableSelector.columnHeader(tableText.variantRenamedLinkColumn))
      .scrollIntoView()
      .should("have.text", tableText.variantRenamedLinkColumn); // source: TableHeader.jsx:153
    cy.get(
      tableSelector.cellLink(tableText.variantRenamedLinkColumn, 0, W)
    ).should("have.attr", "href", tableText.variantLinkRow0Href); // source: LinkRenderer.jsx:48

    // The Key is the accessor: re-pointing it at `label` makes the seeded plain-text
    // value both the href AND the anchor text, which is only possible if the accessor
    // really moved.
    openColumnPopover(tableText.variantRenamedLinkColumn);
    verifyAndEnterColumnOptionInput(
      tableText.labelKey,
      tableText.variantLinkAltKey
    ); // source: PropertiesTabElements.jsx:183
    closeColumnPopover(tableText.variantRenamedLinkColumn);
    cy.forceClickOnCanvas();
    cy.get(tableSelector.cellLink(tableText.variantRenamedLinkColumn, 0, W))
      .should("have.attr", "href", tableText.variantLinkAltValueRow0) // source: LinkRenderer.jsx:48
      .and("have.text", tableText.variantLinkAltValueRow0); // source: LinkRenderer.jsx:58
  });

  it("properties — Transformation rewrites the rendered href and anchor text", () => {
    openColumnPopover(C);
    verifyColumnCodeField(
      tableSelector.columnTransformationField,
      tableText.defaultTransformation
    ); // source: PropertiesTabElements.jsx:205

    // columnSlice.js:99 deliberately DROPS a transformation equal to '{{cellValue}}', so
    // only a real expression reaches transformTableData.js:33, which rewrites the row's
    // value for this key before LinkRenderer ever sees it — and the renderer pipes that
    // value into BOTH href (:48) and the fallback text (:58).
    setColumnCodeField(
      tableSelector.columnTransformationField,
      tableText.variantTransformationUpper
    ); // source: PropertiesTabElements.jsx:200-218
    closeColumnPopover(C);

    cy.forceClickOnCanvas();
    cy.get(tableSelector.cell(C, 0, W)).scrollIntoView();
    cy.get(tableSelector.cellLink(C, 0, W))
      .should("have.attr", "href", tableText.variantLinkRow0HrefUpper) // source: transformTableData.js:33
      .and("have.text", tableText.variantLinkRow0HrefUpper); // source: LinkRenderer.jsx:58
  });

  it("properties — Display text overrides the anchor label while the href keeps the raw value", () => {
    cy.forceClickOnCanvas();
    // Baseline: with displayText unset the anchor falls back to String(value)
    // (LinkRenderer.jsx:58), so text and href are the same string.
    cy.get(tableSelector.cellLink(C, 0, W))
      .scrollIntoView()
      .should("have.text", tableText.variantLinkRow0Href); // source: LinkRenderer.jsx:58

    openColumnPopover(C);
    // F29: the "Display text" wrapper carries NO data-cy and its CodeHinter no
    // paramLabel, so it is addressed structurally — for a link column it is the only
    // `div.field.mb-2.px-3:not([data-cy])` in the popover.
    setColumnCodeField(
      tableSelector.columnDisplayTextField,
      tableText.variantLinkDisplayText
    ); // source: PropertiesTabElements.jsx:332-344
    verifyColumnCodeField(
      tableSelector.columnDisplayTextField,
      tableText.variantLinkDisplayText
    ); // source: PropertiesTabElements.jsx:337
    closeColumnPopover(C);

    cy.forceClickOnCanvas();
    // displayText replaces the LABEL only — the href is still the resolved cell value,
    // which is exactly what makes it a display override rather than a value override.
    cy.get(tableSelector.cellLink(C, 0, W))
      .scrollIntoView()
      .should("have.text", tableText.variantLinkDisplayText) // source: LinkRenderer.jsx:58
      .and("have.attr", "href", tableText.variantLinkRow0Href); // source: LinkRenderer.jsx:48
  });

  it("properties — Open in new tab defaults to `{{true}}` and `{{false}}` renders target=_self", () => {
    cy.forceClickOnCanvas();
    // Default: the column carries no `linkTarget` at all, so generateColumnsData.js:462
    // resolves undefined and LinkRenderer's own default parameter (:20 `= '_blank'`)
    // applies — the same outcome the inspector advertises with '{{true}}'.
    cy.get(tableSelector.cellLink(C, 0, W))
      .scrollIntoView()
      .should("have.attr", "target", tableText.linkTargetBlank); // source: LinkRenderer.jsx:49

    openColumnPopover(C);
    // `linkTarget` is rendered by ProgramaticallyHandleProperties, so it is fx-capable:
    // the fx button exists and turning it ON is what mounts the code field
    // (SingleLineCodeEditor.jsx:794-802). fx state for a column is the `fxActiveFields[]`
    // array, not a per-field boolean (ProgramaticallyHandleProperties.jsx:104-147).
    toggleColumnFx(tableText.labelOpenInNewTab); // source: PropertiesTabElements.jsx:346-364
    verifyColumnProperty(
      tableText.labelOpenInNewTab,
      tableText.variantDefaultLinkTarget
    ); // source: ProgramaticallyHandleProperties.jsx:32
    setColumnProperty(
      tableText.labelOpenInNewTab,
      tableText.variantSelfLinkTarget
    ); // source: PropertiesTabElements.jsx:355
    closeColumnPopover(C);

    // LinkRenderer.jsx:49 treats BOTH the string '_self' and the boolean false as
    // "same tab", which is why the legacy spellings normalise to '{{false}}'
    // (ProgramaticallyHandleProperties.jsx:29-31).
    cy.forceClickOnCanvas();
    cy.get(tableSelector.cellLink(C, 0, W))
      .scrollIntoView()
      .should("have.attr", "target", tableText.linkTargetSelf); // source: LinkRenderer.jsx:49
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

  // ═══════════════════════════════════════════════════════════════════════════
  // REQUIRED ABSENCE — a link column is NEVER editable and has NO validations
  // ═══════════════════════════════════════════════════════════════════════════

  it("properties — Make editable is NOT offered for a link column, so no validation block can mount", () => {
    openColumnPopover(C);
    // PropertiesTabElements.jsx:385 gates the entire "Make editable" card — the toggle
    // AND the ValidationProperties block it wraps (:401-412) — on
    // `!['image','link','button'].includes(columnType)`.
    cy.get(tableSelector.makeEditableToggle).should("not.exist"); // source: PropertiesTabElements.jsx:385-400
    cy.get(tableSelector.columnValidationSection).should("not.exist"); // source: PropertiesTabElements.jsx:401-412
    cy.get(tableSelector.columnPopover)
      .should("not.contain.text", tableText.labelMakeEditable) // source: PropertiesTabElements.jsx:397
      .and("not.contain.text", tableText.labelRegex) // source: ValidationProperties.jsx:43
      .and("not.contain.text", tableText.labelCustomRule); // source: ValidationProperties.jsx:66
    // The sibling Visibility toggle from the same tab (:449-466) IS mounted, which proves
    // the Properties tab rendered and the absence above is a real carve-out rather than
    // an unrendered panel.
    cy.get(tableSelector.columnParamToggle(tableText.labelVisibility)).should(
      "have.length",
      1
    ); // source: PropertiesTabElements.jsx:449-466
    // …as is the link-only "Open in new tab" toggle, which only a link column has.
    cy.get(tableSelector.columnParamToggle(tableText.labelOpenInNewTab)).should(
      "have.length",
      1
    ); // source: PropertiesTabElements.jsx:359
    closeColumnPopover(C);

    // useColumnManager.js:108 lists 'link' among the nonEditableTypes, so nothing in the
    // column manager can flip it either — the rendered cell never picks up `isEditable`.
    cy.forceClickOnCanvas();
    cy.get(tableSelector.cell(C, 0, W))
      .scrollIntoView()
      .should("not.have.class", tableText.cellClassEditable); // source: TableRow.jsx:135
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // TYPE-SPECIFIC STYLES (Styles tab)
  // ═══════════════════════════════════════════════════════════════════════════

  it("styles — the alignment label reads `Text Alignment` for link and moves the rendered cell", () => {
    openColumnPopover(C);
    switchColumnTab(tableText.columnTabStyles); // source: ColumnPopover.jsx:157
    // StylesTabElements.jsx:32-34 shortens the label to plain "Alignment" for
    // boolean / image / rating ONLY — `link` keeps the full "Text Alignment", which is
    // the positive half of the same discriminator the boolean/image specs assert
    // negatively.
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

  it("styles — Text color writes `linkColor` (default #1B1F24) and paints the rendered anchor", () => {
    cy.forceClickOnCanvas();
    // LinkRenderer.jsx:26-31 collapses the sentinel default back to itself in light mode,
    // so an untouched link renders at #1B1F24 — NOT the shared textColor default #11181C
    // (ProgramaticallyHandleProperties.jsx:38), which is exactly how the rendered side
    // proves this control writes `linkColor` and not `textColor`.
    cy.get(tableSelector.cellLink(C, 0, W))
      .scrollIntoView()
      .should("have.css", "color", tableText.variantDefaultLinkColorCss); // source: LinkRenderer.jsx:30

    openColumnPopover(C);
    switchColumnTab(tableText.columnTabStyles); // source: ColumnPopover.jsx:157
    // The picker keeps the shared `text-color-picker` data-cy (its displayName is still
    // "Text color", StylesTabElements.jsx:192) but is bound to `linkColor` (:189), and
    // its default is the give-away.
    verifyColumnColor(
      tableText.labelTextColor,
      tableText.variantDefaultLinkColor
    ); // source: ProgramaticallyHandleProperties.jsx:55
    setColumnColor(tableText.labelTextColor, tableText.variantLinkColorRgba); // source: StylesTabElements.jsx:182-195
    closeColumnPopover(C);

    // Any colour other than the sentinel is passed straight through
    // (LinkRenderer.jsx:27-28) and lands as the anchor's inline `color`.
    verifyWidgetColorCss(
      tableSelector.cellLink(C, 0, W),
      "color",
      tableText.variantLinkColorRgba,
      true
    ); // source: LinkRenderer.jsx:52
  });

  it("styles — Underline color is display-only until set (F30), then lands as textDecorationColor", () => {
    openColumnPopover(C);
    switchColumnTab(tableText.columnTabStyles); // source: ColumnPopover.jsx:157
    // F4: "Underline color" lives in the wrapper named `input-and-label-cell-background-color`
    // (StylesTabElements.jsx:196). Assert the LABEL through that wrapper so the
    // mislabelling is documented rather than silently relied upon.
    cy.get(tableSelector.columnCellColorField).should(
      "contain.text",
      tableText.labelUnderlineColor
    ); // source: StylesTabElements.jsx:199 (F4)
    verifyColumnColor(
      tableText.labelUnderlineColor,
      tableText.variantDefaultUnderlineColor
    ); // source: ProgramaticallyHandleProperties.jsx:49
    closeColumnPopover(C);

    // F30 (LOW): that #4368E3 is a RENDER-TIME fallback inside the inspector, not a value
    // written to the column — generateColumnsData.js:463 forwards the raw
    // `column?.underlineColor` (undefined), so LinkRenderer.jsx:54 sets
    // textDecorationColor: undefined and React omits the declaration. Assert the INLINE
    // style specifically: the COMPUTED value would fall back to `color` and hide the bug.
    cy.forceClickOnCanvas();
    cy.get(tableSelector.cellLink(C, 0, W))
      .scrollIntoView()
      .should(($a) => {
        expect($a[0].style.getPropertyValue("text-decoration-color")).to.equal(
          ""
        );
      }); // source: generateColumnsData.js:463 + LinkRenderer.jsx:54

    // Once a colour is actually picked it does reach the anchor.
    openColumnPopover(C);
    switchColumnTab(tableText.columnTabStyles); // source: ColumnPopover.jsx:157
    setColumnColor(
      tableText.labelUnderlineColor,
      tableText.variantUnderlineColorRgba
    ); // source: StylesTabElements.jsx:196-209
    closeColumnPopover(C);

    verifyWidgetColorCss(
      tableSelector.cellLink(C, 0, W),
      "text-decoration-color",
      tableText.variantUnderlineColorRgba,
      true
    ); // source: LinkRenderer.jsx:54
  });

  it("styles — Show underline switches the anchor between the hover and always classes", () => {
    cy.forceClickOnCanvas();
    // Default 'hover' (ProgramaticallyHandleProperties.jsx:52 / StylesTabElements.jsx:220):
    // the class is `table-link-hover` and LinkRenderer.jsx:53 writes NO inline
    // text-decoration, because `underline === 'always' && 'underline'` evaluates to false
    // and React drops a false style value.
    cy.get(tableSelector.cellLink(C, 0, W))
      .scrollIntoView()
      .should("have.class", tableText.linkClassUnderlineHover) // source: LinkRenderer.jsx:36
      .and("not.have.class", tableText.linkClassUnderlineAlways); // source: LinkRenderer.jsx:39

    openColumnPopover(C);
    switchColumnTab(tableText.columnTabStyles); // source: ColumnPopover.jsx:157
    // F4: the "Show underline" ToggleGroup is wrapped in `input-overflow` with a
    // `label-overflow` label (StylesTabElements.jsx:212, :215) despite having nothing to
    // do with overflow — assert the label through that wrapper to pin the quirk.
    cy.get(tableSelector.columnUnderlineToggleLabel).should(
      "have.text",
      tableText.labelShowUnderline
    ); // source: StylesTabElements.jsx:215-217 (F4)
    setUnderlineMode(tableText.underlineAlwaysValue); // source: StylesTabElements.jsx:224
    closeColumnPopover(C);

    cy.forceClickOnCanvas();
    cy.get(tableSelector.cellLink(C, 0, W))
      .scrollIntoView()
      .should("have.class", tableText.linkClassUnderlineAlways) // source: LinkRenderer.jsx:39
      .and("not.have.class", tableText.linkClassUnderlineHover) // source: LinkRenderer.jsx:36
      .and(
        "have.css",
        "text-decoration-line",
        tableText.linkTextDecorationAlways
      ); // source: LinkRenderer.jsx:53
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // REQUIRED ABSENCE — the shared colour pair is replaced, not merely reused
  // ═══════════════════════════════════════════════════════════════════════════

  it("styles — the shared Text color / Cell color pair is NOT rendered for a link column", () => {
    openColumnPopover(C);
    switchColumnTab(tableText.columnTabStyles); // source: ColumnPopover.jsx:157

    // The shared block at StylesTabElements.jsx:131-144 lists thirteen column types and
    // 'link' is NOT one of them, so neither the shared `textColor` swatch nor the
    // `cellBackgroundColor` swatch is mounted. "Cell color" leaves no trace at all —
    // there is no link-only counterpart for it — which makes it the cleanest proof.
    cy.get(tableSelector.columnColorPicker(tableText.labelCellColor)).should(
      "not.exist"
    ); // source: StylesTabElements.jsx:165-172
    cy.get(tableSelector.columnPopover).should(
      "not.contain.text",
      tableText.labelCellColor
    ); // source: StylesTabElements.jsx:165

    // The `input-and-label-text-color` wrapper IS present — but it belongs to the
    // link-only block at :182-195, which binds it to `linkColor`. The defaults are the
    // discriminator: the shared textColor swatch would read #11181C
    // (ProgramaticallyHandleProperties.jsx:38); linkColor reads #1B1F24 (:55).
    cy.get(tableSelector.columnTextColorField).should(
      "contain.text",
      tableText.labelTextColor
    ); // source: StylesTabElements.jsx:182-192
    verifyColumnColor(
      tableText.labelTextColor,
      tableText.variantDefaultLinkColor
    ); // source: ProgramaticallyHandleProperties.jsx:55
    cy.get(tableSelector.columnColorPicker(tableText.labelTextColor)).should(
      "not.contain.text",
      tableText.variantDefaultTextColor
    ); // source: ProgramaticallyHandleProperties.jsx:38

    // …and the two remaining link-only controls are mounted, which proves the tab
    // rendered and the absence above is a real carve-out.
    cy.get(tableSelector.columnColorPicker(tableText.labelUnderlineColor)).should(
      "have.length",
      1
    ); // source: StylesTabElements.jsx:196-209
    cy.get(tableSelector.columnUnderlineToggleField).should(
      "contain.text",
      tableText.labelShowUnderline
    ); // source: StylesTabElements.jsx:212-217 (F4)
    closeColumnPopover(C);
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // CELL RENDERING CONTRACT
  // ═══════════════════════════════════════════════════════════════════════════

  it("cell rendering — a link cell carries `has-link` and renders exactly one hardened anchor per row", () => {
    cy.forceClickOnCanvas();
    cy.get(tableSelector.cell(C, 0, W)).scrollIntoView();
    // `has-link` is the type discriminator; the other renderers' classes must be absent,
    // and `isEditable` can never appear (PropertiesTabElements.jsx:385).
    cy.get(tableSelector.cell(C, 0, W))
      .should("have.class", tableText.cellClassByType.link) // source: TableRow.jsx:129
      .and("not.have.class", tableText.cellClassByType.string) // source: TableRow.jsx:132
      .and("not.have.class", tableText.cellClassByType.text) // source: TableRow.jsx:118
      .and("not.have.class", tableText.cellClassEditable); // source: TableRow.jsx:135 (never editable)
    // A link cell is NOT an image cell, so it keeps the plain `td-container w-100 h-100`.
    cy.get(tableSelector.cellImageContainer(C, 0, W)).should("not.exist"); // source: TableRow.jsx:170

    // One anchor per cell, hardened with a fixed rel (LinkRenderer.jsx:56) — the second
    // row proves the renderer runs per row rather than once for the column.
    cy.get(tableSelector.cellLink(C, 0, W))
      .should("have.length", 1)
      .and("have.attr", "rel", tableText.linkRelValue); // source: LinkRenderer.jsx:56
    cy.get(tableSelector.cellLink(C, 1, W))
      .should("have.length", 1)
      .and("have.attr", "rel", tableText.linkRelValue); // source: LinkRenderer.jsx:56
  });
});
