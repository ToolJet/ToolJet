import { HttpException } from '@nestjs/common';
import { OrganizationThemes } from '@entities/organization_themes.entity';
import { FEATURE_KEY, defaultThemeName } from '@modules/organization-themes/constants';
import { FEATURES } from '@modules/organization-themes/constants/feature';
import { isShippedTheme, shippedThemes } from '@modules/organization-themes/constants/shipped-themes';
import { MODULES } from '@modules/app/constants/modules';
import { LICENSE_FIELD } from '@modules/licensing/constants';
import { THEME_UPDATE_TYPE } from '@modules/organization-themes/constants';
import { OrganizationThemesService } from '@ee/organization-themes/service';

/** The themes ToolJet ships are usable on every plan, like the basic theme, and read-only without the custom themes
 *  license: any workspace can apply them to an app or make one its default, only licensed workspaces can edit, rename
 *  or delete them. Custom themes stay licensed. */
describe('shipped themes on every plan', () => {
  const organizationId = 'org-1';
  const [navy, rose] = shippedThemes.map((theme) => theme.name).filter((name) => /Navy|Rose/.test(name));

  const row = (fields: Partial<OrganizationThemes>): OrganizationThemes => {
    const theme = Object.assign(new OrganizationThemes(), {
      organizationId,
      isDefault: false,
      isBasic: false,
      ...fields,
    });
    theme.markShipped();
    return theme;
  };
  const basic = (fields: Partial<OrganizationThemes> = {}) =>
    row({ id: 'basic', name: defaultThemeName, isBasic: true, ...fields });

  const setup = (licensed: boolean, themes: OrganizationThemes[]) => {
    const licenseTermsService = { getLicenseTerms: jest.fn().mockResolvedValue(licensed) };
    const themesRepository = {
      findByOrganizationId: jest.fn().mockResolvedValue(themes),
      findThemeById: jest.fn(async (id: string) => themes.find((theme) => theme.id === id) ?? null),
      findOneTheme: jest.fn(async (id: string) => themes.find((theme) => theme.id === id) ?? null),
    };
    const utilService = { updateTheme: jest.fn().mockResolvedValue(undefined) };
    const service = new OrganizationThemesService(
      utilService as any,
      themesRepository as any,
      licenseTermsService as any
    );
    return { service, utilService, licenseTermsService };
  };

  describe('identifying a shipped theme', () => {
    it('is a non-basic theme whose name is one of the shipped names', () => {
      for (const { name } of shippedThemes) expect(isShippedTheme({ name, isBasic: false })).toBe(true);
      expect(isShippedTheme({ name: 'Acme brand', isBasic: false })).toBe(false);
      expect(isShippedTheme({ name: defaultThemeName, isBasic: true })).toBe(false);
      expect(isShippedTheme({ name: navy.toLowerCase(), isBasic: false })).toBe(false);
      expect(isShippedTheme(null)).toBe(false);
    });

    it('is marked on every loaded row, so the editor and viewer can tell without a license', () => {
      expect(row({ id: 'n', name: navy }).isShipped).toBe(true);
      expect(row({ id: 'c', name: 'Acme brand' }).isShipped).toBe(false);
      expect(basic().isShipped).toBe(false);
    });
  });

  describe('feature gates', () => {
    const gates = FEATURES[MODULES.ORGANIZATION_THEMES];

    it('keep creating, editing, renaming and deleting themes licensed', () => {
      for (const key of [
        FEATURE_KEY.THEMES_CREATE,
        FEATURE_KEY.THEMES_DELETE,
        FEATURE_KEY.THEMES_UPDATE_DEFINITION,
        FEATURE_KEY.THEMES_UPDATE_NAME,
      ]) {
        expect([key, gates[key].license]).toEqual([key, LICENSE_FIELD.CUSTOM_THEMES]);
      }
    });

    it('let every plan list themes and set the default (the service checks which theme)', () => {
      expect(gates[FEATURE_KEY.THEMES_GET_ALL].license).toBeUndefined();
      expect(gates[FEATURE_KEY.THEMES_UPDATE_DEFAULT].license).toBeUndefined();
    });
  });

  describe('findAll', () => {
    it('returns every theme as stored with the license', async () => {
      const themes = [basic(), row({ id: 'n', name: navy }), row({ id: 'c', name: 'Acme brand', isDefault: true })];
      const { service } = setup(true, themes);
      const result = await service.findAll(organizationId);
      expect(result.map((t) => [t.name, !!t.isDisabled, t.isDefault])).toEqual([
        [defaultThemeName, false, false],
        [navy, false, false],
        ['Acme brand', false, true],
      ]);
    });

    it('without the license, leaves shipped themes usable and disables only custom ones', async () => {
      const themes = [basic({ isDefault: true }), row({ id: 'n', name: navy }), row({ id: 'c', name: 'Acme brand' })];
      const { service } = setup(false, themes);
      const result = await service.findAll(organizationId);
      expect(result.map((t) => [t.name, !!t.isDisabled, t.isDefault, t.isShipped])).toEqual([
        [defaultThemeName, false, true, false],
        [navy, false, false, true],
        ['Acme brand', true, false, false],
      ]);
    });

    it('without the license, keeps a shipped default theme as the default', async () => {
      const themes = [basic(), row({ id: 'r', name: rose, isDefault: true }), row({ id: 'c', name: 'Acme brand' })];
      const { service } = setup(false, themes);
      const result = await service.findAll(organizationId);
      expect(result.filter((t) => t.isDefault).map((t) => t.name)).toEqual([rose]);
    });

    it('without the license, makes the basic theme the default in place of a custom one', async () => {
      const themes = [basic(), row({ id: 'n', name: navy }), row({ id: 'c', name: 'Acme brand', isDefault: true })];
      const { service } = setup(false, themes);
      const result = await service.findAll(organizationId);
      expect(result.filter((t) => t.isDefault).map((t) => t.name)).toEqual([defaultThemeName]);
    });
  });

  describe('setting the default theme', () => {
    const themes = () => [basic(), row({ id: 'n', name: navy }), row({ id: 'c', name: 'Acme brand' })];

    it.each([
      ['a shipped theme', 'n'],
      ['the basic theme', 'basic'],
    ])('works without the license for %s', async (_label, id) => {
      const { service, utilService } = setup(false, themes());
      await service.updateThemeDefault(id, { isDefault: true }, organizationId);
      expect(utilService.updateTheme).toHaveBeenCalledWith(
        id,
        organizationId,
        { isDefault: true },
        THEME_UPDATE_TYPE.DEFAULT
      );
    });

    it('needs the license for a custom theme', async () => {
      const { service, utilService } = setup(false, themes());
      const attempt = service.updateThemeDefault('c', { isDefault: true }, organizationId);
      await expect(attempt).rejects.toBeInstanceOf(HttpException);
      await expect(attempt).rejects.toMatchObject({ status: 451 });
      expect(utilService.updateTheme).not.toHaveBeenCalled();
    });

    it('works for a custom theme with the license', async () => {
      const { service, utilService } = setup(true, themes());
      await service.updateThemeDefault('c', { isDefault: true }, organizationId);
      expect(utilService.updateTheme).toHaveBeenCalled();
    });
  });
});
