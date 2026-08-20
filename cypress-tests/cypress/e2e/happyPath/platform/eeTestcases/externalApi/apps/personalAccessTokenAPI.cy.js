import { fake } from "Fixtures/fake";
import { apiRequest as baseApiRequest } from "Support/utils/externalApi";
import { sanitize } from "Support/utils/common";

const apiBaseUrl = Cypress.env("API_URL");
const authHeader = {
    Authorization: Cypress.env("AUTH_TOKEN"),
    "Content-Type": "application/json",
};

const sendApiRequest = (method, endpoint, body, headers = authHeader) =>
    baseApiRequest(method, `${apiBaseUrl}${endpoint}`, body, headers);

const PAT_ENDPOINT = "/ext/users/personal-access-token";
const USER_EMAIL = "dev@tooljet.io";

const buildBody = (overrides = {}) => ({
    email: USER_EMAIL,
    sessionExpiry: 100,
    patExpiry: 100,
    ...overrides,
});

const validateSuccessResponse = (status, body) => {
    expect(status).to.eq(201);
    expect(body).to.have.property("personalAccessToken");
    expect(body).to.have.property("redirectUrl");
    expect(body.personalAccessToken).to.be.a("string");
    expect(body.personalAccessToken).to.match(/^pat_[a-f0-9]+$/i);
    expect(body.redirectUrl).to.be.a("string");
};

const joinMessage = (message) => (Array.isArray(message) ? message.join(" ") : message || "");

