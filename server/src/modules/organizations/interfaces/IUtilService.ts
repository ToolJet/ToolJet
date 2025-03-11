import { Organization } from 'src/entities/organization.entity';
import { EntityManager } from 'typeorm';

export interface IOrganizationsUtilService {
  createOrganizationWithDefaultSettings(name: string, slug: string, manager?: EntityManager): Promise<Organization>;
}
