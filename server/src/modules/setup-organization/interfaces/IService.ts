import { User } from 'src/entities/user.entity';
import { Organization } from 'src/entities/organization.entity';
import { EntityManager } from 'typeorm';
import { OrganizationInputs } from '../types/organization-inputs';
import { CreateWorkspaceV2Dto, WorkspaceV2ResponseDto } from '@modules/organizations/dto/v2';

export interface ISetupOrganizationsService {
  create(organizationInputs: OrganizationInputs, user?: User, manager?: EntityManager): Promise<Organization>;

  createWorkspaceV2(dto: CreateWorkspaceV2Dto, user?: User): Promise<WorkspaceV2ResponseDto>;
}
