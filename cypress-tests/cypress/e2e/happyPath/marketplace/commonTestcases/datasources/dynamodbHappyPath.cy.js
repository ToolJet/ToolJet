import { fake } from "Fixtures/fake";
import { dsCommonSelector } from "Selectors/marketplace/common";
import { verifyConnectionFormUI } from "Support/utils/marketplace/dataSource/dataSourceFormUIHelpers";
import { fillDSConnectionForm, verifyDSConnection } from "Support/utils/marketplace/dataSource/dataSourceFormFillHelpers";
import { dynamodbUIConfig, dynamodbFormConfig } from "Constants/constants/marketplace/datasources/dynamodb";

const data = {};

describe("DynamoDB", () => {
    data.dataSourceName = fake.lastName
        .toLowerCase()
        .replaceAll("[^A-Za-z]", "");
    const dynamodbDataSourceName = `cypress-${data.dataSourceName}-dynamodb`;
    beforeEach(() => {
        cy.apiLogin();
        cy.viewport(1400, 1600);
    });

    afterEach(() => {
        cy.apiDeleteDataSource(dynamodbDataSourceName);
    });

    it("1. DynamoDB - Verify connection form UI elements - ALL FIELDS", () => {
        cy.apiCreateDataSource(
            `${Cypress.env("server_host")}/api/data-sources`,
            `${dynamodbDataSourceName}`,
            "dynamodb",
            [
                { key: "region", value: "", encrypted: false },
                { key: "access_key", value: "", encrypted: false },
                { key: "secret_key", value: null, encrypted: true },
                { key: "instance_metadata_credentials", value: "iam_access_keys", encrypted: false },
            ]
        );
        cy.visit('/my-workspace/data-sources');
        cy.waitForElement(dsCommonSelector.dataSourceNameButton(dynamodbDataSourceName));
        cy.get(dsCommonSelector.dataSourceNameButton(dynamodbDataSourceName)).click();
        verifyConnectionFormUI(dynamodbUIConfig.defaultFields);
    });

    it("2. DynamoDB - Verify data source connection with valid credentials", () => {
        cy.apiCreateDataSource(
            `${Cypress.env("server_host")}/api/data-sources`,
            `${dynamodbDataSourceName}`,
            "dynamodb",
            [
                { key: "region", value: "", encrypted: false },
                { key: "access_key", value: "", encrypted: false },
                { key: "secret_key", value: null, encrypted: true },
                { key: "instance_metadata_credentials", value: "iam_access_keys", encrypted: false },
            ]
        );
        cy.visit('/my-workspace/data-sources');
        cy.waitForElement(dsCommonSelector.dataSourceNameButton(dynamodbDataSourceName));
        cy.get(dsCommonSelector.dataSourceNameButton(dynamodbDataSourceName)).click();

        fillDSConnectionForm(dynamodbFormConfig, []);

        verifyDSConnection();
    });

    it("3. DynamoDB - Verify UI and connection together", () => {
        cy.apiCreateDataSource(
            `${Cypress.env("server_host")}/api/data-sources`,
            `${dynamodbDataSourceName}`,
            "dynamodb",
            [
                { key: "region", value: "", encrypted: false },
                { key: "access_key", value: "", encrypted: false },
                { key: "secret_key", value: null, encrypted: true },
                { key: "instance_metadata_credentials", value: "iam_access_keys", encrypted: false },
            ]
        );
        cy.visit('/my-workspace/data-sources');
        cy.waitForElement(dsCommonSelector.dataSourceNameButton(dynamodbDataSourceName));
        cy.get(dsCommonSelector.dataSourceNameButton(dynamodbDataSourceName)).click();

        verifyConnectionFormUI(dynamodbUIConfig.defaultFields);

        fillDSConnectionForm(dynamodbFormConfig, dynamodbFormConfig.invalidAccessKey);
        verifyDSConnection("failed", "The security token included in the request is invalid.");

        fillDSConnectionForm(dynamodbFormConfig, dynamodbFormConfig.invalidSecretKey);
        verifyDSConnection("failed", "The request signature we calculated does not match the signature you provided.");

        fillDSConnectionForm(dynamodbFormConfig, []);
        verifyDSConnection();
    });
});
