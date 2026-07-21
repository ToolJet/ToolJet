import { fake } from "Fixtures/fake";
import { sanitize } from "Support/utils/common";
import {
  createUser,
  getAllUsers,
  getUser,
  invalidAuthHeader,
  replaceUserWorkspacesRelations,
  updateUser,
} from "Support/utils/externalApi";
import { apiCreateGroup } from "Support/utils/manageGroups";

describe("ToolJet: Users API", () => {
  const data = {};
  const createdUserIds = [];
  let workspaceId;
  let workspaceId2;
  let workspaceName;
  let workspaceName2;

  const userPayload = (overrides = {}) => ({
    name: `${data.firstName} ${data.lastName}`,
    email: data.email,
    password: "password",
    status: "active",
    workspaces: [{ name: workspaceName, status: "active", groups: [] }],
    ...overrides,
  });

  const createTrackedUser = (payload) =>
    createUser(payload).then((response) => {
      if (response.status === 201 && response.body && response.body.id) {
        createdUserIds.push(response.body.id);
      }
      return cy.wrap(response, { log: false });
    });

  beforeEach(() => {
    data.firstName = fake.firstName;
    data.lastName = fake.lastName;
    data.email = fake.email.toLowerCase();

    // Workspace-scoped login: the JWT must include the spec workspace or
    // internal APIs (group-permissions, apps) reject with 401. Also sets
    // env workspaceId to the spec workspace.
    cy.then(() =>
      workspaceId
        ? cy.apiLogin("dev@tooljet.io", "password", workspaceId)
        : cy.apiLogin()
    );
  });

  afterEach(() => {
    cy.then(() => {
      if (!workspaceId || createdUserIds.length === 0) return;
      createdUserIds.forEach((id) => replaceUserWorkspacesRelations(id, []));
      createdUserIds.length = 0;
    });
  });

  // setup — shared workspaces for this spec (runs as a test so it gets retries)
  it("should setup workspaces for the spec", () => {
    const suffix = Date.now().toString(36);
    workspaceName = `${sanitize(fake.lastName)}${suffix}`;
    workspaceName2 = `${sanitize(fake.firstName)}${suffix}`;

    cy.apiCreateWorkspace(workspaceName, workspaceName).then((response) => {
      expect(response.body.organization_id, "spec workspace id").to.exist;
      workspaceId = response.body.organization_id;
    });

    cy.apiCreateWorkspace(workspaceName2, workspaceName2).then((response) => {
      expect(response.body.organization_id, "second workspace id").to.exist;
      workspaceId2 = response.body.organization_id;
      Cypress.env("workspaceId", workspaceId);
    });
  });

  it("verify get all users API", () => {
    createTrackedUser(userPayload()).then((response) => {
      expect(response.status).to.eq(201);
    });

    getAllUsers().then(({ status, body }) => {
      expect(status).to.eq(200);
      expect(body).to.be.an("array").and.not.be.empty;
      const emails = body.map((user) => user.email);
      expect(emails).to.include(data.email);
    });
  });

  it("verify get all users API with group_names filter", () => {
    data.groupName = `${sanitize(fake.firstName)}${Date.now().toString(36)}`;

    apiCreateGroup(data.groupName).then(() => {
      createTrackedUser(
        userPayload({
          workspaces: [
            {
              name: workspaceName,
              status: "active",
              groups: [{ name: data.groupName }],
            },
          ],
        })
      ).then((response) => {
        expect(response.status).to.eq(201);
      });

      getAllUsers(`?group_names=${data.groupName}`).then(({ status, body }) => {
        expect(status).to.eq(200);
        expect(body).to.be.an("array").and.have.length(1);
        expect(body[0].email).to.eq(data.email);
      });
    });
  });

  it("verify get user by ID API", () => {
    createTrackedUser(userPayload()).then((response) => {
      expect(response.status).to.eq(201);
      const userId = response.body.id;

      getUser(userId).then(({ status, body }) => {
        expect(status).to.eq(200);
        expect(body.id).to.eq(userId);
        expect(body.email).to.eq(data.email);
        expect(body.name).to.eq(`${data.firstName} ${data.lastName}`);
      });
    });
  });

  it("verify create user API with single workspace", () => {
    createTrackedUser(userPayload()).then((response) => {
      expect(response.status).to.eq(201);
      expect(response.body).to.have.property("id");
      const userId = response.body.id;

      getUser(userId).then(({ status, body }) => {
        expect(status).to.eq(200);
        const workspace = body.workspaces.find((w) => w.id === workspaceId);
        expect(workspace, "created user's workspace relation").to.exist;
        expect(workspace.status).to.eq("active");
      });
    });
  });

  it("verify create user API with multiple workspaces, roles and custom groups", () => {
    const suffix = Date.now().toString(36);
    data.group1 = `${sanitize(fake.firstName)}${suffix}`;
    data.group2 = `${sanitize(fake.lastName)}${suffix}`;

    apiCreateGroup(data.group1);

    cy.apiLogin("dev@tooljet.io", "password", workspaceId2);
    apiCreateGroup(data.group2).then(() => {
      cy.apiLogin("dev@tooljet.io", "password", workspaceId);

      createTrackedUser(
        userPayload({
          workspaces: [
            {
              name: workspaceName,
              status: "active",
              role: "builder",
              groups: [{ name: data.group1 }],
            },
            {
              name: workspaceName2,
              status: "archived",
              role: "admin",
              groups: [{ name: data.group2 }],
            },
          ],
        })
      ).then((response) => {
        expect(response.status).to.eq(201);
        const userId = response.body.id;

        getUser(userId).then(({ status, body }) => {
          expect(status).to.eq(200);

          const groupNames = body.userGroups.map((g) => g.name);
          expect(groupNames).to.include(data.group1);
          // Server assigns groups regardless of the relation's status —
          // archived only affects workspace access, not group membership
          expect(groupNames).to.include(data.group2);

          const activeWorkspace = body.workspaces.find(
            (w) => w.id === workspaceId
          );
          expect(activeWorkspace.status).to.eq("active");
          expect(activeWorkspace.userPermission.name).to.eq("builder");

          const archivedWorkspace = body.workspaces.find(
            (w) => w.id === workspaceId2
          );
          expect(archivedWorkspace.status).to.eq("archived");
        });

        cy.apiLogout();
        cy.apiLogin(data.email, "password");
      });
    });
  });

  it("verify create user API fails with missing name", () => {
    const payload = userPayload();
    delete payload.name;

    createUser(payload).then(({ status, body }) => {
      expect(status).to.eq(400);
      expect(body.message).to.include("name must be a string");
    });
  });

  it("verify create user API fails with invalid email", () => {
    createUser(userPayload({ email: "bademail" })).then(({ status, body }) => {
      expect(status).to.eq(400);
      expect(body.message).to.include("email must be an email");
    });
  });

  it("verify create user API fails with duplicate email", () => {
    createTrackedUser(userPayload()).then((response) => {
      expect(response.status).to.eq(201);
    });

    createUser(userPayload()).then(({ status, body }) => {
      expect(status).to.eq(400);
      expect(body.message).to.include(
        `User with email ${data.email} already exists`
      );
    });
  });

  it("verify create user API fails with invalid status", () => {
    createUser(userPayload({ status: "badstatus" })).then(
      ({ status, body }) => {
        expect(status).to.eq(400);
        expect(body.message).to.be.an("array").and.not.be.empty;
        const joinedMessage = body.message.join(" ").toLowerCase();
        expect(joinedMessage).to.include(
          "status must be one of the following values: active, archived"
        );
      }
    );
  });

  it("verify create user API fails with empty body", () => {
    createUser({}).then(({ status, body }) => {
      expect(status).to.eq(400);
      expect(body.message).to.be.an("array").and.not.be.empty;
      const joinedMessage = body.message.join(" ").toLowerCase();
      ["name", "email", "workspaces"].forEach((field) => {
        expect(joinedMessage).to.include(field);
      });
    });
  });

  it("verify update user API updates name", () => {
    createTrackedUser(userPayload()).then((response) => {
      expect(response.status).to.eq(201);
      const userId = response.body.id;
      const updatedName = `${fake.firstName} ${fake.lastName}`;

      updateUser(userId, { name: updatedName }).then(({ status }) => {
        expect(status).to.eq(200);
      });

      getUser(userId).then(({ status, body }) => {
        expect(status).to.eq(200);
        expect(body.name).to.eq(updatedName);
      });
    });
  });

  // BUG: PATCH /ext/user/:id with a password field returns 500 and applies
  // nothing — bcrypt default-import bug in ee/external-apis/util.service.ts:31.
  // Un-skip once "Unable to update user password via External API" is fixed.
  it.skip("verify update user API updates password", () => {
    const newPassword = "updatedpassword";

    createTrackedUser(userPayload()).then((response) => {
      expect(response.status).to.eq(201);
      const userId = response.body.id;

      updateUser(userId, { password: newPassword }).then(({ status }) => {
        expect(status).to.eq(200);
      });

      cy.apiLogout();
      cy.apiLogin(data.email, newPassword);
    });
  });

  it("verify update user API fails with invalid user ID", () => {
    updateUser("invalid12345", { name: "Whatever User" }).then(
      ({ status, body }) => {
        expect(status).to.eq(422);
        expect(body.message).to.include(
          'invalid input syntax for type uuid: "invalid12345"'
        );
      }
    );
  });

  it("verify update user API accepts empty body as no-op", () => {
    createTrackedUser(userPayload()).then((response) => {
      expect(response.status).to.eq(201);
      const userId = response.body.id;

      updateUser(userId, {}).then(({ status }) => {
        expect(status).to.eq(200);
      });

      getUser(userId).then(({ status, body }) => {
        expect(status).to.eq(200);
        expect(body.name).to.eq(`${data.firstName} ${data.lastName}`);
        expect(body.email).to.eq(data.email);
      });
    });
  });

  it("verify update user API ignores unknown fields", () => {
    createTrackedUser(userPayload()).then((response) => {
      expect(response.status).to.eq(201);
      const userId = response.body.id;

      updateUser(userId, { invalidField: "value" }).then(({ status }) => {
        expect(status).to.eq(200);
      });

      getUser(userId).then(({ status, body }) => {
        expect(status).to.eq(200);
        expect(body.name).to.eq(`${data.firstName} ${data.lastName}`);
      });
    });
  });

  it("verify users API rejects invalid auth token", () => {
    getAllUsers("", invalidAuthHeader).then(({ status, body }) => {
      expect(status).to.eq(403);
      expect(body.message).to.include("Unauthorized");
    });
  });
});
