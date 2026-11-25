// ┌─ AUTO-GENERATED from @tj annotations below — do not edit by hand ─┐
// table.js
//   tableWidgetOuter                 -                    → canvas
//   resizeTableWidget                -                    → canvas
//   setTableData                     -                    → canvas
//   searchOnTable                    -                    → canvas
//   verifyTableElements              -                    → canvas
//   selectDropdownOption             -                    → inspector
//   verifyAndEnterColumnOptionInput  -                    → inspector
//   addAndOpenColumnOption           -                    → inspector
//   deleteAndVerifyColumn            -                    → inspector
//   verifyInvalidFeedback            -                    → canvas
//   addInputOnTable                  -                    → canvas
//   verifySingleValueOnTable         -                    → canvas
//   verifyAndModifyToggleFx          toggle               → properties
//   selectFromSidebarDropdown        -                    → properties
//   dataPdfAssertionHelper           -                    → common
//   dataCsvAssertionHelper           -                    → common
//   addFilter                        -                    → canvas
//   verifyTableExposedVars           exposed              → inspector
//   makeAllColumnsEditable           -                    → inspector
//   makeColumnEditable               -                    → inspector
//   typeIntoEditableCell             -                    → canvas
//   editTableCell                    -                    → canvas
//   addNewRow                        -                    → canvas
//   addNewRowCellInput               -                    → canvas
//   toggleTableProperty              toggle               → properties
//   setRowsPerPage                   -                    → properties
//   selectTableRow                   -                    → canvas
//   toggleRowCheckbox                -                    → canvas
//   verifySelectedRowCount           -                    → canvas
//   sortByColumn                     -                    → canvas
//   wireTableCSA                     -                    → csa
//   triggerTableCSA                  -                    → csa
//   columnCyLabel                    -                    → common
//   openColumnPopover                -                    → inspector
//   closeColumnPopover               -                    → inspector
//   switchColumnTab                  -                    → inspector
//   setColumnType                    -                    → inspector
//   addColumnOfType                  -                    → inspector
//   duplicateColumn                  -                    → inspector
//   deleteColumn                     -                    → inspector
//   setColumnProperty                -                    → inspector
//   verifyColumnProperty             -                    → inspector
//   setColumnCodeField               -                    → inspector
//   verifyColumnCodeField            -                    → inspector
//   toggleColumnProperty             -                    → inspector
//   setColumnColor                   colorSwatches        → inspector
//   verifyColumnColor                colorSwatches        → inspector
//   toggleColumnFx                   -                    → inspector
//   verifyColumnFxAbsent             -                    → inspector
//   setColumnValidation              -                    → inspector
//   verifyColumnValidation           -                    → inspector
//   setColumnAlignment               -                    → inspector
//   setPinPosition                   -                    → inspector
//   verifyCellType                   -                    → canvas
//   verifyCellValue                  -                    → canvas
//   addColumnOption                  -                    → inspector
//   openColumnOption                 -                    → inspector
//   setOptionLabelValue              -                    → inspector
//   setOptionColor                   colorSwatches        → inspector
//   toggleMakeDefaultOption          -                    → inspector
//   toggleAutoAssignColors           -                    → inspector
//   toggleDynamicOptions             -                    → inspector
//   toggleAllowMultipleSelection     -                    → inspector
//   setSortTags                      -                    → inspector
//   addActionButton                  -                    → inspector
//   openActionButton                 -                    → inspector
//   backFromButtonDetail             -                    → inspector
//   setButtonProperty                -                    → inspector
//   setButtonStyle                   -                    → inspector
//   setDateFormat                    -                    → inspector
//   setParseDateFormat               -                    → inspector
//   toggleDateFormatFx               -                    → inspector
//   toggleParseDateFormatFx          -                    → inspector
//   toggleEnableDate                 -                    → inspector
//   toggleEnableTime                 -                    → inspector
//   toggleParseUnixTimestamp         -                    → inspector
//   setTimeZone                      -                    → inspector
// └──────────────────────────────────────────────────────────────────┘
import { commonWidgetSelector, cyParamName } from "Selectors/common";
import { tableSelector } from "Selectors/appBuilder/components/table";
import {
  verifyNodeData,
  openSubNode,
  verifyNodes,
} from "Support/utils/appBuilder/inspector";
import { selectEvent, configureCSA } from "Support/utils/appBuilder/events";
import { tableText } from "Texts/appBuilder/components/table";

/**
 * MODULE — appBuilder/components/table: NewTable widget test helpers spanning several facets.
 * FOR AI: route by what you need to do with the Table —
 *   canvas render  → setTableData, searchOnTable, verifyTableElements, verifySingleValueOnTable,
 *                     addInputOnTable, verifyInvalidFeedback, resizeTableWidget, tableWidgetOuter.
 *   COLUMN MANAGER → the whole `variants/<type>.cy.js` surface. Start at openColumnPopover /
 *                     switchColumnTab, then: setColumnType · addColumnOfType · duplicateColumn ·
 *                     deleteColumn · setColumnProperty/verifyColumnProperty ·
 *                     setColumnCodeField/verifyColumnCodeField · toggleColumnProperty ·
 *                     toggleColumnFx/verifyColumnFxAbsent · setColumnColor/verifyColumnColor ·
 *                     setColumnValidation/verifyColumnValidation · setColumnAlignment ·
 *                     setPinPosition · verifyCellType/verifyCellValue.
 *                     options list (select|newMultiSelect|tagsV2) → addColumnOption,
 *                     openColumnOption, setOptionLabelValue, setOptionColor,
 *                     toggleMakeDefaultOption, toggleAutoAssignColors, toggleDynamicOptions,
 *                     toggleAllowMultipleSelection, setSortTags.
 *                     button column → addActionButton, openActionButton, backFromButtonDetail,
 *                     setButtonProperty, setButtonStyle.
 *                     datepicker column → setDateFormat, setParseDateFormat, toggleDateFormatFx,
 *                     toggleParseDateFormatFx, toggleEnableDate, toggleEnableTime,
 *                     toggleParseUnixTimestamp, setTimeZone.
 *                     data-cy rule → columnCyLabel. NO SPEC MAY HAND-ROLL THIS DOM.
 *   inspector cols → makeAllColumnsEditable, makeColumnEditable, verifyAndEnterColumnOptionInput.
 *                     DEPRECATED (stale DOM, see banners below): addAndOpenColumnOption,
 *                     deleteAndVerifyColumn, selectDropdownOption.
 *   properties     → toggleTableProperty, setRowsPerPage, verifyAndModifyToggleFx, selectFromSidebarDropdown.
 *   inline edit    → typeIntoEditableCell, editTableCell, addNewRow, addNewRowCellInput.
 *   selection/sort → selectTableRow, toggleRowCheckbox, verifySelectedRowCount, sortByColumn.
 *   filter         → addFilter.
 *   inspector tree → verifyTableExposedVars (LEFT inspector exposed vars).
 *   csa            → wireTableCSA + triggerTableCSA (arm a CSA on Row-hovered, then fire it).
 *   export helpers → dataPdfAssertionHelper, dataCsvAssertionHelper (pure data shaping, no DOM).
 * KEY GOTCHA: `draggable-widget-<name>` matches TWO nodes for the Table (outer moveable box +
 * inner <table>) — always scope to :eq(0)/.first(); see tableWidgetOuter.
 * NOT here: generic property/style/event drivers → appBuilder/properties.js · styles.js · events.js.
 */

// Spec-local scoped resize. The shared `cy.resizeWidget` uses `[class="bottom-right"]`
// which now matches 2 elements (commands.js:375 — forbidden to edit). We scope the
// mousedown to the LAST visible bottom-right handle (the active widget's moveable
// control box) to avoid the "cy.trigger() can only be called on a single element" throw.
// The Table widget puts `draggable-widget-<name>` on BOTH the RenderWidget wrapper
// (RenderWidget.jsx:308, the outer moveable box) AND its internal <table>
// (Table.jsx:340) — so the data-cy matches 2 els. The OUTER (first in DOM) is the
// selectable/resizable moveable box. Use this for clicks/resize.
/**
 * @tjBlock  canvas
 * @tjUsage  cy.get(tableWidgetOuter('table1')).first().click()
 * @tjDom    returns the draggable-widget-<name> selector (matches 2 nodes — use .first())
 */
export const tableWidgetOuter = (widgetName) =>
  `[data-cy="draggable-widget-${widgetName}"]`;

/**
 * @tjBlock  canvas
 * @tjUsage  resizeTableWidget('table1', 1200, 300)
 * @tjDom    moveable east resize handle → mousemove/mouseup on #real-canvas
 */
export const resizeTableWidget = (widgetName, x, y) => {
  // The Table is a `moveable-dynamic-height` widget (Grid.css:25): height auto-fits
  // content, only the EAST (`e`) / WEST (`w`) resize handles render — the legacy
  // `[class="bottom-right"]` (SE) handle no longer exists. Widen the table by
  // dragging the east handle so all columns/controls are visible.
  cy.get(tableWidgetOuter(widgetName)).first().click({ force: true });
  cy.wait(500);
  cy.get('.moveable-control.moveable-direction.moveable-e[data-direction="e"]')
    .should("have.length.gte", 1)
    .then(($handles) => {
      cy.wrap($handles.last()).trigger("mousedown", { which: 1, force: true });
    });
  cy.get("#real-canvas")
    .trigger("mousemove", {
      which: 1,
      force: true,
      clientX: x,
      clientY: y,
      pageX: x,
      pageY: y,
      screenX: x,
      screenY: y,
    })
    .trigger("mouseup", { force: true });
  cy.waitForAutoSave();
  cy.forceClickOnCanvas();
};

// Set the Table `data` property. The field (displayName ' ' -> data-cy `-input-field`,
// in the "Data" accordion) ships PRE-POPULATED with a 10-row, multi-LINE sample dataset.
// The shared clearAndTypeOnCodeMirror clears only via the first `.cm-line`'s text, which
// leaves most of a multi-line default behind and interleaves the new text -> invalid
// JSON -> "0 Records". So we hard-clear the whole editor with a real Cmd/Ctrl+A +
// Delete first, then type. `value` should be the codehinter expression WITHOUT the
// `{{ }}` wrapper; we add it here (the data field evaluates a JS expression).
/**
 * @tjBlock  canvas
 * @tjUsage  setTableData('[{ id: 1, name: "A" }]')
 * @tjDom    Data accordion -input-field CodeMirror → hard-cleared then native-typed {{...}}
 */
