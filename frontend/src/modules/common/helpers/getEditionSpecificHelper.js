/* eslint-disable import/no-unresolved */
// src/modules/common/helpers/getEditionSpecificHelper.js
import { fetchEdition } from './utils';

/**
 * Dynamically loads edition-specific helper modules.
 * Uses dynamic imports to avoid bundling all EE helpers.
 *
 * Note: For posthog and hubspot, EE uses CE implementation (no separate EE version).
 * Only Cloud edition has custom implementations.
 *
 */
export const getEditionSpecificHelper = async (helperName) => {
  const edition = fetchEdition();

  try {
    // For posthog and hubspot, EE uses CE implementation
    const usesCEForEE = ['posthog', 'hubspot'].includes(helperName);

    if (edition === 'ce' || (edition === 'ee' && usesCEForEE)) {
      // Load CE helper
      const ceHelper = await import(
        /* webpackChunkName: "helper-ce-[request]" */
        /* webpackMode: "lazy" */
        `@/modules/common/helpers/${helperName}`
      );
      return ceHelper;
    }

    // For Cloud edition, try to load Cloud-specific helper
    if (edition === 'cloud') {
      try {
        const cloudHelper = await import(
          /* webpackChunkName: "helper-cloud-[request]" */
          /* webpackMode: "lazy" */
          `@ee/modules/common/helpers/${helperName}`
        );

        // Check if we got the empty module (from webpack replacement)
        if (cloudHelper?.name === 'Empty Module') {
          console.log('Received empty module, falling back to common helper');
          const ceHelper = await import(`@/modules/common/helpers/${helperName}`);
          return ceHelper;
        }

        return cloudHelper;
      } catch (error) {
        console.warn(`Cloud helper ${helperName} not found, falling back to CE:`, error.message);
        const ceHelper = await import(`@/modules/common/helpers/${helperName}`);
        return ceHelper;
      }
    }

    // Default fallback to CE
    const ceHelper = await import(`@/modules/common/helpers/${helperName}`);
    return ceHelper;
  } catch (error) {
    console.error(`Error loading helper ${helperName}:`, error);
    throw error;
  }
};
