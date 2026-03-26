import { fake } from "Fixtures/fake";
import { dsCommonSelector } from "Selectors/marketplace/common";
import { verifyConnectionFormUI } from "Support/utils/marketplace/dataSource/dataSourceFormUIHelpers";
import { fillDSConnectionForm, verifyDSConnection } from "Support/utils/marketplace/dataSource/dataSourceFormFillHelpers";
import { s3UIConfig, s3FormConfig } from "Constants/constants/marketplace/datasources/s3";

const data = {};

describe("AWS S3", () => {
    data.dataSourceName = fake.lastName
        .toLowerCase()
        .replaceAll("[^A-Za-z]", "");
    const s3DataSourceName = `cypress-${data.dataSourceName}-s3`;
    beforeEach(() => {
        cy.apiLogin();
        cy.viewport(1400, 1600);
        cy.on("uncaught:exception", () => false);
    });

    afterEach(() => {
        cy.apiDeleteDataSource(s3DataSourceName);
    });

    it("1. AWS S3 - Verify connection form UI elements - ALL FIELDS", () => {
        cy.apiCreateDataSource(
            `${Cypress.env("server_host")}/api/data-sources`,
            `${s3DataSourceName}`,
            "s3",
            [
                { key: "instance_metadata_credentials", value: "iam_access_keys", encrypted: false },
                { key: "access_key", value: "", encrypted: false },
                { key: "secret_key", value: null, encrypted: true },
                { key: "region", value: "", encrypted: false },
                { key: "endpoint", value: "", encrypted: false },
                { key: "endpoint_enabled", value: false, encrypted: false },
            ]
        );
        cy.visit('/my-workspace/data-sources');
        cy.waitForElement(dsCommonSelector.dataSourceNameButton(s3DataSourceName));
        cy.get(dsCommonSelector.dataSourceNameButton(s3DataSourceName)).click();
        verifyConnectionFormUI(s3UIConfig.defaultFields);
    });

    it("2. AWS S3 - Verify data source connection with valid credentials", () => {
        cy.apiCreateDataSource(
            `${Cypress.env("server_host")}/api/data-sources`,
            `${s3DataSourceName}`,
            "s3",
            [
                { key: "instance_metadata_credentials", value: "iam_access_keys", encrypted: false },
                { key: "access_key", value: "", encrypted: false },
                { key: "secret_key", value: null, encrypted: true },
                { key: "region", value: "", encrypted: false },
                { key: "endpoint", value: "", encrypted: false },
                { key: "endpoint_enabled", value: false, encrypted: false },
            ]
        );
        cy.visit('/my-workspace/data-sources');
        cy.waitForElement(dsCommonSelector.dataSourceNameButton(s3DataSourceName));
        cy.get(dsCommonSelector.dataSourceNameButton(s3DataSourceName)).click();

        fillDSConnectionForm(s3FormConfig, []);

        verifyDSConnection();
    });

    it("3. AWS S3 - Verify UI and connection together", () => {
        cy.apiCreateDataSource(
            `${Cypress.env("server_host")}/api/data-sources`,
            `${s3DataSourceName}`,
            "s3",
            [
                { key: "instance_metadata_credentials", value: "iam_access_keys", encrypted: false },
                { key: "access_key", value: "", encrypted: false },
                { key: "secret_key", value: null, encrypted: true },
                { key: "region", value: "", encrypted: false },
                { key: "endpoint", value: "", encrypted: false },
                { key: "endpoint_enabled", value: false, encrypted: false },
            ]
        );
        cy.visit('/my-workspace/data-sources');
        cy.waitForElement(dsCommonSelector.dataSourceNameButton(s3DataSourceName));
        cy.get(dsCommonSelector.dataSourceNameButton(s3DataSourceName)).click();

        verifyConnectionFormUI(s3UIConfig.defaultFields);

        fillDSConnectionForm(s3FormConfig, s3FormConfig.invalidAccessKey);
        verifyDSConnection("failed", "The AWS Access Key Id you provided does not exist in our records.");

        fillDSConnectionForm(s3FormConfig, s3FormConfig.invalidSecretKey);
        verifyDSConnection("failed", "The request signature we calculated does not match the signature you provided.");
    });
});
