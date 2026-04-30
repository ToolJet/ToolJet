import { fake } from "Fixtures/fake";
import { commonSelectors } from "Selectors/common";
import { aiSelectors } from "Selectors/platform/ai";
import * as common from "Support/utils/common";
import { switchTabs } from "Support/utils/license";
import {
  verifyAiChatWorksWithCredits,
  verifyCopilotInQueryPanel,
} from "Support/utils/platform/ai";
import { licenseText } from "Texts/license";
import { aiText } from "Texts/platform/ai";

describe("AI Credits Plan - Happy Path", () => {
  const data = {};

  beforeEach(() => {
    data.appName = `${fake.companyName}-AI-Credits-Test`;
    cy.apiLogin();
    cy.apiUpdateLicense("ai-credit");
    cy.visit("/my-workspace");
    cy.get(commonSelectors.homePageLogo, { timeout: 20000 }).should(
      "be.visible"
    );
  });

  it("Should show LLM Key menu item as disabled with upgrade tooltip", () => {
    common.navigateToSettingPage();
    cy.get(aiSelectors.llmKeyListItem).should("be.visible");
    cy.get(aiSelectors.llmKeyListItem)
      .parent()
      .trigger("mouseover", { force: true });
    cy.get(".tooltip", { timeout: 5000 })
      .should("be.visible")
      .and("contain.text", aiText.upgradeTooltip);
  });

  it("Should display AI credit limit section on license page", () => {
    common.navigateToSettingPage();
    cy.contains("License").click();
    switchTabs(licenseText.limitsTabTitle);
    cy.get(aiSelectors.aiCreditsSubTab).should("be.visible").click();
    cy.get(aiSelectors.noOfAiCreditsLabel).should("be.visible");
  });

  it("Should allow AI chat interaction with credit-based AI", () => {
    verifyAiChatWorksWithCredits(data.appName);
  });

  it("Should allow using AI copilot in query panel", () => {
    verifyCopilotInQueryPanel(data.appName);
  });

  it("Should allow using Fix With AI in component styles", () => {
    cy.apiCreateApp(data.appName);
    cy.openApp(data.appName);
    cy.wait(3000);
    cy.dragAndDropWidget("Button", 200, 200);
    cy.get('[data-cy="button1-label"]').click();
    cy.wait(500);
    cy.get(':nth-child(2) > .nav-link').click();
    cy.get('[data-cy="background-fx-button"]').click();
    cy.get('[data-cy="background-input-field"] > .check-here > .cm-theme > .cm-editor > .cm-scroller > .cm-content').clear();
    cy.get('[data-cy="background-input-field"] > .check-here > .cm-theme > .cm-editor > .cm-scroller > .cm-content').clearAndTypeOnCodeMirror('{{}}');
     cy.get('[data-cy="alert-info-text"] button').contains('Auto-fix').click();
    cy.get('.tw-text-text-default.tw-mb-2').should("contain.text", "backgroundColor");
    cy.apiDeleteApp();
  });
});

