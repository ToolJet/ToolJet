import { fake } from "Fixtures/fake";
import { commonSelectors } from "Selectors/common";
import { dashboardSelector } from "Selectors/platform/dashboard";
import { cleanAllUsers } from "Support/utils/manageUsers";
import { commonText } from "Texts/common";
import { dashboardText } from "Texts/platform/dashboard";

const AI_CREDITS_BALANCE_API = "/api/ai/get-credits-balance";

const aiCreditsBalance = (aiFeaturesEnabled) => ({
  aiFeaturesEnabled,
  aiPlan: "credits",
  plan: { total: 1000, topup: 0, recurring: 1000 },
  remaining: { total: 1000, topup: 0, recurring: 1000 },
  expiry: { recurringExpiryDate: null },
});

const stubAiFeatures = (aiFeaturesEnabled) => {
  cy.intercept("GET", AI_CREDITS_BALANCE_API, {
    statusCode: 200,
    body: aiCreditsBalance(aiFeaturesEnabled),
  }).as("aiCreditsBalance");
};

const openHomePage = () => {
  cy.visit("/my-workspace");
  cy.get(commonSelectors.homePageIcon, { timeout: 20000 }).click();
};

describe("Home Page Dashboard Testcases", () => {
  let data = {};

  beforeEach(() => {
    data = {
      firstName: fake.firstName,
      email: fake.email.toLowerCase().replaceAll("[^A-Za-z]", ""),
    };
    cy.intercept("GET", "/api/library_apps").as("appLibrary");
    cy.apiLogin();
    cleanAllUsers();
  });

  it("Should verify the AI prompt hero on home page dashboard", () => {
    stubAiFeatures(true);
    openHomePage();
    cy.wait("@aiCreditsBalance");

    cy.get(commonSelectors.breadcrumbHeaderTitle("applications")).should(
      ($el) => {
        expect($el.contents().first().text().trim()).to.eq(
          commonText.breadcrumbHome,
        );
      },
    );
    cy.get(commonSelectors.breadcrumbPageTitle).verifyVisibleElement(
      "have.text",
      commonText.breadcrumbHome,
    );

    cy.get(dashboardSelector.aiIcon).should("be.visible");
    cy.get(dashboardSelector.homePagePromptHeader).verifyVisibleElement(
      "have.text",
      dashboardText.homePagePromptHeader,
    );

    // The animated placeholder only renders while the composer is empty.
    cy.get(dashboardSelector.promptInput).should("be.visible");
    cy.get(dashboardSelector.homePagePromptTextArea).should(
      "have.attr",
      "contenteditable",
      "true",
    );
    cy.get(dashboardSelector.homePagePromptTextArea).clearAndTypeOnCodeMirror(
      "Build a task manager app",
    );

    // With text in the composer the build control cross-fades in and the
    // placeholder slot is removed.
    cy.get(dashboardSelector.promptEnterButton)
      .should("have.attr", "class")
      .and("include", "tw-opacity-100");
    cy.get(dashboardSelector.buildAppButton)
      .should("be.visible")
      .and("not.be.disabled");
    cy.get(dashboardSelector.promptInput).should("not.exist");
  });

  it("Should verify the coding agent cards when AI features are enabled", () => {
    stubAiFeatures(true);
    openHomePage();
    cy.wait("@aiCreditsBalance");

    cy.get(dashboardSelector.editorConnectDivider).verifyVisibleElement(
      "have.text",
      dashboardText.editorConnectDividerText,
    );

    // The legacy "OR START WITH" shortcuts are replaced by the editor cards.
    cy.get(dashboardSelector.homePageDividerText).should("not.exist");

    dashboardText.editorConnectCards.forEach((card) => {
      cy.get(dashboardSelector.editorConnectCard(card.id))
        .should("be.visible")
        .within(() => {
          cy.contains(card.label).should("be.visible");
          cy.contains(card.description).should("be.visible");
        });
    });
  });

  it("Should verify the build from editor modal opens on the selected agent tab", () => {
    stubAiFeatures(true);
    openHomePage();
    cy.wait("@aiCreditsBalance");

    cy.get(dashboardSelector.editorConnectCard("codex")).click();

    cy.get(dashboardSelector.buildFromEditorModal).should("be.visible");
    cy.get(dashboardSelector.buildFromEditorModal).should(
      "contain.text",
      dashboardText.buildFromEditorModalTitle,
    );
    cy.get(dashboardSelector.buildFromEditorModal).should(
      "contain.text",
      dashboardText.buildFromEditorModalDescription,
    );

    // Opening from a card preselects that agent's tab.
    cy.get(dashboardSelector.byoaTab("codex")).should(
      "have.attr",
      "aria-selected",
      "true",
    );
    cy.get(dashboardSelector.byoaTab("claude-code")).should(
      "have.attr",
      "aria-selected",
      "false",
    );

    cy.get(dashboardSelector.byoaCreateTokenLink).verifyVisibleElement(
      "have.text",
      dashboardText.byoaCreateTokenLinkText,
    );
    cy.get(dashboardSelector.byoaCopyCommand(0)).should("be.visible");
    cy.get(dashboardSelector.byoaDocsLink)
      .should("be.visible")
      .and("contain.text", dashboardText.byoaDocsLinkText);

    // Switching tabs keeps the modal open on the newly selected agent.
    cy.get(dashboardSelector.byoaTab("claude-code")).click();
    cy.get(dashboardSelector.byoaTab("claude-code")).should(
      "have.attr",
      "aria-selected",
      "true",
    );

    cy.get(dashboardSelector.byoaNotNowButton).verifyVisibleElement(
      "have.text",
      dashboardText.byoaNotNowButtonText,
    );
    cy.get(dashboardSelector.byoaNotNowButton).click();
    cy.get(dashboardSelector.buildFromEditorModal).should("not.exist");
  });

  it("Should verify the get started shortcuts when AI features are disabled", () => {
    stubAiFeatures(false);
    openHomePage();
    cy.wait("@aiCreditsBalance");

    cy.get(dashboardSelector.homePageDividerText).verifyVisibleElement(
      "have.text",
      dashboardText.homePageDividerText,
    );
    cy.get(dashboardSelector.editorConnectDivider).should("not.exist");

    // data-cy is the lowercased widget key, so EXPLORE_TEMPLATES -> explore_templates.
    const cardTypes = {
      app: {
        key: "app",
        icon: "apps",
        title: dashboardText.appCardTitle,
        description: dashboardText.appCardDescription,
        url: "/my-workspace",
      },
      datasource: {
        key: "datasource",
        icon: "datasources",
        title: dashboardText.datasourceCardTitle,
        description: dashboardText.datasourceCardDescription,
        url: "/my-workspace/data-sources",
      },
      workflow: {
        key: "workflow",
        icon: "workflows",
        title: dashboardText.workflowCardTitle,
        description: dashboardText.workflowCardDescription,
        url: "/my-workspace/workflows",
      },
      template: {
        key: "explore_templates",
        icon: "corners",
        title: dashboardText.exploreTemplateCardTitle,
        description: dashboardText.exploreTemplateCardDescription,
        url: "fromtemplate=true",
      },
    };

    const env = Cypress.env("environment");
    const cardsToTest =
      env === "Cloud"
        ? [cardTypes.app, cardTypes.datasource, cardTypes.template]
        : [cardTypes.app, cardTypes.datasource, cardTypes.workflow];

    cardsToTest.forEach((cardType) => {
      cy.get(dashboardSelector.widgetCardName(cardType.key)).within(() => {
        cy.get(dashboardSelector.appIcon(cardType.icon)).should("be.visible");
        cy.get(dashboardSelector.widgetCardTitle).verifyVisibleElement(
          "have.text",
          cardType.title,
        );
        cy.get(dashboardSelector.widgetCardDescription).verifyVisibleElement(
          "have.text",
          cardType.description,
        );
      });
      cy.get(dashboardSelector.widgetCardName(cardType.key))
        .should("have.attr", "href")
        .and("include", cardType.url);
    });
  });

  it("Should verify Home page accessibility for the specific role", () => {
    cy.intercept("GET", "/api/license/access").as("getLicenseAccess");
    //Invite End-user
    cy.apiFullUserOnboarding(data.firstName, data.email);
    cy.apiLogout();

    cy.apiLogin(data.email);
    cy.visit("/my-workspace");
    cy.wait("@getLicenseAccess");

    cy.get(commonSelectors.homePageIcon).should("not.exist");
    cy.apiLogout();

    cy.apiLogin();
    cy.visit("/my-workspace");
    cy.wait("@getLicenseAccess");

    //Update role to Builder
    cy.apiUpdateUserRole(data.email, "builder");
    cy.apiLogout();

    cy.apiLogin(data.email);
    cy.visit("/my-workspace");
    cy.wait("@getLicenseAccess");

    cy.get(commonSelectors.homePageIcon, { timeout: 20000 }).should(
      "be.visible",
    );
  });
});
