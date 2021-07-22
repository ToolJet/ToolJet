import * as request from 'supertest';
import { Test } from '@nestjs/testing';
import { AppModule } from 'src/app.module';
import { INestApplication } from '@nestjs/common';
import { getConnection, Repository } from 'typeorm';
import { User } from 'src/entities/user.entity';
import { Organization } from 'src/entities/organization.entity';
import { OrganizationUser } from 'src/entities/organization_user.entity';
import { JwtService } from '@nestjs/jwt';
import { authHeaderForUser, clearDB } from '../test.helper';

describe('organization users controller', () => {
  let app: INestApplication;
  let userRepository: Repository<User>;
  let organizationRepository: Repository<Organization>;
  let organizationUsersRepository: Repository<OrganizationUser>;
  let jwtService: JwtService;

  beforeEach(async () => {
    await clearDB();
  });

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    })
    .compile();

    app = moduleRef.createNestApplication();
    await app.init();

    jwtService = moduleRef.get(JwtService);

  });

  it('should allow only authenticated users to archive org users', async () => {
    await request(app.getHttpServer()).post('/organization_users/random-id/archive').expect(401);
  });

  it('should allow only admin users to archive org users', async () => {
    userRepository = app.get('UserRepository');
    organizationRepository = app.get('OrganizationRepository');
    organizationUsersRepository = app.get('OrganizationUserRepository');

    const organization = await organizationRepository.save(organizationRepository.create({ name: 'test org', createdAt: new Date(), updatedAt: new Date() }));
    const admin = await userRepository.save(userRepository.create({ firstName: 'test', lastName: 'test', email: 'admin@tooljet.io', password: 'password', organization, createdAt: new Date(), updatedAt: new Date(), }));
    const adminOrgUser = await organizationUsersRepository.save(organizationUsersRepository.create({ user: admin, organization, role: 'admin', createdAt: new Date(), updatedAt: new Date()}));

    const viewer = await userRepository.save(userRepository.create({ firstName: 'test', lastName: 'test', email: 'viewer@tooljet.io', password: 'password', organization, createdAt: new Date(), updatedAt: new Date(), }));
    const viewerOrgUser = await organizationUsersRepository.save(organizationUsersRepository.create({ user: viewer, organization, role: 'viewer', createdAt: new Date(), updatedAt: new Date()}));

    const developer = await userRepository.save(userRepository.create({ firstName: 'test', lastName: 'test', email: 'developer@tooljet.io', password: 'password', organization, createdAt: new Date(), updatedAt: new Date(), }));
    const developerOrgUser = await organizationUsersRepository.save(organizationUsersRepository.create({ user: developer, organization, role: 'developer', createdAt: new Date(), updatedAt: new Date()}));

    let response = await request(app.getHttpServer())
      .post(`/organization_users/${adminOrgUser.id}/archive`)
      .set('Authorization',authHeaderForUser(viewer))
      .expect(403)

    await adminOrgUser.reload();
    expect(adminOrgUser.status).toBe('invited');

    response = await request(app.getHttpServer())
      .post(`/organization_users/${adminOrgUser.id}/archive`)
      .set('Authorization',authHeaderForUser(developer))
      .expect(403) 

    await adminOrgUser.reload();
    expect(adminOrgUser.status).toBe('invited');  
      
    response = await request(app.getHttpServer())
      .post(`/organization_users/${developerOrgUser.id}/archive`)
      .set('Authorization',authHeaderForUser(admin))
      .expect(201)   

    await developerOrgUser.reload();
    expect(developerOrgUser.status).toBe('archived');  

  });

  it('should allow only admin users to change role of org users', async () => {
    userRepository = app.get('UserRepository');
    organizationRepository = app.get('OrganizationRepository');
    organizationUsersRepository = app.get('OrganizationUserRepository');

    const organization = await organizationRepository.save(organizationRepository.create({ name: 'test org', createdAt: new Date(), updatedAt: new Date() }));
    const admin = await userRepository.save(userRepository.create({ firstName: 'test', lastName: 'test', email: 'admin@tooljet.io', password: 'password', organization, createdAt: new Date(), updatedAt: new Date(), }));
    const adminOrgUser = await organizationUsersRepository.save(organizationUsersRepository.create({ user: admin, organization, role: 'admin', createdAt: new Date(), updatedAt: new Date()}));

    const viewer = await userRepository.save(userRepository.create({ firstName: 'test', lastName: 'test', email: 'viewer@tooljet.io', password: 'password', organization, createdAt: new Date(), updatedAt: new Date(), }));
    const viewerOrgUser = await organizationUsersRepository.save(organizationUsersRepository.create({ user: viewer, organization, role: 'viewer', createdAt: new Date(), updatedAt: new Date()}));

    const developer = await userRepository.save(userRepository.create({ firstName: 'test', lastName: 'test', email: 'developer@tooljet.io', password: 'password', organization, createdAt: new Date(), updatedAt: new Date(), }));
    const developerOrgUser = await organizationUsersRepository.save(organizationUsersRepository.create({ user: developer, organization, role: 'developer', createdAt: new Date(), updatedAt: new Date()}));

    let response = await request(app.getHttpServer())
      .post(`/organization_users/${viewerOrgUser.id}/change_role`)
      .set('Authorization',authHeaderForUser(developer))
      .send({ role: 'developer' })
      .expect(403)

    await viewerOrgUser.reload();
    expect(viewerOrgUser.role).toBe('viewer');

    response = await request(app.getHttpServer())
      .post(`/organization_users/${developerOrgUser.id}/change_role`)
      .set('Authorization',authHeaderForUser(viewer))
      .send({ role: 'viewer' })
      .expect(403)

    await developerOrgUser.reload();
    expect(developerOrgUser.role).toBe('developer');

    response = await request(app.getHttpServer())
      .post(`/organization_users/${developerOrgUser.id}/change_role`)
      .set('Authorization',authHeaderForUser(admin))
      .send({ role: 'viewer' })
      .expect(201)

    await developerOrgUser.reload();
    expect(developerOrgUser.role).toBe('viewer');

  });

  afterAll(async () => {
    await app.close();
  });
});
