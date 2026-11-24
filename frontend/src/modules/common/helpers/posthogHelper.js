import { getEditionSpecificHelper } from './getEditionSpecificHelper';

/**
 * @typedef {object} PosthogHelper
 * @property {(currentUser: unknown) => void} initPosthog
 * @property {(eventName: string, properties?: Record<string, unknown>) => void} captureEvent
 */

// Typed here because the top-level await in the try block leaves the binding implicitly `any` for TS consumers.
/** @type {PosthogHelper} */
let posthogHelper;
try {
  posthogHelper = await getEditionSpecificHelper('posthog');
} catch (error) {
  console.error('Failed to load posthog helper:', error);
}
export default posthogHelper;
