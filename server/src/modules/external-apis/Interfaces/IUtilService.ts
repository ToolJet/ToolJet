import { ValidateEditUserGroupAdditionObject } from '../types';
import { UserDetailKeyValueDto } from '../dto';
import { EntityManager } from 'typeorm';

export interface IExternalApiUtilService {
  // generates random password by taking length as the input
  generateRandomPassword(length?: number): string;
  validateEditUserGroupPermissionsAddition(
    functionParam: ValidateEditUserGroupAdditionObject,
    manager?: EntityManager
  ): Promise<void>;
  updateUserMetadata(
    workspaceId: string,
    userId: string,
    userDetails: UserDetailKeyValueDto[],
    manager?: EntityManager
  ): Promise<any>;

  getUserMetadata(workspaceId: string, userId: string, manager?: EntityManager): Promise<any>;
}
