const envVar = Cypress.env("environment");

const licenseKeys = {
  valid: Cypress.env("validLicenseKey"),
  expired: Cypress.env("expiredLicenseKey"),
};

/**
 * @tjCmd   auth · log in via the API and store the session cookie
 * @tjUsage cy.apiLogin(email, password, workspaceId)
 */
Cypress.Commands.add(
  "apiLogin",
  (
    userEmail = "dev@tooljet.io",
    userPassword = "password",
    workspaceId = "",
    redirection = "/",
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
  },
);

/**
 * @tjCmd   auth · end the current API session
 * @tjUsage cy.apiLogout()
 */
Cypress.Commands.add("apiLogout", (cachedHeader = false) => {
  cy.getAuthHeaders(cachedHeader).then((headers) => {
    cy.request(
      {
        method: "GET",
        url: `${Cypress.env("server_host")}/api/session/logout`,
        headers: headers,
      },
      { log: false },
    ).then((response) => {
      expect(response.status).to.equal(200);
    });
  });
});

/**
 * @tjCmd   api · fetch the environments configured for a workspace
 * @tjUsage cy.apiGetEnvironments(workspaceId)
 */
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

/**
 * @tjCmd   workspace · create a workspace via the API and store its id
 * @tjUsage cy.apiCreateWorkspace('QA workspace', 'qa-workspace')
 */
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
  },
);

/**
 * @tjCmd   user · invite a user to the current workspace via the API
 * @tjUsage cy.apiUserInvite('QA', userEmail)
 */
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

    return cy.getAuthHeaders().then((headers) => {
      return cy
        .request(
          {
            method: "POST",
            url: `${Cypress.env("server_host")}/api/organization-users`,
            headers: headers,
            body: requestBody,
          },
          { log: false },
        )
        .then((response) => {
          expect(response.status).to.equal(201);
        });
    });
  },
);

/**
 * @tjCmd   workspace · create a workspace constant in one environment
 * @tjUsage cy.apiCreateWorkspaceConstant('API_KEY', 'abc', 'production')
 */
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
  },
);

/**
 * @tjCmd   workspace · update an existing workspace constant
 * @tjUsage cy.apiUpdateWsConstant(constantId, 'newValue')
 */
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

/**
 * @tjCmd   group · resolve a group id from its name
 * @tjUsage cy.apiGetGroupId('QA Team')
 */
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
          (g) => g.name === groupName,
        );
        if (!group) throw new Error(`Group with name ${groupName} not found`);
        return group.id;
      });
  });
});

/**
 * @tjCmd   api · list datasource ids for the current workspace
 * @tjUsage cy.apiGetDatasourceIds()
 */
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
              (d) => d.name.toLowerCase().trim() === normalizedSearchName,
            );
            return ds?.id;
          })
          .filter(Boolean);

        return dsIds;
      });
  });
});

/**
 * @tjCmd   api · resolve an app id from its display name
 * @tjUsage cy.apiGetAppIdByName('MyApp')
 */
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

/**
 * @tjCmd   user · fetch a user record by email
 * @tjUsage cy.apiGetUserDetails(userEmail)
 */
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

/**
 * @tjCmd   user · change a user's workspace role
 * @tjUsage cy.apiUpdateUserRole(userEmail, 'builder')
 */
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

/**
 * @tjCmd   user · grant or revoke instance super-admin
 * @tjUsage cy.apiUpdateSuperAdmin(userEmail, true)
 */
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

/**
 * @tjCmd   group · create a granular permission on a group
 * @tjUsage cy.apiCreateGranularPermission(groupId, payload)
 */
