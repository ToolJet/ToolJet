import { path } from "Texts/common";
import { usersSelector } from "Selectors/manageUsers";
import { profileSelector } from "Selectors/profile";
import { commonSelectors } from "Selectors/common";

export const navigateToProfile=()=>{
 cy.get(profileSelector.profileDropdown).invoke("show");
 cy.contains("Profile").click();
 cy.url().should("include", path.profilePath);
};

export const logout=()=>{
 cy.get(profileSelector.profileDropdown).invoke("show");
 cy.contains("Logout").click();
 cy.url().should("include",path.loginPath);
};

export const navigateToManageUsers=()=>{
 cy.get(usersSelector.dropdown).invoke("show");
 cy.contains("Manage Users").click();
 cy.url().should("include",path.manageUsers );
};

export const navigateToManageGroups=()=>{
  cy.get(commonSelectors.dropdown).invoke("show");
  cy.contains("Manage Groups").click();
  cy.url().should("include",path.manageGroups );
}

export const navigateToManageSSO=()=>{
  cy.get(commonSelectors.dropdown).invoke("show");
  cy.contains("Manage SSO").click();
  cy.url().should("include",path.manageSSO );
};