import { CreateGranularPermissionDto, UpdateGranularPermissionDto } from '../dto/granular-permissions';
import { GranularPermissions } from '@entities/granular_permissions.entity';
import { User as UserEntity } from '@entities/user.entity';
import { JwtAuthGuard } from '@modules/session/guards/jwt-auth.guard';
import { Injectable, Controller, UseGuards, Get, Post, Param, Body, Put, Delete } from '@nestjs/common';
import { GranularPermissionsService } from '../services/granular-permissions.service';
import { User } from '@modules/app/decorators/user.decorator';
import { GroupExistenceGuard } from '../guards/group-existance.guard';
import { InitModule } from '@modules/app/decorators/init-module';
import { MODULES } from '@modules/app/constants/modules';
import { InitFeature } from '@modules/app/decorators/init-feature.decorator';
import { FEATURE_KEY } from '../constants';
import { FeatureAbilityGuard } from '../ability/guard';
import { IGranularPermissionsController } from '../interfaces/IController';

@Injectable()
@Controller({
  path: 'group-permissions',
  version: '2',
})
@InitModule(MODULES.GROUP_PERMISSIONS)
@UseGuards(JwtAuthGuard, FeatureAbilityGuard)
export class GranularPermissionsController implements IGranularPermissionsController {
  constructor(protected granularPermissionsService: GranularPermissionsService) {}

  @InitFeature(FEATURE_KEY.GET_ADDABLE_APPS)
  @Get('granular-permissions/addable-apps')
  async getAddableApps(@User() user: UserEntity): Promise<{ AddableResourceItem }[]> {
    return await this.granularPermissionsService.getAddableApps(user.organizationId);
  }

  @InitFeature(FEATURE_KEY.GET_ADDABLE_DS)
  @Get('granular-permissions/addable-data-sources')
  async getAddableDs(@User() user: UserEntity): Promise<{ AddableResourceItem }[]> {
    return await this.granularPermissionsService.getAddableDataSources(user.organizationId);
  }

  @InitFeature(FEATURE_KEY.CREATE_GRANULAR_APP_PERMISSIONS)
  @UseGuards(GroupExistenceGuard)
  @Post(':id/granular-permissions/app')
  async createGranularAppPermissions(
    @User() user: UserEntity,
    @Param('id') groupId: string,
    @Body() createGranularPermissionsDto: CreateGranularPermissionDto
  ) {
    createGranularPermissionsDto.groupId = groupId;
    return await this.granularPermissionsService.create(user, createGranularPermissionsDto);
  }

  @InitFeature(FEATURE_KEY.CREATE_GRANULAR_DATA_PERMISSIONS)
  @UseGuards(GroupExistenceGuard)
  @Post(':id/granular-permissions/data-source')
  async createGranularDataPermissions(
    @User() user: UserEntity,
    @Param('id') groupId: string,
    @Body() createGranularPermissionsDto: CreateGranularPermissionDto
  ) {
    createGranularPermissionsDto.groupId = groupId;
    return await this.granularPermissionsService.create(user, createGranularPermissionsDto);
  }

  @InitFeature(FEATURE_KEY.GET_ALL_GRANULAR_PERMISSIONS)
  @UseGuards(GroupExistenceGuard)
  @Get(':id/granular-permissions')
  async getAllGranularPermissions(
    @User() user: UserEntity,
    @Param('id') groupId: string
  ): Promise<GranularPermissions[]> {
    return await this.granularPermissionsService.getAll(groupId, user.organizationId, { filterDataSource: true });
  }

  @InitFeature(FEATURE_KEY.UPDATE_GRANULAR_APP_PERMISSIONS)
  @Put('granular-permissions/app/:id')
  async updateGranularAppPermissions(
    @User() user: UserEntity,
    @Param('id') granularPermissionsId: string,
    @Body() updateGranularPermissionDto: UpdateGranularPermissionDto<any>
  ) {
    await this.granularPermissionsService.update(granularPermissionsId, user, updateGranularPermissionDto);
  }

  @InitFeature(FEATURE_KEY.UPDATE_GRANULAR_DATA_PERMISSIONS)
  @Put('granular-permissions/data-source/:id')
  async updateGranularDataPermissions(
    @User() user: UserEntity,
    @Param('id') granularPermissionsId: string,
    @Body() updateGranularPermissionDto: UpdateGranularPermissionDto<any>
  ) {
    await this.granularPermissionsService.update(granularPermissionsId, user, updateGranularPermissionDto);
  }

  @InitFeature(FEATURE_KEY.DELETE_GRANULAR_APP_PERMISSIONS)
  @Delete('granular-permissions/app/:id')
  async deleteGranularAppPermissions(
    @User() user: UserEntity,
    @Param('id') granularPermissionsId: string
  ): Promise<void> {
    await this.granularPermissionsService.delete(granularPermissionsId, user);
  }

  @InitFeature(FEATURE_KEY.DELETE_GRANULAR_DATA_PERMISSIONS)
  @Delete('granular-permissions/data-source/:id')
  async deleteGranularDataPermissions(
    @User() user: UserEntity,
    @Param('id') granularPermissionsId: string
  ): Promise<void> {
    await this.granularPermissionsService.delete(granularPermissionsId, user);
  }
}
