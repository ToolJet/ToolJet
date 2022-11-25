import { cyParamName } from "Selectors/common";

export const appVersionSelectors = {
  appVersionLabel: '[data-cy="app-version-label"]',
  currentVersionField: (versionText) => {
    return `[data-cy="${cyParamName(versionText)}-current-version-text"]`;
  },
};
export const exportAppModalSelectors = {
  selectVersionTitle: '[data-cy= "select-a-version-to-export-title"]',
  currentVersionLabel: '[data-cy="current-version-label"]',
  noOtherVersionText: '[data-cy="no-other-versions-found-text"]',
  exportAllButton: '[data-cy="export-all-button"]',
  exportSelectedVersionButton: '[data-cy="export-selected-version-button"]',
  currentVersionText: (versionText) => {
    return `[data-cy="${cyParamName(versionText)}-text"]`;
  },
};
