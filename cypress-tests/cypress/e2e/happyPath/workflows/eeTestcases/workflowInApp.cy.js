import { fake } from "Fixtures/fake";
import { commonSelectors } from "Selectors/common";
import { postgreSqlSelector } from "Selectors/postgreSql";
import { postgreSqlText } from "Texts/postgreSql";
import { deleteDatasource } from "Support/utils/dataSource";
import { dataSourceSelector } from "Selectors/dataSource";
import { harperDbText } from "Texts/harperDb";
import { workflowsText } from "Texts/workflows";
import { workflowSelector } from "Selectors/workflows";

import {
    connectDataSourceNode,
    verifyTextInResponseOutput,
    connectNodeToResponseNode,
  createWorkflowApp,
  fillStartNodeJsonInput,
  deleteAppandWorkflowAfterExecution,
  addWorkflowInApp,
} from "Support/utils/workFlows";

const data = {};

describe("Workflows in apps", () => {
  beforeEach(() => {
    cy.apiLogin();
    cy.visit("/");
    data.wfName = fake.lastName.toLowerCase().replaceAll("[^A-Za-z]", "");
    data.appName = `${data.wfName}-wf-app`; 
    data.dataSourceName = fake.lastName
      .toLowerCase()
      .replaceAll("[^A-Za-z]", "");
  });

  it("Creating workflows with runjs and validating execution in apps", () => {
    createWorkflowApp(data.wfName);
    fillStartNodeJsonInput();
    connectDataSourceNode(workflowsText.runjsNode);

    cy.get(workflowSelector.nodeName(workflowsText.runjs)).click({
      force: true,
    });

    cy.get(workflowSelector.inputField(workflowsText.runjsInputField))
      .click({ force: true })
      .realType(workflowsText.runjsCode, { delay: 50 });

    cy.get("body").click(50, 50);
    cy.wait(500);

    connectNodeToResponseNode(workflowsText.runjs, workflowsText.runjsResponse);
    verifyTextInResponseOutput(workflowsText.runjsExpectedValue);

    cy.apiCreateApp(data.appName);
    cy.openApp();

    addWorkflowInApp(data.wfName)

    cy.get(dataSourceSelector.queryPreviewButton).click();

    // need to change after issue is fixed

    // cy.verifyToastMessage(
    //   commonSelectors.toastMessage,
    //   `Query (${data.dsName}) completed.`
    // );

    deleteAppandWorkflowAfterExecution(data.wfName, data.appName)
  });

  it("Creating workflows with postgres and validating execution in apps", () => {
    const dsName = `cypress-${data.dataSourceName}-manual-pgsql`;

    cy.get(commonSelectors.globalDataSourceIcon).click();
    cy.apiCreateGDS(
      `${Cypress.env("server_host")}/api/data-sources`,
      dsName,
      "postgresql",
      [
        { key: "connection_type", value: "manual", encrypted: false },
        { key: "host", value: Cypress.env("pg_host"), encrypted: false },
        { key: "port", value: 5432, encrypted: false },
        { key: "ssl_enabled", value: false, encrypted: false },
        { key: "database", value: "postgres", encrypted: false },
        { key: "ssl_certificate", value: "none", encrypted: false },
        { key: "username", value: Cypress.env("pg_user"), encrypted: false },
        { key: "password", value: Cypress.env("pg_password"), encrypted: false },
        { key: "ca_cert", value: null, encrypted: true },
        { key: "client_key", value: null, encrypted: true },
        { key: "client_cert", value: null, encrypted: true },
        { key: "root_cert", value: null, encrypted: true },
        { key: "connection_string", value: null, encrypted: true }
      ]
    );

    cy.get(dataSourceSelector.dataSourceNameButton(dsName))
      .should("be.visible")
      .click();
    cy.get(postgreSqlSelector.buttonTestConnection).click();
    cy.get(postgreSqlSelector.textConnectionVerified, { timeout: 10000 })
      .should("have.text", postgreSqlText.labelConnectionVerified);
    cy.reload();

    createWorkflowApp(data.wfName);
    fillStartNodeJsonInput();
    connectDataSourceNode(dsName);

    cy.get(workflowSelector.nodeName(workflowsText.postgresql)).click({ force: true });
    cy.get(workflowSelector.inputField(workflowsText.pgsqlQueryInputField))
      .click({ force: true })
      .clearAndTypeOnCodeMirror("")
      .realType(workflowsText.postgresQuery, { delay: 50 });

    cy.get("body").click(50, 50);
    cy.wait(500);

    connectNodeToResponseNode(workflowsText.postgresql, workflowsText.postgresResponse);
    verifyTextInResponseOutput(workflowsText.postgresExpectedValue);
      

    cy.apiCreateApp(data.appName);
    cy.openApp();

    addWorkflowInApp(data.wfName)

    cy.get(dataSourceSelector.queryPreviewButton).click();

     // need to change after issue is fixed

    // cy.verifyToastMessage(
    //   commonSelectors.toastMessage,
    //   `Query (${data.dsName}) completed.`
    // );
    deleteAppandWorkflowAfterExecution(data.wfName,data.appName)

    deleteDatasource(
      `cypress-${data.dataSourceName}-manual-pgsql`
    );
  });
});