export const setTableData = (value) => {
  cy.get('[data-cy="widget-accordion-data"]')
    .closest(".accordion-item")
    .find('[data-cy="-input-field"]')
    .find(".cm-content")
    .as("tableDataCm");
  // Hard clear: real select-all + delete handles the multi-line default.
  cy.get("@tableDataCm").scrollIntoView();
  // CLEAR VIA cy.type(), NOT realPress — do NOT "simplify" this back.
  // realPress sends OS-LEVEL keys to whatever currently holds focus. This field
  // is a CodeMirror contenteditable that realClick() does NOT reliably focus
  // here (proven: a `cm-focused` assertion times out). When focus is not in the
  // editor, `Meta+A` + `Backspace` are handled by the EDITOR CANVAS instead:
  // every widget is selected and deleted, which pops the "Are you sure you want
  // to delete this component?" modal, wipes the table, and leaves the app
  // permanently unsaved — so the waitForAutoSave() below times out and takes the
  // caller's whole beforeEach with it. That took out 5 variant specs
  // (boolean/html/json/link/markdown), every one of which called setTableData
  // from beforeEach; every spec that did not call it ran fine.
  // cy.type() focuses its SUBJECT first and dispatches to that element only, so
  // the keystrokes cannot reach the canvas regardless of prior focus.
  cy.get("@tableDataCm").click({ force: true });
  cy.get("@tableDataCm").type("{selectall}{backspace}", {
    force: true,
    delay: 0,
  });
  // Native force-type the `{{ }}` expression: force:true ignores the codehinter
  // autocomplete <li> popup that otherwise covers per-token clicks, and
  // parseSpecialCharSequences:false types `{`/`}` literally. CodeMirror's
  // beforeinput/input handlers fire on native typing, so the value commits.
  cy.get("@tableDataCm").type(`{{${value}}}`, {
    parseSpecialCharSequences: false,
    force: true,
    delay: 0,
  });
  cy.forceClickOnCanvas();
  cy.waitForAutoSave();
};

/**
 * @tjBlock  canvas
 * @tjUsage  searchOnTable('Sarah', 'table1')
 * @tjDom    rendered table global search input (debounced 500ms)
 */
export const searchOnTable = (value = "", name = "table1") => {
  // force:true — the search input is position:fixed and can be reported "covered" by
  // canvas-content under load; the type itself is valid (verified by the resulting rows).
  cy.get(tableSelector.searchInputField(name))
    .scrollIntoView()
    .type(`{selectAll}{backspace}${value}`, { force: true });
  // NewTable global search is debounced 500ms (SearchBar.jsx:15).
  cy.wait(600);
};

// NewTable cells are keyed by widget name + column HEADER + row index
// (`<name>-<column>-row-<i>`), NOT a numeric column index. Assert per
// column-name (TableRow.jsx:103).
/**
 * @tjBlock  canvas
 * @tjUsage  verifyTableElements([{ id: 1, name: 'A', email: 'a@x.com' }], ['id','name','email'], 'table1')
 * @tjDom    rendered body cells <name>-<column>-row-<i>
 */
export const verifyTableElements = (
  values,
  columns = ["id", "name", "email"],
  name = "table1"
) => {
  values.forEach((value, i) => {
    columns.forEach((column) => {
      cy.get(tableSelector.cell(column, i, name)).should(
        "have.text",
        `${value[column]}`
      );
    });
  });
  cy.forceClickOnCanvas();
};

// DEPRECATED — DO NOT USE FOR THE COLUMN TYPE DROPDOWN. This drives the legacy
// `react-select-search` widget (`[data-index]` + `.select-search-option`), but the column-type
// control migrated to react-select (PropertiesTabElements.jsx:123-162 via _ui/Select), which
// renders `.react-select__option` in a body portal and has NO data-index. The `data` map below
// is also stale: the option list is now 23 entries in a different order
// (PropertiesTabElements.jsx:124-149). Use setColumnType / tableText.columnTypeOptionIndex.
// Kept only because tableColumnTypes.skip.js still imports it; no live spec does.
/**
 * @tjBlock  inspector
 * @tjUsage  selectDropdownOption('[data-cy="dropdown-column-type"]>>:eq(0)', 'string')
 * @tjDom    inspector select-search control → option by data-index (named type or numeric)
 */
export const selectDropdownOption = (inputSelector, option) => {
  // DELEGATE (was: broken). The original drove the retired `react-select-search`
  // DOM (`[data-index]` + `.select-search-option`) and carried its own stale
  // index map. The column-type control is now react-select rendered into a body
  // portal (`.react-select__option`, no `data-index`), so the original could not
  // select anything. `inputSelector` is ignored: every caller passed the
  // column-type dropdown, and setColumnType(null, ...) targets it directly
  // without re-opening the popover — matching the old "popover already open"
  // contract. Prefer setColumnType()/addColumnOfType() in new specs.
  // source: PropertiesTabElements.jsx:118-163
  const LEGACY_TYPE_ALIASES = {
    multipleBadges: "badges",
    toggleSwitch: "toggle",
    datePicker: "datepicker",
    dropdown: "dropdown",
  };
  const type = LEGACY_TYPE_ALIASES[option] || option;
  if (!(type in tableText.columnTypeOptionIndex)) {
    throw new Error(
      `selectDropdownOption: "${option}" is not a column type. This helper now ` +
        `only drives the column-type dropdown; its old overflow-dropdown usage ` +
        `(wrap/scroll/hide) and numeric-index usage targeted DOM that no longer ` +
        `exists. Use the control's own helper instead.`
    );
  }
  setColumnType(null, type);
};

/**
 * @tjBlock  inspector
 * @tjUsage  verifyAndEnterColumnOptionInput('Column name', 'status')
 * @tjDom    column popover input-and-label-<label> → its -input-field CodeMirror
 */
export const verifyAndEnterColumnOptionInput = (label, value) => {
  cy.get(`[data-cy="input-and-label-${cyParamName(label)}"]`)
    .find("label")
    .should("have.text", label);
  cy.get(`[data-cy="input-and-label-${cyParamName(label)}"]`)
    .find(`[data-cy="-input-field"]`)
    .clearAndTypeOnCodeMirror(`${value}`);
};

// DEPRECATED — use addColumnOfType(name, type, key). This delegates to the stale
// selectDropdownOption above, so its type selection cannot work against the current
// react-select column-type control. Kept for tableColumnTypes.skip.js only.
/**
 * @tjBlock  inspector
 * @tjUsage  addAndOpenColumnOption('status', 'string')
 * @tjDom    button-add-column → new column-new_column row → type dropdown + Column name input
 */
export const addAndOpenColumnOption = (name, type) => {
  // DELEGATE (was: broken). It called the old selectDropdownOption, so it could
  // add a column but never set its type. addColumnOfType does both and leaves
  // the popover open, preserving this helper's contract.
  addColumnOfType(name, type);
};

// DEPRECATED — use deleteColumn(displayName). This targets a DOM that no longer exists:
// the column list renders with `enableActionsMenu={false}` (Table.jsx:572), so the
// `.list-item-popover-option` menu it clicks is never mounted, and `.parent().find('.tj-base-btn')`
// now matches BOTH the copy and the delete icon (List.jsx:132-163) which makes the click throw.
// Kept for tableColumnTypes.skip.js only; no live spec imports it.
/**
 * @tjBlock  inspector
 * @tjUsage  deleteAndVerifyColumn('email')
 * @tjDom    pages-name-<column> row → delete popover option, asserts column + header gone
 */
export const deleteAndVerifyColumn = (columnName) => {
  // DELEGATE (was: broken). The original clicked `.list-item-popover-option`,
  // but Table.jsx:572 passes `enableActionsMenu={false}` so that menu never
  // mounts; and `.parent().find(".tj-base-btn")` now matches TWO icons
  // (List.jsx:132-163), so the click threw on a multi-element subject.
  // deleteColumn() uses the popover's own delete control and asserts removal.
  deleteColumn(columnName);
  cy.notVisible(tableSelector.columnHeader(columnName));
};

// NewTable cells are addressed by column HEADER + row index (not a numeric column
// index). These helpers now take a column header string as their first arg.
// Assert the validation message rendered inside a cell.
//
// The feedback node only mounts while the column is EDITABLE and the value is
// invalid — StringRenderer.jsx:189-193 and TextRenderer.jsx:197-201 both render
// `div.invalid-feedback.text-truncate` as the last child of the cell wrapper —
// so make the column editable (toggleColumnProperty / makeColumnEditable) first.
//
// FIXED: the previous implementation reached the node with `.find(">>>>:eq(1)")`,
// i.e. four nested child combinators. The renderers put `.invalid-feedback` only
// TWO levels below the <td> (wrapper > feedback for string, wrapper > feedback for
// text), so that chain could never match, and consecutive bare `>` combinators are
// not a selector jQuery accepts. Selecting the class directly works for every
// column type and every nesting depth.
/**
 * @tjBlock  canvas
 * @tjUsage  verifyInvalidFeedback('id', 0, 'Required')
 * @tjDom    rendered cell <column>-row-<i> → .invalid-feedback text
 */
// source: Shared/DataTypes/renderers/StringRenderer.jsx:189-193 + TextRenderer.jsx:197-201
export const verifyInvalidFeedback = (
  column = "id",
  rowIndex = 0,
  text,
  name = "table1"
) => {
  cy.get(tableSelector.cellInvalidFeedback(column, rowIndex, name))
    .first()
    .should("have.text", text);
};

/**
 * @tjBlock  canvas
 * @tjUsage  addInputOnTable('name', 0, 'Alice', 'input')
 * @tjDom    rendered cell <column>-row-<i> → nested input/element, clears then types
 */
export const addInputOnTable = (
  column = "id",
  rowIndex = 0,
  value,
  type = "input"
) => {
  cy.forceClickOnCanvas();
  cy.get(tableSelector.cell(column, rowIndex))
    .click()
    .find(type)
    .click()
    .type(`{selectAll}{backspace}${value}`);
  cy.forceClickOnCanvas();
};

/**
 * @tjBlock  canvas
 * @tjUsage  verifySingleValueOnTable('name', 0, 'Alice')
 * @tjDom    rendered cell <column>-row-<i> text
 */
export const verifySingleValueOnTable = (column = "id", rowIndex = 0, value) => {
  cy.get(tableSelector.cell(column, rowIndex)).should("have.text", value);
};

/**
 * @tjType   toggle
 * @tjBlock  properties
 * @tjUsage  verifyAndModifyToggleFx('Show search', 'false')
 * @tjDom    inspector toggle label + fx button + fx code input, then flips the toggle
 */
