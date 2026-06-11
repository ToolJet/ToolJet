import { EntityManager, DeleteResult } from 'typeorm';
import { OrgEnvironmentConstantValue } from '@entities/org_environment_constant_values.entity';

export interface IOrganizationConstantsUtilService {
  encryptSecret(workspaceId: string, value: string): Promise<string>;
  decryptSecret(workspaceId: string, value: string): Promise<string>;

  createOrgConstantsInAllEnvironments(
    organizationId: string,
    orgConstantId: string,
    manager?: EntityManager
  ): Promise<void>;

  updateOrgEnvironmentConstant(
    constantValue: string,
    environmentId: string,
    orgConstantId: string,
    manager?: EntityManager
  ): Promise<void>;

  getOrgEnvironmentConstant(
    constantName: string,
    organizationId: string,
    environmentId: string,
    type?: string,
    manager?: EntityManager
  ): Promise<OrgEnvironmentConstantValue>;

  deleteOrgEnvironmentConstant(
    constantId: string,
    organizationId: string,
    environmentId: string
  ): Promise<DeleteResult>;
}
