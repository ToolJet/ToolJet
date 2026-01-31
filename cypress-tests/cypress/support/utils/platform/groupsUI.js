import { commonSelectors } from "Selectors/common";
import { groupsSelector } from "Selectors/manageGroups";
import { groupsText } from "Texts/manageGroups";

export const verifyAdminHelperText = (index = 0) => {
    cy.get(groupsSelector.helperTextAdminAppAccess)
        .eq(index)
        .should("be.visible")
        .and("contain.text", "Admin has all permissions. This is not editable");

    cy.get(groupsSelector.helperTextAdminAppAccess)
        .eq(index)
        .find("a")
        .should("be.visible")
        .and("have.text", "read documentation")
        .and("have.attr", "href")
        .and("include", "docs.tooljet.com/docs/tutorial/manage-users-groups");
};

export const verifyEditUserRoleModal = (userEmail) => {
    cy.get('[data-cy="modal-title"]')
        .last()
        .within(() => {
            cy.get("span").should("be.visible").and("contain.text", "Edit user role");
            cy.get('[data-cy="user-email"]')
                .should("be.visible")
                .and("have.text", userEmail);
        });

    cy.get(groupsSelector.userRoleLabel)
        .should("be.visible")
        .and("have.text", groupsText.userRole);
    cy.get(groupsSelector.warningText)
        .should("be.visible")
        .and("have.text", groupsText.warningText);

    cy.get(".react-select__control").should("be.visible");
    cy.get(".react-select__placeholder")
        .should("be.visible")
        .and("contain.text", "Select new role of user");

    cy.get(groupsSelector.cancelButton)
        .should("be.visible")
        .and("have.text", groupsText.cancelButton)
        .and("be.enabled");

    cy.get(groupsSelector.confimButton)
        .should("be.visible")
        .and("have.text", groupsText.continueButtonText)
        .and("be.disabled");

    cy.get('[data-cy="modal-close-button"]').should("be.visible");
};

export const toggleAllPermissions = (status = ["uncheck", "check"]) => {
    permissions.forEach((permissionSelector) => {
        cy.get(permissionSelector).should("be.visible")[status[0]]();
        cy.verifyToastMessage(
            commonSelectors.toastMessage,
            groupsText.permissionUpdatedToast
        );
        cy.get(permissionSelector).should("be.visible")[status[1]]();
        cy.verifyToastMessage(
            commonSelectors.toastMessage,
            groupsText.permissionUpdatedToast
        );
    });
};

export const verifyDeleteConfirmationModal = () => {
    cy.get(".confirm-dialogue-modal").should("be.visible");
    cy.verifyElement(groupsSelector.deleteMessage, groupsText.deleteMessage);
    cy.get(groupsSelector.yesButton).should("be.visible").and("be.enabled");
    cy.get(groupsSelector.cancelButton).should("be.visible").and("be.enabled");
};

export const verifyGranularEditModal = (role) => {
    cy.wait(1000)
    cy.get(groupsSelector.granularAccessPermission, { timeout: 15000 }).realHover();
    cy.get('[data-cy="edit-apps-granular-access"]').should("be.visible").click();

    cy.get(".modal-base").should("be.visible");

    cy.verifyElement(
        `${groupsSelector.addEditPermissionModalTitle}:eq(2)`,
        groupsText.editPermissionModalTitle
    );
    permissionModal();

    if (role === "builder" || role === "enduser") {
        cy.get(groupsSelector.customRadio).should("be.disabled");
    } else {
        cy.get(groupsSelector.customRadio).should("be.enabled");
    }
    cy.verifyElement(groupsSelector.customLabel, groupsText.customLabel);
    cy.verifyElement(
        groupsSelector.customHelperText,
        groupsText.customHelperText
    );

    cy.verifyElement(groupsSelector.confimButton, groupsText.updateButtonText);
    cy.get(groupsSelector.confimButton).should("be.disabled");
    cy.verifyElement(groupsSelector.cancelButton, groupsText.cancelButton);
    cy.get(groupsSelector.cancelButton).click();

    cy.wait(2000)
    cy.get(groupsSelector.granularAccessPermission).realHover();
    cy.get('[data-cy="edit-apps-granular-access"]').click();

    cy.get(groupsSelector.deletePermissionIcon)
        .should("be.visible")
        .and("be.enabled");
    cy.get(groupsSelector.deletePermissionIcon).click();

    verifyDeleteConfirmationModal();
    cy.contains("Cancel").click();

};

