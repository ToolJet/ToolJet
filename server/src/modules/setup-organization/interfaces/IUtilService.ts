import { User } from 'src/entities/user.entity';
import { EntityManager } from 'typeorm';
import { Organization } from '@entities/organization.entity';

export interface ISetupOrganizationsUtilService {
  create(name: string, slug: string, user?: User, manager?: EntityManager): Promise<Organization>;
}
