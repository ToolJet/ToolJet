import { Injectable } from '@nestjs/common';
import { dbTransactionWrap } from 'src/helpers/database.helper';
import { EntityManager } from 'typeorm';
import { OrganizationThemes } from '@entities/organization_themes.entity';
import { OrganizationThemesRepository } from '@modules/organization-themes/repository';
import { TJDefaultTheme, defaultThemeName, THEME_UPDATE_TYPE } from '@modules/organization-themes/constants';
import { shippedThemes } from '@modules/organization-themes/constants/shipped-themes';
import { IOrganizationThemesUtilService } from './interfaces/IUtilService';
import {
  UpdateThemeDefaultDto,
  UpdateThemeNameDto,
  UpdateThemeDefinitionDto,
  Definition,
} from '@modules/organization-themes/dto';

@Injectable()
export class OrganizationThemesUtilService implements IOrganizationThemesUtilService {
  constructor(protected themesRepository: OrganizationThemesRepository) {}

  #getDefaultDefinition(): Definition {
    return TJDefaultTheme;
  }
  async getTheme(organizationId: string, themeId?: string): Promise<OrganizationThemes> {
    if (!themeId) {
      // No theme ID set -> Return default theme
      return this.themesRepository.findDefaultTheme(organizationId);
    }
    return this.themesRepository.findThemeById(themeId, organizationId);
  }

  async createDefaultTheme(manager: EntityManager, organizationId: string): Promise<OrganizationThemes> {
    return await dbTransactionWrap(async (manager: EntityManager) => {
      //create default theme for new organization
      const newTheme = await manager.create(OrganizationThemes, {
        name: defaultThemeName,
        organizationId: organizationId,
        definition: this.#getDefaultDefinition(),
        isDefault: true,
        isBasic: true,
      });

      const saved = await manager.save(newTheme);
      // The colour themes ToolJet ships (constants/shipped-themes.ts), beside the basic one.
      for (const shipped of shippedThemes) {
        await manager.save(
          manager.create(OrganizationThemes, {
            name: shipped.name,
            organizationId,
            definition: shipped.definition,
            isDefault: false,
            isBasic: false,
          })
        );
      }
      return saved;
    }, manager);
  }

  async updateTheme(
    id: string,
    organizationId: string,
    updateThemeDto: UpdateThemeDefaultDto | UpdateThemeDefinitionDto | UpdateThemeNameDto,
    updateType: THEME_UPDATE_TYPE
  ): Promise<OrganizationThemes | any> {
    throw new Error('Method Not implemented');
  }
}
