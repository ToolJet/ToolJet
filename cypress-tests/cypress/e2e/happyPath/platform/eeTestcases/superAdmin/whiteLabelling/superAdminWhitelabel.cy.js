import {
  commonSelectors,
  whiteLabelSelectors,
  commonWidgetSelector,
} from "Selectors/common";
import { fake } from "Fixtures/fake";
import { onboardingSelectors } from "Selectors/onboarding";
import { fetchAndVisitInviteLink } from "Support/utils/manageUsers";
import { whitelabelTestData, smtpConfig } from "Constants/constants/whitelabel";
import {
  openWhiteLabelingSettings,
  verifyWhiteLabelingUI,
  fillWhiteLabelingForm,
  saveWhiteLabelingChanges,
  verifyCustomLogo,
  verifyPageTitleAndFavicon,
  verifyLogoOnLoginPage,
  verifyLogoOnWorkspaceLoginPage,
  verifyInvitationEmail,
} from "Support/utils/whitelabel";
import { enableInstanceSignup } from "Support/utils/manageSSO";

describe("Instance settings - White labelling", () => {
  const whiteLabelConfig = {
    white_label_text: "ToolJet",
    white_label_logo: "assets/images/tj-logo.svg",
    white_label_favicon: "assets/images/logo.svg", // URL or base64 string
  };

  beforeEach(() => {
    cy.defaultWorkspaceLogin();
    cy.apiConfigureSmtp(smtpConfig);
    enableInstanceSignup();
  });

  after(() => {
    cy.apiLogin();
    cy.apiUpdateWhiteLabeling(whiteLabelConfig);
    enableInstanceSignup(false);
  });

  it("should verify all white labelling UI elements", () => {
    openWhiteLabelingSettings();
    verifyWhiteLabelingUI();
  });
  it("should verify white label in user invitation email and on onboarding flow", () => {
    const name = fake.firstName;
    const email = fake.email.toLowerCase().replaceAll(/[^a-z0-9@.]/g, "");

    openWhiteLabelingSettings();
    fillWhiteLabelingForm();
    saveWhiteLabelingChanges();

    cy.apiUserInvite(name, email);

    verifyInvitationEmail(email, {
      expectedLogo: whitelabelTestData.logo,
      expectedText: whitelabelTestData.pageTitle,
    });
    fetchAndVisitInviteLink(email);

    verifyCustomLogo(
      whiteLabelSelectors.tooljetHeaderImg,
      whitelabelTestData.logoIdentifier
    );
    verifyPageTitleAndFavicon(
      whitelabelTestData.pageTitle,
      whitelabelTestData.logoIdentifier
    );

    cy.get(whiteLabelSelectors.passwordInput).type("password");
    cy.get(whiteLabelSelectors.signUpButton).click();

    cy.contains("Join My workspace").should("be.visible");
    verifyCustomLogo(
      whiteLabelSelectors.tooljetHeaderImg,
      whitelabelTestData.logoIdentifier
    );
    verifyPageTitleAndFavicon(
      whitelabelTestData.pageTitle,
      whitelabelTestData.logoIdentifier
    );
  });
  it("should update white labelling settings and verify across login/signup/password reset", () => {
    const testWorkspace = fake.firstName
      .toLowerCase()
      .replaceAll(/[^a-z]/g, "");

    openWhiteLabelingSettings();
    fillWhiteLabelingForm();
    saveWhiteLabelingChanges();
    verifyLogoOnLoginPage();
    verifyPageTitleAndFavicon();
    cy.get(whiteLabelSelectors.signupRedirectText).should(
      "contain.text",
      whitelabelTestData.pageTitle
    );

    cy.get(onboardingSelectors.createAnAccountLink).click();
    verifyCustomLogo(
      whiteLabelSelectors.tooljetHeaderImg,
      whitelabelTestData.logoIdentifier
    );
    verifyPageTitleAndFavicon(
      whitelabelTestData.pageTitle,
      whitelabelTestData.logoIdentifier
    );

    cy.get(onboardingSelectors.termsOfServiceLink).should("not.exist");
    cy.get(onboardingSelectors.privacyPolicyLink).should("not.exist");

    const signupEmail = fake.email.toLowerCase().replaceAll(/[^a-z0-9@.]/g, "");
    const signupName = fake.firstName;
    cy.waitForElement(onboardingSelectors.signupNameLabel);
    cy.clearAndType(onboardingSelectors.signupNameLabel, signupName);
    cy.clearAndType(onboardingSelectors.signupEmailInput, signupEmail);
    cy.clearAndType(whiteLabelSelectors.passwordInput, "password");
    cy.get(whiteLabelSelectors.signUpButton).click();

    verifyCustomLogo(
      whiteLabelSelectors.tooljetHeaderImg,
      whitelabelTestData.logoIdentifier
    );
    verifyPageTitleAndFavicon(
      whitelabelTestData.pageTitle,
      whitelabelTestData.logoIdentifier
    );

    cy.visit("/");
    cy.get(commonSelectors.forgotPasswordLink).click();

    verifyCustomLogo(
      whiteLabelSelectors.tooljetHeaderImg,
      whitelabelTestData.logoIdentifier
    );
    verifyPageTitleAndFavicon(
      whitelabelTestData.pageTitle,
      whitelabelTestData.logoIdentifier
    );
    cy.get('[data-cy="signup-redirect-text"]').should(
      "contain.text",
      "Random Title"
    );

    cy.clearAndType(onboardingSelectors.forgotEmailInput, "dev@tooljet.io");
    cy.get(commonSelectors.resetPasswordLinkButton).click();

    cy.contains("Please check your email for the password reset link").should(
      "be.visible"
    );
    verifyCustomLogo(
      whiteLabelSelectors.tooljetHeaderImg,
      whitelabelTestData.logoIdentifier
    );
    verifyPageTitleAndFavicon(
      whitelabelTestData.pageTitle,
      whitelabelTestData.logoIdentifier
    );

    verifyLogoOnWorkspaceLoginPage("my-workspace");

    cy.visit("/");
    cy.get(onboardingSelectors.createAnAccountLink).click();
    verifyCustomLogo(
      whiteLabelSelectors.tooljetHeaderImg,
      whitelabelTestData.logoIdentifier
    );
    verifyPageTitleAndFavicon(
      whitelabelTestData.pageTitle,
      whitelabelTestData.logoIdentifier
    );

    cy.get(onboardingSelectors.termsOfServiceLink).should("not.exist");
    cy.get(onboardingSelectors.privacyPolicyLink).should("not.exist");

    const workspaceSignupEmail = fake.email
      .toLowerCase()
      .replaceAll(/[^a-z0-9@.]/g, "");
    const workspaceSignupName = fake.firstName;
    cy.clearAndType(onboardingSelectors.signupNameLabel, workspaceSignupName);
    cy.clearAndType(onboardingSelectors.signupEmailInput, workspaceSignupEmail);
    cy.clearAndType(whiteLabelSelectors.passwordInput, "password");
    cy.get(whiteLabelSelectors.signUpButton).click();

    verifyCustomLogo(
      whiteLabelSelectors.tooljetHeaderImg,
      whitelabelTestData.logoIdentifier
    );
    verifyPageTitleAndFavicon(
      whitelabelTestData.pageTitle,
      whitelabelTestData.logoIdentifier
    );

    cy.visit(`/my-workspace`);
    cy.get(commonSelectors.forgotPasswordLink).click();

    verifyCustomLogo(
      whiteLabelSelectors.tooljetHeaderImg,
      whitelabelTestData.logoIdentifier
    );
    verifyPageTitleAndFavicon(
      whitelabelTestData.pageTitle,
      whitelabelTestData.logoIdentifier
    );

    cy.clearAndType(onboardingSelectors.forgotEmailInput, "dev@tooljet.io");
    cy.get(commonSelectors.resetPasswordLinkButton).click();

    cy.contains("Please check your email for the password reset link").should(
      "be.visible"
    );
    verifyCustomLogo(
      whiteLabelSelectors.tooljetHeaderImg,
      whitelabelTestData.logoIdentifier
    );
    verifyPageTitleAndFavicon(
      whitelabelTestData.pageTitle,
      whitelabelTestData.logoIdentifier
    );

    cy.visit(`/my-workspace`);
    cy.get(onboardingSelectors.loginEmailInput, { timeout: 50000 }).should(
      "be.visible"
    );
    cy.clearAndType(onboardingSelectors.loginEmailInput, "dev@tooljet.io");
    cy.clearAndType(onboardingSelectors.loginPasswordInput, "password");
    cy.get(onboardingSelectors.signInButton).click();
  });

  it("should verify white label persists across apps", () => {
    const appName = `WhiteLabel${fake.firstName}${fake.firstName}`;
    const appSlug = appName.toLowerCase().replaceAll(/[^a-z0-9]/g, "");

    cy.apiCreateApp(appName).then((app) => {
      cy.openApp().then(() => {
        cy.apiPromoteAppVersion().then(() => {
          cy.apiPromoteAppVersion(Cypress.env("stagingEnvId"));

          verifyPageTitleAndFavicon();

          cy.openInCurrentTab(commonWidgetSelector.previewButton);
          verifyCustomLogo(
            commonSelectors.pageLogo,
            whitelabelTestData.logoIdentifier
          );
          verifyPageTitleAndFavicon();
          cy.notVisible(whiteLabelSelectors.poweredByBanner);

          cy.apiReleaseApp(appName).then(() => {
            cy.apiAddAppSlug(appName, appSlug);
            cy.visitSlug({
              actualUrl: `${Cypress.config("baseUrl")}/applications/${appSlug}`,
            });
            verifyCustomLogo(
              commonSelectors.pageLogo,
              whitelabelTestData.logoIdentifier
            );
            cy.notVisible(whiteLabelSelectors.poweredByBanner);
            cy.apiMakeAppPublic();
            cy.apiLogout();
            cy.visitSlug({
              actualUrl: `${Cypress.config("baseUrl")}/applications/${appSlug}`,
            });
            verifyCustomLogo(
              commonSelectors.pageLogo,
              whitelabelTestData.logoIdentifier
            );
            cy.notVisible(whiteLabelSelectors.poweredByBanner);
          });
        });
      });
    });
  });
});
