export const createAndRunRestAPIQuery = (
  queryName,
  dsName,
  method = "GET",
  url = "",
  headersList = [],
  bodyList = [],
  jsonBody = null,
  run = true,
  urlSuffix = ""
) => {
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
        expect(dsResponse.status).to.eq(200);

        const dataSource = dsResponse.body.data_sources.find(
          (ds) => ds.name === dsName
        );

        if (!dataSource) {
          throw new Error(`Data source '${dsName}' not found.`);
        }

        const data_source_id = dataSource.id;
        const useJsonBody =
          ["POST", "PATCH", "PUT"].includes(method.toUpperCase()) &&
          jsonBody !== null;

        const queryOptions = {
          method: method.toLowerCase(),
          url: url + urlSuffix,
          url_params: [["", ""]],
          headers: headersList.length ? headersList : [["", ""]],
          body: !useJsonBody && bodyList.length ? bodyList : [["", ""]],
          json_body: useJsonBody ? jsonBody : null,
          body_toggle: useJsonBody,
          runOnPageLoad: run,
          transformationLanguage: "javascript",
          enableTransformation: false,
        };

        const requestBody = {
          app_id: Cypress.env("appId"),
          app_version_id: editingVersionId,
          name: queryName,
          kind: "restapi",
          options: queryOptions,
          data_source_id,
          plugin_id: null,
        };

        cy.request({
          method: "POST",
          url: `${Cypress.env("server_host")}/api/data-queries/data-sources/${data_source_id}/versions/${editingVersionId}`,
          headers,
          body: requestBody,
        }).then((createResponse) => {
          expect(createResponse.status).to.equal(201);
          const queryId = createResponse.body.id;
          cy.log("Query created successfully:", queryId);

          const createdOptions = createResponse.body.options;
          expect(createdOptions.method).to.equal(queryOptions.method);
          expect(createdOptions.url).to.equal(queryOptions.url);
          expect(createdOptions.headers).to.deep.equal(queryOptions.headers);

          if (useJsonBody) {
            expect(createdOptions.json_body).to.deep.equal(
              queryOptions.json_body
            );
            expect(createdOptions.body_toggle).to.equal(true);
          } else {
            expect(createdOptions.body).to.deep.equal(queryOptions.body);
            expect(createdOptions.body_toggle).to.equal(false);
          }

          expect(createdOptions.runOnPageLoad).to.equal(run);
          cy.log("Metadata verified successfully");
          if (run) {
            cy.request({
              method: "POST",
              url: `${Cypress.env("server_host")}/api/data-queries/${queryId}/run`,
              headers,
            }).then((runResponse) => {
              expect([200, 201]).to.include(runResponse.status);
              cy.log("Query executed successfully:", runResponse.body);
              if (runResponse.body?.data.id) {
                cy.writeFile("cypress/fixtures/restAPI/storedId.json", {
                  id: runResponse.body.data.id,
                });
                cy.log("Stored ID:", runResponse.body.data.id);
              }
            });
          }
        });
      });
    });
  });
};
