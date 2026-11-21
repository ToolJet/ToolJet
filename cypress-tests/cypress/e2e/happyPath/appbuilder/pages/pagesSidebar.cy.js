import { fake } from "Fixtures/fake";
import { multipageSelector } from "Selectors/appBuilder/pages/multipage";
import { commonSelectors } from "Selectors/common";

import {
  addNewPage,
  openPagesPanel,
  openPageEditor,
  closePageEditor,
  renamePage,
  duplicatePage,
  goToPage,
  modifyPageHandle,
  pageHandleCy,
} from "Support/utils/appBuilder/pages";

// Handle field inside the open AddEditPagePopup (default pages only). The popup's
// name input is also an `input.form-control[type="text"]`, so the handle input is
// located through its "Handle" form-label column (AddNewPagePopup.jsx).
const handleInput = () =>
  cy
    .get(multipageSelector.addEditPagePopup)
    .contains(".form-label", "Handle")
    .parent()
    .find("input.form-control");

// Labelled switch inside the open AddEditPagePopup ("Mark as home" / "Disable page"
// render as <label.form-label> next to a .form-switch — AddNewPagePopup.jsx).
const formLabelSwitch = (label) =>
  cy
    .get(multipageSelector.addEditPagePopup)
    .contains(".form-label", label)
    .parent()
    .find('.form-switch input[type="checkbox"]');

const openDeleteModal = (pageName) => {
  openPageEditor(pageName);
  // Header action buttons are [go-to-page, duplicate, delete] for default pages
  // (AddNewPagePopup.jsx Popover.Header actions-container); delete is last.
  cy.get(`${multipageSelector.addEditPagePopup} .actions-container button`)
    .last()
    .click();
  cy.get(multipageSelector.deleteModalTitle).should("have.text", "Delete Page");
};

// Late app-data syncs re-run the popup's state-sync effect (AddNewPagePopup.jsx
// useEffect on [pages, editingPage]) and clobber text typed too early — wait for
// the name input to be populated AND stable before editing it (same guard as the
// addNewPage helper).
const waitForNameInputSync = (currentName) => {
  cy.get(multipageSelector.pageNameInput)
    .first()
    .should("have.value", currentName);
  cy.wait(1000);
  cy.get(multipageSelector.pageNameInput)
    .first()
    .should("have.value", currentName);
};

