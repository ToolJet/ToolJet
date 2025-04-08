import { OrganizationThemes } from '../../../entities/organization_themes.entity';
import { CreateThemeDto } from '../dto';

export interface IOrganizationThemesService {
  findAll(organizationId: string): Promise<OrganizationThemes[]>;
  createTheme(createThemeDto: CreateThemeDto, organizationId: string): Promise<OrganizationThemes>;
  updateThemeDefault(id: string, updateThemeDefaultDto: any, organizationId: string): Promise<void>;
  updateThemeDefinition(id: string, updateThemeDefinitionDto: any, organizationId: string): Promise<void>;
  updateThemeName(id: string, updateThemeNameDto: any, organizationId: string): Promise<void>;
  deleteTheme(id: string, organizationId: string): Promise<void>;
}
