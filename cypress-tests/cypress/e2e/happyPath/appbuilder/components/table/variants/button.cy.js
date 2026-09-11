/**
 * SPEC — Table — variants/button (action-button column type).
 *
 * FOR AI: covers the `button` COLUMN TYPE of the Table widget end to end — the four
 * defaults the type switch seeds, the THREE absences that define the type, the whole
 * button LIST lifecycle (add / open / rename / duplicate / delete), every per-button
 * property and style with its effect on the RENDERED button, and an `On click` handler
 * wired on the compound event ref and fired from the canvas.
 * Source root: frontend/src/AppBuilder/RightSideBar/Inspector/Components/Table/
 * (`columns` is declared bare as `type:'array'` at table.js:44, so NONE of these
 * controls live in the widget config — they live in the ColumnManager).
 *
 * ── WHAT MAKES `button` UNIQUE: THE TWO-LEVEL POPOVER ───────────────────────
 * Every other column type has ONE popover. `button` has two nested views inside the
 * same `#table-column-popover-basic`:
 *   LEVEL 1 (`selectedButtonId === null`, ColumnPopover.jsx:25,65-66) — the column
 *     itself: Column type / name / key (PropertiesTabElements.jsx:115-199), the
 *     column-level Visibility toggle + the ButtonListManager (:248-273) and, on the
 *     Styles tab, a single "Cell color" (StylesTabElements.jsx:264-281).
 *   LEVEL 2 (a list row was clicked) — BOTH tabs are swapped for the per-button
 *     editor: ButtonPropertiesTab (PropertiesTabElements.jsx:275-289) and
 *     ButtonStylesTab (StylesTabElements.jsx:283-292). The header title flips
 *     "Edit Column" -> "Edit Button", a back arrow appears, and the duplicate/delete
 *     icons re-target the BUTTON instead of the column (ColumnPopover.jsx:103-138).
 *
 * ── THE ABSENCE SET (asserted as first-class coverage) ──────────────────────
 *  · Transformation is EXCLUDED — gated `columnType !== 'button'`
 *    (PropertiesTabElements.jsx:200). It is the only type that loses it.
 *  · Make editable is EXCLUDED — button is in the `['image','link','button']` carve-out
 *    (:385), so ValidationProperties never mounts either: a button column has NO
 *    validations at all.
 *  · The Styles-tab alignment ToggleGroup is EXCLUDED — gated `columnType !== 'button'`
 *    (StylesTabElements.jsx:29). `horizontalAlignment` is still SEEDED as 'left'
 *    (useColumnManager.js:62) and still reaches the <td> class, it just has no control.
 *  · Neither "Text color" nor the shared "Cell color" block is offered — `button` is
 *    not in the thirteen-type list at StylesTabElements.jsx:131-145; it re-adds its
 *    OWN Cell color under the same wrapper data-cy at :264-281.
 *
 * ── WHY THIS SPEC SEEDS NO DATA ─────────────────────────────────────────────
 * F36: calling setTableData() from a beforeEach aborts the whole spec (the helper ends
 * on forceClickOnCanvas + waitForAutoSave and the autosave indicator does not settle
 * there, so the HOOK fails and every it() is skipped). A button column needs no data
 * at ALL — generateColumnsData.js:551-598 ignores the cell value and renders the
 * `buttons` array — so this spec re-types the shipped `name` column (table.js:736) and
 * asserts against shipped configuration only.
 *
 * ── HARNESS (deliberate deviation from the generic facet header contract) ────
 * `waitForDropSettle` DOES NOT EXIST in this repo (repo-wide grep: no definition), and
 * the plain `query-manager-toggle-button` beforeEach leaves the Table too short for its
 * cells to be reachable. This spec reuses the proven-green Table harness shared by
 * basics.cy.js / inspector.cy.js / variants/tagsV2.cy.js: viewport -> drag ->
 * hideTooltip -> modifyCanvasSize -> close the settings panel -> resizeTableWidget ->
 * resizeQueryPanel('1') -> openEditorSidebar. ONE cy.dragAndDropWidget per test, in
 * beforeEach (F28: cypress-real-dnd's CDP intercept is per AUT load, so a second drag
 * in the same test silently never lands).
 *
 * ── TWO-NODE WIDGET ─────────────────────────────────────────────────────────
 * The Table renders `draggable-widget-table1` on BOTH the outer RenderWidget wrapper
 * AND its inner <table>, so `openStateFromComponent` / `openNode` / `openAndVerifyNode`
 * throw here (their internal realHover is unscoped). This facet asserts only
 * rendered-canvas + popover DOM, so it needs neither.
 *
 * ── POPOVER LIFECYCLE (load-bearing) ────────────────────────────────────────
 * The column popover is an OverlayTrigger with a CONTROLLED `show` (Table.jsx:536-543)
 * whose rootClose is disabled while any CodeHinter preview popover is open
 * (usePopoverState.js:33-43). Every test closes it with `closeColumnPopover(C)`, and
 * openColumnPopover() is never called while it is already open (the same click would
 * toggle it shut). The EventManager's own Radix popovers set
 * `body { pointer-events: none }`, so they are dismissed by clicking the popover TITLE
 * before the column popover itself is closed.
 *
 * ── PRODUCT BUGS / SOURCE QUIRKS HONOURED HERE ──────────────────────────────
 *  F3 (MED)   `buttonIconColor` is mounted with `displayName: ''`
 *      (ButtonStylesTab.jsx:144), so BaseColorSwatches.jsx:139 interpolates
 *      String(undefined) and the swatch renders `data-cy="undefined-picker"`. The
 *      count is pinned FIRST so the positional index below stays meaningful — the same
 *      shape boolean.cy.js and rating.cy.js use.
 *  F19        the column-list data-cy is NOT normalised (Table.jsx:571 interpolates the
 *      raw display name), so all helpers use `columnListItem`.
 *  F21        cell COLOUR assertions never use `tableSelector.cellContent` (`<td> div`,
 *      which matches the outer `.td-container` wrapper); the button column asserts on
 *      the <td> itself (TableRow.jsx:81 writes cellBackgroundColor there) and on the
 *      rendered <button>'s own inline style.
 *  F37 (MED)  the rendered action buttons carry NO data-cy, id or class of their own
 *      (ButtonColumnAdapter.jsx:96-108 mounts the shared ui <Button> with only its cva
 *      utility classes), and the group wrapper is a bare `div.h-100.d-flex`
 *      (ButtonColumnGroupAdapter.jsx:12-17). Two buttons in one cell can therefore only
 *      be told apart POSITIONALLY or by label TEXT — which is what every multi-button
 *      assertion below does.
 *  F38 (LOW)  the button LIST rows also carry no data-cy — ButtonListManager.jsx:12-27
 *      renders a bare `.page-menu-item` with the label in a `.page-name` span — and a
 *      freshly added button is ALWAYS labelled "Button" (useButtonManager.js:5), which
 *      is why `openActionButton` takes an INDEX.
 *  F39 (LOW)  the column-level "Freeze column" card is NOT gated on `selectedButtonId`
 *      (PropertiesTabElements.jsx:467-474 sits outside the `!selectedButtonId` block at
 *      :115-199), so it leaks into the Edit Button view underneath the per-button
 *      editor. Pinned by the navigation test below.
 *  F40 (LOW)  `#table-column-popover-basic .tj-header-h8` is NOT unique: the button
 *      list's EMPTY STATE reuses the same class for its "No action button added"
 *      heading (ButtonListManager.jsx:89), so while `buttons` is empty the popover
 *      title selector matches TWO nodes and `have.text` sees them concatenated. Every
 *      title assertion made in that state below uses `.first()`.
 *  ToggleGroup — an item that is ALREADY pressed is a silent no-op (ToggleGroup.jsx:18
 *      swallows Radix's empty onValueChange), so `buttonType` can only be set back to
 *      its default `solid` by going outline -> solid.
 *  clearAndTypeOnCodeMirror SILENTLY DROPS every character outside its tokenizer
 *      (codemirrorCommands.js:29), so every literal typed here is alphanumeric,
 *      spaces, dots and braces only.
 *
 * Helpers (all resolved through cypress/support/componentAutomation/type-helper-index.md):
 *   components/table.js — resizeTableWidget, openColumnPopover, closeColumnPopover,
 *     switchColumnTab, setColumnType, addColumnOfType, deleteColumn,
 *     setColumnProperty, toggleColumnProperty, toggleColumnFx,
 *     setColumnColor, setPinPosition, verifyCellType, addActionButton,
 *     openActionButton, backFromButtonDetail, setButtonProperty, setButtonStyle
 *   appBuilder/properties.js — openEditorSidebar
 *   appBuilder/styles.js — verifyWidgetColorCss
 *   appBuilder/events.js — selectEvent, addSupportCSAData
 *   appBuilder/querymanager/queryPanel.js — resizeQueryPanel
 */
