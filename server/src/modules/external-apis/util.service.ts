import { Injectable } from '@nestjs/common';
import { IExternalApiUtilService } from './Interfaces/IUtilService';
import { ValidateEditUserGroupAdditionObject } from './types';
import { UserDetailKeyValueDto } from './dto';
import { EntityManager } from 'typeorm';

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
    workspaceId: string,
    userId: string,
    userDetails: UserDetailKeyValueDto[],
    manager?: EntityManager
  ): Promise<any> {
    throw new Error('Method not implemented.');
  }

  async getUserMetadata(workspaceId: string, userId: string, manager?: EntityManager): Promise<any> {
    throw new Error('Method not implemented.');
  }
}
