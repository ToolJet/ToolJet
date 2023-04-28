import { multipageSelector } from "Selectors/multipage";

export const searchPage = (pageName) => {
  cy.get('[data-cy="search-page-option-icon"]').click();
  cy.get('[data-cy="search-input-filed"]').type(pageName);
};

export const clearSearch = () => {
  cy.get(".clear-icon").click();
};

export const modifyPageHandle = (pageName, handle) => {
  cy.get(`[data-cy="pages-name-${pageName.toLowerCase()}"]`).click();
  cy.get(multipageSelector.pageMenuIcon).click();
  cy.get(multipageSelector.pageHandleText).click();
  cy.get(multipageSelector.pageHandleInputField).clear().type(handle);
  cy.get(multipageSelector.pageHandleSaveButton).click()
};

export const detetePage = (pageName) => {
  cy.get(`[data-cy="pages-name-${pageName.toLowerCase()}"]`).click();
  cy.get(multipageSelector.pageMenuIcon).click();
  cy.get(multipageSelector.deletePageOptionButton).click();
  cy.get(multipageSelector.modalConfirmButton).click();
  cy.notVisible(`[data-cy="pages-name-${pageName.toLowerCase()}"]`);
};

export const hideOrUnhidePage = (pageName, operation = "hide") => {
  cy.get(`[data-cy="pages-name-${pageName.toLowerCase()}"]`).click();
  cy.get(multipageSelector.pageMenuIcon).click();
  cy.get(`[data-cy="${operation}-page-option-button"]`).click();
};

export const setHomePage = (pageName) => {
  cy.get(`[data-cy="pages-name-${pageName.toLowerCase()}"]`).trigger('mouseover').click();
  cy.get(multipageSelector.pageMenuIcon).click();
  cy.get(multipageSelector.markHomePageOptionButton).click();
};

export const addNewPage = (pageName) => {
  cy.get(multipageSelector.addPageIcon).click();
  cy.get(".col-12 > .form-control").type(`{selectAll}{backspace}${pageName}`);
  cy.get(multipageSelector.addPageIcon).click();
  cy.get(`[data-cy="pages-name-${pageName.toLowerCase()}"]`).click();
};

export const addEventHandler = (pageName) => {
  cy.get(`[data-cy="pages-name-${pageName.toLowerCase()}"]`).click();
  cy.get(multipageSelector.pageMenuIcon).click();
  cy.get(multipageSelector.eventHandlerOptionButton).click();
  cy.get(multipageSelector.addEventHandlerLink).click();
  cy.get(multipageSelector.eventName).verifyVisibleElement(
    "have.text",
    "Show Alert"
  );
};

export const hideOrUnhidePageMenu = () => {
  cy.get(multipageSelector.sidebarPageButton).click();
  cy.get(multipageSelector.pagesMenuIcon).click();
  cy.get(multipageSelector.disableMenuToggle).click();
};