describe("Pages sidebar", { testIsolation: false }, () => {
  beforeEach(() => {
    cy.apiLogin();
    cy.apiCreateApp(`${fake.companyName}-${Date.now()}-Pages-App`);
    cy.openApp();
  });

  it("should verify the pages panel UI and open/close behaviour", () => {
    openPagesPanel();
    cy.get(multipageSelector.panelHeaderTitle).should(
      "have.text",
      "Pages and navigation"
    );
    cy.get(multipageSelector.addNewPageButton).should("be.visible");
    // a fresh app ships with the default Home page
    cy.get(multipageSelector.pageRow("home")).should("be.visible");

    cy.get(multipageSelector.panelCloseButton).click();
    cy.get(".pages-settings").should("not.exist");

    // reopens cleanly
    openPagesPanel();
    cy.get(multipageSelector.pageRow("home")).should("be.visible");
  });

  it("should rename a page and reject duplicate or empty names", () => {
    openPagesPanel();
    addNewPage("pageOne");
    addNewPage("pageTwo");

    // renaming to an existing page name is rejected with a toast and no change
    // (pageMenuSlice.js updatePageName duplicate-name guard)
    openPageEditor("pageTwo");
    waitForNameInputSync("pageTwo");
    cy.get(multipageSelector.pageNameInput)
      .first()
      .focus()
      .type("{selectall}{backspace}")
      .type("pageOne")
      .should("have.value", "pageOne")
      .blur();
    // closeAction=false: the toast auto-dismisses and clicking its close button
    // doubles as an outside click that dismisses the page editor popover
    cy.verifyToastMessage(
      commonSelectors.toastMessage,
      "Page with same name already exists",
      false
    );
    closePageEditor();
    cy.get(multipageSelector.pageRow("pagetwo")).should("be.visible");
    cy.get(multipageSelector.pageRow("pageone")).should("have.length", 1);

    // successful rename re-keys the page row (data-cy derives from the name)
    renamePage("pageOne", "Overview page");
    cy.notVisible(multipageSelector.pageRow("pageone"));

    // an empty name is never committed (name input onBlur only commits non-empty)
    openPageEditor("Overview page");
    waitForNameInputSync("Overview page");
    cy.get(multipageSelector.pageNameInput)
      .first()
      .focus()
      .type("{selectall}{backspace}")
      .blur();
    cy.wait(500);
    closePageEditor();
    cy.get(multipageSelector.pageRow(pageHandleCy("Overview page"))).should(
      "be.visible"
    );
    cy.waitForAutoSave();
  });

  it("should validate the page handle format and uniqueness", () => {
    openPagesPanel();
    addNewPage("pageOne");
    openPageEditor("pageOne");

    // wait for the popup state to settle before editing (see waitForNameInputSync)
    handleInput().invoke("val").should("not.be.empty");
    cy.wait(1000);

    // empty handle -> inline validation (validateKebabCase in _helpers/utils.js)
    handleInput().clear();
    cy.get(multipageSelector.pageHandleInvalidFeedback)
      .should("be.visible")
      .and("contain.text", "Handle cannot be empty.");

    // invalid characters -> inline validation
    handleInput().type("invalid handle!");
    cy.get(multipageSelector.pageHandleInvalidFeedback)
      .should("be.visible")
      .and(
        "contain.text",
        "Handle can only contain letters, numbers, and hyphens."
      );

    // duplicate handle -> rejected with a toast on save
    // (pageMenuSlice.js updatePageHandle duplicate-handle guard)
    handleInput().clear().type("home").blur();
    cy.verifyToastMessage(
      commonSelectors.toastMessage,
      "Page with same handle already exists",
      false
    );

    // a valid unique handle commits and persists
    handleInput().clear().type("page-one-nav").blur();
    cy.wait(500);
    closePageEditor();
    openPageEditor("pageOne");
    handleInput().should("have.value", "page-one-nav");
    closePageEditor();
    cy.waitForAutoSave();
  });

  it("should confirm, cancel and guard page deletion", () => {
    openPagesPanel();

    // the only page in an app cannot be deleted (pageMenuSlice.js deletePage guard);
    // the error path leaves the confirmation modal open
    openDeleteModal("Home");
    cy.get(multipageSelector.modalMessage).should(
      "contain.text",
      "Are you sure you want to delete"
    );
    cy.get(multipageSelector.modalConfirmButton).click();
    // closeAction=false: the error toast auto-dismisses; clicking its close
    // button races the dismissal and detaches mid-click
    cy.verifyToastMessage(
      commonSelectors.toastMessage,
      "You cannot delete the only page in your app.",
      false
    );
    cy.get(multipageSelector.modalCancelButton).click();
    cy.get(".delete-page-modal").should("not.exist");
    // cancelling the delete modal deliberately reopens the page-edit popover
    // (pageMenuSlice.js toggleDeleteConfirmationModal: showEditingPopover = !show);
    // close it so the next action doesn't race its rootClose handling
    closePageEditor();
    cy.get(multipageSelector.pageRow("home")).should("be.visible");

    // cancelling the confirmation keeps the page
    addNewPage("pageOne");
    openDeleteModal("pageOne");
    cy.get(multipageSelector.modalMessage).should(
      "have.text",
      "Are you sure you want to delete pageOne page?"
    );
    cy.get(multipageSelector.modalCancelButton).click();
    cy.get(".delete-page-modal").should("not.exist");
    // the edit popover reopens after cancel (see above) — dismiss it
    closePageEditor();
    cy.get(multipageSelector.pageRow("pageone")).should("be.visible");
    cy.waitForAutoSave();
  });

  it("should duplicate a page and switch to the copy", () => {
    openPagesPanel();

    // server names clones `${name} (copy)` with handle `${handle}-copy`
    // (page.service.ts clonePage) and the editor switches to the new page
    duplicatePage("Home", "Home (copy)");
    cy.url().should("include", "home-copy");

    // a second clone of the same page gets a numbered suffix
    duplicatePage("Home", "Home (copy 1)");
    cy.get(multipageSelector.pageRow("home-copy-1")).should("be.visible");
    cy.waitForAutoSave();
  });

  it("should switch pages via go-to-page and guard the home page switches", () => {
    openPagesPanel();
    addNewPage("pageOne");
    modifyPageHandle("pageOne", "page-one-nav");

    // addNewPage leaves the canvas on pageOne; go-to-page switches back to Home
    goToPage("Home");
    cy.url().should("include", "/home");
    goToPage("pageOne");
    cy.url().should("include", "page-one-nav");

    // the home page cannot be un-marked or disabled (AddNewPagePopup.jsx switch guards)
    openPageEditor("Home");
    formLabelSwitch("Mark as home").should("be.checked").and("be.disabled");
    formLabelSwitch("Disable page").should("be.disabled");
    closePageEditor();
    cy.waitForAutoSave();
  });
});
