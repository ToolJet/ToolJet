import { OrganizationThemes } from '../../../entities/organization_themes.entity';
import { CreateThemeDto, UpdateThemeDefaultDto, UpdateThemeDefinitionDto, UpdateThemeNameDto } from '../dto';

export interface IOrganizationThemesController {
  findAll(user: { organizationId: string }): Promise<OrganizationThemes[]>;

  createTheme(createThemeDto: CreateThemeDto, user: { organizationId: string }): Promise<OrganizationThemes>;

  updateThemeDefault(
    id: string,
    updateThemeDefaultDto: UpdateThemeDefaultDto,
    user: { organizationId: string }
  ): Promise<void>;

  updateThemeDefinition(
    id: string,
    updateThemeDefinitionDto: UpdateThemeDefinitionDto,
    user: { organizationId: string }
  ): Promise<void>;

  updateThemeName(id: string, updateThemeNameDto: UpdateThemeNameDto, user: { organizationId: string }): Promise<void>;

  deleteTheme(id: string, user: { organizationId: string }): Promise<void>;
}
