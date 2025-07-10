import { getEditionSpecificHelper } from './getEditionSpecificHelper';
let posthogHelper;
try {
  posthogHelper = await getEditionSpecificHelper('posthog');
} catch (error) {
  console.error('Failed to load posthog helper:', error);
}
export default posthogHelper;
