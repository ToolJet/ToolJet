import { JwtAuthGuard } from '@modules/session/guards/jwt-auth.guard';
import { InitModule } from '@modules/app/decorators/init-module';
import { FeatureAbilityGuard } from './ability/guard';
import { MODULES } from '@modules/app/constants/modules';
import { IOrganizationThemesController } from './interfaces/IController';
import { OrganizationThemes } from '@entities/organization_themes.entity';
import { Controller, Get, UseGuards, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import {
  CreateThemeDto,
  UpdateThemeDefaultDto,
  UpdateThemeDefinitionDto,
  UpdateThemeNameDto,
} from '@modules/organization-themes/dto';
import { User, UserEntity } from '@modules/app/decorators/user.decorator';
@InitModule(MODULES.ORGANIZATION_THEMES)
@UseGuards(JwtAuthGuard, FeatureAbilityGuard)
@Controller('/themes')
export class OrganizationThemesController implements IOrganizationThemesController {
  constructor() {}

  @Get()
  async findAll(@User() user: UserEntity): Promise<OrganizationThemes[]> {
    throw new Error('Method not implemented.');
  }

  @Post()
  async createTheme(@Body() createThemeDto: CreateThemeDto, @User() user: UserEntity): Promise<OrganizationThemes> {
    throw new Error('Method not implemented.');
  }

  @Patch(':id/default')
  async updateThemeDefault(
    @Param('id') id: string,
    @Body() updateThemeDefaultDto: UpdateThemeDefaultDto,
    @User() user: UserEntity
  ): Promise<void> {
    throw new Error('Method not implemented.');
  }

  @Patch(':id/definition')
  async updateThemeDefinition(
    @Param('id') id: string,
    @Body() updateThemeDefinitionDto: UpdateThemeDefinitionDto,
    @User() user: UserEntity
  ): Promise<void> {
    throw new Error('Method not implemented.');
  }

  @Patch(':id/name')
  async updateThemeName(
    @Param('id') id: string,
    @Body() updateThemeNameDto: UpdateThemeNameDto,
    @User() user: UserEntity
  ): Promise<void> {
    throw new Error('Method not implemented.');
  }

  @Delete(':id')
  async deleteTheme(@Param('id') id: string, @User() user: UserEntity): Promise<void> {
    throw new Error('Method not implemented.');
  }
}
