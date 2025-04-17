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

  async fetchPagePermissions(pageId) {
    throw new Error('Method not implemented.');
  }

  async createPagePermissions(pageId, body) {
    throw new Error('Method not implemented.');
  }

  async updatePagePermissions(appId, pageId, body, user) {
    throw new Error('Method not implemented.');
  }

  async deletePagePermissions(pageId) {
    throw new Error('Method not implemented.');
  }
}
