import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '@modules/session/guards/jwt-auth.guard';
import { User, UserEntity } from '@modules/app/decorators/user.decorator';
import { AppIdParamDto } from './dto/app-id-param.dto';
import { ResourceParamDto } from './dto/resource-param.dto';
import { WorkspaceContextService } from './service';

@Controller('workspace-context')
@UseGuards(JwtAuthGuard)
export class WorkspaceContextController {
  constructor(private readonly workspaceContextService: WorkspaceContextService) {}

  @Get('apps/:appId')
  getApp(@Param() { appId }: AppIdParamDto, @User() user: UserEntity) {
    return this.workspaceContextService.fetchAppById(appId, user.organizationId);
  }

  @Get(':resource')
  get(@Param() { resource }: ResourceParamDto, @User() user: UserEntity) {
    return this.workspaceContextService.fetch(resource, user);
  }
}
