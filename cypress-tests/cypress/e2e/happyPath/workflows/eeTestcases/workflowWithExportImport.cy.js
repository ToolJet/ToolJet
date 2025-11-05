import { fake } from "Fixtures/fake";
import { commonSelectors } from "Selectors/common";
import { postgreSqlSelector } from "Selectors/postgreSql";
import { postgreSqlText } from "Texts/postgreSql";
import { deleteWorkflowAndDS,deleteDatasource } from "Support/utils/dataSource";
import { dataSourceSelector } from "Selectors/dataSource";
import { workflowsText } from "Texts/workflows";
import { workflowSelector } from "Selectors/workflows";

import {
  enterJsonInputInStartNode,
  importWorkflowApp,
  verifyTextInResponseOutputLimited,
  navigateBackToWorkflowsDashboard
} from "Support/utils/workFlows";

const data = {};

describe("Workflows Export/Import Sanity", () => {
  beforeEach(() => {
    cy.apiLogin();
    cy.visit("/");
    data.workflowName = fake.lastName.toLowerCase().replaceAll("[^A-Za-z]", "");
    data.dataSourceName = fake.lastName
      .toLowerCase()
      .replaceAll("[^A-Za-z]", "");
  });

  it("RunJS workflow - execute, export/import, re-execute", () => {
    const workflowName = `${data.workflowName}-runjs`;

    cy.createWorkflowApp(workflowName);
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

    cy.exportWorkflowApp(workflowName);
    cy.apiDeleteWorkflow(workflowName);
    importWorkflowApp(workflowName, workflowsText.exportFixturePath);
    cy.verifyTextInResponseOutput(workflowsText.responseNodeExpectedValueText);
    cy.apiDeleteWorkflow(workflowName);
    cy.task("deleteFile", workflowsText.exportFixturePath);
  });

  it("Postgres workflow - execute, export/import, re-execute", () => {
    const workflowName = `${data.workflowName}-pg`;
    const dataSourceName = `cypress-${data.dataSourceName}-manual-pgsql`;

    cy.get(commonSelectors.globalDataSourceIcon).click();
    cy.apiCreateGDS(
      `${Cypress.env("server_host")}/api/data-sources`,
      dataSourceName,
      "postgresql",
      [
        { key: "connection_type", value: "manual", encrypted: false },
        { key: "host", value: `${Cypress.env("pg_host")}`, encrypted: false },
        { key: "port", value: 5432, encrypted: false },
        { key: "ssl_enabled", value: false, encrypted: false },
        { key: "database", value: "postgres", encrypted: false },
        { key: "ssl_certificate", value: "none", encrypted: false },
        {
          key: "username",
          value: `${Cypress.env("pg_user")}`,
          encrypted: false,
        },
        {
          key: "password",
          value: `${Cypress.env("pg_password")}`,
          encrypted: false,
        },
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

    cy.exportWorkflowApp(workflowName);
    cy.apiDeleteWorkflow(workflowName);
    importWorkflowApp(workflowName, workflowsText.exportFixturePath);
    verifyTextInResponseOutputLimited(workflowsText.postgresExpectedValue);
    
    cy.apiDeleteWorkflow(workflowName);

    cy.apiDeleteGDS(dataSourceName);
    cy.task("deleteFile", workflowsText.exportFixturePath);
  });
});
