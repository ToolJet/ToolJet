import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import * as request from 'supertest';

import { LicenseController } from '@ee/licensing/controller';
import { LicenseService } from '@ee/licensing/service';
import { FeatureAbilityGuard } from '@modules/licensing/ability/guard';
import LicenseBase from '@modules/licensing/configs/LicenseBase';
import { LICENSE_TYPE } from '@modules/licensing/constants';
import { BASIC_PLAN_TERMS as CE_BASIC_PLAN_TERMS } from '@modules/licensing/constants/PlanTerms';
import { Terms } from '@modules/licensing/interfaces/terms';

const futureExpiry = new Date();
futureExpiry.setFullYear(futureExpiry.getFullYear() + 1);
const EXPIRY_STR = futureExpiry.toISOString().split('T')[0];
const EXPIRY_DATE = new Date(`${EXPIRY_STR} 23:59:59`);

type FeatureAccessResponse = Record<string, unknown> & {
  componentNavigation?: boolean;
  licenseStatus: { isLicenseValid: boolean; isExpired: boolean };
  plan: string;
};

function buildFeatureAccessResponse(navigation: boolean): FeatureAccessResponse {
  const license = new (LicenseBase as any)(CE_BASIC_PLAN_TERMS, {
    expiry: EXPIRY_STR,
    type: LICENSE_TYPE.ENTERPRISE,
    features: {},
    app: {
      pages: {
        enabled: true,
        count: 10,
        features: { appHeaderAndLogo: true, addNavGroup: true },
      },
      permissions: { component: true, query: true, pages: true },
      features: { promote: true, release: true, history: true },
      components: { navigation },
    },
  } satisfies Partial<Terms>, new Date(), new Date(), EXPIRY_DATE, LICENSE_TYPE.ENTERPRISE);

  return {
    ...(license.features as Record<string, unknown>),
    licenseStatus: { isLicenseValid: true, isExpired: false },
    plan: LICENSE_TYPE.ENTERPRISE,
  };
}

describe('LicenseController /license/access', () => {
  let app: INestApplication;
  let licenseService: { getFeatureAccess: jest.Mock };

  beforeAll(async () => {
    licenseService = {
      getFeatureAccess: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [LicenseController],
      providers: [
        {
          provide: LicenseService,
          useValue: licenseService,
        },
      ],
    })
      .overrideGuard(FeatureAbilityGuard)
      .useValue({ canActivate: () => true })
      .compile();

    app = module.createNestApplication();
    await app.init();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  afterAll(async () => {
    await app.close();
  });

  it('returns componentNavigation as a boolean when the license enables navigation', async () => {
    licenseService.getFeatureAccess.mockResolvedValue(buildFeatureAccessResponse(true));

    const response = await request(app.getHttpServer())
      .get('/license/access')
      .set('tj-workspace-id', 'workspace-1')
      .expect(200);

    expect(typeof response.body.componentNavigation).toBe('boolean');
    expect(response.body.componentNavigation).toBe(true);
  });

  it('returns componentNavigation as false when the license disables navigation', async () => {
    licenseService.getFeatureAccess.mockResolvedValue(buildFeatureAccessResponse(false));

    const response = await request(app.getHttpServer())
      .get('/license/access')
      .set('tj-workspace-id', 'workspace-1')
      .expect(200);

    expect(typeof response.body.componentNavigation).toBe('boolean');
    expect(response.body.componentNavigation).toBe(false);
  });
});

