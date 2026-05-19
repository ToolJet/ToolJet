import {
  createUser,
  getUser,
  getAllUsers,
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

  // ── SECTION 1: Invited user (default status) ─────────────────────────────────

  it("invited user: default status is invited, inviteUrl is non-null and contains correct oid", () => {
    cy.then(() => Cypress.env("workspaceId")).then((workspaceId) => {
      createUser({
        name: fake.firstName,
        email: `${sanitize(fake.lastName)}@example.com`,
        workspaces: [{ id: workspaceId }],
      }).then((response) => {
        expect(response.status).to.eq(201);
        expect(response.body.status).to.eq("invited");
        expect(response.body.workspaces).to.have.length(1);
        const inviteUrl = response.body.workspaces[0].inviteUrl;
        expect(inviteUrl, "inviteUrl should be non-null").to.exist;
        expect(inviteUrl).to.include(`oid=${workspaceId}`);

        // GET should also return non-null inviteUrl for an invited user with ws invited
        getUser(response.body.id).then((getResponse) => {
          expect(getResponse.status).to.eq(200);
          expect(getResponse.body.workspaces[0].inviteUrl).to.exist;
        });
      });
    });
  });

  // ── SECTION 2: Active user — inviteUrl behavior by workspace status ──────────
  //
  // When status=active, User.invitationToken is null at creation time so the full
  // invite URL (/invitations/{userToken}/workspaces/{ouToken}) cannot be generated.
  // Instead, a workspace-only org-invite URL (/organization-invitations/{ouToken})
  // is returned when the workspace membership is not yet active.
  // When workspace status is also active, no URL is generated at all (null).

  it("active user + ws invited: POST inviteUrl is an org-invite URL (not a full invite URL)", () => {
    cy.then(() => Cypress.env("workspaceId")).then((workspaceId) => {
      // active + no password + ws invited (default)
      createUser({
        name: fake.firstName,
        email: `${sanitize(fake.lastName)}@example.com`,
        status: "active",
        workspaces: [{ id: workspaceId }],
      }).then((response) => {
        expect(response.status).to.eq(201);
        expect(response.body.status).to.eq("active");
        const inviteUrl = response.body.workspaces[0].inviteUrl;
        expect(inviteUrl).to.exist;
        expect(inviteUrl).to.include("organization-invitations");
        expect(inviteUrl).to.not.include("/invitations/");

        // GET also returns org-invite URL: ou.status is not active, ou.invitationToken is set,
        // user.invitationToken is null → org-invite URL format
        getUser(response.body.id).then((getResponse) => {
          expect(getResponse.status).to.eq(200);
          const getInviteUrl = getResponse.body.workspaces[0].inviteUrl;
          expect(getInviteUrl).to.exist;
          expect(getInviteUrl).to.include("organization-invitations");
        });
      });

      // active + with password + ws invited (default)
      createUser({
        name: fake.firstName,
        email: `${sanitize(fake.lastName)}@example.com`,
        status: "active",
        password: "Password",
        workspaces: [{ id: workspaceId }],
      }).then((response) => {
        expect(response.status).to.eq(201);
        const inviteUrl = response.body.workspaces[0].inviteUrl;
        expect(inviteUrl).to.exist;
        expect(inviteUrl).to.include("organization-invitations");
      });
    });
  });

  it("archived user: POST inviteUrl is non-null (tokens generated unconditionally at creation)", () => {
    cy.then(() => Cypress.env("workspaceId")).then((workspaceId) => {
      createUser({
        name: fake.firstName,
        email: `${sanitize(fake.lastName)}@example.com`,
        status: "archived",
        workspaces: [{ id: workspaceId, status: "archived" }],
      }).then((response) => {
        expect(response.status).to.eq(201);
        expect(response.body.status).to.eq("archived");
        expect(response.body.workspaces[0].inviteUrl).to.exist;
      });
    });
  });

  it("active user + ws active: POST inviteUrl is null (no URL when workspace membership is already active)", () => {
    cy.then(() => Cypress.env("workspaceId")).then((workspaceId) => {
      // active + no password + ws active
      createUser({
        name: fake.firstName,
        email: `${sanitize(fake.lastName)}@example.com`,
        status: "active",
        workspaces: [{ id: workspaceId, status: "active" }],
      }).then((response) => {
        expect(response.status).to.eq(201);
        expect(response.body.workspaces[0].inviteUrl).to.be.null;
      });

      // active + with password + ws active
      createUser({
        name: fake.firstName,
        email: `${sanitize(fake.lastName)}@example.com`,
        status: "active",
        password: "Password",
        workspaces: [{ id: workspaceId, status: "active" }],
      }).then((response) => {
        expect(response.status).to.eq(201);
        expect(response.body.workspaces[0].inviteUrl).to.be.null;
      });
    });
  });

  // ── SECTION 3: Workspace status active — POST vs GET inviteUrl difference ────
  //
  // POST inviteUrl depends only on user.invitationToken (non-null for invited users).
  // GET inviteUrl additionally checks ou.status — if active, returns null.

  it("invited user with workspace status active: POST inviteUrl non-null, GET inviteUrl null", () => {
    cy.then(() => Cypress.env("workspaceId")).then((workspaceId) => {
      // invited + no password + ws active
      createUser({
        name: fake.firstName,
        email: `${sanitize(fake.lastName)}@example.com`,
        workspaces: [{ id: workspaceId, status: "active" }],
      }).then((response) => {
        expect(response.status).to.eq(201);
        expect(response.body.status).to.eq("invited");
        expect(response.body.workspaces[0].inviteUrl).to.exist;

        getUser(response.body.id).then((getResponse) => {
          expect(getResponse.status).to.eq(200);
          expect(getResponse.body.workspaces[0].inviteUrl).to.be.null;
        });
      });

      // invited + with password + ws active
      createUser({
        name: fake.firstName,
        email: `${sanitize(fake.lastName)}@example.com`,
        password: "Password",
        workspaces: [{ id: workspaceId, status: "active" }],
      }).then((response) => {
        expect(response.status).to.eq(201);
        expect(response.body.workspaces[0].inviteUrl).to.exist;
      });
    });
  });

  // ── SECTION 4: Multi-workspace, roles, and custom groups ─────────────────────

  it("should create user in all requested workspaces with per-workspace inviteUrls", () => {
    cy.then(() => Cypress.env("workspaceId")).then((workspaceId) => {
      const ts2 = Date.now();
      cy.apiCreateWorkspace(
        `${sanitize(fake.lastName)}${ts2}`,
        `${sanitize(fake.lastName)}${ts2}`
      ).then((wsResponse) => {
        const secondWorkspaceId = wsResponse.body.organization_id;

        createUser({
          name: fake.firstName,
          email: `${sanitize(fake.lastName)}@example.com`,
          workspaces: [{ id: workspaceId }, { id: secondWorkspaceId }],
        }).then((response) => {
          expect(response.status).to.eq(201);
          expect(response.body.workspaces).to.have.length(2);
          const returnedIds = response.body.workspaces.map((ws) => ws.id);
          expect(returnedIds).to.include(workspaceId);
          expect(returnedIds).to.include(secondWorkspaceId);
          response.body.workspaces.forEach((ws) => {
            expect(ws.inviteUrl).to.exist;
          });
        });
      });
    });
  });

  it("should assign specified roles across single and multiple workspaces", () => {
    cy.then(() => Cypress.env("workspaceId")).then((workspaceId) => {
      createUser({
        name: fake.firstName,
        email: `${sanitize(fake.lastName)}@example.com`,
        workspaces: [{ id: workspaceId, role: "builder" }],
      }).then((response) => {
        expect(response.status).to.eq(201);
        const groupNames = response.body.userGroups.map((g) => g.name);
        expect(groupNames).to.include("builder");
      });

      const ts3 = Date.now();
      cy.apiCreateWorkspace(
        `${sanitize(fake.lastName)}${ts3}`,
        `${sanitize(fake.lastName)}${ts3}`
      ).then((wsResponse) => {
        const secondWorkspaceId = wsResponse.body.organization_id;
        createUser({
          name: fake.firstName,
          email: `${sanitize(fake.lastName)}@example.com`,
          workspaces: [
            { id: workspaceId, role: "builder" },
            { id: secondWorkspaceId, role: "end-user" },
          ],
        }).then((response) => {
          expect(response.status).to.eq(201);
          const groupNames = response.body.userGroups.map((g) => g.name);
          expect(groupNames).to.include("builder");
          expect(groupNames).to.include("end-user");
        });
      });
    });
  });

  it("should add user to multiple custom groups in a workspace", () => {
    cy.then(() => Cypress.env("workspaceId")).then((workspaceId) => {
      cy.getAuthHeaders().then((headers) => {
        cy.request({
          method: "POST",
          url: `${Cypress.env("server_host")}/api/v2/group-permissions`,
          headers,
          body: { name: "Viewer Group A" },
          failOnStatusCode: false,
        }).then(() => {
          cy.request({
            method: "POST",
            url: `${Cypress.env("server_host")}/api/v2/group-permissions`,
            headers,
            body: { name: "Viewer Group B" },
            failOnStatusCode: false,
          }).then(() => {
            createUser({
              name: fake.firstName,
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
  });

  // ── SECTION 5: Error / validation ────────────────────────────────────────────

  it("should return 400 for validation failures", () => {
    cy.then(() => Cypress.env("workspaceId")).then((workspaceId) => {
      const sharedEmail = `${sanitize(fake.lastName)}@example.com`;

      // duplicate email
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

      // non-existent workspace id
      createUser({
        name: "Ghost Vendor",
        email: `${sanitize(fake.lastName)}@example.com`,
        workspaces: [{ id: "a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d" }],
      }).then((response) => {
        expect(response.status).to.eq(400);
        expect(response.body.message).to.include("do not exist");
      });

      // default group name in groups field (use role field instead)
      createUser({
        name: "Invalid Group Vendor",
        email: `${sanitize(fake.lastName)}@example.com`,
        workspaces: [{ id: workspaceId, groups: [{ name: "builder" }] }],
      }).then((response) => {
        expect(response.status).to.eq(400);
        expect(response.body.message).to.include("role field");
      });

      // non-existent custom group
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
  });

  it("should return 400 when end-user is added to a builder-level custom group", () => {
    cy.then(() => Cypress.env("workspaceId")).then((workspaceId) => {
      cy.getAuthHeaders().then((headers) => {
        cy.request({
          method: "POST",
          url: `${Cypress.env("server_host")}/api/v2/group-permissions`,
          headers,
          body: { name: "Elevated Builders" },
          failOnStatusCode: false,
        }).then((groupResponse) => {
          const groupId = groupResponse.body.id;
          cy.request({
            method: "PUT",
            url: `${Cypress.env("server_host")}/api/v2/group-permissions/${groupId}`,
            headers,
            body: { appCreate: true },
            failOnStatusCode: false,
          }).then(() => {
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
  });

  // ── SECTION 6: UI end-to-end flows ───────────────────────────────────────────

  it("invited user with no password: visit inviteUrl → set password → accept invite", () => {
    cy.then(() => Cypress.env("workspaceId")).then((workspaceId) => {
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

        cy.clearCookies();
        cy.apiLogin();
      });
    });
  });

  it("invited user with no password and workspace status active: visit inviteUrl → set password → workspace loads", () => {
    cy.then(() => Cypress.env("workspaceId")).then((workspaceId) => {
      const email = `${sanitize(fake.lastName)}@example.com`;

      createUser({
        name: fake.firstName,
        email,
        workspaces: [{ id: workspaceId, status: "active" }],
      }).then((response) => {
        expect(response.status).to.eq(201);
        expect(response.body.status).to.eq("invited");
        // POST: non-null (user.invitationToken is set for invited users)
        const inviteUrl = response.body.workspaces[0].inviteUrl;
        expect(inviteUrl).to.exist;

        cy.apiLogout();
        cy.visit(inviteUrl);

        cy.clearAndType(onboardingSelectors.loginPasswordInput, "password");
        cy.get(commonSelectors.signUpButton).click();
        cy.get(commonSelectors.acceptInviteButton, { timeout: 10000 }).click();
        cy.get(commonSelectors.workspaceName, { timeout: 20000 }).should(
          "be.visible"
        );

        cy.clearCookies();
        cy.apiLogin();
      });
    });
  });

  it("active user with password: POST returns org-invite URL — direct login to workspace", () => {
    cy.then(() => Cypress.env("workspaceId")).then((workspaceId) => {
      const email = `${sanitize(fake.lastName)}@example.com`;
      const password = "Password";

      createUser({
        name: fake.firstName,
        email,
        status: "active",
        password,
        workspaces: [{ id: workspaceId }],
      }).then((response) => {
        expect(response.status).to.eq(201);
        expect(response.body.status).to.eq("active");
        // Active users have no User.invitationToken, so a workspace-only org-invite URL is
        // returned instead of the full invite URL. The user logs in directly with their password.
        const inviteUrl = response.body.workspaces[0].inviteUrl;
        expect(inviteUrl).to.exist;
        expect(inviteUrl).to.include("organization-invitations");

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
  });

  it("active user with no password: POST returns org-invite URL — reset password via DB token then login", () => {
    cy.then(() => Cypress.env("workspaceId")).then((workspaceId) => {
      const email = `${sanitize(fake.lastName)}@example.com`;
      const newPassword = "Password";

      createUser({
        name: fake.firstName,
        email,
        status: "active",
        workspaces: [{ id: workspaceId }],
      }).then((response) => {
        expect(response.status).to.eq(201);
        expect(response.body.status).to.eq("active");
        // Active users have no User.invitationToken — a workspace-only org-invite URL is
        // returned. No password is set, so the user must reset via forgot-password first.
        const inviteUrl = response.body.workspaces[0].inviteUrl;
        expect(inviteUrl).to.exist;
        expect(inviteUrl).to.include("organization-invitations");

        cy.apiLogout();
        cy.visit("/");

        cy.get(commonSelectors.forgotPasswordLink).click();
        cy.clearAndType('[data-cy="email-input-field-input"]', email);
        cy.get(commonSelectors.resetPasswordLinkButton).click();

        // Fetch reset token directly from DB to avoid email dependency
        cy.task("dbConnection", {
          dbconfig: Cypress.env("app_db"),
          sql: `select forgot_password_token from users where email='${email}';`,
        }).then((resp) => {
          const token = resp.rows[0].forgot_password_token;
          cy.visit(`/reset-password/${token}`);

          cy.get(commonSelectors.newPasswordInputField).type(newPassword);
          cy.get(commonSelectors.confirmPasswordInputField).type(newPassword);
          cy.get(commonSelectors.resetPasswordButton).click();

          cy.get(commonSelectors.backToLoginButton).click();
          cy.clearAndType(onboardingSelectors.signupEmailInput, email);
          cy.clearAndType(onboardingSelectors.loginPasswordInput, newPassword);
          cy.get(onboardingSelectors.signInButton).click();

          cy.visit("/" + data.workspaceSlug);
          cy.get(commonSelectors.workspaceName, { timeout: 20000 }).should(
            "be.visible"
          );

          cy.clearCookies();
          cy.apiLogin();
        });
      });
    });
  });

  // ── SECTION 7: GET /ext/user/:id ─────────────────────────────────────────────

  it("GET /ext/user/:id returns inviteUrl null for pre-existing users without invitation tokens", () => {
    getAllUsers().then((listResponse) => {
      expect(listResponse.status).to.eq(200);
      expect(listResponse.body).to.be.an("array").and.not.be.empty;

      // Admin user was created via internal path — no invitationToken is ever set
      const adminUserId = listResponse.body[0].id;

      getUser(adminUserId).then((response) => {
        expect(response.status).to.eq(200);
        expect(response.body.workspaces).to.be.an("array");
        response.body.workspaces.forEach((ws) => {
          expect(
            ws.inviteUrl,
            `workspace ${ws.id} should have null inviteUrl for admin user`
          ).to.be.null;
        });
      });
    });
  });
});
