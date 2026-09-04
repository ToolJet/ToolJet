import { fake } from "Fixtures/fake";
import { commonWidgetSelector } from "Selectors/common";
import { fileButtonSelector } from "Selectors/appBuilder/components/fileButton";
import { fileButtonText, fileButtonFixtures } from "Texts/appBuilder/components/fileButton";
import { openEditorSidebar, verifyAndModifyParameter } from "Support/utils/commonWidget";
import {
  dropWidget,
  commitChange,
  closeQueryPanel,
  clearSelectedFile,
  clearParameter,
} from "Support/utils/appBuilder/components/fileButton";

// Customer-issues facet — regression guards for defects found while automating this
// widget.
//
// ⚠ EVERY TEST ASSERTS THE **CORRECT** BEHAVIOUR, NOT TODAY'S, so all of them fail
// against the current build and are skipped until their fixes land. Asserting the buggy
// behaviour instead would pass now and break when the bug is fixed — defending the
// defect. Un-skip each one as its fix ships; it should go green immediately.
//
// TODO(issue links): tracker IDs not recorded yet — add the issue URL above each test.

describe(
  "File Button customer issues",
  { testIsolation: false, retries: { runMode: 3, openMode: 0 } },
  () => {
  const widget = fileButtonText.defaultWidgetName;
  const { validFile, csvFile, secondCsvFile, oversizeFile, oversizeFileBytes } = fileButtonFixtures;

  before(() => {
    cy.writeFile(oversizeFile, "x".repeat(oversizeFileBytes));
  });

  beforeEach(() => {
    cy.apiLogin();
    cy.apiCreateApp(`${fake.companyName}-${Date.now()}-Filebutton-App`);
    cy.openApp();
    dropWidget(fileButtonText.defaultWidgetText, widget, 500, 100);
    cy.waitForElement(fileButtonSelector.button(widget));
    closeQueryPanel();
  });

  afterEach(function () {
    if (this.currentTest.state === "passed") cy.apiDeleteApp();
  });

  // OPEN BUG — going over Max file count is silently absorbed. useFilePicker.js:347
  // slices the batch down to maxFileCount and returns: no rejection, no feedback, no
  // toast. The user picks 3 files, sees "2 files selected", and is never told anything
  // was dropped. Every other bound (minSize, maxSize, minFileCount, accepted-types)
  // surfaces a rejection — silent truncation is the odd one out.
  it.skip("should reject a selection that exceeds Max file count instead of silently truncating it", () => {
    openEditorSidebar(widget);
    cy.get(commonWidgetSelector.parameterTogglebutton("Enable multiple files")).click();
    cy.waitForAutoSave();
    verifyAndModifyParameter("Max file count", "{{2}}");
    commitChange();

    // Three files against a cap of two.
    cy.get(fileButtonSelector.inputField(widget)).selectFile([csvFile, secondCsvFile, validFile], { force: true });

    cy.get(fileButtonSelector.invalidFeedback(widget)).should("be.visible");
    // And nothing is quietly kept: the over-cap batch is refused whole.
    cy.get(fileButtonSelector.label(widget)).should("have.text", fileButtonText.defaultLabel);
  });

  // OPEN BUG — an empty/non-numeric Max size WEAKENS the cap instead of restoring it.
  // maxSize falls back to 51200000 (~51MB) for any non-number (useFilePicker.js:45),
  // but the field's declared default is 1048576 (1MB). Clearing the field silently
  // raises the limit ~50x, so a builder who types a value then deletes it ends up more
  // permissive than one who never touched it.
  it.skip("should fall back to the declared 1MB Max size default when the field is cleared", () => {
    openEditorSidebar(widget);
    verifyAndModifyParameter("Max size (bytes)", "{{5000}}");
    commitChange();
    openEditorSidebar(widget);
    clearParameter("Max size (bytes)");
    commitChange();

    // 1.2MB — over the declared 1048576 default, far under the 51200000 fallback.
    cy.get(fileButtonSelector.inputField(widget)).selectFile(oversizeFile, { force: true });
    cy.get(fileButtonSelector.invalidFeedback(widget)).should("be.visible");
  });

  // OPEN BUG — a non-numeric Max file count silently DISCARDS the whole selection.
  // Neither accepted nor reported as rejected: the label stays default and no feedback
  // appears, so it looks like a no-op. Asserted below: a bad bound should be ignored so
  // a valid selection still lands. (A rejection would do too — silence is the problem.)
  it.skip("should still accept a valid selection when Max file count holds a non-numeric value", () => {
    openEditorSidebar(widget);
    cy.get(commonWidgetSelector.parameterTogglebutton("Enable multiple files")).click();
    cy.waitForAutoSave();
    verifyAndModifyParameter("Max file count", '{{"not a number"}}');
    commitChange();

    clearSelectedFile();
    cy.get(fileButtonSelector.inputField(widget)).selectFile([csvFile, secondCsvFile], { force: true });
    cy.get(fileButtonSelector.label(widget)).should("have.text", fileButtonText.multiFileLabel(2));
  });
});
