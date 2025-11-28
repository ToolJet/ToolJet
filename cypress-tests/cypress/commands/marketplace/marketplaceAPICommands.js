const envVar = Cypress.env("environment");

Cypress.Commands.add("apiCreateGDS", (url, name, kind, options) => {
    cy.getCookie("tj_auth_token").then((cookie) => {
        cy.request(
            {
                method: "POST",
                url: url,
                headers: {
                    "Tj-Workspace-Id": Cypress.env("workspaceId"),
                    Cookie: `tj_auth_token=${cookie.value}`,
                },
                body: {
                    name: name,
                    kind: kind,
                    options: options,
                    scope: "global",
                },
            },
            { log: false }
        ).then((response) => {
            {
                log: false;
            }
            expect(response.status).to.equal(201);
            Cypress.env(`${name}`, response.body.id);

            Cypress.log({
                name: "Create Data Source",
                displayName: "Data source created",
                message: `:\nDatasource: '${kind}',\nName: '${name}'`,
            });
        });
    });
});

Cypress.Commands.add("apiFetchDataSourcesIdFromApp", () => {
    cy.getAuthHeaders().then((headers) => {
        cy.request({
            method: "GET",
            url: `${Cypress.env("server_host")}/api/data-sources/${Cypress.env("workspaceId")}/environments/${Cypress.env("environmentId")}/versions/${Cypress.env("editingVersionId")}`,
            headers,
        }).then((response) => {
            expect(response.status).to.equal(200);
            const dataSources = response.body?.data_sources || [];

            dataSources.forEach((item) => {
                Cypress.env(`${item.kind}`, `${item.id}`);
            });

            Cypress.log({
                name: "DS Fetch",
                displayName: "Data Sources Fetched",
                message: dataSources
                    .map((ds) => `\nKind: '${ds.kind}', Name: '${ds.id}'`)
                    .join(","),
            });
        });
    });
});

Cypress.Commands.add("apiDeleteGDS", (name) => {
    const dataSourceId = Cypress.env(`${name}`);

    cy.getCookie("tj_auth_token").then((cookie) => {
        cy.request({
            method: "DELETE",
            url: `${Cypress.env("server_host")}/api/data-sources/${dataSourceId}`,
            headers: {
                "Tj-Workspace-Id": Cypress.env("workspaceId"),
                Cookie: `tj_auth_token=${cookie.value}`,
            },
            failOnStatusCode: false,
        }).then((response) => {
            console.log("Delete response:", response);

            expect(response.status, "Delete status code").to.eq(200);

            Cypress.log({
                name: "Delete Data Source",
                displayName: "Data source deleted",
                message: `Name: '${name}' | ID: '${dataSourceId}'`,
            });
        });
    });
});

Cypress.Commands.add(
    "apiUpdateGDS",
    ({ name, options, envName = "development" }) => {
        cy.getAuthHeaders().then((headers) => {
            cy.apiGetEnvironments().then((environments) => {
                const environment = environments.find((env) => env.name === envName);
                const environmentId = environment.id;
                const dataSourceId = Cypress.env(`${name}`);

                cy.request({
                    method: "PUT",
                    url: `${Cypress.env("server_host")}/api/data-sources/${dataSourceId}?environment_id=${environmentId}`,
                    headers: headers,
                    body: {
                        name: name,
                        options: options,
                    },
                }).then((response) => {
                    expect(response.status).to.equal(200);
                    cy.log(`Datasource "${name}" updated successfully.`);
                });
            });
        });
    }
);

Cypress.Commands.add(
    "apiUpdateDataSource",
    (dataSourceName, envName, updateData) => {
        cy.getAuthHeaders().then((headers) => {
            cy.apiGetEnvironments().then((environments) => {
                const environment = environments.find((env) => env.name === envName);

                cy.apiGetDataSourceIdByName(dataSourceName).then((dataSourceId) => {
                    const environmentId = environment.id;

                    const defaultData = {
                        name: dataSourceName,
                        options: [
                            { key: "connection_type", value: "manual", encrypted: false },
                            { key: "host", value: "9.234.17.31" },
                            { key: "port", value: 5432 },
                            { key: "database", value: "student" },
                            { key: "username", value: "postgres" },
                            { key: "password", value: "", encrypted: true }, // Default password to be overridden
                            { key: "ssl_enabled", value: false, encrypted: false },
                            { key: "ssl_certificate", value: "none", encrypted: false },
                        ],
                    };

                    const mergedData = {
                        ...defaultData,
                        ...updateData,
                        options: defaultData.options.map((option) => {
                            const updatedOption = updateData.options?.find(
                                (o) => o.key === option.key
                            );
                            return updatedOption ? { ...option, ...updatedOption } : option;
                        }),
                    };

                    cy.request({
                        method: "PUT",
                        url: `${Cypress.env("server_host")}/api/data-sources/${dataSourceId}?environment_id=${environmentId}`,
                        headers: headers,
                        body: mergedData,
                    }).then((updateResponse) => {
                        expect(updateResponse.status).to.equal(200);
                        cy.log(`Datasource "${dataSourceName}" updated successfully.`);
                    });
                });
            });
        });
    }
);

Cypress.Commands.add("apiGetDataSourceIdByName", (dataSourceName) => {
    const workspaceId = Cypress.env("workspaceId");
    cy.getAuthHeaders().then((headers) => {
        cy.request({
            method: "GET",
            url: `${Cypress.env("server_host")}/api/data-sources/${workspaceId}`,
            headers: headers,
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

Cypress.Commands.add("apiGetTableIdByName", (tableName) => {
    cy.getAuthHeaders().then((headers) => {
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

Cypress.Commands.add("apiAddDataToTable", (tableName, data) => {
    cy.apiGetTableIdByName(tableName).then((tableId) => {
        cy.getAuthHeaders().then((headers) => {
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