export const verifyGranularAddModal = (role) => {
    cy.ifEnv("Community", () => {
        cy.get(groupsSelector.addAppsButton)
            .should("be.visible")
            .and("be.enabled")
            .click();
    });

    cy.ifEnv("Enterprise", () => {
        cy.get(groupsSelector.addPermissionButton)
            .should("be.visible")
            .and("be.enabled")
            .click();
        cy.get(groupsSelector.addAppButton).click();
    });

    cy.verifyElement(
        `${groupsSelector.addEditPermissionModalTitle}:eq(2)`,
        groupsText.addPermissionModalTitle
    );
    permissionModal();

    if (role === "builder" || role === "enduser") {
        cy.get(groupsSelector.customRadio).should("be.disabled");
    } else {
        cy.get(groupsSelector.customRadio).should("be.enabled");
    }
    cy.verifyElement(groupsSelector.customLabel, groupsText.customLabel);
    cy.verifyElement(
        groupsSelector.customHelperText,
        groupsText.customHelperText
    );

    cy.verifyElement(groupsSelector.confimButton, groupsText.updateButtonText);
    cy.get(groupsSelector.confimButton).should("be.disabled");
    cy.verifyElement(groupsSelector.cancelButton, groupsText.cancelButton);
    cy.get(groupsSelector.cancelButton).click();
};

export const verifyEnduserHelperText = (index = 0) => {
    cy.get(groupsSelector.helperTextAdminAppAccess)
        .eq(index)
        .should("be.visible")
        .and("contain.text", "End-user can only have permission to view apps");

    cy.get(groupsSelector.helperTextAdminAppAccess)
        .eq(index)
        .find("a")
        .should("be.visible")
        .and("have.text", "read documentation")
        .and("have.attr", "href")
        .and("include", "docs.tooljet.com/docs/tutorial/manage-users-groups");
};

export const verifyGranularPermissionModalUI = (
    resourceType,
    isEdit = false,
    permissionName = ""
) => {
    // Permission name section
    cy.get(groupsSelector.permissionNameLabel).verifyVisibleElement(
        "have.text",
        groupsText.permissionNameLabel
    );
    cy.get(groupsSelector.permissionNameInput).should("be.visible");

    if (isEdit) {
        cy.get(groupsSelector.permissionNameInput).should(
            "have.value",
            permissionName
        );
    } else {
        cy.get(groupsSelector.permissionNameInput).should(
            "have.attr",
            "placeholder"
        );
    }

    cy.get(groupsSelector.permissionNameHelperText).verifyVisibleElement(
        "have.text",
        groupsText.permissionNameHelperText
    );

    // Permission section
    cy.get(groupsSelector.permissionLabel).verifyVisibleElement(
        "have.text",
        groupsText.permissionLabel
    );

    if (resourceType === "app") {
        cy.verifyElement(
            groupsSelector.editPermissionLabel,
            groupsText.editPermissionLabel
        );
        cy.verifyElement(
            groupsSelector.editPermissionHelperText,
            groupsText.editPermissionHelperText
        );
        cy.verifyElement(
            groupsSelector.viewPermissionLabel,
            groupsText.viewPermissionLabel
        );
        cy.verifyElement(
            groupsSelector.viewPermissionHelperText,
            groupsText.viewPermissionHelperText
        );

        cy.get(groupsSelector.hidePermissionInput).should("be.visible");
        cy.verifyElement(
            groupsSelector.appHidePermissionModalLabel,
            groupsText.appHideLabel
        );
        cy.verifyElement(
            groupsSelector.appHidePermissionModalHelperText,
            groupsText.appHideHelperText
        );
    }

    if (resourceType === "workflow") {
        cy.verifyElement(groupsSelector.workflowsBuildLabel, "Build");
        cy.verifyElement(
            groupsSelector.workflowsBuildHelperText,
            "Access to workflow builder"
        );
        cy.verifyElement(groupsSelector.workflowsExecuteLabel, "Execute");
        cy.verifyElement(
            groupsSelector.workflowsExecuteHelperText,
            "Only able to execute the workflow"
        );
    }

    if (resourceType === "datasource") {
        cy.verifyElement(groupsSelector.datasourcesConfigureLabel, "Configure");
        cy.verifyElement(
            groupsSelector.datasourcesConfigureHelperText,
            "Access and edit connection detail"
        );
        cy.verifyElement(groupsSelector.datasourcesBuildWithLabel, "Build with");
        cy.verifyElement(
            groupsSelector.datasourcesBuildWithHelperText,
            "Use in apps & workflows"
        );
    }

    // Resources section
    cy.get(groupsSelector.resourceLabel).verifyVisibleElement(
        "have.text",
        groupsText.resourcesheader
    );
    cy.get(groupsSelector.allAppsRadio).should("be.visible");

    if (isEdit) {
        cy.verifyElement(groupsSelector.allAppsLabel, groupsText.allAppsLabel);
    } else {
        cy.verifyElement(groupsSelector.allAppsLabel, groupsText.groupChipText);
    }

    cy.verifyElement(
        groupsSelector.allAppsHelperText,
        groupsText.allAppsHelperText
    );
    cy.get(groupsSelector.customRadio).should("be.visible");
    cy.verifyElement(groupsSelector.customLabel, groupsText.customLabel);
    cy.verifyElement(
        groupsSelector.customHelperText,
        groupsText.customHelperText
    );

    cy.verifyElement(
        groupsSelector.confimButton,
        isEdit ? groupsText.updateButtonText : groupsText.addButtonText
    );
    cy.verifyElement(groupsSelector.cancelButton, groupsText.cancelButton);

    if (isEdit) {
        cy.get(groupsSelector.deletePermissionIcon).should("be.visible");
    }
};

