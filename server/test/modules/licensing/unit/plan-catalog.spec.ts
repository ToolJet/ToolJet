/// <reference types="jest" />
import { instanceToPlain, plainToInstance } from 'class-transformer';
import LicenseBase from '@modules/licensing/configs/LicenseBase';
import { LICENSE_TYPE } from '@modules/licensing/constants';
import {
  EMPTY_PLAN_CATALOG,
  GATE_KEYS,
  PLAN_CATALOG,
  PlanCatalogSlice,
  resolvePlanTier,
  selectPlanCatalog,
} from '@modules/licensing/constants/plan-catalog';
import { PlanCatalogDto } from '@modules/licensing/dto/plan-catalog.dto';
import { Terms } from '@modules/licensing/interfaces/terms';

const { cloud, selfHosted } = PLAN_CATALOG;

/** @group platform */
describe('Plan catalog', () => {
  describe('selectPlanCatalog | which slice each edition serves', () => {
    it('should serve the cloud ladder on cloud', () => {
      expect(selectPlanCatalog('cloud')).toBe(cloud);
    });

    it('should serve the self-hosted ladder on EE', () => {
      expect(selectPlanCatalog('ee')).toBe(selfHosted);
    });

    it('should serve an empty catalog on CE and on unknown editions', () => {
      expect(selectPlanCatalog('ce')).toBe(EMPTY_PLAN_CATALOG);
      expect(selectPlanCatalog('unknown')).toBe(EMPTY_PLAN_CATALOG);
    });
  });

  // Rows mirror what /license/access reports for `plan` and `licenseStatus.licenseType`.
  describe('resolvePlanTier | cloud', () => {
    it.each([
      ['no organization_license row', 'basic', LICENSE_TYPE.BASIC, 'basic'],
      ['expired past grace', 'basic', LICENSE_TYPE.BASIC, 'basic'],
      ['trial row (no plan)', undefined, LICENSE_TYPE.TRIAL, null],
      ['Basic plan', 'basicplus', LICENSE_TYPE.BUSINESS, 'basicplus'],
      ['legacy Starter plan', 'starter', LICENSE_TYPE.BUSINESS, 'basicplus'],
      ['Pro plan', 'pro', LICENSE_TYPE.BUSINESS, 'pro'],
      ['Team plan', 'team', LICENSE_TYPE.BUSINESS, 'team'],
      ['enterprise license', undefined, LICENSE_TYPE.ENTERPRISE, 'enterprise'],
      ['enterprise license with a plan name', 'team', LICENSE_TYPE.ENTERPRISE, 'enterprise'],
      ['unknown plan name', 'gold', LICENSE_TYPE.BUSINESS, null],
    ])('should resolve %s to %s', (_scenario, plan, licenseType, expected) => {
      expect(resolvePlanTier(plan, licenseType, cloud)).toBe(expected);
    });
  });

  describe('resolvePlanTier | self-hosted', () => {
    it.each([
      ['no or invalid license key', 'basic', LICENSE_TYPE.BASIC, 'basic'],
      ['expired license key', 'basic', LICENSE_TYPE.BASIC, 'basic'],
      ['trial key (no plan)', undefined, LICENSE_TYPE.TRIAL, null],
      ['business key on Team', 'team', LICENSE_TYPE.BUSINESS, 'team'],
      ['valid key without a type, on Team', 'team', LICENSE_TYPE.BASIC, 'team'],
      ['enterprise key without a plan name', undefined, LICENSE_TYPE.ENTERPRISE, 'enterprise'],
      ['flexible Pro key (no self-hosted Pro plan)', 'pro', LICENSE_TYPE.BUSINESS, null],
      ['hand-edited key with an unknown plan name', 'constructor', LICENSE_TYPE.BUSINESS, null],
    ])('should resolve %s to %s', (_scenario, plan, licenseType, expected) => {
      expect(resolvePlanTier(plan, licenseType, selfHosted)).toBe(expected);
    });
  });

  describe('resolvePlanTier | CE', () => {
    it('should never place CE on a ladder', () => {
      expect(resolvePlanTier('basic', LICENSE_TYPE.BASIC, EMPTY_PLAN_CATALOG)).toBeNull();
      expect(resolvePlanTier(undefined, LICENSE_TYPE.ENTERPRISE, EMPTY_PLAN_CATALOG)).toBeNull();
    });
  });

  describe.each([
    ['cloud', cloud],
    ['self-hosted', selfHosted],
  ])('integrity | %s', (_deployment, slice: PlanCatalogSlice) => {
    const planIds = slice.plans.map((plan) => plan.id);

    it('should list each plan once', () => {
      expect(new Set(planIds).size).toBe(planIds.length);
    });

    it('should start the ladder at the free tier', () => {
      expect(planIds[0]).toBe('basic');
    });

    it('should cover every gate key and nothing else', () => {
      expect(Object.keys(slice.gates).sort()).toEqual([...GATE_KEYS].sort());
    });

    it('should point every gate at a paid plan on its own ladder, or at null', () => {
      for (const required of Object.values(slice.gates)) {
        if (required === null) continue;
        expect(planIds).toContain(required);
        expect(required).not.toBe('basic'); // would render a "Free" tag
      }
    });
  });

  it('should only use gate keys that /license/access returns (byok is derived from aiPlan)', () => {
    const license = new LicenseBase({}, { type: LICENSE_TYPE.BUSINESS } as Terms);
    const accessKeys = Object.keys(license.features);

    expect(accessKeys).toContain('aiPlan');
    for (const gateKey of GATE_KEYS.filter((key) => key !== 'byok')) {
      expect(accessKeys).toContain(gateKey);
    }
  });

  describe('PlanCatalogDto | response serialization', () => {
    it.each([
      ['cloud', cloud],
      ['self-hosted', selfHosted],
      ['CE', EMPTY_PLAN_CATALOG],
    ])('should return the %s slice unchanged', (_deployment, slice) => {
      expect(instanceToPlain(plainToInstance(PlanCatalogDto, slice))).toEqual(slice);
    });
  });
});
