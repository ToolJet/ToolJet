import { fake } from "Fixtures/fake";
import { dsCommonSelector } from "Selectors/marketplace/common";
import { verifyConnectionFormUI } from "Support/utils/marketplace/dataSource/datasourceformUIHelpers";
import { fillDSConnectionForm, verifyDSConnection, openDataSourceConnection } from "Support/utils/marketplace/dataSource/datasourceformFillHelpers";
import { couchdbUIConfig, couchdbFormConfig } from "Constants/constants/marketplace/datasources/couchdb";

const data = {};

describe("CouchDB", () => {
    data.dataSourceName = fake.lastName
        .toLowerCase()
        .replaceAll("[^A-Za-z]", "");
    const couchdbDataSourceName = `cypress-${data.dataSourceName}-couchdb`;
    beforeEach(() => {
        cy.apiLogin();
        cy.viewport(1400, 1600);
    });

    afterEach(() => {
        cy.apiDeleteDataSource(couchdbDataSourceName);
    });

    it("1. CouchDB - Verify connection form UI elements - ALL FIELDS", () => {
        cy.apiCreateDataSource(
            `${Cypress.env("server_host")}/api/data-sources`,
            `${couchdbDataSourceName}`,
            "couchdb",
            [
                { key: "host", value: "localhost", encrypted: false },
                { key: "port", value: 5984, encrypted: false },
                { key: "username", value: "", encrypted: false },
                { key: "password", value: null, encrypted: true },
                { key: "ssl", value: false, encrypted: false }
            ]
        );
        openDataSourceConnection(couchdbDataSourceName);

        verifyConnectionFormUI(couchdbUIConfig.defaultFields);
    });

    it("2. CouchDB - Verify data source connection with valid credentials", () => {
        cy.apiCreateDataSource(
            `${Cypress.env("server_host")}/api/data-sources`,
            `${couchdbDataSourceName}`,
            "couchdb",
            [
                { key: "host", value: "localhost", encrypted: false },
                { key: "port", value: 5984, encrypted: false },
                { key: "username", value: "", encrypted: false },
                { key: "password", value: null, encrypted: true },
                { key: "ssl", value: false, encrypted: false }
            ]
        );
        openDataSourceConnection(couchdbDataSourceName);

        fillDSConnectionForm(couchdbFormConfig, []);

        verifyDSConnection();
    });

    it("3. CouchDB - Verify UI and connection together", () => {
        cy.apiCreateDataSource(
            `${Cypress.env("server_host")}/api/data-sources`,
            `${couchdbDataSourceName}`,
            "couchdb",
            [
                { key: "host", value: "localhost", encrypted: false },
                { key: "port", value: 5984, encrypted: false },
                { key: "username", value: "", encrypted: false },
                { key: "password", value: null, encrypted: true },
                { key: "ssl", value: false, encrypted: false }
            ]
        );
        openDataSourceConnection(couchdbDataSourceName);

        verifyConnectionFormUI(couchdbUIConfig.defaultFields);

        fillDSConnectionForm(couchdbFormConfig, couchdbFormConfig.invalidHost);
        verifyDSConnection("failed", "getaddrinfo ENOTFOUND invalid-host");

        // fillDSConnectionForm(couchdbFormConfig, couchdbFormConfig.invalidPort);
        // verifyDSConnection("failed", "Connection refused");

        fillDSConnectionForm(couchdbFormConfig, couchdbFormConfig.invalidUsername);
        verifyDSConnection("failed", "Unauthorized");

        fillDSConnectionForm(couchdbFormConfig, couchdbFormConfig.invalidPassword);
        verifyDSConnection("failed", "Unauthorized");

        // fillDSConnectionForm(couchdbFormConfig, couchdbFormConfig.invalidProtocol);
        // verifyDSConnection("failed", "write EPROTO 80A07CEF01000000:error:0A00010B:SSL routines:ssl3_get_record:wrong version number:../deps/openssl/openssl/ssl/record/ssl3_record.c:355:");
    });
});