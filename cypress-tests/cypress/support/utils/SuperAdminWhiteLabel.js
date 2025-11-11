import { commonEeSelectors } from "Selectors/eeCommon";
import { fake } from "Fixtures/fake";

import {
  whiteLabelSelectors,
} from "Selectors/superAdminSelectors";

import {
  whitelabelText,
} from "Texts/superAdminText";

import {
  openInstanceSettings,
} from "Support/utils/platform/eeCommon";

const WHITE_LABEL_LOGO = "https://images.pexels.com/photos/1796715/pexels-photo-1796715.jpeg?cs=srgb&dl=pexels-chaitaastic-1796715.jpg&fm=jpg";
const WHITE_LABEL_FAVICON = WHITE_LABEL_LOGO;
const WHITE_LABEL_TEXT = "Paris UK 321 321 321";
const LOGO_IDENTIFIER = "pexels-photo-1796715";

export const userName = () => fake.firstName.toLowerCase().replace(/[^a-z]/g, "");
export const userEmail = () => fake.email.toLowerCase().replace(/[^a-z0-9@.]/g, "");

export const openWhiteLabelingSettings = () => {
  openInstanceSettings();
  cy.get(whiteLabelSelectors.navWhiteLabellingListItem).click();
};


export const verifyWhiteLabelingUI = () => {
  cy.get(commonEeSelectors.pageTitle).verifyVisibleElement("have.text", whitelabelText.settingsPageTitle);
  cy.get(whiteLabelSelectors.breadcrumbPageTitle).verifyVisibleElement("have.text", whitelabelText.breadcrumbTitle);

  const fields = [
    { label: whitelabelText.appLogoLabel, input: whiteLabelSelectors.appLogoInput, help: whiteLabelSelectors.appLogoHelpTextSelector, helpText: whitelabelText.appLogoHelp },
    { label: whitelabelText.pageTitleLabel, help: whiteLabelSelectors.appLogoHelpTextSelector, helpText: whitelabelText.appLogoHelp },
    { label: whitelabelText.faviconLabel, help: whiteLabelSelectors.favIconHelpText, helpText: whitelabelText.faviconHelp }
  ];

  fields.forEach(field => {
    cy.contains("label", field.label).should("be.visible");
    if (field.input) cy.get(field.input).should("be.visible");
    cy.get(field.help).should("be.visible").and("contain", field.helpText);
  });
  cy.get(whiteLabelSelectors.cancelButton).verifyVisibleElement("have.text", whitelabelText.cancelButton);
  cy.get(whiteLabelSelectors.saveButton).verifyVisibleElement("have.text", whitelabelText.saveButton);
};

export const verifyInputPlaceholder = (selector, expected) => {
    cy.get(selector).should("be.visible").and("have.attr", "placeholder")
    .and(($p) => expect(($p || "").toString().toLowerCase()).to.contain(expected));
};

export const verifyLabel = (text) => cy.contains("label", text).should("be.visible");

export const fillWhiteLabelingForm = () => {
  cy.get(whiteLabelSelectors.appLogoInput).clear().type(WHITE_LABEL_LOGO);
  cy.get(whiteLabelSelectors.pageTitleInput).clear().type(WHITE_LABEL_TEXT);
  cy.get(whiteLabelSelectors.favIconInput).clear().type(WHITE_LABEL_FAVICON);
};

export const saveWhiteLabelingChanges = () => {
  cy.get(whiteLabelSelectors.saveButton).click();
};

export const verifyWhiteLabelInputs = () => {
    const decodeValue = (val) => val.replace(/&amp;/g, '&'); 
    cy.get(whiteLabelSelectors.appLogoInput).invoke('val').then((val) => expect(decodeValue(val)).to.eq(WHITE_LABEL_LOGO));
    cy.get(whiteLabelSelectors.pageTitleInput).should("have.value", WHITE_LABEL_TEXT); 
    cy.get(whiteLabelSelectors.favIconInput).invoke('val').then((val) => expect(decodeValue(val)).to.eq(WHITE_LABEL_FAVICON));
};

export const verifyLogoOnLoginPage = () => {
  cy.apiLogout();
  cy.clearCookies();
  cy.clearLocalStorage();
  cy.visit("/");
  cy.get(".tooljet-header img")
    .should("be.visible")
    .and("have.attr", "src")
    .and("include", LOGO_IDENTIFIER);
};