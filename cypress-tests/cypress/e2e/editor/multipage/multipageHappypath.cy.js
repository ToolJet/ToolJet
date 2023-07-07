import { fake } from "Fixtures/fake";
import { multipageText } from "Texts/multipage";
import { multipageSelector } from "Selectors/multipage";

import { commonWidgetText, widgetValue, customValidation } from "Texts/common";
import { commonSelectors, commonWidgetSelector } from "Selectors/common";
import { buttonText } from "Texts/button";
import {
  verifyControlComponentAction,
  randomString,
} from "Support/utils/textInput";
import {
  openAccordion,
  verifyAndModifyParameter,
  openEditorSidebar,
  verifyAndModifyToggleFx,
  addDefaultEventHandler,
  verifyComponentValueFromInspector,
  selectColourFromColourPicker,
  verifyBoxShadowCss,
  verifyLayout,
  verifyTooltip,
  editAndVerifyWidgetName,
  verifyPropertiesGeneralAccordion,
  verifyStylesGeneralAccordion,
  randomNumber,
  closeAccordions,
} from "Support/utils/commonWidget";
import {
  hideOrUnhidePageMenu,
  addEventHandler,
  addNewPage,
  setHomePage,
  hideOrUnhidePage,
  detetePage,
  modifyPageHandle,
  clearSearch,
  searchPage,
} from "Support/utils/multipage";

