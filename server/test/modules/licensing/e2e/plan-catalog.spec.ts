/**
 * @group platform
 */

import * as request from 'supertest';
import { INestApplication } from '@nestjs/common';
import { initTestApp, closeTestApp } from 'test-helper';
import { EMPTY_PLAN_CATALOG, PLAN_CATALOG, resolvePlanTier } from '@modules/licensing/constants/plan-catalog';

jest.setTimeout(120_000);

// The catalog is picked per request from TOOLJET_EDITION, and a cached test app does not
// reset it, so each describe pins the edition of the app it boots.

describe('LicensePlansController', () => {
  describe('EE (plan: enterprise)', () => {
    let app: INestApplication;

    beforeAll(async () => {
      ({ app } = await initTestApp({ edition: 'ee', plan: 'enterprise' }));
      process.env.TOOLJET_EDITION = 'ee';
    });

    afterAll(async () => {
      await closeTestApp(app);
    });

    describe('GET /api/license/plan-catalog | Self-hosted plan ladder', () => {
      it('should return the self-hosted catalog without authentication', async () => {
        const response = await request(app.getHttpServer()).get('/api/license/plan-catalog').expect(200);

        expect(response.body).toEqual(PLAN_CATALOG.selfHosted);
      });
    });

    describe('GET /api/license/access | Current plan tier', () => {
      it('should report planTier resolved from plan and license type', async () => {
        const response = await request(app.getHttpServer()).get('/api/license/access').expect(200);
        const { plan, licenseStatus, planTier } = response.body;

        expect(response.body).toHaveProperty('planTier');
        expect(planTier).toBe(resolvePlanTier(plan, licenseStatus.licenseType, PLAN_CATALOG.selfHosted));
      });
    });
  });

  describe('CE', () => {
    let app: INestApplication;

    beforeAll(async () => {
      ({ app } = await initTestApp({ edition: 'ce' }));
      process.env.TOOLJET_EDITION = 'ce';
    });

    afterAll(async () => {
      await closeTestApp(app);
    });

    describe('GET /api/license/plan-catalog | No plan tags on CE', () => {
      it('should return an empty catalog', async () => {
        const response = await request(app.getHttpServer()).get('/api/license/plan-catalog').expect(200);

        expect(response.body).toEqual(EMPTY_PLAN_CATALOG);
      });
    });
  });
});
