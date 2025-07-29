import { fake } from "Fixtures/fake";
import { commonSelectors } from "Selectors/common";
import { postgreSqlSelector } from "Selectors/postgreSql";
import { postgreSqlText } from "Texts/postgreSql";
import { deleteWorkFlowandDatasourceAfterExecution } from "Support/utils/dataSource";
import { dataSourceSelector } from "Selectors/dataSource";
import {
  dataSourceNode,
  verifyTextInResponseOutput,
  connectNodeToResponse,
  createWorkflowApp,
  fillStartNodeInput,
  deleteWorkflow,
  backToWorkFlows,
} from "Support/utils/workFlows";

const data = {};

describe("Workflows with Datasource", () => {
  beforeEach(() => {
    cy.apiLogin();
    cy.visit("/");
    data.appName = fake.lastName.toLowerCase().replaceAll("[^A-Za-z]", "");
    data.dataSourceName = fake.lastName
      .toLowerCase()
      .replaceAll("[^A-Za-z]", "");
  });

  it("Creating workflows with runjs and validating execution", () => {
    cy.createWorkflowApp(data.appName);

    cy.fillStartNodeInput();

    cy.dataSourceNode("Run JavaScript code");

    cy.contains(".title", "runjs1").click({ force: true });

    cy.get('[data-cy="runjs-input-field"] .cm-content[contenteditable="true"]')
      .click({ force: true })
      .realType("return startTrigger.params", { delay: 50 });
    cy.get("body").click(50, 50);
    cy.wait(500);

    cy.connectNodeToResponse("runjs1", "return runjs1.data");

    cy.verifyTextInResponseOutput("your value");
    cy.deleteWorkflow(data.appName);
  });

  it("Creating workflows with postgres with GDS and validating execution", () => {
    cy.get(commonSelectors.globalDataSourceIcon).click();
    cy.apiCreateGDS(
      `${Cypress.env("server_host")}/api/data-sources`,
      `cypress-${data.dataSourceName}-manual-pgsql`,
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
        { key: "ca_cert", value: null, encrypted: true },
        { key: "client_key", value: null, encrypted: true },
        { key: "client_cert", value: null, encrypted: true },
        { key: "root_cert", value: null, encrypted: true },
        { key: "connection_string", value: null, encrypted: true },
      ]
    );
    cy.get(
      dataSourceSelector.dataSourceNameButton(
        `cypress-${data.dataSourceName}-manual-pgsql`
      )
    )
      .should("be.visible")
      .click();
    cy.get(postgreSqlSelector.buttonTestConnection).click();
    cy.get(postgreSqlSelector.textConnectionVerified, {
      timeout: 10000,
    }).should("have.text", postgreSqlText.labelConnectionVerified);
    cy.reload();

    cy.createWorkflowApp(data.appName);

    cy.fillStartNodeInput();

    cy.dataSourceNode(`cypress-${data.dataSourceName}-manual-pgsql`);
    cy.contains(".title", `postgresql1`).click({
      force: true,
    });
    cy.get('[data-cy="query-input-field"]')
      .click({ force: true })
      .clearAndTypeOnCodeMirror(" ")
      .realType(
        `SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
AND table_type = 'BASE TABLE';
`,
        { delay: 50 }
      );
    cy.get("body").click(50, 50);
    cy.wait(500);

    cy.connectNodeToResponse("postgresql1", "return postgresql1.data");

    cy.verifyTextInResponseOutput("employees");

    deleteWorkFlowandDatasourceAfterExecution(
      data.appName,
      `cypress-${data.dataSourceName}-manual-pgsql`
    );
  });

  it("Creating workflows with rest-api and validating execution", () => {
    cy.get(commonSelectors.globalDataSourceIcon).click();
    cy.apiCreateGDS(
      `${Cypress.env("server_host")}/api/data-sources`,
      `cypress-${data.dataSourceName}-restapi`,
      "restapi",
      [
        { key: "url", value: "https://httpbin.org" },
        { key: "auth_type", value: "basic" },
        { key: "grant_type", value: "authorization_code" },
        { key: "add_token_to", value: "header" },
        { key: "header_prefix", value: "Bearer " },
        { key: "access_token_url", value: "" },
        { key: "client_id", value: "" },
        {
          key: "client_secret",
          encrypted: true,
          credential_id: "b044a293-82b4-4381-84fd-d173c86a6a0c",
        },
        { key: "audience", value: "" },
        { key: "scopes", value: "read, write" },
        { key: "username", value: "user", encrypted: false },
        { key: "password", value: "pass", encrypted: true },
        {
          key: "bearer_token",
          encrypted: true,
          credential_id: "21caf3cb-dbde-43c7-9f42-77feffb63062",
        },
        { key: "auth_url", value: "" },
        { key: "client_auth", value: "header" },
        { key: "headers", value: [["", ""]] },
        { key: "custom_query_params", value: [["", ""]], encrypted: false },
        { key: "custom_auth_params", value: [["", ""]] },
        {
          key: "access_token_custom_headers",
          value: [["", ""]],
          encrypted: false,
        },
        { key: "multiple_auth_enabled", value: false, encrypted: false },
        { key: "ssl_certificate", value: "none", encrypted: false },
        { key: "retry_network_errors", value: true, encrypted: false },
        { key: "url_parameters", value: [["", ""]], encrypted: false },
        { key: "tokenData", encrypted: false },
      ]
    );

    cy.createWorkflowApp(data.appName);

    cy.fillStartNodeInput();

    cy.dataSourceNode(`cypress-${data.dataSourceName}-restapi`);
    cy.contains(".title", `restapi1`).click({
      force: true,
    });

    cy.get('[data-cy="-input-field"]')
      .eq(0)
      .click({ force: true })
      .clearAndTypeOnCodeMirror(" ")
      .realType(`http://9.234.17.31:8000/delay/10s`, { delay: 50 });
    cy.get("body").click(50, 50);
    cy.wait(500);

    cy.connectNodeToResponse("restapi1", "return restapi1.data");

    cy.verifyTextInResponseOutput("<!DOCTYPE html>");

    deleteWorkFlowandDatasourceAfterExecution(
      data.appName,
      `cypress-${data.dataSourceName}-restapi`
    );
  });
});
