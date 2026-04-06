import { fake } from "Fixtures/fake";
import { dsCommonSelector } from "Selectors/marketplace/common";
import { verifyConnectionFormUI } from "Support/utils/marketplace/dataSource/dataSourceFormUIHelpers";
import { fillDSConnectionForm, verifyDSConnection } from "Support/utils/marketplace/dataSource/dataSourceFormFillHelpers";
import { elasticsearchUIConfig, elasticsearchFormConfig } from "Constants/constants/marketplace/datasources/elasticsearch";

const data = {};

describe("Elasticsearch", () => {
    data.dataSourceName = fake.lastName
        .toLowerCase()
        .replaceAll("[^A-Za-z]", "");
    const elasticsearchDataSourceName = `cypress-${data.dataSourceName}-elasticsearch`;
    beforeEach(() => {
        cy.apiLogin();
        cy.viewport(1400, 1600);
    });

    afterEach(() => {
        cy.apiDeleteDataSource(elasticsearchDataSourceName);
    });

    it("1. Elasticsearch - Verify connection form UI elements - ALL FIELDS", () => {
        cy.apiCreateDataSource(
            `${Cypress.env("server_host")}/api/data-sources`,
            `${elasticsearchDataSourceName}`,
            "elasticsearch",
            [
                { key: "scheme", value: "http", encrypted: false },
                { key: "host", value: "localhost", encrypted: false },
                { key: "port", value: 9200, encrypted: false },
                { key: "ssl_enabled", value: true, encrypted: false },
                { key: "ssl_certificate", value: "none", encrypted: false },
                { key: "username", value: "", encrypted: false },
                { key: "password", value: "", encrypted: true },
                { key: "ca_cert", value: null, encrypted: true },
                { key: "client_key", value: null, encrypted: true },
                { key: "client_cert", value: null, encrypted: true },
                { key: "root_cert", value: null, encrypted: true },
            ]
        );
        cy.visit('/my-workspace/data-sources');
        cy.waitForElement(dsCommonSelector.dataSourceNameButton(elasticsearchDataSourceName));
        cy.get(dsCommonSelector.dataSourceNameButton(elasticsearchDataSourceName)).click();
        verifyConnectionFormUI(elasticsearchUIConfig.defaultFields);
    });

    it("2. Elasticsearch - Verify data source connection with valid credentials", () => {
        cy.apiCreateDataSource(
            `${Cypress.env("server_host")}/api/data-sources`,
            `${elasticsearchDataSourceName}`,
            "elasticsearch",
            [
                { key: "scheme", value: "http", encrypted: false },
                { key: "host", value: "localhost", encrypted: false },
                { key: "port", value: 9200, encrypted: false },
                { key: "ssl_enabled", value: false, encrypted: false },
                { key: "ssl_certificate", value: "none", encrypted: false },
                { key: "username", value: "", encrypted: false },
                { key: "password", value: "", encrypted: true },
                { key: "ca_cert", value: null, encrypted: true },
                { key: "client_key", value: null, encrypted: true },
                { key: "client_cert", value: null, encrypted: true },
                { key: "root_cert", value: null, encrypted: true },
            ]
        );
        cy.visit('/my-workspace/data-sources');
        cy.waitForElement(dsCommonSelector.dataSourceNameButton(elasticsearchDataSourceName));
        cy.get(dsCommonSelector.dataSourceNameButton(elasticsearchDataSourceName)).click();

        fillDSConnectionForm(elasticsearchFormConfig, []);

        verifyDSConnection();
    });

    it("3. Elasticsearch - Verify UI and connection together", () => {
        cy.apiCreateDataSource(
            `${Cypress.env("server_host")}/api/data-sources`,
            `${elasticsearchDataSourceName}`,
            "elasticsearch",
            [
                { key: "scheme", value: "http", encrypted: false },
                { key: "host", value: "localhost", encrypted: false },
                { key: "port", value: 9200, encrypted: false },
                { key: "ssl_enabled", value: false, encrypted: false },
                { key: "ssl_certificate", value: "none", encrypted: false },
                { key: "username", value: "", encrypted: false },
                { key: "password", value: "", encrypted: true },
                { key: "ca_cert", value: null, encrypted: true },
                { key: "client_key", value: null, encrypted: true },
                { key: "client_cert", value: null, encrypted: true },
                { key: "root_cert", value: null, encrypted: true },
            ]
        );
        cy.visit('/my-workspace/data-sources');
        cy.waitForElement(dsCommonSelector.dataSourceNameButton(elasticsearchDataSourceName));
        cy.get(dsCommonSelector.dataSourceNameButton(elasticsearchDataSourceName)).click();

        fillDSConnectionForm(elasticsearchFormConfig, elasticsearchFormConfig.invalidSsl);
        verifyDSConnection("failed", "wrong version number");

        fillDSConnectionForm(elasticsearchFormConfig, elasticsearchFormConfig.invalidHost);
        verifyDSConnection("failed", "getaddrinfo ENOTFOUND invalid-host");

        fillDSConnectionForm(elasticsearchFormConfig, elasticsearchFormConfig.invalidPort);
        verifyDSConnection("failed", "TimeoutError: Request timed out");
    });
});

/*
 * Test Cases for Elasticsearch
 * ========================
 *
 * TC_001: Verify connection form UI elements
 *   - Pre-condition: Data source created via API with http scheme and SSL enabled
 *   - Steps: Navigate to data sources page → Click on data source → Verify all form fields
 *   - Expected: All field labels, placeholders, default values, and states (disabled/enabled) match manifest
 *   - Fields verified: scheme, host, port, ssl_enabled, ssl_certificate, username, password, ca_cert, client_key, client_cert, root_cert
 *
 * TC_002: Verify data source connection with valid credentials
 *   - Pre-condition: Data source created via API with http scheme and SSL disabled
 *   - Steps: Navigate to data sources page → Click on data source → Fill valid credentials → Test connection
 *   - Expected: Toast message "Test connection verified" appears
 *   - Credentials: Uses elasticsearchFormConfig valid credentials
 *
 * TC_003: Verify UI and connection together
 *   - Pre-condition: Data source created via API with http scheme and SSL disabled
 *   - Steps: Navigate to data sources page → Click on data source → Test invalid SSL → Test invalid host → Test invalid port → Verify error messages
 *   - Expected:
 *     - Invalid SSL: Connection fails with "wrong version number"
 *     - Invalid host: Connection fails with "getaddrinfo ENOTFOUND invalid-host"
 *     - Invalid port: Connection fails with "TimeoutError: Request timed out"
 */
