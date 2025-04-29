import { importApp, exportApp, allAppsDetails } from 'Support/utils/api';
import { fake } from "Fixtures/fake";

describe("Export and Import API ", () => {

    const sanitize = (str) => str.toLowerCase().replace(/[^A-Za-z]/g, "");
    const data = {
        workspaceName: sanitize(fake.lastName),
        workspaceSlug: sanitize(fake.lastName),
    }

    const fixtureFiles = {
        requestData: "templates/import_unnamed_file.json",
        requestData2: "templates/import_named_file.json",
        requestData3: "templates/three-versions.json",
    };
    let requestData, requestData2, requestData3;

    beforeEach(() => {
        cy.defaultWorkspaceLogin();

        const fixturePromises = Object.entries(fixtureFiles).map(([key, file]) =>
            cy.fixture(file).then((data) => ({ key, data }))
        );

        // Assign loaded data to respective variables
        return Promise.all(fixturePromises).then((results) => {
            results.forEach(({ key, data }) => {
                ({ requestData, requestData2, requestData3 }[key] = data);
            });
        });

    });
    it("Import App API", () => {
        const workspaceId = Cypress.env("workspaceId");

        importApp(workspaceId, requestData).then((response) => {
            expect(response.status).to.eq(201);
            expect(response.body.message).to.include("App imported successfully into workspace");
        });

        //Invalid access token and workspace
        importApp(workspaceId, requestData, {
            Authorization: "Basic xyz",
            "Content-Type": "application/json"
        }).then((response) => {
            expect(response.status).to.eq(403);
        });

        importApp(workspaceId, requestData, {
            Authorization: "",
            "Content-Type": "application/json"
        }).then((response) => {
            expect(response.status).to.eq(403);
        });

        importApp(`${workspaceId}ee`, requestData).then((response) => {
            expect(response.status).to.eq(400);
        });

        //Import named file
        importApp(workspaceId, requestData2).then((response) => {
            expect(response.status).to.eq(201);
            expect(response.body.message).to.include("App imported successfully into workspace");
        });
        cy.reload();
        cy.get('[data-cy="app_json-title"]').should("exist");

        //duplicate app
        importApp(workspaceId, requestData2).then((response) => {
            expect(response.status).to.eq(409);
            expect(response.body.message).to.include("App with app_json already exists in the workspace");
        });
        cy.deleteApp("app_json");
        cy.get('[data-cy="app_json-title"]').should("not.exist");

        //Import app in another workpsace
        let newWorkspaceId;
        cy.apiCreateWorkspace(data.workspaceName, data.workspaceSlug).then((res) => {
            newWorkspaceId = res.body.organization_id;
            cy.visit(data.workspaceSlug);

            importApp(newWorkspaceId, requestData).then((response) => {
                expect(response.status).to.eq(201);
                expect(response.body.message).to.include("App imported successfully into workspace");
            });
        });
    });

    it("Export App API", () => {
        const workspaceId = Cypress.env("workspaceId");
        let appId;
        importApp(workspaceId, requestData3).then((response) => {
            expect(response.status).to.eq(201);
            expect(response.body.message).to.include("App imported successfully into workspace");
        }).then(() => {
            cy.get('[data-cy^="import-export-app"]')
                .first()
                .find('[data-cy="edit-button"]')
                .click({ force: true });
            cy.skipWalkthrough();
        });

        cy.get('[data-cy="left-sidebar-settings-button"]').click();
        cy.get('[data-cy="app-slug-input-field"]').invoke('val').then((value) => {
            appId = value;

            //export last created version
            exportApp(workspaceId, appId, "").then((response) => {
                expect(response.status).to.eq(201);
                expect(response.body.app[0].definition.appV2.appVersions.length).to.eq(1);
                expect(response.body.app[0].definition.appV2.appVersions[0].name).to.eq("v3");
            });
            //export specific versions
            exportApp(workspaceId, appId, "?appVersion=v2").then((response) => {
                expect(response.status).to.eq(201);
                expect(response.body.app[0].definition.appV2.appVersions.length).to.eq(1);
                expect(response.body.app[0].definition.appV2.appVersions[0].name).to.eq("v2");
            });
            //export all versions
            exportApp(workspaceId, appId, "?exportAllVersions=true").then((response) => {
                expect(response.status).to.eq(201);
                expect(response.body.app[0].definition.appV2.appVersions.length).to.eq(3);
            });

            //Invalid access token and workspace
            /*     exportApp(workspaceId, appId, "", {
                        Authorization: "",
                        "Content-Type": "application/json"
                    }).then((response) => {
                        expect(response.status).to.eq(403);
                    });
                 
                    exportApp(workspaceId, appId, "", {
                        Authorization: "",
                        "Content-Type": "application/json"
                    }).then((response) => {
                        expect(response.status).to.eq(403);
                    });
                 
                    exportApp(`${workspaceId}ee`, appId, "").then((response) => {
                        expect(response.status).to.eq(400);
                    });
            */
            //with and without TJDB -x.tooljet_database
            exportApp(workspaceId, appId, "?exportTJDB=false").then((response) => {
                expect(response.status).to.eq(201);
                expect(response.body).not.to.have.property("tooljet_database");
            });
            exportApp(workspaceId, appId, "?exportTJDB=true").then((response) => {
                expect(response.status).to.eq(201);
                expect(response.body).to.have.property("tooljet_database");
            });
        });
        //All Apps details
        allAppsDetails(workspaceId).then((response) => {
            expect(response.status).to.eq(200);
        });
    });
});