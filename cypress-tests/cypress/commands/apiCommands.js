const envVar = Cypress.env("environment");

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
      Cypress.env(`${name}`, response.body.id);

      Cypress.log({
        name: "Create Data Source",
        displayName: "Data source created",
        message: `:\nDatasource: '${kind}',\nName: '${name}'`,
      });
    });
  });
});

Cypress.Commands.add("apiFetchDataSourcesId", () => {
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
        type: "front-end",
        name: appName,
        is_maintenance_on: false,
        organization_id: "",
        user_id: "",
        created_at: "",
        updated_at: "",
        id: "",
        is_public: null,
        workflow_enabled: false,
        creation_mode: "DEFAULT",
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
    cy.intercept("GET", "/api/apps/*").as("getAppData");
    cy.window({ log: false }).then((win) => {
      win.localStorage.setItem("walkthroughCompleted", "true");
    });
    cy.visit(`/${workspaceId}/apps/${appId}/${slug}`);

    cy.wait("@getAppData").then((interception) => {
      const responseData = interception.response.body;

      Cypress.env("editingVersionId", responseData.editing_version.id);
      Cypress.env("environmentId", responseData.editorEnvironment.id);
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
      return response;
    });
  });
});

Cypress.Commands.add("apiLogout", () => {
  cy.getCookie("tj_auth_token").then((cookie) => {
    cy.request(
      {
        method: "GET",
        url: `${Cypress.env("server_host")}/api/session/logout`,
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
  (userName, userEmail, userRole = "end-user", metaData = {}) => {
    const requestBody =
      envVar === "Enterprise"
        ? {
          email: userEmail,
          firstName: userName,
          groups: [],
          lastName: "",
          role: userRole,
          userMetadata: metaData,
        }
        : {
          email: userEmail,
          firstName: userName,
          groups: [],
          lastName: "",
          role: userRole,
          userMetadata: metaData,
        };

    cy.getCookie("tj_auth_token").then((cookie) => {
      cy.request(
        {
          method: "POST",
          url: `${Cypress.env("server_host")}/api/organization-users`,
          headers: {
            "Tj-Workspace-Id": Cypress.env("workspaceId"),
            Cookie: `tj_auth_token=${cookie.value}`,
          },
          body: requestBody,
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

    cy.apiGetAppData(Cypress.env("appId")).then((appData) => {
      const editingVersionId = appData.editing_version.id;

      cy.request({
        method: "PATCH",
        url: `${Cypress.env("server_host")}/api/data-queries/${dataQueryId}/versions/${editingVersionId}`,
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
});

Cypress.Commands.add(
  "apiAddQueryToApp",
  ({ queryName, options, dsName, dsKind }) => {
    cy.getCookie("tj_auth_token", { log: false }).then((cookie) => {
      const authToken = cookie?.value;
      const workspaceId = Cypress.env("workspaceId");
      const appId = Cypress.env("appId");
      const commonHeaders = {
        "tj-workspace-id": workspaceId,
        Cookie: `tj_auth_token=${authToken}; app_id=${appId}`,
      };

      cy.request({
        method: "GET",
        url: `${Cypress.env("server_host")}/api/apps/${appId}`,
        headers: commonHeaders,
      }).then((appResponse) => {
        const editingVersionId = appResponse.body.editing_version.id;
        const currentEnvironmentId = appResponse.body.editorEnvironment.id;
        Cypress.env("version-id", editingVersionId);
        Cypress.env("environmentVersion-id", currentEnvironmentId);

        cy.request({
          method: "GET",
          url: `${Cypress.env("server_host")}/api/data-sources/${workspaceId}/environments/${currentEnvironmentId}/versions/${editingVersionId}`,
          headers: commonHeaders,
        }).then((dsResponse) => {
          const dataSource = dsResponse.body.data_sources.find(
            (ds) => ds.name === dsName
          );
          const dataSourceID = dataSource.id;
          Cypress.env(`${dsName}`, dataSourceID);

          cy.request({
            method: "POST",
            url: `${Cypress.env("server_host")}/api/data-queries/data-sources/${dataSourceID}/versions/${editingVersionId}`,
            headers: {
              "Content-Type": "application/json",
              "tj-workspace-id": workspaceId,
              Cookie: `tj_auth_token=${authToken}; app_id=${appId}`,
            },
            body: {
              app_id: appId,
              app_version_id: editingVersionId,
              name: queryName,
              kind: dsKind,
              options: options,
              data_source_id: dataSourceID,
              plugin_id: null,
            },
          }).then((queryResponse) => {
            expect(queryResponse.status).to.eq(201);
            Cypress.env("query-id", queryResponse.body.id);
            Cypress.log({
              name: "apiAddQueryToApp",
              displayName: "QUERY CREATED",
              message: `${queryName} (${dsKind})`,
            });
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
          url: `${Cypress.env("server_host")}/api/apps/${appId}`,
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

Cypress.Commands.add("apiDeleteGranularPermission", (groupName, typesToDelete = []) => {
  cy.getAuthHeaders().then((headers) => {
    // Step 1: Get the group by name
    cy.request({
      method: "GET",
      url: `${Cypress.env("server_host")}/api/v2/group-permissions`,
      headers,
      log: false,
    }).then((response) => {
      expect(response.status).to.equal(200);
      const group = response.body.groupPermissions.find((g) => g.name === groupName);
      if (!group) throw new Error(`Group with name ${groupName} not found`);

      const groupId = group.id;

      // Step 2: Get all granular permissions for the group
      cy.request({
        method: "GET",
        url: `${Cypress.env("server_host")}/api/v2/group-permissions/${groupId}/granular-permissions`,
        headers,
        log: false,
      }).then((granularResponse) => {
        expect(granularResponse.status).to.equal(200);
        const granularPermissions = granularResponse.body;

        // Step 3: Filter if typesToDelete is specified
        const permissionsToDelete = typesToDelete.length
          ? granularPermissions.filter((perm) => typesToDelete.includes(perm.type))
          : granularPermissions;

        // Step 4: Delete each granular permission
        permissionsToDelete.forEach((permission) => {
          cy.request({
            method: "DELETE",
            url: `${Cypress.env("server_host")}/api/v2/group-permissions/granular-permissions/app/${permission.id}`,
            headers,
            log: false,
          }).then((deleteResponse) => {
            expect(deleteResponse.status).to.equal(200);
            cy.log(`Deleted granular permission: ${permission.name}`);
          });
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
        url: `${Cypress.env("server_host")}/api/v2/group-permissions`,
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
          url: `${Cypress.env("server_host")}/api/v2/group-permissions/granular-permissions`,
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
        url: `${Cypress.env("server_host")}/api/apps/${appId}`,
        headers,
      })
        .then((response) => {
          expect(response.status).to.eq(200);
          const editingVersionId = response.body.editing_version.id;
          cy.request({
            method: "PUT",
            url: `${Cypress.env("server_host")}/api/apps/${appId}/release`,
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
  const workspaceId = Cypress.env("workspaceId");
  cy.getAuthHeaders().then((headers) => {
    cy.request({
      method: "GET",
      url: `${Cypress.env("server_host")}/api/data-sources/${workspaceId}`,
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

Cypress.Commands.add("apiGetAppData", (appId = Cypress.env("appId")) => {
  cy.getAuthHeaders().then((headers) => {
    cy.request({
      method: "GET",
      url: `${Cypress.env("server_host")}/api/apps/${appId}`,
      headers: headers,
    }).then((response) => {
      expect(response.status).to.equal(200);
      return response.body;
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

Cypress.Commands.add("apiRunQuery", () => {
  cy.getCookie("tj_auth_token", { log: false }).then((cookie) => {
    const authToken = cookie?.value;
    const workspaceId = Cypress.env("workspaceId");
    const appId = Cypress.env("appId");

    const queryId = Cypress.env("query-id");
    const versionId = Cypress.env("version-id");
    const currentEnvironmentId = Cypress.env("environmentVersion-id");

    cy.request({
      method: "POST",
      url: `${Cypress.env("server_host")}/api/data-queries/${queryId}/versions/${versionId}/run/${currentEnvironmentId}`,
      headers: {
        "Content-Type": "application/json",
        "tj-workspace-id": workspaceId,
        Cookie: `tj_auth_token=${authToken}; app_id=${appId}`,
      },
      body: {},
    }).then((runResponse) => {
      expect(runResponse.status).to.eq(201);

      Cypress.log({
        name: "apiRunQuery",
        displayName: "QUERY RUN",
        message: `Ran query ${queryId} (version ${versionId})`,
      });
    });
  });
});

Cypress.Commands.add("apiUpdateSSOConfig", (ssoConfig, level = "workspace") => {
  cy.getAuthHeaders().then((headers) => {
    const endpoints = {
      workspace: "/api/login-configs/organization-sso",
      instance: "/api/login-configs/instance-sso",
    };
    const url = `${Cypress.env("server_host")}${endpoints[level] || endpoints.workspace}`;

    cy.request({
      method: "PATCH",
      url: url,
      headers: headers,
      body: ssoConfig,
    }).then((response) => {
      expect(response.status).to.equal(200);
      cy.log("SSO configuration updated successfully.");
    });
  });
});

Cypress.Commands.add(
  "loginByKeycloak",
  (username, password, codeVerifier, tjAuthToken) => {
    cy.then(() => {
      return generateCodeChallenge(codeVerifier);
    }).then((codeChallenge) => {
      cy.request({
        method: "POST",
        url: "http://localhost:8080/realms/tooljet/protocol/openid-connect/token?state=22f22523-7bc2-4134-891d-88bdfec073cd",
        form: true,
        body: {
          grant_type: "password",
          client_id: "tooljet_app",
          client_secret: "cWBBO423mwaW7v3zYV3RbcE797Dm5jZS",
          username,
          password,
        },
      }).then((response) => {
        const token = response.body.access_token;
        const state = response.body.session_state;
        const redirectUri = `${Cypress.env("redirect_uri")}`;

        cy.setCookie("oidc_code_verifier", codeVerifier);
        cy.setCookie("app_id", "cb4347c2-b2a8-4c1c-91b4-fcc789ea9a08");
        cy.setCookie("tj_auth_token", tjAuthToken);

        const authUrl =
          `${Cypress.env("keycloak_url")}` +
          `client_id=tooljet_app` +
          `&scope=phone openid email profile groups` +
          `&response_type=code` +
          `&redirect_uri=${redirectUri}` +
          `&code_challenge=${codeChallenge}` +
          `&code_challenge_method=S256` +
          `&state=22f22523-7bc2-4134-891d-88bdfec073cd`;
        cy.visit(authUrl);
      });
    });
  }
);

Cypress.Commands.add(
  "getSsoConfigId",
  (ssoType, workspaceSlug = "my-workspace") => {
    cy.request(
      `${Cypress.env("server_host")}/api/login-configs/${workspaceSlug}/public`
    ).then((response) => {
      const configSection = response.body.sso_configs[ssoType];
      return (
        configSection?.configs?.sso_config_id ||
        configSection?.config_id ||
        null
      );
    });
  }
);

Cypress.Commands.add(
  "oidcLogin",
  ({
    username,
    password,
    redirectUri,
    clientId,
    clientSecret,
    oktaDomain,
    organizationId,
    redirectTo = "/",
  }) => {
    cy.intercept("POST", "/api/oauth/sign-in/*", (req) => {
      // Inject missing params if not present
      if (!req.body.organizationId) {
        req.body.organizationId = organizationId;
      }
      if (!req.body.redirectTo) {
        req.body.redirectTo = redirectTo;
      }
      req.continue(); // Send the modified request
    }).as("oidcSignIn");
    cy.getSsoConfigId("openid").then((ssoConfigId) => {
      const configIdToUse = ssoConfigId;
      let url;
      if (!configIdToUse) {
        url = `${Cypress.env("server_host")}/api/oauth/openid/configs`;
      } else {
        url = `${Cypress.env("server_host")}/api/oauth/openid/configs/${configIdToUse}`;
      }

      cy.request({
        method: "GET",
        url: url,
        headers: {
          Accept: "*/*",
          "Content-Type": "application/json",
        },
      }).then((configResp) => {
        expect(configResp.status).to.eq(200);

        const autherizationUrl = configResp.body.authorizationUrl;
        cy.request({
          method: "POST",
          url: `https://${oktaDomain}/api/v1/authn`,
          body: {
            username,
            password,
          },
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
          },
        })
          .then((authnResp) => {
            expect(authnResp.body.status).to.eq("SUCCESS");
            const sessionToken = authnResp.body.sessionToken;

            const authorizeUrl =
              `https://${oktaDomain}/oauth2/v1/authorize` +
              `?client_id=${clientId}` +
              `&response_type=code` +
              `&scope=openid email profile` +
              `&redirect_uri=${encodeURIComponent(redirectUri)}` +
              `&state=teststate1` +
              `&nonce=randomvalue` +
              `&sessionToken=${sessionToken}`;

            cy.request({
              method: "GET",
              url: authorizeUrl,
              followRedirect: false,
            });
          })
          .then((authResp) => {
            const redirectUrl = authResp.headers["location"];
            const params = new URL(redirectUrl).searchParams;
            const code = params.get("code");
            // 6. Exchange code for tokens
            cy.request({
              method: "POST",
              url: `https://${oktaDomain}/oauth2/v1/token`,
              form: true,
              body: {
                grant_type: "authorization_code",
                code,
                redirect_uri: redirectUri,
                client_id: clientId,
                client_secret: clientSecret,
              },
            });
          })
          .then((tokenResp) => {
            cy.visit(autherizationUrl);
          });
      });
    });
  }
);
