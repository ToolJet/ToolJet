/**
 * SPEC — Table — variants/select.
 *
 * FOR AI: covers the `select` COLUMN TYPE of the Table widget end to end — type
 * switching / column creation, the shared column controls, the whole OptionsList
 * block (seeded defaults, per-option label/value/colours, "Make this option as
 * default", Auto assign colors, Dynamic option, Options loading state), the one
 * validation it mounts (customRule) and the rendered react-select cell.
 * Source root: frontend/src/AppBuilder/RightSideBar/Inspector/Components/Table/
 * (`columns` is declared bare as `type:'array'` at table.js:44, so NONE of these
 * controls live in the widget config — they live in the ColumnManager).
 *
 * ── THE ONE BEHAVIOURAL DIFFERENCE FROM newMultiSelect ──────────────────────
 * `select` and `newMultiSelect` share EVERY inspector control and BOTH render
 * through CustomSelectColumn → SelectRenderer (generateColumnsData.js:293-334);
 * `isMulti={columnType === 'newMultiSelect'}` (:325) is the only switch. The one
 * place the INSPECTOR itself branches is "Make this option as default":
 * OptionsList.jsx:132-141 special-cases `columnType === 'select'` and makes the
 * flag SINGLE-select — choosing an option `unset`s the flag on every other option
 * and rewrites `defaultOptionsList` to a ONE-element array. The else branch
 * (:141-155), used by newMultiSelect/tagsV2, accumulates instead. That asymmetry
 * is asserted head-on below ("marking a second option default CLEARS the first"),
 * and the mirror-image assertion lives in variants/newMultiSelect.cy.js.
 *
 * ── WHY A SEEDED DATASET AND A beforeEach TYPE SWITCH ───────────────────────
 * The shipped seed data (table.js:692) has no option-shaped field, and
 * autoGenerateColumns maps `typeof 'Reading' === 'string'` to columnType 'string'
 * (autoGenerateColumns.js:110-119) — so an option-valued key auto-generates as a
 * STRING column. beforeEach seeds `[{ id, hobby, alt }, …]` with setTableData()
 * and re-types the generated `hobby` column to `select` once. The type switch is
 * ALSO what seeds DEFAULT_SELECT_COLUMN_OPTIONS onto the column
 * (useColumnManager.js:24-34 → utils.js:23-28), so every it() below starts from a
 * real, data-bound select column with four real options while still relying on
 * nothing but beforeEach.
 * Row 2's value is the EMPTY STRING on purpose: SelectComponent.jsx:52 resolves
 * `value ? … : defaultValue`, so an empty cell is the ONLY place
 * `defaultOptionsList` is observable on the rendered side.
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
 * including the realClick setColumnColor ends on — so this spec closes it through
 * the conditional `closeOptionPopover()` below rather than assuming a state.
 *
 * ── PRODUCT BUGS / SOURCE QUIRKS HONOURED HERE ──────────────────────────────
 *  F1 (HIGH)  NO validation control has a usable data-cy. ValidationProperties'
 *      getValidationList declares the key `dateCy` (:91 for customRule) but all
 *      three render branches read `validation.dataCy` (:179,:199,:216), so React
 *      drops `data-cy={undefined}`. `setColumnValidation`/`verifyColumnValidation`
 *      therefore select by LABEL TEXT inside
 *      `.optional-properties-when-editable-true`.
 *  F16 (MED)  DUPLICATE data-cy in the option popover: BOTH the "Option label"
 *      and "Option value" <label>s are emitted as `label-action-button-text`
 *      (OptionsList.jsx:183 and :201), and neither CodeHinter is given a
 *      paramLabel, so both inputs collapse to the non-unique `-input-field`.
 *      `setOptionLabelValue` disambiguates POSITIONALLY (index 0 = label,
 *      index 1 = value) — which is only valid while the Label/Option colour
 *      swatches below them have Fx OFF, as they are by default.
 *  F31 (LOW, new) AN EMPTY SINGLE-SELECT CELL RENDERS AN EMPTY COLOURED CHIP
 *      INSTEAD OF THE PLACEHOLDER. SelectRenderer.jsx:344-354 hands react-select
 *      `defaultValue = {}` (an OBJECT) when `defaultOptionsList` is empty and
 *      isMulti is false, and SelectComponent.jsx:52 forwards it because `{}` is
 *      truthy. react-select's cleanValue wraps a non-null object into `[{}]`, so
 *      hasValue is TRUE, the Placeholder is suppressed and a SingleValue with no
 *      text is painted. The isMulti branch returns `[]` instead and DOES show
 *      "Select.." — see variants/newMultiSelect.cy.js. Asserted below rather than
 *      papered over.
 *  F32 (LOW, new) OPTION ROWS CANNOT BE DELETED FROM AN AUTOMATED RUN. The row's
 *      trash button is gated on hover state (`deleteIconOutsideMenu && isHovered`,
 *      ToolJetUI/List/List.jsx:142) and carries NO data-cy (the `data-cy={'page-menu'}`
 *      line is commented out at :144), so neither the delete path nor the
 *      `no-items-banner-columns` empty state (OptionsList.jsx:430) is reachable.
 *  F19       the column-list data-cy is NOT normalised (Table.jsx:571
 *      interpolates the raw display name), so all helpers use `columnListItem`
 *      rather than the older normalising `tableSelector.columnItem`.
 *  F21       cell COLOUR assertions never use `tableSelector.cellContent` (`<td> div`,
 *      which matches the outer `.td-container` wrapper and computes to inherited
 *      black). A select chip is addressed by its own react-select class instead.
 *
 * Helpers (all resolved through cypress/support/componentAutomation/type-helper-index.md):
 *   components/table.js — resizeTableWidget, setTableData, openColumnPopover,
 *     closeColumnPopover, switchColumnTab, setColumnType, addColumnOfType,
 *     deleteColumn, verifyAndEnterColumnOptionInput, setColumnCodeField,
 *     verifyColumnCodeField, setColumnProperty, verifyColumnProperty,
 *     toggleColumnProperty, toggleColumnFx, setColumnColor, verifyColumnColor,
 *     setColumnValidation, verifyColumnValidation, setColumnAlignment,
 *     setPinPosition, verifyCellType, addColumnOption, openColumnOption,
 *     setOptionLabelValue, setOptionColor, toggleMakeDefaultOption,
 *     toggleAutoAssignColors, toggleDynamicOptions
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
  "Table — variants/select column type",
  { testIsolation: false },
  () => {
    const W = tableText.defaultWidgetName; // 'table1'
    const C = tableText.variantSelectColumn; // 'hobby' — autoGenerateColumns.js:96

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
    // helper (setOptionColor is the write-side counterpart), and both swatches ARE addressable
    // by displayName — they are mounted with real paramMeta.displayName values
    // (OptionsList.jsx:227 "Label color", :240 "Option color"), unlike the F3 group.
    const verifyOptionColor = (optionLabel, colorLabel, expected) => {
      openColumnOption(optionLabel);
      verifyColumnColor(colorLabel, expected);
      // Leave the popover SHUT: openColumnOption() clicks the row, and the OverlayTrigger
      // toggles (OptionsList.jsx:388-393), so a caller that follows this with setOptionColor
      // would otherwise close the popover instead of re-opening it.
      closeOptionPopover();
    };

    // The "Make this option as default" switch, read back from the OPEN option popover.
    // ProgramaticallyHandleProperties.jsx:15-17 feeds it `props[optionIndex].makeDefaultOption`
    // and Toggle.jsx:24 binds that straight to the checkbox's `checked`.
    const verifyOptionIsDefault = (optionLabel, expected) => {
      openColumnOption(optionLabel);
      cy.get(
        tableSelector.columnParamToggle(tableText.labelMakeDefaultOption),
      ).should(expected ? "be.checked" : "not.be.checked"); // source: OptionsList.jsx:244-258
      closeOptionPopover();
    };

    beforeEach(() => {
      cy.apiLogin();
      cy.apiCreateApp(`${fake.companyName}-Table-Select-Column`); // dynamic: fake
      cy.openApp();
      cy.viewport(1400, 2200);
      cy.dragAndDropWidget("Table", 250, 100);
      cy.hideTooltip();
      cy.modifyCanvasSize(900, 800);
      cy.get("[data-cy='left-sidebar-settings-button']").click();
      resizeTableWidget(W, 750, 600);
      resizeQueryPanel("1");
      openEditorSidebar(W);
      // Seed the select dataset. setTableData ends with a canvas click (which deselects the
      // widget and closes the Inspector), so the sidebar is re-opened afterwards.
      setTableData(tableText.variantSelectData); // source: autoGenerateColumns.js:110-119
      openEditorSidebar(W);
      // A string-valued key auto-generates as `string`, so the type switch is what makes the
      // column a SELECT column — and what seeds DEFAULT_SELECT_COLUMN_OPTIONS onto it
      // (useColumnManager.js:24-34). setColumnType opens the popover itself; close it again so
      // every it() starts from the same state (column list on screen, popover shut).
      setColumnType(C, tableText.columnTypeValue.select); // source: PropertiesTabElements.jsx:129
      closeColumnPopover(C);
    });

    afterEach(() => {
      cy.apiDeleteApp();
    });

    // ═══════════════════════════════════════════════════════════════════════════
    // COLUMN CREATION / TYPE SWITCH
    // ═══════════════════════════════════════════════════════════════════════════

    it("column type — a string column re-typed to `select` renders a react-select cell, and the type can be switched away and back", () => {
      openColumnPopover(C);
      // SelectComponent.jsx:52 resolves the raw stored value ('select') back to its option,
      // so the react-select SingleValue renders the option LABEL.
      cy.get(tableSelector.columnPopover)
        .find(tableSelector.columnTypeSelect)
        .should("contain.text", tableText.columnTypeLabel.select); // source: PropertiesTabElements.jsx:129
      closeColumnPopover(C);

      cy.forceClickOnCanvas();
      cy.get(tableSelector.cell(C, 0, W)).scrollIntoView();
      // `select` is one of the eight types that DO add a discriminating <td> class — but it
      // SHARES `has-select` with newMultiSelect and tagsV2 (TableRow.jsx:127), so the class
      // alone is not proof of which renderer ran. `.select-search.table-select-search` is the
      // className CustomSelectColumn is mounted with (generateColumnsData.js:328).
      verifyCellType(C, 0, tableText.cellClassByType.select, W); // source: TableRow.jsx:127
      cy.get(tableSelector.cellSelectControl(C, 0, W)).should("have.length", 1); // source: generateColumnsData.js:328
      // isMulti is FALSE for `select` (:325), so the value is a SingleValue, never a
      // multi-value chip.
      cy.get(tableSelector.cellSelectSingleValue(C, 0, W)).should(
        "have.text",
        tableText.variantSelectRow0Label,
      ); // source: SelectRenderer.jsx:325-336
      cy.get(tableSelector.cellSelectMultiValueLabel(C, 0, W)).should(
        "not.exist",
      ); // source: generateColumnsData.js:325

      // Switch to `string`: the textarea renderer takes over and the react-select is gone.
      setColumnType(C, tableText.columnTypeValue.string); // source: PropertiesTabElements.jsx:125
      closeColumnPopover(C);
      cy.forceClickOnCanvas();
      verifyCellType(C, 0, tableText.cellClassByType.string, W); // source: TableRow.jsx:132
      cy.get(tableSelector.cellSelectControl(C, 0, W)).should("not.exist"); // source: generateColumnsData.js:311
      cy.get(tableSelector.cell(C, 0, W)).should(
        "not.have.class",
        tableText.cellClassByType.select,
      ); // source: TableRow.jsx:127

      // …and back to `select`, which restores both the class and the react-select. The option
      // list survives the round trip: handlePropertyChange only re-seeds the defaults when the
      // column has NO options (useColumnManager.js:25-33).
      setColumnType(C, tableText.columnTypeValue.select); // source: PropertiesTabElements.jsx:129
      closeColumnPopover(C);
      cy.forceClickOnCanvas();
      verifyCellType(C, 0, tableText.cellClassByType.select, W); // source: TableRow.jsx:127
      cy.get(tableSelector.cellSelectSingleValue(C, 0, W)).should(
        "have.text",
        tableText.variantSelectRow0Label,
      ); // source: SelectRenderer.jsx:325
    });

    it("column manager — a `select` column can be added, bound to a key and deleted", () => {
      // addColumnOfType sets the TYPE first (so the OptionsList block mounts and the option
      // defaults are seeded), then the name, then the key — the key is what the row data is
      // read from (generateColumnsData.js:163 accessorKey = column.key || column.name).
      addColumnOfType(
        tableText.variantNewSelectColumn,
        tableText.columnTypeValue.select, // source: PropertiesTabElements.jsx:129
        tableText.variantSelectColumn, // source: autoGenerateColumns.js:96
      );
      closeColumnPopover(tableText.variantNewSelectColumn);

      cy.forceClickOnCanvas();
      cy.get(tableSelector.columnHeader(tableText.variantNewSelectColumn))
        .scrollIntoView()
        .should("have.text", tableText.variantNewSelectColumn); // source: TableHeader.jsx:153
      // Bound to the same `hobby` key, so it resolves the same option as the seed column.
      cy.get(
        tableSelector.cellSelectSingleValue(
          tableText.variantNewSelectColumn,
          0,
          W,
        ),
      ).should("have.text", tableText.variantSelectRow0Label); // source: SelectRenderer.jsx:325

      // deleteColumn drives the popover header's [title="Delete column"] and asserts BOTH the
      // inspector row and the rendered header are gone.
      deleteColumn(tableText.variantNewSelectColumn); // source: ColumnPopover.jsx:130-138
    });

    // ═══════════════════════════════════════════════════════════════════════════
    // SHARED PROPERTIES (Properties tab)
    // ═══════════════════════════════════════════════════════════════════════════

    it("properties — Column name renames the rendered column, Key rebinds its data", () => {
      openColumnPopover(C);
      verifyColumnCodeField(tableSelector.columnNameField, C); // source: PropertiesTabElements.jsx:164-181
      verifyColumnCodeField(
        tableSelector.columnKeyField,
        tableText.variantSelectColumn,
      ); // source: PropertiesTabElements.jsx:182-197

      // Renaming re-keys the rendered header AND every cell data-cy, because both are derived
      // from `columnDef.header` = the resolved column name (generateColumnsData.js:165 →
      // TableHeader.jsx:153 / TableRow.jsx:102-105).
      verifyAndEnterColumnOptionInput(
        tableText.labelColumnName,
        tableText.variantRenamedSelectColumn,
      ); // source: PropertiesTabElements.jsx:166
      closeColumnPopover(tableText.variantRenamedSelectColumn);
      cy.forceClickOnCanvas();
      cy.get(tableSelector.columnHeader(tableText.variantRenamedSelectColumn))
        .scrollIntoView()
        .should("have.text", tableText.variantRenamedSelectColumn); // source: TableHeader.jsx:153
      cy.get(
        tableSelector.cellSelectSingleValue(
          tableText.variantRenamedSelectColumn,
          0,
          W,
        ),
      ).should("have.text", tableText.variantSelectRow0Label); // source: SelectRenderer.jsx:325

      // The Key is the accessor, so re-pointing it at `alt` — whose row-0 value is a DIFFERENT
      // member of the same option list — swaps the resolved chip while the header (and
      // therefore the data-cy) stays put.
      openColumnPopover(tableText.variantRenamedSelectColumn);
      verifyAndEnterColumnOptionInput(
        tableText.labelKey,
        tableText.variantSelectAltKey,
      ); // source: PropertiesTabElements.jsx:183
      closeColumnPopover(tableText.variantRenamedSelectColumn);
      cy.forceClickOnCanvas();
      cy.get(
        tableSelector.cellSelectSingleValue(
          tableText.variantRenamedSelectColumn,
          0,
          W,
        ),
      ).should("have.text", tableText.variantSelectAltRow0Label); // source: generateColumnsData.js:163
    });

    it("properties — Transformation rewrites the value the option list is matched against", () => {
      openColumnPopover(C);
      verifyColumnCodeField(
        tableSelector.columnTransformationField,
        tableText.defaultTransformation,
      ); // source: PropertiesTabElements.jsx:205

      // columnSlice.js:99 deliberately DROPS a transformation equal to '{{cellValue}}', so only
      // a real expression reaches transformTableData.js:33, which rewrites the row's value for
      // this key BEFORE the renderer resolves it against `options`
      // (SelectRenderer.jsx:356-368). Remapping row 0's 'Reading' to 'Music' keeps the value
      // inside the option list, so the chip LABEL must change. See the constant's comment
      // for why this is a String.replace and not a ternary.
      setColumnCodeField(
        tableSelector.columnTransformationField,
        tableText.variantSelectTransformation,
      ); // source: PropertiesTabElements.jsx:200-218
      closeColumnPopover(C);

      cy.forceClickOnCanvas();
      cy.get(tableSelector.cell(C, 0, W)).scrollIntoView();
      cy.get(tableSelector.cellSelectSingleValue(C, 0, W)).should(
        "have.text",
        tableText.variantSelectTransformedRow0Label,
      ); // source: transformTableData.js:33
      // Row 1 is untouched (its value contains no 'Reading'), which proves the
      // transformation ran per-row rather than replacing the column wholesale.
      cy.get(tableSelector.cellSelectSingleValue(C, 1, W)).should(
        "have.text",
        tableText.variantSelectRow1Label,
      ); // source: variantSelectData row 1
    });

    it("properties — Visibility (fx) removes the column from the rendered table", () => {
      openColumnPopover(C);
      // `columnVisibility` is rendered by ProgramaticallyHandleProperties, so it is fx-capable:
      // the fx button exists and turning it ON is what mounts the code field
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

      // generateColumnsData.js:159 returns null for an invisible column, so the whole column —
      // header AND cells — is removed from the rendered table.
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

    it("properties — Make editable un-disables the react-select and mounts the dropdown indicator", () => {
      // Read-only first: generateColumnsData.js:320 passes `disabled={!isEditable}` straight to
      // react-select's isDisabled, and SelectRenderer.jsx:277 mounts the custom
      // DropdownIndicator ONLY when isEditable — so the untouched column is a disabled control
      // with NO caret.
      cy.forceClickOnCanvas();
      cy.get(tableSelector.cellSelectControlBox(C, 0, W))
        .scrollIntoView()
        .should("have.class", tableText.variantSelectControlDisabledClass); // source: SelectRenderer.jsx:424
      cy.get(tableSelector.cellSelectDropdownIcon(C, 0, W)).should("not.exist"); // source: SelectRenderer.jsx:277

      openColumnPopover(C);
      // `isEditable` IS offered for select — PropertiesTabElements.jsx:385 excludes only
      // image / link / button.
      toggleColumnProperty(tableText.labelMakeEditable); // source: PropertiesTabElements.jsx:385-400
      closeColumnPopover(C);

      cy.forceClickOnCanvas();
      cy.get(tableSelector.cellSelectControlBox(C, 0, W))
        .scrollIntoView()
        .should("not.have.class", tableText.variantSelectControlDisabledClass); // source: SelectRenderer.jsx:424
      cy.get(tableSelector.cellSelectDropdownIcon(C, 0, W)).should(
        "have.length",
        1,
      ); // source: SelectRenderer.jsx:163-165
      // TableRow.jsx:118 ORs `has-text` with isEditable, so an editable select cell picks up
      // the text-column class on top of its own `has-select`.
      cy.get(tableSelector.cell(C, 0, W))
        .should("have.class", tableText.cellClassEditable) // source: TableRow.jsx:135
        .and("have.class", tableText.cellClassByType.select); // source: TableRow.jsx:127
    });

    // ═══════════════════════════════════════════════════════════════════════════
    // VALIDATIONS — customRule is the ONLY one a select column mounts
    // ═══════════════════════════════════════════════════════════════════════════

    it("validations — `customRule` is the only validation a select column mounts, and its message reaches the cell (F1)", () => {
      openColumnPopover(C);
      // The block only mounts once the column is editable (PropertiesTabElements.jsx:401).
      toggleColumnProperty(tableText.labelMakeEditable); // source: PropertiesTabElements.jsx:385-400

      // getValidationList's `select` branch returns exactly ONE entry
      // (ValidationProperties.jsx:97-108) — so the length/label assertions below are the
      // discriminator against string/number, which return three or four.
      cy.get(tableSelector.columnValidationLabels).should("have.length", 1); // source: ValidationProperties.jsx:97-108
      cy.get(tableSelector.columnValidationLabels).should(
        "have.text",
        tableText.labelCustomRule,
      ); // source: ValidationProperties.jsx:93
      cy.get(tableSelector.columnPopover)
        .should("not.contain.text", tableText.labelRegex) // source: ValidationProperties.jsx:43
        .and("not.contain.text", tableText.labelMinLength); // source: ValidationProperties.jsx:52

      // F1: the field has NO data-cy (getValidationList writes `dateCy`, the render branch at
      // :216 reads `validation.dataCy`), so the helper matches on the <label> text.
      setColumnValidation(
        tableText.labelCustomRule,
        tableText.variantSelectCustomRule,
      ); // source: ValidationProperties.jsx:97-108 (F1)
      verifyColumnValidation(
        tableText.labelCustomRule,
        tableText.variantSelectCustomRule,
      ); // source: ValidationProperties.jsx:216 (F1)
      closeColumnPopover(C);

      // SelectColumnAdapter.jsx:40-47 resolves the rule against `value` (NOT cellValue), and
      // _helpers/utils.js:458-461 treats a non-empty STRING as the failure, using it verbatim
      // as the message. SelectRenderer.jsx:441-448 renders that message only while the column
      // is editable AND the value is invalid.
      cy.forceClickOnCanvas();
      cy.get(tableSelector.cellInvalidFeedback(C, 0, W))
        .scrollIntoView()
        .should("have.text", tableText.variantSelectCustomRuleErrorRow0); // source: _helpers/utils.js:460
      // Row 2's value is the empty string, so the rule resolves to '' and the row stays valid —
      // proof the message is per-cell rather than per-column.
      cy.get(tableSelector.cellInvalidFeedback(C, 2, W)).should("not.exist"); // source: _helpers/utils.js:459
    });

    // ═══════════════════════════════════════════════════════════════════════════
    // OPTIONS LIST (SelectOptionsList/OptionsList.jsx)
    // ═══════════════════════════════════════════════════════════════════════════

    it("options — the type switch seeds DEFAULT_SELECT_COLUMN_OPTIONS into an accordion titled `Options`", () => {
      openColumnPopover(C);
      // OptionsList.jsx:271 titles the accordion 'Tags' for tagsV2 and 'Options' for
      // select / newMultiSelect, and AccordionItem.js:39/:51 stamp the title into the header
      // and label data-cy — so the accordion TITLE is itself a type discriminator, and this is
      // how the spec proves it is NOT looking at the tagsV2 variant of the same component.
      cy.get(tableSelector.optionsAccordionLabel).should(
        "have.text",
        tableText.variantSelectAccordionTitle,
      ); // source: OptionsList.jsx:271 + AccordionItem.js:51
      cy.get(tableSelector.optionsAccordionHeader).should(
        "contain.text",
        tableText.variantSelectAccordionTitle,
      ); // source: AccordionItem.js:39

      // useColumnManager.js:25-33 seeds DEFAULT_SELECT_COLUMN_OPTIONS on the type switch, and
      // OptionsList.jsx:407 lists each one as `column-<raw label>` (NOT normalised, F19) with
      // the label rendered inside List.jsx:58's `pages-name-<normalised>` cell.
      tableText.variantSelectDefaultOptions.forEach((label) => {
        cy.get(tableSelector.optionListItem(label))
          .find(tableSelector.columnListItemLabel(label))
          .should("have.text", label); // source: utils.js:23-28
      });
      // The empty state is mutually exclusive with a populated list (OptionsList.jsx:430).
      cy.get(tableSelector.optionsEmptyState).should("not.exist"); // source: OptionsList.jsx:430

      // `tagsV2`-only controls must NOT be here: OptionsList.jsx:305-321 gates "Allow multiple
      // selection" and :274-289 gates "Sort tags" on `columnType === 'tagsV2'`.
      cy.get(
        tableSelector.columnParamToggle(tableText.labelAllowMultipleSelection),
      ).should("not.exist"); // source: OptionsList.jsx:305
      cy.get(tableSelector.optionsAccordion).should(
        "not.contain.text",
        tableText.labelSortTags,
      ); // source: OptionsList.jsx:277
      closeColumnPopover(C);
    });

    it("options — rewriting an option's label re-labels the rendered chip while its value keeps matching (F16)", () => {
      openColumnPopover(C);
      // F16: both CodeHinters in the option popover collapse to the duplicate `-input-field`,
      // so setOptionLabelValue writes the VALUE at index 1 first and the LABEL at index 0 last
      // — last because the option row's data-cy is keyed off the label.
      // Only the LABEL is changed here: the option's value stays 'Reading', so row 0 still
      // RESOLVES to this option (SelectRenderer.jsx:366) but now renders the new label.
      setOptionLabelValue(
        tableText.variantSelectOptionReading,
        tableText.variantSelectRenamedOptionLabel,
      ); // source: OptionsList.jsx:182-199 (F16)
      closeOptionPopover();

      // The list row's data-cy follows the label (OptionsList.jsx:407).
      cy.get(
        tableSelector.optionListItem(tableText.variantSelectRenamedOptionLabel),
      )
        .find(
          tableSelector.columnListItemLabel(
            tableText.variantSelectRenamedOptionLabel,
          ),
        )
        .should("have.text", tableText.variantSelectRenamedOptionLabel); // source: List.jsx:58
      closeColumnPopover(C);

      cy.forceClickOnCanvas();
      cy.get(tableSelector.cellSelectSingleValue(C, 0, W))
        .scrollIntoView()
        .should("have.text", tableText.variantSelectRenamedOptionLabel); // source: SelectRenderer.jsx:366 + SelectComponent.jsx:79
      // Row 1 ('Photography') is a different option and is untouched.
      cy.get(tableSelector.cellSelectSingleValue(C, 1, W)).should(
        "have.text",
        tableText.variantSelectRow1Label,
      ); // source: variantSelectData row 1
    });

    it("options — a new option can be added, renamed and made default, and its label fills the empty cell", () => {
      openColumnPopover(C);
      // createNewOption appends `Option N`, skipping labels already taken (OptionsList.jsx:59-76)
      // — none of the four seeded defaults is an `Option N`, so it is `Option 1`.
      addColumnOption(tableText.buttonAddNewOption); // source: OptionsList.jsx:429-444
      cy.get(
        tableSelector.optionListItem(tableText.variantSelectNewOptionLabel),
      )
        .find(
          tableSelector.columnListItemLabel(
            tableText.variantSelectNewOptionLabel,
          ),
        )
        .should("have.text", tableText.variantSelectNewOptionLabel); // source: OptionsList.jsx:64-71

      setOptionLabelValue(
        tableText.variantSelectNewOptionLabel,
        tableText.variantSelectRenamedOptionLabel,
        tableText.variantSelectRenamedOptionValue,
      ); // source: OptionsList.jsx:182-217 (F16)
      closeOptionPopover();

      // Making it the default is the only way its label can reach the canvas: no seeded row
      // carries its value, and SelectComponent.jsx:52 falls back to `defaultValue` only for a
      // FALSY cell value — which row 2's empty string is.
      toggleMakeDefaultOption(tableText.variantSelectRenamedOptionLabel); // source: OptionsList.jsx:244-258
      closeOptionPopover();
      closeColumnPopover(C);

      cy.forceClickOnCanvas();
      // SelectRenderer.jsx:344-354 — for a single select, defaultValue is
      // `defaultOptionsList.slice(-1)[0]`, i.e. the ONE stored default option object.
      cy.get(tableSelector.cellSelectSingleValue(C, 2, W))
        .scrollIntoView()
        .should("have.text", tableText.variantSelectRenamedOptionLabel); // source: SelectRenderer.jsx:347
      // Rows that DO carry a value are unaffected — `value ? … : defaultValue`.
      cy.get(tableSelector.cellSelectSingleValue(C, 0, W)).should(
        "have.text",
        tableText.variantSelectRow0Label,
      ); // source: SelectComponent.jsx:52
    });

    it("options — `Make this option as default` is SINGLE-select for a select column: a second choice CLEARS the first", () => {
      openColumnPopover(C);
      toggleMakeDefaultOption(tableText.variantSelectOptionReading); // source: OptionsList.jsx:244-258
      closeOptionPopover();
      verifyOptionIsDefault(tableText.variantSelectOptionReading, true); // source: OptionsList.jsx:135-138
      closeColumnPopover(C);

      // Row 2's cell is empty, so it renders defaultOptionsList — which OptionsList.jsx:137
      // has just rewritten to the ONE-element array [Reading].
      cy.forceClickOnCanvas();
      cy.get(tableSelector.cellSelectSingleValue(C, 2, W))
        .scrollIntoView()
        .should("have.text", tableText.variantSelectOptionReading); // source: OptionsList.jsx:137
      cy.get(tableSelector.cellSelectSingleValue(C, 2, W)).should(
        "have.length",
        tableText.variantSelectSingleValueCount,
      ); // source: SelectRenderer.jsx:347

      // THE BRANCH THAT DEFINES THIS TYPE: for `columnType === 'select'`,
      // handleDefaultOptionSelection `unset`s makeDefaultOption on EVERY option before setting
      // it on the chosen one, and replaces defaultOptionsList wholesale (OptionsList.jsx:132-140).
      // newMultiSelect takes the else branch (:141-155) and would keep BOTH.
      openColumnPopover(C);
      toggleMakeDefaultOption(tableText.variantSelectOptionTraveling); // source: OptionsList.jsx:244-258
      closeOptionPopover();
      verifyOptionIsDefault(tableText.variantSelectOptionTraveling, true); // source: OptionsList.jsx:136
      verifyOptionIsDefault(tableText.variantSelectOptionReading, false); // source: OptionsList.jsx:134
      closeColumnPopover(C);

      cy.forceClickOnCanvas();
      cy.get(tableSelector.cellSelectSingleValue(C, 2, W))
        .scrollIntoView()
        .should("have.text", tableText.variantSelectOptionTraveling); // source: OptionsList.jsx:137
      cy.get(tableSelector.cellSelectSingleValue(C, 2, W)).should(
        "have.length",
        tableText.variantSelectSingleValueCount,
      ); // source: SelectRenderer.jsx:347
    });

    it("options — Auto assign colors paints the chip from COLORS[i], and an explicit Option color wins over it", () => {
      openColumnPopover(C);
      // The toggle's fx editor shows the terminal `{{false}}` default
      // (ProgramaticallyHandleProperties.jsx:87) until it is touched.
      toggleColumnFx(tableText.labelAutoAssignColors); // source: OptionsList.jsx:290-304
      verifyColumnProperty(
        tableText.labelAutoAssignColors,
        tableText.variantSelectToggleDefault,
      ); // source: ProgramaticallyHandleProperties.jsx:87
      toggleColumnFx(tableText.labelAutoAssignColors);
      toggleAutoAssignColors(); // source: OptionsList.jsx:290-304
      closeColumnPopover(C);

      // SelectRenderer.jsx:250-256 keys optionColors by the option VALUE, indexing COLORS by
      // the option's POSITION. `Reading` is options[0] → COLORS[0] === '#40474D33'; the colour
      // lands as the SingleValue's inline `background` (:329). F21: never assert this through
      // `cellContent`, which resolves to the outer `.td-container` wrapper.
      cy.forceClickOnCanvas();
      verifyWidgetColorCss(
        tableSelector.cellSelectSingleValue(C, 0, W),
        "background-color",
        tableText.variantSelectAutoColorReading,
        true,
      ); // source: SelectRenderer.jsx:13
      // Row 1's `Photography` is options[2] → COLORS[2] === '#6745E233', which proves the index
      // is per-option rather than per-row.
      verifyWidgetColorCss(
        tableSelector.cellSelectSingleValue(C, 1, W),
        "background-color",
        tableText.variantSelectAutoColorPhotography,
        true,
      ); // source: SelectRenderer.jsx:15

      // `option.optionColor ||` short-circuits BEFORE the autoAssignColors branch (:252-254),
      // so an explicit per-option colour must beat the auto-assigned one.
      openColumnPopover(C);
      // The popover re-opens on whichever tab was last active, and the OptionsList lives on
      // the Properties tab (PropertiesTabElements.jsx:503-517) — switch back explicitly.
      switchColumnTab(tableText.columnTabProperties); // source: ColumnPopover.jsx:149
      verifyOptionColor(
        tableText.variantSelectOptionReading,
        tableText.labelOptionColor,
        tableText.variantSelectDefaultOptionColor,
      );
      setOptionColor(
        tableText.variantSelectOptionReading,
        tableText.labelOptionColor,
        tableText.variantSelectOptionColorRgba,
      ); // source: OptionsList.jsx:231-243
      closeOptionPopover();
      closeColumnPopover(C);

      cy.forceClickOnCanvas();
      verifyWidgetColorCss(
        tableSelector.cellSelectSingleValue(C, 0, W),
        "background-color",
        tableText.variantSelectOptionColorRgba,
        true,
      ); // source: SelectRenderer.jsx:252
    });

    it("options — Label color overrides the column Text color on the rendered chip", () => {
      openColumnPopover(C);
      switchColumnTab(tableText.columnTabStyles); // source: ColumnPopover.jsx:157
      // `select` IS in the shared colour block (StylesTabElements.jsx:128-145) and is not the
      // boolean carve-out at :147, so Text color is offered and defaults to #11181C.
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
      // through, and SelectRenderer.jsx:333 uses it as the chip's `color` while the option has
      // no labelColor of its own.
      cy.forceClickOnCanvas();
      verifyWidgetColorCss(
        tableSelector.cellSelectSingleValue(C, 0, W),
        "color",
        tableText.variantSelectTextColorRgba,
        true,
      ); // source: SelectRenderer.jsx:333

      // `option?.labelColor ||` is evaluated FIRST (:333), so a per-option Label color must win
      // over the column-wide Text color.
      openColumnPopover(C);
      // The popover re-opens on whichever tab was last active, and the OptionsList lives on
      // the Properties tab (PropertiesTabElements.jsx:503-517) — switch back explicitly.
      switchColumnTab(tableText.columnTabProperties); // source: ColumnPopover.jsx:149
      verifyOptionColor(
        tableText.variantSelectOptionReading,
        tableText.labelLabelColor,
        tableText.variantSelectDefaultLabelColor,
      );
      setOptionColor(
        tableText.variantSelectOptionReading,
        tableText.labelLabelColor,
        tableText.variantSelectLabelColorRgba,
      ); // source: OptionsList.jsx:218-230
      closeOptionPopover();
      closeColumnPopover(C);

      cy.forceClickOnCanvas();
      verifyWidgetColorCss(
        tableSelector.cellSelectSingleValue(C, 0, W),
        "color",
        tableText.variantSelectLabelColorRgba,
        true,
      ); // source: SelectRenderer.jsx:333
      // Row 1 keeps the column-wide Text color — the override is per-OPTION, not per-column.
      verifyWidgetColorCss(
        tableSelector.cellSelectSingleValue(C, 1, W),
        "color",
        tableText.variantSelectTextColorRgba,
        true,
      ); // source: SelectRenderer.jsx:333
    });

    it("options — Dynamic option replaces the static list, re-labels the rendered chip and is what mounts Options loading state", () => {
      openColumnPopover(C);
      // Gated CONTROL: "Options loading state" is rendered inside the `useDynamicOptions`
      // truthy branch (OptionsList.jsx:339-367), so it cannot exist yet.
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

      // The whole static list + "Add new option" button is replaced by ONE CodeHinter
      // (OptionsList.jsx:339-351). That CodeHinter has no paramLabel and no wrapper data-cy of
      // its own, so it is reached through the accordion as its container.
      cy.get(
        tableSelector.optionListItem(tableText.variantSelectOptionReading),
      ).should("not.exist"); // source: OptionsList.jsx:384-422
      cy.get(tableSelector.optionsAccordion).should(
        "not.contain.text",
        tableText.buttonAddNewOption,
      ); // source: OptionsList.jsx:432-442
      cy.get(
        tableSelector.columnParamToggle(tableText.labelOptionsLoadingState),
      ).should("not.be.checked"); // source: OptionsList.jsx:352-366

      setColumnCodeField(
        tableSelector.optionsAccordion,
        tableText.variantSelectDynamicOptions,
      ); // source: OptionsList.jsx:339-351
      closeColumnPopover(C);

      // generateColumnsData.js:295-300 swaps `column.options` for the resolved dynamic array,
      // so row 0's value 'Reading' now resolves to the NEW label.
      cy.forceClickOnCanvas();
      cy.get(tableSelector.cellSelectSingleValue(C, 0, W))
        .scrollIntoView()
        .should("have.text", tableText.variantSelectDynamicFirstLabel); // source: generateColumnsData.js:297
    });

    // ═══════════════════════════════════════════════════════════════════════════
    // TYPE-SHARED STYLES (Styles tab)
    // ═══════════════════════════════════════════════════════════════════════════

    it("styles — the alignment label reads `Text Alignment` for select and moves both the cell and the value container", () => {
      openColumnPopover(C);
      switchColumnTab(tableText.columnTabStyles); // source: ColumnPopover.jsx:157
      // StylesTabElements.jsx:32-34 shortens the label to plain "Alignment" for
      // boolean / image / rating ONLY — `select` keeps the full "Text Alignment".
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
      // (SelectRenderer.jsx:305-315), which is what actually moves the chip.
      cy.get(tableSelector.cellSelectValueContainer(C, 0, W)).should(
        "have.css",
        "justify-content",
        tableText.variantSelectJustifyCenter,
      ); // source: SelectRenderer.jsx:314
    });

    it("styles — Cell color paints the rendered cell background", () => {
      openColumnPopover(C);
      switchColumnTab(tableText.columnTabStyles); // source: ColumnPopover.jsx:157
      // `cellBackgroundColor` IS offered for select — StylesTabElements.jsx:128-145 lists it in
      // the shared block. The default is the design token var(--cc-surface1-surface);
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

    it("cell rendering — an EMPTY select cell renders an empty coloured chip instead of the `Select..` placeholder (F31)", () => {
      cy.forceClickOnCanvas();
      cy.get(tableSelector.cell(C, 2, W)).scrollIntoView();
      // F31: with `defaultOptionsList` still empty, SelectRenderer.jsx:344-354 hands
      // react-select `defaultValue = {}` for a single select. SelectComponent.jsx:52 forwards
      // it because `{}` is truthy, react-select's cleanValue wraps a non-null object into
      // `[{}]`, hasValue becomes TRUE and the Placeholder is suppressed — leaving a SingleValue
      // with no text. The isMulti branch returns `[]` and DOES show "Select..", which is what
      // variants/newMultiSelect.cy.js asserts on the same row.
      cy.get(tableSelector.cellSelectSingleValue(C, 2, W))
        .should("have.length", tableText.variantSelectSingleValueCount)
        .and("have.text", ""); // source: SelectRenderer.jsx:352
      cy.get(tableSelector.cellSelectPlaceholder(C, 2, W)).should("not.exist"); // source: SelectComponent.jsx:28,52
      // The <td> still classifies as a select cell — the class is driven by columnType, not by
      // whether a value resolved.
      verifyCellType(C, 2, tableText.cellClassByType.select, W); // source: TableRow.jsx:127
    });

    it("cell rendering — an editable select cell opens a portalled menu and commits the picked option", () => {
      openColumnPopover(C);
      toggleColumnProperty(tableText.labelMakeEditable); // source: PropertiesTabElements.jsx:385-400
      closeColumnPopover(C);

      cy.forceClickOnCanvas();
      // The menu opens off react-select's own Control. _ui/Select defaults useMenuPortal=true
      // and SelectRenderer never overrides it (SelectComponent.jsx:83), so the menu is
      // PORTALLED TO document.body and must be queried globally, never inside the cell.
      cy.get(tableSelector.cellSelectControlBox(C, 1, W))
        .scrollIntoView()
        .click({ force: true });
      cy.get(tableSelector.selectMenu).should("be.visible"); // source: SelectRenderer.jsx:57
      // `hideSelectedOptions={false}` (:430) means nothing is filtered out, so all four seeded
      // options are listed.
      cy.get(tableSelector.selectMenuOptionPill).should(
        "have.length",
        tableText.variantSelectMenuOptionCount,
      ); // source: SelectRenderer.jsx:132

      cy.get(tableSelector.selectMenuOptionPill)
        .filter(
          (_i, el) =>
            el.innerText.trim() === tableText.variantSelectOptionMusic,
        )
        .first()
        .click({ force: true });
      // SelectComponent.jsx:54-57 hands a NON-multi change through as `data.value`, which
      // generateColumnsData.js:317 commits via handleCellValueChange — so the chip text is
      // proof the new value reached the row data.
      cy.get(tableSelector.cellSelectSingleValue(C, 1, W)).should(
        "have.text",
        tableText.variantSelectOptionMusic,
      ); // source: SelectComponent.jsx:57
      // Still single-select: exactly one value node, and never a multi-value chip.
      cy.get(tableSelector.cellSelectSingleValue(C, 1, W)).should(
        "have.length",
        tableText.variantSelectSingleValueCount,
      ); // source: generateColumnsData.js:325
      cy.get(tableSelector.cellSelectMultiValueLabel(C, 1, W)).should(
        "not.exist",
      ); // source: SelectRenderer.jsx:278-281
    });
  },
);