export const verifyAndModifyToggleFx = (
  paramName,
  defaultValue,
  toggleModification = true,
  helper = "",
  hiddenFx = true
) => {
  cy.get(`[data-cy="label-${cyParamName(paramName)}"]`).should(
    "have.text",
    paramName
  );
  if (hiddenFx) {
    cy.get(commonWidgetSelector.parameterTogglebutton(paramName)).realHover();
  }
  cy.get(commonWidgetSelector.parameterFxButton(paramName, "> svg"))
    .scrollIntoView()
    .click();
  if (defaultValue)
    cy.get(commonWidgetSelector.parameterInputField(paramName))
      .find("pre.CodeMirror-line")
      .should("have.text", `${helper}${defaultValue}`);
  cy.get(commonWidgetSelector.parameterFxButton(paramName)).click();
  if (toggleModification == true)
    cy.get(commonWidgetSelector.parameterTogglebutton(paramName)).click();
};

/**
 * @tjBlock  properties
 * @tjUsage  selectFromSidebarDropdown('[data-cy="..."]', 'Fixed')
 * @tjDom    inspector dropdown selector → type option + {enter}
 */
export const selectFromSidebarDropdown = (selector, option) => {
  cy.get(selector).click().type(`${option}{enter}`);
};

/**
 * @tjBlock  common
 * @tjUsage  dataPdfAssertionHelper(rows)
 * @tjDom    none — pure data shaping (concats id+name+email per row for PDF export assertion)
 */
export const dataPdfAssertionHelper = (data) => {
  let dataArray = [];
  data.forEach((a) => {
    dataArray.push("" + a.id + a.name + a.email);
  });
  return dataArray;
};

/**
 * @tjBlock  common
 * @tjUsage  dataCsvAssertionHelper(rows)
 * @tjDom    none — pure data shaping (comma-joins id,name,email per row for CSV export assertion)
 */
export const dataCsvAssertionHelper = (data) => {
  let dataArray = [];
  data.forEach((a) => {
    dataArray.push(`${a.id},${a.name},${a.email}`);
  });
  return dataArray;
};

// Drive one react-select inside the filter panel: focus its inner input (opens the
// menu via openMenuOnFocus), type to filter, then click the option whose text matches
// `label` exactly (case-insensitive) to avoid picking a longer superset option.
const selectReactFilterOption = (wrapperSelector, label) => {
  cy.get(wrapperSelector)
    .find("input")
    .first()
    .type(label, { force: true });
  cy.get(".react-select__option", { timeout: 15000 })
    .filter((_i, el) => el.innerText.trim().toLowerCase() === String(label).toLowerCase())
    .first()
    .click({ force: true });
};

/**
 * @tjBlock  canvas
 * @tjUsage  addFilter([{ column: 'name', operation: 'contains', value: 'Sarah' }], true, 'table1')
 * @tjDom    table filter toolbar button → filter panel react-select column/operation + value input
 */
export const addFilter = (
  data = [{ column: "name", operation: "contains", value: "Sarah" }],
  freshFilter = false,
  name = "table1"
) => {
  // The header toolbar (incl. the filter button) is position:fixed and is intermittently
  // reported "covered" by canvas-content under load; force the toolbar click. The filter
  // panel popover itself renders above the canvas, so its inner controls are interactable.
  cy.get(tableSelector.filterButton(name)).scrollIntoView().click({ force: true });

  data.forEach((filter, index) => {
    if (freshFilter == true) {
      if (index == 0) {
        cy.get(tableSelector.buttonClearFilter).click({ force: true });
      }
      cy.get(tableSelector.buttonAddFilter).click({ force: true });
    }
    // These are standard react-select controls (FilterRow.jsx Select). The wrapper
    // <div> is reported "covered" by the fixed canvas, so drive the inner
    // `.react-select__input`: focus it (openMenuOnFocus opens the menu), type to filter,
    // then click the matching `.react-select__option` (text-exact, case-insensitive) so
    // we never select a longer option that merely contains the typed text.
    selectReactFilterOption(tableSelector.filterSelectColumn(index), filter.column);
    selectReactFilterOption(
      tableSelector.filterSelectOperation(index),
      filter.operation
    );
    if (filter.value) {
      cy.get(tableSelector.filterInput(index)).type(
        `{selectAll}{del}${filter.value}`,
        { force: true }
      );
      // Let the value's onChange propagate to the filter state before closing —
      // closing immediately can drop the last keystroke and leave the table unfiltered.
      cy.wait(800);
    }
  });
  cy.get(tableSelector.buttonCloseFilters).click({ force: true });
  cy.wait(500);
};

// Open the LEFT inspector on the Table's live state, then verify exposed-var rows.
//
// REWRITTEN — the previous implementation (hover the widget, then realClick the
// ConfigHandle's `<name>-inspect-button`) NEVER OPENED THE INSPECTOR. A DOM probe against
// the running app showed ZERO `[data-cy^="inspector-"]` nodes after that click, so every
// `inspector-<key>-label` lookup resolved to 0 elements. It only appeared to pass in
// tableInteractions.cy.js because an earlier test in that file had already opened the
// inspector sidebar and testIsolation is off.
//
// The verified sequence is: open the left sidebar's inspector panel, dismiss the tooltip it
// leaves behind, then expand `components` and click the widget's SUBNODE label. Note there
// is no `inspector-<widget>-expand-button` — `-expand-button` exists only for the six
// level-1 groups (components, queries, globals, variables, page, constants); individual
// components are `-subnode-label`. After the subnode click the panel holds ~79 inspector
// nodes and every exposed var/function resolves.
//
// Delegates to openSubNode + verifyNodes (Support/utils/appBuilder/inspectorTree.js:46,93)
// rather than re-implementing openStateFromComponent, which is the broken path.
/**
 * @tjType   exposed
 * @tjBlock  inspector
 * @tjUsage  verifyTableExposedVars([{ key: 'currentPageData', type: 'Array', value: '[...]' }], 'table1')
 * @tjDom    left-sidebar-inspector-button → components expand → <name>-subnode-label → rows
 */
// source: Support/utils/appBuilder/inspectorTree.js:58 (openNode) and :93 (openSubNode)
export const verifyTableExposedVars = (nodes, name = "table1") => {
  cy.get(commonWidgetSelector.sidebarinspector).click();
  cy.hideTooltip();
  openSubNode(name, "components");
  verifyNodes(nodes, verifyNodeData);
};

// Toggle "Make all columns editable" (Inspector > Table). Single click, no column
// popover — the low-flake way to make every column's cells editable for inline-edit
// tests. Requires the right inspector to be open (openEditorSidebar first).
/**
 * @tjBlock  inspector
 * @tjUsage  makeAllColumnsEditable()
 * @tjDom    inspector "Make all columns editable" toggle
 */
export const makeAllColumnsEditable = () => {
  cy.get(tableSelector.makeAllColumnsEditableToggle)
    .scrollIntoView()
    .click({ force: true });
  cy.waitForAutoSave();
};

// Make a SINGLE column editable: open its column popover (column-<key>) then flip the
// per-column "Make editable" toggle. Use when a test needs per-column granularity.
/**
 * @tjBlock  inspector
 * @tjUsage  makeColumnEditable('name')
 * @tjDom    column-<key> popover → per-column "Make editable" toggle
 */
export const makeColumnEditable = (columnKey = "name") => {
  cy.get(tableSelector.columnItem(columnKey)).scrollIntoView().click();
  cy.get(tableSelector.makeEditableToggle).scrollIntoView().click({ force: true });
  cy.waitForAutoSave();
};

// Type into any NewTable editable cell, given the cell's own selector.
//
// An editable string cell is NOT an <input> and is NOT contenteditable at rest.
// StringRenderer renders a plain display <div class="long-text-input" tabindex="0">
// whose `onClick` is what flips it into edit mode (StringRenderer.jsx:150) — React then
// swaps it for a `[contenteditable="true"]` div (StringRenderer.jsx:112). Edits commit
// on blur, and Enter blurs (StringRenderer.jsx:130-140).
//
// The click MUST land on `.long-text-input` itself: the surrounding <td> carries no
// such handler, so clicking the cell wrapper leaves the cell in display mode. Verified
// by runtime probe — clicking the <td> gave `inputs=0 editable=0`.
/**
 * @tjBlock  canvas
 * @tjUsage  typeIntoEditableCell(tableSelector.cell('name', 0, 'table1'), 'Alice')
 * @tjDom    cell .long-text-input (flips to edit) → [contenteditable] div, commits on {enter}
 */
export const typeIntoEditableCell = (cellSelector, value) => {
  cy.get(cellSelector).find(".long-text-input").click({ force: true });
  cy.get(cellSelector)
    .find('[contenteditable="true"]')
    .type("{selectall}{backspace}", { force: true })
    .type(`${value}{enter}`, { force: true });
};

// Inline-edit a cell of the rendered table body (`<name>-<column>-row-<i>`).
/**
 * @tjBlock  canvas
 * @tjUsage  editTableCell('name', 0, 'Alice', 'table1')
 * @tjDom    rendered body cell <name>-<column>-row-<i> via typeIntoEditableCell
 */
export const editTableCell = (
  column = "name",
  rowIndex = 0,
  value,
  name = "table1"
) => {
  cy.forceClickOnCanvas();
  typeIntoEditableCell(tableSelector.cell(column, rowIndex, name), value);
  cy.forceClickOnCanvas();
};

// Open the add-new-row panel and fill the id / name / email cells of the first blank
// row. Rewritten against AddNewRow.jsx — the previous version asserted the FILTER
// panel's selectors (`filter-header`, `close-filters-button`) which belong to a
// different popover, and reached the inputs through brittle `>>>` CSS chains.
// Real hooks (AddNewRow.jsx:137-285):
//   panel   .table-add-new-row      header  add-new-rows-header
//   close   add-new-rows-close-button       table   add-new-row-table
//   row     add-new-row-<index>     cell    `<columnHeader>-column-<rowIndex>`
//   save    save-button             discard discard-button
// NOTE: assert `exist`, NOT `be.visible`. The panel renders inside the table's
// position:fixed container, so Cypress's visibility heuristic reports it "overflowed
// by other elements" even though it is genuinely on screen — confirmed by a runtime
// probe: rect 263x300 at (443,105), display:flex, visibility:visible, opacity:1.
// Same false negative already documented for the search input and header toolbar.
/**
 * @tjBlock  canvas
 * @tjUsage  addNewRow('table1')
 * @tjDom    add-new-row button → .table-add-new-row panel, fills id/name/email of blank row 0
 */
