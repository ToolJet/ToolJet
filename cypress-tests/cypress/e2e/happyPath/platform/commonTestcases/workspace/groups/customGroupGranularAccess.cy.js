import { fake } from "Fixtures/fake";
import { commonSelectors, commonWidgetSelector } from "Selectors/common";
import { dataSourceSelector } from "Selectors/dataSource";
import { createVersionFromDraft, appPromote, promoteEnv, releaseApp, launchApp } from "Support/utils/platform/multiEnv";
import { groupsSelector } from "Selectors/manageGroups";
import { navigateToManageGroups } from "Support/utils/common";
import {
    createGroupsAndAddUserInGroup,
    setupWorkspaceAndInviteUser,
    apiAddUserToGroup,
    apiCreateGroup
} from "Support/utils/manageGroups";
import { getGroupPermissionInput, verifyEnvironmentTagsInGranularUI, verifyEnvironmentAccess, verifyPreviewURLAccess } from "Support/utils/userPermissions";
import { groupsText } from "Texts/manageGroups";


const createAndReleaseApp = (appName, appSlug) => {
    cy.apiCreateApp(appName);
    cy.openApp();
    cy.apiAddComponentToApp(appName, "text1");
    cy.apiPublishDraftVersion('v1')
    cy.apiPromoteAppVersion().then(() => {
        const stagingId = Cypress.env("stagingEnvId");
        cy.apiPromoteAppVersion(stagingId);
    });
    cy.apiReleaseApp(appName);
    cy.apiAddAppSlug(appName, appSlug);
    cy.go("back");
};

const createWorkspaceOnboardUser = ({
    data,
    groupName,
    appName2,
    appName3,
    appSlug,
    isEnterprise,
}) => {
    setupWorkspaceAndInviteUser(
        data.workspaceName,
        data.workspaceSlug,
        data.firstName,
        data.email,
        "builder"
    );

    cy.apiLogin();
    cy.visit(data.workspaceSlug);

    //Remove builder permissions and delete granular access
    cy.apiUpdateGroupPermission(
        "builder",
        getGroupPermissionInput(isEnterprise, false)
    );
    cy.apiDeleteGranularPermission("builder", []);

    navigateToManageGroups();
    createGroupsAndAddUserInGroup(groupName, data.email);

    cy.apiCreateApp(data.appName);
    cy.apiCreateApp(appName2);
    createAndReleaseApp(appName3, appSlug);
};

const configureAppGranularPermissions = (groupName, apps) => {
    navigateToManageGroups();
    cy.get(groupsSelector.groupLink(groupName)).click();
    cy.get(groupsSelector.permissionsLink).click();
    cy.get(groupsSelector.granularLink).click();

    //Create app granular access
    apps.forEach((app) => {
        cy.ifEnv("Community", () => {
            cy.get(groupsSelector.addAppsButton).click();
        });
        cy.ifEnv("Enterprise", () => {
            cy.get(groupsSelector.addPermissionButton).click();
            cy.get(groupsSelector.addAppButton).click();
        });

        cy.clearAndType(groupsSelector.permissionNameInput, app);
        cy.get(groupsSelector.customRadio).check();
        cy.get(groupsSelector.granularPermissionResourceContainer).click({ force: true }).type(`${app}{enter}`);
        cy.get(groupsSelector.confimButton).click({ force: true });
        cy.verifyToastMessage(
            commonSelectors.toastMessage,
            groupsText.createPermissionToast
        );
    });

    cy.get(groupsSelector.groupChip).contains(apps[0]).click();
    cy.get(groupsSelector.editPermissionRadio).click();
    cy.get(groupsSelector.confimButton).click();

    cy.get(groupsSelector.groupChip).contains(apps[2]).click();
    cy.get(groupsSelector.hidePermissionInput).check();
    cy.get(groupsSelector.confimButton).click();
};

