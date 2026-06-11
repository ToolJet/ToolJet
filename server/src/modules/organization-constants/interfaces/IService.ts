import { DeleteResult } from 'typeorm';
import { CreateOrganizationConstantDto, UpdateOrganizationConstantDto } from '@modules/organization-constants/dto';
import { OrganizationConstant } from '@entities/organization_constants.entity';
import { OrganizationConstantType } from '../constants';

export interface IOrganizationConstantsService {
  allEnvironmentConstants(
    organizationId: string,
    decryptSecretValue?: boolean,
    type?: OrganizationConstantType
  ): Promise<OrganizationConstant[]>;
  getConstantsForEnvironment(
    organizationId: string,
    environmentId: string,
    type?: OrganizationConstantType | null
  ): Promise<OrganizationConstant[]>;
  create(
    organizationConstant: CreateOrganizationConstantDto,
    organizationId: string,
    isMultiEnvEnabled?: boolean
  ): Promise<OrganizationConstant | []>;
  update(
    constantId: string,
    organizationId: string,
    params: UpdateOrganizationConstantDto,
    isMultiEnvEnabled?: boolean
  ): Promise<OrganizationConstant>;
  delete(constantId: string, organizationId: string, environmentId?: string): Promise<DeleteResult>;
}
