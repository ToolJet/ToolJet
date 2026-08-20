import { fake } from "Fixtures/fake";
import { sanitize } from "Support/utils/common";
import {
  emptyAuthHeader,
  exportModule,
  fetchWorkspaceApps,
  importApp,
  importModule,
  invalidAuthHeader,
  listWorkspaceModules,
} from "Support/utils/externalApi";

describe("ToolJet: Modules API", () => {
  const data = {};
  const nonExistentId = "00000000-0000-0000-0000-000000000099";
  const fixtureFile = "templates/import_module.json";
  let workspaceId;
  let workspaceId2;
  let workspaceName;
  let workspaceName2;
  let requestData;

  const importAndGetModuleId = (moduleName) => {
    importModule(workspaceId, { ...requestData, appName: moduleName }).then(
      (response) => {
        expect(response.status).to.eq(201);
      },
    );

    return listWorkspaceModules(workspaceId).then((response) => {
      expect(response.status).to.eq(200);
      const importedModule = response.body.modules.find(
        (m) => m.name === moduleName,
      );
      expect(importedModule, `module "${moduleName}" in listing`).to.exist;
      return importedModule.id;
    });
  };

  beforeEach(() => {
    // Workspace-scoped login: the JWT must include the spec workspace or
    // internal APIs (modules/apps cleanup) reject with 401. Also sets env workspaceId.
    cy.then(() =>
      workspaceId
        ? cy.apiLogin("dev@tooljet.io", "password", workspaceId)
        : cy.apiLogin()
    );
    return cy.fixture(fixtureFile).then((fixture) => {
      requestData = fixture;
    });
  });

  afterEach(() => {
    cy.then(() => {
      if (!workspaceId) return;
      cy.apiDeleteAllModules();
      cy.apiDeleteAllApps();
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

  it("verify list modules API", () => {
    listWorkspaceModules(workspaceId).then((response) => {
      expect(response.status).to.eq(200);
      expect(response.body).to.have.property("modules");
      expect(response.body.modules).to.be.an("array").and.have.length(0);
    });

    importModule(workspaceId, requestData).then((response) => {
      expect(response.status).to.eq(201);
    });

    listWorkspaceModules(workspaceId).then((response) => {
      expect(response.status).to.eq(200);
      const modules = response.body.modules;
      expect(modules, "modules list from API").to.be.an("array").and.not.be
        .empty;

      const importedModule = modules[0];
      expect(importedModule).to.have.property("id");
      expect(importedModule).to.have.property("name");
      expect(importedModule).to.have.property("icon");
      expect(importedModule).to.have.property("slug");
      expect(importedModule).to.have.property("isPublic");
      expect(importedModule).to.have.property("createdAt");
      expect(importedModule).to.have.property("updatedAt");
      expect(importedModule.isPublic).to.be.a("boolean");

      modules.forEach((m) => {
        if (Object.prototype.hasOwnProperty.call(m, "type")) {
          expect(m.type).to.eq("module");
        }
      });
    });
  });

  it("verify list modules API fails with invalid and non-existent workspace", () => {
    listWorkspaceModules(`${workspaceId}invalid`).then((response) => {
      expect(response.status).to.eq(400);
      expect(response.body.message).to.include("Workspace Id must be UUID");
    });

    listWorkspaceModules(nonExistentId).then((response) => {
      expect(response.status).to.eq(400);
      expect(response.body.message).to.include("Invalid workspaceId");
    });
  });

  it("verify list modules API rejects invalid and empty auth tokens", () => {
    listWorkspaceModules(workspaceId, invalidAuthHeader).then((response) => {
      expect(response.status).to.eq(403);
    });

    listWorkspaceModules(workspaceId, emptyAuthHeader).then((response) => {
      expect(response.status).to.eq(403);
    });
  });

  it("verify export module API", () => {
    importAndGetModuleId(`export-test-${Date.now()}`).then((moduleId) => {
      exportModule(workspaceId, moduleId).then((response) => {
        expect(response.status).to.eq(201);
        expect(response.body.app, "app array in response").to.be.an("array").and
          .not.be.empty;
        expect(response.body.tooljet_version).to.be.a("string");
        expect(
          response.body,
          "TJDB should be included by default",
        ).to.have.property("tooljet_database");
      });
    });
  });

  it("verify export module API with exportTJDB=false and exportTJDB=true", () => {
    importAndGetModuleId(`export-tjdb-${Date.now()}`).then((moduleId) => {
      exportModule(workspaceId, moduleId, "?exportTJDB=false").then(
        (response) => {
          expect(response.status).to.eq(201);
          expect(
            response.body,
            "should not include tooljet_database",
          ).not.to.have.property("tooljet_database");
        },
      );

      exportModule(workspaceId, moduleId, "?exportTJDB=true").then(
        (response) => {
          expect(response.status).to.eq(201);
          expect(
            response.body,
            "should include tooljet_database",
          ).to.have.property("tooljet_database");
        },
      );
    });
  });

  it("verify export module API fails with invalid and non-existent module ID", () => {
    exportModule(workspaceId, "not-a-uuid").then((response) => {
      expect(response.status).to.eq(400);
      expect(response.body.message).to.include("Module Id must be UUID");
    });

    exportModule(workspaceId, nonExistentId).then((response) => {
      expect(response.status).to.eq(400);
    });
  });

  it("verify export module API fails for module from another workspace", () => {
    importAndGetModuleId(`cross-workspace-${Date.now()}`).then((moduleId) => {
      exportModule(workspaceId2, moduleId).then((exportResponse) => {
        expect(exportResponse.status).to.eq(400);
      });
    });
  });

  it("verify export module API fails for regular app ID", () => {
    cy.fixture("templates/import_unnamed_file.json").then((appData) => {
      importApp(workspaceId, appData).then((response) => {
        expect(response.status).to.eq(201);
      });

      fetchWorkspaceApps(workspaceId).then((response) => {
        expect(response.status).to.eq(200);
        const apps = Array.isArray(response.body)
          ? response.body
          : response.body.apps;
        expect(apps, "apps list from API").to.be.an("array").and.not.be.empty;
        const regularApp = apps[0];
        expect(regularApp.id, "regular app id").to.exist;

        exportModule(workspaceId, regularApp.id).then((exportResponse) => {
          expect(
            exportResponse.status,
            "exporting a regular app via modules endpoint should fail",
          ).to.eq(400);
        });
      });
    });
  });

  it("verify export module API rejects invalid and empty auth tokens", () => {
    importAndGetModuleId(`export-auth-${Date.now()}`).then((moduleId) => {
      exportModule(workspaceId, moduleId, "", invalidAuthHeader).then(
        (response) => {
          expect(response.status).to.eq(403);
        },
      );

      exportModule(workspaceId, moduleId, "", emptyAuthHeader).then(
        (response) => {
          expect(response.status).to.eq(403);
        },
      );
    });
  });

  it("verify import module API", () => {
    const moduleName = `import-test-${Date.now()}`;

    importModule(workspaceId, { ...requestData, appName: moduleName }).then(
      (response) => {
        expect(response.status).to.eq(201);
        expect(response.body.message).to.include(
          "Module imported successfully.",
        );
      },
    );

    listWorkspaceModules(workspaceId).then((response) => {
      expect(response.status).to.eq(200);
      const importedModule = response.body.modules.find(
        (m) => m.name === moduleName,
      );
      expect(importedModule, `module "${moduleName}" in listing`).to.exist;
    });
  });

  it("verify import module API without appName generates name from definition", () => {
    // Server names the module `${definitionName}_${timestamp}` when appName
    // is omitted (ee/external-apis/service.ts) — assert the prefix, not equality
    const payloadWithoutName = { ...requestData };
    delete payloadWithoutName.appName;

    importModule(workspaceId, payloadWithoutName).then((response) => {
      expect(response.status).to.eq(201);
      expect(response.body.message).to.include("Module imported successfully.");
    });

    listWorkspaceModules(workspaceId).then((response) => {
      expect(response.status).to.eq(200);
      const importedModule = response.body.modules.find((m) =>
        m.name.startsWith("import_module_"),
      );
      expect(importedModule, "module named from definition base name").to.exist;
    });
  });

  it("verify import module API fails with future tooljet_version", () => {
    importModule(workspaceId, {
      ...requestData,
      tooljet_version: "999.0.0",
    }).then((response) => {
      expect(response.status).to.eq(400);
      expect(response.body.message).to.include(
        "Apps built on later versions of ToolJet cannot be imported",
      );
    });
  });

  it("verify import module API with older tooljet_version 1.0.0", () => {
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
  });

  it("verify import module API fails with missing tooljet_version", () => {
    const payloadWithoutVersion = { ...requestData };
    delete payloadWithoutVersion.tooljet_version;

    importModule(workspaceId, payloadWithoutVersion).then((response) => {
      expect(response.status).to.eq(400);
    });
  });

  it("verify import module API fails for duplicate module name", () => {
    const duplicateName = `dup-${Date.now()}`;

    importModule(workspaceId, { ...requestData, appName: duplicateName }).then(
      (response) => {
        expect(response.status).to.eq(201);
      },
    );

    importModule(workspaceId, { ...requestData, appName: duplicateName }).then(
      (response) => {
        expect(response.status).to.eq(409);
      },
    );
  });

  it("verify import module API fails with invalid and non-existent workspace", () => {
    importModule(`${workspaceId}invalid`, requestData).then((response) => {
      expect(response.status).to.eq(400);
      expect(response.body.message).to.include("Workspace Id must be UUID");
    });

    importModule(nonExistentId, requestData).then((response) => {
      expect(response.status).to.eq(400);
      expect(response.body.message).to.include("Invalid workspaceId");
    });
  });

  it("verify import module API rejects invalid and empty auth tokens", () => {
    importModule(workspaceId, requestData, invalidAuthHeader).then(
      (response) => {
        expect(response.status).to.eq(403);
      },
    );

    importModule(workspaceId, requestData, emptyAuthHeader).then((response) => {
      expect(response.status).to.eq(403);
    });
  });

  it("verify module import-export round trip", () => {
    const roundTripName = `round-trip-${Date.now()}`;
    const roundTripCopyName = `round-trip-copy-${Date.now()}`;

    importAndGetModuleId(roundTripName).then((moduleId) => {
      exportModule(workspaceId, moduleId).then((exportResponse) => {
        expect(exportResponse.status).to.eq(201);

        importModule(workspaceId, {
          tooljet_version: exportResponse.body.tooljet_version,
          app: exportResponse.body.app,
          appName: roundTripCopyName,
        }).then((reimportResponse) => {
          expect(reimportResponse.status).to.eq(201);
          expect(reimportResponse.body.message).to.include(
            "Module imported successfully.",
          );
        });

        listWorkspaceModules(workspaceId).then((listResponse) => {
          expect(listResponse.status).to.eq(200);
          const reimportedModule = listResponse.body.modules.find(
            (m) => m.name === roundTripCopyName,
          );
          expect(reimportedModule, "re-imported module in listing").to.exist;
        });
      });
    });
  });
});
