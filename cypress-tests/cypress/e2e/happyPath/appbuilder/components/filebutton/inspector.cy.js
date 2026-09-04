import { fake } from "Fixtures/fake";
import { commonWidgetSelector } from "Selectors/common";
import { fileButtonText } from "Texts/appBuilder/components/fileButton";
import {
  openAndVerifyNode,
  openNode,
  verifyNodes,
  verifyNodeData,
} from "Support/utils/appBuilder/inspectorTree";
import { waitForDropSettle, closeQueryPanel } from "Support/utils/appBuilder/components/fileButton";

// Inspector facet — the widget's exposed contract at default.
// Covers all 7 config.exposedVariables — source: fileButton.js:287-294
//        all 6 config.actions handles as Functions — source: fileButton.js:296-323
//        (both lists cited line-by-line below)
// Config-derived, so a config change dropping or renaming either list fails here first.
describe(
  "File Button inspector",
  { testIsolation: false, retries: { runMode: 3, openMode: 0 } },
  () => {
  const widget = fileButtonText.defaultWidgetName;

  // source: fileButton.js:287-295 (exposedVariables)
  const exposedValues = [
    { key: "files", type: "Array", value: "[0]" }, // source: fileButton.js:288
    { key: "isParsing", type: "Boolean", value: "false" }, // source: fileButton.js:289
    // NOTE — asserted value deliberately DIFFERS from the config. The config declares
    // isValid:false (fileButton.js:290), but the runtime seeds it from !isMandatory
    // (useFilePicker.js:77): with mandatory off, nothing is required yet, so an empty
    // field is already valid. `true` is what the widget actually exposes and what a
    // binding would read; the config's literal is the stale one. Reported as a config
    // inconsistency rather than papered over.
    { key: "isValid", type: "Boolean", value: "true" },
    { key: "isMandatory", type: "Boolean", value: "false" }, // source: fileButton.js:291
    { key: "isLoading", type: "Boolean", value: "false" }, // source: fileButton.js:292
    { key: "isVisible", type: "Boolean", value: "true" }, // source: fileButton.js:293
    { key: "isDisabled", type: "Boolean", value: "false" }, // source: fileButton.js:294
  ];

  // source: fileButton.js:296-323 (actions[].handle)
  const functions = [
    { key: "clear", type: "Function" }, // source: fileButton.js:298
    { key: "setFocus", type: "Function" }, // source: fileButton.js:302
    { key: "setBlur", type: "Function" }, // source: fileButton.js:306
    { key: "setVisibility", type: "Function" }, // source: fileButton.js:310
    { key: "setDisable", type: "Function" }, // source: fileButton.js:315
    { key: "setLoading", type: "Function" }, // source: fileButton.js:320
  ];

  beforeEach(() => {
    cy.apiLogin();
    cy.apiCreateApp(`${fake.companyName}-${Date.now()}-Filebutton-App`);
    cy.openApp();
    cy.dragAndDropWidget(fileButtonText.defaultWidgetText, 500, 100);
    waitForDropSettle(widget);
    closeQueryPanel();
  });

  afterEach(function () {
    if (this.currentTest.state === "passed") cy.apiDeleteApp();
  });

  it("should verify the initial exposed values and functions on inspector", () => {
    cy.get(commonWidgetSelector.sidebarinspector).click();
    cy.hideTooltip();
    openNode("components");
    openAndVerifyNode(widget, exposedValues, verifyNodeData);
    verifyNodes(functions, verifyNodeData);
  });
});
