import { App } from '@entities/app.entity';
import { AppVersion, AppVersionStatus } from '@entities/app_version.entity';
import { User } from '@entities/user.entity';
import { MODULES } from '@modules/app/constants/modules';
import { APP_TYPES } from '@modules/apps/constants';
import { FeatureAbilityFactory as AppAbilityFactory } from '@modules/apps/ability';
import { FeatureAbilityFactory as VersionAbilityFactory } from '@modules/versions/ability';
import { ReleasePreflightService } from '@modules/versions/services/release-preflight.service';
import { LICENSE_FIELD } from '@modules/licensing/constants';
import { LicenseTermsService } from '@modules/licensing/interfaces/IService';
import { DataSource } from 'typeorm';
import { Test } from '@nestjs/testing';
import { ForbiddenException } from '@nestjs/common';
import { VersionController } from '@modules/versions/controller';
import { VersionService } from '@modules/versions/service';
import { JwtAuthGuard } from '@modules/session/guards/jwt-auth.guard';
import { ValidAppGuard } from '@modules/apps/guards/valid-app.guard';
import { FeatureAbilityGuard } from '@modules/versions/ability/guard';
import * as request from 'supertest';

describe('Release permission preflight', () => {
  // Exercise the same ability factories as the write endpoints. Only the workspace data is supplied here.
  const app = { id: 'orchard', organizationId: 'growers', type: APP_TYPES.FRONT_END } as App;
  const environments = ['development', 'staging', 'production'].map((name, priority) => ({
    id: name,
    name,
    priority,
    enabled: true,
    isDefault: name === 'production',
  }));
  function fixture(overrides = {}, multiEnvironment = true, valid = true) {
    const request = {
      user: { id: 'operator', organizationId: app.organizationId } as User,
      tj_app: app,
      tj_resource_id: app.id,
      tj_user_permissions: {
        appRelease: true,
        appPromote: true,
        [MODULES.APP]: { editableAppsId: [app.id] },
        ...overrides,
      },
    };
    const service = new ReleasePreflightService(
      new AppAbilityFactory(null),
      new VersionAbilityFactory(null, null),
      {
        getLicenseTerms: async (field) => (field === LICENSE_FIELD.MULTI_ENVIRONMENT ? multiEnvironment : valid),
      } as LicenseTermsService,
      { manager: { find: async () => environments } } as unknown as DataSource
    );
    return (status = AppVersionStatus.DRAFT, currentEnvironmentId = 'development') =>
      service.check(app, { id: 'harvest', status, currentEnvironmentId } as AppVersion, request);
  }
  it('checks release permission before preparing a draft', async () => {
    await expect(fixture({ appRelease: false })()).rejects.toThrow('permission to release');
  });
  it('requires edit access to this app to save a draft', async () => {
    const check = fixture({ [MODULES.APP]: { editableAppsId: ['another-app'] } });
    await expect(check()).rejects.toThrow('permission to save');
    await expect(check(AppVersionStatus.PUBLISHED)).resolves.toHaveProperty('version_id', 'harvest');
  });
  it('requires promotion permission only when there is another environment to reach', async () => {
    const check = fixture({ appPromote: false });
    await expect(check()).rejects.toThrow('permission to promote');
    await expect(check(AppVersionStatus.PUBLISHED, 'production')).resolves.toMatchObject({
      environment_path: [{ id: 'production' }],
    });
    await expect(fixture({ appPromote: false }, false)()).resolves.toMatchObject({
      environment_path: [{ id: 'development' }],
    });
  });
  it('uses the remaining environments for an admin releasing from staging', async () => {
    await expect(
      fixture({ isAdmin: true, appRelease: false, appPromote: false })(AppVersionStatus.PUBLISHED, 'staging')
    ).resolves.toMatchObject({ environment_path: [{ id: 'staging' }, { id: 'production' }] });
  });
  it('rejects an unlicensed promotion and an unknown starting environment', async () => {
    await expect(fixture({}, true, false)()).rejects.toThrow('valid workspace license');
    await expect(fixture()(AppVersionStatus.PUBLISHED, 'missing')).rejects.toThrow('current environment');
  });
});

describe('Version inventory release preflight', () => {
  it('preserves ordinary inventory and preflights only a matching version in this app', async () => {
    const app = { id: 'orchard' };
    const versions = [{ id: 'spring' }, { id: 'autumn' }];
    const preflight = { version_id: 'autumn', environment_path: [{ id: 'one', name: 'development' }] };
    const check = jest.fn().mockResolvedValue(preflight);
    const checkReleasePolicies = jest.fn();
    const getAllVersions = jest.fn().mockResolvedValue({ versions });
    const module = await Test.createTestingModule({
      controllers: [VersionController],
      providers: [
        { provide: VersionService, useValue: { getAllVersions, checkReleasePolicies } },
        { provide: ReleasePreflightService, useValue: { check } },
      ],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue({ canActivate: () => true })
      .overrideGuard(ValidAppGuard)
      .useValue({ canActivate: () => true })
      .overrideGuard(FeatureAbilityGuard)
      .useValue({ canActivate: () => true })
      .compile();
    const nest = module.createNestApplication();
    nest.use((req, _res, next) => {
      req.tj_app = app;
      req.tj_resource_id = app.id;
      req.user = { id: 'grower', branchId: 'seasonal' };
      next();
    });
    await nest.init();
    try {
      const server = request(nest.getHttpServer());
      await server.get('/apps/orchard/versions').expect(200, { versions });
      expect(getAllVersions).toHaveBeenLastCalledWith(app, 'seasonal', false);
      await server.get('/apps/orchard/versions?releasePreflightFor=elsewhere').expect(404);
      expect(check).not.toHaveBeenCalled();
      expect(checkReleasePolicies).not.toHaveBeenCalled();
      await server
        .get('/apps/orchard/versions?releasePreflightFor=autumn&includeDefaultBranchVersions=true')
        .expect(200, { versions, release_preflight: preflight });
      expect(getAllVersions).toHaveBeenLastCalledWith(app, 'seasonal', true);
      expect(check).toHaveBeenCalledWith(
        app,
        versions[1],
        expect.objectContaining({ tj_resource_id: app.id, user: { id: 'grower', branchId: 'seasonal' } })
      );
      expect(checkReleasePolicies).toHaveBeenCalledWith(app, versions[1], 0);
      checkReleasePolicies.mockRejectedValueOnce(new ForbiddenException('Approval required'));
      await server.get('/apps/orchard/versions?releasePreflightFor=autumn').expect(403);
    } finally {
      await nest.close();
    }
  });
});
