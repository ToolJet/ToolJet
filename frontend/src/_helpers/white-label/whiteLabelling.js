import { getEditionSpecificHelper } from '@/modules/common/helpers/getEditionSpecificHelper';

let whiteLabellingHelper = null;

// Create async getters for each function
export const getWhiteLabellingHelper = async () => {
  if (!whiteLabellingHelper) {
    whiteLabellingHelper = await getEditionSpecificHelper('whiteLabelling');
  }
  return whiteLabellingHelper;
};

export const retrieveWhiteLabelFavicon = async () => {
  const helper = await getWhiteLabellingHelper();
  return helper.retrieveWhiteLabelFavicon();
};

export const retrieveWhiteLabelText = async () => {
  const helper = await getWhiteLabellingHelper();
  return helper.retrieveWhiteLabelText();
};

export const retrieveWhiteLabelLogo = async () => {
  const helper = await getWhiteLabellingHelper();
  return helper.retrieveWhiteLabelLogo();
};

// Add other functions as needed following the same pattern
export const setFaviconAndTitle = async (...args) => {
  const helper = await getWhiteLabellingHelper();
  return helper.setFaviconAndTitle(...args);
};

export const fetchAndSetWindowTitle = async (...args) => {
  const helper = await getWhiteLabellingHelper();
  return helper.fetchAndSetWindowTitle(...args);
};

export const fetchWhiteLabelDetails = async () => {
  const helper = await getWhiteLabellingHelper();
  return helper.fetchWhiteLabelDetails();
};

export const resetToDefaultWhiteLabels = async () => {
  const helper = await getWhiteLabellingHelper();
  return helper.resetToDefaultWhiteLabels();
};

export const checkWhiteLabelsDefaultState = async () => {
  const helper = await getWhiteLabellingHelper();
  return helper.checkWhiteLabelsDefaultState();
};

// For constants, you might want to export them directly from the common helper
export {
  defaultWhiteLabellingSettings,
  whiteLabellingOptions,
  pageTitles,
} from '@/modules/common/helpers/whiteLabelling';
