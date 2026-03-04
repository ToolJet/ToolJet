import {
  Controller,
  Param,
  Body,
  Query,
  NotFoundException,
  UseGuards,
  Post,
  Patch,
  Get,
  Delete,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { CreateGroupExternalDto, UpdateGroupExternalDto, ListGroupsQueryDto } from '../dto/groups.dto';
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

  @InitFeature(FEATURE_KEY.UPDATE_GROUP)
  @UseGuards(ExternalApiSecurityGuard)
  @Patch('workspace/:workspaceId/groups/:groupId')
  @HttpCode(HttpStatus.NO_CONTENT)
  async updateGroup(
    @Param('workspaceId') workspaceId: string,
    @Param('groupId') groupId: string,
    @Body() updateGroupDto: UpdateGroupExternalDto
  ): Promise<void> {
    throw new NotFoundException();
  }

  @InitFeature(FEATURE_KEY.LIST_GROUPS)
  @UseGuards(ExternalApiSecurityGuard)
  @Get('workspace/:workspaceId/groups')
  @HttpCode(HttpStatus.OK)
  async listGroups(@Param('workspaceId') workspaceId: string, @Query() query: ListGroupsQueryDto): Promise<any> {
    throw new NotFoundException();
  }

  @InitFeature(FEATURE_KEY.DELETE_GROUP)
  @UseGuards(ExternalApiSecurityGuard)
  @Delete('workspace/:workspaceId/groups/:groupId')
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteGroup(@Param('workspaceId') workspaceId: string, @Param('groupId') groupId: string): Promise<void> {
    throw new NotFoundException();
  }
}
