import { whiteLabelSelectors, commonSelectors } from "Selectors/common";
import { commonEeSelectors } from "Selectors/eeCommon";
import { whitelabelText } from "Texts/common";
import { onboardingSelectors } from "Selectors/onboarding";
import { openInstanceSettings } from "Support/utils/platform/eeCommon";
import { whitelabelTestData } from "Constants/constants/whitelabel";

export const openWhiteLabelingSettings = () => {
  cy.intercept("PUT", "**/api/white-labelling").as("saveWhitelabel");
  openInstanceSettings();
  cy.get(whiteLabelSelectors.navWhiteLabellingListItem).click();
};

export const verifyWhiteLabelingUI = () => {
  cy.get(commonEeSelectors.pageTitle).verifyVisibleElement(
    "have.text",
    whitelabelText.settingsPageTitle
  );
  cy.get(whiteLabelSelectors.breadcrumbPageTitle).verifyVisibleElement(
    "have.text",
    whitelabelText.breadcrumbTitle
  );

  const fields = [
    {
      label: whitelabelText.appLogoLabel,
      input: whiteLabelSelectors.appLogoInput,
      help: whiteLabelSelectors.appLogoHelpText,
      helpText: whitelabelText.appLogoHelp,
    },
    {
      label: whitelabelText.pageTitleLabel,
      help: whiteLabelSelectors.appLogoHelpText,
      helpText: whitelabelText.appLogoHelp,
    },
    {
      label: whitelabelText.faviconLabel,
      help: whiteLabelSelectors.favIconHelpText,
      helpText: whitelabelText.faviconHelp,
    },
  ];

  fields.forEach((field) => {
    cy.contains("label", field.label).should("be.visible");
    if (field.input) cy.get(field.input).should("be.visible");
    cy.get(field.help).should("be.visible").and("contain", field.helpText);
  });

  cy.get(whiteLabelSelectors.cancelButton).verifyVisibleElement(
    "have.text",
    whitelabelText.cancelButton
  );
  cy.get(whiteLabelSelectors.saveButton).verifyVisibleElement(
    "have.text",
    whitelabelText.saveButton
  );
};

export const fillWhiteLabelingForm = (
  logo = whitelabelTestData.logo,
  pageTitle = whitelabelTestData.pageTitle,
  favicon = whitelabelTestData.favicon
) => {
  cy.clearAndType(whiteLabelSelectors.appLogoInput, logo);
  cy.clearAndType(whiteLabelSelectors.pageTitleInput, pageTitle);
  cy.clearAndType(whiteLabelSelectors.favIconInput, favicon);
};

export const saveWhiteLabelingChanges = () => {
  cy.get(whiteLabelSelectors.saveButton).click();
  cy.wait("@saveWhitelabel");
};

export const verifyCustomLogo = (
  selector,
  logoIdentifier = whitelabelTestData.logoIdentifier
) => {
  cy.get(selector)
    .should("be.visible")
    .and("have.attr", "src")
    .and("include", logoIdentifier);
};

export const verifyPageTitleAndFavicon = (
  pageTitle = whitelabelTestData.pageTitle,
  logoIdentifier = whitelabelTestData.logoIdentifier
) => {
  cy.title().should("contain", pageTitle);
  cy.get(whiteLabelSelectors.faviconLink)
    .should("have.attr", "href")
    .and("include", logoIdentifier);
};

export const verifyLogoOnLoginPage = () => {
  cy.apiLogout();
  cy.visit("/");
  verifyCustomLogo(whiteLabelSelectors.tooljetHeaderImg);
};

export const verifyLogoOnWorkspaceLoginPage = (workspaceName) => {
  cy.visit(`/${workspaceName}`);
  verifyCustomLogo(whiteLabelSelectors.tooljetHeaderImg);
  verifyPageTitleAndFavicon();
};

