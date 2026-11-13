import { commonSelectors } from "Selectors/common";
import { dataSourceSelector } from "Selectors/marketplace/dataSource";
import { groupsSelector } from "Selectors/platform/manageGroups";
import { navigateToManageGroups } from "Support/utils/common";
import {
    createGroupsAndAddUserInGroup,
    setupWorkspaceAndInviteUser,
} from "Support/utils/manageGroups";
import { getGroupPermissionInput } from "Support/utils/userPermissions";
import { groupsText } from "Texts/platform/manageGroups";

export const createAndReleaseApp = (
    appName,
    componentDetails = {},
    appSlug,
    workspaceSlug,
) => {
    const {
        componentName = "text1",
        layoutConfig = {},
        componentType = "Text",
        componentValue,
    } = componentDetails;

    cy.apiCreateApp(appName);

    if (componentValue === undefined) {
        cy.apiAddComponentToApp(
            appName,
            componentName,
            layoutConfig,
            componentType,
        );
    } else {
        cy.apiAddComponentToApp(
            appName,
            componentName,
            layoutConfig,
            componentType,
            componentValue,
        );
    }

    cy.apiGetAppIdByName(appName).then((appId) => {
        const slugToUse = workspaceSlug || Cypress.env("workspaceSlug");
        cy.openApp(
            slugToUse,
            Cypress.env("workspaceId"),
            appId,
            '[data-cy="draggable-widget-text1"]',
        );
    });

    cy.apiPublishDraftVersion("v1");
    cy.apiPromoteAppVersion().then(() => {
        const stagingId = Cypress.env("stagingEnvId");
        cy.apiPromoteAppVersion(stagingId);
    });
    cy.apiReleaseApp(appName);

    if (appSlug) {
        cy.apiAddAppSlug(appName, appSlug);
    }

    cy.go("back");
};

export const createWorkspaceOnboardUser = ({
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
        "builder",
    );

    cy.apiLogin();
    cy.visit(data.workspaceSlug);

    //Remove builder permissions and delete granular access
    cy.apiUpdateGroupPermission(
        "builder",
        getGroupPermissionInput(isEnterprise, false),
    );
    cy.apiDeleteGranularPermission("builder", []);

    navigateToManageGroups();
    createGroupsAndAddUserInGroup(groupName, data.email);

    cy.apiCreateApp(data.appName);
    cy.apiCreateApp(appName2);
    createAndReleaseApp(appName3, {}, appSlug, data.workspaceSlug);
};

export const configureAppGranularPermissions = (groupName, apps) => {
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
        cy.get(groupsSelector.granularPermissionResourceContainer)
            .click({ force: true })
            .type(`${app}{enter}`);
        cy.get(groupsSelector.confimButton).click({ force: true });
        cy.verifyToastMessage(
            commonSelectors.toastMessage,
            groupsText.createPermissionToast,
        );
    });

    cy.get(groupsSelector.groupChip).contains(apps[0]).click();
    cy.get(groupsSelector.editPermissionRadio).click();
    cy.get(groupsSelector.confimButton).click();

    cy.get(groupsSelector.groupChip).contains(apps[2]).click();
    cy.get(groupsSelector.hidePermissionInput).check();
    cy.get(groupsSelector.confimButton).click();
};

export const configureEnterpriseGranularPermissions = ({
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
                [{ key: "url", value: "https://jsonplaceholder.typicode.com/users" }],
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
                groupsText.createPermissionToast,
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
                groupsText.createPermissionToast,
            );
        });

        cy.get(groupsSelector.groupChip).contains(datasourceNames[0]).click();
        cy.get(groupsSelector.configureDatasourceradio).click();
        cy.get(groupsSelector.confimButton).click();
    });
};

