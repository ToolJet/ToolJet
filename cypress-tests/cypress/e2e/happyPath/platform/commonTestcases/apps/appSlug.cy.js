import { fake } from "Fixtures/fake";
import { commonSelectors, commonWidgetSelector } from "Selectors/common";
import {
  resolveHost,
  verifySlugValidations,
  verifySuccessfulSlugUpdate,
  verifyURLs,
} from "Support/utils/apps";
import { releaseApp } from "Support/utils/common";

describe("App Slug", () => {
  const generateTestData = () => ({
    slug: `${fake.companyName.toLowerCase()}-app`,
    appName: `${fake.companyName} App`,
  });

  const host = resolveHost();
  let data;

  beforeEach(() => {
    data = generateTestData();
    cy.apiLogin();
    cy.skipWalkthrough();
    cy.apiCreateApp(data.appName);
    cy.openApp();
    cy.apiPublishDraftVersion("v1");

  });

  it("Verify app slug cases in global settings", () => {
    cy.url().should(
      "eq",
      `${host}/${Cypress.env("workspaceId")}/apps/${Cypress.env("appId")}/`
    );

    cy.get('[data-cy="query-manager-toggle-button"]', { timeout: 20000 })
      .should("be.visible")
      .click();

    cy.get(commonSelectors.leftSideBarSettingsButton).click();

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
      `${host}/${Cypress.env("workspaceId")}/apps/${Cypress.env("appId")}`
    );

    verifySlugValidations(commonWidgetSelector.appSlugInput);

    cy.clearAndType(commonWidgetSelector.appSlugInput, data.slug);
    verifySuccessfulSlugUpdate(Cypress.env("workspaceId"), data.slug);

    cy.get('[data-cy="left-sidebar-debugger-button"]').click();
    cy.get(commonSelectors.leftSideBarSettingsButton).click();
    cy.get(commonWidgetSelector.appSlugInput).should("have.value", data.slug);

    releaseApp();
    verifyURLs(Cypress.env("workspaceId"), data.slug, true);

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

  it("Verify app slug cases in share modal", () => {
    cy.get(commonSelectors.leftSideBarSettingsButton).click();
    cy.get(commonWidgetSelector.appSlugInput).clear();
    cy.clearAndType(commonWidgetSelector.appSlugInput, data.slug);

    releaseApp();

    cy.get(commonWidgetSelector.shareAppButton).click();
    cy.get(commonWidgetSelector.appLink).verifyVisibleElement(
      "have.text",
      `${host}/applications/`
    );
    cy.get(commonWidgetSelector.appNameSlugInput).should(
      "have.value",
      data.slug
    );

    verifySlugValidations(commonWidgetSelector.appNameSlugInput);

    cy.clearAndType(commonWidgetSelector.appNameSlugInput, data.slug);
    cy.get('[data-cy="app-slug-info-label"]')
      .should("be.visible")
      .invoke("text")
      .then((text) => {
        expect(text.trim()).to.eq(
          "URL-friendly 'slug' consists of lowercase letters, numbers, and hyphens"
        );
      });

    const newSlug = `${fake.companyName.toLowerCase()}-app`;
    cy.clearAndType(commonWidgetSelector.appNameSlugInput, newSlug);
    cy.get('[data-cy="app-slug-accepted-label"]').verifyVisibleElement(
      "have.text",
      "Slug accepted!"
    );

    cy.get(commonWidgetSelector.modalCloseButton).click();
    verifyURLs(Cypress.env("workspaceId"), newSlug, true);

    cy.visit("/my-workspace");
    cy.apiCreateApp(newSlug);
    cy.openApp("my-workspace");
    cy.apiPublishDraftVersion("v1");

    releaseApp();
    cy.get(commonWidgetSelector.shareAppButton).click();
    cy.clearAndType(commonWidgetSelector.appNameSlugInput, newSlug);
    cy.get(commonWidgetSelector.appSlugErrorLabel).verifyVisibleElement(
      "have.text",
      "This app slug is already taken."
    );
  });
});
