import { DeleteResult } from 'typeorm';
import { CreateOrganizationConstantDto, UpdateOrganizationConstantDto } from '@modules/organization-constants/dto';
import { OrganizationConstant } from '@entities/organization_constants.entity';
import { OrganizationConstantType } from '../constants';
import {
  BulkDeleteConstantsPayload,
  ConstantDetailPayload,
  ConstantListPayload,
  ConstantWithEnvironmentValues,
} from '../types';
import { ListConstantsQueryDto } from '../dto/v2/list-constants.query.dto';
import { CreateConstantDto } from '../dto/v2/create-constant.dto';
import { UpdateConstantValuesDto } from '../dto/v2/update-constant.dto';

export interface IOrganizationConstantsService {
  listConstants(organizationId: string, query: ListConstantsQueryDto): Promise<ConstantListPayload>;
  getConstant(organizationId: string, constantId: string): Promise<ConstantDetailPayload>;
  createConstant(organizationId: string, userId: string, dto: CreateConstantDto): Promise<ConstantDetailPayload>;
  updateConstantValues(
    organizationId: string,
    constantId: string,
    userId: string,
    dto: UpdateConstantValuesDto
  ): Promise<ConstantDetailPayload>;
  bulkDeleteConstants(organizationId: string, ids: string[]): Promise<BulkDeleteConstantsPayload>;
  allEnvironmentConstants(
    organizationId: string,
    type?: OrganizationConstantType
  ): Promise<ConstantWithEnvironmentValues[]>;
  getConstantsForEnvironment(
    organizationId: string,
    environmentId: string,
    type?: OrganizationConstantType | null
  ): Promise<OrganizationConstant[]>;
  create(
    organizationConstant: CreateOrganizationConstantDto,
    organizationId: string,
    userId: string,
    isMultiEnvEnabled?: boolean
  ): Promise<OrganizationConstant | []>;
  update(
    constantId: string,
    organizationId: string,
    params: UpdateOrganizationConstantDto,
    userId: string,
    isMultiEnvEnabled?: boolean
  ): Promise<OrganizationConstant>;
  delete(constantId: string, organizationId: string, userId: string, environmentId?: string): Promise<DeleteResult>;
}