Cypress.Commands.add(
  "apiCreateGranularPermission",
  (
    groupName,
    name,
    resourceType = "app",
    permissions = {},
    resourcesToAdd = [],
    isAll = true,
  ) => {
    // Normalize resourcesToAdd to always be an array
    const normalizedResources = Array.isArray(resourcesToAdd)
      ? resourcesToAdd
      : [resourcesToAdd];

    const formatResources = (type, resources, isAll) => {
      if (isAll) return [];
      else if (type === "datasource") {
        return resources.map((id) => ({ dataSourceId: id }));
      } else if (resourceType === "folder" || resourceType === "module_folder") {
        return resources.map((id) => ({ folderId: id }));
      }
      return resources.map((id) => ({ appId: id }));
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

      if (type === "folder" || type === "module_folder") {
        return {
          canEditFolder: perms.canEditFolder ?? true,
          canEditApps: perms.canEditApps ?? false,
          canViewApps: perms.canViewApps ?? false,
          resourcesToAdd: formattedResources,
        };
      }
      return {
        canEdit: perms.canEdit ?? false,
        canView: perms.canView ?? true,
        hideFromDashboard: perms.hideFromDashboard ?? false,
        canAccessDevelopment: perms.canAccessDevelopment ?? true,
        canAccessStaging: perms.canAccessStaging ?? true,
        canAccessProduction: perms.canAccessProduction ?? false,
        canAccessReleased: perms.canAccessReleased ?? true,
        resourcesToAdd: formattedResources,
      };
    };

    const buildRequestBody = (
      isEnterprise,
      name,
      type,
      groupId,
      isAll,
      permObj,
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
          module: { type: "module", endpoint: "data-source" },
          workflow: { type: "workflow", endpoint: "data-source" },
          datasource: { type: "data_source", endpoint: "data-source" },
          folder: { type: "folder", endpoint: "folder" },
          module_folder: { type: "module_folder", endpoint: "module-folder" },
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
              false,
            );
            const permissionObject = buildPermissionObject(
              type,
              permissions,
              formattedResources,
            );
            const body = buildRequestBody(
              isEnterprise,
              name,
              type,
              groupId,
              false,
              permissionObject,
            );
            sendRequest(url, headers, body, resourceType, name);
          });
        } else {
          const formattedResources = formatResources(
            resourceType,
            normalizedResources,
            isAll,
          );
          const permissionObject = buildPermissionObject(
            type,
            permissions,
            formattedResources,
          );
          const body = buildRequestBody(
            isEnterprise,
            name,
            type,
            groupId,
            isAll,
            permissionObject,
          );
          sendRequest(url, headers, body, resourceType, name);
        }
      });
    });
  },
);

/**
 * @tjCmd   group · delete a granular permission from a group
 * @tjUsage cy.apiDeleteGranularPermission(permissionId)
 */
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
                typesToDelete.includes(perm.type),
              )
            : granularPermissions;

          permissionsToDelete.forEach((permission) => {
            const typeEndpointMap = {
              app: "app",
              workflow: "app",
              data_source: "data-source",
              folder: "folder",
              modules:"data-source",
              workflow_folder: "workflow-folder",
              module_folder: "module-folder",
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
                `Deleted ${permission.type} granular permission: ${permission.name}`,
              );
            });
          });
        });
      });
    });
  },
);

/**
 * @tjCmd   app-crud · delete every app in the workspace - teardown
 * @tjUsage cy.apiDeleteAllApps()
 */
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

/**
 * @tjCmd   sso · update a workspace or instance SSO configuration
 * @tjUsage cy.apiUpdateSSOConfig(orgId, 'google', config)
 */
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
  },
);

/**
 * @tjCmd   sso · resolve the config id for an SSO provider
 * @tjUsage cy.getSsoConfigId('google')
 */
Cypress.Commands.add(
  "getSsoConfigId",
  (ssoType, workspaceSlug = "my-workspace") => {
    cy.request(
      `${Cypress.env("server_host")}/api/login-configs/${workspaceSlug}/public`,
    ).then((response) => {
      const configSection = response.body.sso_configs[ssoType];
      return (
        configSection?.configs?.sso_config_id ||
        configSection?.config_id ||
        null
      );
    });
  },
);

/**
 * @tjCmd   sso · obtain an Okta authorization code for OIDC login
 * @tjUsage cy.getOktaAuthorizationCode()
 */
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
  },
);

/**
 * @tjCmd   sso · exchange an OIDC authorization code for tokens
 * @tjUsage cy.exchangeCodeForTokens(code)
 */
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
  },
);

