const envVar = Cypress.env("environment");

const licenseKeys = {
  valid: Cypress.env("validLicenseKey"),
  expired: Cypress.env("expiredLicenseKey"),
};

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

Cypress.Commands.add("apiLogout", (cachedHeader = false) => {
  cy.getAuthHeaders(cachedHeader).then((headers) => {
    cy.request(
      {
        method: "GET",
        url: `${Cypress.env("server_host")}/api/session/logout`,
        headers: headers,
      },
      { log: false }
    ).then((response) => {
      expect(response.status).to.equal(200);
    });
  });
});

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
  "apiCreateWorkspace",
  (workspaceName, workspaceSlug, cacheHeaders = false) => {
    cy.getAuthHeaders().then((headers) => {
      return cy
        .request({
          method: "POST",
          url: `${Cypress.env("server_host")}/api/organizations`,
          headers: headers,
          body: {
            name: workspaceName,
            slug: workspaceSlug,
          },
          log: false,
        })
        .then((response) => {
          expect(response.status).to.equal(201);
          Cypress.log({
            name: "Create Workspace :",
            message: ` ${workspaceName}`,
          });
          // Cypress.env("workspaceId", response.body.organization_id);
          return response;
        });
    });
  }
);

Cypress.Commands.add(
  "apiUserInvite",
  (userName, userEmail, userRole = "end-user", metaData = {}, groups = []) => {
    let normalizedMetaData = metaData;
    if (Array.isArray(metaData)) {
      normalizedMetaData = Object.fromEntries(metaData);
    }

    const requestBody = {
      email: userEmail,
      firstName: userName,
      groups: groups,
      lastName: "",
      role: userRole,
      userMetadata: normalizedMetaData,
    };

    cy.getAuthHeaders().then((headers) => {
      cy.request(
        {
          method: "POST",
          url: `${Cypress.env("server_host")}/api/organization-users`,
          headers: headers,
          body: requestBody,
        },
        { log: false }
      ).then((response) => {
        expect(response.status).to.equal(201);
      });
    });
  }
);

Cypress.Commands.add(
  "apiCreateWorkspaceConstant",
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
            const id = createResponse.body.constant.id;
          });
        });
      });
    });
  }
);

Cypress.Commands.add("apiUpdateWsConstant", (id, updateValue, envName) => {
  cy.apiGetEnvironments().then((environments) => {
    const environment = environments.find((env) => env.name === envName);
    const envId = environment.id;

    cy.getAuthHeaders().then((headers) => {
      cy.request({
        method: "PATCH",
        url: `${Cypress.env("server_host")}/api/organization-constants/${id}`,
        headers: headers,
        body: {
          value: String(updateValue),
          environment_id: envId,
        },
      }).then((response) => {
        expect(response.status).to.equal(200);
        response.body;
      });
    });
  });
});

Cypress.Commands.add("apiGetGroupId", (groupName) => {
  return cy.getAuthHeaders().then((headers) => {
    return cy
      .request({
        method: "GET",
        url: `${Cypress.env("server_host")}/api/v2/group-permissions`,
        headers: headers,
        log: false,
      })
      .then((response) => {
        expect(response.status).to.equal(200);
        const group = response.body.groupPermissions.find(
          (g) => g.name === groupName
        );
        if (!group) throw new Error(`Group with name ${groupName} not found`);
        return group.id;
      });
  });
});

Cypress.Commands.add("apiGetDatasourceIds", (datasourceNames) => {
  const namesArray = Array.isArray(datasourceNames)
    ? datasourceNames
    : [datasourceNames];

  return cy.getAuthHeaders().then((headers) => {
    return cy
      .request({
        method: "GET",
        url: `${Cypress.env("server_host")}/api/data-sources/${Cypress.env("workspaceId")}`,
        headers: headers,
        log: false,
      })
      .then((response) => {
        expect(response.status).to.equal(200);

        const dsIds = namesArray
          .map((dsName) => {
            const normalizedSearchName = dsName.toLowerCase().trim();
            const ds = response.body.data_sources.find(
              (d) => d.name.toLowerCase().trim() === normalizedSearchName
            );
            return ds?.id;
          })
          .filter(Boolean);

        return dsIds;
      });
  });
});