export const verifyGranularPermissionModalStates = (
    resourceType,
    role,
    customStateOverride = null
) => {
    const stateConfig = {
        app: {
            builder: {
                editRadio: { checked: true, enabled: true },
                viewRadio: { checked: false, enabled: true },
                hideCheckbox: { enabled: false },
                allAppsRadio: { checked: true, enabled: false },
                customRadio: { checked: false, enabled: false },
            },
            enduser: {
                editRadio: { checked: false, enabled: false },
                viewRadio: { checked: true, enabled: false },
                hideCheckbox: { enabled: true },
                allAppsRadio: { checked: true, enabled: false },
                customRadio: { checked: false, enabled: false },
            },
            custom: {
                editRadio: { checked: true, enabled: true },
                viewRadio: { checked: false, enabled: true },
                hideCheckbox: { enabled: false },
                allAppsRadio: { checked: true, enabled: true },
                customRadio: { checked: false, enabled: true },
            },
        },
        workflow: {
            builder: {
                buildRadio: { checked: true, enabled: true },
                executeRadio: { checked: false, enabled: true },
                allAppsRadio: { checked: true, enabled: false },
                customRadio: { checked: false, enabled: false },
            },
            enduser: {
                buildRadio: { checked: false, enabled: false },
                executeRadio: { checked: true, enabled: false },
                allAppsRadio: { checked: true, enabled: false },
                customRadio: { checked: false, enabled: false },
            },
            custom: {
                buildRadio: { checked: true, enabled: true },
                executeRadio: { checked: false, enabled: true },
                allAppsRadio: { checked: true, enabled: true },
                customRadio: { checked: false, enabled: true },
            },
        },
        datasource: {
            builder: {
                configureRadio: { checked: true, enabled: true },
                buildWithRadio: { checked: false, enabled: true },
                allAppsRadio: { checked: true, enabled: false },
                customRadio: { checked: false, enabled: false },
            },
            custom: {
                configureRadio: { checked: true, enabled: true },
                buildWithRadio: { checked: false, enabled: true },
                allAppsRadio: { checked: true, enabled: true },
                customRadio: { checked: false, enabled: true },
            },
        },
    };

    // Get the base config
    let config = stateConfig[resourceType][role];

    // If customStateOverride is provided and role is 'custom', merge it with the default
    if (customStateOverride && role === "custom") {
        config = { ...config, ...customStateOverride };
    }

    if (resourceType === "app") {
        cy.get(groupsSelector.editPermissionRadio)
            .should("be.visible")
            .and(config.editRadio.checked ? "be.checked" : "not.be.checked")
            .and(config.editRadio.enabled ? "be.enabled" : "be.disabled");

        cy.get(groupsSelector.viewPermissionRadio)
            .should("be.visible")
            .and(config.viewRadio.checked ? "be.checked" : "not.be.checked")
            .and(config.viewRadio.enabled ? "be.enabled" : "be.disabled");

        cy.get(groupsSelector.hidePermissionInput)
            .should("be.visible")
            .and(config.hideCheckbox.enabled ? "be.enabled" : "be.disabled");
    }

    if (resourceType === "workflow") {
        cy.get(groupsSelector.buildWorkflowradio)
            .should("be.visible")
            .and(config.buildRadio.checked ? "be.checked" : "not.be.checked")
            .and(config.buildRadio.enabled ? "be.enabled" : "be.disabled");

        cy.get(groupsSelector.executeWorkflowradio)
            .should("be.visible")
            .and(config.executeRadio.checked ? "be.checked" : "not.be.checked")
            .and(config.executeRadio.enabled ? "be.enabled" : "be.disabled");
    }

    if (resourceType === "datasource") {
        cy.get(groupsSelector.configureDatasourceradio)
            .should("be.visible")
            .and(config.configureRadio.checked ? "be.checked" : "not.be.checked")
            .and(config.configureRadio.enabled ? "be.enabled" : "be.disabled");

        cy.get(groupsSelector.buildWithDatasourceRadio)
            .should("be.visible")
            .and(config.buildWithRadio.checked ? "be.checked" : "not.be.checked")
            .and(config.buildWithRadio.enabled ? "be.enabled" : "be.disabled");
    }

    cy.get(groupsSelector.allAppsRadio)
        .should("be.visible")
        .and(config.allAppsRadio.checked ? "be.checked" : "not.be.checked")
        .and(config.allAppsRadio.enabled ? "be.enabled" : "be.disabled");

    cy.get(groupsSelector.customRadio)
        .should("be.visible")
        .and(config.customRadio.checked ? "be.checked" : "not.be.checked")
        .and(config.customRadio.enabled ? "be.enabled" : "be.disabled");
};

