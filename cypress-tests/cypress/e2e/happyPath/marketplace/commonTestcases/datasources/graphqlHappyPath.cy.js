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
        cy.verifyToastMessage(commonSelectors.toastMessage, "Data Source Saved", true, 50000);
    });

    it("3. GraphQL - Verify query execution with valid connection", () => {
        const graphqlUrl = Cypress.env("GraphQl_Url");
        const validOptions = graphqlApiOptions.map((opt) =>
            opt.key === "url"
                ? { ...opt, value: graphqlUrl }
                : opt
        );

        cy.apiCreateDataSource(
            `${Cypress.env("server_host")}/api/data-sources`,
            `${graphqlDataSourceName}`,
            "graphql",
            validOptions,
            true
        );

        data.appName = `${fake.companyName}-GraphQL-App`;
        cy.apiCreateApp(data.appName).then(() => {
            data.appCreated = true;
        });

        // Create and run a GraphQL query via API
        cy.getCookie("tj_auth_token").then((cookie) => {
            const headers = {
                "Tj-Workspace-Id": Cypress.env("workspaceId"),
                Cookie: `tj_auth_token=${cookie.value}`,
            };

            cy.request({
                method: "GET",
                url: `${Cypress.env("server_host")}/api/apps/${Cypress.env("appId")}`,
                headers,
            }).then((appResponse) => {
                const currentEnvironmentId = appResponse.body.editorEnvironment.id;
                const editingVersionId = appResponse.body.editing_version.id;

                cy.request({
                    method: "GET",
                    url: `${Cypress.env("server_host")}/api/data-sources/${Cypress.env("workspaceId")}/environments/${currentEnvironmentId}/versions/${editingVersionId}`,
                    headers,
                }).then((dsResponse) => {
                    const dataSource = dsResponse.body.data_sources.find(
                        (ds) => ds.name === graphqlDataSourceName
                    );

                    cy.request({
                        method: "POST",
                        url: `${Cypress.env("server_host")}/api/data-queries/data-sources/${dataSource.id}/versions/${editingVersionId}`,
                        headers,
                        body: {
                            app_id: Cypress.env("appId"),
                            app_version_id: editingVersionId,
                            name: "graphql_test_query",
                            kind: "graphql",
                            options: {
                                query: `{ allFilms { films { title director } } }`,
                                variables: "",
                                headers: [["", ""]],
                                url_params: [["", ""]],
                                cookies: [["", ""]],
                                transformationLanguage: "javascript",
                                enableTransformation: false,
                            },
                            data_source_id: dataSource.id,
                            plugin_id: null,
                        },
                    }).then((createResponse) => {
                        expect(createResponse.status).to.eq(201);
                        const queryId = createResponse.body.id;

                        cy.request({
                            method: "POST",
                            url: `${Cypress.env("server_host")}/api/data-queries/${queryId}/run`,
                            headers,
                            failOnStatusCode: false,
                        }).then((runResponse) => {
                            expect(runResponse.status).to.eq(201);
                            expect(runResponse.body.status).to.eq("ok");

                            const responseData = runResponse.body.data.data;
                            expect(responseData).to.have.property("allFilms");
                            expect(responseData.allFilms).to.have.property("films");
                            expect(responseData.allFilms.films).to.be.an("array");
                            expect(responseData.allFilms.films.length).to.be.greaterThan(0);
                            expect(responseData.allFilms.films[0]).to.have.property("title");
                            expect(responseData.allFilms.films[0]).to.have.property("director");
                        });
                    });
                });
            });
        });
    });
});

/*
 * Test Cases for GraphQL
 * ========================
 *
 * TC_001: Verify connection form UI elements
 *   - Pre-condition: Data source created via API with default graphqlApiOptions (empty url, auth_type "none", ssl "none")
 *   - Steps: Navigate to data sources page → Click on data source → Verify all form fields
 *   - Expected: All field labels, placeholders, default values, and states match manifest
 *   - Fields verified: Base URL (input, placeholder: "https://api.example.com/v1/graphql"),
 *                       SSL certificate (dropdown, default: "None")
 *
 * TC_002: Verify saving data source with valid URL (customTesting - uses Save, not Test Connection)
 *   - Pre-condition: Data source created via API with default graphqlApiOptions
 *   - Steps: Navigate to data sources page → Click on data source → Fill valid Base URL → Click Save button
 *   - Expected: Toast message "Data Source Saved" appears
 *   - Credentials: GraphQl_Url
 *
 * TC_003: Verify query execution with valid connection
 *   - Pre-condition: Data source created via API with valid GraphQl_Url, app created via API, query added via API
 *   - Steps: Open app → Click on query → Enter GraphQL query in CodeMirror → Click preview button
 *   - Expected: Toast message "Query (graphql-test-query) completed." appears
 *   - Query: { allFilms { films { title director } } }
 *   - Credentials: GraphQl_Url
 */
