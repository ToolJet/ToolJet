import { themeColorTokens, toV2 } from '@tooljet/widget-definitions';
import { onBrandText, primaryStrong } from './onBrandText';

/**
 * The CSS variables a theme writes on <html> in the given mode, as `{ name: value }`; `null` means remove it, so a
 * previous theme's value does not linger. Colours come from the theme's v2 `colors` (toV2 builds them from the old
 * groups), under the names saved widgets already use (`--cc-primary-brand`, Strong = `--cc-default-border`).
 * @param {object} definition  a theme definition in either shape
 * @param {'light' | 'dark'} mode
 * @returns {Record<string, string | null>}
 */
export const themeVariables = (definition, mode) => {
  const primary = toV2(definition).colors.brand?.primary?.[mode];
  // On solid: text on solid colour fills. The theme's own value, else the readable label colour for the brand.
  const vars = { '--cc-onSolid-text': onBrandText(primary) };

  themeColorTokens(definition).forEach(({ group, token, cssVar, light, dark }) => {
    vars[cssVar] = `${mode === 'dark' ? dark : light}`;
    if (group === 'text' && token === 'placeholder') {
      vars['--cc-default-icon'] = vars[cssVar];
      vars['--cc-default-icon-light'] = `${light}`;
      vars['--cc-default-icon-dark'] = `${dark}`;
      vars['--cc-placeholder-text-light'] = `${light}`;
      vars['--cc-placeholder-text-dark'] = `${dark}`;
    }
  });

  // Not colours, for the component packs: the radius scale, the label colour and fill on the brand, and the font.
  const radius = definition?.border?.radius;
  ['default', 'small', 'large'].forEach((size) => {
    const value = Number(radius?.[size]);
    vars[`--cc-radius-${size}`] = Number.isFinite(value) ? `${value}px` : null;
  });
  vars['--cc-on-primary-brand'] = onBrandText(primary);
  vars['--cc-primary-brand-strong'] = primaryStrong(primary);
  const font = typeof definition?.text?.font === 'string' ? definition.text.font.trim() : '';
  vars['--cc-font-family'] = font ? `'${font.replace(/'/g, '')}', ui-sans-serif, system-ui, sans-serif` : null;
  return vars;
};
