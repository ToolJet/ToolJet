export const createAndRunRestAPIQuery = ({
  queryName,
  dsName,
  method = "GET",
  url = "",
  urlSuffix = "",
  headersList = [],
  bodyList = [],
  jsonBody = null,
  rawBody = null,
  cookiesList = [],
  paramsList = [],
  run = true,
  expectedResponseShape = {},
  authType = "",
  authToken = "",
}) => {
  cy.getCookie("tj_auth_token").then((cookie) => {
    const headers = {
      "Tj-Workspace-Id": Cypress.env("workspaceId"),
      Cookie: `tj_auth_token=${cookie.value}`,
    };
    // if (authType === "bearer" || authType === "oauth2") {
    //   headers["Authorization"] = `Bearer ${authToken}`;
    // } else if (authType === "basic") {
    //   headers["Authorization"] = `Basic ${btoa(authToken)}`;
    // }

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
          (ds) => ds.name === dsName
        );
        const useJson = jsonBody !== null;
        const useRaw = rawBody !== null;
        const useForm = bodyList?.length && !useJson && !useRaw;

        const queryOptions = {
          method: method.toLowerCase(),
          url: url + urlSuffix,
          url_params: paramsList.length ? paramsList : [["", ""]],
          headers: headersList.length ? headersList : [["", ""]],
          cookies: cookiesList.length ? cookiesList : [["", ""]],
          body: useForm ? bodyList : [["", ""]],
          json_body: useJson ? jsonBody : null,
          raw_body: useRaw ? rawBody : "",
          body_toggle: useJson || useRaw,
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
          data_source_id: dataSource.id,
          plugin_id: null,
        };

        cy.request({
          method: "POST",
          url: `${Cypress.env("server_host")}/api/data-queries/data-sources/${dataSource.id}/versions/${editingVersionId}`,
          headers,
          body: requestBody,
        }).then((createResponse) => {
          expect(createResponse.status).to.eq(201);
          const queryId = createResponse.body.id;

          if (run) {
            cy.request({
              method: "POST",
              url: `${Cypress.env("server_host")}/api/data-queries/${queryId}/run`,
              headers,
              failOnStatusCode: false,
            }).then((runResponse) => {
              const responseData = runResponse.body?.data;
              const requestHeaders =
                runResponse.body?.metadata?.request?.headers || {};

              if (runResponse.body.status === "ok") {
                expect([200, 201]).to.include(runResponse.status);
                cy.log("Response:", responseData);
                if (
                  expectedResponseShape &&
                  typeof expectedResponseShape === "object"
                ) {
                  Object.entries(expectedResponseShape).forEach(
                    ([path, expected]) => {
                      const value = path
                        .split(".")
                        .reduce((obj, key) => obj?.[key], responseData);

                      if (expected === true) {
                        expect(value).to.not.be.undefined;
                      } else {
                        expect(value).to.eq(expected);
                      }
                    }
                  );
                }

                const expectedContentType = headersList.find(
                  ([key]) => key.toLowerCase() === "content-type"
                )?.[1];
                if (expectedContentType && requestHeaders["content-type"]) {
                  expect(requestHeaders["content-type"]).to.include(
                    expectedContentType
                  );
                }
                if (Array.isArray(responseData)) {
                  responseData.forEach((item) => {
                    expect(item).to.have.any.keys("id", "name", "price");
                  });
                }
                if (responseData?.id) {
                  cy.writeFile("cypress/fixtures/restAPI/storedId.json", {
                    id: responseData.id,
                  });
                }
              } else if (runResponse.body.status === "failed") {
                expect(runResponse.body.message).to.eq(
                  "Query could not be completed"
                );
                const statusCode =
                  runResponse.body?.metadata?.response?.statusCode;
                expect([400, 401, 403, 404, 500]).to.include(statusCode);
                cy.log(
                  "Failure validated as expected with status:",
                  statusCode
                );
              }
            });
          }
        });
      });
    });
  });
};
