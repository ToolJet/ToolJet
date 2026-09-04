import { multipageSelector } from "Selectors/multipage";
import { commonSelectors } from "../../constants/selectors/common";

// generateCypressDataCy: lowercases, non-alphanumerics -> '-', trims '-'
// (frontend/src/modules/common/helpers/cypressHelpers.js)
export const pageHandleCy = (name) =>
  String(name)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

// Open the RightSideBar "Page settings" tab (replaces the old left-sidebar Pages button)
export const openPagesPanel = () => {
  cy.get(multipageSelector.pageSettingsButton).click();
  cy.get(".pages-settings").should("be.visible");
};

// Click a page row to open its AddEditPagePopup editor
export const openPageEditor = (pageName) => {
  cy.get(multipageSelector.pageRow(pageHandleCy(pageName))).click();
  cy.get(multipageSelector.addEditPagePopup).should("be.visible");
};

// Close the AddEditPagePopup. Dismiss any nested Radix popover (e.g. the event
// add-menu) first with Escape, then click far from any overlay to trigger the
// react-bootstrap rootClose.
export const closePageEditor = () => {
  cy.get("body").type("{esc}");
  cy.wait(200);
  cy.get("body").click(5, 5);
  cy.wait(200);
  cy.get(multipageSelector.addEditPagePopup).should("not.exist");
};

// Toggle a labelled switch inside the open AddEditPagePopup.
// "Mark as home" / "Disable page" render the label as <label class="form-label">
// adjacent to a .form-switch (AddNewPagePopup.jsx:456,478). "Hide this page on
// navigation" renders via InspectorTooltip => label has data-cy
// `label-<kebab>` and the switch lives under the shared .wrapper-div-code-editor
// ancestor (AddNewPagePopup.jsx HidePageOnNavigation + Inspector ToolTip.jsx:30).
const toggleHideSwitch = () => {
  cy.get(multipageSelector.addEditPagePopup)
    .find('[data-cy="label-hide-this-page-on-navigation"]')
    .parents(".wrapper-div-code-editor")
    .first()
    .find('.form-switch input[type="checkbox"]')
    .click({ force: true });
};

const toggleFormLabelSwitch = (label) => {
  cy.get(multipageSelector.addEditPagePopup)
    .contains(".form-label", label)
    .parent()
    .find('.form-switch input[type="checkbox"]')
    .click({ force: true });
};

export const searchPage = (pageName) => {
  // Search input lives in the panel header — AddPageButton/PageSettings header.
  cy.get('[title="Search"]').click();
  cy.get('[data-cy="search-input-field"]').type(pageName);
};

export const clearSearch = () => {
  cy.get(".clear-icon").click();
};

// New page creation: the "New page" button auto-creates "Page N" and opens the
// editor; the Page name input is focused. We rename it to the requested name.
export const addNewPage = (pageName) => {
  cy.get(multipageSelector.addNewPageButton).click();
  cy.get(multipageSelector.addEditPagePopup).should("be.visible");
  // The popup auto-creates "Page N" asynchronously and populates the name input.
  // Wait until it has a non-empty value before replacing it, then commit on blur.
  // The auto-name is set asynchronously (addNewPage POST -> setPageName("Page N")
  // -> switchPage). Wait until it is populated AND stable so a later async setState
  // can't clobber the value we type next.
  cy.get(multipageSelector.pageNameInput)
    .first()
    .invoke("val")
    .should("match", /^Page /);
  cy.wait(1000);
  cy.get(multipageSelector.pageNameInput)
    .first()
    .invoke("val")
    .should("match", /^Page /); // confirm stable, not mid-render
  cy.get(multipageSelector.pageNameInput)
    .first()
    .focus()
    .type("{selectall}{backspace}")
    .type(`${pageName}`)
    .should("have.value", pageName)
    .blur();
  cy.wait(800);
  closePageEditor();
  cy.get(multipageSelector.pageRow(pageHandleCy(pageName))).should(
    "be.visible"
  );
};

export const modifyPageHandle = (pageName, handle) => {
  openPageEditor(pageName);
  // Handle is the form-control inside the column whose label is "Handle"
  // (AddNewPagePopup.jsx:372-381). Only rendered for default pages.
  cy.get(multipageSelector.addEditPagePopup)
    .contains(".form-label", "Handle")
    .parent()
    .find("input.form-control")
    .clear()
    .type(handle)
    .blur();
  cy.wait(500);
  closePageEditor();
};

export const detetePage = (pageName) => {
  openPageEditor(pageName);
  // Header action button with tooltip "Delete page" (AddNewPagePopup.jsx:334-347)
  cy.get(`${multipageSelector.addEditPagePopup} .actions-container button`)
    .last()
    .click();
  cy.get(multipageSelector.modalConfirmButton).click();
  cy.verifyToastMessage(
    commonSelectors.toastMessage,
    "Page deleted successfully"
  );
  cy.notVisible(multipageSelector.pageRow(pageHandleCy(pageName)));
};

export const hideOrUnhidePage = (pageName, operation = "hide") => {
  openPageEditor(pageName);
  // "Hide this page on navigation" switch (AddNewPagePopup.jsx HidePageOnNavigation)
  toggleHideSwitch();
  cy.wait(500);
  closePageEditor();
};

export const setHomePage = (pageName) => {
  openPageEditor(pageName);
  toggleFormLabelSwitch("Mark as home");
  cy.wait(500);
  closePageEditor();
};

export const addEventHandler = (pageName) => {
  openPageEditor(pageName);
  // Page events section uses the shared EventManager popover model (SHARED FIX 2):
  // add-event-handler opens add-event-menu; picking the page event ("On page load",
  // value onPageLoad — AddNewPagePopup.jsx:617 + EventManager.jsx:1297-1306) creates
  // the handler card.
  cy.get(multipageSelector.addEditPagePopup)
    .find('[data-cy="add-event-handler"]')
    .click({ force: true });
  cy.get('[data-cy="event-trigger-option-onPageLoad"]').click({ force: true });
  cy.get('[data-cy="event-handler-card"]').should("exist");
  cy.wait(500);
  closePageEditor();
};

export const disableOrEnablePage = (pageName, option = "disable") => {
  openPageEditor(pageName);
  toggleFormLabelSwitch("Disable page");
  cy.wait(500);
  closePageEditor();
};

// hideOrUnhidePageMenu / page-menu disable were part of the removed left-sidebar
// "Page settings header" UI; the toggle now lives under Header & navigation in the
// PageSettings Properties tab and has no data-cy. Kept as a no-op-safe stub so any
// stale import resolves; real coverage is quarantined in the spec.
export const hideOrUnhidePageMenu = () => {
  openPagesPanel();
};
