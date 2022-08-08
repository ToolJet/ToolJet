import {commonSelectors} from "Selectors/common";
import { fake } from "Fixtures/fake";
import { usersText } from "Texts/manageUsers";
import * as common from "Support/utils/common";
import { emptyDashboardText } from "Texts/dashboard";
import { groupsSelector } from "Selectors/manageGroups";
import { groupsText } from "Texts/manageGroups";
import * as permissions from "Support/utils/userPermissions";
import { usersSelector } from "Selectors/manageUsers";

const firstName = fake.firstName;
const lastName = fake.lastName.replaceAll("[^A-Za-z]", "");
const email = (`${firstName}@example.com`).toLowerCase();
const appName = (`${fake.companyName} App`);
const folderName = "Test-folder";
const companyName = fake.companyName;


describe("User permissions", ()=>{
  before(()=>{
    cy.appUILogin();
    permissions.reset();
  });

  it("Should verify the create new app permission", ()=>{
   permissions.addNewUserMW(firstName,lastName,email,companyName);

   cy.wait(2000);
   cy.get('body').then(($title => {
    if($title.text().includes(emptyDashboardText.emptyPageDescription)){
     cy.get(commonSelectors.emptyAppCreateButton).click();
     cy.verifyToastMessage(commonSelectors.toastMessage, usersText.createAppPermissionToast);
    }
    else{
     cy.contains(emptyDashboardText.createAppButton).should("not.exist");
     cy.log("The app is created by the admin"); 
    }
   }));
   common.logout();
  });

  it("Should verify the View and Edit permission", ()=>{
   cy.appUILogin();
   common.navigateToManageUsers();
   cy.contains('td', email).parent().within(() => {
    cy.get('td small').should("have.text", usersText.activeStatus);
   });
   cy.get(commonSelectors.homePageLogo).click();
   cy.wait(2000);
   cy.createApp(appName);
   common.navigateToManageGroups();
   cy.get(groupsSelector.groupName).contains(groupsText.allUsers).click();
   cy.get(groupsSelector.appSearchBox).click()
   cy.get(groupsSelector.searchBoxOptions).contains(appName).click();
   cy.get(groupsSelector.addButton).click();
   cy.get('table').contains('td', appName);
   cy.contains('td', appName).parent().within(() => {
    cy.get('td input').first().should('be.checked');
   });

   common.logout();
   cy.login(email,usersText.password);
   cy.contains(appName).should("exist");
   cy.get(commonSelectors.appCard).should('contain.text', appName);
   cy.contains('div', appName).parent().within(() => {
    cy.get('div, button').click();  
   });
   cy.get(commonSelectors.launchButton).should('exist').and('be.disabled');

   permissions.adminLogin();
   cy.contains('td', appName).parent().within(() => {
    cy.get('td input').last().check();
   });

   common.logout();
   cy.login(email,usersText.password);
   cy.get(commonSelectors.appCard).should('contain.text', appName);
   cy.contains('div', appName).parent().within(() => {
    cy.get('div, button').click();  
   });
   cy.get(commonSelectors.launchButton).should('exist').and('be.disabled');
   cy.get(commonSelectors.editButton).should('exist').and('be.enabled');

   cy.get(usersSelector.dropdown).invoke("show");
   cy.get(usersSelector.arrowIcon).click();
   cy.contains(companyName).should('be.visible').click();
   cy.contains(appName).should("not.exist");

   cy.get(usersSelector.dropdown).invoke("show");
   cy.get(usersSelector.arrowIcon).click();
   cy.contains("My workspace").should('be.visible').click();
  });

  it("Should verify the Create and Delete app permission", ()=>{
   permissions.adminLogin();
   cy.get(groupsSelector.permissionsLink).click();
   cy.get(groupsSelector.appsCreateCheck).check();
   cy.get(groupsSelector.appsDeleteCheck).check();

   common.logout();
   cy.login(email,usersText.password);
   cy.get(commonSelectors.appCreateButton).should("exist");
   cy.get(commonSelectors.appCardOptions).first().click();
   cy.contains("Delete app").should("exist");

   permissions.adminLogin();
   cy.get(groupsSelector.permissionsLink).click();
   cy.get(groupsSelector.appsDeleteCheck).uncheck();

   common.logout();
   cy.login(email,usersText.password);
   cy.get(commonSelectors.appCardOptions).first().click();
   cy.contains("Delete app").should("not.exist");

   cy.createApp(appName);
   cy.get(commonSelectors.appCardOptions).first().click();
   cy.contains("Delete app").should("exist");
   cy.get(commonSelectors.deleteApp).click();
   cy.get(commonSelectors.confirmButton).click();

   permissions.adminLogin();
   cy.get(groupsSelector.permissionsLink).click();
   cy.get(groupsSelector.appsCreateCheck).uncheck();

   common.logout();
   cy.login(email,usersText.password);
   cy.contains("Create new application").should("not.exist");
  });

  it("Should verify Create/Update/Delete folder permission", ()=>{
   permissions.adminLogin();
   cy.get(groupsSelector.permissionsLink).click();
   cy.get(groupsSelector.foldersCreateCheck).check();

   common.logout();
   cy.login(email,usersText.password);

   cy.contains("+ Create new folder").should("exist");

   cy.get(commonSelectors.createFolderButton).click();
   cy.clearAndType(commonSelectors.folderNameInput, folderName);
   cy.get(commonSelectors.folderCreateButton).click();
   cy.contains(folderName).should("exist");

   cy.get(commonSelectors.folderItemOptions).click();
   cy.get(commonSelectors.deleteFolder).click();
   cy.get(commonSelectors.confirmButton).click();

   permissions.adminLogin();
   cy.get(groupsSelector.permissionsLink).click();
   cy.get(groupsSelector.foldersCreateCheck).uncheck();

   common.logout();
   cy.login(email,usersText.password);
   cy.contains("+ Create new folder").should("not.exist");

   permissions.adminLogin();
   cy.contains('td', appName).parent().within(() => {
    cy.get('td a').contains("Delete").click();
   });

   common.logout();
   cy.login(email,usersText.password);
   cy.contains(appName).should("not.exist");
   
   common.logout();
   cy.appUILogin();
   cy.get(commonSelectors.appCardOptions).first().click();
   cy.contains("Delete app").should("exist");
   cy.get(commonSelectors.deleteApp).click();
   cy.get(commonSelectors.confirmButton).click();
  });
});