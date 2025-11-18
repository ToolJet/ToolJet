import { commonSelectors, cyParamName } from "Selectors/common";
import { ssoSelector } from "Selectors/manageSSO";
import * as common from "Support/utils/common";
import { commonText } from "Texts/common";
import { ssoText } from "Texts/manageSSO";
import {
  openInstanceSettings,
  verifyTooltipDisabled,
  instanceSSOConfig,
  passwordToggle,
} from "Support/utils/platform/eeCommon";

export const verifyLoginSettings = (pageName) => {

  cy.get(ssoSelector.enableSignUpToggle).should("be.visible");
  cy.get(ssoSelector.allowedDomainInput).should("be.visible");
  cy.get(ssoSelector.workspaceLoginUrl).should("be.visible");
  cy.get(commonSelectors.copyIcon).should("be.visible");

  cy.get(ssoSelector.cancelButton).verifyVisibleElement(
    "have.text",
    ssoText.cancelButton
  );
  cy.get(ssoSelector.saveButton).verifyVisibleElement(
    "have.text",
    ssoText.saveButton
  );

  cy.get(ssoSelector.passwordEnableToggle).should("be.visible");

  //Configure sign up toggle
  cy.get(ssoSelector.enableSignUpToggle).check();
  cy.get(ssoSelector.cancelButton).click();
  cy.get(ssoSelector.enableSignUpToggle).should("not.be.checked");
  cy.get(ssoSelector.enableSignUpToggle).check();
  cy.get(ssoSelector.saveButton).click();
  cy.get(ssoSelector.enableSignUpToggle).should("be.checked");
  cy.wait(500);
  cy.get(ssoSelector.enableSignUpToggle).uncheck();
  cy.get(ssoSelector.saveButton).click();
  cy.get(ssoSelector.enableSignUpToggle).should("not.be.checked");

  cy.clearAndType(ssoSelector.allowedDomainInput, ssoText.allowedDomain);
  cy.get(ssoSelector.saveButton).click();
  cy.verifyToastMessage(commonSelectors.toastMessage, ssoText[`${pageName}SsoToast`]);

  cy.get(ssoSelector.passwordEnableToggle).uncheck();
  cy.get(commonSelectors.modalComponent).should("be.visible");
  cy.get(ssoSelector.disablePasswordLoginTitle).verifyVisibleElement(
    "have.text",
    ssoText.disablePasswordLoginTitle
  );
  cy.get(commonSelectors.modalMessage).verifyVisibleElement(
    "have.text",
    ssoText.passwordDisableWarning
  );
  cy.get(ssoSelector.superAdminInfoText).verifyVisibleElement(
    "have.text",
    ssoText.superAdminInfoText
  );

  cy.get('[data-cy="copy-icon"]:eq(1)').should("be.visible");

  cy.get(commonSelectors.cancelButton).eq(1).click();
  cy.get(ssoSelector.passwordEnableToggle).uncheck();
  cy.get(commonSelectors.confirmationButton).click();
  cy.verifyToastMessage(
    commonSelectors.toastMessage,
    ssoText.passwordDisabledToast
  );

  cy.get(ssoSelector.passwordEnableToggle).check();
  cy.get(commonSelectors.saveButton).click();


  cy.get(ssoSelector.autoSSOToggle).should("be.disabled");
  verifyTooltipDisabled(ssoSelector.autoSSOToggle,
    ssoText.autoSSOToggleMessage
  );

  cy.task("dbConnection", {
    dbconfig: Cypress.env("app_db"),
    sql: "UPDATE sso_configs SET enabled = true WHERE sso='google' AND organization_id IS NULL;UPDATE sso_configs SET enabled = false WHERE sso IN ('git','openid') AND organization_id IS NULL;",
  });
  passwordToggle(false, pageName === "instance" ? "instance" : "organization");

  cy.reload();

  if (pageName === "instance" ? openInstanceSettings() : common.navigateToManageSSO());

  cy.get(ssoSelector.autoSSOToggle).should("not.be.disabled").check();
  cy.get(ssoSelector.modalMessage).should("be.visible");
  cy.get(commonSelectors.confirmationButton).click();
  cy.get(ssoSelector.autoSSOToggle).should("be.checked");

  cy.get(ssoSelector.passwordEnableToggle).check();
  cy.get(commonSelectors.enablePasswordLoginTitle).should("be.visible").verifyVisibleElement(
    "have.text",
    commonText.enablePasswordLoginTitle
  );
  cy.get(commonSelectors.enablePasswordLoginModal).verifyVisibleElement(
    "have.text",
    commonText.enablePasswordLoginModal
  );
  cy.get(commonSelectors.cancelButton).eq(1).click();
  cy.get(ssoSelector.passwordEnableToggle).should("not.be.checked");
  cy.get(ssoSelector.passwordEnableToggle).check();
  cy.get(commonSelectors.confirmationButton).click();
  cy.get(ssoSelector.passwordEnableToggle).should("be.checked");
  cy.get(commonSelectors.saveButton).click();
  cy.get(ssoSelector.autoSSOToggle).should("not.be.checked").and("be.disabled");

  if (pageName === "workspace") {
    cy.get(ssoSelector.allowDefaultSSOToggle).click();
    cy.wait(200);
    cy.verifyToastMessage(commonSelectors.toastMessage, ssoText.defaultSsoToast);
    cy.get(ssoSelector.allowDefaultSSOToggle).should("not.be.checked");
    cy.get(ssoSelector.allowDefaultSSOToggle).click();
  }

  if (pageName === "instance") {
    cy.get(ssoSelector.linkReadDocumentation).should("be.visible")
      .and("have.attr", "href")
      .and("include", "/enterprise/superadmin/#instance-login");
  }

  instanceSSOConfig(false);
  passwordToggle(true, pageName === "instance" ? "instance" : "organization");
  cy.reload();

  cy.get(ssoSelector.passwordEnableToggle).should("be.disabled");

  common.verifyTooltipDisabled(
    ssoSelector.passwordEnableToggle,
    "Password login cannot be disabled unless SSO is configured"
  );
};

