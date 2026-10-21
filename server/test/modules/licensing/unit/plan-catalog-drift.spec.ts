/// <reference types="jest" />
import OrganizationLicense from '@ee/licensing/configs/organization-license';
import {
  BASIC_PLAN_TERMS_CLOUD,
  BASICPLUS_PLAN_TERMS_CLOUD,
  PRO_PLAN_TERMS_CLOUD,
  TEAM_PLAN_TERMS_CLOUD,
} from '@ee/licensing/constants/PlanTerms';
import { LICENSE_TYPE } from '@modules/licensing/constants';
import { GateKey, PLAN_CATALOG, PlanId } from '@modules/licensing/constants/plan-catalog';
import { Terms } from '@modules/licensing/interfaces/terms';

// The cloud catalog must match what each cloud plan actually unlocks. If a preset in
// PlanTerms.ts changes (a feature moves plans), the catalog has to change with it.
//
// Cloud only: self-hosted licenses are issued per customer, so no preset exists to check
// against. There is no Enterprise preset either, so a gate whose lowest plan is Enterprise is
// only asserted to be off on every plan below it.

const DAY_MS = 24 * 60 * 60 * 1000;

// Build each rung the way production does: a 'business' license row with the plan's preset.
const paidPlan = (terms: Partial<Terms>, plan: PlanId) => {
  const now = new Date();
  return new OrganizationLicense(
    { ...terms, type: LICENSE_TYPE.BUSINESS } as Terms,
    now,
    new Date(now.getTime() + 30 * DAY_MS),
    plan
  );
};

// Free = no valid license. Production has no row; an expired row takes the same fallback
// (BASIC_PLAN_TERMS_CLOUD). Never use `new OrganizationLicense()` here: under NODE_ENV=test
// it fabricates a valid enterprise license.
const freePlan = () => {
  const past = new Date(Date.now() - 30 * DAY_MS);
  return new OrganizationLicense({ ...BASIC_PLAN_TERMS_CLOUD, type: LICENSE_TYPE.BUSINESS } as Terms, past, past);
};

const RUNGS: Record<Exclude<PlanId, 'enterprise'>, () => OrganizationLicense> = {
  basic: freePlan,
  basicplus: () => paidPlan(BASICPLUS_PLAN_TERMS_CLOUD, 'basicplus'),
  pro: () => paidPlan(PRO_PLAN_TERMS_CLOUD, 'pro'),
  team: () => paidPlan(TEAM_PLAN_TERMS_CLOUD, 'team'),
};

const isUnlocked = (license: OrganizationLicense, gate: GateKey): boolean => {
  const features = license.features as Record<string, unknown>;
  if (gate === 'byok') return ['byok', 'selfhostai'].includes(features.aiPlan as string);
  return features[gate] === true;
};

const { plans, gates } = PLAN_CATALOG.cloud;
const rankOf = (plan: PlanId) => plans.findIndex((p) => p.id === plan);

const cases = (Object.entries(gates) as [GateKey, PlanId | null][])
  .filter(([, required]) => required !== null)
  .flatMap(([gate, required]) =>
    (Object.keys(RUNGS) as (keyof typeof RUNGS)[]).map((rung) => ({
      gate,
      required,
      rung,
      unlocked: rankOf(rung) >= rankOf(required),
    }))
  );

/** @group platform */
describe('Plan catalog drift | cloud presets', () => {
  it('should build the Free rung from the cloud fallback terms', () => {
    const license = freePlan();
    expect(license.plan).toBe('basic');
    expect(license.licenseType).toBe(LICENSE_TYPE.BASIC);
  });

  it.each(cases)('$gate (lowest plan $required) should be unlocked=$unlocked on $rung', ({ gate, rung, unlocked }) => {
    expect(isUnlocked(RUNGS[rung](), gate)).toBe(unlocked);
  });
});
