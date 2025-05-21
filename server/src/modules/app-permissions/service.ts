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

  async fetchAppPermissions(type, pageId) {
    throw new Error('Method not implemented.');
  }

  async createAppPermissions(type, pageId, body) {
    throw new Error('Method not implemented.');
  }

  async updateAppPermissions(type, appId, pageId, body, user) {
    throw new Error('Method not implemented.');
  }

  async deleteAppPermissions(type, pageId) {
    throw new Error('Method not implemented.');
  }
}
