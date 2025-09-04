import { fake } from "Fixtures/fake";
import { commonSelectors } from "Selectors/common";
import { postgreSqlSelector } from "Selectors/postgreSql";
import { postgreSqlText } from "Texts/postgreSql";
import { deleteWorkflowAndDS } from "Support/utils/dataSource";
import { dataSourceSelector } from "Selectors/dataSource";
import { workflowsText } from "Texts/workflows";
import { workflowSelector } from "Selectors/workflows";

import {
  createWorkflowApp,
  fillStartNodeJsonInput,
  connectDataSourceNode,
  connectNodeToResponseNode,
  verifyTextInResponseOutput,
  deleteWorkflow,
  importWorkflowApp,
  exportWorkflowApp,
} from "Support/utils/workFlows";

const data = {};

describe("Workflows Export/Import Sanity", () => {
  beforeEach(() => {
    cy.apiLogin();
    cy.visit("/");
    data.wfName = fake.lastName.toLowerCase().replaceAll("[^A-Za-z]", "");
    data.dataSourceName = fake.lastName
      .toLowerCase()
      .replaceAll("[^A-Za-z]", "");
  });

  it("RunJS workflow - execute, export/import, re-execute", () => {
    const wfName = `${data.wfName}-runjs`;

    createWorkflowApp(wfName);
    fillStartNodeJsonInput();
    connectDataSourceNode(workflowsText.runjsNode);

    cy.get(workflowSelector.nodeName(workflowsText.runjs)).click({ force: true });

    cy.get(workflowSelector.inputField(workflowsText.runjsInputField))
      .click({ force: true })
      .realType(workflowsText.runjsCode, { delay: 50 });

    cy.get("body").click(50, 50);
    cy.wait(500);

    connectNodeToResponseNode(workflowsText.runjs, workflowsText.runjsResponse);
    verifyTextInResponseOutput(workflowsText.runjsExpectedValue);

    exportWorkflowApp(wfName);

    importWorkflowApp(wfName, workflowsText.exportFixture);
    verifyTextInResponseOutput(workflowsText.runjsExpectedValue);

    deleteWorkflow(wfName);
    cy.task("deleteFile", workflowsText.exportFixture);
  });

  it("Postgres workflow - execute, export/import, re-execute", () => {
    const wfName = `${data.wfName}-pg`;
    const dsName = `cypress-${data.dataSourceName}-manual-pgsql`;

    cy.get(commonSelectors.globalDataSourceIcon).click();
    cy.apiCreateGDS(
      `${Cypress.env("server_host")}/api/data-sources`,
      dsName,
      "postgresql",
      [
        { key: "connection_type", value: "manual", encrypted: false },
        { key: "host", value: `${Cypress.env("pg_host")}`, encrypted: false },
        { key: "port", value: 5432, encrypted: false },
        { key: "ssl_enabled", value: false, encrypted: false },
        { key: "database", value: "postgres", encrypted: false },
        { key: "ssl_certificate", value: "none", encrypted: false },
        { key: "username", value: `${Cypress.env("pg_user")}`, encrypted: false },
        { key: "password", value: `${Cypress.env("pg_password")}`, encrypted: false },
      ]
    );

    cy.get(dataSourceSelector.dataSourceNameButton(dsName))
      .should("be.visible")
      .click();

    cy.get(postgreSqlSelector.buttonTestConnection).click();
    cy.get(postgreSqlSelector.textConnectionVerified, { timeout: 10000 })
      .should("have.text", postgreSqlText.labelConnectionVerified);

    cy.reload();

    createWorkflowApp(wfName);
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

    exportWorkflowApp(wfName);

    importWorkflowApp(wfName, workflowsText.exportFixture);
    verifyTextInResponseOutput(workflowsText.postgresExpectedValue);

    deleteWorkflowAndDS(wfName, dsName);
    cy.task("deleteFile", workflowsText.exportFixture);
  });
});
