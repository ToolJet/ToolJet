import { commonSelectors } from "Selectors/common";
import { commonText } from "Texts/common";
import {
  verifyandModifyUserRole,
  verifyandModifySizeOftheCompany,
} from "Support/utils/selfHostSignUp";

export const verifyConfirmEmailPage = (email) => {
  cy.get(commonSelectors.pageLogo).should("be.visible");
  cy.get(commonSelectors.emailImage).should("be.visible");
  cy.get(commonSelectors.onboardingPageHeader).verifyVisibleElement(
    "have.text",
    commonText.emailPageHeader
  );

  cy.get(commonSelectors.onboardingPageDescription).verifyVisibleElement(
    "have.text",
    commonText.emailPageDescription(email)
  );

  cy.get(commonSelectors.spamMessage).verifyVisibleElement(
    "have.text",
    commonText.spamMessage
  );
  cy.get(commonSelectors.onboardingSeperator).should("be.visible");
  cy.get(commonSelectors.onboardingSeperatorText).verifyVisibleElement(
    "have.text",
    commonText.onboardingSeperatorText
  );
  cy.get(commonSelectors.resendEmailButton).should("be.visible");
  cy.get(commonSelectors.editEmailButton).verifyVisibleElement(
    "have.text",
    commonText.editEmailButton
  );
};

export const verifyConfirmPageElements = () => {
  cy.get(commonSelectors.pageLogo).should("be.visible");
  cy.get(commonSelectors.emailImage).should("be.visible");
  cy.get(commonSelectors.onboardingPageHeader).verifyVisibleElement(
    "have.text",
    commonText.emailVerifiedText
  );

  cy.get(commonSelectors.onboardingPageDescription).verifyVisibleElement(
    "have.text",
    commonText.continueToSetUp
  );
  cy.get(commonSelectors.setUpToolJetButton).verifyVisibleElement(
    "have.text",
    commonText.setUpToolJetButton
  );
};

export const verifyOnboardingQuestions = (fullName, workspaceName) => {
  cy.get(commonSelectors.pageLogo).should("be.visible");
  cy.get(commonSelectors.userAccountNameAvatar).should("be.visible");
  cy.get(commonSelectors.createAccountCheckMark).should("be.visible");
  cy.get(commonSelectors.createAccountCheckPoint).verifyVisibleElement(
    "have.text",
    commonText.createAccountCheckPoint
  );
  cy.get(commonSelectors.verifyEmailCheckMark).should("be.visible");
  cy.get(commonSelectors.verifyEmailCheckPoint).verifyVisibleElement(
    "have.text",
    commonText.verifyEmailCheckPoint
  );
  cy.get(commonSelectors.setUpworkspaceCheckPoint).verifyVisibleElement(
    "have.text",
    commonText.setUpworkspaceCheckPoint
  );

  cy.get(commonSelectors.onboardingPorgressBubble).should("be.visible");
  cy.get(commonSelectors.onboardingPageHeader).verifyVisibleElement(
    "have.text",
    commonText.companyPageHeader(fullName)
  );
  cy.get(commonSelectors.onboardingPageSubHeader).verifyVisibleElement(
    "have.text",
    commonText.onboardingPageSubHeader
  );
  cy.get(commonSelectors.companyNameInputField).should("be.visible");
  cy.get(commonSelectors.continueButton).verifyVisibleElement(
    "have.text",
    commonText.continueButton
  );
  cy.get(commonSelectors.continueButton).should("be.disabled");
  cy.clearAndType(commonSelectors.companyNameInputField, workspaceName);
  cy.get(commonSelectors.continueButton).should("be.enabled").click();

  cy.get(commonSelectors.backArrow).should("be.visible");
  cy.get(commonSelectors.backArrowText).verifyVisibleElement(
    "have.text",
    commonText.backArrowText
  );
  cy.get(commonSelectors.onboardingPageHeader).verifyVisibleElement(
    "have.text",
    commonText.userRolePageHeader
  );
  verifyandModifyUserRole();

  cy.get(commonSelectors.backArrow).should("be.visible");
  cy.get(commonSelectors.onboardingPageHeader).verifyVisibleElement(
    "have.text",
    commonText.sizeOftheCompanyHeader
  );
  verifyandModifySizeOftheCompany();
};

export const verifyInvalidInvitationLink = () => {
  cy.get(commonSelectors.pageLogo).should("be.visible");
  cy.get(commonSelectors.emailImage).should("be.visible");

  cy.get(commonSelectors.onboardingPageHeader).verifyVisibleElement(
    "have.text",
    commonText.inalidInvitationLinkHeader
  );
  cy.get(commonSelectors.onboardingPageDescription).verifyVisibleElement(
    "have.text",
    commonText.inalidInvitationLinkDescription
  );

  cy.get(commonSelectors.backtoSignUpButton).verifyVisibleElement(
    "have.text",
    commonText.backtoSignUpButton
  );
};
