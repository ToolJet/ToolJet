import { fake } from "Fixtures/fake";
import { commonSelectors } from "Selectors/common";
import { postgreSqlSelector } from "Selectors/marketplace/postgreSql";
import { postgreSqlText } from "Texts/marketplace/postgreSql";
import { harperDbText } from "Texts/marketplace/harperDb";
import { workflowsText } from "Texts/platform/workflows";
import { workflowSelector } from "Selectors/platform/workflows";
import {
  fillDataSourceTextField,
  selectAndAddDataSource,
} from "Support/utils/marketplace/datasources/postgreSql";
import {
  buildLinearWorkflow,
  createPostgresDataSource,
  createRestApiDataSource,
  enterJsonInputInStartNode,
  testDataSourceConnection,
  verifyTextInResponseOutputLimited,
  cleanupWorkflows,
  cleanupDataSources,
} from "Support/utils/workFlows";

// A query node executes against its data source and its result reaches the
// response node. One case per supported data source — the wiring is identical,
// only the connector differs, so buildLinearWorkflow carries the shared shape.
//
// These cases need provisioned external data sources. A failure here is as
// likely to be environment as product; check the connection step first.
const data = {};

describe("Workflows - query node execution per data source", () => {
  beforeEach(() => {
    cy.apiLogin();
    cy.visit("/");
    data.workflowName = fake.lastName.toLowerCase().replaceAll("[^A-Za-z]", "");
    data.dataSourceName = fake.lastName
      .toLowerCase()
      .replaceAll("[^A-Za-z]", "");
  });

  // Teardown runs here so a test that fails part-way still cleans up — a leaked
  // workflow or data source breaks later specs on the same instance. Workflows
  // go first: a data source still used by a workflow query can't be deleted.
  afterEach(() => {
    cleanupWorkflows([data.workflowName]);
    cleanupDataSources(
      ["manual-pgsql", "restapi", "harperdb"].map(
        (kind) => `cypress-${data.dataSourceName}-${kind}`
      )
    );
  });

  it("A RunJS query node executes and its result reaches the response node", () => {
    cy.apiCreateWorkflow(data.workflowName);
    cy.openWorkflow();

    buildLinearWorkflow({
      blockLabel: workflowsText.runjsNodeLabel,
      nodeName: workflowsText.runjs,
      inputField: workflowsText.runjsInputField,
      query: workflowsText.runjsNodeCode,
      responseReturn: workflowsText.responseNodeQuery,
    });

    cy.verifyTextInResponseOutput(workflowsText.responseNodeExpectedValueText);
  });

  it("A Postgres query node executes and its rows reach the response node", () => {
    const dataSourceName = `cypress-${data.dataSourceName}-manual-pgsql`;
    createPostgresDataSource(dataSourceName);

    cy.apiCreateWorkflow(data.workflowName);
    cy.openWorkflow();

    buildLinearWorkflow({
      blockLabel: dataSourceName,
      nodeName: workflowsText.postgresqlNodeName,
      inputField: workflowsText.pgsqlQueryInputField,
      query: workflowsText.postgresNodeQuery,
      responseReturn: workflowsText.postgresResponseNodeQuery,
      clearBeforeTyping: true,
    });

    verifyTextInResponseOutputLimited(workflowsText.postgresExpectedValue);
  });

  it("A REST API query node executes and its response body reaches the response node", () => {
    const dataSourceName = `cypress-${data.dataSourceName}-restapi`;
    createRestApiDataSource(dataSourceName);

    cy.apiCreateWorkflow(data.workflowName);
    cy.openWorkflow();

    buildLinearWorkflow({
      blockLabel: dataSourceName,
      nodeName: workflowsText.restapiNodeName,
      inputField: workflowsText.restapiUrlInputField,
      query: workflowsText.restApiUrl,
      responseReturn: workflowsText.restApiResponseNodeQuery,
      clearBeforeTyping: true,
      // More than one element matches the URL field selector.
      fieldIndex: 0,
    });

    cy.verifyTextInResponseOutput(workflowsText.restApiExpectedValue);
  });

  it("A HarperDB query node executes and its rows reach the response node", () => {
    const dataSourceName = `cypress-${data.dataSourceName}-harperdb`;

    // HarperDB is a marketplace plugin, so it has to be installed and
    // configured through the UI rather than created over the API.
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
      Cypress.env("harperdb_host")
    );
    fillDataSourceTextField(
      harperDbText.portLabel,
      harperDbText.portPlaceholder,
      Cypress.env("harperdb_port")
    );
    fillDataSourceTextField(
      harperDbText.userNameLabel,
      harperDbText.userNamePlaceholder,
      Cypress.env("harperdb_username")
    );
    fillDataSourceTextField(
      harperDbText.passwordlabel,
      harperDbText.passwordPlaceholder,
      Cypress.env("harperdb_password")
    );

    testDataSourceConnection();

    cy.get(postgreSqlSelector.buttonSave)
      .verifyVisibleElement("have.text", postgreSqlText.buttonTextSave)
      .click();
    cy.verifyToastMessage(
      commonSelectors.toastMessage,
      postgreSqlText.toastDSSaved
    );

    cy.apiCreateWorkflow(data.workflowName);
    cy.openWorkflow();

    // HarperDB nodes need an operation picked before the query field appears,
    // which is why this one cannot use buildLinearWorkflow wholesale.
    enterJsonInputInStartNode();
    cy.connectDataSourceNode(dataSourceName);
    cy.get(workflowSelector.nodeName(workflowsText.harperdbNodeName)).click({
      force: true,
    });
    cy.get('[data-cy$="-select-dropdown"]').click();
    cy.get(".react-select__menu")
      .should("be.visible")
      .within(() => {
        cy.contains(workflowsText.harperDbNode).click();
      });

    cy.get(workflowSelector.inputField(workflowsText.harperdbInputField))
      .click({ force: true })
      .clearAndTypeOnCodeMirror("")
      .realType(workflowsText.harperDbNodeQuery, { delay: 50 });

    cy.get("body").click(50, 50);
    cy.wait(500);

    cy.connectNodeToResponseNode(
      workflowsText.harperdbNodeName,
      workflowsText.harperDbResponseNodeQuery
    );
    cy.verifyTextInResponseOutput(workflowsText.harperDbExpectedValue);
  });
});
