import { fake } from "Fixtures/fake";
import { commonSelectors } from "Selectors/common";
import { postgreSqlSelector } from "Selectors/postgreSql";
import { postgreSqlText } from "Texts/postgreSql";
import { deleteDatasource} from "Support/utils/dataSource";
import { dataSourceSelector } from "Selectors/dataSource";
import { workflowsText } from "Texts/workflows";
import { workflowSelector } from "Selectors/workflows";
import {
  enterJsonInputInStartNode,
  verifyPreviewOutputText,
  verifyTextInResponseOutputLimited,
  navigateBackToWorkflowsDashboard,
} from "Support/utils/workFlows";

const data = {};

describe("Workflows in apps", () => {
  beforeEach(() => {
    cy.apiLogin();
    cy.visit("/");
    data.workflowName = fake.lastName.toLowerCase().replaceAll("[^A-Za-z]", "");
    data.appName = `${data.workflowName}-wf-app`;
    data.dataSourceName = fake.lastName
      .toLowerCase()
      .replaceAll("[^A-Za-z]", "");
  });

  it("Creating workflows with runjs and validating execution in apps", () => {
    cy.createWorkflowApp(data.workflowName);
    enterJsonInputInStartNode();
    cy.connectDataSourceNode(workflowsText.runjsNodeLabel);

    cy.get(workflowSelector.nodeName(workflowsText.runjs)).click({
      force: true,
    });

    cy.get(workflowSelector.inputField(workflowsText.runjsInputField))
      .click({ force: true })
      .realType(workflowsText.runjsNodeCode, { delay: 50 });

    cy.get("body").click(50, 50);
    cy.wait(500);

    cy.connectNodeToResponseNode(
      workflowsText.runjs,
      workflowsText.responseNodeQuery
    );
    cy.verifyTextInResponseOutput(workflowsText.responseNodeExpectedValueText);

    cy.apiCreateApp(data.appName);
    cy.openApp();

    cy.addWorkflowInApp(data.workflowName);

    cy.get(dataSourceSelector.queryPreviewButton).click();

    // need to change after issue is fixed

    // cy.verifyToastMessage(
    //   commonSelectors.toastMessage,
    //   `Query (${data.dataSourceName}) completed.`
    // );
    cy.backToApps();
    cy.apiDeleteApp();
    cy.apiDeleteWorkflow(data.workflowName);
  });

  it("Creating workflows with postgres and validating execution in apps", () => {
    const dataSourceName = `cypress-${data.dataSourceName}-manual-pgsql`;

    cy.get(commonSelectors.globalDataSourceIcon).click();
    cy.apiCreateGDS(
      `${Cypress.env("server_host")}/api/data-sources`,
      dataSourceName,
      "postgresql",
      [
        { key: "connection_type", value: "manual", encrypted: false },
        { key: "host", value: Cypress.env("pg_host"), encrypted: false },
        { key: "port", value: 5432, encrypted: false },
        { key: "ssl_enabled", value: false, encrypted: false },
        { key: "database", value: "postgres", encrypted: false },
        { key: "ssl_certificate", value: "none", encrypted: false },
        { key: "username", value: Cypress.env("pg_user"), encrypted: false },
        {
          key: "password",
          value: Cypress.env("pg_password"),
          encrypted: false,
        },
        { key: "ca_cert", value: null, encrypted: true },
        { key: "client_key", value: null, encrypted: true },
        { key: "client_cert", value: null, encrypted: true },
        { key: "root_cert", value: null, encrypted: true },
        { key: "connection_string", value: null, encrypted: true },
      ]
    );

    cy.get(dataSourceSelector.dataSourceNameButton(dataSourceName))
      .should("be.visible")
      .click();
    cy.get(postgreSqlSelector.buttonTestConnection).click();
    cy.get(postgreSqlSelector.textConnectionVerified, {
      timeout: 10000,
    }).should("have.text", postgreSqlText.labelConnectionVerified);
    cy.reload();

    cy.apiCreateWorkflow(data.workflowName)
    cy.openWorkflow();
    enterJsonInputInStartNode();
    cy.connectDataSourceNode(dataSourceName);

    cy.get(workflowSelector.nodeName(workflowsText.postgresqlNodeName)).click({
      force: true,
    });
    cy.get(workflowSelector.inputField(workflowsText.pgsqlQueryInputField))
      .click({ force: true })
      .clearAndTypeOnCodeMirror("")
      .realType(workflowsText.postgresNodeQuery, { delay: 50 });

    cy.get("body").click(50, 50);
    cy.wait(500);

    cy.connectNodeToResponseNode(
      workflowsText.postgresqlNodeName,
      workflowsText.postgresResponseNodeQuery
    );
    verifyTextInResponseOutputLimited(workflowsText.postgresExpectedValue);

    cy.apiCreateApp(data.appName);
    cy.openApp();

    cy.addWorkflowInApp(data.workflowName);

    cy.get(dataSourceSelector.queryPreviewButton).click();

    // need to change after issue is fixed

    // cy.verifyToastMessage(
    //   commonSelectors.toastMessage,
    //   `Query (${data.dataSourceName}) completed.`
    // );
    cy.backToApps();
    cy.apiDeleteApp();
    cy.apiDeleteWorkflow(data.workflowName);

    deleteDatasource(`cypress-${data.dataSourceName}-manual-pgsql`);
  });
});
