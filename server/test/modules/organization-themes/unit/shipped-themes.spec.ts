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

  it('are the curated set, each primary dark enough for white button text in both modes', () => {
    // The palette menu approved on 2026-09-12 (Ink, Slate, Navy, Indigo, Emerald, Graphite; ToolJet's own blue covers
    // Blue), plus Rose as the one expressive choice. White text needs 4.5:1 on the primary in light and dark mode.
    expect(shippedThemes.map((theme) => theme.name)).toEqual([
      'ToolJet Ink', 'ToolJet Slate', 'ToolJet Navy', 'ToolJet Indigo', 'ToolJet Emerald', 'ToolJet Graphite', 'ToolJet Rose',
    ]);
    const luminance = (hex: string) => {
      const [r, g, b] = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255)
        .map((c) => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4));
      return 0.2126 * r + 0.7152 * g + 0.0722 * b;
    };
    const onWhite = (hex: string) => 1.05 / (luminance(hex) + 0.05);
    for (const theme of shippedThemes) {
      const { light, dark } = theme.definition.brand.colors.primary;
      expect([theme.name, onWhite(light) >= 4.5]).toEqual([theme.name, true]);
      expect([theme.name, onWhite(dark) >= 4.5]).toEqual([theme.name, true]);
    }
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
