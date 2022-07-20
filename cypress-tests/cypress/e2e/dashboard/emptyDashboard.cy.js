import { commonSelectors } from "Selectors/common";
import { emptyDashboardSelector } from "Selectors/dashboard";
import { emptyDashboardText } from "Texts/dashboard";

describe("Empty state of dashboard",()=>{
  before(()=>{
  cy.appUILogin();
  cy.wait(1000)
  });

  it("should verify the elements on empty dashboard",()=>{
   cy.get('body').then($el =>{
    if($el.text().includes(emptyDashboardText.emptyPageHeader)){
     cy.get(commonSelectors.homePageLogo).should('be.visible');
     cy.get(emptyDashboardSelector.emptyPageImage).should('be.visible');
     cy.get(emptyDashboardSelector.emptyPageHeader).should('be.visible').and('have.text', emptyDashboardText.emptyPageHeader);
     cy.get(emptyDashboardSelector.emptyPageDescription).should('be.visible').and('have.text', emptyDashboardText.emptyPageDescription);
     cy.get(emptyDashboardSelector.createAppButton).should('be.visible').and('have.text', emptyDashboardText.createAppButton);
     cy.get(emptyDashboardSelector.importAppButton).should('be.visible').and('have.text', emptyDashboardText.importAppButton);
     cy.get(emptyDashboardSelector.chooseFromTemplate).should('be.visible').and('have.text', emptyDashboardText.chooseFromTemplate);
     cy.get(emptyDashboardSelector.modeToggle).should('be.visible').and('have.attr', 'color', emptyDashboardText.darkMode).click();
     cy.get(emptyDashboardSelector.modeToggle).should('be.visible').and('have.attr', 'color', emptyDashboardText.lightMode).click();

     cy.get(emptyDashboardSelector.dropdownText).should('be.visible').and('have.text', emptyDashboardText.dropdownText);
     cy.get(emptyDashboardSelector.dropdown).trigger('mouseover');
     cy.get(emptyDashboardSelector.editButton).should("have.text", emptyDashboardText.editButton);
     cy.get(emptyDashboardSelector.manageUsers).should("have.text", emptyDashboardText.manageUsers);
     cy.get(emptyDashboardSelector.manageGroups).should("have.text", emptyDashboardText.manageGroups);
     cy.get(emptyDashboardSelector.ManageSSO).should("have.text", emptyDashboardText.manageSSO);

     cy.get(emptyDashboardSelector.userMenu).should('be.visible');
     cy.get(emptyDashboardSelector.userMenu).trigger('mouseover');
     cy.get(emptyDashboardSelector.profileLink).should("have.text", emptyDashboardText.profileLink);
     cy.get(emptyDashboardSelector.logoutLink).should("have.text", emptyDashboardText.logoutLink);
    }
    else{
     cy.log('User has already created few apps hence this test will be skipped.');
    }
   });
  });
});