import { path } from "Texts/common";
import { usersSelector } from "Selectors/manageUsers";
import { profileSelector } from "Selectors/profile";

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