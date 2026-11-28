/// <reference types="jest" />
import { OrganizationConstantsUtilService } from '@modules/organization-constants/util.service';
import { OrganizationConstantType, SECRET_VALUE_MASK } from '@modules/organization-constants/constants';
import { ConstantWithEnvironmentValues } from '@modules/organization-constants/types';

/** @group platform */
describe('OrganizationConstantsUtilService', () => {
  const util = new OrganizationConstantsUtilService(null, null, null);

  describe('removeSecretValues', () => {
    const buildCachedConstants = (): ConstantWithEnvironmentValues[] => [
      {
        id: 'constant-1',
        name: 'api_key',
        type: OrganizationConstantType.SECRET,
        createdAt: '2026-11-05T00:00:00.000Z',
        values: [{ environmentName: 'development', value: 'plaintext-secret', id: 'env-1' }],
      },
      {
        id: 'constant-2',
        name: 'base_url',
        type: OrganizationConstantType.GLOBAL,
        createdAt: '2026-11-05T00:00:00.000Z',
        values: [{ environmentName: 'development', value: 'https://example.com', id: 'env-1' }],
      },
    ];

    it('should return secrets with masked values and leave globals untouched', () => {
      const result = util.removeSecretValues(buildCachedConstants());

      expect(result).toMatchObject([
        { name: 'api_key', type: 'Secret', values: [{ environmentName: 'development', value: SECRET_VALUE_MASK }] },
        {
          name: 'base_url',
          type: 'Global',
          values: [{ environmentName: 'development', value: 'https://example.com' }],
        },
      ]);
    });

    it('should not mutate the constants it receives', () => {
      const cached = buildCachedConstants();

      util.removeSecretValues(cached);

      expect(cached).toEqual(buildCachedConstants());
    });
  });
});
