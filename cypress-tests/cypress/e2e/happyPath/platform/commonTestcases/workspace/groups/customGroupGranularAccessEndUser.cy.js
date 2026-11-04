import { fake } from "Fixtures/fake";
import {
    commonSelectors,
    commonWidgetSelector,
} from "Selectors/common";
import { groupsSelector } from "Selectors/platform/manageGroups";
import {
    apiAddUserToGroup,
    apiCreateGroup,
} from "Support/utils/manageGroups";
import {
    archiveSpecWorkspace,
    createAndReleaseApp,
    createSpecWorkspace,
    loginAsAdmin,
    loginAsUser,
    openAppAsBuilder,
    openGranularPermissions,
    validateAndEditEnvironmentsInEditModal,
    validateAppCardCTAs,
} from "Support/utils/platform/customGroupGranularAccess";
import {
    signup,
    verifyEnvironmentAccess,
    verifyEnvironmentTagsInGranularUI,
} from "Support/utils/userPermissions";
import {
    createDraftVersion,
    openVersionSwitcher,
} from "Support/utils/version";

describe("Custom Group Granular Access - End User", () => {
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

        createSpecWorkspace("cgga-enduser");
        cy.intercept("DELETE", "/api/folders/*").as("folderDeleted");
        cy.skipWalkthrough();
        cy.viewport(2400, 2000);
    });

    afterEach(() => {
        archiveSpecWorkspace();
    });

    it("Should verify preview and released app access for End-user", () => {
        let appId1;
        const enduserEnvTags = ["Released app"];

        cy.apiDeleteGranularPermission("end-user", ["app", "folder"]);

        cy.apiCreateGranularPermission("end-user", "Apps", "app", {
            canEdit: false,
            canView: true,
            canAccessDevelopment: false,
            canAccessStaging: false,
            canAccessProduction: false,
            canAccessReleased: true,
        });

        verifyEnvironmentTagsInGranularUI("End-user", enduserEnvTags);
        createAndReleaseApp(data.appName, {
            componentValue: `{{globals.environment.name}}`,
        });

        cy.apiGetAppIdByName(data.appName)
            .then((appId) => {
                appId1 = appId;
            })
            .then(() => {
                cy.apiFullUserOnboarding(data.firstName, data.email, "end-user").then(() => {

                //Scenario A : Can acces only released app and Preview button not visible
                verifyEnvironmentAccess(
                    [
                        { name: "development", hasAccess: false },
                        { name: "staging", hasAccess: false },
                        { name: "production", hasAccess: false },
                    ],
                    {
                        appName: data.appName,
                        canEdit: false,
                        appId: appId1,
                        canAllView: false,
                    },
                );

                cy.visit("/");
                validateAppCardCTAs(data.appName, false, false, true);
                
                cy.visit(`/applications/${appId1}`);
                cy.get(commonWidgetSelector.draggableWidget("text1")).should(
                    "contain",
                    "production",
                );

                //Scenario B : Can access dev preview and released app
                loginAsAdmin();
                openGranularPermissions("end-user");
                cy.get(groupsSelector.granularAccessPermission).trigger("mouseover");
                cy.get(groupsSelector.editGranularPermissionAccess).click();
                cy.get('[data-cy="environment-label"]')
                    .should("be.visible")
                    .and("have.text", "Environment");
                validateAndEditEnvironmentsInEditModal(enduserEnvTags, "Development");

                loginAsUser(data.email);
                verifyEnvironmentAccess([{ name: "development", hasAccess: true }], {
                    appName: data.appName,
                    canEdit: false,
                    appId: appId1,
                    allowedEnvironment: "development",
                });
                cy.visit("/");
                validateAppCardCTAs(data.appName, false, true, true);
                
                cy.visit(`/applications/${appId1}`);
                cy.get(commonWidgetSelector.draggableWidget("text1")).should(
                    "contain",
                    "production",
                );
            });
        }); 
    });

    it("Should verify preview and released app access for custom group End-user", () => {
        const groupName1 = fake.firstName.replace(/[^A-Za-z]/g, "");
        const appName2 = fake.companyName;
        let appId1, appId2, groupId1;

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

        cy.apiFullUserOnboarding(data.firstName, data.email, "end-user").then(()=>{

        loginAsAdmin();
        cy.apiDeleteGranularPermission("end-user", ["app", "folder"]);
        apiCreateGroup(groupName1).then((groupId) => {
            groupId1 = groupId;
            apiAddUserToGroup(groupId1, data.email);
            cy.apiCreateGranularPermission(
                groupName1,
                "Apps",
                "app",
                {
                    canEdit: false,
                    canView: true,
                    canAccessDevelopment: true,
                    canAccessStaging: false,
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
                    canEdit: false,
                    canView: true,
                    canAccessDevelopment: false,
                    canAccessStaging: false,
                    canAccessProduction: false,
                    canAccessReleased: false,
                },
                [appId2],
                false,
            );

            //Scenario C : Only have development environment access still can access released app
            loginAsUser(data.email);
            validateAppCardCTAs(data.appName, false, true, true);
            
            cy.visit(`/applications/${appId1}`);
            cy.get(commonWidgetSelector.draggableWidget("text1")).should(
                "contain",
                "production",
            );

            //Scenario D : No environment permission is given still can access released app
           cy.visit("/");
            validateAppCardCTAs(appName2, false, false, true);
           
            cy.visit(`/applications/${appId2}`);
            cy.get(commonWidgetSelector.draggableWidget("text1")).should(
                "contain",
                "production",
            );

            //Scenario E : All environment access is given
           loginAsAdmin();
            cy.apiUpdateEnvironmentPermission(
                groupName1,
                {
                    name: "Apps",
                    isAll: false,
                    actions: {
                        canEdit: false,
                        canView: true,
                        canAccessDevelopment: true,
                        canAccessStaging: true,
                        canAccessProduction: true,
                        canAccessReleased: true,
                    },
                },
                "Apps",
            );

           loginAsUser(data.email);
            verifyEnvironmentAccess(
                [
                    { name: "development", hasAccess: true },
                    { name: "staging", hasAccess: true },
                    { name: "production", hasAccess: true },
                ],
                { appName: data.appName, canEdit: false, appId: appId1 },
            );

            cy.visit(`/applications/${appId1}`);
            cy.get(commonWidgetSelector.draggableWidget("text1")).should(
                "contain",
                "production",
            );
            
            loginAsAdmin();
            openAppAsBuilder(appId1);
            openVersionSwitcher();
            createDraftVersion("v2", "v1");

            //Scenario F : If accessing non existing version in that env then show invalid link
            loginAsUser(data.email);
            const previewUrl = `${Cypress.config("baseUrl")}/applications/${appId1}/home?env=staging&version=v2`;
            cy.visit(previewUrl);
            cy.url().should("match", /\/error\/invalid-link?/);
        });
        });
    });

    it("Should verify preview and released app access for Signed-up End-user", () => {
        const user1 = fake.firstName;
        const email1 = fake.email.toLowerCase().replaceAll("[^A-Za-z]", "");
        let appId1;

        createAndReleaseApp(data.appName, {
            componentValue: `{{globals.environment.name}}`,
        });

        cy.apiGetAppIdByName(data.appName)
            .then((appId) => {
                appId1 = appId;
            })
            .then(() => {
                cy.apiDeleteGranularPermission("end-user", ["app", "folder"]);
                cy.apiCreateGranularPermission("end-user", "Apps", "app", {
                    canEdit: false,
                    canView: true,
                    canAccessDevelopment: true,
                    canAccessStaging: false,
                    canAccessProduction: false,
                    canAccessReleased: false,
                });
                cy.apiUpdateAllowSignUp(true, "organization");
                cy.apiLogout();
                cy.wait(2000);
                //Scenario G : Signing-up with app preview link and should land on app preview

                const previewUrl = `${Cypress.config("baseUrl")}/applications/${appId1}/home?env=development&version=v1`;
                cy.visit(previewUrl);
                signup(data.firstName, data.email);
                cy.wait(2000);
                cy.waitForElement(commonSelectors.previewSettings).should('be.visible');
                cy.get(commonWidgetSelector.draggableWidget("text1")).should(
                    "contain",
                    "development",
                    { timeout: 10000 },
                );

                //Scenario H : Signing-up with app preview link without access, app preview should be restricted
                loginAsAdmin();
                cy.apiDeleteGranularPermission("end-user", ["app", "folder"]);
                cy.wait(1000);
                cy.apiLogout();
                cy.visit(previewUrl);
                signup(user1, email1);
                cy.wait(1000);
                cy.url().should("match", /\/error\/restricted(-preview)?/);
        });
    });
});
