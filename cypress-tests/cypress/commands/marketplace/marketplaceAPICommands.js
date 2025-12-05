const envVar = Cypress.env("environment");

Cypress.Commands.add("apiCreateDataSource", (url, name, kind, options, cachedHeader) => {
    cy.getAuthHeaders(cachedHeader).then((headers) => {
        cy.request(
            {
                method: "POST",
                url: url,
                headers: headers,
                body: {
                    name: name,
                    kind: kind,
                    options: options,
                    scope: "global",
                },
                log: false
            },
        ).then((response) => {
            expect(response.status).to.equal(201);
            Cypress.env(`${name}-dataSource-id`, response.body.id);

            Cypress.log({
                name: "Create Data Source",
                displayName: "Data source created",
                message: `:\nDatasource: '${kind}',\nName: '${name}'`,
            });
        });
    });
});

Cypress.Commands.add("apiFetchDataSourcesIdFromApp", (cachedHeader) => {
    cy.getAuthHeaders(cachedHeader).then((headers) => {
        cy.request({
            method: "GET",
            url: `${Cypress.env("server_host")}/api/data-sources/${Cypress.env("workspaceId")}/environments/${Cypress.env("environmentId")}/versions/${Cypress.env("editingVersionId")}`,
            headers,
            log: false
        }).then((response) => {
            expect(response.status).to.equal(200);
            const dataSources = response.body?.data_sources || [];

            dataSources.forEach((item) => {
                Cypress.env(`${item.name}-dataSource-id`, `${item.id}`);
            });

            Cypress.log({
                name: "DS Fetch",
                displayName: "Data Sources Fetched",
                message: dataSources
                    .map((ds) => `\nKind: '${ds.name}', Name: '${ds.id}'`)
                    .join(","),
            });
        });
    });
});

Cypress.Commands.add("apiDeleteDataSource", (name, cachedHeader) => {
    const dataSourceId = Cypress.env(`${name}-dataSource-id`);

    cy.getAuthHeaders(cachedHeader).then((headers) => {
        cy.request({
            method: "DELETE",
            url: `${Cypress.env("server_host")}/api/data-sources/${dataSourceId}`,
            headers: headers,
            failOnStatusCode: false,
        }).then((response) => {
            expect(response.status, "Delete status code").to.eq(200);

            Cypress.log({
                name: "Delete Data Source",
                displayName: "Data source deleted",
                message: `Name: '${name}'`,
            });
        });
    });
});

Cypress.Commands.add(
    "apiUpdateDataSource",
    ({ name, options, envName = "development", cachedHeader }) => {
        cy.getAuthHeaders(cachedHeader).then((headers) => {
            cy.apiGetEnvironments().then((environments) => {
                const environment = environments.find((env) => env.name === envName);
                const environmentId = environment.id;
                const dataSourceId = Cypress.env(`${name}-dataSource-id`);

                cy.request({
                    method: "PUT",
                    url: `${Cypress.env("server_host")}/api/data-sources/${dataSourceId}?environment_id=${environmentId}`,
                    headers: headers,
                    body: {
                        name: name,
                        options: options,
                    },
                    log: false
                }).then((response) => {
                    expect(response.status).to.equal(200);
                    Cypress.log({
                        name: "Update Data Source",
                        displayName: "Data source updated",
                        message: `Name: '${name}'`,
                    });
                });
            });
        });
    }
);

Cypress.Commands.add("apiGetDataSourceIdByName", (dataSourceName, cachedHeader) => {
    cy.getAuthHeaders(cachedHeader).then((headers) => {
        cy.request({
            method: "GET",
            url: `${Cypress.env("server_host")}/api/data-sources/${Cypress.env("workspaceId")}`,
            headers: headers,
            log
        }).then((response) => {
            expect(response.status).to.equal(200);
            const id = response.body.data_sources.find(
                (ds) => ds.name === dataSourceName
            )?.id;
            Cypress.log({
                name: "apiGetDataSourceIdByName",
                displayName: "Data Source ID",
                message: `Data source ID for '${dataSourceName}': ${id}`,
            });
            return id;
        });
    });
});

Cypress.Commands.add("apiGetTableIdByName", (tableName, cachedHeader) => {
    cy.getAuthHeaders(cachedHeader).then((headers) => {
        cy.request({
            method: "GET",
            url: `${Cypress.env("server_host")}/api/tooljet-db/organizations/${Cypress.env("workspaceId")}/tables`,
            headers: headers,
        }).then((response) => {
            expect(response.status).to.eq(200);
            const table = response.body.result.find(
                (t) => t.table_name === tableName
            );
            return table.id;
        });
    });
});

Cypress.Commands.add("apiAddDataToTable", (tableName, data, cachedHeader) => {
    cy.apiGetTableIdByName(tableName, cachedHeader).then((tableId) => {
        cy.getAuthHeaders(cachedHeader).then((headers) => {
            cy.request({
                method: "POST",
                url: `${Cypress.env("server_host")}/api/tooljet-db/proxy/${tableId}`,
                headers: headers,
                body: data,
            }).then((response) => {
                expect(response.status).to.eq(201);
                cy.log("Data added to table successfully");
            });
        });
    });
});