const configureEnterpriseGranularPermissions = ({
    groupName,
    workflowNames,
    datasourceNames,
}) => {
    cy.ifEnv("Enterprise", () => {
        //Create workflow
        workflowNames.forEach((workflow) => {
            cy.apiCreateWorkflow(workflow);
        });

        //Create datasource 
        datasourceNames.forEach((datasource) => {
            cy.apiCreateDataSource(
                `${Cypress.env("server_host")}/api/data-sources`,
                datasource,
                "restapi",
                [{ key: "url", value: "https://jsonplaceholder.typicode.com/users" }]
            );
        });

        cy.get(groupsSelector.groupLink("Builder")).click();
        cy.get(groupsSelector.granularLink).click();
        cy.get(groupsSelector.groupLink(groupName)).click();
        cy.get(groupsSelector.granularLink).click();

        //Create workflow granular access
        workflowNames.forEach((workflow) => {
            cy.get(groupsSelector.addPermissionButton).click();
            cy.get(groupsSelector.addWorkflowButton).click();
            cy.clearAndType(groupsSelector.permissionNameInput, workflow);
            cy.get(groupsSelector.customRadio).check();
            cy.get(groupsSelector.granularPermissionResourceContainer)
                .click({ force: true })
                .type(`${workflow}{enter}`);
            cy.get(groupsSelector.confimButton).click({ force: true });
            cy.verifyToastMessage(
                commonSelectors.toastMessage,
                groupsText.createPermissionToast
            );
        });

        cy.get(groupsSelector.groupChip).contains(workflowNames[0]).click();
        cy.get(groupsSelector.buildWorkflowradio).click();
        cy.get(groupsSelector.confimButton).click();

        //Create datasource granular access
        datasourceNames.forEach((datasource) => {
            cy.get(groupsSelector.addPermissionButton).click();
            cy.get(groupsSelector.addDatasourceButton).click();
            cy.clearAndType(groupsSelector.permissionNameInput, datasource);
            cy.get(groupsSelector.customRadio).check();
            cy.get(groupsSelector.granularPermissionResourceContainer)
                .click({ force: true })
                .type(`${datasource}{enter}`);
            cy.get(groupsSelector.confimButton).click({ force: true });
            cy.verifyToastMessage(
                commonSelectors.toastMessage,
                groupsText.createPermissionToast
            );
        });

        cy.get(groupsSelector.groupChip).contains(datasourceNames[0]).click();
        cy.get(groupsSelector.configureDatasourceradio).click();
        cy.get(groupsSelector.confimButton).click();
    });
};

const verifyBuilderAccessAsPerTheConfig = ({
    workspaceSlug,
    email,
    datasourceName1,
    datasourceName2,
    appSlug,
}) => {
    cy.wait(1000);
    cy.apiLogout();
    cy.apiLogin(email);
    cy.visit(workspaceSlug);


    //Verify app edit button number
    cy.get(commonSelectors.dashboardIcon).click();
    cy.get(commonSelectors.appCreateButton).should("not.exist");
    cy.get('.appcard-buttons-wrap [data-cy="edit-button"]').should(
        "have.lengthOf",
        1
    );
    cy.get('.appcard-buttons-wrap [data-cy="launch-button"]').should(
        "have.lengthOf",
        2
    );

    cy.ifEnv("Enterprise", () => {
        //Verify workflow edit button number
        cy.get(commonSelectors.globalWorkFlowsIcon).click();
        cy.get('[data-cy="create-new-workflows-button"]').should("not.exist");
        cy.get('.appcard-buttons-wrap [data-cy="edit-button"]').should(
            "have.lengthOf",
            1
        );
        cy.get('.appcard-buttons-wrap [data-cy="launch-button"]').should(
            "have.lengthOf",
            2
        );

        //Verify datasource access
        cy.get(commonSelectors.globalDataSourceIcon).click();
        cy.get(
            dataSourceSelector.dataSourceNameButton(datasourceName1.toLowerCase())
        ).click();
        cy.get(dataSourceSelector.dsNameInputField).should("be.enabled");
        cy.get(
            dataSourceSelector.dataSourceNameButton(datasourceName2.toLowerCase())
        ).click();
        cy.get(dataSourceSelector.dsNameInputField).should("be.disabled");

        cy.get(dataSourceSelector.commonDsLabelAndCount).click();
        cy.get('[data-cy="rest-api-add-button"]').should("be.disabled");
    });
    //Verify the released app
    cy.visitSlug({
        actualUrl: `${Cypress.config("baseUrl")}/applications/${appSlug}`,
    });
};

