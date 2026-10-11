/**
 * SPEC — Table — variants/rating.
 *
 * FOR AI: covers the `rating` COLUMN TYPE of the Table widget end to end — the
 * type switch, the shared column controls, the four rating-only inspector
 * controls (Icon, Max rating, Default rating, Allow half rating), the two
 * rating-only style controls (Selected color / Unselected color), the TWO
 * absences that define the type (no Text color, no Cell color, no validations)
 * and the rendered radiogroup cell.
 * Source root: frontend/src/AppBuilder/RightSideBar/Inspector/Components/Table/
 * (`columns` is declared bare as `type:'array'` at table.js:44, so NONE of these
 * controls live in the widget config — they live in the ColumnManager).
 *
 * ── WHY THIS SPEC SEEDS NO DATA ─────────────────────────────────────────────
 * A full runtime run proved that calling setTableData() from a beforeEach aborts
 * the entire spec: the helper ends with cy.forceClickOnCanvas() +
 * cy.waitForAutoSave(), the autosave indicator does not settle there, and the
 * HOOK fails — skipping every it(). So this spec drives a column the widget
 * ALREADY ships: table.js:717-723 declares { name:'id', key:'id',
 * columnType:'string' } and the shipped dataset numbers the rows 1..10
 * (table.js:692). Re-typing `id` to `rating` in beforeEach therefore yields a
 * REAL, data-bound rating column whose rows differ from one another — row 0
 * lights ONE icon, row 2 lights THREE — with no seeding at all.
 * The two branches the shipped integers cannot reach (an EMPTY cell, which is
 * the only place `defaultRating` is consumed, and a HALF value) are produced
 * from the column's own Transformation field, which is itself under test:
 * transformTableData.js:32-36 falls back with `??`, so `{{''}}` genuinely
 * commits an empty string and `{{cellValue*0.5}}` genuinely commits 1.5.
 *
 * ── WHAT MAKES `rating` DIFFERENT FROM EVERY OTHER TYPE ─────────────────────
 *  · It is the ONLY type that drops BOTH shared colour controls — "Text color"
 *    AND "Cell color". StylesTabElements.jsx:128-145 lists thirteen column types
 *    in the shared colour block and `rating` is not one of them (boolean, by
 *    contrast, is in the list and only Text color is carved out at :147).
 *  · It mounts NO validations — getValidationList has no `rating` branch so it
 *    falls to `default: return []` (ValidationProperties.jsx:164-165) and the
 *    component returns '' before rendering its container (:170-172) — even
 *    though `isEditable` IS available (only image/link/button are excluded,
 *    PropertiesTabElements.jsx:385).
 *  · The Styles-tab alignment label reads "Alignment", not "Text Alignment"
 *    (StylesTabElements.jsx:32-34, shared with boolean/image).
 *  · useColumnManager.js:21-67 has NO `value === 'rating'` branch, so the type
 *    switch seeds NOTHING — which is exactly what makes F5 (below) observable.
 * All of those are asserted here as first-class coverage.
 *
 * ── HARNESS (deliberate deviation from the generic facet header contract) ────
 * `waitForDropSettle` DOES NOT EXIST in this repo (repo-wide grep: no
 * definition), and the plain `query-manager-toggle-button` beforeEach leaves the
 * Table too short for its cells to be reachable. This spec reuses the
 * proven-green Table harness shared by basics.cy.js / inspector.cy.js /
 * styles.cy.js / canvas.cy.js: viewport → drag → hideTooltip → modifyCanvasSize →
 * close the settings panel → resizeTableWidget → resizeQueryPanel('1') →
 * openEditorSidebar. ONE cy.dragAndDropWidget per test, in beforeEach (F28:
 * cypress-real-dnd's CDP intercept is per AUT load, so a second drag in the same
 * test silently never lands).
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
 *  F5 (MED) — "Selected color" WRITES A DIFFERENT PROPERTY PER ICON TYPE, AND
 *      IS A NO-OP ON AN UNTOUCHED RATING COLUMN. StylesTabElements.jsx:240 picks
 *      `column.iconType === 'stars' ? 'selectedBgColorStars'
 *      : 'selectedBgColorHearts'` while the swatch keeps the SAME data-cy either
 *      way. Because nothing seeds `iconType` on the type switch, a fresh rating
 *      column has `iconType === undefined` — so the ternary falls to the HEARTS
 *      key, while the RENDERER resolves `getResolvedValue(column.iconType) ||
 *      'stars'` (Rating.jsx:26) and paints STARS from `selectedBgColorStars`.
 *      The colour the user picks therefore lands on a property nothing reads.
 *      Two it()s below: one pins that no-op head-on, the other proves the two
 *      keys are stored independently across a stars→hearts→stars round trip.
 *  F9 (INFO) rating adds NO discriminating <td> class (TableRow.jsx:107-142 has
 *      no `rating` branch), so `tableText.cellClassByType.rating` is null and the
 *      renderer must be identified by the markup inside the cell.
 *  F29-shaped (LOW) RatingColumnProperties mounts all THREE of its fields in
 *      `div.field.mb-2.px-3` wrappers with NO data-cy (:22, :38, :54) and gives
 *      the two CodeHinters no paramLabel, so both collapse to the non-unique
 *      `-input-field`. tableSelector.columnMaxRatingField /
 *      columnDefaultRatingField address them POSITIONALLY, and the count guard
 *      below is what keeps those indices honest.
 *  F19       the column-list data-cy is NOT normalised (Table.jsx:571
 *      interpolates the raw display name), so all helpers use `columnListItem`
 *      rather than the older normalising `tableSelector.columnItem`.
 *  F21       cell COLOUR assertions never use `tableSelector.cellContent`. A
 *      rating colour is not CSS at all — icons/star.jsx:16 and icons/heart.jsx:16
 *      put it on the svg's `fill` ATTRIBUTE, so every colour assertion here is
 *      have.attr.
 *
 * Helpers (all resolved through cypress/support/componentAutomation/type-helper-index.md):
 *   components/table.js — resizeTableWidget, openColumnPopover, closeColumnPopover,
 *     switchColumnTab, setColumnType, addColumnOfType, deleteColumn,
 *     verifyAndEnterColumnOptionInput, setColumnCodeField, verifyColumnCodeField,
 *     setColumnProperty, verifyColumnProperty, toggleColumnProperty,
 *     toggleColumnFx, setColumnColor, setColumnAlignment, setPinPosition
 *   appBuilder/properties.js — openEditorSidebar
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
  setColumnAlignment,
  setPinPosition,
} from "Support/utils/appBuilder/components/table";
import { openEditorSidebar } from "Support/utils/appBuilder/properties";
import { resizeQueryPanel } from "Support/utils/appBuilder/querymanager/queryPanel";

// testIsolation:false — cypress-real-dnd caches its CDP client for the spec run;
// testIsolation's per-test AUT reset leaves that client stale, so 2nd+ test drags
// throw "No dragIntercepted". Keeping the AUT stable across tests keeps the drag
// intercept valid. Each test still re-logs-in + creates its own app in beforeEach,
// so shared browser state is not relied upon.
describe(
  "Table — variants/rating column type",
  { testIsolation: false },
  () => {
    const W = tableText.defaultWidgetName; // 'table1'
    const C = tableText.variantRatingShippedColumn; // 'id' — source: table.js:717

    // Set the Icon ToggleGroup (PropertiesTabElements.jsx:219-227).
    // GOTCHA: ToolJetUI/SwitchGroup/ToggleGroup.jsx:18 swallows an EMPTY onValueChange,
    // and Radix emits '' when the already-pressed item is clicked — so clicking the item
    // that is already visually on is a silent no-op on the stored value. The toggle renders
    // `defaultValue={value || 'stars'}` (RatingIconToggle.jsx:15), i.e. it LOOKS like
    // 'stars' even while `column.iconType` is still undefined. `setRatingIcon('stars')`
    // therefore has to go through 'hearts' first to actually write the key.
    const setRatingIcon = (value) => {
      cy.get(tableSelector.ratingIconToggleOption(value))
        .scrollIntoView()
        .click({ force: true });
      cy.waitForAutoSave();
      cy.get(tableSelector.ratingIconToggleOptionActive(value)).should("exist"); // source: ToggleGroupItem.jsx:31-33
    };
    const setRatingIconStarsExplicitly = () => {
      setRatingIcon(tableText.ratingIconHearts); // source: RatingIconToggle.jsx:19
      setRatingIcon(tableText.ratingIconStars); // source: RatingIconToggle.jsx:16
    };

    // Assert the `fill` ATTRIBUTE of one icon's <svg>. icons/star.jsx:16 / icons/heart.jsx:16
    // put the colour on the svg (and its <path>) as an attribute, never as CSS, so have.css
    // would read the inherited value and pass on anything.
    const verifyIconFill = (rowIndex, iconIndex, expected) => {
      cy.get(tableSelector.cellRatingIconSvg(C, rowIndex, iconIndex, W))
        .first()
        .scrollIntoView()
        .should("have.attr", "fill", expected);
    };

    beforeEach(() => {
      cy.apiLogin();
      cy.apiCreateApp(`${fake.companyName}-Table-Rating-Column`); // dynamic: fake
      cy.openApp();
      cy.viewport(1400, 2200);
      cy.dragAndDropWidget("Table", 250, 100);
      cy.hideTooltip();
      cy.modifyCanvasSize(900, 800);
      cy.get("[data-cy='left-sidebar-settings-button']").click();
      resizeTableWidget(W, 750, 600);
      resizeQueryPanel("1");
      openEditorSidebar(W);
      // The shipped `id` column is a string column (table.js:723); re-typing it to `rating`
      // is what mounts RatingColumnProperties (PropertiesTabElements.jsx:491-502) and the
      // rating branch of the Styles tab. setColumnType opens the popover itself; close it
      // again so every it() starts from the same state (column list on screen, popover
      // shut) and with `iconType` still UNSET — useColumnManager.js:21-67 has no rating
      // branch, which is the precondition F5 depends on.
      setColumnType(C, tableText.columnTypeValue.rating); // source: PropertiesTabElements.jsx:138
      closeColumnPopover(C);
    });

    afterEach(() => {
      cy.apiDeleteApp();
    });

    // ═══════════════════════════════════════════════════════════════════════════
    // COLUMN CREATION / TYPE SWITCH
    // ═══════════════════════════════════════════════════════════════════════════

    it("column type — a string column re-typed to `rating` renders a radiogroup, and the type can be switched away and back", () => {
      openColumnPopover(C);
      // CustomValueContainer (PropertiesTabElements.jsx:59-67) renders the stored value's
      // option LABEL, so the react-select shows "Rating".
      cy.get(tableSelector.columnPopover)
        .find(tableSelector.columnTypeSelect)
        .should("contain.text", tableText.columnTypeLabel.rating); // source: PropertiesTabElements.jsx:138
      closeColumnPopover(C);

      cy.forceClickOnCanvas();
      cy.get(tableSelector.cell(C, 0, W)).scrollIntoView();
      // F9: rating adds NO <td> class of its own, so the radiogroup Rating.jsx:98-108
      // mounts is the only proof of which renderer ran.
      cy.get(tableSelector.cellRatingGroup(C, 0, W)).should("have.length", 1); // source: Rating.jsx:103
      cy.get(tableSelector.cellRatingIcon(C, 0, W)).should(
        "have.length",
        tableText.variantRatingDefaultMaxRating,
      ); // source: Rating.jsx:24 (`|| 5`)
      cy.get(tableSelector.cell(C, 0, W))
        .should("not.have.class", tableText.cellClassByType.string) // source: TableRow.jsx:132
        .and("not.have.class", tableText.cellClassByType.number); // source: TableRow.jsx:120

      // Switch to `string`: the textarea renderer takes over and the radiogroup is gone.
      setColumnType(C, tableText.columnTypeValue.string); // source: PropertiesTabElements.jsx:125
      closeColumnPopover(C);
      cy.forceClickOnCanvas();
      cy.get(tableSelector.cell(C, 0, W)).should(
        "have.class",
        tableText.cellClassByType.string,
      ); // source: TableRow.jsx:132
      cy.get(tableSelector.cellRatingGroup(C, 0, W)).should("not.exist"); // source: Rating.jsx:103

      // …and back to `rating`, which restores the radiogroup.
      setColumnType(C, tableText.columnTypeValue.rating); // source: PropertiesTabElements.jsx:138
      closeColumnPopover(C);
      cy.forceClickOnCanvas();
      cy.get(tableSelector.cell(C, 0, W)).should(
        "not.have.class",
        tableText.cellClassByType.string,
      ); // source: TableRow.jsx:132
      cy.get(tableSelector.cellRatingIconSelected(C, 0, W)).should(
        "have.length",
        tableText.variantRatingShippedRow0Selected,
      ); // source: Rating.jsx:45,111 (cellValue 1 → index 0)
    });

    it("column manager — a `rating` column can be added, bound to a key and deleted", () => {
      // addColumnOfType sets the TYPE first (so RatingColumnProperties mounts), then the
      // name, then the key — the key is what the row data is read from
      // (generateColumnsData.js:163 accessorKey = column.key || column.name).
      addColumnOfType(
        tableText.variantRatingShippedNewColumn,
        tableText.columnTypeValue.rating, // source: PropertiesTabElements.jsx:138
        tableText.variantRatingShippedColumnKey, // source: table.js:718
      );
      closeColumnPopover(tableText.variantRatingShippedNewColumn);

      cy.forceClickOnCanvas();
      cy.get(
        tableSelector.columnHeader(tableText.variantRatingShippedNewColumn),
      )
        .scrollIntoView()
        .should("have.text", tableText.variantRatingShippedNewColumn); // source: TableHeader.jsx:153
      // Bound to the same `id` key, so it lights the same single icon as the seed column.
      cy.get(
        tableSelector.cellRatingIconSelected(
          tableText.variantRatingShippedNewColumn,
          0,
          W,
        ),
      ).should("have.length", tableText.variantRatingShippedRow0Selected); // source: Rating.jsx:111

      // deleteColumn drives the popover header's [title="Delete column"] and asserts BOTH
      // the inspector row and the rendered header are gone.
      deleteColumn(tableText.variantRatingShippedNewColumn); // source: ColumnPopover.jsx:130-138
    });

    // ═══════════════════════════════════════════════════════════════════════════
    // SHARED PROPERTIES (Properties tab)
    // ═══════════════════════════════════════════════════════════════════════════

    it("properties — Column name renames the rendered column, Key rebinds its data", () => {
      openColumnPopover(C);
      verifyColumnCodeField(tableSelector.columnNameField, C); // source: PropertiesTabElements.jsx:164-181
      verifyColumnCodeField(
        tableSelector.columnKeyField,
        tableText.variantRatingShippedColumnKey,
      ); // source: PropertiesTabElements.jsx:182-197

      // Renaming re-keys the rendered header AND every cell data-cy, because both are
      // derived from `columnDef.header` = the resolved column name
      // (generateColumnsData.js:165 → TableHeader.jsx:153 / TableRow.jsx:103-105).
      verifyAndEnterColumnOptionInput(
        tableText.labelColumnName,
        tableText.variantRatingShippedRenamedColumn,
      ); // source: PropertiesTabElements.jsx:166
      closeColumnPopover(tableText.variantRatingShippedRenamedColumn);
      cy.forceClickOnCanvas();
      cy.get(
        tableSelector.columnHeader(tableText.variantRatingShippedRenamedColumn),
      )
        .scrollIntoView()
        .should("have.text", tableText.variantRatingShippedRenamedColumn); // source: TableHeader.jsx:153
      cy.get(
        tableSelector.cellRatingIconSelected(
          tableText.variantRatingShippedRenamedColumn,
          0,
          W,
        ),
      ).should("have.length", tableText.variantRatingShippedRow0Selected); // source: Rating.jsx:111

      // The Key is the accessor, so re-pointing it at `phone` — a 10-digit number — pushes
      // currentRatingIndex past every icon index and lights the whole group, while the
      // header (and therefore the data-cy) stays put.
      openColumnPopover(tableText.variantRatingShippedRenamedColumn);
      verifyAndEnterColumnOptionInput(
        tableText.labelKey,
        tableText.variantRatingShippedAltKey,
      ); // source: PropertiesTabElements.jsx:183
      closeColumnPopover(tableText.variantRatingShippedRenamedColumn);
      cy.forceClickOnCanvas();
      cy.get(
        tableSelector.cellRatingIconSelected(
          tableText.variantRatingShippedRenamedColumn,
          0,
          W,
        ),
      ).should("have.length", tableText.variantRatingShippedAltRow0Selected); // source: Rating.jsx:111
    });

    it("properties — Transformation rewrites the number the icon count is derived from", () => {
      openColumnPopover(C);
      verifyColumnCodeField(
        tableSelector.columnTransformationField,
        tableText.defaultTransformation,
      ); // source: PropertiesTabElements.jsx:205

      // columnSlice.js:99 deliberately DROPS a transformation equal to '{{cellValue}}', so
      // only a real expression reaches transformTableData.js:32-36, which rewrites the
      // row's value BEFORE Rating.jsx:38-46 converts it into currentRatingIndex. `*`
      // survives clearAndTypeOnCodeMirror's tokenizer (codemirrorCommands.js:29); `/` does
      // not — hence a doubling rather than a division.
      setColumnCodeField(
        tableSelector.columnTransformationField,
        tableText.variantRatingShippedTransformation,
      ); // source: PropertiesTabElements.jsx:200-218
      closeColumnPopover(C);

      cy.forceClickOnCanvas();
      cy.get(tableSelector.cell(C, 0, W)).scrollIntoView();
      cy.get(tableSelector.cellRatingIconSelected(C, 0, W)).should(
        "have.length",
        tableText.variantRatingShippedTransformedRow0Selected,
      ); // source: transformTableData.js:32-36
      // The group size is untouched — maxRating is a column property, not a value.
      cy.get(tableSelector.cellRatingIcon(C, 0, W)).should(
        "have.length",
        tableText.variantRatingDefaultMaxRating,
      ); // source: Rating.jsx:24
    });

    it("properties — Visibility (fx) removes the column from the rendered table", () => {
      openColumnPopover(C);
      // `columnVisibility` is rendered by ProgramaticallyHandleProperties, so it is
      // fx-capable: the fx button exists and turning it ON is what mounts the code field
      // (SingleLineCodeEditor.jsx:794-802). fx state for a column is the `fxActiveFields[]`
      // array, not a per-field boolean (ProgramaticallyHandleProperties.jsx:104-147).
      toggleColumnFx(tableText.labelVisibility); // source: PropertiesTabElements.jsx:449-466
      verifyColumnProperty(
        tableText.labelVisibility,
        tableText.variantDefaultColumnVisibility,
      ); // source: ProgramaticallyHandleProperties.jsx:22
      setColumnProperty(
        tableText.labelVisibility,
        tableText.variantHiddenColumnVisibility,
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
        .should("have.class", tableText.cellClassPinned) // source: TableRow.jsx:137
        .and("have.class", tableText.cellClassPinnedLeft); // source: TableRow.jsx:138
    });

    // ═══════════════════════════════════════════════════════════════════════════
    // RATING-ONLY PROPERTIES (RatingColumnProperties.jsx)
    // ═══════════════════════════════════════════════════════════════════════════

    it("rating — the type mounts an Icon toggle plus an `Options` section of exactly three unnamed code wrappers", () => {
      openColumnPopover(C);
      // The Icon field is the ONE rating control with a wrapper data-cy
      // (PropertiesTabElements.jsx:220); its label is a bare string, not an i18n key (:221).
      cy.get(tableSelector.ratingTypeField).should(
        "contain.text",
        tableText.labelRatingIcon,
      ); // source: PropertiesTabElements.jsx:221
      cy.get(tableSelector.ratingIconToggle).should("have.length", 1); // source: RatingIconToggle.jsx:14
      // RatingIconToggle.jsx:15 renders `defaultValue={value || 'stars'}`, so stars is the
      // pressed item even while `column.iconType` is still undefined.
      cy.get(
        tableSelector.ratingIconToggleOptionActive(tableText.ratingIconStars),
      ).should("exist"); // source: RatingIconToggle.jsx:15-18

      cy.get(tableSelector.columnPopover)
        .should("contain.text", tableText.labelRatingOptionsSection) // source: RatingColumnProperties.jsx:20
        .and("contain.text", tableText.labelMaxRating) // source: RatingColumnProperties.jsx:23
        .and("contain.text", tableText.labelDefaultRating) // source: RatingColumnProperties.jsx:39
        .and("contain.text", tableText.labelAllowHalfRating); // source: RatingColumnProperties.jsx:56

      // F29-shaped: all three wrappers are `div.field.mb-2.px-3` with NO data-cy, so
      // columnMaxRatingField / columnDefaultRatingField can only address them by position.
      // Pinning the count is what keeps those :eq(0) / :eq(1) indices meaningful — a fourth
      // unnamed wrapper would silently shift them.
      cy.get(tableSelector.columnRatingUnnamedFields).should(
        "have.length",
        tableText.variantRatingUnnamedFieldCount,
      ); // source: RatingColumnProperties.jsx:22,38,54
      cy.get(tableSelector.columnMaxRatingField).should(
        "contain.text",
        tableText.labelMaxRating,
      ); // source: RatingColumnProperties.jsx:23
      cy.get(tableSelector.columnDefaultRatingField).should(
        "contain.text",
        tableText.labelDefaultRating,
      ); // source: RatingColumnProperties.jsx:39
      closeColumnPopover(C);
    });

    it("rating — Icon switches the rendered glyph set and is encoded in the group's aria-label", () => {
      // Rating.jsx:100 builds `Rating widget, ${stars|hearts} from 1 to ${maxRating}`, so a
      // single attribute assertion pins BOTH the icon type and the group size.
      cy.forceClickOnCanvas();
      cy.get(tableSelector.cellRatingGroup(C, 0, W))
        .scrollIntoView()
        .should(
          "have.attr",
          "aria-label",
          tableText.variantRatingAriaGroupStars5,
        ); // source: Rating.jsx:26,100
      // Untouched `iconType` still resolves to stars, so the selected icon takes the STARS
      // fallback colour (Rating.jsx:28) rather than the hearts one (:29).
      verifyIconFill(0, 0, tableText.variantDefaultSelectedStarsColor); // source: Rating.jsx:28

      openColumnPopover(C);
      setRatingIcon(tableText.ratingIconHearts); // source: RatingIconToggle.jsx:19
      closeColumnPopover(C);

      cy.forceClickOnCanvas();
      cy.get(tableSelector.cellRatingGroup(C, 0, W))
        .scrollIntoView()
        .should(
          "have.attr",
          "aria-label",
          tableText.variantRatingAriaGroupHearts5,
        ); // source: Rating.jsx:100
      // RatingIcon.jsx:35,43 swaps StarSvg for HeartSvg, whose own default fill is #EE5B67.
      verifyIconFill(0, 0, tableText.variantRatingDefaultSelectedHeartsColor); // source: Rating.jsx:29

      openColumnPopover(C);
      setRatingIcon(tableText.ratingIconStars); // source: RatingIconToggle.jsx:16
      closeColumnPopover(C);

      cy.forceClickOnCanvas();
      cy.get(tableSelector.cellRatingGroup(C, 0, W))
        .scrollIntoView()
        .should(
          "have.attr",
          "aria-label",
          tableText.variantRatingAriaGroupStars5,
        ); // source: Rating.jsx:100
      verifyIconFill(0, 0, tableText.variantDefaultSelectedStarsColor); // source: Rating.jsx:28
    });

    it("rating — Max rating resizes the icon group and rewrites both aria-label and aria-setsize", () => {
      // The shipped default is not stored on the column at all — Rating.jsx:24 falls back
      // with `|| 5`, and RatingIcon.jsx:149 mirrors it onto every icon's aria-setsize.
      cy.forceClickOnCanvas();
      cy.get(tableSelector.cellRatingIcon(C, 0, W))
        .scrollIntoView()
        .should("have.length", tableText.variantRatingDefaultMaxRating); // source: Rating.jsx:24
      cy.get(tableSelector.cellRatingIcon(C, 0, W))
        .first()
        .should(
          "have.attr",
          "aria-setsize",
          tableText.variantRatingAriaSetSizeDefault,
        ); // source: RatingIcon.jsx:149

      openColumnPopover(C);
      setColumnCodeField(
        tableSelector.columnMaxRatingField,
        tableText.variantRatingMaxOverride,
      ); // source: RatingColumnProperties.jsx:22-37
      verifyColumnCodeField(
        tableSelector.columnMaxRatingField,
        tableText.variantRatingMaxOverride,
      ); // source: RatingColumnProperties.jsx:24-36
      closeColumnPopover(C);

      cy.forceClickOnCanvas();
      // useTrail(maxRating) drives the icon count directly (Rating.jsx:50,109).
      cy.get(tableSelector.cellRatingIcon(C, 0, W))
        .scrollIntoView()
        .should("have.length", tableText.variantRatingMaxOverrideCount); // source: Rating.jsx:50
      cy.get(tableSelector.cellRatingGroup(C, 0, W)).should(
        "have.attr",
        "aria-label",
        tableText.variantRatingAriaGroupStars3,
      ); // source: Rating.jsx:100
      cy.get(tableSelector.cellRatingIcon(C, 0, W))
        .first()
        .should(
          "have.attr",
          "aria-setsize",
          tableText.variantRatingAriaSetSizeOverride,
        ); // source: RatingIcon.jsx:149
      // Row 2 still holds 3, which now fills the whole (smaller) group.
      cy.get(tableSelector.cellRatingIconSelected(C, 2, W)).should(
        "have.length",
        tableText.variantRatingShippedRow2Selected,
      ); // source: Rating.jsx:111
    });

    it("rating — Default rating is consumed ONLY by an empty cell", () => {
      openColumnPopover(C);
      // Rating.jsx:38-46 reads defaultRating exclusively in the `isEmpty` branch, and the
      // shipped dataset has an integer in every `id`. transformTableData.js:32-36 falls
      // back with `??` (not `||`), so an empty-string transformation genuinely COMMITS ''
      // — which is the only way to reach that branch without seeding a dataset.
      setColumnCodeField(
        tableSelector.columnTransformationField,
        tableText.variantRatingEmptyTransformation,
      ); // source: PropertiesTabElements.jsx:200-218
      closeColumnPopover(C);

      // With defaultRating still unset, Rating.jsx:37's `?? 0` makes currentRatingIndex -1
      // — an empty group with the icons still mounted.
      cy.forceClickOnCanvas();
      cy.get(tableSelector.cellRatingIcon(C, 0, W))
        .scrollIntoView()
        .should("have.length", tableText.variantRatingDefaultMaxRating); // source: Rating.jsx:24
      cy.get(tableSelector.cellRatingIconSelected(C, 0, W)).should(
        "have.length",
        tableText.variantRatingUnsetDefaultSelected,
      ); // source: Rating.jsx:37,43

      openColumnPopover(C);
      setColumnCodeField(
        tableSelector.columnDefaultRatingField,
        tableText.variantRatingDefaultOverride,
      ); // source: RatingColumnProperties.jsx:38-53
      verifyColumnCodeField(
        tableSelector.columnDefaultRatingField,
        tableText.variantRatingDefaultOverride,
      ); // source: RatingColumnProperties.jsx:40-52
      closeColumnPopover(C);

      cy.forceClickOnCanvas();
      // Every row is empty now, so every row falls to `defaultRating - 1`.
      cy.get(tableSelector.cellRatingIconSelected(C, 0, W))
        .scrollIntoView()
        .should("have.length", tableText.variantRatingDefaultOverrideSelected); // source: Rating.jsx:43
      cy.get(tableSelector.cellRatingIconSelected(C, 2, W)).should(
        "have.length",
        tableText.variantRatingDefaultOverrideSelected,
      ); // source: Rating.jsx:43
    });

    it("rating — Allow half rating is an fx toggle, and the HALF icon is driven by the value rather than by the flag", () => {
      openColumnPopover(C);
      // No `allowHalfStar` branch exists in getInitialValue, so the fx editor shows
      // ProgramaticallyHandleProperties.jsx:87's terminal `{{false}}`.
      toggleColumnFx(tableText.labelAllowHalfRating); // source: RatingColumnProperties.jsx:54-68
      verifyColumnProperty(
        tableText.labelAllowHalfRating,
        tableText.variantRatingAllowHalfDefault,
      ); // source: ProgramaticallyHandleProperties.jsx:87
      toggleColumnFx(tableText.labelAllowHalfRating);
      cy.get(
        tableSelector.columnParamToggle(tableText.labelAllowHalfRating),
      ).should("not.be.checked"); // source: CodeBuilder/Elements/Toggle.jsx:24

      // Halving row 2's value (3 → 1.5) makes currentRatingIndex 0.5, which lights icon 0
      // and makes icon 1 the HALF icon (Rating.jsx:80-83, :111). Note this happens with
      // `allowHalfStar` still OFF: Rating.jsx:120 passes `isHalfIcon` unconditionally and
      // RatingIcon.jsx:114-118 uses allowHalfStar only to attach the half-precision
      // onMouseMove handler — so the FLAG never gates the rendered half glyph. Recorded
      // here rather than assumed.
      setColumnCodeField(
        tableSelector.columnTransformationField,
        tableText.variantRatingHalfTransformation,
      ); // source: PropertiesTabElements.jsx:200-218
      closeColumnPopover(C);

      cy.forceClickOnCanvas();
      cy.get(
        tableSelector.cellRatingIconSelected(
          C,
          tableText.variantRatingHalfRowIndexShipped,
          W,
        ),
      )
        .scrollIntoView()
        .should("have.length", tableText.variantRatingHalfRowSelectedShipped); // source: Rating.jsx:111
      // icons/star.jsx:5-8 swaps the flat fill for a generated linearGradient whose id is
      // randomised per render, so only a PREFIX match is stable.
      cy.get(
        tableSelector.cellRatingHalfIcon(
          C,
          tableText.variantRatingHalfRowIndexShipped,
          W,
        ),
      ).should("have.length", 1); // source: icons/star.jsx:8,19-26

      // Turning the flag ON changes nothing about the rendered glyph — the same half icon
      // is still there, which is the whole point of the finding above.
      openColumnPopover(C);
      toggleColumnProperty(tableText.labelAllowHalfRating); // source: RatingColumnProperties.jsx:54-68
      cy.get(
        tableSelector.columnParamToggle(tableText.labelAllowHalfRating),
      ).should("be.checked"); // source: CodeBuilder/Elements/Toggle.jsx:24
      closeColumnPopover(C);

      cy.forceClickOnCanvas();
      cy.get(
        tableSelector.cellRatingHalfIcon(
          C,
          tableText.variantRatingHalfRowIndexShipped,
          W,
        ),
      )
        .scrollIntoView()
        .should("have.length", 1); // source: Rating.jsx:120 + RatingIcon.jsx:114-118
    });

    it("properties — Make editable makes the icons focusable and commits a clicked rating", () => {
      // Read-only first: RatingIcon.jsx:134,144,147 gate `pointer-events-none`, tabIndex -1
      // and aria-disabled on `allowEditing && !isDisabled`, and Rating.jsx:102 mirrors it
      // onto the group.
      cy.forceClickOnCanvas();
      cy.get(tableSelector.cellRatingGroup(C, 0, W))
        .scrollIntoView()
        .should("have.attr", "aria-disabled", "true"); // source: Rating.jsx:102
      cy.get(tableSelector.cellRatingIcon(C, 0, W))
        .first()
        .should("have.attr", "tabindex", "-1"); // source: RatingIcon.jsx:144

      openColumnPopover(C);
      // `isEditable` IS offered for rating — PropertiesTabElements.jsx:385 excludes only
      // image / link / button.
      toggleColumnProperty(tableText.labelMakeEditable); // source: PropertiesTabElements.jsx:385-400
      closeColumnPopover(C);

      cy.forceClickOnCanvas();
      cy.get(
        tableSelector.cellRatingGroup(
          C,
          tableText.variantRatingShippedEditRowIndex,
          W,
        ),
      )
        .scrollIntoView()
        .should("have.attr", "aria-disabled", "false"); // source: Rating.jsx:102
      cy.get(
        tableSelector.cell(C, tableText.variantRatingShippedEditRowIndex, W),
      )
        .should("have.class", tableText.cellClassEditable) // source: TableRow.jsx:135
        .and("have.class", tableText.cellClassByType.text); // source: TableRow.jsx:118 (ORed with isEditable)
      cy.get(
        tableSelector.cellRatingIcon(
          C,
          tableText.variantRatingShippedEditRowIndex,
          W,
        ),
      )
        .first()
        .should("have.attr", "tabindex", "0"); // source: RatingIcon.jsx:144

      // RatingIcon.jsx:100 commits `index + 1` through handleCellValueChange
      // (Rating.jsx:63-68), so clicking the LAST icon of the 5-icon group must select all
      // five. Row 1 is used rather than row 0 so the shipped `defaultSelectedRow`
      // {{{"id":1}}} (table.js:836) is never invalidated by the edit.
      cy.get(
        tableSelector.cellRatingIcon(
          C,
          tableText.variantRatingShippedEditRowIndex,
          W,
        ),
      )
        .eq(tableText.variantRatingDefaultMaxRating - 1)
        .click({ force: true });
      cy.get(
        tableSelector.cellRatingIconSelected(
          C,
          tableText.variantRatingShippedEditRowIndex,
          W,
        ),
      ).should("have.length", tableText.variantRatingDefaultMaxRating); // source: Rating.jsx:67 + RatingIcon.jsx:100
      cy.get(
        tableSelector.cell(C, tableText.variantRatingShippedEditRowIndex, W),
      ).should("have.class", tableText.cellClassEdited); // source: TableRow.jsx:136
    });

    // ═══════════════════════════════════════════════════════════════════════════
    // VALIDATIONS — a rating column mounts NONE
    // ═══════════════════════════════════════════════════════════════════════════

    it("validations — an editable `rating` column mounts no validation controls at all", () => {
      openColumnPopover(C);
      toggleColumnProperty(tableText.labelMakeEditable); // source: PropertiesTabElements.jsx:385-400

      // PropertiesTabElements.jsx:401-412 DOES mount <ValidationProperties> once the column
      // is editable, but getValidationList has no `rating` branch, so it falls through to
      // `default: return []` (ValidationProperties.jsx:164-165) and the component bails out
      // with '' BEFORE rendering its container (:170-172). The section therefore never
      // exists — unlike select/newMultiSelect/tagsV2, which mount exactly one (customRule).
      cy.get(tableSelector.columnValidationSection).should("not.exist"); // source: ValidationProperties.jsx:170-172
      cy.get(tableSelector.columnPopover)
        .should("not.contain.text", tableText.labelCustomRule) // source: ValidationProperties.jsx:105
        .and("not.contain.text", tableText.labelRegex) // source: ValidationProperties.jsx:43
        .and("not.contain.text", tableText.labelMinValue); // source: ValidationProperties.jsx:80
      closeColumnPopover(C);
    });

    // ═══════════════════════════════════════════════════════════════════════════
    // TYPE-SPECIFIC STYLES (Styles tab)
    // ═══════════════════════════════════════════════════════════════════════════

    it("styles — the alignment label reads `Alignment` for rating and moves the rendered icon group", () => {
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
      // The renderer builds its OWN bootstrap class from the same value through
      // determineJustifyContentValue (_helpers/utils.js:1196-1207).
      cy.get(tableSelector.cellRatingGroup(C, 0, W)).should(
        "have.class",
        tableText.cellFlexJustifyCenter,
      ); // source: Rating.jsx:103-105
    });

    it("styles — Unselected color repaints every icon the value has not reached", () => {
      // The shipped fallback is a raw design token written straight into the svg's `fill`
      // ATTRIBUTE (Rating.jsx:30 → RatingIcon.jsx:43 → icons/star.jsx:16), so it is read
      // back verbatim rather than as a resolved CSS colour.
      cy.forceClickOnCanvas();
      verifyIconFill(0, 1, tableText.variantDefaultUnselectedColor); // source: Rating.jsx:30

      openColumnPopover(C);
      switchColumnTab(tableText.columnTabStyles); // source: ColumnPopover.jsx:157
      setColumnColor(
        tableText.labelUnselectedColor,
        tableText.variantRatingUnselectedRgba,
      ); // source: StylesTabElements.jsx:247-260
      closeColumnPopover(C);

      // Row 0's value is 1, so icons 1..4 are unselected and icon 0 is not — which is what
      // proves the colour is applied per ICON STATE rather than per cell.
      cy.forceClickOnCanvas();
      verifyIconFill(0, 1, tableText.variantRatingUnselectedRgbaHex); // source: RatingIcon.jsx:43
      verifyIconFill(0, 4, tableText.variantRatingUnselectedRgbaHex); // source: RatingIcon.jsx:43
      verifyIconFill(0, 0, tableText.variantDefaultSelectedStarsColor); // source: Rating.jsx:28
    });

    it("styles (F5) — `Selected color` is a NO-OP on an untouched rating column because it writes the HEARTS key", () => {
      // PRECONDITION: useColumnManager.js:21-67 has no rating branch, so nothing seeds
      // `iconType` and the fresh column carries `undefined`.
      cy.forceClickOnCanvas();
      cy.get(tableSelector.cellRatingGroup(C, 0, W))
        .scrollIntoView()
        .should(
          "have.attr",
          "aria-label",
          tableText.variantRatingAriaGroupStars5,
        ); // source: Rating.jsx:26,100
      verifyIconFill(0, 0, tableText.variantDefaultSelectedStarsColor); // source: Rating.jsx:28

      openColumnPopover(C);
      switchColumnTab(tableText.columnTabStyles); // source: ColumnPopover.jsx:157
      // F5: StylesTabElements.jsx:240 resolves `column.iconType === 'stars' ?
      // 'selectedBgColorStars' : 'selectedBgColorHearts'`. `undefined === 'stars'` is
      // FALSE, so this write lands on selectedBgColorHearts…
      setColumnColor(
        tableText.labelSelectedColor,
        tableText.variantRatingSelectedHeartsRgba,
      ); // source: StylesTabElements.jsx:231-246 (F5)
      closeColumnPopover(C);

      // …while the RENDERER resolves `getResolvedValue(column.iconType) || 'stars'`
      // (Rating.jsx:26) and therefore paints from selectedBgColorStars (:128), which is
      // still unset. The user's colour has no effect whatsoever.
      cy.forceClickOnCanvas();
      verifyIconFill(0, 0, tableText.variantDefaultSelectedStarsColor); // source: Rating.jsx:28,128 (F5)

      // Flipping Icon to hearts is what finally surfaces the colour that was stored two
      // steps ago — the clearest possible proof of which key the swatch actually wrote.
      openColumnPopover(C);
      switchColumnTab(tableText.columnTabProperties); // source: ColumnPopover.jsx:149
      setRatingIcon(tableText.ratingIconHearts); // source: RatingIconToggle.jsx:19
      closeColumnPopover(C);

      cy.forceClickOnCanvas();
      verifyIconFill(0, 0, tableText.variantRatingSelectedHeartsHex); // source: StylesTabElements.jsx:240 (F5)
    });

    it("styles (F5) — `Selected color` stores a SEPARATE value per icon type across a stars → hearts → stars round trip", () => {
      openColumnPopover(C);
      // Write `iconType: 'stars'` for real. Clicking the already-pressed item is a silent
      // no-op (ToggleGroup.jsx:18 swallows Radix's empty value), so this goes via hearts.
      setRatingIconStarsExplicitly();

      switchColumnTab(tableText.columnTabStyles); // source: ColumnPopover.jsx:157
      setColumnColor(
        tableText.labelSelectedColor,
        tableText.variantRatingSelectedStarsRgba,
      ); // source: StylesTabElements.jsx:240 → selectedBgColorStars (F5)
      closeColumnPopover(C);

      cy.forceClickOnCanvas();
      verifyIconFill(0, 0, tableText.variantRatingSelectedStarsHex); // source: Rating.jsx:28,128

      // Switching to hearts must NOT carry the colour over: the renderer now reads
      // selectedBgColorHearts (Rating.jsx:29,128), which is still unset, so the icons fall
      // back to the HEARTS default.
      openColumnPopover(C);
      switchColumnTab(tableText.columnTabProperties); // source: ColumnPopover.jsx:149
      setRatingIcon(tableText.ratingIconHearts); // source: RatingIconToggle.jsx:19
      closeColumnPopover(C);

      cy.forceClickOnCanvas();
      verifyIconFill(0, 0, tableText.variantRatingDefaultSelectedHeartsColor); // source: Rating.jsx:29 (F5)

      // A DIFFERENT colour under hearts writes the other key…
      openColumnPopover(C);
      switchColumnTab(tableText.columnTabStyles); // source: ColumnPopover.jsx:157
      setColumnColor(
        tableText.labelSelectedColor,
        tableText.variantRatingSelectedHeartsRgba,
      ); // source: StylesTabElements.jsx:240 → selectedBgColorHearts (F5)
      closeColumnPopover(C);

      cy.forceClickOnCanvas();
      verifyIconFill(0, 0, tableText.variantRatingSelectedHeartsHex); // source: Rating.jsx:29,128

      // …and switching back restores the FIRST colour, proving both keys coexist on the
      // column while sharing one data-cy in the inspector.
      openColumnPopover(C);
      switchColumnTab(tableText.columnTabProperties); // source: ColumnPopover.jsx:149
      setRatingIcon(tableText.ratingIconStars); // source: RatingIconToggle.jsx:16
      closeColumnPopover(C);

      cy.forceClickOnCanvas();
      verifyIconFill(0, 0, tableText.variantRatingSelectedStarsHex); // source: Rating.jsx:28,128 (F5)
    });

    it("styles — neither Text color nor Cell color is offered for a rating column", () => {
      openColumnPopover(C);
      switchColumnTab(tableText.columnTabStyles); // source: ColumnPopover.jsx:157

      // StylesTabElements.jsx:128-145 gates the whole shared colour block on a list of
      // THIRTEEN column types — `rating` is not one of them — so BOTH Text color (:147-161)
      // and Cell color (:163-176) are absent. That double absence is unique to this type:
      // `boolean` is in the list and only Text color is carved out at :147.
      cy.get(tableSelector.columnTextColorField).should("not.exist"); // source: StylesTabElements.jsx:128-148
      cy.get(tableSelector.columnColorPicker(tableText.labelTextColor)).should(
        "not.exist",
      ); // source: StylesTabElements.jsx:158
      cy.get(tableSelector.columnCellColorField).should("not.exist"); // source: StylesTabElements.jsx:163-176
      cy.get(tableSelector.columnColorPicker(tableText.labelCellColor)).should(
        "not.exist",
      ); // source: StylesTabElements.jsx:173

      // …while the two rating-only swatches from :225-261 ARE present, which proves the tab
      // rendered and the absences above are a real carve-out rather than an empty panel.
      // (SOURCE QUIRK worth recording: generateColumnsData.js:539 still passes
      // `column.textColor` into RatingColumn and Rating.jsx:106 still applies it to the
      // group — the property is simply unreachable from the UI for this type.)
      cy.get(
        tableSelector.columnColorPicker(tableText.labelSelectedColor),
      ).should("have.length", 1); // source: StylesTabElements.jsx:231-246
      cy.get(
        tableSelector.columnColorPicker(tableText.labelUnselectedColor),
      ).should("have.length", 1); // source: StylesTabElements.jsx:247-260
      closeColumnPopover(C);
    });

    // ═══════════════════════════════════════════════════════════════════════════
    // CELL RENDERING CONTRACT
    // ═══════════════════════════════════════════════════════════════════════════

    it("cell rendering — a rating cell carries no type class (F9) and exposes its state through ARIA only", () => {
      cy.forceClickOnCanvas();
      cy.get(tableSelector.cell(C, 0, W)).scrollIntoView();
      // F9 (INFO): TableRow.jsx:107-142 has no `rating` branch, so the cell is a plain
      // `table-cell td` — none of the type classes other renderers get apply here.
      cy.get(tableSelector.cell(C, 0, W))
        .should("not.have.class", tableText.cellClassByType.string) // source: TableRow.jsx:132
        .and("not.have.class", tableText.cellClassByType.number) // source: TableRow.jsx:120
        .and("not.have.class", tableText.cellClassByType.select) // source: TableRow.jsx:127
        .and("not.have.class", tableText.cellClassByType.text); // source: TableRow.jsx:118

      // Rating.jsx:98-108 is the only markup that identifies the renderer, and RatingIcon
      // .jsx:143-149 is where every per-icon assertion has to hang off.
      cy.get(tableSelector.cellRatingGroup(C, 0, W)).should(
        "have.attr",
        "role",
        "radiogroup",
      ); // source: Rating.jsx:99
      cy.get(tableSelector.cellRatingIcon(C, 0, W))
        .should("have.length", tableText.variantRatingDefaultMaxRating) // source: Rating.jsx:24,50
        .first()
        .should("have.attr", "role", "radio"); // source: RatingIcon.jsx:143

      // `aria-checked` is `index <= currentRatingIndex` (Rating.jsx:111,136), so the count
      // of checked icons IS the rendered value — row 0 holds 1 and row 2 holds 3.
      cy.get(tableSelector.cellRatingIconSelected(C, 0, W)).should(
        "have.length",
        tableText.variantRatingShippedRow0Selected,
      ); // source: table.js:692 (row 0 id 1)
      cy.get(tableSelector.cellRatingIconSelected(C, 2, W)).should(
        "have.length",
        tableText.variantRatingShippedRow2Selected,
      ); // source: table.js:692 (row 2 id 3)
      cy.get(tableSelector.cellRatingIconSelected(C, 1, W)).should(
        "have.length",
        tableText.variantRatingShippedRow1Selected,
      ); // source: table.js:692 (row 1 id 2)
    });
  },
);
