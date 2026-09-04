import { fake } from "Fixtures/fake";
import { commonSelectors, commonWidgetSelector } from "Selectors/common";
import { fileButtonSelector } from "Selectors/appBuilder/components/fileButton";
import { fileButtonText, fileButtonFixtures } from "Texts/appBuilder/components/fileButton";
import { addEventWithAlert, addMultiEventsWithAlert } from "Support/utils/appBuilder/events";
import { openEditorSidebar } from "Support/utils/commonWidget";
import { waitForDropSettle } from "Support/utils/appBuilder/components/fileButton";

describe(
  "File Button events",
  { testIsolation: false, retries: { runMode: 3, openMode: 0 } },
  () => {
  const widget = fileButtonText.defaultWidgetName;
  // Generated rather than committed: the only way to trip the widget's default
  // 1MB maxSize is a file larger than it, and a >1MB binary does not belong in the repo.
  const { validFile, oversizeFile, oversizeFileBytes } = fileButtonFixtures;
  const selectedMsg = "File selected event";
  const loadedMsg = "File loaded event";

  const events = [
    { event: "On file selected", message: selectedMsg },
    { event: "On file loaded", message: loadedMsg },
  ];

  const selectFile = (file) => {
    cy.get(fileButtonSelector.inputField(widget)).selectFile(file, {
      force: true,
    });
  };

  const expectToast = (message) => {
    cy.verifyToastMessage(commonSelectors.toastMessage, message, false);
  };

  // Same tab rather than a new one, so the rest of the test keeps running in
  // the same Cypress context. Navigating reloads, so any toast still fading
  // out from the editor half is gone by the time preview asserts.
  const openPreview = () => {
    cy.openInCurrentTab(commonWidgetSelector.previewButton);
    cy.waitForElement(fileButtonSelector.button(widget));
  };

  before(() => {
    cy.writeFile(oversizeFile, "x".repeat(oversizeFileBytes));
  });

  beforeEach(() => {
    cy.apiLogin();
    cy.apiCreateApp(`${fake.companyName}-${Date.now()}-Filebutton-App`);
    cy.openApp();
    cy.dragAndDropWidget(fileButtonText.defaultWidgetText, 500, 100);
    waitForDropSettle(widget);
    openEditorSidebar(widget);
  });

  afterEach(function () {
    if (this.currentTest.state === "passed") cy.apiDeleteApp();
  });

  it("should fire onFileSelected when a file is accepted", () => {
    addEventWithAlert("On file selected", selectedMsg);
    selectFile(validFile);
    expectToast(selectedMsg);
    openPreview();
    selectFile(validFile);
    expectToast(selectedMsg);
  });

  it("should fire onFileLoaded when a file is accepted", () => {
    addEventWithAlert("On file loaded", loadedMsg);
    selectFile(validFile);
    expectToast(loadedMsg);
    cy.get(fileButtonSelector.label(widget)).should("have.text", "tooljet.png");
    openPreview();
    selectFile(validFile);
    expectToast(loadedMsg);
    cy.get(fileButtonSelector.label(widget)).should("have.text", "tooljet.png");
  });

  it("should fire onFileSelected when the file is rejected", () => {
    addEventWithAlert("On file selected", selectedMsg);
    selectFile(oversizeFile);
    expectToast(selectedMsg);
    cy.get(fileButtonSelector.invalidFeedback(widget)).should("be.visible");
    openPreview();
    selectFile(oversizeFile);
    expectToast(selectedMsg);
    cy.get(fileButtonSelector.invalidFeedback(widget)).should("be.visible");
  });

  it("should not fire onFileLoaded when the file is rejected", () => {
    addEventWithAlert("On file loaded", loadedMsg);
    selectFile(oversizeFile);
    cy.get(fileButtonSelector.invalidFeedback(widget)).should("be.visible");
    cy.get(commonSelectors.toastMessage).should("not.contain.text", loadedMsg);
    cy.get(fileButtonSelector.label(widget)).should("not.have.text", "filebutton-oversize.txt");
    openPreview();
    selectFile(oversizeFile);
    cy.get(fileButtonSelector.invalidFeedback(widget)).should("be.visible");
    cy.get(commonSelectors.toastMessage).should("not.contain.text", loadedMsg);
  });

  it("should not fire either event before any file is selected", () => {
    addMultiEventsWithAlert(events);
    cy.waitForElement(fileButtonSelector.button(widget));
    cy.get(commonSelectors.toastMessage).should("not.exist");
    openPreview();
    cy.waitForElement(fileButtonSelector.button(widget));
    cy.get(commonSelectors.toastMessage).should("not.exist");
  });
});
