import { Injectable } from '@nestjs/common';
import { ExternalApiUtilService } from '@modules/external-apis/util.service';

@Injectable()
export class ScimUsersService {
  constructor(protected externalApiUtilService: ExternalApiUtilService) {}
  async getAllUsers(id?: string) {
    throw new Error('Method not implemented.');
  }

  async createUser(userData: any) {
    throw new Error('Method not implemented.');
    //Add license check
  }

  async updateUser(id: string, userData: any) {
    throw new Error('Method not implemented.');
  }

  async deleteUser(id: string) {
    throw new Error('Method not implemented.');
  }
}
