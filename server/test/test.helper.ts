import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { getConnection, Repository } from 'typeorm';
import { OrganizationUser } from 'src/entities/organization_user.entity';
import { Organization } from 'src/entities/organization.entity';
import { User } from 'src/entities/user.entity';
import { App } from 'src/entities/app.entity';
import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { AppModule } from 'src/app.module';
import { AppUser } from 'src/entities/app_user.entity';

export async function createNestAppInstance() {
  let app: INestApplication;

  const moduleRef = await Test.createTestingModule({
    imports: [AppModule],
  })
  .compile();

  app = moduleRef.createNestApplication();
  await app.init();

  return app;
}

export function authHeaderForUser(user: any) {
  const configService = new ConfigService();
  const jwtService = new JwtService({secret: configService.get<string>('SECRET_KEY_BASE')});
  const authPayload = { username: user.id, sub: user.email };
  const authToken = jwtService.sign(authPayload);
  return `Bearer ${authToken}`;
}

export async function clearDB() {
  const entities = getConnection().entityMetadatas;
  for (const entity of entities) {
    const repository = await getConnection().getRepository(entity.name);
    await repository.query(`TRUNCATE ${entity.tableName} RESTART IDENTITY CASCADE;`);
  }
}

export async function createApplication(app, { name, user }: any) {
  let appRepository: Repository<App>;
  appRepository = app.get('AppRepository');
  let appUsersRepository: Repository<AppUser>;
  appUsersRepository = app.get('AppUserRepository');

  user = user || await (await createUser(app, {})).user;

  const newApp = await appRepository.save(appRepository.create({
    name,
    user,
    organizationId: user.organization.id,
    createdAt: new Date(),
    updatedAt: new Date()
  }));

  await appUsersRepository.save(appUsersRepository.create({
    app: newApp, 
    user,
    role: 'admin',
    createdAt: new Date(),
    updatedAt: new Date()
  }));

  return newApp;
}

export async function createUser(app, { firstName, lastName, email, role, organization }: any) {
  let userRepository: Repository<User>;
  let organizationRepository: Repository<Organization>;
  let organizationUsersRepository: Repository<OrganizationUser>;

  userRepository = app.get('UserRepository');
  organizationRepository = app.get('OrganizationRepository');
  organizationUsersRepository = app.get('OrganizationUserRepository');

  organization = organization || await organizationRepository.save(organizationRepository.create({ 
    name: 'test org', 
    createdAt: new Date(), 
    updatedAt: new Date() 
  }));

  const user = await userRepository.save(userRepository.create({ 
    firstName: firstName || 'test', 
    lastName: lastName || 'test', 
    email: email || 'dev@tooljet.io', 
    password: 'password', 
    organization, 
    createdAt: new Date(), 
    updatedAt: new Date(), 
  }));

  const orgUser = await organizationUsersRepository.save(organizationUsersRepository.create({ 
    user: user, 
    organization, 
    role: role || 'admin', 
    createdAt: new Date(), 
    updatedAt: new Date()
  }));

  return { organization, user, orgUser }
}
