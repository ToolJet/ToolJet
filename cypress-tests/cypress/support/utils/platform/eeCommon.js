import {
    commonEeSelectors,
    ssoEeSelector,
    instanceSettingsSelector,
    multiEnvSelector,
    workspaceSelector,
} from "Selectors/eeCommon";
import { ssoEeText } from "Texts/eeCommon";
import { commonSelectors, commonWidgetSelector } from "Selectors/common";
import * as common from "Support/utils/common";
import { groupsSelector } from "Selectors/manageGroups";
import { groupsText } from "Texts/manageGroups";
import { eeGroupsSelector } from "Selectors/eeCommon";
import { eeGroupsText } from "Texts/eeCommon";
import {
    // verifyOnboardingQuestions,
    // verifyCloudOnboardingQuestions,
    fetchAndVisitInviteLink,
} from "Support/utils/manageUsers";
import { commonText } from "Texts/common";
import { dashboardText } from "Texts/dashboard";
import { usersText } from "Texts/manageUsers";
import { usersSelector } from "Selectors/manageUsers";
import { ssoSelector } from "Selectors/manageSSO";
import { ssoText } from "Texts/manageSSO";
// import { appPromote } from "Support/utils/multiEnv";

export const oidcSSOPageElements = () => {
    cy.get(ssoEeSelector.oidcToggle).click();
    cy.get(ssoSelector.saveButton).eq(1).click();
    cy.get('[data-cy="modal-title"]').verifyVisibleElement(
        "have.text",
        "Enable OpenID Connect"
    );
    cy.get('[data-cy="modal-close-button"]').should("be.visible");
    cy.get('[data-cy="modal-message"]').verifyVisibleElement(
        "have.text",
        "Enabling OpenID Connect at the workspace level will override any OpenID Connect configurations set at the instance level."
    );
    cy.get('[data-cy="confirmation-text"]').verifyVisibleElement(
        "have.text",
        "Are you sure you want to continue?"
    );
    cy.get('[data-cy="cancel-button"]')
        .eq(2)
        .verifyVisibleElement("have.text", "Cancel");
    cy.get('[data-cy="enable-button"]').verifyVisibleElement(
        "have.text",
        "Enable"
    );

    cy.get('[data-cy="cancel-button"]').eq(2).click();
    cy.get('[data-cy="status-label"]').verifyVisibleElement(
        "have.text",
        ssoText.disabledLabel
    );

    cy.get(ssoEeSelector.oidcToggle).click();
    cy.get(ssoSelector.saveButton).eq(1).click();
    cy.get('[data-cy="enable-button"]').click();

    cy.verifyToastMessage(
        commonSelectors.toastMessage,
        ssoText.toggleUpdateToast("OpenID")
    );

    cy.get(ssoEeSelector.statusLabel).verifyVisibleElement(
        "have.text",
        ssoEeText.enabledLabel
    );

    cy.get('[data-cy="redirect-url-label"]').verifyVisibleElement(
        "have.text",
        ssoText.redirectUrlLabel
    );
    cy.get('[data-cy="redirect-url"]').should("be.visible");
    cy.get('[data-cy="copy-icon"]').should("be.visible");

    cy.get(ssoEeSelector.oidcToggle).click();
    cy.get(ssoSelector.saveButton).eq(1).click();
    // cy.get('[data-cy="enable-button"]').click();
    cy.verifyToastMessage(
        commonSelectors.toastMessage,
        ssoText.toggleUpdateToast("OpenID")
    );
    cy.get(ssoSelector.statusLabel).verifyVisibleElement(
        "have.text",
        ssoText.disabledLabel
    );

    cy.get(ssoEeSelector.oidcToggle).click();
    cy.clearAndType(ssoEeSelector.nameInput, ssoEeText.testName);
    cy.clearAndType(ssoEeSelector.clientIdInput, ssoEeText.testclientId);
    cy.clearAndType(ssoEeSelector.clientSecretInput, ssoEeText.testclientSecret);
    cy.clearAndType(ssoEeSelector.WellKnownUrlInput, ssoEeText.testWellknownUrl);
    cy.get(ssoSelector.saveButton).eq(1).click();
    cy.get('[data-cy="enable-button"]').click();
    cy.verifyToastMessage(
        commonSelectors.toastMessage,
        ssoText.toggleUpdateToast("OpenID")
    );
    cy.get(ssoEeSelector.nameInput).should("have.value", ssoEeText.testName);
    cy.get(ssoEeSelector.clientIdInput).should(
        "have.value",
        ssoEeText.testclientId
    );
    cy.get(ssoEeSelector.clientSecretInput).should(
        "have.value",
        ssoEeText.testclientSecret
    );
    cy.get(ssoEeSelector.WellKnownUrlInput).should(
        "have.value",
        ssoEeText.testWellknownUrl
    );
};

