import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { getConnection, Repository } from 'typeorm';
import { OrganizationUser } from 'src/entities/organization_user.entity';
import { Organization } from 'src/entities/organization.entity';
import { User } from 'src/entities/user.entity';

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
