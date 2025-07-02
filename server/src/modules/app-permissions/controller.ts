import { Body, Controller, Delete, Get, NotFoundException, Param, Post, Put, Res, UseGuards } from '@nestjs/common';
import { Response } from 'express';
import { User } from '@modules/app/decorators/user.decorator';
import { IAppPermissionsController } from './interfaces/IController';
import { FeatureAbilityGuard } from './ability/guard';
import { InitModule } from '@modules/app/decorators/init-module';
import { MODULES } from '@modules/app/constants/modules';
import { InitFeature } from '@modules/app/decorators/init-feature.decorator';
import { FEATURE_KEY } from './constants';
import { JwtAuthGuard } from '@modules/session/guards/jwt-auth.guard';
import { CreatePermissionDto } from './dto';

@InitModule(MODULES.APP_PERMISSIONS)
@UseGuards(JwtAuthGuard, FeatureAbilityGuard)
@Controller('app-permissions')
export class AppPermissionsController implements IAppPermissionsController {
  constructor() {}

  @InitFeature(FEATURE_KEY.FETCH_USERS)
  @Get(':appId/pages/users')
  async fetchUsers(
    @User() user,
    @Param('appId') appId: string,
    @Res({ passthrough: true }) response: Response
  ): Promise<any> {
    throw new NotFoundException();
  }

  @InitFeature(FEATURE_KEY.FETCH_USER_GROUPS)
  @Get(':appId/pages/user-groups')
  async fetchUserGroups(
    @User() user,
    @Param('appId') appId: string,
    @Res({ passthrough: true }) response: Response
  ): Promise<any> {
    throw new NotFoundException();
  }

  @InitFeature(FEATURE_KEY.FETCH_PAGE_PERMISSIONS)
  @Get(':appId/pages/:pageId')
  async fetchPagePermissions(
    @User() user,
    @Param('appId') appId: string,
    @Param('pageId') pageId: string,
    @Res({ passthrough: true }) response: Response
  ): Promise<any> {
    throw new NotFoundException();
  }

  @InitFeature(FEATURE_KEY.CREATE_PAGE_PERMISSIONS)
  @Post(':appId/pages/:pageId')
  async createPagePermissions(
    @User() user,
    @Param('appId') appId: string,
    @Param('pageId') pageId: string,
    @Body() body: CreatePermissionDto,
    @Res({ passthrough: true }) response: Response
  ): Promise<any> {
    throw new NotFoundException();
  }

  @InitFeature(FEATURE_KEY.UPDATE_PAGE_PERMISSIONS)
  @Put(':appId/pages/:pageId')
  async updatePagePermissions(
    @User() user,
    @Param('appId') appId: string,
    @Param('pageId') pageId: string,
    @Body() body: CreatePermissionDto,
    @Res({ passthrough: true }) response: Response
  ): Promise<any> {
    throw new NotFoundException();
  }

  @InitFeature(FEATURE_KEY.DELETE_PAGE_PERMISSIONS)
  @Delete(':appId/pages/:pageId')
  async deletePagePermissions(
    @User() user,
    @Param('appId') appId: string,
    @Param('pageId') pageId: string,
    @Res({ passthrough: true }) response: Response
  ): Promise<any> {
    throw new NotFoundException();
  }

  @InitFeature(FEATURE_KEY.FETCH_QUERY_PERMISSIONS)
  @Get(':appId/queries/:queryId')
  async fetchQueryPermissions(
    @User() user,
    @Param('appId') appId: string,
    @Param('queryId') queryId: string,
    @Res({ passthrough: true }) response: Response
  ): Promise<any> {
    throw new NotFoundException();
  }

  @InitFeature(FEATURE_KEY.CREATE_QUERY_PERMISSIONS)
  @Post(':appId/queries/:queryId')
  async createQueryPermissions(
    @User() user,
    @Param('appId') appId: string,
    @Param('queryId') queryId: string,
    @Body() body: CreatePermissionDto,
    @Res({ passthrough: true }) response: Response
  ): Promise<any> {
    throw new NotFoundException();
  }

  @InitFeature(FEATURE_KEY.UPDATE_QUERY_PERMISSIONS)
  @Put(':appId/queries/:queryId')
  async updateQueryPermissions(
    @User() user,
    @Param('appId') appId: string,
    @Param('queryId') queryId: string,
    @Body() body: CreatePermissionDto,
    @Res({ passthrough: true }) response: Response
  ): Promise<any> {
    throw new NotFoundException();
  }

  @InitFeature(FEATURE_KEY.DELETE_QUERY_PERMISSIONS)
  @Delete(':appId/queries/:queryId')
  async deleteQueryPermissions(
    @User() user,
    @Param('appId') appId: string,
    @Param('queryId') queryId: string,
    @Res({ passthrough: true }) response: Response
  ): Promise<any> {
    throw new NotFoundException();
  }

  @InitFeature(FEATURE_KEY.FETCH_COMPONENT_PERMISSIONS)
  @Get(':appId/components/:componentId')
  async fetchComponentPermissions(
    @User() user,
    @Param('appId') appId: string,
    @Param('componentId') componentId: string,
    @Res({ passthrough: true }) response: Response
  ): Promise<any> {
    throw new NotFoundException();
  }

  @InitFeature(FEATURE_KEY.CREATE_COMPONENT_PERMISSIONS)
  @Post(':appId/components/:componentId')
  async createComponentPermissions(
    @User() user,
    @Param('appId') appId: string,
    @Param('componentId') componentId: string,
    @Body() body: CreatePermissionDto,
    @Res({ passthrough: true }) response: Response
  ): Promise<any> {
    throw new NotFoundException();
  }

  @InitFeature(FEATURE_KEY.UPDATE_COMPONENT_PERMISSIONS)
  @Put(':appId/components/:componentId')
  async updateComponentPermissions(
    @User() user,
    @Param('appId') appId: string,
    @Param('componentId') componentId: string,
    @Body() body: CreatePermissionDto,
    @Res({ passthrough: true }) response: Response
  ): Promise<any> {
    throw new NotFoundException();
  }

  @InitFeature(FEATURE_KEY.DELETE_COMPONENT_PERMISSIONS)
  @Delete(':appId/components/:componentId')
  async deleteComponentPermissions(
    @User() user,
    @Param('appId') appId: string,
    @Param('componentId') componentId: string,
    @Res({ passthrough: true }) response: Response
  ): Promise<any> {
    throw new NotFoundException();
  }
}
