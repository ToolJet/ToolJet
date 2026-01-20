import { fake } from "Fixtures/fake";
import { dsCommonSelector } from "Selectors/marketplace/common";
import { verifyConnectionFormUI } from "Support/utils/marketplace/dataSource/datasourceformUIHelpers";
import { fillDSConnectionForm, verifyDSConnection, openDataSourceConnection } from "Support/utils/marketplace/dataSource/datasourceformFillHelpers";
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

    it("1. Elasticsearch - Verify connection form UI elements", () => {
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
                { key: "ca_cert", value: null, encrypted: false },
                { key: "client_key", value: null, encrypted: false },
                { key: "client_cert", value: null, encrypted: false },
                { key: "root_cert", value: null, encrypted: false },
            ]
        );

        openDataSourceConnection(elasticsearchDataSourceName);

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
                { key: "ca_cert", value: null, encrypted: false },
                { key: "client_key", value: null, encrypted: false },
                { key: "client_cert", value: null, encrypted: false },
                { key: "root_cert", value: null, encrypted: false },
            ]
        );

        openDataSourceConnection(elasticsearchDataSourceName);

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
                { key: "ca_cert", value: null, encrypted: false },
                { key: "client_key", value: null, encrypted: false },
                { key: "client_cert", value: null, encrypted: false },
                { key: "root_cert", value: null, encrypted: false },
            ]
        );

        openDataSourceConnection(elasticsearchDataSourceName);

        fillDSConnectionForm(elasticsearchFormConfig, elasticsearchFormConfig.invalidSsl);
        verifyDSConnection("failed", "SSL routines:ssl3_get_record:wrong version number");

        fillDSConnectionForm(elasticsearchFormConfig, elasticsearchFormConfig.invalidHost);
        verifyDSConnection("failed", "ConnectionError: getaddrinfo ENOTFOUND invalid-host");

        fillDSConnectionForm(elasticsearchFormConfig, elasticsearchFormConfig.invalidPort);
        verifyDSConnection("failed", "TimeoutError: Request timed out");
    });
});