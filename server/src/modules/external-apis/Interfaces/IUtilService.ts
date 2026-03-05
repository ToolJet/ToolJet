import { ValidateEditUserGroupAdditionObject } from '../types';
import { EntityManager } from 'typeorm';
import { UserDetailKeyValueDto } from '../dto';

export interface IExternalApiUtilService {
  // generates random password by taking length as the input
  generateRandomPassword(length?: number): string;
  validateEditUserGroupPermissionsAddition(
    functionParam: ValidateEditUserGroupAdditionObject,
    manager?: EntityManager
  ): Promise<void>;

  updateUserMetadata(
    workspaceIdentifier: string,
    userIdentifier: string,
    userDetails: UserDetailKeyValueDto[],
    manager?: EntityManager
  ): Promise<any>;

  getUserMetadata(
    workspaceIdentifier: string,
    userIdentifier: string,
    manager?: EntityManager
  ): Promise<any>;
}
