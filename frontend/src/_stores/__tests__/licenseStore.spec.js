import config from 'config';
import { licenseService } from '@/_services';
import { useLicenseStore } from '../licenseStore';

jest.mock('@/_services', () => ({
  licenseService: { getPlanCatalog: jest.fn(), getFeatureAccess: jest.fn() },
  appsService: {},
}));

const catalog = { plans: [{ id: 'basic', label: 'Free' }], gates: {} };
const actions = () => useLicenseStore.getState().actions;

describe('licenseStore', () => {
  const originalEdition = config.TOOLJET_EDITION;

  beforeEach(() => {
    config.TOOLJET_EDITION = 'ee';
    useLicenseStore.setState({ planCatalogStatus: 'idle', planCatalog: { plans: [], gates: {} } });
  });

  afterAll(() => {
    config.TOOLJET_EDITION = originalEdition;
  });

  describe('ensurePlanCatalog', () => {
    it('should fetch the catalog once for concurrent callers', async () => {
      licenseService.getPlanCatalog.mockResolvedValue(catalog);

      await Promise.all([actions().ensurePlanCatalog(), actions().ensurePlanCatalog()]);
      await actions().ensurePlanCatalog();

      expect(licenseService.getPlanCatalog).toHaveBeenCalledTimes(1);
      expect(useLicenseStore.getState()).toMatchObject({ planCatalog: catalog, planCatalogStatus: 'loaded' });
    });

    it('should never fetch on CE', async () => {
      config.TOOLJET_EDITION = 'ce';

      await actions().ensurePlanCatalog();

      expect(licenseService.getPlanCatalog).not.toHaveBeenCalled();
    });

    it('should allow a retry after a failed fetch', async () => {
      licenseService.getPlanCatalog.mockRejectedValueOnce(new Error('offline')).mockResolvedValueOnce(catalog);

      await actions().ensurePlanCatalog();
      expect(useLicenseStore.getState().planCatalogStatus).toBe('error');

      await actions().ensurePlanCatalog();
      expect(useLicenseStore.getState().planCatalogStatus).toBe('loaded');
    });
  });

  it('setFeatureAccess should store the data and mark it loaded', () => {
    actions().setFeatureAccess({ gitSync: true });

    expect(useLicenseStore.getState()).toMatchObject({ featureAccess: { gitSync: true }, featuresLoaded: true });
  });
});
