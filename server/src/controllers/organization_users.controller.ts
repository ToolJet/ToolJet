import { Controller, Get, Param, Post, Query, Request, UseGuards } from '@nestjs/common';
import { OrganizationUsersService } from 'src/services/organization_users.service';
import { decamelizeKeys } from 'humps';
import { JwtAuthGuard } from '../../src/modules/auth/jwt-auth.guard';

@Controller('organization_users')
export class OrganizationUsersController {
  constructor(
    private organizationUsersService: OrganizationUsersService
  ) { }

  // Endpoint for inviting new organization users
  @UseGuards(JwtAuthGuard)
  @Post()
  async create(@Request() req, @Param() params) {
    const result = await this.organizationUsersService.inviteNewUser(req.user, req.body);
    return decamelizeKeys({ users: result });
  }

  @UseGuards(JwtAuthGuard)
  @Post(':id/archive')
  async archive(@Request() req, @Param() params) {
    const result = await this.organizationUsersService.archive(params.id);
    return decamelizeKeys({ result });
  }

}
