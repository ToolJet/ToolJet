import { MODULES } from '@modules/app/constants/modules';
import { InitModule } from '@modules/app/decorators/init-module';
import { Controller, UseGuards } from '@nestjs/common';
import { FeatureAbilityGuard } from '@modules/scim/ability/guard';
import { ScimService } from '../service';
import { Get, Post, Put, Patch, Delete, Req, Param, Body } from '@nestjs/common';
import { Request } from 'express';

@Controller('scim/v2')
@InitModule(MODULES.SCIM)
// @UseGuards(FeatureAbilityGuard)
export class ScimGroupsController {
  constructor(private readonly scimService: ScimService) {}

  @Get()
  async getGroups(@Req() req: Request) {
    throw new Error('Method not implemented.');
  }

  @Get(':id')
  async getGroup(@Req() req: Request) {
    throw new Error('Method not implemented.');
  }

  @Post('Users')
  async createUser(@Req() req: Request) {
    throw new Error('Method not implemented.');
  }

  @Put('Users/:id')
  async replaceUser(@Param('id') id: string, @Req() req: Request) {
    throw new Error('Method not implemented.');
  }

  @Patch('Users/:id')
  async updateUser(@Param('id') id: string, @Req() req: Request) {
    throw new Error('Method not implemented.');
  }

  @Delete('Users/:id')
  async deleteUser(@Param('id') id: string, @Req() req: Request) {
    throw new Error('Method not implemented.');
  }
}
