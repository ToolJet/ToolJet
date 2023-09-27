import { commonSelectors } from "Selectors/common";
import { commonText } from "Texts/common";
import * as signup from "Support/utils/selfHostSignUp";
import { logout } from "Support/utils/common";

describe("Self host onboarding", () => {
    beforeEach(() => {
        cy.visit('/setup');
    });

    it("verify elements on self host onboarding page", () => {
        cy.get(commonSelectors.selfHostSetUpBanner).should("be.visible");
        cy.get(commonSelectors.selfHostSetUpSubBanner).should("be.visible");
        cy.get(commonSelectors.selfHostSetUpCard).should("be.visible");
        cy.get(commonSelectors.selfHostSetUpCardImage).should("be.visible");
        cy.get(commonSelectors.selfHostSetUpCardHeader).verifyVisibleElement(
            "have.text",
            commonText.selfHostSetUpCardHeader
        );
        cy.get(commonSelectors.selfHostSetUpCardSubHeader).verifyVisibleElement(
            "have.text",
            commonText.selfHostSetUpCardSubHeader
        );
        cy.get(commonSelectors.setUpToolJetButton)
            .verifyVisibleElement("have.text", commonText.setUpToolJetButton)
            .click();

        signup.selfHostCommonElements();
        cy.get(commonSelectors.onboardingPageHeader).verifyVisibleElement(
            "have.text",
            commonText.setUpAdminHeader
        );

        cy.get(commonSelectors.userNameInputLabel).verifyVisibleElement(
            "have.text",
            commonText.userNameInputLabel
        );
        cy.get(commonSelectors.nameInputField).should("be.visible");
        cy.get(commonSelectors.emailInputLabel).verifyVisibleElement(
            "have.text",
            commonText.emailInputLabel
        );
        cy.get(commonSelectors.emailInputField).should("be.visible");
        cy.get(commonSelectors.passwordLabel).verifyVisibleElement(
            "have.text",
            commonText.passwordLabel
        );
        cy.get(commonSelectors.passwordInputField).should("be.visible");

        cy.get(commonSelectors.passwordHelperText).verifyVisibleElement(
            "have.text",
            commonText.passwordHelperText
        );

        cy.get(commonSelectors.signUpTermsHelperText).should(($el) => {
            expect($el.contents().first().text().trim()).to.eq(
                commonText.selfHostSignUpTermsHelperText
            );
        });
        cy.get(commonSelectors.termsOfServiceLink)
            .verifyVisibleElement("have.text", commonText.termsOfServiceLink)
            .and("have.attr", "href")
            .and("equal", "https://www.tooljet.com/terms");
        cy.get(commonSelectors.privacyPolicyLink)
            .verifyVisibleElement("have.text", commonText.privacyPolicyLink)
            .and("have.attr", "href")
            .and("equal", "https://www.tooljet.com/privacy");

        cy.clearAndType(commonSelectors.nameInputField, "The Developer");
        cy.clearAndType(commonSelectors.emailInputField, "dev@tooljet.io");
        cy.clearAndType(commonSelectors.passwordInputField, "password");
        cy.get(commonSelectors.continueButton).click();

        signup.selfHostCommonElements();
        cy.get(commonSelectors.userAccountNameAvatar).should("be.visible");
        cy.get(commonSelectors.onboardingPageHeader).verifyVisibleElement(
            "have.text",
            "Set up your workspace"
        );
        cy.get(commonSelectors.workspaceNameInputLabel).verifyVisibleElement(
            "have.text",
            commonText.workspaceNameInputLabel
        );
        cy.get(commonSelectors.workspaceNameInputField).should("be.visible");
        cy.clearAndType(commonSelectors.workspaceNameInputField, "My workspace");
        cy.get(commonSelectors.continueButton).click();

        signup.selfHostCommonElements();
        signup.commonElementsWorkspaceSetup();
        cy.get(commonSelectors.onboardingPageHeader).verifyVisibleElement(
            "have.text",
            commonText.companyPageHeader("The Developer")
        );
        cy.get(commonSelectors.companyNameInputField).should("be.visible");
        cy.clearAndType(commonSelectors.companyNameInputField, "ToolJet");
        cy.get(commonSelectors.continueButton).click();

        signup.selfHostCommonElements();
        signup.commonElementsWorkspaceSetup();
        cy.get(commonSelectors.onboardingPageHeader).verifyVisibleElement(
            "have.text",
            commonText.userRolePageHeader
        );
        signup.verifyandModifyUserRole();

        signup.selfHostCommonElements();
        signup.commonElementsWorkspaceSetup();
        cy.get(commonSelectors.onboardingPageHeader).verifyVisibleElement(
            "have.text",
            commonText.sizeOftheCompanyHeader
        );

        signup.verifyandModifySizeOftheCompany();

        cy.get(commonSelectors.pageLogo).should("be.visible");
        cy.get(commonSelectors.setUpadminCheckPoint).verifyVisibleElement(
            "have.text",
            commonText.setUpadminCheckPoint
        );
        cy.get(commonSelectors.setUpworkspaceCheckPoint).verifyVisibleElement(
            "have.text",
            commonText.setUpworkspaceCheckPoint
        );
        cy.get(commonSelectors.companyProfileCheckPoint).verifyVisibleElement(
            "have.text",
            commonText.companyProfileCheckPoint
        );
        cy.get(commonSelectors.onboardingPageSubHeader).verifyVisibleElement(
            "have.text",
            commonText.onboardingPageSubHeader
        );
        cy.get(commonSelectors.continueButton).verifyVisibleElement(
            "have.text",
            commonText.continueButton
        );

        signup.commonElementsWorkspaceSetup();
        cy.get(commonSelectors.onboardingPageHeader).verifyVisibleElement(
            "have.text",
            "Enter your phone number"
        );

        cy.get(".form-control").should("be.visible");
        cy.get(".tj-onboarding-phone-input-wrapper")
            .find("input")
            .type("919876543210");
        cy.get(commonSelectors.continueButton).click();

        // signup.commonElementsWorkspaceSetup();
        cy.get('.tj-header-h1').verifyVisibleElement("have.text", "Start your 14-day Free Trial");
        cy.get('.start-trial > .tj-text-md').verifyVisibleElement("have.text", "Build internal tools faster than ever with our advanced features.");
        cy.get(commonSelectors.continueButton).verifyVisibleElement("have.text", "Start your free trial")
        cy.get('.tj-base-btn').verifyVisibleElement("have.text", "Skip");

        cy.get('.header > :nth-child(1)').verifyVisibleElement("have.text", "Features");
        cy.get('.header > :nth-child(2)').verifyVisibleElement("have.text", "Free");
        cy.get('.header > :nth-child(3)').verifyVisibleElement("have.text", "Paid");
        cy.get(':nth-child(1) > .feature-title').verifyVisibleElement("have.text", "Unlimited applications");
        cy.get(':nth-child(2) > .feature-title').verifyVisibleElement("have.text", "Unlimited users");
        cy.get(':nth-child(3) > .feature-title').verifyVisibleElement("have.text", "Custom react components");
        cy.get(':nth-child(4) > .feature-title').verifyVisibleElement("have.text", "Google & GitHub sign-in");
        cy.get(':nth-child(5) > .feature-title').verifyVisibleElement("have.text", "Okta, AzureAD & OpenID Connect");
        cy.get(':nth-child(6) > .feature-title').verifyVisibleElement("have.text", "White labelling");
        cy.get(':nth-child(7) > .feature-title').verifyVisibleElement("have.text", "Custom user groups & roles");
        cy.get(':nth-child(8) > .feature-title').verifyVisibleElement("have.text", "Unlimited ToolJet tables and rows");
        cy.get(':nth-child(9) > .feature-title').verifyVisibleElement("have.text", "Multiplayer editing");
        cy.get(':nth-child(10) > .feature-title').verifyVisibleElement("have.text", "Multi-environments");
        cy.get(':nth-child(11) > .feature-title').verifyVisibleElement("have.text", "GitSync (coming soon)");
        cy.get(':nth-child(12) > .feature-title').verifyVisibleElement("have.text", "Audit logs");
        cy.get(':nth-child(13) > .feature-title').verifyVisibleElement("have.text", "Air-gapped deployment");
        cy.get(':nth-child(14) > .feature-title').verifyVisibleElement("have.text", "Priority support via email, phone & private channel");

        cy.get(commonSelectors.continueButton).click()
        cy.get("body").then(($title) => {
            if (!$title.text().includes("Start your 14-day Free Trial")) {
                cy.get(commonSelectors.workspaceName).verifyVisibleElement(
                    "have.text",
                    "My workspace"
                );

                logout();
                cy.appUILogin();

                cy.get(commonSelectors.workspaceName).verifyVisibleElement(
                    "have.text",
                    "My workspace"
                );
            }
        });
    });
});