describe("Custom Group Granular Access", () => {
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

        cy.defaultWorkspaceLogin();
        cy.intercept("DELETE", "/api/folders/*").as("folderDeleted");
        cy.skipWalkthrough();
        cy.viewport(2400, 2000);
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

        configureAppGranularPermissions(groupName, [data.appName, appName2, appName3]);

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
            { name: "production", hasAccess: true }
        ];
        let appId1;

        // Verify all environments are selected by default for admin group
        verifyEnvironmentTagsInGranularUI("Admin", envTags);
        cy.apiCreateApp(data.appName)
            .then((res) => {
                appId1 = res.body.id;
                cy.apiAddComponentToApp(data.appName, "text1", {}, "Text", `{{globals.environment.name}}`);
                cy.openApp("my-workspace", Cypress.env("workspaceId"), Cypress.env("appId"), '[data-cy="draggable-widget-text1"]');
                createVersionFromDraft("v1");
                appPromote("development", "production");
                releaseApp();
                verifyEnvironmentAccess(environments, "v1");
                cy.visit(`/applications/${appId1}`);
                cy.get(commonWidgetSelector.draggableWidget("text1")).should("contain", "production");
            })
    });

    it("Should verify all environment promotion, preview and release access for Builder", () => {

        const builderEnvTags = ["Development", "Staging", "Released app"];
        const environments = [
            { name: "development", hasAccess: true },
            { name: "staging", hasAccess: true },
            { name: "production", hasAccess: false }
        ];
        let appId1;
        cy.apiFullUserOnboarding(data.firstName, data.email, "builder");
        loginAsAdmin();
        cy.apiDeleteGranularPermission("builder", ["app"]);
        cy.apiCreateApp(data.appName)
            .then((res) => {
                appId1 = res.body.id;
                cy.apiAddComponentToApp(data.appName, "text1", {}, "Text", `{{globals.environment.name}}`);
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
                    [appId1]
                );

                // Scenario A: Baseline builder tags + promote dev->staging and verify access
                openBuilderGranularPermissions("Builder");
                verifyEnvironmentTagsInGranularUI("builder", builderEnvTags);

                loginAsBuilder(data.email);
                openAppAsBuilder(appId1);
                createVersionFromDraft("v1");
                appPromote("development", "staging");
                promoteEnv("staging");
                verifyEnvironmentAccess(environments, { appName: data.appName, canEdit: true, appId: appId1 });

                // Scenario B: Allow production preview by editing granular env selection, then release + verify production access

                loginAsAdmin();
                // remove production access if exists for builder
                cy.apiUpdateEnvironmentPermission("builder", {
                    actions: {
                        canAccessProduction: false,
                    }
                });

                openBuilderGranularPermissions("builder");
                cy.get(groupsSelector.granularAccessPermission).trigger("mouseover");
                cy.get(groupsSelector.editGranularPermissionAccess).click();
                cy.get('[data-cy="environment-label"]').should("be.visible").and("have.text", "Environment");
                validateAndEditEnvironmentsInEditModal(builderEnvTags, "Production");

                loginAsBuilder(data.email);
                openAppAsBuilder(appId1);
                releaseApp();
                verifyEnvironmentAccess([{ name: "production", hasAccess: true }], { appName: data.appName, canEdit: true, appId: appId1 });
                loginAsBuilder(data.email);
                cy.visit(`/applications/${appId1}`);
                cy.get(commonWidgetSelector.draggableWidget("text1")).should("contain", "production");
            })
    })

    it("Should verify edit and view permissions with specific environment access for Builder", () => {
        const appName2 = fake.companyName;

        const groupName1 = fake.firstName.replace(/[^A-Za-z]/g, "");

        let appId1, appId2, groupId1;

        cy.apiCreateApp(data.appName)
            .then((res) => {
                appId1 = res.body.id;
                cy.apiAddComponentToApp(data.appName, "text1", {}, "Text", `{{globals.environment.name}}`);
                return cy.apiCreateApp(appName2);
            })
            .then((res) => {
                appId2 = res.body.id;
                cy.apiAddComponentToApp(appName2, "text1", {}, "Text", `{{globals.environment.name}}`);
            })
            .then(() => {

                // Scenario C: Edit + staging only (no released) -> dev & stag allowed + launch should be restricted

                loginAsAdmin();
                cy.apiDeleteGranularPermission("builder", ["app"]);
                apiCreateGroup(groupName1).then((groupId) => {
                    groupId1 = groupId;
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
                        false
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
                        false
                    );
                    //release app2
                    openAppAsBuilder(appId1);
                    createVersionFromDraft("v1");
                    cy.wait(1000);
                    appPromote("development", "production");
                    releaseApp();

                    //release app2
                    loginAsAdmin();
                    openAppAsBuilder(appId2);
                    createVersionFromDraft("v1");
                    cy.wait(1000);
                    appPromote("development", "production");
                    releaseApp();

                    loginAsBuilder(data.email);
                    openAppAsBuilder(appId1);
                    verifyEnvironmentAccess([{ name: "development", hasAccess: true }], { appName: data.appName, canEdit: true, appId: appId1 });
                    cy.visit(`/applications/${appId1}`);
                    expectRestrictedModal();

                    // Scenario D: Edit + no environment flags -> editor still shows dev, launch released app still works (as per your current assertions)

                    loginAsBuilder(data.email);
                    openAppAsBuilder(appId2);
                    verifyEnvironmentAccess([{ name: "development", hasAccess: true }], { appName: appName2, canEdit: true, appId: appId2 });
                    cy.visit(`/applications/${appId2}`);
                    cy.get(commonWidgetSelector.draggableWidget("text1")).should("contain", "production");

                    // Scenario E: View-only + staging -> staging preview allowed, dev blocked; preview CTA visible

                    loginAsAdmin();
                    cy.apiUpdateEnvironmentPermission(groupName1, {
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
                    }, "Apps");
                    cy.apiUpdateEnvironmentPermission(groupName1, {
                        name: "Apps1",
                        isAll: false,
                        actions: {
                            canEdit: false,
                            canView: true,
                            canAccessDevelopment: false,
                            canAccessStaging: false,
                            canAccessProduction: false,
                            canAccessReleased: false,
                        },
                    }, "Apps1");

                    loginAsBuilder(data.email);
                    // verify app1
                    verifyEnvironmentAccess(
                        [
                            { name: "development", hasAccess: false },
                            { name: "staging", hasAccess: true },
                        ],
                        { appName: data.appName, canEdit: false, appId: appId1 }
                    );
                    loginAsBuilder(data.email);
                    cy.visit("/");
                    cy.get(commonSelectors.appCard(data.appName)).within(() => {
                        cy.get(commonSelectors.appPreviewButton).should("exist").and("be.enabled");
                        cy.get(commonSelectors.applaunchButton).should("exist").and("be.disabled");
                    });
                    cy.visit(`/applications/${appId1}`);
                    expectRestrictedModal();

                    // Scenario F: View-only + no environment -> all previews restricted, have released app access

                    cy.visit("/");
                    verifyEnvironmentAccess(
                        [
                            { name: "development", hasAccess: false },
                            { name: "staging", hasAccess: false },
                        ],
                        { appName: appName2, canEdit: false, appId: appId2, canAllView: false }
                    );
                    cy.visit("/");
                    cy.get(commonSelectors.appCard(appName2)).within(() => {
                        cy.get(commonSelectors.appPreviewButton).should("not.exist");
                        cy.get(commonSelectors.applaunchButton).should("exist").and("be.enabled");
                    });

                    cy.visit(`/applications/${appId2}`);
                    cy.get(commonWidgetSelector.draggableWidget("text1")).should("contain", "production");

                    //Added the default permission for builder
                    loginAsAdmin();
                    cy.apiCreateGranularPermission(
                        "builder",
                        "Apps",
                        "app",
                        {
                            canEdit: false,
                            canView: true,
                            canAccessDevelopment: true,
                            canAccessStaging: true,
                            canAccessProduction: false,
                            canAccessReleased: true,
                        },
                        [appId1],
                        false
                    );
                })
            })
    })

    it("Should verify builder own app dev access and invalid environment preview handling", () => {
        const appName1 = fake.companyName;
        let appId1;
        cy.apiFullUserOnboarding(data.firstName, data.email, "builder");
        loginAsAdmin();
        cy.apiUpdateEnvironmentPermission("builder", {
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
        }, "Apps");
        // Scenario G: View + create + no environment -> can open own app in dev
        loginAsBuilder(data.email);
        cy.apiCreateApp(appName1)
            .then((res) => {
                appId1 = res.body.id;
                cy.apiAddComponentToApp(appName1, "text1", {}, "Text", `{{globals.environment.name}}`);
                cy.visit("/");
                cy.get(commonSelectors.appCard(appName1)).within(() => {
                    cy.get(commonSelectors.appEditButton).should("exist").and("be.enabled");
                    cy.get(commonSelectors.applaunchButton).should("exist").and("be.disabled");
                });

                openAppAsBuilder(appId1);
                verifyEnvironmentAccess(
                    [
                        { name: "development", hasAccess: true },
                    ],
                    { appName: appName1, canEdit: true, appId: appId1 }
                );
                //If environment is not exist for that app
                const previewUrl = `${Cypress.config("baseUrl")}/applications/${appId1}/home?env=staging&version=v1`;

                cy.visit(previewUrl);
                cy.url().should("match", /\/error\/invalid-link?/);
            });
    })

})

