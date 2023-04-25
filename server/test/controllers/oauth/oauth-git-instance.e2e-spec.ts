import * as request from 'supertest';
import { INestApplication } from '@nestjs/common';
import { clearDB, createUser, createNestAppInstanceWithEnvMock, generateRedirectUrl } from '../../test.helper';
import { mocked } from 'ts-jest/utils';
import got from 'got';
import { Organization } from 'src/entities/organization.entity';
import { Repository } from 'typeorm';

jest.mock('got');
const mockedGot = mocked(got);

describe('oauth controller', () => {
  let app: INestApplication;
  let orgRepository: Repository<Organization>;
  let mockConfig;

  const authResponseKeys = ['id', 'email', 'first_name', 'last_name', 'current_organization_id'].sort();

  beforeEach(async () => {
    await clearDB();
  });

  beforeAll(async () => {
    ({ app, mockConfig } = await createNestAppInstanceWithEnvMock());
    orgRepository = app.get('OrganizationRepository');
  });

  afterEach(() => {
    jest.resetAllMocks();
    jest.clearAllMocks();
  });

  describe('SSO Login', () => {
    let current_organization: Organization;
    beforeEach(async () => {
      const { organization } = await createUser(app, {
        email: 'anotherUser@tooljet.io',
      });
      current_organization = organization;
    });

    describe('Multi-Workspace instance level SSO', () => {
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
      describe('sign in via Git OAuth', () => {
        const token = 'some-Token';

        it('Workspace Login - should return 401 when the user does not exist and sign up is disabled', async () => {
          await orgRepository.update(current_organization.id, { enableSignUp: false });
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

          mockedGot.mockImplementationOnce(gitAuthResponse);
          mockedGot.mockImplementationOnce(gitGetUserResponse);
          await request(app.getHttpServer())
            .post('/api/oauth/sign-in/common/git')
            .send({ token, organizationId: current_organization.id })
            .expect(401);
        });

        it('Workspace Login - should return 401 when inherit SSO is disabled', async () => {
          await orgRepository.update(current_organization.id, { inheritSSO: false });
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

          mockedGot.mockImplementationOnce(gitAuthResponse);
          mockedGot.mockImplementationOnce(gitGetUserResponse);
          await request(app.getHttpServer())
            .post('/api/oauth/sign-in/common/git')
            .send({ token, organizationId: current_organization.id })
            .expect(401);
        });

        it('Common Login - should return 401 when the user does not exist and sign up is disabled', async () => {
          jest.spyOn(mockConfig, 'get').mockImplementation((key: string) => {
            switch (key) {
              case 'SSO_GOOGLE_OAUTH2_CLIENT_ID':
                return 'google-client-id';
              case 'SSO_GIT_OAUTH2_CLIENT_ID':
                return 'git-client-id';
              case 'SSO_GIT_OAUTH2_CLIENT_SECRET':
                return 'git-secret';
              case 'SSO_DISABLE_SIGNUPS':
                return 'true';
              default:
                return process.env[key];
            }
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

          mockedGot.mockImplementationOnce(gitAuthResponse);
          mockedGot.mockImplementationOnce(gitGetUserResponse);
          await request(app.getHttpServer()).post('/api/oauth/sign-in/common/git').send({ token }).expect(401);
        });

        it('Common Login - should return 401 when the user does not exist domain mismatch', async () => {
          jest.spyOn(mockConfig, 'get').mockImplementation((key: string) => {
            switch (key) {
              case 'SSO_GOOGLE_OAUTH2_CLIENT_ID':
                return 'google-client-id';
              case 'SSO_GIT_OAUTH2_CLIENT_ID':
                return 'git-client-id';
              case 'SSO_GIT_OAUTH2_CLIENT_SECRET':
                return 'git-secret';
              case 'SSO_ACCEPTED_DOMAINS':
                return 'tooljet.io,tooljet.com';
              default:
                return process.env[key];
            }
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
                  email: 'ssoUserGit@tooljett.io',
                };
              },
            };
          });

          mockedGot.mockImplementationOnce(gitAuthResponse);
          mockedGot.mockImplementationOnce(gitGetUserResponse);

          await request(app.getHttpServer()).post('/api/oauth/sign-in/common/git').send({ token }).expect(401);
        });

        it('Workspace Login - should return 401 when the user does not exist domain mismatch', async () => {
          jest.spyOn(mockConfig, 'get').mockImplementation((key: string) => {
            switch (key) {
              case 'SSO_GOOGLE_OAUTH2_CLIENT_ID':
                return 'google-client-id';
              case 'SSO_GIT_OAUTH2_CLIENT_ID':
                return 'git-client-id';
              case 'SSO_GIT_OAUTH2_CLIENT_SECRET':
                return 'git-secret';
              case 'SSO_ACCEPTED_DOMAINS':
                return 'tooljett.io,tooljet.com';
              default:
                return process.env[key];
            }
          });
          await orgRepository.update(current_organization.id, { domain: 'tooljet.io,tooljet.com' });
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
                  email: 'ssoUserGit@tooljett.io',
                };
              },
            };
          });

          mockedGot.mockImplementationOnce(gitAuthResponse);
          mockedGot.mockImplementationOnce(gitGetUserResponse);

          await request(app.getHttpServer())
            .post('/api/oauth/sign-in/common/git')
            .send({ token, organizationId: current_organization.id })
            .expect(401);
        });

        it('Common Login - should return redirect url when the user does not exist and domain matches and sign up is enabled', async () => {
          jest.spyOn(mockConfig, 'get').mockImplementation((key: string) => {
            switch (key) {
              case 'SSO_GOOGLE_OAUTH2_CLIENT_ID':
                return 'google-client-id';
              case 'SSO_GIT_OAUTH2_CLIENT_ID':
                return 'git-client-id';
              case 'SSO_GIT_OAUTH2_CLIENT_SECRET':
                return 'git-secret';
              case 'SSO_ACCEPTED_DOMAINS':
                return 'tooljet.io,tooljet.com';
              default:
                return process.env[key];
            }
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

          mockedGot.mockImplementationOnce(gitAuthResponse);
          mockedGot.mockImplementationOnce(gitGetUserResponse);

          const response = await request(app.getHttpServer()).post('/api/oauth/sign-in/common/git').send({ token });

          const redirect_url = await generateRedirectUrl('ssousergit@tooljet.io');

          expect(response.statusCode).toBe(201);
          expect(response.body.redirect_url).toEqual(redirect_url);
        });

        it('Workspace Login - should return redirect url when the user does not exist and domain matches and sign up is enabled', async () => {
          await orgRepository.update(current_organization.id, { domain: 'tooljet.io,tooljet.com', enableSignUp: true });

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

          mockedGot.mockImplementationOnce(gitAuthResponse);
          mockedGot.mockImplementationOnce(gitGetUserResponse);

          const response = await request(app.getHttpServer())
            .post('/api/oauth/sign-in/common/git')
            .send({ token, organizationId: current_organization.id });

          const redirect_url = await generateRedirectUrl('ssousergit@tooljet.io', current_organization);

          expect(response.statusCode).toBe(201);
          expect(response.body.redirect_url).toEqual(redirect_url);
        });

        it('Common Login - should return redirect url when the user does not exist and sign up is enabled', async () => {
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

          mockedGot.mockImplementationOnce(gitAuthResponse);
          mockedGot.mockImplementationOnce(gitGetUserResponse);

          const response = await request(app.getHttpServer()).post('/api/oauth/sign-in/common/git').send({ token });

          const redirect_url = await generateRedirectUrl('ssousergit@tooljet.io');

          expect(response.statusCode).toBe(201);
          expect(response.body.redirect_url).toEqual(redirect_url);
        });

        it('Workspace Login - should return redirect url when the user does not exist and domain includes space matches and sign up is enabled', async () => {
          await orgRepository.update(current_organization.id, {
            enableSignUp: true,
            domain: ' tooljet.io  ,  tooljet.com,  ,    ,  gmail.com',
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

          mockedGot.mockImplementationOnce(gitAuthResponse);
          mockedGot.mockImplementationOnce(gitGetUserResponse);

          const response = await request(app.getHttpServer())
            .post('/api/oauth/sign-in/common/git')
            .send({ token, organizationId: current_organization.id });

          const redirect_url = await generateRedirectUrl('ssousergit@tooljet.io', current_organization);

          expect(response.statusCode).toBe(201);
          expect(response.body.redirect_url).toEqual(redirect_url);
        });

        it('Workspace Login - should return redirect url when the user does not exist and sign up is enabled', async () => {
          await orgRepository.update(current_organization.id, {
            enableSignUp: true,
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

          mockedGot.mockImplementationOnce(gitAuthResponse);
          mockedGot.mockImplementationOnce(gitGetUserResponse);

          const response = await request(app.getHttpServer())
            .post('/api/oauth/sign-in/common/git')
            .send({ token, organizationId: current_organization.id });

          const redirect_url = await generateRedirectUrl('ssousergit@tooljet.io', current_organization);

          expect(response.statusCode).toBe(201);
          expect(response.body.redirect_url).toEqual(redirect_url);
        });

        it('Common Login - should return login info when the user exist', async () => {
          await createUser(app, {
            firstName: 'SSO',
            lastName: 'userExist',
            email: 'anotheruser1@tooljet.io',
            groups: ['all_users'],
            organization: current_organization,
            status: 'active',
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
                  email: 'anotheruser1@tooljet.io',
                };
              },
            };
          });

          mockedGot.mockImplementationOnce(gitAuthResponse);
          mockedGot.mockImplementationOnce(gitGetUserResponse);

          const response = await request(app.getHttpServer()).post('/api/oauth/sign-in/common/git').send({ token });

          expect(response.statusCode).toBe(201);
          expect(Object.keys(response.body).sort()).toEqual(authResponseKeys);

          const { email, first_name, last_name, current_organization_id } = response.body;

          expect(email).toEqual('anotheruser1@tooljet.io');
          expect(first_name).toEqual('SSO');
          expect(last_name).toEqual('userExist');
          expect(current_organization_id).toBe(current_organization.id);
        });

        it('Workspace Login - should return login info when the user exist', async () => {
          await createUser(app, {
            firstName: 'SSO',
            lastName: 'userExist',
            email: 'anotheruser1@tooljet.io',
            groups: ['all_users'],
            organization: current_organization,
            status: 'active',
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
                  email: 'anotheruser1@tooljet.io',
                };
              },
            };
          });

          mockedGot.mockImplementationOnce(gitAuthResponse);
          mockedGot.mockImplementationOnce(gitGetUserResponse);

          const response = await request(app.getHttpServer())
            .post('/api/oauth/sign-in/common/git')
            .send({ token, organizationId: current_organization.id });

          expect(response.statusCode).toBe(201);
          expect(Object.keys(response.body).sort()).toEqual(authResponseKeys);

          const { email, first_name, last_name, current_organization_id } = response.body;

          expect(email).toEqual('anotheruser1@tooljet.io');
          expect(first_name).toEqual('SSO');
          expect(last_name).toEqual('userExist');
          expect(current_organization_id).toBe(current_organization.id);
        });

        it('Common Login - should return login info when the user exist but invited status', async () => {
          const { orgUser } = await createUser(app, {
            firstName: 'SSO',
            lastName: 'userExist',
            email: 'anotheruser1@tooljet.io',
            groups: ['all_users'],
            organization: current_organization,
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
                  email: 'anotheruser1@tooljet.io',
                };
              },
            };
          });

          mockedGot.mockImplementationOnce(gitAuthResponse);
          mockedGot.mockImplementationOnce(gitGetUserResponse);

          const response = await request(app.getHttpServer()).post('/api/oauth/sign-in/common/git').send({ token });

          expect(response.statusCode).toBe(201);
          expect(Object.keys(response.body).sort()).toEqual(authResponseKeys);

          const { email, first_name, last_name, current_organization_id } = response.body;

          expect(email).toEqual('anotheruser1@tooljet.io');
          expect(first_name).toEqual('SSO');
          expect(last_name).toEqual('userExist');
          expect(current_organization_id).not.toBe(current_organization.id);
          await orgUser.reload();
          expect(orgUser.status).toEqual('invited');
        });

        it('Workspace Login - should return login info when the user exist but invited status', async () => {
          const { orgUser } = await createUser(app, {
            firstName: 'SSO',
            lastName: 'userExist',
            email: 'anotheruser1@tooljet.io',
            groups: ['all_users'],
            organization: current_organization,
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
                  email: 'anotheruser1@tooljet.io',
                };
              },
            };
          });

          mockedGot.mockImplementationOnce(gitAuthResponse);
          mockedGot.mockImplementationOnce(gitGetUserResponse);

          const response = await request(app.getHttpServer())
            .post('/api/oauth/sign-in/common/git')
            .send({ token, organizationId: current_organization.id });

          expect(response.statusCode).toBe(201);
          expect(Object.keys(response.body).sort()).toEqual(authResponseKeys);

          const { email, first_name, last_name, current_organization_id } = response.body;

          expect(email).toEqual('anotheruser1@tooljet.io');
          expect(first_name).toEqual('SSO');
          expect(last_name).toEqual('userExist');
          expect(current_organization_id).toBe(current_organization.id);
          await orgUser.reload();
          expect(orgUser.status).toEqual('active');
        });
        it('Common login - should return login info when the user exist and hostname exist in configs', async () => {
          jest.spyOn(mockConfig, 'get').mockImplementation((key: string) => {
            switch (key) {
              case 'SSO_GOOGLE_OAUTH2_CLIENT_ID':
                return 'google-client-id';
              case 'SSO_GIT_OAUTH2_CLIENT_ID':
                return 'git-client-id';
              case 'SSO_GIT_OAUTH2_CLIENT_SECRET':
                return 'git-secret';
              case 'SSO_GIT_OAUTH2_HOST':
                return 'https://github.host.com';
              default:
                return process.env[key];
            }
          });

          const { orgUser } = await createUser(app, {
            firstName: 'SSO',
            lastName: 'userExist',
            email: 'anotheruser1@tooljet.io',
            groups: ['all_users'],
            organization: current_organization,
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
                  email: 'anotheruser1@tooljet.io',
                };
              },
            };
          });

          mockedGot.mockImplementationOnce(gitAuthResponse);
          mockedGot.mockImplementationOnce(gitGetUserResponse);

          const response = await request(app.getHttpServer()).post('/api/oauth/sign-in/common/git').send({ token });

          expect(response.statusCode).toBe(201);

          expect(gitAuthResponse).toBeCalledWith('https://github.host.com/login/oauth/access_token', expect.anything());
          expect(gitGetUserResponse).toBeCalledWith('https://github.host.com/api/v3/user', expect.anything());
          expect(Object.keys(response.body).sort()).toEqual(authResponseKeys);

          const { email, first_name, last_name, current_organization_id } = response.body;

          expect(email).toEqual('anotheruser1@tooljet.io');
          expect(first_name).toEqual('SSO');
          expect(last_name).toEqual('userExist');
          expect(current_organization_id).toBe(current_organization.id);
          await orgUser.reload();
          expect(orgUser.status).toEqual('active');
        });
        it('Workspace login - should return login info when the user exist and hostname exist in configs', async () => {
          jest.spyOn(mockConfig, 'get').mockImplementation((key: string) => {
            switch (key) {
              case 'SSO_GOOGLE_OAUTH2_CLIENT_ID':
                return 'google-client-id';
              case 'SSO_GIT_OAUTH2_CLIENT_ID':
                return 'git-client-id';
              case 'SSO_GIT_OAUTH2_CLIENT_SECRET':
                return 'git-secret';
              case 'SSO_GIT_OAUTH2_HOST':
                return 'https://github.host.com';
              default:
                return process.env[key];
            }
          });

          const { orgUser } = await createUser(app, {
            firstName: 'SSO',
            lastName: 'userExist',
            email: 'anotheruser1@tooljet.io',
            groups: ['all_users'],
            organization: current_organization,
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
                  email: 'anotheruser1@tooljet.io',
                };
              },
            };
          });

          mockedGot.mockImplementationOnce(gitAuthResponse);
          mockedGot.mockImplementationOnce(gitGetUserResponse);

          const response = await request(app.getHttpServer())
            .post('/api/oauth/sign-in/common/git')
            .send({ token, organizationId: current_organization.id });

          expect(response.statusCode).toBe(201);

          expect(gitAuthResponse).toBeCalledWith('https://github.host.com/login/oauth/access_token', expect.anything());
          expect(gitGetUserResponse).toBeCalledWith('https://github.host.com/api/v3/user', expect.anything());
          expect(Object.keys(response.body).sort()).toEqual(authResponseKeys);

          const { email, first_name, last_name, current_organization_id } = response.body;

          expect(email).toEqual('anotheruser1@tooljet.io');
          expect(first_name).toEqual('SSO');
          expect(last_name).toEqual('userExist');
          expect(current_organization_id).toBe(current_organization.id);
          await orgUser.reload();
          expect(orgUser.status).toEqual('active');
        });
      });
    });
  });

  afterAll(async () => {
    await app.close();
  });
});