export const addNewRow = (name = "table1") => {
  cy.get(tableSelector.addNewRowButton(name)).click({ force: true });
  cy.get(".table-add-new-row").should("exist");
  cy.get(tableSelector.addNewRowsHeader).should("have.text", "Add new rows");
  cy.get(tableSelector.addNewRowSaveButton).should("exist");
  cy.get(tableSelector.addNewRowDiscardButton).should("exist");
  // Row 0 is the blank row the panel opens with.
  addNewRowCellInput("id", 0, "5");
  addNewRowCellInput("name", 0, "Nick");
  addNewRowCellInput("email", 0, "nick@example.com");
};

// Type into one cell of the add-new-row panel. Cells are `<column>-column-<rowIndex>`
// (AddNewRow.jsx:215-217). AddNewRow re-renders the SAME column renderers with
// `isEditable: true` (AddNewRow.jsx:243-246), so its cells are the identical
// display-div -> contenteditable widgets used by the table body — there is no <input>
// to type into. Confirmed by runtime probe: `inputs=0 editable=0 longText=1`.
/**
 * @tjBlock  canvas
 * @tjUsage  addNewRowCellInput('name', 0, 'Nick')
 * @tjDom    add-new-row panel cell <column>-column-<rowIndex> via typeIntoEditableCell
 */
export const addNewRowCellInput = (column = "id", rowIndex = 0, value) => {
  typeIntoEditableCell(`[data-cy="${column}-column-${rowIndex}"]`, value);
};

// ---------------------------------------------------------------------------
// Chunk 3 — selection / pagination / sort helpers.
// ---------------------------------------------------------------------------

// Flip one of the Table's boolean properties from the right inspector. Every
// `type: 'toggle'` property renders through ProgramaticallyHandleProperties, whose
// data-cy is the displayName slugified + `-toggle-button`
// (CodeBuilder/Elements/Toggle.jsx). Pass the displayName exactly as it appears in
// WidgetManager/widgets/table.js (see tableText.toggle* constants).
// force:true — the inspector panel virtualises and a toggle can be partially covered
// by the sticky accordion header even after scrollIntoView.
/**
 * @tjType   toggle
 * @tjBlock  properties
 * @tjUsage  toggleTableProperty(tableText.toggleShowSearch)
 * @tjDom    inspector <displayName>-toggle-button
 */
export const toggleTableProperty = (displayName) => {
  cy.get(tableSelector.toggleButton(displayName))
    .scrollIntoView()
    .click({ force: true });
  cy.waitForAutoSave();
};

// Set the Table's `rowsPerPage` (displayName 'Number of rows per page',
// table.js:65-73). The default dataset is 10 rows and rowsPerPage defaults to 10 ->
// exactly ONE page, which makes next/prev inert, so pagination tests must shrink it.
//
// The realPress(["Meta","a"]) + Backspace clear used by setTableData does NOT work on
// this field: a runtime probe showed the editor still holding `{{10}{{4}}` afterwards
// (select-all never took, so Backspace removed a single `}` and the new value was
// appended), which left rowsPerPage unparseable and rendered ZERO rows while the
// footer still read "10 Records". This field is SINGLE-line, so the shared
// clearAndTypeOnCodeMirror — which computes the exact backspace count from the current
// text — is the correct helper here. (The plan's warning against it applies only to
// the multi-LINE `data` field, which it genuinely cannot clear.)
/**
 * @tjBlock  properties
 * @tjUsage  setRowsPerPage(3)
 * @tjDom    inspector number-of-rows-per-page-input-field CodeMirror (single-line)
 */
export const setRowsPerPage = (rows) => {
  cy.get('[data-cy="number-of-rows-per-page-input-field"]')
    .filter(":visible")
    .first()
    .clearAndTypeOnCodeMirror(`{{${rows}}}`);
  cy.forceClickOnCanvas();
  cy.waitForAutoSave();
};

// Click a data row to select it. The row's onClick -> handleRowClick (TableRow.jsx:44-51)
// which drives `selectedRow`/`selectedRowId` and fires onRowClicked. Click the row's
// own cell rather than the <tr>: the <tr> is a flex container whose centre can land in
// the gap between cells. force:true because the table body is position:fixed under the
// canvas overlay.
/**
 * @tjBlock  canvas
 * @tjUsage  selectTableRow(0, 'name', 'table1')
 * @tjDom    rendered cell <name>-<column>-row-<i> click → drives selectedRow/onRowClicked
 */
export const selectTableRow = (rowIndex = 0, column = "name", name = "table1") => {
  cy.get(tableSelector.cell(column, rowIndex, name)).click({ force: true });
  cy.wait(300);
};

// Toggle a row's selection by clicking the ROW, not its checkbox.
//
// Clicking the checkbox itself does NOT work: the <input>'s onChange is
// `row.getToggleSelectedHandler()` (buildTableColumn.js:84-90) AND the enclosing <tr>'s
// onClick runs handleRowClick, which ends in `row.toggleSelected()`
// (TableData.jsx:132-145). One click therefore toggles the row TWICE and it lands back
// unselected — confirmed by runtime probe (`afterInputClick=false`, and
// `afterIconClick=false` for the SolidIcon overlay too). The header select-all is
// unaffected because it has no row wrapper, which is why that path works.
//
// Clicking the row body runs handleRowClick exactly once, and with "Bulk selection" on
// tanstack keeps multi-row selection, so successive row clicks accumulate.
/**
 * @tjBlock  canvas
 * @tjUsage  toggleRowCheckbox(0, 'table1')
 * @tjDom    row body (NOT the checkbox) via selectTableRow — one click toggles selection once
 */
export const toggleRowCheckbox = (rowIndex = 0, name = "table1") => {
  selectTableRow(rowIndex, "name", name);
};

// Assert exactly `count` row checkboxes are checked (excludes the thead select-all,
// which is scoped out via the `<name>-selection-row-` prefix).
/**
 * @tjBlock  canvas
 * @tjUsage  verifySelectedRowCount(2, 'table1')
 * @tjDom    checked row checkboxes under <name>-selection-row- (excludes thead select-all)
 */
export const verifySelectedRowCount = (count, name = "table1") => {
  cy.get(`[data-cy^="${name}-selection-row-"] [data-cy="checkbox-input"]:checked`)
    .should("have.length", count);
};

// Click a column header to sort it. Sorting must be enabled (enabledSort defaults true).
// Returns nothing — assert with tableSelector.sortIconAscending/Descending, which only
// render once the column IS sorted (TableHeader.jsx:165-179).
/**
 * @tjBlock  canvas
 * @tjUsage  sortByColumn('name')
 * @tjDom    rendered column header click → toggles sort (assert sort icon separately)
 */
export const sortByColumn = (column) => {
  cy.get(tableSelector.columnHeader(column)).click({ force: true });
  cy.wait(500);
};

// ---------------------------------------------------------------------------
// Chunk 2 — CSA (component-specific action) driver.
// ---------------------------------------------------------------------------

// Wire one of the Table's CSAs onto its OWN `Row hovered` event, without firing it.
// Fire it with triggerTableCSA.
//
// Hover is used as the trigger because it needs no second widget (hence no second drag)
// and mutates no table state — unlike a row click, which changes selection and would
// corrupt selection-CSA assertions. An onRowHovered handler is what arms TableRow's
// onMouseEnter (_stores/slices/initSlice.js:170).
//
// `params` is a [{ label, type?, value }] list — see setCSAParam in Support/utils/events.js
// for the per-type rules (string values MUST be quoted expressions: {{"id"}}).
/**
 * @tjBlock  csa
 * @tjUsage  wireTableCSA('Set page', [{ label: 'Page', value: '{{2}}' }], 'table1')
 * @tjDom    selectEvent('Row hovered', 'Control Component') → configureCSA target+action+params
 */
export const wireTableCSA = (
  action,
  params = [],
  name = "table1",
  eventIndex = 0
) => {
  // Trigger choice only — the CSA mechanics live in Support/utils/events.js
  // (configureCSA/setCSAParam) so any widget's spec can reuse them.
  //
  // isWait=true: skipping the post-create `cy.wait("@events")` races the handler's POST,
  // which is what leaves a Show Alert handler on its default "Hello world!" message.
  //
  // `eventIndex` is the card index of the handler being created — 0 for the first,
  // 1 for the second, and so on. Stacking handlers on the SAME `Row hovered` trigger
  // is the only way to drive a CSA more than once per test: on one hover they fire in
  // creation order, so handler N's effect is what the DOM ends up showing. That is how
  // setSort exercises asc → desc → auto, and how downloadTableData emits all three
  // file formats from a single trigger.
  selectEvent(
    tableText.eventRowHovered,
    "Control Component",
    0,
    undefined,
    eventIndex,
    true
  );
  configureCSA(name, action, params);
};

// Fire whatever CSA(s) `wireTableCSA` armed, by hovering a data row.
/**
 * @tjBlock  csa
 * @tjUsage  triggerTableCSA(0, 'table1')
 * @tjDom    synthetic mouseover on <name>-row-<i> → fires every Row hovered handler in order
 */
export const triggerTableCSA = (rowIndex = 0, name = "table1") => {
  cy.forceClickOnCanvas();
  // Synthetic mouseover, NOT realHover: the row can be covered (add-new-row panel, the
  // position:fixed container) and a real pointer move would silently do nothing.
  // Exactly ONE trigger — the CSA may re-render the table and detach the row, which
  // breaks any chained .trigger(). React synthesises mouseenter from mouseover.
  cy.get(tableSelector.row(rowIndex, name)).trigger("mouseover", { force: true });
  cy.wait(800);
};

// ---------------------------------------------------------------------------
// Chunk 4 — ColumnManager. The shared column-configuration surface every
// `variants/<type>.cy.js` spec drives. NOTHING below may be hand-rolled in a spec.
//
// Source root for every citation in this chunk:
//   frontend/src/AppBuilder/RightSideBar/Inspector/Components/Table/
//
// THREE MODELS YOU MUST KNOW BEFORE READING ON
//
// 1. data-cy derivation. SingleLineCodeEditor.jsx:687 computes
//    `cyLabel = displayName.toLowerCase().trim().replace(/\s+/g,'-')` and every control a
//    property renders is named off it: `<cyLabel>-widget-parameter-label`, `-fx-button`,
//    `-input-field`, `-toggle-button`, `-picker`/`-value`, `-input`. Selects are the
//    exception — CodeBuilder/Elements/Select.jsx:85-87 emits `dropdown-<kebab displayName>`
//    and falls back to `dropdown-common` when there is no displayName.
//    → columnCyLabel() is the single source of truth; tableSelector mirrors it privately.
//
// 2. fx is NOT a per-field boolean. `column.fxActiveFields[]` holds the property NAMES whose
//    Fx is currently on (ProgramaticallyHandleProperties.jsx:104-147). A legacy
//    `fxActive: true` expands to ['isEditable','columnVisibility','fieldVisibility',
//    'jsonIndentation','linkTarget'] (:117-120). Datepicker `dateFormat`/`parseDateFormat`
//    are the odd ones out: they use a SEPARATE, INVERTED array `column.notActiveFxActiveFields`
//    (DatepickerProperties.jsx:82-89), i.e. presence means fx OFF and the default is fx ON.
//
// 3. The popover is a react-bootstrap OverlayTrigger with a CONTROLLED `show`
//    (Table.jsx:536-543) whose rootClose is disabled while any CodeHinter preview popover is
//    open (usePopoverState.js:43). Never assume a canvas click closes it — use
//    closeColumnPopover().
// ---------------------------------------------------------------------------

