import { fake } from "Fixtures/fake";
import { commonSelectors } from "Selectors/common";
import { groupsSelector } from "Selectors/manageGroups";
import {
    navigateToManageGroups
} from "Support/utils/common";
import {
    createGroupsAndAddUserInGroup,
    setupWorkspaceAndInviteUser
} from "Support/utils/manageGroups";
import {
    getGroupPermissionInput
} from "Support/utils/userPermissions";
import { groupsText } from "Texts/manageGroups";
import { dataSourceSelector } from "Selectors/dataSource";

describe("Manage Groups", () => {
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


    it.only("should verify the granular permissions in custom groups", () => {
        const groupName = fake.firstName.replace(/[^A-Za-z]/g, "");
        const appName2 = fake.companyName;
        const appName3 = fake.companyName;
        const appSlug = appName3.toLowerCase().replace(/\s+/g, "-");
        const workflowName1 = `${data.appName}-workflow`;
        const workflowName2 = `${appName2}-workflow`;
        const datasourceName1 = `${data.appName}-datasource`;
        const datasourceName2 = `${appName2}-datasource`;

        setupWorkspaceAndInviteUser(
            data.workspaceName,
            data.workspaceSlug,
            data.firstName,
            data.email,
            'builder'
        );

        cy.apiLogin();
        cy.visit(data.workspaceSlug);
        cy.apiUpdateGroupPermission(
            "builder",
            getGroupPermissionInput(isEnterprise, false)
        );

        cy.apiDeleteGranularPermission("builder", []);

        navigateToManageGroups();
        createGroupsAndAddUserInGroup(groupName, data.email);

        cy.apiCreateApp(data.appName);
        cy.apiCreateApp(appName2);

        // App Hide from dashboard
        cy.apiCreateApp(appName3);
        cy.openApp();
        cy.apiAddComponentToApp(appName3, "text1");
        cy.apiPromoteAppVersion().then(() => {
            const stagingId = Cypress.env("stagingEnvId");
            cy.apiPromoteAppVersion(Cypress.env("stagingEnvId"));
        });
        cy.apiReleaseApp(appName3);
        cy.apiAddAppSlug(appName3, appSlug);
        cy.go("back");

        // Configure app permissions
        navigateToManageGroups();
        cy.get(groupsSelector.groupLink(groupName)).click();
        cy.get(groupsSelector.granularLink).click();

        // Setup permissions for both apps
        [data.appName, appName2, appName3].forEach((app) => {
            cy.ifEnv("Community", () => {
                cy.get(groupsSelector.addAppsButton).click();
            });
            cy.ifEnv("Enterprise", () => {
                cy.get(groupsSelector.addPermissionButton).click();
                cy.get(groupsSelector.addAppButton).click();
            });

            cy.clearAndType(groupsSelector.permissionNameInput, app);
            cy.get(groupsSelector.customradio).check();
            cy.get(".css-1gfides").click({ force: true }).type(`${app}{enter}`);
            cy.get(groupsSelector.confimButton).click({ force: true });
            cy.verifyToastMessage(
                commonSelectors.toastMessage,
                groupsText.createPermissionToast
            );
        });

        cy.get(groupsSelector.groupChip).contains(data.appName).click();
        cy.get(groupsSelector.editPermissionRadio).click();
        cy.get(groupsSelector.confimButton).click();

        //To hide app
        cy.get(groupsSelector.groupChip).contains(appName3).click();
        cy.get(groupsSelector.hidePermissionInput).check();
        cy.get(groupsSelector.confimButton).click();

        cy.ifEnv("Enterprise", () => {

            cy.apiCreateWorkflow(workflowName1);
            cy.apiCreateWorkflow(workflowName2);

            cy.apiCreateGDS(
                `${Cypress.env("server_host")}/api/data-sources`,
                datasourceName1,
                "restapi",
                [{ key: "url", value: "https://jsonplaceholder.typicode.com/users" }]
            );

            cy.apiCreateGDS(
                `${Cypress.env("server_host")}/api/data-sources`,
                datasourceName2,
                "restapi",
                [{ key: "url", value: "https://jsonplaceholder.typicode.com/users" }]
            );

            cy.get(groupsSelector.groupLink('Builder')).click();
            cy.get(groupsSelector.groupLink(groupName)).click();
            cy.get(groupsSelector.granularLink).click();

            [workflowName1, workflowName2].forEach((workflow) => {
                cy.get(groupsSelector.addPermissionButton).click();
                cy.get(groupsSelector.addWorkflowButton).click();

                cy.clearAndType(groupsSelector.permissionNameInput, workflow);
                cy.get(groupsSelector.customradio).check();
                cy.get(".css-1gfides")
                    .click({ force: true })
                    .type(`${workflow}{enter}`);
                cy.get(groupsSelector.confimButton).click({ force: true });
                cy.verifyToastMessage(
                    commonSelectors.toastMessage,
                    groupsText.createPermissionToast
                );
            });
            cy.get(groupsSelector.groupChip).contains(workflowName1).click();
            cy.get(groupsSelector.buildWorkflowradio).click();
            cy.get(groupsSelector.confimButton).click();

            [datasourceName1, datasourceName2].forEach((datasource) => {
                cy.get(groupsSelector.addPermissionButton).click();
                cy.get(groupsSelector.addDatasourceButton).click();

                cy.clearAndType(groupsSelector.permissionNameInput, datasource);
                cy.get(groupsSelector.customradio).check();
                cy.get(".css-1gfides")
                    .click({ force: true })
                    .type(`${datasource}{enter}`);
                cy.get(groupsSelector.confimButton).click({ force: true });
                cy.verifyToastMessage(
                    commonSelectors.toastMessage,
                    groupsText.createPermissionToast
                );
            });
            cy.get(groupsSelector.groupChip).contains(datasourceName1).click();
            cy.get(groupsSelector.configureDatasourceradio).click();
            cy.get(groupsSelector.confimButton).click();
        });

        // Verify as builder
        cy.wait(1000);
        cy.apiLogout();
        cy.apiLogin(data.email);
        cy.visit(data.workspaceSlug);

        cy.get('.appcard-buttons-wrap [data-cy="edit-button"]').should(
            "have.lengthOf",
            1
        );
        cy.get('.appcard-buttons-wrap [data-cy="launch-button"]').should(
            "have.lengthOf",
            2
        );

        cy.ifEnv("Enterprise", () => {
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

            cy.get(commonSelectors.globalDataSourceIcon).click();
            cy.get(dataSourceSelector.dataSourceNameButton(datasourceName1.toLowerCase())).click();
            cy.get(dataSourceSelector.dsNameInputField).should('be.enabled');
            cy.get(dataSourceSelector.dataSourceNameButton(datasourceName2.toLowerCase())).click();
            cy.get(dataSourceSelector.dsNameInputField).should('be.disabled')
            cy.get(dataSourceSelector.commonDsLabelAndCount).click();
            cy.get('[data-cy="rest-api-add-button"]').should("be.disabled");
        });


        //Visit hidden app url
        cy.visitSlug({
            actualUrl: `${Cypress.config("baseUrl")}/applications/${appSlug}`,
        });


    });

});
