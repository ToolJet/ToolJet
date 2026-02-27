import { Injectable } from '@nestjs/common';
import { IExternalApiUtilService } from './Interfaces/IUtilService';
import { ValidateEditUserGroupAdditionObject } from './types';
import { EntityManager } from 'typeorm';
import { UserDetailKeyValueDto } from './dto';

@Injectable()
export class ExternalApiUtilService implements IExternalApiUtilService {
  generateRandomPassword(length?: number): string {
    throw new Error('Method not implemented.');
  }

  async validateEditUserGroupPermissionsAddition(
    functionParam: ValidateEditUserGroupAdditionObject,
    manager?: EntityManager
  ): Promise<void> {
    throw new Error('Method not implemented.');
  }

  async updateUserMetadata(
    workspaceIdentifier: string,
    userIdentifier: string,
    userDetails: UserDetailKeyValueDto[],
    manager?: EntityManager
  ): Promise<any> {
    throw new Error('Method not implemented.');
  }

  async getUserMetadata(
    workspaceIdentifier: string,
    userIdentifier: string,
    manager?: EntityManager
  ): Promise<any> {
    throw new Error('Method not implemented.');
  }
}
