import { OrganizationThemes, TJDefaultTheme } from '../types/OrganizationThemes';

export class AppsServiceSep {
  getTheme(organizationId: string, themeId?: string): OrganizationThemes {
    return {
      id: '63277bf2-1849-4374-965c-2e296319d619',
      name: 'TJ default',
      definition: {
        brand: { colors: new TJDefaultTheme() },
      },
      isDefault: true,
      isBasic: true,
      isDisabled: false,
    };
  }
}
