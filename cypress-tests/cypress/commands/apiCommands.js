Cypress.Commands.add(
  "apiLogin",
  (userEmail = "dev@tooljet.io", userPassword = "password") => {
    cy.request(
      {
        url: "http://localhost:3000/api/authenticate",
        method: "POST",
        body: {
          email: userEmail,
          password: userPassword,
        },
      },
      { log: false }
    )
      .its("body", { log: false })
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
      expect(response.status).to.equal(201);

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
        Cookie: `tj_auth_token=${cookie.value}`,
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
    appId = Cypress.env("appId"),
    componentSelector = "[data-cy='empty-editor-text']"
  ) => {
    cy.window({ log: false }).then((win) => {
      win.localStorage.setItem("walkthroughCompleted", "true");
    });
    cy.visit(`/${Cypress.env("workspaceId")}/apps/${Cypress.env("appId")}`);
    cy.get(componentSelector, { timeout: 10000 });
  }
);

// cy.apiLogin();
// cy.apiCreateApp();
// cy.apiCreateGDS(
//   "http://localhost:3000/api/v2/data_sources",
//   "aaaaaadish",
//   "postgresql",
//   [
//     { key: "host", value: "localhost" },
//     { key: "port", value: 5432 },
//     { key: "database", value: "" },
//     { key: "username", value: "dev@tooljet.io" },
//     { key: "password", value: "password", encrypted: true },
//     { key: "ssl_enabled", value: true, encrypted: false },
//     { key: "ssl_certificate", value: "none", encrypted: false },
//   ]
// );
