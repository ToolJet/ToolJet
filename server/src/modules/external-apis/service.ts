import { Injectable } from '@nestjs/common';
import { EntityManager } from 'typeorm';
import { CreateUserDto, UpdateGivenWorkspaceDto, UpdateUserDto, WorkspaceDto } from './dto';
import { ListGroupsQueryDto, UpdateGroupExternalDto } from './dto/groups.dto';
import { IExternalApisService } from './Interfaces/IService';

@Injectable()
export class ExternalApisService implements IExternalApisService {
  constructor() { }
  async getAllUsers(lookupKey?: string, groupNamesString?: string, manager?: EntityManager) {
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
  async updateGroup(_workspaceId: string, _groupId: string, _updateGroupDto: UpdateGroupExternalDto): Promise<void> {
    throw new Error('Method not implemented.');
  }
  async listGroups(_workspaceId: string, _query: ListGroupsQueryDto): Promise<any> {
    throw new Error('Method not implemented.');
  }
  async getGroup(_workspaceId: string, _groupId: string): Promise<any> {
    throw new Error('Method not implemented.');
  }
  async deleteGroup(_workspaceId: string, _groupId: string): Promise<void> {
    throw new Error('Method not implemented.');
  }
}
