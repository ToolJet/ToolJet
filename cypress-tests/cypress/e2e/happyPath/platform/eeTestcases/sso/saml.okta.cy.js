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
  cy.intercept("GET", "https://integrator-8815821.okta.com/**").as("oktaPage");

  cy.url().then((url) => cy.log("URL before SAML click:", url));
  cy.wait(2000);

  cy.get(ssoEeSelector.saml.ssoText).then(($btn) => {
    cy.log("SAML button href:", $btn.attr("href"));
  });

  cy.get(ssoEeSelector.saml.ssoText).click();
  cy.log("SAML button clicked");

  // Wait for redirect to Okta
  cy.wait(2000);
  cy.url().then((url) => {
    cy.log("URL after SAML click:", url);
    if (!url.includes("okta.com")) {
      cy.log("ERROR: Did not navigate to Okta! Still at:", url);
    }
  });

  uiOktaLogin(email, password);
  cy.log("uiOktaLogin completed - waiting for redirect back");

  // Wait for redirect back to localhost
  cy.url({ timeout: 15000 }).should("include", "localhost:3000");
  cy.log("Successfully redirected back to ToolJet");
  cy.url().then((url) => cy.log("Final URL:", url));
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
    cy.runSqlQuery(
      `SELECT id FROM permission_groups WHERE name = 'SAML' AND organization_id = '${orgId}';`
    ).then(({ rows }) => {
      const existingGroupId = rows?.[0]?.id;
      if (existingGroupId) {
        cy.runSqlQuery(
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
