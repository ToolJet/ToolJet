import { Injectable } from '@nestjs/common';
import { IAppPermissionsService } from './interfaces/IService';

@Injectable()
export class AppPermissionsService implements IAppPermissionsService {
  constructor() {}

  async fetchUsers(appId, user) {
    throw new Error('Method not implemented.');
  }

  async fetchUserGroups(appId, user) {
    throw new Error('Method not implemented.');
  }

  async fetchAppPermissions(type, id) {
    throw new Error('Method not implemented.');
  }

  async createAppPermissions(type, id, body) {
    throw new Error('Method not implemented.');
  }

  async updateAppPermissions(type, appId, id, body, user) {
    throw new Error('Method not implemented.');
  }

  async deleteAppPermissions(type, id) {
    throw new Error('Method not implemented.');
  }
}
