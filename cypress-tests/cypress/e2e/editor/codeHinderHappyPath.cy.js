import {
  verifyMultipleComponentValuesFromInspector,
  verifyComponentValueFromInspector,
} from "Support/utils/commonWidget";
import { verifyNodeData, openNode, verifyValue } from "Support/utils/inspector";
import { commonSelectors, commonWidgetSelector } from "Selectors/common";
import { addNewPage } from "Support/utils/multipage";
import {
  selectCSA,
  selectEvent,
  addSupportCSAData,
} from "Support/utils/events";
import { multipageSelector } from "Selectors/multipage";
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

describe("Editor- Codehinder", () => {
  beforeEach(() => {
    cy.appUILogin();
    cy.createApp();
  });

  it.only("should verify query codehinder", () => {
    cy.viewport(1800, 1800);
    resizeQueryPanel("50");
    selectQuery("Run JavaScript code");
    cy.get(`[data-cy="runjs-input-field"]`)
      .click()
      .realHover()
      .find('[class="svg-icon m-2 popup-btn"]')
      .click();
    cy.wait(200);

    cy.get('[data-cy="codehinder-popup-badge"]').should("have.text", "Runjs");
    addInputOnQueryField(
      "codehinder-popup",
      `setTimeout(() => {
        actions.setVariable('var', 'test');
      actions.setPageVariable('pageVar', 'pageTest');
    }, [0]) `
    );
    cy.get('[data-cy="codehinder-popup-close-option-icon"]').click();
    cy.get(`[data-cy="runjs-input-field"]`)
      .find(".CodeMirror-line")
      .should(
        "have.text",
        `setTimeout(() => {          actions.setVariable(\'var\', \'test\');        actions.setPageVariable(\'pageVar\', \'pageTest\');}, [0])`
      );

    changeQueryToggles("notification-on-success");
    cy.get('[data-cy="success-message-input-field"]')
      .click()
      .realHover()
      .find('[class="svg-icon m-2 popup-btn"]')
      .click();

    cy.get('[data-cy="codehinder-popup-badge"]').should("have.text", "Editor");
    addInputOnQueryField("codehinder-popup", `Message from codehinder`);
    cy.get('[data-cy="codehinder-popup-close-option-icon"]').click();
    cy.get('[data-cy="success-message-input-field"]')
      .find(".CodeMirror-line")
      .should("have.text", "Message from codehinder");

    query("create");
    cy.verifyToastMessage(commonSelectors.toastMessage, "Query Added");
    query("run");
    cy.verifyToastMessage(
      commonSelectors.toastMessage,
      "Query (runjs1) completed."
    );
    cy.verifyToastMessage(
      commonSelectors.toastMessage,
      "Message from codehinder"
    );

    cy.get(commonWidgetSelector.sidebarinspector).click();
    cy.get(".tooltip-inner").invoke("hide");
    verifyNodeData("variables", "Object", "1 entry ");
    openNode("variables", 0);

    verifyValue("var", "String", `"test"`);

    openNode("page");
    openNode("variables", 1);
    verifyValue("pageVar", "String", `"pageTest"`);
  });

  it("should verify styles codehinder", () => {});

  it("should verify component specific codehinder", () => {});
});
