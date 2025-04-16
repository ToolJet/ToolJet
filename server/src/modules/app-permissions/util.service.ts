import { User } from '@entities/user.entity';
import { IUtilService } from './interfaces/IUtilService';
import { Injectable } from '@nestjs/common';

@Injectable()
export class AppPermissionsUtilService implements IUtilService {
  constructor() {}

  async getUsersWithViewAccess(appId: string, organizationId: string, endUserIds: string[]): Promise<User[]> {
    throw new Error('Method not implemented.');
  }
}