Cypress.Commands.add("apiGetAppIdByName", (appName) => {
  return cy.getAuthHeaders().then((headers) => {
    return cy
      .request({
        method: "GET",
        url: `${Cypress.env("server_host")}/api/apps`,
        headers: headers,
        log: false,
      })
      .then((response) => {
        expect(response.status).to.equal(200);
        const app = response.body.apps.find((app) => app.name === appName);
        expect(app, `App with name "${appName}" not found`).to.exist;
        return app.id;
      });
  });
});

Cypress.Commands.add("apiGetUserDetails", (options = {}) => {
  const { page = 1 } = options;

  return cy.getAuthHeaders().then((headers) => {
    return cy
      .request({
        method: "GET",
        url: `${Cypress.env("server_host")}/api/organization-users`,
        headers: headers,
        qs: { page },
        log: false,
      })
      .then((response) => {
        expect(response.status).to.equal(200);
        return response;
      });
  });
});

Cypress.Commands.add("apiUpdateUserRole", (email, role) => {
  return cy.apiGetUserDetails().then((response) => {
    const userId = response.body.users.find((u) => u.email === email).user_id;
    return cy.getAuthHeaders().then((headers) => {
      return cy
        .request({
          method: "PUT",
          url: `${Cypress.env("server_host")}/api/v2/group-permissions/role/user`,
          headers: headers,
          body: {
            newRole: role,
            userId: userId,
          },
        })
        .then((response) => {
          expect(response.status).to.equal(200);
        });
    });
  });
});

Cypress.Commands.add("apiUpdateSuperAdmin", (userId, userType = "instance") => {
  if (!userId) {
    throw new Error("userId is required to update user type");
  }

  return cy.getAuthHeaders().then((headers) => {
    return cy
      .request({
        method: "PATCH",
        url: `${Cypress.env("server_host")}/api/users/user-type/instance`,
        headers: headers,
        body: {
          userId: userId,
          userType: userType,
        },
        log: false,
      })
      .then((response) => {
        expect(response.status).to.equal(200);
        Cypress.log({
          name: "Super Admin",
          message: `Updated user type to ${userType}`,
        });
      });
  });
});

