// ┌─ AUTO-GENERATED from @tj annotations below — do not edit by hand ─┐
// eeCommon.js
//   oidcSSOPageElements              oidcSso.verifyPage   → onboarding
//   resetDsPermissions               datasourcePermission.reset → access
//   deleteAssignedDatasources        datasourcePermission.deleteAssigned → access
//   userSignUp                       user.signUp          → onboarding
//   allowPersonalWorkspace           instanceSetting.allowPersonalWorkspace → superAdmin
//   addNewUserEE                     user.createEE        → onboarding
//   inviteUser                       user.invite          → onboarding
//   defaultWorkspace                 workspace.goToDefault → workspace
//   trunOffAllowPersonalWorkspace    instanceSetting.disablePersonalWorkspace → superAdmin
//   verifySSOSignUpPageElements      sso.verifySignUpPage → onboarding
//   VerifyWorkspaceInvitePageElements workspaceInvite.verifyPage → onboarding
//   WorkspaceInvitationLink          workspaceInvite.openLink → onboarding
//   enableDefaultSSO                 sso.enableDefault    → onboarding
//   disableSSO                       sso.disable          → onboarding
//   AddDataSourceToGroup             datasourcePermission.assign → access
//   enableToggle                     -                    → common
//   disableToggle                    -                    → common
//   verifyPromoteModalUI             appVersion.verifyPromoteModal → workspace
//   resetPassword                    user.resetPassword   → onboarding
//   verifyTooltipDisabled            -                    → common
//   createAnAppWithSlug              app.createWithSlug   → apps
//   openInstanceSettings             instanceSetting.open → superAdmin
//   openUserActionMenu               user.openRowMenu     → access
//   archiveWorkspace                 workspace.archive    → workspace
//   passwordToggle                   instanceSetting.passwordToggle → superAdmin
//   InstanceSSO                      instanceSetting.ssoConfig → superAdmin
//   resetInstanceDomain              instanceSetting.resetDomain → superAdmin
//   defaultInstanceSSO               instanceSetting.defaultSso → superAdmin
//   instanceSSOConfig                instanceSetting.ssoAllow → superAdmin
//   updateInstanceSettings           instanceSetting.update → superAdmin
//   updateAutoSSOToggle              instanceSetting.autoSso → superAdmin
//   verifyPreviewIsDisabled          app.verifyPreviewDisabled → apps
// └──────────────────────────────────────────────────────────────────┘
import { commonSelectors, commonWidgetSelector } from "Selectors/common";
import {
  commonEeSelectors,
  eeGroupsSelector,
  instanceSettingsSelector,
  multiEnvSelector,
  ssoEeSelector,
  workspaceSelector,
} from "Selectors/platform/eeCommon";
import { ssoEeText } from "Texts/platform/eeCommon";
import * as common from "Support/utils/common";
import { groupsSelector } from "Selectors/platform/manageGroups";
import { ssoSelector } from "Selectors/platform/manageSSO";
import { usersSelector } from "Selectors/platform/manageUsers";
import {
  // verifyOnboardingQuestions,
  // verifyCloudOnboardingQuestions,
  fetchAndVisitInviteLink,
} from "Support/utils/manageUsers";
import { commonText } from "Texts/common";
import { ssoText } from "Texts/platform/manageSSO";
import { usersText } from "Texts/platform/manageUsers";
// import { appPromote } from "Support/utils/multiEnv";

/**
* @tjType   oidcSso.verifyPage
* @tjBlock  onboarding
* @tjUsage  oidcSSOPageElements()
* @tjDom    OIDC SSO config page fields
*/
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

/**
* @tjType   datasourcePermission.reset
* @tjBlock  access
* @tjUsage  resetDsPermissions()
* @tjDom    group datasource permissions -> reset
*/
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

/**
* @tjType   datasourcePermission.deleteAssigned
* @tjBlock  access
* @tjUsage  deleteAssignedDatasources()
* @tjDom    removes every assigned datasource from a group
*/
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

/**
* @tjType   user.signUp
* @tjBlock  onboarding
* @tjUsage  userSignUp('QA User', userEmail, 'QA workspace')
* @tjDom    signup form -> submit
*/
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

/**
* @tjType   instanceSetting.allowPersonalWorkspace
* @tjBlock  superAdmin
* @tjUsage  allowPersonalWorkspace(true)
* @tjDom    instance settings toggle
*/
export const allowPersonalWorkspace = (allow = true) => {
  const value = allow ? "true" : "false";
  cy.task("dbConnection", {
    dbconfig: Cypress.env("app_db"),
    sql: `UPDATE instance_settings SET value = '${value}' WHERE key = 'ALLOW_PERSONAL_WORKSPACE';`,
  });
};

/**
* @tjType   user.createEE
* @tjBlock  onboarding
* @tjUsage  addNewUserEE('QA', userEmail)
* @tjDom    manage users -> add user (EE form)
*/
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

