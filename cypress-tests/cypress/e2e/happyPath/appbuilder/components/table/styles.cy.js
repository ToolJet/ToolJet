/**
 * SPEC — Table — styles facet.
 *
 * FOR AI: covers ALL 17 entries of `config.styles`
 * (frontend/src/AppBuilder/WidgetManager/widgets/table.js:373-537), ONE it() per
 * `accordian` group:
 *   1. "Column Header" (4) — columnTitleColor, columnHeaderWrap, headerCasing,
 *                            columnBackgroundColor
 *   2. "Data"          (8) — textColor, selectedRowColor, tableType, cellSize,
 *                            contentWrap, maxRowHeight, maxRowHeightValue,
 *                            actionButtonRadius
 *   3. "Container"     (5) — containerBackgroundColor, borderRadius, borderColor,
 *                            boxShadow, padding
 *
 * WHICH ELEMENT EACH STYLE LANDS ON (resolved statically from the NewTable
 * renderer — `shared.cssPropertyMap` in surface-cache.json has NO table entries):
 *   columnTitleColor        -> <th> inline `color`          (TableHeader.jsx:79)
 *   columnBackgroundColor   -> <th> inline `background-color` (TableHeader.jsx:78)
 *   columnHeaderWrap        -> <th> inline `white-space` + `wrap-wrapper` /
 *                              `text-truncate` class on the header-text div
 *                              (TableHeader.jsx:74,150-151)
 *   headerCasing            -> header-text div inline `text-transform`
 *                              (TableHeader.jsx:155)
 *   textColor               -> cell content div inline `color`
 *                              (useTextColor.js:7 -> StringRenderer.jsx:207)
 *   selectedRowColor        -> `--cc-table-selected-row-bg` on the widget card
 *                              (Table.jsx:365), consumed by `.table-row.selected`
 *                              (_styles/table-component.scss:211-214)
 *   tableType               -> `<table class="table ${rowStyle}">`
 *                              (initSlice.js:133 + TableData.jsx:184)
 *   cellSize                -> row inline `height` + `table-row-condensed` class
 *                              (initSlice.js:134, TableData.jsx:63-79, TableRow.jsx:47)
 *   contentWrap             -> row inline `max-height` (TableData.jsx:71-79)
 *   maxRowHeight            -> row inline `max-height` auto|custom (TableData.jsx:72)
 *   maxRowHeightValue       -> row inline `max-height` in px (TableData.jsx:72)
 *   actionButtonRadius      -> action <button> inline `border-radius`
 *                              (ActionButtons.jsx:34)
 *   containerBackgroundColor/borderRadius/borderColor/boxShadow
 *                           -> widget CARD inline styles (Table.jsx:355-359)
 *   padding                 -> widget OUTER box `padding`, 2px vs 0px
 *                              (RenderWidget.jsx:320 + appCanvasConstants.js:57)
 *
 * TWO-NODE CAVEAT: `draggable-widget-table1` matches TWO elements — the outer
 * RenderWidget canvas-component box (RenderWidget.jsx:316-323, first in DOM) and
 * the inner Table card div (Table.jsx:344). They carry DIFFERENT styles, so every
 * container assertion goes through tableSelector.widgetOuterBox (:eq(0)) or
 * tableSelector.widgetCard (:eq(1)) — never a bare cy.get().
 *
 * DEFAULTS: colour defaults are theme design TOKENS (`var(--cc-*)`), whose resolved
 * hex depends on the workspace theme and is therefore not assertable from source.
 * The picker's value row renders the token NAME instead
 * (BaseColorSwatches/index.jsx:146-157), which IS derivable — that is what the
 * default assertions below read. Non-colour defaults are asserted on the rendered
 * DOM. Every applied (non-default) colour is a test literal -> `// dynamic`.
 *
 * ACCORDION SCOPING: every styles accordion ships OPEN (Accordion/index.js passes
 * `open={isOpen}`; AccordionItem.js:5 defaults it to true), so all three groups'
 * controls coexist in the DOM. Two option labels collide across groups ("None" is
 * Overflow/fixed AND Padding/none), so the Padding click is scoped through
 * tableSelector.styleAccordionBody("Container").
 *
 * Helpers: openEditorSidebar, verifyAndModifySwitch, selectFromSidebarDropdown,
 * addValueOnInput, selectColourFromColourPicker, verifyWidgetColorCss,
 * fillBoxShadowParams, verifyBoxShadowCss, resizeTableWidget,
 * toggleTableProperty, resizeQueryPanel — all routed through
 * cypress/support/componentAutomation/type-helper-index.md.
 *
 * NOTE: checkPaddingOfContainer is NOT usable here — it asserts on
 * `.parents('[role=Box]')` (styles.js:279-283), a Container-widget-only wrapper the
 * Table has no equivalent of. The padding assertion targets the widget's own outer
 * box instead, which is where RenderWidget.jsx:320 actually writes it.
 */
