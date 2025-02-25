/* eslint-disable import/no-unresolved */
// src/modules/common/helpers/getEditionSpecificHelper.js
import { fetchEdition } from './utils';

// Static imports for all possible modules
import * as commonWhiteLabelling from '@/modules/common/helpers/whiteLabelling';
import * as eeWhiteLabelling from '@ee/modules/helpers/whiteLabelling';
import * as cloudWhiteLabelling from '@cloud/modules/helpers/whiteLabelling';

// Map of all helpers
const helperModules = {
  whiteLabelling: {
    ce: commonWhiteLabelling,
    ee: eeWhiteLabelling,
    cloud: cloudWhiteLabelling,
  },
  // Add other helpers here in the same structure
};

export const getEditionSpecificHelper = async (helperName) => {
  const edition = fetchEdition();

  try {
    // Get the specific helper module map
    const helperMap = helperModules[helperName];
    if (!helperMap) {
      throw new Error(`No helper found for ${helperName}`);
    }

    // Get the edition-specific implementation
    const editionUtils = helperMap[edition];

    // Check if we got the empty module (from webpack replacement)
    if (editionUtils?.name === 'Empty Module') {
      console.log('Received empty module, falling back to common helper');
      return helperMap.ce;
    }

    if (editionUtils && typeof editionUtils === 'object') {
      return editionUtils;
    }

    // Fallback to CE version if edition-specific not found
    return helperMap.ce;
  } catch (error) {
    console.error(`Error loading helper ${helperName}:`, error);
    throw error;
  }
};