export const verifyBuilderAccessAsPerTheConfig = ({
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
        1,
    );
    cy.get('.appcard-buttons-wrap [data-cy="launch-button"]').should(
        "have.lengthOf",
        2,
    );

    cy.ifEnv("Enterprise", () => {
        //Verify workflow edit button number
        cy.get(commonSelectors.globalWorkFlowsIcon).click();
        cy.get('[data-cy="create-new-workflows-button"]').should("not.exist");
        cy.get('.appcard-buttons-wrap [data-cy="edit-button"]').should(
            "have.lengthOf",
            1,
        );
        cy.get('.appcard-buttons-wrap [data-cy="launch-button"]').should(
            "have.lengthOf",
            2,
        );

        //Verify datasource access
        cy.get(commonSelectors.globalDataSourceIcon).click();
        cy.get(
            dataSourceSelector.dataSourceNameButton(datasourceName1.toLowerCase()),
        ).click();
        cy.get(dataSourceSelector.dsNameInputField).should("be.enabled");
        cy.get(
            dataSourceSelector.dataSourceNameButton(datasourceName2.toLowerCase()),
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

export const validateAndEditEnvironmentsInEditModal = (envTags, envOption) => {
    cy.get(".css-1dyz3mf .css-k3krtu-multiValue").each(($el, index) => {
        cy.wrap($el).should("contain", envTags[index]);
    });
    cy.get(".css-1wy0on6").click();
    cy.get(`[data-cy="environment-check-canAccess${envOption}"]`).check();
    cy.get(".css-1wy0on6").click();
    cy.get('[data-cy="confirm-button"]').should("be.enabled").click();
    cy.verifyToastMessage(
        commonSelectors.toastMessage,
        "Permission updated successfully",
    );
    cy.get('[data-cy="environment-tags"]').should("contain", envOption);
};

export const openGranularPermissions = (groupName) => {
    navigateToManageGroups();
    cy.get(groupsSelector.groupLink(groupName)).click();
    cy.get(groupsSelector.permissionsLink).click();
    cy.get(groupsSelector.granularLink).click();
};

export const createSpecWorkspace = (prefix) => {
    const workspaceName = `${prefix}-${Date.now()}`;
    cy.apiLogin();
    return cy.apiCreateWorkspace(workspaceName, workspaceName).then((res) => {
        const workspaceId = res.body.organization_id;
        Cypress.env("specWorkspaceId", workspaceId);
        Cypress.env("workspaceSlug", workspaceName);
        cy.apiLogin("dev@tooljet.io", "password", workspaceId);
        cy.visit(`/${workspaceName}`);
        cy.get(commonSelectors.homePageLogo, { timeout: 50000 }).should("be.visible");
    });
};

export const archiveSpecWorkspace = () => {
    cy.apiLogin();
    cy.then(() => cy.apiArchiveWorkspace(Cypress.env("specWorkspaceId")));
};

export const loginAsAdmin = () => {
    cy.apiLogout();
    cy.apiLogin("dev@tooljet.io", "password", Cypress.env("specWorkspaceId"));
    cy.visit(`/${Cypress.env("workspaceSlug")}`);
};

export const loginAsUser = (email) => {
    cy.apiLogout();
    cy.apiLogin(email, "password", Cypress.env("specWorkspaceId"));
    cy.visit(`/${Cypress.env("workspaceSlug")}`);
};

export const openAppAsBuilder = (appId) => {
    cy.openApp(
        Cypress.env("workspaceSlug"),
        Cypress.env("workspaceId"),
        appId,
        '[data-cy="draggable-widget-text1"]',
    );
};

export const expectRestrictedModal = () => {
    cy.url().should("match", /\/error\/restricted(-preview)?/);
    cy.get('[data-cy="modal-header"]')
        .should("be.visible")
        .and("contain.text", "Restricted access");
};

export const validateAppCardCTAs = (appName, edit, preview, launch, launchEnabled = true) => {
    cy.get(commonSelectors.appCard(appName)).within(() => {
        if (edit)
            cy.get(commonSelectors.appEditButton).should("exist").and("be.enabled");
        else
            cy.get(commonSelectors.appPreviewButton)
                .should(preview ? "exist" : "not.exist")
                .and(preview ? "be.enabled" : "not.exist");

        cy.get(commonSelectors.applaunchButton)
            .should(launch ? "exist" : "not.exist")
            .and(launch ? (launchEnabled ? "be.enabled" : "be.disabled") : "not.exist");
    });
};
