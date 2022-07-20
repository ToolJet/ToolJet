import { profileSelector } from "Selectors/profile";
import { profileText } from "Texts/profile";

export const profilePageElements = () =>{
 for(const elements in profileSelector.profileElements ){
 cy.get(profileSelector.profileElements[elements]).should("be.visible").and("have.text",profileText.profileElements[elements]);
 }
 cy.get(profileSelector.updateButton).should("be.visible").and("have.text", profileText.updateButton);
 cy.get(profileSelector.changePasswordButton).should("be.visible").and("have.text", profileText.changePasswordButton);
 cy.get(profileSelector.firstNameInput).should("be.visible").and("have.value", profileText.firstName);
 cy.get(profileSelector.lastNameInput).should("be.visible").and("have.value", profileText.lastName);
 cy.get(profileSelector.emailInput).should("be.visible").and("have.value", profileText.email);
 cy.get(profileSelector.currentPasswordField).should("be.visible").should("be.visible");
 cy.get(profileSelector.newPasswordField).should("be.visible").should("be.visible");
};