Cypress.Commands.add(
  "apiCreateGranularPermission",
  (
    groupName,
    name,
    resourceType = "app",
    permissions = {},
    resourcesToAdd = [],
    isAll = true
  ) => {
    // Normalize resourcesToAdd to always be an array
    const normalizedResources = Array.isArray(resourcesToAdd)
      ? resourcesToAdd
      : [resourcesToAdd];

    const formatResources = (type, resources, isAll) => {
      if (isAll) return [];
      return type === "datasource"
        ? resources.map((id) => ({ dataSourceId: id }))
        : resources.map((id) => ({ appId: id }));
    };

    const buildPermissionObject = (type, perms, formattedResources) => {
      if (type === "data_source") {
        return {
          action: {
            canUse: perms.canUse ?? true,
            canConfigure: perms.canConfigure ?? false,
          },
          resourcesToAdd: formattedResources,
        };
      }
      return {
        canEdit: perms.canEdit ?? false,
        canView: perms.canView ?? true,
        hideFromDashboard: perms.hideFromDashboard ?? false,
        resourcesToAdd: formattedResources,
      };
    };

    const buildRequestBody = (
      isEnterprise,
      name,
      type,
      groupId,
      isAll,
      permObj
    ) => {
      const baseBody = { name, groupId, isAll };
      if (isEnterprise) {
        return {
          ...baseBody,
          type,
          createResourcePermissionObject: permObj,
        };
      }
      return {
        ...baseBody,
        type: "app",
        createAppsPermissionsObject: permObj,
      };
    };

    const sendRequest = (url, headers, body, resourceType, name) => {
      cy.request({
        method: "POST",
        url,
        headers,
        body,
        log: false,
      }).then((res) => {
        expect(res.status).to.equal(201);
      });
    };

    cy.getAuthHeaders().then((headers) => {
      cy.apiGetGroupId(groupName).then((groupId) => {
        const isEnterprise = Cypress.env("environment") === "Enterprise";
        const typeMap = {
          app: { type: "app", endpoint: "app" },
          workflow: { type: "workflow", endpoint: "data-source" },
          datasource: { type: "data_source", endpoint: "data-source" },
        };
        const { type, endpoint } = typeMap[resourceType] || typeMap.app;
        const url = isEnterprise
          ? `${Cypress.env("server_host")}/api/v2/group-permissions/${groupId}/granular-permissions/${endpoint}`
          : `${Cypress.env("server_host")}/api/v2/group-permissions/granular-permissions`;

        if (resourceType === "datasource" && !isAll) {
          cy.apiGetDatasourceIds(normalizedResources).then((dsIds) => {
            const formattedResources = formatResources(
              "datasource",
              dsIds,
              false
            );
            const permissionObject = buildPermissionObject(
              type,
              permissions,
              formattedResources
            );
            const body = buildRequestBody(
              isEnterprise,
              name,
              type,
              groupId,
              false,
              permissionObject
            );
            sendRequest(url, headers, body, resourceType, name);
          });
        } else {
          const formattedResources = formatResources(
            resourceType,
            normalizedResources,
            isAll
          );
          const permissionObject = buildPermissionObject(
            type,
            permissions,
            formattedResources
          );
          const body = buildRequestBody(
            isEnterprise,
            name,
            type,
            groupId,
            isAll,
            permissionObject
          );
          sendRequest(url, headers, body, resourceType, name);
        }
      });
    });
  }
);

Cypress.Commands.add(
  "apiDeleteGranularPermission",
  (groupName, typesToDelete = []) => {
    cy.getAuthHeaders().then((headers) => {
      cy.apiGetGroupId(groupName).then((groupId) => {
        cy.request({
          method: "GET",
          url: `${Cypress.env("server_host")}/api/v2/group-permissions/${groupId}/granular-permissions`,
          headers,
          log: false,
        }).then((granularResponse) => {
          expect(granularResponse.status).to.equal(200);
          const granularPermissions = granularResponse.body;

          const permissionsToDelete = typesToDelete.length
            ? granularPermissions.filter((perm) =>
              typesToDelete.includes(perm.type)
            )
            : granularPermissions;

          permissionsToDelete.forEach((permission) => {
            const typeEndpointMap = {
              app: "app",
              workflow: "app",
              data_source: "data-source",
            };
            const endpoint = typeEndpointMap[permission.type] || "app";

            cy.request({
              method: "DELETE",
              url: `${Cypress.env("server_host")}/api/v2/group-permissions/granular-permissions/${endpoint}/${permission.id}`,
              headers,
              log: false,
            }).then((deleteResponse) => {
              expect(deleteResponse.status).to.equal(200);
              cy.log(
                `Deleted ${permission.type} granular permission: ${permission.name}`
              );
            });
          });
        });
      });
    });
  }
);

Cypress.Commands.add("apiDeleteAllApps", () => {
  cy.getAuthHeaders().then((headers) => {
    cy.request({
      method: "GET",
      url: `${Cypress.env("server_host")}/api/apps`,
      headers,
      log: false,
    }).then((response) => {
      expect(response.status).to.equal(200);
      const apps = response.body.apps || [];
      const appIds = apps.map((app) => app.id);
      if (appIds.length > 0) {
        cy.wrap(appIds).each((id) => {
          cy.apiDeleteApp(id);
        });
      }
    });
  });
});

