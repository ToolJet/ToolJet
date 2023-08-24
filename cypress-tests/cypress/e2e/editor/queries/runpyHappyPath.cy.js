import { fake } from "Fixtures/fake";
import { textInputText } from "Texts/textInput";
import { commonWidgetText, widgetValue, customValidation } from "Texts/common";
import { commonSelectors, commonWidgetSelector } from "Selectors/common";
import { multipageSelector } from "Selectors/multipage";
import { buttonText } from "Texts/button";
import {
  verifyControlComponentAction,
  randomString,
} from "Support/utils/textInput";
import {
  openAccordion,
  verifyAndModifyParameter,
  openEditorSidebar,
  verifyAndModifyToggleFx,
  addDefaultEventHandler,
  verifyComponentValueFromInspector,
  selectColourFromColourPicker,
  verifyBoxShadowCss,
  verifyLayout,
  verifyTooltip,
  editAndVerifyWidgetName,
  verifyPropertiesGeneralAccordion,
  verifyStylesGeneralAccordion,
  randomNumber,
  closeAccordions,
} from "Support/utils/commonWidget";
import { dataCsvAssertionHelper } from "Support/utils/table";
import {
  selectCSA,
  selectEvent,
  addSupportCSAData,
} from "Support/utils/events";

import {
  selectQueryFromLandingPage,
  query,
  changeQueryToggles,
  renameQueryFromEditor,
  addInputOnQueryField,
  waitForQueryAction,
} from "Support/utils/queries";

import {
  verifyCouldnotConnectWithAlert,
  resizeQueryPanel,
  verifypreview,
  addInput,
} from "Support/utils/dataSource";
import {
  hideOrUnhidePageMenu,
  addEventHandler,
  addNewPage,
  setHomePage,
  hideOrUnhidePage,
  detetePage,
  modifyPageHandle,
  clearSearch,
  searchPage,
} from "Support/utils/multipage";
import { verifyNodeData, openNode, verifyValue } from "Support/utils/inspector";