export const loginSettingPageElements = (pageName) => {
  const pageKey = `${pageName}LoginPage`;
  const selectors = ssoSelector[pageKey];
  const texts = ssoText[pageKey];

  if (!selectors || !texts) {
    throw new Error(`Unknown pageKey: ${pageKey}`);
  }

  Object.entries(selectors).forEach(([key, selector]) => {
    cy.get(selector).verifyVisibleElement('have.text', texts[key]);
  });
};

export const googleSSOPageElements = (pageName) => {

  cy.get(ssoSelector.google).should("be.visible").click();
  cy.get(ssoSelector.cardTitle)
    .eq(1)
    .verifyVisibleElement("have.text", ssoText.googleTitle);
  cy.get(ssoSelector.statusLabel).should("be.visible").and("have.text", "Disabled");
  cy.get(ssoSelector.googleEnableToggle).should("be.visible").click();
  cy.get(ssoSelector.saveButton).eq(1).click();

  if (pageName === "workspace") {
    verifyElementText(ssoSelector.ssoEnableModal, ssoText.googleSSOEnableModal);
    cy.get(ssoSelector.modalCloseButton).should("be.visible");
    cy.get(ssoSelector.cancelButton)
      .eq(2)
      .verifyVisibleElement("have.text", "Cancel");
    cy.get(ssoSelector.enableButton).click();
    cy.verifyToastMessage(commonSelectors.toastMessage, ssoText.googleSSOToast);
    cy.get(ssoSelector.statusLabel).verifyVisibleElement(
      "have.text",
      ssoText.enabledLabel
    );
  }

  cy.clearAndType(ssoSelector.clientIdInput, ssoText.testClientId);
  cy.get(ssoSelector.cancelButton).eq(1).click();
  cy.get(ssoSelector.google).click();
  cy.get(ssoSelector.googleEnableToggle).click();
  if (pageName === "workspace") {
    cy.get(ssoSelector.clientIdInput).should("have.value", "");
  }
  cy.clearAndType(ssoSelector.clientIdInput, ssoText.clientId);
  cy.get(ssoSelector.saveButton).eq(1).click();
  cy.verifyToastMessage(commonSelectors.toastMessage, ssoText.googleSSOToast);
  cy.get(ssoSelector.clientIdInput).should("have.value", ssoText.clientId);

  verifyLabelAndInput(ssoSelector.googleSSOPageElements, ssoText.googleSSOPageElements);
  cy.get(ssoSelector.redirectUrl).should("be.visible");
  cy.get(ssoSelector.copyIcon).should("be.visible");

  cy.get(ssoSelector.cancelButton)
    .eq(1)
    .verifyVisibleElement("have.text", ssoText.cancelButton);

  cy.get(ssoSelector.saveButton)
    .eq(1)
    .verifyVisibleElement("have.text", ssoText.saveButton);
  cy.get(ssoSelector.googleEnableToggle).click();
  cy.get(ssoSelector.saveButton).eq(1).click();

  cy.apiLogout();
  if (pageName === "workspace" ? cy.visit("/login/my-workspace") : cy.visit("localhost:8082/login"));
  cy.get(ssoSelector.googleIcon).should("be.visible");
  cy.get(ssoSelector.googleSSOText).verifyVisibleElement(
    "have.text",
    ssoText.googleSSOText
  );
};

