import { CreateUserDto, UpdateGivenWorkspaceDto, UpdateUserDto, WorkspaceDto } from '../dto';
import { ListGroupsQueryDto, UpdateGroupExternalDto } from '../dto/groups.dto';
import { EntityManager } from 'typeorm';

export interface IExternalApisService {
  // Gets all users when no ID is passed, filters by ID when ID is passed
  getAllUsers(lookupKey?: string, groupNamesString?: string, manager?: EntityManager): Promise<any>;

  // Creates a new user with the provided user data
  createUser(userDto: CreateUserDto): Promise<any>;

  // Updates an existing user's information by ID
  updateUser(id: string, updateDto: UpdateUserDto): Promise<void>;

  // Replaces all workspace relations for a specific user
  replaceUserAllWorkspacesRelations(userId: string, workspacesDto: WorkspaceDto[]): Promise<void>;

  // Updates a specific workspace relation for a given user
  replaceUserWorkspaceRelations(
    userId: string,
    workspaceId: string,
    workspaceDto: UpdateGivenWorkspaceDto
  ): Promise<void>;

  // Retrieves all workspaces
  getAllWorkspaces(): Promise<any>;

  // Updates an existing group (name, permissions, granularPermissions)
  updateGroup(workspaceId: string, groupId: string, updateGroupDto: UpdateGroupExternalDto): Promise<void>;

  // Lists custom groups in a workspace with optional search and pagination
  listGroups(workspaceId: string, query: ListGroupsQueryDto): Promise<any>;

  // Gets details of a custom group by id
  getGroup(workspaceId: string, groupId: string): Promise<any>;

  // Deletes a custom group by id
  deleteGroup(workspaceId: string, groupId: string): Promise<void>;
}
