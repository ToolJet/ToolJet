import { commonSelectors } from "Selectors/common";
import { ssoSelector } from "Selectors/manageSSO";
import { ssoText } from "Texts/manageSSO";
import * as common from "Support/utils/common";
import { commonText } from "Texts/common";
import { dashboardSelector } from "Selectors/dashboard";

export const generalSettings = () => {
  cy.get(ssoSelector.enableSignUpToggle).check();
  cy.get(ssoSelector.cancelButton).click();
  cy.get(ssoSelector.enableSignUpToggle).should("not.be.checked");
  cy.get(ssoSelector.enableSignUpToggle).check();
  cy.get(ssoSelector.saveButton).click();
  cy.get(ssoSelector.enableSignUpToggle).should("be.checked");

  cy.get(ssoSelector.enableSignUpToggle).uncheck();
  cy.get(ssoSelector.saveButton).click();
  cy.get(ssoSelector.enableSignUpToggle).should("not.be.checked");

  cy.get(ssoSelector.workspaceLoginPage.defaultSSO).click();
  cy.get(ssoSelector.defaultGoogle).verifyVisibleElement("have.text", "Google");
  cy.get(ssoSelector.defaultGithub).verifyVisibleElement("have.text", "Github");

  cy.clearAndType(ssoSelector.allowedDomainInput, ssoText.allowedDomain);
  cy.get(ssoSelector.saveButton).click();
  cy.verifyToastMessage(commonSelectors.toastMessage, ssoText.ssoToast);

  cy.get(ssoSelector.passwordEnableToggle).uncheck();
  cy.get(commonSelectors.modalComponent).should("be.visible");
  cy.get(commonSelectors.modalMessage).verifyVisibleElement(
    "have.text",
    ssoText.passwordDisableWarning
  );
  cy.get(commonSelectors.cancelButton).eq(1).click();
  cy.get(ssoSelector.passwordEnableToggle).uncheck();
  cy.get(commonSelectors.confirmationButton).click();
  cy.verifyToastMessage(
    commonSelectors.toastMessage,
    ssoText.passwordDisabledToast
  );

  cy.get(ssoSelector.passwordEnableToggle).check();
  cy.get(commonSelectors.saveButton).click();

  cy.get(ssoSelector.allowDefaultSSOToggle).click();

  cy.get(ssoSelector.passwordEnableToggle).should("be.disabled");

  common.verifyTooltipDisabled(
    ssoSelector.passwordEnableToggle,
    "Password login cannot be disabled unless SSO is configured"
  );

  cy.get(ssoSelector.allowDefaultSSOToggle).click();
};