export const gitSSOPageElements = (pageName) => {
  cy.get(ssoSelector.git).should("be.visible").click();
  cy.get(ssoSelector.cardTitle)
    .eq(1)
    .verifyVisibleElement("have.text", ssoText.gitTitle);
  cy.get(ssoSelector.statusLabel).should("be.visible").and("have.text", "Disabled");
  cy.get(ssoSelector.gitEnableToggle).should("be.visible").click();
  cy.get(ssoSelector.saveButton).eq(1).click();

  if (pageName === "workspace") {
    verifyElementText(ssoSelector.ssoEnableModal, ssoText.githubSSOEnableModal);
    cy.get(ssoSelector.modalCloseButton).should("be.visible");
    cy.get(ssoSelector.cancelButton)
      .eq(2)
      .verifyVisibleElement("have.text", "Cancel");
    cy.get(ssoSelector.enableButton).click();
    cy.verifyToastMessage(commonSelectors.toastMessage, ssoText.gitSSOToast);
    cy.get(ssoSelector.statusLabel).verifyVisibleElement(
      "have.text",
      ssoText.enabledLabel
    );
  }
  cy.clearAndType(ssoSelector.hostNameInput, ssoText.hostName);
  cy.clearAndType(ssoSelector.clientIdInput, ssoText.clientId);
  cy.clearAndType(ssoSelector.clientSecretInput, ssoText.testClientId);
  cy.get(ssoSelector.cancelButton).eq(1).click();
  cy.get(ssoSelector.git).click();
  cy.get(ssoSelector.gitEnableToggle).click();

  cy.clearAndType(ssoSelector.hostNameInput, ssoText.hostName);
  cy.clearAndType(ssoSelector.clientIdInput, ssoText.clientId);
  cy.clearAndType(ssoSelector.clientSecretInput, ssoText.testClientId);
  cy.get(ssoSelector.saveButton).eq(1).click();
  cy.verifyToastMessage(commonSelectors.toastMessage, ssoText.gitSSOToast);

  cy.get(ssoSelector.hostNameInput).should("have.value", ssoText.hostName);
  cy.get(ssoSelector.clientIdInput).should("have.value", ssoText.clientId);
  cy.get(ssoSelector.clientSecretInput).should("have.value", ssoText.testClientId);

  verifyLabelAndInput(ssoSelector.githubSSOPageElements, ssoText.githubSSOPageElements);
  cy.get(ssoSelector.hostNameHelpText).should("have.text", ssoText.hostNameHelpText);
  cy.get(ssoSelector.clientSecretLabel)
    .should(($el) => {
      expect($el.contents().first().text().trim()).to.eq(
        ssoText.clientSecretLabel
      );
    });
  cy.get(ssoSelector.encriptedLabel).should("have.text", ssoText.encriptedLabel);
  cy.get(ssoSelector.clientSecretInput).should("be.visible");
  cy.get(ssoSelector.redirectUrl).should("be.visible");
  cy.get(ssoSelector.copyIcon).should("be.visible");


  cy.get(ssoSelector.cancelButton)
    .eq(1)
    .verifyVisibleElement("have.text", ssoText.cancelButton);

  cy.get(ssoSelector.saveButton)
    .eq(1)
    .verifyVisibleElement("have.text", ssoText.saveButton);
  cy.get(ssoSelector.gitEnableToggle).click();
  cy.get(ssoSelector.saveButton).eq(1).click();

  cy.apiLogout();
  if (pageName === "workspace" ? cy.visit("/login/my-workspace") : cy.visit("localhost:8082/login"));
  cy.get(ssoSelector.gitIcon).should("be.visible");
  cy.get(ssoSelector.gitSignInText).verifyVisibleElement(
    "have.text",
    ssoText.gitSignInText
  );
};

