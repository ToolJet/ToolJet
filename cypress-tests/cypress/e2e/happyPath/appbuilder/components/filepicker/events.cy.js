import { fake } from "Fixtures/fake";
import { closeQueryPanel } from "Support/utils/appBuilder/querymanager/queryPanel";
import { commonSelectors } from "Selectors/common";
import { filePickerSelector } from "Selectors/appBuilder/components/filePicker";
import { filePickerText, filePickerFixtures } from "Texts/appBuilder/components/filePicker";
import { addEventWithAlert, addMultiEventsWithAlert } from "Support/utils/appBuilder/events";
import { openEditorSidebar, waitForDropSettle } from "Support/utils/commonWidget";
import {
  attachFile,
  attachGeneratedFile,
  deleteFileFromList,
  expectFileInList,
} from "Support/utils/appBuilder/components/filePicker";

// Events facet — all three config.events, each asserted in the editor AND in preview.
//   onFileSelected:212   — fires at the TOP of onDrop, before any processing
//                          (useFilePicker.js:296), so it fires for a REJECTED file too
//   onFileLoaded:213     — gated on successfullyProcessedFiles.length > 0 (:368), so it
//                          does NOT fire for a rejected file
//   onFileDeselected:214 — fires from the per-file remove path only (:459)
// source: filepicker.js
//
// This widget has one event its siblings do not — onFileDeselected — and the only user
// path to it is the per-file trash button in the file list.
//
// The rejection trigger here is an UNDERSIZED generated file rather than an oversized
// one: maxSize ships at 51200000 (~48.8MB, filepicker.js:407), so tripping the upper
// bound would mean a 49MB buffer, while minSize ships at 50 bytes (:406) and a 10-byte
// buffer is under it. Same rejection path, no large allocation.
describe(
  "File Picker events",
  { testIsolation: false, retries: { runMode: Number(Cypress.env("TJ_RETRIES") ?? 3), openMode: 0 } },
  () => {
    const widget = filePickerText.defaultWidgetName;
    const { validFile, validFileName } = filePickerFixtures;
    const selectedMsg = "File selected event";
    const loadedMsg = "File loaded event";
    const deselectedMsg = "File deselected event";

    const events = [
      { event: "On File Selected", message: selectedMsg },
      { event: "On File Loaded", message: loadedMsg },
      { event: "On File Deselected", message: deselectedMsg },
    ];

    const expectToast = (message) => {
      cy.verifyToastMessage(commonSelectors.toastMessage, message, false);
    };

    // The event popover stays open after wiring, and it covers the RIGHT-HAND side of the
    // canvas — which is exactly where the file row's delete button sits. Selecting a file
    // still works through that (attachFile writes to the hidden input), but anything the
    // user would actually point at has to be uncovered first. The sibling specs never hit
    // this because they only ever drive the hidden input.
    const dismissEventPopover = () => {
      cy.forceClickOnCanvas();
      cy.waitForAutoSave();
    };

    beforeEach(() => {
      cy.apiLogin();
      cy.apiCreateApp(`${fake.companyName}-${Date.now()}-Filepicker-App`);
      cy.openApp();
      cy.dragAndDropWidget(filePickerText.defaultWidgetText, 500, 100);
      waitForDropSettle(widget);
      // Collapsed so the canvas keeps its full height: this widget is 220px tall by
      // default (filepicker.js:8) and grows a file pane on top of that, so with the panel
      // open the list ends up under the fold.
      closeQueryPanel();
      openEditorSidebar(widget);
    });

    afterEach(function () {
      if (this.currentTest.state === "passed") cy.apiDeleteApp();
    });

    it("should fire onFileSelected when a file is accepted", () => {
      addEventWithAlert("On File Selected", selectedMsg); // source: filepicker.js:212
      attachFile(validFile);
      expectToast(selectedMsg);

      // Preview is a separate render path — the canvas overlays can mask handler wiring,
      // so an editor-only assertion would not prove the event reaches a real user.
      cy.openPreview(filePickerSelector.widget(widget));
      attachFile(validFile);
      expectToast(selectedMsg);
    });

    it("should fire onFileLoaded when a file is accepted", () => {
      addEventWithAlert("On File Loaded", loadedMsg); // source: filepicker.js:213
      attachFile(validFile);
      expectToast(loadedMsg);
      expectFileInList(validFileName);

      cy.openPreview(filePickerSelector.widget(widget));
      attachFile(validFile);
      expectToast(loadedMsg);
    });

    it("should fire onFileSelected when the file is rejected", () => {
      addEventWithAlert("On File Selected", selectedMsg);
      attachGeneratedFile({ sizeBytes: 10, name: "under-min.txt" }); // under the 50-byte floor
      expectToast(selectedMsg);

      // The event fires on SELECTION, at the top of onDrop and before validation filters
      // the batch (useFilePicker.js:296) — so it fires even though nothing was kept.
      // Asserting the empty file pane alongside it is what makes that explicit.
      cy.get(filePickerSelector.filePane(widget)).should("not.exist");

      cy.openPreview(filePickerSelector.widget(widget));
      attachGeneratedFile({ sizeBytes: 10, name: "under-min.txt" });
      expectToast(selectedMsg);
    });

    it("should not fire onFileLoaded when the file is rejected", () => {
      addEventWithAlert("On File Loaded", loadedMsg);
      attachGeneratedFile({ sizeBytes: 10, name: "under-min.txt" });

      // The file genuinely did not load: nothing reaches the file pane.
      cy.get(filePickerSelector.filePane(widget)).should("not.exist");
      cy.get(commonSelectors.toastMessage).should("not.contain.text", loadedMsg);

      cy.openPreview(filePickerSelector.widget(widget));
      attachGeneratedFile({ sizeBytes: 10, name: "under-min.txt" });
      cy.get(commonSelectors.toastMessage).should("not.contain.text", loadedMsg);
    });

    it("should fire onFileDeselected when a held file is removed from the list", () => {
      addEventWithAlert("On File Deselected", deselectedMsg); // source: filepicker.js:214
      dismissEventPopover();
      attachFile(validFile);
      expectFileInList(validFileName);

      // Establishing that the event was NOT already firing is what makes the next
      // assertion attributable to the removal rather than to the selection. Asserted as
      // non-existence, not as "does not contain": only onFileDeselected is wired here, so
      // no toast exists yet and a cy.get on the toast selector would fail outright.
      cy.get(commonSelectors.toastMessage).should("not.exist");

      deleteFileFromList(validFileName);
      expectToast(deselectedMsg);

      cy.openPreview(filePickerSelector.widget(widget));
      attachFile(validFile);
      deleteFileFromList(validFileName);
      expectToast(deselectedMsg);
    });

    it("should not fire any of the three events before a file is selected", () => {
      addMultiEventsWithAlert(events);
      // Three handlers leave the last popover open over the canvas, and its rootClose
      // listener swallows the next click — including the one on Preview, which then never
      // navigates. Dismissing it first is what makes the preview phase reachable.
      dismissEventPopover();
      cy.waitForElement(filePickerSelector.widget(widget));
      cy.get(commonSelectors.toastMessage).should("not.exist");

      cy.openPreview(filePickerSelector.widget(widget));
      cy.waitForElement(filePickerSelector.widget(widget));
      cy.get(commonSelectors.toastMessage).should("not.exist");
    });
  }
);
