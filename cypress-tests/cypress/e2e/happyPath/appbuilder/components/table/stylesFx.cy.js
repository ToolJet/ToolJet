/**
 * SPEC — Table — stylesFx facet.
 *
 * FOR AI: the fx (dynamic-binding) path for EVERY fx-capable entry of
 * `config.styles` (frontend/src/AppBuilder/WidgetManager/widgets/table.js:373-537),
 * ONE it() per `accordian` group — mirroring the sibling `styles.cy.js`:
 *   1. "Column Header" (4 fx) — columnTitleColor, columnHeaderWrap, headerCasing,
 *                               columnBackgroundColor
 *   2. "Data"          (7 fx + 1 NEGATIVE) — textColor, selectedRowColor, tableType,
 *                               cellSize, contentWrap, maxRowHeight,
 *                               actionButtonRadius  ·  NEGATIVE: maxRowHeightValue
 *   3. "Container"     (5 fx) — containerBackgroundColor, borderRadius, borderColor,
 *                               boxShadow, padding
 * 16 fx + 1 negative = 17/17 style entries.
 *
 * WHY A LOCAL FX HARNESS (openStyleFx/verifyFxDefault/applyStyleFx) AND NOT
 * `verifyAndModifyStylePickerFx`:
 *   - that helper asserts `[data-cy="<label>-picker"]` + `[data-cy="<label>-value"]`,
 *     which ONLY the colorSwatches/boxShadow renderers emit
 *     (BaseColorSwatches.jsx:139,146 · BoxShadow.jsx:181,193). The Table's numberInput
 *     (`borderRadius`, `actionButtonRadius` — NumberInput.jsx:26-35), switch/select and
 *     toggle style rows emit NO picker at all, so the helper cannot drive them.
 *   - it also clicks `parameterFxButton(paramName)` UNINDEXED, and "Background" is
 *     declared TWICE (columnBackgroundColor table.js:400 + containerBackgroundColor
 *     table.js:501) -> two `background-fx-button` nodes -> Cypress aborts on a
 *     multi-element click. Every helper below therefore takes an explicit index.
 *   The local harness is built from the SAME primitives the helper uses
 *   (commonWidgetSelector.parameterFxButton / stylePickerFxInput +
 *   cy.clearAndTypeOnCodeMirror), so no new selector shape is invented.
 *
 * FX BUTTON VISIBILITY: `.fx-button-container` ships `opacity: 0` and only fades in on
 * `.wrapper-div-code-editor:hover` (theme.scss:15124-15135). Cypress treats an
 * opacity-0 element as un-actionable, so the fx click is forced — the same shape the
 * green toggleSwitchV2 stylesFx spec uses (`openSwitchFx`).
 *
 * FX DEFAULT TEXT: when fx is switched on, the code editor is seeded with the RAW
 * definition value (SingleLineCodeEditor.jsx:794-798 -> `initialValue={modifiedValue}`),
 * so every non-colour default below is asserted verbatim against `definition.styles`
 * (table.js:852-869) — including the `{{false}}` braces of the `contentWrap` toggle.
 * EXCEPTION — colorSwatches: SingleLineCodeEditor.jsx:694-696 rewrites a `var(--cc-*)`
 * seed through `getCssVarValue` (Widgets/utils.js:10-17), which reads the INLINE custom
 * property that useAppData.js:748 writes on <html> from the ACTIVE theme. The seeded hex
 * is therefore workspace/theme-derived and NOT citeable from config, so colour fx
 * defaults are asserted by SHAPE (`/^#[0-9a-fA-F]{3,8}$/`) rather than by a fabricated
 * literal. The colour DEFAULT ITSELF (token label) is already pinned by styles.cy.js.
 *
 * WHAT EACH FX ASSERTION PROVES: the binding is typed into the code editor, the canvas
 * is clicked (CodeMirror commits on BLUR — runtime-confirmed by the toggleSwitchV2
 * spec), and then the RESOLVED CSS EFFECT is asserted on the element that style
 * actually lands on. The element/CSS-property map is reused verbatim from the
 * runtime-verified `styles.cy.js` (Column Header + Container blocks are green there):
 *   columnTitleColor      -> <th> inline `color`                (TableHeader.jsx:79)
 *   columnBackgroundColor -> <th> inline `background-color`     (TableHeader.jsx:78)
 *   columnHeaderWrap      -> <th> `white-space` + `wrap-wrapper`/`text-truncate` on the
 *                            header-text div                    (TableHeader.jsx:74,150-151)
 *   headerCasing          -> header-text div `text-transform`   (TableHeader.jsx:155)
 *   textColor             -> cell content div inline `color`    (StringRenderer.jsx:205)
 *   selectedRowColor      -> `--cc-table-selected-row-bg` on the widget card
 *                            (Table.jsx:365)
 *   tableType             -> `<table class="table ${rowStyle}">`(TableData.jsx:184)
 *   cellSize/contentWrap/maxRowHeight -> row inline height/max-height
 *                            (TableData.jsx:63-79)
 *   actionButtonRadius    -> action <button> inline `border-radius`
 *                            (ActionButtons.jsx:34)
 *   containerBackgroundColor/borderRadius/borderColor/boxShadow -> widget CARD inline
 *                            styles                             (Table.jsx:350-359)
 *   padding               -> widget OUTER box `padding`         (RenderWidget.jsx:320)
 *
 * KEY INSIGHT reused from styles.cy.js — initSlice.js:105-143 RENAMES config keys on the
 * way into the table store (tableType->rowStyle, cellSize->cellHeight,
 * padding->containerPadding, maxRowHeight->isMaxRowHeightAuto); grepping the raw config
 * names in the renderer finds nothing, which is why the map above is cited on the
 * RENAMED keys.
 *
 * TWO-NODE CAVEAT: `draggable-widget-table1` matches TWO elements — the outer
 * RenderWidget canvas-component box (RenderWidget.jsx:316-323, first in DOM) and the
 * inner Table card (Table.jsx:341). They carry DIFFERENT styles, so container
 * assertions go through tableSelector.widgetOuterBox (:eq(0)) or
 * tableSelector.widgetCard (:eq(1)) — never a bare cy.get().
 *
 * NOT used here: `openAccordion` / `closeAccordions` — proven no-ops for this panel
 * (_ui/Accordion/AccordionItem.js:66-68); every styles accordion ships OPEN.
 * There is no `waitForDropSettle` helper in this repo — `dragAndDropWidget` already ends
 * in `cy.waitForAutoSave()` and the resize steps are the settle.
 *
 * Helpers imported: openEditorSidebar, resizeTableWidget, verifyWidgetColorCss,
 * resizeQueryPanel — all routed through
 * cypress/support/componentAutomation/type-helper-index.md.
 */
