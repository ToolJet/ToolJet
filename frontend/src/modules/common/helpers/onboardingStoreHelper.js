import { getEditionSpecificStore } from '@/modules/common/helpers/getEditionSpecificStores';

let StoreModule;
let storePromise;

const loadStore = async () => {
  try {
    StoreModule = await getEditionSpecificStore('onboarding', 'onboardingStore');
    return StoreModule;
  } catch (error) {
    console.error('Failed to load store:', error);
    return null;
  }
};

storePromise = loadStore();

export default StoreModule;
export { storePromise, loadStore };
