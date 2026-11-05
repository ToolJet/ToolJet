import { fake } from "Fixtures/fake";
import { commonWidgetSelector } from "Selectors/common";
import {
  addInputOnQueryField,
  changeQueryToggles,
  query,
  selectQueryFromLandingPage,
} from "Support/utils/queries";
import { resizeQueryPanel } from "Support/utils/dataSource";
import { openNode } from "Support/utils/inspector";

// Selectors for the "Run this query periodically" query setting.
// Toggle dataCy is `run-query-periodically`; CustomToggleSwitch/FxButton/CodeHinter
// derive the suffixes below. The interval + fx-expression fields live in PeriodicRunInputs.
const sel = {
  settingsTab: '[data-cy="query-tab-settings"]',
  toggleSwitch: '[data-cy="run-query-periodically-toggle-switch"]',
  toggleLabel: '[data-cy="run-query-periodically-toggle-label"]',
  fxButton: '[data-cy="run-query-periodically-fx-button"]',
  intervalLabel: '[data-cy="label-time-interval-input"]',
  intervalField: '[data-cy="time-interval-input-field"]',
  fxExpression: '[data-cy="run-periodically-fx-expression-input-field"]',
  queryDataValue: '[data-cy="inspector-data-value"]',
};

const createRunjs = (code) => {
  selectQueryFromLandingPage("runjs", "JavaScript");
  addInputOnQueryField("runjs", code);
};

describe("Query - Run this query periodically", () => {
  beforeEach(() => {
    cy.apiLogin();
    cy.apiCreateApp(`${fake.companyName}-periodic-App`);
    cy.openApp();
    cy.viewport(1800, 1800);
    cy.dragAndDropWidget("Button");
    resizeQueryPanel("80");
  });

  it("reveals the time interval only when enabled, and persists across reload", () => {
    createRunjs("return 1");
    cy.get(sel.settingsTab).click();

    // Toggle is present; the interval field stays hidden until the toggle is on.
    cy.get(sel.toggleLabel).verifyVisibleElement(
      "have.text",
      "Run this query periodically"
    );
    cy.get(sel.intervalField).should("not.exist");

    // Enabling the toggle reveals the interval field.
    changeQueryToggles("run-query-periodically");
    cy.get(sel.intervalLabel).should("be.visible");
    cy.get(sel.intervalField)
      .should("be.visible")
      .clearAndTypeOnCodeMirror("2000");
    cy.waitForAutoSave();

    // Round-trip: the options are stored on query.options (opaque JSON blob), so they
    // survive a reload with no server change.
    cy.reload();
    cy.get('[data-cy="list-query-runjs1"]').click();
    cy.get(sel.settingsTab).click();
    cy.get(sel.toggleSwitch).should("be.checked");
    cy.get(sel.intervalField).should("be.visible").and("contain", "2000");

    cy.apiDeleteApp();
  });

  it("reveals the fx expression editor when fx is toggled on the periodic flag", () => {
    createRunjs("return 1");
    cy.get(sel.settingsTab).click();

    cy.get(sel.fxExpression).should("not.exist");
    cy.get(sel.fxButton).click();
    // fx mode swaps the switch for an expression editor; the interval field stays.
    cy.get(sel.fxExpression).should("be.visible");
    cy.get(sel.intervalField).should("be.visible");

    cy.apiDeleteApp();
  });

  it("re-runs on the interval after the first run, with the clock anchored to the last run", () => {
    // Date.now() changes every execution, so a changed value proves the timer fired.
    createRunjs("return Date.now()");
    cy.get(sel.settingsTab).click();
    changeQueryToggles("run-query-periodically");
    cy.get(sel.intervalField).clearAndTypeOnCodeMirror("2000");
    cy.waitForAutoSave();

    // The first manual run is what starts the periodic timer.
    query("run");

    // Watch the exposed query data advance on the next tick via the inspector.
    cy.get(commonWidgetSelector.sidebarinspector).click();
    cy.get(".tooltip-inner").invoke("hide");
    openNode("queries");
    openNode("runjs1");

    let firstValue;
    cy.get(sel.queryDataValue)
      .eq(0)
      .invoke("text")
      .then((text) => {
        firstValue = text;
      });
    // Wait past one interval (2000ms) plus a buffer, then assert the value changed.
    cy.wait(3000);
    cy.get(sel.queryDataValue)
      .eq(0)
      .invoke("text")
      .should((text) => {
        expect(text).to.not.equal(firstValue);
      });

    cy.apiDeleteApp();
  });
});
