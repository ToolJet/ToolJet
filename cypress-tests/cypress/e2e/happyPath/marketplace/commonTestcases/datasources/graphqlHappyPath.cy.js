import { fake } from "Fixtures/fake";
import { commonSelectors } from "Selectors/common";
import { dsCommonSelector } from "Selectors/marketplace/common";
import { restAPISelector } from "Selectors/marketplace/restAPI";
import { verifyConnectionFormUI } from "Support/utils/marketplace/dataSource/dataSourceFormUIHelpers";
import { fillDSConnectionForm } from "Support/utils/marketplace/dataSource/dataSourceFormFillHelpers";
import {
    graphqlUIConfig,
    graphqlFormConfig,
    graphqlAPIOptions,
} from "Constants/constants/marketplace/datasources/graphql";

const data = {};

describe("GraphQL", () => {
    data.dataSourceName = fake.lastName
        .toLowerCase()
        .replaceAll("[^A-Za-z]", "");
    data.appCreated = false;
    const graphqlDataSourceName = `cypress-${data.dataSourceName}-graphql`;

    beforeEach(() => {
        cy.apiLogin();
        cy.viewport(1400, 1600);
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
            graphqlAPIOptions
        );
        cy.visit("/my-workspace/data-sources");
        cy.waitForElement(
            dsCommonSelector.dataSourceNameButton(graphqlDataSourceName)
        );
        cy.get(
            dsCommonSelector.dataSourceNameButton(graphqlDataSourceName)
        ).click();

        // Verify accordion section headers
        cy.get('[data-cy="widget-accordion-credentials"]').should(
            "have.text",
            graphqlUIConfig.accordionSections.credentials
        );
        cy.get('[data-cy="widget-accordion-authentication"]').should(
            "have.text",
            graphqlUIConfig.accordionSections.authentication
        );
        cy.get('[data-cy="widget-accordion-secure-sockets-layer"]').should(
            "have.text",
            graphqlUIConfig.accordionSections.ssl
        );

        // Verify Base URL input field using standard helper
        verifyConnectionFormUI(graphqlUIConfig.defaultFields);

        // Verify key-value pair sections (Headers, URL parameters, Body, Cookies)
        graphqlUIConfig.headerSections.forEach((section) => {
            const dataCy = section.toLowerCase().replace(/\s+/g, "-");
            cy.get(`[data-cy="${dataCy}-label"]`).should(
                "have.text",
                section
            );
            cy.get(`[data-cy="${dataCy}-key-input-field-0"]`).should(
                "be.visible"
            );
            cy.get(`[data-cy="${dataCy}-value-input-field-0"]`).should(
                "be.visible"
            );
            cy.get(`[data-cy="${dataCy}-delete-button-0"]`).should(
                "be.visible"
            );
            cy.get(`[data-cy="${dataCy}-add-button"]`).should("be.visible");
        });

        // Verify authentication type dropdown defaults to "None"
        cy.get(".dynamic-form-element > .form-label").should(
            "have.text",
            "Authentication type"
        );

        // Verify SSL certificate dropdown and label
        cy.get(restAPISelector.dropdownLabel("SSL certificate")).should(
            "have.text",
            "SSL certificate"
        );

        // Verify no Test Connection button (customTesting: true)
        cy.get('[data-cy="test-connection-button"]').should("not.exist");

        // Verify Save button exists
        cy.get('[data-cy="db-connection-save-button"]').should("be.visible");

        // Verify Read documentation link
        cy.get(restAPISelector.readDocumentationLinkText).should(
            "have.text",
            "Read documentation"
        );

        // Modify a field to enable Save button, then save
        cy.get('[data-cy="base-url-text-field"]').clear().type("https://example.com/graphql");
        cy.contains("Save").click();
        cy.verifyToastMessage(
            commonSelectors.toastMessage,
            "Data Source Saved"
        );
    });

    it("2. GraphQL - Verify save with valid URL", () => {
        cy.apiCreateDataSource(
            `${Cypress.env("server_host")}/api/data-sources`,
            `${graphqlDataSourceName}`,
            "graphql",
            graphqlAPIOptions
        );
        cy.visit("/my-workspace/data-sources");
        cy.waitForElement(
            dsCommonSelector.dataSourceNameButton(graphqlDataSourceName)
        );
        cy.get(
            dsCommonSelector.dataSourceNameButton(graphqlDataSourceName)
        ).click();

        // Fill Base URL with valid GraphQL endpoint
        fillDSConnectionForm(graphqlFormConfig, []);

        // Save and verify toast
        cy.contains("Save").click();
        cy.verifyToastMessage(
            commonSelectors.toastMessage,
            "Data Source Saved"
        );
    });

    it("3. GraphQL - Verify query execution with valid connection", () => {
        const graphqlUrl = Cypress.env("GraphQl_Url");

        // Create datasource with valid URL via API
        const validOptions = graphqlAPIOptions.map((opt) =>
            opt.key === "url" ? { ...opt, value: graphqlUrl } : opt
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
                url: `${Cypress.env("server_host")}/api/apps/${Cypress.env(
                    "appId"
                )}`,
                headers,
            }).then((appResponse) => {
                const currentEnvironmentId =
                    appResponse.body.editorEnvironment.id;
                const editingVersionId = appResponse.body.editing_version.id;

                cy.request({
                    method: "GET",
                    url: `${Cypress.env(
                        "server_host"
                    )}/api/data-sources/${Cypress.env(
                        "workspaceId"
                    )}/environments/${currentEnvironmentId}/versions/${editingVersionId}`,
                    headers,
                }).then((dsResponse) => {
                    const dataSource = dsResponse.body.data_sources.find(
                        (ds) => ds.name === graphqlDataSourceName
                    );

                    const queryOptions = {
                        query: `{ allFilms { films { title director } } }`,
                        variables: "",
                        headers: [["", ""]],
                        url_params: [["", ""]],
                        cookies: [["", ""]],
                        transformationLanguage: "javascript",
                        enableTransformation: false,
                    };

                    const requestBody = {
                        app_id: Cypress.env("appId"),
                        app_version_id: editingVersionId,
                        name: "graphql_test_query",
                        kind: "graphql",
                        options: queryOptions,
                        data_source_id: dataSource.id,
                        plugin_id: null,
                    };

                    cy.request({
                        method: "POST",
                        url: `${Cypress.env(
                            "server_host"
                        )}/api/data-queries/data-sources/${
                            dataSource.id
                        }/versions/${editingVersionId}`,
                        headers,
                        body: requestBody,
                    }).then((createResponse) => {
                        expect(createResponse.status).to.eq(201);
                        const queryId = createResponse.body.id;

                        cy.request({
                            method: "POST",
                            url: `${Cypress.env(
                                "server_host"
                            )}/api/data-queries/${queryId}/run`,
                            headers,
                            failOnStatusCode: false,
                        }).then((runResponse) => {
                            expect(runResponse.status).to.eq(201);
                            expect(runResponse.body.status).to.eq("ok");

                            const responseData = runResponse.body.data.data;
                            expect(responseData).to.have.property("allFilms");
                            expect(
                                responseData.allFilms
                            ).to.have.property("films");
                            expect(responseData.allFilms.films).to.be.an(
                                "array"
                            );
                            expect(
                                responseData.allFilms.films.length
                            ).to.be.greaterThan(0);
                            expect(
                                responseData.allFilms.films[0]
                            ).to.have.property("title");
                            expect(
                                responseData.allFilms.films[0]
                            ).to.have.property("director");
                        });
                    });
                });
            });
        });
    });
});
