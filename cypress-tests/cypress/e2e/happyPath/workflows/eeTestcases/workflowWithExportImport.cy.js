import { fake } from "Fixtures/fake";
import { commonSelectors } from "Selectors/common";
import { postgreSqlSelector } from "Selectors/postgreSql";
import { postgreSqlText } from "Texts/postgreSql";
import { deleteWorkflowAndDS } from "Support/utils/dataSource";
import { dataSourceSelector } from "Selectors/dataSource";
import { workflowsText } from "Texts/workflows";
import { workflowSelector } from "Selectors/workflows";

import {
  enterJsonInputInStartNode,
  importWorkflowApp,
  verifyTextInResponseOutputLimited,
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

    cy.createWorkflowApp(wfName);
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

    cy.exportWorkflowApp(wfName);

    importWorkflowApp(wfName, workflowsText.exportFixturePath);
    cy.verifyTextInResponseOutput(workflowsText.responseNodeExpectedValueText);

    cy.deleteWorkflow(wfName);
    cy.task("deleteFile", workflowsText.exportFixturePath);
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

    cy.get(dataSourceSelector.dataSourceNameButton(dsName))
      .should("be.visible")
      .click();

    cy.get(postgreSqlSelector.buttonTestConnection).click();
    cy.get(postgreSqlSelector.textConnectionVerified, {
      timeout: 10000,
    }).should("have.text", postgreSqlText.labelConnectionVerified);

    cy.reload();

    cy.createWorkflowApp(wfName);
    enterJsonInputInStartNode();
    cy.connectDataSourceNode(dsName);

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
    cy.verifyTextInResponseOutput(workflowsText.postgresExpectedValue);

    cy.exportWorkflowApp(wfName);

    importWorkflowApp(wfName, workflowsText.exportFixturePath);
    verifyTextInResponseOutputLimited(workflowsText.postgresExpectedValue);

    deleteWorkflowAndDS(wfName, dsName);
    cy.task("deleteFile", workflowsText.exportFixturePath);
  });
});
