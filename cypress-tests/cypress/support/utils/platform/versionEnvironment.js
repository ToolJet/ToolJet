import { multiEnvSelector } from "Selectors/platform/eeCommon";
import { versionSwitcherSelectors } from "Selectors/platform/version";

export const openVersionManager = () => {
  return cy.get(versionSwitcherSelectors.versionSwitcherButton)
    .should("be.visible")
    .then(($switcher) => {
      if (!$switcher.hasClass("opened")) {
        cy.wrap($switcher).click();
      }
    });
};

export const selectVersionEnvironment = (environment) => {
  // The header and an environment option share their data-cy value.
  openVersionManager();
  return cy.get(multiEnvSelector.environmentOption(environment))
    .should("be.visible")
    .click();
};

export const closeVersionManager = () => {
  return cy.get(versionSwitcherSelectors.versionSwitcherButton).then(($switcher) => {
    if ($switcher.hasClass("opened")) {
      cy.wrap($switcher).click();
    }
  });
};
