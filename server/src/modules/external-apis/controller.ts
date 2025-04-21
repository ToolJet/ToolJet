import { Controller, Get, Param, UseGuards, Body, Patch, Post, Put, NotFoundException } from '@nestjs/common';
import { ExternalApiSecurityGuard } from './guards/external-api-security.guard';
import { UpdateUserDto, WorkspaceDto, UpdateGivenWorkspaceDto, CreateUserDto } from './dto';
import { IExternalApisController } from './Interfaces/IController';
import { EditUserRoleDto } from '@modules/roles/dto';

@Controller('ext')
export class ExternalApisController implements IExternalApisController {
  constructor() {}

  @UseGuards(ExternalApiSecurityGuard)
  @Get('users')
  async getAllUsers() {
    throw new NotFoundException();
  }
  @UseGuards(ExternalApiSecurityGuard)
  @Get('user/:id')
  async getUser(@Param('id') id: string) {
    throw new NotFoundException();
  }
  @UseGuards(ExternalApiSecurityGuard)
  @Post('users')
  async createUser(@Body() createUser: CreateUserDto) {
    throw new NotFoundException();
  }
  @UseGuards(ExternalApiSecurityGuard)
  @Patch('user/:id')
  async updateUser(@Param('id') id: string, @Body() updateUserDto: UpdateUserDto) {
    throw new NotFoundException();
  }
  @UseGuards(ExternalApiSecurityGuard)
  @Put('user/:id/workspaces')
  async replaceUserWorkspaces(@Param('id') id: string, @Body() workspaces: WorkspaceDto[]) {
    throw new NotFoundException();
  }
  @UseGuards(ExternalApiSecurityGuard)
  @Patch('user/:id/workspace/:workspaceId')
  async updateUserWorkspace(
    @Param('id') id: string,
    @Param('workspaceId') workspaceId: string,
    @Body() workspace: UpdateGivenWorkspaceDto
  ) {
    throw new NotFoundException();
  }
  @UseGuards(ExternalApiSecurityGuard)
  @Get('workspaces')
  async getAllWorkspaces() {
    throw new NotFoundException();
  }

  @UseGuards(ExternalApiSecurityGuard)
  @Put('update-user-role/workspace/:workspaceId')
  async updateUserRole(@Param('workspaceId') workspaceId: string, @Body() editRoleDto: EditUserRoleDto) {
    throw new NotFoundException();
  }
}
