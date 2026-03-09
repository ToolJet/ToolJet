import { Controller, Param, Body, NotFoundException, UseGuards, Post, HttpCode, HttpStatus } from '@nestjs/common';
import { CreateGroupExternalDto } from '../dto/groups.dto';
import { InitFeature } from '@modules/app/decorators/init-feature.decorator';
import { FEATURE_KEY } from '@modules/external-apis/constants';
import { ExternalApiSecurityGuard } from '@ee/auth/guards/external-api-security.guard';

@Controller('ext')
export class ExternalApisGroupsController {
  constructor() {}

  @InitFeature(FEATURE_KEY.CREATE_GROUP)
  @UseGuards(ExternalApiSecurityGuard)
  @Post('workspace/:workspaceId/groups')
  @HttpCode(HttpStatus.CREATED)
  async createGroup(
    @Param('workspaceId') workspaceId: string,
    @Body() createGroupDto: CreateGroupExternalDto
  ): Promise<void> {
    throw new NotFoundException();
  }
}
