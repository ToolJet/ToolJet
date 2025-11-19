import { importApp, exportApp, allAppsDetails, fetchWorkspaceApps } from "Support/utils/externalApi";
import { fake } from "Fixtures/fake";
import { sanitize } from "Support/utils/common";

describe("ToolJet: Apps API Validation", () => {
    const workspaceMeta = {
        workspaceName: sanitize(fake.lastName),
        workspaceSlug: sanitize(fake.lastName),
    };

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
        cy.apiLogin();
        cy.apiCreateWorkspace(workspaceMeta.workspaceName, workspaceMeta.workspaceSlug).then((response) => {
            Cypress.env("workspaceId", response.body.organization_id);
        });
        return loadFixtures();
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
            const apps = Array.isArray(response.body) ? response.body : response.body.apps;
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
        workspaceMeta.workspaceName = sanitize(fake.lastName)
        workspaceMeta.workspaceSlug = sanitize(fake.lastName)
        cy.apiCreateWorkspace(
            workspaceMeta.workspaceName,
            workspaceMeta.workspaceSlug
        ).then((res) => {
            newWorkspaceId = res.body.organization_id;
            importApp(newWorkspaceId, requestData).then((response) => {
                expect(response.status).to.eq(201);
                expect(response.body.message).to.include(
                    "App imported successfully into workspace"
                );
            });
        });
    });

    it.skip("should validate Export App API flows", () => {
        const workspaceId = Cypress.env("workspaceId");
        let appId;

        importApp(workspaceId, requestData3)
            .then((response) => {
                expect(response.status).to.eq(201);
                expect(response.body.message).to.include(
                    "App imported successfully into workspace"
                );
            })
            .then(() => {
                cy.get('[data-cy^="import-export-app"]')
                    .first()
                    .find('[data-cy="edit-button"]')
                    .click({ force: true });
                cy.skipWalkthrough();
            });

        cy.get('[data-cy="left-sidebar-settings-button"]').click();
        cy.get('[data-cy="app-slug-input-field"]').invoke("val").then((value) => {
            appId = value;

            exportApp(workspaceId, appId, "").then((response) => {
                expect(response.status).to.eq(201);
                expect(
                    response.body.app[0].definition.appV2.appVersions.length
                ).to.eq(1);
                expect(
                    response.body.app[0].definition.appV2.appVersions[0].name
                ).to.eq("v3");
            });

            exportApp(workspaceId, appId, "?appVersion=v2").then((response) => {
                expect(response.status).to.eq(201);
                expect(
                    response.body.app[0].definition.appV2.appVersions.length
                ).to.eq(1);
                expect(
                    response.body.app[0].definition.appV2.appVersions[0].name
                ).to.eq("v2");
            });

            exportApp(workspaceId, appId, "?exportAllVersions=true").then(
                (response) => {
                    expect(response.status).to.eq(201);
                    expect(
                        response.body.app[0].definition.appV2.appVersions.length
                    ).to.eq(3);
                }
            );

            exportApp(workspaceId, appId, "?exportTJDB=false").then((response) => {
                expect(response.status).to.eq(201);
                expect(response.body).not.to.have.property("tooljet_database");
            });

            exportApp(workspaceId, appId, "?exportTJDB=true").then((response) => {
                expect(response.status).to.eq(201);
                expect(response.body).to.have.property("tooljet_database");
            });
        });

        allAppsDetails(workspaceId).then((response) => {
            expect(response.status).to.eq(200);
        });
    });
});
