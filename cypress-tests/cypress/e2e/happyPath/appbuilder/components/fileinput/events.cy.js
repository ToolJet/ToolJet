import { fake } from "Fixtures/fake";
import { commonSelectors } from "Selectors/common";
import { fileInputSelector } from "Selectors/appBuilder/components/fileInput";
import { fileInputText, fileInputFixtures } from "Texts/appBuilder/components/fileInput";
import { addEventWithAlert, addMultiEventsWithAlert } from "Support/utils/appBuilder/events";
import { openEditorSidebar, waitForDropSettle } from "Support/utils/commonWidget";
import { attachFile } from "Support/utils/appBuilder/components/fileInput";

// Events facet — both config.events, each asserted in the editor AND in preview.
//   onFileSelected:230 — fires on an accepted file
//   onFileLoaded:231   — fires on an accepted file, and NOT on a rejected one
// source: fileinput.js
//
// The rejection trigger here is an UNDERSIZED file, not an oversized one. File Input's
// maxSize ships at 51200000 (fileinput.js:528), so tripping the upper bound would mean
// generating a >51MB file; its minSize ships at 50 bytes (fileinput.js:527), which the
// committed 27-byte sample.mp3 is already under. Same rejection path, no generated binary.
//
// Note the display names are TITLE case here ("On File Selected") where File Button's are
// sentence case ("On file selected") — the two configs disagree, so the strings below are
// taken from this widget's config rather than copied from the sibling spec.
describe(
  "File Input events",
  { testIsolation: false, retries: { runMode: 3, openMode: 0 } },
  () => {
    const widget = fileInputText.defaultWidgetName;
    const { validFile, validFileName, tinyAudioFile } = fileInputFixtures;
    const selectedMsg = "File selected event";
    const loadedMsg = "File loaded event";

    const events = [
      { event: "On File Selected", message: selectedMsg },
      { event: "On File Loaded", message: loadedMsg },
    ];

    const expectToast = (message) => {
      cy.verifyToastMessage(commonSelectors.toastMessage, message, false);
    };

    beforeEach(() => {
      cy.apiLogin();
      cy.apiCreateApp(`${fake.companyName}-${Date.now()}-Fileinput-App`);
      cy.openApp();
      cy.dragAndDropWidget(fileInputText.defaultWidgetText, 500, 100);
      waitForDropSettle(widget);
      openEditorSidebar(widget);
    });

    afterEach(function () {
      if (this.currentTest.state === "passed") cy.apiDeleteApp();
    });

    it("should fire onFileSelected when a file is accepted", () => {
      addEventWithAlert("On File Selected", selectedMsg); // source: fileinput.js:230
      attachFile(validFile);
      expectToast(selectedMsg);

      // Preview is a separate render path — the canvas overlays can mask handler wiring,
      // so an editor-only assertion would not prove the event reaches a real user.
      cy.openPreview(fileInputSelector.field(widget));
      attachFile(validFile);
      expectToast(selectedMsg);
    });

    it("should fire onFileLoaded when a file is accepted", () => {
      addEventWithAlert("On File Loaded", loadedMsg); // source: fileinput.js:231
      attachFile(validFile);
      expectToast(loadedMsg);
      cy.get(fileInputSelector.summary(widget)).should("have.text", validFileName);

      cy.openPreview(fileInputSelector.field(widget));
      attachFile(validFile);
      expectToast(loadedMsg);
      cy.get(fileInputSelector.summary(widget)).should("have.text", validFileName);
    });

    it("should not fire onFileLoaded when the file is rejected", () => {
      addEventWithAlert("On File Loaded", loadedMsg);
      attachFile(tinyAudioFile); // 27 bytes, under the 50-byte minSize floor

      // The file genuinely did not load: the summary never leaves the placeholder.
      cy.get(fileInputSelector.summary(widget)).should("have.text", fileInputText.defaultPlaceholder);
      cy.get(commonSelectors.toastMessage).should("not.contain.text", loadedMsg);

      cy.openPreview(fileInputSelector.field(widget));
      attachFile(tinyAudioFile);
      cy.get(commonSelectors.toastMessage).should("not.contain.text", loadedMsg);
    });

    it("should not fire either event before any file is selected", () => {
      addMultiEventsWithAlert(events);
      cy.waitForElement(fileInputSelector.field(widget));
      cy.get(commonSelectors.toastMessage).should("not.exist");

      cy.openPreview(fileInputSelector.field(widget));
      cy.waitForElement(fileInputSelector.field(widget));
      cy.get(commonSelectors.toastMessage).should("not.exist");
    });
  }
);
