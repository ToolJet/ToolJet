import {
  importApp,
  exportApp,
  allAppsDetails,
  fetchWorkspaceApps,
} from "Support/utils/externalApi";
import { fake } from "Fixtures/fake";
import { sanitize } from "Support/utils/common";

describe("ToolJet: Apps API Validation", () => {
  const data = {};

  const fixtureFiles = {
    requestData: "templates/import_unnamed_file.json",
    requestData2: "templates/import_named_file.json",
    requestData3: "templates/three-versions.json",
  };

  let requestData;
  let requestData2;
  let requestData3;
  let appId;

  const loadFixtures = () => {
    cy.fixture(fixtureFiles.requestData).then((data) => {
      requestData = data;
    });
    cy.fixture(fixtureFiles.requestData2).then((data) => {
      requestData2 = data;
    });
    return cy.fixture(fixtureFiles.requestData3).then((data) => {
      requestData3 = data;
    });
  };

  beforeEach(() => {
    (data.workspaceName = sanitize(fake.lastName)),
      (data.workspaceSlug = sanitize(fake.lastName)),
      cy.apiLogin();
    cy.apiCreateWorkspace(data.workspaceName, data.workspaceSlug).then(
      (response) => {
        Cypress.env("workspaceId", response.body.organization_id);
      }
    );
    return loadFixtures();
  });

  afterEach(() => {
    // Cleanup: Delete all apps created during tests
    cy.apiDeleteAllApps();
  });

  it("should validate Import App API flows", () => {
    const workspaceId = Cypress.env("workspaceId");

    importApp(workspaceId, requestData).then((response) => {
      expect(response.status).to.eq(201);
      expect(response.body.message).to.include(
        "App imported successfully into workspace"
      );
    });

    fetchWorkspaceApps(workspaceId).then((response) => {
      expect(response.status).to.eq(200);
      const apps = Array.isArray(response.body)
        ? response.body
        : response.body.apps;
      expect(apps, "apps list from API").to.be.an("array").and.not.be.empty;
      appId = apps[0].id;
      expect(appId, "app id from API response").to.exist;
    });

    importApp(workspaceId, requestData, {
      Authorization: "Basic xyz",
      "Content-Type": "application/json",
    }).then((response) => {
      expect(response.status).to.eq(403);
    });

    importApp(workspaceId, requestData, {
      Authorization: "",
      "Content-Type": "application/json",
    }).then((response) => {
      expect(response.status).to.eq(403);
    });

    importApp(`${workspaceId}ee`, requestData).then((response) => {
      expect(response.status).to.eq(400);
    });

    let newWorkspaceId;
    data.workspaceName = sanitize(fake.lastName);
    data.workspaceSlug = sanitize(fake.lastName);
    cy.apiCreateWorkspace(data.workspaceName, data.workspaceSlug).then(
      (res) => {
        newWorkspaceId = res.body.organization_id;
        importApp(newWorkspaceId, requestData).then((response) => {
          expect(response.status).to.eq(201);
          expect(response.body.message).to.include(
            "App imported successfully into workspace"
          );
        });
      }
    );
  });

  it("should validate Export App API flows", () => {
    const workspaceId = Cypress.env("workspaceId");
    let appId;

    // Arrange: Import app with multiple versions
    importApp(workspaceId, requestData3).then((response) => {
      expect(response.status).to.eq(201);
      expect(response.body.message).to.include(
        "App imported successfully into workspace"
      );
    });

    // Get appId via API instead of UI
    fetchWorkspaceApps(workspaceId).then((response) => {
      expect(response.status).to.eq(200);
      const apps = Array.isArray(response.body)
        ? response.body
        : response.body.apps;
      expect(apps, "apps list from API").to.be.an("array").and.not.be.empty;

      // Find the imported app (most recently created)
      const importedApp = apps[0];
      appId = importedApp.id;
      expect(appId, "app id from API response").to.exist;

      // Act & Assert: Export last created version (v3)
      exportApp(workspaceId, appId, "").then((response) => {
        expect(response.status).to.eq(201);
        expect(response.body.app, "app array in response").to.be.an("array").and
          .not.be.empty;
        expect(
          response.body.app[0].definition.appV2.appVersions.length,
          "should export only the latest version"
        ).to.eq(1);
        // expect(
        //   response.body.app[0].definition.appV2.appVersions[0].name,
        //   "latest version should be v3"
        // ).to.eq("v3");
      });

      // Act & Assert: Export specific version (v2)
      exportApp(workspaceId, appId, "?appVersion=v2").then((response) => {
        expect(response.status).to.eq(201);
        expect(
          response.body.app[0].definition.appV2.appVersions.length,
          "should export only v2"
        ).to.eq(1);
        expect(
          response.body.app[0].definition.appV2.appVersions[0].name,
          "exported version should be v2"
        ).to.eq("v2");
      });

      // Act & Assert: Export all versions
      exportApp(workspaceId, appId, "?exportAllVersions=true").then(
        (response) => {
          expect(response.status).to.eq(201);
          expect(
            response.body.app[0].definition.appV2.appVersions.length,
            "should export all 3 versions"
          ).to.eq(3);

          // Verify all version names are present
          const versionNames =
            response.body.app[0].definition.appV2.appVersions.map(
              (v) => v.name
            );
          expect(versionNames, "should contain v1, v2, v3").to.have.members([
            "v1",
            "v2",
            "v3",
          ]);
        }
      );

      // Act & Assert: Export without ToolJet Database
      exportApp(workspaceId, appId, "?exportTJDB=false").then((response) => {
        expect(response.status).to.eq(201);
        expect(
          response.body,
          "should not include tooljet_database"
        ).not.to.have.property("tooljet_database");
      });

      // Act & Assert: Export with ToolJet Database
      exportApp(workspaceId, appId, "?exportTJDB=true").then((response) => {
        expect(response.status).to.eq(201);
        expect(
          response.body,
          "should include tooljet_database"
        ).to.have.property("tooljet_database");
      });

      // Act & Assert: Test invalid authentication
      // exportApp(workspaceId, appId, "", {
      //     Authorization: "Basic xyz",
      //     "Content-Type": "application/json",
      // }).then((response) => {
      //     expect(response.status, "invalid token should return 403").to.eq(403);
      // });

      //   exportApp(workspaceId, appId, "", {
      //     Authorization: "",
      //     "Content-Type": "application/json",
      //   }).then((response) => {
      //     expect(response.status, "empty token should return 403").to.eq(403);
      //   });

      // Act & Assert: Test invalid workspace ID
      exportApp(`${workspaceId}invalid`, appId, "").then((response) => {
        expect(
          response.status,
          "invalid workspace ID should return 400 or 404"
        ).to.be.oneOf([400, 404]);
      });
    });

    // Act & Assert: Get all apps details
    allAppsDetails(workspaceId).then((response) => {
      expect(response.status).to.eq(200);
      expect(response.body, "should return apps list").to.exist;
    });
  });
});