export const verifyEmptyStates = () => {
    // Users empty state
    cy.get(groupsSelector.usersLink).click();
    cy.get('[data-cy="user-group-search-btn"]').should("be.visible");
    cy.verifyElement(
        groupsSelector.nameTableHeader,
        groupsText.userNameTableHeader
    );
    cy.verifyElement(
        groupsSelector.emailTableHeader,
        groupsText.emailTableHeader
    );

    cy.get(groupsSelector.userEmptyPageIcon).should("be.visible");
    cy.get(groupsSelector.userEmptyPageTitle).verifyVisibleElement(
        "have.text",
        groupsText.userEmptyPageTitle
    );
    cy.get(groupsSelector.userEmptyPageHelperText).verifyVisibleElement(
        "have.text",
        groupsText.userEmptyPageHelperText
    );
};

export const verifyGroupLinks = () => {
    const links = [
        { selector: groupsSelector.usersLink, text: groupsText.usersLink },
        {
            selector: groupsSelector.permissionsLink,
            text: groupsText.permissionsLink,
        },
        { selector: groupsSelector.granularLink, text: "Granular access" },
    ];

    links.forEach(({ selector, text }) => {
        cy.get(selector).verifyVisibleElement("have.text", text);
    });
};

export const commonGroupVerification = () => {
    cy.verifyElement(
        groupsSelector.textDefaultGroup,
        groupsText.textDefaultGroup
    );
    cy.verifyElement(groupsSelector.usersLink, groupsText.usersLink);
    cy.verifyElement(groupsSelector.permissionsLink, groupsText.permissionsLink);
    cy.verifyElement(groupsSelector.granularLink, "Granular access");

    cy.get(groupsSelector.usersLink).click();
    cy.verifyElement(
        groupsSelector.nameTableHeader,
        groupsText.userNameTableHeader
    );
    cy.verifyElement(
        groupsSelector.emailTableHeader,
        groupsText.emailTableHeader
    );
};