import { fake } from "Fixtures/fake";
import { commonWidgetSelector } from "Selectors/common";
import { tableText } from "Texts/appBuilder/components/table";
import { tableSelector } from "Selectors/appBuilder/components/table";
import { resizeTableWidget } from "Support/utils/appBuilder/components/table";
import { openEditorSidebar } from "Support/utils/appBuilder/properties";
import { verifyWidgetColorCss } from "Support/utils/appBuilder/styles";
import { resizeQueryPanel } from "Support/utils/appBuilder/querymanager/queryPanel";

// testIsolation:false — cypress-real-dnd caches its CDP client for the spec run;
// testIsolation's per-test AUT reset leaves that client stale, so 2nd+ test drags
// throw "No dragIntercepted". Keeping the AUT stable across tests keeps the drag
// intercept valid. Each test still re-logs-in + creates its own app in beforeEach,
// so shared browser state is not relied upon.
describe("Table — stylesFx facet", { testIsolation: false }, () => {
  const W = tableText.defaultWidgetName; // runtimeCandidate: 'table1'

  // SingleLineCodeEditor.jsx:686 derives every style row's data-cy prefix from its
  // displayName (lowercased, whitespace runs -> '-'); showLabel:false rows fall back to
  // the PARAM NAME lowercased (Inspector/Elements/Code.jsx:82) — which is exactly what
  // tableText.styleContentWrapParam / styleMaxRowHeightValueParam already hold.
  const cyOf = (label) => String(label).toLowerCase().trim().replace(/\s+/g, "-");

  // Re-open the right Inspector on its Styles tab. Needed before EVERY style control:
  // committing an fx value clicks the canvas, which clears the canvas selection and
  // closes the Inspector.
  const openStyles = () => {
    openEditorSidebar(W);
    cy.get(commonWidgetSelector.buttonStylesEditorSideBar).click();
  };

  // Re-open the right Inspector on its Properties tab (actionButtonRadius has nothing to
  // render on until an entry is pushed into `actions`).
  const openProperties = () => {
    openEditorSidebar(W);
    cy.get(tableSelector.inspectorPropertiesTab).click();
  };

  // INDEXING RULE — the fx BUTTON of every style row is always mounted (one per row, so
  // the duplicated "Background" displayName yields TWO `background-fx-button` nodes and
  // needs `btnIndex`), but the fx CODE EDITOR is rendered ONLY for the row whose fx is
  // currently ON (SingleLineCodeEditor.jsx:794 `{codeShow && ...}`). Since these tests
  // drive one row at a time, `<label>-input-field` is always a single node -> the
  // editor-side helpers below take their OWN index, which stays 0 even for the second
  // "Background". Never reuse btnIndex on the editor.

  // Switch a style row into fx/code mode. Forced because the fx button sits in an
  // opacity-0 container until the row is hovered (theme.scss:15124-15135).
  const openStyleFx = (label, btnIndex = 0) => {
    cy.get(commonWidgetSelector.parameterFxButton(cyOf(label)))
      .eq(btnIndex)
      .scrollIntoView()
      .click({ force: true });
    cy.get(commonWidgetSelector.stylePickerFxInput(cyOf(label)))
      .should("have.length", 1)
      .and("be.visible");
  };

  // The seed the fx editor opens with = the raw `definition.styles` value.
  const verifyFxDefault = (label, expected, editorIndex = 0) => {
    cy.get(commonWidgetSelector.stylePickerFxInput(cyOf(label)))
      .eq(editorIndex)
      .find(".cm-line")
      .should("have.text", expected);
  };

  // colorSwatches seeds are resolved through getCssVarValue -> theme-derived hex, so
  // only the SHAPE is assertable (see the header note).
  const verifyFxDefaultIsResolvedHex = (label, editorIndex = 0) => {
    cy.get(commonWidgetSelector.stylePickerFxInput(cyOf(label)))
      .eq(editorIndex)
      .find(".cm-line")
      .invoke("text")
      .should("match", /^#[0-9a-fA-F]{3,8}$/);
  };

  // Type a {{binding}} and COMMIT it. CodeMirror only pushes to the store on blur, so
  // the canvas click is load-bearing, not cosmetic.
  // NOTE: realType cannot emit `{`/`}` — clearAndTypeOnCodeMirror tokenises the braces
  // and compensates for CodeMirror's auto-close, so it is the only way to type bindings.
  const applyStyleFx = (label, binding, editorIndex = 0) => {
    cy.get(commonWidgetSelector.stylePickerFxInput(cyOf(label)))
      .eq(editorIndex)
      .clearAndTypeOnCodeMirror(binding);
    cy.get(commonWidgetSelector.stylePickerFxInput(cyOf(label)))
      .eq(editorIndex)
      .find(".cm-line")
      .should("have.text", binding);
    cy.forceClickOnCanvas();
    cy.waitForAutoSave();
  };

  // beforeEach mirrors the proven-green table harness shared by styles.cy.js /
  // inspector.cy.js / events.cy.js: widen the viewport and canvas, close the left
  // settings panel, grow the table (header wrap, row height and the action-button
  // column are only observable once the table has real width) and collapse the query
  // panel out of the way.
  beforeEach(() => {
    cy.apiLogin();
    cy.apiCreateApp(`${fake.companyName}-table-stylesFx-App`); // dynamic: fake
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
  // 1. accordian "Column Header" — 4 fx-capable styles (table.js:373-405)
  // ═══════════════════════════════════════════════════════════════════════════
  it("Column Header accordian fx — columnTitleColor, columnHeaderWrap, headerCasing, columnBackgroundColor", () => {
    // ── columnTitleColor (colorSwatches, "Column title", table.js:374) ───────
    // Definition default var(--cc-primary-text) (table.js:852). NOTE the config bug
    // styles.cy.js pinned: validation.defaultValue is var(--cc-placeholder-text)
    // (table.js:377) — the DEFINITION wins, so the fx seed resolves the primary-text
    // token, not the placeholder one.
    openStyles();
    openStyleFx(tableText.styleColumnTitle);
    verifyFxDefaultIsResolvedHex(tableText.styleColumnTitle); // source: table.js:852
    applyStyleFx(tableText.styleColumnTitle, "{{'#ff0000'}}"); // dynamic: test colour
    // TableHeader.jsx:79 writes `color` on the <th>; the `<col>-column-header` div sets
    // only text-transform/text-align, so it INHERITS the colour.
    verifyWidgetColorCss(
      tableSelector.columnHeader(tableText.id),
      "color",
      ["255", "0", "0", "100"],
      true
    ); // dynamic: test colour

    // ── columnHeaderWrap (switch, "Overflow", table.js:380) ─────────────────
    // switch rows expose an fx button too — renderFx() only bails for paramType
    // 'query', paramLabel 'Type' or a defined isFxNotRequired
    // (SingleLineCodeEditor.jsx:698-700).
    openStyles();
    cy.get(tableSelector.columnHeaderCell(W))
      .first()
      .should("have.css", "white-space", "nowrap"); // source: table.js:857 ('fixed')
    openStyleFx(tableText.styleOverflow);
    verifyFxDefault(tableText.styleOverflow, "fixed"); // source: table.js:857
    applyStyleFx(tableText.styleOverflow, "{{'wrap'}}"); // source: table.js:387 (option value)
    cy.get(tableSelector.columnHeaderCell(W))
      .first()
      .should("have.css", "white-space", "normal"); // TableHeader.jsx:74
    cy.get(tableSelector.columnHeader(tableText.id)).should(
      "have.class",
      "wrap-wrapper"
    ); // TableHeader.jsx:151

    // ── headerCasing (switch, "Header casing", table.js:390) ────────────────
    openStyles();
    cy.get(tableSelector.columnHeader(tableText.id)).should(
      "have.css",
      "text-transform",
      "none"
    ); // source: table.js:858
    openStyleFx(tableText.styleHeaderCasing);
    verifyFxDefault(tableText.styleHeaderCasing, "none"); // source: table.js:858
    applyStyleFx(tableText.styleHeaderCasing, "{{'uppercase'}}"); // source: table.js:397 (option value)
    cy.get(tableSelector.columnHeader(tableText.id)).should(
      "have.css",
      "text-transform",
      "uppercase"
    ); // TableHeader.jsx:155

    // ── columnBackgroundColor (colorSwatches, "Background", table.js:400) ────
    // "Background" is declared TWICE, so every lookup is indexed: eq(0) = Column
    // Header, eq(1) = Container (config order). Definition default
    // var(--cc-surface1-surface) (table.js:853) — again NOT the
    // var(--cc-surface2-surface) of validation.defaultValue (table.js:403).
    openStyles();
    openStyleFx(tableText.styleBackground, 0); // btnIndex 0 -> Column Header "Background"
    verifyFxDefaultIsResolvedHex(tableText.styleBackground); // source: table.js:853
    applyStyleFx(tableText.styleBackground, "{{'#0000ff'}}"); // dynamic: test colour
    verifyWidgetColorCss(
      tableSelector.columnHeaderCell(W),
      "background-color",
      ["0", "0", "255", "100"],
      true
    ); // dynamic: test colour — TableHeader.jsx:78 (same inline style on every <th>)
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // 2. accordian "Data" — 7 fx-capable styles + the 1 fx-EXEMPT negative
  //    (table.js:406-500)
  // ═══════════════════════════════════════════════════════════════════════════
  it("Data accordian fx — textColor, selectedRowColor, tableType, cellSize, contentWrap, maxRowHeight, actionButtonRadius + maxRowHeightValue has NO fx", () => {
    // ── textColor (colorSwatches, "Text", table.js:406) ──────────────────────
    openStyles();
    openStyleFx(tableText.styleText);
    verifyFxDefaultIsResolvedHex(tableText.styleText); // source: table.js:855
    applyStyleFx(tableText.styleText, "{{'#ff0000'}}"); // dynamic: test colour
    // useTextColor.js:7 hands the table-level textColor to every column adapter, which
    // passes it to StringRenderer -> inline `color` on the read-only content div
    // (StringRenderer.jsx:202-206). The <td> itself carries no colour, and the cell can
    // hold more than one <div>, so assert that ONE of them carries the resolved colour
    // rather than betting on which node is first.
    cy.get(tableSelector.cellContent(tableText.name, 0, W)).should(($divs) => {
      const hit = [...$divs].some((el) => el.style.color === "rgb(255, 0, 0)");
      expect(hit, "a cell content div carries the fx-resolved text colour").to.be
        .true;
    }); // dynamic: test colour

    // ── selectedRowColor (colorSwatches, "Selected row", table.js:415) ───────
    // Table.jsx:365 writes the resolved colour as the `--cc-table-selected-row-bg`
    // custom property on the widget card; `.table-row.selected` merely CONSUMES it
    // (_styles/table-component.scss:211-214). The custom property IS the style's
    // rendered effect and is written whether or not a row happens to be selected, so
    // it is the deterministic target here.
    openStyles();
    openStyleFx(tableText.styleSelectedRow);
    verifyFxDefaultIsResolvedHex(tableText.styleSelectedRow); // source: table.js:856
    applyStyleFx(tableText.styleSelectedRow, "{{'#008000'}}"); // dynamic: test colour
    cy.get(tableSelector.widgetCard(W))
      .scrollIntoView()
      .should(($card) => {
        expect(
          $card[0].style.getPropertyValue("--cc-table-selected-row-bg")
        ).to.eq("#008000"); // Table.jsx:365
      }); // dynamic: test colour

    // ── tableType (select, "Row style", table.js:424) ───────────────────────
    // initSlice.js:133 maps tableType -> styles.rowStyle, which TableData.jsx:184
    // stamps as a class on the <table>.
    openStyles();
    cy.get(tableSelector.dataTable(W)).should("have.class", "table-classic"); // source: table.js:863
    openStyleFx(tableText.styleRowStyle);
    verifyFxDefault(tableText.styleRowStyle, "table-classic"); // source: table.js:863
    applyStyleFx(tableText.styleRowStyle, "{{'table-striped'}}"); // source: table.js:430 (option value)
    cy.get(tableSelector.dataTable(W))
      .should("have.class", "table-striped")
      .and("not.have.class", "table-classic"); // TableData.jsx:184

    // ── cellSize (select, "Cell height", table.js:438) ──────────────────────
    // initSlice.js:134 maps cellSize -> styles.cellHeight. With contentWrap still
    // {{false}} (table.js:866) TableData.jsx:75-77 writes a FIXED inline height:
    // DEFAULT_ROW_HEIGHT 46 vs CONDENSED_ROW_HEIGHT 40 (TableData.jsx:14-15).
    openStyles();
    cy.get(tableSelector.row(0, W)).should(
      "have.css",
      "height",
      tableText.defaultRowHeightRegular
    ); // source: table.js:860
    openStyleFx(tableText.styleCellHeight);
    verifyFxDefault(tableText.styleCellHeight, "regular"); // source: table.js:860
    applyStyleFx(tableText.styleCellHeight, "{{'condensed'}}"); // source: table.js:443 (option value)
    cy.get(tableSelector.row(0, W))
      .should("have.class", "table-row-condensed") // TableRow.jsx:47
      .and("have.css", "height", tableText.rowHeightCondensed); // TableData.jsx:14

    // ── contentWrap (toggle, showLabel:false, table.js:451) ─────────────────
    // showLabel:false -> the row's data-cy prefix is the PARAM NAME lowercased
    // ('contentwrap'), NOT the toggleLabel (Inspector/Elements/Code.jsx:82).
    // RUNTIME-CONFIRMED shape: boolean fx seeds render WITH the {{}} wrapper.
    openStyles();
    openStyleFx(tableText.styleContentWrapParam);
    verifyFxDefault(tableText.styleContentWrapParam, "{{false}}"); // source: table.js:866
    applyStyleFx(tableText.styleContentWrapParam, "{{true}}"); // dynamic: fx test binding
    // TableData.jsx:71-73 swaps to maxHeight 'fit-content' and writes NO height at all.
    // Read the INLINE style (what React wrote) so the assertion is exact.
    cy.get(tableSelector.row(0, W)).should(($tr) => {
      expect($tr[0].style.maxHeight).to.eq("fit-content"); // TableData.jsx:72
      expect($tr[0].style.height).to.eq(""); // TableData.jsx:71-73
    });

    // ── maxRowHeight (switch, "Max row height", table.js:460) ───────────────
    // GATED: `conditionallyRender {contentWrap: true}` (table.js:469-472), honoured for
    // Table by Inspector/Utils.js:173,214-227 — the control does not render until
    // contentWrap is ON, which the fx binding above just did. That also proves the
    // gate reads the RESOLVED value, not the raw string.
    openStyles();
    openStyleFx(tableText.styleMaxRowHeight);
    verifyFxDefault(tableText.styleMaxRowHeight, "auto"); // source: table.js:864
    applyStyleFx(tableText.styleMaxRowHeight, "{{'custom'}}"); // source: table.js:467 (option value)
    cy.get(tableSelector.row(0, W)).should(($tr) => {
      // initSlice.js:135 maps maxRowHeight -> isMaxRowHeightAuto; 'custom' switches the
      // row off the auto branch onto `${maxRowHeightValue}px` (TableData.jsx:72).
      expect($tr[0].style.maxHeight).to.not.eq("fit-content");
      expect($tr[0].style.maxHeight).to.match(/px$/);
    });

    // ── NEGATIVE — maxRowHeightValue (tableRowHeightInput, table.js:474) ────
    // isFxNotRequired:true (table.js:476) -> SingleLineCodeEditor.jsx:698-700 returns
    // null from renderFx(), so this row must expose NO fx button at all.
    // DOUBLE-GATED: {maxRowHeight:'custom'} AND {contentWrap:true} (table.js:483-490) —
    // both satisfied by the two fx steps above, so the control is mounted and the
    // absence below is a real negative, not a "control missing" false pass.
    openStyles();
    cy.get(tableSelector.styleValueInput(tableText.styleMaxRowHeightValueParam))
      .scrollIntoView()
      .should("have.attr", "type", "number"); // TableRowHeightInput.jsx:29-32
    cy.get(
      commonWidgetSelector.parameterFxButton(
        cyOf(tableText.styleMaxRowHeightValueParam)
      )
    ).should("not.exist"); // source: table.js:476 (isFxNotRequired: true)
    // FINDING: TableRowHeightInput.jsx:8-9 derives its `min` from the RAW definition
    // (`styleDefinition.cellSize?.value`), so the fx-bound cellSize above — stored as
    // the literal "{{'condensed'}}" — never matches 'condensed' and the min stays at
    // MIN_TABLE_ROW_HEIGHT_DEFAULT 45 instead of the condensed 39.
    cy.get(
      tableSelector.styleValueInput(tableText.styleMaxRowHeightValueParam)
    ).should("have.attr", "min", "45"); // TableRowHeightInput.jsx:4,9

    // ── actionButtonRadius (numberInput, "Action button radius", table.js:493) ──
    // `actions` drops as [] (table.js:833) and generateActionColumns.js:75-76 only
    // appends the Actions column for a NON-empty list, so there is no button to style
    // until one is added.
    openProperties();
    cy.get(tableSelector.buttonAddNewAction).scrollIntoView().click(); // Inspector/Components/Table/Table.jsx:698
    cy.waitForAutoSave();
    cy.forceClickOnCanvas();
    cy.get(tableSelector.actionButton(W))
      .first()
      .should("have.css", "border-radius", "0px"); // source: table.js:859 ('0')

    openStyles();
    openStyleFx(tableText.styleActionButtonRadius);
    verifyFxDefault(tableText.styleActionButtonRadius, "0"); // source: table.js:859
    // A NUMERIC binding (not the string '12'): ActionButtons.jsx:34 hands the value
    // straight to React's `borderRadius`, which only appends 'px' for a number.
    applyStyleFx(tableText.styleActionButtonRadius, "{{12}}"); // dynamic: test radius
    cy.get(tableSelector.actionButton(W))
      .first()
      .should("have.css", "border-radius", "12px"); // ActionButtons.jsx:34
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // 3. accordian "Container" — 5 fx-capable styles (table.js:501-537)
  // ═══════════════════════════════════════════════════════════════════════════
  it("Container accordian fx — containerBackgroundColor, borderRadius, borderColor, boxShadow, padding", () => {
    // ── containerBackgroundColor (colorSwatches, "Background", table.js:501) ─
    // Second "Background" row in DOM order (Column Header's is first).
    openStyles();
    openStyleFx(tableText.styleBackground, 1); // btnIndex 1 -> Container "Background"
    // ...but the editor index stays 0: only the row in fx mode renders an
    // `background-input-field` (see the INDEXING RULE above).
    verifyFxDefaultIsResolvedHex(tableText.styleBackground); // source: table.js:854
    applyStyleFx(tableText.styleBackground, "{{'#00ff00'}}"); // dynamic: test colour
    verifyWidgetColorCss(
      tableSelector.widgetCard(W),
      "background-color",
      ["0", "255", "0", "100"],
      true
    ); // dynamic: test colour — Table.jsx:354

    // ── borderRadius (numberInput, "Border radius", table.js:507) ───────────
    openStyles();
    cy.get(tableSelector.widgetCard(W))
      .scrollIntoView()
      .should("have.css", "border-radius", tableText.defaultBorderRadius); // source: table.js:861
    openStyleFx(tableText.styleBorderRadius);
    verifyFxDefault(tableText.styleBorderRadius, "6"); // source: table.js:861
    applyStyleFx(tableText.styleBorderRadius, "{{16}}"); // dynamic: test radius
    cy.get(tableSelector.widgetCard(W)).should(
      "have.css",
      "border-radius",
      "16px"
    ); // Table.jsx:350 (Number.parseFloat)

    // ── borderColor (colorSwatches, "Border", table.js:513) ─────────────────
    // CONFIG BUG pinned by styles.cy.js: `validation: { schema:{type:'string'},
    // defaultValue:false }` (table.js:516-519) — a BOOLEAN default under a string
    // schema. Dead config; the definition ships var(--cc-weak-border) (table.js:862),
    // which is what the fx editor resolves and seeds.
    openStyles();
    openStyleFx(tableText.styleBorder);
    verifyFxDefaultIsResolvedHex(tableText.styleBorder); // source: table.js:862
    applyStyleFx(tableText.styleBorder, "{{'#ff0000'}}"); // dynamic: test colour
    verifyWidgetColorCss(
      tableSelector.widgetCard(W),
      "border-color",
      ["255", "0", "0", "100"],
      true
    ); // dynamic: test colour — Table.jsx:352

    // ── boxShadow (boxShadow, "Box Shadow", table.js:522) ───────────────────
    // The whole shadow string is the fx value here (the four popover inputs are the
    // NON-fx path, covered in styles.cy.js).
    openStyles();
    openStyleFx(tableText.styleBoxShadow);
    verifyFxDefault(tableText.styleBoxShadow, "0px 0px 0px 0px #00000090"); // source: table.js:867
    applyStyleFx(tableText.styleBoxShadow, "{{'2px 4px 6px 0px #ff0000'}}"); // dynamic: test shadow
    // Assert the inline value React wrote (Table.jsx:351) by parts: the computed
    // `box-shadow` re-orders colour first and the exact serialisation of an opaque
    // colour differs between engines, which would make a single string brittle.
    cy.get(tableSelector.widgetCard(W))
      .scrollIntoView()
      .should(($card) => {
        const shadow = $card[0].style.boxShadow;
        expect(shadow).to.include("2px 4px 6px 0px");
        expect(shadow).to.include("rgb(255, 0, 0)");
      }); // dynamic: test shadow — Table.jsx:351

    // ── padding (switch, "Padding", table.js:528) ───────────────────────────
    // RenderWidget.jsx:320 writes this on the OUTER canvas-component box: 'none' -> 0px,
    // anything else -> BOX_PADDING (2, appCanvasConstants.js:57).
    openStyles();
    cy.get(tableSelector.widgetOuterBox(W))
      .scrollIntoView()
      .should("have.css", "padding", tableText.defaultWidgetPadding); // source: table.js:868
    openStyleFx(tableText.stylePadding);
    verifyFxDefault(tableText.stylePadding, "default"); // source: table.js:868
    applyStyleFx(tableText.stylePadding, "{{'none'}}"); // source: table.js:534 (option value)
    cy.get(tableSelector.widgetOuterBox(W)).should(
      "have.css",
      "padding",
      tableText.noWidgetPadding
    ); // RenderWidget.jsx:320
  });
});
