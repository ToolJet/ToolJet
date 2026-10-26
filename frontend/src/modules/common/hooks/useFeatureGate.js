import { useEffect } from 'react';
import { shallow } from 'zustand/shallow';
import { useLicenseStore } from '@/_stores/licenseStore';
import { fetchEdition } from '@/modules/common/helpers/utils';
import { getGateState } from '@/modules/common/helpers/planGating';

/**
 * Plan-tag state for one gated feature. Reads the shared license store; never fetches on its own.
 *
 * @param {string} gateKey a /license/access feature key (or 'byok')
 * @param {{ isUnlocked?: boolean }} [options]
 */
export default function useFeatureGate(gateKey, { isUnlocked } = {}) {
  const { featureAccess, featuresLoaded, planCatalog, planCatalogStatus } = useLicenseStore(
    (state) => ({
      featureAccess: state.featureAccess,
      featuresLoaded: state.featuresLoaded,
      planCatalog: state.planCatalog,
      planCatalogStatus: state.planCatalogStatus,
    }),
    shallow
  );

  // Plan tags can sit on screens outside Layout, so make sure both inputs are loaded (one request each).
  const edition = fetchEdition();
  useEffect(() => {
    if (edition === 'ce') return;
    const { ensureFeatureAccess, ensurePlanCatalog } = useLicenseStore.getState().actions;
    ensureFeatureAccess();
    ensurePlanCatalog();
  }, [edition]);

  return getGateState({
    edition,
    featureAccess,
    featuresLoaded,
    catalog: planCatalog,
    catalogLoaded: planCatalogStatus === 'loaded',
    gateKey,
    isUnlocked,
  });
}
