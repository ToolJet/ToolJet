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
  selectQuery,
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

describe("runpy", () => {
  beforeEach(() => {
    cy.appUILogin();
    cy.createApp();
    cy.viewport(1800, 1800);
    cy.dragAndDropWidget("Button");
    resizeQueryPanel("50");
  });

  it("should verify basic runpy", () => {
    const data = {};
    data.customText = randomString(12);

    selectQuery("Run Python code");
    addInputOnQueryField("runpy", "True");
    query("create");
    cy.verifyToastMessage(commonSelectors.toastMessage, "Query Added");
    query("preview");
    verifypreview("raw", "true");
    query("run");
    cy.get(commonWidgetSelector.sidebarinspector).click();
    cy.get(".tooltip-inner").invoke("hide");
    openNode("queries");
    openNode("runpy1");
    verifyValue("data", "Boolean", "true");
    verifyValue("rawData", "Boolean", "true");
  });

  it("should verify actions", () => {
    const data = {};
    data.customText = randomString(12);

    selectQuery("Run Python code");
    addInputOnQueryField(
      "runpy",
      `actions.setVariable('var', 'test')
actions.setPageVariable('pageVar', 'pageTest')`
    );
    query("run");
    cy.verifyToastMessage(commonSelectors.toastMessage, "Query Added");
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
    // cy.verifyToastMessage(commonSelectors.toastMessage, "Query Added");

    cy.verifyToastMessage(
      commonSelectors.toastMessage,
      "Query (runpy1) completed."
    );

    cy.verifyToastMessage(commonSelectors.toastMessage, "alert from runpy");
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
    cy.closeToastMessage();
    cy.get('[data-cy="modal-title"]').should("be.visible");
    cy.get('[data-cy="runpy-input-field"]').click({ force: true });

    addInputOnQueryField("runpy", "actions.closeModal('modal1')");
    cy.wait(2000);
    query("run");
    cy.intercept("GET", "api/data_queries?**").as("addQuery");
    cy.wait("@addQuery");
    cy.verifyToastMessage(
      commonSelectors.toastMessage,
      "Query (runpy1) completed."
    );
    cy.wait(10000);
    cy.notVisible('[data-cy="modal-title"]');

    addInputOnQueryField("runpy", "actions.copyToClipboard('data from runpy')");
    query("run");
    cy.wait("@addQuery");
    cy.verifyToastMessage(
      commonSelectors.toastMessage,
      "Query (runpy1) completed."
    );
    cy.window().then((win) => {
      win.navigator.clipboard.readText().then((text) => {
        expect(text).to.eq("data from runpy");
      });
    });
    addInputOnQueryField(
      "runpy",
      "actions.setLocalStorage('localStorage','data from runpy')"
    );
    query("run");
    cy.wait("@addQuery");
    cy.verifyToastMessage(
      commonSelectors.toastMessage,
      "Query (runpy1) completed."
    );
    cy.wait(5000);

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
    // cy.wait("@addQuery");
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
    // cy.wait("@addQuery");
    addInputOnQueryField("runpy", "actions.logout()");
    query("run");
    cy.wait("@addQuery");
    cy.wait(3000);
    cy.get('[data-cy="sign-in-header"]').should("be.visible");
  });

  it("should verify global and page data", () => {
    const data = {};
    data.customText = randomString(12);

    selectQuery("Run Python code");
    addInputOnQueryField("runpy", "tj_globals");
    query("create");
    cy.verifyToastMessage(commonSelectors.toastMessage, "Query Added");
    query("preview");
    verifypreview(
      "raw",
      `{"theme":{"name":"light"},"urlparams":{},"currentUser":{"email":"dev@tooljet.io","firstName":"The","lastName":"Developer","groups":["all_users","admin"]}}`
    );
  });

  it("should verify action by button", () => {
    const data = {};
    data.customText = randomString(12);

    selectQuery("Run Python code");
    addInputOnQueryField(
      "runpy",
      "actions.showAlert('success', 'alert from runpy');"
    );
    query("create");
    cy.verifyToastMessage(commonSelectors.toastMessage, "Query Added");
    query("run");

    selectEvent("On Click", "Run query", 1);
    cy.get('[data-cy="query-selection-field"]').type("runpy1{enter}");
    cy.get(commonWidgetSelector.draggableWidget("button1")).click();
    cy.verifyToastMessage(
      commonSelectors.toastMessage,
      "Query (runpy1) completed."
    );
    cy.verifyToastMessage(commonSelectors.toastMessage, "alert from runpy");
    renameQueryFromEditor("newrunpy");
    cy.wait(3000);
    cy.get('[data-cy="event-handler"]').click();

    cy.get('[data-cy="query-selection-field"]').should("have.text", "newrunpy");
    cy.get(commonWidgetSelector.draggableWidget("button1")).click();
    cy.verifyToastMessage(
      commonSelectors.toastMessage,
      "Query (newrunpy) completed."
    );
    cy.verifyToastMessage(commonSelectors.toastMessage, "alert from runpy");
  });

  it("should verify runpy toggle options", () => {
    const data = {};
    data.customText = randomString(12);

    selectQuery("Run Python code");
    addInputOnQueryField(
      "runpy",
      "actions.showAlert('success', 'alert from runpy');"
    );
    query("create");
    cy.verifyToastMessage(commonSelectors.toastMessage, "Query Added");
    changeQueryToggles("run-on-app-load");
    query("save");
    cy.reload();
    cy.wait(3000);
    cy.verifyToastMessage(
      commonSelectors.toastMessage,
      "Query (runpy1) completed."
    );
    cy.verifyToastMessage(commonSelectors.toastMessage, "alert from runpy");

    changeQueryToggles("confirmation-before-run");
    query("save");
    cy.reload();
    cy.wait(3000);
    cy.get('[data-cy="modal-message"]').verifyVisibleElement(
      "have.text",
      "Do you want to run this query - runpy1?"
    );
    cy.get('[data-cy="modal-confirm-button"]').realClick();
    cy.verifyToastMessage(
      commonSelectors.toastMessage,
      "Query (runpy1) completed."
    );
    cy.verifyToastMessage(commonSelectors.toastMessage, "alert from runpy");

    changeQueryToggles("notification-on-success");
    cy.get('[data-cy="success-message-input-field"]').clearAndTypeOnCodeMirror(
      "Success alert"
    );
    query("save");
    cy.reload();
    cy.wait(3000);
    cy.get('[data-cy="modal-confirm-button"]').realClick();
    cy.verifyToastMessage(
      commonSelectors.toastMessage,
      "Query (runpy1) completed."
    );
    cy.verifyToastMessage(commonSelectors.toastMessage, "Success alert");
    cy.verifyToastMessage(commonSelectors.toastMessage, "alert from runpy");
  });
});
