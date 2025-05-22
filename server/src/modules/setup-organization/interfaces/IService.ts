import { User } from 'src/entities/user.entity';
import { Organization } from 'src/entities/organization.entity';
import { EntityManager } from 'typeorm';
import { OrganizationInputs } from '../types/organization-inputs';

export interface ISetupOrganizationsService {
  create(organizationInputs: OrganizationInputs, user?: User, manager?: EntityManager): Promise<Organization>;
}
