import { fetchEdition } from './utils';

/**
 * Dynamically loads edition-specific stores.
 * Uses dynamic imports to avoid bundling all EE stores.
 *
 * @param {string} moduleName - The module name
 * @param {string} storeName - The store name to load
 * @returns {Promise<Object>} The store object
 */
const getEditionSpecificStore = async (moduleName, storeName) => {
  const edition = fetchEdition();

  try {
    // For CE, load from CE modules
    if (edition === 'ce') {
      const ceStores = await import('@/modules/_store');
      return ceStores?.stores?.[storeName];
    }

    // For EE/Cloud, dynamically load EE stores
    const editionPath = edition === 'ee' ? '@ee' : '@cloud';
    const eeStores = await import(
      /* webpackChunkName: "store-[request]" */
      /* webpackMode: "lazy" */
      `${editionPath}/modules/_store`
    );

    return eeStores?.stores?.[storeName];
  } catch (error) {
    console.error(`Error loading store ${storeName} from ${edition} edition for module ${moduleName}:`, error);

    // Fallback to CE store
    try {
      const ceStores = await import('@/modules/_store');
      return ceStores[moduleName]?.stores?.[storeName];
    } catch (fallbackError) {
      console.error('Fallback to module-specific common store failed:', fallbackError);
      throw error;
    }
  }
};

export { getEditionSpecificStore };