export const resetDsPermissions = () => {
    common.navigateToManageGroups();
    cy.wait(200);
    cy.get(groupsSelector.permissionsLink).click();

    cy.get(groupsSelector.appsCreateCheck).then(($el) => {
        if ($el.is(":checked")) {
            cy.get(groupsSelector.appsCreateCheck).uncheck();
        }
    });
    cy.get(eeGroupsSelector.dsCreateCheck).then(($el) => {
        if ($el.is(":checked")) {
            cy.get(eeGroupsSelector.dsCreateCheck).uncheck();
        }
    });
    cy.get(eeGroupsSelector.dsDeleteCheck).then(($el) => {
        if ($el.is(":checked")) {
            cy.get(eeGroupsSelector.dsDeleteCheck).uncheck();
        }
    });
};

export const deleteAssignedDatasources = () => {
    common.navigateToManageGroups();
    cy.get('[data-cy="datasource-link"]').click();
    cy.get("body").then(($body) => {
        const removeAllButtons = $body.find('[data-cy="remove-button"]');
        if (removeAllButtons.length > 0) {
            cy.get('[data-cy="remove-button"]').click({ multiple: true });
        }
    });
};

export const userSignUp = (fullName, email, workspaceName) => {
    const verificationFunction =
        Cypress.env("environment") === "Enterprise"
            ? verifyOnboardingQuestions
            : verifyCloudOnboardingQuestions;

    let invitationLink = "";
    cy.visit("/");
    cy.wait(500);
    cy.get(commonSelectors.createAnAccountLink).realClick();
    cy.clearAndType(commonSelectors.nameInputField, fullName);
    cy.clearAndType(commonSelectors.emailInputField, email);
    cy.clearAndType(commonSelectors.passwordInputField, commonText.password);
    cy.get(commonSelectors.signUpButton).click();

    cy.wait(500);
    cy.task("dbConnection", {
        dbconfig: Cypress.env("app_db"),
        sql: `select invitation_token from users where email='${email}';`,
    }).then((resp) => {
        invitationLink = `/invitations/${resp.rows[0].invitation_token}`;
        cy.visit(invitationLink);
        cy.get(commonSelectors.setUpToolJetButton).click();
        cy.wait(4000);

        verificationFunction(fullName, workspaceName);
    });
};

export const allowPersonalWorkspace = (allow = true) => {
    const value = allow ? "true" : "false";
    cy.task("dbConnection", {
        dbconfig: Cypress.env("app_db"),
        sql: `UPDATE instance_settings SET value = '${value}' WHERE key = 'ALLOW_PERSONAL_WORKSPACE';`,
    });
};

export const addNewUserEE = (firstName, email) => {
    common.navigateToManageUsers();
    cy.get(usersSelector.buttonAddUsers).click();
    cy.get(commonSelectors.inputFieldFullName).type(firstName);
    cy.get(commonSelectors.inputFieldEmailAddress).type(email);

    cy.get(usersSelector.buttonInviteUsers).click();
    cy.verifyToastMessage(
        commonSelectors.toastMessage,
        usersText.userCreatedToast
    );
    WorkspaceInvitationLink(email);
    cy.clearAndType(commonSelectors.passwordInputField, usersText.password);
    cy.get(commonSelectors.signUpButton).click();
    cy.wait(2000);
    cy.get(commonSelectors.acceptInviteButton).click();
    cy.get(commonSelectors.workspaceName).verifyVisibleElement(
        "have.text",
        "My workspace"
    );
};

export const inviteUser = (firstName, email) => {
    cy.get(usersSelector.buttonAddUsers).click();
    cy.get(commonSelectors.inputFieldFullName).type(firstName);
    cy.get(commonSelectors.inputFieldEmailAddress).type(email);

    cy.get(usersSelector.buttonInviteUsers).click();
    cy.verifyToastMessage(
        commonSelectors.toastMessage,
        usersText.userCreatedToast
    );
    fetchAndVisitInviteLink(email);
};

export const defaultWorkspace = () => {
    cy.get(".org-select-container").then(($title) => {
        if (!$title.text().includes("My workspace")) {
            cy.get(commonSelectors.workspaceName).realClick();
            cy.contains("My workspace").realClick();
            cy.wait(2000);
            defaultWorkspace();
        }
    });
};

