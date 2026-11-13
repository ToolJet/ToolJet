import type { ManifestProp } from '@/AppBuilder/types/libraryComponent.types';
import type { PropertyError } from './packPropertyTypes';

// A colour style takes any text, and a pack hands it to CSS (often as a custom property its stylesheet reads). Text the
// browser can't read as a colour ("notacolor", a typo) is dropped there, so whatever it coloured went transparent: an
// Ant Button lost its background and border and its white label vanished on the canvas (QA item 47). A colour style
// (inspector 'color' in the manifest) holding such text now reaches the component unset, so it draws the style's
// default, and the debugger says why. The browser judges what a colour is (CSS.supports), so theme swatches
// (var(--cc-...)), oklch() and color-mix() are kept; where it can't judge, every value is kept.

const canCheck = () => typeof CSS !== 'undefined' && typeof CSS.supports === 'function';

/** The styles with each colour the browser can't read left out (the component then draws its default). */
export const checkedColorStyles = (
  manifestStyles: ManifestProp[] | undefined,
  styles: Record<string, unknown>
): { styles: Record<string, unknown>; errors: PropertyError[] } => {
  const colors = new Map((manifestStyles ?? []).filter((s) => s.inspector === 'color').map((s) => [s.name, s]));
  if (!colors.size || !canCheck()) return { styles, errors: [] };
  const errors: PropertyError[] = [];
  const out: Record<string, unknown> = {};
  for (const [name, value] of Object.entries(styles)) {
    const style = colors.get(name);
    if (style && typeof value === 'string' && value.trim() && !CSS.supports('color', value.trim())) {
      errors.push({
        property: name,
        label: style.label ?? name,
        message: `"${value}" is not a colour; the default colour is used`,
        value,
        effective: style.default,
      });
      continue;
    }
    out[name] = value;
  }
  return { styles: out, errors };
};