Cypress.Commands.add(
  "apiUpdateSSOConfig",
  (ssoConfig, level = "workspace", cachedHeaders = false) => {
    cy.getAuthHeaders(cachedHeaders).then((headers) => {
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
        log: false,
      }).then((response) => {
        expect(response.status).to.equal(200);
        cy.log("SSO configuration updated successfully.");
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
  "getOktaAuthorizationCode",
  ({ username, password, clientId, redirectUri, oktaDomain }) => {
    // Step 1: Authenticate with Okta to get session token
    return cy
      .request({
        method: "POST",
        url: `https://${oktaDomain}/api/v1/authn`,
        body: { username, password },
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
      })
      .then((authnResp) => {
        expect(authnResp.body.status).to.eq("SUCCESS");
        const sessionToken = authnResp.body.sessionToken;
        Cypress.log({ message: "Okta session token obtained" });

        // Step 2: Exchange session token for authorization code
        const authorizeUrl =
          `https://${oktaDomain}/oauth2/v1/authorize` +
          `?client_id=${clientId}` +
          `&response_type=code` +
          `&scope=openid email profile groups` +
          `&redirect_uri=${encodeURIComponent(redirectUri)}` +
          `&state=teststate1` +
          `&nonce=randomvalue` +
          `&sessionToken=${sessionToken}`;

        return cy.request({
          method: "GET",
          url: authorizeUrl,
          followRedirect: false,
        });
      })
      .then((authResp) => {
        // Extract authorization code from redirect
        const redirectUrl = authResp.headers["location"];
        const params = new URL(redirectUrl).searchParams;
        const code = params.get("code");

        if (!code) {
          throw new Error("Authorization code not found in redirect URL");
        }

        Cypress.log({ message: "Authorization code obtained" });
        return code;
      });
  }
);


Cypress.Commands.add(
  "exchangeCodeForTokens",
  ({ code, clientId, clientSecret, redirectUri, oktaDomain }) => {
    return cy
      .request({
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
      })
      .then((tokenResp) => {
        expect(tokenResp.status).to.eq(200);
        Cypress.log({ message: "Tokens obtained successfully" });
        return tokenResp.body;
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
    level = "workspace",
  }) => {
    cy.log(`Starting OIDC login flow (${level}-level)`);

    // Intercept sign-in request to inject organizationId and redirectTo
    cy.intercept("POST", "/api/oauth/sign-in/*", (req) => {
      if (!req.body.organizationId) {
        req.body.organizationId = organizationId;
      }
      if (!req.body.redirectTo) {
        req.body.redirectTo = redirectTo;
      }
      req.continue();
    }).as("oidcSignIn");

    // Build config URL based on level
    const WORKSPACE_OIDC_CONFIG_ID = "22f22523-7bc2-4134-891d-88bdfec073cd";
    const configUrl =
      level === "instance"
        ? `${Cypress.env("server_host")}/api/oauth/openid/configs`
        : `${Cypress.env("server_host")}/api/oauth/openid/configs/${WORKSPACE_OIDC_CONFIG_ID}`;

    cy.log(`Fetching OIDC config from: ${configUrl}`);

    // Fetch OIDC configuration
    cy.request({
      method: "GET",
      url: configUrl,
      headers: {
        Accept: "*/*",
        "Content-Type": "application/json",
      },
    }).then((configResp) => {
      expect(configResp.status).to.eq(200);

      const authorizationUrl = configResp.body.authorizationUrl;
      if (!authorizationUrl) {
        throw new Error("Authorization URL not found in OIDC config");
      }

      cy.log(`Authorization URL: ${authorizationUrl}`);

      // Get authorization code from Okta
      cy.getOktaAuthorizationCode({
        username,
        password,
        clientId,
        redirectUri,
        oktaDomain,
      }).then((authCode) => {
        // Exchange code for tokens
        cy.exchangeCodeForTokens({
          code: authCode,
          clientId,
          clientSecret,
          redirectUri,
          oktaDomain,
        }).then(() => {
          // Visit authorization URL to complete ToolJet login
          cy.log("Completing ToolJet login");
          cy.visit(authorizationUrl);
        });
      });
    });
  }
);

Cypress.Commands.add("apiUpdateProfile", ({ firstName, lastName }) => {
  cy.getCookie("tj_auth_token").then((cookie) => {
    cy.request({
      method: "PATCH",
      url: `${Cypress.env("server_host")}/api/profile`,
      headers: {
        "Content-Type": "application/json",
        "Tj-Workspace-Id": Cypress.env("workspaceId"),
        Cookie: `tj_auth_token=${cookie.value}`,
      },
      body: {
        first_name: firstName,
        last_name: lastName,
      },
      failOnStatusCode: false,
    }).then((response) => {
      expect(response.status).to.eq(200);
      Cypress.log({
        name: "Profile updated",
        message: `Updated to ${firstName} ${lastName}`,
      });
    });
  });
});

Cypress.Commands.add(
  "apiUpdateAllowSignUp",
  (state, scope = "instance", returnCached = false) => {
    cy.getAuthHeaders(returnCached).then((headers) => {
      cy.request({
        method: "PATCH",
        url: `${Cypress.env("server_host")}/api/login-configs/${scope}-general`,
        headers: headers,
        body: { enableSignUp: state },
      });
    });
  }
);

Cypress.Commands.add(
  "apiFullUserOnboarding",
  (
    userName,
    userEmail,
    userRole = "end-user",
    userPassword = "password",
    workspaceName = "My workspace",
    metaData = {},
    groups = []
  ) => {
    let invitationToken, organizationToken;

    if (groups && groups.length > 0) {
      const groupArray = Array.isArray(groups) ? groups : [groups];
      const groupIds = [];

      cy.wrap(groupArray)
        .each((groupName) => {
          cy.apiGetGroupId(groupName).then((id) => {
            groupIds.push(id);
          });
        })
        .then(() => {
          cy.apiUserInvite(userName, userEmail, userRole, metaData, groupIds);
          performOnboarding(userEmail, userPassword, organizationToken);
        });
    } else {
      cy.apiUserInvite(userName, userEmail, userRole, metaData, []);
      performOnboarding(userEmail, userPassword, organizationToken);
    }

    function performOnboarding (email, password, orgToken) {
      cy.task("dbConnection", {
        dbconfig: Cypress.env("app_db"),
        sql: `
      SELECT ou.invitation_token 
      FROM organization_users ou
      JOIN users u ON u.id = ou.user_id
      WHERE u.email='${email}'
      LIMIT 1;`,
      })
        .then((resp) => {
          organizationToken = resp.rows[0]?.invitation_token;
          invitationToken = organizationToken;
          return cy.request({
            method: "POST",
            url: `${Cypress.env("server_host")}/api/onboarding/activate-account-with-token`,
            body: {
              email: email,
              password: password,
              organizationToken: organizationToken,
            },
            log: false,
          });
        })
        .then((activateResp) => {
          const setCookie = activateResp.headers["set-cookie"];
          let authToken = "";
          if (setCookie) {
            const found = setCookie.find((c) => c.startsWith("tj_auth_token="));
            if (found) {
              authToken = found.split("=")[1].split(";")[0];
            }
          }
          return cy
            .request({
              method: "POST",
              url: `${Cypress.env("server_host")}/api/onboarding/accept-invite`,
              headers: authToken
                ? { Cookie: `tj_auth_token=${authToken}` }
                : {},
              body: { token: organizationToken },
              log: false,
            })
            .then((acceptResp) => {
              expect(acceptResp.status).to.eq(201);
              Cypress.log({
                name: "User onboarding completed",
                message: `Accepted invite for ${email}`,
              });
              return acceptResp;
            });
        });
    }
  }
);

Cypress.Commands.add(
  "apiLoginByGoogle",
  (defaultid = "/688f4b68-8c3b-41b2-aecb-1c1e9a112de1", state = "") => {
    cy.log("Starting basic Google SSO login approach");

    cy.request({
      method: "POST",
      url: "https://oauth2.googleapis.com/token",
      form: true,
      body: {
        grant_type: "refresh_token",
        client_id: Cypress.env("googleClientId"),
        client_secret: Cypress.env("googleClientSecret"),
        refresh_token: Cypress.env("googleRefreshToken"),
      },
    }).then(({ body }) => {
      const { access_token, id_token } = body;
      cy.log("Successfully obtained Google tokens");

      cy.request({
        method: "GET",
        url: "https://www.googleapis.com/oauth2/v3/userinfo",
        headers: { Authorization: `Bearer ${access_token}` },
      }).then(({ body: userInfo }) => {
        const baseUrl = Cypress.config("baseUrl") || "http://localhost:3000";
        const tooljetBase = `${baseUrl}/sso/google${defaultid}`;
        const hash = `id_token=${encodeURIComponent(id_token)}&state=${encodeURIComponent(state)}`;
        const fullUrl = `${tooljetBase}#${hash}`;

        cy.visit(fullUrl);
      });
    });
  }
);

Cypress.Commands.add(
  "apiCreateFolder",
  (
    folderName,
    folderType = "front-end",
    workspaceId = Cypress.env("workspaceId")
  ) => {
    cy.getAuthHeaders().then((headers) => {
      cy.request({
        method: "POST",
        url: `${Cypress.env("server_host")}/api/folders`,
        headers: headers,
        body: {
          name: folderName,
          type: folderType,
        },
      }).then((response) => {
        expect(response.status).to.equal(201);

        const folderId = response.body.id || response.body.folderId;
        Cypress.env("createdFolderId", folderId);
      });
    });
  }
);

Cypress.Commands.add(
  "apiDeleteFolder",
  (folderId = Cypress.env("createdFolderId")) => {
    cy.getAuthHeaders().then((headers) => {
      cy.request({
        method: "DELETE",
        url: `${Cypress.env("server_host")}/api/folders/${folderId}`,
        headers: headers,
      }).then((response) => {
        expect(response.status).to.equal(200);
      });
    });
  }
);

Cypress.Commands.add(
  "apiUpdateGroupPermission",
  (groupName, permissionPayload) => {
    return cy.apiGetGroupId(groupName).then((groupId) => {
      return cy.getAuthHeaders().then((headers) => {
        return cy
          .request({
            method: "PUT",
            url: `${Cypress.env("server_host")}/api/v2/group-permissions/${groupId}`,
            headers: headers,
            body: permissionPayload,
            log: false,
          })
          .then((response) => {
            expect(response.status).to.equal(200);
            return response.body;
          });
      });
    });
  }
);

Cypress.Commands.add("getAuthHeaders", (returnCached = false) => {
  let headers = {};
  if (returnCached) {
    return returnCached;
  } else {
    cy.getCookie("tj_auth_token").then((cookie) => {
      headers = {
        "Tj-Workspace-Id": Cypress.env("workspaceId"),
        Cookie: `tj_auth_token=${cookie.value}`,
      };
      Cypress.env("authHeaders", headers);
      return headers;
    });
  }
});

Cypress.Commands.add("getUserIdByEmail", (email, idType = "organization") => {
  return cy.getAuthHeaders().then((headers) => {
    return cy
      .request({
        method: "GET",
        url: `${Cypress.env("server_host")}/api/organization-users`,
        headers: headers,
        log: false,
      })
      .then((response) => {
        expect(response.status).to.equal(200);
        const user = response.body.users.find((u) => u.email === email);

        if (!user) {
          throw new Error(`User with email ${email} not found`);
        }
        return idType === "user" ? user.user_id : user.id;
      });
  });
});

Cypress.Commands.add(
  "apiBulkUploadUsers",
  (csvContent, fileName = "users_upload.csv") => {
    const blob = new Blob([csvContent], { type: "text/csv" });
    const formData = new FormData();
    formData.append("file", blob, fileName);

    return cy.getAuthHeaders().then((headers) => {
      return cy
        .request({
          method: "POST",
          url: `${Cypress.env("server_host")}/api/organization-users/upload-csv`,
          headers: headers,
          body: formData,
          failOnStatusCode: false,
        })
        .then((response) => {
          return response;
        });
    });
  }
);

Cypress.Commands.add("apiUpdateLicense", (keyType = "valid") => {
  const licenseKey = Cypress.env("license_keys")[keyType];

  return cy.getAuthHeaders().then((headers) => {
    return cy
      .request({
        method: "PATCH",
        url: `${Cypress.env("server_host")}/api/license`,
        headers: headers,
        body: { key: licenseKey },
      })
      .then((response) => {
        expect(response.status).to.equal(200);
        Cypress.log({
          name: "apiUpdateLicense",
          displayName: `LICENSE UPDATED : ${keyType}`,
        });
        return response.body;
      });
  });
});

Cypress.Commands.add("apiArchiveWorkspace", (workspaceId) => {
  if (!workspaceId) {
    throw new Error("Workspace ID is required to archive workspace");
  }

  return cy.getAuthHeaders().then((headers) => {
    return cy
      .request({
        method: "PATCH",
        url: `${Cypress.env("server_host")}/api/organizations/archive/${workspaceId}`,
        headers: headers,
        body: { status: "archived" },
      })
      .then((response) => {
        expect(response.status).to.equal(200);
        Cypress.log({
          name: "apiArchiveWorkspace",
          displayName: `WORKSPACE ARCHIVED : ${workspaceId}`,
        });
        return response.body;
      });
  });
});
Cypress.Commands.add("apiConfigureSmtp", (smtpBody) => {
  return cy.getAuthHeaders().then((headers) => {
    cy.request({
      method: "PATCH",
      url: `${Cypress.env("server_host")}/api/smtp/status`,
      headers: headers,
      body: { smtpEnabled: smtpBody.smtpEnabled },
      log: false,
    }).then((response) => {
      expect(response.status).to.equal(200);
    });
    return cy
      .request({
        method: "PATCH",
        url: `${Cypress.env("server_host")}/api/smtp`,
        headers: headers,
        body: smtpBody,
        log: false,
      })
      .then((response) => {
        expect(response.status).to.equal(200);
        Cypress.log({
          name: "apiConfigureSmtp",
          displayName: "SMTP CONFIGURED",
        });
        return response.body;
      });
  });
});

Cypress.Commands.add(
  "apiGetWorkspaceIDs",
  (parameters = "?status=active", cacheHeaders = false) => {
    cy.getAuthHeaders().then((headers) => {
      return cy
        .request({
          method: "GET",
          url: `${Cypress.env("server_host")}/api/organizations${parameters}`,
          headers: headers,
          body: {},
          log: false,
        })
        .then((response) => {
          expect(response.status).to.equal(200);
          Cypress.log({
            name: "Get Workspace IDs",
            message: ` ${parameters}`,
          });
          // Cypress.env("workspaceId", response.body.organization_id);
          return response.body.organizations;
        });
    });
  }
);

Cypress.Commands.add("apiUpdateWhiteLabeling", (whiteLabelConfig) => {
  return cy.getAuthHeaders().then((headers) => {
    return cy
      .request({
        method: "PUT",
        url: `${Cypress.env("server_host")}/api/white-labelling`,
        headers: headers,
        body: whiteLabelConfig,
        log: false,
      })
      .then((response) => {
        expect(response.status).to.equal(200);
        Cypress.log({
          name: "apiUpdateWhiteLabeling",
          displayName: "WHITE LABELING UPDATED",
        });
        return response.body;
      });
  });
});

Cypress.Commands.add("apiDeleteAllWorkspaces", () => {
  cy.apiGetWorkspaceIDs().then((ids) => {
    ids.forEach((org) => {
      cy.log(`Getting workspace: ${org.slug}`);
      if (org.slug !== "my-workspace") {
        cy.apiArchiveWorkspace(org.id);
      } else {
        Cypress.env("workspaceId", org.id);
      }
    });
  });
});

Cypress.Commands.add("apiGetDefaultWorkspace", () => {
  return cy.apiGetWorkspaceIDs().then(workspaces => {
    const defaultWorkspace = workspaces.find(ws => ws.is_default);
    if (!defaultWorkspace) {
      throw new Error('No default workspace found');
    }
    return defaultWorkspace;
  });
});