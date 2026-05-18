import {
  createUser,
  getUser,
} from "Support/utils/externalApi";
import { fake } from "Fixtures/fake";
import { sanitize } from "Support/utils/common";
import { commonSelectors } from "Selectors/common";
import { onboardingSelectors } from "Selectors/onboarding";

describe("ToolJet: Create User — inviteUrl API Validation", () => {
  const data = {};

  beforeEach(() => {
    const ts = Date.now();
    data.workspaceName = `${sanitize(fake.lastName)}${ts}`;
    data.workspaceSlug = `${sanitize(fake.lastName)}${ts}`;
    cy.apiLogin();
    cy.apiCreateWorkspace(data.workspaceName, data.workspaceSlug).then(
      (response) => {
        Cypress.env("workspaceId", response.body.organization_id);
      }
    );
  });

  // afterEach(() => {
  //   cy.apiDeleteAllWorkspaces();
  // });

  it("should validate inviteUrl presence and workspace assignment in POST /ext/users", () => {
    const workspaceId = Cypress.env("workspaceId");

    // Case 1: Response includes a non-null inviteUrl per workspace
    createUser({
      name: "Vendor One",
      email: `${sanitize(fake.lastName)}@example.com`,
      workspaces: [{ id: workspaceId }],
    }).then((response) => {
      expect(response.status).to.eq(201);
      expect(response.body.workspaces).to.be.an("array").and.have.length(1);
      expect(
        response.body.workspaces[0].inviteUrl,
        "inviteUrl should be present and non-null"
      ).to.exist;
    });

    // Case 2: inviteUrl contains correct oid query param matching the workspace id
    createUser({
      name: "Vendor Two",
      email: `${sanitize(fake.lastName)}@example.com`,
      workspaces: [{ id: workspaceId }],
    }).then((response) => {
      expect(response.status).to.eq(201);
      const inviteUrl = response.body.workspaces[0].inviteUrl;
      expect(inviteUrl, "inviteUrl should contain oid matching workspace id").to.include(
        `oid=${workspaceId}`
      );
    });
  });

  it("should validate multi-workspace user creation in POST /ext/users", () => {
    cy.then(() => Cypress.env("workspaceId")).then((workspaceId) => {
      const ts2 = Date.now();
      data.workspaceName2 = `${sanitize(fake.lastName)}${ts2}`;
      data.workspaceSlug2 = `${sanitize(fake.lastName)}${ts2}`;
      cy.apiCreateWorkspace(data.workspaceName2, data.workspaceSlug2).then(
        (wsResponse) => {
          const secondWorkspaceId = wsResponse.body.organization_id;

          // Case 3: Creates the user in every requested workspace
          createUser({
            name: "Vendor Multi",
            email: `${sanitize(fake.lastName)}@example.com`,
            workspaces: [
              { id: workspaceId },
              { id: secondWorkspaceId },
            ],
          }).then((response) => {
            expect(response.status).to.eq(201);
            expect(response.body.workspaces).to.be.an("array").and.have.length(2);
            const returnedIds = response.body.workspaces.map((ws) => ws.id);
            expect(returnedIds).to.include(workspaceId);
            expect(returnedIds).to.include(secondWorkspaceId);
          });
        }
      );
    });
  });

  it("should validate role assignment via POST /ext/users", () => {
    const workspaceId = Cypress.env("workspaceId");

    // Case 4: Assigns the specified role to the user in the workspace
    createUser({
      name: "Builder User",
      email: `${sanitize(fake.lastName)}@example.com`,
      workspaces: [{ id: workspaceId, role: "builder" }],
    }).then((response) => {
      expect(response.status).to.eq(201);
      const groupNames = response.body.userGroups.map((g) => g.name);
      expect(groupNames).to.include("builder");
    });

    // Case 5: Assigns different roles across multiple workspaces
    const ts3 = Date.now();
    data.workspaceName2 = `${sanitize(fake.lastName)}${ts3}`;
    data.workspaceSlug2 = `${sanitize(fake.lastName)}${ts3}`;
    cy.apiCreateWorkspace(data.workspaceName2, data.workspaceSlug2).then(
      (wsResponse) => {
        const secondWorkspaceId = wsResponse.body.organization_id;

        createUser({
          name: "Multi Role User",
          email: `${sanitize(fake.lastName)}@example.com`,
          workspaces: [
            { id: workspaceId, role: "builder" },
            { id: secondWorkspaceId, role: "end-user" },
          ],
        }).then((response) => {
          expect(response.status).to.eq(201);
          expect(response.body.workspaces).to.have.length(2);
          const groupNames = response.body.userGroups.map((g) => g.name);
          expect(groupNames).to.include("builder");
          expect(groupNames).to.include("end-user");
        });
      }
    );
  });

  it("should validate custom group assignment in POST /ext/users", () => {
    const workspaceId = Cypress.env("workspaceId");

    // Create two custom groups in the workspace via the internal API
    cy.getAuthHeaders().then((headers) => {
      cy.request({
        method: "POST",
        url: `${Cypress.env("server_host")}/api/v2/group-permissions`,
        headers: headers,
        body: { name: "Viewer Group A" },
        failOnStatusCode: false,
      }).then((groupAResponse) => {
        expect(groupAResponse.status).to.eq(201);

        cy.request({
          method: "POST",
          url: `${Cypress.env("server_host")}/api/v2/group-permissions`,
          headers: headers,
          body: { name: "Viewer Group B" },
          failOnStatusCode: false,
        }).then((groupBResponse) => {
          expect(groupBResponse.status).to.eq(201);

          // Case 6: Adds user to multiple custom groups in a workspace
          createUser({
            name: "Multi Group User",
            email: `${sanitize(fake.lastName)}@example.com`,
            workspaces: [
              {
                id: workspaceId,
                groups: [
                  { name: "Viewer Group A" },
                  { name: "Viewer Group B" },
                ],
              },
            ],
          }).then((response) => {
            expect(response.status).to.eq(201);
            const groupNames = response.body.userGroups.map((g) => g.name);
            expect(groupNames).to.include("Viewer Group A");
            expect(groupNames).to.include("Viewer Group B");
          });
        });
      });
    });
  });

  it("should validate failing conditions in POST /ext/users", () => {
    const workspaceId = Cypress.env("workspaceId");
    const sharedEmail = `${sanitize(fake.lastName)}@example.com`;

    // Case 7: Returns 400 when email already exists
    createUser({
      name: "Duplicate Vendor",
      email: sharedEmail,
      workspaces: [{ id: workspaceId }],
    }).then((firstResponse) => {
      expect(firstResponse.status).to.eq(201);

      createUser({
        name: "Duplicate Vendor",
        email: sharedEmail,
        workspaces: [{ id: workspaceId }],
      }).then((response) => {
        expect(response.status).to.eq(400);
        expect(response.body.message).to.include("already exists");
      });
    });

    // Case 8: Returns 400 when workspace id does not exist
    createUser({
      name: "Ghost Vendor",
      email: `${sanitize(fake.lastName)}@example.com`,
      workspaces: [{ id: "a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d" }],
    }).then((response) => {
      expect(response.status).to.eq(400);
      expect(response.body.message).to.include("do not exist");
    });

    // Case 9: Returns 400 when a default group name is passed in the groups field
    createUser({
      name: "Invalid Group Vendor",
      email: `${sanitize(fake.lastName)}@example.com`,
      workspaces: [{ id: workspaceId, groups: [{ name: "builder" }] }],
    }).then((response) => {
      expect(response.status).to.eq(400);
      expect(response.body.message).to.include("role field");
    });

    // Case 10: Returns 400 when a custom group does not exist in the workspace
    createUser({
      name: "Bad Group Vendor",
      email: `${sanitize(fake.lastName)}@example.com`,
      workspaces: [
        { id: workspaceId, groups: [{ name: "non-existent-custom-group" }] },
      ],
    }).then((response) => {
      expect(response.status).to.eq(400);
      expect(response.body.message).to.include(
        "Group permission id or name not found"
      );
    });
  });

  it("should validate conflicting-permissions error in POST /ext/users", () => {
    const workspaceId = Cypress.env("workspaceId");

    // Create a builder-level custom group (appCreate: true) via internal API
    cy.getAuthHeaders().then((headers) => {
      cy.request({
        method: "POST",
        url: `${Cypress.env("server_host")}/api/v2/group-permissions`,
        headers: headers,
        body: { name: "Elevated Builders" },
        failOnStatusCode: false,
      }).then((groupResponse) => {
        expect(groupResponse.status).to.eq(201);
        const groupId = groupResponse.body.id;

        // Update the group to have builder-level (appCreate) permissions
        cy.request({
          method: "PUT",
          url: `${Cypress.env("server_host")}/api/v2/group-permissions/${groupId}`,
          headers: headers,
          body: { appCreate: true },
          failOnStatusCode: false,
        }).then(() => {
          // Case 11: Returns 400 when end-user is added to a builder-level custom group
          createUser({
            name: "Conflict Vendor",
            email: `${sanitize(fake.lastName)}@example.com`,
            workspaces: [
              {
                id: workspaceId,
                role: "end-user",
                groups: [{ name: "Elevated Builders" }],
              },
            ],
          }).then((response) => {
            expect(response.status).to.eq(400);
            expect(response.body.message).to.be.an("object");
            expect(response.body.message.title).to.eq("Conflicting permissions");
          });
        });
      });
    });
  });

  it("should complete onboarding via inviteUrl for an invited user", () => {
    const workspaceId = Cypress.env("workspaceId");
    const email = `${sanitize(fake.lastName)}@example.com`;

    createUser({
      name: fake.firstName,
      email,
      workspaces: [{ id: workspaceId }],
    }).then((response) => {
      expect(response.status).to.eq(201);
      const inviteUrl = response.body.workspaces[0].inviteUrl;
      expect(inviteUrl).to.exist;

      cy.apiLogout();
      cy.visit(inviteUrl);

      cy.clearAndType(onboardingSelectors.loginPasswordInput, "password");
      cy.get(commonSelectors.signUpButton).click();
      cy.get(commonSelectors.acceptInviteButton).click();
      cy.get(commonSelectors.workspaceName).should(
        "have.text",
        data.workspaceName
      );

      // Clear all cookies then re-login as admin so that afterEach cleanup
      // (apiDeleteAllWorkspaces) uses the admin credentials. Without clearing,
      // cy.getCookie("tj_auth_token") returns the invited user's cookie that was
      // set by cy.visit(inviteUrl), causing 401 in apiArchiveWorkspace.
      cy.clearCookies();
      cy.apiLogin();
    });
  });

  it("should allow direct login for an active user created with a password", () => {
    const workspaceId = Cypress.env("workspaceId");
    const email = `${sanitize(fake.lastName)}@example.com`;
    const password = "password";

    createUser({
      name: fake.firstName,
      email,
      status: "active",
      password,
      workspaces: [{ id: workspaceId }],
    }).then((response) => {
      expect(response.status).to.eq(201);
      expect(response.body.status).to.eq("active");

      cy.apiLogout();
      cy.visit("/");
      cy.clearAndType(onboardingSelectors.signupEmailInput, email);
      cy.clearAndType(onboardingSelectors.loginPasswordInput, password);
      cy.get(onboardingSelectors.signInButton).click();
      cy.visit("/" + data.workspaceSlug);
      cy.get(commonSelectors.workspaceName, { timeout: 20000 }).should(
        "be.visible"
      );
      cy.clearCookies();
      cy.apiLogin();
    });
  });

  it("should validate GET /ext/user/:id returns inviteUrl null for users without invitation tokens", () => {
    // Case 12: GET /ext/user/:id returns inviteUrl: null for users without invitation tokens
    // The admin user (dev@tooljet.io) was created via internal path and never gets an invitationToken,
    // so their workspaces should have inviteUrl: null.

    // Get any user id from the users list
    cy.request({
      method: "GET",
      url: `${Cypress.env("API_URL")}/ext/users`,
      headers: {
        Authorization: Cypress.env("AUTH_TOKEN"),
        "Content-Type": "application/json",
      },
      failOnStatusCode: false,
    }).then((listResponse) => {
      expect(listResponse.status).to.eq(200);
      expect(listResponse.body).to.be.an("array").and.not.be.empty;

      // Use the first user (admin, created via internal path — no invitationToken)
      const adminUserId = listResponse.body[0].id;

      getUser(adminUserId).then((response) => {
        expect(response.status).to.eq(200);
        expect(response.body.workspaces).to.be.an("array");
        response.body.workspaces.forEach((ws) => {
          expect(
            ws.inviteUrl,
            `workspace ${ws.id} inviteUrl should be null for admin user`
          ).to.be.null;
        });
      });
    });
  });
});
