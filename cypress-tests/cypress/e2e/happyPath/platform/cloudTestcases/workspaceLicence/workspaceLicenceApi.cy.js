import { loginToWorkspace } from "Support/utils/platform/ai";
import {
  appNamesOf,
  cloneApp,
  createSeedApp,
  exportApp,
  expectStatus,
  importApp,
  listApps,
  addWorkspaceOnPlan,
  signUpOnPlan,
  wsRequest,
} from "Support/utils/platform/workspaceLicence";

const PLANS = ["basic", "team"];
const uniqueName = (prefix) => `${prefix}-${Date.now()}-${Cypress._.random(1000, 9999)}`;

describe("Cloud workspace licence scoping: app export, clone, import and folders (API)", { retries: 0 }, () => {
  PLANS.forEach((plan) => {
    context(`on a ${plan} workspace`, () => {
      let workspaceId;
      let app;

      beforeEach(() => {
        signUpOnPlan(plan).then(({ workspaceId: id }) => {
          workspaceId = id;
          return createSeedApp(id, uniqueName("wsl-app")).then((created) => {
            app = created;
          });
        });
      });

      it(`WSL-01 exports an app without a licence error (${plan})`, () => {
        exportApp(workspaceId, app.id).then((res) => {
          expectStatus(res, "export app", [201]);
          expect(res.body.app, "exported apps").to.have.length(1);
          expect(res.body.tooljet_version, "export carries the server version").to.be.a("string");
        });
      });

      it(`WSL-02 clones an app and lists the copy (${plan})`, () => {
        const cloneName = uniqueName("wsl-clone");
        cloneApp(workspaceId, app.id, cloneName).then((res) => {
          expectStatus(res, "clone app", [201]);
          expect(res.body.success).to.equal(true);
        });
        listApps(workspaceId).then((body) => {
          expect(appNamesOf(body)).to.include(cloneName);
        });
      });

      it(`WSL-09 creates a folder, adds the app to it and lists folders (${plan})`, () => {
        const folderName = uniqueName("wsl-folder");
        wsRequest(workspaceId, "POST", "/folders", { body: { name: folderName, type: "front-end" } }).then((res) => {
          expectStatus(res, "create folder", [201]);
          const folderId = res.body.id;
          wsRequest(workspaceId, "POST", "/folder-apps", { body: { app_id: app.id, folder_id: folderId } }).then(
            (added) => expectStatus(added, "add app to folder", [201])
          );
          wsRequest(workspaceId, "GET", "/folder-apps", { qs: { searchKey: "", type: "front-end" } }).then((listed) => {
            expectStatus(listed, "list folders", [200]);
            const folders = listed.body.folders || [];
            expect(folders.map((f) => f.name)).to.include(folderName);
          });
        });
      });

      it(`WSL-13 reads the app list in this workspace only (${plan})`, () => {
        listApps(workspaceId).then((body) => {
          expect(appNamesOf(body)).to.include(app.name);
        });
      });
    });
  });

  it("WSL-03 imports an app exported from a team workspace into a basic workspace", () => {
    let teamId;
    let teamApp;
    let exported;

    signUpOnPlan("team").then(({ workspaceId: id }) => {
      teamId = id;
      return createSeedApp(id, uniqueName("wsl-source")).then((created) => {
        teamApp = created;
      });
    });
    cy.then(() => exportApp(teamId, teamApp.id)).then((res) => {
      expectStatus(res, "export from team", [201]);
      exported = res.body;
    });

    signUpOnPlan("basic").then(({ workspaceId: basicId }) => {
      const importedName = uniqueName("wsl-imported");
      importApp(basicId, exported, importedName).then((res) => {
        expectStatus(res, "import into basic", [201]);
        expect(res.body.success).to.equal(true);
      });
      listApps(basicId).then((body) => {
        expect(appNamesOf(body)).to.include(importedName);
      });
    });
  });

  it("WSL-12 reports each workspace's own plan when one session reads two workspaces", () => {
    let adminEmail;
    let teamId;
    let basicId;

    signUpOnPlan("team").then(({ email, workspaceId }) => {
      adminEmail = email;
      teamId = workspaceId;
      addWorkspaceOnPlan(email, workspaceId, "basic").then((id) => {
        basicId = id;
      });
    });

    cy.then(() => {
      loginToWorkspace(adminEmail, teamId);
      cy.apiGetLicenseAccess(teamId).then((access) => {
        expect(access.licenseStatus?.isLicenseValid, "team workspace licence").to.equal(true);
        expect(access.auditLogs, "team has audit logs").to.equal(true);
      });
      loginToWorkspace(adminEmail, basicId);
      cy.apiGetLicenseAccess(basicId).then((access) => {
        expect(access.auditLogs, "basic has no audit logs").to.not.equal(true);
      });
    });
  });

  it("WSL-14 answers the instance-level health check", () => {
    cy.request({ url: `${Cypress.env("server_host")}/api/health`, failOnStatusCode: false }).then((res) => {
      expectStatus(res, "health", [200]);
    });
  });
});
