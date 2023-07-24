import { commonSelectors } from "Selectors/common";
import { ssoSelector } from "Selectors/manageSSO";
import { ssoText } from "Texts/manageSSO";
import * as common from "Support/utils/common";
import { commonText } from "Texts/common";
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

export const googleSSOPageElements = () => {
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

export const gitSSOPageElements = () => {
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

export const passwordPageElements = () => {
  cy.get(ssoSelector.passwordEnableToggle).then(($el) => {
    if ($el.is(":checked")) {
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

      cy.get(ssoSelector.passwordEnableToggle).check();
      cy.verifyToastMessage(
        commonSelectors.toastMessage,
        ssoText.passwordEnabledToast
      );
    } else {
      cy.get(ssoSelector.passwordEnableToggle).check();
      cy.verifyToastMessage(
        commonSelectors.toastMessage,
        ssoText.passwordEnabledToast
      );

      cy.get(ssoSelector.passwordEnableToggle).uncheck();
      cy.verifyToastMessage(
        commonSelectors.toastMessage,
        ssoText.passwordDisabledToast
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
    cy.wait(1000)
    cy.visit(url);
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
      cy.get(ssoSelector.allowDefaultSSOToggle).uncheck();
      cy.get(ssoSelector.saveButton).click();
      cy.verifyToastMessage(commonSelectors.toastMessage, ssoText.ssoToast);
    }
  });
};

export const disableDefaultSSO = () => {
  common.navigateToManageSSO();
  cy.get("body").then(($el) => {
    if (!$el.text().includes("Allowed domains")) {
      cy.get(ssoSelector.generalSettingsElements.generalSettings).click();
    }
  });
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
  cy.get(commonSelectors.loginButton).click();
  cy.wait(2000)
  cy.get(commonSelectors.homePageLogo).should("be.visible");
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

export const SignUpPageElements = () => {
  cy.get(commonSelectors.pageLogo).should("be.visible");
  cy.get(commonSelectors.SignUpSectionHeader).verifyVisibleElement(
    "have.text",
    commonText.SignUpSectionHeader
  );
  cy.get(commonSelectors.signUpButton).verifyVisibleElement(
    "have.text",
    commonText.getStartedButton
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
      cy.get(commonSelectors.onboardingSeperatorText).verifyVisibleElement(
        "have.text",
        commonText.onboardingSeperatorText
      );
    }
  });
};

export const loginbyGoogle = (email, password) => {
  cy.session([email, password], () => {
    cy.visit("/");
    cy.wait(3000);
    cy.get(ssoSelector.googleSSOText).click();
    cy.origin(
      "https://accounts.google.com/",
      { args: [email, password] },
      ([email, password]) => {
        const resizeObserverLoopErrRe =
          /^[^(ResizeObserver loop limit exceeded)]/;
        Cypress.on("uncaught:exception", (err) => {
          if (resizeObserverLoopErrRe.test(err.message)) {
            return false;
          }
        });
        cy.wait(1000);
        cy.get('input[name="identifier"]').type(email);
        cy.get(".VfPpkd-LgbsSe").contains("Next").click();
        cy.get('input[name="password"]', { timeout: 5000 }).type(password);
        cy.get(".VfPpkd-LgbsSe").contains("Next").click();
        cy.wait(5000);
        cy.visit("/");
      }
    );
  });
};

export const googleSSO = (email, password) => {
  Cypress.session.clearAllSavedSessions();
  cy.wait(3000);
  cy.get(ssoSelector.googleSSOText).click();
  loginbyGoogle(email, password);
  cy.visit("http://localhost:8082");
  cy.wait(4000);
  cy.get(ssoSelector.googleSSOText).click();
  cy.origin("https://accounts.google.com/", () => {
    cy.get(".d2laFc").first().click();
    cy.wait(3000);
  });
};

export const loginbyGitHub = (email, password) => {
  Cypress.session.clearAllSavedSessions();
  cy.session([email, password], () => {
    cy.visit("/");
    cy.get(ssoSelector.gitSSOText).click();
    cy.origin(
      "https://github.com/",
      { args: [email, password] },
      ([email, password]) => {
        cy.wait(1000);
        cy.get('input[name="login"]').type(email);
        cy.get('input[name="password"]').type(password);
        cy.get('input[name="commit"]').click();
        cy.get("body").then(($el) => {
          if ($el.text().includes("Authorize")) {
            cy.wait(1000);
            cy.get("#js-oauth-authorize-btn").click();
          }
        });
        cy.wait(3000);
      }
    );
  });
};

export const gitHubSSO = (email, password) => {
  loginbyGitHub(email, password);
  cy.visit("http://localhost:8082");
  cy.get(ssoSelector.gitSSOText).click();
};

export const enableGitHubSSO = () => {
  common.navigateToManageSSO();
  cy.get(ssoSelector.git).click();
  cy.get(ssoSelector.gitEnableToggle).then(($el) => {
    if (!$el.is(":checked")) {
      cy.get(ssoSelector.gitEnableToggle).check();
    }
  });
  cy.clearAndType(ssoSelector.clientIdInput, "b6cb1e7989494205e705");
  cy.clearAndType(
    ssoSelector.clientSecretInput,
    "fcee4873f6a48a80da399f7dc2e55a5f9f0fca17"
  );
  cy.get(ssoSelector.saveButton).click();
};

export const enableGoogleSSO = () => {
  common.navigateToManageSSO();
  cy.get(ssoSelector.google).click();
  cy.get(ssoSelector.googleEnableToggle).then(($el) => {
    if (!$el.is(":checked")) {
      cy.get(ssoSelector.googleEnableToggle).check();
    }
  });
  cy.clearAndType(
    ssoSelector.clientIdInput,
    "788411490229-dlonkl1pepnpqt5lvjoqotc5h7lgjqh0.apps.googleusercontent.com"
  );
  cy.get(ssoSelector.saveButton).click();
  cy.get(ssoSelector.saveButton).click();
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
  cy.get(commonSelectors.passwordInputField).should("be.visible");
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

export const updateId = () => {
  cy.task("updateId", {
    dbconfig: Cypress.config("db"),
    sql: "update sso_configs set id='5edf41b2-ff2b-4932-9e2a-08aef4a303cc' where sso='google';",
  });
  cy.task("updateId", {
    dbconfig: Cypress.config("db"),
    sql: "update sso_configs set id='9628dee2-6fa9-4aca-9c98-ef950601c83e' where sso='git';",
  });
};
