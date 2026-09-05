import { fake } from "Fixtures/fake";
import { sanitize } from "Support/utils/common";
import {
  createUser,
  emptyAuthHeader,
  getWorkspaceUsersByGroups,
  invalidAuthHeader,
  replaceUserWorkspacesRelations,
} from "Support/utils/externalApi";
import { apiCreateGroup } from "Support/utils/manageGroups";

describe("ToolJet: Workspace Users By Groups API", () => {
  const createdUserIds = [];
  let workspaceId;
  let workspaceName;

  const messageText = (body) =>
    Array.isArray(body.message) ? body.message.join(" ") : body.message;

  const createGroupedUser = (groups, status = "active") =>
    createUser({
      name: `${fake.firstName} ${fake.lastName}`,
      email: fake.email.toLowerCase(),
      password: "password",
      status: "active",
      workspaces: [
        { name: workspaceName, status, groups: groups.map((name) => ({ name })) },
      ],
    }).then((response) => {
      expect(response.status).to.eq(201);
      createdUserIds.push(response.body.id);
      return response.body;
    });

  beforeEach(() => {
    cy.then(() =>
      workspaceId
        ? cy.apiLogin("dev@tooljet.io", "password", workspaceId)
        : cy.apiLogin(),
    );
  });

  afterEach(() => {
    cy.then(() => {
      if (!workspaceId || createdUserIds.length === 0) return;
      createdUserIds.forEach((id) => replaceUserWorkspacesRelations(id, []));
      createdUserIds.length = 0;
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

  it("verify workspace users by groups API matches ALL groups by default", () => {
    const suffix = Date.now().toString(36);
    const group1 = `${sanitize(fake.firstName)}${suffix}`;
    const group2 = `${sanitize(fake.lastName)}${suffix}`;

    apiCreateGroup(group1);
    apiCreateGroup(group2).then(() => {
      createGroupedUser([group1, group2]).then((fullMatchUser) => {
        createGroupedUser([group1]).then((partialMatchUser) => {
          getWorkspaceUsersByGroups(workspaceId, {
            group_names: [group1, group2],
          }).then(({ status, body }) => {
            expect(status).to.eq(201);
            const emails = body.map((u) => u.email);
            expect(emails).to.include(fullMatchUser.email);
            expect(emails).to.not.include(partialMatchUser.email);

            const matched = body.find((u) => u.email === fullMatchUser.email);
            expect(matched.groups).to.have.members([group1, group2]);
          });
        });
      });
    });
  });

  it("verify workspace users by groups API matches ANY group", () => {
    const suffix = Date.now().toString(36);
    const group1 = `${sanitize(fake.firstName)}${suffix}`;
    const group2 = `${sanitize(fake.lastName)}${suffix}`;

    apiCreateGroup(group1);
    apiCreateGroup(group2).then(() => {
      createGroupedUser([group1, group2]).then((fullMatchUser) => {
        createGroupedUser([group1]).then((partialMatchUser) => {
          getWorkspaceUsersByGroups(workspaceId, {
            group_names: [group1, group2],
            match: "any",
          }).then(({ status, body }) => {
            expect(status).to.eq(201);
            const emails = body.map((u) => u.email);
            expect(emails).to.include(fullMatchUser.email);
            expect(emails).to.include(partialMatchUser.email);
          });
        });
      });
    });
  });

  it("verify workspace users by groups API filters by workspace membership status", () => {
    const suffix = Date.now().toString(36);
    const group1 = `${sanitize(fake.firstName)}${suffix}`;

    apiCreateGroup(group1).then(() => {
      createGroupedUser([group1], "active").then((activeUser) => {
        createGroupedUser([group1], "archived").then((archivedUser) => {
          getWorkspaceUsersByGroups(workspaceId, {
            group_names: [group1],
            match: "any",
            status: "active",
          }).then(({ status, body }) => {
            expect(status).to.eq(201);
            const emails = body.map((u) => u.email);
            expect(emails).to.include(activeUser.email);
            expect(emails).to.not.include(archivedUser.email);
          });
        });
      });
    });
  });

  it("verify workspace users by groups API matches default role group name (admin)", () => {
    getWorkspaceUsersByGroups(workspaceId, {
      group_names: ["admin"],
      match: "any",
    }).then(({ status, body }) => {
      expect(status).to.eq(201);
      const emails = body.map((u) => u.email);
      expect(emails).to.include("dev@tooljet.io");
    });
  });

  it("verify workspace users by groups API group name matching is case-sensitive", () => {
    const suffix = Date.now().toString(36);
    const group1 = `${sanitize(fake.firstName)}${suffix}`;

    apiCreateGroup(group1).then(() => {
      createGroupedUser([group1]).then(() => {
        getWorkspaceUsersByGroups(workspaceId, {
          group_names: [group1.toUpperCase()],
          match: "any",
        }).then(({ status, body }) => {
          expect(status).to.eq(201);
          expect(body).to.be.an("array").and.have.length(0);
        });
      });
    });
  });

  it("verify workspace users by groups API ALL match returns empty with a non-existent group in the list", () => {
    const suffix = Date.now().toString(36);
    const group1 = `${sanitize(fake.firstName)}${suffix}`;

    apiCreateGroup(group1).then(() => {
      createGroupedUser([group1]).then(() => {
        getWorkspaceUsersByGroups(workspaceId, {
          group_names: [group1, "no-such-group"],
        }).then(({ status, body }) => {
          expect(status).to.eq(201);
          expect(body).to.be.an("array").and.have.length(0);
        });
      });
    });
  });

  it("verify workspace users by groups API returns empty array for non-existent group names", () => {
    getWorkspaceUsersByGroups(workspaceId, {
      group_names: ["no-such-group"],
      match: "any",
    }).then(({ status, body }) => {
      expect(status).to.eq(201);
      expect(body).to.be.an("array").and.have.length(0);
    });
  });


  it("verify workspace users by groups API returns 422 for empty group_names array", () => {
    getWorkspaceUsersByGroups(workspaceId, { group_names: [] }).then(
      ({ status, body }) => {
        expect(status).to.eq(422);
        expect(messageText(body)).to.include("syntax error");
      },
    );
  });

  it("verify workspace users by groups API fails with missing group_names", () => {
    getWorkspaceUsersByGroups(workspaceId, {}).then(({ status, body }) => {
      expect(status).to.eq(400);
      expect(messageText(body)).to.include("group_names must be an array");
    });
  });

  it("verify workspace users by groups API fails with invalid match value", () => {
    getWorkspaceUsersByGroups(workspaceId, {
      group_names: ["group1"],
      match: "some",
    }).then(({ status, body }) => {
      expect(status).to.eq(400);
      expect(messageText(body)).to.include(
        "match must be one of the following values: all, any",
      );
    });
  });

  it("verify workspace users by groups API fails when group_names is a string instead of an array", () => {
    getWorkspaceUsersByGroups(workspaceId, { group_names: "group1" }).then(
      ({ status, body }) => {
        expect(status).to.eq(400);
        expect(messageText(body)).to.include("group_names must be an array");
      },
    );
  });

  it("verify workspace users by groups API fails with an empty string element in group_names", () => {
    getWorkspaceUsersByGroups(workspaceId, {
      group_names: ["group1", ""],
    }).then(({ status, body }) => {
      expect(status).to.eq(400);
      expect(messageText(body)).to.include(
        "each value in group_names should not be empty",
      );
    });
  });

  it("verify workspace users by groups API fails with status 'verified'", () => {
    getWorkspaceUsersByGroups(workspaceId, {
      group_names: ["group1"],
      status: "verified",
    }).then(({ status, body }) => {
      expect(status).to.eq(400);
      expect(messageText(body)).to.include(
        "status must be one of the following values: active, archived, invited",
      );
    });
  });

  it("verify workspace users by groups API fails with a non-existent workspace slug", () => {
    const nonExistentSlug = `no-such-workspace-${Date.now().toString(36)}`;

    getWorkspaceUsersByGroups(nonExistentSlug, {
      group_names: ["group1"],
    }).then(({ status, body }) => {
      expect(status).to.eq(404);
      expect(body.message).to.include("Workspace not found");
    });
  });

  it("verify workspace users by groups API fails with a well-formed but unknown workspace UUID", () => {
    getWorkspaceUsersByGroups("00000000-0000-4000-8000-000000000000", {
      group_names: ["group1"],
    }).then(({ status, body }) => {
      expect(status).to.eq(404);
      expect(body.message).to.include("Workspace not found");
    });
  });

  it("verify workspace users by groups API rejects an invalid auth token", () => {
    getWorkspaceUsersByGroups(
      workspaceId,
      { group_names: ["group1"] },
      invalidAuthHeader,
    ).then(({ status, body }) => {
      expect(status).to.eq(403);
      expect(body.message).to.include("Unauthorized");
    });
  });

  it("verify workspace users by groups API rejects a missing auth token", () => {
    getWorkspaceUsersByGroups(
      workspaceId,
      { group_names: ["group1"] },
      emptyAuthHeader,
    ).then(({ status, body }) => {
      expect(status).to.eq(403);
      expect(body.message).to.include("Unauthorized");
    });
  });


});
