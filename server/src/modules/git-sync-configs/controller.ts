import { Controller, Get, Post, Put, Delete, Param, Body, Query, NotFoundException } from '@nestjs/common';
import { User } from '@modules/app/decorators/user.decorator';
import {
  OrganizationGitCreateDto,
  OrganizationGitStatusUpdateDto,
  OrganizationGitUpdateDto,
} from '@dto/organization_git.dto';
import { User as UserEntity } from 'src/entities/user.entity';
import { InitModule } from '@modules/app/decorators/init-module';
import { MODULES } from '@modules/app/constants/modules';
import { IGitSyncConfigsController } from './Interfaces/IController';

// Reuses the legacy /git-sync path so existing frontends keep working. Only the DB-only
// subset of routes is declared here — strategy endpoints (test-connection, finalize,
// save-configs, env-configs) remain in the legacy GitSync controller.
@Controller('git-sync')
@InitModule(MODULES.GIT_SYNC_CONFIGS)
export class GitSyncConfigsController implements IGitSyncConfigsController {
  constructor() {}

  // Status route is declared before the bare :id GET so the more specific match wins.
  @Get(':id/status')
  async getOrgGitStatusByOrgId(@User() _user: UserEntity, @Param('id') _organizationId: string): Promise<any> {
    throw new NotFoundException();
  }

  @Post()
  async create(
    @User() _user: UserEntity,
    @Body() _orgGitCreateDto: OrganizationGitCreateDto,
    @Query('gitType') _gitType: string
  ): Promise<any> {
    throw new NotFoundException();
  }

  @Put('status/:id')
  async changeStatus(
    @User() _user: UserEntity,
    @Param('id') _organizationGitId: string,
    @Body() _organizationGitStatusUpdateDto: OrganizationGitStatusUpdateDto
  ): Promise<any> {
    throw new NotFoundException();
  }

  // Update + delete + bare GET use the catch-all :id parameter — declare them last so
  // sibling routes like /status/:id above and /test-connection in the legacy controller
  // are matched first by the router.
  @Put(':id')
  async update(
    @User() _user: UserEntity,
    @Param('id') _organizationGitId: string,
    @Body() _orgGitUpdateDto: OrganizationGitUpdateDto,
    @Query('gitType') _gitType: string
  ): Promise<any> {
    throw new NotFoundException();
  }

  @Delete(':id')
  async deleteConfig(
    @User() _user: UserEntity,
    @Param('id') _organizationGitId: string,
    @Query('gitType') _gitType: string
  ): Promise<any> {
    throw new NotFoundException();
  }

  @Get(':id')
  async getOrgGitByOrgId(
    @User() _user: UserEntity,
    @Param('id') _organizationId: string,
    @Query('gitType') _gitType: string
  ): Promise<any> {
    throw new NotFoundException();
  }
}
