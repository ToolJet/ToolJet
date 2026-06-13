import * as ceStores from '@/modules/_store';
import * as eeStores from '@ee/modules/_store';

// Build-time edition selection — replaces the old async registry lookup and
// removes the top-level await (a hidden chunk-loading serialization point).
const stores = process.env.TOOLJET_EDITION === 'ce' ? ceStores.stores : eeStores.stores;

export default stores?.onboardingStore;
