/**
 * SPEC — Table — variants/tagsV2 (the non-deprecated `Tags` column type).
 *
 * FOR AI: covers the `tagsV2` COLUMN TYPE of the Table widget end to end — the
 * label collision with the DEPRECATED `tags` type, the three defaults the type
 * switch seeds, the whole OptionsList block (its tagsV2-only "Sort tags" and
 * "Allow multiple selection" controls plus the shared Auto assign colors /
 * Dynamic option / Options loading state / per-option label, value and colours),
 * the one validation it mounts (customRule) and the rendered tags cell.
 * Source root: frontend/src/AppBuilder/RightSideBar/Inspector/Components/Table/
 * (`columns` is declared bare as `type:'array'` at table.js:44, so NONE of these
 * controls live in the widget config — they live in the ColumnManager).
 *
 * ── THE TRAP THIS SPEC EXISTS TO GUARD ──────────────────────────────────────
 * The column-type dropdown lists the LABEL "Tags" TWICE: at
 * PropertiesTabElements.jsx:131 for the current `tagsV2` type and again at :148
 * for the DEPRECATED `tags` type. Text matching therefore cannot select this
 * type at all — every switch here goes through `setColumnType`, which picks by
 * INDEX from tableText.columnTypeOptionIndex (tagsV2 = 6, tags = 22). The first
 * it() pins the collision head-on: it counts the two identically-labelled
 * options, proves index 6 renders NO deprecation banner
 * (DeprecatedColumnTypeMsg.jsx:5-14,:55-71) and that index 22 DOES, and shows
 * the two land on different <td> classes (`has-select` vs `has-tags`,
 * TableRow.jsx:127-128).
 *
 * ── WHY THIS SPEC SEEDS NO DATA ─────────────────────────────────────────────
 * A full runtime run proved that calling setTableData() from a beforeEach aborts
 * the entire spec: the helper ends with cy.forceClickOnCanvas() +
 * cy.waitForAutoSave(), the autosave indicator does not settle there, and the
 * HOOK fails — skipping every it(). So this spec drives a column the widget
 * ALREADY ships: table.js:777-825 declares { name:'interest', key:'interest',
 * columnType:'newMultiSelect', columnSize:300 } with TEN real options, and the
 * shipped dataset gives every row a real ARRAY value (table.js:692). Re-typing
 * that column to `tagsV2` in beforeEach keeps those ten options verbatim —
 * useColumnManager.js:26-33 only seeds DEFAULT_SELECT_COLUMN_OPTIONS when the
 * column has NO options — while :36-43 still stamps the three tagsV2-only
 * defaults. Every assertion below therefore runs against shipped configuration.
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
 * ── POPOVER LIFECYCLE (load-bearing — TWO nested popovers here) ─────────────
 * The COLUMN popover is an OverlayTrigger with a CONTROLLED `show`
 * (Table.jsx:536-543) whose rootClose is disabled while any CodeHinter preview
 * popover is open (usePopoverState.js:33-43) — every test closes it with
 * `closeColumnPopover(<column>)`, and openColumnPopover() is never called while
 * it is already open (the same click would toggle it shut).
 * Each OPTION row opens a SECOND, independent popover (`#popover-basic`,
 * OptionsList.jsx:169-260) mounted by an UNcontrolled OverlayTrigger with
 * trigger="click" + rootClose (:388-393). Any click outside it dismisses it —
 * including the realClick setColumnColor ends on — so this spec closes it
 * through the conditional `closeOptionPopover()` below rather than assuming a
 * state.
 *
 * ── PRODUCT BUGS / SOURCE QUIRKS HONOURED HERE ──────────────────────────────
 *  F1 (HIGH)  NO validation control has a usable data-cy. ValidationProperties'
 *      getValidationList declares the key `dateCy` (:104 for tagsV2's customRule)
 *      but all three render branches read `validation.dataCy` (:179,:199,:216),
 *      so React drops `data-cy={undefined}`.
 *      `setColumnValidation`/`verifyColumnValidation` therefore select by LABEL
 *      TEXT inside `.optional-properties-when-editable-true`.
 *  F16 (MED)  DUPLICATE data-cy in the option popover: BOTH the "Option label"
 *      and "Option value" <label>s are emitted as `label-action-button-text`
 *      (OptionsList.jsx:183 and :201), and neither CodeHinter is given a
 *      paramLabel, so both inputs collapse to the non-unique `-input-field`.
 *      `setOptionLabelValue` disambiguates POSITIONALLY (index 0 = label,
 *      index 1 = value) — valid only while the Label/Option colour swatches
 *      below them have Fx OFF, as they are by default.
 *  F32 (LOW)  OPTION ROWS CANNOT BE DELETED FROM AN AUTOMATED RUN. The row's
 *      trash button is gated on hover state (`deleteIconOutsideMenu && isHovered`,
 *      ToolJetUI/List/List.jsx:142) and carries NO data-cy (the
 *      `data-cy={'page-menu'}` line is commented out), so neither the delete path
 *      nor the `no-items-banner-columns` empty state (OptionsList.jsx:430) is
 *      reachable — see not_automatable in the spec report.
 *  F33 (INFO) `has-select` is SHARED by select / newMultiSelect / tagsV2
 *      (TableRow.jsx:127), so the <td> class can never identify WHICH renderer
 *      ran. Every "this is a tags cell" assertion below discriminates on the
 *      inner DOM instead.
 *  F19        the column-list data-cy is NOT normalised (Table.jsx:571
 *      interpolates the raw display name), so all helpers use `columnListItem`
 *      rather than the older normalising `tableSelector.columnItem`.
 *  F21        cell COLOUR assertions never use `tableSelector.cellContent`
 *      (`<td> div`, which matches the outer `.td-container` wrapper and computes
 *      to inherited black). A tag chip is addressed by `cellTagChip` instead.
 *
 * Helpers (all resolved through cypress/support/componentAutomation/type-helper-index.md):
 *   components/table.js — resizeTableWidget, openColumnPopover, closeColumnPopover,
 *     switchColumnTab, setColumnType, addColumnOfType, deleteColumn,
 *     verifyAndEnterColumnOptionInput, setColumnCodeField, verifyColumnCodeField,
 *     setColumnProperty, verifyColumnProperty, toggleColumnProperty,
 *     toggleColumnFx, setColumnColor, verifyColumnColor, setColumnValidation,
 *     verifyColumnValidation, setColumnAlignment, setPinPosition, verifyCellType,
 *     addColumnOption, openColumnOption, setOptionLabelValue, setOptionColor,
 *     toggleMakeDefaultOption, toggleAutoAssignColors, toggleDynamicOptions,
 *     toggleAllowMultipleSelection, setSortTags
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
  addColumnOption,
  openColumnOption,
  setOptionLabelValue,
  setOptionColor,
  toggleMakeDefaultOption,
  toggleAutoAssignColors,
  toggleDynamicOptions,
  toggleAllowMultipleSelection,
  setSortTags,
} from "Support/utils/appBuilder/components/table";
import { openEditorSidebar } from "Support/utils/appBuilder/properties";
import { verifyWidgetColorCss } from "Support/utils/appBuilder/styles";
import { resizeQueryPanel } from "Support/utils/appBuilder/querymanager/queryPanel";

// testIsolation:false — cypress-real-dnd caches its CDP client for the spec run;
// testIsolation's per-test AUT reset leaves that client stale, so 2nd+ test drags
// throw "No dragIntercepted". Keeping the AUT stable across tests keeps the drag
// intercept valid. Each test still re-logs-in + creates its own app in beforeEach,
// so shared browser state is not relied upon.
describe(
  "Table — variants/tagsV2 column type",
  { testIsolation: false },
  () => {
    const W = tableText.defaultWidgetName; // 'table1'
    const C = tableText.variantTagsShippedColumn; // 'interest' — source: table.js:777

    // The per-option editor is an UNcontrolled OverlayTrigger with trigger="click" and
    // rootClose (OptionsList.jsx:388-393): clicking its own row toggles it, and ANY click
    // outside dismisses it — including the realClick that setColumnColor ends on. So the
    // close has to be conditional, otherwise a second click would re-OPEN it.
    const closeOptionPopover = () => {
      cy.get("body").then(($body) => {
        if ($body.find(tableSelector.optionPopover).length > 0) {
          cy.get(tableSelector.columnPopoverTitle).click({ force: true });
        }
      });
      cy.get(tableSelector.optionPopover).should("not.exist");
    };

    // Read back one of the two per-option colour swatches. There is no `verifyOptionColor`
    // helper (setOptionColor is the write-side counterpart), and both swatches ARE
    // addressable by displayName — they are mounted with real paramMeta.displayName values
    // (OptionsList.jsx:227 "Label color", :240 "Option color"), unlike the F3 group.
    const verifyOptionColor = (optionLabel, colorLabel, expected) => {
      openColumnOption(optionLabel);
      verifyColumnColor(colorLabel, expected);
      // Leave the popover SHUT: openColumnOption() clicks the row and the OverlayTrigger
      // toggles (OptionsList.jsx:388-393), so a caller following this with setOptionColor
      // would otherwise close the popover instead of re-opening it.
      closeOptionPopover();
    };

    // "Make this option as default", read back from the OPEN option popover.
    // ProgramaticallyHandleProperties.jsx:14-16 feeds it
    // `props[optionIndex].makeDefaultOption` and Toggle.jsx:24 binds that straight to the
    // checkbox's `checked`.
    const verifyOptionIsDefault = (optionLabel, expected) => {
      openColumnOption(optionLabel);
      cy.get(
        tableSelector.columnParamToggle(tableText.labelMakeDefaultOption),
      ).should(expected ? "be.checked" : "not.be.checked"); // source: OptionsList.jsx:244-258
      closeOptionPopover();
    };

    // Open the (portalled) tag menu of one cell. TagsRenderer passes
    // `isDisabled={disabled}` and generateColumnsData.js:361 sets `disabled={!isEditable}`,
    // so the column must be editable first. _ui/Select defaults useMenuPortal=true and
    // TagsRenderer never overrides it (SelectComponent.jsx:83), so the menu lands on
    // document.body and is NEVER inside the cell.
    const openTagsMenu = (rowIndex) => {
      cy.get(tableSelector.cellTagsControl(C, rowIndex, W))
        .scrollIntoView()
        .click({ force: true });
      cy.get(tableSelector.tagsMenu).should("exist"); // source: TagsRenderer.jsx:115-123
    };

    beforeEach(() => {
      cy.apiLogin();
      cy.apiCreateApp(`${fake.companyName}-Table-TagsV2-Column`); // dynamic: fake
      cy.openApp();
      cy.viewport(1400, 2200);
      cy.dragAndDropWidget("Table", 250, 100);
      cy.hideTooltip();
      cy.modifyCanvasSize(900, 800);
      cy.get("[data-cy='left-sidebar-settings-button']").click();
      resizeTableWidget(W, 750, 600);
      resizeQueryPanel("1");
      openEditorSidebar(W);
      // The shipped `interest` column is a newMultiSelect (table.js:782); re-typing it to
      // tagsV2 is what mounts the tagsV2-only controls AND runs the seed path at
      // useColumnManager.js:36-43. setColumnType picks by INDEX (6), never by the
      // colliding "Tags" label, and opens the popover itself — close it again so every
      // it() starts from the same state (column list on screen, popover shut).
      setColumnType(C, tableText.columnTypeValue.tagsV2); // source: PropertiesTabElements.jsx:131
      closeColumnPopover(C);
    });

    afterEach(() => {
      cy.apiDeleteApp();
    });

    // ═══════════════════════════════════════════════════════════════════════════
    // COLUMN TYPE — the "Tags" label collision
    // ═══════════════════════════════════════════════════════════════════════════

    it("column type (TRAP) — the dropdown lists `Tags` TWICE; index 6 is the live tagsV2 type and index 22 the deprecated one", () => {
      openColumnPopover(C);
      // CustomValueContainer (PropertiesTabElements.jsx:59-67) renders the stored value's
      // option LABEL, which for tagsV2 is the very label that collides.
      cy.get(tableSelector.columnPopover)
        .find(tableSelector.columnTypeSelect)
        .should("contain.text", tableText.columnTypeLabel.tagsV2); // source: PropertiesTabElements.jsx:131

      // THE COLLISION ITSELF. The menu is portalled to document.body
      // (SelectComponent.jsx:81), so its options are never inside the popover.
      cy.get(tableSelector.columnPopover)
        .find(tableSelector.columnTypeSelect)
        .click({ force: true });
      cy.get(tableSelector.columnTypeOption)
        .filter(
          (_i, el) => el.innerText.trim() === tableText.columnTypeLabel.tagsV2,
        )
        .should("have.length", tableText.variantTagsLabelCollisionCount); // source: PropertiesTabElements.jsx:131,148
      // Index is the ONLY discriminator — re-pick index 6 to close the menu on the live type.
      cy.get(tableSelector.columnTypeOption)
        .eq(tableText.columnTypeOptionIndex.tagsV2)
        .click({ force: true }); // source: PropertiesTabElements.jsx:131
      cy.waitForAutoSave();

      // DeprecatedColumnTypeMsg.jsx:57 returns null unless the columnType is one of the
      // eight DEPRECATED_COLUMN_TYPES (:5-14) — tagsV2 is not, so no banner.
      cy.get(tableSelector.columnPopover).should(
        "not.contain.text",
        tableText.deprecatedColumnTypeBanner,
      ); // source: DeprecatedColumnTypeMsg.jsx:55-71
      closeColumnPopover(C);

      cy.forceClickOnCanvas();
      cy.get(tableSelector.cell(C, 0, W)).scrollIntoView();
      // F33: `has-select` is shared with select / newMultiSelect (TableRow.jsx:127), so the
      // class alone proves nothing — the tags renderer is identified by the _ui/Select
      // className generateColumnsData.js:372 mounts it with.
      verifyCellType(C, 0, tableText.cellClassByType.tagsV2, W); // source: TableRow.jsx:127
      cy.get(tableSelector.cellTagsSelect(C, 0, W)).should("have.length", 1); // source: generateColumnsData.js:372
      cy.get(tableSelector.cell(C, 0, W)).should(
        "not.have.class",
        tableText.cellClassDeprecatedTags,
      ); // source: TableRow.jsx:128

      // …and the SAME label at index 22 is the deprecated type: it DOES raise the banner
      // and it renders a `has-tags` cell instead.
      setColumnType(C, tableText.columnTypeValue.tags); // source: PropertiesTabElements.jsx:148
      cy.get(tableSelector.columnPopover)
        .should("contain.text", tableText.deprecatedColumnTypeBanner) // source: DeprecatedColumnTypeMsg.jsx:67
        .and("contain.text", tableText.deprecatedTagsAlternative); // source: DeprecatedColumnTypeMsg.jsx:10
      closeColumnPopover(C);
      cy.forceClickOnCanvas();
      verifyCellType(C, 0, tableText.cellClassDeprecatedTags, W); // source: TableRow.jsx:128
      cy.get(tableSelector.cellTagsSelect(C, 0, W)).should("not.exist"); // source: generateColumnsData.js:372

      // Back to index 6 — the banner disappears and the tags renderer returns.
      setColumnType(C, tableText.columnTypeValue.tagsV2); // source: PropertiesTabElements.jsx:131
      cy.get(tableSelector.columnPopover).should(
        "not.contain.text",
        tableText.deprecatedColumnTypeBanner,
      ); // source: DeprecatedColumnTypeMsg.jsx:57
      closeColumnPopover(C);
      cy.forceClickOnCanvas();
      verifyCellType(C, 0, tableText.cellClassByType.tagsV2, W); // source: TableRow.jsx:127
      cy.get(tableSelector.cellTagChip(C, 0, W)).should(
        "have.length",
        tableText.variantTagsShippedRow0ChipCount,
      ); // source: table.js:692 (row 0 `interest`)
    });

    it("column manager — a `tagsV2` column can be added, bound to a key and deleted", () => {
      // addColumnOfType sets the TYPE first (so the OptionsList block mounts and the
      // tagsV2 defaults are seeded), then the name, then the key — the key is what the row
      // data is read from (generateColumnsData.js:163 accessorKey = column.key || name).
      addColumnOfType(
        tableText.variantTagsShippedNewColumn,
        tableText.columnTypeValue.tagsV2, // source: PropertiesTabElements.jsx:131
        tableText.variantTagsShippedColumnKey, // source: table.js:778
      );
      closeColumnPopover(tableText.variantTagsShippedNewColumn);

      cy.forceClickOnCanvas();
      cy.get(tableSelector.columnHeader(tableText.variantTagsShippedNewColumn))
        .scrollIntoView()
        .should("have.text", tableText.variantTagsShippedNewColumn); // source: TableHeader.jsx:153
      // A BRAND-NEW column has no options of its own, so useColumnManager.js:31-32 seeds
      // DEFAULT_SELECT_COLUMN_OPTIONS — whose four labels are the first four of the shipped
      // `interest` list, so row 0's three values still all resolve to real options.
      cy.get(
        tableSelector.cellTagChip(tableText.variantTagsShippedNewColumn, 0, W),
      ).should("have.length", tableText.variantTagsShippedRow0ChipCount); // source: table.js:692

      // deleteColumn drives the popover header's [title="Delete column"] and asserts BOTH
      // the inspector row and the rendered header are gone.
      deleteColumn(tableText.variantTagsShippedNewColumn); // source: ColumnPopover.jsx:130-138
    });

    // ═══════════════════════════════════════════════════════════════════════════
    // THE tagsV2 SEED PATH (useColumnManager.js:36-43)
    // ═══════════════════════════════════════════════════════════════════════════

    it("options — the tagsV2 switch seeds sortTags/allowMultipleSelection/autoAssignColors and titles the accordion `Tags`", () => {
      openColumnPopover(C);
      // OptionsList.jsx:271 titles the accordion 'Tags' for tagsV2 and 'Options' for
      // select / newMultiSelect, and AccordionItem.js:39/:51 stamp the title into the
      // header and label data-cy — so the accordion TITLE is itself a type discriminator.
      cy.get(
        tableSelector.optionsAccordionTitleLabel(
          tableText.variantTagsAccordionTitle,
        ),
      ).should("have.text", tableText.variantTagsAccordionTitle); // source: OptionsList.jsx:271 + AccordionItem.js:51
      cy.get(
        tableSelector.optionsAccordionHeaderFor(
          tableText.variantTagsAccordionTitle,
        ),
      ).should("contain.text", tableText.variantTagsAccordionTitle); // source: AccordionItem.js:39
      // The select/newMultiSelect spelling of the same accordion must NOT be present.
      cy.get(tableSelector.optionsAccordionLabel).should("not.exist"); // source: OptionsList.jsx:271
      // …and the add button copy flips with it.
      cy.get(tableSelector.optionsAddButton).should(
        "contain.text",
        tableText.buttonAddNewTag,
      ); // source: OptionsList.jsx:441

      // THE tagsV2-ONLY CONTROLS. Both are gated on `columnType === 'tagsV2'`, so their
      // mere presence separates this type from select / newMultiSelect.
      cy.get(tableSelector.optionsAccordion).should(
        "contain.text",
        tableText.labelSortTags,
      ); // source: OptionsList.jsx:277
      cy.get(
        tableSelector.sortTagsOptionActive(tableText.variantTagsSeedSortTags),
      ).should("exist"); // source: useColumnManager.js:40 + OptionsList.jsx:280-285
      // Toggle.jsx:24 binds `checked` straight to the RESOLVED property value, so a checked
      // box IS the seeded `true`.
      cy.get(
        tableSelector.columnParamToggle(tableText.labelAllowMultipleSelection),
      ).should(
        tableText.variantTagsSeedAllowMultipleSelection
          ? "be.checked"
          : "not.be.checked",
      ); // source: useColumnManager.js:41
      // THE DIFFERENCE FROM select / newMultiSelect: they never seed autoAssignColors at
      // all (its fx editor falls back to ProgramaticallyHandleProperties.jsx:87's
      // `{{false}}`), while the tagsV2 branch stamps a literal `true`.
      cy.get(
        tableSelector.columnParamToggle(tableText.labelAutoAssignColors),
      ).should(
        tableText.variantTagsSeedAutoAssignColors
          ? "be.checked"
          : "not.be.checked",
      ); // source: useColumnManager.js:42

      // The SHIPPED options survive the type switch untouched — handlePropertyChange only
      // replaces them when the column has none (useColumnManager.js:26-33).
      cy.get(tableSelector.optionsEmptyState).should("not.exist"); // source: OptionsList.jsx:430
      tableText.variantTagsShippedOptions.forEach((label) => {
        cy.get(tableSelector.optionListItem(label))
          .find(tableSelector.columnListItemLabel(label))
          .should("have.text", label); // source: table.js:785-824
      });
      closeColumnPopover(C);
    });

    // ═══════════════════════════════════════════════════════════════════════════
    // SHARED PROPERTIES (Properties tab)
    // ═══════════════════════════════════════════════════════════════════════════

    it("properties — Column name renames the rendered column, Key rebinds its data", () => {
      openColumnPopover(C);
      verifyColumnCodeField(tableSelector.columnNameField, C); // source: PropertiesTabElements.jsx:164-181
      verifyColumnCodeField(
        tableSelector.columnKeyField,
        tableText.variantTagsShippedColumnKey,
      ); // source: PropertiesTabElements.jsx:182-197

      // Renaming re-keys the rendered header AND every cell data-cy, because both are
      // derived from `columnDef.header` = the resolved column name
      // (generateColumnsData.js:165 → TableHeader.jsx:153 / TableRow.jsx:103-105).
      verifyAndEnterColumnOptionInput(
        tableText.labelColumnName,
        tableText.variantTagsShippedRenamedColumn,
      ); // source: PropertiesTabElements.jsx:166
      closeColumnPopover(tableText.variantTagsShippedRenamedColumn);
      cy.forceClickOnCanvas();
      cy.get(
        tableSelector.columnHeader(tableText.variantTagsShippedRenamedColumn),
      )
        .scrollIntoView()
        .should("have.text", tableText.variantTagsShippedRenamedColumn); // source: TableHeader.jsx:153
      cy.get(
        tableSelector.cellTagChip(
          tableText.variantTagsShippedRenamedColumn,
          0,
          W,
        ),
      ).should("have.length", tableText.variantTagsShippedRow0ChipCount); // source: table.js:692

      // The Key is the accessor, so re-pointing it at `email` — a SCALAR that matches no
      // option — collapses the cell to a single chip whose label is the raw String(value),
      // proving both the rebind and resolveSelectedOption's no-match fallback.
      openColumnPopover(tableText.variantTagsShippedRenamedColumn);
      verifyAndEnterColumnOptionInput(
        tableText.labelKey,
        tableText.variantTagsShippedAltKey,
      ); // source: PropertiesTabElements.jsx:183
      closeColumnPopover(tableText.variantTagsShippedRenamedColumn);
      cy.forceClickOnCanvas();
      cy.get(
        tableSelector.cellTagChip(
          tableText.variantTagsShippedRenamedColumn,
          0,
          W,
        ),
      ).should("have.length", tableText.variantTagsShippedAltChipCount); // source: TagsRenderer.jsx:377
      cy.get(
        tableSelector.cellTagChip(
          tableText.variantTagsShippedRenamedColumn,
          0,
          W,
        ),
      ).should("have.text", tableText.variantTagsShippedAltChipRow0); // source: TagsRenderer.jsx:361-366
    });

    it("properties — Transformation rewrites the array the option list is matched against", () => {
      openColumnPopover(C);
      verifyColumnCodeField(
        tableSelector.columnTransformationField,
        tableText.defaultTransformation,
      ); // source: PropertiesTabElements.jsx:205

      // columnSlice.js:99 deliberately DROPS a transformation equal to '{{cellValue}}', so
      // only a real expression reaches transformTableData.js:32-36, which rewrites the
      // row's value for this key BEFORE the renderer resolves it against `options`
      // (TagsRenderer.jsx:371-379). Slicing row 0's three-element array to one must drop
      // two chips.
      setColumnCodeField(
        tableSelector.columnTransformationField,
        tableText.variantTagsShippedTransformation,
      ); // source: PropertiesTabElements.jsx:200-218
      closeColumnPopover(C);

      cy.forceClickOnCanvas();
      cy.get(tableSelector.cell(C, 0, W)).scrollIntoView();
      cy.get(tableSelector.cellTagChip(C, 0, W)).should(
        "have.length",
        tableText.variantTagsShippedTransformedChipCount,
      ); // source: transformTableData.js:32-36
      cy.get(tableSelector.cellTagChip(C, 0, W)).should(
        "have.text",
        tableText.variantTagsShippedRow0FirstLabel,
      ); // source: table.js:692 (row 0, first tag)
      // Row 1 keeps only ITS own first tag — proof the transformation ran per-row.
      cy.get(tableSelector.cellTagChip(C, 1, W)).should(
        "have.text",
        tableText.variantTagsShippedRow1FirstLabel,
      ); // source: table.js:692 (row 1, first tag)
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

    it("properties — Make editable un-disables the tags control and mounts the dropdown indicator", () => {
      // Read-only first: generateColumnsData.js:361 passes `disabled={!isEditable}` straight
      // to react-select's isDisabled, and TagsRenderer.jsx:277 mounts the DropdownIndicator
      // ONLY when isEditable — so the untouched column is a disabled control with NO caret.
      cy.forceClickOnCanvas();
      cy.get(tableSelector.cellTagsControl(C, 0, W))
        .scrollIntoView()
        .should("have.class", tableText.variantTagsControlDisabledClass); // source: TagsRenderer.jsx:440
      cy.get(tableSelector.cellTagsDropdownIcon(C, 0, W)).should("not.exist"); // source: TagsRenderer.jsx:277

      openColumnPopover(C);
      // `isEditable` IS offered for tagsV2 — PropertiesTabElements.jsx:385 excludes only
      // image / link / button.
      toggleColumnProperty(tableText.labelMakeEditable); // source: PropertiesTabElements.jsx:385-400
      closeColumnPopover(C);

      cy.forceClickOnCanvas();
      cy.get(tableSelector.cellTagsControl(C, 0, W))
        .scrollIntoView()
        .should("not.have.class", tableText.variantTagsControlDisabledClass); // source: TagsRenderer.jsx:440
      cy.get(tableSelector.cellTagsDropdownIcon(C, 0, W)).should(
        "have.length",
        1,
      ); // source: SelectRenderer.jsx:161-165
      // TableRow.jsx:118 ORs `has-text` with isEditable, so an editable tags cell picks up
      // the text-column class on top of its own `has-select`.
      cy.get(tableSelector.cell(C, 0, W))
        .should("have.class", tableText.cellClassEditable) // source: TableRow.jsx:135
        .and("have.class", tableText.cellClassByType.tagsV2); // source: TableRow.jsx:127
    });

    // ═══════════════════════════════════════════════════════════════════════════
    // VALIDATIONS — customRule is the ONLY one a tagsV2 column mounts
    // ═══════════════════════════════════════════════════════════════════════════

    it("validations — `customRule` is the only validation tagsV2 mounts, and its message reaches the cell (F1)", () => {
      openColumnPopover(C);
      // The block only mounts once the column is editable (PropertiesTabElements.jsx:401).
      toggleColumnProperty(tableText.labelMakeEditable); // source: PropertiesTabElements.jsx:385-400

      // getValidationList's tagsV2 branch returns exactly ONE entry
      // (ValidationProperties.jsx:97-108) — so the length/label assertions below are the
      // discriminator against string/number, which return three or four.
      cy.get(tableSelector.columnValidationLabels).should("have.length", 1); // source: ValidationProperties.jsx:97-108
      cy.get(tableSelector.columnValidationLabels).should(
        "have.text",
        tableText.labelCustomRule,
      ); // source: ValidationProperties.jsx:105
      cy.get(tableSelector.columnPopover)
        .should("not.contain.text", tableText.labelRegex) // source: ValidationProperties.jsx:43
        .and("not.contain.text", tableText.labelMinLength); // source: ValidationProperties.jsx:52

      // F1: the field has NO data-cy (getValidationList writes `dateCy` at :104, the render
      // branch at :216 reads `validation.dataCy`), so the helper matches on <label> text.
      setColumnValidation(
        tableText.labelCustomRule,
        tableText.variantTagsShippedCustomRule,
      ); // source: ValidationProperties.jsx:97-108 (F1)
      verifyColumnValidation(
        tableText.labelCustomRule,
        tableText.variantTagsShippedCustomRule,
      ); // source: ValidationProperties.jsx:216 (F1)
      closeColumnPopover(C);

      // TagsV2ColumnAdapter.jsx:33-39 resolves the rule against `value` (NOT cellValue) and
      // _helpers/utils.js:458-461 treats a non-empty STRING as the failure, using it
      // verbatim as the message. TagsRenderer.jsx:472-480 renders that message only while
      // the column is editable AND the value is invalid.
      cy.forceClickOnCanvas();
      cy.get(tableSelector.cellTagsInvalidFeedback(C, 0, W))
        .scrollIntoView()
        .should("have.text", tableText.variantTagsShippedCustomRuleErrorRow0); // source: _helpers/utils.js:460
    });

    // ═══════════════════════════════════════════════════════════════════════════
    // OPTIONS LIST — the tagsV2-only controls
    // ═══════════════════════════════════════════════════════════════════════════

    it("tags — Sort tags reorders the dropdown option list (none | a-z | z-a) without touching the chips", () => {
      openColumnPopover(C);
      // The menu is only reachable on an editable cell (TagsRenderer.jsx:440).
      toggleColumnProperty(tableText.labelMakeEditable); // source: PropertiesTabElements.jsx:385-400
      closeColumnPopover(C);

      // DEFAULT — `none` leaves the options in their stored array order, and
      // `hideSelectedOptions` (TagsRenderer.jsx:451) drops the three row 0 already holds.
      cy.forceClickOnCanvas();
      openTagsMenu(0);
      cy.get(tableSelector.tagsMenuOptionChip).should(
        "have.length",
        tableText.variantTagsShippedMenuOptionCount,
      ); // source: TagsRenderer.jsx:451 + table.js:785-824
      tableText.variantTagsShippedMenuOrderNone.forEach((label, i) => {
        cy.get(tableSelector.tagsMenuOptionChip)
          .eq(i)
          .should("have.text", label); // source: TagsRenderer.jsx:23 (sortTags 'none' returns opts as-is)
      });

      openColumnPopover(C);
      setSortTags(tableText.sortTagsAsc); // source: OptionsList.jsx:284
      cy.get(tableSelector.sortTagsOptionActive(tableText.sortTagsAsc)).should(
        "exist",
      ); // source: OptionsList.jsx:284
      closeColumnPopover(C);

      cy.forceClickOnCanvas();
      openTagsMenu(0);
      tableText.variantTagsShippedMenuOrderAsc.forEach((label, i) => {
        cy.get(tableSelector.tagsMenuOptionChip)
          .eq(i)
          .should("have.text", label); // source: TagsRenderer.jsx:25-26
      });
      // The SELECTED chips keep the cell value's own order — sortTags only touches the
      // option list handed to react-select (TagsRenderer.jsx:381,:438).
      cy.get(tableSelector.cellTagChip(C, 0, W))
        .first()
        .should("have.text", tableText.variantTagsShippedRow0FirstLabel); // source: table.js:692

      openColumnPopover(C);
      setSortTags(tableText.sortTagsDesc); // source: OptionsList.jsx:285
      closeColumnPopover(C);

      cy.forceClickOnCanvas();
      openTagsMenu(0);
      tableText.variantTagsShippedMenuOrderDesc.forEach((label, i) => {
        cy.get(tableSelector.tagsMenuOptionChip)
          .eq(i)
          .should("have.text", label); // source: TagsRenderer.jsx:25-26
      });
    });

    it("tags — turning Allow multiple selection OFF collapses the cell to a single chip", () => {
      // Seeded ON (useColumnManager.js:41) → isMulti true → react-select's own
      // MultiValueLabel is rendered once per value (TagsRenderer.jsx:281-284 overrides the
      // CONTAINER but not the label, so the label keeps its prefix class).
      cy.forceClickOnCanvas();
      cy.get(tableSelector.cellTagChip(C, 0, W))
        .scrollIntoView()
        .should("have.length", tableText.variantTagsShippedRow0ChipCount); // source: table.js:692
      cy.get(tableSelector.cellTagLabel(C, 0, W)).should(
        "have.length",
        tableText.variantTagsShippedRow0ChipCount,
      ); // source: TagsRenderer.jsx:311-320

      openColumnPopover(C);
      toggleAllowMultipleSelection(); // source: OptionsList.jsx:305-321
      cy.get(
        tableSelector.columnParamToggle(tableText.labelAllowMultipleSelection),
      ).should("not.be.checked"); // source: CodeBuilder/Elements/Toggle.jsx:23-24
      closeColumnPopover(C);

      // isMulti false → TagsRenderer.jsx:377 takes `isArray(value) ? value[0] : value`, so
      // only the FIRST tag survives, and it is painted by TagsSingleValue (:66-99) — a bare
      // div, so `react-select__multi-value__label` disappears entirely.
      cy.forceClickOnCanvas();
      cy.get(tableSelector.cellTagChip(C, 0, W))
        .scrollIntoView()
        .should("have.length", tableText.variantTagsSingleChipCount); // source: TagsRenderer.jsx:377
      cy.get(tableSelector.cellTagChip(C, 0, W)).should(
        "have.text",
        tableText.variantTagsShippedRow0FirstLabel,
      ); // source: TagsRenderer.jsx:359-366
      cy.get(tableSelector.cellTagLabel(C, 0, W)).should("not.exist"); // source: TagsRenderer.jsx:278-284
    });

    // ═══════════════════════════════════════════════════════════════════════════
    // OPTIONS LIST — the controls tagsV2 shares with select / newMultiSelect
    // ═══════════════════════════════════════════════════════════════════════════

    it("options — rewriting an option's label re-labels the rendered chip while its value keeps matching (F16)", () => {
      openColumnPopover(C);
      // F16: both CodeHinters in the option popover collapse to the duplicate
      // `-input-field`, so setOptionLabelValue writes the VALUE at index 1 first and the
      // LABEL at index 0 last — last because the option row's data-cy is keyed off the
      // label. Only the LABEL is changed here: the option's value stays 'Reading', so row 0
      // still RESOLVES to this option (TagsRenderer.jsx:359) but now renders the new label.
      setOptionLabelValue(
        tableText.variantTagsShippedRow0FirstLabel,
        tableText.variantTagsRenamedOptionLabel,
      ); // source: OptionsList.jsx:182-199 (F16)
      closeOptionPopover();

      // The list row's data-cy follows the label (OptionsList.jsx:407).
      cy.get(
        tableSelector.optionListItem(tableText.variantTagsRenamedOptionLabel),
      )
        .find(
          tableSelector.columnListItemLabel(
            tableText.variantTagsRenamedOptionLabel,
          ),
        )
        .should("have.text", tableText.variantTagsRenamedOptionLabel); // source: List.jsx:58
      closeColumnPopover(C);

      cy.forceClickOnCanvas();
      cy.get(tableSelector.cellTagChip(C, 0, W))
        .first()
        .scrollIntoView()
        .should("have.text", tableText.variantTagsRenamedOptionLabel); // source: TagsRenderer.jsx:359-366
      // The other two chips of the same row are different options and are untouched.
      cy.get(tableSelector.cellTagChip(C, 0, W))
        .eq(1)
        .should("have.text", tableText.variantTagsShippedRow0Labels[1]); // source: table.js:692
    });

    it("options — `Add new tag` appends `Option 1`, which can be renamed and made default (the flags ACCUMULATE for tagsV2)", () => {
      openColumnPopover(C);
      // OptionsList.jsx:441 renders the button as "Add new tag" for tagsV2 and
      // "Add new option" everywhere else; createNewOption appends `Option N`, skipping
      // labels already taken (:59-71) — none of the ten shipped labels is an `Option N`.
      addColumnOption(tableText.buttonAddNewTag); // source: OptionsList.jsx:429-444
      cy.get(tableSelector.optionListItem(tableText.variantTagsNewOptionLabel))
        .find(
          tableSelector.columnListItemLabel(
            tableText.variantTagsNewOptionLabel,
          ),
        )
        .should("have.text", tableText.variantTagsNewOptionLabel); // source: OptionsList.jsx:64-71

      setOptionLabelValue(
        tableText.variantTagsNewOptionLabel,
        tableText.variantTagsRenamedOptionLabel,
      ); // source: OptionsList.jsx:182-199 (F16)
      closeOptionPopover();

      // THE BRANCH THAT SEPARATES tagsV2 FROM select: handleDefaultOptionSelection
      // special-cases ONLY `columnType === 'select'` (OptionsList.jsx:133-140), where the
      // flag is single-select. tagsV2 takes the else branch (:141-155) and ACCUMULATES, so
      // both options stay flagged and defaultOptionsList holds two entries.
      toggleMakeDefaultOption(tableText.variantTagsRenamedOptionLabel); // source: OptionsList.jsx:244-258
      closeOptionPopover();
      toggleMakeDefaultOption(tableText.variantTagsShippedOptions[3]); // source: OptionsList.jsx:244-258
      closeOptionPopover();
      verifyOptionIsDefault(tableText.variantTagsRenamedOptionLabel, true); // source: OptionsList.jsx:142-153
      verifyOptionIsDefault(tableText.variantTagsShippedOptions[3], true); // source: OptionsList.jsx:142-153

      // defaultOptionsList only reaches the renderer for a FALSY cell value
      // (SelectComponent.jsx:52 `value ? … : defaultValue`), and the shipped dataset has no
      // empty `interest`. Emptying every cell through the Transformation is what makes the
      // accumulated list observable — transformTableData.js:32-36 keeps '' because it falls
      // back with `??`, not `||`.
      setColumnCodeField(
        tableSelector.columnTransformationField,
        tableText.variantTagsShippedEmptyTransformation,
      ); // source: PropertiesTabElements.jsx:200-218
      closeColumnPopover(C);

      cy.forceClickOnCanvas();
      // isMulti is ON, so TagsRenderer.jsx:342-352 hands react-select the WHOLE
      // defaultOptionsList — two chips, not one.
      cy.get(tableSelector.cellTagChip(C, 0, W))
        .scrollIntoView()
        .should("have.length", 2); // source: OptionsList.jsx:142-153 + TagsRenderer.jsx:345
    });

    it("options — Auto assign colors ships ON for tagsV2, an explicit Option color wins, and turning it off falls back to the token", () => {
      // Seeded ON (useColumnManager.js:42): optionColors keys COLORS by the option's
      // POSITION in the list (TagsRenderer.jsx:200-208) and the colour lands as the chip
      // div's inline `background` (:30-42). F21: never assert this through `cellContent`,
      // which resolves to the outer `.td-container` wrapper.
      cy.forceClickOnCanvas();
      cy.get(tableSelector.cell(C, 0, W)).scrollIntoView();
      verifyWidgetColorCss(
        `${tableSelector.cellTagChip(C, 0, W)}:eq(0)`,
        "background-color",
        tableText.variantTagsShippedAutoColorReading,
        true,
      ); // source: SelectRenderer.jsx:13 (COLORS[0], option index 0)
      verifyWidgetColorCss(
        `${tableSelector.cellTagChip(C, 0, W)}:eq(2)`,
        "background-color",
        tableText.variantTagsShippedAutoColorPhotography,
        true,
      ); // source: SelectRenderer.jsx:15 (COLORS[2], option index 2)

      // `option.optionColor ||` short-circuits BEFORE the autoAssignColors branch
      // (TagsRenderer.jsx:203-204), so an explicit per-option colour must beat it.
      openColumnPopover(C);
      verifyOptionColor(
        tableText.variantTagsShippedRow0FirstLabel,
        tableText.labelOptionColor,
        tableText.variantTagsDefaultOptionColor,
      );
      setOptionColor(
        tableText.variantTagsShippedRow0FirstLabel,
        tableText.labelOptionColor,
        tableText.variantTagsOptionColorRgba,
      ); // source: OptionsList.jsx:231-243
      closeOptionPopover();
      closeColumnPopover(C);

      cy.forceClickOnCanvas();
      verifyWidgetColorCss(
        `${tableSelector.cellTagChip(C, 0, W)}:eq(0)`,
        "background-color",
        tableText.variantTagsOptionColorRgba,
        true,
      ); // source: TagsRenderer.jsx:203
      // The untouched sibling keeps its auto-assigned colour — the override is per-OPTION.
      verifyWidgetColorCss(
        `${tableSelector.cellTagChip(C, 0, W)}:eq(2)`,
        "background-color",
        tableText.variantTagsShippedAutoColorPhotography,
        true,
      ); // source: SelectRenderer.jsx:15

      // Turning the toggle OFF drops every un-overridden chip to the design token, which
      // stays a RAW var() in the inline style attribute (React never resolves custom
      // properties) — so it is asserted on the attribute, not through have.css.
      openColumnPopover(C);
      switchColumnTab(tableText.columnTabProperties); // source: ColumnPopover.jsx:149
      toggleAutoAssignColors(); // source: OptionsList.jsx:290-304
      closeColumnPopover(C);

      cy.forceClickOnCanvas();
      cy.get(tableSelector.cellTagChip(C, 0, W))
        .eq(2)
        .should("have.attr", "style")
        .and("include", tableText.variantTagsShippedFallbackChipBackground); // source: TagsRenderer.jsx:13,204
    });

    it("options — Label color overrides the column Text color on the rendered chip", () => {
      openColumnPopover(C);
      switchColumnTab(tableText.columnTabStyles); // source: ColumnPopover.jsx:157
      // `tagsV2` IS in the shared colour block (StylesTabElements.jsx:128-145) and is not
      // the boolean carve-out at :147, so Text color is offered and defaults to #11181C.
      verifyColumnColor(
        tableText.labelTextColor,
        tableText.variantDefaultTextColor,
      ); // source: ProgramaticallyHandleProperties.jsx:38
      setColumnColor(
        tableText.labelTextColor,
        tableText.variantSelectTextColorRgba,
      ); // source: StylesTabElements.jsx:147-161
      closeColumnPopover(C);

      // useTextColor.js:7-10 passes any colour other than the #11181C sentinel straight
      // through, TagsV2ColumnAdapter.jsx:31,92 forwards it as `textColor`, and
      // TagsRenderer.jsx:463 uses it as `selectedTextColor` — the chip's `color` while the
      // option has no labelColor of its own (:40).
      cy.forceClickOnCanvas();
      verifyWidgetColorCss(
        `${tableSelector.cellTagChip(C, 0, W)}:eq(0)`,
        "color",
        tableText.variantSelectTextColorRgba,
        true,
      ); // source: TagsRenderer.jsx:40

      // `data?.labelColor ||` is evaluated FIRST (:40), so a per-option Label color must
      // win over the column-wide Text color.
      openColumnPopover(C);
      // The popover re-opens on whichever tab was last active, and the OptionsList lives on
      // the Properties tab (PropertiesTabElements.jsx:503-516) — switch back explicitly.
      switchColumnTab(tableText.columnTabProperties); // source: ColumnPopover.jsx:149
      verifyOptionColor(
        tableText.variantTagsShippedRow0FirstLabel,
        tableText.labelLabelColor,
        tableText.variantTagsDefaultLabelColor,
      );
      setOptionColor(
        tableText.variantTagsShippedRow0FirstLabel,
        tableText.labelLabelColor,
        tableText.variantTagsLabelColorRgba,
      ); // source: OptionsList.jsx:218-230
      closeOptionPopover();
      closeColumnPopover(C);

      cy.forceClickOnCanvas();
      verifyWidgetColorCss(
        `${tableSelector.cellTagChip(C, 0, W)}:eq(0)`,
        "color",
        tableText.variantTagsLabelColorRgba,
        true,
      ); // source: TagsRenderer.jsx:40
      // A sibling chip of the SAME row keeps the column-wide Text color.
      verifyWidgetColorCss(
        `${tableSelector.cellTagChip(C, 0, W)}:eq(1)`,
        "color",
        tableText.variantSelectTextColorRgba,
        true,
      ); // source: TagsRenderer.jsx:40
    });

    it("options — Dynamic option replaces the static list, re-labels the chip, and Options loading state swaps the menu for a loader", () => {
      openColumnPopover(C);
      // Gated CONTROL: "Options loading state" is rendered inside the `useDynamicOptions`
      // truthy branch (OptionsList.jsx:337-367), so it cannot exist yet.
      cy.get(
        tableSelector.columnParamToggle(tableText.labelOptionsLoadingState),
      ).should("not.exist"); // source: OptionsList.jsx:352-366

      toggleColumnFx(tableText.labelDynamicOption); // source: OptionsList.jsx:322-336
      verifyColumnProperty(
        tableText.labelDynamicOption,
        tableText.variantSelectToggleDefault,
      ); // source: ProgramaticallyHandleProperties.jsx:87
      toggleColumnFx(tableText.labelDynamicOption);
      toggleDynamicOptions(); // source: OptionsList.jsx:322-336

      // The whole static list + "Add new tag" button is replaced by ONE CodeHinter
      // (OptionsList.jsx:339-351). That CodeHinter has no paramLabel and no wrapper data-cy
      // of its own, so it is reached through the accordion as its container.
      cy.get(
        tableSelector.optionListItem(
          tableText.variantTagsShippedRow0FirstLabel,
        ),
      ).should("not.exist"); // source: OptionsList.jsx:384-422
      cy.get(tableSelector.optionsAccordion).should(
        "not.contain.text",
        tableText.buttonAddNewTag,
      ); // source: OptionsList.jsx:432-442
      cy.get(
        tableSelector.columnParamToggle(tableText.labelOptionsLoadingState),
      ).should("not.be.checked"); // source: OptionsList.jsx:352-366

      setColumnCodeField(
        tableSelector.optionsAccordion,
        tableText.variantTagsShippedDynamicOptions,
      ); // source: OptionsList.jsx:339-351
      // The menu is only reachable on an editable cell (TagsRenderer.jsx:440).
      toggleColumnProperty(tableText.labelMakeEditable); // source: PropertiesTabElements.jsx:385-400
      closeColumnPopover(C);

      // generateColumnsData.js:337-350 swaps `column.options` for the resolved dynamic
      // array, so row 0's first value 'Reading' resolves to the NEW label while its other
      // two tags fall back to String(value) (TagsRenderer.jsx:361-366).
      cy.forceClickOnCanvas();
      cy.get(tableSelector.cellTagChip(C, 0, W))
        .first()
        .scrollIntoView()
        .should("have.text", tableText.variantTagsShippedDynamicFirstLabel); // source: generateColumnsData.js:339
      cy.get(tableSelector.cellTagChip(C, 0, W))
        .eq(1)
        .should("have.text", tableText.variantTagsShippedRow0Labels[1]); // source: TagsRenderer.jsx:361-366

      // With options loading, TagsInputMenuList.jsx:54 replaces the whole option body with
      // a centred <Loader> — so the two halves of the menu are mutually exclusive.
      openTagsMenu(0);
      cy.get(tableSelector.tagsMenuBody).should("exist"); // source: TagsInputMenuList.jsx:56
      cy.get(tableSelector.tagsMenuLoadingState).should("not.exist"); // source: TagsInputMenuList.jsx:111

      openColumnPopover(C);
      switchColumnTab(tableText.columnTabProperties); // source: ColumnPopover.jsx:149
      toggleColumnProperty(tableText.labelOptionsLoadingState); // source: OptionsList.jsx:352-366
      closeColumnPopover(C);

      cy.forceClickOnCanvas();
      openTagsMenu(0);
      cy.get(tableSelector.tagsMenuLoadingState).should("exist"); // source: TagsInputMenuList.jsx:110-113
      cy.get(tableSelector.tagsMenuBody).should("not.exist"); // source: TagsInputMenuList.jsx:54-56
    });

    // ═══════════════════════════════════════════════════════════════════════════
    // TYPE-SHARED STYLES (Styles tab)
    // ═══════════════════════════════════════════════════════════════════════════

    it("styles — the alignment label reads `Text Alignment` for tagsV2 and moves both the cell and the value container", () => {
      openColumnPopover(C);
      switchColumnTab(tableText.columnTabStyles); // source: ColumnPopover.jsx:157
      // StylesTabElements.jsx:32-34 shortens the label to plain "Alignment" for
      // boolean / image / rating ONLY — `tagsV2` keeps the full "Text Alignment".
      cy.get(tableSelector.columnPopover).should(
        "contain.text",
        tableText.labelTextAlignment,
      ); // source: StylesTabElements.jsx:33
      setColumnAlignment(tableText.alignCenter); // source: StylesTabElements.jsx:44
      closeColumnPopover(C);

      cy.forceClickOnCanvas();
      cy.get(tableSelector.cell(C, 0, W))
        .scrollIntoView()
        .should("have.class", tableText.cellClassAlignCenter); // source: TableRow.jsx:114
      // The same value is ALSO threaded into react-select's own valueContainer style
      // (TagsRenderer.jsx:290-300), which is what actually moves the chips.
      cy.get(tableSelector.cellTagsValueContainer(C, 0, W)).should(
        "have.css",
        "justify-content",
        tableText.variantSelectJustifyCenter,
      ); // source: TagsRenderer.jsx:299
    });

    it("styles — Cell color paints the rendered cell background", () => {
      openColumnPopover(C);
      switchColumnTab(tableText.columnTabStyles); // source: ColumnPopover.jsx:157
      // `cellBackgroundColor` IS offered for tagsV2 — StylesTabElements.jsx:128-145 lists
      // it in the shared block. The default is the design token var(--cc-surface1-surface);
      // BaseColorSwatches renders the token NAME rather than the raw var (:153-157).
      verifyColumnColor(tableText.labelCellColor, tableText.colorTokenSurface1); // source: ProgramaticallyHandleProperties.jsx:35
      setColumnColor(
        tableText.labelCellColor,
        tableText.variantSelectCellColorRgba,
      ); // source: StylesTabElements.jsx:163-176
      closeColumnPopover(C);

      // cellBackgroundColor lands as an inline backgroundColor on the <td> itself.
      cy.forceClickOnCanvas();
      verifyWidgetColorCss(
        tableSelector.cell(C, 0, W),
        "background-color",
        tableText.variantSelectCellColorRgba,
        true,
      ); // source: TableRow.jsx:81
    });

    // ═══════════════════════════════════════════════════════════════════════════
    // CELL RENDERING CONTRACT
    // ═══════════════════════════════════════════════════════════════════════════

    it("cell rendering — the tags cell is identified by its inner DOM, never by `has-select` (F33)", () => {
      cy.forceClickOnCanvas();
      cy.get(tableSelector.cell(C, 0, W)).scrollIntoView();
      // F33: TableRow.jsx:127 gives select, newMultiSelect AND tagsV2 the same class, so
      // these three inner nodes — mounted by generateColumnsData.js:372 → TagsRenderer →
      // _ui/Select — are what actually identify the renderer.
      verifyCellType(C, 0, tableText.cellClassByType.tagsV2, W); // source: TableRow.jsx:127
      cy.get(tableSelector.cellTagsSelect(C, 0, W)).should("have.length", 1); // source: generateColumnsData.js:372
      cy.get(tableSelector.cellTagsControl(C, 0, W)).should("have.length", 1); // source: SelectComponent.jsx:85
      cy.get(tableSelector.cellTagsValueContainer(C, 0, W)).should(
        "have.length",
        1,
      ); // source: TagsRenderer.jsx:290-300
      // The chips themselves carry NO class of any kind: BOTH chip components deliberately
      // drop react-select's innerProps (TagsRenderer.jsx:62-64 and :66-99), which is why
      // `> div:not([class])` is the only stable hook for them.
      cy.get(tableSelector.cellTagChip(C, 0, W)).should(
        "have.length",
        tableText.variantTagsShippedRow0ChipCount,
      ); // source: TagsRenderer.jsx:62-64
      tableText.variantTagsShippedRow0Labels.forEach((label, i) => {
        cy.get(tableSelector.cellTagChip(C, 0, W))
          .eq(i)
          .should("have.text", label); // source: table.js:692
      });
    });

    it("cell rendering — an editable tags cell commits the picked tag from the portalled menu", () => {
      openColumnPopover(C);
      toggleColumnProperty(tableText.labelMakeEditable); // source: PropertiesTabElements.jsx:385-400
      closeColumnPopover(C);

      cy.forceClickOnCanvas();
      openTagsMenu(0);
      // `hideSelectedOptions` (TagsRenderer.jsx:451) drops the three tags row 0 already
      // holds, so exactly seven of the ten shipped options are offered.
      cy.get(tableSelector.tagsMenuOptionChip).should(
        "have.length",
        tableText.variantTagsShippedMenuOptionCount,
      ); // source: TagsRenderer.jsx:451
      cy.get(tableSelector.tagsMenuOptionChip)
        .filter(
          (_i, el) =>
            el.innerText.trim() === tableText.variantTagsShippedOptions[3],
        )
        .first()
        .click({ force: true });

      // TagsV2ColumnAdapter.jsx:67-69 normalises the new array and commits it through
      // handleCellValueChange (generateColumnsData.js:359), so a FOURTH chip is proof the
      // value reached the row data.
      cy.get(tableSelector.cellTagChip(C, 0, W)).should(
        "have.length",
        tableText.variantTagsShippedRow0ChipCount + 1,
      ); // source: TagsV2ColumnAdapter.jsx:67-69
      cy.get(tableSelector.cellTagChip(C, 0, W))
        .last()
        .should("have.text", tableText.variantTagsShippedOptions[3]); // source: TagsRenderer.jsx:359-366
      // The cell is now flagged as edited by the change set (TableRow.jsx:136).
      cy.get(tableSelector.cell(C, 0, W)).should(
        "have.class",
        tableText.cellClassEdited,
      ); // source: TableRow.jsx:136
    });
  },
);
