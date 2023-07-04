import { commonSelectors, commonWidgetSelector } from "Selectors/common";
import { fake } from "Fixtures/fake";
import { logout, navigateToAppEditor } from "Support/utils/common";
import { commonText } from "Texts/common";
import { addNewUserMW } from "Support/utils/userPermissions";
import { userSignUp } from "Support/utils/onboarding";

describe("App share functionality", () => {
  const data = {};
  data.appName = `${fake.companyName} App`;
  data.firstName = fake.firstName;
  data.lastName = fake.lastName.replaceAll("[^A-Za-z]", "");
  data.email = fake.email.toLowerCase();
  const slug = data.appName.toLowerCase().replace(/\s+/g, "-");
  beforeEach(() => {
    cy.appUILogin();
  });

  it("Verify private and public app share funtionality", () => {
    cy.createApp();
    cy.renameApp(data.appName);
    cy.dragAndDropWidget("Table", 250, 250);

    cy.get(commonWidgetSelector.shareAppButton).click();

    for (const elements in commonWidgetSelector.shareModalElements) {
      cy.get(
        commonWidgetSelector.shareModalElements[elements]
      ).verifyVisibleElement(
        "have.text",
        commonText.shareModalElements[elements]
      );
    }

    cy.get(commonWidgetSelector.makePublicAppToggle).should("be.visible");
    cy.get(commonWidgetSelector.appLink).should("be.visible");
    cy.get(commonWidgetSelector.appNameSlugInput).should("be.visible");
    cy.get(commonWidgetSelector.iframeLink).should("be.visible");
    cy.get(commonWidgetSelector.modalCloseButton).should("be.visible");

    cy.clearAndType(commonWidgetSelector.appNameSlugInput, `${slug}`);
    cy.get(commonWidgetSelector.modalCloseButton).click();
    cy.dragAndDropWidget("Table", 50, 50);
    cy.get(commonSelectors.editorPageLogo).click();

    logout();
    cy.visit(`/applications/${slug}`);

    cy.get(commonSelectors.loginButton).should("be.visible");

    cy.clearAndType(commonSelectors.workEmailInputField, "dev@tooljet.io");
    cy.clearAndType(commonSelectors.passwordInputField, "password");
    cy.get(commonSelectors.loginButton).click();

    cy.wait(500);
    cy.get('[data-cy="draggable-widget-table1"]').should("be.visible");
    cy.get(commonSelectors.viewerPageLogo).click();

    navigateToAppEditor(data.appName);
    cy.get(commonWidgetSelector.shareAppButton).click();
    cy.get(commonWidgetSelector.makePublicAppToggle).check();
    cy.get(commonWidgetSelector.modalCloseButton).click();
    cy.get(commonSelectors.editorPageLogo).click();

    logout();
    cy.visit(`/applications/${slug}`);
    cy.wait(500);
    cy.get('[data-cy="draggable-widget-table1"]').should("be.visible");
  });

  it("Verify app private and public app visisbility for the same workspace user", () => {
    addNewUserMW(data.firstName, data.email);

    logout();
    cy.visit(`/applications/${slug}`);
    cy.get('[data-cy="draggable-widget-table1"]').should("be.visible");

    cy.appUILogin();
    navigateToAppEditor(data.appName);
    cy.wait(1000);
    cy.get("body").then(($el) => {
      if ($el.text().includes("Skip", { timeout: 10000 })) {
        cy.get(commonSelectors.skipButton).click();
      }
    });
    cy.get(commonWidgetSelector.shareAppButton).click();
    cy.get(commonWidgetSelector.makePublicAppToggle).uncheck();
    cy.get(commonWidgetSelector.modalCloseButton).click();
    cy.get(commonSelectors.editorPageLogo).click();

    logout();
    cy.visit(`/applications/${slug}`);

    cy.login(data.email, "password");
    cy.get(commonSelectors.allApplicationLink).verifyVisibleElement(
      "have.text",
      commonText.allApplicationLink
    );
  });

  it("Verify app private and public app visisbility for the same instance user", () => {
    data.firstName = fake.firstName;
    data.email = fake.email.toLowerCase();

    logout();
    userSignUp(data.firstName, data.email, "Test");
    cy.visit(`/applications/${slug}`);

    cy.clearAndType(commonSelectors.workEmailInputField, data.email);
    cy.clearAndType(commonSelectors.passwordInputField, "password");
    cy.get(commonSelectors.signInButton).click();
    cy.verifyToastMessage(commonSelectors.toastMessage, "Invalid credentials");
    cy.visit("/");
    logout();
    cy.appUILogin();

    navigateToAppEditor(data.appName);
    cy.reloadAppForTheElement("skip");
    cy.wait(4000);
    cy.skipEditorPopover();
    cy.get(commonWidgetSelector.shareAppButton).click();
    cy.get(commonWidgetSelector.makePublicAppToggle).check();
    cy.get(commonWidgetSelector.modalCloseButton).click();
    cy.get(commonSelectors.editorPageLogo).click();

    logout();
    cy.visit(`/applications/${slug}`);
    cy.get('[data-cy="draggable-widget-table1"]').should("be.visible");
    cy.get(commonSelectors.viewerPageLogo).click();
  });
});
