import { fake } from "Fixtures/fake";
import { commonSelectors } from "Selectors/common";
import { fileButtonSelector } from "Selectors/appBuilder/components/fileButton";
import { fileButtonText, fileButtonFixtures } from "Texts/appBuilder/components/fileButton";
import { addEventWithAlert, addMultiEventsWithAlert } from "Support/utils/appBuilder/events";
import {
  openEditorSidebar,
  waitForDropSettle,
} from "Support/utils/commonWidget";

// Events facet — both config.events, each asserted in the editor AND in preview.
//   onFileSelected:151 — fires on an accepted file AND on a rejected one
//   onFileLoaded:152   — fires on an accepted file only
// source: fileButton.js
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
    cy.openPreview(fileButtonSelector.button(widget));
    selectFile(validFile);
    expectToast(selectedMsg);
  });

  it("should fire onFileLoaded when a file is accepted", () => {
    addEventWithAlert("On file loaded", loadedMsg);
    selectFile(validFile);
    expectToast(loadedMsg);
    cy.get(fileButtonSelector.label(widget)).should("have.text", "tooljet.png");
    cy.openPreview(fileButtonSelector.button(widget));
    selectFile(validFile);
    expectToast(loadedMsg);
    cy.get(fileButtonSelector.label(widget)).should("have.text", "tooljet.png");
  });

  it("should fire onFileSelected when the file is rejected", () => {
    addEventWithAlert("On file selected", selectedMsg);
    selectFile(oversizeFile);
    expectToast(selectedMsg);
    cy.get(fileButtonSelector.invalidFeedback(widget)).should("be.visible");
    cy.openPreview(fileButtonSelector.button(widget));
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
    cy.openPreview(fileButtonSelector.button(widget));
    selectFile(oversizeFile);
    cy.get(fileButtonSelector.invalidFeedback(widget)).should("be.visible");
    cy.get(commonSelectors.toastMessage).should("not.contain.text", loadedMsg);
  });

  it("should not fire either event before any file is selected", () => {
    addMultiEventsWithAlert(events);
    cy.waitForElement(fileButtonSelector.button(widget));
    cy.get(commonSelectors.toastMessage).should("not.exist");
    cy.openPreview(fileButtonSelector.button(widget));
    cy.waitForElement(fileButtonSelector.button(widget));
    cy.get(commonSelectors.toastMessage).should("not.exist");
  });
});
