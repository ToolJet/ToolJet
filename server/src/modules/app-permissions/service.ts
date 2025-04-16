import { Injectable } from '@nestjs/common';
import { IAppPermissionsService } from './interfaces/IService';

@Injectable()
export class AppPermissionsService implements IAppPermissionsService {
  constructor() {}

  async fetchUsers(appId, user) {
    throw new Error('Method not implemented.');
  }
}
