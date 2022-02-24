import { Controller, Get, Patch, Request, UseGuards } from '@nestjs/common';
import { OrganizationsService } from '@services/organizations.service';
import { decamelizeKeys } from 'humps';
import { JwtAuthGuard } from '../../src/modules/auth/jwt-auth.guard';

@Controller('organizations')
export class OrganizationsController {
  constructor(private organizationsService: OrganizationsService) {}

  @UseGuards(JwtAuthGuard)
  @Get('users')
  async create(@Request() req) {
    const result = await this.organizationsService.fetchUsers(req.user);
    return decamelizeKeys({ users: result });
  }

  @UseGuards(JwtAuthGuard)
  @Get()
  async get(@Request() req) {
    const result = await this.organizationsService.fetchOrganisations(req.user);
    return decamelizeKeys({ organisations: result });
  }

  @UseGuards(JwtAuthGuard)
  @Patch()
  async update(@Request() req) {
    const result = await this.organizationsService.fetchOrganisations(req.user);
    return decamelizeKeys({ organisations: result });
  }
}
