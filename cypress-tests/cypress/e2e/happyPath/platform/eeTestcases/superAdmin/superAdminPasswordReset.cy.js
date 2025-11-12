import { fake } from "Fixtures/fake";
import {
  resetUserpasswordFromInstanceSettings,
  resetUserpasswordAutomaticallyFromInstanceSettings,
  verifyLoginWithOldPaswordRestriction,
} from "Support/utils/platform/superAdminPasswordReset";

describe("Instance Settings - User Management | Reset Password Flow", () => {
  const user = {
    name: fake.firstName,
    email: fake.email.toLowerCase().replace(/[^a-z0-9@.]/g, ""),
    newPassword: fake.firstName,
    oldPassword: "Password",
  };

  beforeEach(() => {
    cy.apiLogin();
  });

  it("should let SuperAdmin reset user password manually and auto generate and verify login with old password restriction", () => {
    cy.apiFullUserOnboarding(user.name, user.email);
    cy.apiLogin();
    cy.visit("/");

    resetUserpasswordFromInstanceSettings(user.email, user.newPassword);

    cy.apiLogout();
    cy.visit("/");
    verifyLoginWithOldPaswordRestriction(user.email, user.oldPassword);

    cy.apiLogin(user.email, user.newPassword);
    cy.apiLogout();

    cy.apiLogin();
    cy.visit("/");
    resetUserpasswordAutomaticallyFromInstanceSettings(user.email);

    cy.get("@generatedPassword").then((generatedPassword) => {
      cy.apiLogout();
      cy.visit("/");
      cy.apiLogin(user.email, generatedPassword);
    });
  });
});
