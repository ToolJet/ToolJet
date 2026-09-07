import { fake } from "Fixtures/fake";
import { closeQueryPanel } from "Support/utils/appBuilder/querymanager/queryPanel";
import { commonWidgetSelector } from "Selectors/common";
import { fileInputSelector } from "Selectors/appBuilder/components/fileInput";
import {
  fileInputText,
  fileInputAccordion,
  fileInputFixtures,
  acceptedTypeCases,
} from "Texts/appBuilder/components/fileInput";
import {
  openEditorSidebar,
  openAccordion,
  verifyAndModifyParameter,
  clearParameter,
  waitForDropSettle,
} from "Support/utils/commonWidget";
import {
  commitChange,
  verifyExposedValue,
  attachFile,
  expectPickerBlocked,
  selectParseFileType,
  selectValidationFileType,
  expectRejectionToast,
  openParsedValue,
  closeParsedValue,
  widgetTooltip,
  hoverInPreview,
} from "Support/utils/appBuilder/components/fileInput";

// Properties facet — every field in config.properties AND config.validation, which are
// two SEPARATE top-level blocks (fileinput.js:14 and :149). Enumerating properties alone
// silently drops six validators.
// Covers: 11 config.properties — label:15 · instructionText:24 · enableMultiple:33 ·
//         enableClearSelection:42 · parseContent:53 · parseFileType:64 · loadingState:94 ·
//         visibility:103 · disabledState:112 · tooltipFormat:124 · tooltip:138
//         6 config.validation — enableValidation:150 · fileType:160 · minSize:170 ·
//         maxSize:181 · minFileCount:192 · maxFileCount:210      — source: fileinput.js
// Not here: config.others (showOnDesktop/showOnMobile) → contexts.cy.js, which owns the
//           device-layout surface; covering it in both facets buys no coverage.
//           fx binding of these same fields → propertiesFx.cy.js
describe(
  "File Input properties",
  { testIsolation: false, retries: { runMode: 3, openMode: 0 } },
  () => {
    const widget = fileInputText.defaultWidgetName;
    const { validFile, validFileName, csvFile, csvFileName, secondCsvFile, tinyAudioFile } = fileInputFixtures;

    beforeEach(() => {
      cy.apiLogin();
      cy.apiCreateApp(`${fake.companyName}-${Date.now()}-Fileinput-App`);
      cy.openApp();
      cy.dragAndDropWidget(fileInputText.defaultWidgetText, 500, 100);
      waitForDropSettle(widget);
      closeQueryPanel();
    });

    afterEach(function () {
      if (this.currentTest.state === "passed") cy.apiDeleteApp();
    });

    it("should verify Label and Placeholder: direct change", () => {
      const label = fake.companyName;
      openEditorSidebar(widget);
      verifyAndModifyParameter("Label", label); // source: fileinput.js:15
      commitChange();
      cy.get(fileInputSelector.labelText(widget)).should("have.text", label);

      openEditorSidebar(widget);
      verifyAndModifyParameter("Placeholder", "Pick a document"); // source: fileinput.js:24
      commitChange();
      // The placeholder occupies the summary slot only while no file is held —
      // FileInput.jsx:229-234 swaps it for the filename the moment one is.
      cy.get(fileInputSelector.summary(widget)).should("have.text", "Pick a document");
    });

    it("should verify Allow uploading multiple files: direct toggle drops the multiple attribute", () => {
      // Ships ON (fileinput.js:493), so the attribute is present before the toggle.
      cy.get(fileInputSelector.inputField(widget)).should("have.attr", "multiple");

      openEditorSidebar(widget);
      cy.get(commonWidgetSelector.parameterTogglebutton("Allow uploading multiple files")).click();
      cy.waitForAutoSave();

      cy.get(fileInputSelector.inputField(widget)).should("not.have.attr", "multiple");
    });

    it("should verify Enable clear selection: direct toggle reveals a working clear button", () => {
      // Ships OFF (fileinput.js:495) — File Input is the only one of the three file
      // widgets that does, so a held file cannot be removed out of the box.
      attachFile(validFile);
      cy.get(fileInputSelector.summary(widget)).should("have.text", validFileName);
      cy.get(fileInputSelector.clearButton(widget)).should("not.exist");

      openEditorSidebar(widget);
      cy.get(commonWidgetSelector.parameterTogglebutton("Enable clear selection")).click();
      cy.waitForAutoSave();

      cy.get(fileInputSelector.clearButton(widget)).should("be.visible").click();
      // Clearing returns the summary to the placeholder, proving the button acted rather
      // than merely existing.
      cy.get(fileInputSelector.summary(widget)).should("have.text", fileInputText.defaultPlaceholder);
    });

    it("should verify Enable parsing: direct toggle reveals File type and parses content", () => {
      openEditorSidebar(widget);
      cy.get(commonWidgetSelector.parameterTogglebutton("Enable parsing")).click(); // source: fileinput.js:53
      cy.waitForAutoSave();

      // parseFileType renders only once parsing is on (fileinput.js:86-91).
      cy.get('[data-cy="dropdown-file-type"]').should("be.visible");
      selectParseFileType("CSV"); // source: fileinput.js:69

      attachFile(csvFile);
      cy.get(fileInputSelector.summary(widget)).should("have.text", csvFileName);

      // The parsed rows are the actual effect — the toggle alone proves nothing.
      openParsedValue(widget);
      cy.get('[data-cy="inspector-parsedvalue-label"]').should("exist");
      closeParsedValue();
    });

    it("should verify Mark as mandatory: direct toggle", () => {
      cy.get(fileInputSelector.mandatoryIndicator(widget)).should("not.exist");

      openEditorSidebar(widget);
      openAccordion("Validation");
      cy.get(commonWidgetSelector.parameterTogglebutton("Mark as mandatory")).click(); // source: fileinput.js:150
      cy.waitForAutoSave();

      // Two independent surfaces: the visible `*` and the input's aria-required.
      cy.get(fileInputSelector.mandatoryIndicator(widget)).should("be.visible").and("have.text", "*");
      cy.get(fileInputSelector.ariaRequired(widget)).should("exist");
      verifyExposedValue("isMandatory", "Boolean", "true");
    });

    acceptedTypeCases.forEach(({ label, value, accept, acceptName, reject }) => {
      it(`should verify File Type: accepts its own kind and rejects others — ${label}`, () => {
        openEditorSidebar(widget);
        openAccordion("Validation");
        // minSize ships at 50 bytes (fileinput.js:527) and two fixtures in this matrix
        // are smaller than that. Zero it first, or those rows would be rejected on SIZE
        // and the type rule would go untested.
        verifyAndModifyParameter("Min size (Bytes)", "{{0}}");
        commitChange();

        openEditorSidebar(widget);
        openAccordion("Validation");
        selectValidationFileType(label); // source: fileinput.js:160

        // REJECT FIRST, against an empty widget. Order matters: enableClearSelection
        // ships off so a held file cannot be removed, and with enableMultiple on a second
        // selection ADDS rather than replaces — so accepting first would leave the
        // accepted filename in the summary no matter what the reject did, making the
        // negative half unfalsifiable.
        attachFile(reject);
        expectRejectionToast(value);
        cy.get(fileInputSelector.summary(widget)).should("have.text", fileInputText.defaultPlaceholder);

        // Then the positive half. The PAIR is the point: either assertion alone would
        // also pass on a field that blocked everything, or nothing.
        attachFile(accept);
        cy.get(fileInputSelector.summary(widget)).should("have.text", acceptName);
      });
    });

    it("should verify Min size: below the floor is rejected, above it is accepted", () => {
      openEditorSidebar(widget);
      openAccordion("Validation");
      // Default is 50 bytes; sample.mp3 is 27 and tooljet.png is 1934, so the shipped
      // default already straddles the two fixtures — no edit needed to prove the rule.
      attachFile(tinyAudioFile); // source: fileinput.js:170
      cy.get(fileInputSelector.summary(widget)).should("have.text", fileInputText.defaultPlaceholder);

      attachFile(validFile);
      cy.get(fileInputSelector.summary(widget)).should("have.text", validFileName);
    });

    it("should verify Max size: above the cap is rejected, under it is accepted", () => {
      openEditorSidebar(widget);
      openAccordion("Validation");
      // Ships at 51200000 (fileinput.js:528), far above any sane fixture — so the cap is
      // lowered under the 1934-byte image rather than generating a 51MB file.
      verifyAndModifyParameter("Max size (Bytes)", "{{500}}");
      commitChange();

      attachFile(validFile);
      cy.get(fileInputSelector.summary(widget)).should("have.text", fileInputText.defaultPlaceholder);

      // Control: a file under the new cap still lands, so the cap rejects by size rather
      // than blocking everything.
      attachFile(csvFile);
      cy.get(fileInputSelector.summary(widget)).should("have.text", csvFileName);
    });

    it("should verify Min size: clearing the field lifts the restriction", () => {
      openEditorSidebar(widget);
      openAccordion("Validation");
      verifyAndModifyParameter("Min size (Bytes)", "{{5000}}");
      commitChange();

      // 1934 bytes is under the 5000 floor, so the cap is provably live first.
      attachFile(validFile);
      cy.get(fileInputSelector.summary(widget)).should("have.text", fileInputText.defaultPlaceholder);

      openEditorSidebar(widget);
      openAccordion("Validation");
      clearParameter("Min size (Bytes)");
      commitChange();

      // Asserts only that the restriction LIFTS. The fallback is 0, not the declared 50
      // (fileinput.js:527) — that is FI-4, asserted in customerIssues; pinning 50 here
      // would fail for the bug instead of covering the property.
      attachFile(validFile);
      cy.get(fileInputSelector.summary(widget)).should("have.text", validFileName);
    });

    it("should verify Max files: the picker is blocked once the limit is reached", () => {
      openEditorSidebar(widget);
      openAccordion("Validation");
      // Both count fields are gated on enableMultiple (fileinput.js:220-226), which ships
      // ON, so they are reachable without touching the properties block.
      verifyAndModifyParameter("Max files", "{{1}}"); // source: fileinput.js:210
      commitChange();

      attachFile(csvFile);
      cy.get(fileInputSelector.summary(widget)).should("have.text", csvFileName);

      // At the limit useFilePicker sets disablePicker, which disables the Browse button.
      // Asserted on the trigger, not the hidden input — writing to the input bypasses
      // disablePicker entirely and would report a false pass.
      expectPickerBlocked(widget);
    });

    it("should verify Min files: below the floor surfaces an error, reaching it clears", () => {
      openEditorSidebar(widget);
      openAccordion("Validation");
      verifyAndModifyParameter("Min files", "{{2}}"); // source: fileinput.js:192
      commitChange();

      // One file is below the floor, so the widget surfaces its error text.
      attachFile(csvFile);
      cy.get(fileInputSelector.errorMessage(widget)).should("be.visible");
      cy.get(fileInputSelector.fieldError(widget)).should("exist");

      // Reaching the floor clears it — the second half is what proves the rule is a
      // threshold and not a permanent error.
      attachFile([csvFile, secondCsvFile]);
      cy.get(fileInputSelector.errorMessage(widget)).should("not.exist");
    });

    it("should verify Loading: direct toggle swaps the trigger for the loader", () => {
      openEditorSidebar(widget);
      openAccordion(fileInputAccordion.additionalActions);
      cy.get(commonWidgetSelector.parameterTogglebutton("Loading")).click(); // source: fileinput.js:94
      cy.waitForAutoSave();

      // Loader and Browse are the two branches of one ternary (FileInput.jsx:287-318), so
      // asserting both proves the swap rather than a mere addition.
      cy.get(fileInputSelector.loader(widget)).should("be.visible");
      cy.get(fileInputSelector.browseButton(widget)).should("not.exist");
      cy.get(fileInputSelector.ariaBusy(widget)).should("exist");
      verifyExposedValue("isLoading", "Boolean", "true");
    });

    it("should verify Visibility: direct toggle unmounts the field", () => {
      openEditorSidebar(widget);
      openAccordion(fileInputAccordion.additionalActions);
      cy.get(commonWidgetSelector.parameterTogglebutton("Visibility")).click(); // source: fileinput.js:103
      cy.waitForAutoSave();

      // FileInput.jsx:236 returns null outright, so the field is GONE rather than
      // collapsed to zero size — a distinction that matters, because a size-based
      // assertion would pass either way.
      cy.get(fileInputSelector.field(widget)).should("not.exist");
      // The Inspector tree survives the unmount, so the exposed value is still readable.
      verifyExposedValue("isVisible", "Boolean", "false");
    });

    it("should verify Disable: direct toggle", () => {
      openEditorSidebar(widget);
      openAccordion(fileInputAccordion.additionalActions);
      cy.get(commonWidgetSelector.parameterTogglebutton("Disable")).click(); // source: fileinput.js:112
      cy.waitForAutoSave();

      expectPickerBlocked(widget);
      cy.get(fileInputSelector.ariaDisabled(widget)).should("exist");
      verifyExposedValue("isDisabled", "Boolean", "true");
    });

    it("should verify Tooltip: content renders on hover in preview", () => {
      openEditorSidebar(widget);
      openAccordion(fileInputAccordion.additionalActions);
      verifyAndModifyParameter("Tooltip", "Attach a document"); // source: fileinput.js:138
      commitChange();

      // A tooltip only opens in PREVIEW — on the canvas the drag overlays swallow the
      // pointer events Radix needs, so an editor-side check would silently prove nothing.
      hoverInPreview(fileInputSelector.field(widget));
      cy.get(widgetTooltip).first().should("contain.text", "Attach a document");
    });

    it("should verify Tooltip format: all three options select", () => {
      openEditorSidebar(widget);
      openAccordion(fileInputAccordion.additionalActions);

      // data-cy comes from the option VALUE, which is camelCase (`plainText`), not the
      // kebab-cased display name. source: fileinput.js:127-131
      cy.get('[data-cy="togglr-button-plainText"]').closest('[role="radio"]').should("have.attr", "aria-checked", "true");

      cy.get('[data-cy="togglr-button-markdown"]').click();
      cy.waitForAutoSave();
      cy.get('[data-cy="togglr-button-markdown"]').closest('[role="radio"]').should("have.attr", "aria-checked", "true");

      cy.get('[data-cy="togglr-button-html"]').click();
      cy.waitForAutoSave();
      cy.get('[data-cy="togglr-button-html"]').closest('[role="radio"]').should("have.attr", "aria-checked", "true");
    });
  }
);
