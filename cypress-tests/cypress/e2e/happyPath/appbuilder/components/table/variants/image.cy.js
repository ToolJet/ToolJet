/**
 * SPEC — Table — variants/image.
 *
 * FOR AI: covers the `image` COLUMN TYPE of the Table widget end to end —
 * creation / type switching, the shared column controls, the two image-only
 * style controls, the THREE absences that define the type (no Text color, no
 * Cell color, no Make editable) and the rendered cell contract.
 * Source root: frontend/src/AppBuilder/RightSideBar/Inspector/Components/Table/
 * (`columns` is declared bare as `type:'array'` at table.js:44, so NONE of these
 * controls live in the widget config — they live in the ColumnManager).
 *
 * ── WHY THE SEED `photo` COLUMN AND NOT A SEEDED DATASET ────────────────────
 * The shipped `columns` default already contains a fully configured, data-bound
 * image column — { name:'photo', key:'photo', columnType:'image',
 * objectFit:'contain', borderRadius:'100' } (table.js:726-735) — pointed at the
 * seed rows' real image URLs (table.js:692). Driving THAT column means every
 * assertion runs against shipped defaults and simultaneously proves `image` is
 * the shipped type for that column, so no setTableData round-trip is needed.
 * Column creation / deletion get their own it-block, where creation itself is
 * what is under test. NOTE: the <img> src is an external URL; nothing here
 * depends on the image LOADING — `src`, `object-fit` and `border-radius` are all
 * written inline by ImageRenderer.jsx:35-45 regardless of the network.
 *
 * ── WHAT MAKES `image` DIFFERENT FROM EVERY OTHER TYPE ──────────────────────
 *  · It is one of the two NEVER-EDITABLE types: PropertiesTabElements.jsx:385
 *    gates the whole "Make editable" card on
 *    `!['image','link','button'].includes(columnType)`, and the column manager
 *    hard-writes `isEditable:'{{false}}'` for it (useListItemManager.js:126-128,
 *    :170) so even "Make all columns editable" cannot force it on.
 *  · Because it is never editable, ValidationProperties never mounts at all.
 *  · It is the ONLY type excluded from BOTH shared colour controls — the shared
 *    block at StylesTabElements.jsx:128-145 does not list 'image', so neither
 *    "Text color" nor "Cell color" is rendered.
 *  · The Styles-tab alignment label reads "Alignment", not "Text Alignment"
 *    (StylesTabElements.jsx:32-34, shared with boolean/rating).
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
 * ── PRODUCT BUGS / SOURCE QUIRKS HONOURED HERE ──────────────────────────────
 *  F9 (INFO) image adds NO discriminating <td> class (TableRow.jsx:107-142 lists
 *      no `image` branch), so `tableText.cellClassByType.image` is null. What the
 *      type DOES change is the cell CONTAINER: TableRow.jsx:167-170 swaps the
 *      usual `td-container w-100 h-100` for `td-container jet-table-image-column
 *      h-100`. That container class is the type discriminator used below.
 *  F19       the column-list data-cy is NOT normalised (Table.jsx:571
 *      interpolates the raw display name), so all helpers use `columnListItem`
 *      rather than the older normalising `tableSelector.columnItem`.
 *  Image fit — the Select is mounted with a `meta` that carries no displayName
 *      (StylesTabElements.jsx:84-92), so Select.jsx:85-87 falls back to the
 *      NON-UNIQUE `dropdown-common`. It is therefore driven through its wrapper
 *      `input-and-label-object-fit` (:82) by the local `setImageFit` below rather
 *      than by that data-cy. (Candidate for a real helper — see resolve_live.)
 *
 * Helpers (all resolved through cypress/support/componentAutomation/type-helper-index.md):
 *   components/table.js — resizeTableWidget, openColumnPopover, closeColumnPopover,
 *     switchColumnTab, setColumnType, addColumnOfType, deleteColumn,
 *     verifyAndEnterColumnOptionInput, setColumnCodeField, verifyColumnCodeField,
 *     setColumnProperty, verifyColumnProperty, toggleColumnFx, setColumnAlignment,
 *     setPinPosition, verifyCellType, makeAllColumnsEditable
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
  toggleColumnFx,
  setColumnAlignment,
  setPinPosition,
  verifyCellType,
  makeAllColumnsEditable,
} from "Support/utils/appBuilder/components/table";
import { openEditorSidebar } from "Support/utils/appBuilder/properties";
import { resizeQueryPanel } from "Support/utils/appBuilder/querymanager/queryPanel";

// testIsolation:false — cypress-real-dnd caches its CDP client for the spec run;
// testIsolation's per-test AUT reset leaves that client stale, so 2nd+ test drags
// throw "No dragIntercepted". Keeping the AUT stable across tests keeps the drag
// intercept valid. Each test still re-logs-in + creates its own app in beforeEach,
// so shared browser state is not relied upon.
describe("Table — variants/image column type", { testIsolation: false }, () => {
  const W = tableText.defaultWidgetName; // 'table1'
  const C = tableText.variantImageColumn; // 'photo' — source: table.js:727

  // The "Image fit" Select has no displayName in its meta, so its own data-cy is the
  // non-unique `dropdown-common` (Select.jsx:85-87); its menu is portalled to
  // document.body (SelectComponent.jsx:83) and its options carry the shared
  // `.react-select__option` class (SelectComponent.jsx:85). Reaching it through its
  // wrapper + matching the option by exact text is the only unambiguous path — the
  // same shape the shipped setTimeZone/setDateFormat helpers use.
  const setImageFit = (optionLabel) => {
    cy.get(tableSelector.columnObjectFitField)
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
    cy.apiCreateApp(`${fake.companyName}-Table-Image-Column`); // dynamic: fake
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

  it("column type — the seed `photo` column ships as `image` and the type can be switched away and back", () => {
    openColumnPopover(C);
    // SelectComponent.jsx:52 resolves the raw stored value ('image') back to its
    // option, so the react-select SingleValue renders the option LABEL.
    cy.get(tableSelector.columnPopover)
      .find(tableSelector.columnTypeSelect)
      .should("contain.text", tableText.columnTypeLabel.image); // source: PropertiesTabElements.jsx:133
    closeColumnPopover(C);

    cy.forceClickOnCanvas();
    cy.get(tableSelector.cell(C, 0, W)).scrollIntoView();
    // F9: image adds no <td> class, so the discriminators are the cell CONTAINER
    // class (TableRow.jsx:167-170) and the <img> the renderer emits.
    cy.get(tableSelector.cellImageContainer(C, 0, W)).should("have.length", 1); // source: TableRow.jsx:167-169
    cy.get(tableSelector.cellImage(C, 0, W)).should(
      "have.attr",
      "src",
      tableText.variantImageRow0Src
    ); // source: table.js:692

    // Switch to `string`: the textarea renderer takes over, the <img> is gone and the
    // raw URL is rendered as text instead.
    setColumnType(C, tableText.columnTypeValue.string); // source: PropertiesTabElements.jsx:125
    closeColumnPopover(C);
    cy.forceClickOnCanvas();
    verifyCellType(C, 0, tableText.cellClassByType.string, W); // source: TableRow.jsx:132
    cy.get(tableSelector.cellImage(C, 0, W)).should("not.exist"); // source: ImageRenderer.jsx:35
    cy.get(tableSelector.cell(C, 0, W)).should(
      "contain.text",
      tableText.variantImageRow0Src
    ); // source: table.js:692

    // …and back to `image`, which restores the <img> renderer and its container.
    setColumnType(C, tableText.columnTypeValue.image); // source: PropertiesTabElements.jsx:133
    closeColumnPopover(C);
    cy.forceClickOnCanvas();
    cy.get(tableSelector.cell(C, 0, W)).should(
      "not.have.class",
      tableText.cellClassByType.string
    ); // source: TableRow.jsx:132
    cy.get(tableSelector.cellImage(C, 0, W)).should(
      "have.attr",
      "src",
      tableText.variantImageRow0Src
    ); // source: table.js:692
  });

  it("column manager — an `image` column can be added, bound to a key and deleted", () => {
    // addColumnOfType sets the TYPE first (so type-specific fields mount), then the
    // name, then the key — the key is what the row data is read from
    // (generateColumnsData.js:163 accessorKey = column.key || column.name).
    addColumnOfType(
      tableText.variantNewImageColumn,
      tableText.columnTypeValue.image, // source: PropertiesTabElements.jsx:133
      tableText.variantImageColumnKey // source: table.js:728
    );
    closeColumnPopover(tableText.variantNewImageColumn);

    cy.forceClickOnCanvas();
    cy.get(tableSelector.columnHeader(tableText.variantNewImageColumn))
      .scrollIntoView()
      .should("have.text", tableText.variantNewImageColumn); // source: TableHeader.jsx:153
    // Bound to the seed `photo` key, so it renders the same image as the seed column.
    cy.get(tableSelector.cellImage(tableText.variantNewImageColumn, 0, W)).should(
      "have.attr",
      "src",
      tableText.variantImageRow0Src
    ); // source: table.js:692

    // deleteColumn drives the popover header's [title="Delete column"] and asserts
    // BOTH the inspector row and the rendered header are gone.
    deleteColumn(tableText.variantNewImageColumn); // source: ColumnPopover.jsx:130-138
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // SHARED PROPERTIES (Properties tab)
  // ═══════════════════════════════════════════════════════════════════════════

  it("properties — Column name renames the rendered column, Key rebinds its data", () => {
    openColumnPopover(C);
    verifyColumnCodeField(tableSelector.columnNameField, C); // source: PropertiesTabElements.jsx:164-181
    verifyColumnCodeField(
      tableSelector.columnKeyField,
      tableText.variantImageColumnKey
    ); // source: PropertiesTabElements.jsx:182-197

    // Renaming re-keys the rendered header AND every cell data-cy, because both are
    // derived from `columnDef.header` = the resolved column name
    // (generateColumnsData.js:165 → TableHeader.jsx:153 / TableRow.jsx:102-105).
    verifyAndEnterColumnOptionInput(
      tableText.labelColumnName,
      tableText.variantRenamedImageColumn
    ); // source: PropertiesTabElements.jsx:166
    closeColumnPopover(tableText.variantRenamedImageColumn);
    cy.forceClickOnCanvas();
    cy.get(tableSelector.columnHeader(tableText.variantRenamedImageColumn))
      .scrollIntoView()
      .should("have.text", tableText.variantRenamedImageColumn); // source: TableHeader.jsx:153
    cy.get(
      tableSelector.cellImage(tableText.variantRenamedImageColumn, 0, W)
    ).should("have.attr", "src", tableText.variantImageRow0Src); // source: table.js:692

    // The Key is the accessor: pointing it at a key no row carries makes cellValue
    // undefined, and ImageRenderer returns null BEFORE rendering anything (:25-27),
    // so the whole <img> disappears while the cell itself stays.
    openColumnPopover(tableText.variantRenamedImageColumn);
    verifyAndEnterColumnOptionInput(
      tableText.labelKey,
      tableText.variantMissingKey
    ); // source: PropertiesTabElements.jsx:183
    closeColumnPopover(tableText.variantRenamedImageColumn);
    cy.forceClickOnCanvas();
    // The cell and its image container survive — only the <img> is dropped.
    cy.get(
      tableSelector.cellImageContainer(tableText.variantRenamedImageColumn, 0, W)
    )
      .scrollIntoView()
      .should("have.length", 1); // source: TableRow.jsx:167-169
    cy.get(
      tableSelector.cellImage(tableText.variantRenamedImageColumn, 0, W)
    ).should("not.exist"); // source: ImageRenderer.jsx:25-27

    // Pointing it back at `photo` restores the image — the positive half of the same
    // proof.
    openColumnPopover(tableText.variantRenamedImageColumn);
    verifyAndEnterColumnOptionInput(
      tableText.labelKey,
      tableText.variantImageColumnKey
    ); // source: PropertiesTabElements.jsx:183
    closeColumnPopover(tableText.variantRenamedImageColumn);
    cy.forceClickOnCanvas();
    cy.get(
      tableSelector.cellImage(tableText.variantRenamedImageColumn, 0, W)
    ).should("have.attr", "src", tableText.variantImageRow0Src); // source: table.js:692
  });

  it("properties — Transformation rewrites the rendered image source", () => {
    openColumnPopover(C);
    verifyColumnCodeField(
      tableSelector.columnTransformationField,
      tableText.defaultTransformation
    ); // source: PropertiesTabElements.jsx:205

    // columnSlice.js:99 deliberately DROPS a transformation equal to '{{cellValue}}',
    // so only a real expression reaches transformTableData.js:33, which rewrites the
    // row's value for this key before ImageRenderer ever sees it — and the renderer
    // pipes that value straight into `src` (ImageRenderer.jsx:36).
    setColumnCodeField(
      tableSelector.columnTransformationField,
      tableText.variantTransformationUpper
    ); // source: PropertiesTabElements.jsx:200-218
    closeColumnPopover(C);

    cy.forceClickOnCanvas();
    cy.get(tableSelector.cell(C, 0, W)).scrollIntoView();
    cy.get(tableSelector.cellImage(C, 0, W)).should(
      "have.attr",
      "src",
      tableText.variantImageRow0SrcUpper
    ); // source: transformTableData.js:33
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

  it("properties — Make editable is NOT offered, and `Make all columns editable` cannot force it on", () => {
    openColumnPopover(C);
    // PropertiesTabElements.jsx:385 gates the entire "Make editable" card — toggle AND
    // the ValidationProperties block it wraps — on
    // `!['image','link','button'].includes(columnType)`.
    cy.get(tableSelector.makeEditableToggle).should("not.exist"); // source: PropertiesTabElements.jsx:385-400
    cy.get(tableSelector.columnValidationSection).should("not.exist"); // source: PropertiesTabElements.jsx:401-412
    // The sibling Visibility toggle from the same tab (:449-466) IS mounted, which
    // proves the Properties tab rendered and the absence above is a real carve-out.
    cy.get(tableSelector.columnParamToggle(tableText.labelVisibility)).should(
      "have.length",
      1
    ); // source: PropertiesTabElements.jsx:449-466
    closeColumnPopover(C);

    // useListItemManager.setAllEditable hard-writes `isEditable:'{{false}}'` for every
    // nonEditableType (:170, with nonEditableTypes ['link','image'] from
    // useColumnManager.js:108), so the table-level toggle CANNOT make an image column
    // editable — while a plain string sibling does flip.
    makeAllColumnsEditable(); // source: Table.jsx:639-655
    cy.forceClickOnCanvas();
    cy.get(tableSelector.cell(C, 0, W))
      .scrollIntoView()
      .should("not.have.class", tableText.cellClassEditable); // source: useListItemManager.js:126-128,:170
    cy.get(
      tableSelector.cell(tableText.variantEditableSiblingColumn, 0, W)
    ).should("have.class", tableText.cellClassEditable); // source: TableRow.jsx:135
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // TYPE-SPECIFIC STYLES (Styles tab)
  // ═══════════════════════════════════════════════════════════════════════════

  it("styles — the alignment label reads `Alignment` for image and moves the rendered image", () => {
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
    ); // source: ImageRenderer.jsx:31-33
  });

  it("styles — Border radius reaches the rendered <img> as real CSS", () => {
    openColumnPopover(C);
    switchColumnTab(tableText.columnTabStyles); // source: ColumnPopover.jsx:157
    // The wrapper carries the data-cy but its CodeHinter is mounted with no
    // paramLabel, so it is reached container-scoped (SingleLineCodeEditor.jsx:561).
    verifyColumnCodeField(
      tableSelector.columnBorderRadiusField,
      tableText.variantDefaultBorderRadius
    ); // source: table.js:733
    closeColumnPopover(C);

    // ImageRenderer.jsx:42 appends 'px' to the raw string, so the shipped '100'
    // renders as a fully round avatar.
    cy.forceClickOnCanvas();
    cy.get(tableSelector.cellImage(C, 0, W))
      .scrollIntoView()
      .should("have.css", "border-radius", tableText.variantDefaultBorderRadiusCss); // source: ImageRenderer.jsx:42

    openColumnPopover(C);
    switchColumnTab(tableText.columnTabStyles); // source: ColumnPopover.jsx:157
    setColumnCodeField(
      tableSelector.columnBorderRadiusField,
      tableText.variantBorderRadius
    ); // source: StylesTabElements.jsx:69-81
    closeColumnPopover(C);

    cy.forceClickOnCanvas();
    cy.get(tableSelector.cellImage(C, 0, W))
      .scrollIntoView()
      .should("have.css", "border-radius", tableText.variantBorderRadiusCss); // source: ImageRenderer.jsx:42
  });

  it("styles — Image fit switches the rendered object-fit", () => {
    openColumnPopover(C);
    switchColumnTab(tableText.columnTabStyles); // source: ColumnPopover.jsx:157
    // SelectComponent.jsx:52 resolves the stored value back to its option, so the
    // control renders the option LABEL for the shipped 'contain'.
    cy.get(tableSelector.columnObjectFitField).should(
      "contain.text",
      tableText.variantDefaultObjectFitLabel
    ); // source: table.js:732 + StylesTabElements.jsx:89
    closeColumnPopover(C);

    cy.forceClickOnCanvas();
    cy.get(tableSelector.cellImage(C, 0, W))
      .scrollIntoView()
      .should("have.css", "object-fit", tableText.variantDefaultObjectFit); // source: ImageRenderer.jsx:43

    openColumnPopover(C);
    switchColumnTab(tableText.columnTabStyles); // source: ColumnPopover.jsx:157
    setImageFit(tableText.variantObjectFitCoverLabel); // source: StylesTabElements.jsx:82-103
    closeColumnPopover(C);

    // objectFit lands verbatim as the inline CSS object-fit.
    cy.forceClickOnCanvas();
    cy.get(tableSelector.cellImage(C, 0, W))
      .scrollIntoView()
      .should("have.css", "object-fit", tableText.variantObjectFitCover); // source: ImageRenderer.jsx:43
  });

  it("styles — neither Text color nor Cell color is offered for an image column", () => {
    openColumnPopover(C);
    switchColumnTab(tableText.columnTabStyles); // source: ColumnPopover.jsx:157

    // The shared colour block at StylesTabElements.jsx:128-145 lists thirteen column
    // types and 'image' is NOT one of them, so BOTH colour controls it owns are
    // absent — image is the only type that loses the cell background as well as the
    // text colour. (`link` re-adds its own pair at :180-220 under the same wrappers;
    // image re-adds nothing.)
    cy.get(tableSelector.columnTextColorField).should("not.exist"); // source: StylesTabElements.jsx:128-148
    cy.get(tableSelector.columnCellColorField).should("not.exist"); // source: StylesTabElements.jsx:128-163
    cy.get(tableSelector.columnColorPicker(tableText.labelCellColor)).should(
      "not.exist"
    ); // source: StylesTabElements.jsx:165
    // …while the two image-only controls ARE mounted, which proves the tab rendered.
    cy.get(tableSelector.columnBorderRadiusField).should(
      "contain.text",
      tableText.labelBorderRadius
    ); // source: StylesTabElements.jsx:69-70
    cy.get(tableSelector.columnObjectFitField).should(
      "contain.text",
      tableText.labelImageFit
    ); // source: StylesTabElements.jsx:82-83
    closeColumnPopover(C);
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // CELL RENDERING CONTRACT
  // ═══════════════════════════════════════════════════════════════════════════

  it("cell rendering — an image cell carries no type class (F9) but a `jet-table-image-column` container", () => {
    cy.forceClickOnCanvas();
    cy.get(tableSelector.cell(C, 0, W)).scrollIntoView();
    // F9 (INFO): TableRow.jsx:107-142 has no `image` branch, so the <td> is a plain
    // `table-cell td` — none of the type classes other renderers get apply here.
    cy.get(tableSelector.cell(C, 0, W))
      .should("not.have.class", tableText.cellClassByType.string) // source: TableRow.jsx:132
      .and("not.have.class", tableText.cellClassByType.text) // source: TableRow.jsx:118
      .and("not.have.class", tableText.cellClassByType.link) // source: TableRow.jsx:129
      .and("not.have.class", tableText.cellClassEditable); // source: TableRow.jsx:135 (never editable)

    // The container IS type-aware: TableRow.jsx:167-170 gives an image cell
    // `td-container jet-table-image-column h-100` and every other type
    // `td-container w-100 h-100`. Asserting both sides pins the branch.
    cy.get(tableSelector.cellImageContainer(C, 0, W)).should("have.length", 1); // source: TableRow.jsx:167-169
    cy.get(
      tableSelector.cellImageContainer(
        tableText.variantEditableSiblingColumn,
        0,
        W
      )
    ).should("not.exist"); // source: TableRow.jsx:170
    cy.get(tableSelector.cellImage(C, 0, W)).should(
      "have.attr",
      "src",
      tableText.variantImageRow0Src
    ); // source: ImageRenderer.jsx:36
  });
});
