Cypress.Commands.add(
  "apiLogin",
  (
    userEmail = "dev@tooljet.io",
    userPassword = "password",
    workspaceId = ""
  ) => {
    cy.request({
      url: `http://localhost:3000/api/authenticate/${workspaceId}`,
      method: "POST",
      body: {
        email: userEmail,
        password: userPassword,
      },
    })
      .its("body")
      .then((res) => {
        Cypress.env("workspaceId", res.current_organization_id);
        Cypress.log({
          name: "Api login",
          displayName: "LOGIN: ",
          message: `: Success`,
        });
      });
  }
);

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
      Cypress.env(`${name}-id`, response.body.id);

      Cypress.log({
        name: "Create Data Source",
        displayName: "Data source created",
        message: `:\nDatasource: '${kind}',\nName: '${name}'`,
      });
    });
  });
});

Cypress.Commands.add("apiCreateApp", (appName = "testApp") => {
  cy.window({ log: false }).then((win) => {
    win.localStorage.setItem("walkthroughCompleted", "true");
  });
  cy.getCookie("tj_auth_token", { log: false }).then((cookie) => {
    Cypress.env("authToken", `tj_auth_token=${cookie.value}`);
    cy.request({
      method: "POST",
      url: "http://localhost:3000/api/apps",
      headers: {
        "Tj-Workspace-Id": Cypress.env("workspaceId"),
        Cookie: `tj_auth_token = ${cookie.value}`,
      },
      body: {
        created_at: "",
        id: "",
        is_maintenance_on: false,
        is_public: null,
        name: appName,
        organization_id: "",
        updated_at: "",
        user_id: "",
      },
    }).then((response) => {
      {
        log: false;
      }
      expect(response.status).to.equal(201);
      Cypress.env("appId", response.allRequestResponses[0]["Response Body"].id);
      Cypress.log({
        name: "App create",
        displayName: "APP CREATED",
        message: `: ${response.body.name}`,
      });
    });
  });
});

Cypress.Commands.add("apiDeleteApp", (appId = Cypress.env("appId")) => {
  cy.request(
    {
      method: "DELETE",
      url: `http://localhost:3000/api/apps/${Cypress.env("appId")}`,
      headers: {
        "Tj-Workspace-Id": Cypress.env("workspaceId"),
        Cookie: Cypress.env("authToken"),
      },
    },
    { log: false }
  ).then((response) => {
    expect(response.status).to.equal(200);
    Cypress.log({
      name: "App Delete",
      displayName: "APP DELETED",
      message: `: ${Cypress.env("appId")}`,
    });
  });
});

Cypress.Commands.add(
  "openApp",
  (
    workspaceId = Cypress.env("workspaceId"),
    appId = Cypress.env("appId"),
    componentSelector = "[data-cy='empty-editor-text']"
  ) => {
    cy.window({ log: false }).then((win) => {
      win.localStorage.setItem("walkthroughCompleted", "true");
    });
    cy.visit(`/${workspaceId}/apps/${appId}`);
    cy.get(componentSelector, { timeout: 10000 });
  }
);

Cypress.Commands.add("apiCreateWorkspace", (workspaceName, workspaceSlug) => {
  cy.getCookie("tj_auth_token").then((cookie) => {
    cy.request(
      {
        method: "POST",
        url: "http://localhost:3000/api/organizations",
        headers: {
          "Tj-Workspace-Id": Cypress.env("workspaceId"),
          Cookie: `tj_auth_token=${cookie.value}`,
        },
        body: {
          name: workspaceName,
          slug: workspaceSlug,
        },
      },
      { log: false }
    ).then((response) => {
      expect(response.status).to.equal(201);
    });
  });
});

Cypress.Commands.add("logoutApi", () => {
  cy.getCookie("tj_auth_token").then((cookie) => {
    cy.request(
      {
        method: "GET",
        url: "http://localhost:3000/api/logout",
        headers: {
          "Tj-Workspace-Id": Cypress.env("workspaceId"),
          Cookie: `tj_auth_token=${cookie.value}`,
        },
      },
      { log: false }
    ).then((response) => {
      expect(response.status).to.equal(200);
    });
  });
});

Cypress.Commands.add("userInviteApi", (userName, userEmail) => {
  cy.getCookie("tj_auth_token").then((cookie) => {
    cy.request(
      {
        method: "POST",
        url: "http://localhost:3000/api/organization_users",
        headers: {
          "Tj-Workspace-Id": Cypress.env("workspaceId"),
          Cookie: `tj_auth_token=${cookie.value}`,
        },
        body: {
          first_name: userName,
          email: userEmail,
          groups: [],
        },
      },
      { log: false }
    ).then((response) => {
      expect(response.status).to.equal(201);
    });
  });
});

Cypress.Commands.add("addQueryApi", (queryName, query, dataQueryId) => {
  cy.getCookie("tj_auth_token").then((cookie) => {
    const headers = {
      "Tj-Workspace-Id": Cypress.env("workspaceId"),
      Cookie: `tj_auth_token=${cookie.value}`,
    };
    cy.request({
      method: "PATCH",
      url: `http://localhost:3000/api/data_queries/${dataQueryId}`,
      headers: headers,
      body: {
        name: queryName,
        options: {
          mode: "sql",
          transformationLanguage: "javascript",
          enableTransformation: false,
          query: query,
        },
      },
    }).then((patchResponse) => {
      expect(patchResponse.status).to.equal(200);
    });
  });
});

Cypress.Commands.add(
  "apiAddQueryToApp",
  (queryName, options, dsName, dsKind) => {
    cy.getCookie("tj_auth_token", { log: false }).then((cookie) => {
      const authToken = `tj_auth_token=${cookie.value}`;
      const workspaceId = Cypress.env("workspaceId");
      const appId = Cypress.env("appId");

      cy.request({
        method: "GET",
        url: `http://localhost:3000/api/apps/${appId}`,
        headers: {
          "Tj-Workspace-Id": workspaceId,
          Cookie: `${authToken}; app_id=${appId}`,
        },
        body: {},
      }).then((appResponse) => {
        const editingVersionId = appResponse.body.editing_version.id;
        Cypress.env("version-id", editingVersionId);

        cy.request({
          method: "POST",
          url: "http://localhost:3000/api/data_queries",
          headers: {
            "Content-Type": "application/json",
            Cookie: authToken,
            "tj-workspace-id": workspaceId,
          },
          body: {
            app_id: appId,
            app_version_id: editingVersionId,
            name: queryName,
            kind: dsKind,
            options: options,
            data_source_id: dsName != null ? Cypress.env(`${dsName}-id`) : null,
            plugin_id: null,
          },
        }).then((queryResponse) => {
          expect(queryResponse.status).to.equal(201);
          Cypress.log({
            name: "Created queery",
            displayName: "QUERY CREATED",
            message: `: ${queryName}: ${dsKind}`,
          });
        });
      });
    });
  }
);
