import { fake } from "Fixtures/fake";
import { commonSelectors } from "Selectors/common";
import { postgreSqlSelector } from "Selectors/postgreSql";
import { postgreSqlText } from "Texts/postgreSql";
import { deleteWorkflowAndDS } from "Support/utils/dataSource";
import { dataSourceSelector } from "Selectors/dataSource";
import { harperDbText } from "Texts/harperDb";
import { workflowsText } from "Texts/workflows";
import { workflowSelector } from "Selectors/workflows";
import {
  fillDataSourceTextField,
  selectAndAddDataSource,
} from "Support/utils/postgreSql";

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
    data.wfName = fake.lastName.toLowerCase().replaceAll("[^A-Za-z]", "");
    data.dataSourceName = fake.lastName
      .toLowerCase()
      .replaceAll("[^A-Za-z]", "");
  });

  it("Creating workflows with runjs and validating execution", () => {
    cy.createWorkflowApp(data.wfName);
    cy.fillStartNodeInput();
    cy.dataSourceNode("Run JavaScript code");

    cy.get(workflowSelector.nodeName(workflowsText.runjs)).click({
      force: true,
    });

    cy.get(workflowSelector.inputField(workflowsText.runjsInputField))
      .click({ force: true })
      .realType("return startTrigger.params", { delay: 50 });

    cy.get("body").click(50, 50);
    cy.wait(500);

    cy.connectNodeToResponse(workflowsText.runjs, "return runjs1.data");
    cy.verifyTextInResponseOutput("your value");
    cy.deleteWorkflow(data.wfName);
  });

  it("Creating workflows with postgres and validating execution", () => {
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

    cy.createWorkflowApp(data.wfName);
    cy.fillStartNodeInput();
    cy.dataSourceNode(`cypress-${data.dataSourceName}-manual-pgsql`);
    cy.get(workflowSelector.nodeName(workflowsText.postgresql)).click({
      force: true,
    });

    cy.get(workflowSelector.inputField(workflowsText.pgsqlQueryInputField))
      .click({ force: true })
      .clearAndTypeOnCodeMirror("")
      .realType(
        `SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
AND table_type = 'BASE TABLE';`,
        { delay: 50 }
      );

    cy.get("body").click(50, 50);
    cy.wait(500);

    cy.connectNodeToResponse(
      workflowsText.postgresql,
      "return postgresql1.data"
    );
    cy.verifyTextInResponseOutput("employees");

    deleteWorkflowAndDS(
      data.wfName,
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

    cy.createWorkflowApp(data.wfName);
    cy.fillStartNodeInput();
    cy.dataSourceNode(`cypress-${data.dataSourceName}-restapi`);
    cy.get(workflowSelector.nodeName(workflowsText.restapi)).click({
      force: true,
    });

    cy.get(workflowSelector.inputField(workflowsText.restapiUrlInputField))
      .eq(0)
      .click({ force: true })
      .clearAndTypeOnCodeMirror("")
      .realType(`http://9.234.17.31:8000/delay/10s`, { delay: 50 });

    cy.get("body").click(50, 50);
    cy.wait(500);

    cy.connectNodeToResponse(workflowsText.restapi, "return restapi1.data");
    cy.verifyTextInResponseOutput("<!DOCTYPE html>");
    deleteWorkflowAndDS(data.wfName, `cypress-${data.dataSourceName}-restapi`);
  });

  it("Creating workflows with harperdb and validating execution", () => {
    const Host = Cypress.env("harperdb_host");
    const Port = Cypress.env("harperdb_port");
    const Username = Cypress.env("harperdb_username");
    const Password = Cypress.env("harperdb_password");

    cy.get(commonSelectors.globalDataSourceIcon).click();
    cy.installMarketplacePlugin("HarperDB");

    selectAndAddDataSource(
      "databases",
      harperDbText.harperDb,
      data.dataSourceName
    );

    fillDataSourceTextField(
      harperDbText.hostLabel,
      harperDbText.hostInputPlaceholder,
      Host
    );

    fillDataSourceTextField(
      harperDbText.portLabel,
      harperDbText.portPlaceholder,
      Port
    );

    fillDataSourceTextField(
      harperDbText.userNameLabel,
      harperDbText.userNamePlaceholder,
      Username
    );

    fillDataSourceTextField(
      harperDbText.passwordlabel,
      harperDbText.passwordPlaceholder,
      Password
    );

    cy.get(postgreSqlSelector.buttonTestConnection).click();
    cy.get(postgreSqlSelector.textConnectionVerified, {
      timeout: 10000,
    }).should("have.text", postgreSqlText.labelConnectionVerified);

    cy.get(postgreSqlSelector.buttonSave)
      .verifyVisibleElement("have.text", postgreSqlText.buttonTextSave)
      .click();

    cy.verifyToastMessage(
      commonSelectors.toastMessage,
      postgreSqlText.toastDSSaved
    );

    cy.createWorkflowApp(data.wfName);
    cy.fillStartNodeInput();
    cy.dataSourceNode(`cypress-${data.dataSourceName}-harperdb`);
    cy.get(workflowSelector.nodeName(workflowsText.harperdb)).click({
      force: true,
    });

    cy.get('[data-cy$="-select-dropdown"]').click();

    cy.get(".react-select__menu")
      .should("be.visible")
      .within(() => {
        cy.contains(/sql/i).click();
      });

    cy.get(workflowSelector.inputField(workflowsText.harperdbInputField))
      .click({ force: true })

      .click()
      .clearAndTypeOnCodeMirror("")
      .realType(`SELECT * FROM tooljet_harper.tooljet_table;`, { delay: 50 });

    cy.get("body").click(50, 50);
    cy.wait(500);

    cy.connectNodeToResponse(workflowsText.harperdb, "return harperdb1.data");
    cy.verifyTextInResponseOutput("Test Record 3");

    deleteWorkflowAndDS(data.wfName, `cypress-${data.dataSourceName}-harperdb`);
  });
});
