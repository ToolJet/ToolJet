import * as whiteLabellingUtils from '@/modules/common/helpers/whiteLabelling';

// Re-export all common utils
export const {
  defaultWhiteLabellingSettings,
  whiteLabellingOptions,
  retrieveWhiteLabelText,
  retrieveWhiteLabelLogo,
  retrieveWhiteLabelFavicon,
  setFaviconAndTitle,
  fetchAndSetWindowTitle,
  pageTitles,
} = whiteLabellingUtils;

export async function fetchWhiteLabelDetails() {}

export async function resetToDefaultWhiteLabels() {}

export async function checkWhiteLabelsDefaultState() {
  return true;
}
