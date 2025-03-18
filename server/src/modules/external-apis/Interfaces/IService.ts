import { CreateUserDto, UpdateGivenWorkspaceDto, UpdateUserDto, WorkspaceDto } from '../dto/external_apis.dto';
import { EntityManager } from 'typeorm';

export interface IExternalApisService {
  // Gets all users when no ID is passed, filters by ID when ID is passed
  getAllUsers(id?: string, manager?: EntityManager): Promise<any>;

  // Creates a new user with the provided user data
  createUser(userDto: CreateUserDto): Promise<any>;

  // Updates an existing user's information by ID
  updateUser(id: string, updateDto: UpdateUserDto): Promise<void>;

  // Replaces all workspace relations for a specific user
  replaceUserAllWorkspacesRelations(userId: string, workspacesDto: WorkspaceDto[]): Promise<void>;

  // Updates a specific workspace relation for a given userxw
  replaceUserWorkspaceRelations(
    userId: string,
    workspaceId: string,
    workspaceDto: UpdateGivenWorkspaceDto
  ): Promise<void>;

  // Retrieves all workspaces
  getAllWorkspaces(): Promise<any>;
}
