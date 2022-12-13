import { cyParamName } from "Selectors/common";

export const appVersionSelectors = {
  appVersionLabel: '[data-cy="app-version-label"]',
  currentVersionField: (versionText) => {
    return `[data-cy="${cyParamName(versionText)}-current-version-text"]`;
  },
  createVersionLink: '[data-cy="create-version-link"]',
  createVersionTitle: '[data-cy="create-version-title"]',
  versionNamelabel: '[data-cy="version-name-label"]',
  appVersionMenuField: '[data-cy="app-version-menu-field"]',
  versionNameInputField: '[data-cy="version-name-input-field"]',
  createVersionFromLabel: '[data-cy="create-version-from-label"]',
  createVersionInputField: '[data-cy="create-version-input-field"]',
  createVersionButton: '[data-cy="create-version-button"]',
  appVersionContentList: '[data-cy="app-version-content"] .dropdown-item',
};
export const exportAppModalSelectors = {
  selectVersionTitle: '[data-cy= "select-a-version-to-export-title"]',
  currentVersionSection: '[data-cy="current-version-section"]',
  currentVersionLabel: '[data-cy="current-version-label"]',
  noOtherVersionText: '[data-cy="no-other-versions-found-text"]',
  exportAllButton: '[data-cy="export-all-button"]',
  exportSelectedVersionButton: '[data-cy="export-selected-version-button"]',
  modalCloseButton: '[data-cy="modal-close-button"]',
  otherVersionSection: '[data-cy="other-version-section"]',
  versionText: (versionText) => {
    return `[data-cy="${cyParamName(versionText)}-text"]`;
  },
  versionRadioButton: (versionText) => {
    return `[data-cy="${cyParamName(versionText)}-radio-button"]`;
  },
};

export const importSelectors = {
  dropDownMenu: '[data-cy="import-dropdown-menu"]',
  importOptionLabel: '[data-cy="import-option-label"]',
  importOptionInput: '[data-cy="import-option-input"]',
};