import { fake } from "Fixtures/fake";
import { commonWidgetSelector } from "Selectors/common";
import { commonWidgetText } from "Texts/common";
import { tableText } from "Texts/appBuilder/components/table";
import { tableSelector } from "Selectors/appBuilder/components/table";
import {
  resizeTableWidget,
  toggleTableProperty,
} from "Support/utils/appBuilder/components/table";
import {
  openEditorSidebar,
  verifyAndModifySwitch,
  selectFromSidebarDropdown,
  addValueOnInput,
} from "Support/utils/appBuilder/properties";
import {
  selectColourFromColourPicker,
  verifyWidgetColorCss,
  fillBoxShadowParams,
  verifyBoxShadowCss,
} from "Support/utils/appBuilder/styles";
import { resizeQueryPanel } from "Support/utils/appBuilder/querymanager/queryPanel";

// testIsolation:false — cypress-real-dnd caches its CDP client for the spec run;
// testIsolation's per-test AUT reset leaves that client stale, so 2nd+ test drags
// throw "No dragIntercepted". Keeping the AUT stable across tests keeps the drag
// intercept valid. Each test still re-logs-in + creates its own app in beforeEach,
// so shared browser state is not relied upon.
describe("Table — styles facet", { testIsolation: false }, () => {
  const W = tableText.defaultWidgetName; // runtimeCandidate: 'table1'

  // Re-open the right Inspector on its Styles tab. Needed before EVERY style
  // control: selectColourFromColourPicker (styles.js:76) and verifyWidgetColorCss
  // (styles.js:196) both end/begin with a canvas click, which clears the canvas
  // selection and closes the Inspector.
  const openStyles = () => {
    openEditorSidebar(W);
    cy.get(commonWidgetSelector.buttonStylesEditorSideBar).click();
  };

  // Re-open the right Inspector on its Properties tab (a few style effects only
  // become observable once a PROPERTY is flipped — e.g. selectedRowColor needs
  // `highlightSelectedRow`, actionButtonRadius needs a non-empty `actions`).
  const openProperties = () => {
    openEditorSidebar(W);
    cy.get(tableSelector.inspectorPropertiesTab).click();
  };

  // beforeEach mirrors the proven-green table harness shared by inspector.cy.js /
  // events.cy.js / csa.cy.js: widen the viewport and canvas, close the left
  // settings panel, grow the table (several style effects — header wrap, row
  // height, action-button column — are only observable once the table has real
  // width) and collapse the query panel out of the way.
  // NOTE: there is no `waitForDropSettle` helper in this repo — `dragAndDropWidget`
  // already ends in `cy.waitForAutoSave()`, and the resize steps below are the settle.
  beforeEach(() => {
    cy.apiLogin();
    cy.apiCreateApp(`${fake.companyName}-table-styles-App`);
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
  // 1. accordian "Column Header" — 4 styles (table.js:373-405)
  // ═══════════════════════════════════════════════════════════════════════════
  it("Column Header accordian — columnTitleColor, columnHeaderWrap, headerCasing, columnBackgroundColor", () => {
    // ── columnTitleColor (colorSwatches, "Column title") ────────────────────
    // ⚠ CONFIG BUG #1: the field's `validation.defaultValue` is
    // 'var(--cc-placeholder-text)' (table.js:377) but `definition.styles`
    // ships 'var(--cc-primary-text)' (table.js:852). The DEFINITION is what the
    // widget actually drops with (the validation default is only a fallback for a
    // missing definition entry), so the picker reads Text/Primary — asserted here
    // so the mismatch is pinned by a test rather than by a comment.
    openStyles();
    cy.get(commonWidgetSelector.stylePickerValue(tableText.styleColumnTitle))
      .scrollIntoView()
      .should("have.text", tableText.colorTokenTextPrimary); // source: table.js:852

    selectColourFromColourPicker(tableText.styleColumnTitle, [
      "255",
      "0",
      "0",
      "100",
    ]); // dynamic: test colour
    // TableHeader.jsx:79 writes `color` on the <th>; the `<col>-column-header`
    // div inside it sets only text-transform/text-align, so it INHERITS the
    // colour — verifyWidgetColorCss falls back to the computed value there.
    verifyWidgetColorCss(
      tableSelector.columnHeader(tableText.id),
      "color",
      ["255", "0", "0", "100"],
      true
    ); // dynamic: test colour

    // ── columnHeaderWrap (switch, "Overflow") ───────────────────────────────
    // Default 'fixed' (table.js:857) -> whiteSpace 'nowrap' on the <th>
    // (TableHeader.jsx:74) + `text-truncate` on the header-text div (:150).
    openStyles();
    cy.get(tableSelector.columnHeaderCell(W))
      .first()
      .should("have.css", "white-space", "nowrap"); // source: table.js:857
    cy.get(tableSelector.columnHeader(tableText.id)).should(
      "have.class",
      "text-truncate"
    ); // source: table.js:857

    verifyAndModifySwitch(tableText.styleOverflow, tableText.styleOverflowWrap); // source: table.js:387
    cy.get(tableSelector.columnHeaderCell(W))
      .first()
      .should("have.css", "white-space", "normal"); // TableHeader.jsx:74
    cy.get(tableSelector.columnHeader(tableText.id)).should(
      "have.class",
      "wrap-wrapper"
    ); // TableHeader.jsx:151

    // Restore 'fixed' so the header geometry the later assertions read is the
    // shipped one.
    verifyAndModifySwitch(tableText.styleOverflow, tableText.styleOverflowNone); // source: table.js:386
    cy.get(tableSelector.columnHeader(tableText.id)).should(
      "have.class",
      "text-truncate"
    );

    // ── headerCasing (switch, "Header casing") ──────────────────────────────
    // Default 'none' (table.js:858) -> textTransform 'none' (TableHeader.jsx:155).
    cy.get(tableSelector.columnHeader(tableText.id)).should(
      "have.css",
      "text-transform",
      "none"
    ); // source: table.js:858

    verifyAndModifySwitch(
      tableText.styleHeaderCasing,
      tableText.styleHeaderCasingUppercase
    ); // source: table.js:397
    cy.get(tableSelector.columnHeader(tableText.id)).should(
      "have.css",
      "text-transform",
      "uppercase"
    ); // TableHeader.jsx:155

    // ── columnBackgroundColor (colorSwatches, "Background") ─────────────────
    // ⚠ CONFIG BUG #2: `validation.defaultValue` is 'var(--cc-surface2-surface)'
    // (table.js:403) while `definition.styles` ships 'var(--cc-surface1-surface)'
    // (table.js:853). Definition wins -> the picker reads Surface/Surface1.
    // "Background" is declared TWICE (columnBackgroundColor here, and
    // containerBackgroundColor at table.js:501), so both the value row and the
    // picker are indexed: eq(0) = Column Header, eq(1) = Container (config order).
    openStyles();
    cy.get(commonWidgetSelector.stylePickerValue(tableText.styleBackground))
      .eq(0)
      .scrollIntoView()
      .should("have.text", tableText.colorTokenSurface1); // source: table.js:853

    selectColourFromColourPicker(
      tableText.styleBackground,
      ["0", "0", "255", "100"], // dynamic: test colour
      0,
      undefined,
      0 // hasIndex 0 -> the Column Header "Background" picker
    );
    verifyWidgetColorCss(
      tableSelector.columnHeaderCell(W),
      "background-color",
      ["0", "0", "255", "100"],
      true
    ); // dynamic: test colour — TableHeader.jsx:78 (same inline style on every <th>)
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // 2. accordian "Data" — 8 styles (table.js:406-500)
  // ═══════════════════════════════════════════════════════════════════════════
  it("Data accordian — textColor, selectedRowColor, tableType, cellSize, contentWrap, maxRowHeight, maxRowHeightValue, actionButtonRadius", () => {
    // ── textColor (colorSwatches, "Text") ───────────────────────────────────
    openStyles();
    cy.get(commonWidgetSelector.stylePickerValue(tableText.styleText))
      .scrollIntoView()
      .should("have.text", tableText.colorTokenTextPrimary); // source: table.js:855

    selectColourFromColourPicker(tableText.styleText, [
      "255",
      "0",
      "0",
      "100",
    ]); // dynamic: test colour
    // useTextColor.js:7 hands the table-level textColor to every column adapter,
    // which passes it to StringRenderer -> inline `color` on the cell content div
    // (StringRenderer.jsx:207). The <td> itself carries no colour.
    // `cellContentNode`, NOT `cellContent`: the latter is `<td> div`, which matches
    // EVERY nested div in the cell, and verifyWidgetColorCss reads $el[0] — the
    // outermost wrapper, which carries no inline colour and computes to inherited
    // black. That is exactly why this assertion failed with
    // "expected [rgb, rgba] to include 'rgb(0, 0, 0)'". `cellContentNode` is
    // `div:not(:has(div))`, i.e. the DEEPEST div, which is the node StringRenderer
    // writes the inline `color` onto (StringRenderer.jsx:203-208).
    verifyWidgetColorCss(
      tableSelector.cellContentNode(tableText.name, 0, W),
      "color",
      ["255", "0", "0", "100"],
      true
    ); // dynamic: test colour

    // ── selectedRowColor (colorSwatches, "Selected row") ────────────────────
    // The colour is written as `--cc-table-selected-row-bg` on the widget card
    // (Table.jsx:365) and only PAINTS through `.table-row.selected`
    // (_styles/table-component.scss:211-213). TableRow.jsx:46 adds `selected` only
    // when allowSelection && highlightSelectedRow && row.getIsSelected(), and
    // `highlightSelectedRow` drops as {{false}} (table.js:831) — so flip it on
    // first, otherwise the style has no observable surface at all.
    openProperties();
    toggleTableProperty(tableText.toggleHighlightSelectedRow); // source: table.js:831

    openStyles();
    cy.get(commonWidgetSelector.stylePickerValue(tableText.styleSelectedRow))
      .scrollIntoView()
      .should("have.text", tableText.colorTokenSurface2); // source: table.js:856

    selectColourFromColourPicker(tableText.styleSelectedRow, [
      "0",
      "128",
      "0",
      "100",
    ]); // dynamic: test colour
    // CORRECTION (runtime-verified): do NOT click row 0 here. The comment that
    // used to sit in this spot claimed defaultSelectedRow drives only the
    // `selectedRow` exposed variable and not tanstack's row-selection state.
    // That is wrong — TableExposedVariables.jsx:257-262 calls
    // `setRowSelection({ [index]: true })` for the row matching
    // defaultSelectedRow {{{"id":1}}} (table.js:836), so row 0 is ALREADY
    // selected on mount. Clicking it runs handleRowClick -> `row.toggleSelected()`
    // (TableData.jsx:145), which DEselects it — which is exactly why this
    // assertion failed with "expected <tr.table-row> to have class 'selected'".
    // The default selection is the observable state; assert it directly.
    cy.get(tableSelector.row(0, W)).should("have.class", "selected"); // TableRow.jsx:46
    verifyWidgetColorCss(
      tableSelector.row(0, W),
      "background-color",
      ["0", "128", "0", "100"],
      true
    ); // dynamic: test colour

    // ── tableType (select, "Row style") ─────────────────────────────────────
    // initSlice.js:133 maps tableType -> styles.rowStyle, which TableData.jsx:184
    // stamps as a class on the <table>.
    openStyles();
    cy.get(tableSelector.dataTable(W)).should("have.class", "table-classic"); // source: table.js:863
    selectFromSidebarDropdown(
      tableText.styleRowStyle,
      tableText.styleRowStyleBordered
    ); // source: table.js:429
    cy.forceClickOnCanvas();
    cy.get(tableSelector.dataTable(W)).should("have.class", "table-bordered"); // TableData.jsx:184

    openStyles();
    selectFromSidebarDropdown(
      tableText.styleRowStyle,
      tableText.styleRowStyleStriped
    ); // source: table.js:430
    cy.forceClickOnCanvas();
    cy.get(tableSelector.dataTable(W)).should("have.class", "table-striped"); // TableData.jsx:184

    // ── cellSize (select, "Cell height") ────────────────────────────────────
    // initSlice.js:134 maps cellSize -> styles.cellHeight. With contentWrap still
    // {{false}} (table.js:866) TableData.jsx:75-77 writes a FIXED inline height:
    // DEFAULT_ROW_HEIGHT 46 vs CONDENSED_ROW_HEIGHT 40 (TableData.jsx:14-15).
    cy.get(tableSelector.row(0, W)).should(
      "have.css",
      "height",
      tableText.defaultRowHeightRegular
    ); // source: table.js:860

    openStyles();
    selectFromSidebarDropdown(
      tableText.styleCellHeight,
      tableText.styleCellHeightCondensed
    ); // source: table.js:443
    cy.forceClickOnCanvas();
    cy.get(tableSelector.row(0, W))
      .should("have.class", "table-row-condensed") // TableRow.jsx:47
      .and("have.css", "height", tableText.rowHeightCondensed); // TableData.jsx:14

    // Restore 'regular': TableRowHeightInput.jsx:9-10 derives its minimum from
    // cellSize (39 condensed / 45 regular), and the maxRowHeightValue assertion
    // further down reads that clamped minimum.
    openStyles();
    selectFromSidebarDropdown(
      tableText.styleCellHeight,
      tableText.styleCellHeightRegular
    ); // source: table.js:442
    cy.forceClickOnCanvas();
    cy.get(tableSelector.row(0, W)).should(
      "have.css",
      "height",
      tableText.defaultRowHeightRegular
    );

    // ── contentWrap (toggle, showLabel:false / toggleLabel "Content wrap") ──
    // Default {{false}} (table.js:866). With it OFF the row gets a fixed height;
    // with it ON TableData.jsx:71-73 swaps to maxHeight 'fit-content' and drops
    // the fixed height entirely. Read the INLINE style (what React wrote) rather
    // than a computed keyword, so the assertion is exact.
    openStyles();
    cy.get(tableSelector.toggleButton(tableText.styleContentWrapParam))
      .scrollIntoView()
      .should("not.be.checked"); // source: table.js:866
    cy.get(tableSelector.toggleButton(tableText.styleContentWrapParam)).click({
      force: true,
    });
    cy.waitForAutoSave();
    cy.get(tableSelector.row(0, W)).should(($tr) => {
      expect($tr[0].style.maxHeight).to.eq("fit-content"); // TableData.jsx:72
      expect($tr[0].style.height).to.eq(""); // TableData.jsx:71-73 sets no height
    });

    // ── maxRowHeight (switch, "Max row height") ─────────────────────────────
    // GATED: `conditionallyRender {contentWrap: true}` (table.js:469-472), honoured
    // for Table by Inspector/Utils.js:173,214-227 — the control simply does not
    // render until contentWrap is ON, which the step above just did.
    // Default 'auto' (table.js:864) -> isMaxRowHeightAuto true (initSlice.js:135)
    // -> maxHeight 'fit-content' (asserted above).
    openStyles();
    verifyAndModifySwitch(
      tableText.styleMaxRowHeight,
      tableText.styleMaxRowHeightCustom
    ); // source: table.js:467
    cy.get(tableSelector.row(0, W)).should(($tr) => {
      // 'custom' switches the row off the auto branch onto `${maxRowHeightValue}px`
      // (TableData.jsx:72). The exact px is asserted next, once the value field
      // (itself gated) has been given a value.
      expect($tr[0].style.maxHeight).to.not.eq("fit-content");
      expect($tr[0].style.maxHeight).to.match(/px$/);
    });

    // ── maxRowHeightValue (tableRowHeightInput, showLabel:false) ────────────
    // DOUBLE-GATED: {maxRowHeight:'custom'} AND {contentWrap:true}
    // (table.js:483-490) — both satisfied by the two steps above.
    // isFxNotRequired:true (table.js:476) so it has NO fx button (that negative is
    // the stylesFx facet's business, not this one).
    // The definition default is {{0}} (table.js:865) but TableRowHeightInput.jsx:5,12
    // clamps the DISPLAYED value up to MIN_TABLE_ROW_HEIGHT_DEFAULT (45) for the
    // 'regular' cellSize restored above.
    openStyles();
    cy.get(
      tableSelector.styleValueInput(tableText.styleMaxRowHeightValueParam)
    )
      .scrollIntoView()
      .should("have.value", tableText.defaultMaxRowHeightValue); // source: table.js:865

    addValueOnInput(tableText.styleMaxRowHeightValueParam, "80"); // dynamic: test height
    // TableRowHeightInput.jsx:17-21 commits on BLUR only, so blur the field itself
    // rather than clicking the canvas (which would close the Inspector first).
    cy.get(
      tableSelector.styleValueInput(tableText.styleMaxRowHeightValueParam)
    ).blur();
    cy.waitForAutoSave();
    cy.get(tableSelector.row(0, W)).should(($tr) => {
      expect($tr[0].style.maxHeight).to.eq("80px"); // TableData.jsx:72
    });

    // Restore contentWrap OFF so the action-button row below renders at the
    // shipped fixed height.
    openStyles();
    cy.get(tableSelector.toggleButton(tableText.styleContentWrapParam)).click({
      force: true,
    });
    cy.waitForAutoSave();

    // ── actionButtonRadius (numberInput, "Action button radius") ────────────
    // `actions` drops as [] (table.js:833) and generateActionColumns.js:75-76 only
    // appends the Actions column for a NON-empty list, so there is no button to
    // style until one is added.
    openProperties();
    cy.get(tableSelector.buttonAddNewAction).scrollIntoView().click(); // Inspector/Components/Table/Table.jsx:698
    cy.waitForAutoSave();
    cy.forceClickOnCanvas();

    // Default '0' (table.js:859) -> parseFloat -> 0 -> React renders '0px'.
    // (initSlice.js:152 also stamps a per-action `actionButtonRadius: 0`, but
    // ActionButtons.jsx:7,34 reads the STYLE, not that field.)
    cy.get(tableSelector.actionButton(W))
      .first()
      .should("have.css", "border-radius", "0px"); // source: table.js:859

    openStyles();
    addValueOnInput(tableText.styleActionButtonRadius, "12"); // dynamic: test radius
    cy.forceClickOnCanvas();
    cy.get(tableSelector.actionButton(W))
      .first()
      .should("have.css", "border-radius", "12px"); // ActionButtons.jsx:34
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // 3. accordian "Container" — 5 styles (table.js:501-537)
  // ═══════════════════════════════════════════════════════════════════════════
  it("Container accordian — containerBackgroundColor, borderRadius, borderColor, boxShadow, padding", () => {
    // ── containerBackgroundColor (colorSwatches, "Background") ──────────────
    // Second "Background" picker in DOM order (Column Header's is first).
    openStyles();
    cy.get(commonWidgetSelector.stylePickerValue(tableText.styleBackground))
      .eq(1)
      .scrollIntoView()
      .should("have.text", tableText.colorTokenSurface1); // source: table.js:854

    selectColourFromColourPicker(
      tableText.styleBackground,
      ["0", "255", "0", "100"], // dynamic: test colour
      0,
      undefined,
      1 // hasIndex 1 -> the Container "Background" picker
    );
    verifyWidgetColorCss(
      tableSelector.widgetCard(W),
      "background-color",
      ["0", "255", "0", "100"],
      true
    ); // dynamic: test colour — Table.jsx:358

    // ── borderRadius (numberInput, "Border radius") ────────────────────────
    // Table.jsx:355 `borderRadius: Number.parseFloat(borderRadius)` of '6'.
    cy.get(tableSelector.widgetCard(W))
      .scrollIntoView()
      .should("have.css", "border-radius", tableText.defaultBorderRadius); // source: table.js:861

    openStyles();
    addValueOnInput(tableText.styleBorderRadius, "16"); // dynamic: test radius
    cy.forceClickOnCanvas();
    cy.get(tableSelector.widgetCard(W)).should(
      "have.css",
      "border-radius",
      "16px"
    ); // Table.jsx:355

    // ── borderColor (colorSwatches, "Border") ──────────────────────────────
    // ⚠ CONFIG BUG #3: this field declares
    // `validation: { schema: { type: 'string' }, defaultValue: false }`
    // (table.js:516-519) — a BOOLEAN default inside a string schema. The shipped
    // definition default is 'var(--cc-weak-border)' (table.js:862), which is what
    // actually renders, so the bogus `false` is dead config; if it were ever used
    // as the fallback it would fail its own schema.
    openStyles();
    cy.get(commonWidgetSelector.stylePickerValue(tableText.styleBorder))
      .scrollIntoView()
      .should("have.text", tableText.colorTokenBorderWeak); // source: table.js:862

    selectColourFromColourPicker(tableText.styleBorder, [
      "255",
      "0",
      "0",
      "100",
    ]); // dynamic: test colour
    verifyWidgetColorCss(
      tableSelector.widgetCard(W),
      "border-color",
      ["255", "0", "0", "100"],
      true
    ); // dynamic: test colour — Table.jsx:357

    // ── boxShadow (boxShadow, "Box Shadow") ────────────────────────────────
    // Default '0px 0px 0px 0px #00000090' (table.js:867). BoxShadow.jsx:38-48
    // splits that string back into the four popover inputs, so the shipped default
    // is asserted on those (exact, theme-independent) rather than on the computed
    // `box-shadow`, whose alpha (0x90/255) serialises to a rounded decimal.
    openStyles();
    cy.get(commonWidgetSelector.boxShadowColorPicker).scrollIntoView().click(); // opens the popover
    commonWidgetSelector.boxShadowDefaultParam.forEach((param) => {
      cy.get(commonWidgetSelector.boxShadowParamInput(param)).should(
        "have.value",
        "0"
      ); // source: table.js:867
    });

    fillBoxShadowParams(commonWidgetSelector.boxShadowDefaultParam, [
      2, 4, 6, 0,
    ]); // dynamic: test shadow
    selectColourFromColourPicker(
      commonWidgetText.boxShadowColor,
      ["255", "0", "0", "90"], // dynamic: test colour (alpha < 100 -> rgba)
      0
    );
    verifyBoxShadowCss(
      tableSelector.widgetCard(W),
      [255, 0, 0, 90],
      [2, 4, 6, 0],
      "element"
    ); // dynamic — Table.jsx:356

    // ── padding (switch, "Padding") ────────────────────────────────────────
    // RenderWidget.jsx:320 writes this on the OUTER canvas-component box:
    // 'none' -> 0px, anything else -> BOX_PADDING (2, appCanvasConstants.js:57).
    cy.get(tableSelector.widgetOuterBox(W))
      .scrollIntoView()
      .should("have.css", "padding", tableText.defaultWidgetPadding); // source: table.js:868

    openStyles();
    cy.get(commonWidgetSelector.parameterLabel(tableText.stylePadding)).should(
      "have.text",
      tableText.stylePadding
    );
    // NOT verifyAndModifySwitch here: it matches ToggleGroupItems by TEXT and takes
    // the first hit (properties.js:163-170), and "None" is also the label of the
    // Column Header "Overflow" option (table.js:386) which sits EARLIER in the DOM
    // — the shared helper would click that one. Scope to the Container accordion
    // body and use the option's stored value instead.
    cy.get(
      `${tableSelector.styleAccordionBody(
        tableText.styleAccordionContainer
      )} [data-cy="togglr-button-none"]`
    )
      .scrollIntoView()
      .click(); // source: table.js:534 (displayName "None", value 'none')
    cy.waitForAutoSave();
    cy.get(tableSelector.widgetOuterBox(W)).should(
      "have.css",
      "padding",
      tableText.noWidgetPadding
    ); // RenderWidget.jsx:320

    // Flip back to 'Default' — this option label IS unique across the panel.
    verifyAndModifySwitch(
      tableText.stylePadding,
      tableText.stylePaddingDefault
    ); // source: table.js:533
    cy.get(tableSelector.widgetOuterBox(W)).should(
      "have.css",
      "padding",
      tableText.defaultWidgetPadding
    );
  });
});
