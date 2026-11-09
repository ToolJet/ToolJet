import { fake } from "Fixtures/fake";
import { commonWidgetSelector } from "Selectors/common";
import { groupsSelector } from "Selectors/platform/manageGroups";
import {
    apiAddUserToGroup,
    apiCreateGroup,
} from "Support/utils/manageGroups";
import {
    archiveSpecWorkspace,
    createAndReleaseApp,
    createSpecWorkspace,
    expectRestrictedModal,
    loginAsAdmin,
    loginAsUser,
    openAppAsBuilder,
    openGranularPermissions,
    validateAndEditEnvironmentsInEditModal,
    validateAppCardCTAs,
} from "Support/utils/platform/customGroupGranularAccess";
import {
    appPromote,
    createVersionFromDraft,
    promoteEnv,
    releaseApp,
} from "Support/utils/platform/multiEnv";
import {
    verifyEnvironmentAccess,
    verifyEnvironmentTagsInGranularUI,
} from "Support/utils/userPermissions";

describe("Custom Group Granular Access - Builder", () => {
    let data = {};

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

        createSpecWorkspace("cgga-builder");
        cy.intercept("DELETE", "/api/folders/*").as("folderDeleted");
        cy.skipWalkthrough();
        cy.viewport(2400, 2000);
    });

    afterEach(() => {
        archiveSpecWorkspace();
    });

    it("Should verify all environment promotion, preview and release access for Builder", () => {
        const builderEnvTags = ["Development", "Staging", "Released app"];
        const environments = [
            { name: "development", hasAccess: true },
            { name: "staging", hasAccess: true },
            { name: "production", hasAccess: false },
        ];
        let appId1;

        cy.apiDeleteGranularPermission("builder", ["app", "folder"]);
        cy.apiCreateApp(data.appName)
            .then((res) => {
                appId1 = res.body.id;
                cy.apiAddComponentToApp(
                    data.appName,
                    "text1",
                    {},
                    "Text",
                    `{{globals.environment.name}}`,
                );
            })
            .then(() => {
                cy.apiCreateGranularPermission(
                    "builder",
                    "Apps",
                    "app",
                    {
                        canEdit: true,
                        canView: false,
                        canAccessDevelopment: true,
                        canAccessStaging: true,
                        canAccessProduction: false,
                        canAccessReleased: true,
                    },
                );

                // Scenario A: Verify default environment tags and Promote dev->staging and verify access for given environment access
                verifyEnvironmentTagsInGranularUI("builder", builderEnvTags);

                cy.apiFullUserOnboarding(data.firstName, data.email, "builder");
                openAppAsBuilder(appId1);
                createVersionFromDraft("v1");
                appPromote("development", "staging");
                promoteEnv("staging");
                verifyEnvironmentAccess(environments, {
                    appName: data.appName,
                    canEdit: true,
                    appId: appId1,
                });

                // Scenario B: Allow production preview by editing granular env selection, then release + verify production access

                loginAsAdmin();
                
                openGranularPermissions("builder");
                cy.get(groupsSelector.granularAccessPermission).trigger("mouseover");
                cy.get(groupsSelector.editGranularPermissionAccess).click();
                
                validateAndEditEnvironmentsInEditModal(builderEnvTags, "Production");

                loginAsUser(data.email);
                openAppAsBuilder(appId1);
                releaseApp();
                verifyEnvironmentAccess([{ name: "production", hasAccess: true }], {
                    appName: data.appName,
                    canEdit: true,
                    appId: appId1,
                });
                loginAsUser(data.email);
                cy.visit(`/applications/${appId1}`);
                cy.get(commonWidgetSelector.draggableWidget("text1")).should(
                    "contain",
                    "production",
                );
            });
    });

    it("Should verify edit and view permissions with specific environment access for Builder", () => {
        const appName2 = fake.companyName;
        const groupName1 = fake.firstName.replace(/[^A-Za-z]/g, "");
        let appId1, appId2, groupId1;

        cy.apiFullUserOnboarding(data.firstName, data.email, "builder").then(()=>{
        loginAsAdmin();
        createAndReleaseApp(data.appName, {
            componentValue: `{{globals.environment.name}}`,
        });
        createAndReleaseApp(appName2, {
            componentValue: `{{globals.environment.name}}`,
        });
        cy.apiGetAppIdByName(data.appName).then((appId) => {
            appId1 = appId;
        });
        cy.apiGetAppIdByName(appName2).then((appId) => {
            appId2 = appId;
        });

        cy.apiDeleteGranularPermission("builder", ["app", "folder"]);
        apiCreateGroup(groupName1).then((groupId) => {
            groupId1 = groupId;
            cy.wait(2000);
            apiAddUserToGroup(groupId1, data.email);
            cy.apiCreateGranularPermission(
                groupName1,
                "Apps",
                "app",
                {
                    canEdit: true,
                    canView: false,
                    canAccessDevelopment: false,
                    canAccessStaging: true,
                    canAccessProduction: false,
                    canAccessReleased: false,
                },
                [appId1],
                false,
            );

            cy.apiCreateGranularPermission(
                groupName1,
                "Apps1",
                "app",
                {
                    canEdit: true,
                    canView: false,
                    canAccessDevelopment: false,
                    canAccessStaging: false,
                    canAccessProduction: false,
                    canAccessReleased: false,
                },
                [appId2],
                false,
            );

            // Scenario C: Edit + staging only (no released) -> dev & stag allowed + launch should be restricted
            loginAsUser(data.email);
            openAppAsBuilder(appId1);
            verifyEnvironmentAccess([{ name: "development", hasAccess: true }], {
                appName: data.appName,
                canEdit: true,
                appId: appId1,
            });
            cy.visit(`/applications/${appId1}`);
            expectRestrictedModal();

            // Scenario D: Edit + no environment flags -> editor still shows dev, launch released app still works

            loginAsUser(data.email);
            openAppAsBuilder(appId2);
            verifyEnvironmentAccess([{ name: "development", hasAccess: true }], {
                appName: appName2,
                canEdit: true,
                appId: appId2,
            });
            cy.visit(`/applications/${appId2}`);
            cy.get(commonWidgetSelector.draggableWidget("text1")).should(
                "contain",
                "production",
            );

            // Scenario E: View-only + staging -> staging preview allowed, dev blocked; preview CTA visible

            loginAsAdmin();
            cy.apiUpdateEnvironmentPermission(
                groupName1,
                {
                    name: "Apps",
                    isAll: false,
                    actions: {
                        canEdit: false,
                        canView: true,
                        canAccessDevelopment: false,
                        canAccessStaging: true,
                        canAccessProduction: false,
                        canAccessReleased: false,
                    },
                },
                "Apps",
            );

            loginAsUser(data.email);
            verifyEnvironmentAccess(
                [
                    { name: "development", hasAccess: false },
                    { name: "staging", hasAccess: true },
                ],
                { appName: data.appName, canEdit: false, appId: appId1 },
            );
            loginAsUser(data.email);
            validateAppCardCTAs(data.appName, false, true, true, false);
           
            cy.visit(`/applications/${appId1}`);
            expectRestrictedModal();
        });
        });
    });

    it("Should verify builder own app dev access and invalid environment preview handling", () => {
        const appName1 = fake.companyName;
        const appName2 = fake.companyName;
        const groupName1 = fake.firstName.replace(/[^A-Za-z]/g, "");
        let appId1, appId2, groupId1;

        createAndReleaseApp(appName1, {
            componentValue: `{{globals.environment.name}}`,
        });
        cy.apiGetAppIdByName(appName1).then((appId) => {
            appId1 = appId;
        });

        cy.apiFullUserOnboarding(data.firstName, data.email, "builder").then(()=>{

        loginAsAdmin();
        cy.apiDeleteGranularPermission("builder", ["app", "folder"]);

        apiCreateGroup(groupName1).then((groupId) => {
            groupId1 = groupId;
            cy.wait(2000);
            apiAddUserToGroup(groupId1, data.email);
            cy.apiCreateGranularPermission(
                groupName1,
                "Apps",
                "app",
                {
                    canEdit: false,
                    canView: true,
                    canAccessDevelopment: false,
                    canAccessStaging: false,
                    canAccessProduction: false,
                    canAccessReleased: false,
                },
                [appId1],
                false,
            );

            // Scenario F: View-only + no environment -> all previews restricted, have released app access
            loginAsUser(data.email);
            cy.visit("/");
            verifyEnvironmentAccess([{ name: "development", hasAccess: false }], {
                appName: appName1,
                canEdit: false,
                appId: appId1,
                canAllView: false,
            });

            cy.visit("/");
            validateAppCardCTAs(appName1, false, false, true);
            
            cy.visit(`/applications/${appId1}`);
            cy.get(commonWidgetSelector.draggableWidget("text1")).should(
                "contain",
                "production",
            );
        });

        // Scenario G: View + create + staging environment -> can open own app in dev
        loginAsAdmin();
        //Added the app permission for builder
        cy.apiCreateGranularPermission(
            "builder",
            "Apps",
            "app",
            {
                canEdit: false,
                canView: true,
                canAccessDevelopment: false,
                canAccessStaging: true,
                canAccessProduction: false,
                canAccessReleased: false,
            },
            "Apps",
        );

        loginAsUser(data.email);

        cy.apiCreateApp(appName2).then((res) => {
            appId2 = res.body.id;
            cy.apiAddComponentToApp(
                appName2,
                "text1",
                {},
                "Text",
                `{{globals.environment.name}}`,
            );

            cy.visit("/");

            validateAppCardCTAs(appName2, true, false, true, false);
            
            openAppAsBuilder(appId2);
            verifyEnvironmentAccess([{ name: "development", hasAccess: true }], {
                appName: appName2,
                canEdit: true,
                appId: appId2,
            });

            //If environment is not exist for that app
            const previewUrl = `${Cypress.config("baseUrl")}/applications/${appId2}/home?env=staging&version=v1`;

            cy.visit(previewUrl);
            cy.url().should("match", /\/error\/invalid-link?/);
        });
        });
    });
});
