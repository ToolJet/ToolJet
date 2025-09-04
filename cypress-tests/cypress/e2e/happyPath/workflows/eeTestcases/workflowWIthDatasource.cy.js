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
  connectDataSourceNode,
  verifyTextInResponseOutput,
  connectNodeToResponseNode,
  createWorkflowApp,
  fillStartNodeJsonInput,
  deleteWorkflow,
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

  it("RunJS workflow - execute and validate", () => {
    createWorkflowApp(data.wfName);
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

    deleteWorkflow(data.wfName);
  });

  it("Postgres workflow - execute and validate", () => {
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

    deleteWorkflowAndDS(data.wfName, dsName);
  });

  it("REST API workflow - execute and validate", () => {
    const dsName = `cypress-${data.dataSourceName}-restapi`;

    cy.apiCreateGDS(
      `${Cypress.env("server_host")}/api/data-sources`,
      dsName,
      "restapi",
      [
        { key: "url", value: "https://jsonplaceholder.typicode.com" },
        { key: "auth_type", value: "none" },
        { key: "grant_type", value: "authorization_code" },
        { key: "add_token_to", value: "header" },
        { key: "header_prefix", value: "Bearer " },
        { key: "access_token_url", value: "" },
        { key: "client_id", value: "" },
        { key: "client_secret", value: "", encrypted: true },
        { key: "audience", value: "" },
        { key: "scopes", value: "read, write" },
        { key: "username", value: "", encrypted: false },
        { key: "password", value: "", encrypted: true },
        { key: "bearer_token", value: "", encrypted: true },
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
      ]
    );
    cy.reload();
    createWorkflowApp(data.wfName);
    fillStartNodeJsonInput();
    connectDataSourceNode(dsName);

    cy.get(workflowSelector.nodeName(workflowsText.restapi)).click({ force: true });
    cy.get(workflowSelector.inputField(workflowsText.restapiUrlInputField))
      .eq(0)
      .click({ force: true })
      .clearAndTypeOnCodeMirror("")
      .realType(workflowsText.restApiUrl, { delay: 50 });

    cy.get("body").click(50, 50);
    cy.wait(500);

    connectNodeToResponseNode(workflowsText.restapi, workflowsText.restApiResponse);
    verifyTextInResponseOutput(workflowsText.restApiExpectedValue);

    deleteWorkflowAndDS(data.wfName, dsName);
  });

  it("HarperDB workflow - execute and validate", () => {
    const dsName = `cypress-${data.dataSourceName}-harperdb`;
    const Host = Cypress.env("harperdb_host");
    const Port = Cypress.env("harperdb_port");
    const Username = Cypress.env("harperdb_username");
    const Password = Cypress.env("harperdb_password");

    cy.get(commonSelectors.globalDataSourceIcon).click();
    cy.installMarketplacePlugin(workflowsText.harperDbPlugin);

    selectAndAddDataSource("databases", harperDbText.harperDb, data.dataSourceName);

    fillDataSourceTextField(harperDbText.hostLabel, harperDbText.hostInputPlaceholder, Host);
    fillDataSourceTextField(harperDbText.portLabel, harperDbText.portPlaceholder, Port);
    fillDataSourceTextField(harperDbText.userNameLabel, harperDbText.userNamePlaceholder, Username);
    fillDataSourceTextField(harperDbText.passwordlabel, harperDbText.passwordPlaceholder, Password);

    cy.get(postgreSqlSelector.buttonTestConnection).click();
    cy.get(postgreSqlSelector.textConnectionVerified, { timeout: 10000 })
      .should("have.text", postgreSqlText.labelConnectionVerified);

    cy.get(postgreSqlSelector.buttonSave)
      .verifyVisibleElement("have.text", postgreSqlText.buttonTextSave)
      .click();

    cy.verifyToastMessage(commonSelectors.toastMessage, postgreSqlText.toastDSSaved);

    createWorkflowApp(data.wfName);
    fillStartNodeJsonInput();
    connectDataSourceNode(dsName);

    cy.get(workflowSelector.nodeName(workflowsText.harperdb)).click({ force: true });
    cy.get('[data-cy$="-select-dropdown"]').click();

    cy.get(".react-select__menu").should("be.visible").within(() => {
      cy.contains(workflowsText.harperDbMode).click();
    });

    cy.get(workflowSelector.inputField(workflowsText.harperdbInputField))
      .click({ force: true })
      .clearAndTypeOnCodeMirror("")
      .realType(workflowsText.harperDbQuery, { delay: 50 });

    cy.get("body").click(50, 50);
    cy.wait(500);

    connectNodeToResponseNode(workflowsText.harperdb, workflowsText.harperDbResponse);
    verifyTextInResponseOutput(workflowsText.harperDbExpectedValue);

    deleteWorkflowAndDS(data.wfName, dsName);
  });
});
