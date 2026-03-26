import { fake } from "Fixtures/fake";
import { dsCommonSelector } from "Selectors/marketplace/common";
import { commonSelectors } from "Selectors/common";
import { verifyConnectionFormUI } from "Support/utils/marketplace/dataSource/dataSourceFormUIHelpers";
import { fillDSConnectionForm } from "Support/utils/marketplace/dataSource/dataSourceFormFillHelpers";
import { graphqlUIConfig, graphqlFormConfig, graphqlApiOptions } from "Constants/constants/marketplace/datasources/graphql";
import { dataSourceSelector } from "Constants/selectors/dataSource";

const data = {};

describe("GraphQL", () => {
    data.dataSourceName = fake.lastName
        .toLowerCase()
        .replaceAll("[^A-Za-z]", "");
    data.appName = `${fake.companyName}-App`;
    data.appCreated = false;
    const graphqlDataSourceName = `cypress-${data.dataSourceName}-graphql`;
    beforeEach(() => {
        cy.apiLogin();
        cy.viewport(1400, 1600);
        cy.on("uncaught:exception", () => false);
    });

    afterEach(() => {
        if (data.appCreated) {
            cy.apiDeleteApp();
            data.appCreated = false;
        }
        cy.apiDeleteDataSource(graphqlDataSourceName);
    });

    it("1. GraphQL - Verify connection form UI elements", () => {
        cy.apiCreateDataSource(
            `${Cypress.env("server_host")}/api/data-sources`,
            `${graphqlDataSourceName}`,
            "graphql",
            graphqlApiOptions
        );
        cy.visit('/my-workspace/data-sources');
        cy.waitForElement(dsCommonSelector.dataSourceNameButton(graphqlDataSourceName));
        cy.get(dsCommonSelector.dataSourceNameButton(graphqlDataSourceName)).click();
        verifyConnectionFormUI(graphqlUIConfig.defaultFields);
    });

    it("2. GraphQL - Verify saving data source with valid URL", () => {
        cy.apiCreateDataSource(
            `${Cypress.env("server_host")}/api/data-sources`,
            `${graphqlDataSourceName}`,
            "graphql",
            graphqlApiOptions
        );
        cy.visit('/my-workspace/data-sources');
        cy.waitForElement(dsCommonSelector.dataSourceNameButton(graphqlDataSourceName));
        cy.get(dsCommonSelector.dataSourceNameButton(graphqlDataSourceName)).click();

        fillDSConnectionForm(graphqlFormConfig, []);

        cy.get('[data-cy="db-connection-save-button"]')
            .scrollIntoView()
            .should("be.visible")
            .click();
        cy.verifyToastMessage(commonSelectors.toastMessage, "Data Source Saved");
    });

    it("3. GraphQL - Verify query execution with valid connection", () => {
        const validOptions = graphqlApiOptions.map((opt) =>
            opt.key === "url"
                ? { ...opt, value: Cypress.env("GraphQl_Url") }
                : opt
        );
        cy.apiCreateDataSource(
            `${Cypress.env("server_host")}/api/data-sources`,
            `${graphqlDataSourceName}`,
            "graphql",
            validOptions,
            true
        );

        cy.getAuthHeaders().then((headers) => {
            cy.request({
                method: "GET",
                url: `${Cypress.env("server_host")}/api/apps`,
                headers,
                failOnStatusCode: false,
            }).then((response) => {
                const app = response.body?.apps?.find((a) => a.name === data.appName);
                if (app?.id) {
                    cy.request({
                        method: "DELETE",
                        url: `${Cypress.env("server_host")}/api/apps/${app.id}`,
                        headers,
                        failOnStatusCode: false,
                    });
                }
            });
        });
        cy.apiCreateApp(data.appName).then(() => {
            data.appCreated = true;
        });
        cy.apiAddQueryToApp({
            queryName: "graphql-test-query",
            options: {
                transformationLanguage: "javascript",
                enableTransformation: false,
            },
            dataSourceName: graphqlDataSourceName,
            dsKind: "graphql",
        });
        cy.openApp();

        cy.get('[data-cy="list-query-graphql-test-query"]').click();
        cy.get('[data-cy="query-input-field"]').clearAndTypeOnCodeMirror(
            `{
      allFilms {
      films { title director }
      }
      }`
        );
        cy.get(dataSourceSelector.queryPreviewButton).click();
        cy.verifyToastMessage(
            commonSelectors.toastMessage,
            "Query (graphql-test-query) completed."
        );
    });
});
