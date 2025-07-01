import { User } from '@entities/user.entity';
import { Response } from 'express';
import { CreatePermissionDto } from '../dto';

export interface IAppPermissionsController {
  fetchUsers(user: User, appId: string, response: Response): Promise<any>;

  fetchUserGroups(user: User, appId: string, response: Response): Promise<any>;

  fetchPagePermissions(user: User, appId: string, pageId: string, response: Response): Promise<any>;

  createPagePermissions(
    user: User,
    appId: string,
    pageId: string,
    body: CreatePermissionDto,
    response: Response
  ): Promise<any>;

  updatePagePermissions(
    user: User,
    appId: string,
    pageId: string,
    body: CreatePermissionDto,
    response: Response
  ): Promise<any>;

  deletePagePermissions(user: User, appId: string, pageId: string, response: Response): Promise<any>;

  fetchQueryPermissions(user: User, appId: string, queryId: string, response: Response): Promise<any>;

  createQueryPermissions(
    user: User,
    appId: string,
    queryId: string,
    body: CreatePermissionDto,
    response: Response
  ): Promise<any>;

  updateQueryPermissions(
    user: User,
    appId: string,
    queryId: string,
    body: CreatePermissionDto,
    response: Response
  ): Promise<any>;

  deleteQueryPermissions(user: User, appId: string, queryId: string, response: Response): Promise<any>;

  fetchComponentPermissions(user: User, appId: string, componentId: string, response: Response): Promise<any>;

  createComponentPermissions(
    user: User,
    appId: string,
    componentId: string,
    body: CreatePermissionDto,
    response: Response
  ): Promise<any>;

  updateComponentPermissions(
    user: User,
    appId: string,
    componentId: string,
    body: CreatePermissionDto,
    response: Response
  ): Promise<any>;

  deleteComponentPermissions(user: User, appId: string, componentId: string, response: Response): Promise<any>;
}