export const permissions =
    Cypress.env("environment") === "Community"
        ? [
            groupsSelector.appsCreateCheck,
            groupsSelector.appsDeleteCheck,
            groupsSelector.foldersCreateCheck,
            groupsSelector.workspaceVarCheckbox,
        ]
        : [
            groupsSelector.appsCreateCheck,
            groupsSelector.appsDeleteCheck,
            groupsSelector.appPromoteCheck,
            groupsSelector.appReleaseCheck,
            groupsSelector.workflowsCreateCheck,
            groupsSelector.workflowsDeleteCheck,
            groupsSelector.datasourcesCreateCheck,
            groupsSelector.datasourcesDeleteCheck,
            groupsSelector.foldersCreateCheck,
            groupsSelector.workspaceVarCheckbox,
        ];

export const verifyCheckPermissionStates = (roleType, action = null) => {
    const roleConfig = {
        admin: { checked: true, enabled: false },
        enduser: { checked: false, enabled: false },
        builder: { checked: true, enabled: true },
        custom: { checked: false, enabled: true },
    };

    const config = roleConfig[roleType];

    permissions.forEach((permissionSelector) => {
        cy.get(permissionSelector)
            .should("be.visible")
            .and(config.checked ? "be.checked" : "not.be.checked")
            .and(config.enabled ? "be.enabled" : "be.disabled");
    });
};

export const verifyPermissionCheckBoxLabelsAndHelperTexts = () => {
    const commonPermissions = [
        { selector: groupsSelector.resourcesApps, text: groupsText.resourcesApps },
        {
            selector: groupsSelector.permissionsTableHeader,
            text: groupsText.permissionsTableHeader,
        },
        { selector: groupsSelector.appsCreateLabel, text: groupsText.createLabel },
        {
            selector: groupsSelector.appCreateHelperText,
            text: groupsText.appCreateHelperText,
        },
        { selector: groupsSelector.appsDeleteLabel, text: groupsText.deleteLabel },
        {
            selector: groupsSelector.appDeleteHelperText,
            text: groupsText.appDeleteHelperText,
        },
        {
            selector: groupsSelector.resourcesFolders,
            text: groupsText.resourcesFolders,
        },
        {
            selector: groupsSelector.foldersCreateLabel,
            text: groupsText.folderCreateLabel,
        },
        {
            selector: groupsSelector.foldersHelperText,
            text: groupsText.folderHelperText,
        },
        {
            selector: groupsSelector.resourcesWorkspaceVar,
            text: groupsText.resourcesWorkspaceVar,
        },
        {
            selector: groupsSelector.workspaceCreateLabel,
            text: groupsText.workspaceCreateLabel,
        },
        {
            selector: groupsSelector.workspaceHelperText,
            text: groupsText.workspaceHelperText,
        },
    ];

    commonPermissions.forEach(({ selector, text }) => {
        cy.verifyElement(selector, text);
    });

    cy.ifEnv("Enterprise", () => {
        const enterprisePermissions = [
            { selector: groupsSelector.appPromoteLabel, text: "Promote" },
            {
                selector: groupsSelector.appPromoteHelperText,
                text: "Promote any app in this workspace",
            },
            { selector: groupsSelector.appReleaseLabel, text: "Release" },
            {
                selector: groupsSelector.appReleaseHelperText,
                text: "Release any app in this workspace",
            },
            { selector: groupsSelector.workflowsCreateLabel, text: "Create" },
            {
                selector: groupsSelector.workflowsCreateHelperText,
                text: "Create workflow in this workspace",
            },
            { selector: groupsSelector.workflowsDeleteLabel, text: "Delete" },
            {
                selector: groupsSelector.workflowsDeleteHelperText,
                text: "Delete any workflow in this workspace",
            },
            { selector: groupsSelector.datasourcesCreateLabel, text: "Create" },
            {
                selector: groupsSelector.datasourcesCreateHelperText,
                text: "Create data source connections in this workspace",
            },
            { selector: groupsSelector.datasourcesDeleteLabel, text: "Delete" },
            {
                selector: groupsSelector.datasourcesDeleteHelperText,
                text: "Delete any data source in this workspace",
            },
        ];

        enterprisePermissions.forEach(({ selector, text }) => {
            cy.verifyElement(selector, text);
        });
    });
};

