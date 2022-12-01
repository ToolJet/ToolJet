import { commonSelectors } from "Selectors/common";
import { ssoSelector } from "Selectors/manageSSO";
import { ssoText } from "Texts/manageSSO";
import * as common from "Support/utils/common";
import { commonText } from "Texts/common";
import { loginSelectors } from "Selectors/login";
import { dashboardSelector } from "Selectors/dashboard";

export const generalSettings = () => {
  cy.get(ssoSelector.enableSignUpToggle).then(($el) => {
    if ($el.is(":checked")) {
      cy.get(ssoSelector.enableSignUpToggle).uncheck();
      cy.get(ssoSelector.cancelButton).click();
      cy.get(ssoSelector.enableSignUpToggle).should("be.checked");
    } else {
      cy.get(ssoSelector.enableSignUpToggle).check();
      cy.get(ssoSelector.cancelButton).click();
      cy.get(ssoSelector.enableSignUpToggle).should("not.be.checked");
      cy.get(ssoSelector.enableSignUpToggle).check();
    }
    cy.get(ssoSelector.allowDefaultSSOToggle).then(($el) => {
      if ($el.is(":checked")) {
        cy.get(ssoSelector.allowDefaultSSOToggle).uncheck();
        cy.get(ssoSelector.cancelButton).click();
        cy.get(ssoSelector.allowDefaultSSOToggle).should("not.be.checked");
      } else {
        cy.get(ssoSelector.allowDefaultSSOToggle).check();
        cy.get(ssoSelector.cancelButton).click();
        cy.get(ssoSelector.allowDefaultSSOToggle).should("be.checked");
        cy.get(ssoSelector.allowDefaultSSOToggle).check();
      }
    });
    cy.clearAndType(ssoSelector.allowedDomainInput, ssoText.allowedDomain);
    cy.get(ssoSelector.saveButton).click();
    cy.verifyToastMessage(commonSelectors.toastMessage, ssoText.ssoToast);
  });
};

export const googleSSO = () => {
  cy.get(ssoSelector.googleEnableToggle).then(($el) => {
    if ($el.is(":checked")) {
      cy.get(ssoSelector.statusLabel).verifyVisibleElement(
        "have.text",
        ssoText.enabledLabel
      );
      cy.get(ssoSelector.googleEnableToggle).uncheck();
      cy.verifyToastMessage(
        commonSelectors.toastMessage,
        ssoText.googleDisableToast
      );
      cy.get(ssoSelector.statusLabel).verifyVisibleElement(
        "have.text",
        ssoText.disabledLabel
      );
      cy.get(ssoSelector.googleEnableToggle).check();
      cy.verifyToastMessage(
        commonSelectors.toastMessage,
        ssoText.googleEnabledToast
      );
      cy.get(ssoSelector.statusLabel).verifyVisibleElement(
        "have.text",
        ssoText.enabledLabel
      );
    } else {
      cy.get(ssoSelector.googleEnableToggle).check();
      cy.verifyToastMessage(
        commonSelectors.toastMessage,
        ssoText.googleEnabledToast
      );
      cy.get(ssoSelector.statusLabel).verifyVisibleElement(
        "have.text",
        ssoText.enabledLabel
      );

      cy.get(ssoSelector.googleEnableToggle).uncheck();
      cy.verifyToastMessage(
        commonSelectors.toastMessage,
        ssoText.googleDisableToast
      );
      cy.get(ssoSelector.statusLabel).verifyVisibleElement(
        "have.text",
        ssoText.disabledLabel
      );
      cy.get(ssoSelector.googleEnableToggle).check();
      cy.get(ssoSelector.statusLabel).verifyVisibleElement(
        "have.text",
        ssoText.enabledLabel
      );
    }
    cy.clearAndType(ssoSelector.clientIdInput, ssoText.testClientId);
    cy.get(ssoSelector.cancelButton).click();
    cy.clearAndType(ssoSelector.clientIdInput, ssoText.clientId);
    cy.get(ssoSelector.saveButton).click();
    cy.verifyToastMessage(commonSelectors.toastMessage, ssoText.ssoToast2);
    cy.get(ssoSelector.clientIdInput).should("have.value", ssoText.clientId);
  });
};

