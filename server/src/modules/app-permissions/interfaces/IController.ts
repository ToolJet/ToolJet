import { User } from '@entities/user.entity';
import { Response } from 'express';

export interface IAppPermissionsController {
  fetchUsers(user: User, appId: string, response: Response): Promise<any>;

  fetchUserGroups(user: User, appId: string, response: Response): Promise<any>;
}
