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
      cy.request(
        {
          method: "POST",
          url: `${Cypress.env("server_host")}/api/organizations`,
          headers: headers,
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

Cypress.Commands.add("apiGetUserDetails", (email) => {
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
        return response;
      });
  });
});

Cypress.Commands.add("apiUpdateUserRole", (email, role) => {
  return cy.apiGetUserDetails(email).then((response) => {
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
  (ssoConfig, level = "workspace", returnCached = false) => {
    cy.getAuthHeaders(returnCached).then((headers) => {
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
  }
);

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
      if (!req.body.organizationId) {
        req.body.organizationId = organizationId;
      }
      if (!req.body.redirectTo) {
        req.body.redirectTo = redirectTo;
      }
      req.continue();
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

    function performOnboarding(email, password, orgToken) {
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
          return cy.request({
            method: "POST",
            url: `${Cypress.env("server_host")}/api/onboarding/accept-invite`,
            headers: authToken ? { Cookie: `tj_auth_token=${authToken}` } : {},
            body: { token: organizationToken },
            log: false,
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
        const tooljetBase = `http://localhost:8082/sso/google${defaultid}`;
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

Cypress.Commands.add("apiConfigureSmtp", (smtpBody) => {
  return cy.getAuthHeaders().then((headers) => {
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