export const gitSSO = () => {
  cy.get(ssoSelector.gitEnableToggle).then(($el) => {
    if ($el.is(":checked")) {
      cy.get(ssoSelector.statusLabel).verifyVisibleElement(
        "have.text",
        ssoText.enabledLabel
      );
      cy.get(ssoSelector.gitEnableToggle).uncheck();
      cy.verifyToastMessage(
        commonSelectors.toastMessage,
        ssoText.gitDisabledToast
      );
      cy.get(ssoSelector.statusLabel).verifyVisibleElement(
        "have.text",
        ssoText.disabledLabel
      );
      cy.get(ssoSelector.gitEnableToggle).check();
      cy.verifyToastMessage(
        commonSelectors.toastMessage,
        ssoText.gitEnabledToast
      );
      cy.get(ssoSelector.statusLabel).verifyVisibleElement(
        "have.text",
        ssoText.enabledLabel
      );
    } else {
      cy.get(ssoSelector.statusLabel).verifyVisibleElement(
        "have.text",
        ssoText.disabledLabel
      );
      cy.get(ssoSelector.gitEnableToggle).check();
      cy.verifyToastMessage(
        commonSelectors.toastMessage,
        ssoText.gitEnabledToast
      );
      cy.get(ssoSelector.statusLabel).verifyVisibleElement(
        "have.text",
        ssoText.enabledLabel
      );
      cy.get(ssoSelector.gitEnableToggle).uncheck();
      cy.verifyToastMessage(
        commonSelectors.toastMessage,
        ssoText.gitDisabledToast
      );
      cy.get(ssoSelector.statusLabel).verifyVisibleElement(
        "have.text",
        ssoText.disabledLabel
      );
      cy.get(ssoSelector.gitEnableToggle).check();
      cy.get(ssoSelector.statusLabel).verifyVisibleElement(
        "have.text",
        ssoText.enabledLabel
      );
    }
    cy.clearAndType(ssoSelector.hostNameInput, ssoText.hostName);
    cy.clearAndType(ssoSelector.clientIdInput, ssoText.clientId);
    cy.clearAndType(ssoSelector.clientSecretInput, ssoText.testClientId);
    cy.get(ssoSelector.saveButton).click();
    cy.verifyToastMessage(commonSelectors.toastMessage, ssoText.ssoToast2);
    cy.get(ssoSelector.hostNameInput).should("have.value", ssoText.hostName);
    cy.get(ssoSelector.clientIdInput).should("have.value", ssoText.clientId);
    cy.get(ssoSelector.clientSecretInput).should(
      "have.value",
      ssoText.testClientId
    );
  });
};

export const password = () => {
  cy.get(ssoSelector.passwordEnableToggle).then(($el) => {
    if ($el.is(":checked")) {
      cy.get(ssoSelector.statusLabel).verifyVisibleElement(
        "have.text",
        ssoText.enabledLabel
      );
      cy.get(ssoSelector.passwordEnableToggle).uncheck();
      cy.get(commonSelectors.modalComponent).should("be.visible");
      cy.get(commonSelectors.modalMessage).verifyVisibleElement(
        "have.text",
        ssoText.passwordDisableWarning
      );
      cy.get(commonSelectors.buttonSelector("Yes")).click();
      cy.verifyToastMessage(
        commonSelectors.toastMessage,
        ssoText.passwordDisabledToast
      );
      cy.get(ssoSelector.statusLabel).verifyVisibleElement(
        "have.text",
        ssoText.disabledLabel
      );

      cy.get(ssoSelector.passwordEnableToggle).check();
      cy.verifyToastMessage(
        commonSelectors.toastMessage,
        ssoText.passwordEnabledToast
      );
      cy.get(ssoSelector.statusLabel).verifyVisibleElement(
        "have.text",
        ssoText.enabledLabel
      );
    } else {
      cy.get(ssoSelector.statusLabel).verifyVisibleElement(
        "have.text",
        ssoText.disabledLabel
      );
      cy.get(ssoSelector.passwordEnableToggle).check();
      cy.verifyToastMessage(
        commonSelectors.toastMessage,
        ssoText.passwordEnabledToast
      );
      cy.get(ssoSelector.statusLabel).verifyVisibleElement(
        "have.text",
        ssoText.enabledLabel
      );

      cy.get(ssoSelector.passwordEnableToggle).uncheck();
      cy.verifyToastMessage(
        commonSelectors.toastMessage,
        ssoText.passwordDisabledToast
      );
      cy.get(ssoSelector.statusLabel).verifyVisibleElement(
        "have.text",
        ssoText.disabledLabel
      );
      cy.get(ssoSelector.passwordEnableToggle).check();
    }
  });
};

export const visitWorkspaceLoginPage = () => {
  cy.get(ssoSelector.generalSettingsElements.generalSettings).click();
  cy.get(ssoSelector.workspaceLoginUrl).then(($temp) => {
    const url = $temp.text();
    common.logout();
    cy.visit(url);
  });
};