/**
 * @tjBlock  common
 * @tjUsage  columnCyLabel('Make editable')   // → 'make-editable'
 * @tjDom    none — pure string derivation of the data-cy prefix for a popover control
 */
// source: AppBuilder/CodeEditor/SingleLineCodeEditor.jsx:687
export const columnCyLabel = (displayName = "") =>
  String(displayName).toLowerCase().trim().replace(/\s+/g, "-");

// Open one column's configuration popover from the inspector column list.
// `displayName` is the column's RESOLVED NAME exactly as typed — Table.jsx:571 puts it in
// the data-cy unnormalised, so "Order Status" is `column-Order Status`.
/**
 * @tjBlock  inspector
 * @tjUsage  openColumnPopover('email')
 * @tjDom    column-<displayName> list item → #table-column-popover-basic
 */
// source: Inspector/Components/Table/Table.jsx:566-593 + :156-158
export const openColumnPopover = (displayName) => {
  cy.get(tableSelector.columnListItem(displayName))
    .first()
    .scrollIntoView()
    .click({ force: true });
  cy.get(tableSelector.columnPopover).should("exist");
};

// Close the popover. Passing the column name is the RELIABLE path: OverlayTrigger's
// controlled `show` toggles off when its trigger is clicked again (Table.jsx:537-543).
// The no-arg path clicks the canvas and only works while rootClose is enabled — a CodeHinter
// preview popover registers a blocker that disables it (usePopoverState.js:33-43).
/**
 * @tjBlock  inspector
 * @tjUsage  closeColumnPopover('email')
 * @tjDom    re-clicks column-<displayName> (or the canvas) → asserts the popover is gone
 */
// source: Inspector/Components/shared/hooks/usePopoverState.js:16-23
export const closeColumnPopover = (displayName) => {
  if (displayName) {
    cy.get(tableSelector.columnListItem(displayName))
      .first()
      .click({ force: true });
  } else {
    cy.forceClickOnCanvas();
  }
  cy.get(tableSelector.columnPopover).should("not.exist");
};

// Switch between the popover's Properties / Styles tabs. The tabs carry no data-cy — only
// `.column-header-tab` plus their own text — so we match on text and assert the resulting
// `.active-column-tab`.
/**
 * @tjBlock  inspector
 * @tjUsage  switchColumnTab(tableText.columnTabStyles)
 * @tjDom    .column-header-tab matched by text → asserts .active-column-tab
 */
// source: ColumnManager/ColumnPopover.jsx:142-159
export const switchColumnTab = (tabLabel) => {
  cy.get(tableSelector.columnTabs)
    .filter((_i, el) => el.innerText.trim() === tabLabel)
    .first()
    .click({ force: true });
  cy.get(tableSelector.activeColumnTab).should("have.text", tabLabel);
};

// Set a column's `columnType`.
//
// The control is a react-select (PropertiesTabElements.jsx:123-162) whose menu is PORTALLED
// to document.body, so its options are never inside the popover. We pick by INDEX, never by
// text: the 23-option list repeats labels — "Tags" is both tagsV2 (:131) and the deprecated
// tags (:148), and "MultiSelect" (:130) differs from "Multiselect" (:143) only in case.
// `type` is the stored VALUE ('newMultiSelect', 'tagsV2', 'datepicker', …); the index map
// lives in tableText.columnTypeOptionIndex.
//
// Pass `displayName` to open that column's popover first; omit it when the popover is
// already open (that is what addColumnOfType does for a freshly created column).
/**
 * @tjBlock  inspector
 * @tjUsage  setColumnType('status', 'select')
 * @tjDom    .column-type-table-inspector react-select → body .react-select__option by index
 */
// source: ColumnManager/PropertiesTabElements.jsx:118-163
export const setColumnType = (displayName, type) => {
  if (displayName) openColumnPopover(displayName);
  const optionIndex = tableText.columnTypeOptionIndex[type];
  expect(optionIndex, `unknown column type "${type}"`).to.be.a("number");
  // Click react-select's CONTROL, not its outer container.
  // `.column-type-table-inspector` is the `className` react-select puts on the
  // wrapper (PropertiesTabElements.jsx:161); the wrapper does not open the menu
  // — and its parent div even carries `onClick={e => e.stopPropagation()}`
  // (:118). Clicking the wrapper left the menu closed, so the
  // `.react-select__option` lookup below timed out and took the caller's whole
  // beforeEach with it (json/image variant specs). `.react-select__control` is
  // the element that actually toggles the menu.
  cy.get(tableSelector.columnPopover)
    .find(tableSelector.columnTypeSelect)
    .scrollIntoView();
  cy.get(tableSelector.columnPopover)
    .find(`${tableSelector.columnTypeSelect} .react-select__control`)
    .click({ force: true });
  cy.get(tableSelector.columnTypeOption).should("have.length.gte", 1);
  cy.get(tableSelector.columnTypeOption).eq(optionIndex).click({ force: true });
  cy.waitForAutoSave();
};

// Add a column and configure it in one go: click "Add new column", open the newly created
// `new_columnN` row, set its type FIRST (so the type-specific fields mount), then rename it.
// `key` is optional — the key stays `new_columnN` unless you pass one, and the key is what
// the row data is read from, so pass it whenever the column must bind to real data.
/**
 * @tjBlock  inspector
 * @tjUsage  addColumnOfType('Status', 'select', 'status')
 * @tjDom    button-add-column → last column-new_column* → type dropdown → Column name / Key
 */
// source: Inspector/Components/Table/Table.jsx:607 + shared/utils/listItemHelpers.js:10-24
export const addColumnOfType = (name, type, key) => {
  cy.get(tableSelector.buttonAddColumn).scrollIntoView().click({ force: true });
  cy.waitForAutoSave();
  cy.get(tableSelector.columnListNewItems).last().click({ force: true });
  cy.get(tableSelector.columnPopover).should("exist");
  setColumnType(undefined, type);
  verifyAndEnterColumnOptionInput(tableText.labelColumnName, name);
  if (key) verifyAndEnterColumnOptionInput(tableText.labelKey, key);
  cy.waitForAutoSave();
};

// Duplicate a column from its popover header.
// GOTCHA: duplicateWithNewId (shared/utils/listItemHelpers.js:45-48) copies the item verbatim
// and only swaps the uuid — the clone keeps the SAME name, so afterwards TWO list items share
// the data-cy `column-<name>`. Every subsequent selector must use .first()/.last().
/**
 * @tjBlock  inspector
 * @tjUsage  duplicateColumn('email')
 * @tjDom    popover header [title='Duplicate column'] → a second column-<name> appears
 */
// source: ColumnManager/ColumnPopover.jsx:121-129 + Table.jsx:176
export const duplicateColumn = (displayName) => {
  openColumnPopover(displayName);
  cy.get(tableSelector.columnPopoverDuplicate).click({ force: true });
  cy.waitForAutoSave();
  cy.get(tableSelector.columnListItem(displayName)).should("have.length", 2);
};

// Delete a column from its popover header and assert both the inspector row and the rendered
// header are gone. This is the deterministic path — the list row's own trash icon
// (List.jsx:148-163) renders only while hovered and carries no data-cy.
/**
 * @tjBlock  inspector
 * @tjUsage  deleteColumn('email')
 * @tjDom    popover header [title='Delete column'] → asserts list row + column header gone
 */
// source: ColumnManager/ColumnPopover.jsx:130-138 + Table.jsx:177
export const deleteColumn = (displayName) => {
  openColumnPopover(displayName);
  cy.get(tableSelector.columnPopoverDelete).click({ force: true });
  cy.waitForAutoSave();
  cy.get(tableSelector.columnListItem(displayName)).should("not.exist");
  cy.notVisible(tableSelector.columnHeader(displayName));
};

// Write a value into a property's fx CODE editor.
//
// `<cyLabel>-input-field` only EXISTS while that property's Fx is on
// (SingleLineCodeEditor.jsx:794-802 renders the code row behind `codeShow`), so call
// toggleColumnFx(displayName) first for toggle/colorSwatches properties. Plain CodeHinter
// fields (Column name, Key, Transformation, Decimal places, Min length, …) are always code
// but are mounted WITHOUT a paramLabel, so they all collapse to `-input-field`; reach those
// through `container` (their wrapper data-cy) instead.
/**
 * @tjBlock  inspector
 * @tjUsage  setColumnProperty(tableText.labelVisibility, '{{false}}')
 * @tjDom    <cyLabel>-input-field CodeMirror (or container-scoped -input-field)
 */
// source: ProgramaticallyHandleProperties.jsx:151-167 + SingleLineCodeEditor.jsx:561-567
export const setColumnProperty = (displayName, value, container) => {
  const target = container
    ? cy.get(container).find(tableSelector.columnCodeInputField)
    : cy.get(tableSelector.columnParamInputField(displayName));
  target.first().clearAndTypeOnCodeMirror(`${value}`);
  cy.waitForAutoSave();
};

/**
 * @tjBlock  inspector
 * @tjUsage  verifyColumnProperty(tableText.labelVisibility, '{{false}}')
 * @tjDom    <cyLabel>-input-field .cm-line text (or container-scoped -input-field)
 */
// source: SingleLineCodeEditor.jsx:567
export const verifyColumnProperty = (displayName, expected, container) => {
  const target = container
    ? cy.get(container).find(tableSelector.columnCodeInputField)
    : cy.get(tableSelector.columnParamInputField(displayName));
  target.first().find(".cm-line").should("have.text", `${expected}`);
};

