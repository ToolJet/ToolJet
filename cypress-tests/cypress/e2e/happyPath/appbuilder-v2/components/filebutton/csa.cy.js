import { fake } from "Fixtures/fake";
import { commonWidgetSelector } from "Selectors/common";
import { fileButtonSelector } from "Selectors/fileButton";
import { openEditorSidebar } from "Support/utils/commonWidget";
import { selectEvent, selectCSA } from "Support/utils/events";
import { resizeQueryPanel } from "Support/utils/dataSource";
import { openNode, openSubNode, backFromDetail, verifyNodeData } from "Support/utils/inspector";

describe(
  "File Button CSA",
  { testIsolation: false, retries: { runMode: 3, openMode: 0 } },
  () => {
  const widget = "filebutton1";
  const validFile = "cypress/fixtures/Image/tooljet.png";
  const panelHeight = 50;

  const waitForDropSettle = (widgetName, attemptsLeft = 6) => {
    cy.get(`[data-cy="draggable-widget-${widgetName}"]`).then(($el) => {
      const top = $el[0].getBoundingClientRect().top;
      cy.wrap(null).then(() => {
        cy.wait(150);
        cy.get(`[data-cy="draggable-widget-${widgetName}"]`).then(($el2) => {
          const top2 = $el2[0].getBoundingClientRect().top;
          if (Math.abs(top2 - top) > 1 && attemptsLeft > 0) {
            waitForDropSettle(widgetName, attemptsLeft - 1);
          }
        });
      });
    });
  };

  const wireCSA = (csaDisplayName, flipValueToggle) => {
    // No deselect before this drag — right-sidebar-components-button is a tab
    // toggle, and deselecting first would close the catalog instead of opening it.
    openEditorSidebar(widget);
    cy.dragAndDropWidget("Button", 500, 300);
    waitForDropSettle("button1");
    openEditorSidebar("button1");
    selectEvent("On click", "Control Component");
    selectCSA(widget, csaDisplayName);
    if (flipValueToggle) {
      cy.get('[data-cy="event-Value-toggle-button"]').should("be.visible").click();
    }
    cy.forceClickOnCanvas();
  };

  const triggerCSA = () => {
    cy.get(commonWidgetSelector.draggableWidget("button1")).click();
    cy.waitForAutoSave();
  };

  // Second trigger path: a RunJS query calling components.filebutton1.<method>().
  // Added via API, so it needs a reload to show up in the editor — which also
  // resets CSA state, so each test re-establishes real pre-state after reloading.
  const createRunJSQuery = (code) => {
    // Fixed name (fresh app per test) — QueryCard.jsx lowercases it for data-cy.
    const queryName = "csarunjs";
    cy.apiAddQueryToApp({
      queryName,
      options: { code, hasParamSupport: true, parameters: [] },
      dataSourceName: "runjsdefault",
      dsKind: "runjs",
    });
    cy.reload();
    resizeQueryPanel(panelHeight);
  };

  const runRunJSQuery = () => {
    cy.get('[data-cy="list-query-csarunjs"]').click();
    cy.get('[data-cy="query-run-button"]').click();
    cy.waitForAutoSave();
  };

  // Confirms the CSA's effect on filebutton1's own EXPOSED state (what
  // components.filebutton1.<key> actually returns), not just the rendered DOM
  // — a separate code path from the visual checks above.
  // Both the Inspector tab AND the Components expand-button are toggles whose
  // state persists in the app's own store even after the panel is closed, so
  // undo each in reverse order before closing — every call then starts from
  // the same known tab-closed/components-collapsed state.
  const verifyExposedValue = (key, type, value) => {
    cy.get(commonWidgetSelector.sidebarinspector).click();
    cy.hideTooltip();
    openNode("components");
    openSubNode(widget);
    verifyNodeData(key, type, value);
    backFromDetail();
    openNode("components");
    cy.get(commonWidgetSelector.sidebarinspector).click();
  };

  beforeEach(() => {
    cy.apiLogin();
    cy.apiCreateApp(`${fake.companyName}-Filebutton-App`);
    cy.openApp();
    cy.dragAndDropWidget("File button", 500, 100);
    waitForDropSettle(widget);
  });

  it("should clear the selected file via the Clear CSA", () => {
    cy.get(fileButtonSelector.inputField(widget)).selectFile(validFile, { force: true });
    cy.get(fileButtonSelector.label(widget)).should("have.text", "tooljet.png");
    verifyExposedValue("files", "Array", "[1]");

    wireCSA("Clear");
    triggerCSA();

    cy.get(fileButtonSelector.label(widget)).scrollIntoView().should("have.text", "Upload file");
    cy.get(fileButtonSelector.clearButton(widget)).should("not.exist");
    verifyExposedValue("files", "Array", "[0]");

    // reload clears `files` too (never persisted, same as isVisible/isDisabled/
    // isLoading) — it's already empty here, so just re-select before proving
    // Clear again via RunJS.
    createRunJSQuery(`await components.${widget}.clear(); return true;`);
    cy.get(fileButtonSelector.inputField(widget)).scrollIntoView().selectFile(validFile, { force: true });
    cy.get(fileButtonSelector.label(widget)).scrollIntoView().should("have.text", "tooljet.png");
    verifyExposedValue("files", "Array", "[1]");

    runRunJSQuery();

    cy.get(fileButtonSelector.label(widget)).scrollIntoView().should("have.text", "Upload file");
    cy.get(fileButtonSelector.clearButton(widget)).should("not.exist");
    verifyExposedValue("files", "Array", "[0]");
  });

  it("should focus the trigger via the Set focus CSA", () => {
    cy.get(fileButtonSelector.button(widget)).should("not.have.focus");

    wireCSA("Set focus");
    triggerCSA();

    cy.get(fileButtonSelector.button(widget)).scrollIntoView().should("have.focus");

    createRunJSQuery(`await components.${widget}.setFocus(); return true;`);
    cy.get(fileButtonSelector.button(widget)).scrollIntoView().should("not.have.focus");

    runRunJSQuery();
    cy.get(fileButtonSelector.button(widget)).scrollIntoView().should("have.focus");
  });

  it("should blur the trigger via the Set blur CSA", () => {
    cy.get(fileButtonSelector.button(widget)).focus().should("have.focus");

    wireCSA("Set blur");
    triggerCSA();

    cy.get(fileButtonSelector.button(widget)).scrollIntoView().should("not.have.focus");

    createRunJSQuery(`await components.${widget}.setBlur(); return true;`);
    cy.get(fileButtonSelector.button(widget)).focus().should("have.focus");

    runRunJSQuery();
    cy.get(fileButtonSelector.button(widget)).scrollIntoView().should("not.have.focus");
  });

  it("should hide the widget via the Set visibility CSA", () => {
    cy.get(fileButtonSelector.widget(widget)).should("exist");
    verifyExposedValue("isVisible", "Boolean", "true");

    wireCSA("Set visibility", true);
    triggerCSA();

    cy.get(fileButtonSelector.widget(widget)).should("not.exist");
    verifyExposedValue("isVisible", "Boolean", "false");

    createRunJSQuery(`await components.${widget}.setVisibility(true); return true;`);
    triggerCSA();
    cy.get(fileButtonSelector.widget(widget)).should("not.exist");
    verifyExposedValue("isVisible", "Boolean", "false");

    runRunJSQuery();
    cy.get(fileButtonSelector.widget(widget)).scrollIntoView().should("exist");
    verifyExposedValue("isVisible", "Boolean", "true");
  });

  it("should disable the trigger via the Set disable CSA", () => {
    cy.get(fileButtonSelector.button(widget)).should("not.be.disabled");
    verifyExposedValue("isDisabled", "Boolean", "false");

    wireCSA("Set disable", true);
    triggerCSA();

    cy.get(fileButtonSelector.button(widget)).scrollIntoView().should("be.disabled");
    verifyExposedValue("isDisabled", "Boolean", "true");

    createRunJSQuery(`await components.${widget}.setDisable(false); return true;`);
    triggerCSA();
    cy.get(fileButtonSelector.button(widget)).scrollIntoView().should("be.disabled");
    verifyExposedValue("isDisabled", "Boolean", "true");

    runRunJSQuery();
    cy.get(fileButtonSelector.button(widget)).scrollIntoView().should("not.be.disabled");
    verifyExposedValue("isDisabled", "Boolean", "false");
  });

  it("should show the loader via the Set loading CSA", () => {
    cy.get(fileButtonSelector.loader(widget)).should("not.exist");
    cy.get(fileButtonSelector.label(widget)).scrollIntoView().should("be.visible");
    verifyExposedValue("isLoading", "Boolean", "false");

    wireCSA("Set loading", true);
    triggerCSA();

    cy.get(fileButtonSelector.loader(widget)).scrollIntoView().should("be.visible");
    cy.get(fileButtonSelector.label(widget)).should("not.exist");
    verifyExposedValue("isLoading", "Boolean", "true");

    createRunJSQuery(`await components.${widget}.setLoading(false); return true;`);
    triggerCSA();
    cy.get(fileButtonSelector.loader(widget)).scrollIntoView().should("be.visible");
    verifyExposedValue("isLoading", "Boolean", "true");

    runRunJSQuery();
    cy.get(fileButtonSelector.loader(widget)).should("not.exist");
    cy.get(fileButtonSelector.label(widget)).scrollIntoView().should("be.visible");
    verifyExposedValue("isLoading", "Boolean", "false");
  });
});
