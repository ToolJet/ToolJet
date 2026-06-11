import { getEditionSpecificStore } from '@/modules/common/helpers/getEditionSpecificStores';
let StoreModule;
try {
  StoreModule = await getEditionSpecificStore('onboarding', 'invitationsStore');
} catch (error) {
  console.error('Failed to load store:', error);
}
export default StoreModule;