export const googleSSOPageElements = () => {
  cy.get(ssoSelector.googleEnableToggle).click();
  cy.get(ssoSelector.saveButton).eq(1).click();

  cy.get('[data-cy="modal-title"]').verifyVisibleElement(
    "have.text",
    "Enable Google"
  );
  cy.get('[data-cy="modal-close-button"]').should("be.visible");
  cy.get('[data-cy="modal-message"]').verifyVisibleElement(
    "have.text",
    "Enabling Google at the workspace level will override any Google configurations set at the instance level."
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
  cy.get(ssoSelector.googleEnableToggle).click();
  cy.get(ssoSelector.saveButton).eq(1).click();
  cy.get('[data-cy="enable-button"]').click();
  cy.verifyToastMessage(commonSelectors.toastMessage, ssoText.googleSSOToast);

  cy.get(ssoSelector.statusLabel).verifyVisibleElement(
    "have.text",
    ssoText.enabledLabel
  );
  cy.get('[data-cy="redirect-url-label"]').verifyVisibleElement(
    "have.text",
    ssoText.redirectUrlLabel
  );
  cy.get('[data-cy="redirect-url"]').should("be.visible");
  cy.get('[data-cy="copy-icon"]').should("be.visible");

  cy.get(ssoSelector.googleEnableToggle).click();
  cy.get(ssoSelector.saveButton).eq(1).click();
  cy.verifyToastMessage(commonSelectors.toastMessage, ssoText.googleSSOToast);
  cy.get(ssoSelector.statusLabel).verifyVisibleElement(
    "have.text",
    ssoText.disabledLabel
  );

  cy.clearAndType(ssoSelector.clientIdInput, ssoText.testClientId);
  cy.get(ssoSelector.cancelButton).eq(1).click();
  cy.get(ssoSelector.google).click();
  cy.get(ssoSelector.clientIdInput).should("have.value", "");
  cy.get(ssoSelector.googleEnableToggle).click();
  cy.clearAndType(ssoSelector.clientIdInput, ssoText.clientId);
  cy.get(ssoSelector.saveButton).eq(1).click();
  cy.get('[data-cy="enable-button"]').click();
  cy.verifyToastMessage(commonSelectors.toastMessage, ssoText.googleSSOToast);
  cy.get(ssoSelector.clientIdInput).should("have.value", ssoText.clientId);
};

export const gitSSOPageElements = () => {
  cy.get(ssoSelector.gitEnableToggle).click();

  cy.get(ssoSelector.saveButton).eq(1).click();

  cy.get('[data-cy="modal-title"]').verifyVisibleElement(
    "have.text",
    "Enable Git"
  );
  cy.get('[data-cy="modal-close-button"]').should("be.visible");
  cy.get('[data-cy="modal-message"]').verifyVisibleElement(
    "have.text",
    "Enabling Git at the workspace level will override any Git configurations set at the instance level."
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
  cy.get(ssoSelector.gitEnableToggle).click();
  cy.get(ssoSelector.saveButton).eq(1).click();
  cy.get('[data-cy="enable-button"]').click();

  cy.verifyToastMessage(commonSelectors.toastMessage, ssoText.gitSSOToast);

  cy.get(ssoSelector.statusLabel).verifyVisibleElement(
    "have.text",
    ssoText.enabledLabel
  );

  cy.get('[data-cy="redirect-url-label"]').verifyVisibleElement(
    "have.text",
    ssoText.redirectUrlLabel
  );
  cy.get('[data-cy="redirect-url"]').should("be.visible");
  cy.get('[data-cy="copy-icon"]').should("be.visible");

  cy.get(ssoSelector.gitEnableToggle).click();
  cy.get(ssoSelector.saveButton).eq(1).click();

  cy.verifyToastMessage(commonSelectors.toastMessage, ssoText.gitSSOToast);
  cy.get(ssoSelector.statusLabel).verifyVisibleElement(
    "have.text",
    ssoText.disabledLabel
  );

  cy.get(ssoSelector.gitEnableToggle).click();
  cy.clearAndType(ssoSelector.hostNameInput, ssoText.hostName);
  cy.clearAndType(ssoSelector.clientIdInput, ssoText.clientId);
  cy.clearAndType(ssoSelector.clientSecretInput, ssoText.testClientId);
  cy.get(ssoSelector.saveButton).eq(1).click();
  cy.get('[data-cy="enable-button"]').click();
  cy.verifyToastMessage(commonSelectors.toastMessage, ssoText.gitSSOToast);
  cy.get(ssoSelector.hostNameInput).should("have.value", ssoText.hostName);
  cy.get(ssoSelector.clientIdInput).should("have.value", ssoText.clientId);
  cy.get(ssoSelector.clientSecretInput).should(
    "have.value",
    ssoText.testClientId
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
  cy.wait(2000);
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

export const setSSOStatus = (workspaceName, ssoType, enabled) => {
  let workspaceId;

  cy.task("updateId", {
    dbconfig: Cypress.env("app_db"),
    sql: `SELECT id FROM organizations WHERE name = '${workspaceName}'`,
  }).then((resp) => {
    workspaceId = resp.rows[0].id;

    cy.task("updateId", {
      dbconfig: Cypress.env("app_db"),
      sql: `SELECT * FROM sso_configs WHERE organization_id = '${workspaceId}' AND sso = '${ssoType}'`,
    }).then((ssoConfigResp) => {
      if (ssoConfigResp.rows.length > 0) {
        cy.task("updateId", {
          dbconfig: Cypress.env("app_db"),
          sql: `UPDATE sso_configs SET enabled = ${enabled ? "true" : "false"
            } WHERE organization_id = '${workspaceId}' AND sso = '${ssoType}'`,
        });
      }
    });
  });
};

export const defaultSSO = (enable) => {
  cy.getCookie("tj_auth_token").then((cookie) => {
    cy.request(
      {
        method: "PATCH",
        url: "http://localhost:3000/api/organizations",
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

export const setSignupStatus = (enable) => {
  cy.getCookie("tj_auth_token").then((cookie) => {
    cy.request(
      {
        method: "PATCH",
        url: "http://localhost:3000/api/organizations",
        headers: {
          "Tj-Workspace-Id": Cypress.env("workspaceId"),
          Cookie: `tj_auth_token=${cookie.value}`,
        },
        body: { enableSignUp: enable },
      },
      { log: false }
    ).then((response) => {
      expect(response.status).to.equal(200);
    });
  });
};

export const deleteOrganisationSSO = (workspaceName, services) => {
  let workspaceId;
  cy.task("updateId", {
    dbconfig: Cypress.env("app_db"),
    sql: `select id from organizations where name='${workspaceName}';`,
  }).then((resp) => {
    workspaceId = resp.rows[0].id;

    cy.task("updateId", {
      dbconfig: Cypress.env("app_db"),
      sql: `DELETE FROM sso_configs WHERE organization_id = '${workspaceId}' AND sso IN (${services
        .map((service) => `'${service}'`)
        .join(",")});`,
    });
  });
};


export const resetDomain = () => {
  cy.getCookie("tj_auth_token").then((cookie) => {
    cy.request(
      {
        method: "PATCH",
        url: "http://localhost:3000/api/organizations",
        headers: {
          "Tj-Workspace-Id": Cypress.env("workspaceId"),
          Cookie: `tj_auth_token=${cookie.value}`,
        },
        body: { domain: "" },
      },
      { log: false }
    ).then((response) => {
      expect(response.status).to.equal(200);
    });
  });
};