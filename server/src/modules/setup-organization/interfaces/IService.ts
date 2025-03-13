import { User } from 'src/entities/user.entity';
import { Organization } from 'src/entities/organization.entity';
import { EntityManager } from 'typeorm';

export interface ISetupOrganizationsService {
  create(name: string, slug: string, user?: User, manager?: EntityManager): Promise<Organization>;
}
