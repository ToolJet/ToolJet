import { commonWidgetSelector, cyParamName } from "Selectors/common";
import { tableSelector } from "Selectors/table";

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

export const addNewRow = (name = "table1") => {
  cy.get(tableSelector.addNewRowButton(name)).click();
  cy.get(".table-add-new-row").should("be.visible");
  cy.get(tableSelector.headerFilters).verifyVisibleElement(
    "have.text",
    "Add new rows"
  );
  cy.get(tableSelector.buttonCloseFilters).should("be.visible");
  cy.get(tableSelector.addNewRowButton(name)).should("be.visible");
  cy.contains("Save").should("be.visible");
  cy.contains("Discard").should("be.visible");
  cy.get(
    ".table-add-new-row > .table-responsive > .table > thead > .tr > :nth-child(1)"
  ).should("be.visible");
  cy.get(
    ".table-add-new-row > > .table > tbody > .table-row > :nth-child(1) >>> input"
  )
    .click()
    .clear()
    .type("5");
  cy.get(
    ".table-add-new-row > > .table > tbody > .table-row > :nth-child(2) >>> input"
  )
    .click()
    .clear()
    .type("Nick");
  cy.get(
    ".table-add-new-row > > .table > tbody > .table-row > :nth-child(3) >>> input"
  )
    .click()
    .clear()
    .type("nick@example.com");
};
