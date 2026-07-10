import { fake } from "Fixtures/fake";
import { sanitize } from "Support/utils/common";
import {
  createUser,
  getUserMetadata,
  invalidAuthHeader,
  replaceUserWorkspacesRelations,
  updateUserMetadata,
} from "Support/utils/externalApi";

describe("ToolJet: User Metadata API", () => {
  const data = {};
  const nonExistentId = "00000000-0000-0000-0000-000000000099";
  let workspaceId;
  let workspaceName;
  let userId;

  const metadataPayload = {
    userDetails: [
      { key: "department", value: "quality" },
      { key: "location", value: "remote" },
    ],
  };

  beforeEach(() => {
    data.firstName = fake.firstName;
    data.lastName = fake.lastName;
    data.email = fake.email.toLowerCase();

    // Workspace-scoped login: the JWT must include the spec workspace or
    // internal APIs reject with 401. Also sets env workspaceId.
    cy.then(() =>
      workspaceId
        ? cy.apiLogin("dev@tooljet.io", "password", workspaceId)
        : cy.apiLogin()
    );
    cy.then(() => {
      if (!workspaceId) return;

      return createUser({
        name: `${data.firstName} ${data.lastName}`,
        email: data.email,
        password: "password",
        status: "active",
        workspaces: [{ name: workspaceName, status: "active", groups: [] }],
      }).then((response) => {
        expect(response.status).to.eq(201);
        userId = response.body.id;
      });
    });
  });

  afterEach(() => {
    cy.then(() => {
      if (!workspaceId || !userId) return;
      replaceUserWorkspacesRelations(userId, []);
      userId = undefined;
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

  it("verify get user metadata API returns empty for fresh user", () => {
    getUserMetadata(workspaceId, userId).then(({ status, body }) => {
      expect(status).to.eq(200);
      expect(body.id).to.eq(userId);
      expect(body.email).to.eq(data.email);
      expect(body.userDetails).to.be.an("array").and.have.length(0);
    });
  });

  it("verify update user metadata API with re-fetch validation", () => {
    updateUserMetadata(workspaceId, userId, metadataPayload).then(
      ({ status, body }) => {
        expect(status).to.eq(200);
        expect(body.id).to.eq(userId);
        expect(body.userDetails).to.deep.include.members(
          metadataPayload.userDetails
        );
      }
    );

    getUserMetadata(workspaceId, userId).then(({ status, body }) => {
      expect(status).to.eq(200);
      expect(body.userDetails).to.deep.include.members(
        metadataPayload.userDetails
      );
    });
  });

  it("verify metadata APIs fail with non-existent workspace", () => {
    getUserMetadata(nonExistentId, userId).then(({ status, body }) => {
      expect(status).to.eq(404);
      expect(body.message).to.include("Workspace not found");
    });

    updateUserMetadata(nonExistentId, userId, metadataPayload).then(
      ({ status, body }) => {
        expect(status).to.eq(404);
        expect(body.message).to.include("Workspace not found");
      }
    );
  });

  it("verify metadata APIs fail with non-existent user", () => {
    getUserMetadata(workspaceId, nonExistentId).then(({ status, body }) => {
      expect(status).to.eq(404);
      expect(body.message).to.include("User not found");
    });

    updateUserMetadata(workspaceId, nonExistentId, metadataPayload).then(
      ({ status, body }) => {
        expect(status).to.eq(404);
        expect(body.message).to.include("User not found");
      }
    );
  });

  it("verify metadata APIs reject invalid auth token", () => {
    getUserMetadata(workspaceId, userId, invalidAuthHeader).then(
      ({ status }) => {
        expect(status).to.eq(403);
      }
    );

    updateUserMetadata(
      workspaceId,
      userId,
      metadataPayload,
      invalidAuthHeader
    ).then(({ status }) => {
      expect(status).to.eq(403);
    });
  });
});
