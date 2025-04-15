import { commonSelectors, commonWidgetSelector } from "Selectors/common";
import { fake } from "Fixtures/fake";
import { releaseApp } from "Support/utils/common";
import {
  verifySlugValidations,
  verifySuccessfulSlugUpdate,
  verifyURLs,
  resolveHost,
} from "Support/utils/apps";

describe("App Slug", () => {
  const data = {};
  const host = resolveHost();

  beforeEach(() => {
    data.slug = `${fake.companyName.toLowerCase()}-app`;
    data.appName = `${fake.companyName} App`;
    cy.log(Cypress.env("workspaceId"));
    cy.defaultWorkspaceLogin();
  });

  before(() => {
    data.appName = `${fake.companyName} App`;
    cy.apiLogin();
    cy.apiCreateApp(data.appName);
    cy.wait(1000);
    cy.apiLogout();
  });

  it("Verify app slug cases in global settings", () => {
    cy.apiLogin("dev@tooljet.io", "password").then(() => {
      const workspaceId = Cypress.env("workspaceId");
      const appId = Cypress.env("appId");

      cy.visit("/my-workspace");
      cy.wait(1000);
      cy.openApp("my-workspace");
      cy.get(commonSelectors.leftSideBarSettingsButton).click();

      // Verify initial state
      cy.get(commonWidgetSelector.appSlugLabel).verifyVisibleElement(
        "have.text",
        "Unique app slug"
      );
      cy.get(commonWidgetSelector.appSlugInput).verifyVisibleElement(
        "have.value",
        Cypress.env("appId")
      );
      cy.get(commonWidgetSelector.appSlugInfoLabel).verifyVisibleElement(
        "have.text",
        "URL-friendly 'slug' consists of lowercase letters, numbers, and hyphens"
      );

      cy.get(commonWidgetSelector.appLinkLabel).verifyVisibleElement(
        "have.text",
        "App link"
      );

      cy.get(commonWidgetSelector.appLinkField).verifyVisibleElement(
        "have.text",
        `${host}/${workspaceId}/apps/${appId}`
      );

      // Validate all error cases
      verifySlugValidations(commonWidgetSelector.appSlugInput);

      // Verify successful slug update
      cy.clearAndType(commonWidgetSelector.appSlugInput, data.slug);
      verifySuccessfulSlugUpdate(workspaceId, data.slug);

      // Verify persistence
      cy.get('[data-cy="left-sidebar-debugger-button"]').click();
      cy.get(commonSelectors.leftSideBarSettingsButton).click();
      cy.get(commonWidgetSelector.appSlugInput).should("have.value", data.slug);

      // Release and verify URLs
      releaseApp();
      verifyURLs(workspaceId, data.slug, false);

      // Verify duplicate slug validation
      cy.visit("/my-workspace");
      cy.apiCreateApp(data.slug);
      cy.openApp("my-workspace");
      cy.get(commonSelectors.leftSideBarSettingsButton).click();
      cy.get(commonWidgetSelector.appSlugInput).clear();
      cy.clearAndType(commonWidgetSelector.appSlugInput, data.slug);
      cy.get(commonWidgetSelector.appSlugErrorLabel).verifyVisibleElement(
        "have.text",
        "This app slug is already taken."
      );
    });
  });

  it("Verify app slug cases in share modal", () => {
    cy.apiLogin("dev@tooljet.io", "password").then(() => {
      const workspaceId = Cypress.env("workspaceId");

      cy.apiCreateApp(data.appName);
      cy.openApp("my-workspace");

      // Set up initial slug
      cy.get(commonSelectors.leftSideBarSettingsButton).click();
      cy.get(commonWidgetSelector.appSlugInput).clear();
      cy.clearAndType(commonWidgetSelector.appSlugInput, data.slug);

      releaseApp();

      // Verify share modal
      cy.get(commonWidgetSelector.shareAppButton).click();
      cy.get(commonWidgetSelector.appLink).verifyVisibleElement(
        "have.text",
        `${host}/applications/`
      );
      cy.get(commonWidgetSelector.appNameSlugInput).should(
        "have.value",
        data.slug
      );

      // Validate all error cases in share modal
      verifySlugValidations(commonWidgetSelector.appNameSlugInput);

      cy.wait(500);
      cy.clearAndType(commonWidgetSelector.appNameSlugInput, data.slug);
      cy.get('[data-cy="app-slug-info-label"]')
        .invoke("text")
        .then((text) => {
          expect(text.trim()).to.eq(
            "URL-friendly 'slug' consists of lowercase letters, numbers, and hyphens"
          );
        });

      // Verify successful slug update in share modal
      data.slug = `${fake.companyName.toLowerCase()}-app`;
      cy.clearAndType(commonWidgetSelector.appNameSlugInput, data.slug);
      cy.get('[data-cy="app-slug-accepted-label"]').verifyVisibleElement(
        "have.text",
        "Slug accepted!"
      );

      // Close modal and verify URLs
      cy.get(commonWidgetSelector.modalCloseButton).click();
      verifyURLs(workspaceId, data.slug, true);

      // Verify duplicate slug validation in share modal
      cy.visit("/my-workspace");
      cy.apiCreateApp(data.slug);
      cy.openApp("my-workspace");
      releaseApp();
      cy.get(commonWidgetSelector.shareAppButton).click();
      cy.clearAndType(commonWidgetSelector.appNameSlugInput, data.slug);
      cy.get(commonWidgetSelector.appSlugErrorLabel).verifyVisibleElement(
        "have.text",
        "This app slug is already taken."
      );
    });
  });
});