describe("Multipage", () => {
  beforeEach(() => {
    cy.appUILogin();
    cy.createApp();
  });

  it("should verify the elements on multipage", () => {
    const data = {};
    data.appName = `${fake.companyName}-App`;
    data.widgetName = fake.widgetName;
    data.tooltipText = fake.randomSentence;
    data.minimumLength = randomNumber(1, 4);
    data.maximumLength = randomNumber(8, 10);
    data.customText = randomString(12);

    cy.renameApp(data.appName);

    cy.get(multipageSelector.sidebarPageButton).click();
    cy.get(multipageSelector.pagesLabel).verifyVisibleElement(
      "have.text",
      multipageText.labelPages
    );
    cy.get(multipageSelector.addPageIcon).should("be.visible");
    cy.get(multipageSelector.searchPageIcon).should("be.visible");
    cy.get(multipageSelector.pagesPinIcon).should("be.visible");

    cy.get(multipageSelector.homePageLabel).verifyVisibleElement(
      "have.text",
      multipageText.pageNameHome
    );
    cy.get(multipageSelector.homePageIcon).should("be.visible");
    cy.get(multipageSelector.pageMenuIcon).should("be.visible");

    cy.get(multipageSelector.pageMenuIcon).click();
    cy.wait(500);
    // cy.get(multipageSelector.pageEventHandler).click({force:true})
    cy.get(multipageSelector.pageEventHandler).verifyVisibleElement(
      "have.text",
      multipageText.headerPageHandle
    );
    cy.get(multipageSelector.pageHandleText).verifyVisibleElement(
      "have.text",
      "home"
    );
    cy.get(multipageSelector.pageHandleIcon).should("be.visible");

    cy.get(multipageSelector.renameOptionIcon).should("be.visible");
    cy.get(multipageSelector.renameOptionButton).verifyVisibleElement(
      "have.text",
      multipageText.optionRename
    );

    cy.get(multipageSelector.markHomePageIcon).should("be.visible");
    cy.get(multipageSelector.markHomePageOptionButton).verifyVisibleElement(
      "have.text",
      multipageText.optionMarkHome
    );

    cy.get(multipageSelector.hidePageOptionIcon).should("be.visible");
    cy.get(multipageSelector.hidePageOptionButton).verifyVisibleElement(
      "have.text",
      multipageText.optionHidePage
    );

    cy.get(multipageSelector.eventHandlersOptionIcon).should("be.visible");
    cy.get(multipageSelector.eventHandlerOptionButton).verifyVisibleElement(
      "have.text",
      multipageText.optionEventHandler
    );

    cy.get(multipageSelector.disabledDeleteButton).should("be.visible");

    cy.get(multipageSelector.pagesPinIcon).click();
    cy.get(multipageSelector.sidebarPageButton).click();
    cy.get(multipageSelector.pagesMenuIcon).click({ force: true });

    cy.get(multipageSelector.pageHeaderSettings).verifyVisibleElement(
      "have.text",
      multipageText.headerSettings
    );
    cy.get(multipageSelector.disableThePageMenuLabel).verifyVisibleElement(
      "have.text",
      multipageText.optionDisableMenu
    );
    cy.get(multipageSelector.disableMenuDescription).verifyVisibleElement(
      "have.text",
      multipageText.disableMenuDescription
    );
    cy.get(multipageSelector.disableMenuToggle).should("be.visible");

    addNewPage("test_page");
    cy.get(multipageSelector.homePageLabel).click();
    cy.get('[data-cy="pages-name-test_page"]')
      .verifyVisibleElement("have.text", "test_page")
      .click();
    cy.get(multipageSelector.pageMenuIcon).click();
    cy.wait(500);
    cy.get(multipageSelector.pageHandleText).verifyVisibleElement(
      "have.text",
      "test-page"
    );
    cy.get(multipageSelector.markHomePageOptionButton).click();
    cy.get('[data-cy="pages-name-test_page"]')
      .parents(".page-handler")
      .find(multipageSelector.homePageIcon)
      .should("be.visible");

    hideOrUnhidePage("home");
    cy.get('[data-cy="pages-name-home"]')
      .parents(".page-handler")
      .find(multipageSelector.hidePageIcon)
      .should("be.visible");

    hideOrUnhidePage("home", "unhide");
    cy.notVisible(multipageSelector.hidePageIcon);

    cy.get(multipageSelector.homePageLabel).click();
    cy.get(multipageSelector.pageMenuIcon).click();
    cy.wait(500);
    cy.get(multipageSelector.deletePageOptionButton).click();
    cy.get(".modal-title").verifyVisibleElement(
      "have.text",
      multipageText.optionDeletePage
    );
    cy.get(multipageSelector.modalMessage).verifyVisibleElement(
      "have.text",
      multipageText.deleteModalMessage
    );
    cy.get(multipageSelector.modalConfirmButton).verifyVisibleElement(
      "have.text",
      "Yes"
    );
    cy.get(multipageSelector.modalCancelButton)
      .verifyVisibleElement("have.text", "Cancel")
      .click();
    cy.get('[data-cy="pages-name-test_page"]').should("be.visible");

    cy.get(multipageSelector.pageMenuIcon).click();
    cy.wait(500);
    cy.get(multipageSelector.deletePageOptionButton).click();
    cy.get(multipageSelector.modalConfirmButton).click();
    cy.notVisible(multipageSelector.homePageLabel);

    cy.get(multipageSelector.pageMenuIcon).click();
    cy.wait(500);
    cy.get(multipageSelector.eventHandlerOptionButton).click();
    cy.get(multipageSelector.modalTitlePageEvents).verifyVisibleElement(
      "have.text",
      multipageText.eventModalTitle
    );
    cy.get(multipageSelector.pageEventsLabel).verifyVisibleElement(
      "have.text",
      multipageText.labelEvents
    );
    cy.get(multipageSelector.addEventHandlerLink).verifyVisibleElement(
      "have.text",
      multipageText.addEventHandlerLink
    );
    cy.get(multipageSelector.noEventHandlerMessage).verifyVisibleElement(
      "have.text",
      multipageText.noEventHandlerInfo
    );
    cy.get(multipageSelector.closeModal).verifyVisibleElement(
      "have.text",
      "Close"
    );
    cy.get(multipageSelector.closeIconEvents).should("be.visible");
    cy.get(multipageSelector.addEventHandlerLink).click();
    cy.get(multipageSelector.eventName).verifyVisibleElement(
      "have.text",
      "Show Alert"
    );
    cy.get(multipageSelector.closeModal).click();

    searchPage("randomPageName");
    cy.get(multipageSelector.labelNoPagesFound).verifyVisibleElement(
      "have.text",
      multipageText.labelNoPagesFound
    );
    clearSearch();

    addNewPage("test");
    cy.get(multipageSelector.pageMenuIcon).click();
    cy.wait(500);
    cy.get(multipageSelector.pageHandleText).click();
    cy.get(multipageSelector.modalTitleEditPageHandle).verifyVisibleElement(
      "have.text",
      multipageText.pageHandleModalTitle
    );
    cy.get(multipageSelector.pageHandleSaveButton).should("be.visible");
    cy.get(multipageSelector.pageHandlePreInputSection).verifyVisibleElement(
      "have.text",
      `${Cypress.config("baseUrl").substring(0, 16)}.../`
    );
    cy.get(multipageSelector.pageHandleInfo).verifyVisibleElement(
      "have.text",
      multipageText.editPagehandleInfo
    );
    cy.get(multipageSelector.pageHandleCancelButton).should("be.visible");

    cy.get(multipageSelector.pageHandleInputField).clear();
    cy.get(multipageSelector.pageHandleInvalidFeedback).verifyVisibleElement(
      "have.text",
      multipageText.pageHanmdleEmptyMessage
    );

    cy.get(multipageSelector.pageHandleInputField)
      .type("test")
      .clear()
      .type("test-page");
    // cy.get(multipageSelector.pageHandleInvalidFeedback).verifyVisibleElement('have.text', 'Page handle cannot empty')WIP
    cy.get(multipageSelector.pageHandleSaveButton).click();
    cy.verifyToastMessage(
      commonSelectors.toastMessage,
      multipageText.samePagehandleToast
    );
  });
  it("should verify the basic functions of multipage", () => {
    cy.get(multipageSelector.sidebarPageButton).click();
    cy.get(multipageSelector.pagesPinIcon).click();
    addNewPage("pageOne");
    addNewPage("pageTwo");
    addNewPage("pageThree");

    hideOrUnhidePage("pageOne");
    hideOrUnhidePage("pageTwo");
    hideOrUnhidePage("pageOne", "unhide");
    addEventHandler("pageThree");
    cy.get(multipageSelector.closeModal).click();
    setHomePage("pageThree");
    modifyPageHandle("home", "1");
    cy.waitForAutoSave();
    cy.openInCurrentTab(commonWidgetSelector.previewButton);

    cy.get(multipageSelector.homePageLabel).click();
  });
});
