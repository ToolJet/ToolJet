import { Injectable } from '@nestjs/common';
import { IOrganizationThemesService } from './interfaces/IService';
import { OrganizationThemes } from '@entities/organization_themes.entity';
import {
  CreateThemeDto,
  UpdateThemeDefaultDto,
  UpdateThemeNameDto,
  UpdateThemeDefinitionDto,
} from '@modules/organization-themes/dto';
@Injectable()
export class OrganizationThemesService implements IOrganizationThemesService {
  constructor() {}

  async findAll(organizationId: string): Promise<OrganizationThemes[]> {
    throw new Error('Method not implemented');
  }

  async createTheme(createThemeDto: CreateThemeDto, organizationId: string): Promise<OrganizationThemes> {
    throw new Error('Method not implemented');
  }
  async updateThemeDefault(
    id: string,
    updateThemeDefaultDto: UpdateThemeDefaultDto,
    organizationId: string
  ): Promise<void> {
    throw new Error('Method not implemented');
  }
  async updateThemeDefinition(
    id: string,
    updateThemeDefinitionDto: UpdateThemeDefinitionDto,
    organizationId: string
  ): Promise<void> {
    throw new Error('Method not implemented');
  }
  async updateThemeName(id: string, updateThemeNameDto: UpdateThemeNameDto, organizationId: string): Promise<void> {
    throw new Error('Method not implemented');
  }
  async deleteTheme(id: string, organizationId: string): Promise<void> {
    throw new Error('Method not implemented');
  }
}
