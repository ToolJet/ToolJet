import { fake } from "Fixtures/fake";
import { sanitize } from "Support/utils/common";
import {
  emptyAuthHeader,
  exportApp,
  fetchWorkspaceApps,
  importApp,
  invalidAuthHeader,
} from "Support/utils/externalApi";

describe("ToolJet: Apps Import Export API", () => {
  const data = {};
  let workspaceId;
  let workspaceName;

  const fixtureFiles = {
    unnamedApp: "templates/import_unnamed_file.json",
    namedApp: "templates/import_named_file.json",
    threeVersionsApp: "templates/three-versions.json",
  };

  let unnamedApp;
  let namedApp;
  let threeVersionsApp;

  const getApps = (response) =>
    Array.isArray(response.body) ? response.body : response.body.apps;

  const importAndGetAppId = (appPayload) => {
    importApp(workspaceId, appPayload).then((response) => {
      expect(response.status).to.eq(201);
    });

    return fetchWorkspaceApps(workspaceId).then((response) => {
      expect(response.status).to.eq(200);
      const apps = getApps(response);
      expect(apps, "apps list from API").to.be.an("array").and.not.be.empty;
      expect(apps[0].id, "app id from API response").to.exist;
      return apps[0].id;
    });
  };

  beforeEach(() => {
    // Workspace-scoped login: the JWT must include the spec workspace or
    // internal APIs (apps cleanup) reject with 401. Also sets env workspaceId.
    cy.then(() =>
      workspaceId
        ? cy.apiLogin("dev@tooljet.io", "password", workspaceId)
        : cy.apiLogin()
    );

    cy.fixture(fixtureFiles.unnamedApp).then((fixture) => {
      unnamedApp = fixture;
    });
    cy.fixture(fixtureFiles.namedApp).then((fixture) => {
      namedApp = fixture;
    });
    return cy.fixture(fixtureFiles.threeVersionsApp).then((fixture) => {
      threeVersionsApp = fixture;
    });
  });

  afterEach(() => {
    cy.then(() => {
      if (workspaceId) cy.apiDeleteAllApps();
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

  it("verify import app API", () => {
    importApp(workspaceId, namedApp).then((response) => {
      expect(response.status).to.eq(201);
      expect(response.body.message).to.include(
        "App imported successfully into workspace"
      );
    });

    fetchWorkspaceApps(workspaceId).then((response) => {
      expect(response.status).to.eq(200);
      const apps = getApps(response);
      const importedApp = apps.find((app) => app.name === "app_json");
      expect(importedApp, "imported app visible in workspace apps").to.exist;
    });
  });

  it("verify import app API fails for duplicate app", () => {
    importApp(workspaceId, namedApp).then((response) => {
      expect(response.status).to.eq(201);
    });

    importApp(workspaceId, namedApp).then((response) => {
      expect(response.status).to.eq(400);
      expect(response.body.message).to.include(
        "This app name is already taken."
      );
    });
  });

  it("verify import app API fails with invalid payload", () => {
    importApp(workspaceId, {}).then(({ status, body }) => {
      expect(status).to.eq(400);
      expect(body.message.join(" ")).to.include(
        "tooljet_version must be a string"
      );
    });
  });

  it("verify import app API fails with invalid workspace ID", () => {
    importApp(`${workspaceId}invalid`, unnamedApp).then((response) => {
      expect(response.status).to.eq(400);
    });
  });

  it("verify import app API rejects invalid and empty auth tokens", () => {
    importApp(workspaceId, unnamedApp, invalidAuthHeader).then((response) => {
      expect(response.status).to.eq(403);
    });

    importApp(workspaceId, unnamedApp, emptyAuthHeader).then((response) => {
      expect(response.status).to.eq(403);
    });
  });

  it("verify export app API exports latest version by default", () => {
    importAndGetAppId(threeVersionsApp).then((appId) => {
      exportApp(workspaceId, appId).then((response) => {
        expect(response.status).to.eq(201);
        expect(response.body.app, "app array in response").to.be.an("array")
          .and.not.be.empty;
        const appVersions = response.body.app[0].definition.appV2.appVersions;
        expect(
          appVersions.length,
          "should export only the latest version"
        ).to.eq(1);
        // expect(appVersions[0].name, "latest version should be v3").to.eq("v3");
      });
    });
  });

  it("verify export app API with specific appVersion", () => {
    importAndGetAppId(threeVersionsApp).then((appId) => {
      exportApp(workspaceId, appId, "?appVersion=v2").then((response) => {
        expect(response.status).to.eq(201);
        const appVersions = response.body.app[0].definition.appV2.appVersions;
        expect(appVersions.length, "should export only v2").to.eq(1);
        expect(appVersions[0].name, "exported version should be v2").to.eq(
          "v2"
        );
      });
    });
  });

  it("verify export app API with exportAllVersions", () => {
    importAndGetAppId(threeVersionsApp).then((appId) => {
      exportApp(workspaceId, appId, "?exportAllVersions=true").then(
        (response) => {
          expect(response.status).to.eq(201);
          const appVersions =
            response.body.app[0].definition.appV2.appVersions;
          expect(appVersions.length, "should export all 3 versions").to.eq(3);
          const versionNames = appVersions.map((version) => version.name);
          expect(versionNames, "should contain v1, v2, v3").to.have.members([
            "v1",
            "v2",
            "v3",
          ]);
        }
      );
    });
  });

  it("verify export app API with exportTJDB=false excludes tooljet_database", () => {
    importAndGetAppId(threeVersionsApp).then((appId) => {
      exportApp(workspaceId, appId, "?exportTJDB=false").then((response) => {
        expect(response.status).to.eq(201);
        expect(
          response.body,
          "should not include tooljet_database"
        ).not.to.have.property("tooljet_database");
      });
    });
  });

  it("verify export app API with exportTJDB=true includes tooljet_database", () => {
    importAndGetAppId(threeVersionsApp).then((appId) => {
      exportApp(workspaceId, appId, "?exportTJDB=true").then((response) => {
        expect(response.status).to.eq(201);
        expect(
          response.body,
          "should include tooljet_database"
        ).to.have.property("tooljet_database");
      });
    });
  });

  it("verify export app API fails with invalid workspace ID", () => {
    importAndGetAppId(unnamedApp).then((appId) => {
      exportApp(`${workspaceId}invalid`, appId).then((response) => {
        expect(response.status).to.eq(400);
      });
    });
  });

  it("verify export app API rejects invalid auth token", () => {
    importAndGetAppId(unnamedApp).then((appId) => {
      exportApp(workspaceId, appId, "", invalidAuthHeader).then((response) => {
        expect(response.status).to.eq(403);
      });
    });
  });

  it("verify get all workspace apps API", () => {
    importApp(workspaceId, unnamedApp).then((response) => {
      expect(response.status).to.eq(201);
    });

    importApp(workspaceId, namedApp).then((response) => {
      expect(response.status).to.eq(201);
    });

    fetchWorkspaceApps(workspaceId).then((response) => {
      expect(response.status).to.eq(200);
      const apps = getApps(response);
      expect(apps, "apps list from API").to.be.an("array").and.have.length(2);
      apps.forEach((app) => {
        expect(app).to.have.property("id");
        expect(app).to.have.property("name");
        expect(app).to.have.property("versions");
      });
    });
  });
});
