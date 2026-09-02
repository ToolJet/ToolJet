import { fake } from "Fixtures/fake";
import { commonWidgetSelector } from "Selectors/common";
import { tableText } from "Texts/table";
import { tableSelector } from "Selectors/table";
import {
  resizeTableWidget,
  addAndOpenColumnOption,
  verifyAndEnterColumnOptionInput,
  deleteAndVerifyColumn,
  selectDropdownOption,
  verifySingleValueOnTable,
} from "Support/utils/appBuilder/components/table";
import { openEditorSidebar } from "Support/utils/commonWidget";
import { resizeQueryPanel } from "Support/utils/appBuilder/querymanager/queryPanel";

// ---------------------------------------------------------------------------
// Chunk 4 (DEFERRED STUB) — Table column data types.
//
// Scope when picked up: the 14 column adapter types the column manager can assign
// via `dropdown-column-type` — default, string, number, text, badge, multipleBadges,
// tags, dropdown, link, radio, multiselect, toggleSwitch, datePicker, image. The
// index map for each type already lives in `selectDropdownOption`
// (Support/utils/table.js) — pass the type NAME, e.g.
// `selectDropdownOption('[data-cy="dropdown-column-type"]>>:eq(0)', "badge")`.
//
// Helpers that already exist and should be reused rather than re-written:
//   - addAndOpenColumnOption(name, type)   — adds a column and opens its popover,
//                                            then sets the column name.
//   - verifyAndEnterColumnOptionInput(label, value)
//                                          — drives any `input-and-label-<param>`
//                                            field inside the column popover.
//   - deleteAndVerifyColumn(columnName)    — removes a column and asserts both the
//                                            list item and the header are gone.
//   - tableSelector.columnItem(key)        — opens an existing column's popover.
//   - verifySingleValueOnTable(col, row, v)— asserts a rendered cell value.
//
// Deferred because each adapter type needs its own rendered-cell assertion (badge
// pills, tag chips, toggle inputs, date formatting, image <img> src) and that is a
// separate research pass against the renderers in
// frontend/src/AppBuilder/Widgets/NewTable/_components/CellRenderers.
//
// Priority order agreed with the suite owner: editing (Chunk 1) -> CSA (Chunk 2)
// -> interactions (Chunk 3) -> column types (here) -> styles (Chunk 5).
// ---------------------------------------------------------------------------
const tableWidget = (name) =>
  `${commonWidgetSelector.draggableWidget(name)}:eq(0)`;

describe.skip("Table — column data types", { testIsolation: false }, () => {
  const name = tableText.defaultWidgetName;

  beforeEach(() => {
    cy.apiLogin();
    cy.apiCreateApp(`${fake.companyName}-table-column-types-App`);
    cy.openApp();
    cy.viewport(1400, 2200);
    cy.dragAndDropWidget("Table", 250, 100);
    cy.hideTooltip();
    cy.modifyCanvasSize(900, 800);
    cy.get("[data-cy='left-sidebar-settings-button']").click();
    resizeTableWidget(name, 750, 600);
    resizeQueryPanel("1");
    openEditorSidebar(name);
  });
  afterEach(() => {
    cy.apiDeleteApp();
  });

  it("renders each column adapter type with its own cell renderer", () => {
    // TODO: for each type in selectDropdownOption's map, addAndOpenColumnOption(...)
    // then assert the rendered cell (badge pill / tag chip / toggle input / <img>).
  });

  it("adds, renames and deletes a column via the column manager", () => {
    // TODO: addAndOpenColumnOption("Region", "string") ->
    // verifyAndEnterColumnOptionInput("Column name", "Region") ->
    // assert tableSelector.columnHeader("Region") -> deleteAndVerifyColumn("Region").
  });
});
