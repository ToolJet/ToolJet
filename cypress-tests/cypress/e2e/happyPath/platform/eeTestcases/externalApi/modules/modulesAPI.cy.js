import {
  listWorkspaceModules,
  exportModule,
  importModule,
  importApp,
  fetchWorkspaceApps,
} from "Support/utils/externalApi";
import { fake } from "Fixtures/fake";
import { sanitize } from "Support/utils/common";

describe("ToolJet: Modules API Validation", () => {
  const data = {};
  const fixtureFile = "templates/import_module.json";
  let requestData;

  beforeEach(() => {
    data.workspaceName = sanitize(fake.lastName);
    data.workspaceSlug = sanitize(fake.lastName);
    cy.apiLogin();
    cy.apiCreateWorkspace(data.workspaceName, data.workspaceSlug).then(
      (response) => {
        Cypress.env("workspaceId", response.body.organization_id);
      }
    );
    return cy.fixture(fixtureFile).then((d) => {
      requestData = d;
    });
  });

  afterEach(() => {
    cy.apiDeleteAllApps();
  });

  it("should validate List Modules API flows", () => {
    const workspaceId = Cypress.env("workspaceId");

    // Fresh workspace returns empty list
    listWorkspaceModules(workspaceId).then((response) => {
      expect(response.status).to.eq(200);
      expect(response.body).to.have.property("modules");
      expect(response.body.modules).to.be.an("array").and.have.length(0);
    });

    // Import a module so the list is non-empty
    importModule(workspaceId, requestData).then((response) => {
      expect(response.status).to.eq(201);
    });

    // List returns all required fields
    listWorkspaceModules(workspaceId).then((response) => {
      expect(response.status).to.eq(200);
      const modules = response.body.modules;
      expect(modules, "modules list from API").to.be.an("array").and.not.be
        .empty;

      const mod = modules[0];
      expect(mod).to.have.property("id");
      expect(mod).to.have.property("name");
      expect(mod).to.have.property("icon");
      expect(mod).to.have.property("slug");
      expect(mod).to.have.property("isPublic");
      expect(mod).to.have.property("createdAt");
      expect(mod).to.have.property("updatedAt");
      expect(mod.isPublic).to.be.a("boolean");

      // Endpoint must only return modules, not regular apps
      modules.forEach((m) => {
        if (Object.prototype.hasOwnProperty.call(m, "type")) {
          expect(m.type).to.eq("module");
        }
      });
    });

    // Invalid workspace ID (non-UUID) → 400
    listWorkspaceModules(`${workspaceId}invalid`).then((response) => {
      expect(response.status).to.be.oneOf([400, 404]);
    });

    // Non-existent valid UUID workspace → error
    listWorkspaceModules("00000000-0000-0000-0000-000000000099").then(
      (response) => {
        expect(response.status).to.be.oneOf([400, 404]);
      }
    );

    // Invalid auth token → 403
    listWorkspaceModules(workspaceId, {
      Authorization: "Basic xyz",
    }).then((response) => {
      expect(response.status).to.eq(403);
    });

    // Empty auth token → 403
    listWorkspaceModules(workspaceId, {
      Authorization: "",
    }).then((response) => {
      expect(response.status).to.eq(403);
    });
  });

  it("should validate Export Module API flows", () => {
    const workspaceId = Cypress.env("workspaceId");
    let moduleId;

    // Arrange: import a named module so we have a moduleId to export
    importModule(workspaceId, {
      ...requestData,
      appName: `export-test-${Date.now()}`,
    }).then((response) => {
      expect(response.status).to.eq(201);
    });

    listWorkspaceModules(workspaceId).then((response) => {
      expect(response.status).to.eq(200);
      const modules = response.body.modules;
      expect(modules, "modules list from API").to.be.an("array").and.not.be
        .empty;

      moduleId = modules[0].id;
      expect(moduleId, "module id from API response").to.exist;

      // Valid export returns app array + tooljet_version + TJDB by default
      exportModule(workspaceId, moduleId).then((response) => {
        expect(response.status).to.eq(201);
        expect(response.body.app, "app array in response")
          .to.be.an("array")
          .and.not.be.empty;
        expect(response.body.tooljet_version).to.be.a("string");
        expect(
          response.body,
          "TJDB should be included by default"
        ).to.have.property("tooljet_database");
      });

      // exportTJDB=false → no tooljet_database key
      exportModule(workspaceId, moduleId, "?exportTJDB=false").then(
        (response) => {
          expect(response.status).to.eq(201);
          expect(
            response.body,
            "should not include tooljet_database"
          ).not.to.have.property("tooljet_database");
        }
      );

      // exportTJDB=true → tooljet_database key present in response
      exportModule(workspaceId, moduleId, "?exportTJDB=true").then(
        (response) => {
          expect(response.status).to.eq(201);
          expect(
            response.body,
            "should include tooljet_database"
          ).to.have.property("tooljet_database");
        }
      );

      // Invalid moduleId (non-UUID) → 400
      exportModule(workspaceId, `${moduleId}invalid`).then((response) => {
        expect(
          response.status,
          "invalid module ID should return 400 or 404"
        ).to.be.oneOf([400, 404]);
      });

      // Invalid workspaceId (non-UUID) → 400
      exportModule(`${workspaceId}invalid`, moduleId).then((response) => {
        expect(
          response.status,
          "invalid workspace ID should return 400 or 404"
        ).to.be.oneOf([400, 404]);
      });

      // Non-existent moduleId (valid UUID) → 400
      exportModule(workspaceId, "00000000-0000-0000-0000-000000000099").then(
        (response) => {
          expect(response.status).to.eq(400);
        }
      );

      // moduleId from a different workspace → 400
      data.workspaceName = sanitize(fake.lastName);
      data.workspaceSlug = sanitize(fake.lastName);
      cy.apiCreateWorkspace(data.workspaceName, data.workspaceSlug).then(
        (res) => {
          const otherWorkspaceId = res.body.organization_id;
          exportModule(otherWorkspaceId, moduleId).then((response) => {
            expect(response.status).to.eq(400);
          });
        }
      );

      // Invalid auth token → 403
      exportModule(workspaceId, moduleId, "", {
        Authorization: "Basic xyz",
      }).then((response) => {
        expect(response.status).to.eq(403);
      });

      // Empty auth token → 403
      exportModule(workspaceId, moduleId, "", {
        Authorization: "",
      }).then((response) => {
        expect(response.status).to.eq(403);
      });
    });

    // Regular app ID (not a module) passed to export → 400
    cy.fixture("templates/import_unnamed_file.json").then((appData) => {
      importApp(workspaceId, appData).then((response) => {
        expect(response.status).to.eq(201);
      });

      fetchWorkspaceApps(workspaceId).then((response) => {
        const apps = Array.isArray(response.body)
          ? response.body
          : response.body.apps;
        expect(apps, "apps list from API").to.be.an("array").and.not.be.empty;
        const regularApp = apps[apps.length - 1];
        expect(regularApp.id, "regular app id").to.exist;

        exportModule(workspaceId, regularApp.id).then((exportResponse) => {
          expect(
            exportResponse.status,
            "exporting a regular app via modules endpoint should fail"
          ).to.eq(400);
        });
      });
    });
  });

  it("should validate Import Module API flows", () => {
    const workspaceId = Cypress.env("workspaceId");

    // Valid import returns success message
    importModule(workspaceId, requestData).then((response) => {
      expect(response.status).to.eq(201);
      expect(response.body.message).to.include("Module imported successfully.");
    });

    // Import with appName override → module created with that name
    const overrideName = `override-${Date.now()}`;
    importModule(workspaceId, { ...requestData, appName: overrideName }).then(
      (response) => {
        expect(response.status).to.eq(201);
        expect(response.body.message).to.include(
          "Module imported successfully."
        );
      }
    );

    listWorkspaceModules(workspaceId).then((response) => {
      const found = response.body.modules.find((m) => m.name === overrideName);
      expect(found, `module "${overrideName}" should exist`).to.exist;
    });

    // Import without appName → original name from the definition is used
    const payloadNoName = { ...requestData };
    delete payloadNoName.appName;
    importModule(workspaceId, payloadNoName).then((response) => {
      expect(response.status).to.eq(201);
      expect(response.body.message).to.include("Module imported successfully.");
    });

    // tooljet_version higher than current → 400
    importModule(workspaceId, {
      ...requestData,
      tooljet_version: "999.0.0",
    }).then((response) => {
      expect(response.status).to.eq(400);
      expect(response.body.message).to.include(
        "Apps built on later versions of ToolJet cannot be imported"
      );
    });

    // tooljet_version equal to or lower than current → 201
    // Exclude tooljet_database to avoid TJDB schema re-transformation issues
    // when importing with an older version (1.0.0 triggers old-format transforms
    // that corrupt current-format TJDB schema, resulting in "Primary key is mandatory")
    const { tooljet_database: _omit, ...requestDataWithoutDb } = requestData;
    importModule(workspaceId, {
      ...requestDataWithoutDb,
      tooljet_version: "1.0.0",
      appName: `compat-${Date.now()}`,
    }).then((response) => {
      expect(response.status).to.eq(201);
    });

    // Missing tooljet_version field → 400
    const noVersion = { ...requestData };
    delete noVersion.tooljet_version;
    importModule(workspaceId, noVersion).then((response) => {
      expect(response.status).to.eq(400);
    });

    // Duplicate module name → 409
    const dupName = `dup-${Date.now()}`;
    importModule(workspaceId, { ...requestData, appName: dupName }).then(
      (response) => {
        expect(response.status).to.eq(201);
      }
    );
    importModule(workspaceId, { ...requestData, appName: dupName }).then(
      (response) => {
        expect(response.status).to.eq(409);
      }
    );

    // Invalid workspaceId (non-UUID) → 400
    importModule(`${workspaceId}invalid`, requestData).then((response) => {
      expect(response.status).to.be.oneOf([400, 404]);
    });

    // Non-existent valid UUID workspace → error
    importModule("00000000-0000-0000-0000-000000000099", requestData).then(
      (response) => {
        expect(response.status).to.be.oneOf([400, 404]);
      }
    );

    // Invalid auth token → 403
    importModule(workspaceId, requestData, {
      Authorization: "Basic xyz",
    }).then((response) => {
      expect(response.status).to.eq(403);
    });

    // Empty auth token → 403
    importModule(workspaceId, requestData, {
      Authorization: "",
    }).then((response) => {
      expect(response.status).to.eq(403);
    });

    // Round-trip: import → list → export → re-import → verify
    const roundTripName = `round-trip-${Date.now()}`;
    importModule(workspaceId, { ...requestData, appName: roundTripName }).then(
      (response) => {
        expect(response.status).to.eq(201);
      }
    );

    listWorkspaceModules(workspaceId).then((response) => {
      const source = response.body.modules.find(
        (m) => m.name === roundTripName
      );
      expect(source, `source module "${roundTripName}" should exist`).to.exist;

      exportModule(workspaceId, source.id).then((exportResponse) => {
        expect(exportResponse.status).to.eq(201);

        importModule(workspaceId, {
          tooljet_version: exportResponse.body.tooljet_version,
          app: exportResponse.body.app,
          appName: `round-trip-copy-${Date.now()}`,
        }).then((reimportResponse) => {
          expect(reimportResponse.status).to.eq(201);
          expect(reimportResponse.body.message).to.include(
            "Module imported successfully."
          );
        });

        listWorkspaceModules(workspaceId).then((listResponse) => {
          expect(listResponse.status).to.eq(200);
          expect(listResponse.body.modules).to.be.an("array").and.not.be.empty;
        });
      });
    });
  });
});
