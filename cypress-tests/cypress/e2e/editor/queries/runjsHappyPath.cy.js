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
  deleteQuery,
  query,
  changeQueryToggles,
  renameQueryFromEditor,
  addInputOnQueryField,
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
import { deleteDownloadsFolder } from "Support/utils/common";

describe("RunJS", () => {
  beforeEach(() => {
    cy.apiLogin();
    cy.apiCreateApp();
    cy.openApp();
    cy.viewport(1800, 1800);
    cy.dragAndDropWidget("Button");
    resizeQueryPanel("80");
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

  it("should verify actions", () => {
    const data = {};
    deleteDownloadsFolder();
    data.customText = randomString(12);

    selectQueryFromLandingPage("runjs", "JavaScript");
    addInputOnQueryField(
      "runjs",
      `setTimeout(() => {
        actions.setVariable('var', 'test');
      actions.setPageVariable('pageVar', 'pageTest');
    }, [0]) `
    );
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
      "runjs",
      `setTimeout(() => {
          actions.unSetVariable('var');
        actions.unsetPageVariable('pageVar');
      }, [0]) `
    );
    query("run");
    cy.get(commonWidgetSelector.sidebarinspector).click();
    cy.get(".tooltip-inner").invoke("hide");
    verifyNodeData("variables", "Object", "0 entry ");

    openNode("page");
    openNode("variables", 1);
    verifyNodeData("variables", "Object", "0 entry ", 1);

    addInputOnQueryField(
      "runjs",
      "actions.showAlert('success', 'alert from runjs');"
    );
    query("run");

    cy.verifyToastMessage(commonSelectors.toastMessage, "alert from runjs");
    cy.get(multipageSelector.sidebarPageButton).click();
    addNewPage("test_page");
    cy.url().should("contain", "/test-page");

    addInputOnQueryField("runjs", "actions.switchPage('home');");
    query("run");
    cy.url().should("contain", "/home");

    cy.get('[data-cy="real-canvas"]').click("topRight", { force: true });
    cy.dragAndDropWidget("Modal");
    cy.waitForAutoSave();
    addInputOnQueryField("runjs", "actions.showModal('modal1');");
    query("run");
    cy.get('[data-cy="modal-title"]').should("be.visible");

    addInputOnQueryField("runjs", "actions.closeModal('modal1');");
    query("run");
    cy.wait(200);
    cy.notVisible('[data-cy="modal-title"]');

    addInputOnQueryField(
      "runjs",
      "actions.copyToClipboard('data from runjs');"
    );
    query("run");

    cy.window().then((win) => {
      win.navigator.clipboard.readText().then((text) => {
        expect(text).to.eq("data from runjs");
      });
    });
    addInputOnQueryField(
      "runjs",
      "actions.setLocalStorage('localStorage','data from runjs');"
    );
    query("run");

    cy.getAllLocalStorage().then((result) => {
      expect(result[Cypress.config().baseUrl].localStorage).to.deep.equal(
        "data from runjs"
      );
    });

    addInputOnQueryField(
      "runjs",
      "actions.generateFile('runjscsv', 'csv', [{ name: 'John', email: 'john@tooljet.com' }])"
    );
    query("run");

    cy.readFile("cypress/downloads/runjscsv.csv", "utf-8")
      .should("contain", "name,email")
      .and("contain", "John,john@tooljet.com");

    // addInputOnQueryField(
    //   "runjs",
    //   "actions.goToApp('111234')"
    // );
    // query("run");

    addInputOnQueryField("runjs", "actions.logout()");
    query("run");
    cy.get('[data-cy="sign-in-header"]').should("be.visible");
    cy.apiLogin();
    cy.openApp(
      Cypress.env("appId"),
      '[data-cy="draggable-widget-modal1-launch-button"]'
    );
  });

  it("should verify global and page data", () => {
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
    selectEvent("On Click", "Run query", 1);
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
    changeQueryToggles("run-on-app-load");
    cy.wait(`@editQuery`);
    cy.waitForAutoSave();
    cy.reload();
    cy.verifyToastMessage(
      commonSelectors.toastMessage,
      "alert from runjs",
      false
    );

    changeQueryToggles("confirmation-before-run");
    cy.wait(`@editQuery`);
    cy.waitForAutoSave();
    cy.reload();
    cy.get('[data-cy="modal-message"]').verifyVisibleElement(
      "have.text",
      "Do you want to run this query - runjs1?"
    );
    cy.get('[data-cy="modal-confirm-button"]').realClick();
    cy.verifyToastMessage(commonSelectors.toastMessage, "alert from runjs");

    resizeQueryPanel("80");
    changeQueryToggles("notification-on-success");
    cy.get('[data-cy="success-message-input-field"]').clearAndTypeOnCodeMirror(
      "Success alert"
    );
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
