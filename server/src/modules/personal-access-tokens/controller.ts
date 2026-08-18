import { Controller, Get, Post, Delete, Body, Param } from '@nestjs/common';
import { User } from '@modules/app/decorators/user.decorator';
import { IPersonalAccessTokensController } from './interface/IController';

// CE stub — workspace PATs are EE (the consuming features — custom-component CLI, MCP — are EE);
// real implementation lives in ee/personal-access-tokens/.
@Controller('personal-access-tokens')
export class PersonalAccessTokensController implements IPersonalAccessTokensController {
  @Post()
  async create(@User() user, @Body() body: { name: string; organizationId: string; expiresAt: string }): Promise<any> {
    throw new Error('Method not implemented.');
  }

  @Get()
  async list(@User() user): Promise<any> {
    throw new Error('Method not implemented.');
  }

  @Get('validate')
  async validate(@User() user): Promise<{ email: string; organizationId: string }> {
    throw new Error('Method not implemented.');
  }

  @Delete(':id')
  async delete(@User() user, @Param('id') id: string): Promise<void> {
    throw new Error('Method not implemented.');
  }
}