export const oidcSSOPageElements = (pageName) => {
  cy.wait(1000);
  cy.get(ssoSelector.oidc).click();
  cy.get(ssoSelector.oidcTitle).verifyVisibleElement("have.text", ssoText.oidcTitle);
  cy.get(ssoSelector.statusLabel).eq(0).should("be.visible").and("have.text", "Disabled");
  cy.get(ssoSelector.oidcEnableToggle).should("be.visible").click();

  if (pageName === "workspace") {
    cy.clearAndType(ssoSelector.clientSecretInput, ssoText.testclientSecret);
    cy.get(ssoSelector.saveButton).eq(1).click();
    verifyElementText(ssoSelector.ssoEnableModal, ssoText.oidcSSOEnableModal);
    cy.get(ssoSelector.modalCloseButton).should("be.visible");
    cy.get(ssoSelector.cancelButton)
      .eq(2)
      .verifyVisibleElement("have.text", "Cancel");
    cy.get(ssoSelector.enableButton).click();
    cy.verifyToastMessage(commonSelectors.toastMessage, ssoText.oidcSSOToast);
    cy.get(ssoSelector.statusLabel).eq(0).verifyVisibleElement(
      "have.text",
      ssoText.enabledLabel
    );
  }

  cy.clearAndType(ssoSelector.nameInput, ssoText.testName);
  cy.clearAndType(ssoSelector.clientIdInput, ssoText.testclientId);
  cy.clearAndType(ssoSelector.clientSecretInput, ssoText.testclientSecret);
  cy.clearAndType(ssoSelector.wellKnownUrlInput, ssoText.testWellknownUrl);
  cy.get(ssoSelector.cancelButton).eq(1).click();
  cy.get(ssoSelector.oidc).click();
  cy.get(ssoSelector.oidcEnableToggle).click();

  if (pageName === "workspace") {
    cy.get(ssoSelector.nameInput).should("have.value", "");
    cy.get(ssoSelector.clientIdInput).should("have.value", "");
    cy.get(ssoSelector.clientSecretInput).should("have.value", ssoText.testclientSecret);
    cy.get(ssoSelector.wellKnownUrlInput).should("have.value", "");
  }

  cy.clearAndType(ssoSelector.nameInput, ssoText.testName);
  cy.clearAndType(ssoSelector.clientIdInput, ssoText.testclientId);
  cy.clearAndType(ssoSelector.clientSecretInput, ssoText.testclientSecret);
  cy.clearAndType(ssoSelector.wellKnownUrlInput, ssoText.testWellknownUrl);

  cy.get(ssoSelector.saveButton).eq(1).click();
  cy.verifyToastMessage(commonSelectors.toastMessage, ssoText.oidcSSOToast);

  cy.get(ssoSelector.nameInput).should("have.value", ssoText.testName);
  cy.get(ssoSelector.clientIdInput).should("have.value", ssoText.testclientId);
  cy.get(ssoSelector.clientSecretInput).should("have.value", ssoText.testclientSecret);
  cy.get(ssoSelector.wellKnownUrlInput).should("have.value", ssoText.testWellknownUrl);

  verifyLabelAndInput(ssoSelector.oidcSSOPageElements, ssoText.oidcSSOPageElements);
  cy.get(ssoSelector.clientSecretLabel)
    .should(($el) => {
      expect($el.contents().first().text().trim()).to.eq(
        ssoText.clientSecretLabel
      );
    });
  cy.get(ssoSelector.encriptedLabel).should("have.text", ssoText.encriptedLabel);
  cy.get(ssoSelector.clientSecretInput).scrollIntoView().should("be.visible");
  cy.get(ssoSelector.redirectUrl).should("be.visible");
  cy.get(ssoSelector.copyIcon).should("be.visible");

  //Groups Sync section
  cy.get(ssoSelector.groupsyncTitle).should("have.text", " GROUP SYNC ");
  cy.get(ssoSelector.groupsyncToggleLabel).should("have.text", "Enable group sync");
  cy.get(ssoSelector.groupsyncHelperText).should("have.text", "Sync user groups from your IdP");
  if (pageName === "workspace") {
    verifyLabelAndInput(ssoSelector.groupsyncElements, ssoText.groupsyncElements);
    cy.get(ssoSelector.groupsyncMappingHelperText).should("have.text", ssoText.groupMappingHelperText);
  }

  cy.get(ssoSelector.cancelButton)
    .eq(1)
    .verifyVisibleElement("have.text", ssoText.cancelButton);

  cy.get(ssoSelector.saveButton)
    .eq(1)
    .verifyVisibleElement("have.text", ssoText.saveButton);


  cy.apiLogout();
  if (pageName === "workspace" ? cy.visit("/login/my-workspace") : cy.visit("localhost:8082/login"));
  cy.get(ssoSelector.oidcIcon).should("be.visible");
  cy.get(ssoSelector.oidcSSOText).verifyVisibleElement(
    "have.text",
    ssoText.oidcSSOText
  );
};

