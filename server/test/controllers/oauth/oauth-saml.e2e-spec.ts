import * as request from 'supertest';
import { INestApplication } from '@nestjs/common';
import { clearDB, createUser, createNestAppInstanceWithEnvMock, generateRedirectUrl } from '../../test.helper';
import { Organization } from 'src/entities/organization.entity';
import { getManager, Repository } from 'typeorm';
import { SSOConfigs } from 'src/entities/sso_config.entity';
import { SAML, Profile } from '@node-saml/node-saml';
import { SSOResponse } from 'src/entities/sso_response.entity';

describe('oauth controller', () => {
  let app: INestApplication;
  let ssoConfigsRepository: Repository<SSOConfigs>;
  let orgRepository: Repository<Organization>;
  let ssoResponseId: string;

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

  const defaultUserEmail = 'szoboszlai@lfc.com';

  beforeEach(async () => {
    await clearDB();
    setupSAMLMocks();
  });

  const setupSAMLMocks = (name?: string, email?: string) => {
    const googleVerifyMock = jest.spyOn(SAML.prototype, 'validatePostResponseAsync');
    googleVerifyMock.mockImplementation((container: Record<string, string>) => {
      const profile: Profile = {
        issuer: '',
        sessionIndex: '',
        nameID: '',
        nameIDFormat: '',
        nameQualifier: '',
        spNameQualifier: '',
        ID: '',
        mail: '',
        attributes: {
          name: name || 'dominik szoboszlai',
          email: email || 'szoboszlai@lfc.com',
        },
      };
      return Promise.resolve({ profile, loggedOut: false });
    });
  };

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
      const fs = require('fs');
      const idp = fs.readFileSync('./test/__mocks__/test_idp_metadata.xml').toString('utf8');
      const { organization } = await createUser(app, {
        email: 'anotherUser@tooljet.io',
        ssoConfigs: [
          {
            sso: 'saml',
            enabled: true,
            configs: { name: 'SAML', idpMetadata: idp },
          },
        ],
        enableSignUp: true,
      });
      current_organization = organization;
      /* store fake SAML response */
      const response = await getManager().save(
        getManager().create(SSOResponse, {
          sso: 'saml',
          configId: organization.id,
          response: '<xml></xml>',
        })
      );
      ssoResponseId = response.id;
    });

    describe('Multi-Workspace', () => {
      describe('sign in via Ldap SSO', () => {
        let sso_configs: any;
        beforeEach(() => {
          sso_configs = current_organization.ssoConfigs.find((conf) => conf.sso === 'saml');
        });

        it('should return 401 if saml sign in is disabled', async () => {
          await ssoConfigsRepository.update(sso_configs.id, { enabled: false });
          await request(app.getHttpServer())
            .post('/api/oauth/sign-in/' + sso_configs.id)
            .send({ ssoResponseId })
            .expect(401);
        });

        it('should return 401 when the user does not exist and sign up is disabled', async () => {
          await orgRepository.update(current_organization.id, { enableSignUp: false });
          await request(app.getHttpServer())
            .post('/api/oauth/sign-in/' + sso_configs.id)
            .send({ ssoResponseId })
            .expect(401);
        });

        it('should return 401 when the user does not exist domain mismatch', async () => {
          await orgRepository.update(current_organization.id, { domain: 'tooljet.io,tooljet.com' });

          await request(app.getHttpServer())
            .post('/api/oauth/sign-in/' + sso_configs.id)
            .send({ ssoResponseId })
            .expect(401);
        });

        it('should return redirect url when the user does not exist and domain matches and sign up is enabled', async () => {
          await orgRepository.update(current_organization.id, { domain: 'lfc.com' });

          const response = await request(app.getHttpServer())
            .post('/api/oauth/sign-in/' + sso_configs.id)
            .send({ ssoResponseId });

          expect(response.statusCode).toBe(201);
          const url = await generateRedirectUrl(defaultUserEmail, current_organization);
          const { redirect_url } = response.body;
          expect(redirect_url).toEqual(url);
        });

        it('should return redirect url when the user does not exist and domain includes spance matches and sign up is enabled', async () => {
          await orgRepository.update(current_organization.id, {
            domain: ' ldap.forumsys.com  ,  tooljet.com,  , lfc.com  ,  gmail.com',
          });

          const response = await request(app.getHttpServer())
            .post('/api/oauth/sign-in/' + sso_configs.id)
            .send({ ssoResponseId });

          expect(response.statusCode).toBe(201);

          const url = await generateRedirectUrl(defaultUserEmail, current_organization);

          const { redirect_url } = response.body;
          expect(redirect_url).toEqual(url);
        });

        it('should return redirect url when the user does not exist and sign up is enabled', async () => {
          const response = await request(app.getHttpServer())
            .post('/api/oauth/sign-in/' + sso_configs.id)
            .send({ ssoResponseId });

          expect(response.statusCode).toBe(201);

          const url = await generateRedirectUrl(defaultUserEmail, current_organization);

          const { redirect_url } = response.body;
          expect(redirect_url).toEqual(url);
        });

        it('should return redirect url when the user does not exist and name not available and sign up is enabled', async () => {
          const response = await request(app.getHttpServer())
            .post('/api/oauth/sign-in/' + sso_configs.id)
            .send({ ssoResponseId });

          expect(response.statusCode).toBe(201);

          const url = await generateRedirectUrl(defaultUserEmail, current_organization);

          const { redirect_url } = response.body;
          expect(redirect_url).toEqual(url);
        });

        it('should return redirect url when the user does not exist and email id not available and sign up is enabled', async () => {
          const response = await request(app.getHttpServer())
            .post('/api/oauth/sign-in/' + sso_configs.id)
            .send({ ssoResponseId });

          expect(response.statusCode).toBe(201);

          const url = await generateRedirectUrl(defaultUserEmail, current_organization);

          const { redirect_url } = response.body;
          expect(redirect_url).toEqual(url);
        });

        it('should return login info when the user exist', async () => {
          await createUser(app, {
            firstName: 'Mo',
            lastName: 'Salah',
            email: 'mosalah@lfc.com',
            groups: ['all_users'],
            organization: current_organization,
            status: 'active',
          });

          setupSAMLMocks('Mo Salah', 'mosalah@lfc.com');

          const response = await request(app.getHttpServer())
            .post('/api/oauth/sign-in/' + sso_configs.id)
            .send({ ssoResponseId });

          expect(response.statusCode).toBe(201);
          expect(Object.keys(response.body).sort()).toEqual(authResponseKeys);

          const { email, first_name, current_organization_id } = response.body;

          expect(email).toEqual('mosalah@lfc.com');
          expect(first_name).toEqual('Mo');
          expect(current_organization_id).toBe(current_organization.id);
        });

        it('should return login info when the user exist with invited status', async () => {
          const { orgUser } = await createUser(app, {
            firstName: 'Mo',
            lastName: 'Salah',
            email: 'mosalah@lfc.com',
            groups: ['all_users'],
            organization: current_organization,
            status: 'active',
          });

          setupSAMLMocks('Mo Salah', 'mosalah@lfc.com');

          const response = await request(app.getHttpServer())
            .post('/api/oauth/sign-in/' + sso_configs.id)
            .send({ ssoResponseId });

          expect(response.statusCode).toBe(201);
          expect(Object.keys(response.body).sort()).toEqual(authResponseKeys);

          const { email, last_name, current_organization_id } = response.body;

          expect(email).toEqual('mosalah@lfc.com');
          expect(last_name).toEqual('Salah');
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
