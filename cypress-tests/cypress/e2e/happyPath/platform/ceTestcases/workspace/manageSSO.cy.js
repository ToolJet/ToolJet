import { ssoSelector } from "Selectors/manageSSO";
import * as common from "Support/utils/common";
import { ssoText } from "Texts/manageSSO";
import * as SSO from "Support/utils/manageSSO";
import { commonSelectors } from "Selectors/common";
import { commonText } from "Texts/common";
import { updateInstanceSettings, instanceSSOConfig, passwordToggle, defaultInstanceSSO, openInstanceSettings } from "Support/utils/platform/eeCommon";

describe("Manage SSO for multi workspace", () => {
  const data = {};

  beforeEach(() => {
    cy.defaultWorkspaceLogin();
    SSO.deleteOrganisationSSO("My workspace", ["google", "git", "openid", "ldap", "saml"]);
    updateInstanceSettings('ENABLE_WORKSPACE_LOGIN_CONFIGURATION', 'true');
    instanceSSOConfig(true);
    passwordToggle(true, "organization");
    SSO.resetDomain();
    cy.reload();
  });

  after(() => {
    cy.defaultWorkspaceLogin();
    SSO.resetDomain();
  });

  it("Should verify workspace settings page elements and their functionality", () => {
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

    SSO.loginSettingPageElements("workspace");
    SSO.verifyLoginSettings("workspace");
  });

  it("Should verify Google SSO page elements", () => {
    SSO.defaultSSO(true);
    common.navigateToManageSSO();
    SSO.googleSSOPageElements("workspace");
  });

  it("Should verify Git SSO page elements", () => {
    SSO.defaultSSO(true);
    common.navigateToManageSSO();
    SSO.gitSSOPageElements("workspace");
  });
  it("Should verify OIDC SSO page elements", () => {
    SSO.defaultSSO(true);
    common.navigateToManageSSO();
    SSO.oidcSSOPageElements("workspace");
  });
  it("Should verify LDAP SSO page elements", () => {
    SSO.defaultSSO(true);
    common.navigateToManageSSO();
    SSO.ldapSSOPageElements();
  });
  it("Should verify SAML SSO page elements", () => {
    SSO.defaultSSO(true);
    common.navigateToManageSSO();
    SSO.samlSSOPageElements();
  });
});




