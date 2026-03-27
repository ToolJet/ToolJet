import { fake } from "Fixtures/fake";
import { dsCommonSelector } from "Selectors/marketplace/common";
import { verifyConnectionFormUI } from "Support/utils/marketplace/dataSource/dataSourceFormUIHelpers";
import { fillDSConnectionForm, verifyDSConnection } from "Support/utils/marketplace/dataSource/dataSourceFormFillHelpers";
import { athenaUIConfig, athenaFormConfig } from "Constants/constants/marketplace/datasources/athena";

const data = {};

describe("Amazon Athena", () => {
    data.dataSourceName = fake.lastName
        .toLowerCase()
        .replaceAll("[^A-Za-z]", "");
    const athenaDataSourceName = `cypress-${data.dataSourceName}-athena`;
    beforeEach(() => {
        cy.apiLogin();
        cy.viewport(1400, 1600);
        cy.on("uncaught:exception", () => false);
    });

    afterEach(() => {
        cy.apiDeleteDataSource(athenaDataSourceName);
    });

    it("1. Amazon Athena - Verify connection form UI elements - ALL FIELDS", () => {
        cy.apiCreateDataSource(
            `${Cypress.env("server_host")}/api/data-sources`,
            `${athenaDataSourceName}`,
            "athena",
            [
                { key: "database", value: "", encrypted: false },
                { key: "output_location", value: "", encrypted: false },
                { key: "access_key", value: "", encrypted: false },
                { key: "secret_key", value: null, encrypted: true },
                { key: "region", value: "", encrypted: false },
            ]
        );
        cy.visit('/my-workspace/data-sources');
        cy.waitForElement(dsCommonSelector.dataSourceNameButton(athenaDataSourceName));
        cy.get(dsCommonSelector.dataSourceNameButton(athenaDataSourceName)).click();
        verifyConnectionFormUI(athenaUIConfig.defaultFields);
    });

    it("2. Amazon Athena - Verify data source connection with valid credentials", () => {
        cy.apiCreateDataSource(
            `${Cypress.env("server_host")}/api/data-sources`,
            `${athenaDataSourceName}`,
            "athena",
            [
                { key: "database", value: "", encrypted: false },
                { key: "output_location", value: "", encrypted: false },
                { key: "access_key", value: "", encrypted: false },
                { key: "secret_key", value: null, encrypted: true },
                { key: "region", value: "", encrypted: false },
            ]
        );
        cy.visit('/my-workspace/data-sources');
        cy.waitForElement(dsCommonSelector.dataSourceNameButton(athenaDataSourceName));
        cy.get(dsCommonSelector.dataSourceNameButton(athenaDataSourceName)).click();

        fillDSConnectionForm(athenaFormConfig, []);

        verifyDSConnection();
    });

    it("3. Amazon Athena - Verify UI and connection together", () => {
        cy.apiCreateDataSource(
            `${Cypress.env("server_host")}/api/data-sources`,
            `${athenaDataSourceName}`,
            "athena",
            [
                { key: "database", value: "", encrypted: false },
                { key: "output_location", value: "", encrypted: false },
                { key: "access_key", value: "", encrypted: false },
                { key: "secret_key", value: null, encrypted: true },
                { key: "region", value: "", encrypted: false },
            ]
        );
        cy.visit('/my-workspace/data-sources');
        cy.waitForElement(dsCommonSelector.dataSourceNameButton(athenaDataSourceName));
        cy.get(dsCommonSelector.dataSourceNameButton(athenaDataSourceName)).click();

        verifyConnectionFormUI(athenaUIConfig.defaultFields);

        fillDSConnectionForm(athenaFormConfig, athenaFormConfig.invalidAccessKey);
        verifyDSConnection("failed", "The security token included in the request is invalid");

        fillDSConnectionForm(athenaFormConfig, athenaFormConfig.invalidSecretKey);
        verifyDSConnection("failed", "The request signature we calculated does not match");
    });
});

/*
 * Test Cases for Amazon Athena
 * ============================
 *
 * TC_001: Verify connection form UI elements
 *   - Pre-condition: Data source created via API with default options (database, output_location, access_key, secret_key, region)
 *   - Steps: Navigate to data sources page -> Click on athena data source -> Verify all form fields
 *   - Expected: All field labels, placeholders, default values, and states match manifest
 *   - Fields verified: Database, S3 output location, Access key, Secret key, Region
 *
 * TC_002: Verify data source connection with valid credentials
 *   - Pre-condition: Data source created via API
 *   - Steps: Navigate -> Fill valid credentials via fillDSConnectionForm -> Test connection
 *   - Expected: Toast "Test connection verified"
 *   - Credentials: amazonathena_DbName, amazonathena_accessKey, amazonathena_secretKey
 *
 * TC_003: Verify UI and connection together
 *   - Pre-condition: Data source created via API
 *   - Steps: Navigate -> Verify UI fields -> Test with invalid access key -> Test with invalid secret key
 *   - Expected: UI fields match manifest; each invalid field produces appropriate error:
 *     - Invalid access key: "The security token included in the request is invalid"
 *     - Invalid secret key: "The request signature we calculated does not match"
 */
