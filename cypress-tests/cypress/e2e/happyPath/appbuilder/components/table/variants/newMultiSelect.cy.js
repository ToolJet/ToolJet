/**
 * SPEC — Table — variants/newMultiSelect.
 *
 * FOR AI: covers the `newMultiSelect` COLUMN TYPE of the Table widget end to end —
 * type switching / column creation, the shared column controls, the whole
 * OptionsList block (seeded defaults, per-option label/value/colours, "Make this
 * option as default", Auto assign colors, Dynamic option, Options loading state),
 * the one validation it mounts (customRule) and the rendered MULTI react-select
 * cell. Source root:
 * frontend/src/AppBuilder/RightSideBar/Inspector/Components/Table/
 * (`columns` is declared bare as `type:'array'` at table.js:44, so NONE of these
 * controls live in the widget config — they live in the ColumnManager).
 *
 * ── THE ONE BEHAVIOURAL DIFFERENCE FROM `select` ────────────────────────────
 * `newMultiSelect` and `select` share EVERY inspector control and BOTH render
 * through CustomSelectColumn → SelectRenderer (generateColumnsData.js:293-334);
 * `isMulti={columnType === 'newMultiSelect'}` (:325) is the only switch. The one
 * place the INSPECTOR itself branches is "Make this option as default":
 * OptionsList.jsx:132-140 special-cases `columnType === 'select'` and makes that
 * flag SINGLE-select, while the ELSE branch used here (:141-155) ACCUMULATES —
 * it pushes into `defaultOptionsList` when the flag goes on and splices out when
 * it goes off, leaving every previously-marked option untouched. So marking a
 * second option default must keep the FIRST one default too, and the empty cell
 * must render BOTH chips. That asymmetry is asserted head-on below, and the
 * mirror-image assertion lives in variants/select.cy.js.
 * The renderer amplifies the same split: SelectRenderer.jsx:344-354 hands
 * react-select the WHOLE `defaultOptionsList` in multi mode but only
 * `.slice(-1)[0]` in single mode.
 *
 * ── WHY A SEEDED DATASET AND A beforeEach TYPE SWITCH ───────────────────────
 * The shipped seed data (table.js:692) has no option-shaped field, and
 * autoGenerateColumns maps only string/number/boolean (autoGenerateColumns.js:
 * 110-119) — an ARRAY value falls through to columnType 'string'. beforeEach
 * seeds `[{ id, hobbies, alt }, …]` with setTableData() and re-types the
 * generated `hobbies` column to `newMultiSelect` once. The type switch is ALSO
 * what seeds DEFAULT_SELECT_COLUMN_OPTIONS onto the column
 * (useColumnManager.js:24-34 → utils.js:23-28), so every it() below starts from a
 * real, data-bound multiselect column with four real options while still relying
 * on nothing but beforeEach.
 * Row 0 carries TWO values so the chip COUNT is observable, row 1 exactly one,
 * and row 2 the EMPTY STRING — SelectComponent.jsx:52 resolves
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
 *  F31 (LOW, new) THE EMPTY-CELL RENDERING IS ASYMMETRIC BETWEEN THE TWO TYPES.
 *      SelectRenderer.jsx:344-354 returns `[]` for an empty multi column (so
 *      react-select's hasValue is false and the "Select.." placeholder shows —
 *      asserted below) but `{}` for an empty SINGLE column, which is TRUTHY, gets
 *      forwarded by SelectComponent.jsx:52 and is wrapped by react-select's
 *      cleanValue into `[{}]` — suppressing the placeholder and painting an empty
 *      coloured chip instead. The single-select half of that pair is asserted in
 *      variants/select.cy.js.
 *  F32 (LOW, new) OPTION ROWS CANNOT BE DELETED FROM AN AUTOMATED RUN. The row's
 *      trash button is gated on hover state (`deleteIconOutsideMenu && isHovered`,
 *      ToolJetUI/List/List.jsx:142) and carries NO data-cy (the `data-cy={'page-menu'}`
 *      line is commented out at :144), so neither the delete path nor the
 *      `no-items-banner-columns` empty state (OptionsList.jsx:430) is reachable.
 *  F33 (INFO, new) `newMultiSelect` SHARES THE `has-select` <td> CLASS with
 *      `select` and `tagsV2` (TableRow.jsx:127), so the class alone can never
 *      prove which of the three renderers ran. The discriminator used throughout
 *      this spec is `.react-select__multi-value__label` — present ONLY while
 *      isMulti is true — plus the ABSENCE of `.react-select__single-value`.
 *  F19       the column-list data-cy is NOT normalised (Table.jsx:571
 *      interpolates the raw display name), so all helpers use `columnListItem`
 *      rather than the older normalising `tableSelector.columnItem`.
 *  F21       cell COLOUR assertions never use `tableSelector.cellContent` (`<td> div`,
 *      which matches the outer `.td-container` wrapper and computes to inherited
 *      black). A multiselect chip is addressed by its own react-select class.
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
  "Table — variants/newMultiSelect column type",
  { testIsolation: false },
  () => {
    const W = tableText.defaultWidgetName; // 'table1'
    const C = tableText.variantMultiSelectColumn; // 'hobbies' — autoGenerateColumns.js:96

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
      // Leave the popover SHUT: openColumnOption() clicks the row, and the OverlayTrigger
      // toggles (OptionsList.jsx:388-393), so a caller that follows this with setOptionColor
      // would otherwise close the popover instead of re-opening it.
      closeOptionPopover();
    };

    // The "Make this option as default" switch, read back from the OPEN option popover.
    // ProgramaticallyHandleProperties.jsx:15-17 feeds it
    // `props[optionIndex].makeDefaultOption` and Toggle.jsx:24 binds that straight to the
    // checkbox's `checked`.
    const verifyOptionIsDefault = (optionLabel, expected) => {
      openColumnOption(optionLabel);
      cy.get(
        tableSelector.columnParamToggle(tableText.labelMakeDefaultOption),
      ).should(expected ? "be.checked" : "not.be.checked"); // source: OptionsList.jsx:244-258
      closeOptionPopover();
    };

    // Assert the ordered set of chip labels in one cell. MultiValueLabel is NOT overridden
    // (SelectRenderer.jsx:278-281 only replaces MultiValueRemove and MultiValueContainer),
    // so it keeps react-select's own `<prefix>__multi-value__label` class and there is
    // exactly one node per selected value.
    const verifyChipLabels = (column, rowIndex, labels) => {
      cy.get(tableSelector.cellSelectMultiValueLabel(column, rowIndex, W))
        .should("have.length", labels.length)
        .then(($els) => {
          expect(
            [...$els].map((el) => el.innerText.trim()),
            "rendered multiselect chip labels",
          ).to.deep.equal(labels);
        });
    };

    beforeEach(() => {
      cy.apiLogin();
      cy.apiCreateApp(`${fake.companyName}-Table-MultiSelect-Column`); // dynamic: fake
      cy.openApp();
      cy.viewport(1400, 2200);
      cy.dragAndDropWidget("Table", 250, 100);
      cy.hideTooltip();
      cy.modifyCanvasSize(900, 800);
      cy.get("[data-cy='left-sidebar-settings-button']").click();
      resizeTableWidget(W, 750, 600);
      resizeQueryPanel("1");
      openEditorSidebar(W);
      // Seed the multiselect dataset. setTableData ends with a canvas click (which deselects
      // the widget and closes the Inspector), so the sidebar is re-opened afterwards.
      setTableData(tableText.variantMultiSelectData); // source: autoGenerateColumns.js:110-119
      openEditorSidebar(W);
      // An ARRAY-valued key auto-generates as `string`, so the type switch is what makes the
      // column a MULTISELECT column — and what seeds DEFAULT_SELECT_COLUMN_OPTIONS onto it
      // (useColumnManager.js:24-34). setColumnType opens the popover itself; close it again
      // so every it() starts from the same state (column list on screen, popover shut).
      setColumnType(C, tableText.columnTypeValue.newMultiSelect); // source: PropertiesTabElements.jsx:130
      closeColumnPopover(C);
    });

    afterEach(() => {
      cy.apiDeleteApp();
    });

    // ═════════════════════════════════════════════════════════════════════════
    // COLUMN CREATION / TYPE SWITCH
    // ═════════════════════════════════════════════════════════════════════════

    it("column type — an array column re-typed to `newMultiSelect` renders one chip per value, and the type can be switched away and back", () => {
      openColumnPopover(C);
      // SelectComponent.jsx:52 resolves the raw stored value ('newMultiSelect') back to its
      // option, so the react-select SingleValue renders the option LABEL. NOTE the label
      // 'MultiSelect' (:130) differs from the DEPRECATED 'Multiselect' (:143) only in case —
      // which is exactly why setColumnType picks by INDEX, never by text.
      cy.get(tableSelector.columnPopover)
        .find(tableSelector.columnTypeSelect)
        .should("contain.text", tableText.columnTypeLabel.newMultiSelect); // source: PropertiesTabElements.jsx:130
      closeColumnPopover(C);

      cy.forceClickOnCanvas();
      cy.get(tableSelector.cell(C, 0, W)).scrollIntoView();
      // F33: `has-select` is SHARED with select and tagsV2 (TableRow.jsx:127), so the class
      // is necessary but not sufficient — the multi-value labels are the real discriminator.
      verifyCellType(C, 0, tableText.cellClassByType.newMultiSelect, W); // source: TableRow.jsx:127
      cy.get(tableSelector.cellSelectControl(C, 0, W)).should("have.length", 1); // source: generateColumnsData.js:328
      verifyChipLabels(C, 0, tableText.variantMultiSelectRow0Labels); // source: SelectRenderer.jsx:359-364
      // isMulti is TRUE (generateColumnsData.js:325), so react-select mounts MultiValue, not
      // SingleValue.
      cy.get(tableSelector.cellSelectSingleValue(C, 0, W)).should("not.exist"); // source: generateColumnsData.js:325
      // Row 1 carries exactly one value — proof the chip count tracks the cell value rather
      // than the option list.
      cy.get(tableSelector.cellSelectMultiValueLabel(C, 1, W)).should(
        "have.length",
        tableText.variantMultiSelectRow1ChipCount,
      ); // source: variantMultiSelectData row 1

      // Switch to `select`: the SAME renderer runs with isMulti false, so the chips collapse
      // to a SingleValue — and because the cell value is an ARRAY, `options.find(o =>
      // o.value === value)` matches nothing and the single branch renders no label.
      setColumnType(C, tableText.columnTypeValue.select); // source: PropertiesTabElements.jsx:129
      closeColumnPopover(C);
      cy.forceClickOnCanvas();
      cy.get(tableSelector.cellSelectMultiValueLabel(C, 0, W)).should(
        "not.exist",
      ); // source: SelectRenderer.jsx:278-281
      // Both types keep the same <td> class, which is the whole point of F33.
      verifyCellType(C, 0, tableText.cellClassByType.select, W); // source: TableRow.jsx:127

      // …and back to `newMultiSelect`, which restores the chips.
      setColumnType(C, tableText.columnTypeValue.newMultiSelect); // source: PropertiesTabElements.jsx:130
      closeColumnPopover(C);
      cy.forceClickOnCanvas();
      verifyChipLabels(C, 0, tableText.variantMultiSelectRow0Labels); // source: SelectRenderer.jsx:359-364
    });

    it("column manager — a `newMultiSelect` column can be added, bound to a key and deleted", () => {
      // addColumnOfType sets the TYPE first (so the OptionsList block mounts and the option
      // defaults are seeded), then the name, then the key — the key is what the row data is
      // read from (generateColumnsData.js:163 accessorKey = column.key || column.name).
      addColumnOfType(
        tableText.variantNewMultiSelectColumn,
        tableText.columnTypeValue.newMultiSelect, // source: PropertiesTabElements.jsx:130
        tableText.variantMultiSelectColumn, // source: autoGenerateColumns.js:96
      );
      closeColumnPopover(tableText.variantNewMultiSelectColumn);

      cy.forceClickOnCanvas();
      cy.get(tableSelector.columnHeader(tableText.variantNewMultiSelectColumn))
        .scrollIntoView()
        .should("have.text", tableText.variantNewMultiSelectColumn); // source: TableHeader.jsx:153
      // Bound to the same `hobbies` key, so it resolves the same two options.
      verifyChipLabels(
        tableText.variantNewMultiSelectColumn,
        0,
        tableText.variantMultiSelectRow0Labels,
      ); // source: generateColumnsData.js:163

      // deleteColumn drives the popover header's [title="Delete column"] and asserts BOTH the
      // inspector row and the rendered header are gone.
      deleteColumn(tableText.variantNewMultiSelectColumn); // source: ColumnPopover.jsx:130-138
    });

    // ═════════════════════════════════════════════════════════════════════════
    // SHARED PROPERTIES (Properties tab)
    // ═════════════════════════════════════════════════════════════════════════

    it("properties — Column name renames the rendered column, Key rebinds its data", () => {
      openColumnPopover(C);
      verifyColumnCodeField(tableSelector.columnNameField, C); // source: PropertiesTabElements.jsx:164-181
      verifyColumnCodeField(
        tableSelector.columnKeyField,
        tableText.variantMultiSelectColumn,
      ); // source: PropertiesTabElements.jsx:182-197

      // Renaming re-keys the rendered header AND every cell data-cy, because both are derived
      // from `columnDef.header` = the resolved column name (generateColumnsData.js:165 →
      // TableHeader.jsx:153 / TableRow.jsx:102-105).
      verifyAndEnterColumnOptionInput(
        tableText.labelColumnName,
        tableText.variantRenamedMultiSelectColumn,
      ); // source: PropertiesTabElements.jsx:166
      closeColumnPopover(tableText.variantRenamedMultiSelectColumn);
      cy.forceClickOnCanvas();
      cy.get(
        tableSelector.columnHeader(tableText.variantRenamedMultiSelectColumn),
      )
        .scrollIntoView()
        .should("have.text", tableText.variantRenamedMultiSelectColumn); // source: TableHeader.jsx:153
      verifyChipLabels(
        tableText.variantRenamedMultiSelectColumn,
        0,
        tableText.variantMultiSelectRow0Labels,
      ); // source: SelectRenderer.jsx:359-364

      // The Key is the accessor, so re-pointing it at `alt` — whose row-0 value is a
      // ONE-element array — drops the chip count from two to one while the header (and
      // therefore the data-cy) stays put.
      openColumnPopover(tableText.variantRenamedMultiSelectColumn);
      verifyAndEnterColumnOptionInput(
        tableText.labelKey,
        tableText.variantSelectAltKey,
      ); // source: PropertiesTabElements.jsx:183
      closeColumnPopover(tableText.variantRenamedMultiSelectColumn);
      cy.forceClickOnCanvas();
      verifyChipLabels(tableText.variantRenamedMultiSelectColumn, 0, [
        tableText.variantMultiSelectAltRow0Label,
      ]); // source: generateColumnsData.js:163
    });

    it("properties — Transformation rewrites the array the option list is matched against", () => {
      openColumnPopover(C);
      verifyColumnCodeField(
        tableSelector.columnTransformationField,
        tableText.defaultTransformation,
      ); // source: PropertiesTabElements.jsx:205

      // columnSlice.js:99 deliberately DROPS a transformation equal to '{{cellValue}}', so
      // only a real expression reaches transformTableData.js:33, which rewrites the row's
      // value BEFORE SelectRenderer.jsx:359-364 filters the option list with it. Slicing row
      // 0 to its first element must drop the `Music` chip — proof the transformation ran
      // against the REAL array cellValue and not a stringified copy.
      setColumnCodeField(
        tableSelector.columnTransformationField,
        tableText.variantMultiSelectTransformation,
      ); // source: PropertiesTabElements.jsx:200-218
      closeColumnPopover(C);

      cy.forceClickOnCanvas();
      cy.get(tableSelector.cell(C, 0, W)).scrollIntoView();
      verifyChipLabels(C, 0, [tableText.variantSelectOptionReading]); // source: transformTableData.js:33
      // Row 1 already held a single value, so it is unchanged — the transformation is
      // per-row, not a column-wide replacement.
      verifyChipLabels(C, 1, [tableText.variantSelectRow1Label]); // source: variantMultiSelectData row 1
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

      // generateColumnsData.js:159 returns null for an invisible column, so the whole column
      // — header AND cells — is removed from the rendered table.
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
      // Read-only first: generateColumnsData.js:320 passes `disabled={!isEditable}` straight
      // to react-select's isDisabled, and SelectRenderer.jsx:277 mounts the custom
      // DropdownIndicator ONLY when isEditable — so the untouched column is a disabled
      // control with NO caret.
      cy.forceClickOnCanvas();
      cy.get(tableSelector.cellSelectControlBox(C, 0, W))
        .scrollIntoView()
        .should("have.class", tableText.variantSelectControlDisabledClass); // source: SelectRenderer.jsx:424
      cy.get(tableSelector.cellSelectDropdownIcon(C, 0, W)).should("not.exist"); // source: SelectRenderer.jsx:277

      openColumnPopover(C);
      // `isEditable` IS offered for newMultiSelect — PropertiesTabElements.jsx:385 excludes
      // only image / link / button.
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
      cy.get(tableSelector.cell(C, 0, W))
        .should("have.class", tableText.cellClassEditable) // source: TableRow.jsx:135
        .and("have.class", tableText.cellClassByType.newMultiSelect); // source: TableRow.jsx:127
    });

    // ═════════════════════════════════════════════════════════════════════════
    // VALIDATIONS — customRule is the ONLY one a newMultiSelect column mounts
    // ═════════════════════════════════════════════════════════════════════════

    it("validations — `customRule` is the only validation a newMultiSelect column mounts, and its message reaches the cell (F1)", () => {
      openColumnPopover(C);
      // The block only mounts once the column is editable (PropertiesTabElements.jsx:401).
      toggleColumnProperty(tableText.labelMakeEditable); // source: PropertiesTabElements.jsx:385-400

      // getValidationList's `newMultiSelect` branch returns exactly ONE entry
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
        tableText.variantMultiSelectCustomRule,
      ); // source: ValidationProperties.jsx:97-108 (F1)
      verifyColumnValidation(
        tableText.labelCustomRule,
        tableText.variantMultiSelectCustomRule,
      ); // source: ValidationProperties.jsx:216 (F1)
      closeColumnPopover(C);

      // SelectColumnAdapter.jsx:40-47 resolves the rule against `value` (NOT cellValue) —
      // here the raw ARRAY — and _helpers/utils.js:458-461 treats a non-empty STRING as the
      // failure, using it verbatim as the message. SelectRenderer.jsx:441-448 renders that
      // message only while the column is editable AND the value is invalid.
      cy.forceClickOnCanvas();
      cy.get(tableSelector.cellInvalidFeedback(C, 0, W))
        .scrollIntoView()
        .should("have.text", tableText.variantMultiSelectCustomRuleErrorRow0); // source: _helpers/utils.js:460
      // Row 2's value is the empty string, so `''.toString()` is '' and the row stays valid —
      // proof the message is per-cell rather than per-column.
      cy.get(tableSelector.cellInvalidFeedback(C, 2, W)).should("not.exist"); // source: _helpers/utils.js:459
    });

    // ═════════════════════════════════════════════════════════════════════════
    // OPTIONS LIST (SelectOptionsList/OptionsList.jsx)
    // ═════════════════════════════════════════════════════════════════════════

    it("options — the type switch seeds DEFAULT_SELECT_COLUMN_OPTIONS into an accordion titled `Options`", () => {
      openColumnPopover(C);
      // OptionsList.jsx:271 titles the accordion 'Tags' for tagsV2 and 'Options' for
      // select / newMultiSelect, and AccordionItem.js:39/:51 stamp the title into the header
      // and label data-cy — so the accordion TITLE is itself a type discriminator, and this
      // is how the spec proves it is NOT looking at the tagsV2 variant of the same component.
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

      // `tagsV2`-only controls must NOT be here even though this type IS multi-select:
      // "Allow multiple selection" (:305-321) and "Sort tags" (:274-289) are both gated on
      // `columnType === 'tagsV2'`, and newMultiSelect gets its multi behaviour from
      // generateColumnsData.js:325 instead — there is nothing to switch off.
      cy.get(
        tableSelector.columnParamToggle(tableText.labelAllowMultipleSelection),
      ).should("not.exist"); // source: OptionsList.jsx:305
      cy.get(tableSelector.optionsAccordion).should(
        "not.contain.text",
        tableText.labelSortTags,
      ); // source: OptionsList.jsx:277
      closeColumnPopover(C);
    });

    it("options — rewriting an option's label re-labels the matching chip and leaves the sibling chip alone (F16)", () => {
      openColumnPopover(C);
      // F16: both CodeHinters in the option popover collapse to the duplicate `-input-field`,
      // so setOptionLabelValue writes the VALUE at index 1 first and the LABEL at index 0
      // last — last because the option row's data-cy is keyed off the label.
      // Only the LABEL is changed here: the option's value stays 'Reading', so row 0 still
      // RESOLVES it (SelectRenderer.jsx:359-364) but now renders the new label — while its
      // `Music` chip, a different option, is untouched. That side-by-side pair is something
      // a single-select column cannot show.
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
      cy.get(tableSelector.cell(C, 0, W)).scrollIntoView();
      verifyChipLabels(C, 0, [
        tableText.variantSelectRenamedOptionLabel,
        tableText.variantSelectOptionMusic,
      ]); // source: SelectRenderer.jsx:359-364
    });

    it("options — a new option can be added, renamed and made default, and its label fills the empty cell", () => {
      openColumnPopover(C);
      // createNewOption appends `Option N`, skipping labels already taken
      // (OptionsList.jsx:59-76) — none of the four seeded defaults is an `Option N`, so it is
      // `Option 1`.
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
      // SelectRenderer.jsx:344-354 — in MULTI mode defaultValue is the WHOLE
      // defaultOptionsList, so the single stored default becomes one chip.
      verifyChipLabels(C, 2, [tableText.variantSelectRenamedOptionLabel]); // source: SelectRenderer.jsx:347
      // Rows that DO carry a value are unaffected — `value ? … : defaultValue`.
      verifyChipLabels(C, 0, tableText.variantMultiSelectRow0Labels); // source: SelectComponent.jsx:52
    });

    it("options — `Make this option as default` ACCUMULATES for a newMultiSelect column: a second choice KEEPS the first", () => {
      openColumnPopover(C);
      toggleMakeDefaultOption(tableText.variantSelectOptionReading); // source: OptionsList.jsx:244-258
      closeOptionPopover();
      verifyOptionIsDefault(tableText.variantSelectOptionReading, true); // source: OptionsList.jsx:147-150
      closeColumnPopover(C);

      // Row 2's cell is empty, so it renders defaultOptionsList — which OptionsList.jsx:149
      // has just PUSHED into rather than replaced.
      cy.forceClickOnCanvas();
      verifyChipLabels(C, 2, [tableText.variantSelectOptionReading]); // source: OptionsList.jsx:149

      // THE BRANCH THAT DEFINES THIS TYPE: `columnType === 'select'` is FALSE here, so
      // handleDefaultOptionSelection takes the else branch (OptionsList.jsx:141-155) and
      // appends to defaultOptionsList without touching any other option's flag. A `select`
      // column would have `unset` the first one (:134) and rewritten the list to a
      // ONE-element array (:137) — that mirror assertion lives in variants/select.cy.js.
      openColumnPopover(C);
      toggleMakeDefaultOption(tableText.variantSelectOptionTraveling); // source: OptionsList.jsx:244-258
      closeOptionPopover();
      verifyOptionIsDefault(tableText.variantSelectOptionTraveling, true); // source: OptionsList.jsx:149
      verifyOptionIsDefault(tableText.variantSelectOptionReading, true); // source: OptionsList.jsx:141-155
      closeColumnPopover(C);

      cy.forceClickOnCanvas();
      // BOTH defaults now render, in the order they were pushed.
      verifyChipLabels(C, 2, [
        tableText.variantSelectOptionReading,
        tableText.variantSelectOptionTraveling,
      ]); // source: SelectRenderer.jsx:347-349

      // Turning the first one back OFF splices it out (:151-153) and leaves the second.
      openColumnPopover(C);
      toggleMakeDefaultOption(tableText.variantSelectOptionReading); // source: OptionsList.jsx:151-153
      closeOptionPopover();
      verifyOptionIsDefault(tableText.variantSelectOptionReading, false); // source: OptionsList.jsx:151-153
      closeColumnPopover(C);

      cy.forceClickOnCanvas();
      verifyChipLabels(C, 2, [tableText.variantSelectOptionTraveling]); // source: OptionsList.jsx:152
    });

    it("options — Auto assign colors paints each chip from COLORS[i], and an explicit Option color wins over it", () => {
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
      // the option's POSITION, and :293-304 writes it as each multiValueLabel's inline
      // `background`. Row 1's single chip is `Photography` = options[2] → COLORS[2]. Using
      // the one-chip row keeps the assertion unambiguous without an :eq() index. F21: never
      // assert this through `cellContent`, which resolves to the `.td-container` wrapper.
      cy.forceClickOnCanvas();
      verifyWidgetColorCss(
        tableSelector.cellSelectMultiValueLabel(C, 1, W),
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
        tableText.variantSelectOptionPhotography,
        tableText.labelOptionColor,
        tableText.variantSelectDefaultOptionColor,
      );
      setOptionColor(
        tableText.variantSelectOptionPhotography,
        tableText.labelOptionColor,
        tableText.variantSelectOptionColorRgba,
      ); // source: OptionsList.jsx:231-243
      closeOptionPopover();
      closeColumnPopover(C);

      cy.forceClickOnCanvas();
      verifyWidgetColorCss(
        tableSelector.cellSelectMultiValueLabel(C, 1, W),
        "background-color",
        tableText.variantSelectOptionColorRgba,
        true,
      ); // source: SelectRenderer.jsx:252
    });

    it("options — Label color overrides the column Text color on the rendered chip", () => {
      openColumnPopover(C);
      switchColumnTab(tableText.columnTabStyles); // source: ColumnPopover.jsx:157
      // `newMultiSelect` IS in the shared colour block (StylesTabElements.jsx:128-145) and is
      // not the boolean carve-out at :147, so Text color is offered and defaults to #11181C.
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
      // through, and SelectRenderer.jsx:301 uses it as each chip's `color` while the option
      // has no labelColor of its own.
      cy.forceClickOnCanvas();
      verifyWidgetColorCss(
        tableSelector.cellSelectMultiValueLabel(C, 1, W),
        "color",
        tableText.variantSelectTextColorRgba,
        true,
      ); // source: SelectRenderer.jsx:301

      // `option?.labelColor ||` is evaluated FIRST (:301), so a per-option Label color must
      // win over the column-wide Text color.
      openColumnPopover(C);
      // The popover re-opens on whichever tab was last active, and the OptionsList lives on
      // the Properties tab (PropertiesTabElements.jsx:503-517) — switch back explicitly.
      switchColumnTab(tableText.columnTabProperties); // source: ColumnPopover.jsx:149
      verifyOptionColor(
        tableText.variantSelectOptionPhotography,
        tableText.labelLabelColor,
        tableText.variantSelectDefaultLabelColor,
      );
      setOptionColor(
        tableText.variantSelectOptionPhotography,
        tableText.labelLabelColor,
        tableText.variantSelectLabelColorRgba,
      ); // source: OptionsList.jsx:218-230
      closeOptionPopover();
      closeColumnPopover(C);

      cy.forceClickOnCanvas();
      verifyWidgetColorCss(
        tableSelector.cellSelectMultiValueLabel(C, 1, W),
        "color",
        tableText.variantSelectLabelColorRgba,
        true,
      ); // source: SelectRenderer.jsx:301
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
      // (OptionsList.jsx:339-351). That CodeHinter has no paramLabel and no wrapper data-cy
      // of its own, so it is reached through the accordion as its container.
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
      // so the filter at SelectRenderer.jsx:359-364 now matches ONLY 'Reading' — row 0's
      // `Music` value has no option left and its chip disappears, while the surviving chip
      // carries the NEW label. That drop from two chips to one is the multi-mode proof the
      // dynamic list replaced the static one wholesale.
      cy.forceClickOnCanvas();
      cy.get(tableSelector.cell(C, 0, W)).scrollIntoView();
      verifyChipLabels(C, 0, [tableText.variantSelectDynamicFirstLabel]); // source: generateColumnsData.js:297
    });

    // ═════════════════════════════════════════════════════════════════════════
    // TYPE-SHARED STYLES (Styles tab)
    // ═════════════════════════════════════════════════════════════════════════

    it("styles — the alignment label reads `Text Alignment` and moves both the cell and the value container", () => {
      openColumnPopover(C);
      switchColumnTab(tableText.columnTabStyles); // source: ColumnPopover.jsx:157
      // StylesTabElements.jsx:32-34 shortens the label to plain "Alignment" for
      // boolean / image / rating ONLY — `newMultiSelect` keeps the full "Text Alignment".
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
      // (SelectRenderer.jsx:305-315), which is what actually moves the chips.
      cy.get(tableSelector.cellSelectValueContainer(C, 0, W)).should(
        "have.css",
        "justify-content",
        tableText.variantSelectJustifyCenter,
      ); // source: SelectRenderer.jsx:314
    });

    it("styles — Cell color paints the rendered cell background", () => {
      openColumnPopover(C);
      switchColumnTab(tableText.columnTabStyles); // source: ColumnPopover.jsx:157
      // `cellBackgroundColor` IS offered for newMultiSelect — StylesTabElements.jsx:128-145
      // lists it in the shared block. The default is the design token
      // var(--cc-surface1-surface); BaseColorSwatches renders the token NAME rather than the
      // raw var (:153-157).
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

    // ═════════════════════════════════════════════════════════════════════════
    // CELL RENDERING CONTRACT
    // ═════════════════════════════════════════════════════════════════════════

    it("cell rendering — an EMPTY multiselect cell shows the `Select..` placeholder, and no chip keeps react-select's multi-value container class", () => {
      cy.forceClickOnCanvas();
      cy.get(tableSelector.cell(C, 2, W)).scrollIntoView();
      // F31, multi half: with `defaultOptionsList` still empty, SelectRenderer.jsx:344-354
      // returns `[]` for isMulti, react-select's hasValue is false and the Placeholder — the
      // _ui/Select default 'Select..' (SelectComponent.jsx:28) — renders. The SINGLE branch
      // returns `{}` instead, which is truthy, and suppresses the placeholder; that half is
      // asserted in variants/select.cy.js.
      cy.get(tableSelector.cellSelectPlaceholder(C, 2, W)).should(
        "have.text",
        tableText.selectPlaceholder,
      ); // source: _ui/Select/SelectComponent.jsx:28
      cy.get(tableSelector.cellSelectMultiValueLabel(C, 2, W)).should(
        "not.exist",
      ); // source: SelectRenderer.jsx:350

      // SelectRenderer.jsx:149-159 replaces MultiValueContainer with a bare <div> that DROPS
      // react-select's className, so a populated row has multi-value LABELS but no
      // `react-select__multi-value` container node at all. Pinning that absence is what makes
      // `cellSelectMultiValueLabel` the only safe chip hook.
      cy.get(tableSelector.cellSelectMultiValueContainer(C, 0, W)).should(
        "not.exist",
      ); // source: SelectRenderer.jsx:149-159
      cy.get(tableSelector.cellSelectMultiValueLabel(C, 0, W)).should(
        "have.length",
        tableText.variantMultiSelectRow0ChipCount,
      ); // source: SelectRenderer.jsx:293-304
      // The <td> still classifies as a select cell — the class is driven by columnType, not
      // by whether a value resolved (F33).
      verifyCellType(C, 2, tableText.cellClassByType.newMultiSelect, W); // source: TableRow.jsx:127
    });

    it("cell rendering — an editable multiselect cell opens a portalled menu and APPENDS the picked option", () => {
      openColumnPopover(C);
      toggleColumnProperty(tableText.labelMakeEditable); // source: PropertiesTabElements.jsx:385-400
      closeColumnPopover(C);

      cy.forceClickOnCanvas();
      // The menu opens off react-select's own Control. _ui/Select defaults useMenuPortal=true
      // and SelectRenderer never overrides it (SelectComponent.jsx:83), so the menu is
      // PORTALLED TO document.body and must be queried globally, never inside the cell.
      // Row 1 starts with exactly one chip, so the append is unambiguous.
      cy.get(tableSelector.cellSelectControlBox(C, 1, W))
        .scrollIntoView()
        .click({ force: true });
      cy.get(tableSelector.selectMenu).should("be.visible"); // source: SelectRenderer.jsx:57
      // `hideSelectedOptions={false}` (:430) means nothing is filtered out, so all four
      // seeded options are listed even though one is already selected.
      cy.get(tableSelector.selectMenuOptionPill).should(
        "have.length",
        tableText.variantSelectMenuOptionCount,
      ); // source: SelectRenderer.jsx:132

      cy.get(tableSelector.selectMenuOptionPill)
        .filter(
          (_i, el) =>
            el.innerText.trim() === tableText.variantSelectOptionReading,
        )
        .first()
        .click({ force: true });
      // SelectComponent.jsx:54-56 hands a MULTI change through as the whole option ARRAY
      // (unlike the single branch, which unwraps `data.value`), and
      // generateColumnsData.js:317 commits it via handleCellValueChange — so a second chip is
      // proof the appended value reached the row data.
      cy.get(tableSelector.cellSelectMultiValueLabel(C, 1, W)).should(
        "have.length",
        tableText.variantMultiSelectRow0ChipCount,
      ); // source: SelectComponent.jsx:55
      // Still multi: never a SingleValue node.
      cy.get(tableSelector.cellSelectSingleValue(C, 1, W)).should("not.exist"); // source: generateColumnsData.js:325
    });
  },
);