export const ldapSSOPageElements = () => {
  cy.wait(1000);
  cy.get(ssoSelector.ldap).click();
  cy.get(ssoSelector.ldapTitle).verifyVisibleElement("have.text", ssoText.ldapTitle);
  cy.get(ssoSelector.statusLabel).eq(0).should("be.visible").and("have.text", "Disabled");
  cy.get(ssoSelector.ldapEnableToggle).should("be.visible").click();
  cy.get(ssoSelector.saveButton).eq(1).click();

  cy.clearAndType(ssoSelector.nameInput, ssoText.ldapName);
  cy.clearAndType(ssoSelector.hostInput, ssoText.ldapHost);
  cy.clearAndType(ssoSelector.portInput, ssoText.ldapPort);
  cy.clearAndType(ssoSelector.baseDnInput, ssoText.ldapBaseDn);

  cy.get(ssoSelector.cancelButton).eq(1).click();
  cy.get(ssoSelector.ldap).click();
  cy.get(ssoSelector.ldapEnableToggle).click();

  cy.get(ssoSelector.nameInput).should("have.value", "");
  cy.get(ssoSelector.hostInput).should("have.value", "");
  cy.get(ssoSelector.portInput).should("have.value", "");
  cy.get(ssoSelector.baseDnInput).should("have.value", "");

  cy.clearAndType(ssoSelector.nameInput, ssoText.ldapName);
  cy.clearAndType(ssoSelector.hostInput, ssoText.ldapHost);
  cy.clearAndType(ssoSelector.portInput, ssoText.ldapPort);
  cy.clearAndType(ssoSelector.baseDnInput, ssoText.ldapBaseDn);

  cy.get(ssoSelector.saveButton).eq(1).click();
  cy.verifyToastMessage(commonSelectors.toastMessage, ssoText.ldapSSOToast);

  cy.get(ssoSelector.nameInput).should("have.value", ssoText.ldapName);
  cy.get(ssoSelector.hostInput).should("have.value", ssoText.ldapHost);
  cy.get(ssoSelector.portInput).should("have.value", ssoText.ldapPort);
  cy.get(ssoSelector.baseDnInput).should("have.value", ssoText.ldapBaseDn);

  verifyLabelAndInput(ssoSelector.ldapSSOPageElements, ssoText.ldapSSOPageElements);
  cy.get(ssoSelector.baseDnHelperText).should("have.text", ssoText.ldapBaseDNHelperText);
  cy.get(ssoSelector.sslToggle).should("be.visible");

  cy.get(ssoSelector.cancelButton)
    .eq(1)
    .verifyVisibleElement("have.text", ssoText.cancelButton);

  cy.get(ssoSelector.saveButton)
    .eq(1)
    .verifyVisibleElement("have.text", ssoText.saveButton);
  cy.get(ssoSelector.ldapEnableToggle).click();
  cy.get(ssoSelector.saveButton).eq(1).click();

  cy.apiLogout();
  cy.visit("/login/my-workspace");
  cy.get(ssoSelector.ldapIcon).should("be.visible");
  cy.get(ssoSelector.ldapSSOText).verifyVisibleElement(
    "have.text",
    ssoText.ldapSSOText
  );
};

export const samlSSOPageElements = () => {
  cy.wait(1000);
  cy.get(ssoSelector.saml).click();
  cy.get(ssoSelector.samlTitle).verifyVisibleElement("have.text", ssoText.samlTitle);
  cy.get(ssoSelector.statusLabel).eq(0).should("be.visible").and("have.text", "Disabled");
  cy.get(ssoSelector.samlEnableToggle).should("be.visible").click();
  cy.get(ssoSelector.saveButton).eq(1).click();

  cy.clearAndType(ssoSelector.nameInput, ssoText.samlName);
  cy.clearAndType(ssoSelector.samlMetadataInput, ssoText.samlMetadataInput);
  cy.clearAndType(ssoSelector.samlGroupAttributeInput, ssoText.samlGroupAttributeInput);

  cy.get(ssoSelector.cancelButton).eq(1).click();
  cy.get(ssoSelector.saml).click();
  cy.get(ssoSelector.samlEnableToggle).click();

  cy.get(ssoSelector.nameInput).should("have.value", "");
  cy.get(ssoSelector.samlMetadataInput).should("have.value", "");
  cy.get(ssoSelector.samlGroupAttributeInput).should("have.value", "");

  cy.clearAndType(ssoSelector.nameInput, ssoText.samlName);
  cy.clearAndType(ssoSelector.samlMetadataInput, ssoText.samlMetadataInput);
  cy.clearAndType(ssoSelector.samlGroupAttributeInput, ssoText.samlGroupAttributeInput);

  cy.get(ssoSelector.saveButton).eq(1).click();
  cy.verifyToastMessage(commonSelectors.toastMessage, ssoText.samlSSOToast);

  cy.get(ssoSelector.nameInput).should("have.value", ssoText.samlName);
  cy.get(ssoSelector.samlMetadataInput).should("have.value", ssoText.samlMetadataInput);
  cy.get(ssoSelector.samlGroupAttributeInput).should("have.value", ssoText.samlGroupAttributeInput);

  verifyLabelAndInput(ssoSelector.samlSSOPageElements, ssoText.samlSSOPageElements);
  cy.get(ssoSelector.baseDnHelperText).should("have.text", ssoText.baseDNHelperText);
  cy.get(ssoSelector.groupAttributeHelperText).should("have.text", ssoText.groupAttributeHelperText);
  cy.get(ssoSelector.copyIcon).eq(1).click();

  cy.get(ssoSelector.cancelButton)
    .eq(1)
    .verifyVisibleElement("have.text", ssoText.cancelButton);

  cy.get(ssoSelector.saveButton)
    .eq(1)
    .verifyVisibleElement("have.text", ssoText.saveButton);
  cy.get(ssoSelector.samlEnableToggle).click();
  cy.get(ssoSelector.saveButton).eq(1).click();

  cy.apiLogout();
  cy.visit("/login/my-workspace");
  cy.get(ssoSelector.samlIcon).should("be.visible");
  cy.get(ssoSelector.samlSSOText).verifyVisibleElement(
    "have.text",
    ssoText.samlSSOText
  );
};

