import * as request from 'supertest';
import { INestApplication } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createUser, initTestApp, closeTestApp, getEntityRepository, ensureInstanceSSOConfigs } from 'test-helper';
import { mocked } from 'jest-mock';
import got from 'got';
import { Repository } from 'typeorm';
import { InstanceSettings } from '@entities/instance_settings.entity';
import { OrganizationUser } from '@entities/organization_user.entity';
import { User } from '@entities/user.entity';
import { INSTANCE_USER_SETTINGS } from '@modules/instance-settings/constants';

jest.mock('got');
const mockedGot = mocked(got);

/** @group platform */
describe('OAuthController', () => {
  describe('EE (plan: enterprise)', () => {
    let app: INestApplication;
    let instanceSettingsRepository: Repository<InstanceSettings>;
    let userRepository: Repository<User>;
    let orgUserRepository: Repository<OrganizationUser>;
    let configService: ConfigService;

    const token = 'some-Token';

    beforeAll(async () => {
      ({ app } = await initTestApp());
      configService = app.get(ConfigService);
      instanceSettingsRepository = getEntityRepository(InstanceSettings);
      userRepository = getEntityRepository(User);
      orgUserRepository = getEntityRepository(OrganizationUser);
      await ensureInstanceSSOConfigs();
    });

    afterEach(() => {
      jest.resetAllMocks();
      jest.clearAllMocks();
    });

    afterAll(async () => {
      await closeTestApp(app);
    }, 60_000);

    // ---------------------------------------------------------------------------
    // Instance SSO | non-super-admin flows
    // ---------------------------------------------------------------------------
    describe('POST /api/oauth/sign-in/:configId | Git instance SSO (non-super-admin)', () => {
      beforeEach(async () => {
        await instanceSettingsRepository.update(
          { key: INSTANCE_USER_SETTINGS.ALLOW_PERSONAL_WORKSPACE },
          { value: 'false' }
        );
        jest.spyOn(configService, 'get').mockImplementation((key: string) => {
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
        describe('sign in via Git OAuth', () => {
          it('Should not login if user workspace status is invited', async () => {
            await createUser(app, {
              firstName: 'SSO',
              lastName: 'userExist',
              email: 'invited@tooljet.io',
              groups: ['end-user'],
              status: 'invited',
            });

            const gitAuthResponse = jest.fn();
            gitAuthResponse.mockImplementation(() => {
              return {
                json: () => {
                  return {
                    access_token: 'some-access-token',
                    scope: 'scope',
                    token_type: 'bearer',
                  };
                },
              };
            });
            const gitGetUserResponse = jest.fn();
            gitGetUserResponse.mockImplementation(() => {
              return {
                json: () => {
                  return {
                    name: 'SSO userExist',
                    email: 'invited@tooljet.io',
                  };
                },
              };
            });

            (mockedGot as unknown as jest.Mock).mockImplementationOnce(gitAuthResponse);
            (mockedGot as unknown as jest.Mock).mockImplementationOnce(gitGetUserResponse);

            await request(app.getHttpServer()).post('/api/oauth/sign-in/common/git').send({ token }).expect(401);
          });

          it('Should not login if user workspace status is archived', async () => {
            await createUser(app, {
              firstName: 'SSO',
              lastName: 'userExist',
              email: 'archived@tooljet.io',
              groups: ['end-user'],
              status: 'archived',
            });

            const gitAuthResponse = jest.fn();
            gitAuthResponse.mockImplementation(() => {
              return {
                json: () => {
                  return {
                    access_token: 'some-access-token',
                    scope: 'scope',
                    token_type: 'bearer',
                  };
                },
              };
            });
            const gitGetUserResponse = jest.fn();
            gitGetUserResponse.mockImplementation(() => {
              return {
                json: () => {
                  return {
                    name: 'SSO userExist',
                    email: 'archived@tooljet.io',
                  };
                },
              };
            });

            (mockedGot as unknown as jest.Mock).mockImplementationOnce(gitAuthResponse);
            (mockedGot as unknown as jest.Mock).mockImplementationOnce(gitGetUserResponse);

            await request(app.getHttpServer()).post('/api/oauth/sign-in/common/git').send({ token }).expect(401);
          });
        });
      });
    });

    // ---------------------------------------------------------------------------
    // Instance SSO | super-admin flows
    // ---------------------------------------------------------------------------
    describe('POST /api/oauth/sign-in/:configId | Git instance SSO (super admin)', () => {
      let current_user: User;

      beforeEach(() => {
        jest.spyOn(configService, 'get').mockImplementation((key: string) => {
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

      describe('Multi-Workspace instance level SSO: Setup first user', () => {
        it('First user should be super admin', async () => {
          const gitAuthResponse = jest.fn();
          gitAuthResponse.mockImplementation(() => {
            return {
              json: () => {
                return {
                  access_token: 'some-access-token',
                  scope: 'scope',
                  token_type: 'bearer',
                };
              },
            };
          });
          const gitGetUserResponse = jest.fn();
          gitGetUserResponse.mockImplementation(() => {
            return {
              json: () => {
                return {
                  name: 'SSO UserGit',
                  email: 'ssousergit@tooljet.io',
                };
              },
            };
          });

          (mockedGot as unknown as jest.Mock).mockImplementationOnce(gitAuthResponse);
          (mockedGot as unknown as jest.Mock).mockImplementationOnce(gitGetUserResponse);

          const response = await request(app.getHttpServer()).post('/api/oauth/sign-in/common/git').send({ token });

          expect(response.statusCode).toBe(201);
          // Production returns a full session | first SSO user is a regular user
          // (super admin must be set up via /api/onboarding/setup-super-admin)
          expect(response.body.email).toBe('ssousergit@tooljet.io');
          expect(response.body.super_admin).toBe(false);
        });
        it('Second user should not be super admin', async () => {
          await createUser(app, {
            email: 'anotherUser@tooljet.io',
            userType: 'instance',
          });
          const gitAuthResponse = jest.fn();
          gitAuthResponse.mockImplementation(() => {
            return {
              json: () => {
                return {
                  access_token: 'some-access-token',
                  scope: 'scope',
                  token_type: 'bearer',
                };
              },
            };
          });
          const gitGetUserResponse = jest.fn();
          gitGetUserResponse.mockImplementation(() => {
            return {
              json: () => {
                return {
                  name: 'SSO UserGit',
                  email: 'ssousergit@tooljet.io',
                };
              },
            };
          });

          (mockedGot as unknown as jest.Mock).mockImplementationOnce(gitAuthResponse);
          (mockedGot as unknown as jest.Mock).mockImplementationOnce(gitGetUserResponse);

          const response = await request(app.getHttpServer()).post('/api/oauth/sign-in/common/git').send({ token });

          expect(response.statusCode).toBe(201);
          // Second user gets a session but is not super admin
          expect(response.body.email).toBe('ssousergit@tooljet.io');
          expect(response.body.super_admin).toBe(false);
        });
      });
      describe('Multi-Workspace instance level SSO', () => {
        beforeAll(async () => {
          const { user } = await createUser(app, {
            email: 'superadmin@tooljet.io',
            userType: 'instance',
            ssoConfigs: [
              {
                sso: 'git',
                enabled: true,
                configScope: 'organization',
                configs: { clientId: 'git-client-id', clientSecret: '' },
              },
            ],
          });
          current_user = user;
        });
        describe('sign in via Git OAuth', () => {
          it('Workspace Login - should return 201 when the super admin log in', async () => {
            const gitAuthResponse = jest.fn();
            gitAuthResponse.mockImplementation(() => {
              return {
                json: () => {
                  return {
                    access_token: 'some-access-token',
                    scope: 'scope',
                    token_type: 'bearer',
                  };
                },
              };
            });
            const gitGetUserResponse = jest.fn();
            gitGetUserResponse.mockImplementation(() => {
              return {
                json: () => {
                  return {
                    name: 'SSO UserGit',
                    email: 'superadmin@tooljet.io',
                  };
                },
              };
            });

            (mockedGot as unknown as jest.Mock).mockImplementationOnce(gitAuthResponse);
            (mockedGot as unknown as jest.Mock).mockImplementationOnce(gitGetUserResponse);
            await request(app.getHttpServer()).post('/api/oauth/sign-in/common/git').send({ token }).expect(201);

            const orgCount = await orgUserRepository.count({ where: { userId: current_user.id } });
            expect(orgCount).toBe(1); // Should not create new workspace
          });
          it('Workspace Login - should return 201 when the super admin status is invited in the organization', async () => {
            const adminUser = await userRepository.findOneOrFail({
              where: { email: 'superadmin@tooljet.io' },
            });
            await orgUserRepository.update({ userId: adminUser.id }, { status: 'invited' });

            const gitAuthResponse = jest.fn();
            gitAuthResponse.mockImplementation(() => {
              return {
                json: () => {
                  return {
                    access_token: 'some-access-token',
                    scope: 'scope',
                    token_type: 'bearer',
                  };
                },
              };
            });
            const gitGetUserResponse = jest.fn();
            gitGetUserResponse.mockImplementation(() => {
              return {
                json: () => {
                  return {
                    name: 'SSO UserGit',
                    email: 'superadmin@tooljet.io',
                  };
                },
              };
            });

            (mockedGot as unknown as jest.Mock).mockImplementationOnce(gitAuthResponse);
            (mockedGot as unknown as jest.Mock).mockImplementationOnce(gitGetUserResponse);
            await request(app.getHttpServer()).post('/api/oauth/sign-in/common/git').send({ token }).expect(201);

            const orgCount = await orgUserRepository.count({ where: { userId: current_user.id } });
            expect(orgCount).toBe(2); // Should not create new workspace
          });
          it('Workspace Login - should return 201 when the super admin status is archived in the organization', async () => {
            const adminUser = await userRepository.findOneOrFail({
              where: { email: 'superadmin@tooljet.io' },
            });
            await orgUserRepository.update({ userId: adminUser.id }, { status: 'archived' });

            const gitAuthResponse = jest.fn();
            gitAuthResponse.mockImplementation(() => {
              return {
                json: () => {
                  return {
                    access_token: 'some-access-token',
                    scope: 'scope',
                    token_type: 'bearer',
                  };
                },
              };
            });
            const gitGetUserResponse = jest.fn();
            gitGetUserResponse.mockImplementation(() => {
              return {
                json: () => {
                  return {
                    name: 'SSO UserGit',
                    email: 'superadmin@tooljet.io',
                  };
                },
              };
            });

            (mockedGot as unknown as jest.Mock).mockImplementationOnce(gitAuthResponse);
            (mockedGot as unknown as jest.Mock).mockImplementationOnce(gitGetUserResponse);
            await request(app.getHttpServer()).post('/api/oauth/sign-in/common/git').send({ token }).expect(201);

            const orgCount = await orgUserRepository.count({ where: { userId: current_user.id } });
            expect(orgCount).toBe(2); // Should not create new workspace
          });
          it('Workspace Login - should return 401 when the super admin status is archived', async () => {
            await userRepository.update({ email: 'superadmin@tooljet.io' }, { status: 'archived' });

            const gitAuthResponse = jest.fn();
            gitAuthResponse.mockImplementation(() => {
              return {
                json: () => {
                  return {
                    access_token: 'some-access-token',
                    scope: 'scope',
                    token_type: 'bearer',
                  };
                },
              };
            });
            const gitGetUserResponse = jest.fn();
            gitGetUserResponse.mockImplementation(() => {
              return {
                json: () => {
                  return {
                    name: 'SSO UserGit',
                    email: 'superadmin@tooljet.io',
                  };
                },
              };
            });

            (mockedGot as unknown as jest.Mock).mockImplementationOnce(gitAuthResponse);
            (mockedGot as unknown as jest.Mock).mockImplementationOnce(gitGetUserResponse);
            await request(app.getHttpServer()).post('/api/oauth/sign-in/common/git').send({ token }).expect(406);
          });
        });
      });
    });
  });
});
