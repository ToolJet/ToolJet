import { path } from "Texts/common";
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