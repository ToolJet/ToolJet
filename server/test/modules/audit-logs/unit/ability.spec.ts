/** @group platform */
import { FeatureAbilityFactory, FeatureAbility } from '@modules/audit-logs/ability';
import { FEATURE_KEY } from '@modules/audit-logs/constants';
import { AuditLog } from '@entities/audit_log.entity';
import { buildAbilityViaFactory, expectFeatures } from 'test-helper';

const factory = new FeatureAbilityFactory(null as any);
const build = (permissions: object) => buildAbilityViaFactory<FeatureAbility>(factory, permissions);
const FEATURES = [FEATURE_KEY.VIEW_LOGS, FEATURE_KEY.VIEW_RESOURCES];

describe('audit-logs FeatureAbilityFactory', () => {
  it('denies an end user', async () => {
    expectFeatures(await build({}), AuditLog, { denied: FEATURES });
  });

  it('denies a builder', async () => {
    expectFeatures(await build({ isBuilder: true }), AuditLog, { denied: FEATURES });
  });

  it('allows a workspace admin', async () => {
    expectFeatures(await build({ isAdmin: true }), AuditLog, { allowed: FEATURES });
  });

  it('allows a super admin', async () => {
    expectFeatures(await build({ superAdmin: true }), AuditLog, { allowed: FEATURES });
  });
});
