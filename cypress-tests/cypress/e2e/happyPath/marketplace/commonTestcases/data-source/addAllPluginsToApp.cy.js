import { fake } from "Fixtures/fake";
import { postgreSqlSelector } from "Selectors/postgreSql";
import { postgreSqlText } from "Texts/postgreSql";
import { commonSelectors } from "Selectors/common";

import { selectAndAddDataSource } from "Support/utils/postgreSql";

import { closeDSModal } from "Support/utils/dataSource";

const data = {};
data.dsNamefake = fake.lastName.toLowerCase().replaceAll("[^A-Za-z]", "");
data.dsNamefake1 = fake.lastName.toLowerCase().replaceAll("[^A-Za-z]", "");
const cyParamName = (name) => name.toLowerCase().replace(/[^a-z0-9]/g, "-");

const dataSources = [
  "BigQuery",
  "ClickHouse",
  "CosmosDB",
  "CouchDB",
  "Databricks",
  "DynamoDB",
  "Elasticsearch",
  "Firestore",
  "InfluxDB",
  "MariaDB",
  "MongoDB",
  "SQL Server",
  "MySQL",
  "Oracle DB",
  "PostgreSQL",
  "Redis",
  "RethinkDB",
  "SAP HANA",
  "Snowflake",
  "TypeSense",
  "Airtable",
  "Amazon SES",
  "Appwrite",
  "Amazon Athena",
  "Baserow",
  // "Google Sheets",  need to remove
  "GraphQL",
  // "gRPC",   need to remove
  "Mailgun",
  "n8n",
  "Notion",
  "OpenAPI",
  "REST API",
  "SendGrid",
  // "Slack",  need to remove
  "SMTP",
  "Stripe",
  "Twilio",
  "Woocommerce",
  //"Zendesk", need to remove
  "Azure Blob Storage",
  "GCS",
  "Minio",
  "AWS S3",
];

describe("Add all Data sources to app", () => {
  beforeEach(() => {
    cy.apiLogin();
    cy.defaultWorkspaceLogin();
  });

  it.skip("Should verify global data source page", () => {
    cy.get(commonSelectors.globalDataSourceIcon).click();
    closeDSModal();

    cy.get(postgreSqlSelector.allDatasourceLabelAndCount).should(
      "have.text",
      postgreSqlText.allDataSources()
    );
    cy.get(postgreSqlSelector.commonlyUsedLabelAndCount).should(
      "have.text",
      postgreSqlText.commonlyUsed
    );
    cy.get(postgreSqlSelector.cloudStorageLabelAndCount).should(
      "have.text",
      postgreSqlText.allCloudStorage
    );
  });

  it("Should add all data sources in data source page", () => {
    dataSources.forEach((dsName) => {
      cy.get(commonSelectors.globalDataSourceIcon).click();
      selectAndAddDataSource("databases", dsName, dsName); // Using the correct fake name

      // Test connection
      // cy.get(postgreSqlSelector.buttonTestConnection).click();
      // cy.get(postgreSqlSelector.textConnectionVerified, {
      //   timeout: 10000,
      // }).should("have.text", postgreSqlText.labelConnectionVerified);

      // // Save data source
      // cy.get(postgreSqlSelector.buttonSave).click();
      // cy.verifyToastMessage(
      //   commonSelectors.toastMessage,
      //   `Data Source ${dsName} saved.`
      // );
    });
  });

  it("Should add all data sources in the app", () => {
    cy.get(commonSelectors.dashboardIcon).click();
    cy.get(commonSelectors.appCreateButton).click();
    cy.get(commonSelectors.appNameInput).click().type(data.dsNamefake);
    cy.get(commonSelectors.createAppButton).click();
    cy.skipWalkthrough();

    cy.wrap(dataSources).each((dsName) => {
      cy.get('[data-cy="show-ds-popover-button"]').click();
      cy.get(".css-4e90k9").type(
        `cypress-${cyParamName(dsName)}-${cyParamName(dsName)}`
      );
      cy.wait(500);

      cy.contains(
        `[id*="react-select-"]`,
        `cypress-${cyParamName(dsName)}-${cyParamName(dsName)}`
      )
        .should("be.visible")
        .click();

      cy.wait(500);
    });
  });

  it("Should install all makretplace plugins and add them into the app", () => {
    const dataSourcesMarketplace = [
      "Plivo",
      "GitHub",
      "OpenAI",
      "AWS Textract",
      "HarperDB",
      "AWS Redshift",
      "PocketBase",
      "AWS Lambda",
      "Supabase",
      "Engagespot",
      // "Salesforce", need to remove
      "Presto",
      "Jira",
      // "Sharepoint", need to remove
      "Portkey",
      "Pinecone",
      "Hugging Face",
      "Cohere",
      "Gemini",
      "Mistral",
      "Anthropic",
      "Qdrant",
      "Weaviate DB",
    ];

    cy.get(commonSelectors.globalDataSourceIcon).click();

    cy.window().then((win) => {
      cy.stub(win, "open").callsFake((url) => {
        win.location.href = url;
      });
    });

    cy.get('[data-cy="data-source-add-plugin"]').click();

    cy.get(".marketplace-install").each(($el) => {
      cy.wrap($el).click();
      cy.wait(500);
    });
    cy.wait(1000);
    cy.get(commonSelectors.globalDataSourceIcon).click();
    cy.wait(1000);

    cy.wrap(dataSourcesMarketplace).each((dsName) => {
      cy.get(commonSelectors.globalDataSourceIcon).click();
      selectAndAddDataSource("databases", dsName, dsName);
      cy.wait(500);
    });

    cy.get(commonSelectors.dashboardIcon).click();
    cy.get(commonSelectors.appCreateButton).click();
    cy.get(commonSelectors.appNameInput).click().type(data.dsNamefake1);
    cy.get(commonSelectors.createAppButton).click();
    cy.skipWalkthrough();

    cy.wrap(dataSourcesMarketplace).each((dsName) => {
      cy.get('[data-cy="show-ds-popover-button"]').click();
      cy.get(".css-4e90k9").type(
        `cypress-${cyParamName(dsName)}-${cyParamName(dsName)}`
      );
      cy.wait(500);

      cy.contains(
        `[id*="react-select-"]`,
        `cypress-${cyParamName(dsName)}-${cyParamName(dsName)}`
      )
        .should("be.visible")
        .click();

      cy.wait(500);
    });
  });
});
