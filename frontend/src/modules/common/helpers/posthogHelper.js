import { getEditionSpecificHelper } from './getEditionSpecificHelper';

let posthogHelper;
let helperPromise;

const loadHelper = async () => {
  try {
    posthogHelper = await getEditionSpecificHelper('posthog');
    return posthogHelper;
  } catch (error) {
    console.error('Failed to load posthog helper:', error);
    return null;
  }
};

helperPromise = loadHelper();

export default posthogHelper;
export { helperPromise, loadHelper };
