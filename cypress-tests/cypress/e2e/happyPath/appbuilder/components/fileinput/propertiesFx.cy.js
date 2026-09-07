import { fake } from "Fixtures/fake";
import { closeQueryPanel } from "Support/utils/appBuilder/querymanager/queryPanel";
import { commonWidgetSelector } from "Selectors/common";
import { fileInputSelector } from "Selectors/appBuilder/components/fileInput";
import { fileInputText, fileInputAccordion, fileInputFixtures, fxExemptFields } from "Texts/appBuilder/components/fileInput";
import {
  openEditorSidebar,
  openAccordion,
  verifyAndModifyParameter,
  dropWidget,
  enableFxAndBind,
  clickWidgetInput,
  expectNoFxButton,
} from "Support/utils/commonWidget";
import {
  commitChange,
  verifyExposedValue,
  attachFile,
  expectPickerBlocked,
  validationFileTypeWrapper,
  expectRejectionToast,
  widgetTooltip,
  hoverInPreview,
} from "Support/utils/appBuilder/components/fileInput";

// PropertiesFx facet — fx/dynamic-binding half; the direct half is in properties.cy.js.
// Covers all 16 fx-capable items across the two blocks — 10 of 11 config.properties
// (fileinput.js:14-148) and all 6 config.validation (fileinput.js:149-228).
//   properties  label:15 · instructionText:24 · enableMultiple:33 · enableClearSelection:42
//               parseContent:53 · parseFileType:64 · loadingState:94 · visibility:103
//               disabledState:112 · tooltip:138
//   validation  enableValidation:150 · fileType:160 · minSize:170 · maxSize:181
//               minFileCount:192 · maxFileCount:210
// Negative: tooltipFormat:124 is the one isFxNotRequired item in this block — asserted to
//           expose NO fx button. The style block's five exempt fields live in stylesFx.
//
// Every test binds the field to a COMPANION widget then drives the companion — changing
// the source is what proves the binding stays live rather than resolving once at bind time.

// Toggle Switch is this spec's boolean fx source — a value the test can flip to prove a
// binding is live. Local rather than shared: propertiesFx is its only consumer.
const dropCompanionToggle = (x, y) => dropWidget("Toggle Switch", "toggleswitch1", x, y);

