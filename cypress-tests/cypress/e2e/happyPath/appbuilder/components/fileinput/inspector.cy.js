import { fake } from "Fixtures/fake";
import { closeQueryPanel } from "Support/utils/appBuilder/querymanager/queryPanel";
import { waitForDropSettle } from "Support/utils/commonWidget";
import { commonWidgetSelector } from "Selectors/common";
import { fileInputText } from "Texts/appBuilder/components/fileInput";
import {
  openAndVerifyNode,
  openNode,
  verifyNodes,
  verifyNodeData,
} from "Support/utils/appBuilder/inspectorTree";

// Inspector facet — the widget's exposed contract at default.
// Covers all 9 config.exposedVariables — source: fileinput.js:424-434
//        all 6 config.actions handles as Functions — source: fileinput.js:435-484
//        (both lists cited line-by-line below)
// Config-derived, so a config change dropping or renaming either list fails here first.
describe(
  "File Input inspector",
  { testIsolation: false },
  () => {
    const widget = fileInputText.defaultWidgetName;

    // source: fileinput.js:424-434 (exposedVariables). `id` is asserted separately
    // below — its runtime value is the component's uuid, not the config's literal.
    const exposedValues = [
      { key: "files", type: "Array", value: "[0]" }, // source: fileinput.js:425
      { key: "isParsing", type: "Boolean", value: "false" }, // source: fileinput.js:427
      { key: "isValid", type: "Boolean", value: "true" }, // source: fileinput.js:428
      { key: "fileSize", type: "Number", value: "0" }, // source: fileinput.js:429
      { key: "isMandatory", type: "Boolean", value: "false" }, // source: fileinput.js:430
      { key: "isLoading", type: "Boolean", value: "false" }, // source: fileinput.js:431
      { key: "isVisible", type: "Boolean", value: "true" }, // source: fileinput.js:432
      { key: "isDisabled", type: "Boolean", value: "false" }, // source: fileinput.js:433
    ];

    // source: fileinput.js:435-484 (actions[].handle)
    const functions = [
      { key: "clear", type: "Function" }, // source: fileinput.js:437
      { key: "setFocus", type: "Function" }, // source: fileinput.js:441
      { key: "setBlur", type: "Function" }, // source: fileinput.js:445
      { key: "setVisibility", type: "Function" }, // source: fileinput.js:449
      { key: "setDisable", type: "Function" }, // source: fileinput.js:461
      { key: "setLoading", type: "Function" }, // source: fileinput.js:473
    ];

    beforeEach(() => {
      cy.apiLogin();
      cy.apiCreateApp(`${fake.companyName}-${Date.now()}-Fileinput-App`);
      cy.openApp();
      cy.dragAndDropWidget(fileInputText.defaultWidgetText, 500, 100);
      waitForDropSettle(widget);
      closeQueryPanel();
    });

    afterEach(() => {
      cy.apiDeleteApp();
    });

    it("should verify the initial exposed values and functions on inspector", () => {
      cy.get(commonWidgetSelector.sidebarinspector).click();
      cy.hideTooltip();
      openNode("components");
      openAndVerifyNode(widget, exposedValues, verifyNodeData);
      verifyNodes(functions, verifyNodeData);
    });

    it("should expose id as the component uuid", () => {
      // NOTE — asserted shape deliberately DIFFERS from the config. The config declares
      // id:'' (fileinput.js:426), but the runtime overwrites it with the component's own
      // uuid on mount (FileInput.jsx:153-155). The uuid changes per app, so a fixed-value
      // assertion is impossible and the config's empty literal is simply stale. Matching
      // the uuid shape is what a binding would actually read.
      cy.get(commonWidgetSelector.sidebarinspector).click();
      cy.hideTooltip();
      openNode("components");
      openAndVerifyNode(widget, [], verifyNodeData);

      cy.get('[data-cy="inspector-id-label"]').eq(0).realHover().verifyVisibleElement("have.text", "id");
      cy.get('[data-cy="inspector-id-value"]')
        .eq(0)
        .invoke("text")
        .should("match", /^"?[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}"?$/);
    });
  }
);