/**
* @tjType   user.invite
* @tjBlock  onboarding
* @tjUsage  inviteUser('QA', userEmail)
* @tjDom    manage users -> invite -> accept link
*/
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

/**
* @tjType   workspace.goToDefault
* @tjBlock  workspace
* @tjUsage  defaultWorkspace()
* @tjDom    navigates to the default workspace
*/
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

/**
* @tjType   instanceSetting.disablePersonalWorkspace
* @tjBlock  superAdmin
* @tjUsage  trunOffAllowPersonalWorkspace()
* @tjDom    instance settings toggle off
*/
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

/**
* @tjType   sso.verifySignUpPage
* @tjBlock  onboarding
* @tjUsage  verifySSOSignUpPageElements()
* @tjDom    SSO signup page fields + buttons
*/
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

/**
* @tjType   workspaceInvite.verifyPage
* @tjBlock  onboarding
* @tjUsage  VerifyWorkspaceInvitePageElements()
* @tjDom    workspace invite acceptance page
*/
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

/**
* @tjType   workspaceInvite.openLink
* @tjBlock  onboarding
* @tjUsage  WorkspaceInvitationLink(userEmail)
* @tjDom    reads the invite link and visits it
*/
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

/**
* @tjType   sso.enableDefault
* @tjBlock  onboarding
* @tjUsage  enableDefaultSSO()
* @tjDom    workspace SSO -> enable default provider
*/
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

/**
* @tjType   sso.disable
* @tjBlock  onboarding
* @tjUsage  disableSSO(ssoSelector, toggleSelector)
* @tjDom    SSO provider toggle off
*/
export const disableSSO = (ssoSelector, toggleSelector) => {
  cy.wait(1000);
  cy.get(ssoSelector).click();
  cy.get(toggleSelector).then(($el) => {
    if ($el.is(":checked")) {
      cy.get(toggleSelector).uncheck();
    }
  });
};

/**
* @tjType   datasourcePermission.assign
* @tjBlock  access
* @tjUsage  AddDataSourceToGroup('QA Team', 'Postgres')
* @tjDom    group -> datasource permission -> add
*/
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

/**
* @tjType   -
* @tjBlock  common
* @tjUsage  enableToggle(toggleSelector)
* @tjDom    clicks a toggle only if it is off
*/
export const enableToggle = (toggleSelector) => {
  cy.get(toggleSelector).then(($el) => {
    if (!$el.is(":checked")) {
      cy.get(toggleSelector).check();
    }
  });
};

/**
* @tjType   -
* @tjBlock  common
* @tjUsage  disableToggle(toggleSelector)
* @tjDom    clicks a toggle only if it is on
*/
export const disableToggle = (toggleSelector) => {
  cy.get(toggleSelector).then(($el) => {
    if ($el.is(":checked")) {
      cy.get(toggleSelector).uncheck();
    }
  });
};

/**
* @tjType   appVersion.verifyPromoteModal
* @tjBlock  workspace
* @tjUsage  verifyPromoteModalUI('v1', 'development', 'staging')
* @tjDom    promote modal copy + env names
*/
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

/**
* @tjType   user.resetPassword
* @tjBlock  onboarding
* @tjUsage  resetPassword(userEmail)
* @tjDom    forgot-password flow end to end
*/
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

/**
* @tjType   -
* @tjBlock  common
* @tjUsage  verifyTooltipDisabled(selector, 'You do not have permission')
* @tjDom    hovers a disabled control and asserts its tooltip
*/
export const verifyTooltipDisabled = (selector, message) => {
  cy.get(selector)
    .trigger("mouseover", { force: true })
    .then(() => {
      cy.get(".tooltip-inner").last().should("have.text", message);
    });
};

/**
* @tjType   app.createWithSlug
* @tjBlock  apps
* @tjUsage  createAnAppWithSlug('MyApp', 'my-app')
* @tjDom    creates an app then sets its slug
*/
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

/**
* @tjType   instanceSetting.open
* @tjBlock  superAdmin
* @tjUsage  openInstanceSettings()
* @tjDom    avatar menu -> instance settings
*/
export const openInstanceSettings = () => {
  cy.get(commonSelectors.settingsIcon).click();
  cy.get(commonEeSelectors.instanceSettingIcon).click();
};

/**
* @tjType   user.openRowMenu
* @tjBlock  access
* @tjUsage  openUserActionMenu(userEmail)
* @tjDom    manage users row -> kebab menu
*/
export const openUserActionMenu = (email) => {
  cy.get(commonSelectors.inputUserSearch).should("be.visible");
  cy.wait(1000);
  cy.clearAndType(commonSelectors.inputUserSearch, email);
  cy.wait(1000);
  cy.get('[data-cy="user-actions-button"]').eq(0).click();
  cy.wait(2000);
};