export const verifyGranularAccessByRole = (role) => {
    const roleConfig = {
        admin: {
            appEditRadio: { checked: true, enabled: false },
            appViewRadio: { checked: false, enabled: false },
            appHideCheckbox: { enabled: false },
            workflowBuildRadio: { checked: true, enabled: false },
            workflowExecuteRadio: { checked: false, enabled: false },
            datasourceConfigureRadio: { checked: true, enabled: false },
            datasourceBuildWithRadio: { checked: false, enabled: false },
            addButtonEnabled: false,
            verifyHelperTexts: true,
            hasDatasource: true,
        },
        builder: {
            appEditRadio: { checked: true, enabled: true },
            appViewRadio: { checked: false, enabled: true },
            appHideCheckbox: { enabled: false },
            workflowBuildRadio: { checked: true, enabled: true },
            workflowExecuteRadio: { checked: false, enabled: true },
            datasourceConfigureRadio: { checked: true, enabled: true },
            datasourceBuildWithRadio: { checked: false, enabled: true },
            addButtonEnabled: true,
            verifyHelperTexts: false,
            hasDatasource: true,
        },
        enduser: {
            appEditRadio: { checked: false, enabled: false },
            appViewRadio: { checked: true, enabled: false },
            appHideCheckbox: { enabled: true },
            workflowBuildRadio: { checked: false, enabled: false },
            workflowExecuteRadio: { checked: true, enabled: false },
            addButtonEnabled: true,
            verifyHelperTexts: false,
            hasDatasource: false,
        },
    };

    const config = roleConfig[role];

    cy.get(groupsSelector.granularLink).click();

    if (role === "admin") {
        cy.verifyElement(
            groupsSelector.nameTableHeader,
            groupsText.nameTableHeader
        );
        cy.verifyElement(
            groupsSelector.permissionsTableHeader,
            groupsText.granularAccessPermissionHeader
        );
        cy.verifyElement(
            `${groupsSelector.resourceHeader}:eq(1)`,
            groupsText.resourcesTableHeader
        );
    }

    cy.verifyElement(groupsSelector.appsText, "  Apps");

    cy.get(groupsSelector.appEditRadio)
        .should("be.visible")
        .and(config.appEditRadio.checked ? "be.checked" : "not.be.checked")
        .and(
            config.appEditRadio.enabled ? "be.enabled" : "have.attr",
            config.appEditRadio.enabled ? "" : "disabled"
        );

    cy.get(groupsSelector.appViewRadio)
        .should("be.visible")
        .and(
            config.appViewRadio.enabled ? "be.enabled" : "have.attr",
            config.appViewRadio.enabled ? "" : "disabled"
        );

    cy.get(groupsSelector.appHideCheckbox)
        .should("be.visible")
        .and(config.appHideCheckbox.enabled ? "be.enabled" : "be.disabled");

    if (config.verifyHelperTexts) {
        cy.verifyElement(groupsSelector.appEditLabel, groupsText.appEditLabelText);
        cy.verifyElement(
            groupsSelector.appEditHelperText,
            groupsText.appEditHelperText
        );
        cy.verifyElement(groupsSelector.appViewLabel, groupsText.appViewLabel);
        cy.verifyElement(
            groupsSelector.appViewHelperText,
            groupsText.appViewHelperText
        );
        cy.verifyElement(
            groupsSelector.appHideHelperText,
            groupsText.appHideHelperText
        );
    }

    cy.verifyElement(groupsSelector.groupChip("All apps"), "All apps");

    cy.ifEnv("Community", () => {
        cy.get(groupsSelector.addAppButton).should(
            config.addButtonEnabled ? "be.enabled" : "be.disabled"
        );
    });

    cy.ifEnv("Enterprise", () => {
        cy.verifyElement(groupsSelector.workflowsText, "Workflows");

        cy.get(groupsSelector.workflowsBuildRadio)
            .should("be.visible")
            .and(config.workflowBuildRadio.checked ? "be.checked" : "not.be.checked")
            .and(
                config.workflowBuildRadio.enabled ? "be.enabled" : "have.attr",
                config.workflowBuildRadio.enabled ? "" : "disabled"
            );

        cy.get(groupsSelector.workflowsExecuteRadio)
            .should("be.visible")
            .and(
                config.workflowExecuteRadio.enabled ? "be.enabled" : "have.attr",
                config.workflowExecuteRadio.enabled ? "" : "disabled"
            );

        if (config.verifyHelperTexts) {
            cy.verifyElement(groupsSelector.workflowsBuildLabel, "Build");
            cy.verifyElement(
                groupsSelector.workflowsBuildHelperText,
                "Access to workflow builder"
            );
            cy.verifyElement(groupsSelector.workflowsExecuteLabel, "Execute");
            cy.verifyElement(
                groupsSelector.workflowsExecuteHelperText,
                "Only able to execute the workflow"
            );
        }

        cy.verifyElement(
            groupsSelector.groupChip("All workflows"),
            "All workflows"
        );

        if (config.hasDatasource) {
            cy.verifyElement(groupsSelector.datasourcesText, "  Data sources");

            cy.get(groupsSelector.datasourcesConfigureRadio)
                .should("be.visible")
                .and(
                    config.datasourceConfigureRadio.checked
                        ? "be.checked"
                        : "not.be.checked"
                )
                .and(
                    config.datasourceConfigureRadio.enabled ? "be.enabled" : "have.attr",
                    config.datasourceConfigureRadio.enabled ? "" : "disabled"
                );

            cy.get(groupsSelector.datasourcesBuildWithRadio)
                .should("be.visible")
                .and(
                    config.datasourceBuildWithRadio.enabled ? "be.enabled" : "have.attr",
                    config.datasourceBuildWithRadio.enabled ? "" : "disabled"
                );

            if (config.verifyHelperTexts) {
                cy.verifyElement(groupsSelector.datasourcesConfigureLabel, "Configure");
                cy.verifyElement(
                    groupsSelector.datasourcesConfigureHelperText,
                    "Access & edit connection details"
                );
                cy.verifyElement(
                    groupsSelector.datasourcesBuildWithLabel,
                    "Build with"
                );
                cy.verifyElement(
                    groupsSelector.datasourcesBuildWithHelperText,
                    "Use in apps & workflows"
                );
            }

            cy.verifyElement(
                groupsSelector.groupChip("All data source"),
                "All data sources"
            );
        }

        cy.verifyElement(groupsSelector.addPermissionButton, "Add permission");
        cy.get(groupsSelector.addPermissionButton).should(
            config.addButtonEnabled ? "be.enabled" : "be.disabled"
        );
    });
};

