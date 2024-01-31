import * as request from 'supertest';
import { INestApplication } from '@nestjs/common';
import { clearDB, createUser, createNestAppInstanceWithEnvMock } from '../../../test.helper';
import { OAuth2Client } from 'google-auth-library';
import { Repository } from 'typeorm';
import { InstanceSettings } from 'src/entities/instance_settings.entity';
import { INSTANCE_USER_SETTINGS } from 'src/helpers/instance_settings.constants';

describe('oauth controller', () => {
  let app: INestApplication;
  let instanceSettingsRepository: Repository<InstanceSettings>;
  let mockConfig;

  beforeEach(async () => {
    await clearDB();
    await instanceSettingsRepository.update(
      { key: INSTANCE_USER_SETTINGS.ALLOW_PERSONAL_WORKSPACE },
      { value: 'false' }
    );
  });

  beforeAll(async () => {
    ({ app, mockConfig } = await createNestAppInstanceWithEnvMock());
    instanceSettingsRepository = app.get('InstanceSettingsRepository');
  });

  afterEach(() => {
    jest.resetAllMocks();
    jest.clearAllMocks();
  });

  describe('SSO Login', () => {
    beforeEach(() => {
      jest.spyOn(mockConfig, 'get').mockImplementation((key: string) => {
        switch (key) {
          case 'SSO_GOOGLE_OAUTH2_CLIENT_ID':
            return 'google-client-id';
          case 'SSO_GIT_OAUTH2_CLIENT_ID':
            return 'git-client-id';
          case 'SSO_GIT_OAUTH2_CLIENT_SECRET':
            return 'git-secret';
          default:
            return process.env[key];
        }
      });
    });
    describe('Multi-Workspace instance level SSO', () => {
      describe('sign in via Google OAuth', () => {
        const token = 'some-Token';
        it('Should not login if user workspace status is invited', async () => {
          await createUser(app, {
            firstName: 'SSO',
            lastName: 'userExist',
            email: 'invited@tooljet.io',
            groups: ['all_users'],
            status: 'invited',
          });

          const googleVerifyMock = jest.spyOn(OAuth2Client.prototype, 'verifyIdToken');
          googleVerifyMock.mockImplementation(() => ({
            getPayload: () => ({
              sub: 'someSSOId',
              email: 'invited@tooljet.io',
              name: 'SSO User',
              hd: 'tooljet.io',
            }),
          }));

          await request(app.getHttpServer()).post('/api/oauth/sign-in/common/google').send({ token }).expect(401);
        });

        it('Should not login if user workspace status is archived', async () => {
          await createUser(app, {
            firstName: 'SSO',
            lastName: 'userExist',
            email: 'archived@tooljet.io',
            groups: ['all_users'],
            status: 'archived',
          });

          const googleVerifyMock = jest.spyOn(OAuth2Client.prototype, 'verifyIdToken');
          googleVerifyMock.mockImplementation(() => ({
            getPayload: () => ({
              sub: 'someSSOId',
              email: 'archived@tooljet.io',
              name: 'SSO User',
              hd: 'tooljet.io',
            }),
          }));

          await request(app.getHttpServer()).post('/api/oauth/sign-in/common/google').send({ token }).expect(401);
        });
      });
    });
  });

  afterAll(async () => {
    await app.close();
  });
});
