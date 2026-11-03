// server/test/modules/versions/unit/versions-ability-guard.spec.ts
import { FeatureAbilityGuard } from '@modules/versions/ability/guard';
import { App } from '@entities/app.entity';
import { MODULES } from '@modules/app/constants/modules';
import { APP_TYPES } from '@modules/apps/constants';

/** @group platform */
describe('versions FeatureAbilityGuard', () => {
  let guard: FeatureAbilityGuard;

  beforeEach(() => {
    guard = new FeatureAbilityGuard(null as any, null as any, null as any, null as any, null as any);
  });

  const withResource = (resource: any, request?: any) => {
    (guard as any).setResourceObject(resource);
    return (guard as any).getResource(request);
  };

  describe('getResource', () => {
    it('maps a FRONT_END app to MODULES.APP', () => {
      expect(withResource({ type: APP_TYPES.FRONT_END })).toEqual({ resourceType: MODULES.APP });
    });

    it('maps a WORKFLOW app to MODULES.WORKFLOWS', () => {
      expect(withResource({ type: APP_TYPES.WORKFLOW })).toEqual({ resourceType: MODULES.WORKFLOWS });
    });

    it('maps a MODULE app with no parentAppId query param to MODULES.MODULES only', () => {
      expect(withResource({ type: APP_TYPES.MODULE }, { query: {} })).toEqual({ resourceType: MODULES.MODULES });
    });

    it('maps a MODULE app with parentAppId query param to both MODULES and APP', () => {
      expect(withResource({ type: APP_TYPES.MODULE }, { query: { parentAppId: 'parent-1' } })).toEqual([
        { resourceType: MODULES.MODULES },
        { resourceType: MODULES.APP },
      ]);
    });

    it('returns null when there is no resource in context', () => {
      expect(withResource(undefined, { query: {} })).toBeNull();
    });
  });

  it('getSubjectType returns App', () => {
    expect((guard as any).getSubjectType()).toBe(App);
  });
});
