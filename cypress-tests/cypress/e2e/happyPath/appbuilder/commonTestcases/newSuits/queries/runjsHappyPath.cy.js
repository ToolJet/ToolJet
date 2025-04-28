import { fake } from "Fixtures/fake";
import { commonSelectors, commonWidgetSelector } from "Selectors/common";
import {
  openEditorSidebar
} from "Support/utils/commonWidget";
import {
  randomString
} from "Support/utils/editor/textInput";
import {
  selectEvent
} from "Support/utils/events";

import {
  addInputOnQueryField,
  changeQueryToggles,
  query,
  renameQueryFromEditor,
  selectQueryFromLandingPage
} from "Support/utils/queries";

import { deleteDownloadsFolder } from "Support/utils/common";
import {
  resizeQueryPanel,
  verifypreview
} from "Support/utils/dataSource";
import { openNode, verifyValue } from "Support/utils/inspector";

describe("RunJS", () => {
  beforeEach(() => {
    cy.apiLogin();
    cy.apiCreateApp(`${fake.companyName}-runjs-App`);
    cy.openApp();
    cy.viewport(1800, 1800);
    cy.dragAndDropWidget("Button");
    resizeQueryPanel("80");
    deleteDownloadsFolder();
  });

  it("should verify basic runjs", () => {
    const data = {};
    data.customText = randomString(12);

    selectQueryFromLandingPage("runjs", "JavaScript");
    addInputOnQueryField("runjs", "return true");
    query("preview");
    verifypreview("raw", "true");
    query("run");
    cy.get(commonWidgetSelector.sidebarinspector).click();
    cy.get(".tooltip-inner").invoke("hide");
    openNode("queries");
    openNode("runjs1");
    verifyValue("data", "Boolean", "true");
    verifyValue("rawData", "Boolean", "true");
    cy.apiDeleteApp();
  });

  it.skip("should verify global and page data", () => {
    const data = {};
    data.customText = randomString(12);

    selectQueryFromLandingPage("runjs", "JavaScript");
    addInputOnQueryField("runjs", "return [page.handle,page.name]");
    query("preview");
    verifypreview("raw", `["home","Home"]`);

    addInputOnQueryField("runjs", "return globals.theme");
    query("preview");
    verifypreview("raw", `{"name":"light"}`);

    // addInputOnQueryField("runjs", "return globals.currentUser");
    // query("preview");
    // verifypreview(
    //   "raw",
    //   `{"email":"dev@tooljet.io","firstName":"The","lastName":"Developer","groups":["all_users","admin"]}`
    // );
    addInputOnQueryField("runjs", "return globals.currentUser.email");
    query("preview");
    verifypreview("raw", `dev@tooljet.io`);
    addInputOnQueryField("runjs", "return globals.currentUser.email");
    query("preview");
    verifypreview("raw", `dev@tooljet.io`);
    addInputOnQueryField("runjs", "return globals.currentUser.firstName");
    query("preview");
    verifypreview("raw", `The`);
    addInputOnQueryField("runjs", "return globals.currentUser.lastName");
    query("preview");
    verifypreview("raw", `Developer`);
    addInputOnQueryField("runjs", "return globals.currentUser.groups");
    query("preview");
    verifypreview("raw", `["all_users","admin"]`);
    if (Cypress.env("environment") != "Community") {
      addInputOnQueryField("runjs", "return globals.environment.name");
      query("preview");
      verifypreview("raw", `development`);

      addInputOnQueryField(
        "runjs",
        "return globals.currentUser.ssoUserInfo == undefined"
      );
      query("preview");
      verifypreview("raw", `true`);
    }

    addInputOnQueryField("runjs", "return globals.mode");
    query("preview");
    verifypreview("raw", `{"value":"edit"}`);

    addInputOnQueryField("runjs", "return constants");
    query("preview");
    verifypreview("raw", `{}`);
    cy.apiDeleteApp();
  });

  it("should verify action by button", () => {
    const data = {};
    data.customText = randomString(12);

    selectQueryFromLandingPage("runjs", "JavaScript");
    addInputOnQueryField(
      "runjs",
      "actions.showAlert('success', 'alert from runjs');"
    );
    query("run");
    openEditorSidebar("button1");
    selectEvent("On Click", "Run query");
    cy.get('[data-cy="query-selection-field"]').type("runjs1{enter}");
    cy.get(commonWidgetSelector.draggableWidget("button1")).click();

    cy.verifyToastMessage(commonSelectors.toastMessage, "alert from runjs");
    renameQueryFromEditor("newrunjs");
    cy.waitForAutoSave();
    cy.get('[data-cy="event-handler"]').click();

    cy.get('[data-cy="query-selection-field"]').should("have.text", "newrunjs");
    cy.get(commonWidgetSelector.draggableWidget("button1")).click();
    cy.verifyToastMessage(commonSelectors.toastMessage, "alert from runjs");
    cy.apiDeleteApp();
  });

  it("should verify runjs toggle options", () => {
    cy.intercept("PATCH", "api/data_queries/**").as("editQuery");
    const data = {};
    data.customText = randomString(12);

    selectQueryFromLandingPage("runjs", "JavaScript");
    addInputOnQueryField(
      "runjs",
      "actions.showAlert('success', 'alert from runjs');"
    );
    cy.get('[data-cy="query-tab-settings"]').click();
    changeQueryToggles("run-on-app-load");
    // cy.wait(`@editQuery`);
    cy.waitForAutoSave();
    cy.waitForAutoSave();
    cy.reload();

    cy.verifyToastMessage(
      commonSelectors.toastMessage,
      "alert from runjs",
      false
    );
    cy.get('[data-cy="query-tab-settings"]').click();
    changeQueryToggles("confirmation-before-run");
    // cy.wait(`@editQuery`);
    cy.waitForAutoSave();
    cy.reload();
    cy.get('[data-cy="modal-message"]').verifyVisibleElement(
      "have.text",
      "Do you want to run this query - runjs1?"
    );
    cy.get('[data-cy="modal-confirm-button"]').realClick();
    cy.verifyToastMessage(commonSelectors.toastMessage, "alert from runjs");

    resizeQueryPanel("80");
    cy.get('[data-cy="query-tab-settings"]').click();
    changeQueryToggles("notification-on-success");
    cy.get('[data-cy="success-message-input-field"]').clearAndTypeOnCodeMirror(
      "Success alert"
    );
    cy.get('[data-cy="query-tab-setup"]').click();
    cy.get('[data-cy="runjs-input-field"]').realClick();
    cy.wait(1000);
    cy.waitForAutoSave();
    cy.reload();
    cy.get('[data-cy="modal-confirm-button"]').realClick();
    cy.verifyToastMessage(commonSelectors.toastMessage, "Success alert");
    cy.verifyToastMessage(commonSelectors.toastMessage, "alert from runjs");
    cy.apiDeleteApp();
  });
});
