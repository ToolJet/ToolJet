import { fake } from "Fixtures/fake";
import { commonSelectors } from "Selectors/common";
import { dataSourceSelector } from "Selectors/dataSource";
import { groupsSelector } from "Selectors/manageGroups";
import { navigateToManageGroups } from "Support/utils/common";
import {
    createGroupsAndAddUserInGroup,
    setupWorkspaceAndInviteUser,
} from "Support/utils/manageGroups";
import { getGroupPermissionInput } from "Support/utils/userPermissions";
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
        cy.get(".css-1gfides").click({ force: true }).type(`${app}{enter}`);
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
        cy.get(groupsSelector.groupLink(groupName)).click();
        cy.get(groupsSelector.granularLink).click();

        //Create workflow granular access
        workflowNames.forEach((workflow) => {
            cy.get(groupsSelector.addPermissionButton).click();
            cy.get(groupsSelector.addWorkflowButton).click();
            cy.clearAndType(groupsSelector.permissionNameInput, workflow);
            cy.get(groupsSelector.customRadio).check();
            cy.get(".css-1gfides")
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
            cy.get(".css-1gfides")
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

    it("should verify the granular permissions in custom groups", () => {
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
});
