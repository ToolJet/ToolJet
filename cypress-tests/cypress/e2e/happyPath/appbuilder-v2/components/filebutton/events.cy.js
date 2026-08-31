import { fake } from "Fixtures/fake";
import { commonSelectors } from "Selectors/common";
import { fileButtonSelector } from "Selectors/fileButton";
import { addEventWithAlert, addMultiEventsWithAlert } from "Support/utils/events";
import { openEditorSidebar } from "Support/utils/commonWidget";

describe(
  "File Button events",
  { testIsolation: false, retries: { runMode: 3, openMode: 0 } },
  () => {
  const widget = "filebutton1";
  const validFile = "cypress/fixtures/Image/tooljet.png";
  // Generated rather than committed: the only way to trip the widget's default
  // 1MB maxSize is a file larger than it, and a >1MB binary does not belong in the repo.
  const oversizeFile = "cypress/downloads/filebutton-oversize.txt";
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

  // Canvas keeps settling after a drop — poll position until it stops before acting.
  const waitForDropSettle = (widgetName, attemptsLeft = 6) => {
    cy.get(`[data-cy="draggable-widget-${widgetName}"]`).then(($el) => {
      const top = $el[0].getBoundingClientRect().top;
      cy.wrap(null).then(() => {
        cy.wait(150);
        cy.get(`[data-cy="draggable-widget-${widgetName}"]`).then(($el2) => {
          const top2 = $el2[0].getBoundingClientRect().top;
          if (Math.abs(top2 - top) > 1 && attemptsLeft > 0) {
            waitForDropSettle(widgetName, attemptsLeft - 1);
          }
        });
      });
    });
  };

  before(() => {
    cy.writeFile(oversizeFile, "x".repeat(1200000));
  });

  beforeEach(() => {
    cy.apiLogin();
    cy.apiCreateApp(`${fake.companyName}-Filebutton-App`);
    cy.openApp();
    cy.dragAndDropWidget("File button", 500, 100);
    waitForDropSettle(widget);
    openEditorSidebar(widget);
  });

  it("should fire onFileSelected when a file is accepted", () => {
    addEventWithAlert("On file selected", selectedMsg);
    selectFile(validFile);
    expectToast(selectedMsg);
  });

  it("should fire onFileLoaded when a file is accepted", () => {
    addEventWithAlert("On file loaded", loadedMsg);
    selectFile(validFile);
    expectToast(loadedMsg);
    cy.get(fileButtonSelector.label(widget)).should("have.text", "tooljet.png");
  });

  it("should fire onFileSelected when the file is rejected", () => {
    addEventWithAlert("On file selected", selectedMsg);
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
  });

  it("should not fire either event before any file is selected", () => {
    addMultiEventsWithAlert(events);
    cy.waitForElement(fileButtonSelector.button(widget));
    cy.get(commonSelectors.toastMessage).should("not.exist");
  });
});
