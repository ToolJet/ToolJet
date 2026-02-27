import { fake } from "Fixtures/fake";
import {
  resetUserPasswordFromInstanceSettings,
  resetUserPasswordAutomaticallyFromInstanceSettings,
  verifyLoginWithOldPasswordRestriction,
} from "Support/utils/platform/superAdminPasswordReset";

describe("Instance Settings - User Management | Reset Password Flow", () => {
  const user = {
    name: fake.firstName,
    email: fake.email.toLowerCase().replace(/[^a-z0-9@.]/g, ""),
    newPassword: "New Password",
    oldPassword: "Password",
  };

  beforeEach(() => {
    cy.apiLogin();
  });

  it("should let SuperAdmin reset user password manually and auto generate and verify login with old password restriction", () => {
    cy.apiFullUserOnboarding(user.name, user.email);
    cy.apiLogin();
    cy.visit("/");

    resetUserPasswordFromInstanceSettings(user.email, user.newPassword);

    cy.apiLogout();
    cy.visit("/");
    verifyLoginWithOldPasswordRestriction(user.email, user.oldPassword);

    cy.apiLogin(user.email, user.newPassword);
    cy.apiLogout();

    cy.apiLogin();
    cy.visit("/");
    resetUserPasswordAutomaticallyFromInstanceSettings(user.email);

    cy.get("@generatedPassword").then((generatedPassword) => {
      cy.apiLogout();
      cy.visit("/");
      cy.apiLogin(user.email, generatedPassword);
    });
  });
});
