import { fake } from "Fixtures/fake";
import { sanitize } from "Support/utils/common";
import {
  createUser,
  getUser,
  replaceUserWorkspacesRelations,
  updateUserRole,
} from "Support/utils/externalApi";

describe("ToolJet: User Role API", () => {
  const data = {};
  const createdUserIds = [];
  let workspaceId;
  let workspaceName;

  const createUserWithRole = (role) => {
    const workspace = { name: workspaceName, status: "active", groups: [] };
    if (role) workspace.role = role;
    return createUser({
      name: `${data.firstName} ${data.lastName}`,
      email: data.email,
      password: "password",
      status: "active",
      workspaces: [workspace],
    }).then((response) => {
      expect(response.status).to.eq(201);
      createdUserIds.push(response.body.id);
      return response.body.id;
    });
  };

  beforeEach(() => {
    data.firstName = fake.firstName;
    data.lastName = fake.lastName;
    data.email = fake.email.toLowerCase();
    data.appName = `${sanitize(fake.companyName)}${Date.now().toString(36)}`;

    // Workspace-scoped login: the JWT must include the spec workspace or
    // internal APIs (apps) reject with 401. Also sets env workspaceId.
    cy.then(() =>
      workspaceId
        ? cy.apiLogin("dev@tooljet.io", "password", workspaceId)
        : cy.apiLogin()
    );
  });

  afterEach(() => {
    cy.then(() => {
      if (!workspaceId) return;
      cy.apiLogin("dev@tooljet.io", "password", workspaceId);
      cy.apiDeleteAllApps();
      cy.then(() => {
        createdUserIds.forEach((id) => replaceUserWorkspacesRelations(id, []));
        createdUserIds.length = 0;
      });
    });
  });

  // setup — shared workspace for this spec (runs as a test so it gets retries)
  it("should setup workspace for the spec", () => {
    const suffix = Date.now().toString(36);
    workspaceName = `${sanitize(fake.lastName)}${suffix}`;

    cy.apiCreateWorkspace(workspaceName, workspaceName).then((response) => {
      expect(response.body.organization_id, "spec workspace id").to.exist;
      workspaceId = response.body.organization_id;
      Cypress.env("workspaceId", workspaceId);
    });
  });

  it("verify update user role API end-user to builder", () => {
    createUserWithRole().then((userId) => {
      updateUserRole(workspaceId, { newRole: "builder", userId }).then(
        ({ status }) => {
          expect(status).to.eq(200);
        }
      );

      getUser(userId).then(({ status, body }) => {
        expect(status).to.eq(200);
        const workspace = body.workspaces.find((w) => w.id === workspaceId);
        expect(workspace.userPermission.name).to.eq("builder");
        const groupNames = body.userGroups.map((g) => g.name);
        expect(groupNames).to.include("builder");
      });
    });
  });

  it("verify update user role API builder back to end-user", () => {
    createUserWithRole("builder").then((userId) => {
      updateUserRole(workspaceId, { newRole: "end-user", userId }).then(
        ({ status }) => {
          expect(status).to.eq(200);
        }
      );

      getUser(userId).then(({ status, body }) => {
        expect(status).to.eq(200);
        const workspace = body.workspaces.find((w) => w.id === workspaceId);
        expect(workspace.userPermission.name).to.eq("end-user");
        const groupNames = body.userGroups.map((g) => g.name);
        expect(groupNames).to.not.include("builder");
      });
    });
  });

  it("verify update user role API fails for app owner", () => {
    createUserWithRole("builder").then((userId) => {
      cy.apiLogout();
      cy.apiLogin(data.email, "password", workspaceId);
      cy.apiCreateApp(data.appName);
      cy.apiLogout();
      cy.apiLogin("dev@tooljet.io", "password", workspaceId);

      updateUserRole(workspaceId, { newRole: "end-user", userId }).then(
        ({ status, body }) => {
          expect(status).to.eq(400);
          expect(body.message.title).to.include("Can not change user role");
        }
      );
    });
  });

  it("verify update user role API fails with invalid workspace ID", () => {
    createUserWithRole().then((userId) => {
      updateUserRole(`${workspaceId}invalid`, {
        newRole: "builder",
        userId,
      }).then(({ status, body }) => {
        expect(status).to.eq(422);
        expect(body.message).to.include(
          `invalid input syntax for type uuid: "${workspaceId}invalid"`
        );
      });
    });
  });
});
