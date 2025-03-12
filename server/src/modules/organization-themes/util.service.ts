import { Injectable } from '@nestjs/common';
import { dbTransactionWrap } from 'src/helpers/database.helper';
import { EntityManager } from 'typeorm';
import { OrganizationThemes } from '@entities/organization_themes.entity';
import { OrganizationThemesRepository } from '@modules/organization-themes/repository';
import { TJDefaultTheme, defaultThemeName, THEME_UPDATE_TYPE } from '@modules/organization-themes/constants';
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

      return await manager.save(newTheme);
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