describe("ToolJet: Personal Access Token (PAT) API", () => {
    let workspaceId;
    let sameApp;   // appId === appSlug (default for freshly imported apps)
    let diffApp;   // appId !== appSlug (slug renamed via PUT /api/apps/:id)
    const data = {};

    before(() => {
        const uniqueSuffix = `${Date.now()}${Math.floor(Math.random() * 1e6)}`;
        data.workspaceName = `${sanitize(fake.lastName)}${uniqueSuffix}`;
        data.workspaceSlug = `pat-${uniqueSuffix}`;

        cy.apiLogin();
        cy.apiCreateWorkspace(data.workspaceName, data.workspaceSlug).then((response) => {
            workspaceId = response.body.organization_id;
            Cypress.env("workspaceId", workspaceId);

            cy.fixture("templates/import_unnamed_file.json").then((requestData) => {
                // Import two apps in the same workspace so we can exercise SAME vs DIFFERENT
                const importOnce = () =>
                    baseApiRequest(
                        "POST",
                        `${apiBaseUrl}/ext/import/workspace/${workspaceId}/apps`,
                        requestData,
                        authHeader
                    ).then((res) => {
                        expect(res.status).to.eq(201);
                    });

                importOnce()
                    .then(importOnce)
                    .then(() => {
                        baseApiRequest(
                            "GET",
                            `${apiBaseUrl}/ext/workspace/${workspaceId}/apps`,
                            {},
                            authHeader
                        ).then((appsResponse) => {
                            const apps = Array.isArray(appsResponse.body)
                                ? appsResponse.body
                                : appsResponse.body.apps;
                            expect(apps.length, "two apps should have been imported").to.be.gte(2);

                            sameApp = { id: apps[0].id, slug: apps[0].slug };
                            diffApp = { id: apps[1].id, slug: apps[1].slug };

                            // Rename the second app's slug so appId !== appSlug
                            const customSlug = `custom-slug-${uniqueSuffix}`;
                            cy.getAuthHeaders().then((headers) => {
                                cy.request({
                                    method: "PUT",
                                    url: `${Cypress.env("server_host")}/api/apps/${diffApp.id}`,
                                    headers,
                                    body: { app: { slug: customSlug } },
                                }).then((updateRes) => {
                                    expect(updateRes.status).to.eq(200);
                                    diffApp.slug = customSlug;
                                });
                            });
                        });
                    });
            });
        });
    });

    it("should validate Personal Access Token API flows", () => {
        // Scenario 1: All fields present — Success with appId when appId and appSlug are SAME
        sendApiRequest("POST", PAT_ENDPOINT, buildBody({ appId: sameApp.id })).then(
            ({ status, body }) => {
                expect(sameApp.id, "sameApp should have slug equal to id").to.eq(sameApp.slug);
                validateSuccessResponse(status, body);
                const url = new URL(body.redirectUrl);
                expect(url.pathname).to.eq(`/embed-apps/${sameApp.id}`);
                expect(url.searchParams.get("personal-access-token")).to.eq(body.personalAccessToken);
                expect(url.searchParams.get("appSlug")).to.eq(sameApp.slug);
                expect(url.protocol).to.be.oneOf(["http:", "https:"]);
                expect(url.hostname).to.not.be.empty;
            }
        );

        // Scenario 2: All fields present — Success with appSlug when appId and appSlug are DIFFERENT
        sendApiRequest("POST", PAT_ENDPOINT, buildBody({ appSlug: diffApp.slug })).then(
            ({ status, body }) => {
                expect(diffApp.id, "diffApp should have slug different from id").to.not.eq(diffApp.slug);
                validateSuccessResponse(status, body);
                const url = new URL(body.redirectUrl);
                expect(url.pathname, "path should resolve to appId, not slug").to.eq(
                    `/embed-apps/${diffApp.id}`
                );
                expect(url.pathname).to.not.include(diffApp.slug);
                expect(url.searchParams.get("appSlug")).to.eq(diffApp.slug);
                expect(url.searchParams.get("personal-access-token")).to.eq(body.personalAccessToken);
            }
        );

        // Scenario 3: Redirect URL format when appId is given with PAT token
        sendApiRequest("POST", PAT_ENDPOINT, buildBody({ appId: diffApp.id })).then(
            ({ status, body }) => {
                validateSuccessResponse(status, body);
                const url = new URL(body.redirectUrl);
                expect(url.pathname).to.eq(`/embed-apps/${diffApp.id}`);
                expect(url.searchParams.get("personal-access-token")).to.eq(body.personalAccessToken);
                expect(url.protocol).to.be.oneOf(["http:", "https:"]);
                expect(url.hostname).to.not.be.empty;
            }
        );

        // Scenario 4: Redirect URL format when appSlug is given with PAT token
        sendApiRequest("POST", PAT_ENDPOINT, buildBody({ appSlug: diffApp.slug })).then(
            ({ status, body }) => {
                validateSuccessResponse(status, body);
                expect(body.redirectUrl).to.include("personal-access-token=");
                expect(body.redirectUrl).to.include("appSlug=");
                const url = new URL(body.redirectUrl);
                expect(url.searchParams.get("personal-access-token")).to.eq(body.personalAccessToken);
                expect(url.searchParams.get("appSlug")).to.eq(diffApp.slug);
            }
        );

        // Scenario 5: Missing email in request body
        sendApiRequest("POST", PAT_ENDPOINT, {
            appId: sameApp.id,
            sessionExpiry: 100,
            patExpiry: 100,
        }).then(({ status, body }) => {
            // Deterministic: service throws BadRequestException('Either userId or email must be provided')
            expect(status, "missing email should return 400").to.eq(400);
            expect(joinMessage(body.message).toLowerCase()).to.match(/email|userid/);
            expect(body).to.not.have.property("personalAccessToken");
            expect(body).to.not.have.property("redirectUrl");
        });

        // Scenario 6: Missing appId and appSlug in request body
        sendApiRequest("POST", PAT_ENDPOINT, {
            email: USER_EMAIL,
            sessionExpiry: 100,
            patExpiry: 100,
        }).then(({ status, body }) => {
            // Documents a known server defect: the workspace-scoped PAT path in
            // ee/external-apis/service.ts dereferences `app.id` when `app` is undefined
            // and crashes with 500 instead of returning a proper validation error.
            // Flip this to `.to.eq(400)` once the server enforces validation for the
            // missing-appId + missing-appSlug case.
            expect(status, "missing appId and appSlug currently crashes the service with 500").to.eq(500);
            const message = joinMessage(body.message).toLowerCase();
            expect(message).to.match(/app(id|slug)|undefined/);
            expect(body).to.not.have.property("personalAccessToken");
            expect(body).to.not.have.property("redirectUrl");
        });

        // Scenario 7: Uniqueness across consecutive requests
        // Every request yields a fresh personalAccessToken AND a fresh redirectUrl,
        // while path + appSlug query param stay identical (only the PAT query param differs).
        const results = [];
        const collect = () =>
            sendApiRequest("POST", PAT_ENDPOINT, buildBody({ appId: sameApp.id })).then(
                ({ status, body }) => {
                    expect(status).to.eq(201);
                    expect(body.personalAccessToken).to.match(/^pat_/);
                    results.push(body);
                }
            );
        collect()
            .then(collect)
            .then(collect)
            .then(() => {
                const tokens = results.map((r) => r.personalAccessToken);
                const urls = results.map((r) => r.redirectUrl);
                expect(new Set(tokens).size, "all 3 tokens should be unique").to.eq(3);
                expect(new Set(urls).size, "all 3 redirectUrls should be unique").to.eq(3);

                const parsed = urls.map((u) => new URL(u));
                const paths = new Set(parsed.map((u) => u.pathname));
                const slugs = new Set(parsed.map((u) => u.searchParams.get("appSlug")));
                const patParams = parsed.map((u) => u.searchParams.get("personal-access-token"));
                expect(paths.size, "path should be identical across requests").to.eq(1);
                expect(slugs.size, "appSlug query param should be identical across requests").to.eq(1);
                expect(new Set(patParams).size, "PAT query params should all differ").to.eq(3);
                patParams.forEach((pat, i) => {
                    expect(pat, `PAT query param should match response token #${i + 1}`).to.eq(tokens[i]);
                });
            });

        // Scenario 8: Custom patExpiry and sessionExpiry accepted (PAT expiry configurability)
        sendApiRequest("POST", PAT_ENDPOINT, {
            email: USER_EMAIL,
            appId: sameApp.id,
            sessionExpiry: 5,
            patExpiry: 5,
        }).then(({ status, body }) => {
            validateSuccessResponse(status, body);
        });

        // Scenario 9: 404 — email does not resolve to any user in the system
        const unknownEmail = `nonexistent-${fake.email.toLowerCase()}`;
        sendApiRequest("POST", PAT_ENDPOINT, buildBody({ email: unknownEmail, appId: sameApp.id })).then(
            ({ status, body }) => {
                expect(status, "unknown user should return 404").to.eq(404);
                expect(joinMessage(body.message).toLowerCase()).to.include("user");
                expect(body).to.not.have.property("personalAccessToken");
            }
        );

        // Scenario 10: 400 — invalid app identifier (schema validation)
        //   a) appId is not a UUID → DTO @IsUUID() fails
        //   b) appSlug does not exist → service throws "Invalid appId or appSlug"
        [
            {
                label: "appId is not a UUID",
                body: buildBody({ appId: "not-a-uuid-123" }),
                acceptable: [400],
                expectMessage: /uuid|appid/,
            },
            {
                label: "appSlug does not exist",
                body: buildBody({ appSlug: `nonexistent-${sanitize(fake.lastName)}` }),
                acceptable: [400],
                expectMessage: /invalid appid or appslug/,
            },
        ].forEach(({ label, body: reqBody, acceptable, expectMessage }) => {
            sendApiRequest("POST", PAT_ENDPOINT, reqBody).then(({ status, body }) => {
                expect(status, `[${label}] status`).to.be.oneOf(acceptable);
                expect(
                    joinMessage(body.message).toLowerCase(),
                    `[${label}] error message`
                ).to.match(expectMessage);
                expect(body).to.not.have.property("personalAccessToken");
            });
        });

        // Scenario 11: Invalid or empty auth token → 403
        ["Basic xyz", ""].forEach((authValue) => {
            sendApiRequest("POST", PAT_ENDPOINT, buildBody({ appId: sameApp.id }), {
                Authorization: authValue,
                "Content-Type": "application/json",
            }).then(({ status, body }) => {
                expect(status, `auth "${authValue}" should return 403`).to.eq(403);
                expect(body).to.not.have.property("personalAccessToken");
                expect(body).to.not.have.property("redirectUrl");
            });
        });
    });

});
