import { fetchEdition } from './utils';
import * as ceStores from '@/modules/_store';
import * as eeStores from '@ee/modules/_store';

const storeRegistry = {
  ee: eeStores,
  cloud: eeStores,
  ce: ceStores,
};

const getEditionSpecificStore = async (moduleName, storeName) => {
  const edition = fetchEdition();

  try {
    const editionStores = storeRegistry[edition] || storeRegistry.ce;
    return editionStores?.stores?.[storeName];
  } catch (error) {
    console.error(`Error loading store ${storeName} from ${edition} edition for module ${moduleName}:`, error);
    // Fallback to module-specific common store if edition-specific store fails
    try {
      return storeRegistry.ce[moduleName]?.stores?.[storeName];
    } catch (fallbackError) {
      console.error('Fallback to module-specific common store failed:', fallbackError);
      throw error;
    }
  }
};

export { getEditionSpecificStore };