describe("runpy", () => {
  beforeEach(() => {
    cy.apiLogin();
    cy.apiCreateApp();
    cy.openApp();
    cy.viewport(1800, 1800);
    cy.dragAndDropWidget("Button");
    resizeQueryPanel("80");
    cy.intercept("PATCH", "api/data_queries/**").as("editQuery");
  });

  it("should verify basic runpy", () => {
    const data = {};
    data.customText = randomString(12);

    selectQueryFromLandingPage("runpy", "Python");
    addInputOnQueryField("runpy", "True");
    cy.waitForAutoSave();
    query("preview");
    verifypreview("raw", "true");
    query("run");
    cy.get(commonWidgetSelector.sidebarinspector).click();
    cy.get(".tooltip-inner").invoke("hide");
    openNode("queries");
    openNode("runpy1");
    verifyValue("data", "Boolean", "true");
    verifyValue("rawData", "Boolean", "true");
    cy.apiDeleteApp();
  });

  it("should verify actions", () => {
    const data = {};
    data.customText = randomString(12);

    selectQueryFromLandingPage("runpy", "Python");
    addInputOnQueryField(
      "runpy",
      `actions.setVariable('var', 'test')
actions.setPageVariable('pageVar', 'pageTest')`
    );
    cy.waitForAutoSave();
    query("run");
    cy.get(commonWidgetSelector.sidebarinspector).click();
    cy.get(".tooltip-inner").invoke("hide");
    verifyNodeData("variables", "Object", "1 entry ");
    openNode("variables", 0);

    verifyValue("var", "String", `"test"`);

    openNode("page");
    openNode("variables", 1);
    verifyValue("pageVar", "String", `"pageTest"`);

    addInputOnQueryField(
      "runpy",
      `actions.unSetVariable('var')
actions.unsetPageVariable('pageVar')`
    );
    query("run");
    cy.get(commonWidgetSelector.sidebarinspector).click();
    cy.get(".tooltip-inner").invoke("hide");
    verifyNodeData("variables", "Object", "0 entry ");

    openNode("page");
    openNode("variables", 1);
    verifyNodeData("variables", "Object", "0 entry ", 1);

    addInputOnQueryField(
      "runpy",
      "actions.showAlert('success', 'alert from runpy')"
    );
    query("run");

    cy.verifyToastMessage(
      commonSelectors.toastMessage,
      "alert from runpy",
      false
    );
    cy.get(multipageSelector.sidebarPageButton).click();
    addNewPage("test_page");
    cy.url().should("contain", "/test-page");

    addInputOnQueryField("runpy", "actions.switchPage('home')");
    query("run");
    cy.url().should("contain", "/home");

    cy.get('[data-cy="real-canvas"]').click("topRight", { force: true });
    cy.dragAndDropWidget("Modal", 300, 300);
    cy.waitForAutoSave();
    addInputOnQueryField("runpy", "actions.showModal('modal1')");
    query("run");
    cy.get('[data-cy="modal-title"]').should("be.visible");
    cy.get('[data-cy="runpy-input-field"]').click({ force: true });

    addInputOnQueryField("runpy", "actions.closeModal('modal1')");
    cy.wait(`@editQuery`);
    cy.waitForAutoSave();
    query("run");
    waitForQueryAction("run");
    cy.notVisible('[data-cy="modal-title"]');

    addInputOnQueryField("runpy", "actions.copyToClipboard('data from runpy')");
    cy.wait(`@editQuery`);
    cy.waitForAutoSave();
    query("run");
    waitForQueryAction("run");
    cy.window().then((win) => {
      win.navigator.clipboard.readText().then((text) => {
        expect(text).to.eq("data from runpy");
      });
    });
    addInputOnQueryField(
      "runpy",
      "actions.setLocalStorage('localStorage','data from runpy')"
    );
    cy.wait(`@editQuery`);
    cy.waitForAutoSave();
    query("run");
    waitForQueryAction("run");

    cy.getAllLocalStorage().then((result) => {
      expect(result[Cypress.config().baseUrl].localStorage).to.deep.equal(
        "data from runpy"
      );
    });

    // addInputOnQueryField(
    //   "runpy",
    //   "actions.generateFile('runpycsv', 'csv', [{ 'name': 'John', 'email': 'john@tooljet.com' }])"
    // );
    // query("run");

    // cy.verifyToastMessage(
    //   commonSelectors.toastMessage,
    //   "Query (runpy1) completed."
    // );

    // cy.wait(3000);

    // cy.readFile("cypress/downloads/runpycsv.csv", "utf-8")
    //   .should("contain", "name,email")
    //   .and("contain", "John,john@tooljet.com");

    // addInputOnQueryField(
    //   "runpy",
    //   "actions.goToApp('111234')"
    // );
    // query("run");

    addInputOnQueryField("runpy", "actions.logout()");
    cy.wait(`@editQuery`);
    cy.wait(200);
    cy.waitForAutoSave();
    query("run");
    waitForQueryAction("run");
    cy.get('[data-cy="sign-in-header"]').should("be.visible");
  });

  it("should verify global and page data", () => {
    const data = {};
    data.customText = randomString(12);

    selectQueryFromLandingPage("runpy", "Python");
    addInputOnQueryField("runpy", "tj_globals.theme");
    cy.waitForAutoSave();
    query("preview");
    verifypreview("raw", `{"name":"light"}`);

    addInputOnQueryField("runpy", "tj_globals.currentUser.email");
    query("preview");
    verifypreview("raw", `dev@tooljet.io`);
    addInputOnQueryField("runpy", "tj_globals.currentUser.email");
    query("preview");
    verifypreview("raw", `dev@tooljet.io`);
    addInputOnQueryField("runpy", "tj_globals.currentUser.firstName");
    query("preview");
    verifypreview("raw", `The`);
    addInputOnQueryField("runpy", "tj_globals.currentUser.lastName");
    query("preview");
    verifypreview("raw", `Developer`);
    addInputOnQueryField("runpy", "tj_globals.currentUser.groups");
    query("preview");
    cy.verifyToastMessage(
      commonSelectors.toastMessage,
      "Query (runpy1) completed."
    );
    waitForQueryAction("preview");
    verifypreview("raw", `["all_users","admin"]`);
    if (Cypress.env("environment") != "Community") {
      addInputOnQueryField("runpy", "tj_globals.mode.value");
      query("preview");
      verifypreview("raw", `edit`);

      addInputOnQueryField("runpy", "tj_globals.environment.name");
      query("preview");
      verifypreview("raw", `development`);

      // addInputOnQueryField( //WIP
      //   "runpy",
      //   "(tj_globals.currentUser.ssoUserInfo == undefined)"
      // );
      // query("preview");
      // verifypreview("raw", `true`);
    }
    cy.apiDeleteApp();
  });

  it("should verify action by button", () => {
    const data = {};
    data.customText = randomString(12);

    selectQueryFromLandingPage("runpy", "Python");
    addInputOnQueryField(
      "runpy",
      "actions.showAlert('success', 'alert from runpy');"
    );
    cy.waitForAutoSave();
    query("run");

    openEditorSidebar("button1");
    selectEvent("On Click", "Run query", 1);
    cy.get('[data-cy="query-selection-field"]').type("runpy1{enter}");
    cy.get(commonWidgetSelector.draggableWidget("button1")).click();
    cy.verifyToastMessage(commonSelectors.toastMessage, "alert from runpy");
    renameQueryFromEditor("newrunpy");
    cy.get('[data-cy="event-handler"]').click();

    cy.get('[data-cy="query-selection-field"]').should("have.text", "newrunpy");
    cy.get(commonWidgetSelector.draggableWidget("button1")).click();
    cy.verifyToastMessage(commonSelectors.toastMessage, "alert from runpy");
    cy.apiDeleteApp();
  });

  it("should verify runpy toggle options", () => {
    const data = {};
    data.customText = randomString(12);

    selectQueryFromLandingPage("runpy", "Python");
    cy.waitForAutoSave();
    addInputOnQueryField(
      "runpy",
      "actions.showAlert('success', 'alert from runpy');"
    );
    cy.wait("@editQuery");
    cy.wait(200);
    cy.waitForAutoSave();
    changeQueryToggles("run-on-app-load");
    cy.wait("@editQuery");
    cy.waitForAutoSave();
    cy.reload();
    cy.verifyToastMessage(commonSelectors.toastMessage, "alert from runpy");

    changeQueryToggles("confirmation-before-run");
    cy.wait("@editQuery");
    cy.wait(200);
    cy.waitForAutoSave();
    cy.reload();
    cy.get('[data-cy="modal-message"]').verifyVisibleElement(
      "have.text",
      "Do you want to run this query - runpy1?"
    );
    cy.get('[data-cy="modal-confirm-button"]').realClick();
    cy.verifyToastMessage(commonSelectors.toastMessage, "alert from runpy");

    changeQueryToggles("notification-on-success");
    cy.get('[data-cy="success-message-input-field"]').clearAndTypeOnCodeMirror(
      "Success alert"
    );
    cy.forceClickOnCanvas();
    cy.wait("@editQuery");
    cy.wait(200);
    cy.waitForAutoSave();
    cy.reload();
    cy.get('[data-cy="modal-confirm-button"]', { timeout: 10000 }).realClick();
    cy.verifyToastMessage(commonSelectors.toastMessage, "Success alert", false);
    cy.verifyToastMessage(
      commonSelectors.toastMessage,
      "alert from runpy",
      false
    );
    cy.apiDeleteApp();
  });
});
