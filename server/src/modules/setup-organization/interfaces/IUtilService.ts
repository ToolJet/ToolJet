import { User } from 'src/entities/user.entity';
import { EntityManager } from 'typeorm';
import { Organization } from '@entities/organization.entity';
import { OrganizationInputs } from '../types/organization-inputs';

export interface ISetupOrganizationsUtilService {
  create(organizationInputs: OrganizationInputs, user?: User, manager?: EntityManager): Promise<Organization>;
}
