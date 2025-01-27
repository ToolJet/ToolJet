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
});

Cypress.Commands.add("apiLogout", () => {
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
  "apiUserInvite",
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

Cypress.Commands.add("apiAddQuery", (queryName, query, dataQueryId) => {
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
  "apiAddComponentToApp",
  (
    appName,
    componentName,
    layoutConfig = {},
    componentType = "Text",
    componentValue = "default"
  ) => {
    cy.getAppId(appName).then((appId) => {
      const defaultLayout = {
        desktop: { top: 90, left: 9, width: 6, height: 40 },
        mobile: { top: 90, left: 9, width: 6, height: 40 },
      };

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

          let finalProperties = {};
          if (componentType === "Text") {
            finalProperties = {
              text: { value: `${componentValue}` },
            };
          } else if (componentType === "TextInput") {
            finalProperties = {
              value: { value: `${componentValue}` },
            };
          }

          const requestBody = {
            is_user_switched_version: false,
            pageId: homePageId,
            diff: {
              [componentId]: {
                name: componentName,
                layouts: layouts,
                type: componentType,
                properties: finalProperties,
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

Cypress.Commands.add("apiGetEnvironments", () => {
  cy.getAuthHeaders().then((headers) => {
    cy.request({
      method: "GET",
      url: `${Cypress.env("server_host")}/api/app-environments`,
      headers: headers,
    }).then((response) => {
      expect(response.status).to.equal(200);
      return response.body.environments;
    });
  });
});

Cypress.Commands.add(
  "apiCreateWsConstant",
  (constantName, value, types = [], environmentNames = []) => {
    cy.apiGetEnvironments().then((environments) => {
      const envIds = environmentNames
        .map((name) => environments.find((env) => env.name === name)?.id)
        .filter(Boolean);

      cy.getAuthHeaders().then((headers) => {
        types.forEach((type) => {
          cy.request({
            method: "POST",
            url: `${Cypress.env("server_host")}/api/organization-constants`,
            headers: headers,
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

Cypress.Commands.add("apiMakeAppPublic", (appId = Cypress.env("appId")) => {
  cy.getAuthHeaders().then((headers) => {
    cy.request({
      method: "PUT",
      url: `${Cypress.env("server_host")}/api/apps/${appId}`,
      headers: headers,
      body: {
        app: { is_public: true },
      },
      log: false,
    }).then((response) => {
      expect(response.status).to.equal(200);
    });
  });
});

Cypress.Commands.add("apiDeleteGranularPermission", (groupName) => {
  cy.getAuthHeaders().then((headers) => {

    // Fetch group permissions
    cy.request({
      method: "GET",
      url: `${Cypress.env("server_host")}/api/v2/group_permissions`,
      headers: headers,
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
  "apiCreateGranularPermission",
  (
    groupName,
    name,
    canEdit = false,
    canView = true,
    hideFromDashboard = false,
    resourcesToAdd = []
  ) => {
    cy.getAuthHeaders().then((headers) => {

      // Fetch group permissions
      cy.request({
        method: "GET",
        url: `${Cypress.env("server_host")}/api/v2/group_permissions`,
        headers: headers,
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
          headers: headers,
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
    cy.getAuthHeaders().then((headers) => {

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
            headers: headers,
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

Cypress.Commands.add("apiAddAppSlug", (appName, slug) => {
  cy.getAppId(appName).then((appId) => {
    cy.getAuthHeaders().then((headers) => {

      cy.request({
        method: "PUT",
        url: `${Cypress.env("server_host")}/api/apps/${appId}`,
        headers: headers,
        body: {
          app: {
            slug: slug,
          },
        },
      }).then((response) => {
        expect(response.status).to.eq(200);
        cy.log("App slug updated successfully");
      });
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

Cypress.Commands.add("apiGetDataSourceIdByName", (dataSourceName) => {
  cy.getAuthHeaders().then((headers) => {
    cy.request({
      method: "GET",
      url: `${Cypress.env("server_host")}/api/v2/data_sources`,
      headers: headers,
    }).then((response) => {
      expect(response.status).to.equal(200);
      const dataSource = response.body.data_sources.find(
        (ds) => ds.name === dataSourceName
      );
      return dataSource.id;
    });
  });
});

Cypress.Commands.add("getAuthHeaders", () => {
  cy.getCookie("tj_auth_token").then((cookie) => {
    return {
      "Tj-Workspace-Id": Cypress.env("workspaceId"),
      Cookie: `tj_auth_token=${cookie.value}`,
    };
  });
});

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
              { key: "host", value: "35.202.183.199" },
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
            url: `${Cypress.env("server_host")}/api/v2/data_sources/${dataSourceId}?environment_id=${environmentId}`,
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

