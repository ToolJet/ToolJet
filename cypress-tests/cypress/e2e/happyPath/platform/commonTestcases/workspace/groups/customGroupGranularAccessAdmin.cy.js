import { fake } from "Fixtures/fake";
import { commonWidgetSelector } from "Selectors/common";
import {
    archiveSpecWorkspace,
    configureAppGranularPermissions,
    configureEnterpriseGranularPermissions,
    createAndReleaseApp,
    createSpecWorkspace,
    createWorkspaceOnboardUser,
    openAppAsBuilder,
    verifyBuilderAccessAsPerTheConfig,
} from "Support/utils/platform/customGroupGranularAccess";
import {
    verifyEnvironmentAccess,
    verifyEnvironmentTagsInGranularUI,
} from "Support/utils/userPermissions";

describe("Custom Group Granular Access - Admin", () => {
    let data = {};
    const isEnterprise = Cypress.env("environment") === "Enterprise";

    before(() => {
        cy.exec("mkdir -p ./cypress/downloads/");
        cy.wait(3000);
    });

    beforeEach(() => {
        data = {
            firstName: fake.firstName,
            appName: fake.companyName,
            email: fake.email.toLowerCase().replaceAll("[^A-Za-z]", ""),
            workspaceName: fake.lastName.toLowerCase().replace(/[^A-Za-z]/g, ""),
            workspaceSlug: fake.lastName.toLowerCase().replace(/[^A-Za-z]/g, ""),
            folderName: fake.companyName,
            dsName: fake.lastName.toLowerCase().replaceAll("[^A-Za-z]", ""),
        };

        createSpecWorkspace("cgga-admin");
        cy.intercept("DELETE", "/api/folders/*").as("folderDeleted");
        cy.skipWalkthrough();
        cy.viewport(2400, 2000);
    });

    afterEach(() => {
        archiveSpecWorkspace();
    });

    it("Should verify the granular permissions in custom groups", () => {
        const groupName = fake.firstName.replace(/[^A-Za-z]/g, "");
        const appName2 = fake.companyName;
        const appName3 = fake.companyName;
        const appSlug = appName3.toLowerCase().replace(/\s+/g, "-");
        const workflowName1 = `${data.appName}-workflow`;
        const workflowName2 = `${appName2}-workflow`;
        const datasourceName1 = `${data.appName}-datasource`;
        const datasourceName2 = `${appName2}-datasource`;

        createWorkspaceOnboardUser({
            data,
            groupName,
            appName2,
            appName3,
            appSlug,
            isEnterprise,
        });

        configureAppGranularPermissions(groupName, [
            data.appName,
            appName2,
            appName3,
        ]);

        configureEnterpriseGranularPermissions({
            groupName,
            workflowNames: [workflowName1, workflowName2],
            datasourceNames: [datasourceName1, datasourceName2],
        });

        verifyBuilderAccessAsPerTheConfig({
            workspaceSlug: data.workspaceSlug,
            email: data.email,
            datasourceName1,
            datasourceName2,
            appSlug,
        });
    });

    it("Should verify all environment promotion, preview and release access for Admin", () => {
        const envTags = ["Development", "Staging", "Production", "Released app"];
        const environments = [
            { name: "development", hasAccess: true },
            { name: "staging", hasAccess: true },
            { name: "production", hasAccess: true },
        ];
        let appId1;

        // Verify all environments are selected by default for admin group
        verifyEnvironmentTagsInGranularUI("Admin", envTags);
        createAndReleaseApp(data.appName, {
            componentValue: `{{globals.environment.name}}`,
        });
        cy.apiGetAppIdByName(data.appName)
            .then((appId) => {
                appId1 = appId;
            })
            .then(() => {
                openAppAsBuilder(appId1);
                verifyEnvironmentAccess(environments, {
                    appName: data.appName,
                    canEdit: true,
                    appId: appId1,
                });
                cy.visit(`/applications/${appId1}`);
                cy.get(commonWidgetSelector.draggableWidget("text1")).should(
                    "contain",
                    "production",
                );
            });
    });
});