// Write into / read back a plain wrapper-scoped CodeHinter (Transformation, Display text,
// Decimal places, Max rating, …). These are mounted with no paramLabel so their own data-cy
// is the non-unique `-input-field`; `container` is their wrapper's data-cy.
/**
 * @tjBlock  inspector
 * @tjUsage  setColumnCodeField(tableSelector.columnTransformationField, '{{cellValue.toUpperCase()}}')
 * @tjDom    <container> → its -input-field CodeMirror
 */
// source: ColumnManager/PropertiesTabElements.jsx:200-218
export const setColumnCodeField = (container, value) =>
  setColumnProperty(undefined, value, container);

/**
 * @tjBlock  inspector
 * @tjUsage  verifyColumnCodeField(tableSelector.columnTransformationField, '{{cellValue}}')
 * @tjDom    <container> → its -input-field .cm-line text
 */
// source: ColumnManager/PropertiesTabElements.jsx:200-218
export const verifyColumnCodeField = (container, expected) =>
  verifyColumnProperty(undefined, expected, container);

// Flip a boolean column property (Make editable, Visibility, Indent, Open in new tab,
// Auto assign colors, Enable time, …). force:true — the popover body scrolls and a toggle
// can sit under the sticky header even after scrollIntoView.
/**
 * @tjBlock  inspector
 * @tjUsage  toggleColumnProperty(tableText.labelMakeEditable)
 * @tjDom    <cyLabel>-toggle-button checkbox inside the column popover
 */
// source: AppBuilder/CodeBuilder/Elements/Toggle.jsx:25
export const toggleColumnProperty = (displayName) => {
  cy.get(tableSelector.columnParamToggle(displayName))
    .scrollIntoView()
    .click({ force: true });
  cy.waitForAutoSave();
};

// Set a colour on a column control.
//
// `rgba` is ['R','G','B','A'] as strings, matching selectColourFromColourPicker.
// `index` exists for PRODUCT BUG F3 (MED): four pickers are mounted with NO cyLabel at all,
// so `String(undefined)` makes them all render `undefined-picker` and they can only be told
// apart POSITIONALLY inside their container —
//   boolean "Checked"            StylesTabElements.jsx:109-116   → pass '' + index 0
//   boolean "Unchecked"          StylesTabElements.jsx:119-126   → pass '' + index 1
//   deprecated toggle "Active color" StylesTabElements.jsx:56-63 → pass '' + index 0
//   button "Icon color"          ButtonStylesTab.jsx:134-147     → pass '' + index 0
// PRODUCT BUG F5 (MED): the rating "Selected color" swatch writes selectedBgColorStars when
// iconType === 'stars' and selectedBgColorHearts otherwise (StylesTabElements.jsx:240) while
// keeping the SAME data-cy — set the icon type before asserting which key changed.
// The closing realClick lands a REAL pointer event, which is what dismisses the raw
// SketchPicker's full-screen cover div (Inspector/Elements/Color.jsx:56); a forced click
// would be delivered to the title underneath and leave the picker open.
/**
 * @tjType   colorSwatches
 * @tjBlock  inspector
 * @tjUsage  setColumnColor(tableText.labelTextColor, ['255','0','0','100'])
 * @tjDom    <cyLabel>-picker (or undefined-picker + index) → rgba inputs → dismiss
 */
// source: modules/common/components/BaseColorSwatches/BaseColorSwatches.jsx:139-146
export const setColumnColor = (displayName, rgba, index = 0) => {
  cy.get(tableSelector.columnColorPicker(displayName))
    .eq(index)
    .scrollIntoView()
    .click({ force: true });
  // colorSwatches opens on a Theme / Color-picker ToggleGroup which can default to the Theme
  // view — that view renders no editable rgba inputs at all.
  cy.get("body").then(($b) => {
    if ($b.find(`${tableSelector.colorPickerModeToggle}:visible`).length > 0) {
      cy.get(tableSelector.colorPickerModeToggle).click({ force: true });
    }
  });
  rgba.forEach((value, i) => {
    cy.get(commonWidgetSelector.colourPickerInput(i + 1))
      .click()
      .clear()
      .type(`${value}`);
  });
  cy.waitForAutoSave();
  cy.get(tableSelector.columnPopoverTitle).realClick();
};

// Assert a colour control's displayed value. Both picker variants render the value as text
// INSIDE the `-picker` box — BaseColorSwatches nests it in a `-value` div (:146), the raw
// Color renders a bare div (Inspector/Elements/Color.jsx:83-85) — so asserting on `-picker`
// works for both, including the F3 `undefined-picker` group.
/**
 * @tjType   colorSwatches
 * @tjBlock  inspector
 * @tjUsage  verifyColumnColor(tableText.labelTextColor, '#ff0000ff')
 * @tjDom    <cyLabel>-picker (or undefined-picker + index) text content
 */
// source: BaseColorSwatches.jsx:139-146 + Inspector/Elements/Color.jsx:65-86
export const verifyColumnColor = (displayName, expected, index = 0) => {
  cy.get(tableSelector.columnColorPicker(displayName))
    .eq(index)
    .should("contain.text", expected);
};

// Flip a property's Fx button — which, for columns, pushes/pops the property NAME on
// `column.fxActiveFields` (ProgramaticallyHandleProperties.jsx:114-147) rather than setting a
// per-field boolean. Turning Fx ON is what makes `<cyLabel>-input-field` exist, so this is
// the required prelude to setColumnProperty for toggle/colorSwatches properties.
// force:true — the fx button lives in a `.fx-button-container` that is only revealed on
// hover, and a forced click bypasses the visibility check without needing a real pointer.
/**
 * @tjBlock  inspector
 * @tjUsage  toggleColumnFx(tableText.labelVisibility)
 * @tjDom    <cyLabel>-fx-button → pushes/pops the property on column.fxActiveFields
 */
// source: AppBuilder/CodeBuilder/Elements/FxButton.jsx:10 + ProgramaticallyHandleProperties.jsx:160-164
export const toggleColumnFx = (displayName) => {
  cy.get(tableSelector.columnParamFxButton(displayName))
    .scrollIntoView()
    .click({ force: true });
  cy.waitForAutoSave();
};

// Assert a property exposes NO Fx button. Two things produce this: `isFxNotRequired` on the
// paramMeta (SingleLineCodeEditor.jsx:699 — e.g. Lock column schema, Make all columns
// editable) and PRODUCT BUG F6, where a control renders an FxButton with no dataCy at all.
/**
 * @tjBlock  inspector
 * @tjUsage  verifyColumnFxAbsent(tableText.labelDateFormat)
 * @tjDom    asserts <cyLabel>-fx-button does not exist
 */
// source: SingleLineCodeEditor.jsx:698-701
export const verifyColumnFxAbsent = (displayName) => {
  cy.get(tableSelector.columnParamFxButton(displayName)).should("not.exist");
};

// @tj-workaround F1 (HIGH) — NO validation control has a usable data-cy.
// ValidationProperties.jsx's getValidationList declares the key `dateCy`
// (:41,50,56,64,75,79,85,91,103,115,122,132,139,149,156) but all three render branches read
// `validation.dataCy` (:179,199,216). React drops `data-cy={undefined}`, so regex, minLength,
// maxLength, minValue, maxValue, minDate, maxDate, minTime, maxTime, disabledDates and
// customRule are ALL unaddressable by data-cy. The only stable hook is the field's own
// <label> text inside `.optional-properties-when-editable-true` (:248) — hence the
// label-text lookup below. Remove this workaround once `dateCy` is renamed to `dataCy`.
//
// The block only mounts when the column is editable (PropertiesTabElements.jsx:401), so call
// toggleColumnProperty(tableText.labelMakeEditable) first.
// PRODUCT BUG F2 (LOW): `text` columns DO show Regex — the guard at :39 reads
// `item.itemType`, but columns carry `columnType`, so the property is never skipped.
/**
 * @tjBlock  inspector
 * @tjUsage  setColumnValidation(tableText.labelMinLength, '{{3}}')
 * @tjDom    .optional-properties-when-editable-true → field matched by LABEL TEXT (F1)
 */
// source: ColumnManager/ValidationProperties.jsx:174-245
export const setColumnValidation = (label, value) => {
  cy.get(tableSelector.columnValidationSection)
    .find("label.form-label")
    .filter((_i, el) => el.innerText.trim() === label)
    .first()
    .parent()
    .then(($field) => {
      // datepicker / timepicker validations render a ReactDatePicker or Timepicker instead of
      // a CodeHinter (:176-212) — those take a typed date string, not an expression.
      if ($field.hasClass("inspector-validation-date-picker")) {
        cy.wrap($field)
          .find(tableSelector.columnValidationDateInput)
          .first()
          .type(`{selectAll}{backspace}${value}{enter}`, { force: true });
      } else {
        cy.wrap($field)
          .find(tableSelector.columnCodeInputField)
          .first()
          .clearAndTypeOnCodeMirror(`${value}`);
      }
    });
  cy.waitForAutoSave();
};

// @tj-workaround F1 (HIGH) — same missing-data-cy defect as setColumnValidation; asserts via
// the field's <label> text.
/**
 * @tjBlock  inspector
 * @tjUsage  verifyColumnValidation(tableText.labelMinLength, '{{3}}')
 * @tjDom    .optional-properties-when-editable-true → field matched by LABEL TEXT (F1)
 */
// source: ColumnManager/ValidationProperties.jsx:174-245
export const verifyColumnValidation = (label, expected) => {
  cy.get(tableSelector.columnValidationSection)
    .find("label.form-label")
    .filter((_i, el) => el.innerText.trim() === label)
    .first()
    .parent()
    .then(($field) => {
      if ($field.hasClass("inspector-validation-date-picker")) {
        cy.wrap($field)
          .find(tableSelector.columnValidationDateInput)
          .first()
          .should("have.value", `${expected}`);
      } else {
        cy.wrap($field)
          .find(tableSelector.columnCodeInputField)
          .first()
          .find(".cm-line")
          .should("have.text", `${expected}`);
      }
    });
};

// Set horizontal alignment on the STYLES tab (switchColumnTab first). The ToggleGroup has no
// data-cy of its own — its items do, as `togglr-button-<value>` (note the source typo).
// Gated on `columnType !== 'button'`; the label reads "Alignment" for boolean/image/rating
// and "Text Alignment" otherwise (StylesTabElements.jsx:32-34).
/**
 * @tjBlock  inspector
 * @tjUsage  setColumnAlignment(tableText.alignCenter)
 * @tjDom    popover Styles tab → togglr-button-<left|center|right>
 */
// source: ColumnManager/StylesTabElements.jsx:29-52 + ToolJetUI/SwitchGroup/ToggleGroupItem.jsx:33
export const setColumnAlignment = (position) => {
  cy.get(tableSelector.columnPopover)
    .find(tableSelector.toggleGroupItem(position))
    .first()
    .click({ force: true });
  cy.waitForAutoSave();
};