export const trunOffAllowPersonalWorkspace = () => {
    cy.get(commonSelectors.settingsIcon).click();
    cy.get(commonEeSelectors.instanceSettingIcon).click();
    cy.get(instanceSettingsSelector.manageInstanceSettings).click();
    cy.get(instanceSettingsSelector.allowWorkspaceToggle)
        .eq(0)
        .then(($el) => {
            if ($el.is(":checked")) {
                cy.get(instanceSettingsSelector.allowWorkspaceToggle).eq(0).uncheck();
                cy.get(commonEeSelectors.saveButton).click();
                cy.verifyToastMessage(
                    commonSelectors.toastMessage,
                    "Instance settings have been updated"
                );
            }
        });
};

export const verifySSOSignUpPageElements = () => {
    cy.get(commonSelectors.invitePageHeader).verifyVisibleElement(
        "have.text",
        "Join ToolJet"
    );
    cy.get(commonSelectors.invitePageSubHeader).verifyVisibleElement(
        "have.text",
        "You are invited to ToolJet."
    );
    cy.get(commonSelectors.userNameInputLabel).verifyVisibleElement(
        "have.text",
        commonText.userNameInputLabel
    );
    cy.get(commonSelectors.invitedUserName).should("be.visible");
    cy.get(commonSelectors.emailInputLabel).verifyVisibleElement(
        "have.text",
        commonText.emailInputLabel
    );
    cy.get(commonSelectors.invitedUserEmail).should("be.visible");
    cy.get(commonSelectors.acceptInviteButton).verifyVisibleElement(
        "have.text",
        commonText.acceptInviteButton
    );

    cy.get(commonSelectors.signUpTermsHelperText).should(($el) => {
        expect($el.contents().first().text().trim()).to.eq(
            commonText.signUpTermsHelperText
        );
    });
    cy.get(commonSelectors.termsOfServiceLink)
        .verifyVisibleElement("have.text", commonText.termsOfServiceLink)
        .and("have.attr", "href")
        .and("equal", "https://www.tooljet.com/terms");
    cy.get(commonSelectors.privacyPolicyLink)
        .verifyVisibleElement("have.text", commonText.privacyPolicyLink)
        .and("have.attr", "href")
        .and("equal", "https://www.tooljet.com/privacy");
};

export const VerifyWorkspaceInvitePageElements = () => {
    cy.get(commonSelectors.invitePageHeader).verifyVisibleElement(
        "have.text",
        commonText.invitePageHeader
    );
    cy.get(commonSelectors.invitePageSubHeader).verifyVisibleElement(
        "have.text",
        commonText.invitePageSubHeader
    );
    cy.verifyLabel(commonText.userNameInputLabel);
    cy.get(commonSelectors.invitedUserName).should("be.visible");
    cy.verifyLabel(commonText.emailInputLabel);
    cy.get(commonSelectors.invitedUserEmail).should("be.visible");
    cy.get(commonSelectors.acceptInviteButton).verifyVisibleElement(
        "have.text",
        commonText.acceptInviteButton
    );

    cy.get(commonSelectors.signUpTermsHelperText).should(($el) => {
        expect($el.contents().first().text().trim()).to.eq(
            commonText.signUpTermsHelperText
        );
    });
    cy.get(commonSelectors.termsOfServiceLink)
        .verifyVisibleElement("have.text", commonText.termsOfServiceLink)
        .and("have.attr", "href")
        .and("equal", "https://www.tooljet.com/terms");
    cy.get(commonSelectors.privacyPolicyLink)
        .verifyVisibleElement("have.text", commonText.privacyPolicyLink)
        .and("have.attr", "href")
        .and("equal", "https://www.tooljet.com/privacy");

    cy.get("body").then(($el) => {
        if ($el.text().includes("Google")) {
            cy.get(ssoSelector.googleSSOText).verifyVisibleElement(
                "have.text",
                ssoText.googleSignUpText
            );
            cy.get(ssoSelector.gitSSOText).verifyVisibleElement(
                "have.text",
                ssoText.gitSignUpText
            );
            cy.get(commonSelectors.onboardingSeperator).should("be.visible");
        }
    });
};