export const verifyLogoOnDashboard = () => {
  cy.get(whiteLabelSelectors.homePageLogoImg)
    .should("be.visible")
    .should("have.attr", "width", "26px")
    .should("have.attr", "height", "26px")
    .and("have.attr", "src")
    .and("include", whitelabelTestData.logoIdentifier);
  verifyPageTitleAndFavicon();
};

export const cleanEmailBody = (mailBody) => {
  return mailBody
    .replace(/=\r?\n/g, "")
    .replace(/=3D/g, "=")
    .replace(/&quot;/g, '"')
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&amp;/g, "&")
    .replace(/\s+/g, " ")
    .trim();
};

export const verifyWhiteLabelInEmail = (
  cleanedBody,
  headers,
  expectedLogo,
  expectedText
) => {
  if (expectedLogo) {
    const logoBaseUrl = expectedLogo.split("?")[0];
    expect(cleanedBody).to.include(logoBaseUrl);
  }

  if (expectedText) {
    const normalizedExpectedText = expectedText.replace(/\s+/g, " ").trim();
    const headerString = JSON.stringify(headers).replace(/\s+/g, " ");
    const textParts = normalizedExpectedText
      .split(" ")
      .filter((p) => p.length > 2);

    const hasTextInBody = cleanedBody.includes(normalizedExpectedText);
    const hasTextInHeaders = headerString.includes(normalizedExpectedText);
    const hasAllParts = textParts.every(
      (p) => cleanedBody.includes(p) || headerString.includes(p)
    );

    expect(hasTextInBody || hasTextInHeaders || hasAllParts).to.be.true;
  }
};

export const verifyInvitationEmail = (
  email,
  whiteLabelConfig = {},
  maxRetries = 10,
  retryDelay = 1000
) => {
  if (!Cypress.env("mailHogUrl")) {
    Cypress.env("mailHogUrl", "http://localhost:8025/");
  }
  if (Cypress.env("mailHogAuth") === undefined) {
    Cypress.env("mailHogAuth", "");
  }

  const checkForEmail = (attempt = 1) => {
    cy.mhGetMailsByRecipient(email).then((mails) => {
      if (mails.length > 0) {
        const lastMail = mails[mails.length - 1];
        const mailContent = lastMail?.Content || {};
        const mailBody = mailContent.Body || mailContent.Html || "";
        const headers = lastMail?.Content?.Headers || {};

        const cleanedBody = cleanEmailBody(mailBody);

        if (whiteLabelConfig.expectedLogo || whiteLabelConfig.expectedText) {
          verifyWhiteLabelInEmail(
            cleanedBody,
            headers,
            whiteLabelConfig.expectedLogo,
            whiteLabelConfig.expectedText
          );
        }

        const hrefMatch = cleanedBody.match(
          /href=["']?(http[^"'\s>]*invitation[^"'\s>]*)/i
        );
        const urlMatch = cleanedBody.match(
          /https?:\/\/[^\s"'<>]*invitation[s]?[^\s"'<>]*/i
        );
        const inviteUrl = hrefMatch ? hrefMatch[1] : urlMatch ? urlMatch[0] : "";

        expect(inviteUrl).to.not.be.empty;
      } else if (attempt < maxRetries) {
        cy.wait(retryDelay);
        checkForEmail(attempt + 1);
      } else {
        throw new Error(
          `No invitation email received for ${email} after ${maxRetries} attempts`
        );
      }
    });
  };

  checkForEmail();
};

export const verifyWhiteLabelInputs = (
  logo = whitelabelTestData.logo,
  pageTitle = whitelabelTestData.pageTitle,
  favicon = whitelabelTestData.favicon
) => {
  const decodeValue = (val) => val.replace(/&amp;/g, "&");

  cy.get(whiteLabelSelectors.appLogoInput)
    .invoke("val")
    .then((val) => expect(decodeValue(val)).to.eq(logo));

  cy.get(whiteLabelSelectors.pageTitleInput).should("have.value", pageTitle);

  cy.get(whiteLabelSelectors.favIconInput)
    .invoke("val")
    .then((val) => expect(decodeValue(val)).to.eq(favicon));
};