export const enableDefaultSSO = () => {
  common.navigateToManageSSO();
  cy.get(ssoSelector.generalSettingsElements.generalSettings).click();
  cy.get(ssoSelector.allowDefaultSSOToggle).then(($el) => {
    if (!$el.is(":checked")) {
      cy.get(ssoSelector.allowDefaultSSOToggle).uncheck();
      cy.get(ssoSelector.saveButton).click();
      cy.verifyToastMessage(commonSelectors.toastMessage, ssoText.ssoToast);
    }
  });
};

export const disableDefaultSSO = () => {
  common.navigateToManageSSO();
  cy.get(ssoSelector.generalSettingsElements.generalSettings).click();
  cy.get(ssoSelector.allowDefaultSSOToggle).then(($el) => {
    if ($el.is(":checked")) {
      cy.get(ssoSelector.allowDefaultSSOToggle).uncheck();
      cy.get(ssoSelector.saveButton).click();
      cy.verifyToastMessage(commonSelectors.toastMessage, ssoText.ssoToast);
    }
  });
};

export const workspaceLoginPageElements = (workspaceName) => {
  signInPageElements();
  cy.get(ssoSelector.workspaceSubHeader).verifyVisibleElement(
    "have.text",
    ssoText.workspaceSubHeader(workspaceName)
  );
};

export const passwordLoginVisible = () => {
  cy.get(commonSelectors.workEmailInputField).should("be.visible");
  cy.get(commonSelectors.passwordInputField).should("be.visible");
  cy.get(commonSelectors.loginButton).verifyVisibleElement(
    "have.text",
    commonText.loginButton
  );
};

export const workspaceLogin = (workspaceName) => {
  cy.clearAndType(commonSelectors.workEmailInputField, "dev@tooljet.io");
  cy.clearAndType(commonSelectors.passwordInputField, "password");
  cy.get(loginSelectors.signInButton).click();
  cy.get(commonSelectors.homePageLogo).should("be.visible");
  cy.get(dashboardSelector.modeToggle, { timeout: 10000 }).should("be.visible");
  cy.get(commonSelectors.workspaceName).verifyVisibleElement(
    "have.text",
    workspaceName
  );
  cy.get("body").then(($el) => {
    if ($el.text().includes("Skip")) {
      cy.get(commonSelectors.skipInstallationModal).click();
    } else {
      cy.log("Installation is Finished");
    }
  });
};

export const generalSettingsSW = () => {
  cy.get(ssoSelector.enableSignUpToggle).then(($el) => {
    if ($el.is(":checked")) {
      cy.get(ssoSelector.enableSignUpToggle).uncheck();
      cy.get(ssoSelector.cancelButton).click();
      cy.get(ssoSelector.enableSignUpToggle).should("be.checked");
    } else {
      cy.get(ssoSelector.enableSignUpToggle).check();
      cy.get(ssoSelector.cancelButton).click();
      cy.get(ssoSelector.enableSignUpToggle).should("not.be.checked");
      cy.get(ssoSelector.enableSignUpToggle).check();
    }
  });
};

export const signInPageElements = () => {
  cy.get(ssoSelector.signInHeader).verifyVisibleElement(
    "have.text",
    ssoText.signInHeader
  );
  cy.get(ssoSelector.googleSignInText).verifyVisibleElement(
    "have.text",
    ssoText.googleSignInText
  );
  cy.get(ssoSelector.gitSignInText).verifyVisibleElement(
    "have.text",
    ssoText.gitSignInText
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
  cy.get(commonSelectors.loginButton).verifyVisibleElement(
    "have.text",
    commonText.loginButton
  );

  cy.get(commonSelectors.workEmailInputField).should("be.visible");
  cy.get(commonSelectors.passwordInputField).should("be.visible");
};

export const SignUpPageElements = () => {
  cy.get(commonSelectors.SignUpSectionHeader).verifyVisibleElement(
    "have.text",
    commonText.SignUpSectionHeader
  );
  cy.get(commonSelectors.signInRedirectText).should(($el) => {
    expect($el.contents().first().text().trim()).to.eq(
      commonText.signInRedirectText
    );
  });
  cy.get(commonSelectors.signInRedirectLink).verifyVisibleElement(
    "have.text",
    commonText.signInRedirectLink
  );
  cy.get(ssoSelector.googleSignInText).verifyVisibleElement(
    "have.text",
    ssoText.googleSignUpText
  );
  cy.get(ssoSelector.gitSignInText).verifyVisibleElement(
    "have.text",
    ssoText.gitSignUpText
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
