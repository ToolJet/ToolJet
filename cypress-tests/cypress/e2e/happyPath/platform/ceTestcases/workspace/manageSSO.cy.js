import { commonSelectors } from "Selectors/common";
import { ssoSelector } from "Selectors/platform/manageSSO";
import * as common from "Support/utils/common";
import * as SSO from "Support/utils/manageSSO";
import { instanceSSOConfig, passwordToggle, updateInstanceSettings } from "Support/utils/platform/eeCommon";
import { commonText } from "Texts/common";

describe("Manage SSO for multi workspace", () => {
  const data = {};
  const emptyGoogleConfig = {
    type: "google",
    configs: {
      clientId: "",
    },
    enabled: true,
  };
  const emptyGitConfig = {
    type: "git",
    configs: {
      clientId: "",
      clientSecret: "",
      hostName: "",
    },
    enabled: true,
  };

  let workspaceId, wsName, wsSlug;

  beforeEach(() => {
    wsName = `manage-sso-${Date.now()}`;
    wsSlug = wsName;

    cy.apiLogin();
    cy.apiCreateWorkspace(wsName, wsSlug).then((res) => {
      workspaceId = res.body.organization_id;
      Cypress.env("workspaceId", workspaceId);
      Cypress.env("workspaceSlug", wsSlug);
    });
    updateInstanceSettings('ENABLE_WORKSPACE_LOGIN_CONFIGURATION', 'true');
    instanceSSOConfig(true);
    passwordToggle(true, "organization");
    cy.visit(`/${wsSlug}`);
    cy.get(commonSelectors.homePageLogo, { timeout: 50000 }).should("be.visible");
  });

  afterEach(() => {
    cy.apiLogin();
    cy.then(() => cy.apiArchiveWorkspace(workspaceId));
  });

  it("Should verify workspace settings page elements and their functionality", () => {
    cy.apiUpdateAutoSSO(false, "organization");
    SSO.setSignupStatus(false);
    SSO.defaultSSO(true);
    common.navigateToManageSSO();
    cy.get(commonSelectors.breadcrumbTitle).should(($el) => {
      expect($el.contents().first().text().trim()).to.eq(
        commonText.breadcrumbworkspaceSettingTitle
      );
    });
    cy.get(ssoSelector.cardTitle).verifyVisibleElement(
      "have.text",
      "Workspace login"
    );

    SSO.loginSettingPageElements("workspace", wsSlug);
    SSO.verifyLoginSettings("workspace");
  });

  it("Should verify Google SSO page elements", () => {
    SSO.defaultSSO(true);
    common.navigateToManageSSO();
    SSO.googleSSOPageElements("workspace", wsSlug);
  });

  it("Should verify Git SSO page elements", () => {
    SSO.defaultSSO(true);
    common.navigateToManageSSO();
    SSO.gitSSOPageElements("workspace", wsSlug);
  });

  it("Should verify OIDC SSO page elements", () => {
    SSO.defaultSSO(true);
    common.navigateToManageSSO();
    SSO.oidcSSOPageElements("workspace", wsSlug);
  });

  it("Should verify LDAP SSO page elements", () => {
    SSO.defaultSSO(true);
    common.navigateToManageSSO();
    SSO.ldapSSOPageElements(wsSlug);
  });

  it("Should verify SAML SSO page elements", () => {
    SSO.defaultSSO(true);
    common.navigateToManageSSO();
    SSO.samlSSOPageElements(wsSlug);
  });
});