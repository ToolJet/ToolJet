import { User } from 'src/entities/user.entity';
import { Response } from 'express';
import { InviteNewUserDto } from '@modules/organization-users/dto/invite-new-user.dto';
import { UpdateOrgUserDto } from '../dto';

export interface IOrganizationUsersService {
  updateOrgUser(organizationUserId: string, user: User, updateOrgUserDto: UpdateOrgUserDto): Promise<void>;
  archive(id: string, organizationId: string, user?: User): Promise<void>;
  archiveFromAll(userId: string, user: User): Promise<void>;
  unarchiveUser(userId: string, user: User): Promise<void>;
  unarchive(user: User, id: string, organizationId: string): Promise<void>;
  inviteNewUser(currentUser: User, inviteNewUserDto: InviteNewUserDto): Promise<void>;
  bulkUploadUsers(currentUser: User, fileStream: any, res: Response): Promise<void>;
  fetchUsersByValue(organizationId: string, searchInput: string): Promise<any>;
  getUsers(
    user: User,
    query: any
  ): Promise<{
    meta: {
      total_pages: number;
      total_count: number;
      current_page: number;
    };
    users: any[];
  }>;
}
