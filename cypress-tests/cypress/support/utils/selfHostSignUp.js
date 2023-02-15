import { commonSelectors } from "Selectors/common";
import { commonText } from "Texts/common";

export const selfHostCommonElements = () => {
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
  cy.get(commonSelectors.continueButton).should("be.disabled");
};

export const commonElementsWorkspaceSetup = () => {
  cy.get(commonSelectors.userAccountNameAvatar).should("be.visible");
  cy.get(commonSelectors.onboardingPorgressBubble).should("be.visible");
  cy.get(commonSelectors.backArrow).should("be.visible");
  cy.get(commonSelectors.backArrowText).verifyVisibleElement(
    "have.text",
    commonText.backArrowText
  );
  cy.get(commonSelectors.skipArrow).should("be.visible");
  cy.get(commonSelectors.skipArrowText).verifyVisibleElement(
    "have.text",
    commonText.skipArrowText
  );
};

export const verifyandModifyUserRole = () => {
  var random = function (obj) {
    var keys = Object.keys(obj);
    return obj[keys[(keys.length * Math.random()) << 0]];
  };

  const randomRole = random(commonText.userJobRole);

  for (const radio in commonText.userJobRole) {
    cy.get(
      commonSelectors.onboardingRadioButton(commonText.userJobRole[radio])
    ).should("be.visible");
  }
  for (const roles in commonText.userJobRole) {
    cy.get(
      commonSelectors.onboardingRole(commonText.userJobRole[roles])
    ).verifyVisibleElement("have.text", commonText.userJobRole[roles]);
  }

  cy.get(commonSelectors.onboardingRole(randomRole)).click();
  cy.get(commonSelectors.continueButton).click();
};

export const verifyandModifySizeOftheCompany = () => {
  var random = function (obj) {
    var keys = Object.keys(obj);
    return obj[keys[(keys.length * Math.random()) << 0]];
  };

  const randomSize = random(commonText.companySize);

  for (const radio in commonText.companySize) {
    cy.get(
      commonSelectors.onboardingRadioButton(commonText.companySize[radio])
    ).should("be.visible");
  }
  for (const size in commonText.companySize) {
    cy.get(
      commonSelectors.onboardingRole(commonText.companySize[size])
    ).verifyVisibleElement("have.text", commonText.companySize[size]);
  }

  cy.get(commonSelectors.onboardingRole(randomSize)).click();
  cy.get(commonSelectors.continueButton).click();
};
