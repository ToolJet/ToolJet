/**
 * Unit test for the release-license override in AbilityService.resourceActionsPermission — the
 * 3rd of the 3 call sites the release-flag consolidation touches (the other two are covered in
 * roles/unit/check-builder-level-resources-permissions.spec.ts and
 * group-permissions/unit/granular-permissions.util.service.spec.ts). A builder normally only gets
 * promote/release ability from their group permissions; when the org lacks the `release` license,
 * this method forces both to true instead so dev-lifecycle stays usable without the paid feature.
 *
 * getResourcePermission (a large, DB-query-heavy method) is stubbed out directly so this test only
 * exercises the license-override logic that runs after it.
 */

jest.mock('../../../../src/helpers/database.helper', () => ({
  dbTransactionWrap: jest.fn().mockImplementation(async (cb: (manager: any) => Promise<any>, manager?: any) => {
    return cb(manager ?? {});
  }),
}));

import { AbilityService } from '../../../../ee/ability/service';
import { USER_ROLE } from '../../../../src/modules/group-permissions/constants';

function makeService(getLicenseTerms: jest.Mock): AbilityService {
  const licenseTermsService = { getLicenseTerms } as any;
  const abilityUtilService = { isBuilder: jest.fn().mockResolvedValue(true) } as any;
  const service = new AbilityService(licenseTermsService, null as any, abilityUtilService);
  jest.spyOn(service, 'getResourcePermission').mockResolvedValue([{ name: USER_ROLE.BUILDER } as any]);
  return service;
}

const user = { id: 'user-1', organizationId: 'org-uuid-1' } as any;

describe('AbilityService.resourceActionsPermission (release-license override)', () => {
  it('leaves promote/release as-is for a builder when the org has the release license', async () => {
    const service = makeService(jest.fn().mockResolvedValue(true));

    const result = await service.resourceActionsPermission(user, { organizationId: user.organizationId } as any);

    expect(result.appPromote).toBeFalsy();
    expect(result.appRelease).toBeFalsy();
  });

  it('forces promote/release to true for a builder when the org lacks the release license', async () => {
    const service = makeService(jest.fn().mockResolvedValue(false));

    const result = await service.resourceActionsPermission(user, { organizationId: user.organizationId } as any);

    expect(result.appPromote).toBe(true);
    expect(result.appRelease).toBe(true);
  });
});
