// server/test/modules/data-queries/unit/data-query-app-ability-guard.spec.ts
import { FeatureAbilityGuard } from '@modules/data-queries/ability/app/guard';
import { App } from '@entities/app.entity';
import { MODULES } from '@modules/app/constants/modules';
import { APP_TYPES } from '@modules/apps/constants';

/** @group platform */
describe('data-queries app FeatureAbilityGuard', () => {
  let guard: FeatureAbilityGuard;

  beforeEach(() => {
    guard = new FeatureAbilityGuard(null as any, null as any, null as any, null as any, null as any);
  });

  const withResource = (resource: any) => {
    (guard as any).setResourceObject(resource);
    return (guard as any).getResource();
  };

  describe('getResource', () => {
    it('resolves a FRONT_END app to APP + GLOBAL_DATA_SOURCE', () => {
      expect(withResource({ type: APP_TYPES.FRONT_END })).toEqual([
        { resourceType: MODULES.APP },
        { resourceType: MODULES.GLOBAL_DATA_SOURCE },
      ]);
    });

    it('resolves a MODULE app to MODULES + GLOBAL_DATA_SOURCE', () => {
      expect(withResource({ type: APP_TYPES.MODULE })).toEqual([
        { resourceType: MODULES.MODULES },
        { resourceType: MODULES.GLOBAL_DATA_SOURCE },
      ]);
    });

    it('resolves a WORKFLOW app to WORKFLOWS + GLOBAL_DATA_SOURCE', () => {
      expect(withResource({ type: APP_TYPES.WORKFLOW })).toEqual([
        { resourceType: MODULES.WORKFLOWS },
        { resourceType: MODULES.GLOBAL_DATA_SOURCE },
      ]);
    });

    it('defaults an unrecognized app type to APP + GLOBAL_DATA_SOURCE', () => {
      expect(withResource({ type: 'something-else' })).toEqual([
        { resourceType: MODULES.APP },
        { resourceType: MODULES.GLOBAL_DATA_SOURCE },
      ]);
    });
  });

  it('getSubjectType returns App', () => {
    expect((guard as any).getSubjectType()).toBe(App);
  });

  it('forwardAbility is true', () => {
    expect((guard as any).forwardAbility()).toBe(true);
  });
});
