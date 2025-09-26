import { Injectable } from '@nestjs/common';
import { EntityManager } from 'typeorm';
import { CreateUserDto, UpdateGivenWorkspaceDto, UpdateUserDto, WorkspaceDto } from './dto';
import { IExternalApisService } from './Interfaces/IService';

@Injectable()
export class ExternalApisService implements IExternalApisService {
  constructor() {}
  async getAllUsers(id?: string, manager?: EntityManager) {
    throw new Error('Method not implemented.');
  }
  async createUser(userDto: CreateUserDto) {
    throw new Error('Method not implemented.');
  }
  async updateUser(id: string, updateDto: UpdateUserDto) {
    throw new Error('Method not implemented.');
  }
  async replaceUserAllWorkspacesRelations(userId: string, workspacesDto: WorkspaceDto[]) {
    throw new Error('Method not implemented.');
  }
  async replaceUserWorkspaceRelations(userId: string, workspaceId: string, workspaceDto: UpdateGivenWorkspaceDto) {
    throw new Error('Method not implemented.');
  }
  async getAllWorkspaces() {
    throw new Error('Method not implemented.');
  }
}
