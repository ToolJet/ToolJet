import { CreateGroupPermissionDto } from '@dto/group_permissions.dto';
import { JwtAuthGuard } from '@module/auth/jwt-auth.guard';
import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { GroupPermissionsServiceV2 } from '@services/group_permissions.service.v2';
import { User } from 'src/decorators/user.decorator';

@Controller({
  path: 'group_permissions',
  version: '2',
})
export class GroupPermissionsControllerV2 {
  constructor(private groupPermissionsService: GroupPermissionsServiceV2) {}

  @UseGuards(JwtAuthGuard)
  @Post()
  async create(@User() user, @Body() createGroupPermissionDto: CreateGroupPermissionDto) {
    return await this.groupPermissionsService.create(user, createGroupPermissionDto);
  }

  @UseGuards(JwtAuthGuard)
  @Get(':id')
  async getGroup(@User() user, @Param('id') id: string) {
    return await this.groupPermissionsService.getGroup(id);
  }

  @UseGuards(JwtAuthGuard)
  @Get()
  async getAllGroups(@User() user, @Param('id') id: string) {
    const { organizationId } = user;
    return await this.groupPermissionsService.getAllGroup(organizationId);
  }
}
