// server/test/modules/apps/unit/apps-ability-guard.spec.ts
import { FeatureAbilityGuard } from '@modules/apps/ability/guard';
import { App } from '@entities/app.entity';
import { MODULES } from '@modules/app/constants/modules';
import { APP_TYPES } from '@modules/apps/constants';

/** @group platform */
describe('apps FeatureAbilityGuard', () => {
  let guard: FeatureAbilityGuard;

  beforeEach(() => {
    guard = new FeatureAbilityGuard(null as any, null as any, null as any, null as any, null as any);
  });

  const withResource = (resource: any) => {
    (guard as any).setResourceObject(resource);
    return (guard as any).getResource();
  };

  describe('getResource', () => {
    it('maps a FRONT_END app to MODULES.APP', () => {
      expect(withResource({ type: APP_TYPES.FRONT_END })).toEqual({ resourceType: MODULES.APP });
    });

    it('maps a MODULE app to MODULES.MODULES', () => {
      expect(withResource({ type: APP_TYPES.MODULE })).toEqual({ resourceType: MODULES.MODULES });
    });

    it('maps a WORKFLOW app to MODULES.WORKFLOWS', () => {
      expect(withResource({ type: APP_TYPES.WORKFLOW })).toEqual({ resourceType: MODULES.WORKFLOWS });
    });

    it('returns null when there is no resource in context', () => {
      expect(withResource(undefined)).toBeNull();
    });

    it('returns null for an unrecognized app type', () => {
      expect(withResource({ type: 'something-else' })).toBeNull();
    });
  });

  it('getSubjectType returns App', () => {
    expect((guard as any).getSubjectType()).toBe(App);
  });

  it('forwardAbility is true', () => {
    expect((guard as any).forwardAbility()).toBe(true);
  });
});
