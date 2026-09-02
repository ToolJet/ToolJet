import { commonWidgetSelector, cyParamName } from "Selectors/common";
import { tableSelector } from "Selectors/table";
import { verifyNodeData } from "Support/utils/appBuilder/inspector";
import { selectEvent, configureCSA } from "Support/utils/appBuilder/events";
import { tableText } from "Texts/table";

// Spec-local scoped resize. The shared `cy.resizeWidget` uses `[class="bottom-right"]`
// which now matches 2 elements (commands.js:375 — forbidden to edit). We scope the
// mousedown to the LAST visible bottom-right handle (the active widget's moveable
// control box) to avoid the "cy.trigger() can only be called on a single element" throw.
// The Table widget puts `draggable-widget-<name>` on BOTH the RenderWidget wrapper
// (RenderWidget.jsx:308, the outer moveable box) AND its internal <table>
// (Table.jsx:340) — so the data-cy matches 2 els. The OUTER (first in DOM) is the
// selectable/resizable moveable box. Use this for clicks/resize.
export const tableWidgetOuter = (widgetName) =>
  `[data-cy="draggable-widget-${widgetName}"]`;

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

// Set the Table `data` property (the inspector field whose displayName is ' ', so its
// data-cy normalises to `-input-field`; lives in the "Data" accordion — exactly one
// such field is present right after openEditorSidebar). The shared
// clearAndTypeOnCodeMirror re-clicks per token, and a click lands on the codehinter
// autocomplete <li> popup which covers the input. We type natively with force:true and
// parseSpecialCharSequences:false (so `{`/`}` are literal) to avoid that, then press
// {esc} to dismiss the autocomplete before blurring.
// Set the Table `data` property. The field (displayName ' ' -> data-cy `-input-field`,
// in the "Data" accordion) ships PRE-POPULATED with a 10-row, multi-LINE sample dataset.
// The shared clearAndTypeOnCodeMirror clears only via the first `.cm-line`'s text, which
// leaves most of a multi-line default behind and interleaves the new text -> invalid
// JSON -> "0 Records". So we hard-clear the whole editor with a real Cmd/Ctrl+A +
// Delete first, then type. `value` should be the codehinter expression WITHOUT the
// `{{ }}` wrapper; we add it here (the data field evaluates a JS expression).
export const setTableData = (value) => {
  cy.get('[data-cy="widget-accordion-data"]')
    .closest(".accordion-item")
    .find('[data-cy="-input-field"]')
    .find(".cm-content")
    .as("tableDataCm");
  // Hard clear: real select-all + delete handles the multi-line default.
  cy.get("@tableDataCm").realClick();
  cy.get("@tableDataCm").realPress(["Meta", "a"]);
  cy.get("@tableDataCm").realPress("Backspace");
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

export const selectDropdownOption = (inputSelector, option) => {
  const data = {
    default: 0,
    string: 1,
    number: 2,
    text: 3,
    badge: 4,
    multipleBadges: 5,
    tags: 6,
    dropdown: 7,
    link: 8,
    radio: 9,
    multiselect: 10,
    toggleSwitch: 11,
    datePicker: 12,
    image: 13,
    wrap: 0,
    scroll: 1,
    hide: 2,
  };

  const click = () => {
    cy.get(inputSelector).realClick();
    cy.wait(500);
    cy.get("body").then(($body) => {
      if ($body.find('[data-index="0"]').length == 0) {
        click();
      }
    });
  };

  click();
  cy.get(
    isNaN(option)
      ? `[data-index="${data[option]}"]>.select-search-option:eq(0)`
      : `[data-index="${option}"]>.select-search-option:eq(0)`
  ).click({ force: true });
};

export const verifyAndEnterColumnOptionInput = (label, value) => {
  cy.get(`[data-cy="input-and-label-${cyParamName(label)}"]`)
    .find("label")
    .should("have.text", label);
  cy.get(`[data-cy="input-and-label-${cyParamName(label)}"]`)
    .find(`[data-cy="-input-field"]`)
    // .click({ force: true })
    // .realClick()
    // .realPress(["Meta", "A"])
    // .realType(`{backspace}{backspace}{backspace}{backspace}`)
    // .realPress(["Meta", "A"])
    .clearAndTypeOnCodeMirror(`${value}`);
};

export const addAndOpenColumnOption = (name, type) => {
  cy.get('[data-cy="button-add-column"]').click();
  cy.get('[data-cy="button-add-column"]')
    .parents(".accordion-body")
    .find('[data-cy*="column-new_column"]')
    .last()
    .click();
  selectDropdownOption('[data-cy="dropdown-column-type"]>>:eq(0)', type);
  verifyAndEnterColumnOptionInput("Column name", name);
};

export const deleteAndVerifyColumn = (columnName) => {
  cy.get(`[data-cy="pages-name-${columnName}"]`)
    .parent()
    .realHover()
    .click()
    .find(".tj-base-btn")
    .click();
  cy.get(".list-item-popover-option").click();
  cy.notVisible(`[data-cy="column-${columnName}"]`);
  cy.notVisible(tableSelector.columnHeader(columnName));
};

// NewTable cells are addressed by column HEADER + row index (not a numeric column
// index). These helpers now take a column header string as their first arg.
export const verifyInvalidFeedback = (column = "id", rowIndex = 0, text) => {
  cy.get(tableSelector.cell(column, rowIndex))
    .find(">>>>:eq(1)")
    .should("have.text", text);
};

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

export const verifySingleValueOnTable = (column = "id", rowIndex = 0, value) => {
  cy.get(tableSelector.cell(column, rowIndex)).should("have.text", value);
};

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

export const selectFromSidebarDropdown = (selector, option) => {
  cy.get(selector).click().type(`${option}{enter}`);
};

export const dataPdfAssertionHelper = (data) => {
  let dataArray = [];
  data.forEach((a) => {
    dataArray.push("" + a.id + a.name + a.email);
  });
  return dataArray;
};

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

// Open the LEFT inspector focused on the Table's live state, then verify exposed-var
// rows. The shared openStateFromComponent hovers `draggable-widget-<name>`, which for
// the Table matches TWO nodes (outer wrapper + inner <table>) and makes realHover throw
// — so scope to the outer box (:eq(0)) and click the ConfigHandle's inspect button
// (`<name>-inspect-button`, ConfigHandle.jsx:272). `nodes` is a [{key,type,value}] list
// verified via verifyNodeData against the detail rows (inspector-<key>-label / -value).
export const verifyTableExposedVars = (nodes, name = "table1") => {
  cy.get(`[data-cy="draggable-widget-${name}"]`).eq(0).realHover().realHover();
  cy.get(`[data-cy="draggable-widget-${name}"]`)
    .eq(0)
    .realHover()
    .then(() => {
      cy.get(`[data-cy="${name}-inspect-button"]`)
        .realHover({ position: "topRight" })
        .last()
        .realClick();
    });
  nodes.forEach((node) => verifyNodeData(node.key, node.type, node.value));
};

// Toggle "Make all columns editable" (Inspector > Table). Single click, no column
// popover — the low-flake way to make every column's cells editable for inline-edit
// tests. Requires the right inspector to be open (openEditorSidebar first).
export const makeAllColumnsEditable = () => {
  cy.get(tableSelector.makeAllColumnsEditableToggle)
    .scrollIntoView()
    .click({ force: true });
  cy.waitForAutoSave();
};

// Make a SINGLE column editable: open its column popover (column-<key>) then flip the
// per-column "Make editable" toggle. Use when a test needs per-column granularity.
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
export const typeIntoEditableCell = (cellSelector, value) => {
  cy.get(cellSelector).find(".long-text-input").click({ force: true });
  cy.get(cellSelector)
    .find('[contenteditable="true"]')
    .type("{selectall}{backspace}", { force: true })
    .type(`${value}{enter}`, { force: true });
};

// Inline-edit a cell of the rendered table body (`<name>-<column>-row-<i>`).
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
export const toggleRowCheckbox = (rowIndex = 0, name = "table1") => {
  selectTableRow(rowIndex, "name", name);
};

// Assert exactly `count` row checkboxes are checked (excludes the thead select-all,
// which is scoped out via the `<name>-selection-row-` prefix).
export const verifySelectedRowCount = (count, name = "table1") => {
  cy.get(`[data-cy^="${name}-selection-row-"] [data-cy="checkbox-input"]:checked`)
    .should("have.length", count);
};

// Click a column header to sort it. Sorting must be enabled (enabledSort defaults true).
// Returns nothing — assert with tableSelector.sortIconAscending/Descending, which only
// render once the column IS sorted (TableHeader.jsx:165-179).
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
export const wireTableCSA = (action, params = [], name = "table1") => {
  // Trigger choice only — the CSA mechanics live in Support/utils/events.js
  // (configureCSA/setCSAParam) so any widget's spec can reuse them.
  //
  // isWait=true: skipping the post-create `cy.wait("@events")` races the handler's POST,
  // which is what leaves a Show Alert handler on its default "Hello world!" message.
  selectEvent(tableText.eventRowHovered, "Control Component", 0, undefined, 0, true);
  configureCSA(name, action, params);
};

// Fire whatever CSA `wireTableCSA` armed, by hovering a data row.
export const triggerTableCSA = (rowIndex = 0, name = "table1") => {
  cy.forceClickOnCanvas();
  // Synthetic mouseover, NOT realHover: the row can be covered (add-new-row panel, the
  // position:fixed container) and a real pointer move would silently do nothing.
  // Exactly ONE trigger — the CSA may re-render the table and detach the row, which
  // breaks any chained .trigger(). React synthesises mouseenter from mouseover.
  cy.get(tableSelector.row(rowIndex, name)).trigger("mouseover", { force: true });
  cy.wait(800);
};
