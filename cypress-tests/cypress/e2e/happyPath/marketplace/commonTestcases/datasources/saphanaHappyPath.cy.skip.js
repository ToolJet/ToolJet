import { fake } from "Fixtures/fake";
import { dsCommonSelector } from "Selectors/marketplace/common";
import { verifyConnectionFormUI } from "Support/utils/marketplace/dataSource/datasourceformUIHelpers";
import { fillDSConnectionForm, verifyDSConnection, openDataSourceConnection } from "Support/utils/marketplace/dataSource/datasourceformFillHelpers";
import { saphanaUIConfig, saphanaFormConfig } from "Constants/constants/marketplace/datasources/saphana";

const data = {};

describe("SAP HANA", () => {
    data.dataSourceName = fake.lastName
        .toLowerCase()
        .replaceAll("[^A-Za-z]", "");
    const saphanaDataSourceName = `cypress-${data.dataSourceName}-saphana`;
    beforeEach(() => {
        cy.apiLogin();
        cy.viewport(1400, 1600);
    });

    afterEach(() => {
        cy.apiDeleteDataSource(saphanaDataSourceName);
    });

    it("1. SAP HANA - Verify connection form UI elements - ALL FIELDS", () => {
        cy.apiCreateDataSource(
            `${Cypress.env("server_host")}/api/data-sources`,
            `${saphanaDataSourceName}`,
            "saphana",
            [
                { key: "host", value: "localhost", encrypted: false },
                { key: "port", value: 443, encrypted: false },
                { key: "database", value: "", encrypted: false },
                { key: "username", value: "", encrypted: false },
                { key: "password", value: "", encrypted: true }
            ]
        );

        openDataSourceConnection(saphanaDataSourceName);

        verifyConnectionFormUI(saphanaUIConfig.defaultFields);
    });

    it("2. SAP HANA - Verify data source connection with valid credentials", () => {
        cy.apiCreateDataSource(
            `${Cypress.env("server_host")}/api/data-sources`,
            `${saphanaDataSourceName}`,
            "saphana",
            [
                { key: "host", value: "localhost", encrypted: false },
                { key: "port", value: 443, encrypted: false },
                { key: "database", value: "", encrypted: false },
                { key: "username", value: "", encrypted: false },
                { key: "password", value: "", encrypted: true }
            ]
        );

        openDataSourceConnection(saphanaDataSourceName);

        fillDSConnectionForm(saphanaFormConfig, []);

        verifyDSConnection();
    });

    it("3. SAP HANA - Verify UI and connection together", () => {
        cy.apiCreateDataSource(
            `${Cypress.env("server_host")}/api/data-sources`,
            `${saphanaDataSourceName}`,
            "saphana",
            [
                { key: "host", value: "localhost", encrypted: false },
                { key: "port", value: 443, encrypted: false },
                { key: "database", value: "", encrypted: false },
                { key: "username", value: "", encrypted: false },
                { key: "password", value: "", encrypted: true }
            ]
        );

        openDataSourceConnection(saphanaDataSourceName);

        verifyConnectionFormUI(saphanaUIConfig.defaultFields);

        fillDSConnectionForm(saphanaFormConfig, saphanaFormConfig.invalidHost);
        verifyDSConnection("failed", "getaddrinfo ENOTFOUND invalid-host");

        fillDSConnectionForm(saphanaFormConfig, saphanaFormConfig.invalidPort);
        verifyDSConnection("failed", "Connection refused");

        fillDSConnectionForm(saphanaFormConfig, saphanaFormConfig.invalidDatabase);
        verifyDSConnection("failed", "invalid database name");

        fillDSConnectionForm(saphanaFormConfig, saphanaFormConfig.invalidUsername);
        verifyDSConnection("failed", "authentication failed");

        fillDSConnectionForm(saphanaFormConfig, saphanaFormConfig.invalidPassword);
        verifyDSConnection("failed", "authentication failed");
    });
});