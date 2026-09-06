// ┌─ AUTO-GENERATED from @tj annotations below — do not edit by hand ─┐
// whitelabel.js
//   openWhiteLabelingSettings        whiteLabel.open      → superAdmin
//   verifyWhiteLabelingUI            whiteLabel.verifyPage → superAdmin
//   fillWhiteLabelingForm            whiteLabel.fillForm  → superAdmin
//   saveWhiteLabelingChanges         whiteLabel.save      → superAdmin
//   verifyCustomLogo                 whiteLabel.verifyLogo → superAdmin
//   verifyPageTitleAndFavicon        whiteLabel.verifyTitleFavicon → superAdmin
//   verifyLogoOnLoginPage            whiteLabel.verifyLogoLogin → superAdmin
//   verifyLogoOnWorkspaceLoginPage   whiteLabel.verifyLogoWorkspaceLogin → superAdmin
//   verifyLogoOnDashboard            whiteLabel.verifyLogoDashboard → superAdmin
//   cleanEmailBody                   -                    → superAdmin
//   verifyWhiteLabelInEmail          whiteLabel.verifyInEmail → superAdmin
//   verifyInvitationEmail            whiteLabel.verifyInviteEmail → superAdmin
//   verifyWhiteLabelInputs           whiteLabel.verifyInputs → superAdmin
// └──────────────────────────────────────────────────────────────────┘
import { whiteLabelSelectors, commonSelectors } from "Selectors/common";
import { commonEeSelectors } from "Selectors/platform/eeCommon";
import { whitelabelText } from "Texts/common";
import { onboardingSelectors } from "Selectors/platform/onboarding";
import { openInstanceSettings } from "Support/utils/platform/eeCommon";
import { whitelabelTestData } from "Constants/constants/whitelabel";

/**
 * @tjType   whiteLabel.open
 * @tjBlock  superAdmin
 * @tjUsage  openWhiteLabelingSettings()
 * @tjDom    instance settings -> white labelling
 */
export const openWhiteLabelingSettings = () => {
  cy.intercept("PUT", "**/api/white-labelling").as("saveWhitelabel");
  openInstanceSettings();
  cy.get(whiteLabelSelectors.navWhiteLabellingListItem).click();
};

/**
 * @tjType   whiteLabel.verifyPage
 * @tjBlock  superAdmin
 * @tjUsage  verifyWhiteLabelingUI()
 * @tjDom    white-label form fields + buttons
 */
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

/**
 * @tjType   whiteLabel.fillForm
 * @tjBlock  superAdmin
 * @tjUsage  fillWhiteLabelingForm(...)
 * @tjDom    logo / favicon / page-title fields
 */
export const fillWhiteLabelingForm = (
  logo = whitelabelTestData.logo,
  pageTitle = whitelabelTestData.pageTitle,
  favicon = whitelabelTestData.favicon
) => {
  cy.clearAndType(whiteLabelSelectors.appLogoInput, logo);
  cy.clearAndType(whiteLabelSelectors.pageTitleInput, pageTitle);
  cy.clearAndType(whiteLabelSelectors.favIconInput, favicon);
};

/**
 * @tjType   whiteLabel.save
 * @tjBlock  superAdmin
 * @tjUsage  saveWhiteLabelingChanges()
 * @tjDom    save button + toast
 */
export const saveWhiteLabelingChanges = () => {
  cy.get(whiteLabelSelectors.saveButton).click();
  cy.wait("@saveWhitelabel");
};

/**
 * @tjType   whiteLabel.verifyLogo
 * @tjBlock  superAdmin
 * @tjUsage  verifyCustomLogo(...)
 * @tjDom    custom logo rendered
 */
export const verifyCustomLogo = (
  selector,
  logoIdentifier = whitelabelTestData.logoIdentifier
) => {
  cy.get(selector)
    .should("be.visible")
    .and("have.attr", "src")
    .and("include", logoIdentifier);
};

/**
 * @tjType   whiteLabel.verifyTitleFavicon
 * @tjBlock  superAdmin
 * @tjUsage  verifyPageTitleAndFavicon(...)
 * @tjDom    document title + favicon href
 */
export const verifyPageTitleAndFavicon = (
  pageTitle = whitelabelTestData.pageTitle,
  logoIdentifier = whitelabelTestData.logoIdentifier
) => {
  cy.title().should("contain", pageTitle);
  cy.get(whiteLabelSelectors.faviconLink)
    .should("have.attr", "href")
    .and("include", logoIdentifier);
};

/**
 * @tjType   whiteLabel.verifyLogoLogin
 * @tjBlock  superAdmin
 * @tjUsage  verifyLogoOnLoginPage()
 * @tjDom    login page logo
 */
export const verifyLogoOnLoginPage = () => {
  cy.apiLogout();
  cy.visit("/");
  cy.wait(2000);
  verifyCustomLogo(whiteLabelSelectors.tooljetHeaderImg);
};

/**
 * @tjType   whiteLabel.verifyLogoWorkspaceLogin
 * @tjBlock  superAdmin
 * @tjUsage  verifyLogoOnWorkspaceLoginPage('My workspace')
 * @tjDom    workspace login page logo
 */
export const verifyLogoOnWorkspaceLoginPage = (workspaceName) => {
  cy.visit(`/${workspaceName}`);
  verifyCustomLogo(whiteLabelSelectors.tooljetHeaderImg);
  verifyPageTitleAndFavicon();
};

/**
 * @tjType   whiteLabel.verifyLogoDashboard
 * @tjBlock  superAdmin
 * @tjUsage  verifyLogoOnDashboard()
 * @tjDom    dashboard header logo. [UNREFERENCED 2026-09-06]
 */
export const verifyLogoOnDashboard = () => {
  cy.get(whiteLabelSelectors.homePageLogoImg)
    .should("be.visible")
    .should("have.attr", "width", "26px")
    .should("have.attr", "height", "26px")
    .and("have.attr", "src")
    .and("include", whitelabelTestData.logoIdentifier);
  verifyPageTitleAndFavicon();
};

/**
 * @tjType   -
 * @tjBlock  superAdmin
 * @tjUsage  cleanEmailBody(mailBody)
 * @tjDom    none - strips markup from an email body
 */
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

/**
 * @tjType   whiteLabel.verifyInEmail
 * @tjBlock  superAdmin
 * @tjUsage  verifyWhiteLabelInEmail(...)
 * @tjDom    none - asserts branding in an email
 */
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

/**
 * @tjType   whiteLabel.verifyInviteEmail
 * @tjBlock  superAdmin
 * @tjUsage  verifyInvitationEmail(...)
 * @tjDom    none - asserts the invite email body
 */
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

/**
 * @tjType   whiteLabel.verifyInputs
 * @tjBlock  superAdmin
 * @tjUsage  verifyWhiteLabelInputs(...)
 * @tjDom    form input values. [UNREFERENCED 2026-09-06]
 */
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
