import { commonSelectors } from "Selectors/common";
import { ssoSelector } from "Selectors/manageSSO";
import { ssoText } from "Texts/manageSSO";
import * as common from "Support/utils/common";
import { commonText } from "Texts/common";

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
  cy.get(ssoSelector.defaultGithub).verifyVisibleElement("have.text", "Git");

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
          sql: `UPDATE sso_configs SET enabled = ${enabled ? "true" : "false"
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
        url: `${Cypress.env("server_host")}/api/organizations`,
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

export const OidcConfig = (groupMapping, level = "workspace", extra = {}) => {
  const config = {
    type: "openid",
    configs: {
      name: "",
      clientId: Cypress.env("okta_client_id"),
      clientSecret: Cypress.env("okta_client_secret"),
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
