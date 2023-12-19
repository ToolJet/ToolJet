import {
  Controller,
  Get,
  UseGuards,
  Post,
  Put,
  Param,
  Body,
  Delete,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { decamelizeKeys } from 'humps';
import { JwtAuthGuard } from '../modules/auth/jwt-auth.guard';
import { User } from 'src/decorators/user.decorator';
import { GitSyncService } from '@services/git_sync.service';
import { OrganizationGitCreateDto, OrganizationGitUpdateDto } from '@dto/organization_git.dto';
import { AppGitPullDto, AppGitPullUpdateDto, AppGitPushDto } from '@dto/app_git.dto';
import { AppsAbilityFactory } from 'src/modules/casl/abilities/apps-ability.factory';
import { InjectRepository } from '@nestjs/typeorm';
import { AppVersion } from 'src/entities/app_version.entity';
import { Repository } from 'typeorm';
import { App } from 'src/entities/app.entity';
import { UsersService } from 'src/services/users.service';
import { LicenseService } from '@services/license.service';
import { LICENSE_FIELD } from 'src/helpers/license.helper';
import { GitSyncGuard } from '@ee/licensing/guards/gitSync.guard';

@Controller('gitsync')
export class GitSyncController {
  constructor(
    private gitSyncServices: GitSyncService,
    private appsAbilityFactory: AppsAbilityFactory,
    private usersService: UsersService,
    private licenseService: LicenseService,

    @InjectRepository(AppVersion)
    private appVersionsRepository: Repository<AppVersion>
  ) {}

  @UseGuards(JwtAuthGuard)
  @Get('app/:id')
  async getAppGitByAppId(@User() user, @Param('id') appId: string) {
    const appGit = await this.gitSyncServices.findAppGitByAppId(appId);
    return decamelizeKeys({ appGit });
  }

  @UseGuards(JwtAuthGuard)
  @Get('workspace/:id')
  async getOrgGitByOrgId(@User() user, @Param('id') organizationId: string) {
    let organizationGit = await this.gitSyncServices.findOrgGitByOrganizationId(organizationId);
    if (!(await this.licenseService.getLicenseTerms(LICENSE_FIELD.GIT_SYNC, organizationId))) {
      organizationGit = await this.gitSyncServices.setFinalizeConfig(user.id, organizationGit.id, {
        isFinalized: organizationGit.isFinalized,
        isEnabled: false,
        gitUrl: organizationGit.gitUrl,
        sshPrivateKey: organizationGit.sshPrivateKey,
        sshPublicKey: organizationGit.sshPublicKey,
      });
    }
    return decamelizeKeys({ organizationGit });
  }

  @UseGuards(JwtAuthGuard, GitSyncGuard)
  @Post('workspace')
  async create(@User() user, @Body() orgGitCreateDto: OrganizationGitCreateDto) {
    if (!(await this.usersService.userCan(user, null, 'ConfigureGitSync', null)))
      throw new ForbiddenException('You do not have permissions to perform this action');
    const orgGit = await this.gitSyncServices.createOrganizationGit(orgGitCreateDto);
    return decamelizeKeys({ orgGit });
  }

  @UseGuards(JwtAuthGuard, GitSyncGuard)
  @Put(':id')
  async update(
    @User() user,
    @Param('id') organizationGitId: string,
    @Body() orgGitUpdateDto: OrganizationGitUpdateDto
  ) {
    if (!(await this.usersService.userCan(user, null, 'ConfigureGitSync', null)))
      throw new ForbiddenException('You do not have permissions to perform this action');
    return this.gitSyncServices.updateOrgGit(organizationGitId, orgGitUpdateDto);
  }

  @UseGuards(JwtAuthGuard, GitSyncGuard)
  @Put('finalize/:id')
  async setFinalizeConfig(
    @User() user,
    @Param('id') organizationGitId: string,
    @Body() organizationGitUpdateDto: OrganizationGitUpdateDto
  ) {
    const userId = user.id;

    if (!(await this.usersService.userCan(user, null, 'ConfigureGitSync', null)))
      throw new ForbiddenException('You do not have permissions to perform this action');
    const data = await this.gitSyncServices.setFinalizeConfig(userId, organizationGitId, organizationGitUpdateDto);
    return decamelizeKeys({ data });
  }

  @UseGuards(JwtAuthGuard, GitSyncGuard)
  @Delete(':id')
  async deleteConfig(@User() user, @Param('id') organizationGitId: string) {
    if (!(await this.usersService.userCan(user, null, 'ConfigureGitSync', null)))
      throw new ForbiddenException('You do not have permissions to perform this action');

    return this.gitSyncServices.deleteConfig(organizationGitId);
  }

  @UseGuards(JwtAuthGuard, GitSyncGuard)
  @Post('gitpush/:appGitId/:versionId')
  async gitSyncApp(@User() user, @Param('appGitId') appGitId: string, @Body() appGitPushBody: AppGitPushDto) {
    const branchName = 'master';
    let versionId = appGitPushBody.versionId;
    let version = await this.appVersionsRepository.findOne({
      where: { id: versionId },
      relations: ['app'],
    });

    versionId = versionId == version.app.editingVersion.id ? versionId : version.app.editingVersion.id;
    version = await this.appVersionsRepository.findOne({
      where: { id: versionId },
      relations: ['app'],
    });
    if (!version) throw new BadRequestException('Wrong version Id');
    const ability = await this.appsAbilityFactory.appsActions(user, version.appId);

    if (!ability.can('editApp', App)) {
      throw new ForbiddenException('You do not have permissions to perform this action');
    }
    await this.gitSyncServices.gitPushApp(user, appGitId, branchName, appGitPushBody, version);
  }
  @UseGuards(JwtAuthGuard, GitSyncGuard)
  @Get('gitpull/app/:appId')
  async getAppMetaFile(@User() user, @Param('appId') appId: string) {
    const ability = await this.appsAbilityFactory.appsActions(user, appId);
    if (!ability.can('editApp', App)) {
      throw new ForbiddenException('You do not have permissions to perform this action');
    }

    const result = await this.gitSyncServices.gitPullAppInfo(user, appId);
    return decamelizeKeys(result);
  }

  @UseGuards(JwtAuthGuard, GitSyncGuard)
  @Get(':workspaceId/app/:versionId')
  async getAppConfig(
    @User() user,
    @Param('workspaceId') organizationId: string,
    @Param('versionId') versionId: string
  ) {
    const version = await this.appVersionsRepository.findOne({
      where: { id: versionId },
      relations: ['app'],
    });
    if (!version) throw new BadRequestException('Wrong version Id');

    const ability = await this.appsAbilityFactory.appsActions(user, version.appId);
    if (!ability.can('editApp', App))
      throw new ForbiddenException('You do not have permissions to perform this action');

    const appGit = await this.gitSyncServices.checkSyncApp(user, version, organizationId);
    return decamelizeKeys({ appGit });
  }

  @UseGuards(JwtAuthGuard, GitSyncGuard)
  @Get('gitpull')
  async getAppsMetaFile(@User() user) {
    const ability = await this.appsAbilityFactory.appsActions(user);
    if (!ability.can('createApp', App))
      throw new ForbiddenException('You do not have permissions to perform this action');
    const result = await this.gitSyncServices.gitPullAppInfo(user);
    return decamelizeKeys(result);
  }

  @UseGuards(JwtAuthGuard, GitSyncGuard)
  @Post('gitpull/app')
  async createGitApp(@User() user, @Body() appData: AppGitPullDto) {
    const ability = await this.appsAbilityFactory.appsActions(user);
    if (!ability.can('createApp', App))
      throw new ForbiddenException('You do not have permissions to perform this action');

    const app = await this.gitSyncServices.createGitApp(user, appData);
    return decamelizeKeys({ app });
  }

  @UseGuards(JwtAuthGuard, GitSyncGuard)
  @Post('gitpull/app/:appId')
  async pullGitAppChanges(@User() user, @Param('appId') appId, @Body() appData: AppGitPullUpdateDto) {
    const ability = await this.appsAbilityFactory.appsActions(user, appId);

    if (!ability.can('editApp', App))
      throw new ForbiddenException('You do not have permissions to perform this action');
    const app = await this.gitSyncServices.pullGitAppChanges(user, appData, appId);
    return decamelizeKeys({ app });
  }
}
