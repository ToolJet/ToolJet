import * as request from 'supertest';
import { INestApplication } from '@nestjs/common';
import { clearDB, createUser, createNestAppInstanceWithEnvMock, generateRedirectUrl } from '../../test.helper';
import { Organization } from 'src/entities/organization.entity';
import { Repository } from 'typeorm';
import { SSOConfigs } from 'src/entities/sso_config.entity';
import * as ldap from 'ldapjs';
import { EventEmitter } from 'events';

describe('oauth controller', () => {
  let app: INestApplication;
  let ssoConfigsRepository: Repository<SSOConfigs>;
  let orgRepository: Repository<Organization>;

  const authResponseKeys = [
    'id',
    'email',
    'first_name',
    'last_name',
    'current_organization_id',
    'admin',
    'app_group_permissions',
    'avatar_id',
    'data_source_group_permissions',
    'group_permissions',
    'organization',
    'organization_id',
    'super_admin',
  ].sort();

  let mockBindFn = jest.fn((_dnString, _password, callbackFn) => callbackFn());
  let mockSearchFn = jest.fn((_dnString, _filterOptions, searchCallbackFn) => searchCallbackFn());
  let mockUnBindFn = jest.fn((callbackFn) => callbackFn());

  const setupLdapMocks = () => {
    mockBindFn = jest.fn((_dnString, _password, callbackFn) => callbackFn());
    mockSearchFn = jest.fn((_dnString, _filterOptions, searchCallbackFn) => searchCallbackFn());
    mockUnBindFn = jest.fn((callbackFn) => callbackFn());

    mockBindFn.mockImplementationOnce((_dnString, _password, callbackFn) => callbackFn()); // No result means success
    mockUnBindFn.mockImplementationOnce((callbackFn) => callbackFn()); // No result means success

    jest.spyOn(ldap, 'createClient').mockReturnValue(<any>{
      bind: mockBindFn,
      search: mockSearchFn,
      unbind: mockUnBindFn,
    });
  };

  const implementSearchFn = (extraAttributes?: [{ type: string; values: string[] }]) => {
    const emitter = new EventEmitter();
    mockSearchFn.mockImplementationOnce((_dnString, _filterOptions, searchCallbackFn) =>
      searchCallbackFn(false, emitter)
    );

    const expectedToFind = {
      dn: 'uid=galieleo,dc=example,dc=com',
      controls: <any[]>[],
      objectClass: ['inetOrgPerson', 'organizationalPerson', 'person', 'top'],
      attributes: [
        { type: 'cn', values: ['Galileo Galilei'] },
        { type: 'displayName', values: ['Galileo'] },
        { type: 'uid', values: ['galieleo'] },
        { type: 'mail', values: ['galieleo@ldap.forumsys.com'] },
        ...(extraAttributes ? extraAttributes : []),
      ],
    };

    const entry = {
      ...expectedToFind,
    };

    setTimeout(() => {
      emitter.emit('searchEntry', entry);
      emitter.emit('end', 'ok');
    }, 200);
  };

  beforeEach(async () => {
    await clearDB();
    setupLdapMocks();
  });

  beforeAll(async () => {
    ({ app } = await createNestAppInstanceWithEnvMock());
    ssoConfigsRepository = app.get('SSOConfigsRepository');
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
        ssoConfigs: [
          {
            sso: 'ldap',
            enabled: true,
            configs: { host: 'localhost', port: '389', ssl: {} },
          },
        ],
        enableSignUp: true,
      });
      current_organization = organization;
    });

    describe('Multi-Workspace', () => {
      describe('sign in via Ldap SSO', () => {
        let sso_configs: any;
        const token = 'some-Token';
        beforeEach(() => {
          sso_configs = current_organization.ssoConfigs.find((conf) => conf.sso === 'ldap');
        });

        it('should return 401 if ldap sign in is disabled', async () => {
          await ssoConfigsRepository.update(sso_configs.id, { enabled: false });
          await request(app.getHttpServer())
            .post('/api/oauth/sign-in/' + sso_configs.id)
            .send({ token })
            .expect(401);
        });

        it('should return 401 when the user does not exist and sign up is disabled', async () => {
          await orgRepository.update(current_organization.id, { enableSignUp: false });

          implementSearchFn();

          await request(app.getHttpServer())
            .post('/api/oauth/sign-in/' + sso_configs.id)
            .send({ token })
            .expect(401);
        });

        it('should return 401 when the user does not exist domain mismatch', async () => {
          await orgRepository.update(current_organization.id, { domain: 'tooljet.io,tooljet.com' });

          implementSearchFn();

          await request(app.getHttpServer())
            .post('/api/oauth/sign-in/' + sso_configs.id)
            .send({ token })
            .expect(401);
        });

        it('should return redirect url when the user does not exist and domain matches and sign up is enabled', async () => {
          await orgRepository.update(current_organization.id, { domain: 'ldap.forumsys.com' });

          implementSearchFn();

          const response = await request(app.getHttpServer())
            .post('/api/oauth/sign-in/' + sso_configs.id)
            .send({ username: 'Galileo Galilei', password: 'password', organizationId: current_organization.id });

          expect(response.statusCode).toBe(201);

          const url = await generateRedirectUrl('galieleo@ldap.forumsys.com', current_organization);

          const { redirect_url } = response.body;
          expect(redirect_url).toEqual(url);
        });

        it('should return redirect url when the user does not exist and domain includes spance matches and sign up is enabled', async () => {
          await orgRepository.update(current_organization.id, {
            domain: ' ldap.forumsys.com  ,  tooljet.com,  ,    ,  gmail.com',
          });

          implementSearchFn();

          const response = await request(app.getHttpServer())
            .post('/api/oauth/sign-in/' + sso_configs.id)
            .send({ username: 'Galileo Galilei', password: 'password', organizationId: current_organization.id });

          expect(response.statusCode).toBe(201);

          const url = await generateRedirectUrl('galieleo@ldap.forumsys.com', current_organization);

          const { redirect_url } = response.body;
          expect(redirect_url).toEqual(url);
        });

        it('should return redirect url when the user does not exist and sign up is enabled', async () => {
          implementSearchFn();

          const response = await request(app.getHttpServer())
            .post('/api/oauth/sign-in/' + sso_configs.id)
            .send({ username: 'Galileo Galilei', password: 'password', organizationId: current_organization.id });

          expect(response.statusCode).toBe(201);

          const url = await generateRedirectUrl('galieleo@ldap.forumsys.com', current_organization);

          const { redirect_url } = response.body;
          expect(redirect_url).toEqual(url);
        });

        it('should return redirect url when the user does not exist and name not available and sign up is enabled', async () => {
          implementSearchFn();

          const response = await request(app.getHttpServer())
            .post('/api/oauth/sign-in/' + sso_configs.id)
            .send({ username: 'Galileo Galilei', password: 'password', organizationId: current_organization.id });

          expect(response.statusCode).toBe(201);

          const url = await generateRedirectUrl('galieleo@ldap.forumsys.com', current_organization);

          const { redirect_url } = response.body;
          expect(redirect_url).toEqual(url);
        });

        it('should return redirect url when the user does not exist and email id not available and sign up is enabled', async () => {
          implementSearchFn();

          const response = await request(app.getHttpServer())
            .post('/api/oauth/sign-in/' + sso_configs.id)
            .send({ username: 'Galileo Galilei', password: 'password', organizationId: current_organization.id });

          expect(response.statusCode).toBe(201);

          const url = await generateRedirectUrl('galieleo@ldap.forumsys.com', current_organization);

          const { redirect_url } = response.body;
          expect(redirect_url).toEqual(url);
        });

        it('should return login info when the user exist', async () => {
          await createUser(app, {
            firstName: 'Galileo',
            lastName: '',
            email: 'galieleo@ldap.forumsys.com',
            groups: ['all_users'],
            organization: current_organization,
            status: 'active',
          });

          implementSearchFn();

          const response = await request(app.getHttpServer())
            .post('/api/oauth/sign-in/' + sso_configs.id)
            .send({ username: 'Galileo Galilei', password: 'password', organizationId: current_organization.id });

          expect(response.statusCode).toBe(201);
          expect(Object.keys(response.body).sort()).toEqual(authResponseKeys);

          const { email, first_name, current_organization_id } = response.body;

          expect(email).toEqual('galieleo@ldap.forumsys.com');
          expect(first_name).toEqual('Galileo');
          expect(current_organization_id).toBe(current_organization.id);
        });

        it('should return login info when the user exist with invited status', async () => {
          const { orgUser } = await createUser(app, {
            firstName: 'Galileo',
            lastName: '',
            email: 'galieleo@ldap.forumsys.com',
            groups: ['all_users'],
            organization: current_organization,
            status: 'invited',
          });

          implementSearchFn();

          const response = await request(app.getHttpServer())
            .post('/api/oauth/sign-in/' + sso_configs.id)
            .send({ token });

          expect(response.statusCode).toBe(201);
          expect(Object.keys(response.body).sort()).toEqual(authResponseKeys);

          const { email, first_name, current_organization_id } = response.body;

          expect(email).toEqual('galieleo@ldap.forumsys.com');
          expect(first_name).toEqual('Galileo');
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
