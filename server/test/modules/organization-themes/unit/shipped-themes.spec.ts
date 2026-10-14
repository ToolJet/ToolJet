import { plainToInstance } from 'class-transformer';
import { validateSync } from 'class-validator';
import { Definition } from '@modules/organization-themes/dto';
import { defaultThemeName } from '@modules/organization-themes/constants';
import { shippedThemes } from '@modules/organization-themes/constants/shipped-themes';
import { OrganizationThemesUtilService } from '@modules/organization-themes/util.service';

/** ToolJet ships a few colour themes beside the basic one, so every workspace can restyle an app in one click. */
describe('shipped themes', () => {
  it('are complete, valid theme definitions with distinct names and colours', () => {
    expect(shippedThemes.length).toBeGreaterThanOrEqual(5);
    const names = shippedThemes.map((theme) => theme.name);
    expect(new Set(names).size).toBe(names.length);
    for (const theme of shippedThemes) {
      expect(theme.name.length).toBeGreaterThanOrEqual(5);
      expect(theme.name).not.toBe(defaultThemeName);
      const errors = validateSync(plainToInstance(Definition, theme.definition));
      expect(errors).toEqual([]);
      expect(theme.definition.brand.colors.primary.light).toMatch(/^#[0-9A-F]{6}$/);
      expect(theme.definition.surface.colors.appBackground.light).toMatch(/^#[0-9A-F]{6}$/);
    }
    const primaries = shippedThemes.map((theme) => theme.definition.brand.colors.primary.light);
    expect(new Set(primaries).size).toBe(primaries.length);
  });

  it('are created for a new workspace beside the basic ToolJet theme', async () => {
    const saved: any[] = [];
    const manager: any = {
      create: (_entity: unknown, values: any) => values,
      save: async (values: any) => {
        const rows = Array.isArray(values) ? values : [values];
        saved.push(...rows);
        return values;
      },
    };
    const service = new OrganizationThemesUtilService({} as any);
    const basic = await service.createDefaultTheme(manager, 'org-1');
    expect(basic).toMatchObject({ name: defaultThemeName, isDefault: true, isBasic: true });
    const shipped = saved.filter((row) => row.name !== defaultThemeName);
    expect(shipped.map((row) => row.name)).toEqual(shippedThemes.map((theme) => theme.name));
    for (const row of shipped) expect(row).toMatchObject({ organizationId: 'org-1', isDefault: false, isBasic: false });
  });
});