const validateAndEditEnvironmentsInEditModal = (envTags, envOption) => {
    cy.get('.css-uzxezq-multiValue').each(($el, index) => {
        cy.wrap($el).should('contain', envTags[index]);
    })
    cy.get('.css-1wy0on6').click();
    cy.get(`[data-cy="environment-check-canAccess${envOption}"]`).check();
    cy.get('.css-1wy0on6').click();
    cy.get('[data-cy="confirm-button"]').should('be.enabled').click();
    cy.verifyToastMessage(commonSelectors.toastMessage,
        "Permission updated successfully");
    cy.get('[data-cy="environment-tags"]').should('contain', envOption);
}
const openBuilderGranularPermissions = (groupName) => {
    navigateToManageGroups();
    cy.get(groupsSelector.groupLink(groupName)).click();
    cy.get(groupsSelector.permissionsLink).click();
    cy.get(groupsSelector.granularLink).click();
};

const loginAsAdmin = () => {
    cy.apiLogout();
    cy.apiLogin();
    cy.visit("/");
};

const loginAsBuilder = (email) => {
    cy.apiLogout();
    cy.apiLogin(email);
    cy.visit("/");
};

const openAppAsBuilder = (appId) => {
    cy.openApp(
        "my-workspace",
        Cypress.env("workspaceId"),
        appId,
        '[data-cy="draggable-widget-text1"]'
    );
};

const expectRestrictedModal = () => {
    cy.url().should("match", /\/error\/restricted(-preview)?/);
    cy.get('[data-cy="modal-header"]')
        .should("be.visible")
        .and("contain.text", "Restricted access");
};
