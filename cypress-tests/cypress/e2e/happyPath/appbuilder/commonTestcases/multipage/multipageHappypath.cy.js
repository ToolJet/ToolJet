import { fake } from "Fixtures/fake";
import { multipageSelector } from "Selectors/multipage";

import {
  addEventHandler,
  addNewPage,
  setHomePage,
  hideOrUnhidePage,
  detetePage,
  modifyPageHandle,
  disableOrEnablePage,
  openPagesPanel,
  openPageEditor,
  pageHandleCy,
} from "Support/utils/multipage";

describe("Multipage", { testIsolation: false }, () => {
  beforeEach(() => {
    cy.apiLogin();
    cy.apiCreateApp(`${fake.companyName}-App`);
    cy.openApp();
  });

  // QUARANTINED: this test asserted ~40 data-cy elements of the OLD left-sidebar
  // Pages UX (label-pages, page-menu-option-icon, header-page-handle, page-handle-text,
  // rename/mark-home/hide/event-handlers option buttons, page-settings-header,
  // disable-page-menu-*, title-edit-page-handle modal, modal-title-page-events, etc.).
  // That whole surface was removed when Pages migrated to the RightSideBar
  // PageSettingsTab (frontend/src/AppBuilder/RightSideBar/PageSettingsTab/*):
  //   - the dropdown option-buttons are now PageOptions buttons with NO data-cy
  //     (PageMenuItem.jsx:299-379),
  //   - rename/handle/mark-home/hide/disable/events all moved into the
  //     AddEditPagePopup as plain inputs/switches with NO data-cy
  //     (AddNewPagePopup.jsx),
  //   - the standalone "edit page handle" and "page events" modals (EditModal.jsx /
  //     SettingsModal.jsx) are dead code, no longer rendered anywhere.
  // Re-asserting the equivalent surface would mean authoring brand-new element
  // checks, not migrating existing ones, so this is quarantined pending a
  // purpose-built element spec for the new popover UI.
  it.skip("should verify the elements on multipage", () => {});

  it("should verify the basic functions of multipage", () => {
    openPagesPanel();
    addNewPage("pageOne");
    addNewPage("pageTwo");
    addNewPage("pageThree");

    hideOrUnhidePage("pageOne");
    hideOrUnhidePage("pageTwo");
    hideOrUnhidePage("pageOne", "show");
    addEventHandler("pageThree");
    setHomePage("pageThree");
    modifyPageHandle("pageOne", "page-one-renamed");
    cy.waitForAutoSave();

    // pages still listed after the edits
    cy.get(multipageSelector.pageRow(pageHandleCy("pageThree"))).should(
      "be.visible"
    );
    cy.get(multipageSelector.pageRow("home")).should("be.visible");
  });

  it("should verify the disable/delete functions of multipage", () => {
    openPagesPanel();
    addNewPage("pageOne");
    addNewPage("pageTwo");
    addNewPage("pageThree");

    // Delete: removes the row + "Page deleted successfully" toast
    detetePage("pageOne");

    // Disable: the page row remains but is flagged disabled. Re-opening the editor
    // shows the "Disable page" switch checked (AddNewPagePopup.jsx:478-489).
    disableOrEnablePage("pageTwo");
    cy.get(multipageSelector.pageRow("pagetwo")).should("be.visible");
    openPageEditor("pageTwo");
    cy.get(multipageSelector.addEditPagePopup)
      .contains(".form-label", "Disable page")
      .parent()
      .find('.form-switch input[type="checkbox"]')
      .should("be.checked");
  });
});