import { fake } from "Fixtures/fake";
import { commonSelectors } from "Selectors/common";
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
  setColumnProperty,
  toggleColumnProperty,
  toggleColumnFx,
  setColumnColor,
  setPinPosition,
  verifyCellType,
  addActionButton,
  openActionButton,
  backFromButtonDetail,
  setButtonProperty,
  setButtonStyle,
} from "Support/utils/appBuilder/components/table";
import { openEditorSidebar } from "Support/utils/appBuilder/properties";
import { verifyWidgetColorCss } from "Support/utils/appBuilder/styles";
import {
  selectEvent,
  addSupportCSAData,
} from "Support/utils/appBuilder/events";
import { resizeQueryPanel } from "Support/utils/appBuilder/querymanager/queryPanel";

// testIsolation:false — cypress-real-dnd caches its CDP client for the spec run;
// testIsolation's per-test AUT reset leaves that client stale, so 2nd+ test drags
// throw "No dragIntercepted". Keeping the AUT stable across tests keeps the drag
// intercept valid. Each test still re-logs-in + creates its own app in beforeEach,
// so shared browser state is not relied upon.
describe(
  "Table — variants/button column type",
  { testIsolation: false },
  () => {
    const W = tableText.defaultWidgetName; // 'table1'
    const C = tableText.variantButtonColumn; // 'name' — source: table.js:736

    // Add N action buttons to the OPEN column popover. Every one of them is labelled
    // "Button" until renamed (useButtonManager.js:5), which is why the callers below
    // address them by index (F38).
    const addActionButtons = (count) => {
      Cypress._.times(count, () => addActionButton()); // source: ButtonListManager.jsx:113-115
    };

    // Toggle the icon's eye. The IconPicker's visibility control is a bare <div> with an
    // onClick (Visibility.jsx:9-17) — not a checkbox — so there is no toggle helper for
    // it; the click writes the STRING `{{true}}`/`{{false}}` into buttonIconVisibility
    // (ButtonStylesTab.jsx:126).
    const toggleButtonIcon = () => {
      cy.get(tableSelector.buttonIconVisibilityToggle)
        .scrollIntoView()
        .click({ force: true }); // source: Visibility.jsx:10-16
      cy.waitForAutoSave();
    };

    // Wire the OPEN Edit Button view's "On click" to a Show Alert.
    // The EventManager is mounted INSIDE the column popover on the compound ref
    // `${column.key || column.name}::${button.id}` (ButtonPropertiesTab.jsx:22,107-132),
    // and the table's own Events accordion in the Inspector renders a second, identical
    // EventManager — so the add button is reached through the popover-scoped selector
    // rather than the helper's unscoped default.
    const wireButtonOnClick = (message) => {
      cy.get(tableSelector.columnPopoverNoEventHandler).should(
        "have.length",
        1,
      ); // source: EventManager.jsx:1358-1373
      selectEvent(
        tableText.variantButtonEventOnClick,
        "Show Alert",
        0,
        tableSelector.columnPopoverAddEventHandler,
        0,
        true,
      ); // source: ButtonPropertiesTab.jsx:119 (eventMetaDefinition onClick -> 'On click')
      addSupportCSAData("alert-message", message);
      cy.waitForAutoSave();
      // The handler's Radix popover sets `body { pointer-events: none }`; clicking the
      // column popover's own title dismisses it without closing the column popover.
      cy.get(tableSelector.columnPopoverTitle).click({ force: true });
      cy.get(tableSelector.columnPopoverEventHandlerCard).should(
        "have.length",
        1,
      ); // source: EventManager.jsx:1204
    };

    beforeEach(() => {
      cy.apiLogin();
      cy.apiCreateApp(`${fake.companyName}-Table-Button-Column`); // dynamic: fake
      cy.openApp();
      cy.viewport(1400, 2200);
      cy.dragAndDropWidget("Table", 250, 100);
      cy.hideTooltip();
      cy.modifyCanvasSize(900, 800);
      cy.get("[data-cy='left-sidebar-settings-button']").click();
      resizeTableWidget(W, 750, 600);
      resizeQueryPanel("1");
      openEditorSidebar(W);
      // The shipped `name` column is a plain string column (table.js:736-748). Re-typing
      // it to `button` is what mounts the ButtonListManager AND runs the seed path at
      // useColumnManager.js:58-66. setColumnType picks by INDEX (14) and opens the
      // popover itself — close it again so every it() starts from the same state.
      setColumnType(C, tableText.columnTypeValue.button); // source: PropertiesTabElements.jsx:139
      closeColumnPopover(C);
    });

    afterEach(() => {
      cy.apiDeleteApp();
    });

    // ═══════════════════════════════════════════════════════════════════════════
    // COLUMN TYPE — the seed path and the rendered contract
    // ═══════════════════════════════════════════════════════════════════════════

    it("column type — switching to `button` seeds columnVisibility / horizontalAlignment / pinPosition / buttons and renders an empty `has-actions` cell", () => {
      openColumnPopover(C);
      // CustomValueContainer (PropertiesTabElements.jsx:59-67) renders the stored value's
      // option LABEL, and "Button" is unique in the 23-option list (unlike "Tags").
      cy.get(tableSelector.columnPopover)
        .find(tableSelector.columnTypeSelect)
        .should("contain.text", tableText.columnTypeLabel.button); // source: PropertiesTabElements.jsx:139
      // `buttons: []` is the fourth seed — the list manager mounts, empty.
      cy.get(tableSelector.buttonListManager).should("have.length", 1); // source: ButtonListManager.jsx:63
      cy.get(tableSelector.buttonListItem).should(
        "have.length",
        tableText.variantButtonSeedButtonCount,
      ); // source: useColumnManager.js:64
      closeColumnPopover(C);

      cy.forceClickOnCanvas();
      cy.get(tableSelector.cell(C, 0, W)).scrollIntoView();
      // TableRow.jsx:108-111 gives a button column `has-actions` — shared with the
      // left/right action-column pseudo-columns, which this cell is not (it carries
      // neither `has-left-actions` nor `has-right-actions`).
      verifyCellType(C, 0, tableText.cellClassByType.button, W); // source: TableRow.jsx:111
      cy.get(tableSelector.cell(C, 0, W))
        .should("not.have.class", tableText.variantButtonCellClassLeftActions) // source: TableRow.jsx:112
        .and("not.have.class", tableText.variantButtonCellClassRightActions); // source: TableRow.jsx:113
      // `horizontalAlignment: 'left'` is seeded even though the type has no alignment
      // control at all (StylesTabElements.jsx:29), and it still reaches the <td>.
      cy.get(tableSelector.cell(C, 0, W)).should(
        "have.class",
        tableText.variantButtonSeedAlignmentClass,
      ); // source: useColumnManager.js:62 + TableRow.jsx:116
      // `pinPosition: 'unpinned'` — no pinned classes.
      cy.get(tableSelector.cell(C, 0, W)).should(
        "not.have.class",
        tableText.cellClassPinned,
      ); // source: useColumnManager.js:63 + TableRow.jsx:137
      // `columnVisibility: true` — the column is still rendered.
      cy.get(tableSelector.columnHeader(C)).should("have.text", C); // source: useColumnManager.js:61 + TableHeader.jsx:153
      // The renderer ran: ButtonColumnGroup always emits its flex row, and with an empty
      // `buttons` array it emits NOTHING inside it.
      cy.get(tableSelector.cellActionButtonGroup(C, 0, W)).should(
        "have.length",
        1,
      ); // source: ButtonColumnGroupAdapter.jsx:12-17
      cy.get(tableSelector.cellActionButton(C, 0, W)).should("not.exist"); // source: ButtonColumnGroupAdapter.jsx:18
    });

    it("properties (ABSENCE) — Transformation, Make editable and the whole validation block are excluded for a button column", () => {
      openColumnPopover(C);
      // The ONLY type that loses Transformation (PropertiesTabElements.jsx:200).
      cy.get(tableSelector.columnTransformationField).should("not.exist"); // source: PropertiesTabElements.jsx:200-218
      cy.get(tableSelector.columnPopover).should(
        "not.contain.text",
        tableText.labelTransformation,
      ); // source: PropertiesTabElements.jsx:202
      // `button` is in the ['image','link','button'] carve-out, which wraps BOTH the
      // toggle and the ValidationProperties block it contains — so a button column mounts
      // NO validations whatsoever.
      cy.get(tableSelector.makeEditableToggle).should("not.exist"); // source: PropertiesTabElements.jsx:385-400
      cy.get(tableSelector.columnValidationSection).should("not.exist"); // source: PropertiesTabElements.jsx:401-412
      cy.get(tableSelector.columnValidationLabels).should("not.exist"); // source: ValidationProperties.jsx:248
      // POSITIVE CONTROLS — the Properties tab really did render.
      cy.get(tableSelector.columnNameField).should("have.length", 1); // source: PropertiesTabElements.jsx:164
      cy.get(tableSelector.columnParamToggle(tableText.labelVisibility)).should(
        "have.length",
        1,
      ); // source: PropertiesTabElements.jsx:248-265
      cy.get(tableSelector.addNewActionButton).should("have.length", 1); // source: ButtonListManager.jsx:113
      cy.get(tableSelector.pinColumnControl).should("have.length", 1); // source: PropertiesTabElements.jsx:467-474
      closeColumnPopover(C);
    });

    it("styles (ABSENCE) — the alignment ToggleGroup and Text color are not offered; Cell color is the column's only style", () => {
      openColumnPopover(C);
      switchColumnTab(tableText.columnTabStyles); // source: ColumnPopover.jsx:157
      // StylesTabElements.jsx:29 gates the WHOLE alignment field on
      // `columnType !== 'button'` — neither spelling of the label survives, and the
      // ToggleGroup items go with it.
      cy.get(tableSelector.columnPopover)
        .should("not.contain.text", tableText.labelTextAlignment) // source: StylesTabElements.jsx:33
        .and("not.contain.text", tableText.labelAlignment); // source: StylesTabElements.jsx:34
      cy.get(tableSelector.columnPopover)
        .find(tableSelector.toggleGroupItem(tableText.alignCenter))
        .should("not.exist"); // source: StylesTabElements.jsx:36-43
      // `button` is absent from the thirteen-type shared colour block, so Text color is
      // gone…
      cy.get(tableSelector.columnTextColorField).should("not.exist"); // source: StylesTabElements.jsx:131-148
      // …while the button-only block re-adds Cell color under the SAME wrapper data-cy.
      cy.get(tableSelector.columnCellColorField)
        .should("have.length", 1)
        .and("contain.text", tableText.labelCellColor); // source: StylesTabElements.jsx:264-281
      cy.get(tableSelector.columnColorPicker(tableText.labelCellColor)).should(
        "have.length",
        1,
      ); // source: BaseColorSwatches.jsx:139
      closeColumnPopover(C);
    });

    it("column manager — a `button` column can be added, bound to a key and deleted", () => {
      // addColumnOfType sets the TYPE first (so the ButtonListManager mounts and the seed
      // path runs), then the name, then the key. A button column ignores its key at
      // render time (generateColumnsData.js:553 only uses it to build the event ref), but
      // the key is still what the compound event ref is derived from.
      addColumnOfType(
        tableText.variantNewButtonColumn,
        tableText.columnTypeValue.button, // source: PropertiesTabElements.jsx:139
        tableText.variantButtonColumnKey, // source: table.js:737
      );
      // A brand-new button column is seeded exactly like a re-typed one.
      cy.get(tableSelector.buttonListItem).should(
        "have.length",
        tableText.variantButtonSeedButtonCount,
      ); // source: useColumnManager.js:64
      closeColumnPopover(tableText.variantNewButtonColumn);

      cy.forceClickOnCanvas();
      cy.get(tableSelector.columnHeader(tableText.variantNewButtonColumn))
        .scrollIntoView()
        .should("have.text", tableText.variantNewButtonColumn); // source: TableHeader.jsx:153
      verifyCellType(
        tableText.variantNewButtonColumn,
        0,
        tableText.cellClassByType.button,
        W,
      ); // source: TableRow.jsx:111

      // deleteColumn drives the popover header's [title="Delete column"] — which is the
      // COLUMN delete only because `selectedButtonId` is null (ColumnPopover.jsx:71-78).
      deleteColumn(tableText.variantNewButtonColumn); // source: ColumnPopover.jsx:130-138
    });

    // ═══════════════════════════════════════════════════════════════════════════
    // LEVEL 1 — column-level controls + the button list
    // ═══════════════════════════════════════════════════════════════════════════

    it("buttons — the empty state renders until `Add new action button` appends the first button", () => {
      openColumnPopover(C);
      // ButtonListManager.jsx:64-71 always draws the "Buttons" divider; :72-96 adds the
      // empty state only while `items.length === 0`.
      cy.get(tableSelector.buttonListManager)
        .should("contain.text", tableText.variantButtonListSectionHeader) // source: ButtonListManager.jsx:69
        .and("contain.text", tableText.labelNoActionButton) // source: ButtonListManager.jsx:90
        .and("contain.text", tableText.variantButtonEmptyStateBody); // source: ButtonListManager.jsx:93

      addActionButton(); // source: ButtonListManager.jsx:113-115 + useButtonManager.js:23-28
      // The empty state is replaced by the sortable tree, and the fresh button carries
      // DEFAULT_BUTTON's label.
      cy.get(tableSelector.buttonListManager).should(
        "not.contain.text",
        tableText.labelNoActionButton,
      ); // source: ButtonListManager.jsx:72
      cy.get(tableSelector.buttonListItem).should("have.length", 1); // source: ButtonListManager.jsx:98-111
      cy.get(tableSelector.buttonListItem)
        .find(tableSelector.buttonListItemName)
        .should("have.text", tableText.defaultActionButtonLabel); // source: ButtonListManager.jsx:24
      closeColumnPopover(C);

      cy.forceClickOnCanvas();
      cy.get(tableSelector.cell(C, 0, W)).scrollIntoView();
      cy.get(tableSelector.cellActionButton(C, 0, W)).should("have.length", 1); // source: ButtonColumnGroupAdapter.jsx:18-60
      cy.get(tableSelector.cellActionButton(C, 0, W)).should(
        "have.text",
        tableText.defaultActionButtonLabel,
      ); // source: ButtonColumnAdapter.jsx:106
      // Every row of the table gets the same button set — the renderer is per-cell.
      cy.get(tableSelector.cellActionButton(C, 1, W)).should("have.length", 1); // source: generateColumnsData.js:551-598
    });

    it("properties — the column-level Visibility (fx) removes the whole button column from the table", () => {
      openColumnPopover(C);
      addActionButton();
      // `columnVisibility` is rendered by ProgramaticallyHandleProperties, so it is
      // fx-capable: the fx button exists and turning it ON is what mounts the code field
      // (SingleLineCodeEditor.jsx:794-802). NOTE the seeded value is a real BOOLEAN true
      // (useColumnManager.js:61), not the '{{true}}' STRING every other type falls back
      // to (ProgramaticallyHandleProperties.jsx:22) — so this test proves the property
      // through its rendered effect rather than through the fx editor's default text.
      cy.get(
        tableSelector.columnParamFxButton(tableText.labelVisibility),
      ).should("have.length", 1); // source: FxButton.jsx:10
      toggleColumnFx(tableText.labelVisibility); // source: PropertiesTabElements.jsx:252-263
      setColumnProperty(
        tableText.labelVisibility,
        tableText.variantButtonHiddenColumnVisibility,
      ); // source: PropertiesTabElements.jsx:258
      closeColumnPopover(C);

      // generateColumnsData.js:160 returns null for an invisible column, so header AND
      // cells disappear together.
      cy.forceClickOnCanvas();
      cy.get(tableSelector.columnHeader(C)).should("not.exist"); // source: generateColumnsData.js:160
      cy.get(tableSelector.cell(C, 0, W)).should("not.exist"); // source: generateColumnsData.js:160
    });

    it("properties — Freeze column pins the rendered button cell to the left", () => {
      openColumnPopover(C);
      addActionButton();
      setPinPosition(tableText.pinLeft); // source: PropertiesTabElements.jsx:76
      closeColumnPopover(C);

      cy.forceClickOnCanvas();
      cy.get(tableSelector.cell(C, 0, W))
        .scrollIntoView()
        .should("have.class", tableText.cellClassPinned) // source: TableRow.jsx:137
        .and("have.class", tableText.cellClassPinnedLeft); // source: TableRow.jsx:138
      // Pinning does not disturb the buttons themselves.
      cy.get(tableSelector.cellActionButton(C, 0, W)).should("have.length", 1); // source: ButtonColumnGroupAdapter.jsx:18
    });

    it("styles — the column-level Cell color paints the rendered <td> (F21)", () => {
      openColumnPopover(C);
      addActionButton();
      switchColumnTab(tableText.columnTabStyles); // source: ColumnPopover.jsx:157
      setColumnColor(
        tableText.labelCellColor,
        tableText.variantButtonCellColorRgba,
      ); // source: StylesTabElements.jsx:266-279
      closeColumnPopover(C);

      // TableRow.jsx:72-81 resolves cellBackgroundColor and writes it as the <td>'s inline
      // backgroundColor. F21: never assert this through `cellContent`, which resolves to
      // the `.td-container` wrapper.
      cy.forceClickOnCanvas();
      cy.get(tableSelector.cell(C, 0, W)).scrollIntoView();
      verifyWidgetColorCss(
        tableSelector.cell(C, 0, W),
        "background-color",
        tableText.variantButtonCellColorRgba,
        true,
      ); // source: TableRow.jsx:81
    });

    // ═══════════════════════════════════════════════════════════════════════════
    // THE TWO-LEVEL POPOVER
    // ═══════════════════════════════════════════════════════════════════════════

    it("buttons — selecting a list row swaps BOTH tabs for the per-button editor, and the back arrow restores the column view (F39)", () => {
      openColumnPopover(C);
      addActionButton();
      cy.get(tableSelector.columnPopoverTitle).should(
        "have.text",
        tableText.columnPopoverTitle,
      ); // source: ColumnPopover.jsx:116
      cy.get(tableSelector.columnPopoverBackButton).should("not.exist"); // source: ColumnPopover.jsx:103-115

      // LEVEL 2. openActionButton asserts the title flip to "Edit Button" itself.
      openActionButton(); // source: ButtonListManager.jsx:12-27 + ColumnPopover.jsx:117
      cy.get(tableSelector.columnPopoverBackButton).should("have.length", 1); // source: ColumnPopover.jsx:104-114
      // The whole `!selectedButtonId` block is gone: type / name / key and the list.
      cy.get(tableSelector.columnNameField).should("not.exist"); // source: PropertiesTabElements.jsx:115-199
      cy.get(tableSelector.columnKeyField).should("not.exist"); // source: PropertiesTabElements.jsx:182-197
      cy.get(tableSelector.buttonListManager).should("not.exist"); // source: PropertiesTabElements.jsx:248-273
      cy.get(tableSelector.addNewActionButton).should("not.exist"); // source: ButtonListManager.jsx:113
      // …and the per-button editor is mounted in its place.
      cy.get(tableSelector.columnPopover).should(
        "contain.text",
        tableText.labelButtonLabel,
      ); // source: ButtonPropertiesTab.jsx:27
      cy.get(
        tableSelector.columnParamToggle(tableText.labelDisableActionButton),
      ).should("have.length", 1); // source: ButtonPropertiesTab.jsx:92-103
      // F39 (LOW): the column-level Freeze card is NOT gated on selectedButtonId
      // (PropertiesTabElements.jsx:467-474 sits outside the :115-199 block), so it leaks
      // into the Edit Button view.
      cy.get(tableSelector.pinColumnControl).should("have.length", 1); // source: PropertiesTabElements.jsx:467-474

      // The Styles tab is swapped too: the column's Cell color is gone and the eleven
      // per-button style controls are mounted.
      switchColumnTab(tableText.columnTabStyles); // source: ColumnPopover.jsx:157
      cy.get(tableSelector.columnCellColorField).should("not.exist"); // source: StylesTabElements.jsx:264
      cy.get(tableSelector.columnPopover).should(
        "contain.text",
        tableText.labelButtonType,
      ); // source: ButtonStylesTab.jsx:47
      cy.get(tableSelector.columnPopover)
        .find(tableSelector.toggleGroupItem(tableText.variantButtonTypeOutline))
        .should("have.length", 1); // source: ButtonStylesTab.jsx:50
      cy.get(
        tableSelector.columnParamNumberInput(tableText.labelBorderRadius),
      ).should("have.length", 1); // source: ButtonStylesTab.jsx:166-179

      // The back arrow clears selectedButtonId AND forces the Properties tab
      // (ColumnPopover.jsx:110-113), so one click restores the whole level-1 view.
      backFromButtonDetail(); // source: ColumnPopover.jsx:103-116
      cy.get(tableSelector.activeColumnTab).should(
        "have.text",
        tableText.columnTabProperties,
      ); // source: ColumnPopover.jsx:112,149
      cy.get(tableSelector.columnNameField).should("have.length", 1); // source: PropertiesTabElements.jsx:164
      cy.get(tableSelector.addNewActionButton).should("have.length", 1); // source: ButtonListManager.jsx:113
      closeColumnPopover(C);
    });

    // ═══════════════════════════════════════════════════════════════════════════
    // LEVEL 2 — per-button properties (ButtonPropertiesTab.jsx)
    // ═══════════════════════════════════════════════════════════════════════════

    it("buttons — Button label (positional index 0) renames both the list row and the rendered button", () => {
      openColumnPopover(C);
      addActionButton();
      openActionButton();
      // Both "Button label" and "Tooltip" are plain CodeHinters in undecorated
      // `div.field.mb-2.px-3` wrappers with no paramLabel (ButtonPropertiesTab.jsx:26-54),
      // so both collapse to the non-unique `-input-field` and are POSITIONAL:
      // 0 = label, 1 = tooltip. Valid only while no toggle below them has fx ON.
      setButtonProperty(
        tableText.labelButtonLabel,
        tableText.variantButtonRenamedLabel,
        0,
      ); // source: ButtonPropertiesTab.jsx:26-39
      backFromButtonDetail();
      // ButtonListManager.jsx:24 renders `item.buttonLabel || 'Button'`.
      cy.get(tableSelector.buttonListItem)
        .find(tableSelector.buttonListItemName)
        .should("have.text", tableText.variantButtonRenamedLabel); // source: ButtonListManager.jsx:24
      closeColumnPopover(C);

      cy.forceClickOnCanvas();
      cy.get(tableSelector.cellActionButton(C, 0, W))
        .scrollIntoView()
        .should("have.text", tableText.variantButtonRenamedLabel); // source: ButtonColumnAdapter.jsx:106
    });

    it("buttons — Tooltip (positional index 1) wraps the rendered button in the OverlayTrigger div", () => {
      openColumnPopover(C);
      addActionButton();
      closeColumnPopover(C);

      // `hasTooltip` is false for the seeded empty string (useButtonManager.js:6), so the
      // <button> is a DIRECT child of the group — no wrapper div at all.
      cy.forceClickOnCanvas();
      cy.get(tableSelector.cell(C, 0, W)).scrollIntoView();
      cy.get(tableSelector.cellActionButtonTooltipWrapper(C, 0, W)).should(
        "not.exist",
      ); // source: ButtonColumnAdapter.jsx:111,121

      openColumnPopover(C);
      openActionButton();
      setButtonProperty(
        tableText.labelButtonTooltip,
        tableText.variantButtonTooltipText,
        1,
      ); // source: ButtonPropertiesTab.jsx:41-54
      closeColumnPopover(C);

      // A non-empty tooltip switches the return branch: the button is now nested in an
      // extra `<div style="display:flex">` inside an OverlayTrigger.
      cy.forceClickOnCanvas();
      cy.get(tableSelector.cellActionButtonTooltipWrapper(C, 0, W))
        .scrollIntoView()
        .should("have.length", 1)
        .and("have.css", "display", "flex"); // source: ButtonColumnAdapter.jsx:116
      cy.get(tableSelector.cellActionButtonTooltipWrapper(C, 0, W))
        .find("button")
        .should("have.length", 1); // source: ButtonColumnAdapter.jsx:116
    });

    it("buttons — Loading state swaps the label for the spinner, and its fx expression can put it back", () => {
      openColumnPopover(C);
      addActionButton();
      openActionButton();
      // DEFAULT_BUTTON.loadingState is a real boolean false (useButtonManager.js:8) and
      // Toggle.jsx:24 binds `checked` straight to it.
      cy.get(
        tableSelector.columnParamToggle(tableText.labelLoadingState),
      ).should("not.be.checked"); // source: ButtonPropertiesTab.jsx:56-71
      // fx-capable: ProgramaticallyHandleProperties always mounts an FxButton for it.
      cy.get(
        tableSelector.columnParamFxButton(tableText.labelLoadingState),
      ).should("have.length", 1); // source: FxButton.jsx:10
      toggleColumnProperty(tableText.labelLoadingState); // source: ButtonPropertiesTab.jsx:56-71
      closeColumnPopover(C);

      // Button.jsx:168-183 replaces the children with the loader and keeps the label as an
      // invisible span, so the spinner is the discriminator, not the text.
      cy.forceClickOnCanvas();
      cy.get(tableSelector.cell(C, 0, W)).scrollIntoView();
      cy.get(tableSelector.cellActionButtonSpinner(C, 0, W)).should(
        "have.length",
        1,
      ); // source: utilComponents/loader.jsx:17
      cy.get(tableSelector.cellActionButton(C, 0, W))
        .find("span")
        .should("have.css", "visibility", "hidden"); // source: Button.jsx:181

      // Turning the property into an fx EXPRESSION that resolves false takes the spinner
      // away again — the same code path generateColumnsData uses for every button prop
      // (ButtonColumnGroupAdapter.jsx:26 getResolvedValue).
      openColumnPopover(C);
      openActionButton();
      toggleColumnFx(tableText.labelLoadingState); // source: FxButton.jsx:10
      setColumnProperty(
        tableText.labelLoadingState,
        tableText.variantButtonHiddenButtonVisibility,
      ); // source: SingleLineCodeEditor.jsx:794-802
      closeColumnPopover(C);

      cy.forceClickOnCanvas();
      cy.get(tableSelector.cellActionButtonSpinner(C, 0, W)).should(
        "not.exist",
      ); // source: ButtonColumnGroupAdapter.jsx:26
      cy.get(tableSelector.cellActionButton(C, 0, W)).should(
        "have.text",
        tableText.defaultActionButtonLabel,
      ); // source: ButtonColumnAdapter.jsx:106
    });

    it("buttons — Disable action button disables the rendered button and drops it to 50% opacity", () => {
      openColumnPopover(C);
      addActionButton();
      openActionButton();
      cy.get(
        tableSelector.columnParamToggle(tableText.labelDisableActionButton),
      ).should("not.be.checked"); // source: useButtonManager.js:7 + Toggle.jsx:24
      toggleColumnProperty(tableText.labelDisableActionButton); // source: ButtonPropertiesTab.jsx:90-105
      closeColumnPopover(C);

      cy.forceClickOnCanvas();
      cy.get(tableSelector.cellActionButton(C, 0, W))
        .scrollIntoView()
        .should("be.disabled") // source: ButtonColumnAdapter.jsx:100
        .and("have.css", "opacity", tableText.variantButtonDisabledOpacity); // source: ButtonColumnAdapter.jsx:91-93
    });

    it("buttons — per-button Visibility removes ONLY that button from the cell (F37: the survivors are identified by label)", () => {
      openColumnPopover(C);
      addActionButtons(2);
      cy.get(tableSelector.buttonListItem).should("have.length", 2); // source: useButtonManager.js:23-28

      // F38: both rows read "Button", so they are opened by INDEX and renamed one at a
      // time — after the first rename only ONE row still matches "Button".
      openActionButton(tableText.defaultActionButtonLabel, 0);
      setButtonProperty(
        tableText.labelButtonLabel,
        tableText.variantButtonRenamedLabel,
        0,
      ); // source: ButtonPropertiesTab.jsx:26-39
      backFromButtonDetail();
      openActionButton(tableText.defaultActionButtonLabel, 0);
      setButtonProperty(
        tableText.labelButtonLabel,
        tableText.variantButtonSecondLabel,
        0,
      ); // source: ButtonPropertiesTab.jsx:26-39
      backFromButtonDetail();
      closeColumnPopover(C);

      // The list order IS the render order — ButtonColumnGroupAdapter.jsx:18 maps the
      // array as stored.
      cy.forceClickOnCanvas();
      cy.get(tableSelector.cell(C, 0, W)).scrollIntoView();
      cy.get(tableSelector.cellActionButton(C, 0, W)).should("have.length", 2); // source: ButtonColumnGroupAdapter.jsx:18
      cy.get(tableSelector.cellActionButton(C, 0, W))
        .eq(0)
        .should("have.text", tableText.variantButtonRenamedLabel); // source: ButtonColumnAdapter.jsx:106
      cy.get(tableSelector.cellActionButton(C, 0, W))
        .eq(1)
        .should("have.text", tableText.variantButtonSecondLabel); // source: ButtonColumnAdapter.jsx:106

      // ButtonColumnGroupAdapter.jsx:20-21 drops a button whose resolved visibility is
      // EXACTLY false — the per-button toggle, not the column-level one.
      openColumnPopover(C);
      openActionButton(tableText.variantButtonSecondLabel);
      cy.get(tableSelector.columnParamToggle(tableText.labelVisibility)).should(
        "be.checked",
      ); // source: useButtonManager.js:9 + Toggle.jsx:24
      toggleColumnProperty(tableText.labelVisibility); // source: ButtonPropertiesTab.jsx:73-88
      closeColumnPopover(C);

      cy.forceClickOnCanvas();
      cy.get(tableSelector.cellActionButton(C, 0, W))
        .scrollIntoView()
        .should("have.length", 1); // source: ButtonColumnGroupAdapter.jsx:21
      cy.get(tableSelector.cellActionButton(C, 0, W)).should(
        "have.text",
        tableText.variantButtonRenamedLabel,
      ); // source: ButtonColumnAdapter.jsx:106
      // The column itself is untouched — this is a per-BUTTON gate, not the column one.
      cy.get(tableSelector.columnHeader(C)).should("have.text", C); // source: generateColumnsData.js:160
    });

    // ═══════════════════════════════════════════════════════════════════════════
    // LEVEL 2 — per-button styles (ButtonStylesTab.jsx)
    // ═══════════════════════════════════════════════════════════════════════════

    it("styles — Button type solid -> outline hides Background AND rewrites the default label colour (the :30-39 side effect)", () => {
      openColumnPopover(C);
      addActionButton();
      openActionButton();
      switchColumnTab(tableText.columnTabStyles); // source: ColumnPopover.jsx:157
      // Solid is the seeded default (useButtonManager.js:10), so Background is mounted.
      cy.get(tableSelector.columnColorPicker(tableText.labelBackground)).should(
        "have.length",
        1,
      ); // source: ButtonStylesTab.jsx:55-70
      closeColumnPopover(C);

      // Both seeded colours are in the adapter's DEFAULT lists, so they are re-derived
      // per mode and land as RAW design tokens in the inline style attribute (React never
      // resolves custom properties).
      cy.forceClickOnCanvas();
      cy.get(tableSelector.cellActionButton(C, 0, W))
        .scrollIntoView()
        .should("have.attr", "style")
        .and("include", tableText.variantButtonSolidBackground); // source: ButtonColumnAdapter.jsx:52-58
      cy.get(tableSelector.cellActionButton(C, 0, W))
        .should("have.attr", "style")
        .and("include", tableText.variantButtonSolidLabelColor); // source: ButtonColumnAdapter.jsx:60-64

      openColumnPopover(C);
      openActionButton();
      switchColumnTab(tableText.columnTabStyles);
      setButtonStyle(
        tableText.labelButtonType,
        tableText.variantButtonTypeOutline,
        "toggleGroup",
      ); // source: ButtonStylesTab.jsx:46-52
      // `isSolid` false unmounts the Background swatch entirely.
      cy.get(tableSelector.columnColorPicker(tableText.labelBackground)).should(
        "not.exist",
      ); // source: ButtonStylesTab.jsx:55
      closeColumnPopover(C);

      cy.forceClickOnCanvas();
      cy.get(tableSelector.cellActionButton(C, 0, W))
        .scrollIntoView()
        .should("have.attr", "style")
        .and("include", tableText.variantButtonOutlineBackground); // source: ButtonColumnAdapter.jsx:54,57
      // THE SIDE EFFECT: handleTypeChange rewrote buttonLabelColor because the stored
      // '#FFFFFF' was still one of the five DEFAULT_LABEL values (ButtonStylesTab.jsx:22-37).
      cy.get(tableSelector.cellActionButton(C, 0, W))
        .should("have.attr", "style")
        .and("include", tableText.variantButtonOutlineLabelColor); // source: ButtonStylesTab.jsx:36

      // Back to solid — an ALREADY-pressed ToggleGroupItem is a silent no-op
      // (ToggleGroup.jsx:18), which is why `solid` is only reachable via outline.
      openColumnPopover(C);
      openActionButton();
      switchColumnTab(tableText.columnTabStyles);
      setButtonStyle(
        tableText.labelButtonType,
        tableText.variantButtonTypeSolid,
        "toggleGroup",
      ); // source: ButtonStylesTab.jsx:49
      closeColumnPopover(C);

      cy.forceClickOnCanvas();
      cy.get(tableSelector.cellActionButton(C, 0, W))
        .scrollIntoView()
        .should("have.attr", "style")
        .and("include", tableText.variantButtonSolidBackground); // source: ButtonColumnAdapter.jsx:55
      cy.get(tableSelector.cellActionButton(C, 0, W))
        .should("have.attr", "style")
        .and("include", tableText.variantButtonSolidLabelColor); // source: ButtonColumnAdapter.jsx:63
    });

    it("styles — Background, Label color and Border color all reach the rendered button", () => {
      openColumnPopover(C);
      addActionButton();
      openActionButton();
      switchColumnTab(tableText.columnTabStyles); // source: ColumnPopover.jsx:157
      // A picked colour is stored as the 8-digit hex BaseColorSwatches.jsx:67-72 builds,
      // which is NOT in any of the adapter's DEFAULT_* lists — so each one is used
      // verbatim instead of being re-derived from the button type.
      setButtonStyle(
        tableText.labelBackground,
        tableText.variantButtonBackgroundRgba,
        "color",
      ); // source: ButtonStylesTab.jsx:55-70
      setButtonStyle(
        tableText.labelLabelColorButton,
        tableText.variantButtonLabelColorRgba,
        "color",
      ); // source: ButtonStylesTab.jsx:73-86
      setButtonStyle(
        tableText.labelBorderColor,
        tableText.variantButtonBorderColorRgba,
        "color",
      ); // source: ButtonStylesTab.jsx:89-102
      closeColumnPopover(C);

      cy.forceClickOnCanvas();
      cy.get(tableSelector.cell(C, 0, W)).scrollIntoView();
      verifyWidgetColorCss(
        tableSelector.cellActionButton(C, 0, W),
        "background-color",
        tableText.variantButtonBackgroundRgba,
        true,
      ); // source: ButtonColumnAdapter.jsx:58,83
      verifyWidgetColorCss(
        tableSelector.cellActionButton(C, 0, W),
        "color",
        tableText.variantButtonLabelColorRgba,
        true,
      ); // source: ButtonColumnAdapter.jsx:64,84
      // A truthy borderColor also switches the border ON (:86-90), so the 1px solid
      // border is part of the same proof.
      verifyWidgetColorCss(
        tableSelector.cellActionButton(C, 0, W),
        "border-color",
        tableText.variantButtonBorderColorRgba,
        true,
      ); // source: ButtonColumnAdapter.jsx:87
      cy.get(tableSelector.cellActionButton(C, 0, W)).should(
        "have.css",
        "border-style",
        "solid",
      ); // source: ButtonColumnAdapter.jsx:88
    });

    it("styles — Loader color paints the spinner that Loading state mounts", () => {
      openColumnPopover(C);
      addActionButton();
      openActionButton();
      toggleColumnProperty(tableText.labelLoadingState); // source: ButtonPropertiesTab.jsx:56-71
      closeColumnPopover(C);

      // DEFAULT: 'var(--cc-surface1-surface)' is in DEFAULT_LOADER_COLORS, so the adapter
      // hands the ui Button '#FFFFFF' — which is itself in defaultButtonFillColour, so
      // Button.jsx:143-144 falls back to the variant's token. The token survives as raw
      // text inside the loader's gradient (utilComponents/loader.jsx:9-11).
      cy.forceClickOnCanvas();
      cy.get(tableSelector.cellActionButtonSpinner(C, 0, W))
        .scrollIntoView()
        .should("have.attr", "style")
        .and("include", tableText.variantButtonDefaultLoaderFill); // source: ButtonUtils.jsx:5

      openColumnPopover(C);
      openActionButton();
      switchColumnTab(tableText.columnTabStyles); // source: ColumnPopover.jsx:157
      setButtonStyle(
        tableText.labelLoaderColor,
        tableText.variantButtonLoaderColorRgba,
        "color",
      ); // source: ButtonStylesTab.jsx:105-118
      closeColumnPopover(C);

      // A custom colour is not in defaultButtonFillColour, so it reaches the gradient
      // verbatim; the browser normalises the 8-digit hex to rgb() inside the parsed
      // shorthand.
      cy.forceClickOnCanvas();
      cy.get(tableSelector.cellActionButtonSpinner(C, 0, W))
        .scrollIntoView()
        .should("have.attr", "style")
        .and("include", tableText.variantButtonLoaderColorCss); // source: loader.jsx:9-11 + ButtonColumnAdapter.jsx:101
    });

    it("styles — the Icon picker mounts an icon only once its eye is on, and Icon color is the ONLY unnamed picker (F3)", () => {
      openColumnPopover(C);
      addActionButton();
      openActionButton();
      switchColumnTab(tableText.columnTabStyles); // source: ColumnPopover.jsx:157
      // Icon.jsx:89,121 renders the stored icon NAME beside the preview svg.
      cy.get(tableSelector.buttonIconPickerBox).should(
        "contain.text",
        tableText.variantButtonDefaultIconName,
      ); // source: useButtonManager.js:16 + Icon.jsx:121
      cy.get(tableSelector.buttonIconPickerIcon).should("have.length", 1); // source: Icon.jsx:107
      // F3: ButtonStylesTab.jsx:144 mounts Icon color with `displayName: ''`, so its
      // swatch is the literal `undefined-picker`. Pin the COUNT first — a second unnamed
      // picker would silently steal index 0.
      cy.get(
        tableSelector.columnColorPicker(tableText.labelIconColorUnnamed),
      ).should("have.length", tableText.variantButtonUndefinedPickerCount); // source: ButtonStylesTab.jsx:134-147 + BaseColorSwatches.jsx:139
      closeColumnPopover(C);

      // `buttonIconVisibility` is seeded false (useButtonManager.js:17), and
      // ButtonColumnAdapter.jsx:71 needs BOTH a name and visibility before it mounts the
      // TablerIcon at all.
      cy.forceClickOnCanvas();
      cy.get(tableSelector.cell(C, 0, W)).scrollIntoView();
      cy.get(tableSelector.cellActionButtonIcon(C, 0, W)).should("not.exist"); // source: ButtonColumnAdapter.jsx:70-73

      openColumnPopover(C);
      openActionButton();
      switchColumnTab(tableText.columnTabStyles);
      toggleButtonIcon(); // source: Visibility.jsx:9-17
      setButtonStyle(
        tableText.labelIconColorUnnamed,
        tableText.variantButtonIconColorRgba,
        "color",
        0,
      ); // source: ButtonStylesTab.jsx:134-147 (F3)
      closeColumnPopover(C);

      cy.forceClickOnCanvas();
      cy.get(tableSelector.cellActionButtonIcon(C, 0, W))
        .scrollIntoView()
        .should("have.length", 1); // source: ButtonColumnAdapter.jsx:72
      // A custom colour is outside DEFAULT_ICON_COLORS, so it is used verbatim as the
      // svg's inline `color` instead of the mode-derived token.
      verifyWidgetColorCss(
        tableSelector.cellActionButtonIcon(C, 0, W),
        "color",
        tableText.variantButtonIconColorRgba,
        true,
      ); // source: ButtonColumnAdapter.jsx:66,72
    });

    it("styles — Icon alignment moves the icon from before the label to after it", () => {
      openColumnPopover(C);
      addActionButton();
      openActionButton();
      setButtonProperty(
        tableText.labelButtonLabel,
        tableText.variantButtonRenamedLabel,
        0,
      ); // source: ButtonPropertiesTab.jsx:26-39
      switchColumnTab(tableText.columnTabStyles); // source: ColumnPopover.jsx:157
      toggleButtonIcon(); // source: Visibility.jsx:9-17
      closeColumnPopover(C);

      // ButtonColumnAdapter.jsx:105-107 places the SAME icon element either before or
      // after the label, and neither node carries a class of its own (F37) — the order
      // inside the button's markup is the only observable.
      cy.forceClickOnCanvas();
      // TablerIcon renders a bare <span> placeholder until its dynamic import resolves
      // (TablerIcon.jsx:90-99), so the svg has to be asserted PRESENT before its position
      // is read — otherwise `indexOf('<svg') === -1` would satisfy the "before" check.
      cy.get(tableSelector.cellActionButtonIcon(C, 0, W))
        .scrollIntoView()
        .should("have.length", 1); // source: ButtonColumnAdapter.jsx:72
      cy.get(tableSelector.cellActionButton(C, 0, W)).should(($btn) => {
        const html = $btn[0].innerHTML;
        expect(html.indexOf("<svg")).to.be.lessThan(
          html.indexOf(tableText.variantButtonRenamedLabel),
        );
      }); // source: ButtonColumnAdapter.jsx:105 (iconAlignment 'left', useButtonManager.js:19)

      openColumnPopover(C);
      openActionButton(tableText.variantButtonRenamedLabel);
      switchColumnTab(tableText.columnTabStyles);
      setButtonStyle(
        tableText.labelIcon,
        tableText.buttonIconAlignRight,
        "toggleGroup",
      ); // source: ButtonStylesTab.jsx:150-163
      closeColumnPopover(C);

      cy.forceClickOnCanvas();
      cy.get(tableSelector.cellActionButtonIcon(C, 0, W))
        .scrollIntoView()
        .should("have.length", 1); // source: ButtonColumnAdapter.jsx:72
      cy.get(tableSelector.cellActionButton(C, 0, W)).should(($btn) => {
        const html = $btn[0].innerHTML;
        expect(html.indexOf("<svg")).to.be.greaterThan(
          html.indexOf(tableText.variantButtonRenamedLabel),
        );
      }); // source: ButtonColumnAdapter.jsx:107
    });

    it("styles — Border radius defaults to 6 and reaches the rendered button as real CSS", () => {
      openColumnPopover(C);
      addActionButton();
      openActionButton();
      switchColumnTab(tableText.columnTabStyles); // source: ColumnPopover.jsx:157
      // The only numberInput in the whole ColumnManager (NumberInput.jsx:13 gives it
      // `<cyLabel>-input`), seeded with the string '6'.
      cy.get(tableSelector.columnParamNumberInput(tableText.labelBorderRadius))
        .should("have.length", 1)
        .and("have.value", tableText.variantButtonDefaultBorderRadius); // source: useButtonManager.js:14
      closeColumnPopover(C);

      // ButtonColumnAdapter.jsx:77 appends 'px' to the raw string.
      cy.forceClickOnCanvas();
      cy.get(tableSelector.cellActionButton(C, 0, W))
        .scrollIntoView()
        .should(
          "have.css",
          "border-radius",
          tableText.variantButtonDefaultBorderRadiusCss,
        ); // source: ButtonColumnAdapter.jsx:77

      openColumnPopover(C);
      openActionButton();
      switchColumnTab(tableText.columnTabStyles);
      setButtonStyle(
        tableText.labelBorderRadius,
        tableText.variantButtonBorderRadius,
        "number",
      ); // source: ButtonStylesTab.jsx:166-179
      closeColumnPopover(C);

      cy.forceClickOnCanvas();
      cy.get(tableSelector.cellActionButton(C, 0, W))
        .scrollIntoView()
        .should(
          "have.css",
          "border-radius",
          tableText.variantButtonBorderRadiusCss,
        ); // source: ButtonColumnAdapter.jsx:77
    });

    // ═══════════════════════════════════════════════════════════════════════════
    // EVENTS + BUTTON LIFECYCLE
    // ═══════════════════════════════════════════════════════════════════════════

    it("events — an On click handler wired on the compound ref fires Show Alert from the rendered cell", () => {
      openColumnPopover(C);
      addActionButton();
      openActionButton();
      setButtonProperty(
        tableText.labelButtonLabel,
        tableText.variantButtonRenamedLabel,
        0,
      ); // source: ButtonPropertiesTab.jsx:26-39
      // The Events accordion is mounted open (isOpen:true) with a single trigger.
      cy.get(tableSelector.columnPopover).should(
        "contain.text",
        tableText.variantButtonEventsAccordion,
      ); // source: ButtonPropertiesTab.jsx:110-112
      wireButtonOnClick(tableText.variantButtonToastOnClick); // source: ButtonPropertiesTab.jsx:107-132
      closeColumnPopover(C);

      // generateColumnsData.js:564-595 filters the table's `table_column` events down to
      // the ones whose ref is `${columnKey}::${buttonId}` before firing
      // OnTableButtonColumnClicked, which eventsSlice.js:339-351 then executes.
      cy.forceClickOnCanvas();
      cy.get(tableSelector.cellActionButton(C, 0, W))
        .scrollIntoView()
        .should("have.text", tableText.variantButtonRenamedLabel)
        .click({ force: true }); // source: ButtonColumnAdapter.jsx:24-26,103
      cy.verifyToastMessage(
        commonSelectors.toastMessage,
        tableText.variantButtonToastOnClick,
      ); // source: eventsSlice.js:339-351
    });

    it("buttons — duplicating a button clones its configuration but NOT its events (useButtonManager.js:58-65)", () => {
      openColumnPopover(C);
      addActionButton();
      openActionButton();
      setButtonProperty(
        tableText.labelButtonLabel,
        tableText.variantButtonRenamedLabel,
        0,
      ); // source: ButtonPropertiesTab.jsx:26-39
      wireButtonOnClick(tableText.variantButtonToastOnClick);

      // In the detail view the header's copy icon re-targets the BUTTON
      // (ColumnPopover.jsx:80-86,121-129) — hence the "Duplicate button" title.
      cy.get(tableSelector.buttonDetailDuplicate).click({ force: true }); // source: ColumnPopover.jsx:128
      cy.waitForAutoSave();
      backFromButtonDetail();
      // duplicateWithNewId keeps every property including the label, so BOTH rows read
      // "Approve" and can only be told apart by position.
      cy.get(tableSelector.buttonListItem).should("have.length", 2); // source: useButtonManager.js:58-65
      cy.get(tableSelector.buttonListItem)
        .find(tableSelector.buttonListItemName)
        .last()
        .should("have.text", tableText.variantButtonRenamedLabel); // source: ButtonListManager.jsx:24
      closeColumnPopover(C);

      cy.forceClickOnCanvas();
      cy.get(tableSelector.cell(C, 0, W)).scrollIntoView();
      cy.get(tableSelector.cellActionButton(C, 0, W)).should("have.length", 2); // source: ButtonColumnGroupAdapter.jsx:18

      // The CLONE is appended last and carries a FRESH uuid (:61), so no event has its
      // compound ref — clicking it must fire nothing at all.
      cy.get(tableSelector.cellActionButton(C, 0, W))
        .eq(1)
        .click({ force: true }); // source: ButtonColumnGroupAdapter.jsx:55-57
      cy.get(commonSelectors.toastMessage).should("not.exist"); // source: useButtonManager.js:58-65 (events are NOT cloned)

      // …while the ORIGINAL still owns the handler.
      cy.get(tableSelector.cellActionButton(C, 0, W))
        .eq(0)
        .click({ force: true });
      cy.verifyToastMessage(
        commonSelectors.toastMessage,
        tableText.variantButtonToastOnClick,
      ); // source: eventsSlice.js:339-351
    });

    it("buttons — deleting a button removes it from the list and the cell, and leaves no handler behind for the next one", () => {
      openColumnPopover(C);
      addActionButton();
      openActionButton();
      setButtonProperty(
        tableText.labelButtonLabel,
        tableText.variantButtonRenamedLabel,
        0,
      ); // source: ButtonPropertiesTab.jsx:26-39
      wireButtonOnClick(tableText.variantButtonToastOnClick);

      // In the detail view the header's trash icon calls removeButton, which also deletes
      // every `table_column` event keyed `${columnKey}::${buttonId}` and clears the
      // selection — so the popover falls back to the column view by itself.
      cy.get(tableSelector.buttonDetailDelete).click({ force: true }); // source: ColumnPopover.jsx:137 + useButtonManager.js:30-42
      cy.waitForAutoSave();
      // F40 (LOW): `.tj-header-h8` is NOT unique inside the popover — the button-list
      // EMPTY STATE reuses it for its "No action button added" heading
      // (ButtonListManager.jsx:89), which is exactly the state the delete just restored.
      // Hence `.first()`: the header title is always the first match.
      cy.get(tableSelector.columnPopoverTitle)
        .first()
        .should("have.text", tableText.columnPopoverTitle); // source: ColumnPopover.jsx:74,116
      cy.get(tableSelector.buttonListItem).should("not.exist"); // source: useButtonManager.js:31
      cy.get(tableSelector.buttonListManager).should(
        "contain.text",
        tableText.labelNoActionButton,
      ); // source: ButtonListManager.jsx:72-91
      closeColumnPopover(C);

      cy.forceClickOnCanvas();
      cy.get(tableSelector.cell(C, 0, W)).scrollIntoView();
      cy.get(tableSelector.cellActionButton(C, 0, W)).should("not.exist"); // source: ButtonColumnGroupAdapter.jsx:18

      // The next button gets a brand-new uuid, so its Events section is empty — and since
      // the deleted button's handlers were removed from the app version, nothing fires
      // when the new button is clicked either. (The event RECORDS themselves have no DOM
      // surface once their button is gone — see not_automatable in the spec report.)
      openColumnPopover(C);
      addActionButton();
      openActionButton();
      cy.get(tableSelector.columnPopoverNoEventHandler).should(
        "have.length",
        1,
      ); // source: EventManager.jsx:1358-1373
      cy.get(tableSelector.columnPopoverEventHandlerCard).should("not.exist"); // source: EventManager.jsx:1204
      closeColumnPopover(C);

      cy.forceClickOnCanvas();
      cy.get(tableSelector.cellActionButton(C, 0, W))
        .scrollIntoView()
        .click({ force: true }); // source: ButtonColumnGroupAdapter.jsx:55-57
      cy.get(commonSelectors.toastMessage).should("not.exist"); // source: useButtonManager.js:34-41
    });
  },
);
