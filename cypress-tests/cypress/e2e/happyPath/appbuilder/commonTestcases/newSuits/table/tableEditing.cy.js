import { fake } from "Fixtures/fake";
import { commonSelectors, commonWidgetSelector } from "Selectors/common";
import { commonWidgetText } from "Texts/common";
import { tableText } from "Texts/table";
import { tableSelector } from "Selectors/table";
import {
  resizeTableWidget,
  makeAllColumnsEditable,
  editTableCell,
  verifySingleValueOnTable,
  verifyTableExposedVars,
  addNewRow,
} from "Support/utils/appBuilder/components/table";
import { openEditorSidebar, openAccordion } from "Support/utils/commonWidget";
import { addMultiEventsWithAlert } from "Support/utils/appBuilder/events";
import { resizeQueryPanel } from "Support/utils/appBuilder/querymanager/queryPanel";

// ---------------------------------------------------------------------------
// Chunk 1 — Table inline editing + add row (NewTable).
// Priority-1 facet of the chunked Table suite. Covers: make-editable toggles,
// inline cell edit, changeSet/dataUpdates exposed vars, add-new-row, discard,
// and the onCellValueChanged / onNewRowsAdded events.
//
// beforeEach mirrors the proven-green tableRegression.cy.js:37-58 harness
// (drag -> widen canvas -> close settings panel -> resize table -> open right
// EVENT WIRING: addMultiEventsWithAlert passes isWait=TRUE. With false, selectEvent
// skips `cy.wait("@events")` after creating the handler, so addSupportCSAData types the
// alert message before the handler's POST /events resolves and the write is silently
// dropped — the handler keeps its DEFAULT message and the toast reads "Hello world!".
// Proven by probe while debugging tableInteractions.cy.js.
//
// inspector). The Table renders `draggable-widget-<name>` on BOTH the outer
// RenderWidget wrapper AND its inner <table>, so scope the outer box to :eq(0).
// ---------------------------------------------------------------------------
const tableWidget = (name) =>
  `${commonWidgetSelector.draggableWidget(name)}:eq(0)`;

describe("Table — inline editing & add row", { testIsolation: false }, () => {
  const name = tableText.defaultWidgetName;

  beforeEach(() => {
    cy.apiLogin();
    cy.apiCreateApp(`${fake.companyName}-table-edit-App`);
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

  it("edits a cell inline and renders the new value", () => {
    makeAllColumnsEditable();
    cy.forceClickOnCanvas();
    // Default row 0 = Olivia Nguyen (id 1). Edit the name cell.
    editTableCell("name", 0, "Edited Name");
    verifySingleValueOnTable("name", 0, "Edited Name");
  });

  // DEFERRED: exposed-var assertion via the left inspector. changeSet/dataUpdates are
  // OBJECT values rendered as JSON in the detail JSONViewer; the row data-cy did not
  // resolve as `inspector-changeset-label` from the inspect-button flow. Object-value
  // assertion needs a bound-widget approach (Text = {{components.table1.changeSet}}),
  // which requires a 2nd in-test drag — folding into a dedicated exposed-var pass.
  it.skip("exposes changeSet & dataUpdates after an inline edit", () => {
    makeAllColumnsEditable();
    cy.forceClickOnCanvas();
    editTableCell("name", 0, "Edited Name");
    verifyTableExposedVars(
      [{ key: "changeSet", type: "Object", value: "Edited Name" }],
      name
    );
  });

  it("fires onCellValueChanged when a cell is edited", () => {
    makeAllColumnsEditable();
    openEditorSidebar(name);
    openAccordion(commonWidgetText.accordionEvents);
    // Message must stay punctuation-free — clearAndTypeOnCodeMirror drops any char
    // outside [a-zA-Z0-9._-] before typing (see the note on tableText.toast*).
    addMultiEventsWithAlert(
      [
        {
          event: tableText.eventCellValueChanged,
          message: tableText.toastCellValueChanged,
        },
      ],
      true
    );
    cy.forceClickOnCanvas();
    editTableCell("name", 0, "Zed");
    cy.verifyToastMessage(
      commonSelectors.toastMessage,
      tableText.toastCellValueChanged
    );
  });

  it("adds a new row via the add-new-row bar and fires onNewRowsAdded", () => {
    // showAddNewRowButton defaults true. Wire onNewRowsAdded -> Show Alert first.
    openEditorSidebar(name);
    openAccordion(commonWidgetText.accordionEvents);
    addMultiEventsWithAlert(
      [
        {
          event: tableText.eventAddNewRows,
          message: tableText.toastNewRowsAdded,
        },
      ],
      true
    );
    cy.forceClickOnCanvas();
    // addNewRow opens the modal, fills id/name/email (5/Nick/nick@example.com).
    addNewRow(name);
    cy.get(tableSelector.addNewRowSaveButton).click({ force: true });
    cy.verifyToastMessage(
      commonSelectors.toastMessage,
      tableText.toastNewRowsAdded
    );
  });

  it("discards an inline edit and reverts the cell", () => {
    makeAllColumnsEditable();
    cy.forceClickOnCanvas();
    editTableCell("name", 0, "Temp Edit");
    verifySingleValueOnTable("name", 0, "Temp Edit");
    // The Save/Discard change bar renders in the footer when edits are pending.
    cy.get(tableSelector.discardChangesButton).click({ force: true });
    verifySingleValueOnTable("name", 0, tableText.defaultInput[0].name);
  });
});
