import { Injectable } from '@nestjs/common';
import { dbTransactionWrap } from 'src/helpers/database.helper';
import { EntityManager } from 'typeorm';
import { OrganizationThemes } from '@entities/organization_themes.entity';
import { OrganizationThemesRepository } from '@modules/organization-themes/repository';
import { TJDefaultTheme, defaultThemeName, THEME_UPDATE_TYPE } from '@modules/organization-themes/constants';
import { IOrganizationThemesUtilService } from './interfaces/IUtilService';
import { RequestContext } from '@modules/request-context/service';
import {
  UpdateThemeDefaultDto,
  UpdateThemeNameDto,
  UpdateThemeDefinitionDto,
  Definition,
} from '@modules/organization-themes/dto';

const THEME_MEMO_KEY = 'tj_theme_memo';

@Injectable()
export class OrganizationThemesUtilService implements IOrganizationThemesUtilService {
  constructor(protected themesRepository: OrganizationThemesRepository) {}

  #getDefaultDefinition(): Definition {
    return TJDefaultTheme;
  }
  async getTheme(organizationId: string, themeId?: string): Promise<OrganizationThemes> {
    const memoKey = `${organizationId}:${themeId ?? '_default'}`;
    const ctx = RequestContext.currentContext;
    const memo = ctx?.res?.locals?.[THEME_MEMO_KEY] as Record<string, OrganizationThemes> | undefined;
    if (memo && memoKey in memo) return memo[memoKey];

    const theme = themeId
      ? await this.themesRepository.findThemeById(themeId, organizationId)
      : await this.themesRepository.findDefaultTheme(organizationId);

    if (ctx) {
      const next = { ...(memo ?? {}), [memoKey]: theme };
      RequestContext.setLocals(THEME_MEMO_KEY, next);
    }
    return theme;
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
