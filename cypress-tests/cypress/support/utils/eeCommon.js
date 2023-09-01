import {
  commonEeSelectors,
  ssoEeSelector,
  instanceSettingsSelector,
} from "Selectors/eeCommon";
import { ssoEeText } from "Texts/eeCommon";
import { commonSelectors } from "Selectors/common";
import * as common from "Support/utils/common";
import { groupsSelector } from "Selectors/manageGroups";
import { groupsText } from "Texts/manageGroups";
import { eeGroupsSelector } from "Selectors/eeCommon";
import { eeGroupsText } from "Texts/eeCommon";
import { verifyOnboardingQuestions } from "Support/utils/onboarding";
import { commonText } from "Texts/common";
import { dashboardText } from "Texts/dashboard";
import { usersText } from "Texts/manageUsers";
import { usersSelector } from "Selectors/manageUsers";
import { ssoSelector } from "Selectors/manageSSO";
import { ssoText } from "Texts/manageSSO";

export const oidcSSOPageElements = () => {
  cy.get(ssoEeSelector.oidcToggle).then(($el) => {
    if ($el.is(":checked")) {
      cy.get(ssoEeSelector.statusLabel).verifyVisibleElement(
        "have.text",
        ssoEeText.enabledLabel
      );
      cy.get(ssoEeSelector.oidcToggle).uncheck();
      cy.verifyToastMessage(
        commonSelectors.toastMessage,
        ssoEeText.oidcDisabledToast
      );
      cy.get(ssoEeSelector.statusLabel).verifyVisibleElement(
        "have.text",
        ssoEeText.disabledLabel
      );
      cy.get(ssoEeSelector.oidcToggle).check();
      cy.verifyToastMessage(
        commonSelectors.toastMessage,
        ssoEeText.oidcEnabledToast
      );
      cy.get(ssoEeSelector.statusLabel).verifyVisibleElement(
        "have.text",
        ssoEeText.enabledLabel
      );
    } else {
      cy.get(ssoEeSelector.statusLabel).verifyVisibleElement(
        "have.text",
        ssoEeText.disabledLabel
      );
      cy.get(ssoEeSelector.oidcToggle).check();
      cy.verifyToastMessage(
        commonSelectors.toastMessage,
        ssoEeText.oidcEnabledToast
      );
      cy.get(ssoEeSelector.statusLabel).verifyVisibleElement(
        "have.text",
        ssoEeText.enabledLabel
      );
      cy.get(ssoEeSelector.oidcToggle).uncheck();
      cy.verifyToastMessage(
        commonSelectors.toastMessage,
        ssoEeText.oidcDisabledToast
      );
      cy.get(ssoEeSelector.statusLabel).verifyVisibleElement(
        "have.text",
        ssoEeText.disabledLabel
      );
      cy.get(ssoEeSelector.oidcToggle).check();
      cy.get(ssoEeSelector.statusLabel).verifyVisibleElement(
        "have.text",
        ssoEeText.enabledLabel
      );
    }
    cy.clearAndType(ssoEeSelector.nameInput, ssoEeText.testName);
    cy.clearAndType(ssoEeSelector.clientIdInput, ssoEeText.testclientId);
    cy.clearAndType(
      ssoEeSelector.clientSecretInput,
      ssoEeText.testclientSecret
    );
    cy.clearAndType(
      ssoEeSelector.WellKnownUrlInput,
      ssoEeText.testWellknownUrl
    );
    cy.get(commonEeSelectors.saveButton).click();
    cy.verifyToastMessage(
      commonSelectors.toastMessage,
      ssoEeText.oidcUpdatedToast
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
  });
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
  let invitationLink = "";
  cy.visit("/");
  cy.wait(500);
  cy.get(commonSelectors.createAnAccountLink).realClick();
  cy.clearAndType(commonSelectors.nameInputField, fullName);
  cy.clearAndType(commonSelectors.emailInputField, email);
  cy.clearAndType(commonSelectors.passwordInputField, commonText.password);
  cy.get(commonSelectors.signUpButton).click();

  cy.wait(500);
  cy.task("updateId", {
    dbconfig: Cypress.env("app_db"),
    sql: `select invitation_token from users where email='${email}';`,
  }).then((resp) => {
    invitationLink = `/invitations/${resp.rows[0].invitation_token}`;
    cy.visit(invitationLink);
    cy.get(commonSelectors.setUpToolJetButton).click();
    cy.wait(4000);
  });
  cy.get("body").then(($el) => {
    if (!$el.text().includes(dashboardText.emptyPageHeader)) {
      verifyOnboardingQuestions(fullName, workspaceName);
    }
  });
};

export const resetAllowPersonalWorkspace = () => {
  cy.get(commonEeSelectors.instanceSettingIcon).click();
  cy.get(instanceSettingsSelector.manageInstanceSettings).click();
  cy.get(instanceSettingsSelector.allowWorkspaceToggle).then(($el) => {
    if (!$el.is(":checked")) {
      cy.get(instanceSettingsSelector.allowWorkspaceToggle).check();
      cy.get(commonEeSelectors.saveButton).click();
      cy.verifyToastMessage(
        commonSelectors.toastMessage,
        "Instance settings have been updated"
      );
    }
  });
};

export const addNewUser = (firstName, email, companyName) => {
  common.navigateToManageUsers();
  inviteUser(firstName, email);
  cy.clearAndType(commonSelectors.passwordInputField, usersText.password);
  cy.get(commonSelectors.acceptInviteButton).click();
  cy.get(commonSelectors.workspaceName).verifyVisibleElement(
    "have.text",
    "My workspace"
  );
};

export const inviteUser = (firstName, email) => {
  cy.get(usersSelector.buttonAddUsers).click();
  cy.clearAndType(commonSelectors.inputFieldFullName, firstName);
  cy.clearAndType(commonSelectors.inputFieldEmailAddress, email);

  cy.get(usersSelector.buttonInviteUsers).click();
  cy.verifyToastMessage(
    commonSelectors.toastMessage,
    usersText.userCreatedToast
  );
  WorkspaceInvitationLink(email);
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
  cy.get(commonEeSelectors.instanceSettingIcon).click();
  cy.get(instanceSettingsSelector.manageInstanceSettings).click();
  cy.get(instanceSettingsSelector.allowWorkspaceToggle).then(($el) => {
    if ($el.is(":checked")) {
      cy.get(instanceSettingsSelector.allowWorkspaceToggle).uncheck();
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
  cy.get(commonSelectors.passwordLabel).verifyVisibleElement(
    "have.text",
    commonText.passwordLabel
  );
  cy.get(commonSelectors.passwordInputField).should("be.visible");
  cy.get(commonSelectors.acceptInviteButton)
    .verifyVisibleElement("have.text", commonText.acceptInviteButton)
    .should("be.disabled");

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
  cy.get(commonSelectors.passwordLabel).verifyVisibleElement(
    "have.text",
    commonText.passwordLabel
  );
  cy.get(commonSelectors.passwordInputField).should("be.visible");
  cy.get(commonSelectors.acceptInviteButton)
    .verifyVisibleElement("have.text", commonText.acceptInviteButton)
    .should("be.disabled");

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
  cy.task("updateId", {
    dbconfig: Cypress.env("app_db"),
    sql: `select invitation_token from users where email='${email}';`,
  }).then((resp) => {
    invitationToken = resp.rows[0].invitation_token;

    cy.task("updateId", {
      dbconfig: Cypress.env("app_db"),
      sql: "select id from organizations where name='My workspace';",
    }).then((resp) => {
      workspaceId = resp.rows[0].id;

      cy.task("updateId", {
        dbconfig: Cypress.env("app_db"),
        sql: `select id from users where email='${email}';`,
      }).then((resp) => {
        userId = resp.rows[0].id;

        cy.task("updateId", {
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
}

export const disableToggle = (toggleSelector) => {
  cy.get(toggleSelector).then(($el) => {
    if ($el.is(":checked")) {
      cy.get(toggleSelector).uncheck();
    }
  });
}

export const verifyPromoteModalUI = (versionName, currEnv, targetEnv) => {
  cy.get('[data-cy="promte-button"]').verifyVisibleElement("have.text", ' Promote ').click()
  cy.get('[data-cy="modal-title"]').verifyVisibleElement("have.text", `Promote ${versionName}`)
  cy.get('[data-cy="close-button"]').should('be.visible')
  cy.get('[data-cy="from-label"]').verifyVisibleElement("have.text", "FROM")
  cy.get('[data-cy="to-label"]').verifyVisibleElement("have.text", "TO")
  cy.get('[data-cy="current-env-name"]').verifyVisibleElement("have.text", currEnv)
  cy.get('[data-cy="target-env-name"]').verifyVisibleElement("have.text", targetEnv)
  cy.get('[data-cy="cancel-button"]').verifyVisibleElement("have.text", "Cancel")
  cy.get('[data-cy="promote-button"]').verifyVisibleElement("have.text", "Promote ")
}