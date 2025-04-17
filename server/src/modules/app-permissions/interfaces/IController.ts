import { User } from '@entities/user.entity';
import { Response } from 'express';
import { CreatePagePermissionDto } from '../dto';

export interface IAppPermissionsController {
  fetchUsers(user: User, appId: string, response: Response): Promise<any>;

  fetchUserGroups(user: User, appId: string, response: Response): Promise<any>;

  fetchPagePermissions(user: User, appId: string, pageId: string, response: Response): Promise<any>;

  createPagePermissions(
    user: User,
    appId: string,
    pageId: string,
    body: CreatePagePermissionDto,
    response: Response
  ): Promise<any>;

  updatePagePermissions(
    user: User,
    appId: string,
    pageId: string,
    body: CreatePagePermissionDto,
    response: Response
  ): Promise<any>;

  deletePagePermissions(user: User, appId: string, pageId: string, response: Response): Promise<any>;
}