export const WorkspaceInvitationLink = (email) => {
    let invitationToken,
        organizationToken,
        workspaceId,
        userId,
        url = "";
    cy.task("dbConnection", {
        dbconfig: Cypress.env("app_db"),
        sql: `select invitation_token from users where email='${email}';`,
    }).then((resp) => {
        invitationToken = resp.rows[0].invitation_token;

        cy.task("dbConnection", {
            dbconfig: Cypress.env("app_db"),
            sql: "select id from organizations where name='My workspace';",
        }).then((resp) => {
            workspaceId = resp.rows[0].id;

            cy.task("dbConnection", {
                dbconfig: Cypress.env("app_db"),
                sql: `select id from users where email='${email}';`,
            }).then((resp) => {
                userId = resp.rows[0].id;

                cy.task("dbConnection", {
                    dbconfig: Cypress.env("app_db"),
                    sql: `select invitation_token from organization_users where user_id='${userId}';`,
                }).then((resp) => {
                    organizationToken = resp.rows[0].invitation_token;

                    url = `/invitations/${invitationToken}/workspaces/${organizationToken}?oid=${workspaceId}`;
                    common.logout();
                    cy.visit(url);
                });
            });
        });
    });
};

export const enableDefaultSSO = () => {
    common.navigateToManageSSO();
    cy.get("body").then(($el) => {
        if (!$el.text().includes("Allowed domains")) {
            cy.get(ssoSelector.generalSettingsElements.generalSettings).click();
        }
    });
    cy.get(ssoSelector.allowDefaultSSOToggle).then(($el) => {
        if (!$el.is(":checked")) {
            cy.get(ssoSelector.allowDefaultSSOToggle).check();
            cy.get(ssoSelector.saveButton).click();
            cy.verifyToastMessage(commonSelectors.toastMessage, ssoText.ssoToast);
        }
    });
};

export const disableSSO = (ssoSelector, toggleSelector) => {
    cy.wait(1000);
    cy.get(ssoSelector).click();
    cy.get(toggleSelector).then(($el) => {
        if ($el.is(":checked")) {
            cy.get(toggleSelector).uncheck();
        }
    });
};

export const AddDataSourceToGroup = (groupName, dsName) => {
    common.navigateToManageGroups();
    cy.get(groupsSelector.groupLink(groupName)).click();
    cy.get(eeGroupsSelector.datasourceLink).click();
    cy.wait(500);
    cy.get(
        '[data-cy="datasource-select-search"] >> .rmsc > .dropdown-container > .dropdown-heading > .dropdown-heading-value > .gray'
    ).click();
    cy.contains(dsName).realClick();

    cy.get(eeGroupsSelector.AddDsButton).click();
    cy.verifyToastMessage(
        commonSelectors.toastMessage,
        "Datasources added to the group"
    );
};

export const enableToggle = (toggleSelector) => {
    cy.get(toggleSelector).then(($el) => {
        if (!$el.is(":checked")) {
            cy.get(toggleSelector).check();
        }
    });
};

export const disableToggle = (toggleSelector) => {
    cy.get(toggleSelector).then(($el) => {
        if ($el.is(":checked")) {
            cy.get(toggleSelector).uncheck();
        }
    });
};

export const verifyPromoteModalUI = (versionName, currEnv, targetEnv) => {
    cy.get(commonEeSelectors.promoteButton)
        .verifyVisibleElement("have.text", " Promote ")
        .click();
    cy.get(commonEeSelectors.modalTitle).verifyVisibleElement(
        "have.text",
        `Promote ${versionName}`
    );
    cy.get(commonSelectors.closeButton).should("be.visible");
    cy.get(multiEnvSelector.fromLabel).verifyVisibleElement("have.text", "FROM");
    cy.get(multiEnvSelector.toLabel).verifyVisibleElement("have.text", "TO");
    cy.get(multiEnvSelector.currEnvName).verifyVisibleElement(
        "have.text",
        currEnv
    );
    cy.get('[data-cy="target-env-name"]').verifyVisibleElement(
        "have.text",
        targetEnv
    );
    cy.get('[data-cy="cancel-button"]').verifyVisibleElement(
        "have.text",
        "Cancel"
    );
    cy.get(commonEeSelectors.promoteButton)
        .eq(1)
        .verifyVisibleElement("have.text", "Promote ");
};

