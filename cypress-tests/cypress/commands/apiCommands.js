Cypress.Commands.add(
  "apiLogin",
  (
    userEmail = "dev@tooljet.io",
    userPassword = "password",
    workspaceId = "",
    redirection = "/"
  ) => {
    cy.request({
      url: `${Cypress.env("server_host")}/api/authenticate/${workspaceId}`,
      method: "POST",
      body: {
        email: userEmail,
        password: userPassword,
        redirectTo: redirection,
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
      url: `${Cypress.env("server_host")}/api/apps`,
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
      url: `${Cypress.env("server_host")}/api/apps/${Cypress.env("appId")}`,
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
    slug = "",
    workspaceId = Cypress.env("workspaceId"),
    appId = Cypress.env("appId"),
    componentSelector = "[data-cy='empty-editor-text']"
  ) => {
    cy.intercept("GET", "/api/v2/apps/*").as("getAppData");
    cy.window({ log: false }).then((win) => {
      win.localStorage.setItem("walkthroughCompleted", "true");
    });
    cy.visit(`/${workspaceId}/apps/${appId}/${slug}`);

    cy.wait("@getAppData").then((interception) => {
      // Assuming the response body is a JSON object
      const responseData = interception.response.body;

      // Set the response data as an environment variable
      Cypress.env("apiResponseData", responseData);

      // You can log it to check if the env var is set correctly
      cy.log(Cypress.env("apiResponseData"));
    });
    cy.get(componentSelector, { timeout: 10000 });
  }
);

Cypress.Commands.add("apiCreateWorkspace", (workspaceName, workspaceSlug) => {
  cy.getCookie("tj_auth_token").then((cookie) => {
    cy.request(
      {
        method: "POST",
        url: `${Cypress.env("server_host")}/api/organizations`,
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
  cy.logoutApi();
  cy.apiLogin();
});

Cypress.Commands.add("logoutApi", () => {
  cy.getCookie("tj_auth_token").then((cookie) => {
    cy.request(
      {
        method: "GET",
        url: `${Cypress.env("server_host")}/api/logout`,
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

Cypress.Commands.add(
  "userInviteApi",
  (userName, userEmail, userRole = "end-user") => {
    cy.getCookie("tj_auth_token").then((cookie) => {
      cy.request(
        {
          method: "POST",
          url: `${Cypress.env("server_host")}/api/organization_users`,
          headers: {
            "Tj-Workspace-Id": Cypress.env("workspaceId"),
            Cookie: `tj_auth_token=${cookie.value}`,
          },
          body: {
            first_name: userName,
            email: userEmail,
            groups: [],
            role: userRole,
          },
        },
        { log: false }
      ).then((response) => {
        expect(response.status).to.equal(201);
      });
    });
  }
);

Cypress.Commands.add("addQueryApi", (queryName, query, dataQueryId) => {
  cy.getCookie("tj_auth_token").then((cookie) => {
    const headers = {
      "Tj-Workspace-Id": Cypress.env("workspaceId"),
      Cookie: `tj_auth_token=${cookie.value}`,
    };
    cy.request({
      method: "PATCH",
      url: `${Cypress.env("server_host")}/api/data_queries/${dataQueryId}`,
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
        url: `${Cypress.env("server_host")}/api/apps/${appId}`,
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
          url: `${Cypress.env("server_host")}/api/data_queries`,
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

Cypress.Commands.add(
  "addComponentToApp",
  (appName, componentName, layoutConfig = {}) => {
    cy.getAppId(appName).then((appId) => {

      // Default layout values
      const defaultLayout = {
        desktop: { top: 90, left: 9, width: 6, height: 40 },
        mobile: { top: 90, left: 9, width: 6, height: 40 },
      };

      // Merge default layout with the provided configuration
      const layouts = {
        desktop: { ...defaultLayout.desktop, ...layoutConfig.desktop },
        mobile: { ...defaultLayout.mobile, ...layoutConfig.mobile },
      };

      cy.getCookie("tj_auth_token", { log: false }).then((cookie) => {
        Cypress.env("authToken", `tj_auth_token=${cookie.value}`);

        cy.request({
          method: "GET",
          url: `${Cypress.env("server_host")}/api/v2/apps/${appId}`,
          headers: {
            "Tj-Workspace-Id": Cypress.env("workspaceId"),
            Cookie: `tj_auth_token=${cookie.value}`,
          },
        }).then((response) => {
          expect(response.status).to.eq(200);

          const { id: editingVersionId, home_page_id: homePageId } =
            response.body.editing_version;
          const componentId = crypto.randomUUID
            ? crypto.randomUUID()
            : require("uuid").v4();

          const requestBody = {
            is_user_switched_version: false,
            pageId: homePageId,
            diff: {
              [componentId]: {
                name: componentName,
                layouts: layouts,
                type: "Text",
              },
            },
          };

          cy.request({
            method: "POST",
            url: `${Cypress.env("server_host")}/api/v2/apps/${appId}/versions/${editingVersionId}/components`,
            headers: {
              "Content-Type": "application/json",
              "Tj-Workspace-Id": Cypress.env("workspaceId"),
              Cookie: `tj_auth_token=${cookie.value}`,
            },
            body: requestBody,
          }).then((postResponse) => {
            expect(postResponse.status).to.eq(201);
            cy.log(`Component ${componentId} added successfully`);
          });
        });
      });
    });
  }
);

Cypress.Commands.add(
  "apiCreateWsConstant",
  (constantName, value, types = [], environmentNames = []) => {
    cy.getCookie("tj_auth_token").then((cookie) => {
      cy.request({
        method: "GET",
        url: `${Cypress.env("server_host")}/api/app-environments`,
        headers: {
          "Tj-Workspace-Id": Cypress.env("workspaceId"),
          Cookie: `tj_auth_token=${cookie.value}`,
        },
      }).then((response) => {
        expect(response.status).to.equal(200);

        const environments = response.body.environments;

        const envIds = environmentNames
          .map((name) => environments.find((env) => env.name === name)?.id)
          .filter(Boolean);

        types.forEach((type) => {
          cy.request({
            method: "POST",
            url: `${Cypress.env("server_host")}/api/organization-constants`,
            headers: {
              "Tj-Workspace-Id": Cypress.env("workspaceId"),
              Cookie: `tj_auth_token=${cookie.value}`,
            },
            body: {
              constant_name: constantName,
              value: value,
              type: type,
              environments: envIds,
            },
          }).then((createResponse) => {
            expect(createResponse.status).to.equal(201);
          });
        });
      });
    });
  }
);

Cypress.Commands.add("makeAppPublic", (appId = Cypress.env("appId")) => {
  cy.getCookie("tj_auth_token", { log: false }).then((cookie) => {
    const authToken = `tj_auth_token=${cookie.value}`;
    cy.request({
      method: "PUT",
      url: `${Cypress.env("server_host")}/api/apps/${appId}`,
      headers: {
        "Tj-Workspace-Id": Cypress.env("workspaceId"),
        Cookie: authToken,
      },
      body: {
        app: { is_public: true },
      },
      log: false,
    }).then((response) => {
      expect(response.status).to.equal(200);
    });
  });
});

Cypress.Commands.add("deleteGranularPermission", (groupName) => {
  cy.getCookie("tj_auth_token", { log: false }).then((cookie) => {
    const authToken = `tj_auth_token=${cookie.value}`;
    const headers = {
      "Tj-Workspace-Id": Cypress.env("workspaceId"),
      Cookie: authToken,
    };

    // Fetch group permissions
    cy.request({
      method: "GET",
      url: `${Cypress.env("server_host")}/api/v2/group_permissions`,
      headers,
      log: false,
    }).then((response) => {
      expect(response.status).to.equal(200);
      const group = response.body.groupPermissions.find(
        (g) => g.name === groupName
      );
      if (!group) throw new Error(`Group with name ${groupName} not found`);

      const groupId = group.id;

      // Fetch granular permissions for the specific group
      cy.request({
        method: "GET",
        url: `${Cypress.env("server_host")}/api/v2/group_permissions/${groupId}/granular-permissions`,
        headers,
        log: false,
      }).then((granularResponse) => {
        expect(granularResponse.status).to.equal(200);
        const granularPermissionId = granularResponse.body[0].id;

        // Delete the granular permission
        cy.request({
          method: "DELETE",
          url: `${Cypress.env("server_host")}/api/v2/group_permissions/granular-permissions/${granularPermissionId}`,
          headers,
          log: false,
        }).then((deleteResponse) => {
          expect(deleteResponse.status).to.equal(200);
        });
      });
    });
  });
});

Cypress.Commands.add(
  "createGranularPermission",
  (
    groupName,
    name,
    canEdit = false,
    canView = true,
    hideFromDashboard = false,
    resourcesToAdd = []
  ) => {
    cy.getCookie("tj_auth_token", { log: false }).then((cookie) => {
      const authToken = `tj_auth_token=${cookie.value}`;
      const headers = {
        "Tj-Workspace-Id": Cypress.env("workspaceId"),
        Cookie: authToken,
      };

      // Fetch group permissions
      cy.request({
        method: "GET",
        url: `${Cypress.env("server_host")}/api/v2/group_permissions`,
        headers,
        log: false,
      }).then((response) => {
        expect(response.status).to.equal(200);
        const group = response.body.groupPermissions.find(
          (g) => g.name === groupName
        );
        if (!group) throw new Error(`Group with name ${groupName} not found`);

        const groupId = group.id;

        // Create granular permission
        cy.request({
          method: "POST",
          url: `${Cypress.env("server_host")}/api/v2/group_permissions/granular-permissions`,
          headers,
          body: {
            name,
            type: "app",
            groupId,
            isAll: true,
            createAppsPermissionsObject: {
              canEdit,
              canView,
              hideFromDashboard,
              resourcesToAdd,
            },
          },
          log: false,
        }).then((res) => {
          expect(res.status).to.equal(201);
        });
      });
    });
  }
);

Cypress.Commands.add("apiReleaseApp", (appName) => {
  cy.getAppId(appName).then((appId) => {
    cy.getCookie("tj_auth_token", { log: false }).then((cookie) => {
      const authToken = `tj_auth_token=${cookie.value}`;
      const headers = {
        "Tj-Workspace-Id": Cypress.env("workspaceId"),
        Cookie: authToken,
      };

      cy.request({
        method: "GET",
        url: `${Cypress.env("server_host")}/api/v2/apps/${appId}`,
        headers,
      })
        .then((response) => {
          expect(response.status).to.eq(200);
          const editingVersionId = response.body.editing_version.id;
          cy.request({
            method: "PUT",
            url: `${Cypress.env("server_host")}/api/v2/apps/${appId}/release`,
            headers,
            body: {
              versionToBeReleased: editingVersionId,
            },
          });
        })
        .then((res) => {
          expect(res.status).to.eq(200);
        });
    });
  });
});

Cypress.Commands.add("addAppSlug", (appName, slug) => {
  cy.getAppId(appName).then((appId) => {
    cy.getCookie("tj_auth_token", { log: false }).then((cookie) => {
      const authToken = `tj_auth_token=${cookie.value}`;
      const headers = {
        "Tj-Workspace-Id": Cypress.env("workspaceId"),
        Cookie: authToken,
      };

      cy.request({
        method: "PUT",
        url: `${Cypress.env("server_host")}/api/apps/${appId}`,
        headers,
        body: {
          app: {
            slug: slug,
          },
        },
      }).then((response) => {
        expect(response.status).to.eq(200);
        cy.log('App slug updated successfully');
      });
    });
  });
});

Cypress.Commands.add("getAppId", (appName) => {
  cy.task("updateId", {
    dbconfig: Cypress.env("app_db"),
    sql: `select id from apps where name='${appName}';`,
  }).then((resp) => {
    const appId = resp.rows[0]?.id;
    return appId;
  });
});
