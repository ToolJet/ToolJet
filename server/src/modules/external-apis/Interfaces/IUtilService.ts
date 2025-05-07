import { ValidateEditUserGroupAdditionObject } from '../types';
import { EntityManager } from 'typeorm';
export interface IExternalApiUtilService {
  // generates random password by taking length as the input
  generateRandomPassword(length?: number): string;
  validateEditUserGroupPermissionsAddition(
    functionParam: ValidateEditUserGroupAdditionObject,
    manager?: EntityManager
  ): Promise<void>;
}