export const permissionModal = () => {
    cy.verifyElement(
        groupsSelector.permissionNameLabel,
        groupsText.permissionNameLabel
    );
    cy.verifyElement(
        groupsSelector.permissionNameHelperText,
        groupsText.permissionNameHelperText
    );

    cy.verifyElement(groupsSelector.permissionLabel, groupsText.permissionLabel);
    cy.verifyElement(
        groupsSelector.editPermissionLabel,
        groupsText.editPermissionLabel
    );
    cy.verifyElement(
        groupsSelector.editPermissionHelperText,
        groupsText.editPermissionHelperText
    );

    cy.verifyElement(
        groupsSelector.viewPermissionLabel,
        groupsText.viewPermissionLabel
    );
    cy.verifyElement(
        groupsSelector.viewPermissionHelperText,
        groupsText.viewPermissionHelperText
    );

    cy.get(groupsSelector.hidePermissionInput).should("be.visible");
    cy.verifyElement(groupsSelector.resourceLabel, groupsText.resourcesheader);
    cy.get(groupsSelector.resourceContainer).should("be.visible");
    cy.get(groupsSelector.allAppsRadio).should("be.visible").and("be.checked");
    cy.verifyElement(groupsSelector.allAppsLabel, groupsText.allAppsLabel);
    cy.verifyElement(
        groupsSelector.allAppsHelperText,
        groupsText.allAppsHelperText
    );
};

export const verifyUserRow = (name, email) => {
    cy.get('[data-cy="avatar-image"]').should("be.visible");
    cy.get('[data-cy="user-name"]')
        .should("be.visible")
        .and("contain.text", name);
    cy.get('[data-cy="user-email"]').should("be.visible").and("have.text", email);
};

export const granularPermissionEmptyState = () => {
    cy.get(groupsSelector.granularLink).click();

    cy.get(groupsSelector.granularEmptyPageIcon).should("be.visible");
    cy.get(groupsSelector.emptyPagePermissionTitle).verifyVisibleElement(
        "have.text",
        groupsText.emptyPagePermissionTitle
    );
    cy.get(groupsSelector.emptyPagePermissionHelperText).verifyVisibleElement(
        "have.text",
        groupsText.emptyPagePermissionHelperText
    );
}