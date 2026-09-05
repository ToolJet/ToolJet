
describe(
  "Git Sync — Commit Content Validation",
  { retries: 0 },
  () => {
    const testId = Date.now();
    const wsName = `gitsync-commit-${testId}`;
    const wsSlug = wsName;
    const FIXTURE = "gitSync/fixture-app.json";

    const branchName = `test-commit-${testId}`;
    const appName = `app-commit-${testId}`;
    const renamedAppName = `app-commit-renamed-${testId}`;

    const NEW_DEV_URL = "https://jsonplaceholder.typicode.com/posts";
    const NEW_STAGING_URL = "https://jsonplaceholder.typicode.com/todos";

    // New desktop layout for the Table component 
    const NEW_TABLE_LAYOUT = { top: 50, left: 5, width: 40, height: 300 };

    let workspaceId;
    let appId;                   // branch-1 app DB id
    let datasourceCoRelationId;  // DS co_relation_id — same across all branches
    let masterBranchId;          // resolved in block 1, reused in block 2


    before(() => {
      cy.apiLogin();
      cy.apiCreateWorkspace(wsName, wsSlug).then((res) => {
        workspaceId = res.body.organization_id;
        Cypress.env("workspaceId", workspaceId);
        Cypress.env("workspaceSlug", wsSlug);
        cy.log(`[gitSync] Workspace: ${wsName} (${workspaceId})`);
      });
      cy.then(() => cy.apiLogin("dev@tooljet.io", "password", workspaceId));
      cy.gitSyncCheckAndConfigure();
      cy.gitHubResetRepo();
    });

    beforeEach(() => {
      cy.then(() => cy.apiLogin("dev@tooljet.io", "password", workspaceId));
    });

    after(() => {
      cy.apiLogin();
      cy.then(() => cy.apiArchiveWorkspace(workspaceId));
    });

    // =========================================================================
    // Block 1 — Branch 1: import + editor push (app) + dashboard push (DS)
    //           → PR → merge → pull master → verify master
    // =========================================================================

    it("branch 1: import → editor push (app content) + dashboard push (DS) → PR → merge → pull master validates git", () => {

      // ── Setup: branch + app 
      cy.gitSyncCreateBranchViaApi(branchName);
      cy.gitSyncImportAppFromFixture(FIXTURE, appName, branchName).then((id) => {
        appId = id;
        cy.log(`[log] appId: ${appId}`);
      });

      cy.gitSyncGetBranchId(branchName).then((branchId) => {
        cy.log(`[log] branchId: ${branchId}`);

        // ── Get editing version ID 
        cy.apiGetEditingVersionId(appId, branchId).then((versionId) => {
          cy.log(`[log] versionId: ${versionId}`);

          // ── Editor push — writes apps/{appName}/ and sets co_relation_ids
          //    in DB (generateMissingGitIds phase). We MUST push first so that
          //    the datasource co_relation_id is populated before we read it.
          const editorMsg = `feat: initial app commit ${appName}`;
          cy.apiEditorPush(appId, versionId, editorMsg, branchName, appName);
          cy.gitHubWaitForCommitMessage(branchName, appName);

          // ── Capture live app definition AFTER editor push ─────────────
          // co_relation_ids are now guaranteed to be set in the DB.
          cy.apiGetAppDefinition(appId, branchName).then((appV2) => {


            const ds = (appV2.dataSources || []).find((d) => d.kind === "restapi");
            expect(ds, "restapi datasource present").to.exist;
            datasourceCoRelationId = ds.co_relation_id || ds.id;

            const devEnv = (appV2.appEnvironments || []).find(
              (e) => e.name === "development",
            );
            expect(devEnv, "development environment present").to.exist;
            cy.log(`[log] devEnv: ${JSON.stringify(devEnv)}`);

            // Validate full app content in git against live definition:
            // app.json, components (name + type + layout), pages, queries, schema
            cy.gitHubValidateCommit(branchName, appName, appV2);

            // .meta/appMeta.json has an entry for this app
            cy.gitHubAssertAppMeta(branchName, appName);

            // ── Dashboard push — writes data-sources/{id}.json ────────────
            cy.apiUpdateDataSourceUrl(ds.id, devEnv.id, NEW_DEV_URL, branchId);
            const dsMsg = `feat: update development datasource URL`;
            cy.apiGitSyncPush(dsMsg, branchId);
            cy.gitHubWaitForCommitMessage(branchName, "development datasource");

            // Validate dev URL and env structure in data-sources file
            cy.gitHubGetFileJson(
              branchName,
              `data-sources/${datasourceCoRelationId}.json`,
            ).then((dsFile) => {
              cy.log(`[log] DS file after dev update: ${JSON.stringify(dsFile)}`);
              expect(dsFile, "data-sources file exists").to.not.be.null;
              expect(dsFile.name, "DS name").to.equal("restapi");
              expect(dsFile.kind, "DS kind").to.equal("restapi");
              expect(
                dsFile.options?.development?.url,
                "development URL updated",
              ).to.equal(NEW_DEV_URL);
              expect(
                dsFile.options,
                "staging env block present",
              ).to.have.property("staging");
              expect(
                dsFile.options,
                "production env block present",
              ).to.have.property("production");
            });

            // .meta/dataSourceMeta.json reflects the updated DS
            cy.gitHubGetFileJson(branchName, ".meta/dataSourceMeta.json").then(
              (meta) => {
                cy.log(`[log] dataSourceMeta: ${JSON.stringify(meta)}`);
                expect(meta, "dataSourceMeta.json exists").to.not.be.null;
                expect(
                  meta,
                  `meta entry for ${datasourceCoRelationId}`,
                ).to.have.property(datasourceCoRelationId);
                expect(
                  meta[datasourceCoRelationId].name,
                  "meta name",
                ).to.equal("restapi");
                expect(
                  meta[datasourceCoRelationId].contentHash,
                  "contentHash present",
                ).to.be.a("string");
              },
            );

            // ── PR + merge ─────────────────────────────────────────────────
            cy.gitHubWaitForCommitsAhead(branchName, "master");
            cy.gitHubCreatePR(branchName, `PR: ${appName}`, "master").then(
              (prNumber) => {
                cy.log(`[log] prNumber: ${prNumber}`);
                cy.gitHubMergePR(prNumber);
              },
            );

            // ── Switch to master + pull ────────────────────────────────────
            cy.gitSyncGetBranchId("master").then((mId) => {
              masterBranchId = mId;
              cy.log(`[log] masterBranchId: ${masterBranchId}`);
              cy.apiSwitchBranch(masterBranchId);
              cy.apiGitSyncPull(masterBranchId);
            });

            // ── Verify on master ───────────────────────────────────────────
            // App folder + meta present
            cy.gitHubAssertAppFolderExists("master", appName);
            cy.gitHubAssertAppMeta("master", appName);

            // Component names and page names match
            cy.gitHubFetchAppData("master", appName).then(
              ({ components, pages }) => {
                cy.log(
                  `[log] master components: ${JSON.stringify(components.map((c) => c.name))}`,
                );
                cy.log(
                  `[log] master pages: ${JSON.stringify(pages.map((p) => p.name))}`,
                );
                const expCompNames = (appV2.components || [])
                  .map((c) => c.name)
                  .sort();
                const gitCompNames = components.map((c) => c.name).sort();
                expect(
                  gitCompNames,
                  "master: component names match",
                ).to.deep.equal(expCompNames);

                const expPageNames = (appV2.pages || [])
                  .map((p) => p.name)
                  .sort();
                const gitPageNames = pages.map((p) => p.name).sort();
                expect(
                  gitPageNames,
                  "master: page names match",
                ).to.deep.equal(expPageNames);
              },
            );

            // Dev URL present on master data-sources file
            cy.gitHubGetFileJson(
              "master",
              `data-sources/${datasourceCoRelationId}.json`,
            ).then((dsFileMaster) => {
              cy.log(
                `[log] DS file on master: ${JSON.stringify(dsFileMaster)}`,
              );
              expect(dsFileMaster, "DS file exists on master").to.not.be.null;
              expect(
                dsFileMaster.options?.development?.url,
                "dev URL on master",
              ).to.equal(NEW_DEV_URL);
            });
          });
        });
      });
    });

    // =========================================================================
    // Block 2 — Branch 2: rename + layout change + staging DS change
    //           → PR → merge → pull master → verify all changes on master
    // =========================================================================


    it("branch 2: rename + table layout update + staging DS change → PR → merge → master reflects all", () => {
      const branchName2 = `test-commit-b2-${testId}`;

      // Branch 2 is created from master — inherits the merged app from block 1
      cy.gitSyncCreateBranchViaApi(branchName2);
      cy.gitSyncGetBranchId(branchName2).then((branchId2) => {
        cy.log(`[log] branchId2: ${branchId2}`);

        // ── Resolve app on branch 2 ───────────────────────────────────────
        cy.apiGetAppIdByNameOnBranch(appName, branchId2).then((appId_b2) => {
          cy.log(`[log] appId_b2: ${appId_b2}`);
          expect(appId_b2, "app found on branch 2").to.be.a("string");

          cy.apiGetAppDefinition(appId_b2, branchName2).then((appV2_b2) => {
            cy.log(`[log] appV2_b2: ${JSON.stringify(appV2_b2)}`);

            const ds_b2 = (appV2_b2.dataSources || []).find(
              (d) => d.kind === "restapi",
            );
            expect(ds_b2, "restapi DS on branch 2").to.exist;
            cy.log(`[log] ds_b2: ${JSON.stringify(ds_b2)}`);

            const stagingEnv = (appV2_b2.appEnvironments || []).find(
              (e) => e.name === "staging",
            );
            expect(stagingEnv, "staging environment present").to.exist;
            cy.log(`[log] stagingEnv: ${JSON.stringify(stagingEnv)}`);

            const tableComp = (appV2_b2.components || []).find(
              (c) => c.type === "Table",
            );
            expect(tableComp, "Table component present").to.exist;
            cy.log(`[log] tableComp: ${JSON.stringify(tableComp)}`);

            cy.apiGetEditingVersionId(appId_b2, branchId2).then((versionId_b2) => {
              cy.log(`[log] versionId_b2: ${versionId_b2}`);

              // ── Rename app ────────────────────────────────────────────────
              // Rename updates gitAppName in DB only — no auto-commit.
              // The next editor push handles directory rename + appMeta.json update.
              cy.apiRenameApp(appId_b2, renamedAppName, versionId_b2);

              // ── Layout update + editor push ───────────────────────────────
              cy.apiUpdateComponentLayout(
                appId_b2,
                versionId_b2,
                tableComp.pageId,
                tableComp.id,
                NEW_TABLE_LAYOUT,
              );

              const layoutMsg = `feat: update table layout ${renamedAppName}`;
              cy.apiEditorPush(
                appId_b2,
                versionId_b2,
                layoutMsg,
                branchName2,
                renamedAppName,
              );
              cy.gitHubWaitForCommitMessage(branchName2, renamedAppName);

              // Rename reflected in git after editor push — old folder gone, new present
              cy.gitHubAssertAppFolderGone(branchName2, appName);
              cy.gitHubAssertAppFolderExists(branchName2, renamedAppName);
              cy.gitHubAssertAppMeta(branchName2, renamedAppName);

              // Table component layout reflected in git
              cy.gitHubAssertComponentLayout(
                branchName2,
                renamedAppName,
                tableComp.name,
                NEW_TABLE_LAYOUT,
              );

              // ── Staging DS URL + dashboard push ───────────────────────────
              cy.apiUpdateDataSourceUrl(
                ds_b2.id,
                stagingEnv.id,
                NEW_STAGING_URL,
                branchId2,
              );
              const stagingMsg = `feat: update staging datasource URL`;
              cy.apiGitSyncPush(stagingMsg, branchId2);
              cy.gitHubWaitForCommitMessage(branchName2, "staging datasource");

              // Staging URL updated; dev URL untouched on this branch
              cy.gitHubGetFileJson(
                branchName2,
                `data-sources/${datasourceCoRelationId}.json`,
              ).then((dsFile_b2) => {
                cy.log(
                  `[log] DS file on branch2: ${JSON.stringify(dsFile_b2)}`,
                );
                expect(dsFile_b2, "DS file exists on branch 2").to.not.be.null;
                expect(
                  dsFile_b2.options?.staging?.url,
                  "staging URL updated on branch 2",
                ).to.equal(NEW_STAGING_URL);
                expect(
                  dsFile_b2.options?.development?.url,
                  "dev URL unchanged on branch 2",
                ).to.equal(NEW_DEV_URL);
              });

              // ── PR + merge ────────────────────────────────────────────────
              cy.gitHubWaitForCommitsAhead(branchName2, "master");
              cy.gitHubCreatePR(
                branchName2,
                `PR: ${renamedAppName}`,
                "master",
              ).then((prNumber2) => {
                cy.log(`[log] prNumber2: ${prNumber2}`);
                cy.gitHubMergePR(prNumber2);
              });

              // ── Pull master + verify all changes ──────────────────────────
              cy.apiGitSyncPull(masterBranchId);

              // App folder renamed on master
              cy.gitHubAssertAppFolderGone("master", appName);
              cy.gitHubAssertAppFolderExists("master", renamedAppName);
              cy.gitHubAssertAppMeta("master", renamedAppName);

              // Table layout reflected on master
              cy.gitHubAssertComponentLayout(
                "master",
                renamedAppName,
                tableComp.name,
                NEW_TABLE_LAYOUT,
              );

              // Both dev (from block 1) and staging (from block 2) URLs on master
              cy.gitHubGetFileJson(
                "master",
                `data-sources/${datasourceCoRelationId}.json`,
              ).then((dsFileMaster) => {
                cy.log(
                  `[log] DS file on master after block 2 merge: ${JSON.stringify(dsFileMaster)}`,
                );
                expect(
                  dsFileMaster,
                  "DS file on master after block 2",
                ).to.not.be.null;
                expect(
                  dsFileMaster.options?.development?.url,
                  "dev URL on master",
                ).to.equal(NEW_DEV_URL);
                expect(
                  dsFileMaster.options?.staging?.url,
                  "staging URL on master",
                ).to.equal(NEW_STAGING_URL);
              });

              // DB listing: renamed name visible on master, original absent
              cy.apiListAppsOnBranch(masterBranchId).then((masterApps) => {
                const masterNames = masterApps.map((a) => a?.name);
                expect(
                  masterNames,
                  "renamed app name present in master listing",
                ).to.include(renamedAppName);
                expect(
                  masterNames,
                  "original app name absent from master listing",
                ).to.not.include(appName);
              });

              // ── Folder: create folder, move app, rename → git captures folder-scoped path
              const folderBranch = `test-folder-${testId}`;
              const folderName = `tf-${testId}`;
              const origAppName = `app-folder-${testId}`;
              const renamedInFolder = `app-folder-renamed-${testId}`;

              cy.gitSyncCreateBranchViaApi(folderBranch);
              cy.gitSyncGetBranchId(folderBranch).then((folderBranchId) => {
                cy.apiCreateAppOnBranch(origAppName, folderBranchId).then((fApp) => {
                  const fAppId = fApp.id;

                  cy.apiGetEditingVersionId(fAppId, folderBranchId).then((fVersionId) => {
                    const initMsg = `feat: initial commit ${origAppName}`;
                    cy.apiEditorPush(fAppId, fVersionId, initMsg, folderBranch, origAppName);
                    cy.gitHubWaitForCommitMessage(folderBranch, origAppName);
                    cy.gitHubAssertAppFolderExists(folderBranch, origAppName);

                    cy.apiCreateFolder(folderName).then((folder) => {
                      cy.apiAddAppToFolder(folder.id, fAppId);
                      cy.apiRenameApp(fAppId, renamedInFolder, fVersionId);

                      const pushMsg = `feat: move to folder and rename ${renamedInFolder}`;
                      cy.apiEditorPush(fAppId, fVersionId, pushMsg, folderBranch, renamedInFolder);
                      cy.gitHubWaitForCommitMessage(folderBranch, renamedInFolder);

                      cy.gitHubAssertAppFolderGone(folderBranch, origAppName);
                      cy.gitHubAssertAppInFolder(folderBranch, folderName, renamedInFolder);
                      cy.gitHubAssertAppMetaPath(folderBranch, `apps/${folderName}/${renamedInFolder}`);
                    });
                  });
                });
              });
            });
          });
        });
      });
    });
    // =========================================================================
    // Block 3 — Branch isolation + multi-branch merge + rename-then-merge
    //           (M1, M2, M3 from MISSING_CASES.md Priority 1)
    // =========================================================================

    it("branch isolation — app on branchA not visible on branchB before any merge", () => {
      const branchA = `test-isolate-a-${testId}`;
      const branchB = `test-isolate-b-${testId}`;
      const appA = `app-isolate-a-${testId}`;
      const appB = `app-isolate-b-${testId}`;

      cy.gitSyncCreateBranchViaApi(branchA);
      cy.gitSyncCreateBranchViaApi(branchB);

      let branchAId, branchBId;

      cy.gitSyncGetBranchId(branchA).then((id) => { branchAId = id; });
      cy.gitSyncGetBranchId(branchB).then((id) => { branchBId = id; });

      cy.then(() => {
        cy.apiCreateAppOnBranch(appA, branchAId);
        cy.apiCreateAppOnBranch(appB, branchBId);
      });

      // branchA: sees appA, does NOT see appB
      cy.then(() => cy.apiListAppsOnBranch(branchAId)).then((appsA) => {
        const namesA = appsA.map((a) => a?.name);
        expect(namesA, "appA present on branchA").to.include(appA);
        expect(namesA, "appB absent from branchA").to.not.include(appB);
      });

      // branchB: sees appB, does NOT see appA
      cy.then(() => cy.apiListAppsOnBranch(branchBId)).then((appsB) => {
        const namesB = appsB.map((a) => a?.name);
        expect(namesB, "appB present on branchB").to.include(appB);
        expect(namesB, "appA absent from branchB").to.not.include(appA);
      });
    });

  },
);
