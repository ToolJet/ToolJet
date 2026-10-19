// Release audit (19 Oct): a primary Button, Badge and Hero action drew 12 to 14px white labels on the theme's primary,
// and onBrandText keeps white wherever it reaches 3:1, so a mid-tone accent such as #3B82F6 read at 3.7:1 where
// normal-size text needs 4.5:1 (WCAG 1.4.3). Codex's helper check (auditOnBrandNormalTextContrast) asked for an
// adequate pair, not a particular colour. The fix keeps the white label and darkens the fill behind it:
// --sc-primary-strong, the same hue darkened just enough, and the primary itself where white already reads.
import '@/AppBuilder/Widgets/Ui2/__tests__/consoleGuard';
import fs from 'fs';
import path from 'path';
import React from 'react';
import { render } from '@testing-library/react';
import tinycolor from 'tinycolor2';
import { onBrandText, primaryStrong, setOnBrandColors } from '@/AppBuilder/_helpers/onBrandText';
import { Badge, Button } from '@/AppBuilder/Widgets/Ui2/_shared/ui';
import ui2Theme from '@/AppBuilder/Widgets/Ui2/_shared/styles/ui2.tailwind';
import { shippedThemes } from '../../../../../../server/src/modules/organization-themes/constants/shipped-themes';
import { TJDefaultTheme } from '../../../../../../server/src/modules/organization-themes/constants';

const SCSS = fs.readFileSync(path.join(__dirname, '../_shared/styles/shadcn.scss'), 'utf8');
const FAILING = ['#3B82F6', '#3D85C6', '#0D9488', '#059669', '#0284C7'];
const ratio = (a, b) => tinycolor.readability(a, b);
const classes = (el) => el.className.split(/\s+/);

describe('primary labels read at 4.5:1 (normal-size text)', () => {
  // Codex's cases: the label and the fill it is drawn on, whatever colours they are.
  it.each([
    ...FAILING,
    '#2563EB',
    '#C2410C',
    '#B45309',
    '#E11D48',
    '#7C3AED',
    '#F59E0B',
    '#A3E635',
    '#FFFFFF',
    '#171717',
  ])('%s: the label and the strong fill read at 4.5:1 or more', (brand) => {
    const label = onBrandText(brand);
    const fill = primaryStrong(brand);
    expect(label).not.toBeNull();
    expect({ brand, label, fill, meets: ratio(fill, label) >= 4.5 }).toMatchObject({ meets: true });
  });

  it.each([undefined, 'not a colour'])('missing or invalid %s gives no colours', (brand) => {
    expect(onBrandText(brand)).toBeNull();
    expect(primaryStrong(brand)).toBeNull();
  });

  it.each(FAILING)('%s keeps its white label on the same hue darkened just enough', (brand) => {
    const fill = primaryStrong(brand);
    expect(onBrandText(brand)).toBe('#ffffff');
    expect(ratio(fill, '#ffffff')).toBeGreaterThanOrEqual(4.5);
    // Just enough: no deeper than needed (a half-point margin covers hex rounding), and the same hue.
    expect(ratio(fill, '#ffffff')).toBeLessThan(4.7);
    expect(Math.abs(tinycolor(fill).toHsl().h - tinycolor(brand).toHsl().h)).toBeLessThan(2);
  });

  it('leaves accents white already reads on, and light accents with dark labels, as they are', () => {
    ['#4368E3', '#4A6DD9', '#2563EB', '#7C3AED', '#171717'].forEach((brand) =>
      expect([brand, onBrandText(brand), primaryStrong(brand)]).toEqual([brand, '#ffffff', brand])
    );
    ['#F59E0B', '#A3E635', '#2DD4BF', '#FFFFFF'].forEach((brand) =>
      expect([brand, onBrandText(brand), primaryStrong(brand)]).toEqual([brand, '#0a0a0a', brand])
    );
  });

  // The shipped themes were picked to carry white at 4.5:1, so none of them changes.
  const themes = [{ name: 'ToolJet', definition: TJDefaultTheme }, ...shippedThemes];
  it.each(themes.flatMap(({ name, definition }) => ['light', 'dark'].map((mode) => [name, mode, definition])))(
    '%s %s: the strong fill is the primary itself',
    (_name, mode, definition) => {
      const brand = definition.brand.colors.primary[mode];
      expect(primaryStrong(brand)).toBe(brand);
    }
  );
});

describe('the app root carries the strong fill for the theme mode in use', () => {
  // A custom theme whose primaries fail in both modes (useAppData passes the mode's primary).
  const primary = { light: '#3B82F6', dark: '#0D9488' };
  const root = document.documentElement;
  afterEach(() => setOnBrandColors(root, null));

  it.each(['light', 'dark'])('%s mode: white on --cc-primary-brand-strong reads at 4.5:1', (mode) => {
    setOnBrandColors(root, primary[mode]);
    const label = root.style.getPropertyValue('--cc-on-primary-brand');
    const fill = root.style.getPropertyValue('--cc-primary-brand-strong');
    expect(label).toBe('#ffffff');
    expect(tinycolor(fill).toHsl().l).toBeLessThan(tinycolor(primary[mode]).toHsl().l);
    expect(ratio(fill, label)).toBeGreaterThanOrEqual(4.5);
  });

  it('a theme without a primary leaves both to the stylesheet defaults', () => {
    setOnBrandColors(root, '#3B82F6');
    setOnBrandColors(root, undefined);
    expect(root.style.getPropertyValue('--cc-on-primary-brand')).toBe('');
    expect(root.style.getPropertyValue('--cc-primary-brand-strong')).toBe('');
  });
});

describe('primary Button, Badge and Hero action fill with the strong shade', () => {
  it('--sc-primary-strong reads the root value, else the primary; ui2-primary-strong is that token', () => {
    expect(SCSS).toContain('--sc-primary-strong: var(--cc-primary-brand-strong, var(--sc-primary));');
    expect(ui2Theme.colors.ui2.primary.strong({})).toBe('var(--sc-primary-strong)');
    // Text and charts in the primary keep the primary itself.
    expect(ui2Theme.colors.ui2.primary.DEFAULT({})).toBe('var(--sc-primary)');
  });

  it('the default Button fills with it and darkens it on hover (a lighter hover fell under 4.5:1)', () => {
    const { getByRole } = render(<Button>Save</Button>);
    const button = classes(getByRole('button'));
    expect(button).toContain('tw-bg-ui2-primary-strong');
    expect(button).toContain('hover:tw-bg-[color:color-mix(in_srgb,var(--sc-primary-strong)_88%,#000)]');
    expect(button).not.toContain('hover:tw-bg-ui2-primary/90');
  });

  it("an authored background still wins over the default Button's fill", () => {
    const { getByRole } = render(<Button className="tw-bg-[color:var(--lk-bg)]">Save</Button>);
    expect(classes(getByRole('button'))).toContain('tw-bg-[color:var(--lk-bg)]');
    expect(classes(getByRole('button'))).not.toContain('tw-bg-ui2-primary-strong');
  });

  it('the default Badge fills with it', () => {
    const { container } = render(<Badge>New</Badge>);
    expect(classes(container.firstChild)).toContain('tw-bg-ui2-primary-strong');
  });
  // The Hero's primary action is checked rendered in ShadHero.spec ([ShadHero-STY-002]).
});