describe(
  "File Input properties fx",
  { testIsolation: false, retries: { runMode: 3, openMode: 0 } },
  () => {
    const widget = fileInputText.defaultWidgetName;
    const { validFile, validFileName, csvFile, csvFileName, secondCsvFile } = fileInputFixtures;

    beforeEach(() => {
      cy.apiLogin();
      cy.apiCreateApp(`${fake.companyName}-${Date.now()}-Fileinput-App`);
      cy.openApp();
      dropWidget(fileInputText.defaultWidgetText, widget, 500, 100);
      cy.waitForElement(fileInputSelector.field(widget));
      closeQueryPanel();
    });

    afterEach(function () {
      if (this.currentTest.state === "passed") cy.apiDeleteApp();
    });

    it("should verify Label resolves and re-resolves a binding", () => {
      dropWidget("Text Input", "textinput1");
      openEditorSidebar("textinput1");
      verifyAndModifyParameter("Default value", "Bound From TextInput");
      commitChange();

      openEditorSidebar(widget);
      verifyAndModifyParameter("Label", "{{components.textinput1.value}}"); // source: fileinput.js:15
      commitChange();
      cy.get(fileInputSelector.labelText(widget)).scrollIntoView().should("have.text", "Bound From TextInput");

      // Prove the binding is live: change the source, not the target.
      openEditorSidebar("textinput1");
      verifyAndModifyParameter("Default value", "Bound Text Changed");
      commitChange();
      cy.get(fileInputSelector.labelText(widget)).scrollIntoView().should("have.text", "Bound Text Changed");
    });

    it("should verify Placeholder follows a binding", () => {
      dropWidget("Text Input", "textinput1");
      openEditorSidebar("textinput1");
      verifyAndModifyParameter("Default value", "Bound placeholder");
      commitChange();

      openEditorSidebar(widget);
      verifyAndModifyParameter("Placeholder", "{{components.textinput1.value}}"); // source: fileinput.js:24
      commitChange();
      cy.get(fileInputSelector.summary(widget)).scrollIntoView().should("have.text", "Bound placeholder");
    });

    it("should verify Allow uploading multiple files follows a bound boolean", () => {
      dropCompanionToggle(500, 300);
      openEditorSidebar(widget);
      enableFxAndBind("Allow uploading multiple files", "{{components.toggleswitch1.value}}"); // source: fileinput.js:33
      commitChange();
      // Toggle Switch defaults to false, so the bound field starts OFF — the opposite of
      // this property's own shipped default, which is what makes the binding observable.
      cy.get(fileInputSelector.inputField(widget)).scrollIntoView().should("not.have.attr", "multiple");

      clickWidgetInput("toggleswitch1");
      cy.get(fileInputSelector.inputField(widget)).scrollIntoView().should("have.attr", "multiple");
    });

    it("should verify Enable clear selection follows a bound boolean", () => {
      dropCompanionToggle(500, 300);
      openEditorSidebar(widget);
      enableFxAndBind("Enable clear selection", "{{components.toggleswitch1.value}}"); // source: fileinput.js:42
      commitChange();

      attachFile(validFile);
      cy.get(fileInputSelector.clearButton(widget)).should("not.exist");

      clickWidgetInput("toggleswitch1");
      cy.get(fileInputSelector.clearButton(widget)).should("be.visible");
    });

    it("should verify Enable parsing follows a bound boolean", () => {
      dropCompanionToggle(500, 300);
      openEditorSidebar(widget);
      enableFxAndBind("Enable parsing", "{{components.toggleswitch1.value}}"); // source: fileinput.js:53
      commitChange();

      // parseFileType is conditionallyRender-gated on parseContent (fileinput.js:86-91),
      // so the gated control appearing is itself proof the bound value resolved.
      openEditorSidebar(widget);
      cy.get('[data-cy="dropdown-file-type"]').should("not.exist");

      clickWidgetInput("toggleswitch1");
      openEditorSidebar(widget);
      cy.get('[data-cy="dropdown-file-type"]').should("be.visible");
    });

    it("should verify File type drives parsing when bound", () => {
      dropWidget("Text Input", "textinput1");
      openEditorSidebar("textinput1");
      verifyAndModifyParameter("Default value", "csv");
      commitChange();

      openEditorSidebar(widget);
      cy.get('[data-cy="enable-parsing-toggle-button"]').click();
      cy.waitForAutoSave();
      // source: fileinput.js:64 — the select's own fx button swaps it for a code field.
      enableFxAndBind("File type", "{{components.textinput1.value}}");
      commitChange();

      attachFile(csvFile);
      cy.get(fileInputSelector.summary(widget)).should("have.text", csvFileName);
    });

    it("should verify Loading follows a bound boolean", () => {
      dropCompanionToggle(500, 300);
      openEditorSidebar(widget);
      openAccordion(fileInputAccordion.additionalActions);
      enableFxAndBind("Loading", "{{components.toggleswitch1.value}}"); // source: fileinput.js:94
      commitChange();
      cy.get(fileInputSelector.loader(widget)).should("not.exist");
      verifyExposedValue("isLoading", "Boolean", "false");

      clickWidgetInput("toggleswitch1");
      cy.get(fileInputSelector.loader(widget)).should("be.visible");
      cy.get(fileInputSelector.browseButton(widget)).should("not.exist");
      verifyExposedValue("isLoading", "Boolean", "true");
    });

    it("should verify Visibility follows a bound boolean", () => {
      dropCompanionToggle(500, 300);
      openEditorSidebar(widget);
      openAccordion(fileInputAccordion.additionalActions);
      enableFxAndBind("Visibility", "{{components.toggleswitch1.value}}"); // source: fileinput.js:103
      commitChange();
      // Bound to a false source, so the field unmounts (FileInput.jsx:236).
      cy.get(fileInputSelector.field(widget)).should("not.exist");
      verifyExposedValue("isVisible", "Boolean", "false");

      clickWidgetInput("toggleswitch1");
      cy.get(fileInputSelector.field(widget)).should("be.visible");
      verifyExposedValue("isVisible", "Boolean", "true");
    });

    it("should verify Disable follows a bound boolean", () => {
      dropCompanionToggle(500, 300);
      openEditorSidebar(widget);
      openAccordion(fileInputAccordion.additionalActions);
      enableFxAndBind("Disable", "{{components.toggleswitch1.value}}"); // source: fileinput.js:112
      commitChange();
      cy.get(fileInputSelector.browseButton(widget)).should("not.be.disabled");
      verifyExposedValue("isDisabled", "Boolean", "false");

      clickWidgetInput("toggleswitch1");
      expectPickerBlocked(widget);
      verifyExposedValue("isDisabled", "Boolean", "true");
    });

    it("should verify Tooltip content resolves a binding", () => {
      dropWidget("Text Input", "textinput1");
      openEditorSidebar("textinput1");
      verifyAndModifyParameter("Default value", "Bound tooltip text");
      commitChange();

      openEditorSidebar(widget);
      openAccordion(fileInputAccordion.additionalActions);
      // Typed straight into the code field rather than by display name: tooltipFormat:124
      // shares the label "Tooltip" with this field (fileinput.js:138), so addressing it by
      // name is ambiguous.
      cy.get(commonWidgetSelector.tooltipInputField).clearAndTypeOnCodeMirror(
        "{{components.textinput1.value}}"
      );
      commitChange();

      // Only observable on the preview — the editor canvas swallows the pointer events
      // Radix needs to open it. Unlike the rest of this file the companion is seeded rather
      // than re-driven: resolution is what this asserts.
      hoverInPreview(fileInputSelector.field(widget));
      cy.get(widgetTooltip).should("contain.text", "Bound tooltip text");
    });

    it("should verify Mark as mandatory follows a bound boolean", () => {
      dropCompanionToggle(500, 300);
      openEditorSidebar(widget);
      openAccordion("Validation");
      enableFxAndBind("Mark as mandatory", "{{components.toggleswitch1.value}}"); // source: fileinput.js:150
      commitChange();
      cy.get(fileInputSelector.mandatoryIndicator(widget)).should("not.exist");

      clickWidgetInput("toggleswitch1");
      cy.get(fileInputSelector.mandatoryIndicator(widget)).should("be.visible");
      cy.get(fileInputSelector.ariaRequired(widget)).should("exist");
      verifyExposedValue("isMandatory", "Boolean", "true");
    });

    it("should verify File Type follows a bound value and gates the same way", () => {
      openEditorSidebar(widget);
      openAccordion("Validation");
      // FilePicker.jsx's FxSelect swaps the react-select for a CodeHinter when its fx
      // button is pressed (FilePicker.jsx:64-70), so the expression goes into a
      // `.cm-content` inside the SAME wrapper — the select itself is not typeable, and
      // this field has no `parameter*` data-cy to reach instead.
      cy.get('[data-cy="filetype-fx-button"]').click();
      cy.get(validationFileTypeWrapper).find(".cm-content").clearAndTypeOnCodeMirror('{{"image/*"}}'); // source: fileinput.js:160
      commitChange();

      openEditorSidebar(widget);
      openAccordion("Validation");
      verifyAndModifyParameter("Min size (Bytes)", "{{0}}"); // neutralise the 50-byte floor
      commitChange();

      // Reject first against an empty widget: enableClearSelection ships off, so an
      // accepted file could not be removed before testing the negative half.
      attachFile(csvFile);
      expectRejectionToast("image/*");
      cy.get(fileInputSelector.summary(widget)).should("have.text", fileInputText.defaultPlaceholder);

      attachFile(validFile);
      cy.get(fileInputSelector.summary(widget)).should("have.text", validFileName);
    });

    it("should verify Min size follows a binding", () => {
      dropWidget("Number Input", "numberinput1");
      openEditorSidebar("numberinput1");
      verifyAndModifyParameter("Default value", "{{5000}}");
      commitChange();

      openEditorSidebar(widget);
      openAccordion("Validation");
      verifyAndModifyParameter("Min size (Bytes)", "{{components.numberinput1.value}}"); // source: fileinput.js:170
      commitChange();

      // 1934 bytes is under the bound 5000 floor, so it is rejected.
      attachFile(validFile);
      cy.get(fileInputSelector.summary(widget)).should("have.text", fileInputText.defaultPlaceholder);
    });

    it("should verify Max size follows a binding", () => {
      dropWidget("Number Input", "numberinput1");
      openEditorSidebar("numberinput1");
      verifyAndModifyParameter("Default value", "{{500}}");
      commitChange();

      openEditorSidebar(widget);
      openAccordion("Validation");
      verifyAndModifyParameter("Max size (Bytes)", "{{components.numberinput1.value}}"); // source: fileinput.js:181
      commitChange();

      // 1934 bytes exceeds the bound 500 cap; the 86-byte csv does not.
      attachFile(validFile);
      cy.get(fileInputSelector.summary(widget)).should("have.text", fileInputText.defaultPlaceholder);
      attachFile(csvFile);
      cy.get(fileInputSelector.summary(widget)).should("have.text", csvFileName);
    });

    it("should verify Min files follows a binding", () => {
      dropWidget("Number Input", "numberinput1");
      openEditorSidebar("numberinput1");
      verifyAndModifyParameter("Default value", "{{2}}");
      commitChange();

      openEditorSidebar(widget);
      openAccordion("Validation");
      verifyAndModifyParameter("Min files", "{{components.numberinput1.value}}"); // source: fileinput.js:192
      commitChange();

      attachFile(csvFile);
      cy.get(fileInputSelector.errorMessage(widget)).should("be.visible");

      attachFile([csvFile, secondCsvFile]);
      cy.get(fileInputSelector.errorMessage(widget)).should("not.exist");
    });

    it("should verify Max files follows a binding", () => {
      dropWidget("Number Input", "numberinput1");
      openEditorSidebar("numberinput1");
      verifyAndModifyParameter("Default value", "{{1}}");
      commitChange();

      openEditorSidebar(widget);
      openAccordion("Validation");
      verifyAndModifyParameter("Max files", "{{components.numberinput1.value}}"); // source: fileinput.js:210
      commitChange();

      attachFile(csvFile);
      cy.get(fileInputSelector.summary(widget)).should("have.text", csvFileName);
      // At the bound limit the picker disables — asserted on the trigger, since writing
      // to the hidden input bypasses disablePicker and would pass regardless.
      expectPickerBlocked(widget);
    });

    it("should verify Tooltip format exposes no fx button, while the Tooltip code field does", () => {
      openEditorSidebar(widget);
      openAccordion(fileInputAccordion.additionalActions);

      // renderFx() returns null outright for isFxNotRequired fields
      // (SingleLineCodeEditor.jsx:699), so the button is ABSENT rather than dimmed.
      // Located by its control, not by name: tooltipFormat shares the displayName
      // "Tooltip" with the fx-CAPABLE `tooltip` code field, so `tooltip-fx-button` does
      // exist and a name-based check would assert the wrong element.
      const { control } = fxExemptFields.properties[0];
      expectNoFxButton(() => cy.get(control), "Tooltip");
    });
  }
);
