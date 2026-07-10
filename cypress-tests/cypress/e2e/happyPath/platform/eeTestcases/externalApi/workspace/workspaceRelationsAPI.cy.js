import { fake } from "Fixtures/fake";
import { sanitize } from "Support/utils/common";
import {
  createUser,
  getAllWorkspaces,
  getUser,
  replaceUserWorkspace,
  replaceUserWorkspacesRelations,
} from "Support/utils/externalApi";
import { apiCreateGroup } from "Support/utils/manageGroups";

describe("ToolJet: Workspaces & Relations API", () => {
  const data = {};
  const createdUserIds = [];
  let workspaceId;
  let workspaceId2;
  let workspaceName;
  let workspaceName2;

  const createUserInWorkspaces = (workspaces) =>
    createUser({
      name: `${data.firstName} ${data.lastName}`,
      email: data.email,
      password: "password",
      status: "active",
      workspaces,
    }).then((response) => {
      expect(response.status).to.eq(201);
      createdUserIds.push(response.body.id);
      return response.body.id;
    });

  beforeEach(() => {
    const suffix = Date.now().toString(36);
    data.firstName = fake.firstName;
    data.lastName = fake.lastName;
    data.email = fake.email.toLowerCase();
    data.group1 = `${sanitize(fake.firstName)}${suffix}`;
    data.group2 = `${sanitize(fake.lastName)}${suffix}`;

    // Workspace-scoped login: the JWT must include the spec workspace or
    // internal APIs (group-permissions) reject with 401. Also sets env workspaceId.
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

  it("verify get all workspaces API with response shape", () => {
    apiCreateGroup(data.group1).then(() => {
      getAllWorkspaces().then(({ status, body }) => {
        expect(status).to.eq(200);
        expect(body).to.be.an("array").and.not.be.empty;

        const workspace = body.find((w) => w.id === workspaceId);
        expect(workspace, "created workspace in listing").to.exist;
        expect(workspace.name).to.eq(workspaceName);
        expect(workspace.status).to.eq("active");
        expect(workspace.groups).to.be.an("array");
        const groupNames = workspace.groups.map((g) => g.name);
        expect(groupNames).to.include(data.group1);
      });
    });
  });

  it("verify replace user workspaces relations API with role and group changes", () => {
    apiCreateGroup(data.group1);
    apiCreateGroup(data.group2).then(() => {
      createUserInWorkspaces([
        {
          name: workspaceName,
          status: "active",
          groups: [{ name: data.group1 }],
        },
      ]).then((userId) => {
        replaceUserWorkspacesRelations(userId, [
          {
            name: workspaceName,
            status: "active",
            role: "builder",
            groups: [{ name: data.group2 }],
          },
        ]).then(({ status }) => {
          expect(status).to.eq(200);
        });

        getUser(userId).then(({ status, body }) => {
          expect(status).to.eq(200);
          const groupNames = body.userGroups.map((g) => g.name);
          expect(groupNames).to.include(data.group2);
          expect(groupNames).to.not.include(data.group1);

          const workspace = body.workspaces.find((w) => w.id === workspaceId);
          expect(workspace.status).to.eq("active");
          expect(workspace.userPermission.name).to.eq("builder");
        });
      });
    });
  });

  it("verify replace user workspaces relations API removes user from omitted workspace", () => {
    createUserInWorkspaces([
      { name: workspaceName, status: "active", groups: [] },
      { name: workspaceName2, status: "active", groups: [] },
    ]).then((userId) => {
      replaceUserWorkspacesRelations(userId, [
        { name: workspaceName, status: "active", groups: [] },
      ]).then(({ status }) => {
        expect(status).to.eq(200);
      });

      getUser(userId).then(({ status, body }) => {
        expect(status).to.eq(200);
        const workspaceIds = body.workspaces.map((w) => w.id);
        expect(workspaceIds).to.include(workspaceId);
        expect(
          workspaceIds,
          "user removed from the omitted workspace"
        ).to.not.include(workspaceId2);
      });
    });
  });

  it("verify replace user workspaces relations API with empty array removes user from all workspaces", () => {
    createUserInWorkspaces([
      { name: workspaceName, status: "active", groups: [] },
    ]).then((userId) => {
      replaceUserWorkspacesRelations(userId, []).then(({ status }) => {
        expect(status).to.eq(200);
      });

      getUser(userId).then(({ status, body }) => {
        expect(status).to.eq(200);
        expect(body.workspaces).to.be.an("array").and.have.length(0);
      });
    });
  });

  it("verify replace user workspaces relations API fails with non-existent group", () => {
    createUserInWorkspaces([
      { name: workspaceName, status: "active", groups: [] },
    ]).then((userId) => {
      replaceUserWorkspacesRelations(userId, [
        {
          name: workspaceName,
          status: "active",
          groups: [{ name: "NonExisting" }],
        },
      ]).then(({ status, body }) => {
        expect(status).to.eq(400);
        expect(body.message).to.include("Group");
      });
    });
  });

  it("verify update user workspace relation API", () => {
    apiCreateGroup(data.group1).then(() => {
      createUserInWorkspaces([
        { name: workspaceName, status: "active", groups: [] },
      ]).then((userId) => {
        replaceUserWorkspace(userId, workspaceId, {
          status: "active",
          groups: [{ name: data.group1 }],
        }).then(({ status }) => {
          expect(status).to.eq(200);
        });

        getUser(userId).then(({ status, body }) => {
          expect(status).to.eq(200);
          const workspace = body.workspaces.find((w) => w.id === workspaceId);
          expect(workspace.status).to.eq("active");
          const groupNames = body.userGroups.map((g) => g.name);
          expect(groupNames).to.include(data.group1);
        });
      });
    });
  });

  it("verify update user workspace relation API archives and reactivates user", () => {
    createUserInWorkspaces([
      { name: workspaceName, status: "active", groups: [] },
    ]).then((userId) => {
      replaceUserWorkspace(userId, workspaceId, { status: "archived" }).then(
        ({ status }) => {
          expect(status).to.eq(200);
        }
      );

      getUser(userId).then(({ body }) => {
        const workspace = body.workspaces.find((w) => w.id === workspaceId);
        expect(workspace.status).to.eq("archived");
      });

      replaceUserWorkspace(userId, workspaceId, { status: "active" }).then(
        ({ status }) => {
          expect(status).to.eq(200);
        }
      );

      getUser(userId).then(({ body }) => {
        const workspace = body.workspaces.find((w) => w.id === workspaceId);
        expect(workspace.status).to.eq("active");
      });
    });
  });

  it("verify update user workspace relation API replaces, removes and re-adds groups", () => {
    apiCreateGroup(data.group1);
    apiCreateGroup(data.group2).then(() => {
      createUserInWorkspaces([
        {
          name: workspaceName,
          status: "active",
          groups: [{ name: data.group1 }, { name: data.group2 }],
        },
      ]).then((userId) => {
        replaceUserWorkspace(userId, workspaceId, {
          groups: [{ name: data.group1 }],
        }).then(({ status }) => {
          expect(status).to.eq(200);
        });

        getUser(userId).then(({ body }) => {
          const groupNames = body.userGroups.map((g) => g.name);
          expect(groupNames).to.include(data.group1);
          expect(groupNames).to.not.include(data.group2);
        });

        replaceUserWorkspace(userId, workspaceId, { groups: [] }).then(
          ({ status }) => {
            expect(status).to.eq(200);
          }
        );

        getUser(userId).then(({ body }) => {
          const groupNames = body.userGroups.map((g) => g.name);
          expect(groupNames).to.not.include(data.group1);
          expect(groupNames).to.not.include(data.group2);
        });

        replaceUserWorkspace(userId, workspaceId, {
          groups: [{ name: data.group1 }, { name: data.group2 }],
        }).then(({ status }) => {
          expect(status).to.eq(200);
        });

        getUser(userId).then(({ body }) => {
          const groupNames = body.userGroups.map((g) => g.name);
          expect(groupNames).to.include(data.group1);
          expect(groupNames).to.include(data.group2);
        });
      });
    });
  });

  it("verify update user workspace relation API accepts empty body as no-op", () => {
    apiCreateGroup(data.group1).then(() => {
      createUserInWorkspaces([
        {
          name: workspaceName,
          status: "active",
          groups: [{ name: data.group1 }],
        },
      ]).then((userId) => {
        replaceUserWorkspace(userId, workspaceId, {}).then(({ status }) => {
          expect(status).to.eq(200);
        });

        getUser(userId).then(({ status, body }) => {
          expect(status).to.eq(200);
          const workspace = body.workspaces.find((w) => w.id === workspaceId);
          expect(workspace.status).to.eq("active");
          const groupNames = body.userGroups.map((g) => g.name);
          expect(groupNames, "groups unchanged after empty body").to.include(
            data.group1
          );
        });
      });
    });
  });
});
