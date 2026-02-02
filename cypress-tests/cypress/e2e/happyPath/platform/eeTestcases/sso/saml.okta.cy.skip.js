import { fake } from "Fixtures/fake";
import { commonSelectors } from "Selectors/common";
import { ssoEeSelector } from "Selectors/eeCommon";
import { sanitize } from "Support/utils/common";
import {
  apiCreateGroup,
  apiDeleteGroup,
  verifyUserRole,
} from "Support/utils/manageGroups";
import { deleteOrganisationSSO } from "Support/utils/manageSSO";
import { cleanAllUsers } from "Support/utils/manageUsers";

import {
  setSignupStatus,
  uiOktaLogin,
  updateSsoId,
} from "Support/utils/manageSSO";
import { fetchAndVisitInviteLink } from "Support/utils/manageUsers";

const loginViaSamlSSO = (email, password) => {
  cy.intercept("GET", "/api/authorize").as("samlResponse");
  cy.intercept("GET", "**/sso/saml/**").as("samlRedirect");

  cy.url().then((url) => cy.log("URL before SAML click:", url));

  cy.get(ssoEeSelector.saml.ssoText).should("be.visible").click();
  cy.log("SAML button clicked");

  // ✅ Wait for URL to actually change to Okta before proceeding
  cy.url({ timeout: 15000 }).should("include", "okta.com");
  cy.log("Successfully navigated to Okta");

  // ✅ Now call uiOktaLogin - we're actually on Okta
  uiOktaLogin(email, password);

  // Wait for redirect back to localhost
  cy.url({ timeout: 15000 }).should("include", "localhost:3000");
  cy.log("Successfully redirected back to ToolJet");
};

describe("SAML SSO", () => {
  const data = {
    appName: `${fake.companyName}-SAML-App`,
    groupName: `saml-${fake.companyName}-group`,
  };

  const config = {
    type: "saml",
    configs: {
      groupAttribute: "groups",
      groupSyncEnabled: true,
      idpMetadata: Cypress.env("saml_idp_metadata"),
      name: "SAML_workspace",
    },
    enabled: true,
  };

  const deleteGroup = (orgId) => {
    cy.runSqlQueryOnDB(
      `SELECT id FROM permission_groups WHERE name = 'SAML' AND organization_id = '${orgId}';`
    ).then(({ rows }) => {
      const existingGroupId = rows?.[0]?.id;
      if (existingGroupId) {
        cy.runSqlQueryOnDB(
          `DELETE FROM permission_groups WHERE id = '${existingGroupId}'::uuid;`
        );
      }
    });
  };

  beforeEach("", () => {
    data.workspaceName = `${sanitize(fake.firstName)}-saml`;
    data.workspaceSlug = data.workspaceName;

    cy.apiLogin();

    cy.apiCreateWorkspace(data.workspaceName, data.workspaceSlug).then(
      (res) => {
        Cypress.env("workspaceId", res.body.organization_id);
      }
    );

    deleteOrganisationSSO(data.workspaceName, ["saml"]);
    setSignupStatus(true);
    cleanAllUsers();
  });

  after("", () => {
    cy.apiLogin();
    cleanAllUsers();
    cy.apiDeleteAllApps();
  });

  afterEach("", () => {
    cy.apiLogin();
    deleteOrganisationSSO(data.workspaceName, ["saml"]);
  });

  it("Should verify SAML sso signup and group sync", () => {
    const orgId = Cypress.env("workspaceId");
    const ssoConfigId = Cypress.env("saml_config_id");
    deleteGroup(orgId);

    cy.apiUpdateSSOConfig(config);

    apiCreateGroup("SAML");

    updateSsoId(ssoConfigId, "saml", orgId);

    cy.apiLogout();
    cy.visit(`/login/${data.workspaceSlug}`);
    cy.wait(4000);
    loginViaSamlSSO(Cypress.env("saml_signup"), Cypress.env("okta_password"));
    cy.wait("@samlResponse").then((interception) => {
      const userId = interception.response.body.id;
      cy.wrap(userId).as("userId");
    });
    verifyUserRole("@userId", "end-user", ["SAML"]);

    cy.apiLogout();
    cy.apiLogin();
    apiDeleteGroup("SAML");
  });

  it("Should verify the invited user onboarding using SAML SSO", () => {
    const orgId = Cypress.env("workspaceId");
    const ssoConfigId = Cypress.env("saml_config_id");
    const invitedUserEmail = Cypress.env("saml_invite");
    const firstName = fake.firstName;
    cy.intercept("GET", "/api/authorize").as("samlResponse");

    cy.apiUpdateSSOConfig(config);
    updateSsoId(ssoConfigId, "saml", orgId);

    // Create and setup invitation
    cy.apiUserInvite(firstName, invitedUserEmail);
    fetchAndVisitInviteLink(invitedUserEmail, data.workspaceName);

    // Start SSO login process
    cy.wait(4000);
    loginViaSamlSSO(invitedUserEmail, Cypress.env("okta_password"));

    cy.get(
      `[data-cy="join-${data.workspaceName}-header"]`
    ).verifyVisibleElement("have.text", `Join ${data.workspaceName}`);
    cy.get(commonSelectors.acceptInviteButton).click();

    // Verify successful login and role
    cy.wait("@samlResponse").then((interception) => {
      const userId = interception.response.body.id;
      cy.wrap(userId).as("userId");
    });

    verifyUserRole("@userId", "builder", ["builder"]);
  });
});