export const resetPassword = (email) => {
    cy.visit("/");
    cy.get(commonSelectors.forgotPasswordLink).click();
    cy.clearAndType(commonSelectors.emailInputField, email);
    cy.get(commonSelectors.resetPasswordLinkButton).click();

    cy.task("dbConnection", {
        dbconfig: Cypress.env("app_db"),
        sql: `select forgot_password_token from users where email='${email}';`,
    }).then((resp) => {
        const passwordResetLink = `/reset-password/${resp.rows[0].forgot_password_token}`;
        cy.visit(passwordResetLink);
    });
    cy.wait(500);

    cy.clearAndType(commonSelectors.newPasswordInputField, "Password");
    cy.clearAndType(commonSelectors.confirmPasswordInputField, "Password");
    cy.wait(4000);
    cy.get(commonSelectors.resetPasswordButton).click();
    cy.get(commonSelectors.backToLoginButton).click();
};

export const verifyTooltipDisabled = (selector, message) => {
    cy.get(selector)
        .trigger("mouseover", { force: true })
        .then(() => {
            cy.get(".tooltip-inner").last().should("have.text", message);
        });
};

export const createAnAppWithSlug = (appName, slug) => {
    cy.apiCreateApp(appName);
    cy.openApp();
    cy.dragAndDropWidget("Table", 250, 250);
    appPromote("development", "release");
    cy.get(commonWidgetSelector.shareAppButton).click();
    cy.clearAndType(commonWidgetSelector.appNameSlugInput, `${slug}`);
    cy.wait(2000);
    cy.get(commonWidgetSelector.modalCloseButton).click();
};

export const updateLicense = (key) => {
    cy.task("dbConnection", {
        dbconfig: Cypress.env("app_db"),
        sql: `update instance_settings set value='${key}', updated_at= NOW() where key='LICENSE_KEY';`,
    });
};

export const openInstanceSettings = () => {
    cy.get(commonSelectors.settingsIcon).click();
    cy.get(commonEeSelectors.instanceSettingIcon).click();
};

export const openUserActionMenu = (email) => {
    cy.clearAndType(commonSelectors.inputUserSearch, email);
    cy.wait(1000);
    cy.get('[data-cy="user-actions-button"]').eq(0).click();
    cy.wait(2000);
};

export const archiveWorkspace = (workspaceName) => {
    cy.get(instanceSettingsSelector.allWorkspaceTab).click();
    cy.clearAndType(commonEeSelectors.searchBar, workspaceName);
    cy.get(workspaceSelector.workspaceStatusChange).eq(0).click();
    cy.get(commonEeSelectors.confirmButton).click();
};

export const passwordToggle = (enable) => {
    cy.getCookie("tj_auth_token").then((cookie) => {
        cy.request(
            {
                method: "PATCH",
                url: "http://localhost:3000/api/organizations/configs",
                headers: {
                    "Tj-Workspace-Id": Cypress.env("workspaceId"),
                    Cookie: `tj_auth_token=${cookie.value}`,
                },
                body: { type: "form", enabled: enable },
            },
            { log: false }
        ).then((response) => {
            expect(response.status).to.equal(200);
        });
    });
};

export const InstanceSSO = (personalWorkspace, enableSignup, workspaceSSO) => {
    allowPersonalWorkspace(personalWorkspace);

    cy.task("dbConnection", {
        dbconfig: Cypress.env("app_db"),
        sql: `UPDATE instance_settings SET value = '${enableSignup}'  WHERE key = 'ENABLE_SIGNUP';UPDATE instance_settings SET value = '${workspaceSSO}' WHERE key = 'ENABLE_WORKSPACE_LOGIN_CONFIGURATION';`,
    });
};

export const resetInstanceDomain = () => {
    cy.getCookie("tj_auth_token").then((cookie) => {
        cy.request(
            {
                method: "PATCH",
                url: "http://localhost:3000/api/instance-login-configs",
                headers: {
                    "Tj-Workspace-Id": Cypress.env("workspaceId"),
                    Cookie: `tj_auth_token=${cookie.value}`,
                },
                body: { allowedDomains: "" },
            },
            { log: false }
        ).then((response) => {
            expect(response.status).to.equal(200);
        });
    });
};

export const instanceSSOConfig = (allow = true) => {
    const value = allow ? "true" : "false";

    cy.task("dbConnection", {
        dbconfig: Cypress.env("app_db"),
        sql: `UPDATE sso_configs SET enabled = ${allow} WHERE sso IN ('google', 'git', 'openid')AND organization_id IS NULL;`,
    });
};

export const updateInstanceSettings = (key, value) => {
    cy.task("updateSetting", {
        dbconfig: Cypress.env("app_db"),
        sql: `UPDATE instance_settings SET value = ${value} WHERE key = ${key};`,
    });
};