export const visitWorkspaceLoginPage = () => {
  cy.get(ssoSelector.workspaceLoginUrl).then(($temp) => {
    const url = $temp.text();
    common.logout();
    cy.wait(1000);
    cy.visit(url);
  });
};

export const workspaceLoginPageElements = (workspaceName) => {
  signInPageElements();
  cy.get(ssoSelector.workspaceSubHeader).verifyVisibleElement(
    "have.text",
    ssoText.workspaceSubHeader(workspaceName)
  );
};

export const signInPageElements = () => {
  cy.get(ssoSelector.signInHeader).verifyVisibleElement(
    "have.text",
    ssoText.signInHeader
  );
  cy.get(commonSelectors.workEmailLabel).verifyVisibleElement(
    "have.text",
    commonText.workEmailLabel
  );
  cy.get(commonSelectors.passwordLabel).should(($el) => {
    expect($el.contents().first().text().trim()).to.eq(
      commonText.passwordLabel
    );
  });
  cy.get(commonSelectors.forgotPasswordLink).verifyVisibleElement(
    "have.text",
    commonText.forgotPasswordLink
  );
  cy.get(onboardingSelectors.signInButton).verifyVisibleElement(
    "have.text",
    commonText.loginButton
  );

  cy.get(onboardingSelectors.loginEmailInput).should("be.visible");
  cy.get(onboardingSelectors.loginPasswordInput).should("be.visible");

  cy.get("body").then(($el) => {
    if ($el.text().includes("Google")) {
      cy.get(ssoSelector.googleSSOText).verifyVisibleElement(
        "have.text",
        ssoText.googleSSOText
      );
      cy.get(ssoSelector.gitSSOText).verifyVisibleElement(
        "have.text",
        ssoText.gitSignInText
      );
    }
  });
};

export const enableSignUp = () => {
  common.navigateToManageSSO();
  cy.get("body").then(($el) => {
    if (!$el.text().includes("Allowed domains")) {
      cy.get(ssoSelector.generalSettingsElements.generalSettings).click();
    }
  });
  cy.get(ssoSelector.enableSignUpToggle).then(($el) => {
    if (!$el.is(":checked")) {
      cy.get(ssoSelector.enableSignUpToggle).check();
      cy.get(ssoSelector.saveButton).click();
      cy.verifyToastMessage(commonSelectors.toastMessage, ssoText.ssoToast);
    }
  });
};



export const disableSignUp = () => {
  common.navigateToManageSSO();
  cy.get("body").then(($el) => {
    if (!$el.text().includes("Allowed domains")) {
      cy.get(ssoSelector.generalSettingsElements.generalSettings).click();
    }
  });
  cy.get(ssoSelector.enableSignUpToggle).then(($el) => {
    if ($el.is(":checked")) {
      cy.get(ssoSelector.enableSignUpToggle).uncheck();
      cy.get(ssoSelector.saveButton).click();
      cy.verifyToastMessage(commonSelectors.toastMessage, ssoText.ssoToast);
    }
  });
};

