import { Injectable } from '@nestjs/common';
import { EntityManager } from 'typeorm/entity-manager/EntityManager';
import { User } from '../entities/user.entity';
import { Organization } from '../entities/organization.entity';
import { OrganizationUser } from '../entities/organization_user.entity';

@Injectable()
export class SeedsService {
  constructor(private readonly entityManager: EntityManager) {}

  async perform(): Promise<void> {
    const organization = this.entityManager.create(Organization, {
      name: 'My organization',
    });

    await this.entityManager.save(organization);

    const user = this.entityManager.create(User, {
      firstName: 'The',
      lastName: 'Developer',
      email: 'dev@tooljet.io',
      password: 'password',
      organizationId: organization.id,
    });

    await this.entityManager.save(user);

    const organizationUser = this.entityManager.create(OrganizationUser, {
      organizationId: organization.id,
      userId: user.id,
      role: 'admin',
      status: 'active',
    });

    await this.entityManager.save(organizationUser);
  }
}
