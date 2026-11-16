import { Controller, Get, Post, Delete, Body, Param, Req, Res, NotImplementedException } from '@nestjs/common';
import { Response } from 'express';
import { User } from '@modules/app/decorators/user.decorator';
import { UserPermissionsDecorator } from '@modules/app/decorators/user-permission.decorator';
import { UserPermissions } from '@modules/ability/types';
import { IPersonalAccessTokensController } from './interface/IController';

// CE stub — workspace PATs are EE (the consuming features — custom-component CLI, MCP — are EE);
// real implementation lives in ee/personal-access-tokens/.
@Controller('personal-access-tokens')
export class PersonalAccessTokensController implements IPersonalAccessTokensController {
  @Post()
  async create(@User() user, @Body() body: { name: string; expiresAt: string }): Promise<any> {
    throw new NotImplementedException();
  }

  @Get()
  async list(@User() user, @UserPermissionsDecorator() userPermissions: UserPermissions): Promise<any> {
    throw new NotImplementedException();
  }

  @Get('validate')
  async validate(@User() user): Promise<{ email: string; organizationId: string }> {
    throw new NotImplementedException();
  }

  @Delete(':id')
  async delete(
    @User() user,
    @Param('id') id: string,
    @UserPermissionsDecorator() userPermissions: UserPermissions
  ): Promise<void> {
    throw new NotImplementedException();
  }

  @Post('session')
  async createSession(@Req() request, @Res({ passthrough: true }) response: Response): Promise<any> {
    throw new NotImplementedException();
  }
}
