import { Body, Controller, Get, Patch, UseGuards, Query, Param } from '@nestjs/common';
import { OrganizationsService } from '@modules/organizations/service';
import { decamelizeKeys } from 'humps';
import { User } from '@modules/app/decorators/user.decorator';
import { JwtAuthGuard } from '@modules/session/guards/jwt-auth.guard';
import { User as UserEntity } from 'src/entities/user.entity';
import { OrganizationUpdateDto, OrganizationStatusUpdateDto } from '@modules/organizations/dto';
import { IOrganizationsController } from '@modules/organizations/interfaces/IController';
import { WORKSPACE_STATUS } from '@modules/users/constants/lifecycle';
import { MODULES } from '@modules/app/constants/modules';
import { InitModule } from '@modules/app/decorators/init-module';
import { FeatureAbilityGuard } from './ability/guard';
import { FEATURE_KEY } from './constants';
import { InitFeature } from '@modules/app/decorators/init-feature.decorator';
import { OrganizationAuthGuard } from '@modules/session/guards/organization-auth.guard';

@Controller('organizations')
@InitModule(MODULES.ORGANIZATIONS)
export class OrganizationsController implements IOrganizationsController {
  constructor(protected organizationsService: OrganizationsService) {}

  @InitFeature(FEATURE_KEY.GET)
  // TODO: Change to jwt auth guard - check why we need OrganizationAuthGuard here
  @UseGuards(OrganizationAuthGuard, FeatureAbilityGuard)
  @Get()
  async get(
    @User() user: UserEntity,
    @Query('status') status: WORKSPACE_STATUS,
    @Query('currentPage') currentPage: number,
    @Query('perPageCount') perPageCount: number,
    @Query('name') name: string
  ) {
    const result = await this.organizationsService.fetchOrganizations(user, status, currentPage, perPageCount, name);
    return decamelizeKeys({ organizations: result.organizations, totalCount: result.totalCount });
  }

  @InitFeature(FEATURE_KEY.UPDATE)
  @UseGuards(JwtAuthGuard, FeatureAbilityGuard)
  @Patch()
  async updateOrganizationNameAndSlug(@Body() organizationUpdateDto: OrganizationUpdateDto, @User() user: UserEntity) {
    await this.organizationsService.updateOrganizationNameAndSlug(user, organizationUpdateDto);
    return;
  }

  @InitFeature(FEATURE_KEY.SET_DEFAULT)
  @UseGuards(JwtAuthGuard, FeatureAbilityGuard)
  @Patch(':id/set-default')
  async setDefaultWorkspace(@Param('id') id: string) {
    await this.organizationsService.setDefaultWorkspace(id);
    return;
  }

  @InitFeature(FEATURE_KEY.WORKSPACE_ARCHIVE)
  @UseGuards(JwtAuthGuard)
  @Patch('/archive/:id')
  async archiveOrganization(
    @Body() organizationUpdateDto: OrganizationStatusUpdateDto,
    @Param('id') organizationId: string,
    @User() user: UserEntity
  ) {
    await this.organizationsService.updateOrganizationStatus(organizationId, organizationUpdateDto, user);
    return;
  }

  @InitFeature(FEATURE_KEY.WORKSPACE_UNARCHIVE)
  @UseGuards(JwtAuthGuard)
  @Patch('/unarchive/:id')
  async unarchiveOrganization(
    @Body() organizationUpdateDto: OrganizationStatusUpdateDto,
    @Param('id') organizationId: string,
    @User() user: UserEntity
  ) {
    await this.organizationsService.updateOrganizationStatus(organizationId, organizationUpdateDto, user);
    return;
  }

  @InitFeature(FEATURE_KEY.CHECK_UNIQUE)
  @UseGuards(JwtAuthGuard, FeatureAbilityGuard)
  @Get('/is-unique')
  async checkWorkspaceUnique(@Query('name') name: string, @Query('slug') slug: string) {
    return this.organizationsService.checkWorkspaceUniqueness(name, slug);
  }

  @InitFeature(FEATURE_KEY.CHECK_UNIQUE_ONBOARDING)
  @Get('/workspace-name/unique')
  @UseGuards(FeatureAbilityGuard)
  async checkUniqueWorkspaceName(@Query('name') name: string) {
    return this.organizationsService.checkWorkspaceNameUniqueness(name);
  }
}