/**
* @tjType   workspace.archive
* @tjBlock  workspace
* @tjUsage  archiveWorkspace('QA workspace')
* @tjDom    workspace settings -> archive
*/
export const archiveWorkspace = (workspaceName) => {
  cy.get(instanceSettingsSelector.allWorkspaceTab).click();
  cy.clearAndType(commonEeSelectors.searchBar, workspaceName);
  cy.get(workspaceSelector.workspaceStatusChange).eq(0).click();
  cy.get(commonEeSelectors.confirmButton).click();
};

/**
* @tjType   instanceSetting.passwordToggle
* @tjBlock  superAdmin
* @tjUsage  passwordToggle(true, 'instance')
* @tjDom    password-login toggle, instance or workspace form
*/
export const passwordToggle = (enable, formName = "instance") => {
  cy.getCookie("tj_auth_token").then((cookie) => {
    cy.request(
      {
        method: "PATCH",
        url: `${Cypress.env("server_host")}/api/login-configs/${formName}-sso`,
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

/**
* @tjType   instanceSetting.ssoConfig
* @tjBlock  superAdmin
* @tjUsage  InstanceSSO(true, true, true)
* @tjDom    instance SSO: personal workspace / signup / workspace SSO
*/
export const InstanceSSO = (personalWorkspace, enableSignup, workspaceSSO) => {
  allowPersonalWorkspace(personalWorkspace);

  cy.task("dbConnection", {
    dbconfig: Cypress.env("app_db"),
    sql: `UPDATE instance_settings SET value = '${enableSignup}'  WHERE key = 'ENABLE_SIGNUP';UPDATE instance_settings SET value = '${workspaceSSO}' WHERE key = 'ENABLE_WORKSPACE_LOGIN_CONFIGURATION';`,
  });
};

/**
* @tjType   instanceSetting.resetDomain
* @tjBlock  superAdmin
* @tjUsage  resetInstanceDomain()
* @tjDom    clears the allowed-domain field
*/
export const resetInstanceDomain = () => {
  cy.getCookie("tj_auth_token").then((cookie) => {
    cy.request(
      {
        method: "PATCH",
        url: `${Cypress.env("server_host")}/api/login-configs/instance-general`,
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
/**
* @tjType   instanceSetting.defaultSso
* @tjBlock  superAdmin
* @tjUsage  defaultInstanceSSO(true)
* @tjDom    instance default SSO toggle
*/
export const defaultInstanceSSO = (enable = true) => {
  cy.getCookie("tj_auth_token").then((cookie) => {
    cy.request(
      {
        method: "PATCH",
        url: `${Cypress.env("server_host")}/api/login-configs/organization-general/inherit-sso`,
        headers: {
          "Tj-Workspace-Id": Cypress.env("workspaceId"),
          Cookie: `tj_auth_token=${cookie.value}`,
        },
        body: { inheritSSO: enable },
      },
      { log: false }
    ).then((response) => {
      expect(response.status).to.equal(200);
    });
  });
};
/**
* @tjType   instanceSetting.ssoAllow
* @tjBlock  superAdmin
* @tjUsage  instanceSSOConfig(true)
* @tjDom    instance SSO allow toggle
*/
export const instanceSSOConfig = (allow = true) => {
  const value = allow ? "true" : "false";

  cy.task("dbConnection", {
    dbconfig: Cypress.env("app_db"),
    sql: `UPDATE sso_configs SET enabled = ${allow} WHERE sso IN ('google', 'git', 'openid')AND organization_id IS NULL;`,
  });
};

/**
* @tjType   instanceSetting.update
* @tjBlock  superAdmin
* @tjUsage  updateInstanceSettings('ALLOWED_DOMAINS', 'tooljet.com')
* @tjDom    instance settings field -> save
*/
export const updateInstanceSettings = (key, value) => {
  cy.task("dbConnection", {
    dbconfig: Cypress.env("app_db"),
    sql: `UPDATE instance_settings SET value = '${value}' WHERE key = '${key}';`,
  });
};
/**
* @tjType   instanceSetting.autoSso
* @tjBlock  superAdmin
* @tjUsage  updateAutoSSOToggle(false)
* @tjDom    auto-SSO toggle
*/
export const updateAutoSSOToggle = (allow = false) => {
  cy.task("dbConnection", {
    dbconfig: Cypress.env("app_db"),
    sql: `UPDATE instance_settings SET value = '${allow}' WHERE key = 'AUTOMATIC_SSO_LOGIN';`,
  });
};

/**
* @tjType   app.verifyPreviewDisabled
* @tjBlock  apps
* @tjUsage  verifyPreviewIsDisabled()
* @tjDom    preview button disabled state
*/
export const verifyPreviewIsDisabled = () => {
  cy.get(commonSelectors.previewSettings).should("not.exist");
  cy.get(commonSelectors.previewText).should("not.exist") 
};