import { EntityManager } from 'typeorm';
import { OrganizationThemes } from '../../../entities/organization_themes.entity';
import { UpdateThemeDefaultDto, UpdateThemeNameDto, UpdateThemeDefinitionDto } from '../dto';
import { THEME_UPDATE_TYPE } from '../constants';
export interface IOrganizationThemesUtilService {
  getTheme(organizationId: string, themeId?: string): Promise<OrganizationThemes>;
  createDefaultTheme(manager: EntityManager, organizationId: string): Promise<OrganizationThemes>;
  updateTheme(
    id: string,
    organizationId: string,
    updateThemeDto: UpdateThemeDefaultDto | UpdateThemeDefinitionDto | UpdateThemeNameDto,
    updateType: THEME_UPDATE_TYPE
  ): Promise<OrganizationThemes>;
}
