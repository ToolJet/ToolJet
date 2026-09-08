import { fake } from "Fixtures/fake";
import { closeQueryPanel } from "Support/utils/appBuilder/querymanager/queryPanel";
import { waitForDropSettle } from "Support/utils/commonWidget";
import { commonWidgetSelector } from "Selectors/common";
import { filePickerText } from "Texts/appBuilder/components/filePicker";
import {
  openAndVerifyNode,
  openNode,
  verifyNodes,
  verifyNodeData,
} from "Support/utils/appBuilder/inspectorTree";

// Inspector facet — the widget's exposed contract at default.
// Covers all 8 config.exposedVariables — source: filepicker.js:360-369
//        all 5 config.actions handles as Functions — source: filepicker.js:14-42
//        plus the RUNTIME-ONLY keys the config never declares (FP-4), asserted so the
//        drift is recorded rather than discovered again.
// Config-derived, so a config change dropping or renaming either list fails here first.
describe(
  "File Picker inspector",
  { testIsolation: false, retries: { runMode: Number(Cypress.env("TJ_RETRIES") ?? 3), openMode: 0 } },
  () => {
    const widget = filePickerText.defaultWidgetName;

    // source: filepicker.js:360-369 (exposedVariables).
    // NOTE `file` is SINGULAR here where both siblings expose `files`.
    // MEASURED, and it does NOT match the config: the declared default is an array holding
    // one EMPTY descriptor (:361), but the runtime replaces it with the empty
    // legacySelectedFiles (useFilePicker.js:586) before the Inspector reads it, so a
    // freshly dropped widget reports [0]. The config literal is effectively unreachable —
    // asserting it gave "expected [1], was [0]".
    const exposedValues = [
      { key: "file", type: "Array", value: "[0]" }, // source: filepicker.js:361
      { key: "isParsing", type: "Boolean", value: "false" }, // source: filepicker.js:362
      { key: "isValid", type: "Boolean", value: "true" }, // source: filepicker.js:363
      { key: "fileSize", type: "Number", value: "0" }, // source: filepicker.js:364
      { key: "isMandatory", type: "Boolean", value: "false" }, // source: filepicker.js:365
      { key: "isLoading", type: "Boolean", value: "false" }, // source: filepicker.js:366
      { key: "isVisible", type: "Boolean", value: "true" }, // source: filepicker.js:367
      { key: "isDisabled", type: "Boolean", value: "false" }, // source: filepicker.js:368
    ];

    // source: filepicker.js:14-42 (actions[].handle)
    const functions = [
      { key: "clearFiles", type: "Function" }, // source: filepicker.js:16
      { key: "setFileName", type: "Function" }, // source: filepicker.js:20
      { key: "setVisibility", type: "Function" }, // source: filepicker.js:28
      { key: "setLoading", type: "Function" }, // source: filepicker.js:33
      { key: "setDisable", type: "Function" }, // source: filepicker.js:38
    ];

    beforeEach(() => {
      cy.apiLogin();
      cy.apiCreateApp(`${fake.companyName}-${Date.now()}-Filepicker-App`);
      cy.openApp();
      cy.dragAndDropWidget(filePickerText.defaultWidgetText, 500, 100);
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

    it("should expose files, uiErrorMessage and a clear alias that the config never declares", () => {
      // FP-4. useFilePicker exposes these alongside the declared set
      // (useFilePicker.js:581-594) but config.exposedVariables lists none of them:
      //   files            — the FORMATTED list, next to the legacy singular `file`
      //   uiErrorMessage   — the current rejection string
      //   clear            — an alias for clearFiles, so two names reach one function
      // A binding can use all three, and the Inspector shows them, but anything driven by
      // the config (docs, the properties panel, this suite's own coverage audit) does not
      // know they exist. Asserted here so the drift is a recorded fact.
      cy.get(commonWidgetSelector.sidebarinspector).click();
      cy.hideTooltip();
      openNode("components");
      openAndVerifyNode(widget, [], verifyNodeData);

      // verifyNodeData asserts have.text on `value` for everything except Functions, so a
      // value is required here — strings render quoted in the JSON viewer.
      verifyNodes(
        [
          { key: "files", type: "Array", value: "[0]" },
          { key: "uiErrorMessage", type: "String", value: '""' }, // useFilePicker.js:79 — initial ''
          { key: "clear", type: "Function" },
        ],
        verifyNodeData
      );
    });
  }
);
