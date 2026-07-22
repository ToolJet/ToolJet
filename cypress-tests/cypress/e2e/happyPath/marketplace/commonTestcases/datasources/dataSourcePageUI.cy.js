import { commonSelectors } from "Selectors/common";
import { dataSourceSelector } from "Constants/selectors/dataSource";
import { dataSourceText } from "Texts/dataSource";
import { restAPIText } from "Texts/restAPI";
import { mongoDbText } from "Texts/mongoDb";
import { airtableText } from "Texts/airTable";

const closeDSModal = () => {
  cy.get("body").then(($body) => {
    cy.wait(500);
    if (
      $body.find('[data-cy="button-close-ds-connection-modal"]> img').length > 0
    ) {
      cy.get('[data-cy="button-close-ds-connection-modal"]').realClick();
      closeDSModal();
    }
  });
};

describe("Data Sources Page", () => {
  beforeEach(() => {
    cy.apiLogin();
    cy.viewport(1400, 1600);
  });

  it("Should verify data sources page loads with correct UI elements and data source details", () => {
    cy.visit("/");
    cy.get(commonSelectors.globalDataSourceIcon).click();
    closeDSModal();

    cy.get(dataSourceSelector.allDatasourceLabelAndCount).should(
      "have.text",
      dataSourceText.allDataSources()
    );
    cy.get(dataSourceSelector.commonDsLabelAndCount).should(
      "have.text",
      dataSourceText.commonlyUsed
    );
    cy.get(dataSourceSelector.databaseLabelAndCount).should(
      "have.text",
      dataSourceText.allDatabase()
    );
    cy.get(dataSourceSelector.apiLabelAndCount).should(
      "have.text",
      dataSourceText.allApis
    );
    cy.get(dataSourceSelector.cloudStorageLabelAndCount).should(
      "have.text",
      dataSourceText.allCloudStorage
    );

    // "Commonly used" is built from a fixed manifest list (see
    // frontend/src/modules/common/components/DataSourceComponents/index.js), so
    // these data sources are always present regardless of installed plugins.
    const commonlyUsedDataSources = [
      { selector: dataSourceSelector.restApiDataSource, title: restAPIText.restAPI },
      { selector: dataSourceSelector.postgresDataSource, title: dataSourceText.postgreSQL },
      { selector: dataSourceSelector.mongodbDataSource, title: mongoDbText.mongoDb },
      { selector: dataSourceSelector.snowflakeDataSource, title: "Snowflake" },
      { selector: dataSourceSelector.airtableDataSource, title: airtableText.airtable },
    ];

    commonlyUsedDataSources.forEach(({ selector, title }) => {
      cy.get(selector)
        .first()
        .scrollIntoView()
        .within(() => {
          cy.get(dataSourceSelector.dataSourceCardIcon(title)).should("exist");
          cy.get(dataSourceSelector.dataSourceCardTitle(title)).should(
            "have.text",
            title
          );
        });
    });
  });
});

/*
 * Test Cases for Data Sources Page
 * ========================
 *
 * TC_001: Verify data sources page loads with correct UI elements and data source details
 *   - Pre-condition: Logged-in user with access to the workspace's data sources page
 *   - Steps: Navigate to home → Click global data source icon → Verify data source
 *     category counts → Locate each commonly-used data source's card (REST API,
 *     PostgreSQL, MongoDB, Snowflake, Airtable) → Verify icon and title on each card
 *   - Expected:
 *     - Data source list header shows correct count (e.g., "All data sources (47)")
 *     - Category buttons show correct counts: Commonly used (6), Databases (18/20),
 *       APIs (24), Cloud Storages (4)
 *     - Each commonly-used data source's card renders its icon and correct title text,
 *       with no missing or blank fields
 *   - Fields verified: datasource-list-header, commonlyused/databases/apis/cloudstorage
 *     -datasource-button, data-source-{name} card icon and title
 */