// Set "Freeze column" on the PROPERTIES tab. Scoped to `.pin-column-control` because the
// left/right values collide with the Styles-tab alignment group and the button icon-alignment
// group. Default is `unpinned`.
/**
 * @tjBlock  inspector
 * @tjUsage  setPinPosition(tableText.pinLeft)
 * @tjDom    .pin-column-control → togglr-button-<left|unpinned|right>
 */
// source: ColumnManager/PropertiesTabElements.jsx:69-88 + :467-474
export const setPinPosition = (position) => {
  cy.get(tableSelector.pinColumnControl)
    .find(tableSelector.toggleGroupItem(position))
    .click({ force: true });
  cy.waitForAutoSave();
};

// Assert the RENDERED cell for a column type.
//
// All 15 column types share ONE cell selector (`<table>-<columnHeader>-row-<i>`); the <td>'s
// CLASS is the only discriminator, and only 8 of the 15 types add one at all
// (has-select · has-link · has-datepicker · has-number · has-text · has-textarea ·
// has-actions · selector-column). boolean/image/json/markdown/html/rating add NOTHING —
// tableText.cellClassByType maps those to null; assert their inner control instead.
/**
 * @tjBlock  canvas
 * @tjUsage  verifyCellType('status', 0, tableText.cellClassByType.select, 'table1')
 * @tjDom    rendered <td> <name>-<column>-row-<i> → asserts its discriminating class
 */
// source: Widgets/NewTable/_components/TableData/_components/TableRow.jsx:103-142
export const verifyCellType = (
  column,
  rowIndex = 0,
  expectedClass,
  name = "table1"
) => {
  cy.get(tableSelector.cell(column, rowIndex, name)).should(
    "have.class",
    expectedClass
  );
};

// Assert a rendered cell's text. Same as verifySingleValueOnTable but takes the widget name,
// which matters as soon as a spec renders more than one table.
/**
 * @tjBlock  canvas
 * @tjUsage  verifyCellValue('name', 0, 'Alice', 'table1')
 * @tjDom    rendered cell <name>-<column>-row-<i> text
 */
// source: Widgets/NewTable/_components/TableData/_components/TableRow.jsx:103
export const verifyCellValue = (column, rowIndex = 0, value, name = "table1") => {
  cy.get(tableSelector.cell(column, rowIndex, name)).should(
    "have.text",
    `${value}`
  );
};

// ---------------------------------------------------------------------------
// Chunk 4a — options list (select · newMultiSelect · tagsV2).
// OptionsList renders inside its own accordion ("Options", or "Tags" for tagsV2) at the
// bottom of the Properties tab, and each option opens a SECOND popover (#popover-basic)
// distinct from #table-column-popover-basic.
// ---------------------------------------------------------------------------

// Append an option. The button carries no data-cy (OptionsList.jsx:432-442 is a plain ui
// Button) — but the accordion's own collapse trigger is a <div>
// (_ui/Accordion/AccordionItem.js:62-69), so it is the only <button> in the accordion and a
// text match is safe. New options are auto-named `Option 1`, `Option 2`, … (:64-71).
/**
 * @tjBlock  inspector
 * @tjUsage  addColumnOption(tableText.buttonAddNewOption)
 * @tjDom    .table-select-column-accordian button matched by text → new column-Option N row
 */
// source: SelectOptionsList/OptionsList.jsx:429-444
export const addColumnOption = (buttonLabel = tableText.buttonAddNewOption) => {
  cy.get(tableSelector.optionsAddButton)
    .filter((_i, el) => el.innerText.trim() === buttonLabel)
    .first()
    .click({ force: true });
  cy.waitForAutoSave();
};

// Open one option's editor popover. Option rows use the same raw `column-<label>` data-cy
// shape as the column list (OptionsList.jsx:407) — the label is NOT normalised, so
// `Option 1` is `column-Option 1`.
/**
 * @tjBlock  inspector
 * @tjUsage  openColumnOption('Option 1')
 * @tjDom    column-<optionLabel> row → #popover-basic option editor
 */
// source: SelectOptionsList/OptionsList.jsx:397-416
export const openColumnOption = (optionLabel) => {
  cy.get(tableSelector.optionListItem(optionLabel))
    .first()
    .scrollIntoView()
    .click({ force: true });
  cy.get(tableSelector.optionPopover).should("exist");
};

// Rename an option and/or change its stored value.
// @tj-workaround: BOTH labels in the option popover are emitted as
// `label-action-button-text` (OptionsList.jsx:183 and :201) — a duplicate data-cy — and their
// CodeHinters have no paramLabel, so both collapse to `-input-field`. They can only be told
// apart POSITIONALLY: index 0 is "Option label", index 1 is "Option value". This holds only
// while the Label/Option colour swatches below them have Fx OFF (fx on would add more
// `-input-field` nodes to the same popover).
/**
 * @tjBlock  inspector
 * @tjUsage  setOptionLabelValue('Option 1', 'Active', 'active')
 * @tjDom    #popover-basic -input-field :eq(0) = label, :eq(1) = value (duplicate data-cy)
 */
// source: SelectOptionsList/OptionsList.jsx:182-217
export const setOptionLabelValue = (optionLabel, newLabel, newValue) => {
  openColumnOption(optionLabel);
  if (newValue !== undefined) {
    cy.get(tableSelector.optionPopover)
      .find(tableSelector.columnCodeInputField)
      .eq(1)
      .clearAndTypeOnCodeMirror(`${newValue}`);
  }
  if (newLabel !== undefined) {
    // Rename LAST: the option row's data-cy is keyed off the label, so renaming first would
    // invalidate every selector still pointing at the old one.
    cy.get(tableSelector.optionPopover)
      .find(tableSelector.columnCodeInputField)
      .eq(0)
      .clearAndTypeOnCodeMirror(`${newLabel}`);
  }
  cy.waitForAutoSave();
};

// Set an option's "Label color" or "Option color". Both are colorSwatches with real
// displayNames, so they are addressable — unlike the F3 group.
/**
 * @tjType   colorSwatches
 * @tjBlock  inspector
 * @tjUsage  setOptionColor('Option 1', tableText.labelOptionColor, ['255','0','0','100'])
 * @tjDom    #popover-basic → <cyLabel>-picker → rgba inputs
 */
// source: SelectOptionsList/OptionsList.jsx:218-243
export const setOptionColor = (optionLabel, colorLabel, rgba) => {
  openColumnOption(optionLabel);
  setColumnColor(colorLabel, rgba);
};

// Flip "Make this option as default".
// NOTE the asymmetry (OptionsList.jsx:131-155): for `select` columns turning one option on
// UNSETS every other option's flag and replaces defaultOptionsList wholesale; for
// newMultiSelect / tagsV2 the flags accumulate.
/**
 * @tjBlock  inspector
 * @tjUsage  toggleMakeDefaultOption('Option 1')
 * @tjDom    #popover-basic → make-this-option-as-default-toggle-button
 */
// source: SelectOptionsList/OptionsList.jsx:244-258
export const toggleMakeDefaultOption = (optionLabel) => {
  openColumnOption(optionLabel);
  toggleColumnProperty(tableText.labelMakeDefaultOption);
};

/**
 * @tjBlock  inspector
 * @tjUsage  toggleAutoAssignColors()
 * @tjDom    auto-assign-colors-toggle-button in the Options/Tags accordion
 */
// source: SelectOptionsList/OptionsList.jsx:290-304
export const toggleAutoAssignColors = () =>
  toggleColumnProperty(tableText.labelAutoAssignColors);

// Flip "Dynamic option". When ON the static option list is replaced by a single CodeHinter
// plus an "Options loading state" toggle (OptionsList.jsx:337-367), so every option-row
// helper above stops applying.
/**
 * @tjBlock  inspector
 * @tjUsage  toggleDynamicOptions()
 * @tjDom    dynamic-option-toggle-button in the Options/Tags accordion
 */
// source: SelectOptionsList/OptionsList.jsx:322-336
export const toggleDynamicOptions = () =>
  toggleColumnProperty(tableText.labelDynamicOption);

// tagsV2 only.
/**
 * @tjBlock  inspector
 * @tjUsage  toggleAllowMultipleSelection()
 * @tjDom    allow-multiple-selection-toggle-button (tagsV2 columns only)
 */
// source: SelectOptionsList/OptionsList.jsx:305-321
export const toggleAllowMultipleSelection = () =>
  toggleColumnProperty(tableText.labelAllowMultipleSelection);

// tagsV2 only — a ToggleGroup with no data-cy of its own; values are none | a-z | z-a.
/**
 * @tjBlock  inspector
 * @tjUsage  setSortTags(tableText.sortTagsAsc)
 * @tjDom    Options accordion → togglr-button-<none|a-z|z-a>
 */
// source: SelectOptionsList/OptionsList.jsx:274-289
export const setSortTags = (value) => {
  cy.get(tableSelector.optionsAccordion)
    .find(tableSelector.toggleGroupItem(value))
    .click({ force: true });
  cy.waitForAutoSave();
};

// ---------------------------------------------------------------------------
// Chunk 4b — button column. Selecting a button pushes the popover into a DETAIL view: the
// header title flips to "Edit Button", a back arrow appears, and the duplicate/delete titles
// flip to "Duplicate button"/"Delete button" (ColumnPopover.jsx:103-138).
// ---------------------------------------------------------------------------

/**
 * @tjBlock  inspector
 * @tjUsage  addActionButton()
 * @tjDom    add-new-action-button → a new "Button" row in .button-list-manager
 */
// source: ColumnManager/ButtonListManager.jsx:113-115
export const addActionButton = () => {
  cy.get(tableSelector.addNewActionButton).scrollIntoView().click({ force: true });
  cy.waitForAutoSave();
};

// Open a button's detail view.
// @tj-workaround: ButtonListManager.jsx:12-27 renders each row as a bare `.page-menu-item`
// with NO data-cy — the label lives in a `.page-name` span, so text matching is the only
// hook. Freshly added buttons are all labelled "Button" (useButtonManager.js:5), so pass
// `index` to disambiguate before you have renamed them.
/**
 * @tjBlock  inspector
 * @tjUsage  openActionButton('Button')
 * @tjDom    .button-list-manager .page-menu-item matched on .page-name text → Edit Button view
 */
