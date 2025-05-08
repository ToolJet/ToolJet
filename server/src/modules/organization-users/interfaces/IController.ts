import { Response } from 'express';
import { User } from 'src/entities/user.entity';
import { InviteNewUserDto } from '@modules/organization-users/dto/invite-new-user.dto';
import { UpdateOrgUserDto } from '../dto';

export interface IOrganizationUsersController {
  getUserSuggestions(user: User, searchInput: string): Promise<any>;
  create(user: User, inviteNewUserDto: InviteNewUserDto): Promise<void>;
  bulkUploadUsers(user: User, file: any, res: Response): Promise<void>;
  archive(user: User, id: string, body: any): Promise<void>;
  archiveAll(user: User, userId: string): Promise<void>;
  unarchiveAll(user: User, userId: string): Promise<void>;
  updateUser(id: string, updateUserDto: UpdateOrgUserDto, user: User): Promise<void>;
  unarchive(user: User, id: string, body: any): Promise<void>;
  getUsers(user: User, query: any): Promise<any>;
}
