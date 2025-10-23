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

Cypress.Commands.add(
    "apiUserInvite",
    (userName, userEmail, userRole = "end-user", metaData = {}) => {
        let normalizedMetaData = metaData;
        if (Array.isArray(metaData)) {
            normalizedMetaData = Object.fromEntries(metaData);
        }

        const requestBody = {
            email: userEmail,
            firstName: userName,
            groups: [],
            lastName: "",
            role: userRole,
            userMetadata: normalizedMetaData,
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
Cypress.Commands.add("apiUpdateUserRole", (email, role) => {
    return cy.task("dbConnection", {
        dbconfig: Cypress.env("app_db"),
        sql: `
      SELECT id 
      FROM users
      WHERE email='${email}'
      LIMIT 1;
    `,
    }).then((resp) => {
        const userId = resp.rows[0]?.id;
        if (!userId) throw new Error(`User with email ${email} not found`);
        return userId;
    }).then((userId) => {
        return cy.getAuthHeaders().then((headers) => {
            return cy.request({
                method: "PUT",
                url: `${Cypress.env("server_host")}/api/v2/group-permissions/role/user`,
                headers: headers,
                body: {
                    newRole: role,
                    userId: userId,
                },
            }).then((response) => {
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
        resourcesToAdd = []
    ) => {
        cy.getAuthHeaders().then((headers) => {
            cy.apiGetGroupId(groupName).then((groupId) => {
                const environment = Cypress.env("environment");
                const isEnterprise = environment === "Enterprise";

                const resourceTypeMap = {
                    app: { type: "app", endpoint: "app" },
                    workflow: { type: "workflow", endpoint: "data-source" },
                    datasource: { type: "data_source", endpoint: "data-source" },
                };

                const { type, endpoint } =
                    resourceTypeMap[resourceType] || resourceTypeMap.app;

                const url = isEnterprise
                    ? `${Cypress.env("server_host")}/api/v2/group-permissions/${groupId}/granular-permissions/${endpoint}`
                    : `${Cypress.env("server_host")}/api/v2/group-permissions/granular-permissions`;
                let permissionObject;

                if (resourceType === "datasource") {
                    permissionObject = {
                        action: {
                            canUse: permissions.canUse ?? true,
                            canConfigure: permissions.canConfigure ?? false,
                        },
                        resourcesToAdd,
                    };
                } else {
                    permissionObject = {
                        canEdit: permissions.canEdit ?? false,
                        canView: permissions.canView ?? true,
                        hideFromDashboard: permissions.hideFromDashboard ?? false,
                        resourcesToAdd,
                    };
                }

                const body = isEnterprise
                    ? {
                        name,
                        type,
                        groupId,
                        isAll: true,
                        createResourcePermissionObject: permissionObject,
                    }
                    : {
                        name,
                        type: "app",
                        groupId,
                        isAll: true,
                        createAppsPermissionsObject: permissionObject,
                    };

                cy.request({
                    method: "POST",
                    url: url,
                    headers: headers,
                    body: body,
                    log: false,
                }).then((res) => {
                    expect(res.status).to.equal(201);
                    cy.log(`Created ${resourceType} granular permission: ${name}`);
                });
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
        metaData = {}
    ) => {
        let invitationToken, organizationToken;

        // Auto-detect currently visited workspace slug and switch context for the invite.
        // If no slug is present or lookup fails, fall back to default org: 'My workspace'.
        cy.location("pathname", { log: false })
            .then((pathname) => {
                const slug = (pathname || "").split("/")[1] || "";

                const findBySlug = slug
                    ? cy.task("dbConnection", {
                          dbconfig: Cypress.env("app_db"),
                          sql: `select id from organizations where lower(slug)=lower('${slug}') limit 1;`,
                      })
                    : cy.wrap({ rows: [] });

                return findBySlug.then((resp) => {
                    const detectedOrgId = resp.rows?.[0]?.id;
                    if (detectedOrgId) {
                        Cypress.env("workspaceId", detectedOrgId);
                        return;
                    }

                    // Fallback to default workspace by name
                    return cy
                        .task("dbConnection", {
                            dbconfig: Cypress.env("app_db"),
                            sql: `select id from organizations where lower(name)=lower('My workspace') order by created_at asc limit 1;`,
                        })
                        .then((defResp) => {
                            const defaultOrgId = defResp.rows?.[0]?.id;
                            if (defaultOrgId) {
                                Cypress.env("workspaceId", defaultOrgId);
                            }
                        });
                });
            })
            .then(() => {
                // Proceed with invite in the active workspace context
                cy.apiUserInvite(userName, userEmail, userRole, metaData);

                return cy.task("dbConnection", {
                    dbconfig: Cypress.env("app_db"),
                    sql: `
                      SELECT ou.invitation_token 
                      FROM organization_users ou
                      JOIN users u ON u.id = ou.user_id
                      WHERE u.email='${userEmail}'
                      ORDER BY ou.created_at DESC
                      LIMIT 1;`,
                });
            })
            .then((resp) => {
                organizationToken = resp.rows[0]?.invitation_token;
                invitationToken = organizationToken;
                return cy.request({
                    method: "POST",
                    url: `${Cypress.env("server_host")}/api/onboarding/activate-account-with-token`,
                    body: {
                        email: userEmail,
                        password: userPassword,
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
            Cypress.log({
                name: "getAuthHeaders",
                message: `Auth headers: ${JSON.stringify(headers)}`,
            });
            return headers;
        });
    }
});