// source: ColumnManager/ButtonListManager.jsx:12-27 + ColumnPopover.jsx:117
export const openActionButton = (label = tableText.defaultActionButtonLabel, index = 0) => {
  cy.get(tableSelector.buttonListItem)
    .filter(
      (_i, el) =>
        (el.querySelector(tableSelector.buttonListItemName)?.innerText || "").trim() === label
    )
    .eq(index)
    .click({ force: true });
  cy.get(tableSelector.columnPopoverTitle).should(
    "have.text",
    tableText.buttonDetailTitle
  );
};

// Leave the button detail view and return to the column's own Properties tab.
/**
 * @tjBlock  inspector
 * @tjUsage  backFromButtonDetail()
 * @tjDom    popover header back arrow → title returns to "Edit Column"
 */
// source: ColumnManager/ColumnPopover.jsx:103-116
export const backFromButtonDetail = () => {
  cy.get(tableSelector.columnPopoverBackButton).first().click({ force: true });
  cy.get(tableSelector.columnPopoverTitle).should(
    "have.text",
    tableText.columnPopoverTitle
  );
};

// Set a button property.
// @tj-workaround: "Button label" and "Tooltip" (ButtonPropertiesTab.jsx:26-54) are plain
// CodeHinters inside undecorated `<div className="field mb-2 px-3">` wrappers — no data-cy on
// the wrapper AND no paramLabel on the editor, so both collapse to `-input-field` and can
// only be reached POSITIONALLY within the popover: index 0 = Button label, index 1 = Tooltip.
// Everything else (Loading state, Visibility, Disable action button) goes through
// ProgramaticallyHandleProperties and IS addressable by displayName — pass `positional: false`
// (the default) for those and they route to setColumnProperty.
/**
 * @tjBlock  inspector
 * @tjUsage  setButtonProperty(tableText.labelButtonLabel, 'Approve', 0)
 * @tjDom    Edit Button view → -input-field by index (label/tooltip) or <cyLabel>-input-field
 */
// source: ColumnManager/ButtonPropertiesTab.jsx:26-105
export const setButtonProperty = (displayName, value, positionalIndex) => {
  if (positionalIndex === undefined) {
    setColumnProperty(displayName, value);
    return;
  }
  cy.get(tableSelector.columnPopover)
    .find(tableSelector.columnCodeInputField)
    .eq(positionalIndex)
    .clearAndTypeOnCodeMirror(`${value}`);
  cy.waitForAutoSave();
};

// Set a button STYLE (switchColumnTab to Styles inside the detail view first).
// `kind` routes to the control the paramMeta actually renders:
//   'color'       colorSwatches → Background / Label color / Border color / Loader color.
//                 Icon color is the F3 case: pass displayName '' (ButtonStylesTab.jsx:144
//                 mounts it with displayName: '', so its picker is `undefined-picker`).
//   'number'      numberInput   → Border radius (:176) — `<cyLabel>-input`.
//   'toggleGroup' ToggleGroup   → Button type solid|outline (:48-51) and icon alignment
//                 left|right (:152-162); neither has a data-cy above the item level.
/**
 * @tjBlock  inspector
 * @tjUsage  setButtonStyle(tableText.labelBackground, ['255','0','0','100'], 'color')
 * @tjDom    Edit Button > Styles → <cyLabel>-picker | <cyLabel>-input | togglr-button-<value>
 */
// source: ColumnManager/ButtonStylesTab.jsx:46-179
export const setButtonStyle = (displayName, value, kind = "color", index = 0) => {
  if (kind === "color") {
    setColumnColor(displayName, value, index);
  } else if (kind === "number") {
    cy.get(tableSelector.columnParamNumberInput(displayName))
      .scrollIntoView()
      .click({ force: true })
      .clear()
      .type(`${value}`);
    cy.waitForAutoSave();
  } else {
    cy.get(tableSelector.columnPopover)
      .find(tableSelector.toggleGroupItem(value))
      .eq(index)
      .click({ force: true });
    cy.waitForAutoSave();
  }
};

// ---------------------------------------------------------------------------
// Chunk 4c — datepicker column.
// The two format fields do NOT use column.fxActiveFields. They use a separate, INVERTED array
// `column.notActiveFxActiveFields` (DatepickerProperties.jsx:82-89): a name PRESENT in the
// array means fx OFF, and because the array starts undefined BOTH fields default to fx ON —
// i.e. a CodeHinter, not the DD/MM/YYYY dropdown. setDateFormat/setParseDateFormat below
// handle whichever control is currently mounted.
// ---------------------------------------------------------------------------

// Set the display date format. Fx ON (the default) → free-text CodeHinter; Fx OFF → a
// react-select of DD/MM/YYYY | MM/DD/YYYY | YYYY/DD/MM | YYYY/MM/DD.
/**
 * @tjBlock  inspector
 * @tjUsage  setDateFormat(tableText.dateFormatMmDdYyyy)
 * @tjDom    input-date-display-format → its CodeHinter, or the format react-select
 */
// source: ColumnManager/DatepickerProperties.jsx:112-165
export const setDateFormat = (value) => {
  cy.get(tableSelector.dateDisplayFormatField).then(($field) => {
    if ($field.find(".cm-content").length > 0) {
      cy.wrap($field)
        .find(tableSelector.columnCodeInputField)
        .first()
        .clearAndTypeOnCodeMirror(`${value}`);
    } else {
      cy.wrap($field).find("input").first().click({ force: true }).type(`${value}`);
      cy.get(tableSelector.inspectorSelectOption)
        .filter((_i, el) => el.innerText.trim() === value)
        .first()
        .click({ force: true });
    }
  });
  cy.waitForAutoSave();
};

// Set the PARSE date format.
// @tj-workaround (duplicate data-cy): `input-parse-timezone` is emitted TWICE by
// DatepickerProperties.jsx — once for this "Date" block (:291) and once for the parse
// "Time zone" block (:363) — so the parse-format field is `:eq(0)`.
// PRODUCT BUG F6 (LOW): this block's Fx handler reads `isDateDisplayFormatFxOn` while setting
// `isParseDateFormatFxOn` (:301), so toggling the DISPLAY format's fx silently decides what
// the PARSE fx toggle writes; and its FxButton is mounted with no dataCy (:297-309), so it
// renders `undefined-fx-button`.
/**
 * @tjBlock  inspector
 * @tjUsage  setParseDateFormat(tableText.dateFormatMmDdYyyy)
 * @tjDom    input-parse-timezone:eq(0) → its CodeHinter, or the format react-select
 */
// source: ColumnManager/DatepickerProperties.jsx:288-336
export const setParseDateFormat = (value) => {
  cy.get(tableSelector.parseTimezoneField)
    .eq(0)
    .then(($field) => {
      if ($field.find(".cm-content").length > 0) {
        cy.wrap($field)
          .find(tableSelector.columnCodeInputField)
          .first()
          .clearAndTypeOnCodeMirror(`${value}`);
      } else {
        cy.wrap($field).find("input").first().click({ force: true }).type(`${value}`);
        cy.get(tableSelector.inspectorSelectOption)
          .filter((_i, el) => el.innerText.trim() === value)
          .first()
          .click({ force: true });
      }
    });
  cy.waitForAutoSave();
};

// @tj-workaround F6 (LOW): neither datepicker FxButton is given a dataCy
// (DatepickerProperties.jsx:124-136 display format, :297-309 parse format), so both render
// the literal `undefined-fx-button` and can only be reached through their owning field
// wrapper. Flipping it pushes/pops the name on the INVERTED `notActiveFxActiveFields` array.
/**
 * @tjBlock  inspector
 * @tjUsage  toggleDateFormatFx()
 * @tjDom    input-date-display-format → undefined-fx-button (F6)
 */
// source: ColumnManager/DatepickerProperties.jsx:124-136
export const toggleDateFormatFx = () => {
  cy.get(tableSelector.dateDisplayFormatField)
    .find(tableSelector.undefinedFxButton)
    .first()
    .click({ force: true });
  cy.waitForAutoSave();
};

// @tj-workaround F6 (LOW) — see toggleDateFormatFx. Scoped to `input-parse-timezone:eq(0)`
// because that data-cy is also duplicated onto the parse "Time zone" block (:363).
/**
 * @tjBlock  inspector
 * @tjUsage  toggleParseDateFormatFx()
 * @tjDom    input-parse-timezone:eq(0) → undefined-fx-button (F6)
 */
// source: ColumnManager/DatepickerProperties.jsx:297-309
export const toggleParseDateFormatFx = () => {
  cy.get(tableSelector.parseTimezoneField)
    .eq(0)
    .find(tableSelector.undefinedFxButton)
    .first()
    .click({ force: true });
  cy.waitForAutoSave();
};

/**
 * @tjBlock  inspector
 * @tjUsage  toggleEnableDate()
 * @tjDom    enable-date-toggle-button (gates the Date format field)
 */
// source: ColumnManager/DatepickerProperties.jsx:99-111
export const toggleEnableDate = () => toggleColumnProperty(tableText.labelEnableDate);

// Flipping this ON also mounts the Time format select, the 24-hour toggle, the display
// Time zone select AND the minTime/maxTime validations (ValidationProperties.jsx:129-146).
/**
 * @tjBlock  inspector
 * @tjUsage  toggleEnableTime()
 * @tjDom    enable-time-toggle-button
 */
// source: ColumnManager/DatepickerProperties.jsx:169-180
export const toggleEnableTime = () => toggleColumnProperty(tableText.labelEnableTime);

/**
 * @tjBlock  inspector
 * @tjUsage  toggleParseUnixTimestamp()
 * @tjDom    parse-in-unix-timestamp-toggle-button
 */
// source: ColumnManager/DatepickerProperties.jsx:255-266
export const toggleParseUnixTimestamp = () =>
  toggleColumnProperty(tableText.labelParseInUnixTimestamp);

// Pick a DISPLAY time zone. The options are named "+05:30", "UTC", … (:11-47) and only mount
// while "Enable time" is on. `input-display-time-zone` is unique — unlike the parse-side
// time zone, which shares the duplicated `input-parse-timezone` data-cy.
/**
 * @tjBlock  inspector
 * @tjUsage  setTimeZone('+05:30')
 * @tjDom    input-display-time-zone react-select → .react-select__option by exact text
 */
// source: ColumnManager/DatepickerProperties.jsx:222-244
export const setTimeZone = (zoneName) => {
  cy.get(tableSelector.displayTimeZoneField)
    .find("input")
    .first()
    .click({ force: true })
    .type(`${zoneName}`, { force: true });
  cy.get(tableSelector.inspectorSelectOption)
    .filter((_i, el) => el.innerText.trim() === zoneName)
    .first()
    .click({ force: true });
  cy.waitForAutoSave();
};