/**
 * @tjCmd   auth · complete an OIDC login without driving the IdP UI
 * @tjUsage cy.oidcLogin()
 */
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
  },
);

/**
 * @tjCmd   user · update the signed-in user's first and last name
 * @tjUsage cy.apiUpdateProfile('The', 'Developer')
 */
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

/**
 * @tjCmd   sso · toggle open signup for a workspace or the instance
 * @tjUsage cy.apiUpdateAllowSignUp(true)
 */
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
  },
);
/**
 * @tjCmd   sso · toggle automatic SSO redirect
 * @tjUsage cy.apiUpdateAutoSSO(false)
 */
Cypress.Commands.add(
  "apiUpdateAutoSSO",
  (state, scope = "instance", returnCached = false) => {
    cy.getAuthHeaders(returnCached).then((headers) => {
      cy.request({
        method: "PATCH",
        url: `${Cypress.env("server_host")}/api/login-configs/${scope}-general`,
        headers: headers,
        body: { automaticSsoLogin: state },
      });
    });
  },
);

/**
 * @tjCmd   user · create a user and complete onboarding in one call - the standard test-user setup
 * @tjUsage cy.apiFullUserOnboarding('QA', userEmail, 'QA workspace')
 */
Cypress.Commands.add(
  "apiFullUserOnboarding",
  (
    userName,
    userEmail,
    userRole = "end-user",
    userPassword = "password",
    workspaceName = "My workspace",
    metaData = {},
    groups = [],
  ) => {
    let invitationToken, organizationToken;

    if (groups && groups.length > 0) {
      const groupArray = Array.isArray(groups) ? groups : [groups];
      const groupIds = [];

      return cy
        .wrap(groupArray)
        .each((groupName) => {
          return cy.apiGetGroupId(groupName).then((id) => {
            groupIds.push(id);
          });
        })
        .then(() => {
          return cy
            .apiUserInvite(userName, userEmail, userRole, metaData, groupIds)
            .then(() => {
              return performOnboarding(
                userEmail,
                userPassword,
                organizationToken,
              );
            });
        });
    } else {
      return cy
        .apiUserInvite(userName, userEmail, userRole, metaData, [])
        .then(() => {
          return performOnboarding(userEmail, userPassword, organizationToken);
        });
    }

    function performOnboarding(email, password, orgToken) {
      return cy
        .task("dbConnection", {
          dbconfig: Cypress.env("app_db"),
          sql: `
      SELECT ou.invitation_token
      FROM organization_users ou
      JOIN users u ON u.id = ou.user_id
      WHERE u.email='${email}'
      AND ou.invitation_token IS NOT NULL
      ORDER BY ou.created_at DESC
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
  },
);

/**
 * @tjCmd   auth · log in through the Google SSO path via the API
 * @tjUsage cy.apiLoginByGoogle(userEmail)
 */
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
  },
);

/**
 * @tjCmd   app-crud · create a dashboard folder
 * @tjUsage cy.apiCreateFolder('QA folder')
 */
Cypress.Commands.add(
  "apiCreateFolder",
  (folderName, folderType = "front-end") => {
    return cy.getAuthHeaders().then((headers) =>
      cy
        .request({
          method: "POST",
          url: `${Cypress.env("server_host")}/api/folders`,
          headers,
          body: { name: folderName, type: folderType },
        })
        .then((response) => {
          expect(response.status).to.equal(201);
          const folderId = response.body.id || response.body.folderId;
          Cypress.env("createdFolderId", folderId);
          return response.body;
        }),
    );
  },
);

/**
 * @tjCmd   app-crud · delete a dashboard folder
 * @tjUsage cy.apiDeleteFolder(folderId)
 */
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
  },
);

/**
 * @tjCmd   group · set the permission flags on a group
 * @tjUsage cy.apiUpdateGroupPermission(groupId, { appCreate: true })
 */
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
  },
);
const defaultEnvPermissionBody = {
  name: "Apps",
  isAll: true,
  actions: {
    canEdit: true,
    canView: false,
    hideFromDashboard: false,
    canAccessDevelopment: true,
    canAccessStaging: true,
    canAccessProduction: false,
    canAccessReleased: true,
  },
  resourcesToAdd: [],
  resourcesToDelete: [],
};

/**
 * @tjCmd   group · set per-environment access for a group
 * @tjUsage cy.apiUpdateEnvironmentPermission(groupId, envIds)
 */
Cypress.Commands.add(
  "apiUpdateEnvironmentPermission",
  (groupName, bodyOverrides = {}, permissionName = "Apps") => {
    const requestBody = {
      ...defaultEnvPermissionBody,
      ...bodyOverrides,
      actions: {
        ...defaultEnvPermissionBody.actions,
        ...(bodyOverrides.actions || {}),
      },
    };

    return cy
      .apiGetGroupId(groupName)
      .then((groupId) => {
        return cy.getAuthHeaders().then((headers) => {
          return cy.request({
            method: "GET",
            url: `${Cypress.env("server_host")}/api/v2/group-permissions/${groupId}/granular-permissions`,
            headers,
          });
        });
      })
      .then((response) => {
        const permission = response.body.find(
          (gp) => gp.type === "app" && gp.name === permissionName,
        );

        expect(permission).to.exist;
        return permission.id;
      })
      .then((permissionId) => {
        return cy.getAuthHeaders().then((headers) => {
          return cy.request({
            method: "PUT",
            url: `${Cypress.env("server_host")}/api/v2/group-permissions/granular-permissions/app/${permissionId}`,
            headers,
            body: requestBody,
          });
        });
      })
      .then((response) => {
        expect(response.status).to.eq(200);
        return response.body;
      });
  },
);

/**
 * @tjCmd   api · yield the auth headers for a raw cy.request call
 * @tjUsage cy.getAuthHeaders().then((headers) => { ... })
 */
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

/**
 * @tjCmd   user · resolve a user id from an email address
 * @tjUsage cy.getUserIdByEmail(userEmail)
 */
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

/**
 * @tjCmd   user · upload a users CSV via the API
 * @tjUsage cy.apiBulkUploadUsers(csvPath)
 */
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
  },
);

/**
 * @tjCmd   license · apply a licence key to the instance
 * @tjUsage cy.apiUpdateLicense(licenseKey)
 */
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

/**
 * @tjCmd   workspace · archive a workspace - teardown
 * @tjUsage cy.apiArchiveWorkspace(workspaceId)
 */
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
/**
 * @tjCmd   api · configure instance SMTP settings
 * @tjUsage cy.apiConfigureSmtp(config)
 */
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

/**
 * @tjCmd   workspace · list every workspace id on the instance
 * @tjUsage cy.apiGetWorkspaceIDs()
 */
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
  },
);

/**
 * @tjCmd   api · set instance white-label values
 * @tjUsage cy.apiUpdateWhiteLabeling({ logo, favicon })
 */
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

/**
 * @tjCmd   workspace · archive every non-default workspace - teardown
 * @tjUsage cy.apiDeleteAllWorkspaces()
 */
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

/**
 * @tjCmd   workspace · resolve the instance default workspace
 * @tjUsage cy.apiGetDefaultWorkspace()
 */
Cypress.Commands.add("apiGetDefaultWorkspace", () => {
  return cy.apiGetWorkspaceIDs().then((workspaces) => {
    const defaultWorkspace = workspaces.find((ws) => ws.is_default);
    if (!defaultWorkspace) {
      throw new Error("No default workspace found");
    }
    return defaultWorkspace;
  });
});

/**
 * @tjCmd   license · set the LLM API key used by AI features
 * @tjUsage cy.apiUpdateLLMKey(key)
 */
Cypress.Commands.add(
  "apiUpdateLLMKey",
  (apikey = "", licenseType = "selfhostai", useEnvironmentConfig = false) => {
    return cy.getAuthHeaders().then((headers) => {
      return cy
        .request({
          method: "PATCH",
          url: `${Cypress.env("server_host")}/api/ai/update-key`,
          headers: headers,
          body: {
            apikey: apikey,
            licenseType: licenseType,
            useEnvironmentConfig: useEnvironmentConfig,
          },
        })
        .then((response) => {
          expect(response.status).to.equal(200);
          Cypress.log({
            name: "apiUpdateKey",
            displayName: `AI KEY UPDATED : ${licenseType}`,
          });
          return response.body;
        });
    });
  },
);

/**
 * @tjCmd   app-crud · delete every module in the workspace - teardown
 * @tjUsage cy.apiDeleteAllModules()
 */
Cypress.Commands.add("apiDeleteAllModules", () => {
  cy.getAuthHeaders().then((headers) => {
    cy.request({
      method: "GET",
      url: `${Cypress.env("server_host")}/api/apps?page=1&folder=&searchKey=&type=module`,
      headers,
      log: false,
    }).then((response) => {
      expect(response.status).to.equal(200);
      const modules = response.body.apps || [];
      if (modules.length > 0) {
        cy.wrap(modules).each((module) => {
          cy.request({
            method: "DELETE",
            url: `${Cypress.env("server_host")}/api/modules/${module.id}`,
            headers,
            log: false,
          }).then((deleteResponse) => {
            expect(deleteResponse.status).to.equal(200);
          });
        });
      }
    });
  });
});

Cypress.Commands.add("apiCreateModuleFolder", (folderName) => {
  return cy.getAuthHeaders().then((headers) => {
    return cy
      .request({
        method: "POST",
        url: `${Cypress.env("server_host")}/api/folders`,
        headers,
        body: { name: folderName, type: "module" },
        log: false,
      })
      .then((response) => {
        expect(response.status).to.equal(201);
        return response.body;
      });
  });
});

Cypress.Commands.add("apiGetModuleFolderId", (folderName) => {
  return cy.getAuthHeaders().then((headers) => {
    return cy
      .request({
        method: "GET",
        url: `${Cypress.env("server_host")}/api/folder-apps?searchKey=&type=module`,
        headers,
        log: false,
      })
      .then((response) => {
        expect(response.status).to.equal(200);
        const folder = response.body.folders.find((f) => f.name === folderName);
        if (!folder) throw new Error(`Module folder with name ${folderName} not found`);
        return folder.id;
      });
  });
});

Cypress.Commands.add("apiRenameFolder", (folderId, newName) => {
  return cy.getAuthHeaders().then((headers) => {
    return cy
      .request({
        method: "PUT",
        url: `${Cypress.env("server_host")}/api/folders/${folderId}`,
        headers,
        body: { name: newName },
        log: false,
      })
      .then((response) => {
        expect(response.status).to.equal(200);
        return response.body;
      });
  });
});


Cypress.Commands.add("apiAddModuleToFolder", (moduleId, folderId) => {
  return cy.getAuthHeaders().then((headers) => {
    return cy
      .request({
        method: "POST",
        url: `${Cypress.env("server_host")}/api/folder-apps`,
        headers,
        body: { app_id: moduleId, folder_id: folderId },
        log: false,
      })
      .then((response) => {
        expect(response.status).to.equal(201);
        return response.body;
      });
  });
});

Cypress.Commands.add("apiRemoveModuleFromFolder", (moduleId, folderId) => {
  return cy.getAuthHeaders().then((headers) => {
    return cy.request({
      method: "PUT",
      url: `${Cypress.env("server_host")}/api/folder-apps/${folderId}`,
      headers,
      body: { app_id: moduleId },
      log: false,
    });
  });
});

Cypress.Commands.add("apiRemoveUserFromGroup", (groupId, email) => {
  return cy.getAuthHeaders().then((headers) => {
    return cy
      .request({
        method: "GET",
        url: `${Cypress.env("server_host")}/api/v2/group-permissions/${groupId}/users`,
        headers,
        log: false,
      })
      .then((response) => {
        expect(response.status).to.equal(200);
        const groupUser = response.body.find((gu) => gu.user?.email === email);
        if (!groupUser) throw new Error(`User ${email} not found in group ${groupId}`);
        return cy.request({
          method: "DELETE",
          url: `${Cypress.env("server_host")}/api/v2/group-permissions/users/${groupUser.id}`,
          headers,
          log: false,
        });
      });
  });
});