export const invitePageElements = () => {
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
  cy.get(onboardingSelectors.loginPasswordInput).should("be.visible");
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

export const updateSsoId = (ssoId, sso, workspaceId) => {
  cy.task("dbConnection", {
    dbconfig: Cypress.env("app_db"),
    sql: `UPDATE sso_configs SET id='${ssoId}' WHERE sso='${sso}' AND organization_id='${workspaceId}';`,
  });
};

export const setSSOStatus = (workspaceName, ssoType, enabled) => {
  let workspaceId;

  cy.task("dbConnection", {
    dbconfig: Cypress.env("app_db"),
    sql: `SELECT id FROM organizations WHERE name = '${workspaceName}'`,
  }).then((resp) => {
    workspaceId = resp.rows[0].id;

    cy.task("dbConnection", {
      dbconfig: Cypress.env("app_db"),
      sql: `SELECT * FROM sso_configs WHERE organization_id = '${workspaceId}' AND sso = '${ssoType}'`,
    }).then((ssoConfigResp) => {
      if (ssoConfigResp.rows.length > 0) {
        cy.task("dbConnection", {
          dbconfig: Cypress.env("app_db"),
          sql: `UPDATE sso_configs SET enabled = ${
            enabled ? "true" : "false"
          } WHERE organization_id = '${workspaceId}' AND sso = '${ssoType}'`,
        });
      }
    });
  });
};

export const defaultSSO = (enable) => {
  cy.getAuthHeaders().then((headers) => {
    cy.request(
      {
        method: "PATCH",
        url: `${Cypress.env("server_host")}/api/login-configs/organization-general/inherit-sso`,
        headers: headers,
        body: { inheritSSO: enable },
      },
      { log: false }
    ).then((response) => {
      expect(response.status).to.equal(200);
    });
  });
};

export const setSignupStatus = (enable, workspaceName = "My workspace") => {
  cy.task("dbConnection", {
    dbconfig: Cypress.env("app_db"),
    sql: `SELECT id FROM organizations WHERE name = '${workspaceName}'`,
  }).then((resp) => {
    const workspaceId = resp.rows[0].id;

    cy.getAuthHeaders().then((headers) => {
      cy.request({
        method: "PATCH",
        url: `${Cypress.env("server_host")}/api/login-configs/organization-general`,
        headers: headers,
        body: { enableSignUp: enable },
      }).then((response) => {
        expect(response.status).to.equal(200);
      });
    });
  });
};

export const deleteOrganisationSSO = (workspaceName, services) => {
  let workspaceId;
  cy.task("dbConnection", {
    dbconfig: Cypress.env("app_db"),
    sql: `select id from organizations where name='${workspaceName}';`,
  }).then((resp) => {
    workspaceId = resp.rows[0].id;

    cy.task("dbConnection", {
      dbconfig: Cypress.env("app_db"),
      sql: `DELETE FROM sso_configs WHERE organization_id = '${workspaceId}' AND sso IN (${services
        .map((service) => `'${service}'`)
        .join(",")});`,
    });
  });
};

export const resetDomain = () => {
  cy.getAuthHeaders().then((headers) => {
    cy.request(
      {
        method: "PATCH",
        url: `${Cypress.env("server_host")}/api/login-configs/organization-general`,
        headers: headers,
        body: { domain: "" },
      },
      { log: false }
    ).then((response) => {
      expect(response.status).to.equal(200);
    });
  });
};

export const enableInstanceSignup = (enable = true) => {
  cy.getAuthHeaders().then((headers) => {
    cy.request({
      method: "PATCH",
      url: `${Cypress.env("server_host")}/api/login-configs/instance-general`,
      headers: headers,
      body: { enableSignUp: enable },
    }).then((response) => {
      expect(response.status).to.equal(200);
    });
  });
};

export const updateOIDCConfig = (orgId) => {
  const ssoConfigId = "22f22523-7bc2-4134-891d-88bdfec073cd";
  const sso = "'openid'";
  const configs = `'{
    "name": "",
    "clientId": "",
    "clientSecret": "",
    "wellKnownUrl": ""
  }'`;
  const configScope = "'organization'";
  const syncId = "a6a2f665-f96e-4c82-91cb-6e0a99c32d21"; // Explicit id for second table
  const claimName = "groups";
  const groupMapping = "{}";

  cy.task("dbConnection", {
    dbconfig: Cypress.env("app_db"),
    sql: `
          INSERT INTO sso_configs (
            id,
            organization_id,
            sso,
            configs,
            enabled,
            config_scope
          ) VALUES (
            '${ssoConfigId}',
            '${orgId}',
            ${sso},
            ${configs},
            true,
            ${configScope}
          );
        `,
  });

  cy.task("dbConnection", {
    dbconfig: Cypress.env("app_db"),
    sql: `
            INSERT INTO sso_config_oidc_group_sync (
              id,
              sso_config_id,
              organization_id,
              claim_name,
              group_mapping,
              enable_group_sync
            ) VALUES (
              '${syncId}',
              '${ssoConfigId}',
              '${orgId}',
              '${claimName}',
              '${groupMapping}',
              true
            );
          `,
  });
};

export const authResponse = (matcher) => {
  cy.intercept("POST", "/api/authorize", (req) => {
    req.continue((res) => {
      matcher(res.body);
    });
  }).as("authorizeCheck");
};

export const addOIDCConfig = (
  groupMapping,
  level = "workspace",
  extra = {}
) => {
  const config = {
    type: "openid",
    configs: {
      name: "",
      clientId: Cypress.env("okta_client_id"),
      clientSecret: Cypress.env("okta_client_secret"),
      codeVerifier: "",
      grantType: "authorization_code",
      wellKnownUrl: `https://${Cypress.env("okta_domain")}/.well-known/openid-configuration`,
      ...(level === "instance" ? { enableGroupSync: true } : {}),
    },
    oidcGroupSyncs: [
      {
        claimName: "groups",
        groupMapping: { ...groupMapping },
        ...(level === "instance"
          ? { organizationId: extra.organizationId, id: extra.id }
          : {}),
      },
    ],
    enabled: true,
  };
  return cy.apiUpdateSSOConfig(config, level);
};

export const uiOktaLogin = (email, password) => {
  cy.get('input[name="identifier"]').type(email);
  cy.get(".button-primary").click();
  cy.get('input[name="credentials.passcode"]').type(password);
  cy.get(".button-primary").click();
};

export const toggleSsoViaUI = (
  provider,
  settingsUrl = "settings/instance-login"
) => {
  cy.wait(1000);
  const isInstance = settingsUrl === "settings/instance-login";
  cy.intercept(
    "PATCH",
    `/api/login-configs/${isInstance ? "instance" : "organization"}-sso`
  ).as("patchInstanceSSO");

  cy.visit(settingsUrl);
  cy.wait(1000);
  cy.get(`[data-cy="${cyParamName(provider)}-label"]`).click();
  cy.wait(1000);
  cy.get(`[data-cy="${cyParamName(provider)}-toggle-input"]`).click();
  cy.get(`[data-cy="save-button"]`).eq(1).click();

  cy.wait("@patchInstanceSSO").its("response.statusCode").should("eq", 200);
  cy.wait(1000);
};

export const gitHubSignInWithAssertion = (
  assertion = null,
  githubUsername = Cypress.env("GITHUB_USERNAME"),
  githubPassword = Cypress.env("GITHUB_PASSWORD")
) => {
  cy.origin(
    "https://github.com",
    { args: { githubUsername, githubPassword, assertion } },
    ({ githubUsername, githubPassword, assertion }) => {
      cy.get('input[name="login"]', { timeout: 15000 }).type(githubUsername);
      cy.get('input[name="password"]').type(githubPassword);
      cy.get('input[name="commit"]').click();
      cy.log("GitHub login submitted");

      cy.get("body").then(($body) => {
        if (
          $body.find('[data-octo-click="oauth_application_authorization"]')
            .length > 0
        ) {
          cy.get('[data-octo-click="oauth_application_authorization"]').click();
          cy.log("GitHub authorization button clicked");
        }
      });

      if (assertion && assertion.type === "failure") {
        cy.get(
          '[alt="404 “This is not the web page you are looking for”"]'
        ).should("be.visible");
      } else if (assertion && assertion.type === "selector") {
        cy.get(assertion.selector).should(assertion.condition, assertion.value);
      }
    }
  );
};

/**
 * Deletes a single test user by email from the database
 * @param {string} email - The email of the user to delete
 */
export const cleanupTestUser = (email) => {
  cy.runSqlQuery(
    `SELECT EXISTS(SELECT 1 FROM users WHERE email = '${email}');`
  ).then((result) => {
    cy.log("User existence :", JSON.stringify(result?.rows?.[0]?.exists));
    if (result?.rows?.[0]?.exists) {
      cy.runSqlQuery(`CALL delete_users(ARRAY['${email}']::text[]);`);
    }
  });
};

export const verifyLabelAndInput = (selectors, texts) => {
  Object.entries(texts).forEach(([key, expectedText]) => {
    const labelSelector = selectors[key];
    const inputSelector = selectors[key.replace('Label', 'Input')];

    //Verify label text
    cy.get(labelSelector)
      .scrollIntoView()
      .should('be.visible')
      .and('have.text', expectedText);

    //Verify corresponding input is enabled (if exists)
    if (inputSelector) {
      cy.get(inputSelector)
        .scrollIntoView()
        .should('be.visible')
        .and('be.enabled');
    }
  });
};

export const verifyElementText = (selectors, texts) => {
  Object.entries(texts).forEach(([key, expectedText]) => {
    const selector = selectors[key];

    cy.get(selector)
      .scrollIntoView()
      .should('be.visible')
      .and('have.text', expectedText);
  });
};

